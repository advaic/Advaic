"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Settings,
  Wand2,
  X,
} from "lucide-react";
import { snoozeFollowUp, suggestFollowUpText } from "@/app/actions/followups";

/** View-Zeile aus `followups_queue_v1` */
type FollowupQueueRow = {
  id: string;
  agent_id: string;
  name: string | null;
  email: string | null;

  bucket: "waiting" | "planned" | "sent";
  bucket_label: string | null;

  followups_enabled: boolean;
  followup_paused_until: string | null;
  followup_stage: number;
  followup_next_at: string | null;
  followup_status: string;
  followup_stop_reason: string | null;

  last_followup_text: string | null;
  last_followup_sent_at: string | null;

  last_user_message_at: string | null;
  last_agent_message_at: string | null;

  computed_due_at: string | null;
  computed_is_due: boolean;
  next_stage: number | null;

  hours_until_next: number | null;
};

/** Nachricht aus `messages` für gesendete Follow-ups (Fallback-Historie) */
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

type TabKey = "waiting" | "planned" | "sent";

type FollowUpsUIProps = {
  /** vom Server (page.tsx) durchgereicht */
  userId: string;
};

export default function FollowUpsUI({ userId }: FollowUpsUIProps) {
  const supabase = useSupabaseClient<Database>();
  const [tab, setTab] = useState<TabKey>("waiting");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [queue, setQueue] = useState<FollowupQueueRow[]>([]);
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

  const buildDefaultText = (lead: Pick<FollowupQueueRow, "name">) =>
    `${
      lead.name?.trim() || "Hallo"
    }, nur ein kurzes Follow-up: Haben Sie schon ein Update oder noch Fragen? Ich freue mich auf Ihre Rückmeldung.`;

  const load = async (opts?: { silent?: boolean }) => {
    if (!userId) return;
    try {
      if (!opts?.silent) setLoading(true);

      // 1) Queue aus View (Wartet / Geplant / Gesendet)
      const { data: qData, error: qErr } = await supabase
        .from("followups_queue_v1")
        .select("*")
        .eq("agent_id", userId);

      if (qErr) {
        console.error("⚠️ followups_queue_v1 error:", qErr);
        toast.error(
          "Fehler beim Laden der Follow-ups. Existiert die View `followups_queue_v1`?",
        );
        setQueue([]);
      } else {
        const rows = (qData ?? []) as FollowupQueueRow[];
        setDrafts((prev) => {
          const copy = { ...prev };
          for (const r of rows) {
            if (!copy[r.id]) copy[r.id] = buildDefaultText(r);
          }
          return copy;
        });
        setQueue(rows);
      }

      // 2) Gesendete Follow-ups (Fallback Historie aus messages)
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
              (leadsInfo ?? []).map((l) => [l.id, l as LeadMin]),
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

  const applySearchLead = (rows: FollowupQueueRow[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.name ?? ""} ${r.email ?? ""} ${r.last_followup_text ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  };

  const waitingRows = useMemo(
    () => queue.filter((r) => r.bucket === "waiting"),
    [queue],
  );
  const plannedRows = useMemo(
    () => queue.filter((r) => r.bucket === "planned"),
    [queue],
  );

  const filteredWaiting = useMemo(
    () => applySearchLead(waitingRows),
    [waitingRows, search],
  );
  const filteredPlanned = useMemo(
    () => applySearchLead(plannedRows),
    [plannedRows, search],
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

  const onSuggest = async (lead: FollowupQueueRow) => {
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

  const onSend = async (lead: FollowupQueueRow) => {
    if (sendPending[lead.id]) return;

    const leadId = lead.id;
    const text = (drafts[leadId] || "").trim() || buildDefaultText(lead);

    if (!lead.email) {
      toast.error("Kein Empfänger gefunden (E-Mail fehlt beim Interessenten).");
      return;
    }

    const initialLocalSentId = `local-${leadId}-${Date.now()}`;
    let localSentId = initialLocalSentId;

    setSendPendingFor(leadId, true);
    setSendErrorFor(leadId, null);

    const removedLeadSnapshot = lead;

    // Optimistic UI: remove from queue and add to "sent" immediately
    setQueue((prev) => prev.filter((x) => x.id !== leadId));
    setExpanded((prev) => ({ ...prev, [leadId]: false }));

    setSent((prev) => [
      {
        id: initialLocalSentId,
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
        .select(
          "id, type, email_provider, gmail_thread_id, outlook_conversation_id",
        )
        .eq("id", leadId)
        .single();

      if (leadErr || !leadRow) {
        throw new Error("Konnte Interessent nicht laden.");
      }

      const subject = `Re: ${(leadRow as any).type ?? "Anfrage"}`;

      // Outlook send route requires a `messages.id` (draft row). For Gmail we can send without it.
      async function ensureOutlookDraftMessageId(): Promise<string> {
        const nowIso = new Date().toISOString();

        const { data: inserted, error: insErr } = await (
          supabase.from("messages") as any
        )
          .insert({
            agent_id: userId,
            lead_id: leadId,
            sender: "agent",
            text,
            timestamp: nowIso,
            was_followup: true,
            email_provider: "outlook",
            send_status: "pending",
            approval_required: false,
            status: "approved",
          })
          .select("id")
          .single();

        if (insErr || !inserted?.id) {
          throw new Error(
            insErr?.message ||
              "Konnte Outlook-Entwurf (Message) nicht anlegen.",
          );
        }

        return String(inserted.id);
      }

      const provider = (leadRow as any).email_provider ?? "gmail";
      const endpoint =
        provider === "outlook" ? "/api/outlook/send" : "/api/gmail/send";

      const payload: Record<string, any> = {
        lead_id: leadId,
        to: lead.email,
        subject,
        text,
        was_followup: true,
      };

      // Provider-spezifische Conversation/Thread-Verknüpfung
      if (provider === "outlook") {
        payload.outlook_conversation_id =
          (leadRow as any).outlook_conversation_id ?? null;

        // Outlook requires a message id; create a draft row first.
        const draftMessageId = await ensureOutlookDraftMessageId();
        payload.id = draftMessageId;

        // Update optimistic row id from local-... to the real draft id
        setSent((prev) =>
          prev.map((m) =>
            m.id === initialLocalSentId ? { ...m, id: draftMessageId } : m,
          ),
        );

        localSentId = draftMessageId;
      } else {
        payload.gmail_thread_id = (leadRow as any).gmail_thread_id ?? null;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Senden fehlgeschlagen.");
      }

      toast.success("Follow-up gesendet.");

      const returnedId =
        data?.gmail_message_id ??
        data?.outlook_message_id ??
        data?.message?.outlook_message_id ??
        data?.message?.gmail_message_id ??
        null;

      // If the API returns a different id (Gmail message id, or Graph message id),
      // swap it in the UI.
      if (returnedId) {
        setSent((prev) =>
          prev.map((m) =>
            m.id === localSentId ? { ...m, id: String(returnedId) } : m,
          ),
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

      // Reinsert the lead into queue
      setQueue((prev) => {
        const exists = prev.some((x) => x.id === removedLeadSnapshot.id);
        if (exists) return prev;
        return [removedLeadSnapshot, ...prev];
      });

      // Remove optimistic sent row (could be initialLocalSentId or draft id)
      setSent((prev) =>
        prev.filter((m) => m.id !== initialLocalSentId && m.id !== localSentId),
      );
    } finally {
      setBusyFor(leadId, false);
      setSendPendingFor(leadId, false);
    }
  };

  const onSnooze24h = async (lead: FollowupQueueRow) => {
    try {
      setBusyFor(lead.id, true);

      await snoozeFollowUp(lead.id, 24);

      const nextLocal = new Date(Date.now() + 24 * 60 * 60 * 1000);
      toast.success(
        `Follow-up verschoben auf ${nextLocal.toLocaleString("de-DE")}.`,
      );

      setQueue((prev) => prev.filter((x) => x.id !== lead.id));
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
          <div className="h-4 w-[520px] bg-white rounded-xl border border-gray-200 animate-pulse mb-6" />

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
    <div
      className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900"
      data-tour="followups-page"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200"
          data-tour="followups-header"
        >
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
                  Wartet = benötigt Aktion. Geplant = kommt automatisch.
                  Gesendet = Historie.
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Behalte Kontrolle – ohne Spam. Du siehst nur echte Zustände, die
                relevant sind.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/app/follow-ups/settings"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800"
                title="Follow-up Einstellungen"
              >
                <Settings className="h-4 w-4" />
                Einstellungen
              </Link>
              {/* Search (desktop) */}
              <div
                className="hidden md:block relative"
                data-tour="followups-search"
              >
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Suche…"
                  className="w-56 pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                />
              </div>

              <button
                onClick={() => load({ silent: true })}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Neu laden"
                data-tour="followups-refresh"
              >
                <RefreshCw className="h-4 w-4" />
                Aktualisieren
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="pb-4">
            <div
              className="inline-flex gap-2 rounded-2xl border border-gray-200 bg-white p-1"
              data-tour="followups-tabs"
            >
              <button
                onClick={() => setTab("waiting")}
                className={`px-3 py-2 text-sm rounded-xl transition-colors inline-flex items-center gap-2 ${
                  tab === "waiting"
                    ? "bg-gray-900 text-amber-200"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                Wartet
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    tab === "waiting"
                      ? "border-amber-300/40 bg-gray-900 text-amber-200"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}
                >
                  {filteredWaiting.length}
                </span>
              </button>

              <button
                onClick={() => setTab("planned")}
                className={`px-3 py-2 text-sm rounded-xl transition-colors inline-flex items-center gap-2 ${
                  tab === "planned"
                    ? "bg-gray-900 text-amber-200"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Clock className="h-4 w-4" />
                Geplant
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    tab === "planned"
                      ? "border-amber-300/40 bg-gray-900 text-amber-200"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                  }`}
                >
                  {filteredPlanned.length}
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
          <div
            className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
            data-tour="followups-list"
          >
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                {tab === "waiting" && (
                  <>
                    Wartet: Follow-ups, die Ihre Aufmerksamkeit brauchen (z.B.
                    Freigabe, Fehler oder manuell fällig).
                  </>
                )}
                {tab === "planned" && (
                  <>
                    Geplant: Follow-ups, die automatisch als Nächstes anstehen.
                  </>
                )}
                {tab === "sent" && <>Bereits versendete Follow-ups.</>}
              </div>
              <div className="text-xs text-gray-500 hidden sm:block">
                Tipp: „Vorschlag“ für KI-Text, „Snooze“ für später.
              </div>
            </div>

            <div className="p-4 md:p-6">
              {tab === "waiting" && (
                <SectionWaiting
                  rows={filteredWaiting}
                  emptyText="Aktuell wartet nichts."
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
              {tab === "planned" && (
                <SectionPlanned
                  rows={filteredPlanned}
                  emptyText="Aktuell ist nichts geplant."
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

function SectionWaiting({
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
  rows: FollowupQueueRow[];
  emptyText: string;
  drafts: Record<string, string>;
  expanded: Record<string, boolean>;
  busy: Record<string, boolean>;
  sendPending: Record<string, boolean>;
  sendError: Record<string, string | null>;
  onToggleEditor: (id: string) => void;
  onDraftChange: (id: string, val: string) => void;
  onSend: (lead: FollowupQueueRow) => void;
  onSnooze24h: (lead: FollowupQueueRow) => void;
  onSuggest: (lead: FollowupQueueRow) => void;
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
          badge={lead.bucket_label ?? "Wartet"}
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

function SectionPlanned({
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
  rows: FollowupQueueRow[];
  emptyText: string;
  drafts: Record<string, string>;
  expanded: Record<string, boolean>;
  busy: Record<string, boolean>;
  sendPending: Record<string, boolean>;
  sendError: Record<string, string | null>;
  onToggleEditor: (id: string) => void;
  onDraftChange: (id: string, val: string) => void;
  onSend: (lead: FollowupQueueRow) => void;
  onSnooze24h: (lead: FollowupQueueRow) => void;
  onSuggest: (lead: FollowupQueueRow) => void;
}) {
  if (rows.length === 0) {
    return <EmptyBox icon={<Clock className="h-4 w-4" />} text={emptyText} />;
  }
  return (
    <div className="space-y-3">
      {rows.map((lead) => {
        const nextAt = lead.followup_next_at
          ? new Date(lead.followup_next_at).toLocaleString("de-DE")
          : null;

        const badge =
          lead.bucket_label ?? (nextAt ? `Geplant: ${nextAt}` : "Geplant");

        return (
          <LeadCardWithActions
            key={lead.id}
            lead={lead}
            badge={badge}
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
        );
      })}
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
            data-tour="followups-sent-item"
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
  lead: FollowupQueueRow;
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
  const nextAt = lead.followup_next_at
    ? new Date(lead.followup_next_at).toLocaleString("de-DE")
    : null;

  const lastSent = lead.last_followup_sent_at
    ? new Date(lead.last_followup_sent_at).toLocaleString("de-DE")
    : null;

  return (
    <div
      className="flex flex-col gap-3 border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 bg-white"
      data-tour="followups-card"
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
            <span className="text-gray-500">Letztes Follow-up: </span>
            {lead.last_followup_text ?? "—"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {nextAt ? (
              <>Nächstes Follow-up: {nextAt}</>
            ) : lastSent ? (
              <>Letztes Follow-up gesendet: {lastSent}</>
            ) : (
              <>—</>
            )}
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
              data-tour="followups-open-conversation"
            >
              Konversation öffnen
            </Link>

            <button
              disabled={busy || sendPending}
              onClick={onToggleEditor}
              className="text-xs inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              title={expanded ? "Text-Editor schließen" : "Text editieren"}
              data-tour="followups-edit-toggle"
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
              data-tour="followups-suggest"
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
        <div
          className="mt-1 rounded-xl border border-gray-200 bg-[#fbfbfc] p-3"
          data-tour="followups-editor"
        >
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            placeholder="Individuellen Follow-up-Text eingeben…"
          />
          <div className="mt-2 text-xs text-gray-500">
            Der Text wird als echte E-Mail über Ihr verbundenes Postfach
            versendet (nicht nur intern).
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          disabled={busy || sendPending}
          onClick={onSnooze24h}
          className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 text-sm disabled:opacity-60"
          title="Follow-up um 24h verschieben"
          data-tour="followups-snooze"
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
          data-tour="followups-send"
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

function EmptyBox({ icon, text }: { icon: ReactNode; text: string }) {
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
