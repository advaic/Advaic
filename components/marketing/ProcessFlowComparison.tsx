"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import TrackedLink from "./TrackedLink";
import Container from "./Container";
import { trackPublicEvent } from "@/lib/funnel/public-track";
import { MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

type ScenarioKey = "normal" | "peak";

type FlowStep = {
  key: string;
  label: string;
  manualMin: number;
  advaicMin: number;
  riskHint: string;
  trustHint: string;
};

const SCENARIOS: Record<
  ScenarioKey,
  {
    label: string;
    description: string;
    steps: FlowStep[];
  }
> = {
  normal: {
    label: "Normaler Werktag",
    description: "Reguläres Anfragevolumen mit gemischten Miet- und Kaufanfragen.",
    steps: [
      {
        key: "eingang",
        label: "Eingang prüfen",
        manualMin: 1.9,
        advaicMin: 0.5,
        riskHint: "Systemmails kosten Fokuszeit.",
        trustHint: "Nicht-relevante Mails werden direkt gefiltert.",
      },
      {
        key: "entscheidung",
        label: "Auto/Freigabe entscheiden",
        manualMin: 2.6,
        advaicMin: 0.8,
        riskHint: "Fälle mit fehlenden Angaben oder Konfliktpotenzial werden leicht zu spät erkannt.",
        trustHint: "Guardrails markieren fehlende Angaben, Konfliktpotenzial oder Qualitätswarnungen sofort.",
      },
      {
        key: "antwort",
        label: "Antwort entwerfen",
        manualMin: 4.1,
        advaicMin: 1.6,
        riskHint: "Ton und Kontext schwanken unter Zeitdruck.",
        trustHint: "Stilregeln und Kontext-Checks sichern den Entwurf.",
      },
      {
        key: "verlauf",
        label: "Verlauf dokumentieren",
        manualMin: 1.4,
        advaicMin: 0.4,
        riskHint: "Nachvollziehbarkeit bleibt lückenhaft.",
        trustHint: "Statuslog läuft automatisch mit Zeitstempel.",
      },
    ],
  },
  peak: {
    label: "Spitzenlast",
    description: "Viele gleichzeitige Anfragen nach neuer Veröffentlichung.",
    steps: [
      {
        key: "eingang",
        label: "Eingang prüfen",
        manualMin: 2.7,
        advaicMin: 0.8,
        riskHint: "Wichtige Anfrage geht im Postfach unter.",
        trustHint: "Interessenten werden priorisiert herausgezogen.",
      },
      {
        key: "entscheidung",
        label: "Auto/Freigabe entscheiden",
        manualMin: 3.5,
        advaicMin: 1.1,
        riskHint: "Mehr Fehlklassifizierung bei Eile.",
        trustHint: "Fälle mit Warnsignal gehen direkt zur Freigabe.",
      },
      {
        key: "antwort",
        label: "Antwort entwerfen",
        manualMin: 5.2,
        advaicMin: 2.0,
        riskHint: "Mehr Korrekturschleifen pro Antwort.",
        trustHint: "Qualitätschecks bremsen riskante Antworten aus.",
      },
      {
        key: "verlauf",
        label: "Verlauf dokumentieren",
        manualMin: 1.9,
        advaicMin: 0.5,
        riskHint: "Weniger Transparenz für spätere Klärung.",
        trustHint: "Jeder Status bleibt prüfbar im Verlauf.",
      },
    ],
  },
};

function formatMin(value: number) {
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(value)} Min`;
}

export default function ProcessFlowComparison() {
  const pathname = usePathname() || "/";
  const [scenario, setScenario] = useState<ScenarioKey>("normal");

  useEffect(() => {
    void trackPublicEvent({
      event: "marketing_processflow_impression",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: { component: "ProcessFlowComparison" },
    });
  }, [pathname]);

  const active = SCENARIOS[scenario];
  const model = useMemo(() => {
    const manualTotal = active.steps.reduce((acc, step) => acc + step.manualMin, 0);
    const advaicTotal = active.steps.reduce((acc, step) => acc + step.advaicMin, 0);
    const saved = Math.max(0, manualTotal - advaicTotal);
    const maxRow = Math.max(...active.steps.map((step) => step.manualMin));
    return { manualTotal, advaicTotal, saved, maxRow };
  }, [active]);

  const onScenarioChange = (next: ScenarioKey) => {
    setScenario(next);
    void trackPublicEvent({
      event: "marketing_processflow_scenario_select",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: { scenario: next },
    });
  };

  return (
    <section id="prozessvergleich" className="marketing-soft-cool py-20 md:py-28">
      <Container>
        <div className="max-w-[76ch]">
          <h2 className="h2">Echte Prozessdarstellung: Manuell vs. Advaic</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Hier sehen Sie pro Arbeitsschritt, wo Zeitverlust und Fehlerrisiko im manuellen Ablauf entstehen und welche
            Guardrail-Mechanik Advaic jeweils dagegen setzt.
          </p>
        </div>

        <article className="card-base mt-8 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Szenario</p>
              <p className="helper mt-1">{active.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onScenarioChange(key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                    key === scenario
                      ? "bg-[var(--surface-2)] text-[var(--text)] ring-[var(--gold)]"
                      : "bg-white text-[var(--muted)] ring-[var(--border)] hover:text-[var(--text)]"
                  }`}
                >
                  {SCENARIOS[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Manuell pro Anfrage</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatMin(model.manualTotal)}</p>
            </article>
            <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Mit Advaic pro Anfrage</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatMin(model.advaicTotal)}</p>
            </article>
            <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">Direkte Entlastung</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text)]">{formatMin(model.saved)}</p>
            </article>
          </div>

          <div className="mt-5 space-y-3">
            {active.steps.map((step) => {
              const manualPct = (step.manualMin / model.maxRow) * 100;
              const advaicPct = (step.advaicMin / model.maxRow) * 100;
              return (
                <article key={step.key} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text)]">{step.label}</h3>
                    <p className="text-xs text-[var(--muted)]">
                      Manuell {formatMin(step.manualMin)} · Advaic {formatMin(step.advaicMin)}
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
                        <span>Manuell</span>
                        <span>{formatMin(step.manualMin)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white ring-1 ring-[var(--border)]">
                        <div className="h-full rounded-full bg-slate-400" style={{ width: `${manualPct}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
                        <span>Advaic</span>
                        <span>{formatMin(step.advaicMin)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white ring-1 ring-[var(--border)]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,var(--gold),var(--gold-2))]"
                          style={{ width: `${advaicPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <p className="helper">
                      <span className="font-semibold text-[var(--text)]">Ohne Guardrails:</span> {step.riskHint}
                    </p>
                    <p className="helper">
                      <span className="font-semibold text-[var(--text)]">Mit Advaic:</span> {step.trustHint}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href="/signup?entry=prozessvergleich"
              className="btn-primary"
              event="marketing_processflow_signup_click"
              source="website"
              pageGroup="marketing"
              section="prozessvergleich"
            >
              {MARKETING_PRIMARY_CTA_LABEL}
            </TrackedLink>
            <TrackedLink
              href="/produkt#ablauf"
              className="btn-secondary"
              event="marketing_processflow_product_click"
              source="website"
              pageGroup="marketing"
              section="prozessvergleich"
            >
              Ablauf im Produkt ansehen
            </TrackedLink>
          </div>
        </article>
      </Container>
    </section>
  );
}
