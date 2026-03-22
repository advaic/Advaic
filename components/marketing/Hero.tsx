import { ArrowRight, PlayCircle } from "lucide-react";
import Container from "./Container";
import HeroStillVisual from "./HeroStillVisual";
import TrackedLink from "./TrackedLink";
import { MARKETING_PRIMARY_CTA_LABEL, MARKETING_PROOF_CTA_LABEL } from "./cta-copy";

const heroDecisionSignals = [
  {
    title: "Auto-Senden",
    text: "Objekt, Empfänger und Angaben passen sauber zusammen.",
  },
  {
    title: "Freigabe",
    text: "Lücken, no-reply oder Risiko bleiben sichtbar bei Ihnen.",
  },
  {
    title: "Checks",
    text: "Vor jedem Versand laufen Relevanz-, Ton- und Vollständigkeitschecks.",
  },
];

export default function Hero() {
  return (
    <section id="top" className="marketing-hero-bg py-12 sm:py-14 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-6 md:gap-12 lg:gap-16 xl:gap-20 lg:items-center">
          <div className="motion-enter col-span-12 lg:col-span-5 xl:col-span-4">
            <p className="label">E-Mail-Antworten für Immobilienmakler</p>
            <h1 className="h1 mt-3 max-w-[14ch] md:mt-4 md:max-w-[11ch]">
              Immobilienanfragen automatisch beantworten.
            </h1>
            <p className="body-lg mt-4 max-w-[48ch] text-[var(--muted)] md:mt-6">
              <span className="md:hidden">
                Automatisch, wenn Objekt, Empfänger und Angaben sauber passen. Bei Lücken oder Risiko greift Ihre
                Freigabe.
              </span>
              <span className="hidden md:inline">
                Advaic beantwortet E-Mail-Anfragen automatisch, wenn Objektbezug, Empfänger und Angaben sauber
                passen. Fehlen Informationen, ist der Rückkanal unsicher oder wird der Inhalt sensibel, greift Ihre
                Freigabe.
              </span>
            </p>
          </div>

          <div className="motion-enter motion-delay-2 col-span-12 lg:col-span-7 xl:col-span-8 lg:row-span-2 lg:pl-6 xl:pl-10">
            <HeroStillVisual />
          </div>

          <div className="motion-enter col-span-12 lg:col-span-5 xl:col-span-4">
            <div className="mt-1 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <TrackedLink
                href="/signup"
                className="btn-primary"
                event="marketing_hero_primary_click"
                source="website"
                pageGroup="marketing"
                section="hero"
                meta={{ section: "hero" }}
                data-tour="marketing-hero-primary-cta"
              >
                {MARKETING_PRIMARY_CTA_LABEL}
                <ArrowRight className="h-4 w-4" />
              </TrackedLink>
              <TrackedLink
                href="/produkt"
                className="btn-secondary"
                event="marketing_hero_secondary_click"
                source="website"
                pageGroup="marketing"
                section="hero"
                meta={{ section: "hero", target: "/produkt" }}
                data-tour="marketing-hero-proof-cta"
              >
                <PlayCircle className="h-4 w-4" />
                {MARKETING_PROOF_CTA_LABEL}
              </TrackedLink>
            </div>

            <p className="helper mt-3 max-w-[46ch]">
              Safe-Start zuerst, Auto-Versand danach Schritt für Schritt erweitern.
            </p>

            <article
              className="mt-5 rounded-[26px] border border-[rgba(11,15,23,.08)] bg-white/95 p-4 shadow-[var(--shadow-sm)]"
              data-tour="marketing-hero-proof-summary"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Erster Prüfpfad
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                    In einem Blick sehen: Auto-Senden, Freigabe, Checks.
                  </p>
                </div>
                <a href="#produkt-autoritaet" className="focus-ring text-sm font-medium text-[var(--text)] underline decoration-[var(--gold-soft)] underline-offset-4">
                  Direkt im Produktfluss
                </a>
              </div>

              <div className="mt-4 grid gap-2 lg:grid-cols-1" data-tour="marketing-hero-decision-list">
                {heroDecisionSignals.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex min-w-12 items-center justify-center rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)] ring-1 ring-[var(--gold-soft)]">
                        {item.title}
                      </span>
                      <p className="text-sm leading-6 text-[var(--text)]">{item.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </div>
        </div>
      </Container>
    </section>
  );
}
