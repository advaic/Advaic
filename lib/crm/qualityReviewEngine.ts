import {
  assessResearchReadiness,
  evaluateOutboundMessageQuality,
  type OutboundQualityReview,
  type ResearchReadiness,
} from "@/lib/crm/outboundQuality";
import {
  evaluateGoldsetAlignment,
  loadRelevantGoldsetExamples,
  type GoldsetContext,
} from "@/lib/crm/messageGoldset";

type EvidenceRow = {
  field_name?: string | null;
  field_value?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  confidence?: number | null;
  metadata?: Record<string, any> | null;
};

type SupportFact = {
  text: string;
  source_kind: "evidence" | "context" | "hint";
  field_name: string | null;
  source_type: string | null;
  source_url: string | null;
  confidence: number;
};

type PriorMessageRow = {
  id?: string | null;
  body?: string | null;
  channel?: string | null;
  message_kind?: string | null;
  status?: string | null;
  metadata?: Record<string, any> | null;
};

type ProspectSignals = {
  company_name?: string | null;
  city?: string | null;
  preferred_channel?: string | null;
  contact_email?: string | null;
  personalization_hook?: string | null;
  personalization_evidence?: string | null;
  source_checked_at?: string | null;
  target_group?: string | null;
  process_hint?: string | null;
  response_promise_public?: string | null;
  appointment_flow_public?: string | null;
  docs_flow_public?: string | null;
  active_listings_count?: number | null;
  automation_readiness?: string | null;
  linkedin_url?: string | null;
  linkedin_search_url?: string | null;
};

type GroundingContext = {
  evidenceRows: EvidenceRow[];
  priorMessages: PriorMessageRow[];
  goldset: GoldsetContext;
};

function clean(value: unknown, max = 260) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeBody(value: unknown, max = 6000) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function normalizeForCompare(value: unknown) {
  return clean(value, 6000)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

const STOPWORDS = new Set([
  "und",
  "oder",
  "aber",
  "dass",
  "eine",
  "einer",
  "einem",
  "einen",
  "eines",
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "bei",
  "von",
  "mit",
  "fuer",
  "für",
  "ist",
  "sind",
  "wirkt",
  "wohl",
  "noch",
  "mehr",
  "sehr",
  "auch",
  "eine",
  "eher",
  "gerade",
  "thema",
  "aktuell",
  "ihnen",
  "ihrer",
  "ihre",
  "euch",
  "mein",
  "mich",
  "ich",
  "bin",
  "von",
  "advaic",
  "hallo",
  "guten",
  "tag",
]);

function tokens(value: unknown) {
  return normalizeForCompare(value)
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length >= 4 && !STOPWORDS.has(part));
}

function splitSentences(text: string) {
  return text
    .split(/[.!?]+\s+/)
    .map((chunk) => clean(chunk, 280))
    .filter(Boolean);
}

function looksGenericSentence(sentence: string) {
  const lower = normalizeForCompare(sentence);
  return (
    lower.startsWith("ich bin ") ||
    lower.startsWith("ich melde mich ") ||
    lower.startsWith("ich wollte ") ||
    lower.startsWith("ich hatte den eindruck") ||
    lower.startsWith("ich bin auf ")
  );
}

function looksClaimLike(sentence: string) {
  const lower = normalizeForCompare(sentence);
  if (!lower || lower.length < 20) return false;
  if (looksGenericSentence(sentence)) return false;
  return (
    /\b(objekt|wohnung|haus|vermiet|verkauf|miete|kauf|termin|besichtigung|unterlagen|antwort|prozess|anfragen|team|inhaber|markt|makler|kunden|interessenten|volumen|auslast|reaktion)\b/i.test(
      sentence,
    ) ||
    /\b\d{1,4}\b|%/.test(sentence) ||
    lower.includes("bei ihnen") ||
    lower.includes("bei euch") ||
    lower.includes("auftritt") ||
    lower.includes("positionierung")
  );
}

function tokenizeSet(value: unknown) {
  return new Set(tokens(value));
}

function setJaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function uniqueSupportFacts(facts: SupportFact[]) {
  const byKey = new Map<string, SupportFact>();
  for (const fact of facts) {
    const text = clean(fact.text, 280);
    if (!text) continue;
    const key = [
      normalizeForCompare(text),
      fact.source_kind,
      clean(fact.field_name, 80).toLowerCase(),
      clean(fact.source_url, 180).toLowerCase(),
    ].join("::");
    const current = byKey.get(key);
    if (!current || Number(fact.confidence || 0) > Number(current.confidence || 0)) {
      byKey.set(key, {
        ...fact,
        text,
      });
    }
  }
  return [...byKey.values()];
}

function supportFacts(args: {
  prospect: ProspectSignals;
  evidenceRows: EvidenceRow[];
  supportHints?: string[];
}) {
  const facts: SupportFact[] = [];
  const pushFact = (fact: SupportFact | null) => {
    if (!fact) return;
    const text = clean(fact.text, 280);
    if (!text) return;
    facts.push({
      ...fact,
      text,
      confidence: Math.max(0, Math.min(1, Number(fact.confidence || 0))),
      field_name: clean(fact.field_name, 80) || null,
      source_type: clean(fact.source_type, 24) || null,
      source_url: clean(fact.source_url, 500) || null,
    });
  };

  for (const row of args.evidenceRows || []) {
    pushFact({
      text: clean(row.field_value, 280),
      source_kind: "evidence",
      field_name: clean(row.field_name, 80) || null,
      source_type: clean(row.source_type, 24) || "research",
      source_url: clean(row.source_url, 500) || null,
      confidence: Number(row.confidence || 0.55),
    });
  }

  const contextRows: Array<[string, unknown]> = [
    ["personalization_hook", args.prospect.personalization_hook],
    ["personalization_evidence", args.prospect.personalization_evidence],
    ["target_group", args.prospect.target_group],
    ["process_hint", args.prospect.process_hint],
    ["response_promise_public", args.prospect.response_promise_public],
    ["appointment_flow_public", args.prospect.appointment_flow_public],
    ["docs_flow_public", args.prospect.docs_flow_public],
    ["company_name", args.prospect.company_name],
    ["city", args.prospect.city],
  ];
  for (const [fieldName, value] of contextRows) {
    pushFact({
      text: clean(value, 260),
      source_kind: "context",
      field_name: fieldName,
      source_type: "prospect",
      source_url: null,
      confidence: 0.52,
    });
  }

  for (const hint of args.supportHints || []) {
    pushFact({
      text: clean(hint, 260),
      source_kind: "hint",
      field_name: "support_hint",
      source_type: "strategy",
      source_url: null,
      confidence: 0.48,
    });
  }

  return uniqueSupportFacts(facts);
}

function sentenceSupportScore(sentence: string, fact: string) {
  const normalizedSentence = normalizeForCompare(sentence);
  const normalizedFact = normalizeForCompare(fact);
  if (!normalizedSentence || !normalizedFact) return 0;
  if (normalizedSentence.includes(normalizedFact.slice(0, Math.min(normalizedFact.length, 26)))) {
    return 1;
  }
  const sentenceTokens = tokenizeSet(sentence);
  const factTokens = tokenizeSet(fact);
  const overlap = setJaccard(sentenceTokens, factTokens);
  if (overlap >= 0.5) return overlap;
  let shared = 0;
  for (const token of sentenceTokens) {
    if (factTokens.has(token)) shared += 1;
  }
  if (shared >= 2) return Math.max(overlap, 0.45);
  return overlap;
}

function bestSentenceSupport(sentence: string, facts: SupportFact[]) {
  let bestScore = 0;
  let bestFact: SupportFact | null = null;
  for (const fact of facts) {
    const score = sentenceSupportScore(sentence, fact.text);
    if (
      score > bestScore ||
      (score === bestScore &&
        bestFact &&
        Number(fact.confidence || 0) > Number(bestFact.confidence || 0))
    ) {
      bestScore = score;
      bestFact = fact;
    }
  }
  return {
    score: bestScore,
    fact: bestFact,
  };
}

function buildResearchReadinessFromProspect(prospect: ProspectSignals, preferredChannel?: string | null) {
  return assessResearchReadiness({
    preferredChannel: preferredChannel || prospect.preferred_channel || null,
    contactEmail: prospect.contact_email || null,
    personalizationHook: prospect.personalization_hook || null,
    personalizationEvidence: prospect.personalization_evidence || null,
    sourceCheckedAt: prospect.source_checked_at || null,
    targetGroup: prospect.target_group || null,
    processHint: prospect.process_hint || null,
    responsePromisePublic: prospect.response_promise_public || null,
    appointmentFlowPublic: prospect.appointment_flow_public || null,
    docsFlowPublic: prospect.docs_flow_public || null,
    activeListingsCount:
      typeof prospect.active_listings_count === "number" ? prospect.active_listings_count : null,
    automationReadiness: prospect.automation_readiness || null,
    linkedinUrl: prospect.linkedin_url || null,
    linkedinSearchUrl: prospect.linkedin_search_url || null,
  });
}

export async function loadGroundedReviewContext(supabase: any, args: {
  agentId: string;
  prospectId: string;
  messageId?: string | null;
  channel?: string | null;
  messageKind?: string | null;
  segmentKey?: string | null;
  playbookKey?: string | null;
}) {
  const [evidenceRes, messagesRes, goldset] = await Promise.all([
    (supabase.from("crm_research_evidence") as any)
      .select("field_name, field_value, source_type, source_url, confidence, metadata")
      .eq("agent_id", args.agentId)
      .eq("prospect_id", args.prospectId)
      .order("confidence", { ascending: false }),
    (supabase.from("crm_outreach_messages") as any)
      .select("id, body, channel, message_kind, status, metadata")
      .eq("agent_id", args.agentId)
      .eq("prospect_id", args.prospectId)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(24),
    loadRelevantGoldsetExamples(supabase, {
      agentId: args.agentId,
      prospectId: args.prospectId,
      channel: clean(args.channel, 24) || null,
      messageKind: clean(args.messageKind, 40) || null,
      segmentKey: clean(args.segmentKey, 80) || null,
      playbookKey: clean(args.playbookKey, 120) || null,
    }).catch(() => ({
      approved_examples: [],
      rejected_examples: [],
      schema_missing: true,
    })),
  ]);

  const evidenceError = evidenceRes.error;
  const messagesError = messagesRes.error;
  return {
    evidenceRows: evidenceError ? [] : ((evidenceRes.data || []) as EvidenceRow[]),
    priorMessages: (messagesError ? [] : ((messagesRes.data || []) as PriorMessageRow[])).filter(
      (row) => String(row.id || "") !== String(args.messageId || ""),
    ),
    goldset,
    schemaMissing:
      String((evidenceError as any)?.code || "") === "42p01" ||
      String((messagesError as any)?.code || "") === "42p01",
  };
}

export function evaluateGroundedOutboundMessageQuality(args: {
  body: string;
  subject?: string | null;
  channel?: string | null;
  messageKind?: string | null;
  companyName?: string | null;
  city?: string | null;
  personalizationHook?: string | null;
  triggerEvidenceCount?: number | null;
  researchReadiness?: ResearchReadiness | null;
  prospect: ProspectSignals;
  context: GroundingContext;
  supportHints?: string[];
}) {
  const baseReview = evaluateOutboundMessageQuality({
    body: args.body,
    subject: args.subject || null,
    channel: args.channel || null,
    messageKind: args.messageKind || null,
    companyName: args.companyName || args.prospect.company_name || null,
    city: args.city || args.prospect.city || null,
    personalizationHook: args.personalizationHook || args.prospect.personalization_hook || null,
    triggerEvidenceCount: args.triggerEvidenceCount || 0,
    researchReadiness:
      args.researchReadiness ||
      buildResearchReadinessFromProspect(args.prospect, args.channel || args.prospect.preferred_channel || null),
  });

  const facts = supportFacts({
    prospect: args.prospect,
    evidenceRows: args.context.evidenceRows || [],
    supportHints: args.supportHints,
  });
  const sentences = splitSentences(normalizeBody(args.body));
  const evidenceFacts = facts.filter(
    (fact) => fact.source_kind === "evidence" && Number(fact.confidence || 0) >= 0.55,
  );
  const supportedClaims: string[] = [];
  const weakClaims: string[] = [];
  const unsupportedClaims: string[] = [];
  const citedClaims: Array<{
    claim: string;
    evidence: string;
    field_name: string | null;
    source_type: string | null;
    source_url: string | null;
  }> = [];

  for (const sentence of sentences) {
    if (!looksClaimLike(sentence)) continue;
    const directSupport = bestSentenceSupport(sentence, evidenceFacts);
    const contextualSupport = bestSentenceSupport(sentence, facts);
    if (directSupport.score >= 0.45 && directSupport.fact) {
      supportedClaims.push(sentence);
      citedClaims.push({
        claim: sentence,
        evidence: directSupport.fact.text,
        field_name: directSupport.fact.field_name,
        source_type: directSupport.fact.source_type,
        source_url: directSupport.fact.source_url,
      });
      continue;
    }
    if (contextualSupport.score >= 0.45) {
      weakClaims.push(sentence);
      continue;
    }
    unsupportedClaims.push(sentence);
  }

  const supportedCount = supportedClaims.length;
  const weakCount = weakClaims.length;
  const unsupportedCount = unsupportedClaims.length;
  const groundingRatio =
    supportedCount + weakCount + unsupportedCount > 0
      ? (supportedCount + weakCount * 0.5) / (supportedCount + weakCount + unsupportedCount)
      : supportedCount > 0
        ? 1
        : 0.6;
  let groundingScore = clamp(50 + groundingRatio * 38 - unsupportedCount * 16 - weakCount * 4 + supportedCount * 6);
  if (supportedCount === 0 && unsupportedCount > 0) groundingScore = clamp(40 - unsupportedCount * 12);
  const evidenceAlignmentScore = clamp(
    46 + supportedCount * 15 - weakCount * 6 - unsupportedCount * 20,
  );

  const bodyTokens = tokenizeSet(args.body);
  let maxSimilarity = 0;
  const similarMessageIds: string[] = [];
  for (const message of args.context.priorMessages || []) {
    const similarity = setJaccard(bodyTokens, tokenizeSet(message.body || ""));
    if (similarity > maxSimilarity) maxSimilarity = similarity;
    if (similarity >= 0.74 && message.id) {
      similarMessageIds.push(String(message.id));
    }
  }
  const noveltyScore = clamp(100 - maxSimilarity * 100);
  const goldset = evaluateGoldsetAlignment({
    body: args.body,
    subject: args.subject || null,
    context: args.context.goldset,
  });
  const hasGoldsetExamples = goldset.approved_example_count + goldset.rejected_example_count > 0;

  const blockers = [...baseReview.blockers];
  const warnings = [...baseReview.warnings];
  const strengths = [...baseReview.strengths];

  const isFirstTouch = clean(args.messageKind, 40).toLowerCase() === "first_touch";
  if (unsupportedCount >= 2 || (isFirstTouch && unsupportedCount >= 1)) {
    blockers.push("Mindestens eine konkrete Personalisierungsaussage ist nicht direkt durch gespeicherte Evidenz belegt.");
  } else if (unsupportedCount === 1) {
    warnings.push("Mindestens eine konkrete Aussage ist nicht direkt belegt und sollte geprueft werden.");
  }

  if (weakCount >= 2) {
    warnings.push("Mehrere Aussagen stuetzen sich nur auf indirekten Kontext statt auf direkte Evidenz.");
  } else if (weakCount === 1) {
    warnings.push("Eine Aussage ist nur indirekt begruendet und koennte praeziser belegt werden.");
  }

  if (supportedCount > 0) {
    strengths.push("Wesentliche Aussagen lassen sich direkt gegen gespeicherte Evidenz begruenden.");
  }

  if (maxSimilarity >= 0.86) {
    blockers.push("Der Draft ist einem frueheren Outreach fast identisch und lernt zu wenig dazu.");
  } else if (maxSimilarity >= 0.72) {
    warnings.push("Der Draft ist frueheren Nachrichten noch sehr aehnlich.");
  } else {
    strengths.push("Der Draft bringt ausreichend neue Formulierung gegenueber frueheren Touches.");
  }

  if (hasGoldsetExamples) {
    if (goldset.rejected_similarity >= 0.78) {
      blockers.push("Der Draft liegt zu nah an Nachrichten, die Sie zuvor als nicht gut genug markiert haben.");
    } else if (goldset.rejected_similarity >= 0.52) {
      warnings.push("Der Draft beruehrt Muster aus frueherem Rework.");
    }

    if (goldset.approved_similarity >= 0.28) {
      strengths.push("Der Draft liegt tonal nah an bereits freigegebenen Nachrichten.");
    }
    if (goldset.matched_reason_tags.length > 0) {
      warnings.push(`Gold-Set-Risiken: ${goldset.matched_reason_tags.join(", ")}.`);
    }
  }

  const combinedScore = hasGoldsetExamples
    ? clamp(
        baseReview.score * 0.4 +
          groundingScore * 0.18 +
          evidenceAlignmentScore * 0.14 +
          noveltyScore * 0.13 +
          goldset.score * 0.15,
      )
    : clamp(
        baseReview.score * 0.5 +
          groundingScore * 0.22 +
          evidenceAlignmentScore * 0.16 +
          noveltyScore * 0.12,
      );
  const status =
    blockers.length > 0
      ? "blocked"
      : combinedScore >= 82 && warnings.length <= 2
        ? "pass"
        : "needs_review";

  const summary =
    status === "pass"
      ? "Nachricht ist stilistisch sauber, faktisch ausreichend gestuetzt und nicht zu repetitiv."
      : status === "needs_review"
        ? "Nachricht ist brauchbar, sollte aber bei Evidenzlage oder Neuheitsgrad noch kurz geschaerft werden."
        : "Nachricht sollte vor dem Versand faktisch oder inhaltlich ueberarbeitet werden.";

  return {
    ...baseReview,
    status,
    score: combinedScore,
    summary,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    strengths: [...new Set(strengths)],
    grounding: {
      score: groundingScore,
      supported_claim_count: supportedCount,
      unsupported_claim_count: unsupportedCount,
      supported_claims: supportedClaims.slice(0, 4),
      unsupported_claims: unsupportedClaims.slice(0, 4),
      summary:
        unsupportedCount > 0 || weakCount > 0
          ? `${supportedCount} Aussagen direkt gestuetzt, ${weakCount} nur indirekt, ${unsupportedCount} ungestuetzt.`
          : `${supportedCount} Aussagen sauber direkt gestuetzt.`,
    },
    evidence_alignment: {
      score: evidenceAlignmentScore,
      cited_claim_count: supportedCount,
      weak_claim_count: weakCount,
      unsupported_claim_count: unsupportedCount,
      cited_claims: citedClaims.slice(0, 4),
      weak_claims: weakClaims.slice(0, 4),
      unsupported_claims: unsupportedClaims.slice(0, 4),
      summary:
        unsupportedCount > 0
          ? `${supportedCount} Claims direkt zitiert, ${unsupportedCount} Claims ohne harte Evidenz.`
          : weakCount > 0
            ? `${supportedCount} Claims direkt zitiert, ${weakCount} Claims nur indirekt gestuetzt.`
            : `${supportedCount} Claims direkt mit Evidenz verknuepft.`,
    },
    novelty: {
      score: noveltyScore,
      max_similarity: Math.round(maxSimilarity * 100) / 100,
      compared_message_count: (args.context.priorMessages || []).length,
      similar_message_ids: similarMessageIds.slice(0, 3),
      summary:
        maxSimilarity >= 0.72
          ? `Der Draft ist zu ${Math.round(maxSimilarity * 100)}% aehnlich zu frueheren Touches.`
          : "Der Draft unterscheidet sich ausreichend von bisherigen Touches.",
    },
    goldset,
  } satisfies OutboundQualityReview;
}

export async function persistQualityReview(supabase: any, args: {
  agentId: string;
  prospectId: string;
  messageId?: string | null;
  reviewScope: "draft_save" | "send_gate" | "sequence_draft" | "manual_recheck";
  channel?: string | null;
  messageKind?: string | null;
  review: OutboundQualityReview;
  metadata?: Record<string, any> | null;
}) {
  const { error } = await (supabase.from("crm_quality_reviews") as any).insert({
    agent_id: args.agentId,
    prospect_id: args.prospectId,
    message_id: args.messageId || null,
    review_scope: args.reviewScope,
    channel: clean(args.channel, 24) || null,
    message_kind: clean(args.messageKind, 40) || null,
    status: args.review.status,
    score: args.review.score,
    grounding_score:
      typeof args.review.grounding?.score === "number" ? Math.round(args.review.grounding.score) : null,
    novelty_score:
      typeof args.review.novelty?.score === "number" ? Math.round(args.review.novelty.score) : null,
    supported_claims: args.review.grounding?.supported_claims || [],
    unsupported_claims: args.review.grounding?.unsupported_claims || [],
    review_summary: clean(args.review.summary, 500) || null,
    metadata: {
      blockers: args.review.blockers,
      warnings: args.review.warnings,
      strengths: args.review.strengths,
      metrics: args.review.metrics,
      grounding: args.review.grounding || null,
      evidence_alignment: args.review.evidence_alignment || null,
      novelty: args.review.novelty || null,
      goldset: args.review.goldset || null,
      ...(args.metadata && typeof args.metadata === "object" ? args.metadata : {}),
    },
  });
  if (error) throw error;
}
