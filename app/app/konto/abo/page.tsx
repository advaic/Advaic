"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const isFree = (plan?.key || "free") === "free";

  const statusLabel = useMemo(() => {
    const s = String(plan?.status || "inactive");
    if (s === "active") return "Aktiv";
    if (s === "trialing") return "Testphase";
    if (s === "past_due") return "Überfällig";
    if (s === "canceled") return "Gekündigt";
    if (s === "unpaid") return "Unbezahlt";
    if (s === "incomplete") return "Unvollständig";
    return "Kein aktives Abo";
  }, [plan?.status]);

  const showDunningWarning =
    !!dunning?.is_active ||
    ["past_due", "unpaid", "incomplete"].includes(
      String(plan?.status || "").toLowerCase(),
    );

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
    <div className="space-y-8" data-tour="account-link-abozahlungen">
      <div>
        <h1 className="text-2xl font-bold">Abo & Zahlungen</h1>
        <p className="text-muted-foreground text-sm">
          Verwalte dein Abo, Zahlungen und Rechnungen.
        </p>
      </div>

      {checkoutParam === "success" ? (
        <div
          className={`rounded-lg border p-4 text-sm ${
            syncingAfterCheckout
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-emerald-300 bg-emerald-50 text-emerald-900"
          }`}
        >
          <p className="font-medium">
            {syncingAfterCheckout
              ? "Checkout abgeschlossen. Wir synchronisieren dein Abo gerade."
              : "Checkout erfolgreich. Dein Abo ist aktiv."}
          </p>
          <p className="mt-1">
            {syncingAfterCheckout
              ? "Falls der Status noch nicht aktualisiert ist, laden wir automatisch nach."
              : "Auto-Senden und Follow-ups bleiben damit aktiv."}
          </p>
        </div>
      ) : null}

      {checkoutParam === "cancel" ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Checkout abgebrochen</p>
          <p className="mt-1">
            Es wurde keine Zahlung ausgelöst. Sie können den Vorgang jederzeit neu starten.
          </p>
        </div>
      ) : null}

      {upgradeRequiredParam && checkoutParam !== "success" ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Starter erforderlich</p>
          <p className="mt-1">
            Deine Testphase ist beendet. Aktiviere Starter, damit Auto-Senden und Follow-ups weiterlaufen.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="border rounded-lg p-6 bg-muted/30 text-sm text-muted-foreground">
          Lade Billing-Daten...
        </div>
      ) : (
        <>
          <div className="border rounded-lg p-6 bg-muted/30 space-y-2">
            <h2 className="font-semibold text-lg">Aktueller Plan</h2>
            <p className="text-sm">
              {plan?.name || "Advaic Free"} {plan?.price_monthly_cents ? `• ${formatMoney(plan.price_monthly_cents, plan.currency)}/${plan.interval === "year" ? "Jahr" : "Monat"}` : ""}
            </p>
            {access?.state === "trial_active" ? (
              <div
                className={`mt-2 rounded-lg border p-3 text-sm ${
                  access.is_urgent
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-sky-200 bg-sky-50 text-sky-900"
                }`}
              >
                <p className="font-medium">
                  Testphase Tag {access.trial_day_number} von {access.trial_days_total}
                </p>
                <p className="mt-1">
                  Noch {access.trial_days_remaining} Tage bis zur Aktivierung von Starter.
                </p>
              </div>
            ) : null}
            {access?.state === "trial_expired" ? (
              <div className="mt-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">Testphase beendet</p>
                <p className="mt-1">
                  Auto-Senden und Follow-ups sind pausiert, bis Starter aktiv ist.
                </p>
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">Status: {statusLabel}</p>
            <p className="text-sm text-muted-foreground">
              Nächste Verlängerung: {formatDate(plan?.current_period_end || null)}
            </p>
            <p className="text-sm text-muted-foreground" data-tour="account-link-kontoloschen">
              Kündigung und Tarifwechsel erfolgen über das Billing-Portal.
            </p>
            {plan?.cancel_at_period_end ? (
              <p className="text-sm text-amber-700">
                Kündigung zum Periodenende aktiv.
              </p>
            ) : null}

            {showDunningWarning ? (
              <div className="mt-3 border border-red-300 bg-red-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-red-800">
                  Zahlung fehlgeschlagen. Bitte Zahlungsmethode aktualisieren.
                </p>
                {typeof dunning?.amount_due_cents === "number" ? (
                  <p className="text-sm text-red-800">
                    Offener Betrag:{" "}
                    {formatMoney(dunning.amount_due_cents, dunning.currency || plan?.currency || null)}
                  </p>
                ) : null}
                {dunning?.failure_message ? (
                  <p className="text-sm text-red-800">Grund: {dunning.failure_message}</p>
                ) : null}
                {dunning?.next_payment_attempt_at ? (
                  <p className="text-xs text-red-700">
                    Nächster Zahlungsversuch: {formatDate(dunning.next_payment_attempt_at)}
                  </p>
                ) : null}
                {dunning?.last_email_sent_at ? (
                  <p className="text-xs text-red-700">
                    E-Mail-Hinweis gesendet am: {formatDate(dunning.last_email_sent_at)}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" onClick={openPortal} disabled={busy !== null}>
                    Zahlungsmethode aktualisieren
                  </Button>
                  {dunning?.hosted_invoice_url ? (
                    <a href={dunning.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline">Rechnung öffnen</Button>
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant={isFree ? "default" : "outline"}
                onClick={openCheckout}
                disabled={busy !== null}
              >
                {busy === "checkout"
                  ? "Weiterleiten..."
                  : isFree
                    ? "Starter aktivieren"
                    : "Starter verwalten"}
              </Button>
              <Button
                variant="outline"
                onClick={openPortal}
                disabled={busy !== null}
              >
                {busy === "portal" ? "Öffne Portal..." : "Zahlungen verwalten"}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-muted/30 space-y-4">
            <h2 className="font-semibold text-lg">Rechnungen</h2>
            {!summary?.invoices?.length ? (
              <p className="text-sm text-muted-foreground">Noch keine Rechnungen vorhanden.</p>
            ) : (
              <div className="space-y-3">
                {summary.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border rounded p-3 bg-background"
                  >
                    <div className="text-sm">
                      <p className="font-medium">{formatMoney(inv.amount_paid_cents ?? inv.amount_due_cents, inv.currency)}</p>
                      <p className="text-muted-foreground">
                        {formatDate(inv.period_start)} - {formatDate(inv.period_end)}
                      </p>
                      <p className="text-muted-foreground">Status: {inv.status || "—"}</p>
                    </div>
                    <div className="flex gap-2">
                      {inv.hosted_invoice_url ? (
                        <a
                          href={inv.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline">Rechnung öffnen</Button>
                        </a>
                      ) : null}
                      {inv.invoice_pdf ? (
                        <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline">PDF</Button>
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {error ? (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
