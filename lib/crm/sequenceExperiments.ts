export type SequenceMessageKind =
  | "first_touch"
  | "follow_up_1"
  | "follow_up_2"
  | "follow_up_3";

export type SequenceVariant = {
  kind: SequenceMessageKind;
  variant: string;
  source: "winner" | "hash";
  reason: string;
};

type SegmentWinner = {
  variant: string;
  confidence: number;
  sample_size: number;
};

type ActiveWinner = {
  variant: string;
  confidence: number;
  sample_size: number;
  segment_winners?: Record<string, SegmentWinner>;
};

const VARIANTS_BY_KIND: Record<SequenceMessageKind, string[]> = {
  first_touch: ["value_safe_start_v1", "pain_metric_v1"],
  follow_up_1: ["soft_reminder_v1", "guardrail_proof_v1"],
  follow_up_2: ["risk_reversal_v1", "pilot_next_step_v1"],
  follow_up_3: ["last_call_respectful_v1", "checkpoint_later_v1"],
};

const OUTBOUND_ACTIONS = new Set(["outbound_sent", "outbound_manual", "followup_sent"]);
const POSITIVE_ACTIONS = new Set(["reply_received", "pilot_started", "pilot_won"]);
const NEGATIVE_ACTIONS = new Set(["bounce", "opt_out", "pilot_lost"]);

function normalizeKind(value: unknown): SequenceMessageKind | null {
  const raw = String(value || "").trim().toLowerCase();
  if (
    raw === "first_touch" ||
    raw === "follow_up_1" ||
    raw === "follow_up_2" ||
    raw === "follow_up_3"
  ) {
    return raw;
  }
  return null;
}

function fnv1aHash(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function safeRate(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return numerator / denominator;
}

export function applySequenceVariantTone(args: {
  kind: SequenceMessageKind;
  variant: string;
  body: string;
}) {
  const base = String(args.body || "").trim();
  if (!base) return base;

  const tagLine =
    args.variant === "value_safe_start_v1"
      ? "\n\nStartvorschlag: zuerst mehr Freigaben, dann kontrolliert ausweiten."
      : args.variant === "pain_metric_v1"
        ? "\n\nZielbild: weniger Postfachzeit, schnellere Erstantwort, volle Nachvollziehbarkeit."
        : args.variant === "soft_reminder_v1"
          ? "\n\nWenn es gerade nicht passt, ist ein späterer Zeitpunkt völlig in Ordnung."
          : args.variant === "guardrail_proof_v1"
            ? "\n\nSicherheitslogik bleibt aktiv: klar = Auto, unklar = Freigabe, Checks vor Versand."
            : args.variant === "risk_reversal_v1"
              ? "\n\nDas Ganze funktioniert als Safe-Start ohne Risiko und ohne Systembruch."
              : args.variant === "pilot_next_step_v1"
                ? "\n\nIch kann dir dafür zwei konkrete Startkonfigurationen schicken."
                : args.variant === "last_call_respectful_v1"
                  ? "\n\nWenn kein Bedarf besteht, beenden wir den Austausch sauber."
                  : "\n\nWenn später relevant: kurzer Check-in reicht.";

  if (base.includes(tagLine.trim())) return base;
  return `${base}${tagLine}`.slice(0, 2400);
}

export async function loadActiveRolloutWinners(supabase: any, agentId: string) {
  const { data, error } = await (supabase.from("crm_sequence_rollouts") as any)
    .select("message_kind, winner_variant, confidence, sample_size, stats")
    .eq("agent_id", agentId)
    .eq("is_active", true);

  if (error) return new Map<SequenceMessageKind, ActiveWinner>();

  const map = new Map<SequenceMessageKind, ActiveWinner>();
  for (const row of (data || []) as any[]) {
    const kind = normalizeKind(row?.message_kind);
    const variant = String(row?.winner_variant || "").trim();
    if (!kind || !variant) continue;
    const stats =
      row?.stats && typeof row.stats === "object"
        ? (row.stats as Record<string, any>)
        : {};
    const rawSegmentWinners =
      stats.segment_winners && typeof stats.segment_winners === "object"
        ? (stats.segment_winners as Record<string, any>)
        : {};
    const segmentWinners: Record<string, SegmentWinner> = {};
    for (const [segmentKey, value] of Object.entries(rawSegmentWinners)) {
      if (!value || typeof value !== "object") continue;
      const v = String((value as any).variant || "").trim();
      if (!v) continue;
      segmentWinners[segmentKey] = {
        variant: v,
        confidence: Number((value as any).confidence || 0),
        sample_size: Number((value as any).sample_size || 0),
      };
    }
    map.set(kind, {
      variant,
      confidence: Number(row?.confidence || 0),
      sample_size: Number(row?.sample_size || 0),
      segment_winners: segmentWinners,
    });
  }
  return map;
}

export function chooseSequenceVariant(args: {
  agentId: string;
  prospectId: string;
  kind: SequenceMessageKind;
  segmentKey?: string | null;
  activeWinners?: Map<SequenceMessageKind, ActiveWinner>;
}) : SequenceVariant {
  const winner = args.activeWinners?.get(args.kind);
  const allowed = VARIANTS_BY_KIND[args.kind] || [];
  const segmentKey = String(args.segmentKey || "").trim();
  const segmentWinner =
    segmentKey && winner?.segment_winners ? winner.segment_winners[segmentKey] : null;
  if (
    segmentWinner &&
    allowed.includes(segmentWinner.variant) &&
    segmentWinner.sample_size >= 6 &&
    segmentWinner.confidence >= 0.55
  ) {
    return {
      kind: args.kind,
      variant: segmentWinner.variant,
      source: "winner",
      reason: `Segment-Winner aktiv (${segmentKey}, ${segmentWinner.sample_size} Samples, Confidence ${Math.round(segmentWinner.confidence * 100)}%).`,
    };
  }
  if (winner && allowed.includes(winner.variant) && winner.sample_size >= 8) {
    return {
      kind: args.kind,
      variant: winner.variant,
      source: "winner",
      reason: `Rollout-Winner aktiv (${winner.sample_size} Samples, Confidence ${Math.round(winner.confidence * 100)}%).`,
    };
  }

  const hash = fnv1aHash(`${args.agentId}:${args.prospectId}:${args.kind}`);
  const idx = allowed.length > 0 ? hash % allowed.length : 0;
  const picked = allowed[idx] || "default_v1";
  return {
    kind: args.kind,
    variant: picked,
    source: "hash",
    reason: "Deterministische Hash-Verteilung (A/B) aktiv.",
  };
}

export async function recomputeSequenceRolloutWinners(args: {
  supabase: any;
  agentId: string;
  minSamples?: number;
  lookbackDays?: number;
}) {
  const minSamples = Math.max(4, Math.min(100, Number(args.minSamples || 10)));
  const lookbackDays = Math.max(14, Math.min(365, Number(args.lookbackDays || 120)));
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await (args.supabase.from("crm_acq_activity_log") as any)
    .select("template_variant, action_type, outcome, segment_key")
    .eq("agent_id", args.agentId)
    .gte("occurred_at", sinceIso)
    .not("template_variant", "is", null)
    .limit(20000);

  if (error) {
    return { ok: false as const, error: "crm_acq_logs_fetch_failed", details: error.message };
  }

  type Stat = { attempts: number; positives: number; negatives: number };
  const stats = new Map<string, Stat>();
  const segmentStats = new Map<string, Stat>();
  const segmentKeysByKind = new Map<SequenceMessageKind, Set<string>>();

  for (const row of (data || []) as any[]) {
    const templateVariant = String(row?.template_variant || "").trim();
    if (!templateVariant.includes("__")) continue;

    const [kindRaw, variantRaw] = templateVariant.split("__", 2);
    const kind = normalizeKind(kindRaw);
    if (!kind) continue;
    const variant = String(variantRaw || "").trim();
    if (!variant) continue;

    const key = `${kind}__${variant}`;
    const entry = stats.get(key) || { attempts: 0, positives: 0, negatives: 0 };
    const segmentKey = String(row?.segment_key || "").trim() || "unknown";
    const segSet = segmentKeysByKind.get(kind) || new Set<string>();
    segSet.add(segmentKey);
    segmentKeysByKind.set(kind, segSet);
    const segmentEntryKey = `${segmentKey}::${kind}__${variant}`;
    const segmentEntry = segmentStats.get(segmentEntryKey) || {
      attempts: 0,
      positives: 0,
      negatives: 0,
    };

    const actionType = String(row?.action_type || "").toLowerCase();
    const outcome = String(row?.outcome || "").toLowerCase();
    if (OUTBOUND_ACTIONS.has(actionType)) entry.attempts += 1;
    if (POSITIVE_ACTIONS.has(actionType) || outcome === "positive") entry.positives += 1;
    if (NEGATIVE_ACTIONS.has(actionType) || outcome === "negative") entry.negatives += 1;
    if (OUTBOUND_ACTIONS.has(actionType)) segmentEntry.attempts += 1;
    if (POSITIVE_ACTIONS.has(actionType) || outcome === "positive") segmentEntry.positives += 1;
    if (NEGATIVE_ACTIONS.has(actionType) || outcome === "negative") segmentEntry.negatives += 1;

    stats.set(key, entry);
    segmentStats.set(segmentEntryKey, segmentEntry);
  }

  const rollouts: Array<{
    message_kind: SequenceMessageKind;
    winner_variant: string;
    confidence: number;
    sample_size: number;
    stats: any;
  }> = [];

  (Object.keys(VARIANTS_BY_KIND) as SequenceMessageKind[]).forEach((kind) => {
    let best: { variant: string; score: number; stat: Stat } | null = null;

    for (const variant of VARIANTS_BY_KIND[kind]) {
      const stat = stats.get(`${kind}__${variant}`) || { attempts: 0, positives: 0, negatives: 0 };
      if (stat.attempts < minSamples) continue;

      const positiveRate = safeRate(stat.positives, stat.attempts);
      const negativeRate = safeRate(stat.negatives, stat.attempts);
      const score = positiveRate - negativeRate * 0.6;

      if (!best || score > best.score) {
        best = { variant, score, stat };
      }
    }

    if (!best) return;

    const confidence = Math.max(0.05, Math.min(0.98, best.score + 0.5));
    const segmentWinners: Record<string, SegmentWinner> = {};
    const minSegmentSamples = Math.max(4, Math.min(minSamples, Math.round(minSamples * 0.6)));
    for (const segmentKey of segmentKeysByKind.get(kind) || []) {
      let bestSegment: { variant: string; score: number; stat: Stat } | null = null;
      for (const variant of VARIANTS_BY_KIND[kind]) {
        const stat =
          segmentStats.get(`${segmentKey}::${kind}__${variant}`) || {
            attempts: 0,
            positives: 0,
            negatives: 0,
          };
        if (stat.attempts < minSegmentSamples) continue;
        const positiveRate = safeRate(stat.positives, stat.attempts);
        const negativeRate = safeRate(stat.negatives, stat.attempts);
        const score = positiveRate - negativeRate * 0.6;
        if (!bestSegment || score > bestSegment.score) {
          bestSegment = { variant, score, stat };
        }
      }
      if (!bestSegment) continue;
      const confidence = Math.max(0.05, Math.min(0.98, bestSegment.score + 0.5));
      segmentWinners[segmentKey] = {
        variant: bestSegment.variant,
        confidence: Math.round(confidence * 1000) / 1000,
        sample_size: bestSegment.stat.attempts,
      };
    }

    rollouts.push({
      message_kind: kind,
      winner_variant: best.variant,
      confidence: Math.round(confidence * 1000) / 1000,
      sample_size: best.stat.attempts,
      stats: {
        attempts: best.stat.attempts,
        positives: best.stat.positives,
        negatives: best.stat.negatives,
        positive_rate: Math.round(safeRate(best.stat.positives, best.stat.attempts) * 1000) / 1000,
        negative_rate: Math.round(safeRate(best.stat.negatives, best.stat.attempts) * 1000) / 1000,
        segment_winners: segmentWinners,
        min_segment_samples: minSegmentSamples,
        min_samples: minSamples,
        lookback_days: lookbackDays,
      },
    });
  });

  for (const item of rollouts) {
    const { error: upsertErr } = await (args.supabase.from("crm_sequence_rollouts") as any).upsert(
      {
        agent_id: args.agentId,
        message_kind: item.message_kind,
        winner_variant: item.winner_variant,
        confidence: item.confidence,
        sample_size: item.sample_size,
        stats: item.stats,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agent_id,message_kind" },
    );
    if (upsertErr) {
      return {
        ok: false as const,
        error: "crm_sequence_rollout_upsert_failed",
        details: upsertErr.message,
      };
    }
  }

  return {
    ok: true as const,
    min_samples: minSamples,
    lookback_days: lookbackDays,
    winners: rollouts,
  };
}
