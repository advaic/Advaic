"use client";

import { useEffect, useState } from "react";
import { PageHeader, StatusBadge, statusSurfaceClass, type StatusTone } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browserClient";
import { trackFunnelEvent } from "@/lib/funnel/track";

type BillingSummaryResponse = {
  ok: boolean;
  summary?: {
    access: {
      state: "paid_active" | "trial_active" | "trial_expired";
      trial_days_total: number;
      trial_day_number: number;
      trial_days_remaining: number;
      trial_started_at: string | null;
      trial_ends_at: string | null;
      is_urgent: boolean;
      upgrade_required: boolean;
      internal_override?: boolean;
      internal_override_reason?: "owner" | "internal_premium";
      owner_override?: boolean;
    };
    plan: {
      key: string;
      name: string;
      status: string;
      current_period_end: string | null;
    };
  };
};

function formatDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function KontoUebersichtPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("—");
  const [owner, setOwner] = useState("—");
  const [planName, setPlanName] = useState("Advaic Free");
  const [nextBilling, setNextBilling] = useState("—");
  const [trialState, setTrialState] = useState<
    BillingSummaryResponse["summary"]["access"] | null
  >(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      const mail = String(user?.email || "").trim();
      const nameFromMeta = String(
        user?.user_metadata?.full_name || user?.user_metadata?.name || "",
      ).trim();

      setEmail(mail || "—");
      setOwner(nameFromMeta || (mail ? mail.split("@")[0] : "—"));

      const billingRes = await fetch("/api/billing/summary", { cache: "no-store" });
      const billingData = (await billingRes.json().catch(() => ({}))) as BillingSummaryResponse;

      if (billingRes.ok && billingData?.ok && billingData.summary?.plan) {
        setPlanName(String(billingData.summary.plan.name || "Advaic Free"));
        setNextBilling(formatDate(billingData.summary.plan.current_period_end || null));
        setTrialState(billingData.summary.access || null);
      }

      setLoading(false);
    })();
  }, []);

  const planTone: StatusTone =
    trialState?.state === "trial_expired"
      ? "danger"
      : trialState?.state === "trial_active"
        ? trialState?.is_urgent
          ? "warning"
          : "neutral"
        : "success";

  return (
    <div className="app-page-stack" data-tour="account-page">
      <PageHeader
        sticky={false}
        dataTour="account-page-header"
        title={
          <h1 className="app-text-page-title" data-tour="account-header">
            Konto-Übersicht
          </h1>
        }
        meta={
          <>
            <StatusBadge tone="brand">Advaic</StatusBadge>
            <StatusBadge tone={planTone}>{loading ? "Lädt…" : planName}</StatusBadge>
          </>
        }
        description="Hier findest du alle wichtigen Informationen zu deinem Konto, deinem Plan und deinen Stammdaten."
        actions={
          <>
            <Link
              href="/app/konto/abo?source=konto_manage_plan&next=%2Fapp%2Fkonto"
              data-tour="account-change-plan"
              className="inline-flex w-full sm:w-auto"
              onClick={() => {
                void trackFunnelEvent({
                  event: "billing_upgrade_cta_clicked",
                  source: "konto_manage_plan",
                  path: "/app/konto",
                });
              }}
            >
              <Button variant="secondary" className="w-full sm:w-auto">
                Plan & Zahlungen
              </Button>
            </Link>
            <Link
              href="/app/konto/persoenliche-daten"
              data-tour="account-personal-data"
              className="inline-flex w-full sm:w-auto"
            >
              <Button variant="outline" className="w-full sm:w-auto">
                Persönliche Daten
              </Button>
            </Link>
            <Link
              href="/app/benachrichtigungen"
              data-tour="account-notifications"
              className="inline-flex w-full sm:w-auto"
            >
              <Button variant="outline" className="w-full sm:w-auto">
                Benachrichtigungen
              </Button>
            </Link>
          </>
        }
      />

      {trialState?.state !== "paid_active" ? (
        <div
          className={`rounded-2xl border app-panel-padding text-sm ${
            trialState?.state === "trial_expired"
              ? statusSurfaceClass("danger")
              : trialState?.is_urgent
                ? statusSurfaceClass("warning")
                : statusSurfaceClass("neutral")
          }`}
        >
          <p className="app-text-section-title text-gray-900">
            {trialState?.state === "trial_expired"
              ? "Testphase beendet"
              : "Testphase aktiv"}
          </p>
          <p className="app-text-helper mt-1 text-gray-700">
            {trialState?.state === "trial_expired"
              ? "Auto-Senden und Follow-ups sind pausiert, bis Starter aktiv ist."
              : `Tag ${trialState?.trial_day_number ?? 1} von ${trialState?.trial_days_total ?? 14}. Noch ${trialState?.trial_days_remaining ?? 0} Tage.`}
          </p>
          <Link
            href="/app/konto/abo?source=konto_trial_card&next=%2Fapp%2Fkonto"
            className="mt-3 inline-flex"
            onClick={() => {
              void trackFunnelEvent({
                event: "billing_upgrade_cta_clicked",
                source: "konto_trial_card",
                path: "/app/konto",
                meta: {
                  trial_state: trialState?.state || null,
                  trial_days_remaining: trialState?.trial_days_remaining ?? null,
                },
              });
            }}
          >
            <Button>Starter aktivieren</Button>
          </Link>
        </div>
      ) : null}

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        data-tour="account-overview-cards"
      >
        <div className="rounded-2xl border app-surface-panel app-panel-padding" data-tour="account-owner">
          <p className="app-text-meta-label">Kontoinhaber</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{loading ? "Lädt..." : owner}</p>
        </div>
        <div className="rounded-2xl border app-surface-panel app-panel-padding" data-tour="account-email">
          <p className="app-text-meta-label">E-Mail</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{loading ? "Lädt..." : email}</p>
        </div>
        <div className="rounded-2xl border app-surface-panel app-panel-padding" data-tour="account-plan">
          <p className="app-text-meta-label">Aktiver Plan</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{loading ? "Lädt..." : planName}</p>
        </div>
        <div className="rounded-2xl border app-surface-panel app-panel-padding" data-tour="account-billing">
          <p className="app-text-meta-label">Nächste Abrechnung</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{loading ? "Lädt..." : nextBilling}</p>
        </div>
      </div>

      <div className="space-y-3" data-tour="account-actions">
        <p className="app-text-meta-label px-1">Weitere Aktionen</p>
        <Link
          href="/app/konto/loeschen"
          data-tour="account-delete"
          className="inline-flex w-full sm:w-auto"
        >
          <Button variant="destructive" className="w-full sm:w-auto">
            Konto löschen
          </Button>
        </Link>
      </div>
    </div>
  );
}
