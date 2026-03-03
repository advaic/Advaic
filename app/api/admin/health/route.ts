import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../_guard";
import { readRuntimeControl } from "@/lib/ops/runtime-control";

export const runtime = "nodejs";

function median(nums: number[]) {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

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
    approvalReviewRowsRes,
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
    (supa.from("message_qas") as any)
      .select("draft_message_id, created_at, meta")
      .eq("prompt_key", "approval_review_v1")
      .gte("created_at", prevWeekStartIso)
      .order("created_at", { ascending: false })
      .limit(20000),
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

  const reviewRows = Array.isArray(approvalReviewRowsRes.data)
    ? approvalReviewRowsRes.data
    : [];
  const weekStartMs = new Date(weekSinceIso).getTime();
  const trustCurrentRows: any[] = [];
  const trustPrevRows: any[] = [];
  for (const row of reviewRows) {
    const createdMs = new Date(String(row?.created_at || "")).getTime();
    if (!Number.isFinite(createdMs)) continue;
    if (createdMs >= weekStartMs) trustCurrentRows.push(row);
    else trustPrevRows.push(row);
  }

  const reviewMessageIds = Array.from(
    new Set(
      [...trustCurrentRows, ...trustPrevRows]
        .map((r) => String(r?.draft_message_id || "").trim())
        .filter(Boolean),
    ),
  );

  const sendStatusByMessageId = new Map<string, string>();
  for (const ids of chunk(reviewMessageIds, 500)) {
    const { data: messageRows } = await (supa.from("messages") as any)
      .select("id, send_status")
      .in("id", ids);
    for (const row of messageRows || []) {
      const id = String(row?.id || "").trim();
      if (!id) continue;
      sendStatusByMessageId.set(id, String(row?.send_status || "").toLowerCase());
    }
  }

  function computeTrustWindow(rows: any[]) {
    const total = rows.length;
    if (!total) {
      return {
        total: 0,
        sent_count: 0,
        send_rate: null as number | null,
        edited_count: 0,
        correction_median_seconds: null as number | null,
      };
    }

    let sent = 0;
    let edited = 0;
    const editingSeconds: number[] = [];

    for (const row of rows) {
      const messageId = String(row?.draft_message_id || "").trim();
      if (messageId && sendStatusByMessageId.get(messageId) === "sent") sent += 1;

      const meta =
        row?.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
          ? row.meta
          : {};
      const isEdited = Boolean(meta?.edited);
      if (isEdited) edited += 1;

      const sec = Number(meta?.editing_seconds);
      if (isEdited && Number.isFinite(sec) && sec >= 0) {
        editingSeconds.push(Math.round(sec));
      }
    }

    return {
      total,
      sent_count: sent,
      send_rate: total > 0 ? sent / total : null,
      edited_count: edited,
      correction_median_seconds: median(editingSeconds),
    };
  }

  const trustCurrent = computeTrustWindow(trustCurrentRows);
  const trustPrev = computeTrustWindow(trustPrevRows);
  const sendRateChangeRelPct =
    trustCurrent.send_rate !== null &&
    trustPrev.send_rate !== null &&
    trustPrev.send_rate > 0
      ? ((trustCurrent.send_rate - trustPrev.send_rate) / trustPrev.send_rate) * 100
      : null;
  const correctionMedianChangeRelPct =
    trustCurrent.correction_median_seconds !== null &&
    trustPrev.correction_median_seconds !== null &&
    trustPrev.correction_median_seconds > 0
      ? ((trustCurrent.correction_median_seconds - trustPrev.correction_median_seconds) /
          trustPrev.correction_median_seconds) *
        100
      : null;

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
    trust_kpis: {
      since: weekSinceIso,
      previous_since: prevWeekStartIso,
      approval_to_send: {
        current_rate: trustCurrent.send_rate,
        current_total: trustCurrent.total,
        current_sent: trustCurrent.sent_count,
        previous_rate: trustPrev.send_rate,
        previous_total: trustPrev.total,
        previous_sent: trustPrev.sent_count,
        relative_change_pct: sendRateChangeRelPct,
      },
      correction_time_seconds: {
        current_median: trustCurrent.correction_median_seconds,
        current_edited_count: trustCurrent.edited_count,
        previous_median: trustPrev.correction_median_seconds,
        previous_edited_count: trustPrev.edited_count,
        relative_change_pct: correctionMedianChangeRelPct,
      },
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
