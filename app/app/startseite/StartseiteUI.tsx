"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import InboxItem from "../nachrichten/components/InboxItem";
import {
  Clock,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Power,
  AlarmClock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Info,
  ShieldCheck,
  Rocket,
} from "lucide-react";

import { toast } from "sonner";
import { trackFunnelEvent } from "@/lib/funnel/track";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

type MsgRow = {
  lead_id: string;
  sender: string | null;
  timestamp: string;
  text: string | null;
};

type AutosendGateCheck = {
  key: string;
  label: string;
  ok: boolean;
  detail?: string | null;
};

type AutosendGate = {
  eligible: boolean;
  checks: AutosendGateCheck[];
  reasons: string[];
  metrics?: {
    property_count?: number;
    reviewed_reply_count?: number;
    failed_sends_last_14d?: number;
    min_reviewed_replies?: number;
    max_failed_sends_last_14d?: number;
  };
};

type OperationsInsights = {
  ok: boolean;
  generated_at: string;
  approval_learning: {
    window_days: number;
    total_reviews: number;
    edited_reviews: number;
    unchanged_reviews: number;
    edited_rate: number;
    avg_diff_chars: number;
    style_signals: string[];
    recommended_actions: string[];
  };
  sending_health: {
    window_days: number;
    sent_7d: number;
    failed_7d: number;
    failed_24h: number;
    fail_rate_7d: number;
    queue_open: number;
    level: "good" | "watch" | "critical";
    top_errors: Array<{ key: string; count: number }>;
  };
};

type BillingAccess = {
  state: "paid_active" | "trial_active" | "trial_expired";
  trial_days_total: number;
  trial_day_number: number;
  trial_days_remaining: number;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  is_urgent: boolean;
  upgrade_required: boolean;
  billing: {
    plan_key: string;
    status: string;
    entitled: boolean;
  };
};

type DeliverabilitySnapshot = {
  ok: boolean;
  level: "ok" | "warning" | "critical";
  sender_from: string | null;
  sender_domain: string | null;
  dmarc_policy: string | null;
  checks: Array<{
    key: string;
    label: string;
    ok: boolean;
    details: string;
  }>;
  summary: {
    failed_sends_24h: number;
    deliverability_like_failures_24h: number;
    failed_sends_7d: number;
    sent_7d: number;
    fail_rate_7d: number;
  };
  recommendations: string[];
};

type SimulationCaseKey =
  | "clear_standard"
  | "missing_context"
  | "complaint_risk"
  | "newsletter_noise";

const SIMULATION_CASES: Array<{ key: SimulationCaseKey; label: string }> = [
  {
    key: "clear_standard",
    label: "Klare Standardanfrage mit Objektbezug",
  },
  {
    key: "missing_context",
    label: "Anfrage ohne klaren Objektbezug",
  },
  {
    key: "complaint_risk",
    label: "Beschwerde oder Konfliktmail",
  },
  {
    key: "newsletter_noise",
    label: "Newsletter / no-reply / Systemmail",
  },
];

const SANDBOX_CORE_CASES: SimulationCaseKey[] = [
  "clear_standard",
  "missing_context",
  "complaint_risk",
];
const SANDBOX_STORAGE_KEY = "advaic_first_value_sandbox_v1";
const FIRST_VALUE_TRACK_KEY = "advaic_first_value_reached_v1";

function resolveSimulationResult(simulationCase: SimulationCaseKey) {
  if (simulationCase === "clear_standard") {
    return {
      decision: "Auto senden",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-900",
      why: [
        "Die Nachricht ist klar als Interessenten-Anfrage erkennbar.",
        "Der Fall ist eine Standardsituation mit klaren nächsten Schritten.",
        "Es fehlen keine kritischen Informationen.",
      ],
    };
  }
  if (simulationCase === "missing_context") {
    return {
      decision: "Zur Freigabe",
      cls: "border-amber-200 bg-amber-50 text-amber-900",
      why: [
        "Die Immobilie oder der konkrete Bezug ist nicht eindeutig.",
        "Ohne Kontext steigt das Risiko einer unpassenden Antwort.",
        "Advaic stoppt und legt den Fall in die Freigabe-Inbox.",
      ],
    };
  }
  if (simulationCase === "complaint_risk") {
    return {
      decision: "Zur Freigabe",
      cls: "border-amber-200 bg-amber-50 text-amber-900",
      why: [
        "Beschwerden und Konflikte sind heikle Sonderfälle.",
        "Für solche Fälle ist menschliche Prüfung verpflichtend.",
        "Autopilot antwortet hier bewusst nicht automatisch.",
      ],
    };
  }
  return {
    decision: "Ignorieren",
    cls: "border-gray-200 bg-gray-100 text-gray-800",
    why: [
      "Nicht-relevante Mails wie Newsletter und no-reply werden gefiltert.",
      "Kein Lead-Signal, daher kein Versand.",
      "So bleibt Ihr Team auf echte Interessenten fokussiert.",
    ],
  };
}

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

function toPct(v: number | null | undefined) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 1000) / 10}%`;
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
  const [followupsSenderMode, setFollowupsSenderMode] = useState<
    "always_approval" | "autosend_if_enabled" | null
  >(null);
  const [followupsBusy, setFollowupsBusy] = useState(false);
  const [quickstartBusy, setQuickstartBusy] = useState(false);
  const [quickstartApprovedSends, setQuickstartApprovedSends] = useState(0);
  const [opsInsights, setOpsInsights] = useState<OperationsInsights | null>(
    null,
  );
  const [deliverability, setDeliverability] =
    useState<DeliverabilitySnapshot | null>(null);
  const [autosendGate, setAutosendGate] = useState<AutosendGate | null>(null);
  const [billingAccess, setBillingAccess] = useState<BillingAccess | null>(
    null,
  );
  const [simulationCase, setSimulationCase] =
    useState<SimulationCaseKey>("clear_standard");
  const [sandboxStarted, setSandboxStarted] = useState(false);
  const [sandboxCompleted, setSandboxCompleted] = useState(false);
  const [sandboxVisitedCases, setSandboxVisitedCases] = useState<
    SimulationCaseKey[]
  >([]);
  const [firstValueTracked, setFirstValueTracked] = useState(false);

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
        let nextBilling: BillingAccess | null = null;
        const [aRes, fRes] = await Promise.all([
          fetch("/api/agent/settings/autosend", { method: "GET" }),
          fetch("/api/agent/settings/followups", { method: "GET" }),
        ]);

        if (aRes.ok) {
          const aJson = await aRes.json().catch(() => null);
          if (aJson?.billing_access) {
            nextBilling = aJson.billing_access as BillingAccess;
          }

          if (
            aJson?.autosend_gate &&
            Array.isArray(aJson?.autosend_gate?.checks)
          ) {
            setAutosendGate(aJson.autosend_gate as AutosendGate);
          } else {
            setAutosendGate(null);
          }

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
          setAutosendGate(null);
        }

        if (fRes.ok) {
          const fJson = await fRes.json().catch(() => null);
          if (!nextBilling && fJson?.billing_access) {
            nextBilling = fJson.billing_access as BillingAccess;
          }
          if (
            fJson?.ok &&
            typeof fJson?.settings?.followups_enabled_default === "boolean"
          ) {
            setFollowupsEnabled(fJson.settings.followups_enabled_default);
          } else {
            setFollowupsEnabled(true);
          }
          if (
            fJson?.ok &&
            (fJson?.settings?.followups_sender_mode === "always_approval" ||
              fJson?.settings?.followups_sender_mode ===
                "autosend_if_enabled")
          ) {
            setFollowupsSenderMode(fJson.settings.followups_sender_mode);
          } else {
            setFollowupsSenderMode(null);
          }
        } else {
          setFollowupsEnabled(true);
          setFollowupsSenderMode(null);
        }

        if (!nextBilling) {
          const bRes = await fetch("/api/billing/summary", {
            method: "GET",
            cache: "no-store",
          });
          const bJson = await bRes.json().catch(() => null);
          if (bRes.ok && bJson?.summary?.access) {
            nextBilling = bJson.summary.access as BillingAccess;
          }
        }

        setBillingAccess(nextBilling);
      } catch {
        setAutosendEnabled(false);
        setFollowupsEnabled(true);
        setFollowupsSenderMode(null);
        setAutosendGate(null);
        setBillingAccess(null);
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

      // Quickstart-Fortschritt: Wie viele manuell freigegebene Antworten
      // wurden tatsächlich versendet?
      try {
        const { data: reviewRows, error: reviewErr } = await (supabase
          .from("message_qas") as any)
          .select("draft_message_id")
          .eq("agent_id", userId)
          .eq("prompt_key", "approval_review_v1")
          .limit(3000);

        if (reviewErr || !Array.isArray(reviewRows) || reviewRows.length === 0) {
          setQuickstartApprovedSends(0);
        } else {
          const ids = Array.from(
            new Set(
              reviewRows
                .map((r: any) => String(r?.draft_message_id || "").trim())
                .filter(Boolean),
            ),
          );

          let sentCount = 0;
          const chunkSize = 250;
          for (let i = 0; i < ids.length; i += chunkSize) {
            const slice = ids.slice(i, i + chunkSize);
            const { data: sentRows, error: sentErr } = await (supabase
              .from("messages") as any)
              .select("id")
              .in("id", slice)
              .eq("agent_id", userId)
              .eq("send_status", "sent");

            if (sentErr) continue;
            sentCount += Array.isArray(sentRows) ? sentRows.length : 0;
          }

          setQuickstartApprovedSends(sentCount);
        }
      } catch (e) {
        console.warn("quickstart progress failed", e);
        setQuickstartApprovedSends(0);
      }

      try {
        const [opRes, delRes] = await Promise.all([
          fetch("/api/agent/insights/operations", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/agent/deliverability/status", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const opJson = await opRes.json().catch(() => null);
        if (opRes.ok && opJson?.ok) {
          setOpsInsights(opJson as OperationsInsights);
        } else {
          setOpsInsights(null);
        }

        const delJson = await delRes.json().catch(() => null);
        if (delRes.ok && delJson?.ok) {
          setDeliverability(delJson as DeliverabilitySnapshot);
        } else {
          setDeliverability(null);
        }
      } catch (e) {
        console.warn("operations or deliverability insights failed", e);
        setOpsInsights(null);
        setDeliverability(null);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    void trackFunnelEvent({
      event: "dashboard_home_viewed",
      source: "dashboard_home",
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawSandbox = window.localStorage.getItem(SANDBOX_STORAGE_KEY);
      if (rawSandbox) {
        const parsed = JSON.parse(rawSandbox) as {
          started?: boolean;
          completed?: boolean;
          visited?: SimulationCaseKey[];
        };
        if (parsed?.started) setSandboxStarted(true);
        if (parsed?.completed) setSandboxCompleted(true);
        if (Array.isArray(parsed?.visited)) {
          const filtered = parsed.visited.filter((item) =>
            SIMULATION_CASES.some((candidate) => candidate.key === item),
          );
          setSandboxVisitedCases(Array.from(new Set(filtered)));
        }
      }
    } catch {
      // ignore broken storage payloads
    }

    try {
      const tracked = window.localStorage.getItem(FIRST_VALUE_TRACK_KEY) === "1";
      if (tracked) setFirstValueTracked(true);
    } catch {
      // ignore
    }
  }, []);

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

  const roi = useMemo(() => {
    const approvalsOpen = shownKpis.approvals;
    const handledCases = autoReplies30d + approvalsOpen;
    const automationShare =
      handledCases > 0 ? Math.round((autoReplies30d / handledCases) * 100) : 0;
    const minutesSaved = autoReplies30d * 4;
    const potentialMinutes = handledCases * 4;
    const realizedShare =
      potentialMinutes > 0
        ? Math.round((minutesSaved / potentialMinutes) * 100)
        : 0;

    return {
      approvalsOpen,
      handledCases,
      automationShare,
      minutesSaved,
      potentialMinutes,
      realizedShare,
    };
  }, [autoReplies30d, shownKpis.approvals]);

  const simulationResult = useMemo(
    () => resolveSimulationResult(simulationCase),
    [simulationCase],
  );

  const sandboxProgress = useMemo(() => {
    const coreVisited = SANDBOX_CORE_CASES.filter((key) =>
      sandboxVisitedCases.includes(key),
    ).length;
    const ratio = coreVisited / SANDBOX_CORE_CASES.length;
    return {
      coreVisited,
      coreTotal: SANDBOX_CORE_CASES.length,
      pct: Math.round(ratio * 100),
    };
  }, [sandboxVisitedCases]);

  const updateSandboxStorage = (next: {
    started: boolean;
    completed: boolean;
    visited: SimulationCaseKey[];
  }) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const onSimulationCaseChange = (nextCase: SimulationCaseKey) => {
    setSimulationCase(nextCase);
    const nextDecision = resolveSimulationResult(nextCase).decision;

    const wasStarted = sandboxStarted;
    if (!wasStarted) {
      setSandboxStarted(true);
      void trackFunnelEvent({
        event: "first_value_sandbox_started",
        source: "dashboard_home",
        meta: { first_case: nextCase },
      });
    }

    const mergedVisited = Array.from(new Set([...sandboxVisitedCases, nextCase]));
    setSandboxVisitedCases(mergedVisited);
    const coreVisited = SANDBOX_CORE_CASES.filter((key) =>
      mergedVisited.includes(key),
    ).length;
    const isCompleted = coreVisited >= SANDBOX_CORE_CASES.length;
    if (isCompleted && !sandboxCompleted) {
      setSandboxCompleted(true);
      void trackFunnelEvent({
        event: "first_value_sandbox_completed",
        source: "dashboard_home",
        meta: { visited_cases: mergedVisited },
      });
    }

    void trackFunnelEvent({
      event: "first_value_sandbox_case_selected",
      source: "dashboard_home",
      meta: {
        case_key: nextCase,
        decision: nextDecision,
      },
    });

    updateSandboxStorage({
      started: true,
      completed: isCompleted || sandboxCompleted,
      visited: mergedVisited,
    });
  };

  const trialExpired = billingAccess?.state === "trial_expired";

  const toggleAutosend = async () => {
    if (autosendBusy) return;
    if (autosendEnabled === null) return;
    if (trialExpired) {
      toast.error(
        "Testphase beendet. Bitte aktiviere Starter, um Auto-Senden zu nutzen.",
      );
      void trackFunnelEvent({
        event: "billing_upgrade_gate_triggered",
        source: "dashboard_autosend_gate",
        path: "/app/startseite",
        meta: { reason: "trial_expired_autosend_toggle" },
      });
      if (typeof window !== "undefined") {
        window.location.assign(
          "/app/konto/abo?upgrade_required=1&source=dashboard_autosend_gate&next=%2Fapp%2Fstartseite",
        );
      }
      return;
    }

    const next = !autosendEnabled;
    setAutosendBusy(true);
    setAutosendEnabled(next);

    try {
      const res = await fetch("/api/agent/settings/autosend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autosend_enabled: next }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 402 && data?.error === "payment_required") {
        if (data?.billing_access) {
          setBillingAccess(data.billing_access as BillingAccess);
        }
        void trackFunnelEvent({
          event: "billing_upgrade_gate_triggered",
          source: "dashboard_autosend_api_gate",
          path: "/app/startseite",
          meta: { reason: "payment_required_autosend_api" },
        });
        if (typeof window !== "undefined") {
          window.location.assign(
            "/app/konto/abo?upgrade_required=1&source=dashboard_autosend_api_gate&next=%2Fapp%2Fstartseite",
          );
        }
        throw new Error(
          String(
            data?.details ||
              "Testphase beendet. Bitte aktiviere Starter, um Auto-Senden zu nutzen.",
          ),
        );
      }
      if (!res.ok || data?.ok !== true) {
        const firstReason = Array.isArray(data?.autosend_gate?.reasons)
          ? String(data.autosend_gate.reasons[0] || "").trim()
          : "";
        throw new Error(
          firstReason
            ? `${data?.error || "Auto-Senden noch nicht freigegeben."}: ${firstReason}`
            : data?.error || "Serverfehler beim Ändern von Auto-Senden.",
        );
      }
      if (typeof data?.settings?.autosend_enabled === "boolean") {
        setAutosendEnabled(data.settings.autosend_enabled);
      }
      if (data?.billing_access) {
        setBillingAccess(data.billing_access as BillingAccess);
      }
      void trackFunnelEvent({
        event: "dashboard_autosend_toggled",
        source: "dashboard_home",
        meta: { enabled: Boolean(data?.settings?.autosend_enabled ?? next) },
      });
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
    if (trialExpired) {
      toast.error(
        "Testphase beendet. Bitte aktiviere Starter, um Follow-ups zu nutzen.",
      );
      void trackFunnelEvent({
        event: "billing_upgrade_gate_triggered",
        source: "dashboard_followups_gate",
        path: "/app/startseite",
        meta: { reason: "trial_expired_followups_toggle" },
      });
      if (typeof window !== "undefined") {
        window.location.assign(
          "/app/konto/abo?upgrade_required=1&source=dashboard_followups_gate&next=%2Fapp%2Fstartseite",
        );
      }
      return;
    }

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
      if (res.status === 402 && data?.error === "payment_required") {
        if (data?.billing_access) {
          setBillingAccess(data.billing_access as BillingAccess);
        }
        void trackFunnelEvent({
          event: "billing_upgrade_gate_triggered",
          source: "dashboard_followups_api_gate",
          path: "/app/startseite",
          meta: { reason: "payment_required_followups_api" },
        });
        if (typeof window !== "undefined") {
          window.location.assign(
            "/app/konto/abo?upgrade_required=1&source=dashboard_followups_api_gate&next=%2Fapp%2Fstartseite",
          );
        }
        throw new Error(
          String(
            data?.details ||
              "Testphase beendet. Bitte aktiviere Starter, um Follow-ups zu nutzen.",
          ),
        );
      }
      if (!res.ok || data?.ok !== true) {
        throw new Error(
          data?.error || "Serverfehler beim Ändern von Follow-ups.",
        );
      }

      if (typeof data?.settings?.followups_enabled_default === "boolean") {
        setFollowupsEnabled(data.settings.followups_enabled_default);
      }
      if (
        data?.settings?.followups_sender_mode === "always_approval" ||
        data?.settings?.followups_sender_mode === "autosend_if_enabled"
      ) {
        setFollowupsSenderMode(data.settings.followups_sender_mode);
      } else {
        setFollowupsSenderMode(null);
      }
      if (data?.billing_access) {
        setBillingAccess(data.billing_access as BillingAccess);
      }

      void trackFunnelEvent({
        event: "dashboard_followups_toggled",
        source: "dashboard_home",
        meta: {
          enabled: Boolean(data?.settings?.followups_enabled_default ?? next),
        },
      });

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

  const applySafeStart = async () => {
    if (quickstartBusy) return;
    if (trialExpired) {
      toast.error(
        "Testphase beendet. Bitte aktiviere Starter, bevor du Safe-Start setzt.",
      );
      void trackFunnelEvent({
        event: "billing_upgrade_gate_triggered",
        source: "dashboard_safe_start_gate",
        path: "/app/startseite",
        meta: { reason: "trial_expired_safe_start" },
      });
      if (typeof window !== "undefined") {
        window.location.assign(
          "/app/konto/abo?upgrade_required=1&source=dashboard_safe_start_gate&next=%2Fapp%2Fstartseite",
        );
      }
      return;
    }
    setQuickstartBusy(true);
    try {
      const [aRes, fRes] = await Promise.all([
        fetch("/api/agent/settings/autosend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            autosend_enabled: false,
            reply_mode: "approval",
          }),
        }),
        fetch("/api/agent/settings/followups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followups_enabled_default: true,
            followups_sender_mode: "always_approval",
          }),
        }),
      ]);

      const [aJson, fJson] = await Promise.all([
        aRes.json().catch(() => null),
        fRes.json().catch(() => null),
      ]);

      if (aRes.status === 402 && aJson?.error === "payment_required") {
        if (aJson?.billing_access) {
          setBillingAccess(aJson.billing_access as BillingAccess);
        }
        void trackFunnelEvent({
          event: "billing_upgrade_gate_triggered",
          source: "dashboard_safe_start_autosend_gate",
          path: "/app/startseite",
          meta: { reason: "payment_required_safe_start_autosend" },
        });
        if (typeof window !== "undefined") {
          window.location.assign(
            "/app/konto/abo?upgrade_required=1&source=dashboard_safe_start_autosend_gate&next=%2Fapp%2Fstartseite",
          );
        }
        throw new Error(
          String(
            aJson?.details ||
              "Testphase beendet. Bitte aktiviere Starter für Safe-Start.",
          ),
        );
      }
      if (fRes.status === 402 && fJson?.error === "payment_required") {
        if (fJson?.billing_access) {
          setBillingAccess(fJson.billing_access as BillingAccess);
        }
        void trackFunnelEvent({
          event: "billing_upgrade_gate_triggered",
          source: "dashboard_safe_start_followups_gate",
          path: "/app/startseite",
          meta: { reason: "payment_required_safe_start_followups" },
        });
        if (typeof window !== "undefined") {
          window.location.assign(
            "/app/konto/abo?upgrade_required=1&source=dashboard_safe_start_followups_gate&next=%2Fapp%2Fstartseite",
          );
        }
        throw new Error(
          String(
            fJson?.details ||
              "Testphase beendet. Bitte aktiviere Starter für Safe-Start.",
          ),
        );
      }

      if (!aRes.ok || !aJson?.ok) {
        throw new Error(
          String(
            aJson?.error || "Safe-Start konnte für Auto-Senden nicht gesetzt werden.",
          ),
        );
      }
      if (!fRes.ok || !fJson?.ok) {
        throw new Error(
          String(
            fJson?.error || "Safe-Start konnte für Follow-ups nicht gesetzt werden.",
          ),
        );
      }

      setAutosendEnabled(false);
      setFollowupsEnabled(true);
      setFollowupsSenderMode("always_approval");
      if (aJson?.billing_access) {
        setBillingAccess(aJson.billing_access as BillingAccess);
      } else if (fJson?.billing_access) {
        setBillingAccess(fJson.billing_access as BillingAccess);
      }

      void trackFunnelEvent({
        event: "dashboard_safe_start_applied",
        source: "dashboard_home",
        meta: {
          autosend_enabled: false,
          followups_sender_mode: "always_approval",
        },
      });
      toast.success("Safe-Start aktiv: zuerst Freigabe, dann schrittweise Automatisierung.");
    } catch (e: any) {
      toast.error(e?.message || "Safe-Start konnte nicht aktiviert werden.");
    } finally {
      setQuickstartBusy(false);
    }
  };

  const quickstart = useMemo(() => {
    const target = 3;
    const done = quickstartApprovedSends >= target;
    const progress = Math.max(0, Math.min(target, quickstartApprovedSends));
    const progressPct = Math.round((progress / target) * 100);

    const safeStartActive =
      autosendEnabled === false &&
      (followupsSenderMode === "always_approval" || followupsSenderMode === null);

    return {
      target,
      progress,
      progressPct,
      done,
      safeStartActive,
    };
  }, [autosendEnabled, followupsSenderMode, quickstartApprovedSends]);

  const quickstartNextAction = useMemo(() => {
    if (trialExpired) {
      return {
        href: "/app/konto/abo?source=dashboard_quickstart_next&next=%2Fapp%2Fstartseite",
        label: "Starter aktivieren",
        hint: "Die Testphase ist beendet. Aktiviere Starter, damit Safe-Start und Versand wieder freigeschaltet sind.",
        primary: true,
      };
    }

    if (!quickstart.safeStartActive) {
      return {
        href: null,
        label: "Safe-Start anwenden",
        hint: "Setze zuerst Freigabe als Standard für Antworten und Follow-ups.",
        primary: true,
      };
    }

    if (shownKpis.approvals > 0) {
      return {
        href: "/app/zur-freigabe",
        label: "Offene Freigaben bearbeiten",
        hint: "Dort liegen die nächsten klaren Entwürfe. Drei sichere Freigaben reichen für den First Value.",
        primary: true,
      };
    }

    if (shownKpis.open > 0) {
      return {
        href: "/app/nachrichten",
        label: "Nachrichten prüfen",
        hint: "Öffne neue Konversationen, damit weitere Fälle in die Freigabe laufen.",
        primary: false,
      };
    }

    return {
      href: "/app/immobilien",
      label: "Objekte ergänzen",
      hint: "Mit vollständigen Objektdaten steigen Präzision und Automatisierungsgrad.",
      primary: false,
    };
  }, [quickstart.safeStartActive, shownKpis.approvals, shownKpis.open, trialExpired]);

  useEffect(() => {
    const reached = quickstart.progress >= 1 || autoReplies30d > 0;
    if (!reached || firstValueTracked) return;

    setFirstValueTracked(true);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(FIRST_VALUE_TRACK_KEY, "1");
      } catch {
        // ignore
      }
    }

    void trackFunnelEvent({
      event: "first_value_reached",
      source: "dashboard_home",
      meta: {
        quickstart_progress: quickstart.progress,
        auto_replies_30d: autoReplies30d,
      },
    });
  }, [autoReplies30d, firstValueTracked, quickstart.progress]);

  const sendingHealthUi = useMemo(() => {
    const level = opsInsights?.sending_health?.level || "good";
    if (level === "critical") {
      return {
        label: "Kritisch",
        cls: "border-red-200 bg-red-50 text-red-800",
      };
    }
    if (level === "watch") {
      return {
        label: "Auffällig",
        cls: "border-amber-200 bg-amber-50 text-amber-900",
      };
    }
    return {
      label: "Stabil",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }, [opsInsights?.sending_health?.level]);

  const deliverabilityUi = useMemo(() => {
    const level = deliverability?.level || "ok";
    if (level === "critical") {
      return {
        label: "Kritisch",
        cls: "border-red-200 bg-red-50 text-red-800",
      };
    }
    if (level === "warning") {
      return {
        label: "Auffällig",
        cls: "border-amber-200 bg-amber-50 text-amber-900",
      };
    }
    return {
      label: "Stabil",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }, [deliverability?.level]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div
          data-tour="home-hero"
          className="sticky top-16 md:top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between pb-4">
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

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={toggleFollowups}
                disabled={followupsEnabled === null || followupsBusy || trialExpired}
                className={`px-3 py-2 text-sm rounded-lg border inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none ${
                  followupsEnabled
                    ? "bg-gray-900 border-gray-900 text-amber-200 hover:bg-gray-800"
                    : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                }`}
                title={
                  trialExpired
                    ? "Testphase beendet: bitte Starter aktivieren"
                    : followupsEnabled
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
                disabled={autosendEnabled === null || autosendBusy || trialExpired}
                className={`px-3 py-2 text-sm rounded-lg border inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none ${
                  autosendEnabled
                    ? "bg-gray-900 border-gray-900 text-amber-200 hover:bg-gray-800"
                    : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                }`}
                title={
                  trialExpired
                    ? "Testphase beendet: bitte Starter aktivieren"
                    : autosendEnabled
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
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 inline-flex items-center justify-center gap-2 flex-1 sm:flex-none"
                title="Aktualisieren"
              >
                <RefreshCw className="h-4 w-4" />
                Aktualisieren
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 space-y-8">
          {billingAccess?.state !== "paid_active" ? (
            <div
              className={`rounded-2xl border p-4 md:p-5 ${
                trialExpired
                  ? "border-red-300 bg-red-50"
                  : billingAccess?.is_urgent
                    ? "border-amber-300 bg-amber-50"
                    : "border-sky-200 bg-sky-50"
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {trialExpired ? "Testphase beendet" : "Testphase aktiv"}
                  </div>
                  <div className="mt-1 text-xs text-gray-700">
                    {trialExpired
                      ? "Auto-Senden und Follow-ups sind pausiert, bis Starter aktiv ist."
                      : `Tag ${billingAccess?.trial_day_number ?? 1} von ${billingAccess?.trial_days_total ?? 14}. Noch ${billingAccess?.trial_days_remaining ?? 0} Tage.`}
                  </div>
                </div>
                <Link
                  href="/app/konto/abo?source=dashboard_trial_card&next=%2Fapp%2Fstartseite"
                  onClick={() => {
                    void trackFunnelEvent({
                      event: "billing_upgrade_cta_clicked",
                      source: "dashboard_trial_card",
                      path: "/app/startseite",
                      meta: {
                        trial_state: billingAccess?.state || null,
                        trial_days_remaining: billingAccess?.trial_days_remaining ?? null,
                      },
                    });
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-gray-800"
                >
                  Starter aktivieren
                </Link>
              </div>
            </div>
          ) : null}

          <div
            id="quickstart"
            className={`rounded-2xl border p-5 ${
              quickstart.done
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-amber-200 bg-amber-50/50"
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-gray-700" />
                  <div className="text-sm font-semibold text-gray-900">
                    Schnellstart: Erste 3 sichere Antworten
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-700">
                  Ziel: in kurzer Zeit echten Nutzen sehen, ohne Risiko. Du
                  startest konservativ und gibst die ersten Antworten manuell
                  frei.
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                  quickstart.done
                    ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                    : "border-amber-200 bg-amber-100 text-amber-900"
                }`}
              >
                {quickstart.progress}/{quickstart.target} freigegeben
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/80">
              <div
                className={`h-full rounded-full transition-all ${
                  quickstart.done ? "bg-emerald-600" : "bg-gray-900"
                }`}
                style={{ width: `${quickstart.progressPct}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5 text-xs">
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800">
                <span className="font-medium">1) Safe-Start aktiv:</span>{" "}
                {quickstart.safeStartActive ? "Ja" : "Noch nicht"}
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800">
                <span className="font-medium">2) Offene Freigaben:</span>{" "}
                {shownKpis.approvals}
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800">
                <span className="font-medium">3) Manuell versendet:</span>{" "}
                {quickstart.progress}/{quickstart.target}
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800">
                <span className="font-medium">4) First Value:</span>{" "}
                {quickstart.progress >= 1 || autoReplies30d > 0 ? "Erreicht" : "Offen"}
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800">
                <span className="font-medium">5) Follow-ups sicher:</span>{" "}
                {followupsSenderMode === "always_approval" || followupsSenderMode === null
                  ? "Ja"
                  : "Auto-basiert"}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
              <div className="text-xs font-semibold text-gray-900">
                Nächster bester Schritt
              </div>
              <div className="mt-1 text-xs text-gray-700">
                {quickstartNextAction.hint}
              </div>
              <div className="mt-3">
                {quickstartNextAction.href ? (
                  <Link
                    href={quickstartNextAction.href}
                    onClick={() => {
                      void trackFunnelEvent({
                        event: "dashboard_quickstart_next_clicked",
                        source: "dashboard_home",
                        meta: {
                          next_label: quickstartNextAction.label,
                          next_href: quickstartNextAction.href,
                          trial_expired: trialExpired,
                        },
                      });
                    }}
                    className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium ${
                      quickstartNextAction.primary
                        ? "border-gray-900 bg-gray-900 text-amber-200 hover:bg-gray-800"
                        : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {quickstartNextAction.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={applySafeStart}
                    disabled={quickstartBusy || trialExpired}
                    className="inline-flex items-center rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {quickstartBusy ? "Setzt Safe-Start…" : quickstartNextAction.label}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!quickstart.safeStartActive && (
                <button
                  type="button"
                  onClick={applySafeStart}
                  disabled={quickstartBusy || trialExpired}
                  className="inline-flex items-center rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {quickstartBusy ? "Setzt Safe-Start…" : "Safe-Start anwenden"}
                </button>
              )}
              <Link
                href="/app/zur-freigabe"
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
              >
                Zur Freigabe öffnen
              </Link>
              <Link
                href="/app/nachrichten"
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
              >
                Nachrichten öffnen
              </Link>
              {quickstart.done && billingAccess?.state !== "paid_active" ? (
                <Link
                  href="/app/konto/abo?source=dashboard_quickstart_done&next=%2Fapp%2Fstartseite"
                  onClick={() => {
                    void trackFunnelEvent({
                      event: "billing_upgrade_cta_clicked",
                      source: "dashboard_quickstart_done",
                      path: "/app/startseite",
                      meta: {
                        quickstart_done: true,
                        trial_state: billingAccess?.state || null,
                      },
                    });
                  }}
                  className="inline-flex items-center rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-gray-800"
                >
                  Starter jetzt aktivieren
                </Link>
              ) : null}
            </div>

            <div className="mt-3 text-xs text-gray-700">
              {quickstart.done
                ? "Sehr gut: Die ersten 3 sicheren Antworten sind durch. Jetzt kannst du den Automatisierungsgrad kontrolliert erhöhen."
                : "Empfehlung: Erst 3 klare Standardfälle freigeben, dann erst über mehr Auto-Senden entscheiden."}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-900">
                  Lernkurve aus Freigaben
                </div>
                <span className="text-xs rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-gray-700">
                  Letzte {opsInsights?.approval_learning?.window_days ?? 30} Tage
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Diese Werte zeigen, wie stark Entwürfe vor dem Versand angepasst werden.
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Geprüft</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {opsInsights?.approval_learning?.total_reviews ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Mit Änderung</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {opsInsights?.approval_learning?.edited_reviews ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Änderungsquote</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {toPct(opsInsights?.approval_learning?.edited_rate)}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Ø Diff-Zeichen</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {opsInsights?.approval_learning?.avg_diff_chars ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-medium text-gray-700">
                  Erkanntes Muster
                </div>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-gray-700">
                  {(opsInsights?.approval_learning?.style_signals || [
                    "Noch keine Daten vorhanden.",
                  ]).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href="/app/ton-und-stil"
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 hover:bg-gray-50"
                >
                  Ton & Stil öffnen
                </Link>
                <Link
                  href="/app/zur-freigabe"
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 hover:bg-gray-50"
                >
                  Freigabe-Inbox öffnen
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-900">
                  Versandgesundheit
                </div>
                <span
                  className={`text-xs rounded-full border px-2 py-1 font-medium ${sendingHealthUi.cls}`}
                >
                  {sendingHealthUi.label}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Damit du Fehler und Queue-Stau früh siehst, bevor Antworten liegenbleiben.
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Gesendet (7 Tage)</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {opsInsights?.sending_health?.sent_7d ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Fehlgeschlagen (7 Tage)</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {opsInsights?.sending_health?.failed_7d ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Fehlerquote</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {toPct(opsInsights?.sending_health?.fail_rate_7d)}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Offene Queue</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {opsInsights?.sending_health?.queue_open ?? 0}
                  </div>
                </div>
              </div>

              {(opsInsights?.sending_health?.top_errors?.length || 0) > 0 ? (
                <div className="mt-4">
                  <div className="text-xs font-medium text-gray-700">
                    Häufigste Fehler
                  </div>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-gray-700">
                    {(opsInsights?.sending_health?.top_errors || []).map(
                      (item) => (
                        <li key={item.key}>
                          {item.key} ({item.count})
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 text-xs text-gray-700">
                {sendingHealthUi.label === "Kritisch"
                  ? "Empfehlung: zuerst fehlgeschlagene Sendungen prüfen und danach Queue abbauen."
                  : sendingHealthUi.label === "Auffällig"
                    ? "Empfehlung: Queue und Fehlermuster täglich kurz prüfen."
                    : "Der Versand läuft aktuell stabil."}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-900">
                  Deliverability-Monitoring
                </div>
                <span
                  className={`text-xs rounded-full border px-2 py-1 font-medium ${deliverabilityUi.cls}`}
                >
                  {deliverabilityUi.label}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Sichtbarkeit für SPF, DKIM, DMARC und zustellbarkeitsnahe Fehler.
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Deliverability-Fehler (24h)</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {deliverability?.summary?.deliverability_like_failures_24h ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Gesamtfehler (24h)</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {deliverability?.summary?.failed_sends_24h ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Fehlerquote (7 Tage)</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {toPct(deliverability?.summary?.fail_rate_7d)}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Absenderdomain</div>
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {deliverability?.sender_domain || "–"}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                {(deliverability?.checks || []).map((check) => (
                  <div
                    key={check.key}
                    className={`rounded-xl border px-2 py-2 ${
                      check.ok
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <div className="font-semibold">{check.label}</div>
                    <div className="mt-1 line-clamp-2">{check.ok ? "OK" : "Fehlt"}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-gray-700">
                {deliverability?.recommendations?.[0] ||
                  "Keine Empfehlung verfügbar. Bitte später erneut prüfen."}
              </div>
            </div>
          </div>

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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Autopilot-Steuerzentrale
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Du siehst hier transparent, ob Auto-Senden freigegeben ist,
                    welche Guardrails gelten und wie ein Fall entschieden wird.
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                    autosendGate?.eligible
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}
                >
                  {autosendGate?.eligible
                    ? "Auto-Senden freigegeben"
                    : "Auto-Senden mit Guardrails"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {(autosendGate?.checks ?? []).map((check) => (
                  <div
                    key={check.key}
                    className="rounded-xl border border-gray-200 bg-[#fbfbfc] px-3 py-2"
                  >
                    <div className="flex items-start gap-2">
                      {check.ok ? (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 mt-0.5 text-amber-700" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {check.label}
                        </div>
                        {check.detail ? (
                          <div className="text-xs text-gray-600 mt-1">
                            {check.detail}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
                {!autosendGate && (
                  <div className="md:col-span-2 rounded-xl border border-gray-200 bg-[#fbfbfc] px-3 py-2 text-sm text-gray-600">
                    Gate-Informationen werden geladen oder sind aktuell nicht
                    verfügbar.
                  </div>
                )}
              </div>

              {autosendGate?.reasons?.length ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="text-xs font-medium text-amber-900">
                    Noch gesperrt, weil:
                  </div>
                  <ul className="mt-1 text-xs text-amber-900/90 list-disc pl-4 space-y-0.5">
                    {autosendGate.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gray-600" />
                  <div className="text-sm font-medium text-gray-900">
                    First-Value-Sandbox
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 font-medium ${
                      sandboxCompleted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : sandboxStarted
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : "border-gray-200 bg-gray-50 text-gray-700"
                    }`}
                  >
                    {sandboxCompleted
                      ? "Sandbox abgeschlossen"
                      : sandboxStarted
                        ? "Sandbox läuft"
                        : "Sandbox nicht gestartet"}
                  </span>
                  <span className="text-gray-600">
                    {sandboxProgress.coreVisited}/{sandboxProgress.coreTotal} Kernfälle geprüft
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sandboxCompleted ? "bg-emerald-600" : "bg-gray-900"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, sandboxProgress.pct))}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-col md:flex-row gap-2">
                  <select
                    value={simulationCase}
                    onChange={(e) => onSimulationCaseChange(e.target.value as SimulationCaseKey)}
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                  >
                    {SIMULATION_CASES.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg border ${simulationResult.cls}`}
                  >
                    Entscheidung: {simulationResult.decision}
                  </span>
                </div>
                <ul className="mt-3 text-xs text-gray-700 list-disc pl-4 space-y-1">
                  {simulationResult.why.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                  {SANDBOX_CORE_CASES.map((key) => {
                    const item = SIMULATION_CASES.find((entry) => entry.key === key);
                    const checked = sandboxVisitedCases.includes(key);
                    return (
                      <div
                        key={key}
                        className={`rounded-lg border px-2.5 py-2 text-xs ${
                          checked
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      >
                        {checked ? "✓ " : "○ "}
                        {item?.label || key}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-gray-900">
                  ROI-Fortschritt
                </div>
                <BarChart3 className="h-4 w-4 text-gray-500" />
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Konservativ gerechnet mit 4 Minuten Zeitersparnis pro sicher
                automatisch versendeter Antwort.
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Automatisiert gelöst</span>
                  <span className="font-medium text-gray-900">
                    {roi.automationShare}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-900 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, roi.automationShare))}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Freigaben offen</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {roi.approvalsOpen}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                  <div className="text-gray-500">Zeit gespart</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {timeSaved30d}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-600">
                Realisiert: {roi.minutesSaved} von {roi.potentialMinutes} Minuten
                Potenzial im aktuellen Mix ({roi.realizedShare}%).
              </div>
            </div>
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

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Info className="h-4 w-4 text-gray-600" />
              Was bedeuten die Status im Alltag?
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <span className="font-medium">Auto gesendet:</span> klare
                Standardanfrage, Sicherheitschecks bestanden, direkt versendet.
              </div>
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <span className="font-medium">Zur Freigabe:</span> unklarer oder
                riskanter Fall, bevor eine Antwort rausgeht.
              </div>
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <span className="font-medium">Ignoriert:</span> Newsletter,
                Systemmail oder no-reply ohne Interessentenbezug.
              </div>
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <span className="font-medium">Fehlgeschlagen:</span> Versand
                technisch nicht durchgelaufen, manuell prüfbar und erneut
                sendbar.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ShieldCheck className="h-4 w-4 text-gray-600" />
              Sicherheit & DSGVO im Betrieb
            </div>
            <p className="mt-2 text-xs text-gray-700">
              Advaic ist auf DSGVO-konforme Prozesse ausgelegt: klare Zweckbindung, nachvollziehbare Status-Historie
              und manuelle Kontrolle bei unklaren Fällen.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-700 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <span className="font-medium">Im Zweifel Freigabe:</span> Kein blindes Auto-Senden bei Risiko.
              </div>
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <span className="font-medium">Nachvollziehbarkeit:</span> Verlauf mit Status und Zeitstempeln.
              </div>
              <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                <span className="font-medium">Betroffenenrechte:</span> Datenexport und Löschpfad sind vorhanden.
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <Link href="/datenschutz" className="text-gray-700 underline underline-offset-4 hover:text-gray-900">
                Datenschutz
              </Link>
              <Link
                href="/cookie-und-storage"
                className="text-gray-700 underline underline-offset-4 hover:text-gray-900"
              >
                Cookie & Storage
              </Link>
              <Link
                href="/app/konto/loeschen"
                className="text-gray-700 underline underline-offset-4 hover:text-gray-900"
              >
                Konto/Löschung
              </Link>
            </div>
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
