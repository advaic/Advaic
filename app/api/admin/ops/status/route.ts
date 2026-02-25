import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../../_guard";
import { readRuntimeControl } from "@/lib/ops/runtime-control";

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

function parseIsoMs(value: string | null | undefined) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const nowMs = Date.now();
  const staleReplyMs = nowMs - 20 * 60 * 1000;
  const staleFollowupsMs = nowMs - 20 * 60 * 1000;
  const staleRecoveryMs = nowMs - 120 * 60 * 1000;
  const staleOutlookMs = nowMs - 20 * 60 * 1000;

  const [control, runsRes, alertsRes] = await Promise.all([
    readRuntimeControl(supa),
    (supa.from("pipeline_runs") as any)
      .select("pipeline, status, created_at, duration_ms, processed, success, failed, skipped, meta")
      .order("created_at", { ascending: false })
      .limit(120),
    (supa.from("ops_alert_events") as any)
      .select("alert_key, severity, status, first_opened_at, last_fired_at, resolved_at, last_payload, updated_at")
      .order("updated_at", { ascending: false })
      .limit(80),
  ]);

  const runs = ((runsRes.data || []) as PipelineRunRow[]) || [];
  const latestByPipeline = new Map<string, PipelineRunRow>();
  for (const row of runs) {
    const key = String(row.pipeline || "");
    if (!key || latestByPipeline.has(key)) continue;
    latestByPipeline.set(key, row);
  }

  const pipelineState = [
    { key: "reply_ready_send", label: "Reply-Ready Send", staleMs: staleReplyMs },
    { key: "followups", label: "Follow-ups", staleMs: staleFollowupsMs },
    { key: "onboarding_recovery", label: "Onboarding-Recovery", staleMs: staleRecoveryMs },
    { key: "outlook_fetch", label: "Outlook-Fetch", staleMs: staleOutlookMs },
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

  const activeAlerts = ((alertsRes.data || []) as any[]).filter(
    (a) => String(a?.status || "").toLowerCase() === "open",
  );

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

  return NextResponse.json({
    ok: true,
    generated_at: new Date().toISOString(),
    level,
    summary: {
      critical_alerts: criticalAlerts,
      warning_alerts: warningAlerts,
      stale_pipelines: staleCount,
    },
    control,
    pipelines: pipelineState,
    alerts: alertsRes.data || [],
    recent_runs: runs,
  });
}
