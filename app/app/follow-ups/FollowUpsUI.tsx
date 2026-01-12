"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlarmClock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Wand2,
  X,
} from "lucide-react";
import { snoozeFollowUp, suggestFollowUpText } from "@/app/actions/followups";

/** View-Zeile aus `leads_with_metrics` */
type LeadMetrics = {
  id: string;
  agent_id: string;
  name: string | null;
  email: string | null;
  last_message: string | null;
  updated_at: string | null; // timestamptz
  hours_since_last_reply: number; // numeric oder int
};

/** Nachricht aus `messages` für gesendete Follow-ups */
type SentFollowUp = {
  id: string;
  lead_id: string;
  text: string | null;
  timestamp: string; // timestamptz
};

type LeadMin = {
  id: string;
  name: string | null;
  email: string | null;
};

type TabKey = "due" | "soon" | "sent";

type FollowUpsUIProps = {
  /** vom Server (page.tsx) durchgereicht */
  userId: string;
};

export default function FollowUpsUI({ userId }: FollowUpsUIProps) {
  const supabase = useSupabaseClient<Database>();
  const [tab, setTab] = useState<TabKey>("due");
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState<number>(24);
  const [soonWindow, setSoonWindow] = useState<number>(12);
  const [search, setSearch] = useState("");

  const [metrics, setMetrics] = useState<LeadMetrics[]>([]);
  const [sent, setSent] = useState<SentFollowUp[]>([]);
  const [sentLeadMap, setSentLeadMap] = useState<Record<string, LeadMin>>({});

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [sendPending, setSendPending] = useState<Record<string, boolean>>({});
  const [sendError, setSendError] = useState<Record<string, string | null>>({});

  const setSendPendingFor = (id: string, v: boolean) =>
    setSendPending((p) => ({ ...p, [id]: v }));

  const setSendErrorFor = (id: string, msg: string | null) =>
    setSendError((p) => ({ ...p, [id]: msg }));

  const buildDefaultText = (lead: Pick<LeadMetrics, "name">) =>
    `${
      lead.name?.trim() || "Hallo"
    }, nur ein kurzes Follow-up: Haben Sie schon ein Update oder noch Fragen? Ich freue mich auf Ihre Rückmeldung.`;

  const load = async (opts?: { silent?: boolean }) => {
    if (!userId) return;
    try {
      if (!opts?.silent) setLoading(true);

      // 1) Fälligkeit aus View
      const { data: mData, error: mErr } = await supabase
        .from("leads_with_metrics")
        .select(
          "id, agent_id, name, email, last_message, updated_at, hours_since_last_reply"
        )
        .eq("agent_id", userId);

      if (mErr) {
        console.error("⚠️ leads_with_metrics error:", mErr);
        toast.error(
          "Fehler beim Laden der Fälligkeiten. Existiert die View `leads_with_metrics`?"
        );
        setMetrics([]);
      } else {
        const rows = (mData ?? []) as LeadMetrics[];
        setDrafts((prev) => {
          const copy = { ...prev };
          for (const r of rows) {
            if (!copy[r.id]) copy[r.id] = buildDefaultText(r);
          }
          return copy;
        });
        setMetrics(rows);
      }

      // 2) Gesendete Follow-ups
      const { data: sMsgs, error: sErr } = await supabase
        .from("messages")
        .select("id, lead_id, text, timestamp")
        .eq("was_followup", true)
        .order("timestamp", { ascending: false })
        .limit(300);

      if (sErr) {
        console.error("⚠️ messages (sent followups) error:", sErr);
        setSent([]);
      } else {
        const msgs = (sMsgs ?? []) as SentFollowUp[];

        const leadIds = Array.from(new Set(msgs.map((m) => m.lead_id)));
        let leadMap: Record<string, LeadMin> = {};
        if (leadIds.length > 0) {
          const { data: leadsInfo, error: lErr } = await supabase
            .from("leads")
            .select("id, name, email")
            .in("id", leadIds);

          if (lErr) {
            console.error("⚠️ leads info error:", lErr);
          } else {
            leadMap = Object.fromEntries(
              (leadsInfo ?? []).map((l) => [l.id, l as LeadMin])
            );
          }
        }

        setSent(msgs);
        setSentLeadMap(leadMap);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Unbekannter Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const dueRows = useMemo(() => {
    return metrics.filter(
      (m) => (m.hours_since_last_reply ?? 0) >= Number(threshold)
    );
  }, [metrics, threshold]);

  const soonRows = useMemo(() => {
    const min = Math.max(1, Number(threshold) - Number(soonWindow));
    const max = Number(threshold);
    return metrics.filter((m) => {
      const h = Number(m.hours_since_last_reply ?? 0);
      return h >= min && h < max;
    });
  }, [metrics, threshold, soonWindow]);

  const applySearchLead = (rows: LeadMetrics[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.name ?? ""} ${r.email ?? ""} ${r.last_message ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  };

  const filteredDue = useMemo(
    () => applySearchLead(dueRows),
    [dueRows, search]
  );
  const filteredSoon = useMemo(
    () => applySearchLead(soonRows),
    [soonRows, search]
  );

  const filteredSent = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sent;
    return sent.filter((m) => {
      const lead = sentLeadMap[m.lead_id];
      const hay = `${lead?.name ?? ""} ${lead?.email ?? ""} ${m.text ?? ""}`;
      return hay.toLowerCase().includes(q);
    });
  }, [sent, sentLeadMap, search]);

  const setBusyFor = (id: string, v: boolean) =>
    setBusy((p) => ({ ...p, [id]: v }));

  const onToggleEditor = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const onDraftChange = (id: string, val: string) =>
    setDrafts((p) => ({ ...p, [id]: val }));

  const onSuggest = async (lead: LeadMetrics) => {
    try {
      setBusyFor(lead.id, true);
      const suggestion = await suggestFollowUpText(lead.id);
      setExpanded((p) => ({ ...p, [lead.id]: true }));
      setDrafts((p) => ({ ...p, [lead.id]: suggestion }));
      toast.success("Vorschlag eingefügt.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Konnte Vorschlag nicht erzeugen.");
    } finally {
      setBusyFor(lead.id, false);
    }
  };

  const onSend = async (lead: LeadMetrics) => {
    if (sendPending[lead.id]) return;

    const leadId = lead.id;
    const text = (drafts[leadId] || "").trim() || buildDefaultText(lead);

    if (!lead.email) {
      toast.error("Kein Empfänger gefunden (E-Mail fehlt beim Interessenten).");
      return;
    }

    const localSentId = `local-${leadId}-${Date.now()}`;
    setSendPendingFor(leadId, true);
    setSendErrorFor(leadId, null);

    const removedLeadSnapshot = lead;

    setMetrics((prev) => prev.filter((x) => x.id !== leadId));
    setExpanded((prev) => ({ ...prev, [leadId]: false }));

    setSent((prev) => [
      {
        id: localSentId,
        lead_id: leadId,
        text,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
    setSentLeadMap((prev) => ({
      ...prev,
      [leadId]: { id: leadId, name: lead.name, email: lead.email },
    }));

    try {
      setBusyFor(leadId, true);

      const { data: leadRow, error: leadErr } = await supabase
        .from("leads")
        .select("id, gmail_thread_id, type")
        .eq("id", leadId)
        .single();

      if (leadErr || !leadRow) {
        throw new Error("Konnte Interessent nicht laden.");
      }

      const subject = `Re: ${leadRow.type ?? "Anfrage"}`;

      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          gmail_thread_id: (leadRow as any).gmail_thread_id ?? null,
          to: lead.email,
          subject,
          text,
          was_followup: true,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Senden fehlgeschlagen.");
      }

      toast.success("Follow-up gesendet.");

      if (data?.gmail_message_id) {
        setSent((prev) =>
          prev.map((m) =>
            m.id === localSentId ? { ...m, id: data.gmail_message_id } : m
          )
        );
      }

      setDrafts((prev) => {
        const { [leadId]: _, ...rest } = prev;
        return rest;
      });

      setSendErrorFor(leadId, null);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message ?? "Senden fehlgeschlagen.";
      toast.error(msg);
      setSendErrorFor(leadId, msg);

      setMetrics((prev) => {
        const exists = prev.some((x) => x.id === removedLeadSnapshot.id);
        if (exists) return prev;
        return [removedLeadSnapshot, ...prev];
      });

      setSent((prev) => prev.filter((m) => m.id !== localSentId));
    } finally {
      setBusyFor(leadId, false);
      setSendPendingFor(leadId, false);
    }
  };

  const onSnooze24h = async (lead: LeadMetrics) => {
    try {
      setBusyFor(lead.id, true);

      await snoozeFollowUp(lead.id, 24);

      const nextLocal = new Date(Date.now() + 24 * 60 * 60 * 1000);
      toast.success(
        `Follow-up verschoben auf ${nextLocal.toLocaleString("de-DE")}.`
      );

      setMetrics((prev) => prev.filter((x) => x.id !== lead.id));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Snooze fehlgeschlagen.");
    } finally {
      setBusyFor(lead.id, false);
    }
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#f7f7f8] px-4 md:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-10 w-56 bg-white rounded-xl border border-gray-200 animate-pulse mb-3" />
          <div className="h-4 w-[420px] bg-white rounded-xl border border-gray-200 animate-pulse mb-6" />

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc]">
              <div className="h-9 w-80 bg-white rounded-xl border border-gray-200 animate-pulse" />
            </div>
            <div className="p-4 md:p-6 space-y-3">
              <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200">
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-semibold">
                  Follow-Ups
                </h1>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                  Advaic
                </span>
                <span className="text-xs text-gray-500 hidden sm:inline">
                  Zeigt fällige, bald fällige und bereits gesendete Follow-ups.
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Arbeite deine fälligen Nachrichten wie eine Inbox ab – schnell,
                sauber, nachvollziehbar.
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search (desktop) */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Suche…"
                  className="w-56 pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                />
              </div>

              <select
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Schwellwert (fällig ab … Stunden)"
              >
                <option value={12}>≥ 12h</option>
                <option value={24}>≥ 24h</option>
                <option value={36}>≥ 36h</option>
                <option value={48}>≥ 48h</option>
                <option value={72}>≥ 72h</option>
              </select>

              <select
                value={soonWindow}
                onChange={(e) => setSoonWindow(Number(e.target.value))}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Fenster für 'bald fällig' (Stunden vor Schwelle)"
              >
                <option value={6}>bald in ≤ 6h</option>
                <option value={12}>bald in ≤ 12h</option>
                <option value={18}>bald in ≤ 18h</option>
                <option value={24}>bald in ≤ 24h</option>
              </select>

              <button
                onClick={() => load({ silent: true })}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Neu laden"
              >
                <RefreshCw className="h-4 w-4" />
                Aktualisieren
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="pb-4">
            <div className="inline-flex gap-2 rounded-2xl border border-gray-200 bg-white p-1">
              <button
                onClick={() => setTab("due")}
                className={`px-3 py-2 text-sm rounded-xl transition-colors inline-flex items-center gap-2 ${
                  tab === "due"
                    ? "bg-gray-900 text-amber-200"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                Fällig
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    tab === "due"
                      ? "border-amber-300/40 bg-gray-900 text-amber-200"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}
                >
                  {filteredDue.length}
                </span>
              </button>

              <button
                onClick={() => setTab("soon")}
                className={`px-3 py-2 text-sm rounded-xl transition-colors inline-flex items-center gap-2 ${
                  tab === "soon"
                    ? "bg-gray-900 text-amber-200"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Clock className="h-4 w-4" />
                Bald
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    tab === "soon"
                      ? "border-amber-300/40 bg-gray-900 text-amber-200"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}
                >
                  {filteredSoon.length}
                </span>
              </button>

              <button
                onClick={() => setTab("sent")}
                className={`px-3 py-2 text-sm rounded-xl transition-colors inline-flex items-center gap-2 ${
                  tab === "sent"
                    ? "bg-gray-900 text-amber-200"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Send className="h-4 w-4" />
                Gesendet
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    tab === "sent"
                      ? "border-amber-300/40 bg-gray-900 text-amber-200"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}
                >
                  {filteredSent.length}
                </span>
              </button>
            </div>

            {/* Search (mobile) */}
            <div className="md:hidden mt-3 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suchen (Name, E-Mail, Text)…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              />
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="py-6">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                {tab === "due" && (
                  <>
                    Fällige Follow-ups ab{" "}
                    <span className="font-medium">{threshold}h</span> ohne
                    Antwort.
                  </>
                )}
                {tab === "soon" && (
                  <>
                    Bald fällig:{" "}
                    <span className="font-medium">{soonWindow}h</span> vor der
                    Schwelle.
                  </>
                )}
                {tab === "sent" && <>Bereits versendete Follow-ups.</>}
              </div>
              <div className="text-xs text-gray-500 hidden sm:block">
                Tipp: „Vorschlag“ für KI-Text, „Snooze“ für später.
              </div>
            </div>

            <div className="p-4 md:p-6">
              {tab === "due" && (
                <SectionDue
                  rows={filteredDue}
                  emptyText={`Keine fälligen Follow-Ups ≥ ${threshold}h.`}
                  drafts={drafts}
                  expanded={expanded}
                  busy={busy}
                  sendPending={sendPending}
                  sendError={sendError}
                  onToggleEditor={onToggleEditor}
                  onDraftChange={onDraftChange}
                  onSend={onSend}
                  onSnooze24h={onSnooze24h}
                  onSuggest={onSuggest}
                />
              )}
              {tab === "soon" && (
                <SectionSoon
                  rows={filteredSoon}
                  emptyText="Aktuell keine bald fälligen Follow-Ups."
                  drafts={drafts}
                  expanded={expanded}
                  busy={busy}
                  sendPending={sendPending}
                  sendError={sendError}
                  onToggleEditor={onToggleEditor}
                  onDraftChange={onDraftChange}
                  onSend={onSend}
                  onSnooze24h={onSnooze24h}
                  onSuggest={onSuggest}
                />
              )}
              {tab === "sent" && (
                <SectionSent
                  rows={filteredSent}
                  leadMap={sentLeadMap}
                  emptyText="Noch keine gesendeten Follow-Ups gefunden."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Unter-Komponenten ---------- */

function SectionDue({
  rows,
  emptyText,
  drafts,
  expanded,
  busy,
  sendPending,
  sendError,
  onToggleEditor,
  onDraftChange,
  onSend,
  onSnooze24h,
  onSuggest,
}: {
  rows: LeadMetrics[];
  emptyText: string;
  drafts: Record<string, string>;
  expanded: Record<string, boolean>;
  busy: Record<string, boolean>;
  sendPending: Record<string, boolean>;
  sendError: Record<string, string | null>;
  onToggleEditor: (id: string) => void;
  onDraftChange: (id: string, val: string) => void;
  onSend: (lead: LeadMetrics) => void;
  onSnooze24h: (lead: LeadMetrics) => void;
  onSuggest: (lead: LeadMetrics) => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyBox icon={<CheckCircle2 className="h-4 w-4" />} text={emptyText} />
    );
  }
  return (
    <div className="space-y-3">
      {rows.map((lead) => (
        <LeadCardWithActions
          key={lead.id}
          lead={lead}
          badge={`${lead.hours_since_last_reply}h überfällig`}
          draft={drafts[lead.id] ?? ""}
          expanded={!!expanded[lead.id]}
          busy={!!busy[lead.id]}
          sendPending={!!sendPending[lead.id]}
          sendError={sendError[lead.id] ?? null}
          onToggleEditor={() => onToggleEditor(lead.id)}
          onDraftChange={(v) => onDraftChange(lead.id, v)}
          onSend={() => onSend(lead)}
          onSnooze24h={() => onSnooze24h(lead)}
          onSuggest={() => onSuggest(lead)}
        />
      ))}
    </div>
  );
}

function SectionSoon({
  rows,
  emptyText,
  drafts,
  expanded,
  busy,
  sendPending,
  sendError,
  onToggleEditor,
  onDraftChange,
  onSend,
  onSnooze24h,
  onSuggest,
}: {
  rows: LeadMetrics[];
  emptyText: string;
  drafts: Record<string, string>;
  expanded: Record<string, boolean>;
  busy: Record<string, boolean>;
  sendPending: Record<string, boolean>;
  sendError: Record<string, string | null>;
  onToggleEditor: (id: string) => void;
  onDraftChange: (id: string, val: string) => void;
  onSend: (lead: LeadMetrics) => void;
  onSnooze24h: (lead: LeadMetrics) => void;
  onSuggest: (lead: LeadMetrics) => void;
}) {
  if (rows.length === 0) {
    return <EmptyBox icon={<Clock className="h-4 w-4" />} text={emptyText} />;
  }
  return (
    <div className="space-y-3">
      {rows.map((lead) => (
        <LeadCardWithActions
          key={lead.id}
          lead={lead}
          badge={`${lead.hours_since_last_reply}h seit letzter Antwort`}
          draft={drafts[lead.id] ?? ""}
          expanded={!!expanded[lead.id]}
          busy={!!busy[lead.id]}
          sendPending={!!sendPending[lead.id]}
          sendError={sendError[lead.id] ?? null}
          onToggleEditor={() => onToggleEditor(lead.id)}
          onDraftChange={(v) => onDraftChange(lead.id, v)}
          onSend={() => onSend(lead)}
          onSnooze24h={() => onSnooze24h(lead)}
          onSuggest={() => onSuggest(lead)}
        />
      ))}
    </div>
  );
}

function SectionSent({
  rows,
  leadMap,
  emptyText,
}: {
  rows: SentFollowUp[];
  leadMap: Record<string, LeadMin>;
  emptyText: string;
}) {
  if (rows.length === 0) {
    return <EmptyBox icon={<Send className="h-4 w-4" />} text={emptyText} />;
  }
  return (
    <div className="space-y-3">
      {rows.map((m) => {
        const lead = leadMap[m.lead_id];
        return (
          <div
            key={m.id}
            className="flex items-start justify-between gap-4 border border-gray-200 rounded-2xl p-4 hover:bg-gray-50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-medium truncate">
                  {lead?.name ?? "Unbekannter Kontakt"}
                </h2>
                <span className="text-xs text-gray-500">
                  • {lead?.email ?? "–"}
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-700 line-clamp-2">
                {m.text ?? "—"}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Gesendet: {new Date(m.timestamp).toLocaleString("de-DE")}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Link
                href={`/app/nachrichten/${m.lead_id}`}
                className="text-xs inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2"
              >
                Konversation öffnen
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadCardWithActions({
  lead,
  badge,
  draft,
  expanded,
  busy,
  sendPending,
  sendError,
  onToggleEditor,
  onDraftChange,
  onSend,
  onSnooze24h,
  onSuggest,
}: {
  lead: LeadMetrics;
  badge: string;
  draft: string;
  expanded: boolean;
  busy: boolean;
  sendPending: boolean;
  sendError: string | null;
  onToggleEditor: () => void;
  onDraftChange: (val: string) => void;
  onSend: () => void;
  onSnooze24h: () => void;
  onSuggest: () => void;
}) {
  const isOverdue = badge.toLowerCase().includes("überfällig");

  return (
    <div
      className={`flex flex-col gap-3 border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 ${
        isOverdue ? "bg-amber-50/40 border-amber-200" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-medium truncate">
              {lead.name ?? "Unbekannter Kontakt"}
            </h2>
            <span className="text-xs text-gray-500">• {lead.email ?? "–"}</span>
          </div>

          <p className="mt-1 text-sm text-gray-700 line-clamp-2">
            {lead.last_message ?? "Keine letzte Nachricht gespeichert."}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Letzte Aktivität:{" "}
            {lead.updated_at
              ? new Date(lead.updated_at).toLocaleString("de-DE")
              : "–"}
          </p>

          {sendError && (
            <p className="mt-2 text-xs text-red-600">{sendError}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs font-medium rounded-full px-2 py-1 border border-amber-200 bg-amber-50 text-amber-800">
            {badge}
          </span>

          {sendPending && (
            <span className="text-xs font-medium rounded-full px-2 py-1 border border-amber-200 bg-white text-gray-700">
              Wird gesendet…
            </span>
          )}

          <div className="flex items-center gap-2">
            <Link
              href={`/app/nachrichten/${lead.id}`}
              className="text-xs inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2"
            >
              Konversation öffnen
            </Link>

            <button
              disabled={busy || sendPending}
              onClick={onToggleEditor}
              className="text-xs inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              title={expanded ? "Text-Editor schließen" : "Text editieren"}
            >
              {expanded ? (
                <>
                  <X className="h-4 w-4" />
                  Schließen
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4" />
                  Text
                </>
              )}
            </button>

            <button
              onClick={onSuggest}
              disabled={busy || sendPending}
              className="text-xs inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 disabled:opacity-60"
              title="KI-Vorschlag einfügen"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Vorschlag
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-1 rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            placeholder="Individuellen Follow-up-Text eingeben…"
          />
          <div className="mt-2 text-xs text-gray-500">
            Der Text wird direkt über Ihr verbundenes Gmail versendet.
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          disabled={busy || sendPending}
          onClick={onSnooze24h}
          className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 text-sm disabled:opacity-60"
          title="Follow-up um 24h verschieben"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlarmClock className="h-4 w-4" />
          )}
          Snooze 24h
        </button>

        <button
          disabled={busy || sendPending}
          onClick={onSend}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-60"
          title="Follow-up jetzt senden"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Senden
        </button>
      </div>
    </div>
  );
}

function EmptyBox({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-[#fbfbfc] p-6 text-center">
      <div className="inline-flex items-center gap-2 text-gray-900 font-medium">
        {icon}
        <span>Alles erledigt.</span>
      </div>
      <div className="text-sm text-gray-600 mt-2">{text}</div>
    </div>
  );
}
