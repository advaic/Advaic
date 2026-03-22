import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { loadCrmAutomationSettings } from "@/lib/crm/automationSettings";
import {
  getDiscoveryLearningAdjustment,
  loadCurrentLearningSnapshot,
} from "@/lib/crm/learningLoop";

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

  const [funnelRes, dueResRaw, prospectsRes, feedbackRes, candidateQueueResRaw, accountChangeRes, blockedDraftRes, learningSnapshot, automation] = await Promise.all([
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
    (supabase.from("crm_prospect_candidates") as any)
      .select(
        "id, company_name, contact_email, contact_role, city, website_url, source_url, linkedin_url, linkedin_search_url, object_focus, preferred_channel, priority, fit_score, automation_readiness, active_listings_count, personalization_hook, target_group, process_hint, source_checked_at, metadata, created_at, review_status",
      )
      .eq("agent_id", agentId)
      .eq("review_status", "new")
      .order("fit_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80),
    (supabase.from("crm_prospects") as any)
      .select(
        "id, company_name, contact_name, contact_email, city, priority, fit_score, stage, next_action, next_action_at, personalization_hook, source_checked_at, updated_at",
      )
      .eq("agent_id", agentId)
      .ilike("next_action", "Account-Aenderung pruefen%")
      .order("next_action_at", { ascending: true })
      .limit(40),
    (supabase.from("crm_outreach_messages") as any)
      .select("id, prospect_id, channel, message_kind, subject, body, status, metadata, created_at, updated_at")
      .eq("agent_id", agentId)
      .in("status", ["draft", "ready"])
      .order("updated_at", { ascending: false })
      .limit(160),
    loadCurrentLearningSnapshot(supabase, agentId).catch(() => null),
    loadCrmAutomationSettings(supabase, agentId),
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

  let candidateQueueRes: { data: any[] | null; error: any } = candidateQueueResRaw as any;
  if (candidateQueueRes.error && isSchemaMismatch(candidateQueueRes.error as any)) {
    candidateQueueRes = { data: [], error: null };
  }

  const firstErr =
    funnelRes.error ||
    dueRes.error ||
    prospectsRes.error ||
    feedbackRes.error ||
    candidateQueueRes.error ||
    accountChangeRes.error ||
    blockedDraftRes.error;

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

  const candidateQueue = ((candidateQueueRes.data || []) as any[])
    .map((row) => {
      const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
      const discoveryLearning = getDiscoveryLearningAdjustment(learningSnapshot, {
        city: String(row?.city || metadata.discovery_city || "").trim() || null,
        discoverySource: String(metadata.discovery_source || "").trim() || null,
        query: String(metadata.discovery_query || "").trim() || null,
      });
      const fitScore = Number(row?.fit_score || 0);
      const learnedFitScore = Math.max(
        0,
        Math.min(100, Math.round(fitScore + Number(discoveryLearning.score_adjustment || 0))),
      );
      return {
        ...row,
        metadata,
        learned_fit_score: learnedFitScore,
        discovery_learning_score: Number(discoveryLearning.score_adjustment || 0),
        discovery_learning_reason: discoveryLearning.reason,
      };
    })
    .sort((a, b) => {
      const learnedDiff = Number(b.learned_fit_score || 0) - Number(a.learned_fit_score || 0);
      if (learnedDiff !== 0) return learnedDiff;
      const fitDiff = Number(b.fit_score || 0) - Number(a.fit_score || 0);
      if (fitDiff !== 0) return fitDiff;
      const aTs = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTs = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTs - aTs;
    })
    .slice(0, 24);

  const accountChangeRows = ((accountChangeRes.data || []) as any[]).slice(0, 24);
  const accountChangeIds = accountChangeRows
    .map((row) => String(row?.id || "").trim())
    .filter(Boolean);

  let latestChangeNoteByProspect = new Map<string, any>();
  if (accountChangeIds.length > 0) {
    const notesRes = await (supabase.from("crm_research_notes") as any)
      .select("prospect_id, note, created_at, metadata")
      .eq("agent_id", agentId)
      .in("prospect_id", accountChangeIds)
      .eq("is_key_insight", true)
      .order("created_at", { ascending: false })
      .limit(Math.max(80, accountChangeIds.length * 6));

    if (!notesRes.error) {
      for (const row of (notesRes.data || []) as any[]) {
        const prospectId = String(row?.prospect_id || "").trim();
        if (!prospectId || latestChangeNoteByProspect.has(prospectId)) continue;
        const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
        const changeSummary =
          metadata?.change_summary && typeof metadata.change_summary === "object"
            ? metadata.change_summary
            : null;
        if (changeSummary?.detected || Number(changeSummary?.count || 0) > 0) {
          latestChangeNoteByProspect.set(prospectId, {
            note: String(row?.note || "").trim() || null,
            created_at: row?.created_at || null,
            change_summary: changeSummary,
          });
        }
      }
    }
  }

  const accountChangeQueue = accountChangeRows.map((row) => {
    const note = latestChangeNoteByProspect.get(String(row?.id || "").trim()) || null;
    const changeSummary = note?.change_summary && typeof note.change_summary === "object" ? note.change_summary : null;
    return {
      ...row,
      change_summary: typeof changeSummary?.summary === "string" ? changeSummary.summary : null,
      change_count: Number.isFinite(Number(changeSummary?.count))
        ? Number(changeSummary.count)
        : null,
      change_detected_at: note?.created_at || row?.next_action_at || null,
      latest_change_note: note?.note || null,
      change_items: Array.isArray(changeSummary?.items) ? changeSummary.items.slice(0, 6) : [],
    };
  });

  const blockedDraftRows = ((blockedDraftRes.data || []) as any[]).filter((row) => {
    const review = row?.metadata?.outbound_review && typeof row.metadata.outbound_review === "object"
      ? row.metadata.outbound_review
      : null;
    return review && String(review.status || "").toLowerCase() !== "pass";
  });
  const blockedDraftProspectIds = [...new Set(
    blockedDraftRows.map((row) => String(row?.prospect_id || "").trim()).filter(Boolean),
  )];
  let blockedDraftProspectMap = new Map<string, any>();
  if (blockedDraftProspectIds.length > 0) {
    const blockedProspectRes = await (supabase.from("crm_prospects") as any)
      .select("id, company_name, city, stage, priority, fit_score")
      .eq("agent_id", agentId)
      .in("id", blockedDraftProspectIds);
    if (!blockedProspectRes.error) {
      blockedDraftProspectMap = new Map(
        ((blockedProspectRes.data || []) as any[]).map((row) => [String(row?.id || ""), row]),
      );
    }
  }
  const blockedDraftQueue = blockedDraftRows
    .map((row) => {
      const review = row?.metadata?.outbound_review && typeof row.metadata.outbound_review === "object"
        ? row.metadata.outbound_review
        : null;
      const prospect = blockedDraftProspectMap.get(String(row?.prospect_id || "")) || null;
      return {
        id: row.id,
        prospect_id: row.prospect_id,
        company_name: prospect?.company_name || "Unbekannter Prospect",
        city: prospect?.city || null,
        stage: prospect?.stage || null,
        priority: prospect?.priority || null,
        fit_score: Number(prospect?.fit_score || 0) || null,
        channel: row.channel,
        message_kind: row.message_kind,
        subject: row.subject || null,
        body: String(row.body || "").trim(),
        body_preview: String(row.body || "").trim().slice(0, 220),
        status: row.status,
        review,
        created_at: row.created_at || null,
        updated_at: row.updated_at || null,
      };
    })
    .sort((a, b) => {
      const severityRank = (input: any) =>
        String(input?.review?.status || "").toLowerCase() === "blocked" ? 0 : 1;
      const severityDiff = severityRank(a) - severityRank(b);
      if (severityDiff !== 0) return severityDiff;
      const unsupportedDiff =
        Number(b.review?.evidence_alignment?.unsupported_claim_count || 0) -
        Number(a.review?.evidence_alignment?.unsupported_claim_count || 0);
      if (unsupportedDiff !== 0) return unsupportedDiff;
      const scoreDiff = Number(a.review?.score || 0) - Number(b.review?.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      const aTs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bTs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bTs - aTs;
    })
    .slice(0, 18);

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
    candidate_queue: candidateQueue,
    account_change_queue: accountChangeQueue,
    blocked_draft_queue: blockedDraftQueue,
    open_feedback: {
      total: Number(feedbackRes.count || 0),
      by_severity: openFeedbackBySeverity,
    },
    automation,
  });
}
