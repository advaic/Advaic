"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  Archive,
  Bell,
  Building2,
  CircleUserRound,
  FileText,
  House,
  MessageSquareMore,
  MessagesSquare,
  Mic2,
  Settings2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import BrandLogo from "@/components/brand/BrandLogo";
import { appButtonClass, SidebarAutomationSkeleton } from "@/components/app-ui";
import { trackFunnelEvent } from "@/lib/funnel/track";
import {
  trackSettingsToggleAttempt,
  trackSettingsToggleSuccess,
} from "@/lib/funnel/ui-metrics";
import { uiActionCopy } from "@/lib/ui/action-copy";

type SidebarNavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

type SidebarNavSection = {
  title: string | null;
  titleIcon?: LucideIcon;
  items: SidebarNavItem[];
};

const baseNavSections = [
  {
    title: "Heute",
    titleIcon: House,
    items: [{ label: "Startseite", path: "/app/startseite", icon: House }],
  },
  {
    title: "Kommunikation",
    titleIcon: MessagesSquare,
    items: [
      { label: "Nachrichten", path: "/app/nachrichten", icon: MessageSquareMore },
      { label: "Eskalationen", path: "/app/eskalationen", icon: ShieldAlert },
      { label: "Zur Freigabe", path: "/app/zur-freigabe", icon: ShieldCheck },
      { label: "Follow-ups", path: "/app/follow-ups", icon: AlarmClock },
    ],
  },
  {
    title: "System",
    titleIcon: Building2,
    items: [
      { label: "Immobilien", path: "/app/immobilien", icon: Building2 },
      { label: "Archiv", path: "/app/archiv", icon: Archive },
    ],
  },
  {
    title: "Einstellungen",
    titleIcon: Settings2,
    items: [
      { label: "Antwortvorlagen", path: "/app/antwortvorlagen", icon: FileText },
      { label: "Ton & Stil", path: "/app/ton-und-stil", icon: Mic2 },
      {
        label: "Benachrichtigungen",
        path: "/app/benachrichtigungen",
        icon: Bell,
      },
      { label: "Konto", path: "/app/konto", icon: CircleUserRound },
    ],
  },
] satisfies SidebarNavSection[];

function sectionTourKey(title: string | null) {
  switch (title) {
    case "Heute":
      return "sidebar-section-heute";
    case "Kommunikation":
      return "sidebar-section-kommunikation";
    case "System":
      return "sidebar-section-system";
    case "Einstellungen":
      return "sidebar-section-einstellungen";
    default:
      return undefined;
  }
}

function tourKeyForPath(path: string) {
  // keep this deterministic + stable for tour targeting
  switch (path) {
    case "/app/startseite":
      return "nav-startseite";
    case "/app/nachrichten":
      return "nav-nachrichten";
    case "/app/eskalationen":
      return "nav-eskalationen";
    case "/app/zur-freigabe":
      return "nav-zur-freigabe";
    case "/app/follow-ups":
      return "nav-follow-ups";
    case "/app/immobilien":
      return "nav-immobilien";
    case "/app/archiv":
      return "nav-archiv";
    case "/app/antwortvorlagen":
      return "nav-antwortvorlagen";
    case "/app/ton-und-stil":
      return "nav-ton-und-stil";
    case "/app/benachrichtigungen":
      return "nav-benachrichtigungen";
    case "/app/konto":
      return "nav-konto";
    default:
      return null;
  }
}

type BillingAccess = {
  state: "paid_active" | "trial_active" | "trial_expired";
  trial_days_total: number;
  trial_day_number: number;
  trial_days_remaining: number;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  is_urgent: boolean;
  upgrade_required: boolean;
};

function normalizeBillingAccess(raw: any): BillingAccess | null {
  if (!raw || typeof raw !== "object") return null;
  const state =
    raw.state === "paid_active" || raw.state === "trial_expired"
      ? raw.state
      : "trial_active";
  const trialDaysTotal = Number(raw.trial_days_total);
  const trialDayNumber = Number(raw.trial_day_number);
  const trialDaysRemaining = Number(raw.trial_days_remaining);
  return {
    state,
    trial_days_total: Number.isFinite(trialDaysTotal) ? Math.max(0, trialDaysTotal) : 14,
    trial_day_number: Number.isFinite(trialDayNumber) ? Math.max(0, trialDayNumber) : 0,
    trial_days_remaining: Number.isFinite(trialDaysRemaining)
      ? Math.max(0, trialDaysRemaining)
      : 0,
    trial_started_at:
      typeof raw.trial_started_at === "string" ? raw.trial_started_at : null,
    trial_ends_at: typeof raw.trial_ends_at === "string" ? raw.trial_ends_at : null,
    is_urgent: !!raw.is_urgent,
    upgrade_required: !!raw.upgrade_required,
  };
}

type SidebarProps = {
  variant?: "desktop" | "mobile";
  className?: string;
  onNavigate?: () => void;
};

export default function Sidebar({
  variant = "desktop",
  className = "",
  onNavigate,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();

  const [autosendEnabled, setAutosendEnabled] = useState<boolean | null>(null);
  const [autosendBusy, setAutosendBusy] = useState(false);
  const [billingAccess, setBillingAccess] = useState<BillingAccess | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const trialExpired = billingAccess?.state === "trial_expired";
  const navSections = useMemo(() => baseNavSections, []);
  const isMobileVariant = variant === "mobile";
  const automationPanelClass = trialExpired
    ? "border-red-200 bg-[linear-gradient(180deg,#ffffff_0%,#fff5f5_100%)]"
    : billingAccess?.is_urgent
      ? "border-[rgba(201,162,39,0.36)] bg-[linear-gradient(180deg,#ffffff_0%,#fff8ec_100%)]"
      : "border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fcfbf7_100%)]";
  const automationAccentClass = trialExpired
    ? "bg-[linear-gradient(90deg,#fca5a5,rgba(252,165,165,0.12))]"
    : billingAccess?.is_urgent
      ? "bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.12))]"
      : "bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]";

  const autosendLabel = useMemo(() => {
    if (autosendEnabled === null) return "Lade…";
    if (trialExpired) return "Starter erforderlich";
    return autosendEnabled ? "Auto-Senden aktiv" : "Auto-Senden pausiert";
  }, [autosendEnabled, trialExpired]);
  const planLabel = useMemo(() => {
    if (!billingAccess) return "Planstatus wird geladen";
    if (billingAccess.state === "paid_active") return "Starter aktiv";
    if (trialExpired) return "Testphase beendet";
    return `Testphase · ${billingAccess.trial_days_remaining} Tage`;
  }, [billingAccess, trialExpired]);
  const planHelper = useMemo(() => {
    if (!billingAccess) {
      return "Auto-Senden und Follow-ups bleiben kontrollierbar. Planstatus wird nachgeladen.";
    }
    if (trialExpired) {
      return "Auto-Senden und Follow-ups sind pausiert, bis Starter aktiv ist.";
    }
    if (billingAccess.state === "trial_active") {
      return `Tag ${billingAccess.trial_day_number} von ${billingAccess.trial_days_total}. Aktiviere Starter, damit die Automatik ohne Unterbrechung weiterläuft.`;
    }
    return "Entwürfe landen bei Bedarf weiterhin in „Zur Freigabe“. Follow-ups und Versand bleiben zentral steuerbar.";
  }, [billingAccess, trialExpired]);
  const followupLabel = trialExpired ? "Follow-ups pausiert" : "Follow-ups bereit";

  useEffect(() => {
    let cancelled = false;

    async function loadAutosend() {
      if (!cancelled) setStatusLoading(true);
      try {
        const [autosendRes, billingRes] = await Promise.all([
          fetch("/api/agent/settings/autosend", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          fetch("/api/billing/summary", { method: "GET", cache: "no-store" }),
        ]);

        const autosendData = await autosendRes.json().catch(() => ({} as any));
        const billingData = await billingRes.json().catch(() => ({} as any));

        if (!autosendRes.ok) {
          console.error("[sidebar] autosend GET failed", autosendData);
          if (!cancelled) setAutosendEnabled(false);
        } else {
          const enabled = autosendData?.settings?.autosend_enabled;
          if (!cancelled) {
            setAutosendEnabled(typeof enabled === "boolean" ? enabled : false);
          }
        }

        if (billingRes.ok && billingData?.summary?.access) {
          if (!cancelled) {
            setBillingAccess(normalizeBillingAccess(billingData.summary.access));
          }
        } else if (!cancelled) {
          setBillingAccess(null);
        }

      } catch (e: any) {
        console.error("[sidebar] load autosend error", e);
        if (!cancelled) {
          setAutosendEnabled(false);
          setBillingAccess(null);
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    }

    loadAutosend();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleAutosend = async () => {
    if (autosendEnabled === null) return;
    if (autosendBusy) return;
    if (trialExpired) {
      toast.error("Testphase beendet. Bitte aktiviere Starter, um Auto-Senden zu nutzen.");
      void trackFunnelEvent({
        event: "billing_upgrade_gate_triggered",
        source: "sidebar_autosend_gate",
        path: pathname || "/app/startseite",
        meta: {
          reason: "trial_expired_autosend_toggle",
        },
      });
      router.push(
        `/app/konto/abo?upgrade_required=1&source=sidebar_autosend_gate&next=${encodeURIComponent(pathname || "/app/startseite")}`,
      );
      return;
    }

    const prev = autosendEnabled;
    const next = !prev;
    trackSettingsToggleAttempt({
      source: "sidebar_autosend",
      path: pathname || "/app/startseite",
      routeKey: "settings_toggle",
      settingKey: "autosend_enabled",
      nextValue: next,
      surface: "sidebar",
    });

    setAutosendBusy(true);
    setAutosendEnabled(next); // optimistic

    try {
      const res = await fetch("/api/agent/settings/autosend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autosend_enabled: next }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        if (res.status === 402 && data?.error === "payment_required") {
          if (data?.billing_access) {
            setBillingAccess(normalizeBillingAccess(data.billing_access));
          }
          throw new Error(
            String(
              data?.details ||
                "Testphase beendet. Bitte aktiviere Starter, um Auto-Senden zu nutzen.",
            ),
          );
        }
        throw new Error(String(data?.error || "Failed to update autosend"));
      }

      const saved = data?.settings?.autosend_enabled;
      setAutosendEnabled(typeof saved === "boolean" ? saved : next);

      toast.success(
        (typeof saved === "boolean" ? saved : next)
          ? "Auto-Senden aktiviert."
          : "Auto-Senden pausiert."
      );
      trackSettingsToggleSuccess({
        source: "sidebar_autosend",
        path: pathname || "/app/startseite",
        routeKey: "settings_toggle",
        settingKey: "autosend_enabled",
        nextValue: typeof saved === "boolean" ? saved : next,
        surface: "sidebar",
      });
      } catch (e: any) {
        console.error("[sidebar] toggle autosend failed", e);
        setAutosendEnabled(prev); // rollback
        toast.error(e?.message ?? "Konnte Auto-Senden nicht ändern.");
    } finally {
      setAutosendBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST" });
    } catch {}
    onNavigate?.();
    router.push("/");
    router.refresh();
  };

  const asideClass =
    variant === "mobile"
      ? "flex h-full w-full flex-col overflow-y-auto border-r border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fcfbf7_100%)] app-panel-padding shadow-[0_18px_50px_rgba(11,15,23,.08)]"
      : "flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#fcfbf7_100%)] app-panel-padding shadow-[0_12px_32px_rgba(11,15,23,.05)]";

  return (
    <aside
      className={`${asideClass} ${className}`}
      data-tour="sidebar"
    >
      {/* Logo and logout */}
      <div className="mb-8 rounded-[var(--radius)] border border-[var(--border)] bg-white/90 p-3 shadow-[var(--shadow-sm)]">
        <div className="min-w-0">
          <div className="text-gray-900">
            <BrandLogo size="md" withIcon={false} />
          </div>
          <div className="mt-3 inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] ring-1 ring-[var(--gold-soft)]">
            Advaic App
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {/* Automation status */}
        <div
          className={`relative mb-6 overflow-hidden rounded-[var(--radius)] shadow-[var(--shadow-sm)] app-panel-padding-compact ${automationPanelClass}`}
          data-tour="sidebar-automation-status"
        >
          <div
            aria-hidden
            className={`absolute inset-x-0 top-0 h-1 ${automationAccentClass}`}
          />
          {statusLoading ? (
            <SidebarAutomationSkeleton />
          ) : (
            <>
              <div className="flex items-start justify-between gap-3" data-tour="sidebar-autosend">
                <div className="min-w-0">
                  <div className="app-text-meta-label">Automationsstatus</div>
                  <div className="app-text-section-title mt-0.5 truncate text-gray-900">
                    {autosendLabel}
                  </div>
                  <div className="app-text-helper mt-1 text-gray-700">{planLabel}</div>
                </div>

                <button
                  type="button"
                  onClick={toggleAutosend}
                  disabled={autosendEnabled === null || autosendBusy || trialExpired}
                  aria-pressed={!!autosendEnabled}
                  className={`app-focusable relative inline-flex h-7 w-12 items-center rounded-full border transition disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none ${
                    autosendEnabled
                      ? "border-[var(--gold)] bg-[linear-gradient(135deg,#171b22_0%,#0b0f17_100%)]"
                      : "border-[var(--border)] bg-white"
                  }`}
                  title={autosendEnabled ? "Auto-Senden pausieren" : "Auto-Senden aktivieren"}
                  data-tour="sidebar-autosend-toggle"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full transition ${
                      autosendEnabled
                        ? "translate-x-6 bg-[linear-gradient(160deg,#f3d77b_0%,var(--gold-2)_42%,#b28a11_100%)]"
                        : "translate-x-1 bg-gray-200"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-3 grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2">
                    <div className="app-text-meta-label">Versand</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {autosendEnabled === null ? "Lädt…" : autosendEnabled ? "Aktiv" : "Pausiert"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2">
                    <div className="app-text-meta-label">Follow-ups</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">{followupLabel}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2">
                  <div className="app-text-meta-label">Plan</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{planLabel}</div>
                  <div className="app-text-helper mt-1 text-gray-700">{planHelper}</div>
                </div>

                {billingAccess && billingAccess.state !== "paid_active" ? (
                  <Link
                    href={`/app/konto/abo?source=sidebar_trial_card&next=${encodeURIComponent(pathname || "/app/startseite")}`}
                    onClick={() => {
                      onNavigate?.();
                      void trackFunnelEvent({
                        event: "billing_upgrade_cta_clicked",
                        source: "sidebar_trial_card",
                        path: pathname || "/app/startseite",
                        meta: {
                          trial_state: billingAccess.state,
                          trial_days_remaining: billingAccess.trial_days_remaining,
                        },
                      });
                    }}
                    className={appButtonClass({
                      variant: "primary",
                      size: "sm",
                      fullWidth: true,
                      className: "mt-1 shadow-[var(--shadow-sm)]",
                    })}
                  >
                    {uiActionCopy.starterActivate}
                  </Link>
                ) : null}
              </div>
            </>
          )}
        </div>

        <nav className="space-y-7">
          {navSections.map((section, index) => (
            <div key={index}>
              {section.title ? (
                <h3
                  className="app-text-meta-label mb-2 flex items-center gap-2 px-2 uppercase tracking-wide text-gray-500"
                  data-tour={sectionTourKey(section.title)}
                >
                  {section.titleIcon ? (
                    <section.titleIcon className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />
                  ) : null}
                  <span>{section.title}</span>
                </h3>
              ) : null}
              <ul className="space-y-1.5">
                {section.items.map((item) => {
                  const isActive = pathname.startsWith(item.path);
                  const tourKey = tourKeyForPath(item.path);
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        onClick={() => {
                          if (isMobileVariant) {
                            onNavigate?.();
                          }
                        }}
                        className={`app-focusable group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-[var(--surface-2)] text-[var(--text)] ring-1 ring-[var(--gold-soft)] shadow-[var(--shadow-sm)]"
                            : "text-[var(--text)]/78 hover:bg-[var(--surface-2)] hover:text-[var(--text)] hover:ring-1 hover:ring-[var(--border)]"
                        }`}
                        data-tour={tourKey ?? undefined}
                      >
                        {isActive ? (
                          <span
                            aria-hidden
                            className="absolute inset-y-1 left-1 w-1 rounded-full bg-[linear-gradient(180deg,var(--gold),var(--gold-2))]"
                          />
                        ) : null}
                        <div
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                            isActive
                              ? "border-[var(--gold-soft)] bg-white text-[var(--gold)]"
                              : "border-[var(--border)] bg-white/90 text-gray-500 group-hover:text-[var(--text)]"
                          }`}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className="mt-auto border-t border-[var(--border)] pt-4"
          data-tour="sidebar-footer"
        >
          <div className="app-text-meta-label mb-2 px-2 uppercase tracking-wide text-gray-500">
            Utility
          </div>
          <button
            onClick={handleLogout}
            data-tour="logout"
            className={appButtonClass({
              variant: "utility",
              size: "sm",
              fullWidth: true,
            })}
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
