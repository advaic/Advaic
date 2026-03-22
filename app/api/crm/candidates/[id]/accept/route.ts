import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { recordOperatorFeedback } from "@/lib/crm/operatorFeedback";
import { copyCandidateArtifactsToProspect } from "@/lib/crm/researchArtifacts";

export const runtime = "nodejs";

function clean(value: unknown, max = 400) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 400) {
  return clean(value, max) || null;
}

function normalizeOptionalUrl(value: unknown, max = 500) {
  const raw = clean(value, max);
  if (!raw || !/^https?:\/\//i.test(raw)) return null;
  return raw;
}

function normalizeNonNegativeInt(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round(n));
}

function normalizeFitScore(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizePriority(value: unknown): "A" | "B" | "C" {
  const v = clean(value, 8).toUpperCase();
  if (v === "A" || v === "C") return v;
  return "B";
}

function normalizeObjectFocus(value: unknown): "miete" | "kauf" | "neubau" | "gemischt" {
  const v = clean(value, 24).toLowerCase();
  if (v === "miete" || v === "kauf" || v === "neubau") return v;
  return "gemischt";
}

function normalizeChannel(
  value: unknown,
): "email" | "telefon" | "linkedin" | "kontaktformular" | "whatsapp" | "sonstiges" {
  const v = clean(value, 24).toLowerCase();
  if (
    v === "email" ||
    v === "telefon" ||
    v === "linkedin" ||
    v === "kontaktformular" ||
    v === "whatsapp"
  ) {
    return v;
  }
  return "sonstiges";
}

function normalizeReadiness(value: unknown): "niedrig" | "mittel" | "hoch" | null {
  const v = clean(value, 24).toLowerCase();
  if (v === "niedrig" || v === "mittel" || v === "hoch") return v;
  return null;
}

function normalizeTextArray(value: unknown, maxItems = 12, maxItemLen = 140): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clean(item, maxItemLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeSourceCheckedAt(value: unknown) {
  const raw = clean(value, 40);
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeConfidence(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));
}

function hostnameFor(value: string | null | undefined) {
  try {
    return new URL(String(value || "")).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function domainKeyFor(value: string | null | undefined) {
  const host = hostnameFor(value);
  if (!host) return null;
  const parts = host.split(".").filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join(".");
  return host;
}

function normalizeCompanyKey(value: unknown) {
  return clean(value, 220)
    .toLowerCase()
    .replace(/&/g, " und ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(gmbh|mbh|kg|ag|ug|ohg|e k|ek|immobilienmakler|maklerbuero|maklerbüro)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function bestChannelValue(rows: any[], channelType: string) {
  const match = rows.find((row) => String(row?.channel_type || "").toLowerCase() === channelType);
  return clean(match?.channel_value, 500) || null;
}

function bestPreferredChannel(args: {
  candidatePreferredChannel: unknown;
  contactEmail: string | null;
  linkedinUrl: string | null;
  contactFormUrl: string | null;
  phoneValue: string | null;
}) {
  if (args.contactEmail) return "email" as const;
  if (args.linkedinUrl) return "linkedin" as const;
  if (args.contactFormUrl) return "kontaktformular" as const;
  if (args.phoneValue) return "telefon" as const;
  return normalizeChannel(args.candidatePreferredChannel);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const candidateId = clean(id, 120);
  if (!candidateId) {
    return NextResponse.json({ ok: false, error: "missing_candidate_id" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: candidate, error: candidateError } = await (supabase.from("crm_prospect_candidates") as any)
    .select(
      "id, agent_id, discovery_run_id, company_name, contact_name, contact_email, contact_role, city, region, website_url, source_url, source_checked_at, linkedin_url, linkedin_search_url, linkedin_headline, object_focus, target_group, process_hint, personalization_hook, pain_point_hypothesis, primary_pain_hypothesis, secondary_pain_hypothesis, fit_score, priority, preferred_channel, active_listings_count, object_types, price_band_main, region_focus_micro, response_promise_public, appointment_flow_public, docs_flow_public, owner_led, years_in_market, trust_signals, automation_readiness, personalization_evidence, hypothesis_confidence, review_status, review_reason, promoted_prospect_id, metadata",
    )
    .eq("id", candidateId)
    .eq("agent_id", auth.user.id)
    .maybeSingle();

  if (candidateError) {
    if (isSchemaMismatch(candidateError as any)) {
      return NextResponse.json(
        {
          ok: false,
          error: "crm_discovery_schema_missing",
          details:
            "CRM-Discovery-Schema fehlt. Bitte zuerst die Migration 20260322_crm_phase1_precision_queue.sql ausführen.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "candidate_load_failed", details: candidateError.message },
      { status: 500 },
    );
  }

  if (!candidate) {
    return NextResponse.json({ ok: false, error: "candidate_not_found" }, { status: 404 });
  }

  if (candidate.review_status === "promoted" && candidate.promoted_prospect_id) {
    return NextResponse.json({
      ok: true,
      status: "promoted",
      already_processed: true,
      prospect_id: String(candidate.promoted_prospect_id),
      candidate_id: candidateId,
    });
  }

  if (candidate.review_status === "duplicate" && candidate.promoted_prospect_id) {
    return NextResponse.json({
      ok: true,
      status: "duplicate",
      already_processed: true,
      prospect_id: String(candidate.promoted_prospect_id),
      candidate_id: candidateId,
    });
  }

  if (candidate.review_status !== "new") {
    return NextResponse.json(
      {
        ok: false,
        error: "candidate_already_reviewed",
        details: "Dieser Kandidat wurde bereits bewertet.",
      },
      { status: 409 },
    );
  }

  const [prospectsRes, contactsRes] = await Promise.all([
    (supabase.from("crm_prospects") as any)
      .select("id, company_name, website_url, source_url")
      .eq("agent_id", auth.user.id)
      .limit(5000),
    (supabase.from("crm_contact_candidates") as any)
      .select("channel_type, channel_value, confidence, is_primary")
      .eq("agent_id", auth.user.id)
      .eq("candidate_id", candidateId)
      .order("is_primary", { ascending: false })
      .order("confidence", { ascending: false }),
  ]);

  const lookupError = prospectsRes.error || contactsRes.error;
  if (lookupError) {
    if (isSchemaMismatch(lookupError as any)) {
      return NextResponse.json(
        {
          ok: false,
          error: "crm_discovery_schema_missing",
          details:
            "CRM-Discovery-Schema fehlt. Bitte zuerst die Migration 20260322_crm_phase1_precision_queue.sql ausführen.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "candidate_supporting_data_failed",
        details: lookupError.message || "Kandidat konnte nicht geprüft werden.",
      },
      { status: 500 },
    );
  }

  const prospectRows = (prospectsRes.data || []) as any[];
  const candidateDomain = domainKeyFor(candidate.website_url || candidate.source_url || null);
  const candidateCompanyKey = normalizeCompanyKey(candidate.company_name);
  const duplicateProspect = prospectRows.find((prospect) => {
    const prospectDomain = domainKeyFor(prospect.website_url || prospect.source_url || null);
    const prospectCompanyKey = normalizeCompanyKey(prospect.company_name);
    return (
      (candidateDomain && prospectDomain && candidateDomain === prospectDomain) ||
      (candidateCompanyKey && prospectCompanyKey && candidateCompanyKey === prospectCompanyKey)
    );
  });

  if (duplicateProspect) {
    await (supabase.from("crm_prospect_candidates") as any)
      .update({
        review_status: "duplicate",
        review_reason: "Bereits als Prospect vorhanden.",
        reviewed_at: new Date().toISOString(),
        promoted_prospect_id: duplicateProspect.id,
      })
      .eq("id", candidateId)
      .eq("agent_id", auth.user.id);

    try {
      await recordOperatorFeedback(supabase, {
        agentId: String(auth.user.id),
        subjectType: "candidate",
        subjectId: candidateId,
        feedbackValue: "reject",
        candidateId,
        prospectId: String(duplicateProspect.id),
        notes: "Bereits als Prospect vorhanden.",
        metadata: {
          outcome: "duplicate",
        },
      });
    } catch {
      // Fail-open: duplicate handling remains more important than feedback capture.
    }

    return NextResponse.json({
      ok: true,
      status: "duplicate",
      candidate_id: candidateId,
      prospect_id: String(duplicateProspect.id),
      prospect: duplicateProspect,
    });
  }

  const contactRows = (contactsRes.data || []) as any[];
  const bestEmail =
    clean(candidate.contact_email, 320).toLowerCase() ||
    clean(bestChannelValue(contactRows, "email"), 320).toLowerCase() ||
    null;
  const bestLinkedIn =
    normalizeOptionalUrl(candidate.linkedin_url, 500) || normalizeOptionalUrl(bestChannelValue(contactRows, "linkedin"), 500);
  const bestContactForm = normalizeOptionalUrl(bestChannelValue(contactRows, "kontaktformular"), 500);
  const bestPhone = clean(bestChannelValue(contactRows, "telefon"), 120) || null;

  const payload = {
    agent_id: auth.user.id,
    company_name: clean(candidate.company_name, 200),
    contact_name: normalizeText(candidate.contact_name, 160),
    contact_email: bestEmail,
    contact_role: normalizeText(candidate.contact_role, 120),
    city: normalizeText(candidate.city, 120),
    region: normalizeText(candidate.region, 120),
    website_url: normalizeOptionalUrl(candidate.website_url, 500),
    source_url: normalizeOptionalUrl(candidate.source_url, 500),
    source_checked_at: normalizeSourceCheckedAt(candidate.source_checked_at),
    linkedin_url: bestLinkedIn,
    linkedin_search_url: normalizeOptionalUrl(candidate.linkedin_search_url, 500),
    linkedin_headline: normalizeText(candidate.linkedin_headline, 220),
    object_focus: normalizeObjectFocus(candidate.object_focus),
    active_listings_count: normalizeNonNegativeInt(candidate.active_listings_count),
    new_listings_30d: null,
    share_miete_percent: null,
    share_kauf_percent: null,
    object_types: normalizeTextArray(candidate.object_types, 8, 80),
    price_band_main: normalizeText(candidate.price_band_main, 140),
    region_focus_micro: normalizeText(candidate.region_focus_micro, 180),
    response_promise_public: normalizeText(candidate.response_promise_public, 180),
    appointment_flow_public: normalizeText(candidate.appointment_flow_public, 180),
    docs_flow_public: normalizeText(candidate.docs_flow_public, 180),
    owner_led: candidate.owner_led === null || candidate.owner_led === undefined ? null : Boolean(candidate.owner_led),
    years_in_market: normalizeNonNegativeInt(candidate.years_in_market),
    trust_signals: normalizeTextArray(candidate.trust_signals, 12, 120),
    brand_tone: null,
    cta_preference_guess: null,
    primary_objection: null,
    primary_pain_hypothesis: normalizeText(candidate.primary_pain_hypothesis, 300),
    secondary_pain_hypothesis: normalizeText(candidate.secondary_pain_hypothesis, 300),
    automation_readiness: normalizeReadiness(candidate.automation_readiness),
    personalization_evidence: normalizeText(candidate.personalization_evidence, 500),
    hypothesis_confidence: normalizeConfidence(candidate.hypothesis_confidence),
    target_group: normalizeText(candidate.target_group, 180),
    process_hint: normalizeText(candidate.process_hint, 220),
    pain_point_hypothesis:
      normalizeText(candidate.pain_point_hypothesis, 300) ||
      normalizeText(candidate.primary_pain_hypothesis, 300),
    personalization_hook: normalizeText(candidate.personalization_hook, 220),
    fit_score: normalizeFitScore(candidate.fit_score),
    priority: normalizePriority(candidate.priority),
    preferred_channel: bestPreferredChannel({
      candidatePreferredChannel: candidate.preferred_channel,
      contactEmail: bestEmail,
      linkedinUrl: bestLinkedIn,
      contactFormUrl: bestContactForm,
      phoneValue: bestPhone,
    }),
    stage: "researching",
    next_action:
      bestEmail || bestLinkedIn
        ? "Research prüfen und Erstkontakt freigeben"
        : "Kontakt prüfen und Research ergänzen",
    next_action_at: null,
    metadata: {
      ...(candidate.metadata && typeof candidate.metadata === "object" ? candidate.metadata : {}),
      promoted_from_candidate_id: candidateId,
      discovery_run_id: candidate.discovery_run_id || null,
      promoted_at: new Date().toISOString(),
    },
  };

  const { data: insertedProspect, error: insertError } = await (supabase.from("crm_prospects") as any)
    .insert(payload)
    .select(
      "id, company_name, contact_name, contact_email, city, object_focus, priority, fit_score, stage, preferred_channel, next_action, next_action_at, personalization_hook, source_url, source_checked_at, linkedin_url, linkedin_search_url, active_listings_count, automation_readiness, updated_at",
    )
    .single();

  if (insertError || !insertedProspect?.id) {
    return NextResponse.json(
      {
        ok: false,
        error: "candidate_promote_failed",
        details: insertError?.message || "Kandidat konnte nicht als Prospect übernommen werden.",
      },
      { status: 500 },
    );
  }

  await copyCandidateArtifactsToProspect(supabase, {
    agentId: String(auth.user.id),
    candidateId,
    prospectId: String(insertedProspect.id),
  });

  await (supabase.from("crm_prospect_candidates") as any)
    .update({
      review_status: "promoted",
      review_reason: "Als Prospect übernommen.",
      reviewed_at: new Date().toISOString(),
      promoted_prospect_id: insertedProspect.id,
    })
    .eq("id", candidateId)
    .eq("agent_id", auth.user.id);

  try {
    await recordOperatorFeedback(supabase, {
      agentId: String(auth.user.id),
      subjectType: "candidate",
      subjectId: candidateId,
      feedbackValue: "accept",
      candidateId,
      prospectId: String(insertedProspect.id),
      notes: "Als Prospect uebernommen.",
      metadata: {
        outcome: "promoted",
        chosen_channel: payload.preferred_channel,
      },
    });
  } catch {
    // Fail-open: promoted prospect should survive even if feedback logging is unavailable.
  }

  return NextResponse.json({
    ok: true,
    status: "promoted",
    candidate_id: candidateId,
    prospect_id: String(insertedProspect.id),
    prospect: insertedProspect,
  });
}
