"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Container from "@/components/marketing/Container";
import { STARTER_PUBLIC_PRICE_LABEL } from "@/lib/billing/public-pricing";

const faqItems = [
  {
    question: "Sendet Advaic automatisch?",
    answer:
      "Ja, wenn Autopilot aktiv ist, Objektbezug, Empfänger und Inhalt sauber passen und die automatischen Prüfungen bestanden sind. Nachrichten mit fehlenden Angaben oder Risikosignalen gehen zur Freigabe.",
  },
  {
    question: "Was verhindert falsche oder unpassende Antworten?",
    answer:
      "Vor jedem automatischen Versand laufen Qualitätskontrollen. Bei niedriger Sicherheit oder unklarem Empfänger geht es zur Freigabe.",
  },
  {
    question: "Kann ich Autopilot jederzeit stoppen?",
    answer: "Ja. Sie können Autopilot in den Einstellungen deaktivieren; neue Antworten werden dann nicht mehr automatisch versendet.",
  },
  {
    question: "Kann ich Antworten anpassen?",
    answer: "Ja. Ton, Regeln und Textbausteine können jederzeit geändert werden.",
  },
  {
    question: "Antwortet Advaic auf Newsletter oder Rechnungen?",
    answer:
      "Nicht automatisch. Solche E-Mails werden gefiltert und je nach Fall ignoriert oder zur manuellen Prüfung markiert.",
  },
  {
    question: "Wie sehe ich, was passiert ist?",
    answer: "Sie sehen den Verlauf: Eingang → Entscheidung → Versand, inklusive Status.",
  },
  {
    question: "Was passiert nach den 14 Testtagen?",
    answer:
      `Nach der Testphase läuft Starter für ${STARTER_PUBLIC_PRICE_LABEL} weiter. Sie können jederzeit kündigen und Autopilot zusätzlich pausieren.`,
  },
  {
    question: "Welche Belege sehe ich auf dieser Seite?",
    answer:
      "Sie sehen den echten Produktablauf mit Eingang, Regelprüfung, Freigabe, Qualitätschecks und Versandlogik. Die Produktzustände sind anonymisiert, zeigen aber die reale Mechanik statt bloßer Werbeaussagen.",
  },
  {
    question: "Was passiert bei Follow-ups, wenn ein Interessent antwortet?",
    answer: "Dann stoppt der automatische Nachfass-Ablauf. Follow-ups laufen nur, wenn Sie auf eine Antwort warten.",
  },
  {
    question: "Kann ich Follow-ups pausieren oder begrenzen?",
    answer: "Ja. Sie können Follow-ups deaktivieren, pausieren und die Anzahl sowie Zeitabstände der Stufen steuern.",
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28">
      <Container>
        <h2 className="h2">FAQ</h2>

        <div className="mt-8 rounded-[var(--radius)] bg-white ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
          {faqItems.map((item, index) => {
            const isActive = index === activeIndex;
            const triggerId = `faq-trigger-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div key={item.question} className="border-b border-[var(--border)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setActiveIndex(isActive ? null : index)}
                  className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
                  id={triggerId}
                  aria-controls={panelId}
                  aria-expanded={isActive}
                >
                  <span className="text-sm font-semibold text-[var(--text)] md:text-base">{item.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--gold)] transition-transform ${
                      isActive ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {isActive ? (
                  <div className="px-5 pb-5 md:px-6" id={panelId} role="region" aria-labelledby={triggerId}>
                    <p className="body text-[var(--muted)]">{item.answer}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
