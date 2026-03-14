import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  applyInternalCommercialAccessOverride,
  deriveCommercialAccess,
  type CommercialAccess,
} from "@/lib/billing/commercial-access";
import { logPipelineRun } from "@/lib/ops/pipeline-runs";

export const runtime = "nodejs";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SCAN_LIMIT = 3000;
const DEFAULT_SEND_LIMIT = 120;
const DEFAULT_COOLDOWN_HOURS = 72;
const DEFAULT_MONTHLY_MAX = 4;
const DEFAULT_ACTIVE_MILESTONES = [7, 3, 1];
const DEFAULT_EXPIRED_MILESTONES = [1, 4];

type RunBody = {
  scan_limit?: number;
  send_limit?: number;
  dry_run?: boolean;
};

type AgentRow = {
  id: string | null;
  created_at: string | null;
};

type SubscriptionRow = {
  agent_id: string | null;
  plan_key: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  updated_at: string | null;
};

type NotificationSettingRow = {
  agent_id: string | null;
  notifications: Record<string, unknown> | null;
  delivery: Record<string, unknown> | null;
  contact_email: string | null;
  slack_connected: boolean | null;
};

type ReminderEventRow = {
  agent_id: string | null;
  type: string | null;
  created_at: string | null;
};

type Channel = "dashboard" | "email" | "slack";

type ReminderStage = {
  key: string;
  type: string;
  title: string;
  body: string;
  deepLink: string;
};

function mustEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function isLikelyEmail(v: string) {
  const s = String(v || "").trim();
  if (!s || s.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function parseIsoMs(value: string | null | undefined) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function parseIntSafe(value: unknown, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function parseIntList(envValue: string | undefined, fallback: number[]) {
  const raw = String(envValue || "").trim();
  if (!raw) return fallback;
  const values = raw
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n))
    .map((n) => Math.max(0, Math.floor(n)));
  if (!values.length) return fallback;
  return Array.from(new Set(values));
}

function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "";
  const internalSecret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET || "";

  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const internalHeader = req.headers.get("x-advaic-internal-secret") || "";
  const querySecret = req.nextUrl.searchParams.get("secret") || "";

  const headerOk =
    (!!bearer && (bearer === cronSecret || bearer === internalSecret)) ||
    (!!internalHeader && internalHeader === internalSecret);
  const queryOk =
    !!querySecret && (querySecret === cronSecret || querySecret === internalSecret);

  return headerOk || queryOk;
}

function baseUrlFromReq(req: NextRequest) {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return req.nextUrl.origin.replace(/\/+$/, "");
}

function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function normalizeObj(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function pickChannels(args: {
  settings: NotificationSettingRow | null | undefined;
}): Channel[] {
  const notifications = normalizeObj(args.settings?.notifications);
  const delivery = normalizeObj(args.settings?.delivery);

  if (notifications.systemMessages === false) return [];

  const channels: Channel[] = [];
  if (delivery.dashboard !== false) channels.push("dashboard");

  const email = String(args.settings?.contact_email || "").trim();
  if (delivery.email === true && isLikelyEmail(email)) channels.push("email");

  if (delivery.slack === true && !!args.settings?.slack_connected) {
    channels.push("slack");
  }

  return Array.from(new Set(channels));
}

function resolveStage(args: {
  access: CommercialAccess;
  nowMs: number;
  activeMilestones: number[];
  expiredMilestones: number[];
}): ReminderStage | null {
  const { access, nowMs, activeMilestones, expiredMilestones } = args;

  if (access.state === "trial_active") {
    const left = Number(access.trial_days_remaining || 0);
    if (!activeMilestones.includes(left)) return null;

    const type = `trial_upgrade_reminder_t${left}`;
    if (left === 7) {
      return {
        key: "t7",
        type,
        title: "Ihre Testphase läuft: 7 Tage verbleibend",
        body: "Advaic läuft stabil. Wenn Sie ohne Unterbrechung weiterarbeiten möchten, aktivieren Sie Starter vor dem Ende der Testphase.",
        deepLink: "/app/konto/abo?source=trial_reminder&stage=t7",
      };
    }
    if (left === 3) {
      return {
        key: "t3",
        type,
        title: "Noch 3 Tage Testphase: jetzt Starter sichern",
        body: "Damit Auto-Senden und Follow-ups ohne Pause weiterlaufen, aktivieren Sie Starter jetzt. Ihre Einstellungen bleiben unverändert.",
        deepLink: "/app/konto/abo?source=trial_reminder&stage=t3",
      };
    }
    if (left === 1) {
      return {
        key: "t1",
        type,
        title: "Letzter Tag der Testphase",
        body: "Heute endet Ihre Testphase. Aktivieren Sie Starter, damit Autopilot, Freigaben und Follow-ups ohne Unterbrechung verfügbar bleiben.",
        deepLink: "/app/konto/abo?source=trial_reminder&stage=t1",
      };
    }
    return {
      key: `t${left}`,
      type,
      title: `Testphase: noch ${left} Tage`,
      body: "Wenn Sie ohne Unterbrechung weiterarbeiten möchten, können Sie Starter jetzt aktivieren.",
      deepLink: `/app/konto/abo?source=trial_reminder&stage=t${left}`,
    };
  }

  if (access.state !== "trial_expired") return null;
  const trialEndMs = parseIsoMs(access.trial_ends_at);
  if (!Number.isFinite(trialEndMs)) return null;

  const expiredDays = Math.floor((nowMs - Number(trialEndMs)) / DAY_MS);
  if (!expiredMilestones.includes(expiredDays)) return null;

  const type = `trial_upgrade_reminder_expired_d${expiredDays}`;
  if (expiredDays === 1) {
    return {
      key: "expired_d1",
      type,
      title: "Testphase beendet: Starter erforderlich",
      body: "Auto-Senden und Follow-ups sind pausiert. Aktivieren Sie Starter, um wieder direkt aus Advaic zu arbeiten.",
      deepLink: "/app/konto/abo?source=trial_reminder&stage=expired_d1",
    };
  }

  return {
    key: `expired_d${expiredDays}`,
    type,
    title: "Kurze Erinnerung: Starter jederzeit aktivierbar",
    body: "Ihr Konto ist weiterhin verfügbar, aber Versand-Funktionen bleiben pausiert. Aktivieren Sie Starter, wenn Sie wieder produktiv starten möchten.",
    deepLink: `/app/konto/abo?source=trial_reminder&stage=expired_d${expiredDays}`,
  };
}

async function run(req: NextRequest) {
  const startedAtMs = Date.now();
  const pipeline = "billing_trial_reminders";

  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as RunBody | null;
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const cooldownHours = parseIntSafe(
    process.env.BILLING_TRIAL_REMINDER_COOLDOWN_HOURS,
    DEFAULT_COOLDOWN_HOURS,
    24,
    336,
  );
  const monthlyMax = parseIntSafe(
    process.env.BILLING_TRIAL_REMINDER_MONTHLY_MAX,
    DEFAULT_MONTHLY_MAX,
    1,
    12,
  );
  const activeMilestones = parseIntList(
    process.env.BILLING_TRIAL_REMINDER_ACTIVE_MILESTONES,
    DEFAULT_ACTIVE_MILESTONES,
  );
  const expiredMilestones = parseIntList(
    process.env.BILLING_TRIAL_REMINDER_EXPIRED_MILESTONES,
    DEFAULT_EXPIRED_MILESTONES,
  );

  const scanLimit = parseIntSafe(
    body?.scan_limit,
    DEFAULT_SCAN_LIMIT,
    50,
    12000,
  );
  const sendLimit = parseIntSafe(body?.send_limit, DEFAULT_SEND_LIMIT, 1, 1000);
  const dryRun = body?.dry_run === true;
  const supabase = supabaseAdmin();
  const baseUrl = baseUrlFromReq(req);
  const internalSecret = mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET");

  const { data: agents, error: agentsErr } = await (supabase.from("agents") as any)
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(scanLimit);

  if (agentsErr) {
    await logPipelineRun(supabase, {
      pipeline,
      status: "error",
      startedAtMs,
      failed: 1,
      meta: { step: "load_agents", details: String(agentsErr.message || agentsErr) },
    });
    return NextResponse.json(
      { ok: false, error: "load_agents_failed", details: String(agentsErr.message || agentsErr) },
      { status: 500 },
    );
  }

  const agentRows = ((agents || []) as AgentRow[]).filter((row) =>
    /^[0-9a-f-]{36}$/i.test(String(row.id || "")),
  );
  const agentIds = agentRows.map((row) => String(row.id));
  if (!agentIds.length) {
    await logPipelineRun(supabase, {
      pipeline,
      status: "ok",
      startedAtMs,
      processed: 0,
      meta: { scanned: 0, due: 0 },
    });
    return NextResponse.json({ ok: true, scanned: 0, due: 0, sent: 0, failed: 0, skipped: 0 });
  }

  const latestSubscriptionByAgent = new Map<string, SubscriptionRow>();
  const settingsByAgent = new Map<string, NotificationSettingRow>();
  const reminderCount30d = new Map<string, number>();
  const reminderLastAt = new Map<string, number>();
  const sentStageByAgent = new Map<string, Set<string>>();
  const stageTypes = Array.from(
    new Set([
      ...activeMilestones.map((d) => `trial_upgrade_reminder_t${d}`),
      ...expiredMilestones.map((d) => `trial_upgrade_reminder_expired_d${d}`),
    ]),
  );
  const since30Ms = nowMs - 30 * DAY_MS;

  for (const ids of chunk(agentIds, 400)) {
    const [subsRes, settingsRes, eventsRes] = await Promise.all([
      (supabase.from("billing_subscriptions") as any)
        .select(
          "agent_id, plan_key, status, current_period_start, current_period_end, trial_end, updated_at",
        )
        .in("agent_id", ids)
        .order("updated_at", { ascending: false }),
      (supabase.from("agent_notification_settings") as any)
        .select("agent_id, notifications, delivery, contact_email, slack_connected")
        .in("agent_id", ids),
      (supabase.from("notification_events") as any)
        .select("agent_id, type, created_at")
        .eq("entity_type", "billing_trial")
        .in("agent_id", ids)
        .in("type", stageTypes),
    ]);

    const subRows = (subsRes.data || []) as SubscriptionRow[];
    for (const row of subRows) {
      const agentId = String(row.agent_id || "").trim();
      if (!agentId || latestSubscriptionByAgent.has(agentId)) continue;
      latestSubscriptionByAgent.set(agentId, row);
    }

    const settingRows = (settingsRes.data || []) as NotificationSettingRow[];
    for (const row of settingRows) {
      const agentId = String(row.agent_id || "").trim();
      if (!agentId) continue;
      settingsByAgent.set(agentId, row);
    }

    const eventRows = (eventsRes.data || []) as ReminderEventRow[];
    for (const row of eventRows) {
      const agentId = String(row.agent_id || "").trim();
      const type = String(row.type || "").trim();
      if (!agentId || !type) continue;

      if (!sentStageByAgent.has(agentId)) sentStageByAgent.set(agentId, new Set());
      sentStageByAgent.get(agentId)!.add(type);

      const createdMs = parseIsoMs(row.created_at);
      if (createdMs === null) continue;
      if (createdMs >= since30Ms) {
        reminderCount30d.set(agentId, (reminderCount30d.get(agentId) || 0) + 1);
      }
      const prevLast = reminderLastAt.get(agentId) || 0;
      if (createdMs > prevLast) reminderLastAt.set(agentId, createdMs);
    }
  }

  const due: Array<{
    agentId: string;
    access: CommercialAccess;
    stage: ReminderStage;
    channels: Channel[];
    skipReason?: string;
  }> = [];

  for (const row of agentRows) {
    const agentId = String(row.id || "").trim();
    if (!agentId) continue;

    const access = applyInternalCommercialAccessOverride(
      agentId,
      deriveCommercialAccess({
        agentCreatedAt: row.created_at ? String(row.created_at) : null,
        subscription: latestSubscriptionByAgent.get(agentId)
          ? {
              plan_key: latestSubscriptionByAgent.get(agentId)!.plan_key,
              status: latestSubscriptionByAgent.get(agentId)!.status,
              current_period_start: latestSubscriptionByAgent.get(agentId)!.current_period_start,
              current_period_end: latestSubscriptionByAgent.get(agentId)!.current_period_end,
              trial_end: latestSubscriptionByAgent.get(agentId)!.trial_end,
            }
          : null,
      }),
    );

    if (access.state === "paid_active") continue;

    const stage = resolveStage({
      access,
      nowMs,
      activeMilestones,
      expiredMilestones,
    });
    if (!stage) continue;

    const channels = pickChannels({
      settings: settingsByAgent.get(agentId),
    });
    if (!channels.length) {
      due.push({
        agentId,
        access,
        stage,
        channels,
        skipReason: "no_enabled_channels_or_system_messages_off",
      });
      continue;
    }

    const stageSet = sentStageByAgent.get(agentId);
    if (stageSet?.has(stage.type)) {
      due.push({ agentId, access, stage, channels, skipReason: "stage_already_sent" });
      continue;
    }

    const monthlyCount = reminderCount30d.get(agentId) || 0;
    if (monthlyCount >= monthlyMax) {
      due.push({ agentId, access, stage, channels, skipReason: "monthly_cap_reached" });
      continue;
    }

    const lastAt = reminderLastAt.get(agentId) || 0;
    if (lastAt > 0 && nowMs - lastAt < cooldownHours * 60 * 60 * 1000) {
      due.push({ agentId, access, stage, channels, skipReason: "cooldown_active" });
      continue;
    }

    due.push({ agentId, access, stage, channels });
  }

  const results: Array<{
    agent_id: string;
    stage: string;
    status: "sent" | "skipped" | "failed" | "would_send";
    reason?: string;
    channels?: Channel[];
  }> = [];

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of due) {
    if (sent >= sendLimit && !item.skipReason) {
      skipped += 1;
      results.push({
        agent_id: item.agentId,
        stage: item.stage.key,
        status: "skipped",
        reason: "send_limit_reached",
      });
      continue;
    }

    if (item.skipReason) {
      skipped += 1;
      results.push({
        agent_id: item.agentId,
        stage: item.stage.key,
        status: "skipped",
        reason: item.skipReason,
      });
      continue;
    }

    if (dryRun) {
      results.push({
        agent_id: item.agentId,
        stage: item.stage.key,
        status: "would_send",
        channels: item.channels,
      });
      continue;
    }

    try {
      const payload = {
        title: item.stage.title,
        body: item.stage.body,
        deep_link: item.stage.deepLink,
        action_label: "Starter aktivieren",
        stage: item.stage.key,
        trial_state: item.access.state,
        trial_days_remaining: item.access.trial_days_remaining,
        trial_day_number: item.access.trial_day_number,
        trial_days_total: item.access.trial_days_total,
        trial_ends_at: item.access.trial_ends_at,
        generated_at: nowIso,
      };

      const enqueueRes = await fetch(`${baseUrl}/api/notifications/enqueue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-advaic-internal-secret": internalSecret,
        },
        body: JSON.stringify({
          agent_id: item.agentId,
          type: item.stage.type,
          entity_type: "billing_trial",
          entity_id: item.agentId,
          channels: item.channels,
          payload,
          dispatch_now: true,
        }),
      });
      const enqueueJson = await enqueueRes.json().catch(() => null);

      if (!enqueueRes.ok || enqueueJson?.ok === false) {
        throw new Error(String(enqueueJson?.error || enqueueJson?.details || "enqueue_failed"));
      }

      await (supabase.from("notification_events") as any).insert({
        agent_id: item.agentId,
        type: "funnel_event",
        entity_type: "funnel",
        entity_id: "trial_upgrade_reminder_sent",
        payload: {
          event: "trial_upgrade_reminder_sent",
          source: "pipeline_billing_trial_reminders",
          path: "/app/konto/abo",
          created_at: nowIso,
          meta: {
            stage: item.stage.key,
            reminder_type: item.stage.type,
            trial_state: item.access.state,
            trial_days_remaining: item.access.trial_days_remaining,
            channels: item.channels,
          },
        },
      });

      sent += 1;
      results.push({
        agent_id: item.agentId,
        stage: item.stage.key,
        status: "sent",
        channels: item.channels,
      });
    } catch (error: any) {
      failed += 1;
      results.push({
        agent_id: item.agentId,
        stage: item.stage.key,
        status: "failed",
        reason: String(error?.message || "unknown_error"),
      });
    }
  }

  const runStatus = failed > 0 ? (sent > 0 ? "warning" : "error") : "ok";
  await logPipelineRun(supabase, {
    pipeline,
    status: runStatus,
    startedAtMs,
    processed: due.length,
    success: sent,
    failed,
    skipped,
    meta: {
      dry_run: dryRun,
      scanned_agents: agentRows.length,
      send_limit: sendLimit,
      cooldown_hours: cooldownHours,
      monthly_max: monthlyMax,
      active_milestones: activeMilestones,
      expired_milestones: expiredMilestones,
    },
  });

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    scanned_agents: agentRows.length,
    due: due.length,
    sent,
    skipped,
    failed,
    results,
  });
}

export async function POST(req: NextRequest) {
  return run(req);
}

export async function GET(req: NextRequest) {
  return run(req);
}
