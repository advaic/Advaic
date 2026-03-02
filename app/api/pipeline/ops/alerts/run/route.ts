import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { logPipelineRun } from "@/lib/ops/pipeline-runs";
import { readRuntimeControl } from "@/lib/ops/runtime-control";
import { getRequestId, jsonWithRequestId, logError, logInfo } from "@/lib/ops/request-id";

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

type ApiProbeResult = {
  key: string;
  ok: boolean;
  status: number | null;
  latency_ms: number;
  error: string | null;
};

type OutboundAlertResult = {
  key: string;
  sent: boolean;
  reason?: string;
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

async function probeEndpoint(args: {
  baseUrl: string;
  key: string;
  path: string;
  expectedStatus: number;
  timeoutMs?: number;
}): Promise<ApiProbeResult> {
  const started = Date.now();
  const ctrl = new AbortController();
  const timeoutMs = Math.max(1000, Number(args.timeoutMs || 4000));
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${args.baseUrl}${args.path}`, {
      method: "GET",
      signal: ctrl.signal,
      cache: "no-store",
    });
    const latencyMs = Date.now() - started;
    return {
      key: args.key,
      ok: res.status === args.expectedStatus,
      status: res.status,
      latency_ms: latencyMs,
      error: null,
    };
  } catch (e: any) {
    const latencyMs = Date.now() - started;
    return {
      key: args.key,
      ok: false,
      status: null,
      latency_ms: latencyMs,
      error: String(e?.name === "AbortError" ? "timeout" : e?.message || "fetch_failed"),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function sendOpsWebhook(args: {
  webhookUrl: string;
  generatedAt: string;
  alert: AlertCandidate;
  baseUrl: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const body = {
    source: "advaic_ops_alerts",
    generated_at: args.generatedAt,
    severity: args.alert.severity,
    key: args.alert.key,
    title: args.alert.title,
    message: args.alert.body,
    value: args.alert.value,
    threshold: args.alert.threshold,
    deep_link: `${args.baseUrl}${args.alert.deepLink}`,
  };

  try {
    const url = args.webhookUrl;
    const isSlack = /hooks\.slack\.com/i.test(url);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        isSlack
          ? {
              text: `*${args.alert.severity.toUpperCase()}* · ${args.alert.title}\n${args.alert.body}\n${args.baseUrl}${args.alert.deepLink}`,
            }
          : body,
      ),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return { ok: false, reason: `webhook_http_${resp.status}:${txt.slice(0, 180)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: String(e?.message || "webhook_exception") };
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const startedAtMs = Date.now();
  const pipeline = "ops_alerts";

  if (!isInternal(req)) {
    return jsonWithRequestId(requestId, { ok: false, error: "unauthorized" }, { status: 401 });
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
  const opsWebhookUrl = String(process.env.ADVAIC_OPS_ALERT_WEBHOOK_URL || "").trim();

  const [
    failed30Res,
    queueRes,
    stuckRes,
    recentRunsRes,
    openAlertsRes,
    control,
    billingWebhookFailedRes,
    billingWebhookStuckRes,
    signupVerifyRowsRes,
    apiProbes,
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
    (supabase.from("billing_webhook_events") as any)
      .select("event_id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("last_attempt_at", since30m)
      .catch(() => ({ count: 0 })),
    (supabase.from("billing_webhook_events") as any)
      .select("event_id", { count: "exact", head: true })
      .eq("status", "processing")
      .lt("last_attempt_at", new Date(nowMs - 15 * 60 * 1000).toISOString())
      .catch(() => ({ count: 0 })),
    (supabase.from("signup_verifications") as any)
      .select("attempts, max_attempts, expires_at, used_at")
      .gte("created_at", since30m)
      .is("used_at", null)
      .limit(500)
      .catch(() => ({ data: [] })),
    Promise.all([
      probeEndpoint({
        baseUrl,
        key: "probe_produkt_page",
        path: "/produkt",
        expectedStatus: 200,
      }),
      probeEndpoint({
        baseUrl,
        key: "probe_outlook_webhook",
        path: "/api/outlook/webhook",
        expectedStatus: 200,
      }),
      probeEndpoint({
        baseUrl,
        key: "probe_gmail_push_get",
        path: "/api/gmail/push",
        expectedStatus: 405,
      }),
    ]),
  ]);

  const failedSends30m = Number(failed30Res.count || 0);
  const needsHuman = Number((queueRes[0] as any).count || 0);
  const readyToSend = Number((queueRes[1] as any).count || 0);
  const stuckSending15m = Number(stuckRes.count || 0);
  const billingWebhookFailed30m = Number(billingWebhookFailedRes?.count || 0);
  const billingWebhookStuck15m = Number(billingWebhookStuckRes?.count || 0);
  const signupRows = Array.isArray(signupVerifyRowsRes?.data) ? signupVerifyRowsRes.data : [];
  const signupLocked30m = signupRows.filter((row: any) => {
    const attempts = Number(row?.attempts || 0);
    const maxAttempts = Math.max(1, Number(row?.max_attempts || 6));
    return attempts >= maxAttempts;
  }).length;
  const signupExpired30m = signupRows.filter((row: any) => {
    const expiresMs = parseIsoMs(String(row?.expires_at || ""));
    return !!expiresMs && expiresMs < nowMs;
  }).length;

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

  if (billingWebhookFailed30m >= 3) {
    alerts.push({
      key: "billing_webhook_failed_30m",
      severity: "critical",
      title: "Kritisch: Stripe-Webhook-Fehler häufen sich",
      body: `In den letzten 30 Minuten gab es ${billingWebhookFailed30m} fehlgeschlagene Billing-Webhook-Events (Schwelle: 3).`,
      value: billingWebhookFailed30m,
      threshold: 3,
      deepLink: "/app/admin/billing/webhook-events",
    });
  }

  if (billingWebhookStuck15m >= 3) {
    alerts.push({
      key: "billing_webhook_stuck_15m",
      severity: "critical",
      title: "Kritisch: Billing-Webhook-Verarbeitung hängt",
      body: `${billingWebhookStuck15m} Billing-Webhook-Events stehen seit mindestens 15 Minuten auf „processing“ (Schwelle: 3).`,
      value: billingWebhookStuck15m,
      threshold: 3,
      deepLink: "/app/admin/billing/webhook-events",
    });
  }

  if (signupLocked30m >= 8) {
    alerts.push({
      key: "signup_verification_locked_30m",
      severity: "warning",
      title: "Warnung: viele gesperrte Signup-Verifizierungen",
      body: `In den letzten 30 Minuten wurden ${signupLocked30m} Verifizierungen durch zu viele Fehlversuche gesperrt (Schwelle: 8).`,
      value: signupLocked30m,
      threshold: 8,
      deepLink: "/signup",
    });
  }

  if (signupExpired30m >= 12) {
    alerts.push({
      key: "signup_verification_expired_30m",
      severity: "warning",
      title: "Warnung: viele abgelaufene Signup-Codes",
      body: `In den letzten 30 Minuten sind ${signupExpired30m} ungenutzte Verifizierungscodes abgelaufen (Schwelle: 12).`,
      value: signupExpired30m,
      threshold: 12,
      deepLink: "/signup",
    });
  }

  for (const probe of apiProbes) {
    if (probe.ok) continue;
    alerts.push({
      key: `api_probe_${probe.key}`,
      severity: "critical",
      title: "Kritisch: API-/Seiten-Health-Probe fehlgeschlagen",
      body: `Probe ${probe.key} fehlgeschlagen (Status: ${probe.status ?? "kein_response"}, Latenz: ${probe.latency_ms}ms${probe.error ? `, Fehler: ${probe.error}` : ""}).`,
      value: probe.status ?? -1,
      threshold: 0,
      deepLink: "/app/admin/ops",
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
  const webhookNotifications: OutboundAlertResult[] = [];

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
      webhookNotifications.push({ key: alert.key, sent: false, reason: "cooldown" });
      continue;
    }

    fired += 1;
    logInfo(requestId, "ops_alert_fired", {
      alert_key: alert.key,
      severity: alert.severity,
      value: alert.value,
      threshold: alert.threshold,
    });
    if (!isUuid(adminUserId)) {
      notifications.push({ key: alert.key, sent: false, reason: "missing_admin_user_id" });
    } else {
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
        logError(requestId, "ops_alert_internal_notification_failed", {
          alert_key: alert.key,
          status: enqueueRes.status,
          reason: String(json?.error || json?.details || "enqueue_failed"),
        });
        notifications.push({
          key: alert.key,
          sent: false,
            reason: String(json?.error || json?.details || "enqueue_failed"),
          });
      } else {
        notifications.push({ key: alert.key, sent: true });
      }
    } catch (e: any) {
      logError(requestId, "ops_alert_internal_notification_exception", {
        alert_key: alert.key,
        reason: String(e?.message || "enqueue_exception"),
      });
      notifications.push({
        key: alert.key,
        sent: false,
          reason: String(e?.message || "enqueue_exception"),
        });
      }
    }
    if (!opsWebhookUrl) {
      webhookNotifications.push({
        key: alert.key,
        sent: false,
        reason: "missing_ops_webhook_url",
      });
    } else {
      const webhookSent = await sendOpsWebhook({
        webhookUrl: opsWebhookUrl,
        generatedAt: nowIso,
        alert,
        baseUrl,
      });
      webhookNotifications.push({
        key: alert.key,
        sent: webhookSent.ok,
        reason: webhookSent.ok ? undefined : webhookSent.reason || "webhook_failed",
      });
      if (!webhookSent.ok) {
        logError(requestId, "ops_alert_webhook_failed", {
          alert_key: alert.key,
          reason: webhookSent.reason || "webhook_failed",
        });
      }
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
      webhook_sent: webhookNotifications.filter((w) => w.sent).length,
      webhook_failed: webhookNotifications.filter((w) => !w.sent && w.reason !== "cooldown")
        .length,
    },
  });

  return jsonWithRequestId(requestId, {
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
    webhook_notifications: webhookNotifications,
    metrics: {
      failed_sends_30m: failedSends30m,
      stuck_sending_15m: stuckSending15m,
      needs_human: needsHuman,
      ready_to_send: readyToSend,
      billing_webhook_failed_30m: billingWebhookFailed30m,
      billing_webhook_stuck_15m: billingWebhookStuck15m,
      signup_verification_locked_30m: signupLocked30m,
      signup_verification_expired_30m: signupExpired30m,
    },
    probes: apiProbes,
  });
}
