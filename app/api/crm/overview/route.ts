import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

function computeReadinessScore(input: {
  fit_score?: number | null;
  stage?: string | null;
  next_action_at?: string | null;
  updated_at?: string | null;
  source_checked_at?: string | null;
  preferred_channel?: string | null;
  contact_email?: string | null;
}) {
  let score = Number.isFinite(Number(input.fit_score)) ? Number(input.fit_score) : 50;
  const stage = String(input.stage || "").toLowerCase();
  if (stage === "new" || stage === "researching" || stage === "contacted") score += 8;
  if (stage === "replied" || stage === "nurture") score += 2;
  if (stage.startsWith("pilot") || stage === "won" || stage === "lost") score -= 20;

  const now = Date.now();
  const nextActionTs = input.next_action_at ? new Date(input.next_action_at).getTime() : null;
  if (nextActionTs && Number.isFinite(nextActionTs)) {
    if (nextActionTs <= now) score += 7;
    else if (nextActionTs <= now + 2 * 24 * 60 * 60 * 1000) score += 3;
  }
  const updatedTs = input.updated_at ? new Date(input.updated_at).getTime() : null;
  if (updatedTs && Number.isFinite(updatedTs)) {
    if (updatedTs >= now - 14 * 24 * 60 * 60 * 1000) score += 4;
    else score -= 4;
  }
  const sourceTs = input.source_checked_at ? new Date(input.source_checked_at).getTime() : null;
  if (sourceTs && Number.isFinite(sourceTs)) {
    if (sourceTs >= now - 30 * 24 * 60 * 60 * 1000) score += 4;
    else score -= 3;
  }
  const preferredChannel = String(input.preferred_channel || "").toLowerCase();
  if (preferredChannel === "email") {
    if (String(input.contact_email || "").trim()) score += 4;
    else score -= 8;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function isSchemaMismatch(error: { message?: string; details?: string; hint?: string; code?: string } | null | undefined) {
  const text = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  return (
    code === "42703" || // undefined_column
    code === "42p01" || // undefined_table / relation missing
    text.includes("does not exist") ||
    text.includes("schema cache") ||
    text.includes("could not find the") ||
    text.includes("relation")
  );
}

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const agentId = String(auth.user.id);

  const [funnelRes, dueResRaw, prospectsRes, feedbackRes] = await Promise.all([
    (supabase.from("crm_conversion_funnel") as any)
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle(),
    (supabase.from("crm_followup_due") as any)
      .select(
        "prospect_id, company_name, contact_name, contact_email, priority, fit_score, recommended_action, recommended_reason, recommended_code, recommended_primary_label, recommended_at",
      )
      .eq("agent_id", agentId)
      .order("recommended_at", { ascending: true })
      .limit(15),
    (supabase.from("crm_prospects") as any)
      .select(
        "id, company_name, contact_name, contact_email, city, object_focus, priority, fit_score, stage, preferred_channel, last_contacted_at, next_action, next_action_at, personalization_hook, source_url, source_checked_at, linkedin_url, linkedin_search_url, linkedin_relevance_note, active_listings_count, share_miete_percent, share_kauf_percent, brand_tone, primary_objection, automation_readiness, cta_preference_guess, updated_at",
      )
      .eq("agent_id", agentId)
      .order("updated_at", { ascending: false })
      .limit(50),
    (supabase.from("crm_pilot_feedback") as any)
      .select("id, severity, is_resolved", { count: "exact", head: false })
      .eq("agent_id", agentId)
      .eq("is_resolved", false)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  let dueRes: { data: any[] | null; error: any } = dueResRaw as any;
  if (dueRes.error && isSchemaMismatch(dueRes.error as any)) {
    const fallback = await (supabase.from("crm_followup_due") as any)
      .select(
        "prospect_id, company_name, contact_name, priority, fit_score, recommended_action, recommended_reason, recommended_code, recommended_primary_label, recommended_at",
      )
      .eq("agent_id", agentId)
      .order("recommended_at", { ascending: true })
      .limit(15);
    dueRes = {
      data: ((fallback.data || []) as any[]).map((row) => ({
        ...row,
        contact_email: null,
      })),
      error: fallback.error,
    };
  }

  const firstErr =
    funnelRes.error || dueRes.error || prospectsRes.error || feedbackRes.error;

  if (firstErr) {
    if (isSchemaMismatch(firstErr as any)) {
      return NextResponse.json(
        {
          ok: false,
          error: "crm_schema_missing",
          details:
            "CRM-Schema ist veraltet. Bitte nacheinander ausführen: 20260304_crm_prospects_contact_email.sql und 20260304_crm_next_actions_sequence_logic.sql.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "crm_overview_failed", details: firstErr.message },
      { status: 500 },
    );
  }

  const openFeedbackBySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const row of (feedbackRes.data || []) as any[]) {
    const sev = String(row?.severity || "medium").toLowerCase();
    if (sev in openFeedbackBySeverity) {
      (openFeedbackBySeverity as any)[sev] += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    summary: funnelRes.data || {
      prospects_total: 0,
      contacted_total: 0,
      replied_total: 0,
      pilot_invited_total: 0,
      pilot_active_total: 0,
      won_total: 0,
      lost_total: 0,
    },
    followup_due: dueRes.data || [],
    prospects: ((prospectsRes.data || []) as any[]).map((row) => ({
      ...row,
      readiness_score: computeReadinessScore({
        fit_score: Number(row?.fit_score || 0),
        stage: row?.stage || null,
        next_action_at: row?.next_action_at || null,
        updated_at: row?.updated_at || null,
        source_checked_at: row?.source_checked_at || null,
        preferred_channel: row?.preferred_channel || null,
        contact_email: row?.contact_email || null,
      }),
    })),
    open_feedback: {
      total: Number(feedbackRes.count || 0),
      by_severity: openFeedbackBySeverity,
    },
  });
}
