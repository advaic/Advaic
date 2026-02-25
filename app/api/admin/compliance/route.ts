import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../_guard";

export const runtime = "nodejs";

function toIso(v: unknown) {
  if (!v) return null;
  const d = new Date(String(v));
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const url = new URL(req.url);
  const days = Math.max(7, Math.min(180, Number(url.searchParams.get("days") || 30)));
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: autoSent },
    { count: approvalSent },
    { count: failedSend },
    { count: queuedApproval },
    { count: queuedHuman },
    { count: ignoredClassifications },
    { data: qaRows },
    { data: sendRows },
    { data: ticketStateRows },
    { data: ticketEventRows },
  ] = await Promise.all([
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("send_status", "sent")
      .eq("approval_required", false)
      .gte("timestamp", sinceIso),
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("send_status", "sent")
      .eq("approval_required", true)
      .gte("timestamp", sinceIso),
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("send_status", "failed")
      .gte("timestamp", sinceIso),
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("status", "needs_approval")
      .gte("timestamp", sinceIso),
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("status", "needs_human")
      .gte("timestamp", sinceIso),
    (supa.from("email_classifications") as any)
      .select("id", { count: "exact", head: true })
      .eq("decision", "ignore")
      .gte("created_at", sinceIso),
    (supa.from("message_qas") as any)
      .select("id, created_at, agent_id, lead_id, inbound_message_id, draft_message_id, stage, verdict, reason, prompt_key")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(80),
    (supa.from("messages") as any)
      .select("id, agent_id, lead_id, timestamp, send_status, status, approval_required, send_error")
      .in("send_status", ["sent", "failed", "sending", "pending"])
      .gte("timestamp", sinceIso)
      .order("timestamp", { ascending: false })
      .limit(80),
    (supa.from("notification_events") as any)
      .select("entity_id, payload, created_at")
      .eq("entity_type", "support_ticket")
      .eq("type", "support_ticket_state")
      .order("created_at", { ascending: false })
      .limit(5000),
    (supa.from("notification_events") as any)
      .select("entity_id, payload, created_at")
      .eq("entity_type", "support_ticket")
      .eq("type", "support_ticket_event")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const newestTicketState = new Map<string, any>();
  for (const r of ticketStateRows || []) {
    const id = String(r?.entity_id || "").trim();
    if (!id || newestTicketState.has(id)) continue;
    newestTicketState.set(id, r);
  }

  const ticketSummary = { open: 0, in_progress: 0, resolved: 0 };
  for (const [, row] of newestTicketState.entries()) {
    const status = String((row?.payload as any)?.ticket_status || "open").toLowerCase();
    if (status === "resolved") ticketSummary.resolved += 1;
    else if (status === "in_progress" || status === "in-progress") ticketSummary.in_progress += 1;
    else ticketSummary.open += 1;
  }

  const qaAudit = (qaRows || []).map((r: any) => ({
    ts: toIso(r?.created_at),
    category: "qa_review",
    agent_id: r?.agent_id || null,
    lead_id: r?.lead_id || null,
    message_id: r?.draft_message_id || r?.inbound_message_id || null,
    summary: `${r?.prompt_key || "qa"} • verdict=${r?.verdict || "unknown"}`,
    details: r?.reason || null,
  }));
  const sendAudit = (sendRows || []).map((r: any) => ({
    ts: toIso(r?.timestamp),
    category: "send_pipeline",
    agent_id: r?.agent_id || null,
    lead_id: r?.lead_id || null,
    message_id: r?.id || null,
    summary: `send_status=${r?.send_status || "unknown"} • status=${r?.status || "unknown"} • approval=${Boolean(r?.approval_required)}`,
    details: r?.send_error || null,
  }));
  const ticketAudit = (ticketEventRows || []).map((r: any) => {
    const p = (r?.payload || {}) as any;
    return {
      ts: toIso(p?.created_at || r?.created_at),
      category: "support_ticket",
      agent_id: null,
      lead_id: p?.source_lead_id || null,
      message_id: p?.source_message_id || null,
      summary: `${p?.action || "event"} • ticket=${String(r?.entity_id || "").slice(0, 8)}…`,
      details: p?.note || null,
    };
  });

  const audit = [...qaAudit, ...sendAudit, ...ticketAudit]
    .sort((a, b) => String(b.ts || "").localeCompare(String(a.ts || "")))
    .slice(0, 120);

  return NextResponse.json({
    ok: true,
    since: sinceIso,
    days,
    metrics: {
      auto_sent: Number(autoSent || 0),
      approval_sent: Number(approvalSent || 0),
      failed_send: Number(failedSend || 0),
      queued_needs_approval: Number(queuedApproval || 0),
      queued_needs_human: Number(queuedHuman || 0),
      ignored_email_classifications: Number(ignoredClassifications || 0),
      support_tickets_open: ticketSummary.open,
      support_tickets_in_progress: ticketSummary.in_progress,
      support_tickets_resolved: ticketSummary.resolved,
    },
    trust_notes: [
      "Jede Entscheidung ist als Audit-Eintrag nachvollziehbar.",
      "Support-Tickets dokumentieren Statuswechsel, Owner und Notizen.",
      "Exportfunktionen für Reviews erhalten Sie im Compliance-Export.",
      "Rechtliche Einordnung und TOMs werden im Onboarding bereitgestellt.",
    ],
    audit,
  });
}
