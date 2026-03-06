import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";

const setupSteps = [
  "Postfach per Microsoft OAuth verbinden.",
  "Regelpfad mit Freigabe als Standardschutz aktivieren.",
  "Webhook-/Statusfluss im Verlauf verifizieren.",
  "Auto-Anteil erst bei stabilen QA-Signalen erhöhen.",
];

const checks = [
  "Verbindung aktiv, Token-Erneuerung stabil",
  "Senden und Status-Update ohne Fehler",
  "Unsichere Fälle landen zuverlässig in der Freigabe",
  "Verlauf ist vollständig und supportfähig",
];

const sources = [
  {
    label: "Microsoft Graph Authentication",
    href: "https://learn.microsoft.com/en-us/graph/auth/",
    note: "Grundlage für sichere Authentifizierung mit Microsoft.",
  },
  {
    label: "Microsoft Graph Mail API",
    href: "https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview",
    note: "Technischer Überblick für Mailzugriff und Versand.",
  },
  {
    label: "Microsoft Graph Change Notifications",
    href: "https://learn.microsoft.com/en-us/graph/change-notifications-overview",
    note: "Einordnung für Event-/Statusverarbeitung im E-Mail-Prozess.",
  },
];

export const metadata: Metadata = {
  title: "Outlook-Integration für Immobilienmakler",
  description:
    "So verbinden Sie Advaic mit Outlook: sichere OAuth-Anbindung, Guardrails, Freigabe-Logik und nachvollziehbarer Versandverlauf.",
  alternates: {
    canonical: "/integrationen/outlook",
  },
};

export default function IntegrationenOutlookPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Outlook-Integration für Immobilienmakler",
    inLanguage: "de-DE",
    about: ["Outlook", "Microsoft Graph", "Maklerpostfach", "E-Mail-Automatisierung"],
    mainEntityOfPage: `${siteUrl}/integrationen/outlook`,
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Integrationen", path: "/integrationen" },
        { name: "Outlook", path: "/integrationen/outlook" },
      ]}
      schema={schema}
      kicker="Integration: Outlook"
      title="Outlook mit Advaic verbinden"
      description="Die Outlook-Integration ist auf kontrollierten Betrieb ausgelegt: sichere Verbindung, klarer Freigabepfad und nachvollziehbarer Versand."
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
      stageContext="integrationen-outlook"
      primaryHref="/app/konto/verknuepfungen"
      primaryLabel="Outlook verbinden"
      secondaryHref="/makler-freigabe-workflow"
      secondaryLabel="Freigabelogik prüfen"
      sources={sources}
      afterSources={
        <section className="marketing-section-clear py-8 md:py-10">
          <Container>
            <div className="flex flex-wrap gap-2">
              <Link href="/integrationen/gmail" className="btn-secondary">
                Gmail-Integration
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
