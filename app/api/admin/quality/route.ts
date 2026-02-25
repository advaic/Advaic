import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../_guard";

export const runtime = "nodejs";

function clampScore(v: number) {
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10));
}

function median(nums: number[]) {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
  const days = Math.max(7, Math.min(90, Number(url.searchParams.get("days") || 30)));
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: agents }, { data: messages }, { data: reviews }, { data: leads }] = await Promise.all([
    (supa.from("agents") as any)
      .select("id, email, name, company, created_at")
      .order("created_at", { ascending: false })
      .limit(1500),
    (supa.from("messages") as any)
      .select("id, agent_id, sender, status, approval_required, send_status, timestamp")
      .gte("timestamp", sinceIso)
      .limit(50000),
    (supa.from("message_qas") as any)
      .select("id, agent_id, verdict, prompt_key, created_at")
      .eq("prompt_key", "approval_review_v1")
      .gte("created_at", sinceIso)
      .limit(50000),
    (supa.from("leads") as any)
      .select("id, agent_id, last_message_at, last_agent_message_at")
      .limit(50000),
  ]);

  let feedbackRows: any[] = [];
  try {
    const { data } = await (supa.from("message_feedback") as any)
      .select("id, agent_id, rating, created_at")
      .gte("created_at", sinceIso)
      .limit(50000);
    feedbackRows = data || [];
  } catch {
    feedbackRows = [];
  }

  const agg = new Map<
    string,
    {
      inbound: number;
      drafts: number;
      sent_total: number;
      sent_auto: number;
      sent_after_approval: number;
      failed: number;
      queue_needs_approval: number;
      queue_needs_human: number;
      qa_total: number;
      qa_no_edit: number;
      qa_edited: number;
      feedback_helpful: number;
      feedback_not_helpful: number;
      response_mins: number[];
    }
  >();
  const ensure = (id: string) => {
    if (!agg.has(id)) {
      agg.set(id, {
        inbound: 0,
        drafts: 0,
        sent_total: 0,
        sent_auto: 0,
        sent_after_approval: 0,
        failed: 0,
        queue_needs_approval: 0,
        queue_needs_human: 0,
        qa_total: 0,
        qa_no_edit: 0,
        qa_edited: 0,
        feedback_helpful: 0,
        feedback_not_helpful: 0,
        response_mins: [],
      });
    }
    return agg.get(id)!;
  };

  for (const m of messages || []) {
    const id = String(m?.agent_id || "").trim();
    if (!id) continue;
    const row = ensure(id);
    const sender = String(m?.sender || "").toLowerCase();
    const status = String(m?.status || "").toLowerCase();
    const sendStatus = String(m?.send_status || "").toLowerCase();
    const approval = Boolean(m?.approval_required);

    if (sender === "user") row.inbound += 1;
    if (sender === "assistant" || sender === "agent") row.drafts += 1;

    if (sendStatus === "sent") {
      row.sent_total += 1;
      if (approval) row.sent_after_approval += 1;
      else row.sent_auto += 1;
    }
    if (sendStatus === "failed") row.failed += 1;
    if (status === "needs_approval") row.queue_needs_approval += 1;
    if (status === "needs_human") row.queue_needs_human += 1;
  }

  for (const r of reviews || []) {
    const id = String(r?.agent_id || "").trim();
    if (!id) continue;
    const row = ensure(id);
    row.qa_total += 1;
    const verdict = String(r?.verdict || "").toLowerCase();
    if (verdict === "pass") row.qa_no_edit += 1;
    else row.qa_edited += 1;
  }

  for (const l of leads || []) {
    const id = String(l?.agent_id || "").trim();
    if (!id) continue;
    const row = ensure(id);
    const userTs = l?.last_message_at ? new Date(String(l.last_message_at)).getTime() : NaN;
    const agentTs = l?.last_agent_message_at ? new Date(String(l.last_agent_message_at)).getTime() : NaN;
    if (!Number.isFinite(userTs) || !Number.isFinite(agentTs)) continue;
    const diff = Math.floor((agentTs - userTs) / 60000);
    if (diff >= 0 && diff <= 60 * 24 * 30) row.response_mins.push(diff);
  }

  for (const f of feedbackRows || []) {
    const id = String(f?.agent_id || "").trim();
    if (!id) continue;
    const row = ensure(id);
    const rating = String(f?.rating || "").toLowerCase();
    if (rating === "helpful") row.feedback_helpful += 1;
    if (rating === "not_helpful") row.feedback_not_helpful += 1;
  }

  const rows = (agents || []).map((a: any) => {
    const id = String(a.id);
    const m = ensure(id);
    const correctionRate = m.qa_total > 0 ? m.qa_edited / m.qa_total : 0;
    const failedRate = m.sent_total > 0 ? m.failed / (m.sent_total + m.failed) : 0;
    const humanRate = m.inbound > 0 ? m.queue_needs_human / m.inbound : 0;
    const medResp = median(m.response_mins);
    const feedbackTotal = m.feedback_helpful + m.feedback_not_helpful;
    const feedbackNegativeRate =
      feedbackTotal > 0 ? m.feedback_not_helpful / feedbackTotal : 0;

    const qualityScore = clampScore(
      100 -
        failedRate * 40 -
        correctionRate * 30 -
        humanRate * 15 -
        feedbackNegativeRate * 15,
    );
    const risk =
      qualityScore < 60 || m.failed >= 5
        ? "high"
        : qualityScore < 78 || m.failed >= 2
          ? "medium"
          : "low";

    return {
      agent_id: id,
      agent_name: a.name ?? null,
      agent_email: a.email ?? null,
      company: a.company ?? null,
      inbound: m.inbound,
      drafts: m.drafts,
      sent_total: m.sent_total,
      sent_auto: m.sent_auto,
      sent_after_approval: m.sent_after_approval,
      failed: m.failed,
      queue_needs_approval: m.queue_needs_approval,
      queue_needs_human: m.queue_needs_human,
      qa_total: m.qa_total,
      qa_no_edit: m.qa_no_edit,
      qa_edited: m.qa_edited,
      feedback_helpful: m.feedback_helpful,
      feedback_not_helpful: m.feedback_not_helpful,
      correction_rate: correctionRate,
      failed_rate: failedRate,
      feedback_negative_rate: feedbackNegativeRate,
      median_response_mins: medResp,
      quality_score: qualityScore,
      risk,
    };
  });

  const filtered = rows
    .filter((r) => {
      if (!q) return true;
      return `${r.agent_name || ""} ${r.agent_email || ""} ${r.company || ""}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => a.quality_score - b.quality_score || b.failed - a.failed);

  return NextResponse.json({
    ok: true,
    days,
    since: sinceIso,
    count: filtered.length,
    rows: filtered,
  });
}
