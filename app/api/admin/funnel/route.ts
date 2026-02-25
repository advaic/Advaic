import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../_guard";

export const runtime = "nodejs";

type AgentRow = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
};

type EventLite = {
  agent_id: string | null;
  entity_id: string | null;
  payload: any;
  created_at: string | null;
};

type OnboardingLite = {
  agent_id: string | null;
  current_step: number | null;
  completed_at: string | null;
  created_at: string | null;
};

type StepStat = {
  step: number;
  label: string;
  reached_agents: number;
  next_step_agents: number | null;
  conversion_to_next: number | null;
  drop_off_agents: number | null;
};

type EventStat = {
  key: string;
  label: string;
  total: number;
  unique_agents: number;
};

const STEP_LABELS: Record<number, string> = {
  1: "Willkommen",
  2: "Postfach verbinden",
  3: "Kontrolle festlegen",
  4: "Ton & Stil",
  5: "Objektdaten",
  6: "Abschluss",
};

const TRACKED_EVENTS: Array<{ key: string; label: string }> = [
  { key: "onboarding_started", label: "Onboarding gestartet" },
  { key: "onboarding_email_oauth_started", label: "OAuth gestartet" },
  { key: "onboarding_email_connected_detected", label: "Postfach verbunden" },
  { key: "onboarding_control_saved", label: "Kontrollmodus gespeichert" },
  { key: "onboarding_tone_saved", label: "Ton gespeichert" },
  { key: "onboarding_properties_confirmed", label: "Objektdaten bestätigt" },
  { key: "onboarding_completed", label: "Onboarding abgeschlossen" },
  { key: "safe_start_preset_applied", label: "Safe-Start angewendet" },
  { key: "first_value_reached", label: "First Value erreicht" },
  { key: "onboarding_recovery_reminder_sent", label: "Recovery-Reminder gesendet" },
  { key: "dashboard_home_viewed", label: "Dashboard geöffnet" },
  { key: "approval_message_approved", label: "Freigaben versendet" },
  { key: "followup_sent", label: "Follow-ups gesendet" },
];

function toIso(value: unknown): string | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const t = new Date(s);
  if (!Number.isFinite(t.getTime())) return null;
  return t.toISOString();
}

function getEventName(row: EventLite): string {
  const fromPayload = row?.payload?.event;
  if (typeof fromPayload === "string" && fromPayload.trim().length > 0) {
    return fromPayload.trim();
  }
  const fromEntity = String(row?.entity_id || "").trim();
  return fromEntity || "unknown_event";
}

function getStepFromEventName(name: string): number | null {
  const n = String(name || "").toLowerCase();
  if (n === "onboarding_started" || n === "onboarding_step_viewed") return 1;
  if (
    n === "onboarding_email_connect_clicked" ||
    n === "onboarding_email_oauth_started" ||
    n === "onboarding_email_connected_detected" ||
    n === "onboarding_email_connected_confirmed"
  ) {
    return 2;
  }
  if (n === "onboarding_control_saved") return 3;
  if (n === "onboarding_tone_saved") return 4;
  if (n === "onboarding_property_source_selected" || n === "onboarding_properties_confirmed") return 5;
  if (n === "onboarding_completed") return 6;
  return null;
}

function getStep(row: EventLite, eventName: string): number | null {
  const raw = row?.payload?.step;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const step = Math.floor(raw);
    if (step >= 1 && step <= 6) return step;
  }
  return getStepFromEventName(eventName);
}

function clampDays(value: unknown, fallback = 30) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(7, Math.min(90, Math.floor(n)));
}

function pct(num: number, den: number) {
  if (!den || den <= 0) return null;
  return num / den;
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function isValidAgentId(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function processEvents(args: {
  events: EventLite[];
  agentSet: Set<string>;
  onboardingRows: OnboardingLite[];
}) {
  const perAgent = new Map<
    string,
    {
      highest_step: number;
      started_at: string | null;
      first_value_at: string | null;
      completed_at: string | null;
      completed: boolean;
      event_count: number;
      last_event_at: string | null;
    }
  >();
  const ensure = (agentId: string) => {
    if (!perAgent.has(agentId)) {
      perAgent.set(agentId, {
        highest_step: 0,
        started_at: null,
        first_value_at: null,
        completed_at: null,
        completed: false,
        event_count: 0,
        last_event_at: null,
      });
    }
    return perAgent.get(agentId)!;
  };

  const eventTotals = new Map<string, number>();
  const eventUnique = new Map<string, Set<string>>();

  for (const row of args.events) {
    const agentId = String(row?.agent_id || "").trim();
    if (!agentId || !args.agentSet.has(agentId)) continue;

    const eventName = getEventName(row);
    const ts = toIso(row?.created_at);
    const step = getStep(row, eventName);
    const item = ensure(agentId);

    item.event_count += 1;
    if (step !== null) item.highest_step = Math.max(item.highest_step, step);

    if (eventName === "onboarding_started" || (eventName === "onboarding_step_viewed" && step === 1)) {
      if (!item.started_at || (ts && ts < item.started_at)) item.started_at = ts;
    }
    if (eventName === "onboarding_completed") {
      item.completed = true;
      item.highest_step = Math.max(item.highest_step, 6);
      if (!item.completed_at || (ts && ts < item.completed_at)) item.completed_at = ts;
    }
    if (eventName === "first_value_reached") {
      if (!item.first_value_at || (ts && ts < item.first_value_at)) item.first_value_at = ts;
    }

    if (ts) {
      if (!item.last_event_at || ts > item.last_event_at) item.last_event_at = ts;
    }

    eventTotals.set(eventName, (eventTotals.get(eventName) || 0) + 1);
    if (!eventUnique.has(eventName)) eventUnique.set(eventName, new Set());
    eventUnique.get(eventName)!.add(agentId);
  }

  for (const row of args.onboardingRows || []) {
    const agentId = String(row?.agent_id || "").trim();
    if (!agentId || !args.agentSet.has(agentId)) continue;
    const item = ensure(agentId);

    const currentStep = Number(row?.current_step || 0);
    if (Number.isFinite(currentStep)) {
      item.highest_step = Math.max(item.highest_step, Math.min(6, Math.max(0, Math.floor(currentStep))));
      if (currentStep >= 1 && !item.started_at) {
        item.started_at = toIso(row?.created_at) || item.started_at;
      }
    }

    if (row?.completed_at) {
      item.completed = true;
      item.highest_step = Math.max(item.highest_step, 6);
      const completedIso = toIso(row.completed_at);
      if (!item.completed_at || (completedIso && completedIso < item.completed_at)) item.completed_at = completedIso;
    }
  }

  const reachedCounts: number[] = Array.from({ length: 7 }, () => 0);
  for (const item of perAgent.values()) {
    const top = Math.max(0, Math.min(6, item.highest_step));
    for (let step = 1; step <= top; step += 1) reachedCounts[step] += 1;
  }

  const steps: StepStat[] = [];
  for (let step = 1; step <= 6; step += 1) {
    const reached = reachedCounts[step];
    const next = step < 6 ? reachedCounts[step + 1] : null;
    const conversion = step < 6 && next !== null ? pct(next, reached) : null;
    const drop = step < 6 && next !== null ? Math.max(0, reached - next) : null;
    steps.push({
      step,
      label: STEP_LABELS[step],
      reached_agents: reached,
      next_step_agents: next,
      conversion_to_next: conversion,
      drop_off_agents: drop,
    });
  }

  const completionHoursList: number[] = [];
  const firstValueMinutesList: number[] = [];
  let firstValueAgents = 0;
  let firstValueIn30m = 0;
  for (const item of perAgent.values()) {
    if (!item.started_at || !item.completed_at) continue;
    const started = new Date(item.started_at).getTime();
    const completed = new Date(item.completed_at).getTime();
    if (!Number.isFinite(started) || !Number.isFinite(completed) || completed < started) continue;
    completionHoursList.push((completed - started) / (1000 * 60 * 60));
  }

  for (const item of perAgent.values()) {
    if (!item.started_at || !item.first_value_at) continue;
    const started = new Date(item.started_at).getTime();
    const firstValue = new Date(item.first_value_at).getTime();
    if (!Number.isFinite(started) || !Number.isFinite(firstValue) || firstValue < started) continue;
    const minutes = (firstValue - started) / (1000 * 60);
    firstValueMinutesList.push(minutes);
    firstValueAgents += 1;
    if (minutes <= 30) firstValueIn30m += 1;
  }

  const eventStats: EventStat[] = TRACKED_EVENTS.map((ev) => ({
    key: ev.key,
    label: ev.label,
    total: eventTotals.get(ev.key) || 0,
    unique_agents: eventUnique.get(ev.key)?.size || 0,
  }));

  return {
    perAgent,
    steps,
    eventStats,
    startedAgents: steps[0]?.reached_agents || 0,
    completedAgents: eventStats.find((x) => x.key === "onboarding_completed")?.unique_agents || 0,
    medianCompletionHours: median(completionHoursList),
    firstValueAgents,
    firstValueRate: pct(firstValueAgents, steps[0]?.reached_agents || 0),
    firstValueIn30mRate: pct(firstValueIn30m, steps[0]?.reached_agents || 0),
    medianFirstValueMinutes: median(firstValueMinutesList),
  };
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const url = new URL(req.url);
  const days = clampDays(url.searchParams.get("days"), 30);
  const q = String(url.searchParams.get("q") || "")
    .trim()
    .toLowerCase();

  const nowMs = Date.now();
  const sinceIso = new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString();
  const prevSinceIso = new Date(nowMs - days * 2 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: agents }, { data: onboardingRows }, { data: eventsCurrent }, { data: eventsPrev }] = await Promise.all([
    (supa.from("agents") as any)
      .select("id, name, email, company")
      .order("created_at", { ascending: false })
      .limit(4000),
    (supa.from("agent_onboarding") as any)
      .select("agent_id, current_step, completed_at, created_at")
      .limit(4000),
    (supa.from("notification_events") as any)
      .select("agent_id, entity_id, payload, created_at")
      .eq("type", "funnel_event")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .limit(150000),
    (supa.from("notification_events") as any)
      .select("agent_id, entity_id, payload, created_at")
      .eq("type", "funnel_event")
      .gte("created_at", prevSinceIso)
      .lt("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .limit(150000),
  ]);

  const allAgents = (agents || []) as AgentRow[];
  const filteredAgents = !q
    ? allAgents
    : allAgents.filter((a) => {
        const hay = `${a.name || ""} ${a.email || ""} ${a.company || ""}`.toLowerCase();
        return hay.includes(q);
      });

  const agentMap = new Map<string, AgentRow>();
  const agentSet = new Set<string>();
  for (const a of filteredAgents) {
    const id = String(a?.id || "").trim();
    if (!id) continue;
    agentMap.set(id, a);
    agentSet.add(id);
  }

  const current = processEvents({
    events: ((eventsCurrent || []) as EventLite[]).filter((e) => isValidAgentId(e.agent_id)),
    agentSet,
    onboardingRows: (onboardingRows || []) as OnboardingLite[],
  });
  const previous = processEvents({
    events: ((eventsPrev || []) as EventLite[]).filter((e) => isValidAgentId(e.agent_id)),
    agentSet,
    onboardingRows: [],
  });

  const completionRate = pct(current.completedAgents, current.startedAgents);
  const prevCompletionRate = pct(previous.completedAgents, previous.startedAgents);
  const completionRateDelta =
    completionRate !== null && prevCompletionRate !== null
      ? completionRate - prevCompletionRate
      : null;
  const firstValueRateDelta =
    current.firstValueRate !== null && previous.firstValueRate !== null
      ? current.firstValueRate - previous.firstValueRate
      : null;

  const rows = Array.from(current.perAgent.entries())
    .map(([agentId, item]) => {
      const agent = agentMap.get(agentId);
      const completionHours =
        item.started_at && item.completed_at
          ? (new Date(item.completed_at).getTime() - new Date(item.started_at).getTime()) / (1000 * 60 * 60)
          : null;

      return {
        agent_id: agentId,
        name: agent?.name ?? null,
        email: agent?.email ?? null,
        company: agent?.company ?? null,
        highest_step: item.highest_step,
        started: item.highest_step >= 1,
        completed: item.completed,
        event_count: item.event_count,
        completion_hours:
          completionHours !== null && Number.isFinite(completionHours)
            ? Math.round(completionHours * 10) / 10
            : null,
        last_event_at: item.last_event_at,
      };
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.highest_step !== b.highest_step) return a.highest_step - b.highest_step;
      const at = new Date(String(a.last_event_at || "")).getTime();
      const bt = new Date(String(b.last_event_at || "")).getTime();
      return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0);
    });

  return NextResponse.json({
    ok: true,
    days,
    since: sinceIso,
    count_agents: filteredAgents.length,
    summary: {
      started_agents: current.startedAgents,
      completed_agents: current.completedAgents,
      completion_rate: completionRate,
      completion_rate_delta: completionRateDelta,
      median_completion_hours: current.medianCompletionHours,
      first_value_agents: current.firstValueAgents,
      first_value_rate: current.firstValueRate,
      first_value_rate_delta: firstValueRateDelta,
      first_value_in_30m_rate: current.firstValueIn30mRate,
      median_first_value_minutes: current.medianFirstValueMinutes,
      active_agents_with_events: rows.filter((r) => r.event_count > 0).length,
    },
    steps: current.steps,
    events: current.eventStats,
    rows,
  });
}
