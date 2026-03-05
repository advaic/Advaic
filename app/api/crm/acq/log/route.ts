import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  computeObjectiveQualityScore,
  inferSegmentAndPlaybook,
  isNegativeOutcome,
} from "@/lib/crm/acqIntelligence";

export const runtime = "nodejs";

const ALLOWED_CHANNELS = new Set([
  "email",
  "linkedin",
  "telefon",
  "kontaktformular",
  "meeting",
  "whatsapp",
  "sonstiges",
]);

const ALLOWED_ACTION_TYPES = new Set([
  "outbound_sent",
  "outbound_manual",
  "reply_received",
  "no_reply",
  "followup_planned",
  "followup_sent",
  "call_booked",
  "call_completed",
  "objection_logged",
  "pilot_invited",
  "pilot_started",
  "pilot_won",
  "pilot_lost",
  "opt_out",
  "bounce",
]);

const ALLOWED_CTA_TYPES = new Set([
  "kurze_mail_antwort",
  "15_min_call",
  "video_link",
  "formular_antwort",
  "linkedin_reply",
  "telefon_termin",
  "other",
]);

const ALLOWED_OUTCOMES = new Set(["positive", "neutral", "negative", "pending"]);

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 1800) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function normalizePercentLike(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeFloat(value: unknown, min = 0, max = 720) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n * 100) / 100));
}

function normalizeIso(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

function hasMeaningfulText(value: unknown) {
  return String(value ?? "").trim().length > 0;
}

function isMissingColumnError(error: { code?: string; message?: string; details?: string } | null | undefined) {
  const code = String(error?.code || "").toLowerCase();
  const text = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return code === "42703" || text.includes("does not exist");
}

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const prospectId = normalizeLine(url.searchParams.get("prospect_id") || "", 80);
  const limit = Math.max(1, Math.min(500, Number(url.searchParams.get("limit") || 120)));
  const channel = normalizeLine(url.searchParams.get("channel") || "", 40).toLowerCase();

  const supabase = createSupabaseAdminClient();
  let query = (supabase.from("crm_acq_activity_log_enriched") as any)
    .select("*")
    .eq("agent_id", auth.user.id)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (prospectId) query = query.eq("prospect_id", prospectId);
  if (ALLOWED_CHANNELS.has(channel)) query = query.eq("channel", channel);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_acq_log_fetch_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, logs: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);

  const channelRaw = normalizeLine(body?.channel || "email", 40).toLowerCase();
  const actionTypeRaw = normalizeLine(body?.action_type || "", 80).toLowerCase();
  if (!ALLOWED_CHANNELS.has(channelRaw)) {
    return NextResponse.json({ ok: false, error: "invalid_channel" }, { status: 400 });
  }
  if (!ALLOWED_ACTION_TYPES.has(actionTypeRaw)) {
    return NextResponse.json({ ok: false, error: "invalid_action_type" }, { status: 400 });
  }

  const ctaTypeRaw = normalizeLine(body?.cta_type || "", 80);
  const outcomeRaw = normalizeLine(body?.outcome || "", 40).toLowerCase();
  const postmortemRootCause = normalizeText(body?.postmortem_root_cause, 600) || null;
  const postmortemFix = normalizeText(body?.postmortem_fix, 600) || null;
  const postmortemPrevention = normalizeText(body?.postmortem_prevention, 600) || null;
  const failureReason = normalizeText(body?.failure_reason, 300) || null;
  const analysisNote = normalizeText(body?.analysis_note, 2000) || null;
  const hypothesis = normalizeText(body?.hypothesis, 400) || null;
  const safeOutcome = ALLOWED_OUTCOMES.has(outcomeRaw) ? outcomeRaw : null;
  const isNegative = isNegativeOutcome(actionTypeRaw, safeOutcome);

  if (isNegative) {
    const missing = [];
    if (!hasMeaningfulText(failureReason)) missing.push("failure_reason");
    if (!hasMeaningfulText(analysisNote)) missing.push("analysis_note");
    if (!hasMeaningfulText(postmortemRootCause)) missing.push("postmortem_root_cause");
    if (!hasMeaningfulText(postmortemFix)) missing.push("postmortem_fix");
    if (missing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "postmortem_required_for_negative_outcome",
          details: `Für negative Outcomes fehlen Pflichtfelder: ${missing.join(", ")}`,
        },
        { status: 400 },
      );
    }
  }

  const payload = {
    agent_id: auth.user.id,
    prospect_id: normalizeLine(body?.prospect_id || "", 80) || null,
    occurred_at: normalizeIso(body?.occurred_at) || new Date().toISOString(),
    channel: channelRaw,
    action_type: actionTypeRaw,
    stage_before: normalizeLine(body?.stage_before, 60) || null,
    stage_after: normalizeLine(body?.stage_after, 60) || null,
    template_variant: normalizeLine(body?.template_variant, 120) || null,
    cta_type: ALLOWED_CTA_TYPES.has(ctaTypeRaw) ? ctaTypeRaw : null,
    outcome: safeOutcome,
    response_time_hours: normalizeFloat(body?.response_time_hours, 0, 1440),
    personalization_depth: normalizePercentLike(body?.personalization_depth),
    quality_self_score: normalizePercentLike(body?.quality_self_score),
    failure_reason: failureReason,
    winning_signal: normalizeText(body?.winning_signal, 300) || null,
    hypothesis,
    analysis_note: analysisNote,
    postmortem_root_cause: isNegative ? postmortemRootCause : null,
    postmortem_fix: isNegative ? postmortemFix : null,
    postmortem_prevention: isNegative ? postmortemPrevention : null,
    metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {},
  };

  const supabase = createSupabaseAdminClient();
  let segmentKey = "unspezifisch";
  let playbookKey: string | null = null;
  if (payload.prospect_id) {
    const { data: prospect } = await (supabase.from("crm_prospects") as any)
      .select("object_focus, share_miete_percent, share_kauf_percent, active_listings_count, automation_readiness")
      .eq("agent_id", auth.user.id)
      .eq("id", payload.prospect_id)
      .maybeSingle();
    const inferred = inferSegmentAndPlaybook(prospect || null);
    segmentKey = inferred.segment_key;
    playbookKey = inferred.playbook_key;
  }

  const objectiveScore = computeObjectiveQualityScore({
    action_type: payload.action_type,
    outcome: payload.outcome,
    response_time_hours: payload.response_time_hours,
    personalization_depth: payload.personalization_depth,
    quality_self_score: payload.quality_self_score,
    has_postmortem:
      hasMeaningfulText(payload.postmortem_root_cause) &&
      hasMeaningfulText(payload.postmortem_fix),
  });

  const metadata = {
    ...(payload.metadata || {}),
    segment_key: segmentKey,
    playbook_key: playbookKey,
  };

  let { data, error } = await (supabase.from("crm_acq_activity_log") as any)
    .insert({
      ...payload,
      segment_key: segmentKey,
      playbook_key: playbookKey,
      quality_objective_score: objectiveScore,
      metadata,
    })
    .select("*")
    .single();

  if (error && isMissingColumnError(error)) {
    const fallback = await (supabase.from("crm_acq_activity_log") as any)
      .insert({
        ...payload,
        metadata: {
          ...metadata,
          postmortem_root_cause: payload.postmortem_root_cause,
          postmortem_fix: payload.postmortem_fix,
          postmortem_prevention: payload.postmortem_prevention,
          quality_objective_score: objectiveScore,
        },
      })
      .select("*")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_acq_log_insert_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, log: data });
}
