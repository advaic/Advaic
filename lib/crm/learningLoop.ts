import { getReplyLearningWeights } from "@/lib/crm/replyIntent";
import { attributeOutboundAttempts } from "@/lib/crm/outcomeAttribution";

type ChannelBias = {
  channel: string;
  score_adjustment: number;
  sample_size: number;
  positive_rate: number;
  negative_rate: number;
  preferred_count: number;
  wrong_contact_count: number;
  reason: string;
};

type SegmentChannelBias = {
  segment_key: string;
  channel: string;
  score_adjustment: number;
  sample_size: number;
  positive_rate: number;
  negative_rate: number;
  reason: string;
};

type VariantBias = {
  message_kind: string;
  variant: string;
  template_variant: string;
  score_adjustment: number;
  sample_size: number;
  positive_rate: number;
  negative_rate: number;
  needs_work_rate: number;
  reason: string;
};

type QualityHotspot = {
  label: string;
  type: "blocker" | "warning";
  count: number;
};

type DiscoveryBias = {
  city: string;
  discovery_source: string;
  query_pattern: string;
  score_adjustment: number;
  sample_size: number;
  accept_rate: number;
  positive_rate: number;
  negative_rate: number;
  reason: string;
};

type TimingBias = {
  channel: string;
  weekday: string;
  hour_bucket: string;
  score_adjustment: number;
  sample_size: number;
  positive_rate: number;
  negative_rate: number;
  reason: string;
};

type FailurePostmortemCause = {
  code: string;
  label: string;
  count: number;
  share: number;
  reason: string;
};

export type LearningSnapshotView = {
  id: string;
  lookback_days: number;
  computed_at: string;
  summary: {
    outbound_attempts: number;
    positive_outcomes: number;
    negative_outcomes: number;
    positive_rate: number;
    negative_rate: number;
    candidate_accept_rate: number;
    draft_approve_rate: number;
    draft_needs_work_rate: number;
    quality_pass_rate: number;
    wrong_contact_count: number;
    reply_rate: number;
    positive_reply_rate: number;
    pilot_rate: number;
    bounce_rate: number;
    avg_response_hours: number | null;
    manual_override_rate: number;
  };
  insights: {
    channel_biases: ChannelBias[];
    segment_channel_biases: SegmentChannelBias[];
    variant_biases: VariantBias[];
    discovery_biases: DiscoveryBias[];
    timing_biases: TimingBias[];
    quality_hotspots: QualityHotspot[];
    failure_postmortems: FailurePostmortemCause[];
  };
};

const OUTBOUND_ACTIONS = new Set(["outbound_sent", "outbound_manual", "followup_sent"]);
const POSITIVE_ACTIONS = new Set(["reply_received", "pilot_started", "pilot_won"]);
const NEGATIVE_ACTIONS = new Set(["bounce", "opt_out", "pilot_lost"]);

function clean(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function clamp(value: number, min = -20, max = 20) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function safeRate(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function normalizeChannel(value: unknown) {
  const channel = clean(value, 24).toLowerCase();
  if (["email", "linkedin", "telefon", "kontaktformular", "whatsapp"].includes(channel)) {
    return channel;
  }
  return "sonstiges";
}

function normalizeKind(value: unknown) {
  const raw = clean(value, 40).toLowerCase();
  if (["first_touch", "follow_up_1", "follow_up_2", "follow_up_3", "custom"].includes(raw)) {
    return raw;
  }
  return "custom";
}

function normalizeDiscoverySource(value: unknown) {
  const raw = clean(value, 40).toLowerCase();
  if (!raw) return "unknown";
  if (["duckduckgo", "google", "manual", "preset"].includes(raw)) return raw;
  return raw.slice(0, 40);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDiscoveryPattern(query: unknown, city?: unknown) {
  let raw = clean(query, 160).toLowerCase();
  if (!raw) return "unknown";
  const cityTokens = clean(city, 80)
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  for (const token of cityTokens) {
    raw = raw.replace(new RegExp(`\\b${escapeRegExp(token)}\\b`, "g"), "{city}");
  }
  raw = raw.replace(/\s+/g, " ").trim();
  if (raw.includes("immobilienmakler")) return "immobilienmakler {city}";
  if (raw.includes("makler") && raw.includes("immobilien")) return "makler {city} immobilien";
  return raw.slice(0, 80);
}

function extractDiscoveryContext(metadata: unknown) {
  const meta = asObject(metadata);
  const city = clean(meta.discovery_city, 80) || "unknown";
  const discoverySource = normalizeDiscoverySource(meta.discovery_source);
  const queryPattern = normalizeDiscoveryPattern(meta.discovery_query, city);
  const searchScore = Number.isFinite(Number(meta.search_score)) ? Number(meta.search_score) : null;
  if (discoverySource === "unknown" && queryPattern === "unknown" && city === "unknown") return null;
  return {
    city,
    discovery_source: discoverySource,
    query_pattern: queryPattern,
    search_score: searchScore,
  };
}

function splitTemplateVariant(templateVariant: string) {
  const raw = clean(templateVariant, 120);
  if (!raw) return { message_kind: "custom", variant: "unknown", template_variant: "unknown" };
  if (!raw.includes("__")) {
    return {
      message_kind: normalizeKind(raw),
      variant: raw,
      template_variant: raw,
    };
  }
  const [messageKind, variant] = raw.split("__", 2);
  return {
    message_kind: normalizeKind(messageKind),
    variant: clean(variant, 80) || "unknown",
    template_variant: raw,
  };
}

function asObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, any>) : {};
}

function mapSnapshotRow(row: any): LearningSnapshotView {
  const summary = asObject(row?.summary);
  const insights = asObject(row?.insights);
  return {
    id: clean(row?.id, 120),
    lookback_days: Number(row?.lookback_days || 120),
    computed_at: String(row?.computed_at || ""),
    summary: {
      outbound_attempts: Number(summary.outbound_attempts || 0),
      positive_outcomes: Number(summary.positive_outcomes || 0),
      negative_outcomes: Number(summary.negative_outcomes || 0),
      positive_rate: Number(summary.positive_rate || 0),
      negative_rate: Number(summary.negative_rate || 0),
      candidate_accept_rate: Number(summary.candidate_accept_rate || 0),
      draft_approve_rate: Number(summary.draft_approve_rate || 0),
      draft_needs_work_rate: Number(summary.draft_needs_work_rate || 0),
      quality_pass_rate: Number(summary.quality_pass_rate || 0),
      wrong_contact_count: Number(summary.wrong_contact_count || 0),
      reply_rate: Number(summary.reply_rate || 0),
      positive_reply_rate: Number(summary.positive_reply_rate || 0),
      pilot_rate: Number(summary.pilot_rate || 0),
      bounce_rate: Number(summary.bounce_rate || 0),
      avg_response_hours:
        Number.isFinite(Number(summary.avg_response_hours)) ? Number(summary.avg_response_hours) : null,
      manual_override_rate: Number(summary.manual_override_rate || 0),
    },
    insights: {
      channel_biases: Array.isArray(insights.channel_biases) ? (insights.channel_biases as ChannelBias[]) : [],
      segment_channel_biases: Array.isArray(insights.segment_channel_biases)
        ? (insights.segment_channel_biases as SegmentChannelBias[])
        : [],
      variant_biases: Array.isArray(insights.variant_biases) ? (insights.variant_biases as VariantBias[]) : [],
      discovery_biases: Array.isArray(insights.discovery_biases)
        ? (insights.discovery_biases as DiscoveryBias[])
        : [],
      timing_biases: Array.isArray(insights.timing_biases) ? (insights.timing_biases as TimingBias[]) : [],
      quality_hotspots: Array.isArray(insights.quality_hotspots)
        ? (insights.quality_hotspots as QualityHotspot[])
        : [],
      failure_postmortems: Array.isArray(insights.failure_postmortems)
        ? (insights.failure_postmortems as FailurePostmortemCause[])
        : [],
    },
  };
}

function classifyFailurePostmortem(args: {
  attempt: ReturnType<typeof attributeOutboundAttempts>[number];
  prospect?: Record<string, any> | null;
}) {
  const attempt = args.attempt;
  const fitScore = Number.isFinite(Number(args.prospect?.fit_score)) ? Number(args.prospect?.fit_score) : null;

  if (attempt.wrong_contact || attempt.bounce) {
    return {
      code: "wrong_contact",
      label: "Falscher Kontakt",
      reason: "Bounce oder Wrong-Contact-Signal deutet auf den falschen Ansprechpartner/Kanal hin.",
    };
  }
  if (
    (typeof attempt.strategy_contact_confidence === "number" && attempt.strategy_contact_confidence < 0.45) ||
    String(attempt.strategy_risk_level || "").toLowerCase() === "high"
  ) {
    return {
      code: "contact_risk",
      label: "Kontaktpfad zu riskant",
      reason: "Kontaktkonfidenz oder Risikolevel war schon vor Versand schwach.",
    };
  }
  if (
    String(attempt.research_status || "").toLowerCase() === "needs_research" ||
    String(attempt.research_status || "").toLowerCase() === "refresh_research" ||
    (typeof attempt.research_score === "number" && attempt.research_score < 60)
  ) {
    return {
      code: "weak_research",
      label: "Research zu schwach",
      reason: "Der Account war noch nicht belastbar genug recherchiert.",
    };
  }
  if (
    String(attempt.review_status || "").toLowerCase() === "blocked" ||
    Number(attempt.unsupported_claim_count || 0) > 0 ||
    (typeof attempt.review_score === "number" && attempt.review_score < 68)
  ) {
    return {
      code: "weak_message",
      label: "Nachricht zu schwach",
      reason: "QA oder Evidenzlage deutet auf einen unzureichenden Draft hin.",
    };
  }
  if (
    String(attempt.reply_signal || "").toLowerCase() === "timing_deferral" ||
    (typeof attempt.timing_score === "number" && attempt.timing_score < 55)
  ) {
    return {
      code: "bad_timing",
      label: "Timing unpassend",
      reason: "Zeitfenster oder Reaktionssignal deutet eher auf ein Timing-Problem hin.",
    };
  }
  if (typeof fitScore === "number" && fitScore <= 55) {
    return {
      code: "bad_lead",
      label: "Lead-Auswahl schwach",
      reason: "Selbst ohne andere rote Flaggen ist der Fit des Prospects zu niedrig.",
    };
  }
  return {
    code: "unclear",
    label: "Unklar / gemischt",
    reason: "Kein dominanter Root Cause, mehrere Faktoren kommen infrage.",
  };
}

function isSchemaMismatch(
  error: { message?: string; details?: string; hint?: string; code?: string } | null | undefined,
) {
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

export async function loadCurrentLearningSnapshot(supabase: any, agentId: string) {
  const { data, error } = await (supabase.from("crm_learning_snapshots") as any)
    .select("id, lookback_days, summary, insights, computed_at")
    .eq("agent_id", agentId)
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    if (isSchemaMismatch(error as any)) return null;
    throw error;
  }
  if (!data) return null;
  return mapSnapshotRow(data);
}

export function getChannelLearningAdjustment(
  snapshot: LearningSnapshotView | null | undefined,
  channel: string,
  segmentKey?: string | null,
) {
  if (!snapshot) return { score_adjustment: 0, reason: null as string | null };
  const normalizedChannel = normalizeChannel(channel);
  const segmentBias = snapshot.insights.segment_channel_biases.find(
    (row) => row.segment_key === clean(segmentKey, 80) && row.channel === normalizedChannel,
  );
  const overallBias = snapshot.insights.channel_biases.find((row) => row.channel === normalizedChannel);
  const scoreAdjustment = Number(segmentBias?.score_adjustment || 0) + Number(overallBias?.score_adjustment || 0);
  const reasons = [segmentBias?.reason, overallBias?.reason].filter(Boolean).join(" · ");
  return {
    score_adjustment: scoreAdjustment,
    reason: reasons || null,
  };
}

export function getVariantLearningBias(
  snapshot: LearningSnapshotView | null | undefined,
  messageKind: string,
  variant: string,
) {
  if (!snapshot) return null;
  return (
    snapshot.insights.variant_biases.find(
      (row) => row.message_kind === normalizeKind(messageKind) && row.variant === clean(variant, 80),
    ) || null
  );
}

export function getDiscoveryLearningAdjustment(
  snapshot: LearningSnapshotView | null | undefined,
  args: {
    city?: string | null;
    discoverySource?: string | null;
    query?: string | null;
  },
) {
  if (!snapshot) return { score_adjustment: 0, reason: null as string | null };
  const city = clean(args.city, 80) || "unknown";
  const discoverySource = normalizeDiscoverySource(args.discoverySource);
  const queryPattern = normalizeDiscoveryPattern(args.query, city);
  const rows = snapshot.insights.discovery_biases || [];
  if (rows.length === 0) return { score_adjustment: 0, reason: null as string | null };

  const ranked = [...rows].sort((a, b) => b.sample_size - a.sample_size || b.score_adjustment - a.score_adjustment);
  const exact = ranked.find(
    (row) =>
      row.city === city &&
      row.discovery_source === discoverySource &&
      row.query_pattern === queryPattern,
  );
  const sourcePattern = ranked.find(
    (row) => row.discovery_source === discoverySource && row.query_pattern === queryPattern,
  );
  const sourceOnly = ranked.find((row) => row.discovery_source === discoverySource);

  const seen = new Set<string>();
  let score = 0;
  const reasons: string[] = [];
  for (const [label, row, weight] of [
    ["exact", exact, 1],
    ["pattern", sourcePattern, 0.55],
    ["source", sourceOnly, 0.35],
  ] as const) {
    if (!row) continue;
    const key = `${row.city}::${row.discovery_source}::${row.query_pattern}`;
    if (seen.has(key)) continue;
    seen.add(key);
    score += Number(row.score_adjustment || 0) * weight;
    reasons.push(label === "exact" ? row.reason : `${label}: ${row.reason}`);
  }

  return {
    score_adjustment: clamp(score),
    reason: reasons[0] || null,
  };
}

export async function recomputeLearningSnapshot(args: {
  supabase: any;
  agentId: string;
  lookbackDays?: number;
}) {
  const lookbackDays = Math.max(30, Math.min(365, Number(args.lookbackDays || 120)));
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  const sinceTs = new Date(sinceIso).getTime();

  const [acqRes, feedbackRes, reviewRes, messagesRes, candidateRes, prospectRes] = await Promise.all([
    (args.supabase.from("crm_acq_activity_log") as any)
      .select("prospect_id, channel, action_type, outcome, segment_key, template_variant, metadata")
      .eq("agent_id", args.agentId)
      .gte("occurred_at", sinceIso)
      .limit(30000),
    (args.supabase.from("crm_operator_feedback") as any)
      .select("subject_type, feedback_value, metadata")
      .eq("agent_id", args.agentId)
      .gte("created_at", sinceIso)
      .limit(15000),
    (args.supabase.from("crm_quality_reviews") as any)
      .select("message_id, channel, status, score, metadata")
      .eq("agent_id", args.agentId)
      .gte("created_at", sinceIso)
      .limit(15000),
    (args.supabase.from("crm_outreach_messages") as any)
      .select("id, message_kind, metadata")
      .eq("agent_id", args.agentId)
      .gte("created_at", sinceIso)
      .limit(15000),
    (args.supabase.from("crm_prospect_candidates") as any)
      .select("id, review_status, reviewed_at, created_at, metadata")
      .eq("agent_id", args.agentId)
      .limit(12000),
    (args.supabase.from("crm_prospects") as any)
      .select("id, created_at, fit_score, priority, metadata")
      .eq("agent_id", args.agentId)
      .limit(12000),
  ]);

  const firstErr =
    acqRes.error ||
    feedbackRes.error ||
    reviewRes.error ||
    messagesRes.error ||
    candidateRes.error ||
    prospectRes.error;
  if (firstErr) {
    if (isSchemaMismatch(firstErr as any)) {
      return {
        ok: false as const,
        error: "crm_learning_schema_missing",
        details: "CRM-Learning-Schema fehlt. Bitte zuerst die passende Migration ausführen.",
      };
    }
    return {
      ok: false as const,
      error: "crm_learning_fetch_failed",
      details: firstErr.message,
    };
  }

  const channelStats = new Map<
    string,
    { attempts: number; positives: number; negatives: number; preferred: number; wrong: number }
  >();
  const segmentChannelStats = new Map<
    string,
    { segment_key: string; channel: string; attempts: number; positives: number; negatives: number }
  >();
  const variantStats = new Map<
    string,
    {
      message_kind: string;
      variant: string;
      template_variant: string;
      attempts: number;
      positives: number;
      negatives: number;
      reviews: number;
      needs_work: number;
      pass: number;
    }
  >();
  const discoveryStats = new Map<
    string,
    {
      city: string;
      discovery_source: string;
      query_pattern: string;
      reviewed: number;
      accepted: number;
      rejected: number;
      outcome_prospects: number;
      positives: number;
      negatives: number;
    }
  >();
  const prospectOutcomeStats = new Map<
    string,
    { outbound: boolean; positive: number; negative: number }
  >();
  const qualityHotspots = new Map<string, QualityHotspot>();
  const failurePostmortems = new Map<string, { code: string; label: string; count: number; reason: string }>();
  const timingStats = new Map<
    string,
    {
      channel: string;
      weekday: string;
      hour_bucket: string;
      attempts: number;
      replies: number;
      positiveReplies: number;
      positives: number;
      negatives: number;
      bounces: number;
      overrides: number;
      responseHours: number[];
    }
  >();
  const feedbackSummary = {
    candidate_accept: 0,
    candidate_reject: 0,
    draft_approve: 0,
    draft_needs_work: 0,
    wrong_contact: 0,
  };

  for (const row of (acqRes.data || []) as any[]) {
    const channel = normalizeChannel(row?.channel);
    const meta = asObject(row?.metadata);
    const entry = channelStats.get(channel) || {
      attempts: 0,
      positives: 0,
      negatives: 0,
      preferred: 0,
      wrong: 0,
    };
    const actionType = clean(row?.action_type, 40).toLowerCase();
    const outcome = clean(row?.outcome, 24).toLowerCase();
    const prospectId = clean(row?.prospect_id, 120);
    const replyWeights =
      actionType === "reply_received"
        ? getReplyLearningWeights({
            replySignal: meta.reply_signal,
            replyIntent: meta.reply_intent,
            outcome,
          })
        : null;
    const positiveIncrement =
      replyWeights?.positive ??
      (POSITIVE_ACTIONS.has(actionType) || outcome === "positive" ? 1 : 0);
    const negativeIncrement =
      replyWeights?.negative ??
      (NEGATIVE_ACTIONS.has(actionType) || outcome === "negative" ? 1 : 0);
    if (OUTBOUND_ACTIONS.has(actionType)) entry.attempts += 1;
    if (positiveIncrement > 0) entry.positives += positiveIncrement;
    if (negativeIncrement > 0) entry.negatives += negativeIncrement;
    channelStats.set(channel, entry);

    const segmentKey = clean(row?.segment_key, 80) || "unknown";
    const segmentStatKey = `${segmentKey}::${channel}`;
    const segmentEntry = segmentChannelStats.get(segmentStatKey) || {
      segment_key: segmentKey,
      channel,
      attempts: 0,
      positives: 0,
      negatives: 0,
    };
    if (OUTBOUND_ACTIONS.has(actionType)) segmentEntry.attempts += 1;
    if (positiveIncrement > 0) segmentEntry.positives += positiveIncrement;
    if (negativeIncrement > 0) segmentEntry.negatives += negativeIncrement;
    segmentChannelStats.set(segmentStatKey, segmentEntry);

    const template = splitTemplateVariant(clean(row?.template_variant, 120));
    const variantKey = `${template.message_kind}::${template.variant}`;
    const variantEntry = variantStats.get(variantKey) || {
      ...template,
      attempts: 0,
      positives: 0,
      negatives: 0,
      reviews: 0,
      needs_work: 0,
      pass: 0,
    };
    if (OUTBOUND_ACTIONS.has(actionType)) variantEntry.attempts += 1;
    if (positiveIncrement > 0) variantEntry.positives += positiveIncrement;
    if (negativeIncrement > 0) variantEntry.negatives += negativeIncrement;
    variantStats.set(variantKey, variantEntry);

    if (prospectId) {
      const flags = prospectOutcomeStats.get(prospectId) || {
        outbound: false,
        positive: 0,
        negative: 0,
      };
      if (OUTBOUND_ACTIONS.has(actionType)) flags.outbound = true;
      if (positiveIncrement > 0) flags.positive += positiveIncrement;
      if (negativeIncrement > 0) flags.negative += negativeIncrement;
      prospectOutcomeStats.set(prospectId, flags);
    }
  }

  const templateByMessageId = new Map<string, { message_kind: string; variant: string; template_variant: string }>();
  for (const row of (messagesRes.data || []) as any[]) {
    const meta = asObject(row?.metadata);
    const template = splitTemplateVariant(
      clean(meta.template_variant, 120) || clean(meta.recommended_code, 120) || clean(row?.message_kind, 40),
    );
    const messageId = clean(row?.id, 120);
    if (messageId) templateByMessageId.set(messageId, template);
  }

  for (const row of (reviewRes.data || []) as any[]) {
    const template =
      templateByMessageId.get(clean(row?.message_id, 120)) || {
        message_kind: "custom",
        variant: "unknown",
        template_variant: "unknown",
      };
    const variantKey = `${template.message_kind}::${template.variant}`;
    const variantEntry = variantStats.get(variantKey) || {
      ...template,
      attempts: 0,
      positives: 0,
      negatives: 0,
      reviews: 0,
      needs_work: 0,
      pass: 0,
    };
    variantEntry.reviews += 1;
    const status = clean(row?.status, 24).toLowerCase();
    if (status === "pass") variantEntry.pass += 1;
    if (status === "needs_review" || status === "blocked") variantEntry.needs_work += 1;
    variantStats.set(variantKey, variantEntry);

    const meta = asObject(row?.metadata);
    const blockers = Array.isArray(meta.blockers) ? meta.blockers : [];
    const warnings = Array.isArray(meta.warnings) ? meta.warnings : [];
    for (const blocker of blockers) {
      const label = clean(blocker, 180);
      if (!label) continue;
      const existing = qualityHotspots.get(`blocker:${label}`) || { label, type: "blocker" as const, count: 0 };
      existing.count += 1;
      qualityHotspots.set(`blocker:${label}`, existing);
    }
    for (const warning of warnings) {
      const label = clean(warning, 180);
      if (!label) continue;
      const existing = qualityHotspots.get(`warning:${label}`) || { label, type: "warning" as const, count: 0 };
      existing.count += 1;
      qualityHotspots.set(`warning:${label}`, existing);
    }
  }

  for (const row of (feedbackRes.data || []) as any[]) {
    const subjectType = clean(row?.subject_type, 24).toLowerCase();
    const feedbackValue = clean(row?.feedback_value, 24).toLowerCase();
    const meta = asObject(row?.metadata);
    const chosenChannel = normalizeChannel(meta.chosen_channel || meta.contact_channel || "");
    if (subjectType === "candidate" && feedbackValue === "accept") feedbackSummary.candidate_accept += 1;
    if (subjectType === "candidate" && feedbackValue === "reject") feedbackSummary.candidate_reject += 1;
    if (subjectType === "draft" && feedbackValue === "approve") feedbackSummary.draft_approve += 1;
    if (subjectType === "draft" && feedbackValue === "needs_work") feedbackSummary.draft_needs_work += 1;
    if (subjectType === "contact" && feedbackValue === "wrong_contact") feedbackSummary.wrong_contact += 1;

    if (subjectType === "contact" && chosenChannel !== "sonstiges") {
      const entry = channelStats.get(chosenChannel) || {
        attempts: 0,
        positives: 0,
        negatives: 0,
        preferred: 0,
        wrong: 0,
      };
      if (feedbackValue === "preferred") entry.preferred += 1;
      if (feedbackValue === "wrong_contact") entry.wrong += 1;
      channelStats.set(chosenChannel, entry);
    }

    if (subjectType === "strategy" && chosenChannel !== "sonstiges") {
      const entry = channelStats.get(chosenChannel) || {
        attempts: 0,
        positives: 0,
        negatives: 0,
        preferred: 0,
        wrong: 0,
      };
      if (feedbackValue === "approve") entry.preferred += 1;
      if (feedbackValue === "needs_work") entry.wrong += 1;
      channelStats.set(chosenChannel, entry);
    }
  }

  const attributedAttempts = attributeOutboundAttempts((acqRes.data || []) as any[], "Europe/Berlin");
  for (const attempt of attributedAttempts) {
    const key = `${attempt.channel}::${attempt.weekday}::${attempt.hour_bucket}`;
    const stat = timingStats.get(key) || {
      channel: attempt.channel,
      weekday: attempt.weekday,
      hour_bucket: attempt.hour_bucket,
      attempts: 0,
      replies: 0,
      positiveReplies: 0,
      positives: 0,
      negatives: 0,
      bounces: 0,
      overrides: 0,
      responseHours: [],
    };
    stat.attempts += 1;
    if (attempt.reply) stat.replies += 1;
    if (attempt.positive_reply) stat.positiveReplies += 1;
    if (attempt.positive) stat.positives += 1;
    if (attempt.negative) stat.negatives += 1;
    if (attempt.bounce) stat.bounces += 1;
    if (attempt.timing_override) stat.overrides += 1;
    if (typeof attempt.response_time_hours === "number") stat.responseHours.push(attempt.response_time_hours);
    timingStats.set(key, stat);
  }

  function getDiscoveryEntry(context: NonNullable<ReturnType<typeof extractDiscoveryContext>>) {
    const key = `${context.city}::${context.discovery_source}::${context.query_pattern}`;
    const existing = discoveryStats.get(key) || {
      city: context.city,
      discovery_source: context.discovery_source,
      query_pattern: context.query_pattern,
      reviewed: 0,
      accepted: 0,
      rejected: 0,
      outcome_prospects: 0,
      positives: 0,
      negatives: 0,
    };
    discoveryStats.set(key, existing);
    return existing;
  }

  for (const row of (candidateRes.data || []) as any[]) {
    const reviewStatus = clean(row?.review_status, 24).toLowerCase();
    if (!["promoted", "rejected", "duplicate"].includes(reviewStatus)) continue;
    const reviewedTs = row?.reviewed_at ? new Date(row.reviewed_at).getTime() : NaN;
    const createdTs = row?.created_at ? new Date(row.created_at).getTime() : NaN;
    const effectiveTs = Number.isFinite(reviewedTs) ? reviewedTs : createdTs;
    if (Number.isFinite(effectiveTs) && effectiveTs < sinceTs) continue;
    const context = extractDiscoveryContext(row?.metadata);
    if (!context) continue;
    const entry = getDiscoveryEntry(context);
    entry.reviewed += 1;
    if (reviewStatus === "promoted") entry.accepted += 1;
    else entry.rejected += 1;
  }

  for (const row of (prospectRes.data || []) as any[]) {
    const prospectId = clean(row?.id, 120);
    if (!prospectId) continue;
    const outcomeFlags = prospectOutcomeStats.get(prospectId);
    if (
      !outcomeFlags ||
      (!outcomeFlags.outbound && outcomeFlags.positive <= 0 && outcomeFlags.negative <= 0)
    ) {
      continue;
    }
    const context = extractDiscoveryContext(row?.metadata);
    if (!context) continue;
    const entry = getDiscoveryEntry(context);
    entry.outcome_prospects += 1;
    if (outcomeFlags.positive > 0) entry.positives += outcomeFlags.positive;
    if (outcomeFlags.negative > 0) entry.negatives += outcomeFlags.negative;
  }

  const channelBiases: ChannelBias[] = [...channelStats.entries()]
    .map(([channel, stat]) => {
      const positiveRate = safeRate(stat.positives, Math.max(1, stat.attempts));
      const negativeRate = safeRate(stat.negatives, Math.max(1, stat.attempts));
      const scoreAdjustment = clamp(
        positiveRate * 18 - negativeRate * 22 + safeRate(stat.preferred, stat.preferred + stat.wrong) * 8 - safeRate(stat.wrong, stat.preferred + stat.wrong) * 10,
      );
      return {
        channel,
        score_adjustment: scoreAdjustment,
        sample_size: stat.attempts,
        positive_rate: positiveRate,
        negative_rate: negativeRate,
        preferred_count: stat.preferred,
        wrong_contact_count: stat.wrong,
        reason:
          scoreAdjustment >= 0
            ? `${channel} performt stabiler als der Mittelwert.`
            : `${channel} erzeugt aktuell überdurchschnittlich viele negative Signale.`,
      };
    })
    .sort((a, b) => b.score_adjustment - a.score_adjustment);

  const discoveryBiases: DiscoveryBias[] = [...discoveryStats.values()]
    .filter((stat) => stat.reviewed > 0 || stat.outcome_prospects > 0)
    .map((stat) => {
      const acceptRate = safeRate(stat.accepted, Math.max(1, stat.reviewed));
      const rejectRate = safeRate(stat.rejected, Math.max(1, stat.reviewed));
      const positiveRate = safeRate(stat.positives, Math.max(1, stat.outcome_prospects));
      const negativeRate = safeRate(stat.negatives, Math.max(1, stat.outcome_prospects));
      const reviewConfidence = Math.min(1, stat.reviewed / 6);
      const outcomeConfidence = Math.min(1, stat.outcome_prospects / 4);
      const scoreAdjustment = clamp(
        (acceptRate * 14 - rejectRate * 10) * reviewConfidence +
          (positiveRate * 16 - negativeRate * 18) * outcomeConfidence,
      );

      const reviewedLabel = stat.reviewed
        ? `${Math.round(acceptRate * 100)}% übernommen`
        : "noch keine Review-Daten";
      const outcomeLabel = stat.outcome_prospects
        ? `${Math.round(positiveRate * 100)}% positiv · ${Math.round(negativeRate * 100)}% negativ`
        : "noch keine Outcome-Daten";

      return {
        city: stat.city,
        discovery_source: stat.discovery_source,
        query_pattern: stat.query_pattern,
        score_adjustment: scoreAdjustment,
        sample_size: stat.reviewed + stat.outcome_prospects,
        accept_rate: acceptRate,
        positive_rate: positiveRate,
        negative_rate: negativeRate,
        reason: `${reviewedLabel} · ${outcomeLabel}`,
      };
    })
    .sort((a, b) => {
      if (b.score_adjustment !== a.score_adjustment) return b.score_adjustment - a.score_adjustment;
      if (b.sample_size !== a.sample_size) return b.sample_size - a.sample_size;
      return `${a.city} ${a.query_pattern}`.localeCompare(`${b.city} ${b.query_pattern}`, "de");
    });

  const segmentChannelBiases: SegmentChannelBias[] = [...segmentChannelStats.values()]
    .filter((stat) => stat.attempts >= 4)
    .map((stat) => {
      const positiveRate = safeRate(stat.positives, Math.max(1, stat.attempts));
      const negativeRate = safeRate(stat.negatives, Math.max(1, stat.attempts));
      const scoreAdjustment = clamp(positiveRate * 22 - negativeRate * 24);
      return {
        segment_key: stat.segment_key,
        channel: stat.channel,
        score_adjustment: scoreAdjustment,
        sample_size: stat.attempts,
        positive_rate: positiveRate,
        negative_rate: negativeRate,
        reason:
          scoreAdjustment >= 0
            ? `${stat.segment_key}: ${stat.channel} konvertiert gerade besser.`
            : `${stat.segment_key}: ${stat.channel} wirkt aktuell riskanter.`,
      };
    })
    .sort((a, b) => b.score_adjustment - a.score_adjustment);

  const variantBiases: VariantBias[] = [...variantStats.values()]
    .filter((stat) => stat.attempts > 0 || stat.reviews > 0)
    .map((stat) => {
      const positiveRate = safeRate(stat.positives, Math.max(1, stat.attempts));
      const negativeRate = safeRate(stat.negatives, Math.max(1, stat.attempts));
      const needsWorkRate = safeRate(stat.needs_work, Math.max(1, stat.reviews));
      const passRate = safeRate(stat.pass, Math.max(1, stat.reviews));
      const scoreAdjustment = clamp(positiveRate * 18 - negativeRate * 20 - needsWorkRate * 12 + passRate * 6);
      return {
        message_kind: stat.message_kind,
        variant: stat.variant,
        template_variant: stat.template_variant,
        score_adjustment: scoreAdjustment,
        sample_size: Math.max(stat.attempts, stat.reviews),
        positive_rate: positiveRate,
        negative_rate: negativeRate,
        needs_work_rate: needsWorkRate,
        reason:
          scoreAdjustment >= 0
            ? `${stat.variant} liefert bessere Outcome-/Review-Signale.`
            : `${stat.variant} erzeugt zu oft Rework oder negative Outcomes.`,
      };
    })
    .sort((a, b) => b.score_adjustment - a.score_adjustment);

  const timingBiases: TimingBias[] = [...timingStats.values()]
    .filter((stat) => stat.attempts >= 2)
    .map((stat) => {
      const positiveRate = safeRate(stat.positives, Math.max(1, stat.attempts));
      const negativeRate = safeRate(stat.negatives, Math.max(1, stat.attempts));
      const replyRate = safeRate(stat.replies, Math.max(1, stat.attempts));
      const positiveReplyRate = safeRate(stat.positiveReplies, Math.max(1, stat.attempts));
      const bounceRate = safeRate(stat.bounces, Math.max(1, stat.attempts));
      const overrideRate = safeRate(stat.overrides, Math.max(1, stat.attempts));
      const scoreAdjustment = clamp(
        positiveRate * 18 +
          positiveReplyRate * 8 +
          replyRate * 4 -
          negativeRate * 22 -
          bounceRate * 10 -
          overrideRate * 4,
      );
      return {
        channel: stat.channel,
        weekday: stat.weekday,
        hour_bucket: stat.hour_bucket,
        score_adjustment: scoreAdjustment,
        sample_size: stat.attempts,
        positive_rate: positiveRate,
        negative_rate: negativeRate,
        reason:
          scoreAdjustment >= 0
            ? `${stat.weekday} ${stat.hour_bucket}: Replies/Outcomes sind hier stabiler.`
            : `${stat.weekday} ${stat.hour_bucket}: Dieser Slot performt aktuell schwächer.`,
      };
    })
    .sort((a, b) => b.score_adjustment - a.score_adjustment)
    .slice(0, 16);

  const prospectById = new Map(
    ((prospectRes.data || []) as any[]).map((row) => [clean(row?.id, 120), row]),
  );
  for (const attempt of attributedAttempts) {
    if (!attempt.negative) continue;
    const postmortem = classifyFailurePostmortem({
      attempt,
      prospect: prospectById.get(attempt.prospect_id) || null,
    });
    const existing = failurePostmortems.get(postmortem.code) || {
      code: postmortem.code,
      label: postmortem.label,
      count: 0,
      reason: postmortem.reason,
    };
    existing.count += 1;
    failurePostmortems.set(postmortem.code, existing);
  }

  const negativeAttemptCount = attributedAttempts.filter((attempt) => attempt.negative).length;
  const failurePostmortemRows: FailurePostmortemCause[] = [...failurePostmortems.values()]
    .map((row) => ({
      ...row,
      share: safeRate(row.count, Math.max(1, negativeAttemptCount)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const qualityHotspotRows = [...qualityHotspots.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const outboundAttempts = [...channelStats.values()].reduce((sum, stat) => sum + stat.attempts, 0);
  const positiveOutcomes = [...channelStats.values()].reduce((sum, stat) => sum + stat.positives, 0);
  const negativeOutcomes = [...channelStats.values()].reduce((sum, stat) => sum + stat.negatives, 0);
  const candidateReviews = feedbackSummary.candidate_accept + feedbackSummary.candidate_reject;
  const draftReviews = feedbackSummary.draft_approve + feedbackSummary.draft_needs_work;
  const totalReviews = (reviewRes.data || []).length || 0;
  const qualityPassCount = (reviewRes.data || []).filter((row: any) => clean(row?.status, 24).toLowerCase() === "pass").length;
  const replyAttempts = attributedAttempts.filter((attempt) => attempt.reply).length;
  const positiveReplyAttempts = attributedAttempts.filter((attempt) => attempt.positive_reply).length;
  const pilotAttempts = attributedAttempts.filter((attempt) => attempt.pilot).length;
  const bounceAttempts = attributedAttempts.filter((attempt) => attempt.bounce).length;
  const manualOverrideAttempts = attributedAttempts.filter((attempt) => attempt.timing_override).length;
  const responseHours = attributedAttempts
    .map((attempt) => attempt.response_time_hours)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const avgResponseHours =
    responseHours.length > 0
      ? Math.round((responseHours.reduce((sum, value) => sum + value, 0) / responseHours.length) * 10) / 10
      : null;

  const snapshotRow = {
    agent_id: args.agentId,
    is_current: true,
    lookback_days: lookbackDays,
    summary: {
      outbound_attempts: outboundAttempts,
      positive_outcomes: positiveOutcomes,
      negative_outcomes: negativeOutcomes,
      positive_rate: safeRate(positiveOutcomes, Math.max(1, outboundAttempts)),
      negative_rate: safeRate(negativeOutcomes, Math.max(1, outboundAttempts)),
      candidate_accept_rate: safeRate(feedbackSummary.candidate_accept, Math.max(1, candidateReviews)),
      draft_approve_rate: safeRate(feedbackSummary.draft_approve, Math.max(1, draftReviews)),
      draft_needs_work_rate: safeRate(feedbackSummary.draft_needs_work, Math.max(1, draftReviews)),
      quality_pass_rate: safeRate(qualityPassCount, Math.max(1, totalReviews)),
      wrong_contact_count: feedbackSummary.wrong_contact,
      reply_rate: safeRate(replyAttempts, Math.max(1, attributedAttempts.length)),
      positive_reply_rate: safeRate(positiveReplyAttempts, Math.max(1, attributedAttempts.length)),
      pilot_rate: safeRate(pilotAttempts, Math.max(1, attributedAttempts.length)),
      bounce_rate: safeRate(bounceAttempts, Math.max(1, attributedAttempts.length)),
      avg_response_hours: avgResponseHours,
      manual_override_rate: safeRate(manualOverrideAttempts, Math.max(1, attributedAttempts.length)),
    },
    insights: {
      channel_biases: channelBiases.slice(0, 10),
      segment_channel_biases: segmentChannelBiases.slice(0, 12),
      variant_biases: variantBiases.slice(0, 16),
      discovery_biases: discoveryBiases.slice(0, 16),
      timing_biases: timingBiases,
      quality_hotspots: qualityHotspotRows,
      failure_postmortems: failurePostmortemRows,
    },
    computed_at: new Date().toISOString(),
  };

  await (args.supabase.from("crm_learning_snapshots") as any)
    .update({ is_current: false })
    .eq("agent_id", args.agentId)
    .eq("is_current", true);

  const { data: inserted, error: insertErr } = await (args.supabase.from("crm_learning_snapshots") as any)
    .insert(snapshotRow)
    .select("id, lookback_days, summary, insights, computed_at")
    .single();

  if (insertErr) {
    return {
      ok: false as const,
      error: "crm_learning_snapshot_insert_failed",
      details: insertErr.message,
    };
  }

  return {
    ok: true as const,
    snapshot: mapSnapshotRow(inserted),
  };
}
