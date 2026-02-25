"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { trackPublicEvent } from "@/lib/funnel/public-track";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE").format(Math.round(value));
}

export default function ROICalculator() {
  const pathname = usePathname();
  const [anfragenProWoche, setAnfragenProWoche] = useState(40);
  const [minutenProAnfrage, setMinutenProAnfrage] = useState(8);
  const [standardfallAnteil, setStandardfallAnteil] = useState(65);
  const [autoAnteilBeiStandard, setAutoAnteilBeiStandard] = useState(55);

  const model = useMemo(() => {
    const standardFaelle = anfragenProWoche * (standardfallAnteil / 100);
    const autoFaelle = standardFaelle * (autoAnteilBeiStandard / 100);

    // Konservativer Sicherheitsabschlag, damit die Schätzung nicht überoptimistisch wird.
    const wirksameErsparnisProFall = minutenProAnfrage * 0.75;
    const gesparteMinutenProWoche = autoFaelle * wirksameErsparnisProFall;
    const gesparteStundenProMonat = (gesparteMinutenProWoche * 4.33) / 60;

    return {
      standardFaelle,
      autoFaelle,
      gesparteMinutenProWoche,
      gesparteStundenProMonat,
    };
  }, [anfragenProWoche, minutenProAnfrage, standardfallAnteil, autoAnteilBeiStandard]);

  useEffect(() => {
    void trackPublicEvent({
      event: "marketing_roi_impression",
      source: "website",
      path: pathname || "/",
      pageGroup: "marketing",
      meta: { component: "ROICalculator" },
    });
  }, [pathname]);

  return (
    <section id="roi" className="marketing-soft-cool py-20 md:py-28">
      <Container>
        <div className="max-w-[74ch]">
          <h2 className="h2">ROI-Rechner: Zeitpotenzial realistisch einschätzen</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Tragen Sie Ihre Werte ein. Die Schätzung ist bewusst konservativ und dient als Planungsgrundlage, nicht als
            Garantiezahl.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <article className="card-base p-6 lg:col-span-7 md:p-7">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Anfragen pro Woche</span>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={anfragenProWoche}
                  onChange={(e) => setAnfragenProWoche(clamp(Number(e.target.value || 0), 5, 500))}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Minuten pro Anfrage (heute)</span>
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={minutenProAnfrage}
                  onChange={(e) => setMinutenProAnfrage(clamp(Number(e.target.value || 0), 2, 30))}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  Anteil Standardfälle: {standardfallAnteil} %
                </span>
                <input
                  type="range"
                  min={20}
                  max={90}
                  step={1}
                  value={standardfallAnteil}
                  onChange={(e) => setStandardfallAnteil(clamp(Number(e.target.value || 0), 20, 90))}
                  className="mt-2 w-full accent-[var(--gold)]"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  Auto-Anteil innerhalb Standardfälle: {autoAnteilBeiStandard} %
                </span>
                <input
                  type="range"
                  min={20}
                  max={90}
                  step={1}
                  value={autoAnteilBeiStandard}
                  onChange={(e) => setAutoAnteilBeiStandard(clamp(Number(e.target.value || 0), 20, 90))}
                  className="mt-2 w-full accent-[var(--gold)]"
                />
              </label>
            </div>
          </article>

          <article className="card-base lg:col-span-5 overflow-hidden p-0">
            <div className="h-1 w-full bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
            <div className="p-6 md:p-7">
              <p className="text-sm font-semibold text-[var(--text)]">Konservative Modellrechnung</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Standardfälle/Woche</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatNumber(model.standardFaelle)}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Auto-Fälle/Woche</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatNumber(model.autoFaelle)}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Gesparte Stunden/Monat</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--text)]">
                    {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(model.gesparteStundenProMonat)}
                  </p>
                </div>
              </div>

              <p className="helper mt-4">
                Annahme: Nur ein Teil der heutigen Bearbeitungszeit ist realistisch automatisierbar, da Freigaben,
                Sonderfälle und Qualitätsgrenzen bewusst erhalten bleiben.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="btn-primary"
                  onClick={() =>
                    trackPublicEvent({
                      event: "marketing_roi_signup_click",
                      source: "website",
                      path: pathname || "/",
                      pageGroup: "marketing",
                      meta: {
                        anfragen_pro_woche: anfragenProWoche,
                        minuten_pro_anfrage: minutenProAnfrage,
                        standardfall_anteil: standardfallAnteil,
                        auto_anteil_standard: autoAnteilBeiStandard,
                        gesparte_stunden_monat: Number(model.gesparteStundenProMonat.toFixed(2)),
                      },
                    })
                  }
                >
                  14 Tage testen
                </Link>
                <Link
                  href="/produkt#setup"
                  className="btn-secondary"
                  onClick={() =>
                    trackPublicEvent({
                      event: "marketing_roi_setup_click",
                      source: "website",
                      path: pathname || "/",
                      pageGroup: "marketing",
                      meta: { gesparte_stunden_monat: Number(model.gesparteStundenProMonat.toFixed(2)) },
                    })
                  }
                >
                  Safe-Start ansehen
                </Link>
              </div>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
