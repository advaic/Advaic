import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { getPlaybookForSegment } from "@/lib/crm/salesIntelResearch";
import { isNegativeOutcome } from "@/lib/crm/acqIntelligence";

export const runtime = "nodejs";

type LogRow = {
  id: string;
  prospect_id: string | null;
  occurred_at: string;
  channel: string;
  action_type: string;
  segment_key: string | null;
  playbook_key: string | null;
  template_variant: string | null;
  cta_type: string | null;
  outcome: string | null;
  response_time_hours: number | null;
  personalization_depth: number | null;
  quality_self_score: number | null;
  quality_objective_score: number | null;
  failure_reason: string | null;
  winning_signal: string | null;
  hypothesis: string | null;
  analysis_note: string | null;
  postmortem_root_cause: string | null;
  postmortem_fix: string | null;
  postmortem_prevention: string | null;
};

function safeRate(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function mean(values: number[]) {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, item) => sum + item, 0) / values.length) * 10) / 10;
}

function topN(map: Map<string, number>, limit = 8) {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function hasText(value: unknown) {
  return String(value ?? "").trim().length > 0;
}

function isMissingColumnError(error: { code?: string; message?: string; details?: string } | null | undefined) {
  const code = String(error?.code || "").toLowerCase();
  const text = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return code === "42703" || text.includes("does not exist");
}

function isPositiveRow(row: LogRow) {
  const action = String(row.action_type || "").toLowerCase();
  const outcome = String(row.outcome || "").toLowerCase();
  return (
    outcome === "positive" ||
    action === "reply_received" ||
    action === "call_booked" ||
    action === "pilot_started" ||
    action === "pilot_won"
  );
}

function isNegativeRow(row: LogRow) {
  return isNegativeOutcome(String(row.action_type || ""), row.outcome);
}

function isPostmortemComplete(row: LogRow) {
  if (!isNegativeRow(row)) return true;
  return (
    hasText(row.failure_reason) &&
    hasText(row.analysis_note) &&
    hasText(row.postmortem_root_cause) &&
    hasText(row.postmortem_fix)
  );
}

function weeklyMetrics(rows: LogRow[]) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeekStart = now - weekMs;
  const prevWeekStart = now - 2 * weekMs;

  const inWindow = rows.filter((row) => {
    const ts = new Date(row.occurred_at).getTime();
    return Number.isFinite(ts) && ts >= prevWeekStart;
  });
  const thisWeekRows = inWindow.filter((row) => new Date(row.occurred_at).getTime() >= thisWeekStart);
  const prevWeekRows = inWindow.filter((row) => {
    const ts = new Date(row.occurred_at).getTime();
    return ts >= prevWeekStart && ts < thisWeekStart;
  });

  const summarize = (bucket: LogRow[]) => {
    const outbound = bucket.filter((row) =>
      ["outbound_sent", "outbound_manual", "followup_sent"].includes(String(row.action_type)),
    );
    const positives = bucket.filter((row) => isPositiveRow(row)).length;
    const negatives = bucket.filter((row) => isNegativeRow(row)).length;
    const quality = mean(
      bucket
        .map((row) => (typeof row.quality_objective_score === "number" ? row.quality_objective_score : null))
        .filter((v): v is number => typeof v === "number"),
    );
    return {
      actions: bucket.length,
      outbound_actions: outbound.length,
      positive_rate_pct: safeRate(positives, bucket.length),
      negative_rate_pct: safeRate(negatives, bucket.length),
      avg_quality_objective_score: quality,
    };
  };

  const thisWeek = summarize(thisWeekRows);
  const prevWeek = summarize(prevWeekRows);
  return {
    this_week: thisWeek,
    prev_week: prevWeek,
    delta: {
      actions: thisWeek.actions - prevWeek.actions,
      positive_rate_pp:
        Math.round((thisWeek.positive_rate_pct - prevWeek.positive_rate_pct) * 10) / 10,
      negative_rate_pp:
        Math.round((thisWeek.negative_rate_pct - prevWeek.negative_rate_pct) * 10) / 10,
      quality_objective_delta:
        Math.round(
          ((thisWeek.avg_quality_objective_score || 0) - (prevWeek.avg_quality_objective_score || 0)) * 10,
        ) / 10,
    },
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const days = Math.max(14, Math.min(365, Number(url.searchParams.get("days") || 90)));
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createSupabaseAdminClient();
  let { data, error } = await (supabase.from("crm_acq_activity_log") as any)
    .select(
      "id, prospect_id, occurred_at, channel, action_type, segment_key, playbook_key, template_variant, cta_type, outcome, response_time_hours, personalization_depth, quality_self_score, quality_objective_score, failure_reason, winning_signal, hypothesis, analysis_note, postmortem_root_cause, postmortem_fix, postmortem_prevention",
    )
    .eq("agent_id", auth.user.id)
    .gte("occurred_at", sinceIso)
    .order("occurred_at", { ascending: false })
    .limit(10000);

  if (error && isMissingColumnError(error)) {
    const fallback = await (supabase.from("crm_acq_activity_log") as any)
      .select(
        "id, prospect_id, occurred_at, channel, action_type, template_variant, cta_type, outcome, response_time_hours, personalization_depth, quality_self_score, failure_reason, winning_signal, hypothesis, analysis_note, metadata",
      )
      .eq("agent_id", auth.user.id)
      .gte("occurred_at", sinceIso)
      .order("occurred_at", { ascending: false })
      .limit(10000);

    if (fallback.error) {
      return NextResponse.json(
        { ok: false, error: "crm_acq_analysis_failed", details: fallback.error.message },
        { status: 500 },
      );
    }

    data = ((fallback.data || []) as any[]).map((row) => ({
      ...row,
      segment_key: row?.metadata?.segment_key || null,
      playbook_key: row?.metadata?.playbook_key || null,
      quality_objective_score:
        typeof row?.metadata?.quality_objective_score === "number"
          ? row.metadata.quality_objective_score
          : null,
      postmortem_root_cause: row?.metadata?.postmortem_root_cause || null,
      postmortem_fix: row?.metadata?.postmortem_fix || null,
      postmortem_prevention: row?.metadata?.postmortem_prevention || null,
    }));
    error = null as any;
  }

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_acq_analysis_failed", details: error.message },
      { status: 500 },
    );
  }

  const rows = (data || []) as LogRow[];
  const sentRows = rows.filter((row) =>
    ["outbound_sent", "outbound_manual", "followup_sent"].includes(String(row.action_type)),
  );
  const replyRows = rows.filter((row) => String(row.action_type) === "reply_received");
  const pilotRows = rows.filter((row) =>
    ["pilot_started", "pilot_won"].includes(String(row.action_type)),
  );
  const negativeRows = rows.filter((row) => isNegativeRow(row));
  const postmortemMissingRows = negativeRows.filter((row) => !isPostmortemComplete(row));

  const touchedProspects = new Set(
    sentRows.map((row) => String(row.prospect_id || "")).filter(Boolean),
  );
  const replyProspects = new Set(
    replyRows.map((row) => String(row.prospect_id || "")).filter(Boolean),
  );
  const pilotProspects = new Set(
    pilotRows.map((row) => String(row.prospect_id || "")).filter(Boolean),
  );

  const byChannel = new Map<
    string,
    {
      attempts: number;
      positive: number;
      negative: number;
      pending: number;
      responseHours: number[];
      personalization: number[];
      qualitySelf: number[];
      qualityObjective: number[];
    }
  >();
  const byTemplate = new Map<
    string,
    {
      attempts: number;
      positive: number;
      negative: number;
      pending: number;
    }
  >();
  const bySegment = new Map<
    string,
    {
      attempts: number;
      positive: number;
      negative: number;
      qualityObjective: number[];
      playbookKey: string | null;
    }
  >();
  const byPlaybook = new Map<
    string,
    {
      attempts: number;
      positive: number;
      negative: number;
    }
  >();
  const byCta = new Map<
    string,
    {
      attempts: number;
      positive: number;
      negative: number;
      pending: number;
    }
  >();
  const byHypothesis = new Map<
    string,
    {
      attempts: number;
      positive: number;
      negative: number;
      pending: number;
    }
  >();
  const failureReasons = new Map<string, number>();
  const winningSignals = new Map<string, number>();

  for (const row of rows) {
    const channel = String(row.channel || "sonstiges");
    const template = String(row.template_variant || "unknown");
    const segment = String(row.segment_key || "unspezifisch");
    const playbook = String(row.playbook_key || "none");
    const cta = String(row.cta_type || "none");
    const hypothesis = String(row.hypothesis || "unspecified");
    const positive = isPositiveRow(row);
    const negative = isNegativeRow(row);

    const channelEntry = byChannel.get(channel) || {
      attempts: 0,
      positive: 0,
      negative: 0,
      pending: 0,
      responseHours: [],
      personalization: [],
      qualitySelf: [],
      qualityObjective: [],
    };
    channelEntry.attempts += 1;
    if (positive) channelEntry.positive += 1;
    else if (negative) channelEntry.negative += 1;
    else channelEntry.pending += 1;
    if (typeof row.response_time_hours === "number") channelEntry.responseHours.push(row.response_time_hours);
    if (typeof row.personalization_depth === "number") channelEntry.personalization.push(row.personalization_depth);
    if (typeof row.quality_self_score === "number") channelEntry.qualitySelf.push(row.quality_self_score);
    if (typeof row.quality_objective_score === "number") channelEntry.qualityObjective.push(row.quality_objective_score);
    byChannel.set(channel, channelEntry);

    const templateEntry = byTemplate.get(template) || {
      attempts: 0,
      positive: 0,
      negative: 0,
      pending: 0,
    };
    templateEntry.attempts += 1;
    if (positive) templateEntry.positive += 1;
    else if (negative) templateEntry.negative += 1;
    else templateEntry.pending += 1;
    byTemplate.set(template, templateEntry);

    const segmentEntry = bySegment.get(segment) || {
      attempts: 0,
      positive: 0,
      negative: 0,
      qualityObjective: [],
      playbookKey: row.playbook_key || null,
    };
    segmentEntry.attempts += 1;
    if (positive) segmentEntry.positive += 1;
    if (negative) segmentEntry.negative += 1;
    if (typeof row.quality_objective_score === "number") {
      segmentEntry.qualityObjective.push(row.quality_objective_score);
    }
    if (!segmentEntry.playbookKey && row.playbook_key) {
      segmentEntry.playbookKey = row.playbook_key;
    }
    bySegment.set(segment, segmentEntry);

    const playbookEntry = byPlaybook.get(playbook) || {
      attempts: 0,
      positive: 0,
      negative: 0,
    };
    playbookEntry.attempts += 1;
    if (positive) playbookEntry.positive += 1;
    if (negative) playbookEntry.negative += 1;
    byPlaybook.set(playbook, playbookEntry);

    const ctaEntry = byCta.get(cta) || {
      attempts: 0,
      positive: 0,
      negative: 0,
      pending: 0,
    };
    ctaEntry.attempts += 1;
    if (positive) ctaEntry.positive += 1;
    else if (negative) ctaEntry.negative += 1;
    else ctaEntry.pending += 1;
    byCta.set(cta, ctaEntry);

    const hypoEntry = byHypothesis.get(hypothesis) || {
      attempts: 0,
      positive: 0,
      negative: 0,
      pending: 0,
    };
    hypoEntry.attempts += 1;
    if (positive) hypoEntry.positive += 1;
    else if (negative) hypoEntry.negative += 1;
    else hypoEntry.pending += 1;
    byHypothesis.set(hypothesis, hypoEntry);

    if (row.failure_reason) {
      const key = String(row.failure_reason).trim();
      if (key) failureReasons.set(key, (failureReasons.get(key) || 0) + 1);
    }
    if (row.winning_signal) {
      const key = String(row.winning_signal).trim();
      if (key) winningSignals.set(key, (winningSignals.get(key) || 0) + 1);
    }
  }

  const channel_metrics = [...byChannel.entries()]
    .map(([channel, stat]) => ({
      channel,
      attempts: stat.attempts,
      positive: stat.positive,
      negative: stat.negative,
      pending: stat.pending,
      positive_rate_pct: safeRate(stat.positive, stat.attempts),
      avg_response_hours: mean(stat.responseHours),
      avg_personalization_depth: mean(stat.personalization),
      avg_quality_self_score: mean(stat.qualitySelf),
      avg_quality_objective_score: mean(stat.qualityObjective),
    }))
    .sort((a, b) => b.attempts - a.attempts);

  const template_metrics = [...byTemplate.entries()]
    .map(([template_variant, stat]) => ({
      template_variant,
      attempts: stat.attempts,
      positive: stat.positive,
      negative: stat.negative,
      pending: stat.pending,
      positive_rate_pct: safeRate(stat.positive, stat.attempts),
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 24);

  const segment_metrics = [...bySegment.entries()]
    .map(([segment_key, stat]) => {
      const playbook = getPlaybookForSegment(segment_key as any);
      return {
        segment_key,
        attempts: stat.attempts,
        positive_rate_pct: safeRate(stat.positive, stat.attempts),
        negative_rate_pct: safeRate(stat.negative, stat.attempts),
        avg_quality_objective_score: mean(stat.qualityObjective),
        playbook_key: stat.playbookKey || null,
        playbook_title: playbook?.title || null,
      };
    })
    .sort((a, b) => b.attempts - a.attempts);

  const playbook_metrics = [...byPlaybook.entries()]
    .map(([playbook_key, stat]) => ({
      playbook_key,
      attempts: stat.attempts,
      positive_rate_pct: safeRate(stat.positive, stat.attempts),
      negative_rate_pct: safeRate(stat.negative, stat.attempts),
    }))
    .sort((a, b) => b.attempts - a.attempts);

  const cta_metrics = [...byCta.entries()]
    .map(([cta_type, stat]) => ({
      cta_type,
      attempts: stat.attempts,
      positive: stat.positive,
      negative: stat.negative,
      pending: stat.pending,
      positive_rate_pct: safeRate(stat.positive, stat.attempts),
    }))
    .sort((a, b) => b.attempts - a.attempts);

  const hypothesis_metrics = [...byHypothesis.entries()]
    .map(([hypothesis, stat]) => ({
      hypothesis,
      attempts: stat.attempts,
      positive_rate_pct: safeRate(stat.positive, stat.attempts),
      negative_rate_pct: safeRate(stat.negative, stat.attempts),
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 12);

  const top_failure_reasons = topN(failureReasons, 10);
  const top_winning_signals = topN(winningSignals, 10);

  const avgSelf = mean(
    rows
      .map((row) => (typeof row.quality_self_score === "number" ? row.quality_self_score : null))
      .filter((v): v is number => typeof v === "number"),
  );
  const avgObjective = mean(
    rows
      .map((row) =>
        typeof row.quality_objective_score === "number" ? row.quality_objective_score : null,
      )
      .filter((v): v is number => typeof v === "number"),
  );

  const weekly_review = weeklyMetrics(rows);
  const postmortem_compliance_pct = safeRate(
    negativeRows.length - postmortemMissingRows.length,
    Math.max(negativeRows.length, 1),
  );

  const insights: string[] = [];
  if (segment_metrics[0]) {
    insights.push(
      `Größtes Segment: ${segment_metrics[0].segment_key} (${segment_metrics[0].attempts} Aktionen, ${segment_metrics[0].positive_rate_pct}% positiv).`,
    );
  }
  if (top_failure_reasons[0]) {
    insights.push(
      `Häufigster Ausfallgrund: ${top_failure_reasons[0].label} (${top_failure_reasons[0].count}x).`,
    );
  }
  if (top_winning_signals[0]) {
    insights.push(
      `Stärkstes Gewinnsignal: ${top_winning_signals[0].label} (${top_winning_signals[0].count}x).`,
    );
  }
  if (weekly_review.delta.positive_rate_pp < 0) {
    insights.push(
      `Wochenvergleich: positive Rate ist um ${Math.abs(weekly_review.delta.positive_rate_pp)} Prozentpunkte gefallen.`,
    );
  }

  const learning_recommendations: Array<{
    id: string;
    priority: "hoch" | "mittel" | "niedrig";
    title: string;
    reason: string;
    action: string;
    segment_key?: string;
  }> = [];

  if (negativeRows.length > 0 && postmortem_compliance_pct < 90) {
    learning_recommendations.push({
      id: "postmortem_compliance",
      priority: "hoch",
      title: "Postmortems konsequent vollständig führen",
      reason: `Nur ${postmortem_compliance_pct}% der negativen Outcomes sind vollständig dokumentiert.`,
      action:
        "Bei jedem negativen Outcome verpflichtend Root Cause + konkrete Korrekturmaßnahme ergänzen.",
    });
  }

  const weakestSegment = segment_metrics.find(
    (item) => item.attempts >= 5 && item.negative_rate_pct >= 25,
  );
  if (weakestSegment) {
    learning_recommendations.push({
      id: "segment_playbook_tuning",
      priority: "hoch",
      title: `Segment-Playbook für ${weakestSegment.segment_key} nachschärfen`,
      reason: `${weakestSegment.negative_rate_pct}% negative Outcomes bei ${weakestSegment.attempts} Aktionen.`,
      action:
        "Hook und CTA dieses Segments neu testen, Follow-up-Frequenz reduzieren und Objection-Handling konkretisieren.",
      segment_key: weakestSegment.segment_key,
    });
  }

  if (weekly_review.delta.positive_rate_pp <= -5) {
    learning_recommendations.push({
      id: "weekly_drop_recovery",
      priority: "mittel",
      title: "Wochenabfall aktiv gegensteuern",
      reason: `Positive Rate fiel um ${Math.abs(weekly_review.delta.positive_rate_pp)} Prozentpunkte zur Vorwoche.`,
      action:
        "Nur die zwei stärksten Varianten senden, schwache Varianten pausieren und nach 7 Tagen erneut messen.",
    });
  }

  const bestTemplate = template_metrics.find((item) => item.attempts >= 4 && item.positive_rate_pct >= 40);
  if (bestTemplate) {
    learning_recommendations.push({
      id: "template_scale",
      priority: "mittel",
      title: `Gewinner-Variante ${bestTemplate.template_variant} skalieren`,
      reason: `${bestTemplate.positive_rate_pct}% positive Outcomes bei ${bestTemplate.attempts} Aktionen.`,
      action:
        "Diese Variante als Standard für ähnliche Segmente nutzen und nur den Personalisierungs-Hook austauschen.",
    });
  }

  if (avgSelf !== null && avgObjective !== null && avgSelf - avgObjective >= 15) {
    learning_recommendations.push({
      id: "score_calibration",
      priority: "niedrig",
      title: "Selbstbewertung objektiv kalibrieren",
      reason: `Selbstscore liegt im Schnitt um ${Math.round(avgSelf - avgObjective)} Punkte über dem objektiven Score.`,
      action:
        "QA-Rubrik in der Akquise auf objektive Kriterien (Outcome, Antwortzeit, Risiko) ausrichten.",
    });
  }

  return NextResponse.json({
    ok: true,
    days,
    summary: {
      total_actions: rows.length,
      outbound_actions: sentRows.length,
      reply_events: replyRows.length,
      pilot_events: pilotRows.length,
      negative_events: negativeRows.length,
      touched_prospects: touchedProspects.size,
      reply_rate_pct: safeRate(replyProspects.size, touchedProspects.size),
      pilot_rate_pct: safeRate(pilotProspects.size, touchedProspects.size),
      negative_rate_pct: safeRate(negativeRows.length, rows.length),
      postmortem_compliance_pct,
      avg_quality_self_score: avgSelf,
      avg_quality_objective_score: avgObjective,
      quality_score_gap:
        avgSelf !== null && avgObjective !== null ? Math.round((avgSelf - avgObjective) * 10) / 10 : null,
    },
    channel_metrics,
    template_metrics,
    segment_metrics,
    playbook_metrics,
    cta_metrics,
    hypothesis_metrics,
    top_failure_reasons,
    top_winning_signals,
    weekly_review,
    learning_recommendations,
    insights,
  });
}
