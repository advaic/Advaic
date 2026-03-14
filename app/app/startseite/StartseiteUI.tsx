"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import {
  appButtonClass,
  DashboardLoadingState,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  statusBadgeClass,
  statusSurfaceClass,
  type StatusTone,
} from "@/components/app-ui";
import {
  Clock,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Power,
  AlarmClock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  BarChart3,
  Info,
  ArrowRight,
  ShieldCheck,
  MessageSquareText,
  Rocket,
} from "lucide-react";

import { toast } from "sonner";
import { trackFunnelEvent } from "@/lib/funnel/track";
import {
  trackSettingsToggleAttempt,
  trackSettingsToggleSuccess,
  trackUiMetricEvent,
  useUiRouteMetric,
} from "@/lib/funnel/ui-metrics";
import { uiActionCopy } from "@/lib/ui/action-copy";
import { cn } from "@/lib/utils";

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
      tone: "success" as StatusTone,
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
      tone: "warning" as StatusTone,
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
      tone: "warning" as StatusTone,
      why: [
        "Beschwerden und Konflikte sind heikle Sonderfälle.",
        "Für solche Fälle ist menschliche Prüfung verpflichtend.",
        "Autopilot antwortet hier bewusst nicht automatisch.",
      ],
    };
  }
  return {
    decision: "Ignorieren",
    tone: "neutral" as StatusTone,
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

function formatDashboardTimestamp(value: string | null | undefined) {
  if (!value) return "Keine Aktivität";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Keine Aktivität";
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

type DashboardActionVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "utility"
  | "destructive";

type QuickstartStepAction =
  | {
      kind: "link";
      label: string;
      href: string;
      variant?: DashboardActionVariant;
      onClick?: () => void;
    }
  | {
      kind: "button";
      label: string;
      onClick: () => void;
      disabled?: boolean;
      variant?: DashboardActionVariant;
    };

type QueueCardEmptyState = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  actionVariant?: DashboardActionVariant;
  learnLabel?: string;
  learnHref?: string;
};

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
  const [showGuardrailDetails, setShowGuardrailDetails] = useState(false);
  const [showSandboxDetails, setShowSandboxDetails] = useState(false);
  const [showHelpDetails, setShowHelpDetails] = useState(false);
  const [showQuickstartPlanMobile, setShowQuickstartPlanMobile] = useState(false);
  const { markFirstAction: markDashboardFirstAction } = useUiRouteMetric({
    routeKey: "dashboard_home",
    source: "dashboard_home",
    path: "/app/startseite",
  });

  const trackDashboardAction = (
    action: string,
    meta?: Record<string, unknown>,
  ) => {
    markDashboardFirstAction(action, meta);
    trackUiMetricEvent({
      event: "dashboard_primary_action",
      source: "dashboard_home",
      path: "/app/startseite",
      routeKey: "dashboard_home",
      meta: {
        action,
        ...(meta || {}),
      },
    });
  };

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

  const approvalsEmptyState: QueueCardEmptyState = useMemo(() => {
    if (shownKpis.high > 0) {
      return {
        title: "Keine Freigaben offen",
        description:
          "Die sichere Queue ist abgearbeitet. Wechsle jetzt in die Fälle, die heute echte Aufmerksamkeit brauchen.",
        actionLabel: uiActionCopy.messagesReview,
        actionHref: "/app/nachrichten",
        actionVariant: "secondary",
        learnLabel: "Statuslogik ansehen",
        learnHref: "#home-help",
      };
    }

    if (shownKpis.open > 0) {
      return {
        title: "Keine Freigaben offen",
        description:
          "Aktuell wartet nichts auf Freigabe. Prüfe die laufenden Konversationen, damit neue Antworten hier sauber nachrücken.",
        actionLabel: uiActionCopy.messagesReview,
        actionHref: "/app/nachrichten",
        actionVariant: "secondary",
        learnLabel: "Statuslogik ansehen",
        learnHref: "#home-help",
      };
    }

    return {
      title: "Keine Freigaben offen",
      description:
        "Aktuell wartet nichts auf Freigabe. Neue sichere Antworten erscheinen hier automatisch, sobald Guardrails sie einordnen.",
      actionLabel: uiActionCopy.messagesReview,
      actionHref: "/app/nachrichten",
      actionVariant: "secondary",
      learnLabel: "Statuslogik ansehen",
      learnHref: "#home-help",
    };
  }, [shownKpis.high, shownKpis.open]);

  const highPriorityEmptyState: QueueCardEmptyState = useMemo(() => {
    if (shownKpis.approvals > 0) {
      return {
        title: "Keine Fälle mit hoher Priorität",
        description:
          "Gut: Es gibt aktuell keine akuten Fälle. Arbeite jetzt zuerst die offenen Freigaben ab.",
        actionLabel: uiActionCopy.approvalsReview,
        actionHref: "/app/zur-freigabe",
        actionVariant: "secondary",
        learnLabel: "Statuslogik ansehen",
        learnHref: "#home-help",
      };
    }

    if (shownKpis.open > 0) {
      return {
        title: "Keine Fälle mit hoher Priorität",
        description:
          "Heute gibt es keine dringenden Fälle. Du kannst die normale Inbox ohne Eskalationsdruck abarbeiten.",
        actionLabel: uiActionCopy.messagesReview,
        actionHref: "/app/nachrichten",
        actionVariant: "secondary",
      };
    }

    return {
      title: "Keine Fälle mit hoher Priorität",
      description:
        "Im Moment ist es ruhig. Neue dringende Fälle tauchen hier automatisch auf, sobald Priorität erkannt wird.",
      actionLabel: uiActionCopy.messagesReview,
      actionHref: "/app/nachrichten",
      actionVariant: "secondary",
    };
  }, [shownKpis.approvals, shownKpis.open]);

  const conversationsEmptyState: QueueCardEmptyState = useMemo(() => {
    if (shownKpis.newLeads > 0) {
      return {
        title: "Keine aktiven Konversationen",
        description:
          "Es kamen neue Leads rein, aber noch kein offener Verlauf liegt hier. Prüfe jetzt die Inbox und starte den nächsten Kontaktpunkt.",
        actionLabel: uiActionCopy.messagesReview,
        actionHref: "/app/nachrichten",
        actionVariant: "utility",
      };
    }

    if (shownKpis.approvals > 0) {
      return {
        title: "Keine aktiven Konversationen",
        description:
          "Die Arbeit steckt gerade eher in Freigaben als in offenen Verläufen. Sobald Antworten versendet werden, erscheint der Verlauf wieder hier.",
        actionLabel: uiActionCopy.approvalsReview,
        actionHref: "/app/zur-freigabe",
        actionVariant: "utility",
        learnLabel: "Statuslogik ansehen",
        learnHref: "#home-help",
      };
    }

    return {
      title: "Keine aktiven Konversationen",
      description:
        "Sobald wieder Aktivität entsteht, erscheinen laufende Gespräche hier automatisch. Im Moment ist kein Verlauf offen.",
      actionLabel: uiActionCopy.messagesReview,
      actionHref: "/app/nachrichten",
      actionVariant: "utility",
    };
  }, [shownKpis.approvals, shownKpis.newLeads]);

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

  const manualAttentionCount = useMemo(() => {
    return new Set([
      ...buckets.approvals.map((lead) => lead.id),
      ...buckets.highPriority.map((lead) => lead.id),
    ]).size;
  }, [buckets.approvals, buckets.highPriority]);

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
    trackDashboardAction("dashboard_autosend_toggle", {
      surface: "dashboard_live_controls",
      next_value: next,
    });
    trackSettingsToggleAttempt({
      source: "dashboard_home",
      path: "/app/startseite",
      routeKey: "dashboard_home",
      settingKey: "autosend_enabled",
      nextValue: next,
      surface: "dashboard_live_controls",
    });
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
      trackSettingsToggleSuccess({
        source: "dashboard_home",
        path: "/app/startseite",
        routeKey: "dashboard_home",
        settingKey: "autosend_enabled",
        nextValue: Boolean(data?.settings?.autosend_enabled ?? next),
        surface: "dashboard_live_controls",
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
    trackDashboardAction("dashboard_followups_toggle", {
      surface: "dashboard_live_controls",
      next_value: next,
    });
    trackSettingsToggleAttempt({
      source: "dashboard_home",
      path: "/app/startseite",
      routeKey: "dashboard_home",
      settingKey: "followups_enabled_default",
      nextValue: next,
      surface: "dashboard_live_controls",
    });
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
      trackSettingsToggleSuccess({
        source: "dashboard_home",
        path: "/app/startseite",
        routeKey: "dashboard_home",
        settingKey: "followups_enabled_default",
        nextValue: Boolean(data?.settings?.followups_enabled_default ?? next),
        surface: "dashboard_live_controls",
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
    trackDashboardAction("dashboard_safe_start_activate", {
      surface: "dashboard_quickstart",
    });
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
        label: uiActionCopy.starterActivate,
        hint: "Die Testphase ist beendet. Aktiviere Starter, damit Safe-Start und Versand wieder freigeschaltet sind.",
        primary: true,
      };
    }

    if (!quickstart.safeStartActive) {
      return {
        href: null,
        label: uiActionCopy.safeStartActivate,
        hint: "Setze zuerst Freigabe als Standard für Antworten und Follow-ups.",
        primary: true,
      };
    }

    if (shownKpis.approvals > 0) {
      return {
        href: "/app/zur-freigabe",
        label: uiActionCopy.approvalsReview,
        hint: "Dort liegen die nächsten klaren Entwürfe. Drei sichere Freigaben reichen für den First Value.",
        primary: true,
      };
    }

    if (shownKpis.open > 0) {
      return {
        href: "/app/nachrichten",
        label: uiActionCopy.messagesReview,
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

  const approvalLearningUi = useMemo(() => {
    const totalReviews = opsInsights?.approval_learning?.total_reviews ?? 0;
    const editedRate = opsInsights?.approval_learning?.edited_rate ?? 0;

    if (totalReviews === 0) {
      return {
        label: "Noch leer",
        tone: "neutral" as StatusTone,
      };
    }
    if (editedRate >= 0.45) {
      return {
        label: "Anpassen",
        tone: "warning" as StatusTone,
      };
    }
    if (editedRate >= 0.2) {
      return {
        label: "Lernt",
        tone: "brand" as StatusTone,
      };
    }
    return {
      label: "Stabil",
      tone: "success" as StatusTone,
    };
  }, [opsInsights?.approval_learning?.edited_rate, opsInsights?.approval_learning?.total_reviews]);

  const sendingHealthUi = useMemo(() => {
    const level = opsInsights?.sending_health?.level || "good";
    if (level === "critical") {
      return {
        label: "Kritisch",
        tone: "danger" as StatusTone,
      };
    }
    if (level === "watch") {
      return {
        label: "Auffällig",
        tone: "warning" as StatusTone,
      };
    }
    return {
      label: "Stabil",
      tone: "success" as StatusTone,
    };
  }, [opsInsights?.sending_health?.level]);

  const deliverabilityUi = useMemo(() => {
    const level = deliverability?.level || "ok";
    if (level === "critical") {
      return {
        label: "Kritisch",
        tone: "danger" as StatusTone,
      };
    }
    if (level === "warning") {
      return {
        label: "Auffällig",
        tone: "warning" as StatusTone,
      };
    }
    return {
      label: "Stabil",
      tone: "success" as StatusTone,
    };
  }, [deliverability?.level]);

  const automationSummaryUi = useMemo(() => {
    if (trialExpired) {
      return {
        label: "Plan nötig",
        tone: "danger" as StatusTone,
        detail:
          "Die Testphase ist beendet. Automatisierung bleibt pausiert, bis Starter aktiv ist.",
      };
    }

    if (autosendGate?.eligible && autosendEnabled) {
      return {
        label: "Automatisch aktiv",
        tone: "success" as StatusTone,
        detail:
          "Auto-Senden ist freigegeben und läuft innerhalb deiner Guardrails.",
      };
    }

    if (autosendGate?.eligible) {
      return {
        label: "Bereit",
        tone: "brand" as StatusTone,
        detail:
          "Auto-Senden ist freigegeben, aber aktuell pausiert. Du kannst es jederzeit aktivieren.",
      };
    }

    if (autosendGate?.reasons?.length) {
      return {
        label: "Mit Guardrails",
        tone: "warning" as StatusTone,
        detail:
          autosendGate.reasons[0] ||
          "Noch nicht alle Freigaben für Auto-Senden erfüllt.",
      };
    }

    return {
      label: "Wird geprüft",
      tone: "neutral" as StatusTone,
      detail: "Guardrail-Status wird geladen oder ist aktuell nicht verfügbar.",
    };
  }, [autosendEnabled, autosendGate, trialExpired]);

  const learningSummary =
    (opsInsights?.approval_learning?.recommended_actions || [])[0] ||
    (opsInsights?.approval_learning?.style_signals || [])[0] ||
    "Noch keine klaren Muster aus Freigaben vorhanden.";

  const sendingSummary =
    (opsInsights?.sending_health?.top_errors || []).length > 0
      ? `Häufigster Fehler: ${opsInsights?.sending_health?.top_errors?.[0]?.key} (${opsInsights?.sending_health?.top_errors?.[0]?.count})`
      : sendingHealthUi.label === "Kritisch"
        ? "Erst fehlgeschlagene Sendungen prüfen, danach die Queue abbauen."
        : sendingHealthUi.label === "Auffällig"
          ? "Fehlermuster täglich kurz prüfen."
          : "Der Versand läuft aktuell stabil.";

  const deliverabilitySummary =
    deliverability?.recommendations?.[0] ||
    "Keine Empfehlung verfügbar. Bitte später erneut prüfen.";

  const systemStatusBoard = useMemo(() => {
    const toneWeight: Record<StatusTone, number> = {
      danger: 4,
      warning: 3,
      brand: 2,
      neutral: 1,
      success: 0,
    };

    const signals = [
      {
        label: "Lernkurve",
        tone: approvalLearningUi.tone,
        summary: learningSummary,
      },
      {
        label: "Versand",
        tone: sendingHealthUi.tone,
        summary: sendingSummary,
      },
      {
        label: "Deliverability",
        tone: deliverabilityUi.tone,
        summary: deliverabilitySummary,
      },
    ] as const;

    const primary = signals.reduce((current, item) => {
      return toneWeight[item.tone] > toneWeight[current.tone] ? item : current;
    }, signals[0]);

    if (primary.tone === "danger") {
      return {
        tone: "danger" as StatusTone,
        label: "Sofort prüfen",
        title: `${primary.label} braucht heute zuerst Aufmerksamkeit`,
        detail: primary.summary,
      };
    }

    if (primary.tone === "warning") {
      return {
        tone: "warning" as StatusTone,
        label: "Beobachten",
        title: `${primary.label} ist auffällig`,
        detail: primary.summary,
      };
    }

    if (primary.tone === "brand") {
      return {
        tone: "brand" as StatusTone,
        label: "Im Aufbau",
        title: "Das System lernt sichtbar",
        detail: primary.summary,
      };
    }

    return {
      tone: "success" as StatusTone,
      label: "Stabil",
      title: "Betrieb läuft stabil",
      detail:
        "Lernkurve, Versand und Deliverability zeigen aktuell keine kritische Abweichung.",
    };
  }, [
    approvalLearningUi.tone,
    deliverabilitySummary,
    deliverabilityUi.tone,
    learningSummary,
    sendingHealthUi.tone,
    sendingSummary,
  ]);

  const sandboxStatusUi = useMemo(() => {
    if (sandboxCompleted) {
      return {
        tone: "success" as StatusTone,
        label: "Sandbox abgeschlossen",
      };
    }
    if (sandboxStarted) {
      return {
        tone: "warning" as StatusTone,
        label: "Sandbox läuft",
      };
    }
    return {
      tone: "neutral" as StatusTone,
      label: "Sandbox nicht gestartet",
    };
  }, [sandboxCompleted, sandboxStarted]);

  const autosendChecksPassed = useMemo(() => {
    return (autosendGate?.checks ?? []).filter((check) => check.ok).length;
  }, [autosendGate]);

  const quickstartSteps = [
    {
      number: 1,
      title: "Safe-Start setzen",
      statusLabel: trialExpired
        ? "Blockiert"
        : quickstart.safeStartActive
          ? "Erledigt"
          : "Offen",
      tone: trialExpired
        ? ("danger" as StatusTone)
        : quickstart.safeStartActive
          ? ("success" as StatusTone)
          : ("warning" as StatusTone),
      nextActionLabel: trialExpired
        ? uiActionCopy.starterActivate
        : quickstart.safeStartActive
          ? "Safe-Start ist aktiv"
          : uiActionCopy.safeStartActivate,
      expectedResult:
        "Neue Antworten und Follow-ups laufen zunächst sicher über Freigabe statt unkontrolliert automatisch.",
      action: trialExpired
        ? ({
            kind: "link",
            label: uiActionCopy.starterActivate,
            href: "/app/konto/abo?source=dashboard_quickstart_step1&next=%2Fapp%2Fstartseite",
            variant: "primary",
            onClick: () => {
              void trackFunnelEvent({
                event: "billing_upgrade_cta_clicked",
                source: "dashboard_quickstart_step1",
                path: "/app/startseite",
                meta: {
                  trial_state: billingAccess?.state || null,
                },
              });
            },
          } satisfies QuickstartStepAction)
        : quickstart.safeStartActive
          ? null
          : ({
              kind: "button",
              label: quickstartBusy
                ? uiActionCopy.safeStartActivating
                : uiActionCopy.safeStartActivate,
              onClick: applySafeStart,
              disabled: quickstartBusy || trialExpired,
              variant: "primary",
            } satisfies QuickstartStepAction),
    },
    {
      number: 2,
      title: "Drei sichere Antworten freigeben",
      statusLabel: trialExpired
        ? "Blockiert"
        : quickstart.done
          ? "Erledigt"
          : !quickstart.safeStartActive
            ? "Wartet"
            : shownKpis.approvals > 0
              ? "Jetzt möglich"
              : shownKpis.open > 0
                ? "In Vorbereitung"
                : "Warten",
      tone: trialExpired
        ? ("danger" as StatusTone)
        : quickstart.done
          ? ("success" as StatusTone)
          : !quickstart.safeStartActive
            ? ("neutral" as StatusTone)
            : shownKpis.approvals > 0
              ? ("brand" as StatusTone)
              : shownKpis.open > 0
                ? ("warning" as StatusTone)
                : ("neutral" as StatusTone),
      nextActionLabel: trialExpired
        ? uiActionCopy.starterActivate
        : quickstart.done
          ? "Drei sichere Antworten geschafft"
          : !quickstart.safeStartActive
            ? "Zuerst Safe-Start setzen"
            : shownKpis.approvals > 0
              ? uiActionCopy.approvalsReview
              : shownKpis.open > 0
                ? uiActionCopy.messagesReview
                : "Objekte ergänzen",
      expectedResult:
        "Nach drei sicheren Freigaben ist First Value erreicht und Advaic lernt sichtbar aus deinen Entscheidungen.",
      action: trialExpired
        ? ({
            kind: "link",
            label: uiActionCopy.starterActivate,
            href: "/app/konto/abo?source=dashboard_quickstart_step2&next=%2Fapp%2Fstartseite",
            variant: "primary",
            onClick: () => {
              void trackFunnelEvent({
                event: "billing_upgrade_cta_clicked",
                source: "dashboard_quickstart_step2",
                path: "/app/startseite",
                meta: {
                  trial_state: billingAccess?.state || null,
                },
              });
            },
          } satisfies QuickstartStepAction)
        : quickstart.done
          ? null
          : !quickstart.safeStartActive
            ? null
            : shownKpis.approvals > 0
              ? ({
                  kind: "link",
                  label: uiActionCopy.approvalsReview,
                  href: "/app/zur-freigabe",
                  variant: "primary",
                  onClick: () =>
                    trackDashboardAction("dashboard_open_approvals", {
                      surface: "dashboard_quickstart_step2",
                    }),
                } satisfies QuickstartStepAction)
              : shownKpis.open > 0
                ? ({
                    kind: "link",
                    label: uiActionCopy.messagesReview,
                    href: "/app/nachrichten",
                    variant: "secondary",
                    onClick: () =>
                      trackDashboardAction("dashboard_open_messages", {
                        surface: "dashboard_quickstart_step2",
                      }),
                  } satisfies QuickstartStepAction)
                : ({
                    kind: "link",
                    label: "Objekte ergänzen",
                    href: "/app/immobilien",
                    variant: "secondary",
                    onClick: () =>
                      trackDashboardAction("dashboard_open_properties", {
                        surface: "dashboard_quickstart_step2",
                      }),
                  } satisfies QuickstartStepAction),
    },
    {
      number: 3,
      title: "Automatisierung kontrolliert erhöhen",
      statusLabel: trialExpired
        ? "Blockiert"
        : !quickstart.done
          ? "Später"
          : autosendEnabled
            ? "Aktiv"
            : autosendGate?.eligible
              ? "Bereit"
              : "Mit Guardrails",
      tone: trialExpired
        ? ("danger" as StatusTone)
        : !quickstart.done
          ? ("neutral" as StatusTone)
          : autosendEnabled
            ? ("success" as StatusTone)
            : autosendGate?.eligible
              ? ("brand" as StatusTone)
              : ("warning" as StatusTone),
      nextActionLabel: trialExpired
        ? uiActionCopy.starterActivate
        : !quickstart.done
          ? "Erst Schritt 2 abschließen"
        : autosendEnabled
          ? "Auto-Senden läuft kontrolliert"
        : autosendGate?.eligible
              ? uiActionCopy.autosendActivate
              : "Guardrails weiter erfüllen",
      expectedResult:
        "Mehr Standardfälle laufen automatisch, während Guardrails unklare oder riskante Nachrichten weiter stoppen.",
      action: trialExpired
        ? ({
            kind: "link",
            label: uiActionCopy.starterActivate,
            href: "/app/konto/abo?source=dashboard_quickstart_step3&next=%2Fapp%2Fstartseite",
            variant: "primary",
            onClick: () => {
              void trackFunnelEvent({
                event: "billing_upgrade_cta_clicked",
                source: "dashboard_quickstart_step3",
                path: "/app/startseite",
                meta: {
                  trial_state: billingAccess?.state || null,
                },
              });
            },
          } satisfies QuickstartStepAction)
        : !quickstart.done
          ? null
          : autosendEnabled
            ? null
            : autosendGate?.eligible
              ? ({
                  kind: "button",
                  label: autosendBusy
                    ? uiActionCopy.autosendActivating
                    : uiActionCopy.autosendActivate,
                  onClick: toggleAutosend,
                  disabled: autosendBusy || trialExpired,
                  variant: "primary",
                } satisfies QuickstartStepAction)
              : null,
    },
  ] as const;

  if (loading) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] app-shell text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <PageHeader
          dataTour="home-hero"
          contentClassName="gap-3 pb-3 md:gap-4 md:pb-4"
          title={
            <h1 className="app-text-page-title truncate">
              {getGreeting()}
              {userName ? `, ${userName}!` : "!"}
            </h1>
          }
          meta={
            <>
              <StatusBadge tone={sendingHealthUi.tone} size="sm">
                Versand {sendingHealthUi.label}
              </StatusBadge>
              <StatusBadge tone={deliverabilityUi.tone} size="sm">
                Deliverability {deliverabilityUi.label}
              </StatusBadge>
            </>
          }
          description={
            <>
              <span className="md:hidden">Dein Überblick mit einer klaren nächsten Aktion.</span>
              <span className="hidden md:inline">
                Dein Tagesüberblick mit einer klaren nächsten Aktion.
              </span>
            </>
          }
          actions={
            quickstartNextAction.href ? (
              <Link
                href={quickstartNextAction.href}
                onClick={() => {
                  trackDashboardAction("dashboard_header_primary_cta", {
                    label: quickstartNextAction.label,
                    href: quickstartNextAction.href,
                    trial_expired: trialExpired,
                  });
                  void trackFunnelEvent({
                    event: "dashboard_quickstart_next_clicked",
                    source: "dashboard_header_primary",
                    meta: {
                      next_label: quickstartNextAction.label,
                      next_href: quickstartNextAction.href,
                      trial_expired: trialExpired,
                    },
                  });
                }}
                className={appButtonClass({
                  variant: "primary",
                  size: "sm",
                })}
              >
                {quickstartNextAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={applySafeStart}
                disabled={quickstartBusy || trialExpired}
                className={appButtonClass({
                  variant: "primary",
                  size: "sm",
                })}
              >
                {quickstartBusy
                  ? uiActionCopy.safeStartActivating
                  : quickstartNextAction.label}
              </button>
            )
          }
        />

        <div className="app-page-section app-page-stack">
          <SectionCard
            surface="panel"
            title={
              <span className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-gray-700" />
                Heute wichtig
              </span>
            }
            description={
              <>
                <span className="md:hidden">Dein Startmodul für heute.</span>
                <span className="hidden md:inline">
                  Schnellstart, Planstatus und Autopilot-Entscheidung sind hier zu einem einzigen Startmodul zusammengezogen.
                </span>
              </>
            }
            meta={
              <StatusBadge
                tone={trialExpired ? "danger" : quickstart.done ? "success" : "brand"}
                size="sm"
              >
                {trialExpired
                  ? "Aktion nötig"
                  : quickstart.done
                    ? "First Value erreicht"
                    : "Im Safe-Start"}
              </StatusBadge>
            }
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
              <div
                id="quickstart"
                data-tour="dashboard-quickstart"
                className={`rounded-2xl border app-panel-padding ${
                  quickstart.done
                    ? statusSurfaceClass("success")
                    : statusSurfaceClass("warning")
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-gray-700" />
                      <div className="app-text-section-title text-gray-900">
                        Schnellstart: Erste 3 sichere Antworten
                      </div>
                    </div>
                    <div className="app-text-helper mt-1 text-gray-700">
                      <span className="md:hidden">
                        Erst konservativ starten, dann kontrolliert mehr Automatisierung freigeben.
                      </span>
                      <span className="hidden md:inline">
                        Du startest konservativ, gibst die ersten Antworten manuell
                        frei und siehst so echten Nutzen, bevor mehr Automatisierung
                        aktiv wird.
                      </span>
                    </div>
                  </div>
                  <StatusBadge tone={quickstart.done ? "success" : "warning"} size="sm">
                    {quickstart.progress}/{quickstart.target} freigegeben
                  </StatusBadge>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/80">
                  <div
                    className={`h-full rounded-full transition-all ${
                      quickstart.done ? "bg-emerald-600" : "bg-gray-900"
                    }`}
                    style={{ width: `${quickstart.progressPct}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 text-xs md:hidden">
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">Nächster Schritt</div>
                        <div className="mt-1 text-gray-700">{quickstartNextAction.hint}</div>
                      </div>
                      <StatusBadge
                        tone={trialExpired ? "danger" : quickstart.done ? "success" : "brand"}
                        size="sm"
                      >
                        {trialExpired ? "Plan nötig" : quickstart.done ? "Erreicht" : "Läuft"}
                      </StatusBadge>
                    </div>
                    <div className="mt-3">
                      {quickstartNextAction.href ? (
                        <Link
                          href={quickstartNextAction.href}
                          onClick={() => {
                            trackDashboardAction("dashboard_mobile_next_cta", {
                              label: quickstartNextAction.label,
                              href: quickstartNextAction.href,
                              trial_expired: trialExpired,
                            });
                          }}
                          className={appButtonClass({
                            variant: quickstartNextAction.primary ? "primary" : "secondary",
                            size: "sm",
                            className: "w-full justify-center",
                          })}
                        >
                          {quickstartNextAction.label}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={applySafeStart}
                          disabled={quickstartBusy || trialExpired}
                          className={appButtonClass({
                            variant: "primary",
                            size: "sm",
                            className: "w-full justify-center",
                          })}
                        >
                          {quickstartBusy
                            ? uiActionCopy.safeStartActivating
                            : quickstartNextAction.label}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-800">
                      <div className="font-medium text-gray-900">Planstatus</div>
                      <div className="mt-1 text-gray-700">
                        {billingAccess?.state === "paid_active"
                          ? "Starter aktiv"
                          : trialExpired
                            ? "Testphase beendet"
                            : `${billingAccess?.trial_days_remaining ?? 0} Tage übrig`}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-800">
                      <div className="font-medium text-gray-900">Autopilot</div>
                      <div className="mt-1 text-gray-700">{automationSummaryUi.label}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 hidden grid-cols-1 gap-2 text-xs sm:grid-cols-3 md:grid">
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800">
                    <div className="font-medium text-gray-900">
                      {billingAccess?.state === "paid_active"
                        ? "Starter aktiv"
                        : trialExpired
                          ? "Testphase beendet"
                          : "Testphase aktiv"}
                    </div>
                    <div className="mt-1 text-gray-700">
                      {billingAccess?.state === "paid_active"
                        ? "Plan ist aktiv und freigeschaltet."
                        : trialExpired
                          ? "Upgrade nötig, damit Versand wieder aktiv wird."
                          : `Noch ${billingAccess?.trial_days_remaining ?? 0} Tage verfügbar.`}
                    </div>
                    {billingAccess?.state !== "paid_active" ? (
                      <div className="mt-2">
                        <Link
                          href="/app/konto/abo?source=dashboard_trial_card&next=%2Fapp%2Fstartseite"
                          onClick={() => {
                            void trackFunnelEvent({
                              event: "billing_upgrade_cta_clicked",
                              source: "dashboard_trial_card",
                              path: "/app/startseite",
                              meta: {
                                trial_state: billingAccess?.state || null,
                                trial_days_remaining:
                                  billingAccess?.trial_days_remaining ?? null,
                              },
                            });
                          }}
                          className="text-xs font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700"
                        >
                          {uiActionCopy.starterActivate}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-gray-900">Autopilot jetzt</span>
                      <StatusBadge tone={automationSummaryUi.tone} size="sm">
                        {automationSummaryUi.label}
                      </StatusBadge>
                    </div>
                    <div className="mt-1 text-gray-700">{automationSummaryUi.detail}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800">
                    <div className="font-medium text-gray-900">Sicherheitsfortschritt</div>
                    <div className="mt-1 text-gray-700">
                      {quickstart.safeStartActive
                        ? "Safe-Start aktiv."
                        : "Safe-Start noch offen."}{" "}
                      {formatCountLabel(shownKpis.approvals, "Freigabe", "Freigaben")} offen,{" "}
                      {quickstart.progress >= 1 || autoReplies30d > 0
                        ? "First Value erreicht."
                        : "First Value noch offen."}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-gray-200 bg-white app-panel-padding-compact">
                  <div data-tour="home-stats" className="mb-4 grid grid-cols-2 gap-2 md:hidden">
                    <KpiCard
                      title="Neue Leads"
                      value={loading ? "–" : String(shownKpis.newLeads)}
                      hint={
                        shownKpis.newLeads > 0
                          ? `${formatCountLabel(shownKpis.newLeads, "Lead", "Leads")} neu.`
                          : "Keine neuen Leads."
                      }
                      icon={<Sparkles className="h-4 w-4" />}
                      compact
                    />
                    <KpiCard
                      title="Aufmerksamkeit"
                      value={loading ? "–" : String(manualAttentionCount)}
                      hint={
                        manualAttentionCount > 0
                          ? `${formatCountLabel(shownKpis.approvals, "Freigabe", "Freigaben")} + ${formatCountLabel(shownKpis.high, "Fall", "Fälle")}.`
                          : "Kein akuter Druck."
                      }
                      icon={<ShieldAlert className="h-4 w-4" />}
                      compact
                    />
                    <KpiCard
                      title="Auto-Anteil"
                      value={loading ? "–" : `${roi.automationShare}%`}
                      hint={
                        autoReplies30d > 0
                          ? `${autoReplies30d} Auto-Antworten.`
                          : "Noch keine Auto-Antwort."
                      }
                      icon={<Rocket className="h-4 w-4" />}
                      compact
                    />
                    <KpiCard
                      title="Zeitgewinn"
                      value={loading ? "–" : timeSaved30d === "–" ? "0 Min" : timeSaved30d}
                      hint={
                        roi.minutesSaved > 0
                          ? `${roi.minutesSaved} Min realisiert.`
                          : quickstart.done
                            ? "Mehr Auto bringt jetzt Zeitgewinn."
                            : "Noch kein Zeitgewinn sichtbar."
                      }
                      icon={<Clock className="h-4 w-4" />}
                      compact
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="app-text-meta-label text-gray-900">
                        So gehst du jetzt vor
                      </div>
                      <div className="app-text-helper mt-1 text-gray-700">
                        <span className="md:hidden">
                          Drei Schritte, aber mobil erst bei Bedarf im Detail.
                        </span>
                        <span className="hidden md:inline">
                          Der Schnellstart ist bewusst als drei aufeinander folgende Schritte aufgebaut.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuickstartPlanMobile((prev) => !prev)}
                      className={appButtonClass({
                        variant: "utility",
                        size: "sm",
                        className: "shrink-0 md:hidden",
                      })}
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          showQuickstartPlanMobile && "rotate-180",
                        )}
                      />
                      {showQuickstartPlanMobile ? "Schritte ausblenden" : "Schritte anzeigen"}
                    </button>
                  </div>

                  <div
                    className={cn(
                      "mt-3 flex-col gap-3 md:flex",
                      showQuickstartPlanMobile ? "flex" : "hidden",
                    )}
                  >
                    {quickstartSteps.map((step) => (
                      <QuickstartStepRow
                        key={step.number}
                        step={step.number}
                        title={step.title}
                        statusLabel={step.statusLabel}
                        tone={step.tone}
                        nextActionLabel={step.nextActionLabel}
                        expectedResult={step.expectedResult}
                        action={step.action}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-4">
                  <button
                    type="button"
                    onClick={toggleFollowups}
                    disabled={followupsEnabled === null || followupsBusy || trialExpired}
                    className={appButtonClass({
                      variant: followupsEnabled ? "secondary" : "utility",
                      size: "sm",
                    })}
                    title={
                      trialExpired
                        ? `Testphase beendet: bitte ${uiActionCopy.starterActivate.toLowerCase()}`
                        : followupsEnabled
                          ? "Follow-ups sind aktiv (klicken zum Pausieren)"
                          : "Follow-ups sind pausiert (klicken zum Aktivieren)"
                    }
                  >
                    <AlarmClock className="h-4 w-4" />
                    <span className="md:hidden">{followupsEnabled ? "Follow-ups AN" : "Follow-ups AUS"}</span>
                    <span className="hidden md:inline">
                      {followupsEnabled ? "Follow-ups: AN" : "Follow-ups: AUS"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => load({ silent: true })}
                    className={appButtonClass({
                      variant: "utility",
                      size: "sm",
                    })}
                    title="Aktualisieren"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Aktualisieren
                  </button>
                </div>

                <div className="app-text-helper mt-3 hidden text-gray-700 md:block">
                  {quickstart.done
                    ? "Die ersten sicheren Antworten sind geschafft. Schritt 3 ist jetzt bewusst der nächste Hebel."
                    : "Der Flow bleibt absichtlich strikt: erst Safe-Start, dann drei sichere Freigaben, dann kontrolliert mehr Automatisierung."}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div data-tour="home-stats-desktop" className="hidden grid-cols-2 gap-2 sm:gap-3 md:grid">
                  <KpiCard
                    title="Neue Leads (48 Std.)"
                    value={loading ? "–" : String(shownKpis.newLeads)}
                    hint={
                      <>
                        <span className="md:hidden">
                          {shownKpis.newLeads > 0
                            ? `${formatCountLabel(shownKpis.newLeads, "neuer Lead", "neue Leads")} neu.`
                            : "Keine neuen Leads."}
                        </span>
                        <span className="hidden md:inline">
                          {shownKpis.newLeads > 0
                            ? `${formatCountLabel(shownKpis.newLeads, "neuer Lead", "neue Leads")} in den letzten 48 Stunden. Die Inbox sollte heute aktiv geprüft werden.`
                            : "In den letzten 48 Stunden ist kein neuer Lead eingegangen."}
                        </span>
                      </>
                    }
                    icon={<Sparkles className="h-4 w-4" />}
                    compact
                  />
                  <KpiCard
                    title="Manuelle Aufmerksamkeit heute"
                    value={loading ? "–" : String(manualAttentionCount)}
                    hint={
                      <>
                        <span className="md:hidden">
                          {manualAttentionCount > 0
                            ? `${formatCountLabel(shownKpis.approvals, "Freigabe", "Freigaben")} + ${formatCountLabel(shownKpis.high, "Fall", "Fälle")}.`
                            : "Kein akuter Druck."}
                        </span>
                        <span className="hidden md:inline">
                          {manualAttentionCount > 0
                            ? `Darin enthalten: ${formatCountLabel(shownKpis.approvals, "Freigabe", "Freigaben")} und ${formatCountLabel(shownKpis.high, "priorisierter Fall", "priorisierte Fälle")}.`
                            : "Aktuell ist kein manueller Arbeitsdruck aus Freigaben oder hoher Priorität sichtbar."}
                        </span>
                      </>
                    }
                    icon={<ShieldAlert className="h-4 w-4" />}
                    compact
                  />
                  <KpiCard
                    title="Automatisierungsgrad"
                    value={loading ? "–" : `${roi.automationShare}%`}
                    hint={
                      <>
                        <span className="md:hidden">
                          {autoReplies30d > 0
                            ? `${autoReplies30d} Auto-Antworten.`
                            : "Noch keine Auto-Antwort."}
                        </span>
                        <span className="hidden md:inline">
                          {autoReplies30d > 0
                            ? `${autoReplies30d} Antworten wurden in den letzten 30 Tagen ohne Freigabe versendet.`
                            : "Noch keine sichere Auto-Antwort in den letzten 30 Tagen."}
                        </span>
                      </>
                    }
                    icon={<Rocket className="h-4 w-4" />}
                    compact
                  />
                  <KpiCard
                    title="Zeitgewinn bisher"
                    value={loading ? "–" : timeSaved30d === "–" ? "0 Min" : timeSaved30d}
                    hint={
                      <>
                        <span className="md:hidden">
                          {roi.minutesSaved > 0
                            ? `${roi.minutesSaved} Min realisiert.`
                            : quickstart.done
                              ? "Mehr Auto bringt jetzt Zeitgewinn."
                              : "Noch kein Zeitgewinn sichtbar."}
                        </span>
                        <span className="hidden md:inline">
                          {roi.minutesSaved > 0
                            ? `${roi.minutesSaved} Minuten konservativ realisiert, ${roi.realizedShare}% des aktuellen Potenzials.`
                            : quickstart.done
                              ? "First Value ist erreicht. Mehr Automatisierung hebt jetzt den Zeitgewinn."
                              : "Sobald sichere Auto-Antworten laufen, wird der Zeitgewinn hier sichtbar."}
                        </span>
                      </>
                    }
                    icon={<Clock className="h-4 w-4" />}
                    compact
                  />
                </div>

                <div className="rounded-2xl border app-surface-card app-panel-padding-compact">
                  <div className="app-text-meta-label text-gray-900">
                    Heute priorisieren
                  </div>
                  <div className="mt-3 flex flex-col gap-2 text-sm text-gray-800">
                    <div className="flex items-start justify-between gap-3 rounded-xl border app-surface-muted px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">Freigaben zuerst</div>
                        <div className="app-text-helper mt-1">
                          {shownKpis.approvals > 0
                            ? "Hier liegen die sichersten nächsten Antworten."
                            : "Aktuell wartet nichts auf Freigabe."}
                        </div>
                      </div>
                      <StatusBadge tone="warning" size="sm">
                        {shownKpis.approvals}
                      </StatusBadge>
                    </div>

                    <div className="flex items-start justify-between gap-3 rounded-xl border app-surface-muted px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">Hohe Priorität</div>
                        <div className="app-text-helper mt-1">
                          {shownKpis.high > 0
                            ? "Diese Kontakte solltest du vor dem Rest prüfen."
                            : "Keine dringenden Fälle mit hoher Priorität."}
                        </div>
                      </div>
                      <StatusBadge tone="danger" size="sm">
                        {shownKpis.high}
                      </StatusBadge>
                    </div>

                    <div className="flex items-start justify-between gap-3 rounded-xl border app-surface-muted px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">Offene Konversationen</div>
                        <div className="app-text-helper mt-1">
                          {shownKpis.open > 0
                            ? "Die Inbox ist aktiv und liefert neue Fälle."
                            : "Aktuell gibt es keine offenen Gespräche."}
                        </div>
                      </div>
                      <StatusBadge tone="brand" size="sm">
                        {shownKpis.open}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <div data-tour="dashboard-system-health">
            <SectionCard
              surface="panel"
              title={
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gray-700" />
                  Systemstatus
                </span>
              }
              description="Drei kurze Signale für Lernkurve, Versand und Zustellbarkeit, damit du den Betriebszustand sofort erfassen kannst."
              meta={
                <>
                  <StatusBadge tone={sendingHealthUi.tone} size="sm">
                    Versand {sendingHealthUi.label}
                  </StatusBadge>
                  <StatusBadge tone={deliverabilityUi.tone} size="sm">
                    Deliverability {deliverabilityUi.label}
                  </StatusBadge>
                </>
              }
            >
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div
                  className={`rounded-2xl border app-panel-padding ${statusSurfaceClass(systemStatusBoard.tone)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="app-text-meta-label text-gray-900">
                        Gesamtlage heute
                      </div>
                      <div className="mt-1 text-lg font-semibold text-gray-900">
                        {systemStatusBoard.title}
                      </div>
                    </div>
                    <StatusBadge tone={systemStatusBoard.tone} size="sm">
                      {systemStatusBoard.label}
                    </StatusBadge>
                  </div>

                  <div className="app-text-helper mt-3 text-gray-700">
                    {systemStatusBoard.detail}
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between rounded-xl border bg-white/80 px-3 py-2">
                      <span className="text-sm font-medium text-gray-900">Lernkurve</span>
                      <StatusBadge tone={approvalLearningUi.tone} size="sm">
                        {approvalLearningUi.label}
                      </StatusBadge>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border bg-white/80 px-3 py-2">
                      <span className="text-sm font-medium text-gray-900">Versand</span>
                      <StatusBadge tone={sendingHealthUi.tone} size="sm">
                        {sendingHealthUi.label}
                      </StatusBadge>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border bg-white/80 px-3 py-2">
                      <span className="text-sm font-medium text-gray-900">Deliverability</span>
                      <StatusBadge tone={deliverabilityUi.tone} size="sm">
                        {deliverabilityUi.label}
                      </StatusBadge>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href="/app/ton-und-stil"
                      onClick={() =>
                        trackDashboardAction("dashboard_open_tone_style", {
                          surface: "dashboard_system_status",
                        })
                      }
                      className={appButtonClass({ variant: "secondary", size: "sm" })}
                    >
                      Ton & Stil öffnen
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border app-surface-card app-panel-padding-compact">
                  <div className="flex flex-col gap-3">
                    <SystemStatusSignalRow
                      title="Lernkurve aus Freigaben"
                      tone={approvalLearningUi.tone}
                      label={approvalLearningUi.label}
                      summary={learningSummary}
                      metrics={[
                        {
                          label: "Geprüft",
                          value: String(opsInsights?.approval_learning?.total_reviews ?? 0),
                        },
                        {
                          label: "Änderungsquote",
                          value: toPct(opsInsights?.approval_learning?.edited_rate),
                        },
                        {
                          label: "Fenster",
                          value: `${opsInsights?.approval_learning?.window_days ?? 30} Tage`,
                        },
                      ]}
                      action={{
                        label: uiActionCopy.approvalsReview,
                        href: "/app/zur-freigabe",
                        onClick: () =>
                          trackDashboardAction("dashboard_open_approvals", {
                            surface: "dashboard_learning_status",
                          }),
                      }}
                    />

                    <SystemStatusSignalRow
                      title="Versandgesundheit"
                      tone={sendingHealthUi.tone}
                      label={sendingHealthUi.label}
                      summary={sendingSummary}
                      metrics={[
                        {
                          label: "Gesendet",
                          value: String(opsInsights?.sending_health?.sent_7d ?? 0),
                        },
                        {
                          label: "Fehlerquote",
                          value: toPct(opsInsights?.sending_health?.fail_rate_7d),
                        },
                        {
                          label: "Queue",
                          value: String(opsInsights?.sending_health?.queue_open ?? 0),
                        },
                      ]}
                    />

                    <SystemStatusSignalRow
                      title="Deliverability"
                      tone={deliverabilityUi.tone}
                      label={deliverabilityUi.label}
                      summary={deliverabilitySummary}
                      metrics={[
                        {
                          label: "Fehler 24h",
                          value: String(
                            deliverability?.summary?.deliverability_like_failures_24h ?? 0,
                          ),
                        },
                        {
                          label: "Quote 7 Tage",
                          value: toPct(deliverability?.summary?.fail_rate_7d),
                        },
                        {
                          label: "DMARC",
                          value: deliverability?.dmarc_policy || "–",
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div data-tour="home-shortcuts">
            <SectionCard
              surface="panel"
              title={
                <span className="flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-gray-700" />
                  Zu bearbeiten
                </span>
              }
              description="Die drei wichtigsten Arbeitsstapel auf einen Blick, damit du nicht erst durch einzelne Karten scannen musst."
              meta={
                <StatusBadge tone="warning" size="sm">
                  {shownKpis.approvals + shownKpis.high + shownKpis.open} offen
                </StatusBadge>
              }
            >
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.85fr)]">
                <QueueCard
                  title="Freigaben zuerst"
                  description="Hier liegen die sichersten nächsten Antworten. Diese Queue sollte vor allem anderen leer werden."
                  emptyState={approvalsEmptyState}
                  leads={buckets.approvals}
                  lastMessages={lastMessages}
                  messageCounts={messageCounts}
                  href="/app/zur-freigabe"
                  hrefLabel={uiActionCopy.approvalsReview}
                  tone="warning"
                  focusApproval
                  variant="primary"
                  previewLimit={4}
                  onActionClick={() =>
                    trackDashboardAction("dashboard_open_approvals", {
                      surface: "dashboard_queue_primary",
                    })
                  }
                  onPreviewOpen={(leadId) =>
                    trackDashboardAction("dashboard_open_queue_item", {
                      surface: "dashboard_queue_primary",
                      lead_id: leadId,
                      focus_approval: true,
                    })
                  }
                />
                <div className="flex flex-col gap-4">
                  <QueueCard
                    title="Hohe Priorität"
                    description="Danach kommen die Fälle, die heute echte Aufmerksamkeit brauchen."
                    emptyState={highPriorityEmptyState}
                    leads={buckets.highPriority}
                    lastMessages={lastMessages}
                    messageCounts={messageCounts}
                    href="/app/nachrichten"
                    hrefLabel={uiActionCopy.messagesReview}
                    tone="danger"
                    variant="secondary"
                    previewLimit={2}
                    onActionClick={() =>
                      trackDashboardAction("dashboard_open_messages", {
                        surface: "dashboard_queue_high_priority",
                      })
                    }
                    onPreviewOpen={(leadId) =>
                      trackDashboardAction("dashboard_open_queue_item", {
                        surface: "dashboard_queue_high_priority",
                        lead_id: leadId,
                        focus_approval: false,
                      })
                    }
                  />
                  <QueueCard
                    title="Letzte Konversationen"
                    description="Nur für schnellen Wiedereinstieg, nicht als primäre Arbeitsqueue."
                    emptyState={conversationsEmptyState}
                    leads={buckets.openConversations}
                    lastMessages={lastMessages}
                    messageCounts={messageCounts}
                    href="/app/nachrichten"
                    hrefLabel={uiActionCopy.conversationsOpen}
                    tone="neutral"
                    variant="tertiary"
                    previewLimit={2}
                    compactItems
                    onActionClick={() =>
                      trackDashboardAction("dashboard_open_messages", {
                        surface: "dashboard_queue_recent",
                      })
                    }
                    onPreviewOpen={(leadId) =>
                      trackDashboardAction("dashboard_open_queue_item", {
                        surface: "dashboard_queue_recent",
                        lead_id: leadId,
                        focus_approval: false,
                      })
                    }
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div
            className="grid grid-cols-1 xl:grid-cols-3 gap-4"
            data-tour="dashboard-automation-control"
          >
            <div className="xl:col-span-2 rounded-2xl border app-surface-panel app-panel-padding">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="app-text-section-title text-gray-900">
                    Automationsdetails
                  </div>
                  <div className="app-text-helper mt-1">
                    Hier liegen die Detailansicht zu Guardrails und Sandbox, nicht mehr die primäre Startentscheidung.
                  </div>
                </div>
                <StatusBadge tone="neutral">
                  Details
                </StatusBadge>
              </div>

              <div
                className={`mt-4 rounded-xl border app-panel-padding-compact ${statusSurfaceClass(automationSummaryUi.tone)}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="app-text-meta-label text-gray-900">
                      Outcome zuerst
                    </div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {automationSummaryUi.detail}
                    </div>
                  </div>
                  <StatusBadge tone={automationSummaryUi.tone} size="sm">
                    {automationSummaryUi.label}
                  </StatusBadge>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border bg-white/80 px-3 py-2">
                    <div className="text-xs text-gray-500">Guardrails erfüllt</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {autosendChecksPassed}/{autosendGate?.checks?.length ?? 0}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-white/80 px-3 py-2">
                    <div className="text-xs text-gray-500">Follow-ups</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {followupsEnabled ? "Aktiv" : "Pausiert"}
                    </div>
                  </div>
                  <div className="rounded-xl border bg-white/80 px-3 py-2">
                    <div className="text-xs text-gray-500">Sandbox</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {sandboxProgress.coreVisited}/{sandboxProgress.coreTotal}{" "}
                      {sandboxProgress.coreTotal === 1 ? "Kernfall" : "Kernfälle"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {trialExpired ? (
                    <Link
                      href="/app/konto/abo?source=dashboard_automation_summary&next=%2Fapp%2Fstartseite"
                      className={appButtonClass({ variant: "primary", size: "sm" })}
                    >
                      {uiActionCopy.starterActivate}
                    </Link>
                  ) : quickstart.done && autosendGate?.eligible && !autosendEnabled ? (
                    <button
                      type="button"
                      onClick={toggleAutosend}
                      disabled={autosendBusy}
                      className={appButtonClass({ variant: "primary", size: "sm" })}
                    >
                      {autosendBusy
                        ? uiActionCopy.autosendActivating
                        : uiActionCopy.autosendActivate}
                    </button>
                  ) : shownKpis.approvals > 0 ? (
                    <Link
                      href="/app/zur-freigabe"
                      className={appButtonClass({ variant: "secondary", size: "sm" })}
                    >
                      {uiActionCopy.approvalsReview}
                    </Link>
                  ) : (
                    <Link
                      href="/app/nachrichten"
                      className={appButtonClass({ variant: "secondary", size: "sm" })}
                    >
                      {uiActionCopy.messagesReview}
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowGuardrailDetails((current) => !current)}
                    className={appButtonClass({ variant: "utility", size: "sm" })}
                    aria-expanded={showGuardrailDetails}
                  >
                    Guardrails
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showGuardrailDetails ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSandboxDetails((current) => !current)}
                    className={appButtonClass({ variant: "utility", size: "sm" })}
                    aria-expanded={showSandboxDetails}
                  >
                    Sandbox
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showSandboxDetails ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {showGuardrailDetails ? (
                <div className="mt-4 rounded-xl border app-surface-card app-panel-padding-compact">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="app-text-section-title text-gray-900">
                        Guardrails & Entscheidungen
                      </div>
                      <div className="app-text-helper mt-1">
                        Nur öffnen, wenn du nachvollziehen willst, warum Auto-Senden schon freigegeben ist oder noch blockiert bleibt.
                      </div>
                    </div>
                    <StatusBadge tone={automationSummaryUi.tone} size="sm">
                      {autosendChecksPassed}/{autosendGate?.checks?.length ?? 0}
                    </StatusBadge>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {(autosendGate?.checks ?? []).map((check) => (
                      <div
                        key={check.key}
                        className="rounded-xl border app-surface-muted px-3 py-2"
                      >
                        <div className="flex items-start gap-2">
                          {check.ok ? (
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-4 w-4 mt-0.5 text-amber-700" />
                          )}
                          <div className="min-w-0">
                            <div className="app-text-section-title text-gray-900">
                              {check.label}
                            </div>
                            {check.detail ? (
                              <div className="app-text-helper mt-1">
                                {check.detail}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                    {!autosendGate && (
                      <div className="md:col-span-2 rounded-xl border app-surface-muted px-3 py-2 app-text-helper text-gray-600">
                        Gate-Informationen werden geladen oder sind aktuell nicht
                        verfügbar.
                      </div>
                    )}
                  </div>

                  {autosendGate?.reasons?.length ? (
                    <div
                      className={`mt-3 rounded-xl border px-3 py-2 ${statusSurfaceClass("warning")}`}
                    >
                      <div className="text-xs font-medium text-amber-900">
                        Noch gesperrt, weil:
                      </div>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-900/90">
                        {autosendGate.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {showSandboxDetails ? (
                <div className="mt-4 rounded-xl border app-surface-card app-panel-padding-compact">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="app-text-section-title text-gray-900">
                          First-Value-Sandbox
                        </div>
                        <div className="app-text-helper mt-1">
                          Nur öffnen, wenn du Testfälle Schritt für Schritt durchspielen willst.
                        </div>
                      </div>
                    </div>
                    <StatusBadge tone={sandboxStatusUi.tone} size="sm">
                      {sandboxStatusUi.label}
                    </StatusBadge>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        sandboxCompleted ? "bg-emerald-600" : "bg-gray-900"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, sandboxProgress.pct))}%` }}
                    />
                  </div>

                  <div className="mt-3 flex flex-col gap-2 md:flex-row">
                    <select
                      value={simulationCase}
                      onChange={(e) => onSimulationCaseChange(e.target.value as SimulationCaseKey)}
                      className="flex-1 rounded-lg border app-field px-3 py-2 text-sm"
                    >
                      {SIMULATION_CASES.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`inline-flex items-center rounded-lg border px-3 py-2 text-xs font-medium ${statusBadgeClass(simulationResult.tone)}`}
                    >
                      Entscheidung: {simulationResult.decision}
                    </span>
                  </div>

                  <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-gray-700">
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
                              ? statusSurfaceClass("success")
                              : statusSurfaceClass("neutral")
                          }`}
                        >
                          {checked ? "✓ " : "○ "}
                          {item?.label || key}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border app-surface-panel app-panel-padding">
              <div className="flex items-center justify-between gap-2">
                <div className="app-text-section-title text-gray-900">
                  ROI-Fortschritt
                </div>
                <BarChart3 className="h-4 w-4 text-gray-500" />
              </div>
              <div className="app-text-helper mt-2">
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
                <div className="rounded-xl border app-surface-muted p-2">
                  <div className="text-gray-500">Freigaben offen</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {roi.approvalsOpen}
                  </div>
                </div>
                <div className="rounded-xl border app-surface-muted p-2">
                  <div className="text-gray-500">Zeit gespart</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {timeSaved30d}
                  </div>
                </div>
              </div>

              <div className="app-text-helper mt-3">
                Realisiert: {roi.minutesSaved} von {roi.potentialMinutes} Minuten
                Potenzial im aktuellen Mix ({roi.realizedShare}%).
              </div>
            </div>
          </div>

          <div id="home-help" data-tour="home-help" className="rounded-2xl border app-surface-card app-panel-padding">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 app-text-section-title text-gray-900">
                  <Info className="h-4 w-4 text-gray-600" />
                  Hilfe & Regeln
                </div>
                <div className="app-text-helper mt-1 text-gray-700">
                  Nur öffnen, wenn du Statuslogik oder DSGVO-Hinweise nachschlagen willst. Die tägliche Arbeit bleibt bewusst oberhalb dieses Bereichs.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpDetails((current) => !current)}
                className={appButtonClass({ variant: "utility", size: "sm" })}
                aria-expanded={showHelpDetails}
              >
                Status & DSGVO
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showHelpDetails ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {!showHelpDetails ? (
              <div className="mt-4 rounded-xl border app-surface-muted px-3 py-3">
                <div className="text-sm font-medium text-gray-900">
                  Nachschlagehilfe statt Primärinhalt
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  Hier liegen nur Erklärungen zu Statusbegriffen, Freigabe-Logik und Datenschutz. Entscheidungen, KPIs und Arbeitsqueues bleiben dadurch im oberen Bereich fokussiert.
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border app-surface-muted app-panel-padding-compact">
                  <div className="flex items-center gap-2 app-text-section-title text-gray-900">
                    <Info className="h-4 w-4 text-gray-600" />
                    Was bedeuten die Status im Alltag?
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-700">
                    <div className="rounded-xl border bg-white px-3 py-3">
                      <span className="font-medium">Auto gesendet:</span> klare Standardanfrage, Sicherheitschecks bestanden, direkt versendet.
                    </div>
                    <div className="rounded-xl border bg-white px-3 py-3">
                      <span className="font-medium">Zur Freigabe:</span> unklarer oder riskanter Fall, bevor eine Antwort rausgeht.
                    </div>
                    <div className="rounded-xl border bg-white px-3 py-3">
                      <span className="font-medium">Ignoriert:</span> Newsletter, Systemmail oder no-reply ohne Interessentenbezug.
                    </div>
                    <div className="rounded-xl border bg-white px-3 py-3">
                      <span className="font-medium">Fehlgeschlagen:</span> Versand technisch nicht durchgelaufen, manuell prüfbar und erneut sendbar.
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border app-surface-muted app-panel-padding-compact">
                  <div className="flex items-center gap-2 app-text-section-title text-gray-900">
                    <ShieldCheck className="h-4 w-4 text-gray-600" />
                    Sicherheit & DSGVO im Betrieb
                  </div>
                  <p className="app-text-helper mt-2 text-gray-700">
                    Advaic ist auf DSGVO-konforme Prozesse ausgelegt: klare Zweckbindung, nachvollziehbare Status-Historie und manuelle Kontrolle bei unklaren Fällen.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-700 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                    <div className="rounded-xl border bg-white px-3 py-3">
                      <span className="font-medium">Im Zweifel Freigabe:</span> Kein blindes Auto-Senden bei Risiko.
                    </div>
                    <div className="rounded-xl border bg-white px-3 py-3">
                      <span className="font-medium">Nachvollziehbarkeit:</span> Verlauf mit Status und Zeitstempeln.
                    </div>
                    <div className="rounded-xl border bg-white px-3 py-3">
                      <span className="font-medium">Betroffenenrechte:</span> Datenexport und Löschpfad sind vorhanden.
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <Link
                      href="/datenschutz"
                      className="text-gray-700 underline underline-offset-4 hover:text-gray-900"
                    >
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
              </div>
            )}
          </div>

          <div data-tour="home-tip" className="app-text-helper text-gray-500">
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
  compact = false,
}: {
  title: string;
  value: string;
  hint: ReactNode;
  icon: ReactNode;
  compact?: boolean;
}) {
  return <StatCard title={title} value={value} hint={hint} icon={icon} compact={compact} />;
}

function QuickstartStepRow({
  step,
  title,
  statusLabel,
  tone,
  nextActionLabel,
  expectedResult,
  action,
}: {
  step: number;
  title: string;
  statusLabel: string;
  tone: StatusTone;
  nextActionLabel: string;
  expectedResult: string;
  action: QuickstartStepAction | null;
}) {
  return (
    <div className="rounded-xl border app-surface-muted px-3 py-3">
      <div className="flex items-start gap-4">
        <div className="flex shrink-0 items-center justify-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white text-sm font-semibold text-gray-900">
            {step}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="app-text-meta-label text-gray-500">Schritt {step}</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{title}</div>
            </div>
            <StatusBadge tone={tone} size="sm">
              {statusLabel}
            </StatusBadge>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(230px,260px)_minmax(0,1fr)]">
            <div className="rounded-lg border bg-white px-3 py-3">
              <div className="app-text-meta-label text-gray-500">Nächste Aktion</div>
              <div className="mt-2 text-sm text-gray-800">{nextActionLabel}</div>
              {action ? (
                <div className="mt-3">
                  {action.kind === "link" ? (
                    <Link
                      href={action.href}
                      onClick={action.onClick}
                      className={appButtonClass({
                        variant: action.variant || "secondary",
                        size: "sm",
                        className: "whitespace-nowrap",
                      })}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={appButtonClass({
                        variant: action.variant || "secondary",
                        size: "sm",
                        className: "whitespace-nowrap",
                      })}
                    >
                      {action.label}
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border bg-white px-3 py-3">
              <div className="app-text-meta-label text-gray-500">Erwartetes Ergebnis</div>
              <div className="mt-2 text-sm leading-6 text-gray-700">{expectedResult}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemStatusSignalRow({
  title,
  tone,
  label,
  summary,
  metrics,
  action,
}: {
  title: string;
  tone: StatusTone;
  label: string;
  summary: string;
  metrics: Array<{ label: string; value: string }>;
  action?: { label: string; href: string; onClick?: () => void };
}) {
  return (
    <div className="rounded-xl border app-surface-muted px-3 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="app-text-section-title text-gray-900">{title}</div>
          <div className="app-text-helper mt-1 text-gray-700">{summary}</div>
        </div>
        <StatusBadge tone={tone} size="sm">
          {label}
        </StatusBadge>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border bg-white px-3 py-2">
            <div className="text-xs text-gray-500">{metric.label}</div>
            <div className="mt-1 text-sm font-semibold text-gray-900">{metric.value}</div>
          </div>
        ))}
      </div>

      {action ? (
        <div className="mt-3">
          <Link
            href={action.href}
            onClick={action.onClick}
            className={appButtonClass({ variant: "secondary", size: "sm" })}
          >
            {action.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function QueueCard({
  title,
  description,
  emptyState,
  leads,
  lastMessages,
  messageCounts,
  href,
  hrefLabel,
  tone,
  focusApproval = false,
  variant = "secondary",
  previewLimit = 3,
  compactItems = false,
  onActionClick,
  onPreviewOpen,
}: {
  title: string;
  description: string;
  emptyState: QueueCardEmptyState;
  leads: LeadRow[];
  lastMessages: Record<string, MsgRow | null>;
  messageCounts: Record<string, number>;
  href: string;
  hrefLabel: string;
  tone: StatusTone;
  focusApproval?: boolean;
  variant?: "primary" | "secondary" | "tertiary";
  previewLimit?: number;
  compactItems?: boolean;
  onActionClick?: () => void;
  onPreviewOpen?: (leadId: string) => void;
}) {
  const top = leads.slice(0, previewLimit);
  const isEmpty = top.length === 0;
  const metaTone = variant === "tertiary" ? "neutral" : tone;
  const stageLabel =
    variant === "primary"
      ? "Jetzt zuerst"
      : variant === "secondary"
        ? "Danach"
        : "Verlauf";
  const countLabel =
    variant === "primary"
      ? formatCountLabel(leads.length, "Freigabe", "Freigaben")
      : variant === "secondary"
        ? formatCountLabel(leads.length, "Fall", "Fälle")
        : `${leads.length} aktiv`;

  return (
    <div
      className={cn(
        "border",
        variant === "primary"
          ? `rounded-[28px] shadow-sm ${statusSurfaceClass(tone)}`
          : variant === "secondary"
            ? "rounded-2xl app-surface-card"
            : "rounded-2xl app-surface-muted",
      )}
    >
      <div
        className={cn(
          variant === "primary"
            ? "app-panel-padding"
            : "border-b app-surface-muted app-panel-padding-compact",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className={cn(
                "mb-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
                statusBadgeClass(metaTone),
              )}
            >
              {stageLabel}
            </div>
            <div className="app-text-section-title text-gray-900">{title}</div>
            <div className="app-text-helper mt-1">{description}</div>
          </div>
          <StatusBadge tone={metaTone} size="sm">
            {countLabel}
          </StatusBadge>
        </div>
      </div>

      <div className={variant === "primary" ? "px-4 pb-4 md:px-6 md:pb-6" : "app-panel-padding-compact"}>
        {isEmpty ? (
          <EmptyState
            title={emptyState.title}
            description={emptyState.description}
            className={cn(
              "text-left",
              variant === "primary" && "border-white/80 bg-white/75",
              variant === "tertiary" && "border-white/80 bg-white/80",
            )}
            action={
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={emptyState.actionHref}
                  className={appButtonClass({
                    variant:
                      emptyState.actionVariant ||
                      (variant === "primary" ? "primary" : "secondary"),
                    size: "sm",
                  })}
                >
                  {emptyState.actionLabel}
                </Link>
                {emptyState.learnHref && emptyState.learnLabel ? (
                  <Link
                    href={emptyState.learnHref}
                    className="text-xs font-medium text-gray-700 underline underline-offset-4 hover:text-gray-900"
                  >
                    {emptyState.learnLabel}
                  </Link>
                ) : null}
              </div>
            }
          />
        ) : (
          <div className={cn("flex flex-col", compactItems ? "gap-2" : "gap-3")}>
            {top.map((lead) => (
              <QueuePreviewItem
                key={lead.id}
                lead={lead}
                lastMessages={lastMessages}
                messageCounts={messageCounts}
                focusApproval={focusApproval}
                compact={compactItems}
                onOpen={onPreviewOpen}
              />
            ))}
          </div>
        )}

        {!isEmpty ? (
          <div className={cn(variant === "primary" ? "mt-4" : "mt-3")}>
            <Link
              href={href}
              onClick={onActionClick}
              className={appButtonClass({
                variant:
                  variant === "primary"
                    ? "primary"
                    : variant === "tertiary"
                      ? "utility"
                      : "secondary",
                size: "sm",
              })}
            >
              {hrefLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function QueuePreviewItem({
  lead,
  lastMessages,
  messageCounts,
  focusApproval = false,
  compact = false,
  onOpen,
}: {
  lead: LeadRow;
  lastMessages: Record<string, MsgRow | null>;
  messageCounts: Record<string, number>;
  focusApproval?: boolean;
  compact?: boolean;
  onOpen?: (leadId: string) => void;
}) {
  const last = lastMessages[lead.id];
  const name = safeStr((lead as any)?.name) || "Unbekannter Kontakt";
  const email = safeStr((lead as any)?.email) || "Keine E-Mail";
  const lastText =
    safeStr(last?.text) || "Noch keine letzte Nachricht gespeichert.";
  const updatedAt = last?.timestamp ?? safeStr((lead as any)?.updated_at);
  const href = focusApproval
    ? `/app/nachrichten/${lead.id}?focus=approval`
    : `/app/nachrichten/${lead.id}`;

  if (compact) {
    return (
      <Link
        href={href}
        onClick={() => onOpen?.(lead.id)}
        className="app-focusable block rounded-xl border app-surface-card px-3 py-2.5 transition hover:bg-white"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">{name}</div>
            <div className="mt-1 truncate text-xs text-gray-600">{lastText}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-gray-500">
              {formatDashboardTimestamp(updatedAt)}
            </span>
            <StatusBadge tone="neutral" size="sm">
              {messageCounts[lead.id] ?? 0}
            </StatusBadge>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={() => onOpen?.(lead.id)}
      className="app-focusable block rounded-xl border app-surface-muted px-3 py-2 transition hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-900">{name}</div>
          <div className="truncate text-xs text-gray-500">{email}</div>
        </div>
        <StatusBadge tone="neutral" size="sm">
          {messageCounts[lead.id] ?? 0}
        </StatusBadge>
      </div>

      <div className="mt-2 line-clamp-2 text-sm text-gray-700">{lastText}</div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
        <span>{formatDashboardTimestamp(updatedAt)}</span>
        <span className="inline-flex items-center gap-1 font-medium text-gray-700">
          {uiActionCopy.conversationOpen}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
