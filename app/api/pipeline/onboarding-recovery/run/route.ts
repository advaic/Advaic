import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { isPipelinePaused, readRuntimeControl } from "@/lib/ops/runtime-control";
import { logPipelineRun } from "@/lib/ops/pipeline-runs";

export const runtime = "nodejs";

type RunBody = {
  limit?: number;
};

type RecoveryRow = {
  agent_id: string;
  onboarding_started_at: string | null;
  first_value_at: string | null;
  completed_at: string | null;
  remind_1h_due_at: string | null;
  remind_1h_sent_at: string | null;
  remind_24h_due_at: string | null;
  remind_24h_sent_at: string | null;
};

type OnboardingRow = {
  agent_id: string;
  current_step: number | null;
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

function clampLimit(value: unknown, fallback = 50) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(200, Math.floor(n)));
}

function parseIso(value: string | null | undefined) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function getDueStage(row: RecoveryRow, nowMs: number): "1h" | "24h" | null {
  if (!row.onboarding_started_at) return null;
  if (row.completed_at || row.first_value_at) return null;

  const due24 = parseIso(row.remind_24h_due_at);
  if (!row.remind_24h_sent_at && due24 !== null && due24 <= nowMs) return "24h";

  const due1 = parseIso(row.remind_1h_due_at);
  if (!row.remind_1h_sent_at && due1 !== null && due1 <= nowMs) return "1h";

  return null;
}

function reminderCopy(stage: "1h" | "24h", currentStep: number) {
  if (stage === "24h") {
    return {
      title: "Weiter machen: Ihr Onboarding ist nur wenige Klicks entfernt",
      body:
        "Seit 24 Stunden fehlt noch der erste messbare Nutzen. Öffnen Sie Ihr Onboarding, schließen Sie den nächsten Schritt ab und holen Sie sich den ersten sicheren Versand.",
      action_label: "Onboarding fortsetzen",
      current_step: currentStep,
    };
  }

  return {
    title: "Kurzer Reminder: Ihr Safe-Start ist vorbereitet",
    body:
      "Sie haben bereits gestartet. Machen Sie jetzt den nächsten Schritt, damit Advaic die ersten klaren Anfragen sicher für Sie vorbereitet.",
    action_label: "Jetzt fortsetzen",
    current_step: currentStep,
  };
}

export async function POST(req: NextRequest) {
  const startedAtMs = Date.now();
  const pipeline = "onboarding_recovery";
  if (!isInternal(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as RunBody | null;
  const limit = clampLimit(body?.limit, 50);
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  const supabase = supabaseAdmin();
  const control = await readRuntimeControl(supabase);
  if (isPipelinePaused(control, "onboarding_recovery")) {
    await logPipelineRun(supabase, {
      pipeline,
      status: "paused",
      startedAtMs,
      meta: {
        reason: control.reason,
        control_source: control.source,
      },
    });
    return NextResponse.json({
      ok: true,
      paused: true,
      reason: control.reason || "pipeline_paused",
      processed: 0,
      results: [],
    });
  }

  const baseUrl = baseUrlFromReq(req);
  const internalSecret = mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET");

  const { data, error } = await (supabase.from("onboarding_recovery") as any)
    .select(
      "agent_id, onboarding_started_at, first_value_at, completed_at, remind_1h_due_at, remind_1h_sent_at, remind_24h_due_at, remind_24h_sent_at",
    )
    .order("updated_at", { ascending: true })
    .limit(5000);

  if (error) {
    await logPipelineRun(supabase, {
      pipeline,
      status: "error",
      startedAtMs,
      failed: 1,
      meta: {
        step: "load_recovery_rows",
        details: String(error.message || error),
      },
    });
    return NextResponse.json(
      { ok: false, error: "recovery_load_failed", details: String(error.message || error) },
      { status: 500 },
    );
  }

  const allRows = (Array.isArray(data) ? data : []) as RecoveryRow[];
  const due = allRows
    .map((row) => ({ row, stage: getDueStage(row, nowMs) }))
    .filter((x) => !!x.stage)
    .slice(0, limit) as Array<{ row: RecoveryRow; stage: "1h" | "24h" }>;

  if (due.length === 0) {
    await logPipelineRun(supabase, {
      pipeline,
      status: "ok",
      startedAtMs,
      processed: 0,
      meta: { scanned: allRows.length, due: 0 },
    });
    return NextResponse.json({
      ok: true,
      scanned: allRows.length,
      due: 0,
      sent: 0,
      failed: 0,
      results: [],
    });
  }

  const agentIds = due.map((x) => x.row.agent_id);
  const { data: onboardingRows } = await (supabase.from("agent_onboarding") as any)
    .select("agent_id, current_step")
    .in("agent_id", agentIds);

  const onboardingMap = new Map<string, OnboardingRow>();
  for (const row of (onboardingRows || []) as OnboardingRow[]) {
    onboardingMap.set(String(row.agent_id), row);
  }

  const results: Array<{
    agent_id: string;
    stage: "1h" | "24h";
    status: "sent" | "failed";
    reason?: string;
  }> = [];
  let sent = 0;
  let failed = 0;

  for (const item of due) {
    const agentId = String(item.row.agent_id);
    const onboarding = onboardingMap.get(agentId);
    const currentStep = Math.max(1, Math.min(6, Number(onboarding?.current_step || 1)));
    const eventType =
      item.stage === "24h" ? "onboarding_recovery_24h" : "onboarding_recovery_1h";
    const copy = reminderCopy(item.stage, currentStep);
    const payload = {
      deep_link: "/app/onboarding",
      title: copy.title,
      body: copy.body,
      action_label: copy.action_label,
      current_step: copy.current_step,
      stage: item.stage,
      onboarding_started_at: item.row.onboarding_started_at,
      generated_at: nowIso,
    };

    try {
      const enqueueRes = await fetch(`${baseUrl}/api/notifications/enqueue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-advaic-internal-secret": internalSecret,
        },
        body: JSON.stringify({
          agent_id: agentId,
          type: eventType,
          entity_type: "onboarding_recovery",
          entity_id: agentId,
          payload,
          dispatch_now: true,
        }),
      });

      const enqueueJson = await enqueueRes.json().catch(() => null);
      if (!enqueueRes.ok || enqueueJson?.ok === false) {
        throw new Error(
          String(enqueueJson?.error || enqueueJson?.details || "enqueue_failed"),
        );
      }

      const patch: Record<string, unknown> = {
        updated_at: nowIso,
        last_payload: payload,
      };
      if (item.stage === "24h") patch.remind_24h_sent_at = nowIso;
      else patch.remind_1h_sent_at = nowIso;

      await (supabase.from("onboarding_recovery") as any)
        .update(patch)
        .eq("agent_id", agentId);

      await (supabase.from("notification_events") as any).insert({
        agent_id: agentId,
        type: "funnel_event",
        entity_type: "funnel",
        entity_id: "onboarding_recovery_reminder_sent",
        payload: {
          event: "onboarding_recovery_reminder_sent",
          source: "pipeline_onboarding_recovery",
          path: "/app/onboarding",
          step: currentStep,
          created_at: nowIso,
          meta: {
            stage: item.stage,
            reminder_type: eventType,
          },
        },
      });

      sent += 1;
      results.push({ agent_id: agentId, stage: item.stage, status: "sent" });
    } catch (err: any) {
      failed += 1;
      results.push({
        agent_id: agentId,
        stage: item.stage,
        status: "failed",
        reason: String(err?.message || "unknown_error"),
      });
    }
  }

  const status = failed > 0 ? (sent > 0 ? "warning" : "error") : "ok";
  await logPipelineRun(supabase, {
    pipeline,
    status,
    startedAtMs,
    processed: due.length,
    success: sent,
    failed,
    skipped: Math.max(0, due.length - sent - failed),
    meta: {
      scanned: allRows.length,
      limit,
    },
  });

  return NextResponse.json({
    ok: true,
    scanned: allRows.length,
    due: due.length,
    sent,
    failed,
    results,
  });
}
