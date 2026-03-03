import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../_guard";
import {
  applyStyleFeedbackLearning,
  normalizeFeedbackReason,
  summarizeFeedbackRootCauses,
} from "@/lib/style-feedback-learning";

export const runtime = "nodejs";

type AgentStats = {
  agent_id: string;
  failed: number;
  stuck: number;
  needs_approval: number;
  needs_human: number;
  ready_to_send: number;
  score: number;
  last_activity_at: string | null;
  sample_message_id: string | null;
  sample_lead_id: string | null;
  sample_error: string | null;
};

type TicketStatus = "open" | "in_progress" | "resolved";

type TicketPayload = {
  ticket_status?: TicketStatus;
  ticket_owner_admin_id?: string | null;
  ticket_owner_admin_email?: string | null;
  ticket_title?: string | null;
  ticket_latest_note?: string | null;
  ticket_updated_at?: string | null;
  ticket_updated_by_admin_id?: string | null;
  ticket_updated_by_admin_email?: string | null;
  source_message_id?: string | null;
  source_lead_id?: string | null;
  source_agent_id?: string | null;
  source_status?: string | null;
  source_send_status?: string | null;
  source_send_error?: string | null;
  source_created_at?: string | null;
};

type TicketEventPayload = {
  ticket_id: string;
  action:
    | "created"
    | "status_changed"
    | "owner_changed"
    | "owner_cleared"
    | "note_added";
  actor_admin_id?: string | null;
  actor_admin_email?: string | null;
  from_status?: TicketStatus | null;
  to_status?: TicketStatus | null;
  from_owner_admin_id?: string | null;
  from_owner_admin_email?: string | null;
  to_owner_admin_id?: string | null;
  to_owner_admin_email?: string | null;
  note?: string | null;
  created_at?: string | null;
};

type TicketHistoryEntry = {
  action: TicketEventPayload["action"];
  actor_admin_id: string | null;
  actor_admin_email: string | null;
  from_status: TicketStatus | null;
  to_status: TicketStatus | null;
  from_owner_admin_id: string | null;
  from_owner_admin_email: string | null;
  to_owner_admin_id: string | null;
  to_owner_admin_email: string | null;
  note: string | null;
  created_at: string | null;
};

type SupportTicket = {
  ticket_id: string;
  status: TicketStatus;
  owner_admin_id: string | null;
  owner_admin_email: string | null;
  title: string | null;
  latest_note: string | null;
  updated_at: string | null;
  updated_by_admin_id: string | null;
  updated_by_admin_email: string | null;
  source_message_id: string | null;
  source_lead_id: string | null;
  source_agent_id: string | null;
  source_agent_name?: string | null;
  source_agent_email?: string | null;
  source_agent_company?: string | null;
  source_status: string | null;
  source_send_status: string | null;
  source_send_error: string | null;
  source_created_at: string | null;
  source_lead_name?: string | null;
  source_lead_email?: string | null;
  history: TicketHistoryEntry[];
};

type TicketIndex = {
  byId: Map<string, SupportTicket>;
  byMessageId: Map<string, SupportTicket>;
  list: SupportTicket[];
  summary: { open: number; in_progress: number; resolved: number };
};

function sanitizeQuery(raw: string) {
  return String(raw || "")
    .trim()
    .slice(0, 120);
}

function safeLikeTerm(value: string) {
  return value.replace(/[%(),]/g, " ").trim();
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(v || ""),
  );
}

function minutesSince(value?: string | null) {
  if (!value) return null;
  const ms = new Date(String(value)).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((Date.now() - ms) / 60000));
}

function messageSeverity(m: any) {
  const status = String(m?.status || "").toLowerCase();
  const sendStatus = String(m?.send_status || "").toLowerCase();
  const stuck = sendStatus === "sending" && (minutesSince(m?.send_locked_at) ?? 0) >= 10;

  if (status === "needs_human") return 6;
  if (sendStatus === "failed") return 5;
  if (stuck) return 4;
  if (status === "needs_approval") return 3;
  if (status === "ready_to_send" && sendStatus === "pending") return 2;
  return 1;
}

function scoreFromStats(s: Omit<AgentStats, "score">) {
  return s.failed * 3 + s.stuck * 4 + s.needs_human * 4 + s.needs_approval * 1 + s.ready_to_send * 1;
}

function normalizeMessagePreview(v: unknown) {
  return String(v || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

type RootCause = {
  code: string;
  label: string;
  count: number;
  share: number;
  recommendation: string;
  quick_action:
    | "open_outbox_failed"
    | "open_outbox_approval"
    | "open_outbox_human"
    | "safe_mode_top_agent"
    | "style_feedback_loop";
};

function buildSupportRootCauses(args: {
  incidents: any[];
  feedbackRows: any[];
}) {
  const issueCounts = new Map<string, number>();
  const issueMeta = new Map<string, Omit<RootCause, "count" | "share">>();

  const addIssue = (
    code: RootCause["code"],
    label: RootCause["label"],
    recommendation: RootCause["recommendation"],
    quickAction: RootCause["quick_action"],
    weight = 1,
  ) => {
    issueCounts.set(code, Number(issueCounts.get(code) || 0) + weight);
    if (!issueMeta.has(code)) {
      issueMeta.set(code, {
        code,
        label,
        recommendation,
        quick_action: quickAction,
      });
    }
  };

  for (const incident of args.incidents || []) {
    const status = String(incident?.status || "").toLowerCase();
    const sendStatus = String(incident?.send_status || "").toLowerCase();
    const stuck = Boolean(incident?.stuck);

    if (sendStatus === "failed") {
      addIssue(
        "send_failed",
        "Versandfehler",
        "Outbox-Fehler priorisieren, Provider-Fehler analysieren und betroffene Agents temporär auf Safe Mode setzen.",
        "open_outbox_failed",
      );
    }
    if (stuck || sendStatus === "sending") {
      addIssue(
        "sending_lock",
        "Sending-Locks",
        "Locks aktiv lösen und betroffene Nachrichten sofort neu einreihen.",
        "open_outbox_failed",
      );
    }
    if (status === "needs_human") {
      addIssue(
        "needs_human",
        "Menschliche Eskalationen",
        "Human-Queue priorisieren und wiederkehrende Eskalationsmuster als Guardrail-Regel absichern.",
        "open_outbox_human",
      );
    }
    if (status === "needs_approval") {
      addIssue(
        "approval_backlog",
        "Freigabe-Rückstau",
        "Freigabe-Queue priorisieren und Auto/Freigabe-Regeln nachkalibrieren.",
        "open_outbox_approval",
      );
    }
  }

  const feedbackSummary = summarizeFeedbackRootCauses(args.feedbackRows || []);
  for (const reason of feedbackSummary.by_reason) {
    const code = `feedback_${reason.code}`;
    if (reason.code === "zu_lang") {
      addIssue(
        code,
        "Feedback: Zu lange Entwürfe",
        "Längenregel auf kurz setzen und strukturierte Kurzantworten als Stilanker erzwingen.",
        "style_feedback_loop",
        reason.count,
      );
    } else if (reason.code === "falscher_fokus") {
      addIssue(
        code,
        "Feedback: Falscher Fokus",
        "Fragefokus-Regel schärfen und Kontextanker vor den Antworttext setzen.",
        "style_feedback_loop",
        reason.count,
      );
    } else if (reason.code === "fehlende_infos") {
      addIssue(
        code,
        "Feedback: Fehlende Infos",
        "Rückfragepflicht bei fehlendem Objektbezug aktivieren.",
        "style_feedback_loop",
        reason.count,
      );
    }
  }

  const total = Array.from(issueCounts.values()).reduce((acc, v) => acc + Number(v || 0), 0);
  const rootCauses: RootCause[] = Array.from(issueCounts.entries())
    .map(([code, count]) => {
      const meta = issueMeta.get(code);
      return {
        code,
        label: meta?.label || code,
        count,
        share: total > 0 ? count / total : 0,
        recommendation: meta?.recommendation || "Analyse und Maßnahmen nötig.",
        quick_action: meta?.quick_action || "style_feedback_loop",
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    rootCauses,
    feedbackSummary,
  };
}

function normalizeTicketStatus(value: unknown): TicketStatus {
  const s = String(value || "")
    .trim()
    .toLowerCase();
  if (s === "resolved") return "resolved";
  if (s === "in_progress" || s === "in-progress") return "in_progress";
  return "open";
}

function normalizeTicketPayload(raw: any): TicketPayload {
  if (!raw || typeof raw !== "object") return {};
  return raw as TicketPayload;
}

function normalizeTicketEventPayload(raw: any): TicketEventPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const ticketId = String(raw.ticket_id || "").trim();
  if (!ticketId) return null;
  return raw as TicketEventPayload;
}

function clampNote(note: unknown) {
  return String(note || "").trim().slice(0, 2000);
}

function buildTicketTitle(args: {
  leadName?: string | null;
  leadEmail?: string | null;
  sendStatus?: string | null;
  status?: string | null;
  sendError?: string | null;
}) {
  const who = args.leadName || args.leadEmail || "Lead";
  if (args.sendError) return `${who}: Versandproblem prüfen`;
  if (String(args.sendStatus || "").toLowerCase() === "sending") return `${who}: Sending-Lock prüfen`;
  if (String(args.status || "").toLowerCase() === "needs_human") return `${who}: Eskalation prüfen`;
  if (String(args.status || "").toLowerCase() === "needs_approval") return `${who}: Freigabe-Rückstau prüfen`;
  return `${who}: Supportfall prüfen`;
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(String(value));
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

function isNewerIso(a?: string | null, b?: string | null) {
  const aTs = a ? new Date(a).getTime() : 0;
  const bTs = b ? new Date(b).getTime() : 0;
  return aTs > bTs;
}

function sortIsoDesc<T>(rows: T[], getIso: (row: T) => string | null) {
  return [...rows].sort((x, y) =>
    String(getIso(y) || "").localeCompare(String(getIso(x) || "")),
  );
}

function parseTicketFromStateRow(row: any): SupportTicket | null {
  const payload = normalizeTicketPayload(row?.payload);
  const ticketId = String(row?.entity_id || "").trim();
  if (!ticketId) return null;
  const updatedAt = toIso(payload.ticket_updated_at) || toIso(row?.created_at);
  return {
    ticket_id: ticketId,
    status: normalizeTicketStatus(payload.ticket_status),
    owner_admin_id: payload.ticket_owner_admin_id || null,
    owner_admin_email: payload.ticket_owner_admin_email || null,
    title: payload.ticket_title || null,
    latest_note: payload.ticket_latest_note || null,
    updated_at: updatedAt,
    updated_by_admin_id: payload.ticket_updated_by_admin_id || null,
    updated_by_admin_email: payload.ticket_updated_by_admin_email || null,
    source_message_id: payload.source_message_id || null,
    source_lead_id: payload.source_lead_id || null,
    source_agent_id: payload.source_agent_id || null,
    source_status: payload.source_status || null,
    source_send_status: payload.source_send_status || null,
    source_send_error: payload.source_send_error || null,
    source_created_at: toIso(payload.source_created_at),
    history: [],
  };
}

function parseTicketHistoryRow(row: any): TicketHistoryEntry | null {
  const payload = normalizeTicketEventPayload(row?.payload);
  if (!payload) return null;
  return {
    action: payload.action,
    actor_admin_id: payload.actor_admin_id || null,
    actor_admin_email: payload.actor_admin_email || null,
    from_status: payload.from_status ? normalizeTicketStatus(payload.from_status) : null,
    to_status: payload.to_status ? normalizeTicketStatus(payload.to_status) : null,
    from_owner_admin_id: payload.from_owner_admin_id || null,
    from_owner_admin_email: payload.from_owner_admin_email || null,
    to_owner_admin_id: payload.to_owner_admin_id || null,
    to_owner_admin_email: payload.to_owner_admin_email || null,
    note: payload.note ? String(payload.note).slice(0, 2000) : null,
    created_at: toIso(payload.created_at) || toIso(row?.created_at),
  };
}

async function appendTicketEvent(args: {
  supa: any;
  agentId: string;
  leadId?: string | null;
  ticketId: string;
  messageId?: string | null;
  payload: TicketEventPayload;
}) {
  await (args.supa.from("notification_events") as any).insert({
    agent_id: args.agentId,
    type: "support_ticket_event",
    entity_type: "support_ticket",
    entity_id: args.ticketId,
    payload: {
      ...args.payload,
      ticket_id: args.ticketId,
      source_message_id: args.messageId || null,
      source_lead_id: args.leadId || null,
      created_at: new Date().toISOString(),
    },
  });
}

async function upsertTicketState(args: {
  supa: any;
  ticketId: string;
  agentId: string;
  payload: TicketPayload;
}) {
  const existingRes = await (args.supa.from("notification_events") as any)
    .select("id, entity_id, payload, created_at")
    .eq("type", "support_ticket_state")
    .eq("entity_type", "support_ticket")
    .eq("entity_id", args.ticketId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const existing = existingRes?.data || null;

  if (existing?.id) {
    const prev = normalizeTicketPayload(existing.payload);
    const merged = { ...prev, ...args.payload };
    const { error } = await (args.supa.from("notification_events") as any)
      .update({
        agent_id: args.agentId,
        payload: merged,
      })
      .eq("id", existing.id);
    if (error) {
      return { ticket: null as SupportTicket | null, error: error.message || "ticket_update_failed" };
    }
    return {
      ticket: parseTicketFromStateRow({
        ...existing,
        entity_id: args.ticketId,
        payload: merged,
      }),
      error: null as string | null,
    };
  }

  const { data: created, error } = await (args.supa.from("notification_events") as any)
    .insert({
      agent_id: args.agentId,
      type: "support_ticket_state",
      entity_type: "support_ticket",
      entity_id: args.ticketId,
      payload: args.payload,
    })
    .select("id, entity_id, payload, created_at")
    .single();
  if (error) {
    return { ticket: null as SupportTicket | null, error: error.message || "ticket_insert_failed" };
  }
  return { ticket: parseTicketFromStateRow(created), error: null as string | null };
}

async function loadTicketIndex(supa: any): Promise<TicketIndex> {
  const { data: stateRows } = await (supa.from("notification_events") as any)
    .select("id, entity_id, payload, created_at")
    .eq("entity_type", "support_ticket")
    .eq("type", "support_ticket_state")
    .order("created_at", { ascending: false })
    .limit(3000);

  const byId = new Map<string, SupportTicket>();
  for (const row of Array.isArray(stateRows) ? stateRows : []) {
    const ticket = parseTicketFromStateRow(row);
    if (!ticket) continue;
    const prev = byId.get(ticket.ticket_id);
    if (!prev || isNewerIso(ticket.updated_at, prev.updated_at)) {
      byId.set(ticket.ticket_id, ticket);
    }
  }

  const ticketIds = Array.from(byId.keys());
  const historyByTicket = new Map<string, TicketHistoryEntry[]>();
  if (ticketIds.length > 0) {
    const { data: historyRows } = await (supa.from("notification_events") as any)
      .select("entity_id, payload, created_at")
      .eq("entity_type", "support_ticket")
      .eq("type", "support_ticket_event")
      .in("entity_id", ticketIds)
      .order("created_at", { ascending: false })
      .limit(6000);
    for (const row of Array.isArray(historyRows) ? historyRows : []) {
      const ticketId = String(row?.entity_id || "").trim();
      if (!ticketId) continue;
      const parsed = parseTicketHistoryRow(row);
      if (!parsed) continue;
      if (!historyByTicket.has(ticketId)) historyByTicket.set(ticketId, []);
      historyByTicket.get(ticketId)!.push(parsed);
    }
    for (const [id, items] of historyByTicket.entries()) {
      historyByTicket.set(id, sortIsoDesc(items, (x) => x.created_at).slice(0, 16));
    }
  }

  const list = sortIsoDesc(Array.from(byId.values()), (x) => x.updated_at).map((t) => ({
    ...t,
    history: historyByTicket.get(t.ticket_id) || [],
  }));

  const byMessageId = new Map<string, SupportTicket>();
  for (const t of list) {
    if (!t.source_message_id) continue;
    const prev = byMessageId.get(t.source_message_id);
    if (!prev || isNewerIso(t.updated_at, prev.updated_at)) {
      byMessageId.set(t.source_message_id, t);
    }
  }

  return {
    byId: new Map(list.map((x) => [x.ticket_id, x])),
    byMessageId,
    list,
    summary: {
      open: list.filter((x) => x.status === "open").length,
      in_progress: list.filter((x) => x.status === "in_progress").length,
      resolved: list.filter((x) => x.status === "resolved").length,
    },
  };
}

async function findTicketByMessageId(supa: any, messageId: string) {
  const index = await loadTicketIndex(supa);
  return index.byMessageId.get(messageId) || null;
}

async function loadTicketById(supa: any, ticketId: string) {
  const { data: row } = await (supa.from("notification_events") as any)
    .select("entity_id, payload, created_at")
    .eq("entity_type", "support_ticket")
    .eq("type", "support_ticket_state")
    .eq("entity_id", ticketId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ticket = parseTicketFromStateRow(row);
  if (!ticket) return null;

  const { data: historyRows } = await (supa.from("notification_events") as any)
    .select("entity_id, payload, created_at")
    .eq("entity_type", "support_ticket")
    .eq("type", "support_ticket_event")
    .eq("entity_id", ticketId)
    .order("created_at", { ascending: false })
    .limit(60);
  const history = Array.isArray(historyRows)
    ? historyRows
        .map(parseTicketHistoryRow)
        .filter((x): x is TicketHistoryEntry => Boolean(x))
    : [];
  return { ...ticket, history };
}

async function loadMessageContext(supa: any, messageId: string) {
  const { data: message, error: messageErr } = await (supa.from("messages") as any)
    .select("id, agent_id, lead_id, status, send_status, send_error, timestamp")
    .eq("id", messageId)
    .maybeSingle();
  if (messageErr) return { message: null as any, lead: null as any, error: messageErr.message };
  if (!message) return { message: null as any, lead: null as any, error: "message_not_found" };

  const leadId = String(message?.lead_id || "").trim();
  let lead: any = null;
  if (leadId) {
    const { data } = await (supa.from("leads") as any)
      .select("id, name, email")
      .eq("id", leadId)
      .maybeSingle();
    lead = data || null;
  }
  return { message, lead, error: null as string | null };
}

async function runSendRunnerNow(messageId: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET || "";
  if (!siteUrl || !secret) return { triggered: false, reason: "missing_runner_env" };

  await fetch(new URL("/api/pipeline/reply-ready/send/run", siteUrl).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-advaic-internal-secret": secret,
    },
    body: JSON.stringify({
      reason: "admin_support_retry",
      id: messageId,
      message_id: messageId,
    }),
  }).catch(() => null);

  return { triggered: true };
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error || "Unauthorized" }, { status: gate.status || 401 });
  }

  const supa = supabaseAdmin();
  const url = new URL(req.url);
  const qRaw = sanitizeQuery(url.searchParams.get("q") || "");
  const qLike = safeLikeTerm(qRaw);
  const qIsUuid = isUuid(qRaw);
  const nowMs = Date.now();
  const since30Iso = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since60Iso = new Date(nowMs - 60 * 24 * 60 * 60 * 1000).toISOString();
  const since90Iso = new Date(nowMs - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: problematicMsgs, error: msgErr } = await (supa.from("messages") as any)
    .select(
      "id, agent_id, lead_id, status, approval_required, send_status, send_locked_at, send_error, timestamp, email_provider",
    )
    .or(
      "send_status.eq.failed,send_status.eq.sending,status.eq.needs_approval,status.eq.needs_human,status.eq.ready_to_send",
    )
    .order("timestamp", { ascending: false })
    .limit(4000);

  if (msgErr) {
    return NextResponse.json(
      { error: "support_messages_query_failed", details: msgErr.message },
      { status: 500 },
    );
  }

  const statsMap = new Map<string, Omit<AgentStats, "score">>();
  const allMsgs = Array.isArray(problematicMsgs) ? problematicMsgs : [];
  for (const m of allMsgs) {
    const agentId = String(m?.agent_id || "").trim();
    if (!agentId) continue;

    const status = String(m?.status || "").toLowerCase();
    const sendStatus = String(m?.send_status || "").toLowerCase();
    const lockedMins = minutesSince(m?.send_locked_at);
    const stuck = sendStatus === "sending" && lockedMins !== null && lockedMins >= 10;

    if (!statsMap.has(agentId)) {
      statsMap.set(agentId, {
        agent_id: agentId,
        failed: 0,
        stuck: 0,
        needs_approval: 0,
        needs_human: 0,
        ready_to_send: 0,
        last_activity_at: m?.timestamp ?? null,
        sample_message_id: String(m?.id || "") || null,
        sample_lead_id: String(m?.lead_id || "") || null,
        sample_error: m?.send_error ? String(m.send_error).slice(0, 220) : null,
      });
    }

    const row = statsMap.get(agentId)!;
    if (sendStatus === "failed") row.failed += 1;
    if (stuck) row.stuck += 1;
    if (status === "needs_approval" && m?.approval_required) row.needs_approval += 1;
    if (status === "needs_human") row.needs_human += 1;
    if (status === "ready_to_send" && sendStatus === "pending") row.ready_to_send += 1;
  }

  const agentIds = Array.from(statsMap.keys());

  const [{ data: agents }, { data: settings }, ticketIndex, feedbackRes, activityRes] = await Promise.all([
    agentIds.length > 0
      ? (supa.from("agents") as any)
          .select("id, email, name, company, created_at")
          .in("id", agentIds)
      : Promise.resolve({ data: [] as any[] }),
    agentIds.length > 0
      ? (supa.from("agent_settings") as any)
          .select("agent_id, autosend_enabled, followups_enabled_default, onboarding_completed, updated_at")
          .in("agent_id", agentIds)
      : Promise.resolve({ data: [] as any[] }),
    loadTicketIndex(supa),
    (supa.from("message_feedback") as any)
      .select("agent_id, rating, reason, updated_at")
      .gte("updated_at", since30Iso)
      .limit(20000),
    (supa.from("messages") as any)
      .select("agent_id, sender, status, send_status, timestamp")
      .eq("sender", "user")
      .gte("timestamp", since90Iso)
      .limit(80000),
  ]);

  const agentMap = new Map<string, any>();
  for (const a of agents || []) agentMap.set(String(a.id), a);
  const settingsMap = new Map<string, any>();
  for (const s of settings || []) settingsMap.set(String(s.agent_id), s);

  const criticalAgents = Array.from(statsMap.values())
    .map((s) => {
      const score = scoreFromStats(s);
      const a = agentMap.get(s.agent_id);
      const cfg = settingsMap.get(s.agent_id);
      return {
        ...s,
        score,
        agent_name: a?.name ?? null,
        agent_email: a?.email ?? null,
        company: a?.company ?? null,
        autosend_enabled: cfg?.autosend_enabled ?? null,
        followups_enabled_default: cfg?.followups_enabled_default ?? null,
        onboarding_completed: cfg?.onboarding_completed ?? null,
      };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || String(b.last_activity_at || "").localeCompare(String(a.last_activity_at || "")))
    .slice(0, 30);

  const incidentRows = [...allMsgs]
    .sort((a, b) => {
      const sev = messageSeverity(b) - messageSeverity(a);
      if (sev !== 0) return sev;
      return String(b?.timestamp || "").localeCompare(String(a?.timestamp || ""));
    })
    .slice(0, 40);

  const leadIds = Array.from(
    new Set(incidentRows.map((m) => String(m?.lead_id || "").trim()).filter(Boolean)),
  );
  const { data: leadsForIncidents } = leadIds.length
    ? await (supa.from("leads") as any)
        .select("id, name, email")
        .in("id", leadIds)
    : { data: [] as any[] };
  const leadMap = new Map<string, any>();
  for (const l of leadsForIncidents || []) leadMap.set(String(l.id), l);

  const ticketAgentIds = Array.from(
    new Set(ticketIndex.list.map((t) => String(t?.source_agent_id || "").trim()).filter(Boolean)),
  );
  const missingTicketAgentIds = ticketAgentIds.filter((id) => !agentMap.has(id));
  if (missingTicketAgentIds.length > 0) {
    const { data: missingAgents } = await (supa.from("agents") as any)
      .select("id, email, name, company, created_at")
      .in("id", missingTicketAgentIds);
    for (const a of missingAgents || []) agentMap.set(String(a.id), a);
  }

  const ticketLeadIds = Array.from(
    new Set(ticketIndex.list.map((t) => String(t?.source_lead_id || "").trim()).filter(Boolean)),
  );
  const missingTicketLeadIds = ticketLeadIds.filter((id) => !leadMap.has(id));
  if (missingTicketLeadIds.length > 0) {
    const { data: missingLeads } = await (supa.from("leads") as any)
      .select("id, name, email")
      .in("id", missingTicketLeadIds);
    for (const l of missingLeads || []) leadMap.set(String(l.id), l);
  }

  const enrichedTickets: SupportTicket[] = ticketIndex.list.map((t) => {
    const agent = t.source_agent_id ? agentMap.get(String(t.source_agent_id)) : null;
    const lead = t.source_lead_id ? leadMap.get(String(t.source_lead_id)) : null;
    return {
      ...t,
      source_agent_name: agent?.name ?? null,
      source_agent_email: agent?.email ?? null,
      source_agent_company: agent?.company ?? null,
      source_lead_name: lead?.name ?? null,
      source_lead_email: lead?.email ?? null,
    };
  });
  const ticketByMessageId = new Map<string, SupportTicket>();
  for (const t of enrichedTickets) {
    const mid = String(t?.source_message_id || "").trim();
    if (!mid) continue;
    const prev = ticketByMessageId.get(mid);
    if (!prev || isNewerIso(t.updated_at, prev.updated_at)) {
      ticketByMessageId.set(mid, t);
    }
  }

  const incidents = incidentRows.map((m) => {
    const agentId = String(m?.agent_id || "");
    const leadId = String(m?.lead_id || "");
    const lead = leadMap.get(leadId);
    const agent = agentMap.get(agentId);
    const lockedMins = minutesSince(m?.send_locked_at);
    const stuck = String(m?.send_status || "").toLowerCase() === "sending" && lockedMins !== null && lockedMins >= 10;
    const messageId = String(m?.id || "");
    return {
      message_id: messageId,
      agent_id: agentId,
      agent_name: agent?.name ?? null,
      agent_email: agent?.email ?? null,
      lead_id: leadId,
      lead_name: lead?.name ?? null,
      lead_email: lead?.email ?? null,
      status: m?.status ?? null,
      send_status: m?.send_status ?? null,
      send_error: m?.send_error ? String(m.send_error).slice(0, 280) : null,
      timestamp: m?.timestamp ?? null,
      stuck,
      minutes_locked: lockedMins,
      ticket: ticketByMessageId.get(messageId) || null,
    };
  });

  const feedbackRows = Array.isArray(feedbackRes?.data) ? feedbackRes.data : [];
  const rootCauseData = buildSupportRootCauses({
    incidents,
    feedbackRows: feedbackRows.filter((row: any) => String(row?.rating || "").toLowerCase() === "not_helpful"),
  });

  const activityRows = Array.isArray(activityRes?.data) ? activityRes.data : [];
  const setCurrent = new Set<string>();
  const setPrev = new Set<string>();
  const setPrev2 = new Set<string>();

  const currentStartMs = nowMs - 30 * 24 * 60 * 60 * 1000;
  const prevStartMs = nowMs - 60 * 24 * 60 * 60 * 1000;
  const prev2StartMs = nowMs - 90 * 24 * 60 * 60 * 1000;

  for (const row of activityRows) {
    const agentId = String(row?.agent_id || "").trim();
    if (!agentId) continue;
    const ts = new Date(String(row?.timestamp || "")).getTime();
    if (!Number.isFinite(ts)) continue;
    if (ts >= currentStartMs) setCurrent.add(agentId);
    else if (ts >= prevStartMs) setPrev.add(agentId);
    else if (ts >= prev2StartMs) setPrev2.add(agentId);
  }

  let retainedCurrent = 0;
  for (const id of setPrev) {
    if (setCurrent.has(id)) retainedCurrent += 1;
  }
  let retainedPrevious = 0;
  for (const id of setPrev2) {
    if (setPrev.has(id)) retainedPrevious += 1;
  }
  const retentionRateCurrent = setPrev.size > 0 ? retainedCurrent / setPrev.size : 0;
  const retentionRatePrevious = setPrev2.size > 0 ? retainedPrevious / setPrev2.size : 0;
  const retentionDeltaPp = Math.round((retentionRateCurrent - retentionRatePrevious) * 1000) / 10;

  const issueRowsCurrent = allMsgs.filter((m) => {
    const ts = new Date(String(m?.timestamp || "")).getTime();
    if (!Number.isFinite(ts) || ts < currentStartMs) return false;
    const status = String(m?.status || "").toLowerCase();
    const sendStatus = String(m?.send_status || "").toLowerCase();
    return sendStatus === "failed" || status === "needs_human" || status === "needs_approval";
  });
  const issueRowsPrev = allMsgs.filter((m) => {
    const ts = new Date(String(m?.timestamp || "")).getTime();
    if (!Number.isFinite(ts) || ts < prevStartMs || ts >= currentStartMs) return false;
    const status = String(m?.status || "").toLowerCase();
    const sendStatus = String(m?.send_status || "").toLowerCase();
    return sendStatus === "failed" || status === "needs_human" || status === "needs_approval";
  });

  const supportLoadCurrent =
    setCurrent.size > 0 ? issueRowsCurrent.length / setCurrent.size : 0;
  const supportLoadPrevious =
    setPrev.size > 0 ? issueRowsPrev.length / setPrev.size : 0;
  const supportLoadDeltaPct =
    supportLoadPrevious > 0
      ? ((supportLoadCurrent - supportLoadPrevious) / supportLoadPrevious) * 100
      : 0;

  let searchAgents: any[] = [];
  let searchLeads: any[] = [];
  let searchMessages: any[] = [];

  if (qRaw) {
    if (qIsUuid) {
      const [{ data: a }, { data: l }, { data: m }] = await Promise.all([
        (supa.from("agents") as any)
          .select("id, email, name, company, created_at")
          .eq("id", qRaw)
          .limit(8),
        (supa.from("leads") as any)
          .select("id, agent_id, name, email, status, priority, last_message_at")
          .eq("id", qRaw)
          .limit(8),
        (supa.from("messages") as any)
          .select("id, agent_id, lead_id, status, approval_required, send_status, send_error, timestamp, text, email_provider")
          .eq("id", qRaw)
          .limit(8),
      ]);
      searchAgents = Array.isArray(a) ? a : [];
      searchLeads = Array.isArray(l) ? l : [];
      searchMessages = Array.isArray(m) ? m : [];
    } else if (qLike.length >= 2) {
      const [{ data: a }, { data: l }, { data: m }] = await Promise.all([
        (supa.from("agents") as any)
          .select("id, email, name, company, created_at")
          .or(`email.ilike.%${qLike}%,name.ilike.%${qLike}%,company.ilike.%${qLike}%`)
          .order("created_at", { ascending: false })
          .limit(12),
        (supa.from("leads") as any)
          .select("id, agent_id, name, email, status, priority, last_message_at")
          .or(`email.ilike.%${qLike}%,name.ilike.%${qLike}%`)
          .order("last_message_at", { ascending: false })
          .limit(12),
        qLike.length >= 3
          ? (supa.from("messages") as any)
              .select("id, agent_id, lead_id, status, approval_required, send_status, send_error, timestamp, text, email_provider")
              .or(`send_error.ilike.%${qLike}%,text.ilike.%${qLike}%`)
              .order("timestamp", { ascending: false })
              .limit(12)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      searchAgents = Array.isArray(a) ? a : [];
      searchLeads = Array.isArray(l) ? l : [];
      searchMessages = Array.isArray(m) ? m : [];
    }
  }

  searchMessages = searchMessages.map((m) => ({
    ...m,
    text_preview: normalizeMessagePreview(m?.text),
  }));

  const summary = {
    critical_agents: criticalAgents.length,
    failed: criticalAgents.reduce((acc, x) => acc + Number(x.failed || 0), 0),
    stuck: criticalAgents.reduce((acc, x) => acc + Number(x.stuck || 0), 0),
    needs_approval: criticalAgents.reduce((acc, x) => acc + Number(x.needs_approval || 0), 0),
    needs_human: criticalAgents.reduce((acc, x) => acc + Number(x.needs_human || 0), 0),
    ready_to_send: criticalAgents.reduce((acc, x) => acc + Number(x.ready_to_send || 0), 0),
  };

  return NextResponse.json({
    ok: true,
    viewer: {
      id: String((gate as any)?.user?.id || "") || null,
      email: String((gate as any)?.user?.email || "") || null,
    },
    q: qRaw || null,
    summary,
    ticket_summary: ticketIndex.summary,
    root_causes: rootCauseData.rootCauses,
    retention_kpi: {
      previous_active_agents_30d: setPrev.size,
      current_active_agents_30d: setCurrent.size,
      retained_agents_30d: retainedCurrent,
      retention_rate: Math.round(retentionRateCurrent * 1000) / 1000,
      previous_retention_rate: Math.round(retentionRatePrevious * 1000) / 1000,
      delta_pp: retentionDeltaPp,
      sprint6_goal_met: retentionDeltaPp >= 15,
    },
    support_kpi: {
      current_issues_per_active_agent: Math.round(supportLoadCurrent * 100) / 100,
      previous_issues_per_active_agent: Math.round(supportLoadPrevious * 100) / 100,
      delta_pct: Math.round(supportLoadDeltaPct * 10) / 10,
      sprint6_goal_met: supportLoadDeltaPct <= -25,
      negative_feedback_total_30d: rootCauseData.feedbackSummary.total_negative,
      top_feedback_reason: rootCauseData.feedbackSummary.by_reason[0]?.code || null,
    },
    tickets: enrichedTickets.slice(0, 240),
    critical_agents: criticalAgents,
    incidents,
    search: {
      agents: searchAgents,
      leads: searchLeads,
      messages: searchMessages,
    },
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error || "Unauthorized" }, { status: gate.status || 401 });
  }

  const supa = supabaseAdmin();
  const body = (await req.json().catch(() => null)) as
    | {
        action?: string;
        agent_id?: string;
        message_id?: string;
        run_now?: boolean;
        ticket_id?: string;
        ticket_status?: TicketStatus | string;
        note?: string;
        force?: boolean;
      }
    | null;

  const action = String(body?.action || "").trim().toLowerCase();
  const agentId = String(body?.agent_id || "").trim();
  const messageId = String(body?.message_id || "").trim();
  const ticketId = String(body?.ticket_id || "").trim();
  const adminId = String((gate as any)?.user?.id || "").trim() || null;
  const adminEmail = String((gate as any)?.user?.email || "").trim() || null;

  if (!action) {
    return NextResponse.json({ error: "missing_action" }, { status: 400 });
  }

  if (action === "pause_autosend") {
    if (!agentId) return NextResponse.json({ error: "missing_agent_id" }, { status: 400 });
    const { data, error } = await (supa.from("agent_settings") as any)
      .upsert(
        {
          agent_id: agentId,
          autosend_enabled: false,
          reply_mode: "approval",
        },
        { onConflict: "agent_id" },
      )
      .select("agent_id, autosend_enabled, reply_mode")
      .maybeSingle();

    if (error) return NextResponse.json({ error: "pause_autosend_failed", details: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action, settings: data });
  }

  if (action === "pause_followups") {
    if (!agentId) return NextResponse.json({ error: "missing_agent_id" }, { status: 400 });
    const { data, error } = await (supa.from("agent_settings") as any)
      .upsert(
        {
          agent_id: agentId,
          followups_enabled_default: false,
        },
        { onConflict: "agent_id" },
      )
      .select("agent_id, followups_enabled_default")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "pause_followups_failed", details: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, action, settings: data });
  }

  if (action === "safe_mode") {
    if (!agentId) return NextResponse.json({ error: "missing_agent_id" }, { status: 400 });
    const { data, error } = await (supa.from("agent_settings") as any)
      .upsert(
        {
          agent_id: agentId,
          autosend_enabled: false,
          followups_enabled_default: false,
          reply_mode: "approval",
        },
        { onConflict: "agent_id" },
      )
      .select("agent_id, autosend_enabled, followups_enabled_default, reply_mode")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "safe_mode_failed", details: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action, settings: data });
  }

  if (action === "run_style_feedback_loop") {
    const force = Boolean(body?.force);
    let targetAgentIds: string[] = [];

    if (agentId) {
      targetAgentIds = [agentId];
    } else {
      const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: feedbackRows } = await (supa.from("message_feedback") as any)
        .select("agent_id, rating, reason, updated_at")
        .gte("updated_at", sinceIso)
        .limit(40000);

      const byAgent = new Map<string, { negative: number; weighted: number }>();
      for (const row of Array.isArray(feedbackRows) ? feedbackRows : []) {
        const id = String(row?.agent_id || "").trim();
        if (!id) continue;
        if (!byAgent.has(id)) byAgent.set(id, { negative: 0, weighted: 0 });
        const agg = byAgent.get(id)!;
        if (String(row?.rating || "").toLowerCase() !== "not_helpful") continue;
        agg.negative += 1;
        const reasonCode = normalizeFeedbackReason(row?.reason, "not_helpful");
        if (reasonCode === "zu_lang" || reasonCode === "falscher_fokus" || reasonCode === "fehlende_infos") {
          agg.weighted += 2;
        } else {
          agg.weighted += 1;
        }
      }

      targetAgentIds = Array.from(byAgent.entries())
        .filter(([, value]) => value.negative >= 3)
        .sort((a, b) => b[1].weighted - a[1].weighted)
        .slice(0, 24)
        .map(([id]) => id);
    }

    const results: Array<{ agent_id: string; ok: boolean; changed?: boolean; skipped?: string; error?: string }> = [];
    for (const id of targetAgentIds) {
      try {
        const result = await applyStyleFeedbackLearning({
          supa,
          agentId: id,
          source: "admin_support_loop",
          force,
        });
        results.push({
          agent_id: id,
          ok: Boolean(result?.ok),
          changed: Boolean((result as any)?.changed),
          skipped: (result as any)?.skipped || undefined,
          error: (result as any)?.error || undefined,
        });
      } catch (e: any) {
        results.push({
          agent_id: id,
          ok: false,
          error: String(e?.message || "style_feedback_loop_failed"),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      action,
      force,
      processed: targetAgentIds.length,
      changed: results.filter((r) => r.changed).length,
      results,
    });
  }

  if (action === "retry_message") {
    if (!messageId) return NextResponse.json({ error: "missing_message_id" }, { status: 400 });
    const { error } = await (supa.from("messages") as any)
      .update({
        send_locked_at: null,
        send_status: "pending",
        send_error: null,
        status: "ready_to_send",
      })
      .eq("id", messageId);
    if (error) {
      return NextResponse.json({ error: "retry_message_failed", details: error.message }, { status: 500 });
    }

    const runNow = Boolean(body?.run_now);
    const runner = runNow ? await runSendRunnerNow(messageId) : { triggered: false };
    return NextResponse.json({ ok: true, action, message_id: messageId, runner });
  }

  if (action === "unlock_message") {
    if (!messageId) return NextResponse.json({ error: "missing_message_id" }, { status: 400 });
    const { error } = await (supa.from("messages") as any)
      .update({
        send_locked_at: null,
        send_status: "failed",
        send_error: "admin_unlock_support_hub",
      })
      .eq("id", messageId);

    if (error) {
      return NextResponse.json({ error: "unlock_message_failed", details: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action, message_id: messageId });
  }

  if (action === "open_ticket") {
    if (!messageId) return NextResponse.json({ error: "missing_message_id" }, { status: 400 });

    const already = await findTicketByMessageId(supa, messageId);
    if (already) {
      return NextResponse.json({ ok: true, action, ticket: already, existed: true });
    }

    const ctx = await loadMessageContext(supa, messageId);
    if (ctx.error || !ctx.message) {
      return NextResponse.json(
        { error: "ticket_message_context_failed", details: ctx.error || "message_not_found" },
        { status: 400 },
      );
    }
    const m = ctx.message;
    const lead = ctx.lead;
    const sourceAgentId = String(m?.agent_id || "").trim();
    if (!sourceAgentId) {
      return NextResponse.json({ error: "ticket_missing_agent_id" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const note = clampNote(body?.note);
    const newTicketId = crypto.randomUUID();
    const title = buildTicketTitle({
      leadName: lead?.name || null,
      leadEmail: lead?.email || null,
      sendStatus: m?.send_status || null,
      status: m?.status || null,
      sendError: m?.send_error || null,
    });

    const payload: TicketPayload = {
      ticket_status: "open",
      ticket_owner_admin_id: adminId,
      ticket_owner_admin_email: adminEmail,
      ticket_title: title,
      ticket_latest_note: note || null,
      ticket_updated_at: now,
      ticket_updated_by_admin_id: adminId,
      ticket_updated_by_admin_email: adminEmail,
      source_message_id: String(m?.id || ""),
      source_lead_id: String(m?.lead_id || "") || null,
      source_agent_id: sourceAgentId,
      source_status: String(m?.status || "") || null,
      source_send_status: String(m?.send_status || "") || null,
      source_send_error: m?.send_error ? String(m.send_error).slice(0, 600) : null,
      source_created_at: toIso(m?.timestamp),
    };

    const upserted = await upsertTicketState({
      supa,
      ticketId: newTicketId,
      agentId: sourceAgentId,
      payload,
    });
    if (upserted.error || !upserted.ticket) {
      return NextResponse.json(
        { error: "ticket_create_failed", details: upserted.error || "ticket_create_failed" },
        { status: 500 },
      );
    }

    await appendTicketEvent({
      supa,
      agentId: sourceAgentId,
      leadId: payload.source_lead_id,
      ticketId: newTicketId,
      messageId: messageId,
      payload: {
        ticket_id: newTicketId,
        action: "created",
        actor_admin_id: adminId,
        actor_admin_email: adminEmail,
        to_status: "open",
        to_owner_admin_id: adminId,
        to_owner_admin_email: adminEmail,
        note: note || null,
      },
    });

    const fresh = await loadTicketById(supa, newTicketId);
    return NextResponse.json({ ok: true, action, ticket: fresh || upserted.ticket });
  }

  if (action === "set_ticket_status") {
    if (!ticketId) return NextResponse.json({ error: "missing_ticket_id" }, { status: 400 });
    const current = await loadTicketById(supa, ticketId);
    if (!current) return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });
    if (!current.source_agent_id) return NextResponse.json({ error: "ticket_missing_agent_id" }, { status: 400 });

    const nextStatus = normalizeTicketStatus(body?.ticket_status);
    const now = new Date().toISOString();
    const result = await upsertTicketState({
      supa,
      ticketId,
      agentId: current.source_agent_id,
      payload: {
        ticket_status: nextStatus,
        ticket_owner_admin_id: current.owner_admin_id,
        ticket_owner_admin_email: current.owner_admin_email,
        ticket_title: current.title,
        ticket_latest_note: current.latest_note,
        ticket_updated_at: now,
        ticket_updated_by_admin_id: adminId,
        ticket_updated_by_admin_email: adminEmail,
        source_message_id: current.source_message_id,
        source_lead_id: current.source_lead_id,
        source_agent_id: current.source_agent_id,
        source_status: current.source_status,
        source_send_status: current.source_send_status,
        source_send_error: current.source_send_error,
        source_created_at: current.source_created_at,
      },
    });
    if (result.error || !result.ticket) {
      return NextResponse.json({ error: "ticket_update_failed", details: result.error }, { status: 500 });
    }

    if (current.status !== nextStatus) {
      await appendTicketEvent({
        supa,
        agentId: current.source_agent_id,
        leadId: current.source_lead_id,
        ticketId: ticketId,
        messageId: current.source_message_id,
        payload: {
          ticket_id: ticketId,
          action: "status_changed",
          actor_admin_id: adminId,
          actor_admin_email: adminEmail,
          from_status: current.status,
          to_status: nextStatus,
        },
      });
    }

    const fresh = await loadTicketById(supa, ticketId);
    return NextResponse.json({ ok: true, action, ticket: fresh || result.ticket });
  }

  if (action === "assign_ticket_to_me") {
    if (!ticketId) return NextResponse.json({ error: "missing_ticket_id" }, { status: 400 });
    const current = await loadTicketById(supa, ticketId);
    if (!current) return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });
    if (!current.source_agent_id) return NextResponse.json({ error: "ticket_missing_agent_id" }, { status: 400 });

    const now = new Date().toISOString();
    const result = await upsertTicketState({
      supa,
      ticketId,
      agentId: current.source_agent_id,
      payload: {
        ticket_status: current.status,
        ticket_owner_admin_id: adminId,
        ticket_owner_admin_email: adminEmail,
        ticket_title: current.title,
        ticket_latest_note: current.latest_note,
        ticket_updated_at: now,
        ticket_updated_by_admin_id: adminId,
        ticket_updated_by_admin_email: adminEmail,
        source_message_id: current.source_message_id,
        source_lead_id: current.source_lead_id,
        source_agent_id: current.source_agent_id,
        source_status: current.source_status,
        source_send_status: current.source_send_status,
        source_send_error: current.source_send_error,
        source_created_at: current.source_created_at,
      },
    });
    if (result.error || !result.ticket) {
      return NextResponse.json({ error: "ticket_update_failed", details: result.error }, { status: 500 });
    }

    if (current.owner_admin_id !== adminId || current.owner_admin_email !== adminEmail) {
      await appendTicketEvent({
        supa,
        agentId: current.source_agent_id,
        leadId: current.source_lead_id,
        ticketId: ticketId,
        messageId: current.source_message_id,
        payload: {
          ticket_id: ticketId,
          action: "owner_changed",
          actor_admin_id: adminId,
          actor_admin_email: adminEmail,
          from_owner_admin_id: current.owner_admin_id,
          from_owner_admin_email: current.owner_admin_email,
          to_owner_admin_id: adminId,
          to_owner_admin_email: adminEmail,
        },
      });
    }

    const fresh = await loadTicketById(supa, ticketId);
    return NextResponse.json({ ok: true, action, ticket: fresh || result.ticket });
  }

  if (action === "clear_ticket_owner") {
    if (!ticketId) return NextResponse.json({ error: "missing_ticket_id" }, { status: 400 });
    const current = await loadTicketById(supa, ticketId);
    if (!current) return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });
    if (!current.source_agent_id) return NextResponse.json({ error: "ticket_missing_agent_id" }, { status: 400 });

    const now = new Date().toISOString();
    const result = await upsertTicketState({
      supa,
      ticketId,
      agentId: current.source_agent_id,
      payload: {
        ticket_status: current.status,
        ticket_owner_admin_id: null,
        ticket_owner_admin_email: null,
        ticket_title: current.title,
        ticket_latest_note: current.latest_note,
        ticket_updated_at: now,
        ticket_updated_by_admin_id: adminId,
        ticket_updated_by_admin_email: adminEmail,
        source_message_id: current.source_message_id,
        source_lead_id: current.source_lead_id,
        source_agent_id: current.source_agent_id,
        source_status: current.source_status,
        source_send_status: current.source_send_status,
        source_send_error: current.source_send_error,
        source_created_at: current.source_created_at,
      },
    });
    if (result.error || !result.ticket) {
      return NextResponse.json({ error: "ticket_update_failed", details: result.error }, { status: 500 });
    }

    if (current.owner_admin_id || current.owner_admin_email) {
      await appendTicketEvent({
        supa,
        agentId: current.source_agent_id,
        leadId: current.source_lead_id,
        ticketId: ticketId,
        messageId: current.source_message_id,
        payload: {
          ticket_id: ticketId,
          action: "owner_cleared",
          actor_admin_id: adminId,
          actor_admin_email: adminEmail,
          from_owner_admin_id: current.owner_admin_id,
          from_owner_admin_email: current.owner_admin_email,
        },
      });
    }

    const fresh = await loadTicketById(supa, ticketId);
    return NextResponse.json({ ok: true, action, ticket: fresh || result.ticket });
  }

  if (action === "add_ticket_note") {
    if (!ticketId) return NextResponse.json({ error: "missing_ticket_id" }, { status: 400 });
    const note = clampNote(body?.note);
    if (!note) return NextResponse.json({ error: "missing_note" }, { status: 400 });

    const current = await loadTicketById(supa, ticketId);
    if (!current) return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });
    if (!current.source_agent_id) return NextResponse.json({ error: "ticket_missing_agent_id" }, { status: 400 });

    const now = new Date().toISOString();
    const result = await upsertTicketState({
      supa,
      ticketId,
      agentId: current.source_agent_id,
      payload: {
        ticket_status: current.status,
        ticket_owner_admin_id: current.owner_admin_id,
        ticket_owner_admin_email: current.owner_admin_email,
        ticket_title: current.title,
        ticket_latest_note: note,
        ticket_updated_at: now,
        ticket_updated_by_admin_id: adminId,
        ticket_updated_by_admin_email: adminEmail,
        source_message_id: current.source_message_id,
        source_lead_id: current.source_lead_id,
        source_agent_id: current.source_agent_id,
        source_status: current.source_status,
        source_send_status: current.source_send_status,
        source_send_error: current.source_send_error,
        source_created_at: current.source_created_at,
      },
    });
    if (result.error || !result.ticket) {
      return NextResponse.json({ error: "ticket_update_failed", details: result.error }, { status: 500 });
    }

    await appendTicketEvent({
      supa,
      agentId: current.source_agent_id,
      leadId: current.source_lead_id,
      ticketId: ticketId,
      messageId: current.source_message_id,
      payload: {
        ticket_id: ticketId,
        action: "note_added",
        actor_admin_id: adminId,
        actor_admin_email: adminEmail,
        note,
      },
    });

    const fresh = await loadTicketById(supa, ticketId);
    return NextResponse.json({ ok: true, action, ticket: fresh || result.ticket });
  }

  return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
}
