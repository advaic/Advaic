"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Wrench,
} from "lucide-react";

type TicketStatus = "open" | "in_progress" | "resolved";

type TicketHistoryEntry = {
  action: "created" | "status_changed" | "owner_changed" | "owner_cleared" | "note_added";
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
  source_status: string | null;
  source_send_status: string | null;
  source_send_error: string | null;
  source_created_at: string | null;
  history: TicketHistoryEntry[];
};

type SupportData = {
  ok: boolean;
  q: string | null;
  summary: {
    critical_agents: number;
    failed: number;
    stuck: number;
    needs_approval: number;
    needs_human: number;
    ready_to_send: number;
  };
  ticket_summary: {
    open: number;
    in_progress: number;
    resolved: number;
  };
  tickets: SupportTicket[];
  critical_agents: Array<{
    agent_id: string;
    agent_name: string | null;
    agent_email: string | null;
    company: string | null;
    autosend_enabled: boolean | null;
    followups_enabled_default: boolean | null;
    onboarding_completed: boolean | null;
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
  }>;
  incidents: Array<{
    message_id: string;
    agent_id: string;
    agent_name: string | null;
    agent_email: string | null;
    lead_id: string;
    lead_name: string | null;
    lead_email: string | null;
    status: string | null;
    send_status: string | null;
    send_error: string | null;
    timestamp: string | null;
    stuck: boolean;
    minutes_locked: number | null;
    ticket: SupportTicket | null;
  }>;
  search: {
    agents: Array<{
      id: string;
      email: string | null;
      name: string | null;
      company: string | null;
      created_at: string | null;
    }>;
    leads: Array<{
      id: string;
      agent_id: string;
      name: string | null;
      email: string | null;
      status: string | null;
      priority: string | null;
      last_message_at: string | null;
    }>;
    messages: Array<{
      id: string;
      agent_id: string;
      lead_id: string;
      status: string | null;
      approval_required: boolean | null;
      send_status: string | null;
      send_error: string | null;
      timestamp: string | null;
      text_preview: string | null;
      email_provider: string | null;
    }>;
  };
};

function fmt(v?: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("de-DE");
  } catch {
    return String(v);
  }
}

function toneByNumber(n: number) {
  if (n >= 8) return "danger";
  if (n >= 3) return "warning";
  return "neutral";
}

function ticketStatusLabel(status?: TicketStatus | null) {
  if (status === "in_progress") return "In Bearbeitung";
  if (status === "resolved") return "Gelöst";
  return "Offen";
}

function ticketActionLabel(action: TicketHistoryEntry["action"]) {
  if (action === "created") return "Ticket erstellt";
  if (action === "status_changed") return "Status geändert";
  if (action === "owner_changed") return "Owner gesetzt";
  if (action === "owner_cleared") return "Owner entfernt";
  return "Notiz ergänzt";
}

function TicketStatusPill({ status }: { status: TicketStatus }) {
  const styles =
    status === "resolved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "in_progress"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-amber-200 bg-amber-50 text-amber-900";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles}`}>
      {ticketStatusLabel(status)}
    </span>
  );
}

function Chip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "warning" | "danger";
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-800"
          : tone === "warning"
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : "border-gray-200 bg-gray-50 text-gray-700"
      }`}
    >
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

export default function SupportHub() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SupportData | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({});

  const runFetch = async (q?: string, silent?: boolean) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const term = typeof q === "string" ? q.trim() : query.trim();
      const url = term ? `/api/admin/support?q=${encodeURIComponent(term)}` : "/api/admin/support";
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || "support_fetch_failed"));
      setData(json as SupportData);
    } catch (e: any) {
      setError(String(e?.message || "support_fetch_failed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void runFetch();
    const t = setInterval(() => {
      void runFetch(undefined, true);
    }, 12000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const action = async (key: string, payload: Record<string, any>) => {
    if (busy[key]) return;
    setBusy((p) => ({ ...p, [key]: true }));
    setError(null);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || "support_action_failed"));
      await runFetch(undefined, true);
    } catch (e: any) {
      setError(String(e?.message || "support_action_failed"));
    } finally {
      setBusy((p) => ({ ...p, [key]: false }));
    }
  };

  const critical = data?.critical_agents || [];
  const incidents = data?.incidents || [];
  const search = data?.search;
  const ticketSummary = data?.ticket_summary || { open: 0, in_progress: 0, resolved: 0 };
  const tickets = data?.tickets || [];

  const incidentStats = useMemo(() => {
    return {
      failed: incidents.filter((i) => String(i.send_status || "").toLowerCase() === "failed").length,
      stuck: incidents.filter((i) => i.stuck).length,
      human: incidents.filter((i) => String(i.status || "").toLowerCase() === "needs_human").length,
    };
  }, [incidents]);

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-[#fbfbfc] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 font-medium">
              <ShieldAlert className="h-4 w-4" />
              Support Hub
            </div>
            <div className="text-sm text-gray-600">
              Kritische Accounts priorisieren, eingreifen und Fälle mit Ticket-Verlauf sauber lösen.
            </div>
          </div>
          <button
            onClick={() => void runFetch(undefined, true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Aktualisieren
          </button>
        </div>

        <form
          className="mt-4 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void runFetch(query);
          }}
        >
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suche nach Agent, Lead, E-Mail, Message-ID oder Fehlertext…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            />
          </div>
          <button className="rounded-xl border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-gray-800">
            Suchen
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              void runFetch("");
            }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Zurücksetzen
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <Chip label="Kritische Agents" value={data?.summary?.critical_agents ?? 0} tone={toneByNumber(data?.summary?.critical_agents ?? 0)} />
          <Chip label="Failed" value={data?.summary?.failed ?? 0} tone={toneByNumber(data?.summary?.failed ?? 0)} />
          <Chip label="Stuck" value={data?.summary?.stuck ?? 0} tone={toneByNumber(data?.summary?.stuck ?? 0)} />
          <Chip label="Needs approval" value={data?.summary?.needs_approval ?? 0} tone={toneByNumber(data?.summary?.needs_approval ?? 0)} />
          <Chip label="Needs human" value={data?.summary?.needs_human ?? 0} tone={toneByNumber(data?.summary?.needs_human ?? 0)} />
          <Chip label="Tickets offen" value={ticketSummary.open} tone={toneByNumber(ticketSummary.open)} />
        </div>
      </div>

      <div className="space-y-6 p-4 md:p-6">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
          </div>
        ) : (
          <>
            <section>
              <div className="text-sm font-semibold text-gray-900">Kritische Agents (priorisiert)</div>
              <div className="mt-3 space-y-3">
                {critical.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                    Aktuell keine kritischen Agents.
                  </div>
                ) : (
                  critical.map((a) => {
                    const key = `agent:${a.agent_id}`;
                    return (
                      <div key={a.agent_id} className="rounded-xl border border-gray-200 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">
                              {a.agent_name || "Unbekannt"}{" "}
                              <span className="text-xs font-normal text-gray-500">• {a.agent_email || "—"}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              {a.company || "—"} • letzte Aktivität: {fmt(a.last_activity_at)}
                            </div>
                            {a.sample_error ? (
                              <div className="mt-2 whitespace-pre-wrap text-xs text-red-700">{a.sample_error}</div>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Chip label="Score" value={a.score} tone={toneByNumber(a.score)} />
                            <Chip label="Failed" value={a.failed} tone={toneByNumber(a.failed)} />
                            <Chip label="Stuck" value={a.stuck} tone={toneByNumber(a.stuck)} />
                            <Chip label="Freigabe" value={a.needs_approval} />
                            <Chip label="Human" value={a.needs_human} tone={toneByNumber(a.needs_human)} />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Link
                            href={`/app/admin/agents/${a.agent_id}`}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
                          >
                            Agent öffnen
                          </Link>
                          <Link
                            href={`/app/admin/outbox?tab=all&agent_id=${encodeURIComponent(a.agent_id)}`}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
                          >
                            Outbox filtern
                          </Link>
                          {a.sample_lead_id ? (
                            <Link
                              href={`/app/nachrichten?leadId=${encodeURIComponent(a.sample_lead_id)}`}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
                            >
                              Lead öffnen
                            </Link>
                          ) : null}
                          <button
                            onClick={() =>
                              void action(`${key}:safe`, {
                                action: "safe_mode",
                                agent_id: a.agent_id,
                              })
                            }
                            disabled={!!busy[`${key}:safe`]}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-800 hover:bg-red-100 disabled:opacity-60"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            Safe Mode
                          </button>
                          {a.autosend_enabled ? (
                            <button
                              onClick={() =>
                                void action(`${key}:auto`, {
                                  action: "pause_autosend",
                                  agent_id: a.agent_id,
                                })
                              }
                              disabled={!!busy[`${key}:auto`]}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                            >
                              Auto aus
                            </button>
                          ) : null}
                          {a.followups_enabled_default ? (
                            <button
                              onClick={() =>
                                void action(`${key}:fu`, {
                                  action: "pause_followups",
                                  agent_id: a.agent_id,
                                })
                              }
                              disabled={!!busy[`${key}:fu`]}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                            >
                              Follow-ups aus
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section>
              <div className="text-sm font-semibold text-gray-900">Ticket-Übersicht</div>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-amber-900">Offen</div>
                  <div className="mt-1 text-2xl font-semibold text-amber-900">{ticketSummary.open}</div>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-blue-800">In Bearbeitung</div>
                  <div className="mt-1 text-2xl font-semibold text-blue-800">{ticketSummary.in_progress}</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-emerald-800">Gelöst</div>
                  <div className="mt-1 text-2xl font-semibold text-emerald-800">{ticketSummary.resolved}</div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {tickets.slice(0, 8).map((t) => (
                  <div key={t.ticket_id} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 text-sm font-medium">
                          <ClipboardList className="h-4 w-4 text-gray-500" />
                          {t.title || `Ticket ${t.ticket_id.slice(0, 8)}…`}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          Owner: {t.owner_admin_email || "nicht zugewiesen"} • Update: {fmt(t.updated_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TicketStatusPill status={t.status} />
                        {t.source_lead_id ? (
                          <Link
                            href={`/app/nachrichten?leadId=${encodeURIComponent(t.source_lead_id)}`}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            Lead
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="text-sm font-semibold text-gray-900">Akute Vorfälle</div>
              <div className="mt-1 text-xs text-gray-600">
                Failed: {incidentStats.failed} • Stuck: {incidentStats.stuck} • Needs human: {incidentStats.human}
              </div>
              <div className="mt-3 space-y-3">
                {incidents.slice(0, 18).map((i) => {
                  const key = `msg:${i.message_id}`;
                  const ticket = i.ticket;
                  const noteKey = ticket ? `ticket:${ticket.ticket_id}` : `new:${i.message_id}`;
                  const noteVal = noteDrafts[noteKey] ?? "";
                  const historyExpanded = ticket ? !!historyOpen[ticket.ticket_id] : false;
                  return (
                    <div key={i.message_id} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">
                            Message {i.message_id.slice(0, 8)}… • {i.send_status || i.status || "unknown"}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            Agent: {i.agent_name || "—"} ({i.agent_email || "—"}) • Lead: {i.lead_name || "—"} ({i.lead_email || "—"})
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {fmt(i.timestamp)}
                            {i.stuck && i.minutes_locked !== null ? ` • lock seit ${i.minutes_locked} Min` : ""}
                          </div>
                          {i.send_error ? (
                            <div className="mt-1 whitespace-pre-wrap text-xs text-red-700">{i.send_error}</div>
                          ) : null}
                          {ticket ? (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                              <span className="font-medium">Ticket:</span>
                              <TicketStatusPill status={ticket.status} />
                              <span>Owner: {ticket.owner_admin_email || "nicht zugewiesen"}</span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {i.lead_id ? (
                            <Link
                              href={`/app/nachrichten?leadId=${encodeURIComponent(i.lead_id)}`}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
                            >
                              Lead öffnen
                            </Link>
                          ) : null}
                          <button
                            onClick={() =>
                              void action(`${key}:retry`, {
                                action: "retry_message",
                                message_id: i.message_id,
                                run_now: true,
                              })
                            }
                            disabled={!!busy[`${key}:retry`]}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-60"
                          >
                            Retry jetzt
                          </button>
                          {i.stuck ? (
                            <button
                              onClick={() =>
                                void action(`${key}:unlock`, {
                                  action: "unlock_message",
                                  message_id: i.message_id,
                                })
                              }
                              disabled={!!busy[`${key}:unlock`]}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                            >
                              Unlock
                            </button>
                          ) : null}
                          {!ticket ? (
                            <button
                              onClick={() =>
                                void action(`${key}:ticket:create`, {
                                  action: "open_ticket",
                                  message_id: i.message_id,
                                  note: noteVal || undefined,
                                })
                              }
                              disabled={!!busy[`${key}:ticket:create`]}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-800 hover:bg-blue-100 disabled:opacity-60"
                            >
                              Ticket anlegen
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <div className="text-xs font-medium text-gray-700">
                          {ticket ? "Ticket bearbeiten" : "Optionale Startnotiz (wird beim Anlegen übernommen)"}
                        </div>
                        <textarea
                          value={noteVal}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({
                              ...prev,
                              [noteKey]: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder={ticket?.latest_note || "Kurz notieren, was geprüft werden soll…"}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                        />

                        {ticket ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() =>
                                void action(`${key}:ticket:open`, {
                                  action: "set_ticket_status",
                                  ticket_id: ticket.ticket_id,
                                  ticket_status: "open",
                                })
                              }
                              disabled={!!busy[`${key}:ticket:open`]}
                              className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                            >
                              Offen
                            </button>
                            <button
                              onClick={() =>
                                void action(`${key}:ticket:progress`, {
                                  action: "set_ticket_status",
                                  ticket_id: ticket.ticket_id,
                                  ticket_status: "in_progress",
                                })
                              }
                              disabled={!!busy[`${key}:ticket:progress`]}
                              className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800 hover:bg-blue-100 disabled:opacity-60"
                            >
                              In Bearbeitung
                            </button>
                            <button
                              onClick={() =>
                                void action(`${key}:ticket:resolved`, {
                                  action: "set_ticket_status",
                                  ticket_id: ticket.ticket_id,
                                  ticket_status: "resolved",
                                })
                              }
                              disabled={!!busy[`${key}:ticket:resolved`]}
                              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                            >
                              Gelöst
                            </button>
                            <button
                              onClick={() =>
                                void action(`${key}:ticket:assign`, {
                                  action: "assign_ticket_to_me",
                                  ticket_id: ticket.ticket_id,
                                })
                              }
                              disabled={!!busy[`${key}:ticket:assign`]}
                              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                            >
                              Mir zuweisen
                            </button>
                            {ticket.owner_admin_email ? (
                              <button
                                onClick={() =>
                                  void action(`${key}:ticket:clear-owner`, {
                                    action: "clear_ticket_owner",
                                    ticket_id: ticket.ticket_id,
                                  })
                                }
                                disabled={!!busy[`${key}:ticket:clear-owner`]}
                                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                              >
                                Owner entfernen
                              </button>
                            ) : null}
                            <button
                              onClick={() =>
                                void action(`${key}:ticket:note`, {
                                  action: "add_ticket_note",
                                  ticket_id: ticket.ticket_id,
                                  note: noteVal,
                                })
                              }
                              disabled={!!busy[`${key}:ticket:note`] || !noteVal.trim()}
                              className="rounded-md border border-gray-900 bg-gray-900 px-2 py-1 text-xs font-medium text-amber-200 hover:bg-gray-800 disabled:opacity-60"
                            >
                              Notiz speichern
                            </button>
                            <button
                              onClick={() =>
                                setHistoryOpen((prev) => ({
                                  ...prev,
                                  [ticket.ticket_id]: !prev[ticket.ticket_id],
                                }))
                              }
                              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                            >
                              {historyExpanded ? "Verlauf ausblenden" : "Verlauf anzeigen"}
                            </button>
                          </div>
                        ) : null}

                        {ticket && historyExpanded ? (
                          <div className="mt-2 space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-2">
                            {(ticket.history || []).length === 0 ? (
                              <div className="text-xs text-gray-600">Noch kein Verlauf vorhanden.</div>
                            ) : (
                              (ticket.history || []).map((h, idx) => (
                                <div key={`${ticket.ticket_id}:${idx}:${h.created_at || "ts"}`} className="text-xs text-gray-700">
                                  <span className="font-medium">{ticketActionLabel(h.action)}</span> • {fmt(h.created_at)} •{" "}
                                  {h.actor_admin_email || "System"}
                                  {h.note ? ` • ${h.note}` : ""}
                                </div>
                              ))
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {data?.q ? (
              <section>
                <div className="text-sm font-semibold text-gray-900">Suchergebnisse für „{data.q}“</div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Agents</div>
                    <div className="mt-2 space-y-2">
                      {(search?.agents || []).length === 0 ? (
                        <div className="text-xs text-gray-500">Keine Treffer</div>
                      ) : (
                        (search?.agents || []).map((a) => (
                          <Link
                            key={a.id}
                            href={`/app/admin/agents/${a.id}`}
                            className="block rounded-lg border border-gray-200 px-2 py-2 text-xs hover:bg-gray-50"
                          >
                            <div className="font-medium">{a.name || "—"}</div>
                            <div className="text-gray-600">{a.email || "—"}</div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Leads</div>
                    <div className="mt-2 space-y-2">
                      {(search?.leads || []).length === 0 ? (
                        <div className="text-xs text-gray-500">Keine Treffer</div>
                      ) : (
                        (search?.leads || []).map((l) => (
                          <Link
                            key={l.id}
                            href={`/app/nachrichten?leadId=${encodeURIComponent(l.id)}`}
                            className="block rounded-lg border border-gray-200 px-2 py-2 text-xs hover:bg-gray-50"
                          >
                            <div className="font-medium">{l.name || "—"}</div>
                            <div className="text-gray-600">{l.email || "—"}</div>
                            <div className="text-gray-500">{fmt(l.last_message_at)}</div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Messages</div>
                    <div className="mt-2 space-y-2">
                      {(search?.messages || []).length === 0 ? (
                        <div className="text-xs text-gray-500">Keine Treffer</div>
                      ) : (
                        (search?.messages || []).map((m) => (
                          <div key={m.id} className="rounded-lg border border-gray-200 px-2 py-2 text-xs">
                            <div className="font-medium">
                              {m.id.slice(0, 8)}… • {m.send_status || m.status || "unknown"}
                            </div>
                            <div className="mt-1 text-gray-600">{m.text_preview || "—"}</div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() =>
                                  void action(`search:${m.id}:retry`, {
                                    action: "retry_message",
                                    message_id: m.id,
                                    run_now: true,
                                  })
                                }
                                disabled={!!busy[`search:${m.id}:retry`]}
                                className="rounded-md border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50 disabled:opacity-60"
                              >
                                Retry
                              </button>
                              <button
                                onClick={() =>
                                  void action(`search:${m.id}:unlock`, {
                                    action: "unlock_message",
                                    message_id: m.id,
                                  })
                                }
                                disabled={!!busy[`search:${m.id}:unlock`]}
                                className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                              >
                                Unlock
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        )}

        {!loading && !data ? (
          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <AlertTriangle className="h-4 w-4" />
            Keine Support-Daten verfügbar.
          </div>
        ) : null}
      </div>
    </div>
  );
}
