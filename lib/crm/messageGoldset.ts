import type { OutboundQualityReview } from "@/lib/crm/outboundQuality";

type GoldsetExampleType = "approved" | "rejected";

export type GoldsetExample = {
  id: string;
  message_id: string | null;
  prospect_id: string | null;
  strategy_decision_id: string | null;
  example_type: GoldsetExampleType;
  channel: string | null;
  message_kind: string | null;
  segment_key: string | null;
  playbook_key: string | null;
  subject: string | null;
  body: string;
  notes: string | null;
  reason_tags: string[];
  metadata: Record<string, any> | null;
  created_at: string | null;
};

export type GoldsetContext = {
  approved_examples: GoldsetExample[];
  rejected_examples: GoldsetExample[];
  schema_missing?: boolean;
};

export type GoldsetAlignment = NonNullable<OutboundQualityReview["goldset"]>;

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
  return clean(value, 7000)
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

function toTs(value: unknown) {
  const raw = clean(value, 64);
  if (!raw) return null;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function daysSince(value: unknown) {
  const ts = toTs(value);
  if (!ts) return null;
  return Math.max(0, Math.round((Date.now() - ts) / (24 * 60 * 60 * 1000)));
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
  "ihrer",
  "ihre",
  "ihnen",
  "mein",
  "mich",
  "ich",
  "bin",
  "advaic",
  "hallo",
  "guten",
  "tag",
  "makler",
  "thema",
  "gerade",
]);

function tokens(value: unknown) {
  return normalizeForCompare(value)
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length >= 4 && !STOPWORDS.has(part));
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

function wordCount(text: string) {
  return normalizeBody(text, 8000)
    .split(/\s+/)
    .map((part) => clean(part, 40))
    .filter(Boolean).length;
}

function sentenceCount(text: string) {
  return normalizeBody(text, 8000)
    .split(/[.!?]+/)
    .map((part) => clean(part, 220))
    .filter(Boolean).length;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
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

function buildReviewFromRow(row: any): OutboundQualityReview | null {
  if (!row) return null;
  const meta = asObject(row.metadata);
  return {
    status: clean(row.status, 24) as OutboundQualityReview["status"],
    score: Number.isFinite(Number(row.score)) ? Math.round(Number(row.score)) : 0,
    summary: clean(row.review_summary, 500),
    blockers: asArray(meta.blockers).map((item) => clean(item, 240)).filter(Boolean),
    warnings: asArray(meta.warnings).map((item) => clean(item, 240)).filter(Boolean),
    strengths: asArray(meta.strengths).map((item) => clean(item, 240)).filter(Boolean),
    grounding: meta.grounding && typeof meta.grounding === "object" ? meta.grounding : undefined,
    novelty: meta.novelty && typeof meta.novelty === "object" ? meta.novelty : undefined,
    metrics: meta.metrics && typeof meta.metrics === "object"
      ? meta.metrics
      : {
          word_count: wordCount(String(row.body || "")),
          sentence_count: sentenceCount(String(row.body || "")),
          question_count: String(row.body || "").includes("?") ? 1 : 0,
          has_company_reference: false,
          has_personal_signal: false,
          has_small_question: false,
          has_raw_url: false,
          has_pitch_language: false,
          trigger_evidence_count: 0,
          research_status: null,
        },
  };
}

function deriveReasonTags(args: {
  feedbackValue: "approve" | "needs_work";
  review: OutboundQualityReview | null;
  body: string;
  notes?: string | null;
}) {
  const tags = new Set<string>();
  const review = args.review;
  const notes = normalizeForCompare(args.notes);

  if (args.feedbackValue === "approve") {
    if (review?.metrics?.has_company_reference) tags.add("company_specific");
    if (review?.metrics?.has_personal_signal) tags.add("personalized");
    if (review?.metrics?.has_small_question) tags.add("soft_cta");
    if ((review?.grounding?.unsupported_claim_count || 0) === 0) tags.add("grounded");
    if ((review?.novelty?.max_similarity || 0) < 0.72) tags.add("novel");
    if ((review?.score || 0) >= 86) tags.add("strong_quality");
    if ((review?.metrics?.word_count || wordCount(args.body)) <= 95) tags.add("compact");
  } else {
    if ((review?.metrics?.word_count || wordCount(args.body)) > 95 || notes.includes("zu lang")) {
      tags.add("too_long");
    }
    if (review?.metrics?.has_pitch_language || notes.includes("sales")) {
      tags.add("salesy");
    }
    if ((review?.grounding?.unsupported_claim_count || 0) > 0 || notes.includes("beleg")) {
      tags.add("unsupported");
    }
    if ((review?.novelty?.max_similarity || 0) >= 0.72 || notes.includes("wiederholt")) {
      tags.add("repetitive");
    }
    if (
      (!review?.metrics?.has_company_reference && !review?.metrics?.has_personal_signal) ||
      notes.includes("generisch")
    ) {
      tags.add("generic");
      tags.add("thin_personalization");
    }
    if (!review?.metrics?.has_small_question || notes.includes("frage fehlt")) {
      tags.add("cta_weak");
    }
    if ((review?.metrics?.word_count || wordCount(args.body)) < 30 || notes.includes("duenn")) {
      tags.add("too_thin");
    }
  }

  return [...tags];
}

export async function syncGoldsetExampleFromFeedback(supabase: any, args: {
  agentId: string;
  messageId: string;
  feedbackValue: "approve" | "needs_work";
  notes?: string | null;
  metadata?: Record<string, any> | null;
}) {
  const [messageRes, reviewRes] = await Promise.all([
    (supabase.from("crm_outreach_messages") as any)
      .select("id, prospect_id, channel, message_kind, subject, body, metadata")
      .eq("agent_id", args.agentId)
      .eq("id", args.messageId)
      .maybeSingle(),
    (supabase.from("crm_quality_reviews") as any)
      .select("status, score, review_summary, metadata")
      .eq("agent_id", args.agentId)
      .eq("message_id", args.messageId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (messageRes.error) {
    if (isSchemaMismatch(messageRes.error as any)) return null;
    throw messageRes.error;
  }
  if (reviewRes.error && !isSchemaMismatch(reviewRes.error as any)) {
    throw reviewRes.error;
  }

  const message = messageRes.data as Record<string, any> | null;
  if (!message?.id || !clean(message.body, 20)) return null;

  const messageMeta = asObject(message.metadata);
  const review = buildReviewFromRow(reviewRes.data || null);
  const reasonTags = deriveReasonTags({
    feedbackValue: args.feedbackValue,
    review,
    body: String(message.body || ""),
    notes: args.notes || null,
  });

  const upsertPayload = {
    agent_id: args.agentId,
    message_id: String(message.id),
    prospect_id: clean(message.prospect_id, 120) || null,
    strategy_decision_id: clean(messageMeta.strategy_decision_id, 120) || null,
    example_type: args.feedbackValue === "approve" ? "approved" : "rejected",
    channel: clean(message.channel, 24) || null,
    message_kind: clean(message.message_kind, 40) || null,
    segment_key: clean(messageMeta.segment_key, 80) || null,
    playbook_key: clean(messageMeta.playbook_key, 120) || null,
    subject: clean(message.subject, 240) || null,
    body: normalizeBody(message.body, 6000),
    notes: clean(args.notes, 500) || null,
    reason_tags: reasonTags,
    metadata: {
      source: "operator_feedback",
      feedback_value: args.feedbackValue,
      feedback_metadata: args.metadata && typeof args.metadata === "object" ? args.metadata : {},
      quality_review_status: review?.status || null,
      quality_review_score: typeof review?.score === "number" ? review.score : null,
      quality_review_summary: review?.summary || null,
      captured_at: new Date().toISOString(),
    },
    is_active: true,
  };

  const { data, error } = await (supabase.from("crm_message_goldset") as any)
    .upsert(upsertPayload, { onConflict: "agent_id,message_id" })
    .select("id, message_id, example_type")
    .maybeSingle();

  if (error) {
    if (isSchemaMismatch(error as any)) return null;
    throw error;
  }
  return data || null;
}

function rankGoldsetRow(row: GoldsetExample, args: {
  prospectId?: string | null;
  channel?: string | null;
  messageKind?: string | null;
  segmentKey?: string | null;
  playbookKey?: string | null;
}) {
  let score = 0;
  if (args.prospectId && row.prospect_id === args.prospectId) score += 18;
  if (args.channel && row.channel === args.channel) score += 14;
  if (args.messageKind && row.message_kind === args.messageKind) score += 12;
  if (args.segmentKey && row.segment_key === args.segmentKey) score += 18;
  if (args.playbookKey && row.playbook_key === args.playbookKey) score += 8;
  const recencyDays = daysSince(row.created_at);
  if (recencyDays !== null) {
    score += Math.max(0, 6 - Math.floor(recencyDays / 14));
  }
  score += Math.min(4, (row.reason_tags || []).length);
  return score;
}

export async function loadRelevantGoldsetExamples(supabase: any, args: {
  agentId: string;
  prospectId?: string | null;
  channel?: string | null;
  messageKind?: string | null;
  segmentKey?: string | null;
  playbookKey?: string | null;
  perTypeLimit?: number;
}) {
  const { data, error } = await (supabase.from("crm_message_goldset") as any)
    .select(
      "id, message_id, prospect_id, strategy_decision_id, example_type, channel, message_kind, segment_key, playbook_key, subject, body, notes, reason_tags, metadata, created_at",
    )
    .eq("agent_id", args.agentId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(160);

  if (error) {
    if (isSchemaMismatch(error as any)) {
      return {
        approved_examples: [],
        rejected_examples: [],
        schema_missing: true,
      } satisfies GoldsetContext;
    }
    throw error;
  }

  const rows = ((data || []) as GoldsetExample[])
    .map((row) => ({
      ...row,
      reason_tags: asArray(row.reason_tags).map((item) => clean(item, 80)).filter(Boolean),
      metadata: asObject(row.metadata),
    }))
    .sort((a, b) => {
      const rankDiff =
        rankGoldsetRow(b, args) -
        rankGoldsetRow(a, args);
      if (rankDiff) return rankDiff;
      return (toTs(b.created_at) || 0) - (toTs(a.created_at) || 0);
    });

  const perTypeLimit = Math.max(2, Math.min(8, Math.round(args.perTypeLimit || 6)));
  return {
    approved_examples: rows
      .filter((row) => row.example_type === "approved")
      .slice(0, perTypeLimit),
    rejected_examples: rows
      .filter((row) => row.example_type === "rejected")
      .slice(0, perTypeLimit),
    schema_missing: false,
  } satisfies GoldsetContext;
}

export function evaluateGoldsetAlignment(args: {
  body: string;
  subject?: string | null;
  context: GoldsetContext | null | undefined;
}) {
  const approved = args.context?.approved_examples || [];
  const rejected = args.context?.rejected_examples || [];
  const reviewText = `${clean(args.subject, 180)} ${normalizeBody(args.body, 6000)}`.trim();
  const reviewTokens = tokenizeSet(reviewText);

  const scoreExamples = (examples: GoldsetExample[]) =>
    examples
      .map((example) => {
        const exampleText = `${clean(example.subject, 180)} ${normalizeBody(example.body, 6000)}`.trim();
        const similarity = setJaccard(reviewTokens, tokenizeSet(exampleText));
        return {
          ...example,
          similarity,
        };
      })
      .sort((a, b) => b.similarity - a.similarity);

  const approvedMatches = scoreExamples(approved);
  const rejectedMatches = scoreExamples(rejected);
  const topApproved = approvedMatches[0]?.similarity || 0;
  const topRejected = rejectedMatches[0]?.similarity || 0;
  const styleWordCount = wordCount(reviewText);
  const approvedWordAvg =
    approved.length > 0
      ? approved.reduce((sum, example) => sum + wordCount(example.body), 0) / approved.length
      : null;

  let score = 60;
  if (approved.length > 0) {
    score += Math.min(22, topApproved * 42 + approvedMatches.filter((row) => row.similarity >= 0.24).length * 3);
  }
  if (rejected.length > 0) {
    score -= Math.min(30, topRejected * 56 + rejectedMatches.filter((row) => row.similarity >= 0.24).length * 4);
  }
  if (approvedWordAvg !== null) {
    const distance = Math.abs(styleWordCount - approvedWordAvg);
    if (distance <= 16) score += 4;
    else if (distance >= 38) score -= 3;
  }

  const matchedReasonTags = [
    ...new Set(
      rejectedMatches
        .slice(0, 3)
        .filter((row) => row.similarity >= 0.2)
        .flatMap((row) => row.reason_tags || []),
    ),
  ].slice(0, 4);

  const summary =
    approved.length + rejected.length === 0
      ? "Noch kein Gold-Set vorhanden. Der Draft wird nur ueber Guardrails und Evidenz bewertet."
      : topRejected >= 0.78
        ? "Der Draft ist stilistisch sehr nah an frueher abgelehnten Nachrichten."
        : topRejected >= 0.52
          ? "Der Draft beruehrt Muster aus frueherem Rework und sollte kurz gegengeprueft werden."
          : topApproved >= 0.28
            ? "Der Draft liegt tonal nah an bereits freigegebenen Nachrichten."
            : "Das Gold-Set liefert nur schwache Aehnlichkeit; der Draft ist eher neuartig.";

  return {
    score: clamp(score),
    approved_example_count: approved.length,
    rejected_example_count: rejected.length,
    approved_similarity: Math.round(topApproved * 100) / 100,
    rejected_similarity: Math.round(topRejected * 100) / 100,
    similar_approved_message_ids: approvedMatches
      .filter((row) => row.similarity >= 0.24)
      .slice(0, 3)
      .map((row) => clean(row.message_id || row.id, 120))
      .filter(Boolean),
    similar_rejected_message_ids: rejectedMatches
      .filter((row) => row.similarity >= 0.24)
      .slice(0, 3)
      .map((row) => clean(row.message_id || row.id, 120))
      .filter(Boolean),
    matched_reason_tags: matchedReasonTags,
    summary,
  } satisfies GoldsetAlignment;
}
