import { NextRequest } from "next/server";
import { requireAdmin, supabaseAdmin } from "../../_guard";
import { readRuntimeControl } from "@/lib/ops/runtime-control";
import { getRequestId, jsonWithRequestId, logError } from "@/lib/ops/request-id";

export const runtime = "nodejs";

type PipelineRunRow = {
  pipeline: string;
  status: "ok" | "warning" | "error" | "paused" | string;
  created_at: string | null;
  duration_ms: number | null;
  processed: number | null;
  success: number | null;
  failed: number | null;
  skipped: number | null;
  meta: Record<string, unknown> | null;
};

function safeCount(res: any) {
  return Number(res?.count || 0);
}

function parseIsoMs(value: string | null | undefined) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const gate = await requireAdmin(req);
    if (!gate.ok) {
      return jsonWithRequestId(requestId, { error: gate.error }, { status: gate.status });
    }

    const supa = supabaseAdmin();
    const nowMs = Date.now();
    const staleReplyMs = nowMs - 20 * 60 * 1000;
    const staleFollowupsMs = nowMs - 20 * 60 * 1000;
    const staleRecoveryMs = nowMs - 120 * 60 * 1000;
    const staleOutlookMs = nowMs - 20 * 60 * 1000;
    const staleBillingTrialRemindersMs = nowMs - 36 * 60 * 60 * 1000;

    const since30m = new Date(nowMs - 30 * 60 * 1000).toISOString();

    const [control, runsRes, alertsRes, billingFailedRes, billingStuckRes, signupRes] =
      await Promise.all([
        readRuntimeControl(supa),
        (supa.from("pipeline_runs") as any)
          .select(
            "pipeline, status, created_at, duration_ms, processed, success, failed, skipped, meta",
          )
          .order("created_at", { ascending: false })
          .limit(120),
        (supa.from("ops_alert_events") as any)
          .select(
            "alert_key, severity, status, first_opened_at, last_fired_at, resolved_at, last_payload, updated_at",
          )
          .order("updated_at", { ascending: false })
          .limit(80),
        (supa.from("billing_webhook_events") as any)
          .select("event_id", { count: "exact", head: true })
          .eq("status", "failed")
          .gte("last_attempt_at", since30m),
        (supa.from("billing_webhook_events") as any)
          .select("event_id", { count: "exact", head: true })
          .eq("status", "processing")
          .lt("last_attempt_at", new Date(nowMs - 15 * 60 * 1000).toISOString()),
        (supa.from("signup_verifications") as any)
          .select("attempts, max_attempts, expires_at, used_at")
          .gte("created_at", since30m)
          .is("used_at", null)
          .limit(400),
      ]);

    const runs = ((runsRes?.data || []) as PipelineRunRow[]) || [];
    const latestByPipeline = new Map<string, PipelineRunRow>();
    for (const row of runs) {
      const key = String(row?.pipeline || "");
      if (!key || latestByPipeline.has(key)) continue;
      latestByPipeline.set(key, row);
    }

    const pipelineState = [
      { key: "reply_ready_send", label: "Reply-Ready Send", staleMs: staleReplyMs },
      { key: "followups", label: "Follow-ups", staleMs: staleFollowupsMs },
      { key: "onboarding_recovery", label: "Onboarding-Recovery", staleMs: staleRecoveryMs },
      { key: "outlook_fetch", label: "Outlook-Fetch", staleMs: staleOutlookMs },
      {
        key: "billing_trial_reminders",
        label: "Billing Trial-Reminder",
        staleMs: staleBillingTrialRemindersMs,
      },
      { key: "ops_alerts", label: "Ops-Alerts", staleMs: staleReplyMs },
    ].map((item) => {
      const row = latestByPipeline.get(item.key) || null;
      const lastRunMs = parseIsoMs(row?.created_at || null);
      const stale = !lastRunMs || lastRunMs < item.staleMs;
      return {
        key: item.key,
        label: item.label,
        stale,
        last_run_at: row?.created_at || null,
        status: row?.status || "missing",
        duration_ms: row?.duration_ms ?? null,
        processed: row?.processed ?? 0,
        success: row?.success ?? 0,
        failed: row?.failed ?? 0,
        skipped: row?.skipped ?? 0,
        meta: row?.meta || {},
      };
    });

    const activeAlerts = ((alertsRes?.data || []) as any[]).filter(
      (a) => String(a?.status || "").toLowerCase() === "open",
    );
    const alertBuckets = {
      pipeline: 0,
      billing: 0,
      signup: 0,
      api_probes: 0,
      other: 0,
    };
    for (const alert of activeAlerts) {
      const key = String(alert?.alert_key || "");
      if (
        key.startsWith("failed_") ||
        key.startsWith("stale_") ||
        key.startsWith("ready_") ||
        key.startsWith("needs_") ||
        key.startsWith("stuck_")
      ) {
        alertBuckets.pipeline += 1;
        continue;
      }
      if (key.startsWith("billing_")) {
        alertBuckets.billing += 1;
        continue;
      }
      if (key.startsWith("signup_")) {
        alertBuckets.signup += 1;
        continue;
      }
      if (key.startsWith("api_probe_")) {
        alertBuckets.api_probes += 1;
        continue;
      }
      alertBuckets.other += 1;
    }

    const criticalAlerts = activeAlerts.filter(
      (a) => String(a?.severity || "").toLowerCase() === "critical",
    ).length;
    const warningAlerts = activeAlerts.filter(
      (a) => String(a?.severity || "").toLowerCase() === "warning",
    ).length;
    const staleCount = pipelineState.filter((p) => p.stale).length;

    const level =
      control.pause_all ||
      control.pause_reply_ready_send ||
      control.pause_followups ||
      criticalAlerts > 0 ||
      staleCount >= 2
        ? "critical"
        : warningAlerts > 0 || staleCount > 0
          ? "warning"
          : "ok";

    const signupRows = Array.isArray((signupRes as any)?.data) ? (signupRes as any).data : [];
    const signupLocked = signupRows.filter((row: any) => {
      const attempts = Number(row?.attempts || 0);
      const maxAttempts = Math.max(1, Number(row?.max_attempts || 6));
      return attempts >= maxAttempts;
    }).length;
    const signupExpired = signupRows.filter((row: any) => {
      const expiresMs = Date.parse(String(row?.expires_at || ""));
      return Number.isFinite(expiresMs) && expiresMs < nowMs;
    }).length;

    return jsonWithRequestId(requestId, {
      ok: true,
      generated_at: new Date().toISOString(),
      level,
      summary: {
        critical_alerts: criticalAlerts,
        warning_alerts: warningAlerts,
        stale_pipelines: staleCount,
        alert_buckets: alertBuckets,
        billing_webhook_failed_30m: safeCount(billingFailedRes),
        billing_webhook_stuck_15m: safeCount(billingStuckRes),
        signup_locked_30m: signupLocked,
        signup_expired_30m: signupExpired,
      },
      control,
      pipelines: pipelineState,
      alerts: Array.isArray((alertsRes as any)?.data) ? (alertsRes as any).data : [],
      recent_runs: runs,
      integrations: {
        ops_webhook_configured: Boolean(
          String(process.env.ADVAIC_OPS_ALERT_WEBHOOK_URL || "").trim(),
        ),
      },
    });
  } catch (e: any) {
    logError(requestId, "ops_status_internal_error", {
      reason: String(e?.message || e || "unknown_error"),
    });
    return jsonWithRequestId(
      requestId,
      {
        error: "ops_status_internal_error",
        details: String(e?.message || e || "unknown_error"),
      },
      { status: 500 },
    );
  }
}
