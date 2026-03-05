import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  computeObjectiveQualityScore,
  inferSegmentAndPlaybook,
  isNegativeOutcome,
} from "@/lib/crm/acqIntelligence";

export const runtime = "nodejs";

const ALLOWED_EVENT_TYPES = new Set([
  "message_sent",
  "message_failed",
  "reply_received",
  "call_booked",
  "pilot_invited",
  "pilot_accepted",
  "pilot_started",
  "pilot_completed",
  "deal_won",
  "deal_lost",
  "unsubscribed",
  "no_interest",
  "follow_up_due",
]);

function mapEventToAcq(eventType: string) {
  switch (eventType) {
    case "reply_received":
      return { action_type: "reply_received", outcome: "positive" } as const;
    case "call_booked":
      return { action_type: "call_booked", outcome: "positive" } as const;
    case "pilot_invited":
      return { action_type: "pilot_invited", outcome: "pending" } as const;
    case "pilot_started":
      return { action_type: "pilot_started", outcome: "positive" } as const;
    case "pilot_completed":
    case "deal_won":
      return { action_type: "pilot_won", outcome: "positive" } as const;
    case "deal_lost":
    case "no_interest":
      return { action_type: "pilot_lost", outcome: "negative" } as const;
    case "unsubscribed":
      return { action_type: "opt_out", outcome: "negative" } as const;
    case "message_failed":
      return { action_type: "bounce", outcome: "negative" } as const;
    case "follow_up_due":
      return { action_type: "followup_planned", outcome: "pending" } as const;
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const prospectId = String(body?.prospect_id || "").trim();
  const eventType = String(body?.event_type || "").trim();
  const messageIdRaw = String(body?.message_id || "").trim();
  const details = String(body?.details || "").trim() || null;
  const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};

  if (!prospectId) {
    return NextResponse.json({ ok: false, error: "missing_prospect_id" }, { status: 400 });
  }
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ ok: false, error: "invalid_event_type" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await ((supabase as any).rpc("crm_register_outreach_event", {
    p_prospect_id: prospectId,
    p_agent_id: auth.user.id,
    p_event_type: eventType,
    p_message_id: messageIdRaw || null,
    p_details: details,
    p_metadata: metadata,
  }) as any);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_event_create_failed", details: error.message },
      { status: 500 },
    );
  }

  const acqMapping = mapEventToAcq(eventType);
  if (acqMapping) {
    const { data: prospect } = await (supabase.from("crm_prospects") as any)
      .select("object_focus, share_miete_percent, share_kauf_percent, active_listings_count, automation_readiness")
      .eq("id", prospectId)
      .eq("agent_id", auth.user.id)
      .maybeSingle();
    const inferred = inferSegmentAndPlaybook(prospect || null);
    const safeChannel =
      String((metadata as any)?.channel || "").trim().toLowerCase() || "sonstiges";
    const channel =
      safeChannel === "email" ||
      safeChannel === "linkedin" ||
      safeChannel === "telefon" ||
      safeChannel === "kontaktformular" ||
      safeChannel === "meeting" ||
      safeChannel === "whatsapp"
        ? safeChannel
        : "sonstiges";

    const negative = isNegativeOutcome(acqMapping.action_type, acqMapping.outcome);
    await (supabase.from("crm_acq_activity_log") as any).insert({
      agent_id: auth.user.id,
      prospect_id: prospectId,
      occurred_at: new Date().toISOString(),
      channel,
      action_type: acqMapping.action_type,
      segment_key: inferred.segment_key,
      playbook_key: inferred.playbook_key,
      outcome: acqMapping.outcome,
      template_variant:
        String((metadata as any)?.template_variant || (metadata as any)?.recommended_code || "").trim() || null,
      quality_objective_score: computeObjectiveQualityScore({
        action_type: acqMapping.action_type,
        outcome: acqMapping.outcome,
        response_time_hours:
          Number.isFinite(Number((metadata as any)?.response_time_hours))
            ? Number((metadata as any)?.response_time_hours)
            : null,
        personalization_depth:
          Number.isFinite(Number((metadata as any)?.personalization_depth))
            ? Number((metadata as any)?.personalization_depth)
            : null,
        quality_self_score:
          Number.isFinite(Number((metadata as any)?.quality_self_score))
            ? Number((metadata as any)?.quality_self_score)
            : null,
        has_postmortem: negative,
      }),
      failure_reason:
        acqMapping.outcome === "negative"
          ? (String((metadata as any)?.reason || details || "").trim() || null)
          : null,
      winning_signal:
        acqMapping.outcome === "positive"
          ? (String((metadata as any)?.reason || details || "").trim() || null)
          : null,
      analysis_note: details,
      postmortem_root_cause: negative
        ? (String((metadata as any)?.postmortem_root_cause || (metadata as any)?.reason || details || "").trim() ||
          "Negatives Signal im Verlauf.")
        : null,
      postmortem_fix: negative
        ? (String((metadata as any)?.postmortem_fix || "Ansprache und Kanal prüfen, danach kontrolliert erneut testen.").trim())
        : null,
      postmortem_prevention: negative
        ? (String((metadata as any)?.postmortem_prevention || "Stop-Regeln bei negativen Signalen strikt anwenden.").trim())
        : null,
      metadata: {
        source: "crm_events_api",
        event_type: eventType,
        message_id: messageIdRaw || null,
        segment_key: inferred.segment_key,
        playbook_key: inferred.playbook_key,
      },
    });
  }

  return NextResponse.json({ ok: true, event_id: data || null });
}
