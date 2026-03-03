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

type BillingSourceStat = {
  source: string;
  gate_triggered: number;
  cta_clicked: number;
  page_viewed: number;
  checkout_started: number;
  checkout_success: number;
  cta_from_gate: number | null;
  page_from_cta: number | null;
  checkout_from_cta: number | null;
  to_checkout_from_page: number | null;
  to_success_from_checkout: number | null;
  to_success_from_page: number | null;
};

type BillingSourceGroupStat = {
  group: string;
  sources: number;
  gate_triggered: number;
  cta_clicked: number;
  page_viewed: number;
  checkout_started: number;
  checkout_success: number;
  cta_from_gate: number | null;
  page_from_cta: number | null;
  checkout_from_cta: number | null;
  to_checkout_from_page: number | null;
  to_success_from_checkout: number | null;
  to_success_from_page: number | null;
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
  { key: "trial_upgrade_reminder_sent", label: "Trial-Upgrade-Reminder gesendet" },
  { key: "billing_upgrade_page_viewed", label: "Abo-Seite geöffnet" },
  { key: "billing_upgrade_gate_triggered", label: "Upgrade-Gate ausgelöst" },
  { key: "billing_upgrade_cta_clicked", label: "Upgrade-CTA geklickt" },
  { key: "billing_checkout_started", label: "Checkout gestartet" },
  { key: "billing_portal_opened", label: "Billing-Portal geöffnet" },
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

function sourceOfEvent(row: EventLite): string {
  const payload = row?.payload && typeof row.payload === "object" ? row.payload : {};
  const meta = payload?.meta && typeof payload.meta === "object" ? payload.meta : {};

  const metaSource = typeof meta.source === "string" ? meta.source.trim() : "";
  if (metaSource) return metaSource;

  const payloadSource = typeof payload.source === "string" ? payload.source.trim() : "";
  if (payloadSource) return payloadSource;

  const path = typeof payload.path === "string" ? payload.path.trim() : "";
  if (path) return `path:${path}`;

  return "unknown";
}

function sourceGroupOf(rawSource: string): string {
  const source = String(rawSource || "").trim().toLowerCase();
  if (!source) return "unknown";
  if (source.startsWith("path:")) return "path";
  if (source.startsWith("dashboard_")) return "dashboard";
  if (source.startsWith("sidebar_")) return "sidebar";
  if (source.startsWith("konto_")) return "konto";
  if (source.startsWith("approval_")) return "freigabe";
  if (source.startsWith("nachrichten_")) return "nachrichten";
  if (source.startsWith("followups_")) return "followups";
  if (source.startsWith("onboarding_")) return "onboarding";
  if (source.startsWith("public_") || source.startsWith("website_")) return "public";
  if (source.startsWith("ops_")) return "ops";
  return "sonstige";
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

  const billingEvents = ((eventsCurrent || []) as EventLite[])
    .filter((e) => isValidAgentId(e.agent_id))
    .map((row) => ({ name: getEventName(row), source: sourceOfEvent(row) }))
    .filter(
      (row) =>
        row.name === "billing_upgrade_gate_triggered" ||
        row.name === "billing_upgrade_cta_clicked" ||
        row.name === "billing_upgrade_page_viewed" ||
        row.name === "billing_checkout_started" ||
        row.name === "billing_checkout_return_success",
    );

  const bySource = new Map<string, BillingSourceStat>();
  const ensureSource = (source: string) => {
    const key = source || "unknown";
    if (!bySource.has(key)) {
      bySource.set(key, {
        source: key,
        gate_triggered: 0,
        cta_clicked: 0,
        page_viewed: 0,
        checkout_started: 0,
        checkout_success: 0,
        cta_from_gate: null,
        page_from_cta: null,
        checkout_from_cta: null,
        to_checkout_from_page: null,
        to_success_from_checkout: null,
        to_success_from_page: null,
      });
    }
    return bySource.get(key)!;
  };

  for (const ev of billingEvents) {
    const row = ensureSource(ev.source);
    if (ev.name === "billing_upgrade_gate_triggered") row.gate_triggered += 1;
    if (ev.name === "billing_upgrade_cta_clicked") row.cta_clicked += 1;
    if (ev.name === "billing_upgrade_page_viewed") row.page_viewed += 1;
    if (ev.name === "billing_checkout_started") row.checkout_started += 1;
    if (ev.name === "billing_checkout_return_success") row.checkout_success += 1;
  }

  const billingSources = Array.from(bySource.values())
    .map((row) => ({
      ...row,
      cta_from_gate: pct(row.cta_clicked, row.gate_triggered),
      page_from_cta: pct(row.page_viewed, row.cta_clicked),
      checkout_from_cta: pct(row.checkout_started, row.cta_clicked),
      to_checkout_from_page: pct(row.checkout_started, row.page_viewed),
      to_success_from_checkout: pct(row.checkout_success, row.checkout_started),
      to_success_from_page: pct(row.checkout_success, row.page_viewed),
    }))
    .sort((a, b) => {
      if (b.checkout_started !== a.checkout_started) {
        return b.checkout_started - a.checkout_started;
      }
      if (b.page_viewed !== a.page_viewed) return b.page_viewed - a.page_viewed;
      return b.cta_clicked - a.cta_clicked;
    });

  const byGroup = new Map<string, BillingSourceGroupStat>();
  for (const row of billingSources) {
    const group = sourceGroupOf(row.source);
    if (!byGroup.has(group)) {
      byGroup.set(group, {
        group,
        sources: 0,
        gate_triggered: 0,
        cta_clicked: 0,
        page_viewed: 0,
        checkout_started: 0,
        checkout_success: 0,
        cta_from_gate: null,
        page_from_cta: null,
        checkout_from_cta: null,
        to_checkout_from_page: null,
        to_success_from_checkout: null,
        to_success_from_page: null,
      });
    }
    const bucket = byGroup.get(group)!;
    bucket.sources += 1;
    bucket.gate_triggered += row.gate_triggered;
    bucket.cta_clicked += row.cta_clicked;
    bucket.page_viewed += row.page_viewed;
    bucket.checkout_started += row.checkout_started;
    bucket.checkout_success += row.checkout_success;
  }

  const billingGroups = Array.from(byGroup.values())
    .map((row) => ({
      ...row,
      cta_from_gate: pct(row.cta_clicked, row.gate_triggered),
      page_from_cta: pct(row.page_viewed, row.cta_clicked),
      checkout_from_cta: pct(row.checkout_started, row.cta_clicked),
      to_checkout_from_page: pct(row.checkout_started, row.page_viewed),
      to_success_from_checkout: pct(row.checkout_success, row.checkout_started),
      to_success_from_page: pct(row.checkout_success, row.page_viewed),
    }))
    .sort((a, b) => {
      if (b.checkout_started !== a.checkout_started) {
        return b.checkout_started - a.checkout_started;
      }
      return b.page_viewed - a.page_viewed;
    });

  const billingSummary = {
    total_gate_triggered: billingSources.reduce((sum, row) => sum + row.gate_triggered, 0),
    total_cta_clicked: billingSources.reduce((sum, row) => sum + row.cta_clicked, 0),
    total_page_viewed: billingSources.reduce((sum, row) => sum + row.page_viewed, 0),
    total_checkout_started: billingSources.reduce(
      (sum, row) => sum + row.checkout_started,
      0,
    ),
    total_checkout_success: billingSources.reduce(
      (sum, row) => sum + row.checkout_success,
      0,
    ),
    overall_to_checkout_from_page: pct(
      billingSources.reduce((sum, row) => sum + row.checkout_started, 0),
      billingSources.reduce((sum, row) => sum + row.page_viewed, 0),
    ),
    overall_to_success_from_checkout: pct(
      billingSources.reduce((sum, row) => sum + row.checkout_success, 0),
      billingSources.reduce((sum, row) => sum + row.checkout_started, 0),
    ),
    overall_to_success_from_page: pct(
      billingSources.reduce((sum, row) => sum + row.checkout_success, 0),
      billingSources.reduce((sum, row) => sum + row.page_viewed, 0),
    ),
  };

  const billingEventsPrev = ((eventsPrev || []) as EventLite[])
    .filter((e) => isValidAgentId(e.agent_id))
    .map((row) => ({ name: getEventName(row) }))
    .filter(
      (row) =>
        row.name === "billing_upgrade_page_viewed" ||
        row.name === "billing_checkout_started" ||
        row.name === "billing_checkout_return_success",
    );

  const prevPageViewed = billingEventsPrev.filter(
    (row) => row.name === "billing_upgrade_page_viewed",
  ).length;
  const prevCheckoutStarted = billingEventsPrev.filter(
    (row) => row.name === "billing_checkout_started",
  ).length;
  const prevCheckoutSuccess = billingEventsPrev.filter(
    (row) => row.name === "billing_checkout_return_success",
  ).length;

  const checkoutStartedDeltaAbs =
    billingSummary.total_checkout_started - prevCheckoutStarted;
  const checkoutStartedDeltaPct = pct(
    checkoutStartedDeltaAbs,
    Math.max(1, prevCheckoutStarted),
  );

  const topSourceByCheckout = billingSources[0] || null;
  const candidatesBySuccess = billingSources
    .filter((row) => row.checkout_started >= 3 && row.to_success_from_checkout !== null)
    .sort(
      (a, b) =>
        Number(b.to_success_from_checkout || 0) -
        Number(a.to_success_from_checkout || 0),
    );
  const bestSourceBySuccess = candidatesBySuccess[0] || null;

  const leakageCandidates = billingSources
    .filter((row) => row.page_viewed >= 5)
    .map((row) => ({
      ...row,
      leakage:
        Number(row.page_viewed || 0) - Number(row.checkout_started || 0),
    }))
    .sort((a, b) => b.leakage - a.leakage);
  const highestLeakageSource = leakageCandidates[0] || null;

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
    billing: {
      summary: billingSummary,
      previous_window: {
        page_viewed: prevPageViewed,
        checkout_started: prevCheckoutStarted,
        checkout_success: prevCheckoutSuccess,
      },
      deltas: {
        checkout_started_abs: checkoutStartedDeltaAbs,
        checkout_started_pct: checkoutStartedDeltaPct,
      },
      spotlight: {
        top_source_by_checkout: topSourceByCheckout,
        best_source_by_success: bestSourceBySuccess,
        highest_leakage_source: highestLeakageSource,
      },
      groups: billingGroups.slice(0, 12),
      sources: billingSources.slice(0, 20),
    },
    rows,
  });
}
