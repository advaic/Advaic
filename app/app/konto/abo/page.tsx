"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PageHeader,
  PrimaryActionBar,
  SectionCard,
  StatCard,
  StatusBadge,
  type StatusTone,
} from "@/components/app-ui";
import { Button } from "@/components/ui/button";
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
      billing: {
        plan_key: string;
        status: string;
        entitled: boolean;
      };
    };
    plan: {
      key: string;
      name: string;
      status: string;
      price_monthly_cents: number | null;
      currency: string | null;
      interval: string | null;
      current_period_start: string | null;
      current_period_end: string | null;
      cancel_at_period_end: boolean;
    };
    dunning: {
      is_active: boolean;
      status: string;
      amount_due_cents: number | null;
      currency: string | null;
      failure_message: string | null;
      last_failed_at: string | null;
      next_payment_attempt_at: string | null;
      hosted_invoice_url: string | null;
      invoice_pdf: string | null;
      last_email_sent_at: string | null;
    } | null;
    invoices: Array<{
      id: string;
      status: string | null;
      amount_due_cents: number | null;
      amount_paid_cents: number | null;
      currency: string | null;
      hosted_invoice_url: string | null;
      invoice_pdf: string | null;
      period_start: string | null;
      period_end: string | null;
      paid_at: string | null;
      created_at: string | null;
    }>;
  };
  error?: string;
};

function formatMoney(cents: number | null, currency: string | null) {
  if (typeof cents !== "number") return "—";
  const c = (currency || "EUR").toUpperCase();
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: c,
  }).format(cents / 100);
}

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

export default function AboPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "checkout" | "portal">(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<BillingSummaryResponse["summary"] | null>(
    null,
  );
  const [syncingAfterCheckout, setSyncingAfterCheckout] = useState(false);

  const checkoutParam = String(searchParams.get("checkout") || "").toLowerCase();
  const upgradeRequiredParam = searchParams.get("upgrade_required") === "1";
  const sourceParam = String(searchParams.get("source") || "").trim();
  const stageParam = String(searchParams.get("stage") || "").trim();
  const nextPath = useMemo(() => {
    const raw = String(searchParams.get("next") || "").trim();
    if (!raw.startsWith("/") || raw.startsWith("//")) return "";
    return raw;
  }, [searchParams]);

  const loadSummary = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError("");
    const res = await fetch("/api/billing/summary", { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as BillingSummaryResponse;
    if (!res.ok || !data?.ok || !data.summary) {
      setError(String(data?.error || "Billing-Daten konnten nicht geladen werden."));
      setSummary(null);
      if (!opts?.silent) setLoading(false);
      return null;
    }
    setSummary(data.summary);
    if (!opts?.silent) setLoading(false);
    return data.summary;
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void trackFunnelEvent({
      event: "billing_upgrade_page_viewed",
      source: "account_billing",
      path: "/app/konto/abo",
      meta: {
        source: sourceParam || null,
        stage: stageParam || null,
        upgrade_required: upgradeRequiredParam,
      },
    });
    // track a meaningful entry once per param combination
  }, [sourceParam, stageParam, upgradeRequiredParam]);

  useEffect(() => {
    if (checkoutParam === "success") {
      void trackFunnelEvent({
        event: "billing_checkout_return_success",
        source: "account_billing",
      });
      return;
    }
    if (checkoutParam === "cancel") {
      void trackFunnelEvent({
        event: "billing_checkout_return_cancel",
        source: "account_billing",
      });
    }
  }, [checkoutParam]);

  useEffect(() => {
    if (checkoutParam !== "success") {
      setSyncingAfterCheckout(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    setSyncingAfterCheckout(true);

    const run = async () => {
      attempts += 1;
      const next = await loadSummary({ silent: true });
      if (cancelled) return;

      const settled =
        next?.access?.state === "paid_active" ||
        ["active", "trialing"].includes(String(next?.plan?.status || "").toLowerCase());

      if (settled || attempts >= 8) {
        setSyncingAfterCheckout(false);
        if (
          settled &&
          nextPath &&
          nextPath !== "/app/konto/abo" &&
          nextPath !== "/app/konto/abo/"
        ) {
          window.setTimeout(() => {
            router.replace(nextPath);
          }, 1200);
        }
        return;
      }

      window.setTimeout(() => {
        void run();
      }, 3000);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [checkoutParam, loadSummary, nextPath, router]);

  const plan = summary?.plan;
  const access = summary?.access;
  const dunning = summary?.dunning || null;
  const internalOverride = !!access?.internal_override;
  const isFree = (plan?.key || "free") === "free";

  const statusLabel = useMemo(() => {
    if (internalOverride) return "Aktiv";
    const s = String(plan?.status || "inactive");
    if (s === "active") return "Aktiv";
    if (s === "trialing") return "Testphase";
    if (s === "past_due") return "Überfällig";
    if (s === "canceled") return "Gekündigt";
    if (s === "unpaid") return "Unbezahlt";
    if (s === "incomplete") return "Unvollständig";
    return "Kein aktives Abo";
  }, [internalOverride, plan?.status]);

  const showDunningWarning =
    (!internalOverride && !!dunning?.is_active) ||
    ["past_due", "unpaid", "incomplete"].includes(
      String(plan?.status || "").toLowerCase(),
    );
  const invoiceCount = summary?.invoices?.length ?? 0;
  const renewalDate = formatDate(plan?.current_period_end || null);
  const planPriceLabel = plan?.price_monthly_cents
    ? `${formatMoney(plan.price_monthly_cents, plan.currency)}/${plan.interval === "year" ? "Jahr" : "Monat"}`
    : "Preis wird individuell geführt";
  const billingTone: StatusTone =
    access?.state === "trial_expired"
      ? "danger"
      : showDunningWarning
        ? "warning"
        : access?.state === "paid_active"
          ? "success"
          : "neutral";

  const openCheckout = async () => {
    void trackFunnelEvent({
      event: "billing_checkout_started",
      source: "account_billing",
      path: "/app/konto/abo",
      meta: {
        source: sourceParam || null,
        stage: stageParam || null,
        trial_state: access?.state || null,
        trial_days_remaining:
          typeof access?.trial_days_remaining === "number"
            ? access.trial_days_remaining
            : null,
      },
    });

    setBusy("checkout");
    setError("");
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_key: "starter_monthly",
        success_path: nextPath
          ? `/app/konto/abo?checkout=success&next=${encodeURIComponent(nextPath)}`
          : "/app/konto/abo?checkout=success",
        cancel_path: nextPath
          ? `/app/konto/abo?checkout=cancel&next=${encodeURIComponent(nextPath)}`
          : "/app/konto/abo?checkout=cancel",
      }),
    });
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok || !data?.checkout_url) {
      setError(String(data?.error || "Checkout konnte nicht gestartet werden."));
      setBusy(null);
      return;
    }
    window.location.assign(String(data.checkout_url));
  };

  const openPortal = async () => {
    void trackFunnelEvent({
      event: "billing_portal_opened",
      source: "account_billing",
      path: "/app/konto/abo",
      meta: {
        source: sourceParam || null,
        stage: stageParam || null,
      },
    });

    setBusy("portal");
    setError("");
    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ return_path: "/app/konto/abo" }),
    });
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok || !data?.portal_url) {
      setError(String(data?.error || "Billing-Portal konnte nicht geöffnet werden."));
      setBusy(null);
      return;
    }
    window.location.assign(String(data.portal_url));
  };

  return (
    <div className="app-page-stack" data-tour="account-billing-page">
      <PageHeader
        sticky={false}
        dataTour="account-billing-header"
        title={
          <h1 className="app-text-page-title" data-tour="account-billing-title">
            Abo & Zahlungen
          </h1>
        }
        meta={
          <>
            <StatusBadge tone="brand">Advaic</StatusBadge>
            <StatusBadge tone={billingTone}>{statusLabel}</StatusBadge>
            {internalOverride ? (
              <StatusBadge tone="success">Interner Zugriff</StatusBadge>
            ) : null}
          </>
        }
        description="Verwalte dein Abo, Zahlungen und Rechnungen in derselben ruhigen Settings-Struktur wie den Rest der App."
        actions={
          !loading ? (
            <>
              {!internalOverride ? (
                <Button
                  onClick={openCheckout}
                  disabled={busy !== null}
                  className="w-full sm:w-auto"
                  data-tour="account-billing-cta-checkout"
                >
                  {busy === "checkout"
                    ? "Weiterleiten…"
                    : isFree
                      ? "Starter aktivieren"
                      : "Starter verwalten"}
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={openPortal}
                disabled={busy !== null || internalOverride}
                className="w-full sm:w-auto"
                data-tour="account-billing-cta-portal"
              >
                {busy === "portal" ? "Öffne Portal…" : "Zahlungen verwalten"}
              </Button>
            </>
          ) : null
        }
      />

      {checkoutParam === "success" ? (
        <SectionCard
          surface="panel"
          data-tour="account-billing-checkout-success"
          title={syncingAfterCheckout ? "Checkout synchronisiert" : "Checkout erfolgreich"}
          description={
            syncingAfterCheckout
              ? "Wir aktualisieren deinen Plan gerade im Hintergrund und laden den Status automatisch nach."
              : "Dein Abo ist aktiv. Auto-Senden und Follow-ups bleiben damit nutzbar."
          }
          meta={<StatusBadge tone={syncingAfterCheckout ? "warning" : "success"}>{syncingAfterCheckout ? "Synchronisiert…" : "Aktiv"}</StatusBadge>}
        >
          <div className="text-sm text-gray-700">
            {syncingAfterCheckout
              ? "Falls der Status noch nicht umspringt, läuft die Synchronisierung bereits."
              : "Du musst nichts weiter tun. Die Freischaltung ist abgeschlossen."}
          </div>
        </SectionCard>
      ) : null}

      {checkoutParam === "cancel" ? (
        <SectionCard
          surface="panel"
          data-tour="account-billing-checkout-cancel"
          title="Checkout abgebrochen"
          description="Es wurde keine Zahlung ausgelöst. Du kannst den Vorgang jederzeit neu starten."
        >
          <div className="text-sm text-gray-700">
            Der bisherige Planstatus bleibt unverändert.
          </div>
        </SectionCard>
      ) : null}

      {upgradeRequiredParam && checkoutParam !== "success" ? (
        <SectionCard
          surface="panel"
          data-tour="account-billing-upgrade-required"
          title="Starter erforderlich"
          description="Deine Testphase ist beendet. Aktiviere Starter, damit Auto-Senden und Follow-ups weiterlaufen."
          meta={<StatusBadge tone="danger">Upgrade nötig</StatusBadge>}
        >
          <div className="text-sm text-gray-700">
            Ohne aktiven Starter-Plan bleiben Automationen pausiert.
          </div>
        </SectionCard>
      ) : null}

      {error ? (
        <SectionCard
          surface="panel"
          data-tour="account-billing-error"
          title="Billing-Daten konnten nicht geladen werden"
          description={error}
          meta={<StatusBadge tone="danger">Fehler</StatusBadge>}
        >
          <div className="text-sm text-gray-700">
            Bitte lade die Seite erneut oder öffne später noch einmal das Billing-Portal.
          </div>
        </SectionCard>
      ) : null}

      {loading ? (
        <SectionCard
          surface="panel"
          data-tour="account-billing-loading"
          title="Billing-Daten werden geladen"
          description="Plan, Zahlungen und Rechnungen werden gerade synchronisiert."
        >
          <div className="text-sm text-gray-600">Einen Moment bitte…</div>
        </SectionCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" data-tour="account-billing-stats">
            <StatCard
              title="Aktiver Plan"
              value={plan?.name || "Advaic Free"}
              hint={planPriceLabel}
            />
            <StatCard
              title="Planstatus"
              value={statusLabel}
              hint={
                internalOverride
                  ? "Intern freigeschaltet, kein Checkout nötig."
                  : access?.state === "trial_active"
                    ? `Noch ${access.trial_days_remaining} Tage Testphase.`
                    : access?.state === "trial_expired"
                      ? "Automationen pausiert, bis Starter aktiv ist."
                      : "Abo ist aktiv und betriebsbereit."
              }
            />
            <StatCard
              title="Nächste Verlängerung"
              value={renewalDate}
              hint={plan?.cancel_at_period_end ? "Kündigung zum Periodenende aktiv." : "Keine Kündigung vorgemerkt."}
            />
            <StatCard
              title="Rechnungen"
              value={invoiceCount}
              hint={invoiceCount > 0 ? "Vergangene Belege und PDFs stehen bereit." : "Noch keine Rechnungen vorhanden."}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <SectionCard
                data-tour="account-billing-plan-card"
                title="Planstatus & Zugriff"
                description="Hier siehst du, ob dein Zugang stabil freigeschaltet ist und was als Nächstes relevant wird."
              >
                <div className="space-y-3">
                  <div className="rounded-xl border app-surface-muted px-4 py-4">
                    <div className="app-text-meta-label">Aktueller Plan</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {plan?.name || "Advaic Free"}
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {planPriceLabel}
                    </div>
                  </div>

                  {internalOverride ? (
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                      <div className="font-medium">Interner Premium-Zugang aktiv</div>
                      <div className="mt-1">
                        Dieser Account wird intern wie ein aktiver Starter-Plan behandelt. Es ist kein Checkout und keine eigene Zahlung nötig.
                      </div>
                    </div>
                  ) : null}

                  {access?.state === "trial_active" ? (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-900">
                      <div className="font-medium">
                        Testphase Tag {access.trial_day_number} von {access.trial_days_total}
                      </div>
                      <div className="mt-1">
                        Noch {access.trial_days_remaining} Tage bis zur Aktivierung von Starter.
                      </div>
                    </div>
                  ) : null}

                  {access?.state === "trial_expired" ? (
                    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-4 text-sm text-red-800">
                      <div className="font-medium">Testphase beendet</div>
                      <div className="mt-1">
                        Auto-Senden und Follow-ups sind pausiert, bis Starter aktiv ist.
                      </div>
                    </div>
                  ) : null}

                  {showDunningWarning ? (
                    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-4 text-sm text-red-800">
                      <div className="font-medium">Zahlung fehlgeschlagen</div>
                      <div className="mt-1">
                        Bitte aktualisiere deine Zahlungsmethode, damit dein Zugang stabil bleibt.
                      </div>
                      {typeof dunning?.amount_due_cents === "number" ? (
                        <div className="mt-2">
                          Offener Betrag:{" "}
                          {formatMoney(dunning.amount_due_cents, dunning.currency || plan?.currency || null)}
                        </div>
                      ) : null}
                      {dunning?.failure_message ? (
                        <div className="mt-1">Grund: {dunning.failure_message}</div>
                      ) : null}
                      {dunning?.next_payment_attempt_at ? (
                        <div className="mt-1 text-xs text-red-700">
                          Nächster Zahlungsversuch: {formatDate(dunning.next_payment_attempt_at)}
                        </div>
                      ) : null}
                      {dunning?.last_email_sent_at ? (
                        <div className="mt-1 text-xs text-red-700">
                          E-Mail-Hinweis gesendet am: {formatDate(dunning.last_email_sent_at)}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="rounded-xl border app-surface-panel px-4 py-4 text-sm text-gray-700">
                    <div className="app-text-meta-label">Abrechnungslogik</div>
                    <div className="mt-2" data-tour="account-link-kontoloschen">
                      Kündigung und Tarifwechsel erfolgen über das Billing-Portal.
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                data-tour="account-billing-invoices"
                title="Rechnungen"
                description="Alle verfügbaren Rechnungen und PDFs an einem Ort."
              >
                {!summary?.invoices?.length ? (
                  <div className="rounded-xl border app-surface-muted px-4 py-4 text-sm text-gray-600">
                    Noch keine Rechnungen vorhanden.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {summary.invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="rounded-xl border app-surface-panel px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {formatMoney(inv.amount_paid_cents ?? inv.amount_due_cents, inv.currency)}
                            </div>
                            <div className="mt-1 text-gray-600">
                              {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                            </div>
                            <div className="mt-1 text-gray-600">Status: {inv.status || "—"}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {inv.hosted_invoice_url ? (
                              <a
                                href={inv.hosted_invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="secondary">Rechnung öffnen</Button>
                              </a>
                            ) : null}
                            {inv.invoice_pdf ? (
                              <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline">PDF</Button>
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="space-y-4">
              <SectionCard
                data-tour="account-billing-actions"
                title="Nächste sinnvolle Aktion"
                description="Die wichtigsten Billing-Schritte direkt in einer kompakten Seitenleiste."
              >
                <div className="space-y-3">
                  <div className="rounded-xl border app-surface-muted px-4 py-4 text-sm text-gray-700">
                    {internalOverride
                      ? "Dieser Account ist intern freigeschaltet. Du musst kein Abo abschließen und keine Zahlung auslösen."
                      : showDunningWarning
                        ? "Aktualisiere zuerst die Zahlungsmethode, damit es keinen Unterbruch im Versand gibt."
                        : isFree || access?.state === "trial_expired"
                          ? "Aktiviere Starter, damit Auto-Senden und Follow-ups weiterlaufen."
                          : "Verwalte Plan, Zahlungsmethode und Kündigung zentral über das Billing-Portal."}
                  </div>

                  <PrimaryActionBar
                    data-tour="account-billing-action-bar"
                    leading={
                      <>
                        <StatusBadge tone={billingTone}>
                          {internalOverride ? "Intern aktiv" : statusLabel}
                        </StatusBadge>
                        {plan?.cancel_at_period_end ? (
                          <StatusBadge tone="warning">Kündigung aktiv</StatusBadge>
                        ) : null}
                      </>
                    }
                    trailing={
                      <>
                        {!internalOverride ? (
                          <Button
                            onClick={openCheckout}
                            disabled={busy !== null}
                            className="w-full sm:w-auto"
                          >
                            {busy === "checkout"
                              ? "Weiterleiten…"
                              : isFree || access?.state === "trial_expired"
                                ? "Starter aktivieren"
                                : "Starter verwalten"}
                          </Button>
                        ) : null}
                        <Button
                          variant="secondary"
                          onClick={openPortal}
                          disabled={busy !== null || internalOverride}
                          className="w-full sm:w-auto"
                        >
                          {busy === "portal" ? "Öffne Portal…" : "Billing-Portal"}
                        </Button>
                      </>
                    }
                  />

                  {dunning?.hosted_invoice_url ? (
                    <a href={dunning.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full">
                        Letzte offene Rechnung öffnen
                      </Button>
                    </a>
                  ) : null}
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
