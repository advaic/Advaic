import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import ROICalculator from "@/components/marketing/ROICalculator";
import ObjectionHandling from "@/components/marketing/ObjectionHandling";
import CTAExperiment from "@/components/marketing/CTAExperiment";
import { MARKETING_FAQ_CTA_LABEL, MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";
import {
  STARTER_PUBLIC_BILLING_CYCLE_LABEL,
  STARTER_PUBLIC_PLAN_NAME,
  STARTER_PUBLIC_PRICE_EUR,
  STARTER_PUBLIC_PRICE_LABEL,
  STARTER_PUBLIC_TRIAL_AND_PRICE_LABEL,
} from "@/lib/billing/public-pricing";

const pricingPrinciples = [
  `Sie prüfen zuerst 14 Tage im echten Postfach, bevor Starter für ${STARTER_PUBLIC_PRICE_LABEL} weiterläuft.`,
  "Es gibt bewusst nur einen öffentlichen Plan, damit die Kaufentscheidung nicht an Paketnamen scheitert.",
  "Entscheidend ist nicht Funktionsfülle, sondern ob Antwortzeit, Freigaben und Prozessqualität im Alltag tragen.",
];

const purchaseFacts = [
  "14 Tage Testphase im echten Postfach",
  `Danach ${STARTER_PUBLIC_PRICE_LABEL}`,
  "Jederzeit kündbar",
  "Autopilot und Freigabe bleiben steuerbar",
];

const starterIncludes = [
  "Regeln für Auto senden, Zur Freigabe und Ignorieren",
  "Qualitätskontrollen vor Auto-Versand",
  "Freigabe-Inbox für fehlende Angaben, sensible Inhalte oder unsichere Absender",
  "Follow-up-Stufen mit Stop-Regeln und Pausenlogik",
];

const roiSignals = [
  "Neue Anfragen erhalten schneller eine erste Antwort, ohne dass Ihr Team jede Mail manuell schreiben muss.",
  "Die Freigabe bleibt auch bei mehr Volumen beherrschbar.",
  "Weniger zeitkritische Nacharbeit, weil problematische Fälle früher gestoppt werden.",
];

const starterReadySignals = [
  "Sie erhalten regelmäßig wiederkehrende Interessenten-Anfragen per E-Mail.",
  "Sie möchten Erstantworten beschleunigen, ohne Nachrichten mit fehlenden Angaben, no-reply-Absendern oder sensiblen Inhalten automatisch laufen zu lassen.",
  "Ihr Team kann Regeln und Freigaben im Alltag sauber prüfen.",
];

const trialValidationSignals = [
  "Welche Anfragen wegen sauberem Objektbezug und vollständigen Angaben sicher auf Auto laufen können.",
  "Ob Antwortzeit und Bearbeitungsquote im Team spürbar besser werden.",
  "Wie oft Freigabe, Qualitätschecks und Follow-ups tatsächlich eingreifen.",
];

const objectionResponse = [
  "Sie müssen nicht sofort breit automatisieren. Starter ist für Safe-Start gedacht, nicht für blindes Go-live.",
  "Sie starten mit enger Freigabegrenze und sehen im echten Postfach, welche Fälle stabil genug für Auto sind.",
  "Autopilot, Follow-ups und Regeln bleiben pausierbar und anpassbar, wenn Ihr Team noch engeren Betrieb braucht.",
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

export const metadata: Metadata = buildMarketingMetadata({
  title: `Preise: ${STARTER_PUBLIC_PRICE_LABEL} nach 14 Tagen Testphase`,
  ogTitle: `Preise | ${STARTER_PUBLIC_PRICE_LABEL} nach 14 Tagen Testphase`,
  description:
    `Sie testen Advaic 14 Tage im echten Postfach. Danach kostet Starter ${STARTER_PUBLIC_PRICE_LABEL}, wenn Antwortzeit, Freigaben und Prozessqualität für Ihr Team passen.`,
  path: "/preise",
  template: "pricing",
  eyebrow: "Preise",
  proof: `${STARTER_PUBLIC_TRIAL_AND_PRICE_LABEL}.`,
});

export default function PreisePage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `Preise: ${STARTER_PUBLIC_PRICE_LABEL} nach 14 Tagen Testphase`,
        inLanguage: "de-DE",
        about: ["Preislogik", "Testphase", "Starter", "Pilot-KPI"],
        mainEntityOfPage: `${siteUrl}/preise`,
      },
      {
        "@type": "Offer",
        name: STARTER_PUBLIC_PLAN_NAME,
        url: `${siteUrl}/preise`,
        price: String(STARTER_PUBLIC_PRICE_EUR),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        description: `${STARTER_PUBLIC_TRIAL_AND_PRICE_LABEL} mit Freigabe und Qualitätschecks.`,
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
      title={`Preise: ${STARTER_PUBLIC_PRICE_LABEL} nach 14 Tagen Testphase`}
      description={`Sie starten 14 Tage im echten Betrieb. Danach kostet Starter ${STARTER_PUBLIC_PRICE_LABEL}, wenn Antwortzeit, Freigaben und Prozessqualität für Ihr Team passen.`}
      actions={
        <>
          <Link href="/produkt" className="btn-secondary">
            Im Produkt ansehen
          </Link>
          <Link href="/signup" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      stage="entscheidung"
      stageContext="preise"
      primaryHref="/signup"
      primaryLabel={MARKETING_PRIMARY_CTA_LABEL}
      secondaryHref="/faq"
      secondaryLabel={MARKETING_FAQ_CTA_LABEL}
      sources={sources}
      sourcesDescription="Die Quellen unterstützen die Einordnung von Reaktionszeit, Produktivität und kontrollierter Automatisierung. Sie ersetzen keine individuelle Steuer- oder Unternehmensberatung."
    >
      <section className="marketing-section-clear py-10 md:py-12">
        <Container>
          <article className="card-base overflow-hidden p-0" data-tour="pricing-price-summary">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.08fr)_380px]">
              <div className="p-6 md:p-8 lg:p-10">
                <p className="label">Öffentlicher Einstieg</p>
                <div
                  className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1"
                  data-tour="marketing-pricing-price"
                >
                  <p className="text-5xl font-semibold tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                    {STARTER_PUBLIC_PRICE_EUR} €
                  </p>
                  <div className="pb-1">
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {STARTER_PUBLIC_BILLING_CYCLE_LABEL}
                    </p>
                    <p className="text-sm text-[var(--muted)]">nach 14 Tagen Testphase</p>
                  </div>
                </div>
                <h2 className="h2 mt-5">14 Tage im echten Betrieb. Danach Starter.</h2>
                <p className="body mt-4 max-w-[62ch] text-[var(--muted)]">
                  Sie prüfen zwei Wochen lang im echten Postfach, ob Antwortzeit, Freigabe und
                  Regelwerk für Ihr Team tragen. Erst danach läuft Starter für{" "}
                  {STARTER_PUBLIC_PRICE_LABEL} weiter.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href="/signup" className="btn-primary">
                    14 Tage testen
                  </Link>
                  <Link href="/produkt#setup" className="btn-secondary">
                    Safe-Start ansehen
                  </Link>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {purchaseFacts.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[var(--gold-soft)] bg-white px-3 py-1 text-xs text-[var(--muted)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--border)] bg-[var(--surface-2)] p-6 lg:border-l lg:border-t-0 lg:p-8">
                <article
                  className="rounded-2xl bg-white p-4 ring-1 ring-[var(--border)]"
                  data-tour="pricing-objection-card"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    Häufigster Einwand
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-[var(--text)]">
                    „Wir wollen nicht sofort blind automatisieren.“
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                    {objectionResponse.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    In den 14 Tagen müssen Sie sehen
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                    {trialValidationSignals.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    Starter passt gut, wenn
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                    {starterReadySignals.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-[var(--border)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    Lieber noch warten, wenn
                  </p>
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
            </div>
          </article>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">So lesen Sie Starter wirtschaftlich richtig</h2>
            <p className="helper mt-3 max-w-[72ch]">
              Bewerten Sie Starter nicht wie eine Funktionsliste. Die eigentliche Kaufentscheidung
              ist, ob Ihr Team schneller reagiert, die Freigabe beherrscht und weniger unnötige
              Nacharbeit erzeugt.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Was in Starter enthalten ist</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {starterIncludes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Woran Sie wirtschaftlichen Fit erkennen</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {roiSignals.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Warum es heute bewusst nur Starter gibt</p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {pricingPrinciples.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </article>

          <article className="card-base mt-4 p-6 md:p-8">
            <h2 className="h3">Wenn Sie vorab noch vergleichen möchten</h2>
            <p className="helper mt-3">
              Diese Seiten helfen Ihnen, Starter gegenüber CRM-Tools, manueller Bearbeitung und anderen
              AI-Ansätzen sauber einzuordnen.
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
