import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  collectTriggerEvidence,
  deriveAbFields,
  evaluateFirstTouchGuardrails,
} from "@/lib/crm/cadenceRules";
import { inferSegmentAndPlaybook } from "@/lib/crm/acqIntelligence";
import {
  assessResearchReadiness,
} from "@/lib/crm/outboundQuality";
import { ensureProspectStrategyDecision } from "@/lib/crm/strategyEngine";
import {
  evaluateGroundedOutboundMessageQuality,
  loadGroundedReviewContext,
  persistQualityReview,
} from "@/lib/crm/qualityReviewEngine";

export const runtime = "nodejs";

const ALLOWED_CHANNELS = new Set([
  "email",
  "telefon",
  "linkedin",
  "kontaktformular",
  "whatsapp",
  "sonstiges",
]);

const ALLOWED_KINDS = new Set([
  "first_touch",
  "follow_up_1",
  "follow_up_2",
  "follow_up_3",
  "custom",
]);

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 5000) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function parseCadenceStep(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded as 1 | 2 | 3 | 4 | 5;
}

function isSchemaMismatch(error: { message?: string; details?: string; hint?: string; code?: string } | null | undefined) {
  const text = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  return (
    code === "42703" ||
    code === "42p01" ||
    text.includes("does not exist") ||
    text.includes("schema cache") ||
    text.includes("could not find the") ||
    text.includes("relation")
  );
}

export async function GET(
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

  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase.from("crm_outreach_messages") as any)
    .select(
      "id, channel, message_kind, subject, body, personalization_score, status, sent_at, external_message_id, metadata, created_at, updated_at",
    )
    .eq("agent_id", auth.user.id)
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_messages_fetch_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, messages: data || [] });
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

  const body = await req.json().catch(() => null);
  const messageBody = String(body?.body || "").trim();
  if (!messageBody) {
    return NextResponse.json({ ok: false, error: "missing_body" }, { status: 400 });
  }

  const channelRaw = String(body?.channel || "email").trim().toLowerCase();
  const kindRaw = String(body?.message_kind || "custom").trim().toLowerCase();
  const statusRaw = String(body?.status || "draft").trim().toLowerCase();
  const safeChannel = ALLOWED_CHANNELS.has(channelRaw) ? channelRaw : "email";
  const safeKind = ALLOWED_KINDS.has(kindRaw) ? kindRaw : "custom";
  const safeStatus = statusRaw === "ready" ? "ready" : "draft";
  const scoreRaw = Number(body?.personalization_score);
  const personalizationScore =
    Number.isFinite(scoreRaw) && scoreRaw >= 0 && scoreRaw <= 100 ? Math.round(scoreRaw) : null;
  const metadataInput = asObject(body?.metadata);

  const supabase = createSupabaseAdminClient();

  let prospectSignalsRes = await (supabase.from("crm_prospects") as any)
    .select(
      "company_name, contact_email, city, region, object_focus, target_group, process_hint, personalization_hook, active_listings_count, new_listings_30d, share_miete_percent, share_kauf_percent, personalization_evidence, source_checked_at, automation_readiness, response_promise_public, appointment_flow_public, docs_flow_public, linkedin_url, linkedin_search_url",
    )
    .eq("id", prospectId)
    .eq("agent_id", auth.user.id)
    .maybeSingle();

  if (prospectSignalsRes.error && String((prospectSignalsRes.error as any).code || "") === "42703") {
    prospectSignalsRes = await (supabase.from("crm_prospects") as any)
      .select("company_name, contact_email, city, region, object_focus, target_group, process_hint, personalization_hook")
      .eq("id", prospectId)
      .eq("agent_id", auth.user.id)
      .maybeSingle();
  }
  if (prospectSignalsRes.error) {
    return NextResponse.json(
      { ok: false, error: "crm_prospect_lookup_failed", details: prospectSignalsRes.error.message },
      { status: 500 },
    );
  }
  const prospectSignals = (prospectSignalsRes.data || {}) as Record<string, any>;
  const triggerEvidence = collectTriggerEvidence({
    companyName: normalizeLine(prospectSignals.company_name, 160),
    city: normalizeLine(prospectSignals.city, 120) || null,
    region: normalizeLine(prospectSignals.region, 120) || null,
    objectFocus: normalizeLine(prospectSignals.object_focus, 24) || null,
    activeListingsCount: Number.isFinite(Number(prospectSignals.active_listings_count))
      ? Number(prospectSignals.active_listings_count)
      : null,
    newListings30d: Number.isFinite(Number(prospectSignals.new_listings_30d))
      ? Number(prospectSignals.new_listings_30d)
      : null,
    shareMietePercent: Number.isFinite(Number(prospectSignals.share_miete_percent))
      ? Number(prospectSignals.share_miete_percent)
      : null,
    shareKaufPercent: Number.isFinite(Number(prospectSignals.share_kauf_percent))
      ? Number(prospectSignals.share_kauf_percent)
      : null,
    targetGroup: normalizeText(prospectSignals.target_group, 180) || null,
    processHint: normalizeText(prospectSignals.process_hint, 220) || null,
    personalizationHook: normalizeText(prospectSignals.personalization_hook, 220) || null,
    personalizationEvidence: normalizeText(prospectSignals.personalization_evidence, 240) || null,
    sourceCheckedAt: normalizeLine(prospectSignals.source_checked_at, 40) || null,
  });
  const triggerEvidenceCount = triggerEvidence.length;
  const inferred = inferSegmentAndPlaybook({
    object_focus: normalizeLine(prospectSignals.object_focus, 24) || null,
    share_miete_percent: Number.isFinite(Number(prospectSignals.share_miete_percent))
      ? Number(prospectSignals.share_miete_percent)
      : null,
    share_kauf_percent: Number.isFinite(Number(prospectSignals.share_kauf_percent))
      ? Number(prospectSignals.share_kauf_percent)
      : null,
    active_listings_count: Number.isFinite(Number(prospectSignals.active_listings_count))
      ? Number(prospectSignals.active_listings_count)
      : null,
    automation_readiness: normalizeLine(prospectSignals.automation_readiness, 24) || null,
  });
  const strategyResult = await ensureProspectStrategyDecision(supabase, {
    agentId: String(auth.user.id),
    prospectId,
  });
  const strategy = strategyResult.ok ? strategyResult.strategy : null;
  const resolvedSegmentKey =
    normalizeLine(metadataInput.segment_key, 80) || strategy?.segment_key || inferred.segment_key;
  const resolvedPlaybookKey =
    normalizeLine(metadataInput.playbook_key, 120) || strategy?.playbook_key || inferred.playbook_key;

  const cadenceStep =
    parseCadenceStep(metadataInput.cadence_step) ??
    (safeKind === "first_touch"
      ? 1
      : safeKind === "follow_up_1"
        ? 2
        : safeKind === "follow_up_2"
          ? 3
          : safeKind === "follow_up_3"
            ? 4
            : null);
  const cadenceKey = normalizeLine(metadataInput.cadence_key, 120) || "cadence_v1_5touch_14d";
  const templateVariant =
    normalizeLine(metadataInput.template_variant, 120) ||
    normalizeLine(body?.template_variant, 120) ||
    `manual_${safeKind}`;
  const ab = deriveAbFields({
    messageKind: safeKind as any,
    templateVariant,
    cadenceStep,
  });

  const firstTouchGuardrail =
    safeKind === "first_touch"
      ? evaluateFirstTouchGuardrails({
          body: messageBody,
          triggerEvidenceCount,
        })
      : null;
  const researchReadiness = assessResearchReadiness({
    preferredChannel: safeChannel,
    contactEmail: normalizeLine(prospectSignals.contact_email, 240) || null,
    personalizationHook: normalizeText(prospectSignals.personalization_hook, 220) || null,
    personalizationEvidence: normalizeText(prospectSignals.personalization_evidence, 240) || null,
    sourceCheckedAt: normalizeLine(prospectSignals.source_checked_at, 40) || null,
    targetGroup: normalizeText(prospectSignals.target_group, 180) || null,
    processHint: normalizeText(prospectSignals.process_hint, 220) || null,
    responsePromisePublic: normalizeText(prospectSignals.response_promise_public, 180) || null,
    appointmentFlowPublic: normalizeText(prospectSignals.appointment_flow_public, 180) || null,
    docsFlowPublic: normalizeText(prospectSignals.docs_flow_public, 180) || null,
    activeListingsCount: Number.isFinite(Number(prospectSignals.active_listings_count))
      ? Number(prospectSignals.active_listings_count)
      : null,
    automationReadiness: normalizeLine(prospectSignals.automation_readiness, 24) || null,
    linkedinUrl: normalizeLine(prospectSignals.linkedin_url, 320) || null,
    linkedinSearchUrl: normalizeLine(prospectSignals.linkedin_search_url, 320) || null,
  });
  const groundedContext = await loadGroundedReviewContext(supabase, {
    agentId: String(auth.user.id),
    prospectId,
    channel: safeChannel,
    messageKind: safeKind,
    segmentKey: resolvedSegmentKey,
    playbookKey: resolvedPlaybookKey,
  });
  const outboundReview = evaluateGroundedOutboundMessageQuality({
    body: messageBody,
    subject: normalizeLine(body?.subject, 240) || null,
    channel: safeChannel,
    messageKind: safeKind,
    companyName: normalizeLine(prospectSignals.company_name, 160) || null,
    city: normalizeLine(prospectSignals.city, 120) || null,
    personalizationHook: normalizeText(prospectSignals.personalization_hook, 220) || null,
    triggerEvidenceCount,
    researchReadiness,
    prospect: {
      company_name: normalizeLine(prospectSignals.company_name, 160) || null,
      city: normalizeLine(prospectSignals.city, 120) || null,
      preferred_channel: safeChannel,
      contact_email: normalizeLine(prospectSignals.contact_email, 240) || null,
      personalization_hook: normalizeText(prospectSignals.personalization_hook, 220) || null,
      personalization_evidence: normalizeText(prospectSignals.personalization_evidence, 240) || null,
      source_checked_at: normalizeLine(prospectSignals.source_checked_at, 40) || null,
      target_group: normalizeText(prospectSignals.target_group, 180) || null,
      process_hint: normalizeText(prospectSignals.process_hint, 220) || null,
      response_promise_public: normalizeText(prospectSignals.response_promise_public, 180) || null,
      appointment_flow_public: normalizeText(prospectSignals.appointment_flow_public, 180) || null,
      docs_flow_public: normalizeText(prospectSignals.docs_flow_public, 180) || null,
      active_listings_count: Number.isFinite(Number(prospectSignals.active_listings_count))
        ? Number(prospectSignals.active_listings_count)
        : null,
      automation_readiness: normalizeLine(prospectSignals.automation_readiness, 24) || null,
      linkedin_url: normalizeLine(prospectSignals.linkedin_url, 320) || null,
      linkedin_search_url: normalizeLine(prospectSignals.linkedin_search_url, 320) || null,
    },
    context: groundedContext,
    supportHints: triggerEvidence,
  });

  if (safeKind === "first_touch" && safeStatus === "ready" && firstTouchGuardrail && !firstTouchGuardrail.pass) {
    return NextResponse.json(
      {
        ok: false,
        error: "first_touch_guardrail_failed",
        details: "Erstkontakt blockiert: Bitte natürlicher, kürzer und mit klaren Triggern schreiben.",
        guardrail: firstTouchGuardrail,
        review: outboundReview,
      },
      { status: 422 },
    );
  }
  if (safeStatus === "ready" && outboundReview.status === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        error: "outbound_quality_blocked",
        details: outboundReview.summary,
        review: outboundReview,
        research: researchReadiness,
      },
      { status: 422 },
    );
  }

  const mergedMetadata = {
    ...metadataInput,
    source: normalizeLine(metadataInput.source, 80) || "crm_manual",
    cadence_key: cadenceKey,
    cadence_step: cadenceStep,
    template_variant: templateVariant,
    ab_intro_variant: normalizeLine(metadataInput.ab_intro_variant, 80) || ab.ab_intro_variant,
    ab_trigger_variant: normalizeLine(metadataInput.ab_trigger_variant, 80) || ab.ab_trigger_variant,
    ab_cta_variant: normalizeLine(metadataInput.ab_cta_variant, 80) || ab.ab_cta_variant,
    ab_subject_variant: normalizeLine(metadataInput.ab_subject_variant, 80) || ab.ab_subject_variant,
    segment_key: resolvedSegmentKey,
    playbook_key: resolvedPlaybookKey,
    strategy_decision_id:
      normalizeLine(metadataInput.strategy_decision_id, 120) || strategy?.id || null,
    strategy_version:
      Number.isFinite(Number(metadataInput.strategy_version))
        ? Number(metadataInput.strategy_version)
        : strategy?.version || null,
    strategy_channel: normalizeLine(metadataInput.strategy_channel, 40) || strategy?.chosen_channel || null,
    strategy_cta: normalizeLine(metadataInput.strategy_cta, 80) || strategy?.chosen_cta || null,
    strategy_angle: normalizeText(metadataInput.strategy_angle, 280) || strategy?.chosen_angle || null,
    strategy_trigger: normalizeText(metadataInput.strategy_trigger, 280) || strategy?.chosen_trigger || null,
    strategy_contact_channel:
      normalizeLine(metadataInput.strategy_contact_channel, 40) || strategy?.chosen_contact_channel || null,
    strategy_contact_value:
      normalizeText(metadataInput.strategy_contact_value, 320) || strategy?.chosen_contact_value || null,
    strategy_contact_candidate_id:
      normalizeLine(metadataInput.strategy_contact_candidate_id, 120) || strategy?.chosen_contact_candidate_id || null,
    strategy_contact_confidence:
      Number.isFinite(Number(metadataInput.strategy_contact_confidence))
        ? Number(metadataInput.strategy_contact_confidence)
        : strategy?.chosen_contact_confidence || null,
    strategy_risk_level: normalizeLine(metadataInput.strategy_risk_level, 40) || strategy?.risk_level || null,
    trigger_evidence: triggerEvidence,
    trigger_evidence_count: triggerEvidenceCount,
    first_touch_guardrail: firstTouchGuardrail,
    first_touch_guardrail_pass:
      safeKind === "first_touch" ? Boolean(firstTouchGuardrail?.pass) : null,
    research_readiness: researchReadiness,
    outbound_review: outboundReview,
    generated_at: normalizeLine(metadataInput.generated_at, 60) || new Date().toISOString(),
  };

  const insertWithColumns = {
    prospect_id: prospectId,
    agent_id: auth.user.id,
    channel: safeChannel,
    message_kind: safeKind,
    subject: normalizeLine(body?.subject, 240) || null,
    body: messageBody,
    personalization_score: personalizationScore,
    status: safeStatus,
    metadata: mergedMetadata,
    cadence_key: cadenceKey,
    cadence_step: cadenceStep,
    ab_intro_variant: mergedMetadata.ab_intro_variant,
    ab_trigger_variant: mergedMetadata.ab_trigger_variant,
    ab_cta_variant: mergedMetadata.ab_cta_variant,
    ab_subject_variant: mergedMetadata.ab_subject_variant,
    trigger_evidence_count: triggerEvidenceCount,
    first_touch_guardrail_pass:
      safeKind === "first_touch" ? Boolean(firstTouchGuardrail?.pass) : null,
  };

  let insertRes = await (supabase.from("crm_outreach_messages") as any)
    .insert(insertWithColumns)
    .select(
      "id, channel, message_kind, subject, body, personalization_score, status, sent_at, metadata, created_at, updated_at",
    )
    .single();

  if (insertRes.error && isSchemaMismatch(insertRes.error as any)) {
    insertRes = await (supabase.from("crm_outreach_messages") as any)
      .insert({
        prospect_id: prospectId,
        agent_id: auth.user.id,
        channel: safeChannel,
        message_kind: safeKind,
        subject: normalizeLine(body?.subject, 240) || null,
        body: messageBody,
        personalization_score: personalizationScore,
        status: safeStatus,
        metadata: mergedMetadata,
      })
      .select(
        "id, channel, message_kind, subject, body, personalization_score, status, sent_at, metadata, created_at, updated_at",
      )
      .single();
  }

  const { data, error } = insertRes;
  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_message_create_failed", details: error.message },
      { status: 500 },
    );
  }

  try {
    await persistQualityReview(supabase, {
      agentId: String(auth.user.id),
      prospectId,
      messageId: String(data?.id || ""),
      reviewScope: "draft_save",
      channel: safeChannel,
      messageKind: safeKind,
      review: outboundReview,
      metadata: {
        strategy_decision_id: mergedMetadata.strategy_decision_id || null,
        generated_from: mergedMetadata.source || null,
      },
    });
  } catch {
    // Fail-open: draft saving should not depend on review persistence.
  }

  const { error: logErr } = await ((supabase as any).rpc("crm_register_outreach_event", {
    p_prospect_id: prospectId,
    p_agent_id: auth.user.id,
    p_event_type: "follow_up_due",
    p_message_id: String(data?.id || ""),
    p_details: `${safeKind} als ${safeStatus === "ready" ? "ready" : "draft"} gespeichert`,
    p_metadata: {
      source: mergedMetadata.source,
      template_variant: templateVariant,
      cadence_key: cadenceKey,
      cadence_step: cadenceStep,
      ab_intro_variant: mergedMetadata.ab_intro_variant,
      ab_trigger_variant: mergedMetadata.ab_trigger_variant,
      ab_cta_variant: mergedMetadata.ab_cta_variant,
      ab_subject_variant: mergedMetadata.ab_subject_variant,
    },
  }) as any);
  if (logErr && !isSchemaMismatch(logErr as any)) {
    return NextResponse.json(
      { ok: false, error: "crm_message_event_log_failed", details: logErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: data,
    guardrail: firstTouchGuardrail,
    review: outboundReview,
    research: researchReadiness,
  });
}
