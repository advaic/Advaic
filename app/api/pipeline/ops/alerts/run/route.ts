import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { logPipelineRun } from "@/lib/ops/pipeline-runs";
import { readRuntimeControl } from "@/lib/ops/runtime-control";

export const runtime = "nodejs";

type RunBody = {
  auto_pause?: boolean;
};

type AlertCandidate = {
  key: string;
  severity: "warning" | "critical";
  title: string;
  body: string;
  value: number;
  threshold: number;
  deepLink: string;
};

type AlertEventRow = {
  id: string;
  alert_key: string;
  status: "open" | "resolved";
  last_fired_at: string | null;
};

function mustEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function isInternal(req: NextRequest) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-advaic-internal-secret");
  return !!got && got === secret;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function baseUrlFromReq(req: NextRequest) {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return req.nextUrl.origin.replace(/\/+$/, "");
}

function parseIsoMs(value: string | null | undefined) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export async function POST(req: NextRequest) {
  const startedAtMs = Date.now();
  const pipeline = "ops_alerts";

  if (!isInternal(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as RunBody | null;
  const autoPause = body?.auto_pause !== false;
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const since30m = new Date(nowMs - 30 * 60 * 1000).toISOString();
  const stale20m = nowMs - 20 * 60 * 1000;
  const stale120m = nowMs - 120 * 60 * 1000;
  const supabase = supabaseAdmin();
  const baseUrl = baseUrlFromReq(req);
  const internalSecret = mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET");
  const adminUserId = String(process.env.ADVAIC_ADMIN_USER_ID || "").trim();

  const [
    failed30Res,
    queueRes,
    stuckRes,
    recentRunsRes,
    openAlertsRes,
    control,
  ] = await Promise.all([
    (supabase.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("send_status", "failed")
      .gte("updated_at", since30m),
    Promise.all([
      (supabase.from("messages") as any)
        .select("id", { count: "exact", head: true })
        .eq("status", "needs_human"),
      (supabase.from("messages") as any)
        .select("id", { count: "exact", head: true })
        .eq("status", "ready_to_send")
        .eq("approval_required", false)
        .in("send_status", ["pending", "failed"]),
    ]),
    (supabase.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("send_status", "sending")
      .lt("send_locked_at", new Date(nowMs - 15 * 60 * 1000).toISOString()),
    (supabase.from("pipeline_runs") as any)
      .select("pipeline, status, created_at")
      .in("pipeline", ["reply_ready_send", "followups", "onboarding_recovery", "outlook_fetch"])
      .order("created_at", { ascending: false })
      .limit(200),
    (supabase.from("ops_alert_events") as any)
      .select("id, alert_key, status, last_fired_at")
      .eq("status", "open"),
    readRuntimeControl(supabase),
  ]);

  const failedSends30m = Number(failed30Res.count || 0);
  const needsHuman = Number((queueRes[0] as any).count || 0);
  const readyToSend = Number((queueRes[1] as any).count || 0);
  const stuckSending15m = Number(stuckRes.count || 0);

  const latestRunByPipeline = new Map<string, { created_at: string; status: string }>();
  for (const row of ((recentRunsRes.data || []) as any[])) {
    const key = String(row?.pipeline || "");
    if (!key || latestRunByPipeline.has(key)) continue;
    latestRunByPipeline.set(key, {
      created_at: String(row.created_at || ""),
      status: String(row.status || ""),
    });
  }

  const alerts: AlertCandidate[] = [];

  if (failedSends30m >= 5) {
    alerts.push({
      key: "failed_sends_30m",
      severity: "critical",
      title: "Kritisch: viele fehlgeschlagene Sendungen",
      body: `In den letzten 30 Minuten gab es ${failedSends30m} fehlgeschlagene Sendungen (Schwelle: 5).`,
      value: failedSends30m,
      threshold: 5,
      deepLink: "/app/admin/outbox?tab=failed",
    });
  }

  if (stuckSending15m >= 5) {
    alerts.push({
      key: "stuck_sending_15m",
      severity: "critical",
      title: "Kritisch: Sendungen hängen fest",
      body: `${stuckSending15m} Nachrichten hängen seit mindestens 15 Minuten im Status „sending“ (Schwelle: 5).`,
      value: stuckSending15m,
      threshold: 5,
      deepLink: "/app/admin/outbox?tab=stuck",
    });
  }

  if (needsHuman >= 25) {
    alerts.push({
      key: "needs_human_backlog",
      severity: "warning",
      title: "Warnung: hoher Needs-Human-Rückstau",
      body: `Aktuell liegen ${needsHuman} Fälle in „needs_human“ (Schwelle: 25).`,
      value: needsHuman,
      threshold: 25,
      deepLink: "/app/admin/outbox",
    });
  }

  if (readyToSend >= 80) {
    alerts.push({
      key: "ready_to_send_backlog",
      severity: "warning",
      title: "Warnung: hoher Ready-to-Send-Rückstau",
      body: `Aktuell liegen ${readyToSend} Nachrichten in „ready_to_send“ (Schwelle: 80).`,
      value: readyToSend,
      threshold: 80,
      deepLink: "/app/admin/outbox",
    });
  }

  const staleChecks: Array<{ pipeline: string; staleMs: number; label: string }> = [
    { pipeline: "reply_ready_send", staleMs: stale20m, label: "Reply-Ready-Send" },
    { pipeline: "followups", staleMs: stale20m, label: "Follow-ups" },
    { pipeline: "outlook_fetch", staleMs: stale20m, label: "Outlook-Fetch" },
    { pipeline: "onboarding_recovery", staleMs: stale120m, label: "Onboarding-Recovery" },
  ];

  for (const check of staleChecks) {
    const latest = latestRunByPipeline.get(check.pipeline);
    const latestMs = parseIsoMs(latest?.created_at || null);
    if (!latestMs || latestMs < check.staleMs) {
      alerts.push({
        key: `stale_${check.pipeline}`,
        severity: "warning",
        title: `Warnung: Pipeline ohne frischen Lauf (${check.label})`,
        body: latestMs
          ? `${check.label} hatte zuletzt um ${new Date(latestMs).toLocaleString("de-DE")} einen Lauf.`
          : `${check.label} hat keinen dokumentierten Lauf im Monitoring-Fenster.`,
        value: latestMs ? Math.round((nowMs - latestMs) / 60000) : 9999,
        threshold: check.pipeline === "onboarding_recovery" ? 120 : 20,
        deepLink: "/app/admin/ops",
      });
    }
  }

  const openRows = ((openAlertsRes.data || []) as AlertEventRow[]) || [];
  const openMap = new Map<string, AlertEventRow>();
  for (const row of openRows) openMap.set(String(row.alert_key), row);
  const activeKeys = new Set(alerts.map((a) => a.key));

  let fired = 0;
  let resolved = 0;
  const cooldownMs = 60 * 60 * 1000;
  const notifications: Array<{ key: string; sent: boolean; reason?: string }> = [];

  for (const alert of alerts) {
    const existing = openMap.get(alert.key);
    const lastFiredMs = parseIsoMs(existing?.last_fired_at || null);
    const shouldFire = !lastFiredMs || nowMs - lastFiredMs >= cooldownMs;

    const payload = {
      key: alert.key,
      severity: alert.severity,
      title: alert.title,
      body: alert.body,
      value: alert.value,
      threshold: alert.threshold,
      deep_link: alert.deepLink,
      generated_at: nowIso,
    };

    await (supabase.from("ops_alert_events") as any)
      .upsert(
        {
          alert_key: alert.key,
          severity: alert.severity,
          status: "open",
          first_opened_at: existing?.id ? undefined : nowIso,
          last_fired_at: nowIso,
          resolved_at: null,
          last_payload: payload,
          updated_at: nowIso,
        },
        { onConflict: "alert_key" },
      )
      .then(() => null)
      .catch(() => null);

    if (!shouldFire) {
      notifications.push({ key: alert.key, sent: false, reason: "cooldown" });
      continue;
    }

    fired += 1;
    if (!isUuid(adminUserId)) {
      notifications.push({ key: alert.key, sent: false, reason: "missing_admin_user_id" });
      continue;
    }

    const type = `ops_alert_${alert.key}`;
    try {
      const enqueueRes = await fetch(`${baseUrl}/api/notifications/enqueue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-advaic-internal-secret": internalSecret,
        },
        body: JSON.stringify({
          agent_id: adminUserId,
          type,
          payload,
          dispatch_now: true,
        }),
      });
      const json = await enqueueRes.json().catch(() => null);
      if (!enqueueRes.ok || json?.ok === false) {
        notifications.push({
          key: alert.key,
          sent: false,
          reason: String(json?.error || json?.details || "enqueue_failed"),
        });
      } else {
        notifications.push({ key: alert.key, sent: true });
      }
    } catch (e: any) {
      notifications.push({
        key: alert.key,
        sent: false,
        reason: String(e?.message || "enqueue_exception"),
      });
    }
  }

  for (const row of openRows) {
    const key = String(row.alert_key || "");
    if (!key || activeKeys.has(key)) continue;
    resolved += 1;
    await (supabase.from("ops_alert_events") as any)
      .update({
        status: "resolved",
        resolved_at: nowIso,
        updated_at: nowIso,
      })
      .eq("alert_key", key)
      .then(() => null)
      .catch(() => null);
  }

  let autoPaused = false;
  if (autoPause) {
    const hasCriticalFlowAlert = alerts.some(
      (a) =>
        a.severity === "critical" &&
        (a.key === "failed_sends_30m" || a.key === "stuck_sending_15m"),
    );
    if (hasCriticalFlowAlert && !control.pause_all) {
      await (supabase.from("ops_runtime_controls") as any)
        .upsert(
          {
            id: true,
            pause_reply_ready_send: true,
            pause_followups: true,
            reason:
              "Auto-Pause durch Ops-Alert: kritische Versandlage erkannt (failed/stuck).",
            updated_at: nowIso,
            updated_by: isUuid(adminUserId) ? adminUserId : null,
          },
          { onConflict: "id" },
        )
        .then(() => null)
        .catch(() => null);
      autoPaused = true;
    }
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const status = criticalCount > 0 ? "error" : alerts.length > 0 ? "warning" : "ok";
  await logPipelineRun(supabase, {
    pipeline,
    status,
    startedAtMs,
    processed: alerts.length,
    success: notifications.filter((n) => n.sent).length,
    failed: notifications.filter((n) => !n.sent && n.reason !== "cooldown").length,
    skipped: notifications.filter((n) => n.reason === "cooldown").length,
    meta: {
      auto_pause: autoPause,
      auto_paused: autoPaused,
      alerts_open: alerts.length,
      alerts_resolved: resolved,
      critical_count: criticalCount,
    },
  });

  return NextResponse.json({
    ok: true,
    generated_at: nowIso,
    auto_pause: autoPause,
    auto_paused: autoPaused,
    alerts: alerts.map((a) => ({
      key: a.key,
      severity: a.severity,
      title: a.title,
      body: a.body,
      value: a.value,
      threshold: a.threshold,
      deep_link: a.deepLink,
    })),
    fired,
    resolved,
    notifications,
    metrics: {
      failed_sends_30m: failedSends30m,
      stuck_sending_15m: stuckSending15m,
      needs_human: needsHuman,
      ready_to_send: readyToSend,
    },
  });
}
