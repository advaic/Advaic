import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import Pricing from "@/components/marketing/Pricing";
import ROICalculator from "@/components/marketing/ROICalculator";
import ObjectionHandling from "@/components/marketing/ObjectionHandling";
import CTAExperiment from "@/components/marketing/CTAExperiment";

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

const starterReadySignals = [
  "Sie möchten schnelle Erstantworten bei Standardfällen.",
  "Sie brauchen klare Guardrails statt Blackbox-Automation.",
  "Sie wollen in unklaren Fällen final selbst freigeben.",
];

const trialValidationSignals = [
  "Wie viele Fälle laufen sicher auf Auto statt manuell.",
  "Wie stark sich Reaktionszeit und Antwortquote verbessern.",
  "Wie oft Freigabe, Follow-up und Qualitätschecks eingreifen.",
];

const stopSignals = [
  "Wenn Ihr Anfragevolumen aktuell sehr niedrig ist.",
  "Wenn jede Antwort immer vollständig individuell bleiben muss.",
  "Wenn interne Prozesse noch nicht stabil genug für Regeln sind.",
];

const sources = [
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum schnelle Erstantwort wirtschaftlich relevant ist.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für risikobewusste Automatisierung mit klaren Kontrollgrenzen.",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    note: "Kontext zum Produktivitätsbeitrag strukturierter Kommunikationsprozesse.",
  },
  {
    label: "Google Search Essentials",
    href: "https://developers.google.com/search/docs/essentials",
    note: "Leitlinie für klare, verlässliche Informationsstruktur im Web.",
  },
];

export const metadata: Metadata = {
  title: "Preise und Starter",
  description:
    "14 Tage Testphase und danach Starter-Abo mit klarer Leistungslogik: Guardrails, Freigabe-Inbox, Qualitätschecks und kontrollierte Follow-ups.",
  alternates: {
    canonical: "/preise",
  },
  openGraph: {
    title: "Preise | Advaic Starter",
    description:
      "14 Tage Testphase und danach Starter-Abo mit klarer Leistungslogik: Guardrails, Freigabe-Inbox, Qualitätschecks und kontrollierte Follow-ups.",
    url: "/preise",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Preise | Advaic Starter",
    description:
      "14 Tage Testphase und danach Starter-Abo mit klarer Leistungslogik: Guardrails, Freigabe-Inbox, Qualitätschecks und kontrollierte Follow-ups.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function PreisePage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Preise und Starter",
        inLanguage: "de-DE",
        about: ["Preislogik", "Testphase", "Starter", "Pilot-KPI"],
        mainEntityOfPage: `${siteUrl}/preise`,
      },
      {
        "@type": "Offer",
        name: "Advaic Starter",
        url: `${siteUrl}/preise`,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        description: "14 Tage Testphase, danach monatlicher Starter-Tarif mit Guardrails und Freigabelogik.",
      },
    ],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Preise", path: "/preise" },
      ]}
      schema={schema}
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
      stage="entscheidung"
      stageContext="preise"
      primaryHref="/signup"
      primaryLabel="14 Tage testen"
      secondaryHref="/faq"
      secondaryLabel="Fragen klären"
      sources={sources}
      sourcesDescription="Die Quellen unterstützen die Einordnung von Reaktionszeit, Produktivität und kontrollierter Automatisierung. Sie ersetzen keine individuelle Steuer- oder Unternehmensberatung."
    >
      <section className="marketing-section-clear py-10 md:py-12">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Entscheidungshilfe vor dem Start</h2>
            <p className="helper mt-3 max-w-[72ch]">
              Wenn Sie Starter bewerten, prüfen Sie nicht nur Funktionslisten, sondern die operative Wirkung im
              Tagesgeschäft: Antworttempo, Kontrollgrad und Stabilität bei steigender Last.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Starter passt sofort, wenn</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {starterReadySignals.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Das validieren Sie in 14 Tagen</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {trialValidationSignals.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Wann Sie bewusst warten sollten</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {stopSignals.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary">
                14 Tage testen
              </Link>
              <Link href="/produkt#setup" className="btn-secondary">
                Safe-Start ansehen
              </Link>
            </div>
          </article>
        </Container>
      </section>

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
              <Link href="/roi-rechner" className="btn-secondary">
                ROI-Rechner
              </Link>
              <Link href="/einwaende" className="btn-secondary">
                Einwände klären
              </Link>
            </div>
          </article>

          <article className="card-base mt-4 p-6 md:p-8">
            <h2 className="h3">Vor einer Preisentscheidung vergleichen</h2>
            <p className="helper mt-3">
              Nutzen Sie diese Seiten, um Starter im Kontext von Prozessfit, CRM-Rolle und AI-Auffindbarkeit sauber zu
              bewerten.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
                Best AI Tools Makler
              </Link>
              <Link href="/best-software-immobilienanfragen" className="btn-secondary">
                Best Software Anfragen
              </Link>
              <Link href="/advaic-vs-crm-tools" className="btn-secondary">
                Advaic vs. CRM-Tools
              </Link>
              <Link href="/manuell-vs-advaic" className="btn-secondary">
                Manuell vs. Advaic
              </Link>
            </div>
          </article>

        </Container>
      </section>

      <ROICalculator />
      <ObjectionHandling />
      <CTAExperiment />
    </AiDiscoveryPageTemplate>
  );
}
