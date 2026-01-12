"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import InboxItem from "../nachrichten/components/InboxItem";
import {
  Clock,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from "lucide-react";

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
  // support both old german values and new english values
  if (!s) return "";
  if (s === "open" || s === "offen" || s === "neu") return "open";
  if (s === "closed" || s === "erledigt" || s === "abgeschlossen")
    return "closed";
  return s;
}

function isHighPriority(priority: unknown): boolean {
  // supports numeric priorities (>=2) and german strings ("Hoch")
  const n = Number(priority);
  if (Number.isFinite(n)) return n >= 2;
  const s = safeStr(priority).toLowerCase();
  return s === "hoch" || s === "high";
}

function formatMinutes(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return "–";
  return `${Math.round(min)} Min`;
}

function calculateAverageResponseTimeFromPairs(pairs: Array<{ userAt: string; agentAt: string }>): string {
  if (!pairs.length) return "–";
  const deltas: number[] = [];
  for (const p of pairs) {
    const a = new Date(p.userAt).getTime();
    const b = new Date(p.agentAt).getTime();
    const d = b - a;
    // ignore nonsense and very long gaps (>= 24h)
    if (d > 0 && d < 1000 * 60 * 60 * 24) deltas.push(d);
  }
  if (!deltas.length) return "–";
  const avgMs = deltas.reduce((s, x) => s + x, 0) / deltas.length;
  return formatMinutes(avgMs / 1000 / 60);
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
  const [lastMessages, setLastMessages] = useState<Record<string, MsgRow | null>>(
    {}
  );
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});

  const [avgResponseTime, setAvgResponseTime] = useState<string>("–");

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

      // Load leads once; derive KPI buckets client-side (more robust to schema changes)
      const { data: leadsData, error } = await supabase
        .from("leads")
        .select("*")
        .eq("agent_id", userId)
        .order("updated_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error("❌ leads fetch", error);
        setAllLeads([]);
        return;
      }

      const rows = (leadsData ?? []) as LeadRow[];
      setAllLeads(rows);

      // Average response time
      // Option A: compute from serverLeads if they include messages (as you had before)
      // Option B: best-effort compute from latest messages for those leads
      try {
        const pairs: Array<{ userAt: string; agentAt: string }> = [];

        // Prefer serverLeads messages if present
        const fromServer = Array.isArray(serverLeads) ? serverLeads : [];
        for (const l of fromServer) {
          const msgs = (l as any)?.messages;
          if (!Array.isArray(msgs) || msgs.length < 2) continue;
          for (let i = 1; i < msgs.length; i++) {
            const prev = msgs[i - 1];
            const curr = msgs[i];
            if (String(prev?.sender) === "user" && isAgentSender(curr?.sender)) {
              if (prev?.timestamp && curr?.timestamp) {
                pairs.push({ userAt: prev.timestamp, agentAt: curr.timestamp });
              }
            }
          }
        }

        // If we didn't get anything from serverLeads, compute from DB using last 2000 messages
        if (pairs.length === 0) {
          const { data: msgs, error: mErr } = await supabase
            .from("messages")
            .select("lead_id, sender, timestamp")
            .in(
              "lead_id",
              rows.slice(0, 200).map((r) => r.id)
            )
            .order("timestamp", { ascending: true })
            .limit(2000);

          if (!mErr && msgs?.length) {
            const byLead: Record<string, Array<{ sender: string | null; timestamp: string }>> = {};
            for (const m of msgs as any[]) {
              const id = String(m.lead_id);
              if (!byLead[id]) byLead[id] = [];
              byLead[id].push({ sender: m.sender ?? null, timestamp: m.timestamp });
            }
            for (const arr of Object.values(byLead)) {
              for (let i = 1; i < arr.length; i++) {
                const prev = arr[i - 1];
                const curr = arr[i];
                if (String(prev.sender) === "user" && isAgentSender(curr.sender)) {
                  pairs.push({ userAt: prev.timestamp, agentAt: curr.timestamp });
                }
              }
            }
          }
        }

        setAvgResponseTime(calculateAverageResponseTimeFromPairs(pairs));
      } catch (e) {
        console.warn("avg response time compute failed", e);
        setAvgResponseTime("–");
      }

      // Prefetch last message + counts only for the cards we actually render
      // (top items of each bucket). We do this after we computed buckets below.
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
      // treat empty as open (legacy)
      return !st || st === "open";
    });

    const highPriority = allLeads.filter((l) => isHighPriority((l as any).priority));

    // "Freigaben ausstehend" (best-effort): if leads have any flag that indicates approval
    // If not available, this bucket will just be empty.
    const approvals = allLeads.filter((l) => {
      const v = (l as any).approval_required;
      return v === true;
    });

    return {
      newLeads,
      openConversations,
      highPriority,
      approvals,
    };
  }, [allLeads, cutoff48h]);

  // Fetch last messages & counts for the top leads rendered
  useEffect(() => {
    const fetchSnippets = async () => {
      const topIds = Array.from(
        new Set(
          [
            ...buckets.approvals.slice(0, 3).map((l) => l.id),
            ...buckets.highPriority.slice(0, 3).map((l) => l.id),
            ...buckets.openConversations.slice(0, 3).map((l) => l.id),
          ].filter(Boolean)
        )
      );

      if (topIds.length === 0) return;

      // last messages
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
  }, [buckets.approvals, buckets.highPriority, buckets.openConversations, supabase]);

  const shownKpis = useMemo(() => {
    return {
      newLeads: buckets.newLeads.length,
      open: buckets.openConversations.length,
      high: buckets.highPriority.length,
      approvals: buckets.approvals.length,
    };
  }, [buckets]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Neue Interessenten"
              value={loading ? "–" : String(shownKpis.newLeads)}
              hint="Letzte 48 Stunden"
              icon={<Sparkles className="h-4 w-4" />}
            />
            <KpiCard
              title="Konversationen offen"
              value={loading ? "–" : String(shownKpis.open)}
              hint="Offen / Neu / ohne Status"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <KpiCard
              title="Hohe Priorität"
              value={loading ? "–" : String(shownKpis.high)}
              hint="Priorität: Hoch / ≥ 2"
              icon={<ShieldAlert className="h-4 w-4" />}
            />
            <KpiCard
              title="Ø Antwortzeit"
              value={loading ? "–" : avgResponseTime}
              hint="User → Agent/Assistant"
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          {/* Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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

          <div className="text-xs text-gray-500">
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
  icon: React.ReactNode;
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
          <div className="flex flex-col gap-4">
            {top.map((lead) => {
              const last = lastMessages[lead.id];
              const lastText = safeStr(last?.text);
              const lastDate = last?.timestamp
                ? new Date(last.timestamp).toLocaleDateString("de-DE")
                : "";
              const msgCount = messageCounts[lead.id] ?? 0;

              return (
                <div key={lead.id} className="block">
                  <InboxItem
                    lead={{
                      ...(lead as any),
                      href: `/app/nachrichten/${lead.id}`,
                      lastMessage: lastText || null,
                      lastMessageDate: lastDate,
                      messageCount: msgCount,
                    }}
                    userId={userId}
                  />
                </div>
              );
            })}

            {leads.length > 3 && (
              <div className="pt-1">
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
