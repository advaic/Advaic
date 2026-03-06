"use client";

import { type ComponentType, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleHelp, MailX, ShieldCheck } from "lucide-react";
import Container from "./Container";
import { trackPublicEvent } from "@/lib/funnel/public-track";

type DecisionType = "auto" | "freigabe" | "ignorieren";

type Scenario = {
  id: string;
  title: string;
  input: string;
  decision: DecisionType;
  reason: string;
  checks: string[];
  nextStep: string;
};

const scenarios: Scenario[] = [
  {
    id: "klar-verfuegbar",
    title: "Klare Verfügbarkeitsfrage",
    input: "„Ist die Wohnung Musterstraße 12 noch verfügbar? Welche Unterlagen brauchen Sie?“",
    decision: "auto",
    reason: "Eindeutiger Objektbezug, Standardfrage, kein erhöhtes Risiko.",
    checks: ["Relevanz", "Kontext", "Vollständigkeit", "Ton & Stil", "Risiko", "Lesbarkeit"],
    nextStep: "Antwort kann automatisch über Ihr Postfach versendet werden.",
  },
  {
    id: "objekt-unklar",
    title: "Objektbezug unklar",
    input: "„Ich interessiere mich für die Wohnung in der Innenstadt. Ist sie noch frei?“",
    decision: "freigabe",
    reason: "Objekt ist nicht eindeutig zuordenbar, kritische Kontextinformation fehlt.",
    checks: ["Kontext-Check schlägt an", "Vollständigkeits-Check schlägt an"],
    nextStep: "Fall geht in die Freigabe oder als Rückfrage-Entwurf an Sie.",
  },
  {
    id: "konfliktfall",
    title: "Beschwerde oder Konflikt",
    input: "„Ich bin sehr unzufrieden mit dem letzten Termin und erwarte eine Stellungnahme.“",
    decision: "freigabe",
    reason: "Heikler Fall mit Risiko, daher keine automatische Antwort.",
    checks: ["Risiko-Check schlägt an", "Freigabe ist verpflichtend"],
    nextStep: "Sie entscheiden manuell über Ton, Inhalt und Versand.",
  },
  {
    id: "newsletter",
    title: "Newsletter / Nicht-Anfrage",
    input: "„Jetzt abonnieren: Marktbericht 2026“ mit list-unsubscribe Header.",
    decision: "ignorieren",
    reason: "Keine relevante Interessenten-Anfrage, daher kein Signal für den Versandprozess.",
    checks: ["Relevanz-Check schlägt an", "Nachricht wird nicht beantwortet"],
    nextStep: "Die Nachricht wird ignoriert oder nur dokumentiert.",
  },
];

const decisionStyle: Record<DecisionType, { label: string; chip: string; icon: ComponentType<{ className?: string }> }> = {
  auto: {
    label: "Auto senden",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: CheckCircle2,
  },
  freigabe: {
    label: "Zur Freigabe",
    chip: "border-amber-200 bg-amber-50 text-amber-900",
    icon: CircleHelp,
  },
  ignorieren: {
    label: "Ignorieren",
    chip: "border-slate-200 bg-slate-100 text-slate-800",
    icon: MailX,
  },
};

type DecisionSimulatorProps = {
  id?: string;
  title?: string;
  description?: string;
};

export default function DecisionSimulator({
  id = "simulator",
  title = "Entscheidungs-Simulator: So greift die Logik im Alltag",
  description = "Wählen Sie typische Eingänge aus und sehen Sie, ob Advaic automatisch sendet, zur Freigabe übergibt oder ignoriert.",
}: DecisionSimulatorProps) {
  const [activeId, setActiveId] = useState<string>(scenarios[0].id);

  const activeScenario = useMemo(
    () => scenarios.find((item) => item.id === activeId) ?? scenarios[0],
    [activeId]
  );
  const style = decisionStyle[activeScenario.decision];
  const Icon = style.icon;

  useEffect(() => {
    void trackPublicEvent({
      event: "marketing_simulator_impression",
      source: "website",
      pageGroup: "marketing",
      meta: { component: "DecisionSimulator", sectionId: id },
    });
  }, [id]);

  useEffect(() => {
    void trackPublicEvent({
      event: "marketing_simulator_scenario_changed",
      source: "website",
      pageGroup: "marketing",
      meta: { scenario: activeScenario.id, decision: activeScenario.decision },
    });
  }, [activeScenario.decision, activeScenario.id]);

  return (
    <section id={id} className="marketing-section-clear py-20 md:py-28">
      <Container>
        <div className="max-w-[74ch]">
          <h2 className="h2">{title}</h2>
          <p className="body mt-4 text-[var(--muted)]">{description}</p>
        </div>

        <div className="mt-8 grid grid-cols-12 gap-6 md:gap-8">
          <div className="col-span-12 lg:col-span-5">
            <p className="label">Typischer Eingang</p>
            <div className="mt-3 space-y-3">
              {scenarios.map((scenario) => {
                const active = scenario.id === activeId;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveId(scenario.id)}
                    className={`w-full rounded-[var(--radius)] p-4 text-left ring-1 transition ${
                      active
                        ? "bg-white ring-[var(--gold)] shadow-[var(--shadow-md)]"
                        : "bg-white/90 ring-[var(--border)] shadow-[var(--shadow-sm)] hover:-translate-y-[1px] hover:ring-[rgba(11,15,23,.18)]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--text)]">{scenario.title}</p>
                    <p className="helper mt-1">{scenario.input}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <article className="card-base overflow-hidden p-0">
              <div className="h-1 w-full bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.1))]" />
              <div className="p-6 md:p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${style.chip}`}>
                    <Icon className="h-4 w-4" />
                    {style.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[var(--gold)]" />
                    Guardrails aktiv
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Eingang</p>
                  <p className="mt-1 text-sm text-[var(--text)]">{activeScenario.input}</p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Warum diese Entscheidung?</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{activeScenario.reason}</p>
                  </div>
                  <div className="rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Nächster Schritt</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">{activeScenario.nextStep}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Aktive Prüfungen</p>
                  <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
                    {activeScenario.checks.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/autopilot-regeln"
                    className="btn-secondary"
                    onClick={() =>
                      trackPublicEvent({
                        event: "marketing_simulator_rules_click",
                        source: "website",
                        pageGroup: "marketing",
                        meta: { scenario: activeScenario.id, decision: activeScenario.decision },
                      })
                    }
                  >
                    Regeln im Detail
                  </Link>
                  <Link
                    href="/signup"
                    className="btn-primary"
                    onClick={() =>
                      trackPublicEvent({
                        event: "marketing_simulator_signup_click",
                        source: "website",
                        pageGroup: "marketing",
                        meta: { scenario: activeScenario.id, decision: activeScenario.decision },
                      })
                    }
                  >
                    14 Tage kostenlos testen
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="helper mt-3">
                  Beispiele basieren auf der aktuellen Produktlogik. In Ihrem Account steuern Sie Regeln, Freigabegrad
                  und Follow-up-Verhalten individuell.
                </p>
              </div>
            </article>
          </div>
        </div>
      </Container>
    </section>
  );
}
