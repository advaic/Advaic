import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { collectTriggerEvidence } from "@/lib/crm/cadenceRules";
import { assessResearchReadiness } from "@/lib/crm/outboundQuality";
import { ensureProspectStrategyDecision } from "@/lib/crm/strategyEngine";
import {
  evaluateGroundedOutboundMessageQuality,
  loadGroundedReviewContext,
} from "@/lib/crm/qualityReviewEngine";

export const runtime = "nodejs";

type EvidenceRow = {
  field_name: string | null;
  field_value: string | null;
  source_type: string | null;
  source_url: string | null;
  confidence: number | null;
};

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeMultiline(value: unknown, max = 4000) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, max);
}

function compactBody(text: string) {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const prospectId = String(id || "").trim();
  if (!prospectId) {
    return NextResponse.json({ ok: false, error: "missing_prospect_id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({} as any));
  const channel = normalizeLine(body?.channel || "email", 40).toLowerCase();
  const messageKind = normalizeLine(body?.message_kind || "first_touch", 40).toLowerCase();
  const subject = normalizeLine(body?.subject, 160);
  const currentBody = compactBody(normalizeMultiline(body?.body, 2200));
  if (!currentBody) {
    return NextResponse.json({ ok: false, error: "missing_body" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const [prospectRes, notesRes, evidenceRes] = await Promise.all([
    (supabase.from("crm_prospects") as any)
      .select(
        "id, company_name, contact_name, contact_email, city, region, object_focus, personalization_hook, active_listings_count, new_listings_30d, share_miete_percent, share_kauf_percent, target_group, process_hint, response_promise_public, appointment_flow_public, docs_flow_public, automation_readiness, source_checked_at, linkedin_url, personalization_evidence",
      )
      .eq("id", prospectId)
      .eq("agent_id", auth.user.id)
      .maybeSingle(),
    (supabase.from("crm_research_notes") as any)
      .select("note")
      .eq("agent_id", auth.user.id)
      .eq("prospect_id", prospectId)
      .eq("is_key_insight", true)
      .order("created_at", { ascending: false })
      .limit(4),
    (supabase.from("crm_research_evidence") as any)
      .select("field_name, field_value, source_type, source_url, confidence")
      .eq("agent_id", auth.user.id)
      .eq("prospect_id", prospectId)
      .order("confidence", { ascending: false })
      .order("captured_at", { ascending: false })
      .limit(24),
  ]);

  if (prospectRes.error) {
    return NextResponse.json(
      { ok: false, error: "crm_prospect_lookup_failed", details: prospectRes.error.message },
      { status: 500 },
    );
  }
  if (notesRes.error) {
    return NextResponse.json(
      { ok: false, error: "crm_research_notes_lookup_failed", details: notesRes.error.message },
      { status: 500 },
    );
  }
  if (evidenceRes.error) {
    return NextResponse.json(
      { ok: false, error: "crm_research_evidence_lookup_failed", details: evidenceRes.error.message },
      { status: 500 },
    );
  }
  const prospect = prospectRes.data;
  if (!prospect) {
    return NextResponse.json({ ok: false, error: "prospect_not_found" }, { status: 404 });
  }

  const strategyResult = await ensureProspectStrategyDecision(supabase, {
    agentId: String(auth.user.id),
    prospectId,
    prospect,
  });
  const strategy = strategyResult.ok ? strategyResult.strategy : null;

  const notes = (notesRes.data || []) as Array<{ note?: string | null }>;
  const researchInsights = notes
    .map((row) => normalizeMultiline(row?.note, 220))
    .filter(Boolean)
    .join(" ");
  const evidenceRows = ((evidenceRes.data || []) as EvidenceRow[]) || [];

  const companyName = normalizeLine(prospect.company_name, 160);
  const city = normalizeLine(prospect.city, 120) || null;
  const region = normalizeLine(prospect.region, 120) || null;
  const objectFocus = normalizeLine(prospect.object_focus, 40) || "gemischt";
  const personalizationHook =
    normalizeLine(strategy?.chosen_trigger, 240) ||
    normalizeLine(prospect.personalization_hook, 240) ||
    null;
  const targetGroup = normalizeLine(prospect.target_group, 180) || null;
  const processHint = normalizeLine(prospect.process_hint, 220) || null;
  const responsePromisePublic = normalizeLine(prospect.response_promise_public, 180) || null;
  const appointmentFlowPublic = normalizeLine(prospect.appointment_flow_public, 180) || null;
  const docsFlowPublic = normalizeLine(prospect.docs_flow_public, 180) || null;
  const contactEmail =
    normalizeLine((prospect as any).contact_email, 240) ||
    (strategy?.chosen_contact_channel === "email"
      ? normalizeLine(strategy.chosen_contact_value, 240) || null
      : null);
  const personalizationEvidence = normalizeMultiline(prospect.personalization_evidence, 320) || null;
  const linkedinUrl = normalizeLine(prospect.linkedin_url, 280) || null;
  const sourceCheckedAt = normalizeLine(prospect.source_checked_at, 40) || null;
  const activeListingsCount =
    typeof prospect.active_listings_count === "number" ? prospect.active_listings_count : null;
  const newListings30d =
    typeof prospect.new_listings_30d === "number" ? prospect.new_listings_30d : null;
  const shareMietePercent =
    typeof prospect.share_miete_percent === "number" ? prospect.share_miete_percent : null;
  const shareKaufPercent =
    typeof prospect.share_kauf_percent === "number" ? prospect.share_kauf_percent : null;

  const researchReadiness =
    strategyResult.ok && strategyResult.research
      ? strategyResult.research
      : assessResearchReadiness({
          preferredChannel: channel,
          contactEmail,
          personalizationHook,
          personalizationEvidence,
          researchInsights,
          sourceCheckedAt,
          targetGroup,
          processHint,
          responsePromisePublic,
          appointmentFlowPublic,
          docsFlowPublic,
          activeListingsCount,
          automationReadiness: normalizeLine(prospect.automation_readiness, 40) || null,
          linkedinUrl,
        });

  const triggerEvidenceCount = collectTriggerEvidence({
    companyName,
    city,
    region,
    objectFocus,
    activeListingsCount,
    newListings30d,
    shareMietePercent,
    shareKaufPercent,
    targetGroup,
    processHint,
    personalizationHook,
    personalizationEvidence,
    sourceCheckedAt,
  }).length || Number(strategy?.trigger_evidence?.length || 0);

  const groundedContext = await loadGroundedReviewContext(supabase, {
    agentId: String(auth.user.id),
    prospectId,
    channel,
    messageKind,
    segmentKey: strategy?.segment_key || null,
    playbookKey: strategy?.playbook_key || null,
  });

  const review = evaluateGroundedOutboundMessageQuality({
    body: currentBody,
    subject,
    channel,
    messageKind,
    companyName,
    city,
    personalizationHook,
    triggerEvidenceCount,
    researchReadiness,
    prospect: {
      company_name: companyName,
      city,
      preferred_channel: channel,
      contact_email: contactEmail,
      personalization_hook: personalizationHook,
      personalization_evidence: personalizationEvidence,
      source_checked_at: sourceCheckedAt,
      target_group: targetGroup,
      process_hint: processHint,
      response_promise_public: responsePromisePublic,
      appointment_flow_public: appointmentFlowPublic,
      docs_flow_public: docsFlowPublic,
      active_listings_count: activeListingsCount,
      automation_readiness: normalizeLine(prospect.automation_readiness, 40) || null,
      linkedin_url: linkedinUrl,
    },
    context: groundedContext,
    supportHints: [
      personalizationHook,
      personalizationEvidence,
      researchInsights,
      processHint,
      normalizeLine(strategy?.chosen_angle, 240) || null,
      normalizeLine(strategy?.chosen_trigger, 240) || null,
      ...evidenceRows.map((row) => normalizeLine(row.field_value, 200)),
    ].filter(Boolean) as string[],
  });

  return NextResponse.json({
    ok: true,
    review,
  });
}
