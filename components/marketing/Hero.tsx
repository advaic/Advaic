import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import Container from "./Container";
import LoopVideo from "./produkt/LoopVideo";
import TrackedLink from "./TrackedLink";

const microTrust = [
  "Autopilot jederzeit pausierbar",
  "Unklare Fälle → Freigabe",
  "Qualitätschecks vor Auto-Versand",
];

export default function Hero() {
  return (
    <section id="top" className="marketing-hero-bg py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-8 md:gap-12 lg:items-center">
          <div className="col-span-12 lg:col-span-6">
            <p className="label">Automatisierte Interessenten-Kommunikation</p>
            <h1 className="h1 mt-4">Mehr Zeit. Weniger Stress.</h1>
            <p className="body-lg mt-6 max-w-[54ch] text-[var(--muted)]">
              Advaic beantwortet Interessenten-Anfragen per E-Mail automatisch
              in Ihrem Stil. Unklare Fälle gehen zur Freigabe. Vor jedem
              automatischen Versand laufen Qualitätschecks, bei Freigaben
              entscheiden Sie final.
            </p>

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
              <a href="#tour" className="btn-secondary">
                <PlayCircle className="h-4 w-4" />
                Ablauf ansehen
              </a>
            </div>

            <p className="helper mt-3">
              Danach läuft Starter monatlich weiter. Jederzeit kündbar.
            </p>

            <ul className="mt-8 space-y-2">
              {microTrust.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="card-base overflow-hidden p-3">
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-2 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
              </div>

              <div className="mt-3 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)]">
                <LoopVideo
                  webm="/loops/product-hero.webm"
                  mp4="/loops/product-hero.mp4"
                  poster="/loops/product-hero.jpg"
                  priority
                  className="aspect-video w-full object-cover"
                  ariaLabel="Advaic Produktvorschau: Eingang, Entscheidung und Versand"
                  placeholderLabel="Produktvorschau"
                />
              </div>

              <p className="helper mt-3 text-center">Eingang → Entscheidung → Versand (voll sichtbar)</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
