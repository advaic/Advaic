import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import Pricing from "@/components/marketing/Pricing";
import ROICalculator from "@/components/marketing/ROICalculator";
import ObjectionHandling from "@/components/marketing/ObjectionHandling";
import CTAExperiment from "@/components/marketing/CTAExperiment";
import FinalCTA from "@/components/marketing/FinalCTA";

const pricingPrinciples = [
  "Nur ein Starter-Tarif: klare Entscheidung ohne künstliche Paketkomplexität.",
  "14 Tage Testphase: echte Betriebsprobe statt Demo-Versprechen.",
  "Feature-basierte Weiterentwicklung: spätere Pakete nach Funktionsumfang, nicht nach künstlichen Limits.",
];

const roiSignals = [
  "Antwortzeit sinkt und mehr relevante Anfragen werden innerhalb des Zielzeitfensters bearbeitet.",
  "Freigabe-Inbox bleibt unter Kontrolle, obwohl Volumen steigt.",
  "Weniger operative Nacharbeit durch klare Qualitäts- und Risikoprüfungen vor Versand.",
];

const sources = [
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
];

export const metadata: Metadata = {
  title: "Preise | Advaic Starter",
  description:
    "14 Tage Testphase und danach Starter-Abo mit klarer Leistungslogik: Guardrails, Freigabe-Inbox, Qualitätschecks und kontrollierte Follow-ups.",
};

export default function PreisePage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Preise"
        title="Transparenter Einstieg mit Starter"
        description="Starten Sie mit 14 Tagen Testphase. Danach läuft Starter monatlich weiter und bleibt jederzeit kündbar."
        actions={
          <>
            <Link href="/produkt" className="btn-secondary">
              Produkt ansehen
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />
      <StageCTA
        stage="entscheidung"
        primaryHref="/signup"
        primaryLabel="14 Tage testen"
        secondaryHref="/faq"
        secondaryLabel="Fragen klären"
        context="preise"
      />

      <Pricing showDetailButton={false} />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Preislogik in 60 Sekunden</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {pricingPrinciples.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-8 md:p-10">
              <h2 className="h2">Was in Starter enthalten ist</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                <li>Auto/Freigabe/Ignorieren nach klarer Regel-Logik</li>
                <li>Qualitätskontrollen vor Auto-Versand</li>
                <li>Statusverlauf pro Nachricht (Eingang → Entscheidung → Versand)</li>
                <li>Freigabe-Inbox für unklare oder sensible Fälle</li>
                <li>Kontrollierte Follow-up-Stufen mit Stop-Regeln</li>
              </ul>
            </article>

            <article className="card-base p-8 md:p-10">
              <h2 className="h2">Ablauf von Testphase zu Starter</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                <li>14 Tage Testphase ohne langfristige Bindung</li>
                <li>Monatliche Starter-Laufzeit nach der Testphase</li>
                <li>Kündbar; Autopilot zusätzlich jederzeit pausierbar</li>
                <li>Empfohlener Start: konservativ mit mehr Freigaben</li>
                <li>Keine kostenlose Dauer-Version, um Betriebsqualität stabil zu halten</li>
              </ul>
            </article>
          </div>

          <article className="card-base mt-4 p-6 md:p-8">
            <h2 className="h3">Woran Sie den wirtschaftlichen Nutzen erkennen</h2>
            <p className="helper mt-3 max-w-[72ch]">
              Entscheidend ist nicht die Anzahl versendeter E-Mails, sondern die operative Verbesserung im Alltag:
              schnellere Erstantwort, stabilere Prozessqualität und weniger zeitkritische Nacharbeit im Team.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {roiSignals.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-4 p-6 md:p-8">
            <h2 className="h3">Hinweis zur Paketstrategie</h2>
            <p className="helper mt-3">
              Aktuell gibt es bewusst nur Starter. Wenn später weitere Pakete kommen, werden sie feature-basiert
              differenziert und nicht über künstliche Antwort-Limits.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/autopilot-regeln" className="btn-secondary">
                Regeln im Detail
              </Link>
              <Link href="/qualitaetschecks" className="btn-secondary">
                Checks im Detail
              </Link>
              <Link href="/freigabe-inbox" className="btn-secondary">
                Freigabe verstehen
              </Link>
              <Link href="/manuell-vs-advaic" className="btn-secondary">
                Manuell vs. Advaic
              </Link>
            </div>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Die Preis- und Rolloutlogik stützt sich auf öffentlich dokumentierte Zusammenhänge zu Reaktionszeit,
              Produktivität in digitaler Kommunikation und kontrolliertem Risikomanagement.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </article>
        </Container>
      </section>

      <ROICalculator />
      <ObjectionHandling />
      <CTAExperiment />
      <FinalCTA />
    </PageShell>
  );
}
