import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  computeObjectiveQualityScore,
  inferSegmentAndPlaybook,
} from "@/lib/crm/acqIntelligence";

export const runtime = "nodejs";

const ALLOWED_STATUS = new Set(["draft", "ready", "sent", "failed", "archived"]);

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const messageId = String(id || "").trim();
  if (!messageId) {
    return NextResponse.json({ ok: false, error: "missing_message_id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const status = String(body?.status || "").trim().toLowerCase();
  if (!ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: message, error: messageErr } = await (supabase.from("crm_outreach_messages") as any)
    .select("id, prospect_id, agent_id, channel, message_kind, metadata, personalization_score")
    .eq("id", messageId)
    .eq("agent_id", auth.user.id)
    .maybeSingle();

  if (messageErr) {
    return NextResponse.json(
      { ok: false, error: "crm_message_lookup_failed", details: messageErr.message },
      { status: 500 },
    );
  }
  if (!message) {
    return NextResponse.json({ ok: false, error: "message_not_found" }, { status: 404 });
  }

  const updates: Record<string, any> = { status };
  if (status === "sent") {
    updates.sent_at = new Date().toISOString();
  }

  const { data: updated, error: updateErr } = await (supabase.from("crm_outreach_messages") as any)
    .update(updates)
    .eq("id", messageId)
    .eq("agent_id", auth.user.id)
    .select(
      "id, channel, message_kind, subject, body, personalization_score, status, sent_at, created_at, updated_at",
    )
    .single();

  if (updateErr) {
    return NextResponse.json(
      { ok: false, error: "crm_message_status_update_failed", details: updateErr.message },
      { status: 500 },
    );
  }

  if (status === "sent") {
    const { data: prospect } = await (supabase.from("crm_prospects") as any)
      .select("object_focus, share_miete_percent, share_kauf_percent, active_listings_count, automation_readiness")
      .eq("id", String(message.prospect_id))
      .eq("agent_id", auth.user.id)
      .maybeSingle();
    const inferred = inferSegmentAndPlaybook(prospect || null);
    const templateVariant =
      String((message as any)?.metadata?.template_variant || (message as any)?.metadata?.recommended_code || message.message_kind || "").trim() ||
      null;

    await ((supabase as any).rpc("crm_register_outreach_event", {
      p_prospect_id: String(message.prospect_id),
      p_agent_id: auth.user.id,
      p_event_type: "message_sent",
      p_message_id: messageId,
      p_details: "Nachricht als gesendet markiert",
      p_metadata: { source: "crm_ui" },
    }) as any);

    await (supabase.from("crm_acq_activity_log") as any).insert({
      agent_id: auth.user.id,
      prospect_id: String(message.prospect_id),
      occurred_at: updates.sent_at || new Date().toISOString(),
      channel: String(message.channel || "sonstiges"),
      action_type: "outbound_manual",
      segment_key: inferred.segment_key,
      playbook_key: inferred.playbook_key,
      template_variant: templateVariant,
      outcome: "pending",
      personalization_depth:
        typeof (message as any)?.personalization_score === "number"
          ? Math.max(0, Math.min(100, Math.round((message as any).personalization_score)))
          : null,
      quality_objective_score: computeObjectiveQualityScore({
        action_type: "outbound_manual",
        outcome: "pending",
        response_time_hours: null,
        personalization_depth:
          typeof (message as any)?.personalization_score === "number"
            ? Math.max(0, Math.min(100, Math.round((message as any).personalization_score)))
            : null,
        quality_self_score: null,
        has_postmortem: false,
      }),
      analysis_note: "Manuell als gesendet markiert",
      metadata: {
        source: "crm_status_update",
        segment_key: inferred.segment_key,
        playbook_key: inferred.playbook_key,
      },
    });
  }

  return NextResponse.json({ ok: true, message: updated });
}
