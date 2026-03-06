import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";

const setupSteps = [
  "Postfach per OAuth verbinden (kein Passwort in Advaic speichern).",
  "Safe-Start aktivieren: klare Auto-Fälle, sonst Freigabe.",
  "Erste Woche Verlauf und Freigabegründe täglich prüfen.",
  "Nach stabilen KPI Follow-ups kontrolliert freischalten.",
];

const checks = [
  "Verbindung aktiv und Token-Refresh stabil",
  "Versand über das richtige Postfach",
  "Auto/Freigabe-Regeln greifen wie definiert",
  "Verlauf zeigt Eingang, Entscheidung und Versandstatus",
];

const sources = [
  {
    label: "Google OAuth 2.0",
    href: "https://developers.google.com/identity/protocols/oauth2",
    note: "Authentifizierung per OAuth statt Passwortfreigabe.",
  },
  {
    label: "Gmail API",
    href: "https://developers.google.com/gmail/api",
    note: "Technische Basis für Gmail-Integration und Nachrichtenzugriff.",
  },
  {
    label: "Google Search: JavaScript SEO Basics",
    href: "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics",
    note: "Relevanz für crawlbare Integrationsdokumentation.",
  },
];

export const metadata: Metadata = {
  title: "Gmail-Integration für Immobilienmakler",
  description:
    "So verbinden Sie Advaic mit Gmail: OAuth-basierter Zugriff, sichere Guardrails, Freigabe-Logik und sauberer Versand über Ihr Postfach.",
  alternates: {
    canonical: "/integrationen/gmail",
  },
};

export default function IntegrationenGmailPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Gmail-Integration für Immobilienmakler",
    inLanguage: "de-DE",
    about: ["Gmail", "OAuth", "Maklerpostfach", "E-Mail-Automatisierung"],
    mainEntityOfPage: `${siteUrl}/integrationen/gmail`,
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Integrationen", path: "/integrationen" },
        { name: "Gmail", path: "/integrationen/gmail" },
      ]}
      schema={schema}
      kicker="Integration: Gmail"
      title="Gmail mit Advaic verbinden"
      description="Die Gmail-Integration ist für stabilen Alltag gebaut: sichere OAuth-Verbindung, kontrollierter Auto-Versand und klare Freigabe bei Unsicherheit."
      actions={
        <>
          <Link href="/app/konto/verknuepfungen" className="btn-secondary">
            Verknüpfungen öffnen
          </Link>
          <Link href="/signup" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="orientierung"
      stageContext="integrationen-gmail"
      primaryHref="/app/konto/verknuepfungen"
      primaryLabel="Gmail verbinden"
      secondaryHref="/makler-freigabe-workflow"
      secondaryLabel="Freigabelogik prüfen"
      sources={sources}
      afterSources={
        <section className="marketing-section-clear py-8 md:py-10">
          <Container>
            <div className="flex flex-wrap gap-2">
              <Link href="/integrationen/outlook" className="btn-secondary">
                Outlook-Integration
              </Link>
              <Link href="/integrationen" className="btn-secondary">
                Zur Integrationsübersicht
              </Link>
            </div>
          </Container>
        </section>
      }
    >
      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Empfohlener Setup-Ablauf</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {setupSteps.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Go-Live-Checks</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {checks.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
