import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";

const integrationCards = [
  {
    title: "Gmail-Integration",
    text: "OAuth-basierte Verbindung, sauberer Versand über Ihr Postfach und nachvollziehbarer Verlauf.",
    href: "/integrationen/gmail",
  },
  {
    title: "Outlook-Integration",
    text: "Microsoft-Postfachverbindung mit sicherem Versandpfad und klaren Statussignalen.",
    href: "/integrationen/outlook",
  },
];

const sources = [
  {
    label: "Google OAuth 2.0",
    href: "https://developers.google.com/identity/protocols/oauth2",
    note: "Grundlage für sichere OAuth-basierte Google-Verbindungen.",
  },
  {
    label: "Microsoft Graph – Authentication",
    href: "https://learn.microsoft.com/en-us/graph/auth/",
    note: "Grundlage für sichere Microsoft-Authentifizierung und API-Zugriff.",
  },
  {
    label: "Google Search Essentials",
    href: "https://developers.google.com/search/docs/essentials",
    note: "Leitlinie für crawlbare, klare Integrationsseiten im SEO-Kontext.",
  },
];

export const metadata: Metadata = {
  title: "Integrationen | Advaic",
  description:
    "Übersicht der Advaic-Integrationen für Makler: Gmail und Outlook mit sicherer Verbindung, Guardrails und nachvollziehbarem Versandfluss.",
  alternates: {
    canonical: "/integrationen",
  },
};

export default function IntegrationenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Advaic Integrationen",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/integrationen`,
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Integrationen", path: "/integrationen" },
      ]}
      schema={schema}
      kicker="Integrationen"
      title="Postfach-Integrationen für den produktiven Betrieb"
      description="Advaic verbindet sich mit Ihrem E-Mail-Stack, damit Versand, Freigabe und Verlauf im Alltag stabil funktionieren."
      actions={
        <>
          <Link href="/integrationen/gmail" className="btn-secondary">
            Gmail ansehen
          </Link>
          <Link href="/integrationen/outlook" className="btn-secondary">
            Outlook ansehen
          </Link>
        </>
      }
      stage="orientierung"
      stageContext="integrationen-hub"
      primaryHref="/integrationen/gmail"
      primaryLabel="Gmail-Integration"
      secondaryHref="/integrationen/outlook"
      secondaryLabel="Outlook-Integration"
      sources={sources}
    >
      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {integrationCards.map((item) => (
              <article key={item.href} className="card-base p-6 md:p-8">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Details öffnen
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
