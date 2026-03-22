"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { trackPublicEvent } from "@/lib/funnel/public-track";
import { MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE").format(Math.round(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value)));
}

function updateDraftValue(
  rawValue: string,
  setDraft: Dispatch<SetStateAction<string>>,
  setCommitted: Dispatch<SetStateAction<number>>,
) {
  if (!/^\d*$/.test(rawValue)) return;
  setDraft(rawValue);
  if (rawValue === "") return;
  setCommitted(Number(rawValue));
}

function commitDraftValue(
  rawValue: string,
  min: number,
  max: number,
  setDraft: Dispatch<SetStateAction<string>>,
  setCommitted: Dispatch<SetStateAction<number>>,
) {
  const nextValue = clamp(rawValue === "" ? min : Number(rawValue), min, max);
  setCommitted(nextValue);
  setDraft(String(nextValue));
}

type PresetKey = "solo" | "team" | "volume";

const PRESETS: Record<
  PresetKey,
  {
    label: string;
    headline: string;
    summary: string;
    watch: string;
    anfragenProWoche: number;
    minutenProAnfrage: number;
    wiederkehrendeQuote: number;
    autoAnteilBeiWiederkehrend: number;
    firstResponseHeuteMin: number;
    stundenSatzEur: number;
    besichtigungsquoteHeute: number;
    conversionUpliftPct: number;
    besichtigungZuAbschlussQuote: number;
    deckungsbeitragProAbschlussEur: number;
  }
> = {
  solo: {
    label: "Solo-Makler",
    headline: "Wenig Leute, aber konstante Postfachlast",
    summary: "Gut, wenn ein einzelner Makler oder eine kleine Assistenz viel Zeit in wiederkehrende Erstantworten verliert.",
    watch: "Wichtig ist hier vor allem, ob ein enger Auto-Senden-Korridor sofort spürbar Zeit für Besichtigungen und Rückrufe freimacht.",
    anfragenProWoche: 32,
    minutenProAnfrage: 9,
    wiederkehrendeQuote: 64,
    autoAnteilBeiWiederkehrend: 50,
    firstResponseHeuteMin: 110,
    stundenSatzEur: 55,
    besichtigungsquoteHeute: 11,
    conversionUpliftPct: 14,
    besichtigungZuAbschlussQuote: 18,
    deckungsbeitragProAbschlussEur: 3000,
  },
  team: {
    label: "Kleines Team",
    headline: "Der beste Beispielpfad für den ersten Check",
    summary: "Ein kleines Team mit spürbarer Eingangslast, aber noch genug Nähe zum Tagesgeschäft, um Regeln und Freigaben schnell nachzuschärfen.",
    watch: "Achten Sie hier besonders auf Erstreaktion, Freigabequote und die Frage, ob der sichere Auto-Senden-Korridor breit genug für einen Pilot ist.",
    anfragenProWoche: 58,
    minutenProAnfrage: 8,
    wiederkehrendeQuote: 72,
    autoAnteilBeiWiederkehrend: 62,
    firstResponseHeuteMin: 85,
    stundenSatzEur: 65,
    besichtigungsquoteHeute: 13,
    conversionUpliftPct: 18,
    besichtigungZuAbschlussQuote: 20,
    deckungsbeitragProAbschlussEur: 3500,
  },
  volume: {
    label: "Hohes Volumen",
    headline: "Viele Eingänge, hoher Druck auf Reaktionszeit",
    summary: "Sinnvoll, wenn Ihr Postfach täglich stark belastet ist und wiederkehrende Erstfragen einen großen Anteil ausmachen.",
    watch: "Hier zählt vor allem, ob Qualitätschecks und Freigabelogik bei höherem Volumen stabil bleiben.",
    anfragenProWoche: 110,
    minutenProAnfrage: 7,
    wiederkehrendeQuote: 78,
    autoAnteilBeiWiederkehrend: 70,
    firstResponseHeuteMin: 70,
    stundenSatzEur: 75,
    besichtigungsquoteHeute: 15,
    conversionUpliftPct: 22,
    besichtigungZuAbschlussQuote: 22,
    deckungsbeitragProAbschlussEur: 4000,
  },
};

export default function ROICalculator() {
  const pathname = usePathname();
  const isRoiPage = pathname === "/roi-rechner";
  const [preset, setPreset] = useState<PresetKey>("team");
  const [anfragenProWoche, setAnfragenProWoche] = useState(PRESETS.team.anfragenProWoche);
  const [anfragenProWocheDraft, setAnfragenProWocheDraft] = useState(String(PRESETS.team.anfragenProWoche));
  const [minutenProAnfrage, setMinutenProAnfrage] = useState(PRESETS.team.minutenProAnfrage);
  const [minutenProAnfrageDraft, setMinutenProAnfrageDraft] = useState(String(PRESETS.team.minutenProAnfrage));
  const [wiederkehrendeQuote, setWiederkehrendeQuote] = useState(PRESETS.team.wiederkehrendeQuote);
  const [autoAnteilBeiWiederkehrend, setAutoAnteilBeiWiederkehrend] = useState(
    PRESETS.team.autoAnteilBeiWiederkehrend,
  );
  const [firstResponseHeuteMin, setFirstResponseHeuteMin] = useState(PRESETS.team.firstResponseHeuteMin);
  const [firstResponseHeuteMinDraft, setFirstResponseHeuteMinDraft] = useState(
    String(PRESETS.team.firstResponseHeuteMin),
  );
  const [stundenSatzEur, setStundenSatzEur] = useState(PRESETS.team.stundenSatzEur);
  const [stundenSatzEurDraft, setStundenSatzEurDraft] = useState(String(PRESETS.team.stundenSatzEur));
  const [showRevenueScenario, setShowRevenueScenario] = useState(false);
  const [besichtigungsquoteHeute, setBesichtigungsquoteHeute] = useState(PRESETS.team.besichtigungsquoteHeute);
  const [besichtigungsquoteHeuteDraft, setBesichtigungsquoteHeuteDraft] = useState(
    String(PRESETS.team.besichtigungsquoteHeute),
  );
  const [conversionUpliftPct, setConversionUpliftPct] = useState(PRESETS.team.conversionUpliftPct);
  const [besichtigungZuAbschlussQuote, setBesichtigungZuAbschlussQuote] = useState(
    PRESETS.team.besichtigungZuAbschlussQuote,
  );
  const [besichtigungZuAbschlussQuoteDraft, setBesichtigungZuAbschlussQuoteDraft] = useState(
    String(PRESETS.team.besichtigungZuAbschlussQuote),
  );
  const [deckungsbeitragProAbschlussEur, setDeckungsbeitragProAbschlussEur] = useState(
    PRESETS.team.deckungsbeitragProAbschlussEur,
  );
  const [deckungsbeitragProAbschlussEurDraft, setDeckungsbeitragProAbschlussEurDraft] = useState(
    String(PRESETS.team.deckungsbeitragProAbschlussEur),
  );

  const applyPreset = (key: PresetKey) => {
    const p = PRESETS[key];
    setPreset(key);
    setAnfragenProWoche(p.anfragenProWoche);
    setAnfragenProWocheDraft(String(p.anfragenProWoche));
    setMinutenProAnfrage(p.minutenProAnfrage);
    setMinutenProAnfrageDraft(String(p.minutenProAnfrage));
    setWiederkehrendeQuote(p.wiederkehrendeQuote);
    setAutoAnteilBeiWiederkehrend(p.autoAnteilBeiWiederkehrend);
    setFirstResponseHeuteMin(p.firstResponseHeuteMin);
    setFirstResponseHeuteMinDraft(String(p.firstResponseHeuteMin));
    setStundenSatzEur(p.stundenSatzEur);
    setStundenSatzEurDraft(String(p.stundenSatzEur));
    setBesichtigungsquoteHeute(p.besichtigungsquoteHeute);
    setBesichtigungsquoteHeuteDraft(String(p.besichtigungsquoteHeute));
    setConversionUpliftPct(p.conversionUpliftPct);
    setBesichtigungZuAbschlussQuote(p.besichtigungZuAbschlussQuote);
    setBesichtigungZuAbschlussQuoteDraft(String(p.besichtigungZuAbschlussQuote));
    setDeckungsbeitragProAbschlussEur(p.deckungsbeitragProAbschlussEur);
    setDeckungsbeitragProAbschlussEurDraft(String(p.deckungsbeitragProAbschlussEur));
    void trackPublicEvent({
      event: "marketing_roi_preset_select",
      source: "website",
      path: pathname || "/",
      pageGroup: "marketing",
      meta: { preset: key },
    });
  };

  const model = useMemo(() => {
    const wiederkehrendeFaelle = anfragenProWoche * (wiederkehrendeQuote / 100);
    const autoFaelle = wiederkehrendeFaelle * (autoAnteilBeiWiederkehrend / 100);
    const assistFaelle = Math.max(0, anfragenProWoche - autoFaelle);
    const autoQuote = clamp(autoFaelle / Math.max(1, anfragenProWoche), 0, 1);
    const minutenProAutoFall = Math.max(1.5, minutenProAnfrage * 0.28);
    const qaKontrollMinProAutoFall = 0.7;
    const minutenProAssistFall = Math.max(2.4, minutenProAnfrage * 0.72);

    const zeitHeuteMinProWoche = anfragenProWoche * minutenProAnfrage;
    const zeitMitAdvaicMinProWoche =
      assistFaelle * minutenProAssistFall +
      autoFaelle * minutenProAutoFall +
      autoFaelle * qaKontrollMinProAutoFall;

    const gesparteMinutenProWoche = Math.max(0, zeitHeuteMinProWoche - zeitMitAdvaicMinProWoche);
    const gesparteStundenProMonat = (gesparteMinutenProWoche * 4.33) / 60;
    const monetarerHebelProMonat = gesparteStundenProMonat * stundenSatzEur;

    const medianFirstResponseHeute = firstResponseHeuteMin;
    const medianFirstResponseMitAdvaic = Math.max(8, medianFirstResponseHeute * (1 - autoQuote * 0.52));
    const firstResponseGewinnMin = Math.max(0, medianFirstResponseHeute - medianFirstResponseMitAdvaic);
    const firstResponseGewinnPct = (firstResponseGewinnMin / Math.max(1, medianFirstResponseHeute)) * 100;
    const within60Heute = clamp(100 - (medianFirstResponseHeute - 25) * 0.82, 10, 95);
    const within60MitAdvaic = clamp(within60Heute + autoQuote * 30, within60Heute + 1, 99);
    const anfragenProMonat = anfragenProWoche * 4.33;
    const besichtigungenHeuteProMonat = anfragenProMonat * (besichtigungsquoteHeute / 100);
    const besichtigungenMitAdvaicProMonat =
      anfragenProMonat * ((besichtigungsquoteHeute * (1 + conversionUpliftPct / 100)) / 100);
    const zusaetzlicheBesichtigungenProMonat = Math.max(
      0,
      besichtigungenMitAdvaicProMonat - besichtigungenHeuteProMonat,
    );
    const zusaetzlicheAbschluesseProMonat =
      zusaetzlicheBesichtigungenProMonat * (besichtigungZuAbschlussQuote / 100);
    const zusaetzlicherDeckungsbeitragProMonat =
      zusaetzlicheAbschluesseProMonat * deckungsbeitragProAbschlussEur;

    return {
      wiederkehrendeFaelle,
      autoFaelle,
      assistFaelle,
      minutenProAutoFall,
      qaKontrollMinProAutoFall,
      minutenProAssistFall,
      zeitHeuteMinProWoche,
      zeitMitAdvaicMinProWoche,
      gesparteMinutenProWoche,
      gesparteStundenProMonat,
      monetarerHebelProMonat,
      autoQuote,
      medianFirstResponseHeute,
      medianFirstResponseMitAdvaic,
      firstResponseGewinnMin,
      firstResponseGewinnPct,
      within60Heute,
      within60MitAdvaic,
      anfragenProMonat,
      besichtigungenHeuteProMonat,
      besichtigungenMitAdvaicProMonat,
      zusaetzlicheBesichtigungenProMonat,
      zusaetzlicheAbschluesseProMonat,
      zusaetzlicherDeckungsbeitragProMonat,
    };
  }, [
    anfragenProWoche,
    minutenProAnfrage,
    wiederkehrendeQuote,
    autoAnteilBeiWiederkehrend,
    firstResponseHeuteMin,
    stundenSatzEur,
    besichtigungsquoteHeute,
    conversionUpliftPct,
    besichtigungZuAbschlussQuote,
    deckungsbeitragProAbschlussEur,
  ]);

  const nextAction = useMemo(() => {
    if (model.autoQuote < 0.28) {
      return {
        title: "Nächster Hebel: Regelwerk schärfen",
        text: "Ihre Auto-Senden-Quote ist noch niedrig. Für einen spürbaren ROI sollten zuerst wiederkehrende Erstantworten mit sauberem Objektbezug präziser definiert werden.",
        bullets: [
          "Top-3 wiederkehrende Erstfragen explizit als Auto-Senden-Fälle setzen",
          "Fehlende oder widersprüchliche Objektbezüge konsequent auf Freigabe lassen",
          "Nach 7 Tagen Auto-Senden- und Freigabe-Quote erneut prüfen",
        ],
        href: "/autopilot-regeln",
        cta: "Regeln konkretisieren",
      };
    }

    if (model.medianFirstResponseMitAdvaic > 60) {
      return {
        title: "Nächster Hebel: Reaktionszeit unter 60 Minuten bringen",
        text: "Der Zeitgewinn ist sichtbar, aber Ihre Median-Erstreaktion liegt noch über dem Zielkorridor.",
        bullets: [
          "Safe-Start mit klarer Priorität auf Erstreaktionsfälle",
          "Follow-up-Stufe 1 erst nach stabiler Erstantwort aktivieren",
          "Freigabe-Inbox täglich auf wiederkehrende Muster prüfen",
        ],
        href: "/produkt#setup",
        cta: "Safe-Start optimieren",
      };
    }

    if (model.gesparteStundenProMonat >= 18) {
      return {
        title: "Nächster Hebel: Pilot mit KPI-Ziel absichern",
        text: "Ihr Modell zeigt deutliches Potenzial. Jetzt zählt ein sauberer Pilot mit klaren Go/No-Go-Kriterien.",
        bullets: [
          "KPI-Ziel vor Start festlegen (Antwortzeit, QA-Quote, Freigabe-zu-Senden)",
          "Wöchentlich nur einen Regelsatz gleichzeitig anpassen",
          "Ab Woche 3 Auto-Senden-Anteil nur bei stabiler Qualität erhöhen",
        ],
        href: "/signup?entry=roi-next-action",
        cta: "Pilot starten",
      };
    }

    return {
      title: "Nächster Hebel: konservativ testen",
      text: "Das Potenzial ist vorhanden, aber noch nicht maximal. Ein konservativer Pilot liefert schnell belastbare echte Werte.",
        bullets: [
          "Mit höherer Freigabequote starten und Risiko gering halten",
          "Reale Zeitersparnis pro Woche im Team dokumentieren",
          "Nach 14 Tagen Auto-Senden- und Qualitätsgrenzen nachschärfen",
        ],
      href: "/signup?entry=roi-conservative",
      cta: "Konservativ testen",
    };
  }, [model.autoQuote, model.gesparteStundenProMonat, model.medianFirstResponseMitAdvaic]);

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
            Tragen Sie Ihre Werte ein. Die Schätzung bildet Auto-Senden, Zeitgewinn in Freigabe, Vorqualifizierung
            und sichtbare Arbeitsreihenfolge gemeinsam ab. Alle Annahmen bleiben offen nachvollziehbar.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <article className="card-base p-6 lg:col-span-7 md:p-7">
            <div className="mb-5">
              <p className="text-sm font-semibold text-[var(--text)]">Schnellstart-Profil</p>
              <p className="helper mt-2">
                Starten Sie im Zweifel mit <strong className="text-[var(--text)]">Kleines Team</strong>. Das ist der sinnvollste Beispielpfad für die erste Orientierung.
              </p>
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
              <article className="mt-4 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">{PRESETS[preset].headline}</p>
                <p className="helper mt-2">{PRESETS[preset].summary}</p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Worauf Sie achten sollten:</strong> {PRESETS[preset].watch}
                </p>
              </article>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Anfragen pro Woche</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={anfragenProWocheDraft}
                  onChange={(e) => updateDraftValue(e.target.value, setAnfragenProWocheDraft, setAnfragenProWoche)}
                  onBlur={() => commitDraftValue(anfragenProWocheDraft, 5, 500, setAnfragenProWocheDraft, setAnfragenProWoche)}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Minuten pro Anfrage (heute)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={minutenProAnfrageDraft}
                  onChange={(e) => updateDraftValue(e.target.value, setMinutenProAnfrageDraft, setMinutenProAnfrage)}
                  onBlur={() => commitDraftValue(minutenProAnfrageDraft, 2, 30, setMinutenProAnfrageDraft, setMinutenProAnfrage)}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Interner Stundensatz (EUR)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={stundenSatzEurDraft}
                  onChange={(e) => updateDraftValue(e.target.value, setStundenSatzEurDraft, setStundenSatzEur)}
                  onBlur={() => commitDraftValue(stundenSatzEurDraft, 30, 250, setStundenSatzEurDraft, setStundenSatzEur)}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[var(--text)]">Median Erstreaktion heute (Minuten)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={firstResponseHeuteMinDraft}
                  onChange={(e) => updateDraftValue(e.target.value, setFirstResponseHeuteMinDraft, setFirstResponseHeuteMin)}
                  onBlur={() => commitDraftValue(firstResponseHeuteMinDraft, 10, 720, setFirstResponseHeuteMinDraft, setFirstResponseHeuteMin)}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  Anteil wiederkehrender Erstantworten: {wiederkehrendeQuote} %
                </span>
                <input
                  type="range"
                  min={20}
                  max={90}
                  step={1}
                  value={wiederkehrendeQuote}
                  onChange={(e) => setWiederkehrendeQuote(clamp(Number(e.target.value || 0), 20, 90))}
                  className="mt-2 w-full accent-[var(--gold)]"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-[var(--text)]">
                  Auto-Senden-Anteil innerhalb dieser wiederkehrenden Erstantworten: {autoAnteilBeiWiederkehrend} %
                </span>
                <input
                  type="range"
                  min={20}
                  max={90}
                  step={1}
                  value={autoAnteilBeiWiederkehrend}
                  onChange={(e) => setAutoAnteilBeiWiederkehrend(clamp(Number(e.target.value || 0), 20, 90))}
                  className="mt-2 w-full accent-[var(--gold)]"
                />
              </label>
            </div>

            <article className="mt-6 rounded-2xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="max-w-[58ch]">
                  <p className="text-sm font-semibold text-[var(--text)]">Optional: Conversion- und Umsatzhebel</p>
                  <p className="helper mt-2">
                    Diese Ebene bleibt bewusst optional. Sie modelliert kein Versprechen, sondern ein offenes
                    Szenario aus schnellerer Erstreaktion, besserem Follow-up und höherer Besichtigungsquote.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevenueScenario((value) => !value)}
                  className="btn-secondary whitespace-nowrap"
                >
                  {showRevenueScenario ? "Szenario ausblenden" : "Szenario einblenden"}
                </button>
              </div>

              {showRevenueScenario ? (
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-[var(--text)]">
                      Heutige Anfrage-zu-Besichtigung-Quote (%)
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={besichtigungsquoteHeuteDraft}
                      onChange={(e) =>
                        updateDraftValue(
                          e.target.value,
                          setBesichtigungsquoteHeuteDraft,
                          setBesichtigungsquoteHeute,
                        )
                      }
                      onBlur={() =>
                        commitDraftValue(
                          besichtigungsquoteHeuteDraft,
                          1,
                          80,
                          setBesichtigungsquoteHeuteDraft,
                          setBesichtigungsquoteHeute,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-[var(--text)]">
                      Besichtigung-zu-Abschluss-/Beauftragungsquote (%)
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={besichtigungZuAbschlussQuoteDraft}
                      onChange={(e) =>
                        updateDraftValue(
                          e.target.value,
                          setBesichtigungZuAbschlussQuoteDraft,
                          setBesichtigungZuAbschlussQuote,
                        )
                      }
                      onBlur={() =>
                        commitDraftValue(
                          besichtigungZuAbschlussQuoteDraft,
                          1,
                          80,
                          setBesichtigungZuAbschlussQuoteDraft,
                          setBesichtigungZuAbschlussQuote,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="text-sm font-semibold text-[var(--text)]">
                      Angenommener relativer Uplift auf die Besichtigungsquote: {conversionUpliftPct} %
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      step={1}
                      value={conversionUpliftPct}
                      onChange={(e) => setConversionUpliftPct(clamp(Number(e.target.value || 0), 0, 40))}
                      className="mt-2 w-full accent-[var(--gold)]"
                    />
                    <p className="helper mt-2">
                      Gemeint ist kein Wunderwert, sondern ein Szenario aus schnellerer Reaktion, sauberem Follow-up
                      und weniger verlorenen qualifizierten Anfragen.
                    </p>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="text-sm font-semibold text-[var(--text)]">
                      Durchschnittlicher Deckungsbeitrag / Provision pro Abschluss (EUR)
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={deckungsbeitragProAbschlussEurDraft}
                      onChange={(e) =>
                        updateDraftValue(
                          e.target.value,
                          setDeckungsbeitragProAbschlussEurDraft,
                          setDeckungsbeitragProAbschlussEur,
                        )
                      }
                      onBlur={() =>
                        commitDraftValue(
                          deckungsbeitragProAbschlussEurDraft,
                          500,
                          50000,
                          setDeckungsbeitragProAbschlussEurDraft,
                          setDeckungsbeitragProAbschlussEur,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-4 focus:ring-[var(--gold-soft)]"
                    />
                  </label>
                </div>
              ) : null}
            </article>
          </article>

          <article className="card-base lg:col-span-5 overflow-hidden p-0">
            <div className="h-1 w-full bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
            <div className="p-6 md:p-7">
              <p className="text-sm font-semibold text-[var(--text)]">Betriebsnahe Modellrechnung</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                    Wiederkehrende Erstantworten/Woche
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">
                    {formatNumber(model.wiederkehrendeFaelle)}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Auto-Senden-Fälle/Woche</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatNumber(model.autoFaelle)}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Auto-Senden-Quote gesamt</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatNumber(model.autoQuote * 100)} %</p>
                  <p className="helper mt-1">Rest bleibt bewusst in Assistenz/Freigabe: {formatNumber(100 - model.autoQuote * 100)} %</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Gesparte Stunden/Monat</p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--text)]">
                    {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(model.gesparteStundenProMonat)}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Monetäres Potenzial/Monat</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatCurrency(model.monetarerHebelProMonat)}</p>
                  <p className="helper mt-1">Basierend auf internem Stundensatz: {formatCurrency(stundenSatzEur)} / Stunde</p>
                </div>
                {showRevenueScenario ? (
                  <>
                    <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                      <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                        Zusätzliche Besichtigungen/Monat
                      </p>
                      <p className="mt-1 text-xl font-semibold text-[var(--text)]">
                        {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(
                          model.zusaetzlicheBesichtigungenProMonat,
                        )}
                      </p>
                      <p className="helper mt-1">
                        Heute:{" "}
                        {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(
                          model.besichtigungenHeuteProMonat,
                        )}{" "}
                        · Mit Szenario:{" "}
                        {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(
                          model.besichtigungenMitAdvaicProMonat,
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                      <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                        Zusätzliche Abschlüsse/Monat
                      </p>
                      <p className="mt-1 text-xl font-semibold text-[var(--text)]">
                        {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(
                          model.zusaetzlicheAbschluesseProMonat,
                        )}
                      </p>
                      <p className="helper mt-1">
                        Auf Basis von {formatNumber(besichtigungZuAbschlussQuote)} % Besichtigung-zu-Abschluss.
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                      <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                        Optionales Umsatzszenario/Monat
                      </p>
                      <p className="mt-1 text-xl font-semibold text-[var(--text)]">
                        {formatCurrency(model.zusaetzlicherDeckungsbeitragProMonat)}
                      </p>
                      <p className="helper mt-1">
                        Transparente Szenariorechnung aus Besichtigungsquote, Uplift und Deckungsbeitrag. Kein
                        garantierter Mehrumsatz.
                      </p>
                    </div>
                  </>
                ) : null}
                <div className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Zeitbudget pro Woche</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                    Heute: {formatNumber(model.zeitHeuteMinProWoche)} Min
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                    Mit Advaic: {formatNumber(model.zeitMitAdvaicMinProWoche)} Min
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
                    Modellannahme: wiederkehrende Erstantworten mit sauberem Objektbezug laufen schneller durch, Fälle
                    mit fehlenden Angaben bleiben in Freigabe.
                  </p>
                </div>
              </div>

              <p className="helper mt-4">
                Annahme: Nicht jede Nachricht wird automatisch gesendet. Fälle mit fehlenden Angaben, Konfliktpotenzial
                oder Risikoindikatoren bleiben in der Freigabe, sparen aber trotzdem bereits Zeit durch Vorqualifizierung,
                klaren Status und vorbereiteten Kontext.
              </p>

              <article className="mt-4 rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Annahmen im aktuellen Modell
                </p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                  <li>Auto-Senden-Fall Bearbeitung: {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(model.minutenProAutoFall)} Min</li>
                  <li>QA-/Monitoring-Aufwand je Auto-Senden-Fall: {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(model.qaKontrollMinProAutoFall)} Min</li>
                  <li>Freigabe-/Assist-Fall Bearbeitung: {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(model.minutenProAssistFall)} Min</li>
                  <li>Freigabe-/Assist-Fälle pro Woche: {formatNumber(model.assistFaelle)}</li>
                </ul>
              </article>

              {showRevenueScenario ? (
                <article className="mt-4 rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    Annahmen im Conversion-Szenario
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                    <li>Anfragen pro Monat: {new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(model.anfragenProMonat)}</li>
                    <li>Heutige Besichtigungsquote: {formatNumber(besichtigungsquoteHeute)} %</li>
                    <li>Relativer Uplift auf diese Quote: {formatNumber(conversionUpliftPct)} %</li>
                    <li>Besichtigung-zu-Abschluss-/Beauftragungsquote: {formatNumber(besichtigungZuAbschlussQuote)} %</li>
                    <li>Deckungsbeitrag / Provision pro Abschluss: {formatCurrency(deckungsbeitragProAbschlussEur)}</li>
                  </ul>
                </article>
              ) : null}

              <article className="mt-4 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--text)]">{nextAction.title}</h3>
                <p className="helper mt-2">{nextAction.text}</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
                  {nextAction.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={nextAction.href} className="btn-secondary mt-3">
                  {nextAction.cta}
                </Link>
              </article>

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
                        wiederkehrende_quote: wiederkehrendeQuote,
                        auto_anteil_wiederkehrend: autoAnteilBeiWiederkehrend,
                        stunden_satz_eur: stundenSatzEur,
                        gesparte_stunden_monat: Number(model.gesparteStundenProMonat.toFixed(2)),
                        monetarer_hebel_monat: Number(model.monetarerHebelProMonat.toFixed(0)),
                        first_response_gain_min: Number(model.firstResponseGewinnMin.toFixed(1)),
                        revenue_scenario_enabled: showRevenueScenario,
                        conversion_uplift_pct: conversionUpliftPct,
                        besichtigungsquote_heute_pct: besichtigungsquoteHeute,
                        besichtigung_zu_abschluss_pct: besichtigungZuAbschlussQuote,
                        optional_revenue_scenario_monat: Number(
                          model.zusaetzlicherDeckungsbeitragProMonat.toFixed(0),
                        ),
                      },
                    })
                  }
                >
                  {MARKETING_PRIMARY_CTA_LABEL}
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
                {!isRoiPage ? (
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
                ) : null}
              </div>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
