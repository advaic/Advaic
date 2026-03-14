"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { trackPublicEvent } from "@/lib/funnel/public-track";
import { MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m} Min`;
  return `${h} h ${m.toString().padStart(2, "0")} Min`;
}

const stepWeights = [
  { key: "triage", label: "Eingang prüfen & priorisieren", weight: 0.24 },
  { key: "reply", label: "Antwort erstellen", weight: 0.43 },
  { key: "followup", label: "Nachfassen koordinieren", weight: 0.21 },
  { key: "log", label: "Status & Verlauf dokumentieren", weight: 0.12 },
];

type ManualVsAdvaicComparisonProps = {
  id?: string;
};

export default function ManualVsAdvaicComparison({ id = "vergleich" }: ManualVsAdvaicComparisonProps) {
  const pathname = usePathname() || "/";
  const [dailyRequests, setDailyRequests] = useState(24);
  const [standardShare, setStandardShare] = useState(65);
  const [sensitiveShare, setSensitiveShare] = useState(20);

  useEffect(() => {
    void trackPublicEvent({
      event: "marketing_manual_vs_advaic_impression",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: { component: "ManualVsAdvaicComparison" },
    });
  }, [pathname]);

  const model = useMemo(() => {
    const manualPerRequest = 6.8 + sensitiveShare * 0.05;
    const manualDailyMinutes =
      dailyRequests * manualPerRequest + (dailyRequests > 35 ? 24 : dailyRequests > 20 ? 16 : 10);

    const standardRequests = dailyRequests * (standardShare / 100);
    const nonStandardRequests = dailyRequests - standardRequests;

    const advaicDailyMinutes =
      standardRequests * 2.2 +
      nonStandardRequests * 5.1 +
      sensitiveShare * 0.65 +
      (dailyRequests > 35 ? 14 : 10);

    const safeAdvaicDailyMinutes = Math.min(advaicDailyMinutes, manualDailyMinutes * 0.92);
    const savedDailyMinutes = Math.max(0, manualDailyMinutes - safeAdvaicDailyMinutes);

    const manualRisk = clamp(34 + dailyRequests * 0.85 + sensitiveShare * 0.6, 18, 95);
    const advaicRisk = clamp(9 + sensitiveShare * 0.45 + (100 - standardShare) * 0.17, 6, 72);

    const manualTransparency = clamp(36 + (100 - dailyRequests) * 0.08, 26, 55);
    const advaicTransparency = clamp(88 - sensitiveShare * 0.08, 76, 95);

    const rows = stepWeights.map((step) => ({
      ...step,
      manualMinutes: manualDailyMinutes * step.weight,
      advaicMinutes: safeAdvaicDailyMinutes * step.weight,
    }));

    return {
      manualDailyMinutes,
      advaicDailyMinutes: safeAdvaicDailyMinutes,
      savedDailyMinutes,
      savedMonthlyHours: (savedDailyMinutes * 22) / 60,
      manualRisk,
      advaicRisk,
      manualTransparency,
      advaicTransparency,
      rows,
    };
  }, [dailyRequests, sensitiveShare, standardShare]);

  const onPrimaryClick = () =>
    trackPublicEvent({
      event: "marketing_manual_vs_advaic_signup_click",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: {
        daily_requests: dailyRequests,
        standard_share: standardShare,
        sensitive_share: sensitiveShare,
        saved_daily_minutes: Number(model.savedDailyMinutes.toFixed(1)),
      },
    });

  return (
    <section id={id} className="marketing-section-clear py-20 md:py-28">
      <Container>
        <div className="max-w-[74ch]">
          <h2 className="h2">Manuell vs. Advaic: klare Gegenüberstellung pro Prozessschritt</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Diese Vergleichsansicht zeigt transparent, wo im manuellen Ablauf Zeit, Risiko und Intransparenz entstehen
            und wie Advaic das mit Guardrails, Freigabe und Statuslogik strukturiert reduziert.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <article className="card-base p-6 lg:col-span-5 md:p-7">
            <h3 className="h3">Ihr Ausgangsprofil</h3>
            <p className="helper mt-2">Passen Sie die Werte an, um den Vergleich an Ihren Alltag anzunähern.</p>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Anfragen pro Tag: {dailyRequests}</span>
                <input
                  type="range"
                  min={5}
                  max={90}
                  step={1}
                  value={dailyRequests}
                  onChange={(e) => setDailyRequests(clamp(Number(e.target.value || 5), 5, 90))}
                  className="mt-2 w-full accent-[var(--gold)]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">
                  Anteil wiederkehrender Erstantworten: {standardShare} %
                </span>
                <input
                  type="range"
                  min={20}
                  max={90}
                  step={1}
                  value={standardShare}
                  onChange={(e) => setStandardShare(clamp(Number(e.target.value || 20), 20, 90))}
                  className="mt-2 w-full accent-[var(--gold)]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">
                  Anteil sensible Fälle (Beschwerde/Konflikt): {sensitiveShare} %
                </span>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={1}
                  value={sensitiveShare}
                  onChange={(e) => setSensitiveShare(clamp(Number(e.target.value || 5), 5, 60))}
                  className="mt-2 w-full accent-[var(--gold)]"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Manuell pro Tag</p>
                <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatMinutes(model.manualDailyMinutes)}</p>
              </article>
              <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Mit Advaic pro Tag</p>
                <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatMinutes(model.advaicDailyMinutes)}</p>
              </article>
            </div>

            <article className="mt-3 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Konservativer Effekt</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[var(--text)]">
                {formatMinutes(model.savedDailyMinutes)} weniger pro Tag
              </p>
              <p className="helper mt-2">
                Das entspricht rund{" "}
                {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(model.savedMonthlyHours)} Stunden
                pro Monat bei 22 Arbeitstagen.
              </p>
            </article>
          </article>

          <article className="card-base p-6 lg:col-span-7 md:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Risiko für Fehlreaktionen</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Manuell: <span className="font-semibold text-[var(--text)]">{Math.round(model.manualRisk)} / 100</span>
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Mit Advaic:{" "}
                  <span className="font-semibold text-[var(--text)]">{Math.round(model.advaicRisk)} / 100</span>
                </p>
              </article>
              <article className="rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Transparenz im Verlauf</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Manuell:{" "}
                  <span className="font-semibold text-[var(--text)]">{Math.round(model.manualTransparency)} / 100</span>
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Mit Advaic:{" "}
                  <span className="font-semibold text-[var(--text)]">{Math.round(model.advaicTransparency)} / 100</span>
                </p>
              </article>
            </div>

            <div className="mt-5 space-y-3">
              {model.rows.map((row) => (
                <article key={row.key} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text)]">{row.label}</p>
                    <p className="text-xs text-[var(--muted)]">Zeitbedarf pro Tag</p>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-[var(--border)]">
                      <p className="text-xs text-[var(--muted)]">Manuell</p>
                      <p className="text-sm font-semibold text-[var(--text)]">{formatMinutes(row.manualMinutes)}</p>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-[var(--border)]">
                      <p className="text-xs text-[var(--muted)]">Mit Advaic</p>
                      <p className="text-sm font-semibold text-[var(--text)]">{formatMinutes(row.advaicMinutes)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="helper mt-5">
              Hinweis: Die Berechnung ist ein konservatives Planungsmodell, keine Ergebnisgarantie. Ziel ist eine
              belastbare Erstorientierung vor dem Test.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup?entry=vergleich" className="btn-primary" onClick={() => void onPrimaryClick()}>
                {MARKETING_PRIMARY_CTA_LABEL}
              </Link>
              <Link href="/produkt#setup" className="btn-secondary">
                Startkonfiguration berechnen
              </Link>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
