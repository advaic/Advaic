"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, RefreshCw } from "lucide-react";

type TicketStatus = "open" | "in_progress" | "resolved";
type SlaState = "on_time" | "at_risk" | "overdue" | "resolved" | "unknown";

type TicketHistoryEntry = {
  action: "created" | "status_changed" | "owner_changed" | "owner_cleared" | "note_added";
  actor_admin_email: string | null;
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
  source_message_id: string | null;
  source_lead_id: string | null;
  source_lead_name: string | null;
  source_lead_email: string | null;
  source_agent_id: string | null;
  source_agent_name: string | null;
  source_agent_email: string | null;
  source_agent_company: string | null;
  source_status: string | null;
  source_send_status: string | null;
  source_send_error: string | null;
  history: TicketHistoryEntry[];
};

type Data = {
  ok: boolean;
  viewer?: { id: string | null; email: string | null };
  ticket_summary: {
    open: number;
    in_progress: number;
    resolved: number;
  };
  tickets: SupportTicket[];
};

function fmt(v?: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("de-DE");
  } catch {
    return String(v);
  }
}

function ageMinutes(v?: string | null) {
  if (!v) return null;
  const ts = new Date(v).getTime();
  if (!Number.isFinite(ts)) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / 60000));
}

function ticketStatusLabel(status: TicketStatus) {
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

function getSlaState(ticket: SupportTicket): SlaState {
  if (ticket.status === "resolved") return "resolved";
  const mins = ageMinutes(ticket.updated_at);
  if (mins === null) return "unknown";
  if (mins >= 180) return "overdue";
  if (mins >= 60) return "at_risk";
  return "on_time";
}

function statusPillClasses(status: TicketStatus) {
  if (status === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "in_progress") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function slaPillClasses(state: SlaState) {
  if (state === "overdue") return "border-red-200 bg-red-50 text-red-800";
  if (state === "at_risk") return "border-amber-200 bg-amber-50 text-amber-900";
  if (state === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  return "border-gray-200 bg-gray-50 text-gray-700";
}

function slaLabel(state: SlaState) {
  if (state === "overdue") return "SLA überfällig";
  if (state === "at_risk") return "SLA kritisch";
  if (state === "on_time") return "SLA im Rahmen";
  if (state === "resolved") return "Gelöst";
  return "SLA unbekannt";
}

export default function TicketsBoard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({});
  const [slaRunInfo, setSlaRunInfo] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "my" | "assigned" | "unassigned">("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<"all" | "on_time" | "at_risk" | "overdue">("all");

  const runFetch = async (silent?: boolean) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/support", { method: "GET", cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || "tickets_fetch_failed"));
      setData(json as Data);
    } catch (e: any) {
      setError(String(e?.message || "tickets_fetch_failed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void runFetch();
    const t = setInterval(() => {
      void runFetch(true);
    }, 12000);
    return () => clearInterval(t);
  }, []);

  const postSupport = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(String(json?.error || "ticket_action_failed"));
    return json;
  };

  const action = async (key: string, payload: Record<string, unknown>) => {
    if (busy[key]) return;
    setBusy((prev) => ({ ...prev, [key]: true }));
    setError(null);
    try {
      await postSupport(payload);
      await runFetch(true);
    } catch (e: any) {
      setError(String(e?.message || "ticket_action_failed"));
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  const runSlaAutomation = async () => {
    const key = "sla:run";
    if (busy[key]) return;
    setBusy((prev) => ({ ...prev, [key]: true }));
    setError(null);
    setSlaRunInfo(null);
    try {
      const res = await fetch("/api/admin/tickets/sla/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warn_minutes: 60, overdue_minutes: 180 }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || "sla_run_failed"));
      setSlaRunInfo(
        `SLA-Run: geprüft ${json.checked || 0}, geändert ${json.changed || 0}, kritisch ${json.became_at_risk || 0}, überfällig ${json.became_overdue || 0}.`,
      );
      await runFetch(true);
    } catch (e: any) {
      setError(String(e?.message || "sla_run_failed"));
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  const applyPlaybook = async (
    ticket: SupportTicket,
    playbook: "sending_lock" | "konfliktmail" | "objekt_unklar" | "freigabe_stau",
  ) => {
    const key = `playbook:${ticket.ticket_id}:${playbook}`;
    if (busy[key]) return;
    setBusy((prev) => ({ ...prev, [key]: true }));
    setError(null);
    try {
      const noteMap = {
        sending_lock:
          "Playbook angewendet: Sending-Lock. Lock gelöst, Versand erneut angestoßen, Monitoring auf Zustellfehler läuft.",
        konfliktmail:
          "Playbook angewendet: Konfliktmail. Fall auf menschliche Bearbeitung gesetzt, Tonalität manuell prüfen und direkte Antwort vorbereiten.",
        objekt_unklar:
          "Playbook angewendet: Objektbezug unklar. Objektdaten und Referenz prüfen, dann Rückfrage oder manuelle Freigabe senden.",
        freigabe_stau:
          "Playbook angewendet: Freigabe-Rückstau. Agent auf sicheren Modus gestellt, Priorisierung der offenen Freigaben eingeleitet.",
      } as const;

      if (playbook === "sending_lock" && ticket.source_message_id) {
        await postSupport({ action: "unlock_message", message_id: ticket.source_message_id });
        await postSupport({ action: "retry_message", message_id: ticket.source_message_id, run_now: true });
      }

      if (playbook === "freigabe_stau" && ticket.source_agent_id) {
        await postSupport({ action: "safe_mode", agent_id: ticket.source_agent_id });
      }

      await postSupport({
        action: "set_ticket_status",
        ticket_id: ticket.ticket_id,
        ticket_status: "in_progress",
      });
      await postSupport({
        action: "assign_ticket_to_me",
        ticket_id: ticket.ticket_id,
      });
      await postSupport({
        action: "add_ticket_note",
        ticket_id: ticket.ticket_id,
        note: noteMap[playbook],
      });

      await runFetch(true);
    } catch (e: any) {
      setError(String(e?.message || "playbook_failed"));
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  const tickets = data?.tickets || [];
  const viewerId = String(data?.viewer?.id || "").trim();
  const viewerEmail = String(data?.viewer?.email || "").trim().toLowerCase();

  const agentOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const t of tickets) {
      const id = String(t.source_agent_id || "").trim();
      if (!id) continue;
      if (map.has(id)) continue;
      const label = t.source_agent_name || t.source_agent_email || `${id.slice(0, 8)}…`;
      map.set(id, { id, label });
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "de"));
  }, [tickets]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;

      if (ownerFilter === "my") {
        const ownerId = String(t.owner_admin_id || "").trim();
        const ownerEmail = String(t.owner_admin_email || "").trim().toLowerCase();
        if (!(viewerId && ownerId === viewerId) && !(viewerEmail && ownerEmail === viewerEmail)) {
          return false;
        }
      }
      if (ownerFilter === "assigned" && !t.owner_admin_email && !t.owner_admin_id) return false;
      if (ownerFilter === "unassigned" && (t.owner_admin_email || t.owner_admin_id)) return false;

      if (agentFilter !== "all" && String(t.source_agent_id || "") !== agentFilter) return false;

      const sla = getSlaState(t);
      if (slaFilter !== "all" && sla !== slaFilter) return false;

      if (!term) return true;
      const hay = [
        t.ticket_id,
        t.title,
        t.latest_note,
        t.owner_admin_email,
        t.source_agent_name,
        t.source_agent_email,
        t.source_lead_name,
        t.source_lead_email,
        t.source_send_error,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [tickets, statusFilter, ownerFilter, agentFilter, slaFilter, q, viewerId, viewerEmail]);

  const filteredCounts = useMemo(() => {
    return {
      open: filtered.filter((t) => t.status === "open").length,
      in_progress: filtered.filter((t) => t.status === "in_progress").length,
      resolved: filtered.filter((t) => t.status === "resolved").length,
    };
  }, [filtered]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <h1 className="text-2xl font-semibold">Admin · Tickets</h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">
                <ClipboardList className="h-3.5 w-3.5" />
                {filtered.length} sichtbar
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Supportfälle mit Owner, Status, Notizen und Verlauf. Filter für SLA und Verantwortlichkeit.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/app/admin/overview" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Overview
            </Link>
            <Link href="/app/admin/quality" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Quality
            </Link>
            <Link href="/app/admin/rollout" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Rollout
            </Link>
            <Link href="/app/admin/compliance" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Compliance
            </Link>
            <Link href="/app/admin/outbox" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Outbox
            </Link>
            <Link href="/app/admin/agents" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Agents
            </Link>
            <button
              onClick={() => void runFetch(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Aktualisieren
            </button>
            <button
              onClick={() => void runSlaAutomation()}
              disabled={!!busy["sla:run"]}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 hover:bg-red-100 disabled:opacity-60"
            >
              SLA-Automation ausführen
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="text-xs uppercase tracking-wide text-amber-900">Offen</div>
            <div className="mt-1 text-2xl font-semibold text-amber-900">{filteredCounts.open}</div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="text-xs uppercase tracking-wide text-blue-800">In Bearbeitung</div>
            <div className="mt-1 text-2xl font-semibold text-blue-800">{filteredCounts.in_progress}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-xs uppercase tracking-wide text-emerald-800">Gelöst</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-800">{filteredCounts.resolved}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Gesamt</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{tickets.length}</div>
            <div className="mt-1 text-xs text-gray-500">
              offen {data?.ticket_summary?.open ?? 0} · in Arbeit {data?.ticket_summary?.in_progress ?? 0}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suche (Ticket, Agent, Lead, Notiz, Fehler)…"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | TicketStatus)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Status: Alle</option>
              <option value="open">Status: Offen</option>
              <option value="in_progress">Status: In Bearbeitung</option>
              <option value="resolved">Status: Gelöst</option>
            </select>

            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value as "all" | "my" | "assigned" | "unassigned")}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Owner: Alle</option>
              <option value="my">Owner: Meine Tickets</option>
              <option value="assigned">Owner: Zugewiesen</option>
              <option value="unassigned">Owner: Unzugewiesen</option>
            </select>

            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Agent: Alle</option>
              {agentOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>

            <select
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value as "all" | "on_time" | "at_risk" | "overdue")}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">SLA: Alle</option>
              <option value="on_time">SLA: Im Rahmen (&lt; 60 Min)</option>
              <option value="at_risk">SLA: Kritisch (60-179 Min)</option>
              <option value="overdue">SLA: Überfällig (&gt;= 180 Min)</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        {slaRunInfo ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {slaRunInfo}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 space-y-3">
            <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filtered.map((t) => {
              const key = `ticket:${t.ticket_id}`;
              const note = noteDrafts[key] ?? "";
              const historyExpanded = !!historyOpen[t.ticket_id];
              const sla = getSlaState(t);
              return (
                <div key={t.ticket_id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{t.title || `Ticket ${t.ticket_id.slice(0, 8)}…`}</div>
                      <div className="mt-1 text-xs text-gray-600">
                        Agent: {t.source_agent_name || t.source_agent_email || t.source_agent_id || "—"} • Lead:{" "}
                        {t.source_lead_name || t.source_lead_email || t.source_lead_id || "—"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Owner: {t.owner_admin_email || "nicht zugewiesen"} • Letztes Update: {fmt(t.updated_at)}
                      </div>
                      {t.latest_note ? (
                        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                          Letzte Notiz: {t.latest_note}
                        </div>
                      ) : null}
                      {t.source_send_error ? (
                        <div className="mt-1 whitespace-pre-wrap text-xs text-red-700">{t.source_send_error}</div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusPillClasses(t.status)}`}>
                        {ticketStatusLabel(t.status)}
                      </span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${slaPillClasses(sla)}`}>
                        {slaLabel(sla)}
                      </span>
                      {t.source_lead_id ? (
                        <Link
                          href={`/app/nachrichten?leadId=${encodeURIComponent(t.source_lead_id)}`}
                          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Lead öffnen
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        void action(`${key}:open`, {
                          action: "set_ticket_status",
                          ticket_id: t.ticket_id,
                          ticket_status: "open",
                        })
                      }
                      disabled={!!busy[`${key}:open`]}
                      className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                    >
                      Offen
                    </button>
                    <button
                      onClick={() =>
                        void action(`${key}:progress`, {
                          action: "set_ticket_status",
                          ticket_id: t.ticket_id,
                          ticket_status: "in_progress",
                        })
                      }
                      disabled={!!busy[`${key}:progress`]}
                      className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800 hover:bg-blue-100 disabled:opacity-60"
                    >
                      In Bearbeitung
                    </button>
                    <button
                      onClick={() =>
                        void action(`${key}:resolved`, {
                          action: "set_ticket_status",
                          ticket_id: t.ticket_id,
                          ticket_status: "resolved",
                        })
                      }
                      disabled={!!busy[`${key}:resolved`]}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      Gelöst
                    </button>
                    <button
                      onClick={() =>
                        void action(`${key}:assign`, {
                          action: "assign_ticket_to_me",
                          ticket_id: t.ticket_id,
                        })
                      }
                      disabled={!!busy[`${key}:assign`]}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                    >
                      Mir zuweisen
                    </button>
                    {t.owner_admin_email ? (
                      <button
                        onClick={() =>
                          void action(`${key}:clear-owner`, {
                            action: "clear_ticket_owner",
                            ticket_id: t.ticket_id,
                          })
                        }
                        disabled={!!busy[`${key}:clear-owner`]}
                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                      >
                        Owner entfernen
                      </button>
                    ) : null}
                    {t.source_agent_id ? (
                      <Link
                        href={`/app/admin/outbox?tab=all&agent_id=${encodeURIComponent(t.source_agent_id)}`}
                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        Outbox (Agent)
                      </Link>
                    ) : null}
                    <button
                      onClick={() => void applyPlaybook(t, "sending_lock")}
                      disabled={!!busy[`playbook:${t.ticket_id}:sending_lock`]}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                    >
                      Playbook: Sending-Lock
                    </button>
                    <button
                      onClick={() => void applyPlaybook(t, "konfliktmail")}
                      disabled={!!busy[`playbook:${t.ticket_id}:konfliktmail`]}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                    >
                      Playbook: Konfliktmail
                    </button>
                    <button
                      onClick={() => void applyPlaybook(t, "objekt_unklar")}
                      disabled={!!busy[`playbook:${t.ticket_id}:objekt_unklar`]}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                    >
                      Playbook: Objekt unklar
                    </button>
                    <button
                      onClick={() => void applyPlaybook(t, "freigabe_stau")}
                      disabled={!!busy[`playbook:${t.ticket_id}:freigabe_stau`]}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                    >
                      Playbook: Freigabe-Stau
                    </button>
                  </div>

                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <textarea
                      value={note}
                      onChange={(e) =>
                        setNoteDrafts((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder={t.latest_note || "Neue Notiz für den Verlauf…"}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          void action(`${key}:note`, {
                            action: "add_ticket_note",
                            ticket_id: t.ticket_id,
                            note,
                          })
                        }
                        disabled={!note.trim() || !!busy[`${key}:note`]}
                        className="rounded-md border border-gray-900 bg-gray-900 px-2 py-1 text-xs font-medium text-amber-200 hover:bg-gray-800 disabled:opacity-60"
                      >
                        Notiz speichern
                      </button>
                      <button
                        onClick={() =>
                          setHistoryOpen((prev) => ({
                            ...prev,
                            [t.ticket_id]: !prev[t.ticket_id],
                          }))
                        }
                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        {historyExpanded ? "Verlauf ausblenden" : "Verlauf anzeigen"}
                      </button>
                    </div>
                    {historyExpanded ? (
                      <div className="mt-2 space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-2">
                        {(t.history || []).length === 0 ? (
                          <div className="text-xs text-gray-600">Noch kein Verlauf vorhanden.</div>
                        ) : (
                          (t.history || []).map((h, idx) => (
                            <div key={`${t.ticket_id}:${idx}:${h.created_at || "ts"}`} className="text-xs text-gray-700">
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

            {!loading && filtered.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                Keine Tickets mit den aktuellen Filtern.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
