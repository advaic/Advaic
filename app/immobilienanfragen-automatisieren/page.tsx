import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const processSteps = [
  {
    title: "1) Eingang prüfen",
    text: "Relevante Interessenten-Anfragen werden von Newslettern, Systemmails und no-reply sauber getrennt.",
  },
  {
    title: "2) Entscheidung erzwingen",
    text: "Jede Nachricht wird in Auto senden, Zur Freigabe oder Ignorieren eingeordnet.",
  },
  {
    title: "3) Qualitätschecks ausführen",
    text: "Vor Auto-Versand laufen Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeitschecks.",
  },
  {
    title: "4) Verlauf dokumentieren",
    text: "Status und Zeitstempel zeigen jederzeit, was warum passiert ist.",
  },
];

const startRules = [
  "Autopilot nur für wiederkehrende Erstantworten aktivieren (Verfügbarkeit, Unterlagen, Besichtigung)",
  "Freigabepflicht für fehlenden Objektbezug, Konfliktthemen und fehlende Pflichtinfos",
  "Follow-ups erst aktivieren, wenn Erstantwortprozess stabil läuft",
  "Jede Woche KPI prüfen und Regeln iterativ nachschärfen",
];

const quickTake = [
  "Immobilienanfragen zu automatisieren lohnt sich dort, wo viele ähnliche E-Mails schnell beantwortet werden müssen.",
  "Der Engpass ist meist nicht Textgenerierung, sondern die saubere Entscheidung zwischen Auto, Freigabe und Ignorieren.",
  "Ein guter Start setzt auf wenige Antworttypen, klare Freigabegründe und sichtbare Qualitätschecks vor dem Versand.",
];

const sources = [
  {
    label: "Google: SEO Starter Guide",
    href: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
    note: "Grundlagen für suchintentionstreue, strukturierte Landingpages.",
  },
  {
    label: "Google: URL structure best practices",
    href: "https://developers.google.com/search/docs/crawling-indexing/url-structure",
    note: "Empfehlungen für klare, lesbare URL-Struktur.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierten, risikobewussten Einsatz automatisierter Entscheidungen.",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Reaktionsgeschwindigkeit als zentraler Hebel für digitale Interessenten-Anfragen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wie Makler Immobilienanfragen sinnvoll automatisieren",
  ogTitle: "Immobilienanfragen automatisieren | Advaic",
  description:
    "Praxisleitfaden für Makler: Wie Immobilienanfragen sinnvoll automatisiert werden, welche Antworttypen sich eignen und welche Guardrails vor dem Versand stehen müssen.",
  path: "/immobilienanfragen-automatisieren",
  template: "guide",
  eyebrow: "Praxisleitfaden",
  proof: "Auto, Freigabe und Ignorieren sauber trennen und den Rollout über klare Qualitätsgrenzen steuern.",
});

export default function ImmobilienanfragenAutomatisierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Immobilienanfragen automatisieren",
    inLanguage: "de-DE",
    about: ["Immobilienanfragen", "E-Mail-Automatisierung", "Guardrails", "Freigabe-Workflow"],
    mainEntityOfPage: `${siteUrl}/immobilienanfragen-automatisieren`,
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Immobilienanfragen automatisieren", path: "/immobilienanfragen-automatisieren" },
      ]}
      schema={schema}
      kicker="Praxisleitfaden"
      title="Immobilienanfragen automatisieren: sicher, nachvollziehbar, skalierbar"
      description="Der wichtigste Punkt ist nicht maximale Automatisierung, sondern die richtige Automatisierung: klare Auto-Fälle, Guardrails und Freigabe bei fehlenden Angaben oder Konflikten."
      actions={
        <>
          <Link href="/produkt#ablauf" className="btn-secondary">
            Ablauf ansehen
          </Link>
          <Link href="/signup?entry=immobilienanfragen-automatisieren" className="btn-primary">
            Sicher starten
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="immobilienanfragen-automatisieren"
      primaryHref="/signup?entry=immobilienanfragen-automatisieren-stage"
      primaryLabel="Mit Safe-Start testen"
      secondaryHref="/makler-freigabe-workflow"
      secondaryLabel="Freigabe-Workflow"
      sources={sources}
    >
      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <article className="card-base p-6">
            <h2 className="h3">Kurzantwort in 60 Sekunden</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {quickTake.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[74ch]">
            <h2 className="h2">Der richtige Automatisierungsprozess für Makleranfragen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Anfrageautomatisierung arbeitet nicht als Blackbox. Sie folgt einem klaren Ablauf, den Sie im
              Dashboard nachvollziehen und steuern können.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {processSteps.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Safe-Start-Regeln für den Rollout</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {startRules.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/autopilot-regeln" className="btn-secondary">
                Autopilot-Regeln
              </Link>
              <Link href="/qualitaetschecks" className="btn-secondary">
                Qualitätschecks
              </Link>
              <Link href="/follow-up-logik" className="btn-secondary">
                Follow-up-Logik
              </Link>
            </div>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
