import { getLocalTimingContext } from "@/lib/crm/timingPolicy";

type AcqLogRow = {
  prospect_id?: string | null;
  occurred_at?: string | null;
  channel?: string | null;
  action_type?: string | null;
  outcome?: string | null;
  template_variant?: string | null;
  segment_key?: string | null;
  playbook_key?: string | null;
  cta_type?: string | null;
  failure_reason?: string | null;
  metadata?: Record<string, any> | null;
};

export type AttributedOutboundAttempt = {
  prospect_id: string;
  sent_at: string;
  channel: string;
  action_type: string;
  template_variant: string | null;
  segment_key: string | null;
  playbook_key: string | null;
  cta_type: string | null;
  weekday: string;
  weekday_index: number;
  local_hour: number;
  hour_bucket: string;
  office_profile: string | null;
  timing_override: boolean;
  reply: boolean;
  positive: boolean;
  pilot: boolean;
  negative: boolean;
  positive_reply: boolean;
  bounce: boolean;
  opt_out: boolean;
  wrong_contact: boolean;
  response_time_hours: number | null;
  research_status: string | null;
  research_score: number | null;
  review_status: string | null;
  review_score: number | null;
  unsupported_claim_count: number;
  weak_claim_count: number;
  strategy_contact_confidence: number | null;
  strategy_risk_level: string | null;
  timing_score: number | null;
  reply_signal: string | null;
  reply_outcome: string | null;
  failure_reason: string | null;
};

const OUTBOUND_ACTIONS = new Set(["outbound_sent", "outbound_manual", "followup_sent"]);
const POSITIVE_ACTIONS = new Set(["call_booked", "pilot_started", "pilot_won"]);
const NEGATIVE_ACTIONS = new Set(["bounce", "opt_out", "pilot_lost", "no_interest"]);

function clean(value: unknown, max = 220) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function toTs(value: unknown) {
  const ts = new Date(String(value || "")).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function normalizeChannel(value: unknown) {
  const channel = clean(value, 24).toLowerCase();
  if (["email", "linkedin", "telefon", "kontaktformular", "whatsapp"].includes(channel)) {
    return channel;
  }
  return "sonstiges";
}

function normalizeOutcome(value: unknown) {
  const outcome = clean(value, 24).toLowerCase();
  if (["positive", "neutral", "negative", "pending"].includes(outcome)) return outcome;
  return "pending";
}

function enrichAttempt(row: AcqLogRow, timezone: string) {
  const context = getLocalTimingContext(new Date(String(row.occurred_at || "")), timezone);
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return {
    prospect_id: clean(row.prospect_id, 120),
    sent_at: String(row.occurred_at || ""),
    channel: normalizeChannel(row.channel),
    action_type: clean(row.action_type, 40).toLowerCase(),
    template_variant: clean(row.template_variant, 120) || null,
    segment_key: clean(row.segment_key, 80) || null,
    playbook_key: clean(row.playbook_key, 120) || null,
    cta_type: clean(row.cta_type, 80) || null,
    weekday: context.weekday,
    weekday_index: context.weekday_index,
    local_hour: context.hour,
    hour_bucket: context.hour_bucket,
    office_profile: clean(metadata.office_profile, 40) || null,
    timing_override: Boolean(metadata.timing_override),
    reply: false,
    positive: false,
    pilot: false,
    negative: false,
    positive_reply: false,
    bounce: false,
    opt_out: false,
    wrong_contact: false,
    response_time_hours: null,
    research_status: clean(metadata.research_status, 40) || null,
    research_score:
      Number.isFinite(Number(metadata.research_score)) ? Number(metadata.research_score) : null,
    review_status: clean(metadata.review_status, 40) || null,
    review_score:
      Number.isFinite(Number(metadata.review_score)) ? Number(metadata.review_score) : null,
    unsupported_claim_count: Number(metadata.unsupported_claim_count || 0) || 0,
    weak_claim_count: Number(metadata.weak_claim_count || 0) || 0,
    strategy_contact_confidence:
      Number.isFinite(Number(metadata.strategy_contact_confidence))
        ? Number(metadata.strategy_contact_confidence)
        : null,
    strategy_risk_level: clean(metadata.strategy_risk_level, 40) || null,
    timing_score:
      Number.isFinite(Number(metadata.timing_score)) ? Number(metadata.timing_score) : null,
    reply_signal: null,
    reply_outcome: null,
    failure_reason: clean(row.failure_reason, 240) || null,
  } satisfies AttributedOutboundAttempt;
}

export function attributeOutboundAttempts(rows: AcqLogRow[], timezone = "Europe/Berlin") {
  const grouped = new Map<string, AcqLogRow[]>();
  for (const row of rows || []) {
    const prospectId = clean(row?.prospect_id, 120);
    const ts = toTs(row?.occurred_at);
    if (!prospectId || !ts) continue;
    const bucket = grouped.get(prospectId) || [];
    bucket.push(row);
    grouped.set(prospectId, bucket);
  }

  const attempts: AttributedOutboundAttempt[] = [];

  for (const prospectRows of grouped.values()) {
    const ordered = [...prospectRows].sort((a, b) => (toTs(a.occurred_at) || 0) - (toTs(b.occurred_at) || 0));
    let active: AttributedOutboundAttempt | null = null;

    for (const row of ordered) {
      const actionType = clean(row.action_type, 40).toLowerCase();
      const outcome = normalizeOutcome(row.outcome);
      const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
      const rowTs = toTs(row.occurred_at) || 0;

      if (OUTBOUND_ACTIONS.has(actionType)) {
        if (active) attempts.push(active);
        active = enrichAttempt(row, timezone);
        continue;
      }

      if (!active) continue;
      const activeTs = toTs(active.sent_at) || 0;
      if (rowTs < activeTs) continue;

      if (actionType === "reply_received") {
        active.reply = true;
        if (outcome === "positive") active.positive_reply = true;
        if (outcome === "negative") active.negative = true;
        if (outcome === "positive" || outcome === "neutral") active.positive = true;
        if (typeof metadata.response_time_hours === "number" && Number.isFinite(Number(metadata.response_time_hours))) {
          active.response_time_hours = Number(metadata.response_time_hours);
        } else {
          active.response_time_hours = Math.round(((rowTs - activeTs) / 36e5) * 10) / 10;
        }
        const replySignal = clean(metadata.reply_signal, 40).toLowerCase();
        active.reply_signal = replySignal || null;
        active.reply_outcome = clean(metadata.reply_outcome, 40).toLowerCase() || null;
        if (replySignal.includes("wrong_contact")) active.wrong_contact = true;
        continue;
      }

      if (POSITIVE_ACTIONS.has(actionType) || outcome === "positive") {
        active.positive = true;
        if (actionType === "pilot_started" || actionType === "pilot_won") active.pilot = true;
        if (active.response_time_hours === null) {
          active.response_time_hours = Math.round(((rowTs - activeTs) / 36e5) * 10) / 10;
        }
      }

      if (NEGATIVE_ACTIONS.has(actionType) || outcome === "negative") {
        active.negative = true;
      }
      if (actionType === "bounce") active.bounce = true;
      if (actionType === "opt_out") active.opt_out = true;
      if (clean(metadata.reply_signal, 40).toLowerCase().includes("wrong_contact")) {
        active.wrong_contact = true;
      }
    }

    if (active) attempts.push(active);
  }

  return attempts;
}
