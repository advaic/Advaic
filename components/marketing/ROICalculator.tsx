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

type PresetKey = "solo" | "team" | "volume";

const PRESETS: Record<
  PresetKey,
  {
    label: string;
    anfragenProWoche: number;
    minutenProAnfrage: number;
    standardfallAnteil: number;
    autoAnteilBeiStandard: number;
    firstResponseHeuteMin: number;
  }
> = {
  solo: {
    label: "Solo-Makler",
    anfragenProWoche: 32,
    minutenProAnfrage: 9,
    standardfallAnteil: 62,
    autoAnteilBeiStandard: 45,
    firstResponseHeuteMin: 110,
  },
  team: {
    label: "Kleines Team",
    anfragenProWoche: 58,
    minutenProAnfrage: 8,
    standardfallAnteil: 68,
    autoAnteilBeiStandard: 56,
    firstResponseHeuteMin: 85,
  },
  volume: {
    label: "Hohes Volumen",
    anfragenProWoche: 110,
    minutenProAnfrage: 7,
    standardfallAnteil: 74,
    autoAnteilBeiStandard: 64,
    firstResponseHeuteMin: 70,
  },
};

export default function ROICalculator() {
  const pathname = usePathname();
  const [preset, setPreset] = useState<PresetKey>("team");
  const [anfragenProWoche, setAnfragenProWoche] = useState(PRESETS.team.anfragenProWoche);
  const [minutenProAnfrage, setMinutenProAnfrage] = useState(PRESETS.team.minutenProAnfrage);
  const [standardfallAnteil, setStandardfallAnteil] = useState(PRESETS.team.standardfallAnteil);
  const [autoAnteilBeiStandard, setAutoAnteilBeiStandard] = useState(PRESETS.team.autoAnteilBeiStandard);
  const [firstResponseHeuteMin, setFirstResponseHeuteMin] = useState(PRESETS.team.firstResponseHeuteMin);

  const applyPreset = (key: PresetKey) => {
    const p = PRESETS[key];
    setPreset(key);
    setAnfragenProWoche(p.anfragenProWoche);
    setMinutenProAnfrage(p.minutenProAnfrage);
    setStandardfallAnteil(p.standardfallAnteil);
    setAutoAnteilBeiStandard(p.autoAnteilBeiStandard);
    setFirstResponseHeuteMin(p.firstResponseHeuteMin);
    void trackPublicEvent({
      event: "marketing_roi_preset_select",
      source: "website",
      path: pathname || "/",
      pageGroup: "marketing",
      meta: { preset: key },
    });
  };

  const model = useMemo(() => {
    const standardFaelle = anfragenProWoche * (standardfallAnteil / 100);
    const autoFaelle = standardFaelle * (autoAnteilBeiStandard / 100);

    // Konservativer Sicherheitsabschlag, damit die Schätzung nicht überoptimistisch wird.
    const wirksameErsparnisProFall = minutenProAnfrage * 0.75;
    const gesparteMinutenProWoche = autoFaelle * wirksameErsparnisProFall;
    const gesparteStundenProMonat = (gesparteMinutenProWoche * 4.33) / 60;
    const autoQuote = clamp(autoFaelle / Math.max(1, anfragenProWoche), 0, 1);
    const manuellePufferzeit = clamp(anfragenProWoche * 0.6, 0, 120);
    const medianFirstResponseHeute = firstResponseHeuteMin + manuellePufferzeit;
    const medianFirstResponseMitAdvaic = Math.max(
      8,
      medianFirstResponseHeute * (1 - autoQuote * 0.58) - autoQuote * 12,
    );
    const firstResponseGewinnMin = Math.max(0, medianFirstResponseHeute - medianFirstResponseMitAdvaic);
    const firstResponseGewinnPct = (firstResponseGewinnMin / Math.max(1, medianFirstResponseHeute)) * 100;
    const within60Heute = clamp(100 - (medianFirstResponseHeute - 30) * 0.9, 12, 95);
    const within60MitAdvaic = clamp(within60Heute + autoQuote * 34, within60Heute + 2, 99);

    return {
      standardFaelle,
      autoFaelle,
      gesparteMinutenProWoche,
      gesparteStundenProMonat,
      autoQuote,
      medianFirstResponseHeute,
      medianFirstResponseMitAdvaic,
      firstResponseGewinnMin,
      firstResponseGewinnPct,
      within60Heute,
      within60MitAdvaic,
    };
  }, [anfragenProWoche, minutenProAnfrage, standardfallAnteil, autoAnteilBeiStandard, firstResponseHeuteMin]);

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
            Tragen Sie Ihre Werte ein. Die Schätzung ist bewusst konservativ und zeigt neben Zeitersparnis auch, wie
            sich die Erstreaktionszeit und die Reaktionsquote im Zielzeitfenster entwickeln kann.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <article className="card-base p-6 lg:col-span-7 md:p-7">
            <div className="mb-5">
              <p className="text-sm font-semibold text-[var(--text)]">Schnellstart-Profil</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                      preset === key
                        ? "bg-[var(--surface-2)] text-[var(--text)] ring-[var(--gold)]"
                        : "bg-white text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]"
                    }`}
                  >
                    {PRESETS[key].label}
                  </button>
                ))}
              </div>
            </div>

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

              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Median Erstreaktion heute (Minuten)</span>
                <input
                  type="number"
                  min={10}
                  max={720}
                  value={firstResponseHeuteMin}
                  onChange={(e) => setFirstResponseHeuteMin(clamp(Number(e.target.value || 0), 10, 720))}
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
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                    Median Erstreaktion mit Advaic
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">
                    {formatNumber(model.medianFirstResponseMitAdvaic)} Min
                  </p>
                  <p className="helper mt-1">
                    Heute: {formatNumber(model.medianFirstResponseHeute)} Min · Verbesserung:{" "}
                    {formatNumber(model.firstResponseGewinnMin)} Min ({formatNumber(model.firstResponseGewinnPct)} %)
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Antworten innerhalb 60 Min</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">
                    {formatNumber(model.within60MitAdvaic)} % (heute: {formatNumber(model.within60Heute)} %)
                  </p>
                  <p className="helper mt-1">
                    Modellannahme: klare Standardfälle laufen schneller durch, unsichere Fälle bleiben in Freigabe.
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
                        first_response_heute_min: firstResponseHeuteMin,
                        standardfall_anteil: standardfallAnteil,
                        auto_anteil_standard: autoAnteilBeiStandard,
                        gesparte_stunden_monat: Number(model.gesparteStundenProMonat.toFixed(2)),
                        first_response_gain_min: Number(model.firstResponseGewinnMin.toFixed(1)),
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
                      meta: {
                        gesparte_stunden_monat: Number(model.gesparteStundenProMonat.toFixed(2)),
                        auto_quote_pct: Number((model.autoQuote * 100).toFixed(1)),
                      },
                    })
                  }
                >
                  Safe-Start ansehen
                </Link>
                <Link
                  href="/roi-rechner"
                  className="btn-secondary"
                  onClick={() =>
                    trackPublicEvent({
                      event: "marketing_roi_detail_click",
                      source: "website",
                      path: pathname || "/",
                      pageGroup: "marketing",
                      meta: { from_component: true },
                    })
                  }
                >
                  Vollständige ROI-Seite
                </Link>
              </div>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
