"use client";

import Link from "next/link";
import { useState } from "react";
import Container from "./Container";
import { STARTER_PUBLIC_PRICE_LABEL } from "@/lib/billing/public-pricing";
import { MARKETING_FAQ_CTA_LABEL } from "./cta-copy";

const items = [
  {
    question: "Sendet Advaic automatisch?",
    answer:
      "Ja, wenn Autopilot aktiv ist, Objektbezug, Empfänger und Angaben sauber passen und die Prüfungen bestanden sind. Fehlen Informationen, ist der Rückkanal unsicher oder wird der Inhalt sensibel, greift die Freigabe.",
  },
  {
    question: "Was stoppt falsche Antworten vor dem Versand?",
    answer:
      "Vor jedem automatischen Versand laufen Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeitsprüfungen. Fällt eine Prüfung negativ aus, wird nicht automatisch versendet.",
  },
  {
    question: "Welche Nachrichten gehören bewusst in die Freigabe?",
    answer:
      "Beschwerden, fehlende Kerndaten, unklarer Objektbezug, Konfliktpotenzial, sensible Inhalte oder unsaubere Rückkanäle gehören nicht in den Auto-Versand. Diese Fälle bleiben sichtbar bei Ihnen.",
  },
  {
    question: "Kann ich den Autopilot jederzeit pausieren?",
    answer:
      "Ja. Sie können den Autopilot in den Einstellungen deaktivieren und Nachrichten vollständig manuell bearbeiten.",
  },
  {
    question: "Wie transparent ist jede Entscheidung pro Nachricht?",
    answer:
      "Sie sehen den Verlauf pro Nachricht mit Eingang, Entscheidung, blockierenden Gründen, Freigabe und Versandstatus inklusive Zeitstempeln.",
  },
  {
    question: "Wie starte ich ohne Kontrollverlust?",
    answer:
      "Mit Safe-Start: erst hoher Freigabeanteil, dann Regeln und Ton im Alltag prüfen, erst danach den Auto-Korridor schrittweise erweitern.",
  },
  {
    question: "Antwortet Advaic auf Newsletter oder Systemmails?",
    answer:
      "Nicht automatisch. Newsletter, Systemmails und Spam werden gefiltert. Technische no-reply Absender ohne nutzbaren Rückkanal werden je nach Fall ignoriert oder zur Prüfung markiert.",
  },
  {
    question: "Was passiert nach den 14 Testtagen?",
    answer:
      `Nach der Testphase läuft Starter für ${STARTER_PUBLIC_PRICE_LABEL} weiter. Sie können jederzeit kündigen und Autopilot zusätzlich pausieren.`,
  },
  {
    question: "Wie prüfe ich Datenschutz und Dokumentation?",
    answer:
      "Sie können Sicherheitsseite, Datenschutz, Unterauftragsverarbeiter und Freigabe-Workflow öffentlich prüfen. Weitere Unterlagen erhalten Sie im Onboarding. Diese Seite ersetzt keine Rechtsberatung.",
  },
];

const coverageItems = [
  "Wann Auto erlaubt ist und wann Freigabe bewusst greift.",
  "Wie Safe-Start, Transparenz und Pause im Alltag funktionieren.",
  "Wie Testphase, Preis und Dokumentation konkret geprüft werden.",
];

type MarketingFAQProps = {
  showDetailButton?: boolean;
  introEyebrow?: string;
  introTitle?: string;
  introBody?: string;
  showCoverageCard?: boolean;
};

export default function MarketingFAQ({
  showDetailButton = true,
  introEyebrow = "Noch offene Fragen?",
  introTitle = "Die 8 Fragen, die vor dem Start wirklich zählen",
  introBody = "Hier klären Sie die Fragen, die Kauf, Test und sichere Einführung tatsächlich entscheiden.",
  showCoverageCard = true,
}: MarketingFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="marketing-section-clear py-16 md:py-20"
      data-tour="marketing-faq-section"
    >
      <Container>
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4" data-tour="marketing-faq-intro">
            <div className="flex flex-wrap items-center justify-between gap-4 lg:block">
              <div>
                <p className="section-kicker">{introEyebrow}</p>
                <h2 className="h2 mt-2">{introTitle}</h2>
                <p className="body mt-4 text-[var(--muted)]">{introBody}</p>
              </div>
              {showDetailButton ? (
                <Link href="/faq" className="btn-secondary lg:mt-4">
                  {MARKETING_FAQ_CTA_LABEL}
                </Link>
              ) : null}
            </div>

            {showCoverageCard ? (
              <article className="card-base p-5">
                <p className="label">Diese FAQ beantwortet</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {coverageItems.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </div>

          <div className="space-y-3" data-tour="marketing-faq-answers">
            {items.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <article key={item.question} className="card-base overflow-hidden" data-tour="marketing-faq-item">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    id={`faq-trigger-${index}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                        {index + 1}
                      </span>
                      <span className="text-base font-semibold text-[var(--text)]">{item.question}</span>
                    </div>
                    <span className="text-xl text-[var(--muted)]">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen ? (
                    <div
                      className="border-t border-[var(--border)] px-5 py-4"
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${index}`}
                    >
                      <p className="helper">{item.answer}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
