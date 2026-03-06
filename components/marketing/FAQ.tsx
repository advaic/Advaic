"use client";

import Link from "next/link";
import { useState } from "react";
import Container from "./Container";

const items = [
  {
    question: "Sendet Advaic automatisch?",
    answer:
      "Ja, wenn Autopilot aktiv ist, der Fall klar ist und die Prüfungen bestanden sind. Sobald Unsicherheit besteht, geht der Fall zur Freigabe.",
  },
  {
    question: "Was verhindert falsche Antworten?",
    answer:
      "Vor jedem automatischen Versand laufen Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeitsprüfungen. Bei Unsicherheit stoppt der Auto-Versand.",
  },
  {
    question: "Kann ich den Autopilot pausieren?",
    answer:
      "Ja. Sie können den Autopilot in den Einstellungen deaktivieren und Nachrichten vollständig manuell bearbeiten.",
  },
  {
    question: "Antwortet Advaic auf Newsletter?",
    answer:
      "Nicht automatisch. Newsletter, Systemmails und Spam werden gefiltert. Technische no-reply Absender ohne nutzbaren Rückkanal werden je nach Fall ignoriert oder zur Prüfung markiert.",
  },
  {
    question: "Wie transparent ist das?",
    answer:
      "Sie sehen den vollständigen Verlauf pro Nachricht: Eingang, Entscheidung, Freigabe und Versand inklusive Status.",
  },
  {
    question: "Was passiert nach den 14 Testtagen?",
    answer:
      "Nach der Testphase läuft Starter monatlich weiter. Sie können jederzeit kündigen und Autopilot zusätzlich pausieren.",
  },
  {
    question: "Gibt es schon veröffentlichte Kundenbeispiele?",
    answer:
      "Aktuell noch nicht. Deshalb kommunizieren wir bewusst konkrete Produktlogik und nachvollziehbare Statusabläufe statt isolierter Marketingzahlen.",
  },
  {
    question: "Datenschutz und Dokumentation?",
    answer:
      "Sie erhalten die Dokumentation im Onboarding. Die Verarbeitung ist transparent aufgebaut. Diese Seite ersetzt keine Rechtsberatung.",
  },
];

type MarketingFAQProps = {
  showDetailButton?: boolean;
};

export default function MarketingFAQ({ showDetailButton = true }: MarketingFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="h2">FAQ</h2>
          {showDetailButton ? (
            <Link href="/faq" className="btn-secondary">
              Alle Fragen
            </Link>
          ) : null}
        </div>
        <div className="mt-8 space-y-3">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <article key={item.question} className="card-base overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  id={`faq-trigger-${index}`}
                >
                  <span className="text-base font-semibold text-[var(--text)]">{item.question}</span>
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
      </Container>
    </section>
  );
}
