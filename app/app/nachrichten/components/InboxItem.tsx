"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useContext, useState } from "react";
import { Lead } from "@/types/lead";
import { toast } from "sonner";
import { escalateLead } from "@/app/actions/escalateLead";
import { deescalateLead } from "@/app/actions/deescalateLead";
import { SupabaseContext } from "@/app/ClientRootLayout";
import { Archive, Check, ChevronRight, Clock, MessageSquare, ShieldAlert } from "lucide-react";


type InboxItemProps = {
  lead: Lead;
  userId?: string;
  selected?: boolean;
  onToggleSelect?: () => void;
  // Optional explicit count from InboxView (preferred when available)
  pendingApprovalCount?: number;
};

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

  const leadStatusRaw = String((lead as any)?.status || "").toLowerCase().trim();
  const isDone = leadStatusRaw === "done" || leadStatusRaw === "closed";
  const isArchived = !!(lead as any)?.archived_at || leadStatusRaw === "archived";

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

  const TYPE_BADGE: Record<string, string> = {
    Kaufen: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    Mieten: "bg-sky-50 text-sky-800 border border-sky-200",
    FAQ: "bg-gray-50 text-gray-800 border border-gray-200",
  };

  const PRIORITY_BADGE: Record<string, string> = {
    Hoch: "bg-red-50 text-red-800 border border-red-200",
    Mittel: "bg-amber-50 text-amber-900 border border-amber-200",
    Niedrig: "bg-gray-50 text-gray-800 border border-gray-200",
  };

  const FALLBACK_BADGE = "bg-white text-gray-700 border border-gray-200";

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

  function getTypeBadgeClass(type?: string | null) {
    const t = normalizeTypeLabel(type);
    return TYPE_BADGE[t] ?? FALLBACK_BADGE;
  }

  function getPriorityBadgeClass(priority?: string | null) {
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

  return (
    <div
      data-tour="conversation-card"
      onClick={() => handleClick()}
      role="button"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={
        "group w-full rounded-2xl border p-4 md:p-5 shadow-sm hover:shadow transition cursor-pointer " +
        (hasPendingApproval
          ? "border-amber-300 bg-amber-50/40 hover:bg-amber-50/60"
          : isArchived
            ? "border-gray-200 bg-gray-50/60 hover:bg-gray-50"
            : isDone
              ? "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/40"
              : "border-gray-200 bg-white hover:bg-gray-50/60")
      }
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              {/* Multi-select */}
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

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-900 font-semibold text-sm select-none">
                {getInitials(display.name)}
              </div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                {display.name}
              </h2>

              {hasPendingApproval && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900"
                  title={
                    pendingApprovalCount > 0
                      ? `${pendingApprovalCount} Nachricht(en) warten auf Freigabe`
                      : "Mindestens eine Nachricht wartet auf Freigabe"
                  }
                >
                  <Clock className="h-4 w-4" />
                  Zur Freigabe
                </span>
              )}

              {isDone && !isArchived && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-800"
                  title="Als erledigt markiert"
                >
                  <Check className="h-4 w-4" />
                  Erledigt
                </span>
              )}

              {isArchived && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700"
                  title="Archiviert"
                >
                  <Archive className="h-4 w-4" />
                  Archiv
                </span>
              )}

              {isEscalated && (
                <span
                  data-tour="conversation-escalated-badge"
                  className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700"
                  title="Eskalation aktiv – automatische Antworten pausiert"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Eskalation
                </span>
              )}
            </div>

            {/* Right badges (desktop) */}
            <div data-tour="conversation-card-badges" className="hidden md:flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[11px] text-gray-500 font-medium">Kategorie</div>
                <Badge className={getTypeBadgeClass(display.typeLabel)}>{display.typeLabel}</Badge>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-gray-500 font-medium">Priorität</div>
                <Badge className={getPriorityBadgeClass(display.priorityLabel)}>
                  {display.priorityLabel}
                </Badge>
              </div>
              <div className="text-right min-w-[84px]">
                <div className="text-[11px] text-gray-500 font-medium">Nachrichten</div>
                <div className="text-sm font-semibold text-gray-900">{display.messageCount}</div>
              </div>
            </div>
          </div>

          <div className="mt-1 text-sm text-gray-700 line-clamp-2">
            {display.lastMessage}
          </div>

          {/* Badges (mobile) */}
          <div className="mt-3 flex md:hidden flex-wrap items-center gap-2">
            <Badge className={getTypeBadgeClass(display.typeLabel)}>{display.typeLabel}</Badge>
            <Badge className={getPriorityBadgeClass(display.priorityLabel)}>{display.priorityLabel}</Badge>
            <span className="text-xs text-gray-600">
              <span className="font-medium">Nachrichten:</span> {display.messageCount}
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

        {/* Actions */}
        <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-2 w-full md:w-auto">
          <button
            data-tour="conversation-open"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold border border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 transition w-full"
            title="Antworten"
            type="button"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Antworten
          </button>

          {hasPendingApproval && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick({ focusApproval: true });
              }}
              className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold border border-amber-300 bg-white text-amber-900 hover:bg-amber-50 w-full sm:w-auto"
              title="Zur Freigabe öffnen"
              type="button"
            >
              <Clock className="mr-1.5 h-4 w-4" />
              Zur Freigabe
            </button>
          )}

          {isEscalated ? (
            <button
              data-tour="conversation-deescalate"
              onClick={(e) => {
                e.stopPropagation();
                handleDeescalate();
              }}
              disabled={actionBusy}
              className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
              title="Deeskalieren"
              type="button"
            >
              {actionBusy ? "…" : "Deeskalieren"}
            </button>
          ) : (
            <button
              data-tour="conversation-escalate"
              onClick={(e) => {
                e.stopPropagation();
                handleEscalate();
              }}
              disabled={actionBusy}
              className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-medium border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
              title="Eskalieren"
              type="button"
            >
              {actionBusy ? "…" : "Eskalieren"}
            </button>
          )}

          <div data-tour="conversation-card-hint" className="text-[11px] text-gray-500 text-right">
            Enter öffnet Chat
          </div>

          <div className="hidden md:flex items-center pl-2">
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
