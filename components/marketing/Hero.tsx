import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import Container from "./Container";
import LoopVideo from "./produkt/LoopVideo";
import TrackedLink from "./TrackedLink";

const microTrust = [
  "Autopilot jederzeit pausierbar",
  "Unklare Fälle → Freigabe",
  "Qualitätschecks vor Auto-Versand",
];

const trialChecklist = [
  "Welche Standardfälle automatisch beantwortet werden",
  "Wann Fälle zwingend in die Freigabe gehen",
  "Wie Tonalität, Antwortlänge und Follow-up-Logik zu Ihrem Alltag passen",
];

const quickAnchors = [
  { href: "#how", label: "Ablauf ansehen" },
  { href: "#rules", label: "Regeln prüfen" },
  { href: "#pricing", label: "Starter verstehen" },
];

export default function Hero() {
  return (
    <section id="top" className="marketing-hero-bg py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-8 md:gap-12 lg:items-center">
          <div className="col-span-12 lg:col-span-5">
            <p className="label">Automatisierte Interessenten-Kommunikation</p>
            <h1 className="h1 mt-4">Interessenten-Anfragen automatisch beantworten. Mit Guardrails.</h1>
            <p className="body-lg mt-6 max-w-[54ch] text-[var(--muted)]">
              Advaic beantwortet Interessenten-Anfragen per E-Mail in Ihrem Stil. Automatisch nur bei klaren
              Standardfällen. Unklare oder riskante Fälle gehen in die Freigabe. Vor jedem Auto-Versand greifen
              Qualitätschecks.
            </p>
            <ul className="mt-6 space-y-2">
              {trialChecklist.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href="/signup"
                className="btn-primary"
                event="marketing_hero_primary_click"
                source="website"
                pageGroup="marketing"
                section="hero"
                meta={{ section: "hero" }}
              >
                14 Tage kostenlos testen
                <ArrowRight className="h-4 w-4" />
              </TrackedLink>
              <TrackedLink
                href="/so-funktionierts"
                className="btn-secondary"
                event="marketing_hero_secondary_click"
                source="website"
                pageGroup="marketing"
                section="hero"
                meta={{ section: "hero", target: "so-funktionierts" }}
              >
                <PlayCircle className="h-4 w-4" />
                So funktioniert's
              </TrackedLink>
            </div>

            <p className="helper mt-3">14 Tage real testen. Danach läuft Starter monatlich weiter, jederzeit kündbar.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickAnchors.map((anchor) => (
                <a key={anchor.href} href={anchor.href} className="btn-secondary !min-h-9 !px-3 !py-2 !text-xs">
                  {anchor.label}
                </a>
              ))}
            </div>

            <ul className="mt-8 grid gap-2 sm:grid-cols-2">
              {microTrust.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <div className="card-base overflow-hidden p-2">
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-2 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
              </div>

              <div className="mt-2 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)]">
                <LoopVideo
                  webm="/loops/product-hero.webm"
                  mp4="/loops/product-hero.mp4"
                  poster="/loops/product-hero.jpg"
                  priority
                  className="aspect-video w-full bg-[var(--surface-2)] object-contain"
                  ariaLabel="Advaic Produktvorschau: Eingang, Entscheidung und Versand"
                  placeholderLabel="Produktvorschau"
                />
              </div>

              <p className="helper mt-3 text-center">Eingang → Entscheidung → Versand. Jeder Schritt im Verlauf sichtbar.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
