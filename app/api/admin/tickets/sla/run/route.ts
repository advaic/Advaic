import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../../../_guard";

export const runtime = "nodejs";

type TicketStatus = "open" | "in_progress" | "resolved";

type TicketPayload = {
  ticket_status?: TicketStatus;
  ticket_updated_at?: string | null;
  ticket_sla_state?: "on_time" | "at_risk" | "overdue" | "resolved" | null;
  ticket_sla_checked_at?: string | null;
  ticket_escalated?: boolean | null;
  ticket_escalated_at?: string | null;
  source_message_id?: string | null;
  source_lead_id?: string | null;
  source_agent_id?: string | null;
  ticket_latest_note?: string | null;
};

function normalizeTicketStatus(v: unknown): TicketStatus {
  const s = String(v || "").trim().toLowerCase();
  if (s === "resolved") return "resolved";
  if (s === "in_progress" || s === "in-progress") return "in_progress";
  return "open";
}

function normalizePayload(raw: any): TicketPayload {
  if (!raw || typeof raw !== "object") return {};
  return raw as TicketPayload;
}

function toIso(v: unknown) {
  if (!v) return null;
  const d = new Date(String(v));
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

function minutesSince(v: unknown) {
  const iso = toIso(v);
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Math.max(0, Math.floor((Date.now() - ms) / 60000));
}

function toSlaState(args: {
  status: TicketStatus;
  updatedAt: string | null;
  warnMinutes: number;
  overdueMinutes: number;
}) {
  if (args.status === "resolved") return "resolved" as const;
  const mins = minutesSince(args.updatedAt);
  if (mins === null) return "on_time" as const;
  if (mins >= args.overdueMinutes) return "overdue" as const;
  if (mins >= args.warnMinutes) return "at_risk" as const;
  return "on_time" as const;
}

async function appendSupportNoteEvent(args: {
  supa: any;
  ticketId: string;
  agentId: string;
  leadId?: string | null;
  messageId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  note: string;
}) {
  await (args.supa.from("notification_events") as any).insert({
    agent_id: args.agentId,
    type: "support_ticket_event",
    entity_type: "support_ticket",
    entity_id: args.ticketId,
    payload: {
      ticket_id: args.ticketId,
      action: "note_added",
      actor_admin_id: args.actorId || null,
      actor_admin_email: args.actorEmail || null,
      note: args.note,
      source_message_id: args.messageId || null,
      source_lead_id: args.leadId || null,
      created_at: new Date().toISOString(),
    },
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error || "Unauthorized" }, { status: gate.status || 401 });
  }

  const supa = supabaseAdmin();
  const body = (await req.json().catch(() => ({}))) as {
    warn_minutes?: number;
    overdue_minutes?: number;
    limit?: number;
  };

  const warnMinutes = Math.max(10, Math.min(24 * 60, Number(body.warn_minutes || 60)));
  const overdueMinutes = Math.max(warnMinutes + 10, Math.min(7 * 24 * 60, Number(body.overdue_minutes || 180)));
  const limit = Math.max(1, Math.min(5000, Number(body.limit || 3000)));

  const { data: rows, error } = await (supa.from("notification_events") as any)
    .select("id, entity_id, payload, created_at")
    .eq("entity_type", "support_ticket")
    .eq("type", "support_ticket_state")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: "ticket_state_query_failed", details: error.message }, { status: 500 });
  }

  const newestByTicket = new Map<string, any>();
  for (const r of Array.isArray(rows) ? rows : []) {
    const ticketId = String(r?.entity_id || "").trim();
    if (!ticketId || newestByTicket.has(ticketId)) continue;
    newestByTicket.set(ticketId, r);
  }

  let checked = 0;
  let changed = 0;
  let becameAtRisk = 0;
  let becameOverdue = 0;
  let escalated = 0;
  const nowIso = new Date().toISOString();
  const actorId = String((gate as any)?.user?.id || "").trim() || null;
  const actorEmail = String((gate as any)?.user?.email || "").trim() || null;

  for (const [ticketId, row] of newestByTicket.entries()) {
    const payload = normalizePayload(row?.payload);
    const status = normalizeTicketStatus(payload.ticket_status);
    const updatedAt = toIso(payload.ticket_updated_at) || toIso(row?.created_at);
    const nextSla = toSlaState({
      status,
      updatedAt,
      warnMinutes,
      overdueMinutes,
    });
    checked += 1;

    const prevSla = String(payload.ticket_sla_state || "").trim().toLowerCase();
    if (prevSla === nextSla) continue;

    const nextPayload: TicketPayload = {
      ...payload,
      ticket_sla_state: nextSla,
      ticket_sla_checked_at: nowIso,
      ticket_updated_at: payload.ticket_updated_at || updatedAt || nowIso,
    };

    if (nextSla === "at_risk") becameAtRisk += 1;
    if (nextSla === "overdue") {
      becameOverdue += 1;
      if (!payload.ticket_escalated_at) {
        nextPayload.ticket_escalated = true;
        nextPayload.ticket_escalated_at = nowIso;
        escalated += 1;
      }
    }

    const { error: updErr } = await (supa.from("notification_events") as any)
      .update({ payload: nextPayload })
      .eq("id", row.id);
    if (updErr) continue;

    changed += 1;

    const agentId = String(nextPayload.source_agent_id || "").trim();
    const leadId = String(nextPayload.source_lead_id || "").trim() || null;
    const messageId = String(nextPayload.source_message_id || "").trim() || null;
    if (agentId) {
      if (nextSla === "at_risk") {
        await appendSupportNoteEvent({
          supa,
          ticketId,
          agentId,
          leadId,
          messageId,
          actorId,
          actorEmail,
          note: `SLA kritisch: Ticket seit mindestens ${warnMinutes} Minuten ohne Update.`,
        });
      }
      if (nextSla === "overdue") {
        await appendSupportNoteEvent({
          supa,
          ticketId,
          agentId,
          leadId,
          messageId,
          actorId,
          actorEmail,
          note: `SLA überfällig: Ticket seit mindestens ${overdueMinutes} Minuten ohne Update.`,
        });

        if (messageId) {
          await (supa.from("messages") as any)
            .update({ status: "needs_human" })
            .eq("id", messageId);
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    warn_minutes: warnMinutes,
    overdue_minutes: overdueMinutes,
    checked,
    changed,
    became_at_risk: becameAtRisk,
    became_overdue: becameOverdue,
    escalated,
  });
}
