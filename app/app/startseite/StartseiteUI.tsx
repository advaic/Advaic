"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import InboxItem from "../nachrichten/components/InboxItem";
import {
  Clock,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Power,
  AlarmClock,
} from "lucide-react";

import { toast } from "sonner";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

type MsgRow = {
  lead_id: string;
  sender: string | null;
  timestamp: string;
  text: string | null;
};

function isAgentSender(sender: unknown): boolean {
  const s = String(sender ?? "").toLowerCase();
  return s === "assistant" || s === "agent";
}

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

function normalizeStatus(v: unknown): string {
  const s = safeStr(v).toLowerCase();
  if (!s) return "";
  if (s === "open" || s === "offen" || s === "neu") return "open";
  if (s === "closed" || s === "erledigt" || s === "abgeschlossen")
    return "closed";
  return s;
}

function isHighPriority(priority: unknown): boolean {
  const n = Number(priority);
  if (Number.isFinite(n)) return n >= 2;
  const s = safeStr(priority).toLowerCase();
  return s === "hoch" || s === "high";
}

export default function StartseiteUI({
  userId,
  leads: serverLeads,
}: {
  userId: string;
  leads?: any[];
}) {
  const supabase = useSupabaseClient<Database>();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  const [allLeads, setAllLeads] = useState<LeadRow[]>([]);
  const [lastMessages, setLastMessages] = useState<
    Record<string, MsgRow | null>
  >({});
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>(
    {},
  );

  // NEW: approvals derived from messages, not leads
  const [approvalLeadIds, setApprovalLeadIds] = useState<Set<string>>(
    new Set(),
  );

  // NEW: KPI replacement for avg response time
  const [timeSaved30d, setTimeSaved30d] = useState<string>("–");
  const [autoReplies30d, setAutoReplies30d] = useState<number>(0);

  const [autosendEnabled, setAutosendEnabled] = useState<boolean | null>(null);
  const [autosendBusy, setAutosendBusy] = useState(false);
  const [followupsEnabled, setFollowupsEnabled] = useState<boolean | null>(
    null,
  );
  const [followupsBusy, setFollowupsBusy] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Willkommen zurück";
    return "Schönen Abend";
  };

  const load = async (opts?: { silent?: boolean }) => {
    if (!userId) return;

    try {
      if (!opts?.silent) setLoading(true);

      // user name (best-effort)
      const { data: u } = await supabase.auth.getUser();
      const n =
        (u as any)?.user?.user_metadata?.name ||
        (u as any)?.user?.email?.split("@")[0] ||
        "";
      setUserName(n ? `${n[0].toUpperCase()}${n.slice(1)}` : "");

      // Load leads
      const { data: leadsData, error } = await supabase
        .from("leads")
        .select("*")
        .eq("agent_id", userId)
        .order("updated_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("❌ leads fetch", error);
        setAllLeads([]);
        setApprovalLeadIds(new Set());
        return;
      }

      const rows = (leadsData ?? []) as LeadRow[];
      setAllLeads(rows);

      // autosend & followups toggle — always read via API routes
      try {
        const [aRes, fRes] = await Promise.all([
          fetch("/api/agent/settings/autosend", { method: "GET" }),
          fetch("/api/agent/settings/followups", { method: "GET" }),
        ]);

        if (aRes.ok) {
          const aJson = await aRes.json().catch(() => null);
          if (
            aJson?.ok &&
            typeof aJson?.settings?.autosend_enabled === "boolean"
          ) {
            setAutosendEnabled(aJson.settings.autosend_enabled);
          } else if (aJson?.ok && aJson?.settings?.reply_mode) {
            setAutosendEnabled(String(aJson.settings.reply_mode) === "auto");
          } else {
            setAutosendEnabled(false);
          }
        } else {
          setAutosendEnabled(false);
        }

        if (fRes.ok) {
          const fJson = await fRes.json().catch(() => null);
          if (
            fJson?.ok &&
            typeof fJson?.settings?.followups_enabled_default === "boolean"
          ) {
            setFollowupsEnabled(fJson.settings.followups_enabled_default);
          } else {
            setFollowupsEnabled(true);
          }
        } else {
          setFollowupsEnabled(true);
        }
      } catch {
        setAutosendEnabled(false);
        setFollowupsEnabled(true);
      }

      // Derive "Freigaben ausstehend" from messages (not leads)
      try {
        const leadIds = rows.map((r) => r.id).filter(Boolean);
        const approvalSet = new Set<string>();

        if (leadIds.length > 0) {
          const { data: approvalMsgs, error: aErr } = await supabase
            .from("messages")
            .select("lead_id, status, send_status")
            .in("lead_id", leadIds.slice(0, 500))
            .eq("approval_required", true)
            .order("timestamp", { ascending: false })
            .limit(2000);

          if (!aErr && approvalMsgs?.length) {
            for (const m of approvalMsgs as any[]) {
              const st = String(m?.status || "").toLowerCase();
              const ss = String(m?.send_status || "").toLowerCase();

              const statusOk =
                st === "needs_approval" ||
                st === "needs_human" ||
                st === "approved" ||
                st === "ready_to_send";

              const sendOk = ss !== "sent";
              const ignored = st === "ignored";

              if (statusOk && sendOk && !ignored && m?.lead_id) {
                approvalSet.add(String(m.lead_id));
              }
            }
          }
        }

        setApprovalLeadIds(approvalSet);
      } catch (e) {
        console.warn("approval derivation failed", e);
        setApprovalLeadIds(new Set());
      }

      // KPI: Auto-Antworten + Zeit gespart (30 Tage) — konservativ & nachvollziehbar
      // Definition "Auto-Antwort": assistant, wirklich gesendet, ohne Freigabe.
      try {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { count: autoCount, error: cErr } = await (supabase.from("messages") as any)
          .select("id", { count: "exact", head: true })
          .eq("agent_id", userId)
          .eq("send_status", "sent")
          .gte("sent_at", since)
          .eq("sender", "assistant")
          .eq("approval_required", false);

        const safeCount = !cErr && typeof autoCount === "number" ? autoCount : 0;
        setAutoReplies30d(safeCount);

        // Conservative time-saved heuristic: 4 min per truly auto-sent reply.
        // (We can refine later with intent-based minutes, but this is honest + stable.)
        const minutes = safeCount * 4;

        if (minutes <= 0) {
          setTimeSaved30d("–");
        } else if (minutes < 60) {
          setTimeSaved30d(`${minutes} Min`);
        } else {
          const hours = Math.round((minutes / 60) * 10) / 10;
          setTimeSaved30d(`${hours} h`);
        }
      } catch (e) {
        console.warn("auto KPI compute failed", e);
        setAutoReplies30d(0);
        setTimeSaved30d("–");
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const now = Date.now();
  const cutoff48h = now - 48 * 60 * 60 * 1000;

  const buckets = useMemo(() => {
    const newLeads = allLeads.filter((l) => {
      const created = new Date((l as any).created_at ?? 0).getTime();
      return Number.isFinite(created) && created >= cutoff48h;
    });

    const openConversations = allLeads.filter((l) => {
      const st = normalizeStatus((l as any).status);
      return !st || st === "open";
    });

    const highPriority = allLeads.filter((l) =>
      isHighPriority((l as any).priority),
    );

    const approvals = allLeads.filter((l) => approvalLeadIds.has(l.id));

    return {
      newLeads,
      openConversations,
      highPriority,
      approvals,
    };
  }, [allLeads, cutoff48h, approvalLeadIds]);

  // Fetch last messages & counts for the top leads rendered
  useEffect(() => {
    const fetchSnippets = async () => {
      const topIds = Array.from(
        new Set(
          [
            ...buckets.approvals.slice(0, 3).map((l) => l.id),
            ...buckets.highPriority.slice(0, 3).map((l) => l.id),
            ...buckets.openConversations.slice(0, 3).map((l) => l.id),
          ].filter(Boolean),
        ),
      );

      if (topIds.length === 0) return;

      const { data: msgs, error } = await supabase
        .from("messages")
        .select("lead_id, sender, timestamp, text")
        .in("lead_id", topIds)
        .order("timestamp", { ascending: false })
        .limit(1000);

      if (error) {
        console.warn("snippet fetch failed", error);
        return;
      }

      const last: Record<string, MsgRow | null> = {};
      const counts: Record<string, number> = {};

      for (const id of topIds) {
        last[id] = null;
        counts[id] = 0;
      }

      for (const m of (msgs ?? []) as any[]) {
        const id = String(m.lead_id);
        if (!(id in counts)) continue;
        counts[id] = (counts[id] ?? 0) + 1;
        if (!last[id]) {
          last[id] = {
            lead_id: id,
            sender: m.sender ?? null,
            timestamp: m.timestamp,
            text: m.text ?? null,
          };
        }
      }

      setLastMessages((prev) => ({ ...prev, ...last }));
      setMessageCounts((prev) => ({ ...prev, ...counts }));
    };

    fetchSnippets();
  }, [
    buckets.approvals,
    buckets.highPriority,
    buckets.openConversations,
    supabase,
  ]);

  const shownKpis = useMemo(() => {
    return {
      newLeads: buckets.newLeads.length,
      open: buckets.openConversations.length,
      high: buckets.highPriority.length,
      approvals: buckets.approvals.length,
    };
  }, [buckets]);

  const toggleAutosend = async () => {
    if (autosendBusy) return;
    if (autosendEnabled === null) return;

    const next = !autosendEnabled;
    setAutosendBusy(true);
    setAutosendEnabled(next);

    try {
      const res = await fetch("/api/agent/settings/autosend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autosend_enabled: next }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok !== true) {
        throw new Error(
          data?.error || "Serverfehler beim Ändern von Auto-Senden.",
        );
      }
      if (typeof data?.settings?.autosend_enabled === "boolean") {
        setAutosendEnabled(data.settings.autosend_enabled);
      }
      toast.success(
        data?.settings?.autosend_enabled
          ? "Auto-Senden aktiviert"
          : "Auto-Senden pausiert",
      );
    } catch (e: any) {
      console.error("autosend toggle failed", e);
      setAutosendEnabled(!next);
      toast.error(e?.message ?? "Konnte Auto-Senden nicht ändern.");
    } finally {
      setAutosendBusy(false);
    }
  };

  const toggleFollowups = async () => {
    if (followupsBusy) return;
    if (followupsEnabled === null) return;

    const next = !followupsEnabled;
    setFollowupsBusy(true);
    setFollowupsEnabled(next);

    try {
      const res = await fetch("/api/agent/settings/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followups_enabled_default: next }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok !== true) {
        throw new Error(
          data?.error || "Serverfehler beim Ändern von Follow-ups.",
        );
      }

      if (typeof data?.settings?.followups_enabled_default === "boolean") {
        setFollowupsEnabled(data.settings.followups_enabled_default);
      }

      toast.success(
        data?.settings?.followups_enabled_default
          ? "Follow-ups aktiviert"
          : "Follow-ups pausiert",
      );
    } catch (e: any) {
      console.error("followups toggle failed", e);
      setFollowupsEnabled(!next);
      toast.error(e?.message ?? "Konnte Follow-ups nicht ändern.");
    } finally {
      setFollowupsBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div
          data-tour="home-hero"
          className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200"
        >
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-semibold truncate">
                  {getGreeting()}
                  {userName ? `, ${userName}!` : "!"}
                </h1>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                  Advaic
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Hier siehst du deine wichtigsten Kennzahlen und die wichtigsten
                Konversationen.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFollowups}
                disabled={followupsEnabled === null || followupsBusy}
                className={`px-3 py-2 text-sm rounded-lg border inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
                  followupsEnabled
                    ? "bg-gray-900 border-gray-900 text-amber-200 hover:bg-gray-800"
                    : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                }`}
                title={
                  followupsEnabled
                    ? "Follow-ups sind aktiv (klicken zum Pausieren)"
                    : "Follow-ups sind pausiert (klicken zum Aktivieren)"
                }
              >
                <AlarmClock className="h-4 w-4" />
                {followupsEnabled ? "Follow-ups: AN" : "Follow-ups: AUS"}
              </button>

              <button
                type="button"
                onClick={toggleAutosend}
                disabled={autosendEnabled === null || autosendBusy}
                className={`px-3 py-2 text-sm rounded-lg border inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
                  autosendEnabled
                    ? "bg-gray-900 border-gray-900 text-amber-200 hover:bg-gray-800"
                    : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                }`}
                title={
                  autosendEnabled
                    ? "Auto-Senden ist aktiv (klicken zum Pausieren)"
                    : "Auto-Senden ist pausiert (klicken zum Aktivieren)"
                }
              >
                <Power className="h-4 w-4" />
                {autosendEnabled ? "Auto-Senden: AN" : "Auto-Senden: AUS"}
              </button>

              <button
                type="button"
                onClick={() => load({ silent: true })}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-2"
                title="Aktualisieren"
              >
                <RefreshCw className="h-4 w-4" />
                Aktualisieren
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 space-y-8">
          {/* KPI cards */}
          <div
            data-tour="home-stats"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <KpiCard
              title="Neue Interessenten"
              value={loading ? "–" : String(shownKpis.newLeads)}
              hint="Letzte 48 Stunden"
              icon={<Sparkles className="h-4 w-4" />}
            />
            <KpiCard
              title="Auto-Antworten"
              value={loading ? "–" : String(autoReplies30d)}
              hint="Letzte 30 Tage (ohne Freigabe)"
              icon={<Sparkles className="h-4 w-4" />}
            />
            <KpiCard
              title="Hohe Priorität"
              value={loading ? "–" : String(shownKpis.high)}
              hint="Priorität: Hoch / ≥ 2"
              icon={<ShieldAlert className="h-4 w-4" />}
            />
            <KpiCard
              title="Zeit gespart"
              value={loading ? "–" : timeSaved30d}
              hint="Letzte 30 Tage (konservativ)"
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          {/* Sections */}
          <div data-tour="home-shortcuts" className="flex flex-col gap-6">
            <Section
              title="Freigaben ausstehend"
              subtitle="Antworten, die noch bestätigt werden müssen."
              emptyTitle="Keine Freigaben"
              emptySubtitle="Aktuell ist nichts zur Freigabe offen."
              leads={buckets.approvals}
              lastMessages={lastMessages}
              messageCounts={messageCounts}
              userId={userId}
            />

            <Section
              title="High Priority"
              subtitle="Diese Interessenten solltest du zuerst bearbeiten."
              emptyTitle="Keine High Priority"
              emptySubtitle="Aktuell keine Interessenten mit hoher Priorität."
              leads={buckets.highPriority}
              lastMessages={lastMessages}
              messageCounts={messageCounts}
              userId={userId}
            />

            <Section
              title="Letzte Konversationen"
              subtitle="Deine zuletzt aktiven Gespräche."
              emptyTitle="Keine Konversationen"
              emptySubtitle="Aktuell gibt es keine offenen Konversationen."
              leads={buckets.openConversations}
              lastMessages={lastMessages}
              messageCounts={messageCounts}
              userId={userId}
            />
          </div>

          <div data-tour="home-tip" className="text-xs text-gray-500">
            Tipp: Öffne eine Konversation und antworte direkt.
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">{title}</div>
        <div className="text-gray-500">{icon}</div>
      </div>
      <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{hint}</div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  emptyTitle,
  emptySubtitle,
  leads,
  lastMessages,
  messageCounts,
  userId,
}: {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  leads: LeadRow[];
  lastMessages: Record<string, MsgRow | null>;
  messageCounts: Record<string, number>;
  userId: string;
}) {
  const top = leads.slice(0, 3);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">{title}</div>
            <div className="text-xs text-gray-600 mt-1">{subtitle}</div>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
            {leads.length}
          </span>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {top.length === 0 ? (
          <div className="w-full rounded-2xl border border-gray-200 bg-[#fbfbfc] p-6 text-center">
            <div className="text-gray-900 font-medium">{emptyTitle}</div>
            <div className="text-sm text-gray-600 mt-2">{emptySubtitle}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {top.map((lead) => {
              const last = lastMessages[lead.id];
              const lastText = safeStr(last?.text);
              const msgCount = messageCounts[lead.id] ?? 0;

              return (
                <div key={lead.id} className="block w-full">
                  <InboxItem
                    lead={{
                      ...(lead as any),
                      href: `/app/nachrichten/${lead.id}`,
                      last_message: lastText || null,
                      message_count: msgCount,
                      updated_at: last?.timestamp ?? (lead as any).updated_at,
                    }}
                    userId={userId}
                  />
                </div>
              );
            })}

            {leads.length > 3 && (
              <div className="pt-2">
                <Link
                  href={
                    title.toLowerCase().includes("freigabe")
                      ? "/app/zur-freigabe"
                      : "/app/nachrichten"
                  }
                  className="text-sm underline underline-offset-4 text-gray-700 hover:text-gray-900"
                >
                  Alle anzeigen
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
