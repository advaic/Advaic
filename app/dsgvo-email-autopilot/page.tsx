import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import TrustByDesign from "@/components/marketing/TrustByDesign";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const compliancePoints = [
  "Datenminimierung: Verarbeitung nur für Erkennen, Entscheiden und Antworten.",
  "Klare Zugriffstrennung: Rollen- und agentenbezogene Begrenzung.",
  "Nachvollziehbarkeit: Verlauf mit Status und Zeitstempeln.",
  "Fail-Safe: Bei fehlenden Angaben, Konflikten oder Risikosignalen keine automatische Antwort.",
];

const quickTake = [
  "DSGVO-konforme E-Mail-Automatisierung bedeutet nicht Verzicht auf Automatisierung, sondern klare Rollen, Zwecke, Grenzen und Nachweise.",
  "Technik kann Guardrails liefern, die rechtliche Bewertung Ihrer konkreten Kommunikation bleibt trotzdem beim Betreiber.",
  "Je präziser Freigabegrenzen, Löschlogik und Zugriffskonzepte dokumentiert sind, desto belastbarer wird der Betrieb.",
];

const checklist = [
  "Verarbeitungszwecke dokumentieren (Antwortautomatisierung, Freigabe, Qualitätskontrolle).",
  "Zugriffsberechtigungen nach Rollenprinzip festlegen und regelmäßig prüfen.",
  "Aufbewahrungs- und Löschprozesse intern definieren.",
  "Freigabeprozess für sensible Inhalte als Standard festlegen.",
  "Export- und Auskunftsprozesse für Betroffenenanfragen vorbereiten.",
];

const boundaries = [
  {
    title: "Was Advaic abdeckt",
    points: [
      "Prozesslogik für Auto, Freigabe, Ignorieren",
      "Qualitäts- und Risiko-Checks vor Versand",
      "Status- und Entscheidungsverlauf für Nachvollziehbarkeit",
    ],
  },
  {
    title: "Was Sie intern festlegen müssen",
    points: [
      "Rechtliche Bewertung Ihrer konkreten Verarbeitung",
      "Verantwortlichkeiten im Team und Weisungswege",
      "Aufbewahrungsfristen und Löschkonzept",
    ],
  },
];

const docs = [
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "Cookie & Storage", href: "/cookie-und-storage" },
  { label: "Sicherheitsdetails", href: "/sicherheit" },
];

const sources = [
  {
    label: "EUR-Lex – DSGVO Volltext (EU 2016/679)",
    href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    note: "Primärquelle der Verordnung.",
  },
  {
    label: "EUR-Lex – DSGVO Zusammenfassung",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
    note: "Offizielle Zusammenfassung der zentralen Prinzipien.",
  },
  {
    label: "BfDI – Informationen zur DSGVO",
    href: "https://www.bfdi.bund.de/DE/Buerger/Inhalte/Datenschutz/Allgemein/DatenschutzGrundverordnung.html",
    note: "Deutsche Einordnung und Praxisinformationen.",
  },
  {
    label: "BSI – IT-Grundschutz",
    href: "https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html",
    note: "Orientierung für organisatorische und technische Sicherheitsmaßnahmen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wie E-Mail-Autopilot DSGVO-orientiert betrieben wird",
  ogTitle: "DSGVO E-Mail Autopilot | Advaic",
  description:
    "Leitfaden für Makler: Welche Rollen, Grenzen, Nachweise und technischen Schutzmaßnahmen für DSGVO-orientierte E-Mail-Automatisierung wichtig sind.",
  path: "/dsgvo-email-autopilot",
  template: "trust",
  eyebrow: "DSGVO & E-Mail-Autopilot",
  proof: "Klare Zwecke, Zugriffskonzepte, Freigabegrenzen und nachvollziehbarer Verlauf für den Produktbetrieb.",
});

export default function DSGVOEmailAutopilotPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "DSGVO E-Mail Autopilot",
    inLanguage: "de-DE",
    about: ["DSGVO", "E-Mail-Automatisierung", "Immobilienmakler", "Guardrails"],
    mainEntityOfPage: `${siteUrl}/dsgvo-email-autopilot`,
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "DSGVO E-Mail Autopilot", path: "/dsgvo-email-autopilot" },
      ]}
      schema={schema}
      kicker="DSGVO & E-Mail-Autopilot"
      title="Automatisieren mit klaren Datenschutz- und Sicherheitsgrenzen"
      description="Advaic ist so gebaut, dass Automatisierung innerhalb definierter Leitplanken läuft: klare Zwecke, dokumentierte Entscheidungen und Stop-Mechanismen bei fehlenden Angaben oder Risikosignalen."
      actions={
        <>
          <Link href="/sicherheit" className="btn-secondary">
            Sicherheitsseite
          </Link>
          <Link href="/signup" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="intent-dsgvo-autopilot"
      primaryHref="/signup"
      primaryLabel="Sicher testen"
      secondaryHref="/datenschutz"
      secondaryLabel="Datenschutz lesen"
      sources={sources}
      sourcesDescription="Diese Seite ist eine technische und organisatorische Einordnung und ersetzt keine individuelle Rechtsberatung."
      afterSources={<TrustByDesign />}
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

      <section className="marketing-section-clear py-14 md:py-18">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="card-base p-6 lg:col-span-8 md:p-8">
              <h2 className="h3">Worum es bei DSGVO-konformer E-Mail-Automatisierung wirklich geht</h2>
              <p className="body mt-4 text-[var(--muted)]">
                Datenschutzkonformer Betrieb bedeutet nicht, jede Automatisierung zu vermeiden. Entscheidend ist, dass
                Zweck, Zugriff, Entscheidungsgrenzen und Nachvollziehbarkeit klar geregelt sind.
              </p>
              <p className="body mt-4 text-[var(--muted)]">
                Advaic ist für genau dieses Setup ausgelegt: klare Guardrails, dokumentierte Entscheidungswege und
                Fail-Safe-Stopps bei fehlenden Angaben oder Risikosignalen statt unkontrolliertem Vollautopilot.
              </p>
            </article>
            <article className="card-base p-6 lg:col-span-4">
              <h2 className="h3">Wichtiger Hinweis</h2>
              <p className="helper mt-3">
                Technische und organisatorische Einordnung, keine individuelle Rechtsberatung.
              </p>
            </article>
          </div>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6">
            <h2 className="h3">Was das in der Praxis bedeutet</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {compliancePoints.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Pragmatische DSGVO-Checkliste für den Start</h2>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {boundaries.map((block) => (
              <article key={block.title} className="card-base p-6">
                <h2 className="h3">{block.title}</h2>
                <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                  {block.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Weiterführende Dokumente</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {docs.map((item) => (
                <Link key={item.href} href={item.href} className="btn-secondary">
                  {item.label}
                </Link>
              ))}
            </div>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
