"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlarmClock, // icon für Snooze
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
import {
  sendFollowUpNow,
  snoozeFollowUp,
  suggestFollowUpText,
} from "@/app/actions/followups";

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
  const [threshold, setThreshold] = useState<number>(24); // Stunden, ab wann „fällig“
  const [soonWindow, setSoonWindow] = useState<number>(12); // „bald fällig“ Fenster
  const [search, setSearch] = useState("");

  const [metrics, setMetrics] = useState<LeadMetrics[]>([]);
  const [sent, setSent] = useState<SentFollowUp[]>([]);
  const [sentLeadMap, setSentLeadMap] = useState<Record<string, LeadMin>>({});

  /** pro Lead: Draft-Text */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  /** pro Lead: Editor auf/zu */
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  /** pro Lead: busy-state */
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const buildDefaultText = (lead: Pick<LeadMetrics, "name">) =>
    `${
      lead.name?.trim() || "Hallo"
    }, nur ein kurzes Follow-up: Haben Sie schon ein Update oder noch Fragen? Ich freue mich auf Ihre Rückmeldung.`;

  // Laden
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
        // Drafts initialisieren, falls neu
        setDrafts((prev) => {
          const copy = { ...prev };
          for (const r of rows) {
            if (!copy[r.id]) copy[r.id] = buildDefaultText(r);
          }
          return copy;
        });
        setMetrics(rows);
      }

      // 2) Gesendete Follow-ups (aus messages ableiten)
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

        // Leads für diese Messages laden (Name/Email)
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

  // Ableitungen
  const dueRows = useMemo(() => {
    return metrics.filter(
      (m) => (m.hours_since_last_reply ?? 0) >= Number(threshold)
    );
  }, [metrics, threshold]);

  const soonRows = useMemo(() => {
    const min = Math.max(1, Number(threshold) - Number(soonWindow)); // z.B. 24 - 12 = 12h
    const max = Number(threshold);
    return metrics.filter((m) => {
      const h = Number(m.hours_since_last_reply ?? 0);
      return h >= min && h < max;
    });
  }, [metrics, threshold, soonWindow]);

  // Suche anwenden
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

  /* ---------- Aktionen ---------- */

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
      // Ensure editor is open and draft is filled
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
    try {
      setBusyFor(lead.id, true);
      const text = (drafts[lead.id] || "").trim() || buildDefaultText(lead);
      await sendFollowUpNow(lead.id, text);
      toast.success("Follow-up gesendet.");

      // Entferne aus „fällig/bald“ (der Lead ist dealt-with)
      setMetrics((prev) => prev.filter((x) => x.id !== lead.id));
      setExpanded((prev) => ({ ...prev, [lead.id]: false }));
      setDrafts((prev) => {
        const { [lead.id]: _, ...rest } = prev;
        return rest;
      });

      // Optional: sofort in „Gesendet“ puffern (rein optisch)
      setSent((prev) => [
        {
          id: `local-${lead.id}-${Date.now()}`,
          lead_id: lead.id,
          text,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSentLeadMap((prev) => ({
        ...prev,
        [lead.id]: { id: lead.id, name: lead.name, email: lead.email },
      }));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Senden fehlgeschlagen.");
    } finally {
      setBusyFor(lead.id, false);
    }
  };

  const onSnooze24h = async (lead: LeadMetrics) => {
    try {
      setBusyFor(lead.id, true);

      // Call server action with (leadId, hours)
      await snoozeFollowUp(lead.id, 24);

      // Compute target time locally for the toast
      const nextLocal = new Date(Date.now() + 24 * 60 * 60 * 1000);
      toast.success(
        `Follow-up verschoben auf ${nextLocal.toLocaleString("de-DE")}.`
      );

      // Optimistically remove from the list (lead is no longer due)
      setMetrics((prev) => prev.filter((x) => x.id !== lead.id));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Snooze fehlgeschlagen.");
    } finally {
      setBusyFor(lead.id, false);
    }
  };

  // UI
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Lade Follow-Ups…</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header / Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Follow-Ups</h1>
          <span className="text-xs text-gray-500 hidden sm:inline">
            Zeigt fällige, bald fällige und bereits gesendete Follow-ups.
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Suche */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suchen (Name, E-Mail, Text)…"
              className="pl-8 pr-3 py-2 border rounded-md text-sm w-64"
            />
          </div>

          {/* Schwelle */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="border rounded-md text-sm px-2 py-2"
              title="Schwellwert (fällig ab … Stunden)"
            >
              <option value={12}>≥ 12h</option>
              <option value={24}>≥ 24h</option>
              <option value={36}>≥ 36h</option>
              <option value={48}>≥ 48h</option>
              <option value={72}>≥ 72h</option>
            </select>
          </div>

          {/* Soon-Fenster */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <select
              value={soonWindow}
              onChange={(e) => setSoonWindow(Number(e.target.value))}
              className="border rounded-md text-sm px-2 py-2"
              title="Fenster für 'bald fällig' (Stunden vor Schwelle)"
            >
              <option value={6}>bald in ≤ 6h</option>
              <option value={12}>bald in ≤ 12h</option>
              <option value={18}>bald in ≤ 18h</option>
              <option value={24}>bald in ≤ 24h</option>
            </select>
          </div>

          {/* Manuell reload */}
          <button
            onClick={() => load({ silent: true })}
            className="inline-flex items-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
            title="Neu laden"
          >
            <RefreshCw className="h-4 w-4" />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("due")}
          className={`px-3 py-2 text-sm -mb-px border-b-2 ${
            tab === "due"
              ? "border-black font-medium"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Fällig ({filteredDue.length})
          </span>
        </button>
        <button
          onClick={() => setTab("soon")}
          className={`px-3 py-2 text-sm -mb-px border-b-2 ${
            tab === "soon"
              ? "border-black font-medium"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Bald fällig ({filteredSoon.length})
          </span>
        </button>
        <button
          onClick={() => setTab("sent")}
          className={`px-3 py-2 text-sm -mb-px border-b-2 ${
            tab === "sent"
              ? "border-black font-medium"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <Send className="h-4 w-4" />
            Gesendet ({filteredSent.length})
          </span>
        </button>
      </div>

      {/* Inhalt je Tab */}
      {tab === "due" && (
        <SectionDue
          rows={filteredDue}
          emptyText={`Keine fälligen Follow-Ups ≥ ${threshold}h.`}
          drafts={drafts}
          expanded={expanded}
          busy={busy}
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
  );
}

/* ---------- Unter-Komponenten ---------- */

function SectionDue({
  rows,
  emptyText,
  drafts,
  expanded,
  busy,
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
    <div className="space-y-2">
      {rows.map((lead) => (
        <LeadCardWithActions
          key={lead.id}
          lead={lead}
          badge={`${lead.hours_since_last_reply}h überfällig`}
          draft={drafts[lead.id] ?? ""}
          expanded={!!expanded[lead.id]}
          busy={!!busy[lead.id]}
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
    <div className="space-y-2">
      {rows.map((lead) => (
        <LeadCardWithActions
          key={lead.id}
          lead={lead}
          badge={`${lead.hours_since_last_reply}h seit letzter Antwort`}
          draft={drafts[lead.id] ?? ""}
          expanded={!!expanded[lead.id]}
          busy={!!busy[lead.id]}
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
    <div className="space-y-2">
      {rows.map((m) => {
        const lead = leadMap[m.lead_id];
        return (
          <div
            key={m.id}
            className="flex items-start justify-between gap-4 border rounded-lg p-4 hover:bg-gray-50"
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

              <p className="mt-1 text-xs text-gray-500">
                Gesendet: {new Date(m.timestamp).toLocaleString("de-DE")}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Link
                href={`/nachrichten/${m.lead_id}`}
                className="text-xs border rounded px-3 py-1 hover:bg-gray-100"
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

/** Karte mit Follow-up Aktionen (Editor, Snooze, Senden) */
function LeadCardWithActions({
  lead,
  badge,
  draft,
  expanded,
  busy,
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
  onToggleEditor: () => void;
  onDraftChange: (val: string) => void;
  onSend: () => void;
  onSnooze24h: () => void;
  onSuggest: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border rounded-lg p-4 hover:bg-gray-50">
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
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs font-medium rounded-full px-2 py-1 bg-amber-100 text-amber-800">
            {badge}
          </span>

          <div className="flex items-center gap-2">
            <Link
              href={`/nachrichten/${lead.id}`}
              className="text-xs border rounded px-3 py-1 hover:bg-gray-100"
            >
              Konversation öffnen
            </Link>

            <button
              onClick={onToggleEditor}
              className="text-xs inline-flex items-center gap-1 border rounded px-2 py-1 hover:bg-gray-100"
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
              disabled={busy}
              className="text-xs inline-flex items-center gap-1 border rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-60"
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
        <div className="mt-1">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={3}
            className="w-full text-sm border rounded-md p-2"
            placeholder="Individuellen Follow-up-Text eingeben…"
          />
          <div className="mt-1 text-xs text-gray-500">
            Der Text wird direkt per Make versendet.
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          disabled={busy}
          onClick={onSnooze24h}
          className="inline-flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
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
          disabled={busy}
          onClick={onSend}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
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
    <div className="text-sm text-gray-500 border rounded-md p-4 inline-flex items-center gap-2">
      {icon}
      {text}
    </div>
  );
}
