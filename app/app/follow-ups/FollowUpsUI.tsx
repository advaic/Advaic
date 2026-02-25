"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlarmClock,
  AlertTriangle,
  Clock,
  Edit3,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Settings,
  Wand2,
  X,
  PauseCircle,
  PlayCircle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { snoozeFollowUp, suggestFollowUpText } from "@/app/actions/followups";
import { trackFunnelEvent } from "@/lib/funnel/track";

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

type FollowupAgentSettings = {
  followups_enabled_default: boolean;
};

type FollowupPerformance = {
  sent30d: number;
  replied30d: number;
  replyRatePct: number;
  stoppedUserReplied: number;
  stoppedMaxStage: number;
  stoppedPaused: number;
};

// ---- Draft meta (Enterprise clarity: KI vs Manuell + Ton) ----
type DraftEngine = "ai" | "manual" | "default";
type DraftMeta = {
  engine: DraftEngine;
  tone?: "friendly" | "neutral" | "firm";
  updated_at: string; // iso
};

function toneLabel(t: "friendly" | "neutral" | "firm") {
  if (t === "friendly") return "Freundlich";
  if (t === "neutral") return "Neutral";
  return "Klar";
}

// --- Enterprise helpers for date formatting ---
function fmtDT(v: string | null | undefined): string {
  if (!v) return "–";
  const t = new Date(v);
  if (!Number.isFinite(t.getTime())) return "–";
  return t.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelativeFromNow(v: string | null | undefined): string {
  if (!v) return "–";
  const t = new Date(v).getTime();
  if (!Number.isFinite(t)) return "–";
  const diffMs = t - Date.now();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  if (mins < 60) return diffMs >= 0 ? `in ${mins} min` : `${mins} min her`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return diffMs >= 0 ? `in ${hours} h` : `${hours} h her`;
  const days = Math.round(hours / 24);
  return diffMs >= 0 ? `in ${days} d` : `${days} d her`;
}

function isFuture(v: string | null | undefined): boolean {
  if (!v) return false;
  const t = new Date(v).getTime();
  return Number.isFinite(t) && t > Date.now();
}

function nextActionMs(row: FollowupQueueRow): number | null {
  const ts = row.followup_next_at ?? row.computed_due_at ?? null;
  if (!ts) return null;
  const ms = new Date(ts).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export default function FollowUpsUI({ userId }: FollowUpsUIProps) {
  const supabase = useSupabaseClient<Database>();
  const [tab, setTab] = useState<TabKey>("waiting");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // --- Enterprise filters and selection ---
  const [onlyDue, setOnlyDue] = useState(false);
  const [hidePaused, setHidePaused] = useState(false);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected],
  );

  const toggleSelected = (id: string) =>
    setSelected((p) => ({ ...p, [id]: !p[id] }));

  const clearSelection = () => setSelected({});

  const [fuSettings, setFuSettings] = useState<FollowupAgentSettings | null>(
    null,
  );
  const [performance, setPerformance] = useState<FollowupPerformance>({
    sent30d: 0,
    replied30d: 0,
    replyRatePct: 0,
    stoppedUserReplied: 0,
    stoppedMaxStage: 0,
    stoppedPaused: 0,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  async function fetchFollowupSettings(): Promise<FollowupAgentSettings | null> {
    // Prefer a dedicated API route (mirrors autosend route style)
    const tryUrls = [
      "/api/agent/settings/followups",
      "/api/agent/settings/followup",
    ];
    for (const url of tryUrls) {
      try {
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) continue;
        const j = await res.json().catch(() => null);
        const enabled = j?.settings?.followups_enabled_default;
        if (typeof enabled === "boolean")
          return { followups_enabled_default: enabled };
      } catch {
        // ignore and try next
      }
    }
    return null;
  }

  async function saveFollowupEnabled(nextEnabled: boolean) {
    try {
      setSavingSettings(true);
      const tryUrls = [
        "/api/agent/settings/followups",
        "/api/agent/settings/followup",
      ];
      let lastErr: any = null;
      for (const url of tryUrls) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ followups_enabled_default: nextEnabled }),
          });
          const j = await res.json().catch(() => ({}));
          if (!res.ok) {
            lastErr = new Error(
              j?.details || j?.error || "Speichern fehlgeschlagen.",
            );
            continue;
          }
          const enabled = j?.settings?.followups_enabled_default;
          setFuSettings({
            followups_enabled_default:
              typeof enabled === "boolean" ? enabled : nextEnabled,
          });
          toast.success(
            nextEnabled ? "Follow-ups aktiviert." : "Follow-ups deaktiviert.",
          );
          return;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr || new Error("Speichern fehlgeschlagen.");
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.message ?? "Konnte Follow-up Einstellung nicht speichern.",
      );
    } finally {
      setSavingSettings(false);
    }
  }

  const [queue, setQueue] = useState<FollowupQueueRow[]>([]);
  const [sent, setSent] = useState<SentFollowUp[]>([]);
  const [sentLeadMap, setSentLeadMap] = useState<Record<string, LeadMin>>({});

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftMeta, setDraftMeta] = useState<Record<string, DraftMeta>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Per-action busy: enterprise clarity (spinner only on clicked button)
  const [suggestBusy, setSuggestBusy] = useState<Record<string, boolean>>({});
  const [snoozeBusy, setSnoozeBusy] = useState<Record<string, boolean>>({});
  const [sendPending, setSendPending] = useState<Record<string, boolean>>({});
  const [sendError, setSendError] = useState<Record<string, string | null>>({});
  const [plannerHelpOpen, setPlannerHelpOpen] = useState(false);

  const setSuggestBusyFor = (id: string, v: boolean) =>
    setSuggestBusy((p) => ({ ...p, [id]: v }));
  const setSnoozeBusyFor = (id: string, v: boolean) =>
    setSnoozeBusy((p) => ({ ...p, [id]: v }));
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

      // 0) Agent Follow-up Settings (global default)
      if (!fuSettings) {
        const s = await fetchFollowupSettings();
        if (s) setFuSettings(s);
      }

      const { data: qData, error: qErr } = await supabase
        .from("followups_queue_v1")
        .select("*")
        .eq("agent_id", userId)
        .order("computed_is_due", { ascending: false })
        .order("computed_due_at", { ascending: true, nullsFirst: false })
        .order("followup_next_at", { ascending: true, nullsFirst: false })
        .order("last_user_message_at", { ascending: false, nullsFirst: false })
        .order("last_agent_message_at", {
          ascending: false,
          nullsFirst: false,
        });

      if (qErr) {
        console.error("⚠️ followups_queue_v1 error:", qErr);
        toast.error(
          "Fehler beim Laden der Follow-ups. Bitte prüfe die View `followups_queue_v1` (Spalten/Permissions).",
        );
        setQueue([]);
      } else {
        const rows = (qData ?? []) as FollowupQueueRow[];

        // seed drafts + meta once per id
        setDrafts((prev) => {
          const copy = { ...prev };
          for (const r of rows) {
            if (!copy[r.id]) copy[r.id] = buildDefaultText(r);
          }
          return copy;
        });

        setDraftMeta((prev) => {
          const copy = { ...prev };
          for (const r of rows) {
            if (!copy[r.id]) {
              copy[r.id] = {
                engine: "default",
                updated_at: new Date().toISOString(),
              };
            }
          }
          return copy;
        });

        setQueue(rows);
      }

      // 2) Gesendete Follow-ups (Fallback Historie aus messages)
      const { data: sMsgs, error: sErr } = await supabase
        .from("messages")
        .select("id, lead_id, text, timestamp")
        .eq("agent_id", userId)
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
            .eq("agent_id", userId)
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

      // 3) Performance-Kennzahlen (30 Tage)
      try {
        const sinceIso = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString();

        const [{ count: sent30Count }, { data: leadPerfRows }] = await Promise.all([
          (supabase.from("messages") as any)
            .select("id", { count: "exact", head: true })
            .eq("agent_id", userId)
            .eq("was_followup", true)
            .eq("send_status", "sent")
            .gte("timestamp", sinceIso),
          (supabase.from("leads") as any)
            .select("id, followup_last_sent_at, last_user_message_at, followup_stop_reason")
            .eq("agent_id", userId)
            .not("followup_last_sent_at", "is", null)
            .limit(5000),
        ]);

        const leadRows = Array.isArray(leadPerfRows) ? leadPerfRows : [];
        const within30 = leadRows.filter((row: any) => {
          const ts = new Date(String(row?.followup_last_sent_at || "")).getTime();
          return Number.isFinite(ts) && ts >= new Date(sinceIso).getTime();
        });

        const replied30 = within30.filter((row: any) => {
          const sentAt = new Date(String(row?.followup_last_sent_at || "")).getTime();
          const userAt = new Date(String(row?.last_user_message_at || "")).getTime();
          return Number.isFinite(sentAt) && Number.isFinite(userAt) && userAt > sentAt;
        }).length;

        const stoppedUserReplied = leadRows.filter(
          (row: any) => String(row?.followup_stop_reason || "") === "user_replied_last",
        ).length;
        const stoppedMaxStage = leadRows.filter(
          (row: any) =>
            String(row?.followup_stop_reason || "") === "max_stage_reached" ||
            String(row?.followup_stop_reason || "") === "max_stage_0",
        ).length;
        const stoppedPaused = leadRows.filter(
          (row: any) => String(row?.followup_stop_reason || "") === "paused",
        ).length;

        const sent30d = typeof sent30Count === "number" ? sent30Count : 0;
        const replyRatePct = sent30d > 0 ? Math.round((replied30 / sent30d) * 100) : 0;

        setPerformance({
          sent30d,
          replied30d: replied30,
          replyRatePct,
          stoppedUserReplied,
          stoppedMaxStage,
          stoppedPaused,
        });
      } catch (perfErr) {
        console.warn("follow-up performance calculation failed", perfErr);
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

  useEffect(() => {
    void trackFunnelEvent({
      event: "followups_inbox_viewed",
      source: "followups_inbox",
    });
  }, []);

  const applySearchLead = (rows: FollowupQueueRow[]) => {
    const q = search.trim().toLowerCase();

    const filtered = rows.filter((r) => {
      if (onlyDue && !r.computed_is_due) return false;
      if (hidePaused && isFuture(r.followup_paused_until)) return false;

      if (!q) return true;
      return `${r.name ?? ""} ${r.email ?? ""} ${r.last_followup_text ?? ""}`
        .toLowerCase()
        .includes(q);
    });

    // Enterprise sorting: due first, then next_at / due_at, then last activity
    return [...filtered].sort((a, b) => {
      const aDue = a.computed_is_due ? 1 : 0;
      const bDue = b.computed_is_due ? 1 : 0;
      if (aDue !== bDue) return bDue - aDue;

      const aNext = new Date(
        a.followup_next_at ?? a.computed_due_at ?? 0,
      ).getTime();
      const bNext = new Date(
        b.followup_next_at ?? b.computed_due_at ?? 0,
      ).getTime();
      if (Number.isFinite(aNext) && Number.isFinite(bNext) && aNext !== bNext)
        return aNext - bNext;

      const aAct = new Date(
        a.last_user_message_at ?? a.last_agent_message_at ?? 0,
      ).getTime();
      const bAct = new Date(
        b.last_user_message_at ?? b.last_agent_message_at ?? 0,
      ).getTime();
      return bAct - aAct;
    });
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
    [waitingRows, search, onlyDue, hidePaused],
  );
  const filteredPlanned = useMemo(
    () => applySearchLead(plannedRows),
    [plannedRows, search, onlyDue, hidePaused],
  );

  useEffect(() => {
    // Keep selection only for currently visible rows in the active tab
    const visibleIds = new Set(
      (tab === "waiting"
        ? filteredWaiting
        : tab === "planned"
          ? filteredPlanned
          : []
      ).map((r) => r.id),
    );

    setSelected((prev) => {
      const next: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v && visibleIds.has(k)) next[k] = true;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search, onlyDue, hidePaused]);

  const filteredSent = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sent;
    return sent.filter((m) => {
      const lead = sentLeadMap[m.lead_id];
      const hay = `${lead?.name ?? ""} ${lead?.email ?? ""} ${m.text ?? ""}`;
      return hay.toLowerCase().includes(q);
    });
  }, [sent, sentLeadMap, search]);

  const plannerStats = useMemo(() => {
    const now = Date.now();
    const in24 = now + 24 * 60 * 60 * 1000;
    const in72 = now + 72 * 60 * 60 * 1000;

    let due24 = 0;
    let due72 = 0;
    let paused = 0;

    let stage0 = 0;
    let stage1 = 0;
    let stage2Plus = 0;

    for (const row of queue) {
      const nextMs = nextActionMs(row);
      if (nextMs !== null) {
        if (nextMs <= in24) due24 += 1;
        if (nextMs <= in72) due72 += 1;
      }
      if (isFuture(row.followup_paused_until)) paused += 1;

      const stage = Math.max(0, Number(row.followup_stage ?? 0));
      if (stage <= 0) stage0 += 1;
      else if (stage === 1) stage1 += 1;
      else stage2Plus += 1;
    }

    const dueNow = queue.filter((r) => r.computed_is_due).length;
    const total = queue.length || 1;

    return {
      dueNow,
      due24,
      due72,
      paused,
      stage0,
      stage1,
      stage2Plus,
      stage0Pct: Math.round((stage0 / total) * 100),
      stage1Pct: Math.round((stage1 / total) * 100),
      stage2PlusPct: Math.round((stage2Plus / total) * 100),
    };
  }, [queue]);

  const onToggleEditor = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const onDraftChange = (id: string, val: string) => {
    setDrafts((p) => ({ ...p, [id]: val }));
    setDraftMeta((p) => ({
      ...p,
      [id]: {
        engine: "manual",
        tone: p[id]?.tone,
        updated_at: new Date().toISOString(),
      },
    }));
  };

  const onSuggest = async (
    lead: FollowupQueueRow,
    opts?: {
      tone?: "friendly" | "neutral" | "firm";
      regenerate?: boolean;
      note?: string;
    },
  ) => {
    const leadId = lead.id;
    try {
      setSuggestBusyFor(leadId, true);

      const tone = opts?.tone ?? "friendly";
      const note = (opts?.note ?? "").trim();

      const suggestion = await suggestFollowUpText(leadId, {
        tone,
        instruction: note || undefined,
        regenerate: !!opts?.regenerate,
      });

      setExpanded((p) => ({ ...p, [leadId]: true }));
      setDrafts((p) => ({ ...p, [leadId]: suggestion }));
      setDraftMeta((p) => ({
        ...p,
        [leadId]: {
          engine: "ai",
          tone,
          updated_at: new Date().toISOString(),
        },
      }));

      toast.success(
        opts?.regenerate ? "Neu generiert." : "Vorschlag eingefügt.",
      );
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Konnte Vorschlag nicht erzeugen.");
    } finally {
      setSuggestBusyFor(leadId, false);
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
    let createdMessageId: string | null = null;

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
      const { data: leadRow, error: leadErr } = await supabase
        .from("leads")
        .select(
          "id, subject, type, email_provider, gmail_thread_id, outlook_conversation_id",
        )
        .eq("id", leadId)
        .single();

      if (leadErr || !leadRow) {
        throw new Error("Konnte Interessent nicht laden.");
      }

      const baseSubject =
        String((leadRow as any).subject ?? "").trim() ||
        String((leadRow as any).type ?? "").trim() ||
        "Anfrage";
      const subject = baseSubject.toLowerCase().startsWith("re:")
        ? baseSubject
        : `Re: ${baseSubject}`;

      const provider =
        String(
          (leadRow as any).email_provider ||
            ((leadRow as any).outlook_conversation_id ? "outlook" : "gmail"),
        )
          .toLowerCase()
          .trim() === "outlook"
          ? "outlook"
          : "gmail";

      async function ensureDraftMessageId(
        currentProvider: "gmail" | "outlook",
      ): Promise<string> {
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
            email_provider: currentProvider,
            send_status: "pending",
            approval_required: false,
            status: "ready_to_send",
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

      const endpoint =
        provider === "outlook" ? "/api/outlook/send" : "/api/gmail/send";

      const draftMessageId = await ensureDraftMessageId(provider);
      createdMessageId = draftMessageId;
      localSentId = draftMessageId;
      setSent((prev) =>
        prev.map((m) =>
          m.id === initialLocalSentId ? { ...m, id: draftMessageId } : m,
        ),
      );

      const payload: Record<string, any> = {
        id: draftMessageId,
        lead_id: leadId,
        to: lead.email,
        subject,
        text,
        was_followup: true,
      };

      if (provider === "outlook") {
        payload.outlook_conversation_id =
          (leadRow as any).outlook_conversation_id ?? null;
      } else {
        payload.gmail_thread_id = (leadRow as any).gmail_thread_id ?? null;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Senden fehlgeschlagen.");

      toast.success("Follow-up gesendet.");
      void trackFunnelEvent({
        event: "followup_sent",
        source: "followups_inbox",
        meta: {
          lead_id: leadId,
          provider,
          stage: Number(lead.followup_stage ?? 0),
        },
      });

      const returnedId =
        data?.gmail_message_id ??
        data?.outlook_message_id ??
        data?.message?.outlook_message_id ??
        data?.message?.gmail_message_id ??
        null;

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
      setDraftMeta((prev) => {
        const { [leadId]: _, ...rest } = prev;
        return rest;
      });

      setSendErrorFor(leadId, null);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message ?? "Senden fehlgeschlagen.";
      toast.error(msg);
      setSendErrorFor(leadId, msg);

      if (createdMessageId) {
        try {
          await (supabase.from("messages") as any)
            .update({
              send_status: "failed",
              send_error: "client_send_failed",
              status: "needs_human",
              approval_required: true,
            })
            .eq("id", createdMessageId)
            .eq("agent_id", userId)
            .eq("send_status", "pending");
        } catch (cleanupErr) {
          console.error("follow-up draft cleanup failed", cleanupErr);
        }
      }

      // Reinsert the lead into queue
      setQueue((prev) => {
        const exists = prev.some((x) => x.id === removedLeadSnapshot.id);
        if (exists) return prev;
        return [removedLeadSnapshot, ...prev];
      });

      // Remove optimistic sent row
      setSent((prev) =>
        prev.filter((m) => m.id !== initialLocalSentId && m.id !== localSentId),
      );
    } finally {
      setSendPendingFor(leadId, false);
    }
  };

  const onSnooze24h = async (lead: FollowupQueueRow) => {
    const leadId = lead.id;
    try {
      setSnoozeBusyFor(leadId, true);

      await snoozeFollowUp(leadId, 24);
      void trackFunnelEvent({
        event: "followup_snoozed",
        source: "followups_inbox",
        meta: { lead_id: leadId, hours: 24 },
      });

      const nextLocal = new Date(Date.now() + 24 * 60 * 60 * 1000);
      toast.success(
        `Follow-up verschoben auf ${nextLocal.toLocaleString("de-DE")}.`,
      );

      setQueue((prev) => prev.filter((x) => x.id !== leadId));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Snooze fehlgeschlagen.");
    } finally {
      setSnoozeBusyFor(leadId, false);
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

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Global toggle (default follow-ups) */}
              <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">
                    Follow-ups
                  </span>
                  {fuSettings?.followups_enabled_default === false ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                      Aus
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800">
                      An
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={savingSettings}
                  onClick={() =>
                    saveFollowupEnabled(
                      !(fuSettings?.followups_enabled_default ?? true),
                    )
                  }
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-60 ${
                    fuSettings?.followups_enabled_default === false
                      ? "bg-gray-900 border-gray-900 text-amber-200 hover:bg-gray-800"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  title={
                    fuSettings?.followups_enabled_default === false
                      ? "Follow-ups aktivieren"
                      : "Follow-ups deaktivieren"
                  }
                >
                  {savingSettings ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : fuSettings?.followups_enabled_default === false ? (
                    <PlayCircle className="h-4 w-4" />
                  ) : (
                    <PauseCircle className="h-4 w-4" />
                  )}
                  {fuSettings?.followups_enabled_default === false
                    ? "Aktivieren"
                    : "Deaktivieren"}
                </button>
              </div>

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

              {/* Enterprise filter pills */}
              <button
                type="button"
                onClick={() => setOnlyDue((v) => !v)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  onlyDue
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                title="Nur fällige Follow-ups anzeigen"
              >
                <AlertTriangle className="h-4 w-4" />
                Nur fällig
              </button>

              <button
                type="button"
                onClick={() => setHidePaused((v) => !v)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  hidePaused
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                title="Pausierte Follow-ups ausblenden"
              >
                <PauseCircle className="h-4 w-4" />
                Pausierte aus
              </button>

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
          {fuSettings?.followups_enabled_default === false && (
            <div
              className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
              data-tour="followups-disabled-banner"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Info className="h-5 w-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-amber-900">
                    Follow-ups sind deaktiviert
                  </div>
                  <div className="text-sm text-amber-800 mt-1">
                    Es werden keine neuen Follow-ups geplant. Bereits geplante
                    Einträge bleiben sichtbar – du kannst sie manuell senden
                    oder snoozen.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Overview */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Aktiv</div>
              <div className="text-lg font-semibold text-gray-900">
                {queue.length}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Fällig</div>
              <div className="text-lg font-semibold text-gray-900">
                {queue.filter((r) => r.computed_is_due).length}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Gesendet (30 Tage)</div>
              <div className="text-lg font-semibold text-gray-900">
                {performance.sent30d}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Antwortquote (30 Tage)</div>
              <div className="text-lg font-semibold text-gray-900">
                {performance.replyRatePct}%
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Stop: Interessent hat geantwortet</div>
              <div className="text-lg font-semibold text-gray-900">
                {performance.stoppedUserReplied}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-xs text-gray-500">Stop: Max-Stufe/Pause</div>
              <div className="text-lg font-semibold text-gray-900">
                {performance.stoppedMaxStage + performance.stoppedPaused}
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-700">
            Follow-up-Performance wird konservativ berechnet: Antwortquote basiert auf Leads mit Nutzerantwort nach dem
            letzten gesendeten Follow-up in den letzten 30 Tagen.
          </div>

          <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Planner Board
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Schneller Überblick für die nächsten Stunden und Tage.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlannerHelpOpen((v) => !v)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                {plannerHelpOpen ? "Hilfe ausblenden" : "Wie lesen?"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <div className="text-[11px] text-gray-500">Überfällig</div>
                <div className="text-lg font-semibold text-gray-900">
                  {plannerStats.dueNow}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <div className="text-[11px] text-gray-500">Fällig ≤ 24h</div>
                <div className="text-lg font-semibold text-gray-900">
                  {plannerStats.due24}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <div className="text-[11px] text-gray-500">Fällig ≤ 72h</div>
                <div className="text-lg font-semibold text-gray-900">
                  {plannerStats.due72}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <div className="text-[11px] text-gray-500">Pausiert</div>
                <div className="text-lg font-semibold text-gray-900">
                  {plannerStats.paused}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[11px] text-gray-500 mb-2">
                Stage-Verteilung
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden bg-gray-100">
                <div className="h-full flex">
                  <div
                    className="h-full bg-gray-900"
                    style={{ width: `${plannerStats.stage0Pct}%` }}
                  />
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${plannerStats.stage1Pct}%` }}
                  />
                  <div
                    className="h-full bg-amber-200"
                    style={{ width: `${plannerStats.stage2PlusPct}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-600">
                <span className="px-2 py-0.5 rounded-full border border-gray-200 bg-white">
                  Stage 0: {plannerStats.stage0}
                </span>
                <span className="px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-900">
                  Stage 1: {plannerStats.stage1}
                </span>
                <span className="px-2 py-0.5 rounded-full border border-amber-200 bg-white">
                  Stage 2+: {plannerStats.stage2Plus}
                </span>
              </div>
            </div>

            {plannerHelpOpen && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-[#fbfbfc] p-3 text-xs text-gray-700">
                <div className="font-medium text-gray-900 mb-1">
                  Operative Priorisierung (empfohlen)
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Zuerst „Überfällig“ prüfen und entscheiden.</li>
                  <li>Dann Fälle ≤ 24h vorbereiten, damit kein Rückstau entsteht.</li>
                  <li>
                    Stage 2+ bewusst knapp halten, damit Follow-ups nicht
                    unnatürlich häufig wirken.
                  </li>
                </ul>
              </div>
            )}
          </div>

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
              {selectedIds.length > 0 && tab !== "sent" && (
                <div
                  className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  data-tour="followups-bulk-actions"
                >
                  <div className="text-sm text-gray-700 inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">{selectedIds.length}</span>
                    <span>ausgewählt</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                      disabled={bulkBusy}
                      onClick={() => {
                        const visible =
                          tab === "waiting" ? filteredWaiting : filteredPlanned;
                        const allSelected =
                          visible.length > 0 &&
                          visible.every((r) => selected[r.id]);
                        if (allSelected) {
                          setSelected({});
                        } else {
                          setSelected((p) => {
                            const next = { ...p };
                            for (const r of visible) next[r.id] = true;
                            return next;
                          });
                        }
                      }}
                      title="Alles auswählen/abwählen"
                    >
                      {(() => {
                        const visible =
                          tab === "waiting" ? filteredWaiting : filteredPlanned;
                        const allSelected =
                          visible.length > 0 &&
                          visible.every((r) => selected[r.id]);
                        return allSelected
                          ? "Alles abwählen"
                          : "Alles auswählen";
                      })()}
                    </button>

                    <button
                      type="button"
                      className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                      disabled={bulkBusy}
                      onClick={async () => {
                        try {
                          setBulkBusy(true);
                          const visible =
                            tab === "waiting"
                              ? filteredWaiting
                              : filteredPlanned;
                          const ids = selectedIds;
                          void trackFunnelEvent({
                            event: "followup_bulk_snooze_started",
                            source: "followups_inbox",
                            meta: { count: ids.length, hours: 24 },
                          });
                          const byId = new Map(
                            visible.map((r) => [r.id, r] as const),
                          );
                          for (const id of ids) {
                            const row = byId.get(id);
                            if (!row) continue;
                            await snoozeFollowUp(row.id, 24);
                          }
                          toast.success(`Snoozed (${ids.length}) um 24h.`);
                          clearSelection();
                          load({ silent: true });
                        } catch (e: any) {
                          console.error(e);
                          toast.error(
                            e?.message ?? "Bulk Snooze fehlgeschlagen.",
                          );
                        } finally {
                          setBulkBusy(false);
                        }
                      }}
                      title="Alle ausgewählten Follow-ups um 24h verschieben"
                    >
                      <AlarmClock className="h-4 w-4 inline-block mr-2" />
                      Snooze 24h
                    </button>

                    <button
                      type="button"
                      className="px-3 py-2 text-sm rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-60"
                      disabled={bulkBusy}
                      onClick={() => {
                        clearSelection();
                        toast.success("Auswahl gelöscht.");
                      }}
                      title="Auswahl löschen"
                    >
                      <X className="h-4 w-4 inline-block mr-2" />
                      Auswahl löschen
                    </button>
                  </div>
                </div>
              )}

              {tab === "waiting" && (
                <SectionQueue
                  rows={filteredWaiting}
                  emptyText="Aktuell wartet nichts."
                  drafts={drafts}
                  draftMeta={draftMeta}
                  expanded={expanded}
                  suggestBusy={suggestBusy}
                  snoozeBusy={snoozeBusy}
                  sendPending={sendPending}
                  sendError={sendError}
                  onToggleEditor={onToggleEditor}
                  onDraftChange={onDraftChange}
                  onSend={onSend}
                  onSnooze24h={onSnooze24h}
                  onSuggest={onSuggest}
                  selectedMap={selected}
                  onToggleSelect={toggleSelected}
                />
              )}

              {tab === "planned" && (
                <SectionQueue
                  rows={filteredPlanned}
                  emptyText="Aktuell ist nichts geplant."
                  drafts={drafts}
                  draftMeta={draftMeta}
                  expanded={expanded}
                  suggestBusy={suggestBusy}
                  snoozeBusy={snoozeBusy}
                  sendPending={sendPending}
                  sendError={sendError}
                  onToggleEditor={onToggleEditor}
                  onDraftChange={onDraftChange}
                  onSend={onSend}
                  onSnooze24h={onSnooze24h}
                  onSuggest={onSuggest}
                  selectedMap={selected}
                  onToggleSelect={toggleSelected}
                  isPlanned
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

function SectionQueue({
  rows,
  emptyText,
  drafts,
  draftMeta,
  expanded,
  suggestBusy,
  snoozeBusy,
  sendPending,
  sendError,
  onToggleEditor,
  onDraftChange,
  onSend,
  onSnooze24h,
  onSuggest,
  selectedMap,
  onToggleSelect,
  isPlanned,
}: {
  rows: FollowupQueueRow[];
  emptyText: string;
  drafts: Record<string, string>;
  draftMeta: Record<string, DraftMeta>;
  expanded: Record<string, boolean>;
  suggestBusy: Record<string, boolean>;
  snoozeBusy: Record<string, boolean>;
  sendPending: Record<string, boolean>;
  sendError: Record<string, string | null>;
  onToggleEditor: (id: string) => void;
  onDraftChange: (id: string, val: string) => void;
  onSend: (lead: FollowupQueueRow) => void;
  onSnooze24h: (lead: FollowupQueueRow) => void;
  onSuggest: (
    lead: FollowupQueueRow,
    opts?: {
      tone?: "friendly" | "neutral" | "firm";
      regenerate?: boolean;
      note?: string;
    },
  ) => void;
  selectedMap: Record<string, boolean>;
  onToggleSelect: (id: string) => void;
  isPlanned?: boolean;
}) {
  // For tone selection per lead
  const [suggestToneByLead, setSuggestToneByLead] = useState<
    Record<string, "friendly" | "neutral" | "firm">
  >({});
  const [suggestNoteByLead, setSuggestNoteByLead] = useState<
    Record<string, string>
  >({});

  if (rows.length === 0) {
    return (
      <EmptyBox icon={<CheckCircle2 className="h-4 w-4" />} text={emptyText} />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((lead) => {
        const nextAt = lead.followup_next_at
          ? fmtDT(lead.followup_next_at)
          : null;

        const badge = isPlanned
          ? (lead.bucket_label ?? (nextAt ? `Geplant: ${nextAt}` : "Geplant"))
          : (lead.bucket_label ?? "Wartet");

        const defaultTone =
          Number(lead.followup_stage ?? 0) >= 2
            ? "firm"
            : Number(lead.followup_stage ?? 0) === 1
              ? "neutral"
              : "friendly";

        const tone = suggestToneByLead[lead.id] ?? defaultTone;

        return (
          <LeadCardWithActions
            key={lead.id}
            lead={lead}
            badge={badge}
            draft={drafts[lead.id] ?? ""}
            meta={draftMeta[lead.id]}
            expanded={!!expanded[lead.id]}
            suggestBusy={!!suggestBusy[lead.id]}
            snoozeBusy={!!snoozeBusy[lead.id]}
            sendPending={!!sendPending[lead.id]}
            sendError={sendError[lead.id] ?? null}
            onToggleEditor={() => onToggleEditor(lead.id)}
            onDraftChange={(v) => onDraftChange(lead.id, v)}
            onSend={() => onSend(lead)}
            onSnooze24h={() => onSnooze24h(lead)}
            onSuggest={() =>
              onSuggest(lead, {
                tone,
                note: suggestNoteByLead[lead.id] ?? "",
              })
            }
            onRegenerate={() =>
              onSuggest(lead, {
                tone,
                note: suggestNoteByLead[lead.id] ?? "",
                regenerate: true,
              })
            }
            tone={tone}
            onToneChange={(t) =>
              setSuggestToneByLead((p) => ({ ...p, [lead.id]: t }))
            }
            note={suggestNoteByLead[lead.id] ?? ""}
            onNoteChange={(v) =>
              setSuggestNoteByLead((p) => ({ ...p, [lead.id]: v }))
            }
            selected={!!selectedMap[lead.id]}
            onToggleSelect={() => onToggleSelect(lead.id)}
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
              <div className="mt-1 inline-flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                  Gesendet
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700 line-clamp-2">
                {m.text ?? "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Gesendet: {fmtDT(m.timestamp)}
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
  meta,
  expanded,
  suggestBusy,
  snoozeBusy,
  sendPending,
  sendError,
  onToggleEditor,
  onDraftChange,
  onSend,
  onSnooze24h,
  onSuggest,
  onRegenerate,
  tone,
  onToneChange,
  note,
  onNoteChange,
  selected,
  onToggleSelect,
}: {
  lead: FollowupQueueRow;
  badge: string;
  draft: string;
  meta?: DraftMeta;
  expanded: boolean;
  suggestBusy: boolean;
  snoozeBusy: boolean;
  sendPending: boolean;
  sendError: string | null;
  onToggleEditor: () => void;
  onDraftChange: (val: string) => void;
  onSend: () => void;
  onSnooze24h: () => void;
  onSuggest: () => void;
  onRegenerate: () => void;
  tone: "friendly" | "neutral" | "firm";
  onToneChange: (tone: "friendly" | "neutral" | "firm") => void;
  note: string;
  onNoteChange: (val: string) => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const lastSent = lead.last_followup_sent_at
    ? fmtDT(lead.last_followup_sent_at)
    : null;

  const isPaused =
    !!lead.followup_paused_until &&
    new Date(lead.followup_paused_until).getTime() > Date.now();
  const pausedUntil = isPaused
    ? fmtDT(lead.followup_paused_until as string)
    : null;

  const isDueNow = !!lead.computed_is_due;
  const stageLabel = `Stage ${Math.max(0, Number(lead.followup_stage ?? 0))}`;

  const engine = meta?.engine ?? "default";
  const engineBadge =
    engine === "ai" ? "KI" : engine === "manual" ? "Manuell" : "Standard";
  const engineCls =
    engine === "ai"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : engine === "manual"
        ? "border-gray-200 bg-gray-50 text-gray-700"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div
      className={
        "flex flex-col gap-4 border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 bg-white" +
        (selected ? " ring-2 ring-amber-300/40" : "")
      }
      data-tour="followups-card"
    >
      {/* Row 1: select + identity + status */}
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onToggleSelect}
          className="mt-0.5 shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
          title={selected ? "Auswahl entfernen" : "Auswählen"}
        >
          {selected ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4 rounded-full border border-gray-300" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 min-w-0">
            <h2 className="font-medium text-gray-900 leading-tight break-words">
              {lead.name ?? "Unbekannter Kontakt"}
            </h2>
            <span className="text-xs text-gray-500 break-all">
              {lead.email ?? "–"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium rounded-full px-2 py-1 border border-amber-200 bg-amber-50 text-amber-800">
              {badge}
            </span>

            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border ${engineCls}`}
              title="Quelle der Nachricht"
            >
              {engineBadge}
            </span>

            <span
              className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700"
              title="Follow-up Stage"
            >
              {stageLabel}
            </span>

            {isDueNow && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-800"
                title="Fällig jetzt"
              >
                Fällig
              </span>
            )}

            {isPaused && pausedUntil && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full border border-amber-200 bg-white text-amber-900"
                title={`Pausiert bis ${pausedUntil}`}
              >
                Pausiert
              </span>
            )}

            {sendPending && (
              <span className="text-[11px] font-medium rounded-full px-2 py-0.5 border border-amber-200 bg-white text-gray-700">
                Wird gesendet…
              </span>
            )}
          </div>

          {sendError && <p className="mt-2 text-xs text-red-600">{sendError}</p>}
        </div>

        <Link
          href={`/app/nachrichten/${lead.id}`}
          className="shrink-0 text-xs inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2"
          data-tour="followups-open-conversation"
        >
          Konversation öffnen
        </Link>
      </div>

      {/* Row 2: planned message + actions (no overlap) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-4">
        {/* Planned message block */}
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Geplante Nachricht
              </div>
              <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words line-clamp-3">
                {draft?.trim() ? draft : "—"}
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleEditor}
              disabled={sendPending}
              className="shrink-0 text-[11px] inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-2.5 py-1 disabled:opacity-60"
              title={expanded ? "Editor schließen" : "Nachricht ansehen / bearbeiten"}
            >
              {expanded ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  Schließen
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" />
                  Ansehen
                </>
              )}
            </button>
          </div>

          {expanded && (
            <div
              className="mt-3 rounded-xl border border-gray-200 bg-[#fbfbfc] p-3"
              data-tour="followups-editor"
            >
              <textarea
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                rows={6}
                className="w-full text-sm border border-gray-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                placeholder="Individuellen Follow-up-Text eingeben…"
              />
              <div className="mt-2 text-xs text-gray-500">
                Der Text wird als echte E-Mail über Ihr verbundenes Postfach versendet.
                <span className="block mt-1">
                  „Vorschlag“ / „Neu“ nutzt den gewählten Ton (Freundlich/Neutral/Klar) und optional deinen Wunsch.
                </span>
              </div>
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span className="text-gray-500">Letztes Follow-up: </span>
              <span className="text-gray-700">{lead.last_followup_text ?? "—"}</span>
            </div>
            <div className="sm:text-right">
              {lead.followup_next_at ? (
                <>
                  Nächstes Follow-up: {fmtDT(lead.followup_next_at)} · {fmtRelativeFromNow(lead.followup_next_at)}
                </>
              ) : lead.computed_due_at ? (
                <>
                  Fällig am: {fmtDT(lead.computed_due_at)} · {fmtRelativeFromNow(lead.computed_due_at)}
                </>
              ) : lastSent ? (
                <>Letztes Follow-up gesendet: {lastSent}</>
              ) : (
                <>—</>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative rounded-2xl border border-gray-200 bg-white p-4 overflow-hidden">
          {/* Copilot accent bar */}
          <div className="absolute left-0 top-0 h-full w-1 bg-amber-400/70" />

          <div className="ml-3">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
              <Wand2 className="h-4 w-4 text-amber-600" />
              Copilot Vorschlag
            </div>

            <div
              className="mt-2 inline-flex w-full items-center rounded-lg border border-gray-200 bg-white overflow-hidden"
              title="Ton steuert den KI-Vorschlag (Freundlich = warm, Neutral = sachlich, Klar = direkt)"
            >
              <button
                type="button"
                className={`flex-1 px-2.5 py-2 text-[12px] ${
                  tone === "friendly"
                    ? "bg-amber-50 text-amber-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => onToneChange("friendly")}
              >
                Freundlich
              </button>
              <button
                type="button"
                className={`flex-1 px-2.5 py-2 text-[12px] ${
                  tone === "neutral"
                    ? "bg-amber-50 text-amber-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => onToneChange("neutral")}
              >
                Neutral
              </button>
              <button
                type="button"
                className={`flex-1 px-2.5 py-2 text-[12px] ${
                  tone === "firm"
                    ? "bg-amber-50 text-amber-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => onToneChange("firm")}
              >
                Klar
              </button>
            </div>

            <input
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Wunsch an die KI… (optional)"
              className="mt-2 w-full px-3 py-2 text-xs rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={onSuggest}
                disabled={suggestBusy || sendPending}
                className="text-xs inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 disabled:opacity-60"
              >
                {suggestBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Vorschlag
              </button>

              <button
                onClick={onRegenerate}
                disabled={suggestBusy || sendPending}
                className="text-xs inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 disabled:opacity-60"
              >
                {suggestBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Neu
              </button>
            </div>

            <div className="mt-4 h-px bg-gray-200" />

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                disabled={snoozeBusy || sendPending}
                onClick={onSnooze24h}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 text-sm disabled:opacity-60"
              >
                {snoozeBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlarmClock className="h-4 w-4" />
                )}
                Snooze 24h
              </button>

              <button
                disabled={sendPending}
                onClick={onSend}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-60"
              >
                {sendPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Senden
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyBox({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-[#fbfbfc] p-6 text-center">
      <div className="inline-flex items-center gap-2 text-gray-900 font-medium">
        {icon}
        <span>{text || "Keine Einträge."}</span>
      </div>
    </div>
  );
}
