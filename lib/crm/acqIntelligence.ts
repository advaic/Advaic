import {
  getPlaybookForSegment,
  inferSegmentFromProspect,
  type SalesSegmentKey,
} from "@/lib/crm/salesIntelResearch";

export type AcqProspectSignals = {
  object_focus?: string | null;
  share_miete_percent?: number | null;
  share_kauf_percent?: number | null;
  active_listings_count?: number | null;
  automation_readiness?: string | null;
};

export function isNegativeOutcome(actionType: string, outcome: string | null | undefined) {
  const action = String(actionType || "").toLowerCase();
  const out = String(outcome || "").toLowerCase();
  return out === "negative" || action === "bounce" || action === "opt_out" || action === "pilot_lost";
}

export function inferSegmentAndPlaybook(signals: AcqProspectSignals | null | undefined): {
  segment_key: SalesSegmentKey;
  playbook_key: string | null;
} {
  const segmentKey = inferSegmentFromProspect(signals || {});
  const playbook = getPlaybookForSegment(segmentKey);
  return {
    segment_key: segmentKey,
    playbook_key: playbook?.key || null,
  };
}

export function computeObjectiveQualityScore(input: {
  action_type: string;
  outcome: string | null;
  response_time_hours: number | null;
  personalization_depth: number | null;
  quality_self_score: number | null;
  has_postmortem: boolean;
}) {
  let score = 52;
  const outcome = String(input.outcome || "").toLowerCase();
  const action = String(input.action_type || "").toLowerCase();

  const personalization = Number.isFinite(Number(input.personalization_depth))
    ? Math.max(0, Math.min(100, Number(input.personalization_depth)))
    : null;
  const selfScore = Number.isFinite(Number(input.quality_self_score))
    ? Math.max(0, Math.min(100, Number(input.quality_self_score)))
    : null;
  const responseHours = Number.isFinite(Number(input.response_time_hours))
    ? Math.max(0, Number(input.response_time_hours))
    : null;

  if (personalization !== null) score += personalization * 0.22;
  if (selfScore !== null) score += selfScore * 0.15;

  if (outcome === "positive") score += 18;
  else if (outcome === "neutral") score += 4;
  else if (outcome === "negative") score -= 26;

  if (responseHours !== null) {
    if (responseHours <= 1) score += 9;
    else if (responseHours <= 6) score += 6;
    else if (responseHours <= 24) score += 2;
    else if (responseHours <= 72) score -= 4;
    else score -= 10;
  }

  if (action === "reply_received" || action === "pilot_started" || action === "pilot_won") score += 8;
  if (action === "bounce" || action === "opt_out" || action === "pilot_lost") score -= 16;
  if (isNegativeOutcome(action, outcome) && input.has_postmortem) score += 6;

  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  return bounded;
}

