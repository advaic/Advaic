"use client";

import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import {
  appButtonClass,
  StatusBadge,
  statusRowClass,
  statusSurfaceClass,
  type StatusTone,
} from "@/components/app-ui";
import { Lead } from "@/types/lead";
import { toast } from "sonner";
import { escalateLead } from "@/app/actions/escalateLead";
import { deescalateLead } from "@/app/actions/deescalateLead";
import { SupabaseContext } from "@/app/ClientRootLayout";
import { uiActionCopy } from "@/lib/ui/action-copy";
import {
  Archive,
  Check,
  Clock,
  MessageSquare,
  MoreHorizontal,
  ShieldAlert,
} from "lucide-react";


type InboxItemProps = {
  lead: Lead;
  userId?: string;
  selected?: boolean;
  onToggleSelect?: () => void;
  onOpen?: (lead: Lead, opts?: { focusApproval?: boolean }) => void;
  // Optional explicit count from InboxView (preferred when available)
  pendingApprovalCount?: number;
};

type PrimaryStateKey = "approval" | "escalation" | "done" | "archived" | "active";

function getInitials(name: string): string {
  const clean = String(name ?? "").trim();
  if (!clean) return "?";

  // Split on whitespace, keep up to 2 parts
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";

  const initials = (first + last).toUpperCase();
  return initials || "?";
}

export default function InboxItem({
  lead,
  userId,
  selected = false,
  onToggleSelect,
  onOpen,
  pendingApprovalCount: pendingApprovalCountProp,
}: InboxItemProps) {
  const router = useRouter();

  const { session } = useContext(SupabaseContext);
  const sessionUserId = session?.user?.id ?? "";
  const effectiveUserId = userId && userId.length > 0 ? userId : sessionUserId;

  if (process.env.NODE_ENV !== "production") {
    if (!effectiveUserId || !lead.agent_id) {
      console.warn("⚠️ Missing userId or lead.agent_id:", {
        sessionUserId: effectiveUserId,
        leadAgentId: lead.agent_id,
      });
    } else if (effectiveUserId !== lead.agent_id) {
      console.warn(
        "⚠️ Authenticated user is not the owner of this lead (agent_id mismatch)."
      );
    }
  }
  const [isEscalated, setIsEscalated] = useState(lead.escalated ?? false);
  const [actionBusy, setActionBusy] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const leadStatusRaw = String((lead as any)?.status || "").toLowerCase().trim();
  const isDone = leadStatusRaw === "done" || leadStatusRaw === "closed";
  const hasArchiveMarker = !!(lead as any)?.archived_at || leadStatusRaw === "archived";

  // These fields can be provided by InboxView (recommended): pendingApprovalCount prop
  // Otherwise we fall back to lead fields: pending_approval_count / pendingApprovalCount
  const pendingApprovalCount =
    typeof pendingApprovalCountProp === "number"
      ? pendingApprovalCountProp
      : Number(
          (lead as any)?.pending_approval_count ??
            (lead as any)?.pendingApprovalCount ??
            0
        );
  const hasPendingApproval =
    pendingApprovalCount > 0 || !!(lead as any)?.has_pending_approval;

  const TYPE_BADGE: Record<string, StatusTone> = {
    Kaufen: "success",
    Mieten: "brand",
    FAQ: "neutral",
  };

  const PRIORITY_BADGE: Record<string, StatusTone> = {
    Hoch: "danger",
    Mittel: "warning",
    Niedrig: "neutral",
  };

  const FALLBACK_BADGE: StatusTone = "neutral";

  function normalizeLabel(v: unknown): string {
    return String(v ?? "").trim();
  }

  function normalizeTypeLabel(v: unknown): string {
    const raw = normalizeLabel(v);
    const lower = raw.toLowerCase();

    // canonical German labels used across the UI
    if (lower === "kaufen") return "Kaufen";
    if (lower === "mieten") return "Mieten";
    if (lower === "faq") return "FAQ";

    return raw; // fallback: show whatever comes from DB
  }

  function normalizePriorityLabel(v: unknown): string {
    const raw = normalizeLabel(v);
    if (!raw) return raw;

    const lower = raw.toLowerCase();
    const asNum = Number(raw);

    // Support numeric priorities (e.g. 3/2/1)
    if (Number.isFinite(asNum) && asNum > 0) {
      if (asNum >= 3) return "Hoch";
      if (asNum === 2) return "Mittel";
      return "Niedrig";
    }

    // Support English labels
    if (lower === "hot" || lower === "high") return "Hoch";
    if (lower === "warm" || lower === "medium" || lower === "med") return "Mittel";
    if (lower === "cold" || lower === "low") return "Niedrig";

    // Support German labels (case-insensitive)
    if (lower === "hoch") return "Hoch";
    if (lower === "mittel") return "Mittel";
    if (lower === "niedrig") return "Niedrig";

    return raw;
  }

  function getTypeBadgeTone(type?: string | null): StatusTone {
    const t = normalizeTypeLabel(type);
    return TYPE_BADGE[t] ?? FALLBACK_BADGE;
  }

  function getPriorityBadgeTone(priority?: string | null): StatusTone {
    const p = normalizePriorityLabel(priority);
    return PRIORITY_BADGE[p] ?? FALLBACK_BADGE;
  }

  const display = (() => {
    const name = normalizeLabel((lead as any)?.name) || "Unbekannter Kontakt";
    const email = normalizeLabel((lead as any)?.email) || "—";
    const lastMessage = normalizeLabel((lead as any)?.last_message) || "Keine letzte Nachricht gespeichert.";
    const typeLabel = normalizeTypeLabel((lead as any)?.type) || "—";
    const priorityLabel = normalizePriorityLabel((lead as any)?.priority) || "—";
    const messageCount = Number((lead as any)?.message_count ?? 0);

    const updatedAt = (lead as any)?.updated_at ? new Date((lead as any).updated_at) : null;
    const updatedLabel = updatedAt
      ? updatedAt.toLocaleString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unbekannt";

    return {
      name,
      email,
      lastMessage,
      typeLabel,
      priorityLabel,
      messageCount,
      updatedLabel,
    };
  })();

  const handleClick = (opts?: { focusApproval?: boolean }) => {
    const base = `/app/nachrichten/${lead.id}`;
    const url = opts?.focusApproval ? `${base}?focus=approval` : base;
    onOpen?.(lead, opts);
    router.push(url);
  };

  const handleEscalate = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const result = await escalateLead(lead.id);
      if ("error" in result) {
        toast.error("Fehler bei Eskalation: " + result.error);
      } else {
        setIsEscalated(true);
        toast.success("Eskalation erfolgreich");
      }
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeescalate = async () => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      const result = await deescalateLead(lead.id);
      if ("error" in result) {
        toast.error("Fehler bei Deeskalation: " + result.error);
      } else {
        setIsEscalated(false);
        toast.success("Deeskalierung erfolgreich");
      }
    } finally {
      setActionBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const primaryState = (() => {
    // "done" rows often also carry archived_at in this codebase, but the visible
    // priority must stay: Freigabe > Eskalation > Erledigt > Archiv.
    if (hasPendingApproval) {
      return {
        key: "approval" as PrimaryStateKey,
        tone: "warning" as StatusTone,
        label: "Freigabe offen",
        stripClass: "bg-[var(--status-warning-border)]",
        title:
          pendingApprovalCount > 0
            ? `${pendingApprovalCount} Nachricht(en) warten auf Freigabe`
            : "Mindestens eine Nachricht wartet auf Freigabe",
      };
    }
    if (isEscalated) {
      return {
        key: "escalation" as PrimaryStateKey,
        tone: "danger" as StatusTone,
        label: "Eskaliert",
        stripClass: "bg-[var(--status-danger-border)]",
        title: "Eskalation aktiv – automatische Antworten pausiert",
      };
    }
    if (isDone) {
      return {
        key: "done" as PrimaryStateKey,
        tone: "success" as StatusTone,
        label: "Erledigt",
        stripClass: "bg-[var(--status-success-border)]",
        title: "Als erledigt markiert",
      };
    }
    if (hasArchiveMarker) {
      return {
        key: "archived" as PrimaryStateKey,
        tone: "neutral" as StatusTone,
        label: "Archiviert",
        stripClass: "bg-[var(--status-neutral-border)]",
        title: "Archiviert",
      };
    }
    return {
      key: "active" as PrimaryStateKey,
      tone: "brand" as StatusTone,
      label: "Aktiv",
      stripClass: "bg-[var(--status-brand-border)]",
      title: "Aktive Konversation",
    };
  })();

  const rowStateClass =
    primaryState.key === "active"
      ? "border-gray-200 bg-white hover:bg-gray-50/60 md:border-0 md:bg-transparent md:hover:bg-[var(--app-surface-muted)]"
      : `${statusRowClass(primaryState.tone)} md:border-0`;

  const primaryAction = (() => {
    if (primaryState.key === "approval") {
      return {
        label: uiActionCopy.approvalReview,
        title: uiActionCopy.approvalReview,
        variant: "tertiary" as const,
        icon: <Clock className="mr-2 h-4 w-4" />,
        onClick: () => handleClick({ focusApproval: true }),
      };
    }

    if (primaryState.key === "done" || primaryState.key === "archived") {
      return {
        label: uiActionCopy.conversationOpen,
        title: uiActionCopy.conversationOpen,
        variant: "secondary" as const,
        icon: <MessageSquare className="mr-2 h-4 w-4" />,
        onClick: () => handleClick(),
      };
    }

    return {
      label: uiActionCopy.replyWrite,
      title: uiActionCopy.replyWrite,
      variant: "tertiary" as const,
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      onClick: () => handleClick(),
    };
  })();

  const escalationHelper =
    primaryState.key === "escalation"
      ? hasPendingApproval
        ? {
            blocker: "Automatische Antworten sind pausiert.",
            nextStep: "Zuerst offene Freigaben prüfen, dann manuell entscheiden.",
          }
        : {
            blocker: "Automatische Antworten sind pausiert.",
            nextStep: `${uiActionCopy.conversationOpen}, Fall klären und danach deeskalieren.`,
          }
      : null;

  return (
    <div
      data-tour="conversation-card"
      onClick={() => handleClick()}
      role="button"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={
        "app-focusable group w-full cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:shadow focus-visible:border-amber-300 " +
        "md:rounded-none md:px-4 md:py-4 md:shadow-none md:hover:shadow-none " +
        rowStateClass
      }
    >
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[40px_minmax(0,1fr)_auto] md:items-start md:gap-5">
        <div className="hidden md:flex min-h-full flex-col items-center gap-2.5 pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.();
            }}
            className={
              "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition " +
              (selected
                ? "bg-gray-900 border-gray-900"
                : "bg-white border-gray-300 hover:border-gray-400")
            }
            aria-pressed={selected ? "true" : "false"}
            aria-label={selected ? "Auswahl entfernen" : "Auswählen"}
            title={selected ? "Auswahl entfernen" : "Auswählen"}
          >
            {selected ? <Check className="h-3.5 w-3.5 text-white" /> : null}
          </button>
          <div
            aria-hidden="true"
            title={display.name}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-700 font-semibold text-xs select-none"
          >
            {getInitials(display.name)}
          </div>
          <div className={`w-1 flex-1 min-h-[68px] rounded-full ${primaryState.stripClass}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="md:hidden flex items-start gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.();
                }}
                className={
                  "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition " +
                  (selected
                    ? "bg-gray-900 border-gray-900"
                    : "bg-white border-gray-300 hover:border-gray-400")
                }
                aria-pressed={selected ? "true" : "false"}
                aria-label={selected ? "Auswahl entfernen" : "Auswählen"}
                title={selected ? "Auswahl entfernen" : "Auswählen"}
              >
                {selected ? <Check className="h-3.5 w-3.5 text-white" /> : null}
              </button>

              <div
                aria-hidden="true"
                title={display.name}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-700 font-semibold text-xs select-none"
              >
                {getInitials(display.name)}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                  {display.name}
                </h2>
                <StatusBadge
                  data-tour={
                    primaryState.key === "escalation"
                      ? "conversation-escalated-badge"
                      : undefined
                  }
                  tone={primaryState.tone}
                  title={primaryState.title}
                >
                  {primaryState.key === "approval" ? (
                    <Clock className="h-4 w-4" />
                  ) : primaryState.key === "escalation" ? (
                    <ShieldAlert className="h-4 w-4" />
                  ) : primaryState.key === "done" ? (
                    <Check className="h-4 w-4" />
                  ) : primaryState.key === "archived" ? (
                    <Archive className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  {primaryState.label}
                </StatusBadge>
              </div>

              <div className="mt-1 text-sm text-gray-700 line-clamp-2">
                {display.lastMessage}
              </div>

              {escalationHelper ? (
                <div
                  className={`mt-3 rounded-xl border px-3 py-2 text-xs ${statusSurfaceClass(
                    "danger",
                  )}`}
                  data-tour="conversation-escalation-helper"
                >
                  <div className="font-semibold text-gray-900">
                    {escalationHelper.blocker}
                  </div>
                  <div className="mt-1 text-gray-800">
                    <span className="font-medium">Nächster Schritt:</span>{" "}
                    {escalationHelper.nextStep}
                  </div>
                </div>
              ) : null}

              <div
                data-tour="conversation-card-badges"
                className="mt-3 flex flex-wrap items-center gap-2"
              >
                <StatusBadge size="sm" tone={getTypeBadgeTone(display.typeLabel)}>
                  {display.typeLabel}
                </StatusBadge>
                <StatusBadge size="sm" tone={getPriorityBadgeTone(display.priorityLabel)}>
                  {display.priorityLabel}
                </StatusBadge>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600">
                  {display.messageCount} Nachrichten
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium text-gray-700">E-Mail:</span>
                  <span className="truncate max-w-[220px]">{display.email}</span>
                </span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium text-gray-700">Letzte Aktivität:</span>
                  <span>{display.updatedLabel}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col items-stretch gap-2 w-full md:w-auto md:min-w-[176px]">
          <button
            data-tour="conversation-open"
            onClick={(e) => {
              e.stopPropagation();
              primaryAction.onClick();
            }}
            className={appButtonClass({
              variant: primaryAction.variant,
              size: "md",
              fullWidth: true,
              className: "font-semibold",
            })}
            title={primaryAction.title}
            type="button"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </button>
          <div className="flex items-center gap-2 md:justify-end">
            <button
              data-tour="conversation-overflow-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setOverflowOpen((value) => !value);
              }}
              aria-expanded={overflowOpen ? "true" : "false"}
              aria-label="Weitere Aktionen"
              title="Weitere Aktionen"
              type="button"
              className={appButtonClass({
                variant: "utility",
                size: "sm",
                className: "px-2.5",
              })}
            >
              <MoreHorizontal className="h-4 w-4" />
              {uiActionCopy.actions}
            </button>
          </div>
          {overflowOpen ? (
            <div
              data-tour="conversation-overflow-panel"
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm md:min-w-[176px]"
            >
              <div className="flex flex-col gap-2">
                {primaryState.key === "approval" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverflowOpen(false);
                      handleClick();
                    }}
                    className={appButtonClass({
                      variant: "secondary",
                      size: "sm",
                      fullWidth: true,
                      className: "justify-start",
                    })}
                    title={uiActionCopy.conversationOpen}
                    type="button"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {uiActionCopy.conversationOpen}
                  </button>
                ) : null}

                {hasPendingApproval && primaryState.key !== "approval" ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverflowOpen(false);
                      handleClick({ focusApproval: true });
                    }}
                    className={appButtonClass({
                      variant: "secondary",
                      size: "sm",
                      fullWidth: true,
                      className: "justify-start",
                    })}
                    title={uiActionCopy.approvalReview}
                    type="button"
                  >
                    <Clock className="h-4 w-4" />
                    {uiActionCopy.approvalReview}
                  </button>
                ) : null}

                {isEscalated ? (
                  <button
                    data-tour="conversation-deescalate"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleDeescalate();
                      setOverflowOpen(false);
                    }}
                    disabled={actionBusy}
                    className={appButtonClass({
                      variant: "secondary",
                      size: "sm",
                      fullWidth: true,
                      className: "justify-start",
                    })}
                    title="Deeskalieren"
                    type="button"
                  >
                    {actionBusy ? "…" : "Deeskalieren"}
                  </button>
                ) : (
                  <button
                    data-tour="conversation-escalate"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleEscalate();
                      setOverflowOpen(false);
                    }}
                    disabled={actionBusy}
                    className={appButtonClass({
                      variant: "destructive",
                      size: "sm",
                      fullWidth: true,
                      className: "justify-start",
                    })}
                    title="Eskalieren"
                    type="button"
                  >
                    {actionBusy ? "…" : "Eskalieren"}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          <div
            data-tour="conversation-card-hint"
            className="text-[11px] text-gray-500 md:text-right"
          >
            Enter öffnet Chat
          </div>
        </div>
      </div>
    </div>
  );
}
