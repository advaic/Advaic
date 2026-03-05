"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import BrandLogo from "@/components/brand/BrandLogo";
import { trackFunnelEvent } from "@/lib/funnel/track";

const baseNavSections = [
  {
    title: null,
    items: [{ label: "Startseite", path: "/app/startseite", icon: "🏠" }],
  },
  {
    title: "📨 Kommunikation",
    items: [
      { label: "Nachrichten", path: "/app/nachrichten", icon: "💬" },
      { label: "Eskalationen", path: "/app/eskalationen", icon: "🚨" },
      { label: "Zur Freigabe", path: "/app/zur-freigabe", icon: "🔁" },
      { label: "Follow-ups", path: "/app/follow-ups", icon: "⏳" },
    ],
  },
  {
    title: "📊 Überblick",
    items: [
      { label: "Immobilien", path: "/app/immobilien", icon: "🏡" },
      { label: "Archiv", path: "/app/archiv", icon: "📁" },
    ],
  },
  {
    title: "⚙️ Einstellungen",
    items: [
      { label: "Antwortvorlagen", path: "/app/antwortvorlagen", icon: "✉️" },
      { label: "Ton & Stil", path: "/app/ton-und-stil", icon: "🎙️" },
      {
        label: "Benachrichtigungen",
        path: "/app/benachrichtigungen",
        icon: "🔔",
      },
      { label: "Konto", path: "/app/konto", icon: "👤" },
    ],
  },
];

function getNavSections(isOwner: boolean) {
  const sections = [...baseNavSections];
  if (isOwner) {
    sections.push({
      title: "🧪 Intern",
      items: [
        { label: "CRM", path: "/app/crm", icon: "🧭" },
        { label: "Sales Intel", path: "/app/crm/sales-intel", icon: "📈" },
      ],
    });
  }
  return sections;
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
    case "/app/crm":
      return "nav-crm";
    case "/app/crm/sales-intel":
      return "nav-crm-sales-intel";
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [autosendEnabled, setAutosendEnabled] = useState<boolean | null>(null);
  const [autosendBusy, setAutosendBusy] = useState(false);
  const [billingAccess, setBillingAccess] = useState<BillingAccess | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const trialExpired = billingAccess?.state === "trial_expired";
  const navSections = useMemo(() => getNavSections(isOwner), [isOwner]);

  const autosendLabel = useMemo(() => {
    if (autosendEnabled === null) return "Lade…";
    if (trialExpired) return "Starter erforderlich";
    return autosendEnabled ? "Auto-Senden aktiv" : "Auto-Senden pausiert";
  }, [autosendEnabled, trialExpired]);

  useEffect(() => {
    let cancelled = false;

    async function loadAutosend() {
      try {
        const [autosendRes, billingRes, profileRes] = await Promise.all([
          fetch("/api/agent/settings/autosend", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          fetch("/api/billing/summary", { method: "GET", cache: "no-store" }),
          fetch("/api/account/profile", { method: "GET", cache: "no-store" }),
        ]);

        const autosendData = await autosendRes.json().catch(() => ({} as any));
        const billingData = await billingRes.json().catch(() => ({} as any));
        const profileData = await profileRes.json().catch(() => ({} as any));

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

        if (!cancelled) {
          setIsOwner(Boolean(profileRes.ok && profileData?.profile?.is_owner));
        }
      } catch (e: any) {
        console.error("[sidebar] load autosend error", e);
        if (!cancelled) {
          setAutosendEnabled(false);
          setBillingAccess(null);
          setIsOwner(false);
        }
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
    router.push("/");
    router.refresh();
  };

  return (
    <aside
      className="h-screen w-64 bg-white border-r px-4 py-6 shadow-sm"
      data-tour="sidebar"
    >
      {/* Logo and logout */}
      <div className="mb-8 flex flex-col space-y-2">
        <div className="text-gray-800">
          <BrandLogo size="md" withIcon={false} />
        </div>
        <button
          onClick={handleLogout}
          data-tour="logout"
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      {/* Autosend toggle */}
      <div
        className="mb-6 rounded-2xl border border-gray-200 bg-[#fbfbfc] p-3"
        data-tour="sidebar-autosend"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-500">Automatik</div>
            <div className="mt-0.5 text-sm font-medium text-gray-900 truncate">
              {autosendLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleAutosend}
            disabled={autosendEnabled === null || autosendBusy || trialExpired}
            aria-pressed={!!autosendEnabled}
            className={`relative inline-flex h-7 w-12 items-center rounded-full border transition disabled:opacity-60 disabled:cursor-not-allowed ${
              autosendEnabled
                ? "bg-gray-900 border-gray-900"
                : "bg-white border-gray-300"
            }`}
            title={autosendEnabled ? "Auto-Senden pausieren" : "Auto-Senden aktivieren"}
            data-tour="sidebar-autosend-toggle"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full transition ${
                autosendEnabled ? "translate-x-6 bg-amber-200" : "translate-x-1 bg-gray-200"
              }`}
            />
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Stoppt/aktiviert das automatische Versenden. Entwürfe landen bei Bedarf weiterhin in „Zur Freigabe“.
        </div>
      </div>

      {billingAccess && billingAccess.state !== "paid_active" ? (
        <div
          className={`mb-6 rounded-2xl border p-3 ${
            trialExpired
              ? "border-red-200 bg-red-50"
              : billingAccess?.is_urgent
                ? "border-amber-200 bg-amber-50"
                : "border-sky-200 bg-sky-50"
          }`}
        >
          <div className="text-xs font-semibold text-gray-700">
            {trialExpired ? "Testphase beendet" : "Testphase läuft"}
          </div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {trialExpired
              ? "Automatik ist pausiert"
              : `Noch ${billingAccess.trial_days_remaining} Tage`}
          </div>
          <div className="mt-1 text-xs text-gray-700">
            {trialExpired
              ? "Aktiviere Starter, um Auto-Senden und Follow-ups wieder freizuschalten."
              : `Tag ${billingAccess.trial_day_number} von ${billingAccess.trial_days_total}.`}
          </div>
          <Link
            href={`/app/konto/abo?source=sidebar_trial_card&next=${encodeURIComponent(pathname || "/app/startseite")}`}
            onClick={() => {
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
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-gray-800"
          >
            Starter aktivieren
          </Link>
        </div>
      ) : null}

      <nav className="space-y-6">
        {navSections.map((section, index) => (
          <div key={index}>
            {section.title && (
              <h3 className="text-xs uppercase text-gray-400 font-semibold px-2 mb-2 tracking-wide">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  item.path === "/app/crm"
                    ? pathname === "/app/crm"
                    : pathname.startsWith(item.path);
                const tourKey = tourKeyForPath(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive
                          ? "bg-gray-100 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      data-tour={tourKey ?? undefined}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
