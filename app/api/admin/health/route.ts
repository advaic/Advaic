import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../_guard";
import { readRuntimeControl } from "@/lib/ops/runtime-control";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekSinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const prevWeekStartIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [
    inboundRes,
    draftsRes,
    sendRowsRes,
    lastFailedRes,
    readyRes,
    approvalRes,
    humanRes,
    approvalReviewsRes,
    noEditReviewsRes,
    approvalPrevRes,
    noEditPrevRes,
    outboxRes,
    pipelineRunsRes,
    alertsRes,
    runtimeControl,
  ] = await Promise.all([
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("sender", "user")
      .gte("timestamp", sinceIso),
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .in("sender", ["agent", "assistant"])
      .gte("timestamp", sinceIso),
    (supa.from("messages") as any)
      .select("send_status")
      .in("send_status", ["pending", "sending", "sent", "failed"]),
    (supa.from("messages") as any)
      .select(
        "id, agent_id, lead_id, send_error, updated_at, timestamp, email_provider",
      )
      .eq("send_status", "failed")
      .order("updated_at", { ascending: false })
      .limit(20),
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("status", "ready_to_send")
      .eq("approval_required", false)
      .in("send_status", ["pending", "failed"]),
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("approval_required", true)
      .eq("status", "needs_approval"),
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("status", "needs_human"),
    (supa.from("message_qas") as any)
      .select("id", { count: "exact", head: true })
      .eq("prompt_key", "approval_review_v1")
      .gte("created_at", weekSinceIso),
    (supa.from("message_qas") as any)
      .select("id", { count: "exact", head: true })
      .eq("prompt_key", "approval_review_v1")
      .eq("verdict", "pass")
      .gte("created_at", weekSinceIso),
    (supa.from("message_qas") as any)
      .select("id", { count: "exact", head: true })
      .eq("prompt_key", "approval_review_v1")
      .gte("created_at", prevWeekStartIso)
      .lt("created_at", weekSinceIso),
    (supa.from("message_qas") as any)
      .select("id", { count: "exact", head: true })
      .eq("prompt_key", "approval_review_v1")
      .eq("verdict", "pass")
      .gte("created_at", prevWeekStartIso)
      .lt("created_at", weekSinceIso),
    (supa.from("messages") as any)
      .select("id, send_status, send_error, send_locked_at, status, timestamp")
      .in("send_status", ["pending", "sending", "failed"])
      .order("timestamp", { ascending: false })
      .limit(120),
    (supa.from("pipeline_runs") as any)
      .select("pipeline, status, created_at, processed, success, failed, skipped, duration_ms")
      .order("created_at", { ascending: false })
      .limit(100),
    (supa.from("ops_alert_events") as any)
      .select("alert_key, severity, status, first_opened_at, last_fired_at, resolved_at")
      .order("updated_at", { ascending: false })
      .limit(80),
    readRuntimeControl(supa),
  ]);

  // 1) Emails ingested last 24h (best-effort: count inbound user messages)
  const inbound24h = inboundRes.count ?? 0;

  // 2) Messages processed last 24h (drafts created)
  const drafts24h = draftsRes.count ?? 0;

  // 3) Send status counts (global)
  const sendRows = sendRowsRes.data;

  const sendCounts = { pending: 0, sending: 0, sent: 0, failed: 0 } as Record<
    string,
    number
  >;
  for (const r of sendRows || []) {
    const k = String(r.send_status || "").toLowerCase();
    if (sendCounts[k] !== undefined) sendCounts[k] += 1;
  }

  // 4) Recent errors (failed sends + classifier/qa failures are usually in send_error / meta tables)
  const lastFailed = lastFailedRes.data;

  // 5) Queue depth (ready_to_send / needs_approval / needs_human)
  const readyToSend = readyRes.count ?? 0;
  const needsApproval = approvalRes.count ?? 0;
  const needsHuman = humanRes.count ?? 0;

  // 6) Approval quality (7d): human approvals without edits vs with edits
  const approvalReviews7d = approvalReviewsRes.count ?? 0;
  const noEditReviews7d = noEditReviewsRes.count ?? 0;
  const approvalReviewsPrev7d = approvalPrevRes.count ?? 0;
  const noEditReviewsPrev7d = noEditPrevRes.count ?? 0;

  const total7d = Number(approvalReviews7d ?? 0);
  const pass7d = Number(noEditReviews7d ?? 0);
  const edited7d = Math.max(0, total7d - pass7d);
  const rate7d = total7d > 0 ? pass7d / total7d : null;

  const totalPrev7d = Number(approvalReviewsPrev7d ?? 0);
  const passPrev7d = Number(noEditReviewsPrev7d ?? 0);
  const ratePrev7d = totalPrev7d > 0 ? passPrev7d / totalPrev7d : null;

  const pipelineRows = Array.isArray(pipelineRunsRes.data) ? pipelineRunsRes.data : [];
  const latestByPipeline = new Map<string, any>();
  for (const row of pipelineRows) {
    const key = String(row?.pipeline || "").trim();
    if (!key || latestByPipeline.has(key)) continue;
    latestByPipeline.set(key, row);
  }

  const outbox = Array.isArray(outboxRes.data) ? outboxRes.data : [];
  const alerts = Array.isArray(alertsRes.data) ? alertsRes.data : [];

  return NextResponse.json({
    ok: true,
    since: sinceIso,
    inbound_24h: inbound24h ?? 0,
    drafts_24h: drafts24h ?? 0,
    queue: {
      ready_to_send: readyToSend ?? 0,
      needs_approval: needsApproval ?? 0,
      needs_human: needsHuman ?? 0,
    },
    approval_quality_week: {
      since: weekSinceIso,
      total_reviews: total7d,
      no_edit_count: pass7d,
      edited_count: edited7d,
      no_edit_rate: rate7d,
      previous_total_reviews: totalPrev7d,
      previous_no_edit_count: passPrev7d,
      previous_no_edit_rate: ratePrev7d,
    },
    send_status: sendCounts,
    last_failed: lastFailed || [],
    outbox,
    ops_control: runtimeControl,
    pipeline_latest: Array.from(latestByPipeline.entries()).map(([pipeline, row]) => ({
      pipeline,
      status: row?.status || "unknown",
      created_at: row?.created_at || null,
      processed: row?.processed ?? 0,
      success: row?.success ?? 0,
      failed: row?.failed ?? 0,
      skipped: row?.skipped ?? 0,
      duration_ms: row?.duration_ms ?? null,
    })),
    ops_alerts: {
      open: alerts.filter((a) => String(a.status || "") === "open").length,
      critical_open: alerts.filter(
        (a) =>
          String(a.status || "") === "open" &&
          String(a.severity || "").toLowerCase() === "critical",
      ).length,
      rows: alerts,
    },
  });
}
