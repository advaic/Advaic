import Link from "next/link";
import { Fragment } from "react";
import { getSiteUrl } from "@/lib/seo/site-url";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import IntegrationVisualProof from "@/components/marketing/integrations/IntegrationVisualProof";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";

const comparisonRows = [
  {
    label: "Setup",
    gmail: "OAuth-Verbindung mit Ihrem bestehenden Gmail-Postfach. Kein Passwort in Advaic.",
    outlook: "Microsoft-OAuth mit Ihrem Outlook-Postfach. Kein separates Passwort-Sharing.",
  },
  {
    label: "OAuth / Verbindung",
    gmail: "Google OAuth 2.0, geeignet für Teams mit Gmail- oder Google-Workspace-Postfächern.",
    outlook: "Microsoft OAuth / Graph, geeignet für Teams mit Outlook- oder Microsoft-365-Postfächern.",
  },
  {
    label: "Versandpfad",
    gmail: "Versand läuft über Ihr Gmail-Postfach mit denselben Guardrails und Freigaberegeln wie im Produkt.",
    outlook: "Versand läuft über Ihr Outlook-Postfach mit demselben Freigabe- und Guardrail-Modell.",
  },
  {
    label: "Statusfluss",
    gmail: "Verlauf zeigt Eingang, Entscheidung, Freigabe und Versandstatus pro Nachricht sichtbar an.",
    outlook: "Verlauf zeigt Eingang, Entscheidung, Freigabe und Versandstatus ebenfalls nachvollziehbar an.",
  },
  {
    label: "Go-Live-Checks",
    gmail: "Token-Refresh, richtiges Postfach, Auto/Freigabe-Regeln und Verlauf in der ersten Woche täglich prüfen.",
    outlook: "Token-Erneuerung, Statusfluss, Freigabelogik und Versandverhalten in den ersten Tagen eng überwachen.",
  },
];

const fitCards = [
  {
    title: "Gmail ist meist passend, wenn …",
    text: "Ihr Team bereits mit Gmail oder Google Workspace arbeitet und Sie einen schlanken Setup-Pfad für einzelne Maklerpostfächer wollen.",
    href: "/integrationen/gmail",
  },
  {
    title: "Outlook ist meist passend, wenn …",
    text: "Ihr Team mit Outlook oder Microsoft 365 arbeitet und Sie den Versandpfad sauber in Ihren bestehenden Microsoft-Stack einbinden möchten.",
    href: "/integrationen/outlook",
  },
];

const rolloutNotes = [
  "Die Integration allein macht den Betrieb noch nicht sicher. Entscheidend ist der Startkorridor aus Auto, Freigabe und Ignore.",
  "Gmail und Outlook unterscheiden sich im Zugangspfad, nicht in der Guardrail-Logik von Advaic.",
  "Vor dem Go-live sollten Sie Verbindung, Versandpfad, Freigabegründe und Verlauf im echten Postfach prüfen.",
];

const detailCards = [
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

const proofCards = [
  {
    label: "Setup im Produkt",
    title: "Nach der Verbindung läuft jede Anfrage in denselben sichtbaren Eingang",
    text: "Gmail und Outlook unterscheiden sich im OAuth-Pfad, nicht in der operativen Oberfläche. Eingang, Priorität und nächster Status bleiben im Produkt sichtbar.",
    src: "/marketing-screenshots/core/raw/messages-inbox.png",
    alt: "Nachrichtenliste mit sichtbaren Status- und Filterinformationen",
    caption: "Nach der Verbindung arbeiten Gmail und Outlook im selben operativen Eingang.",
    imageClassName: "object-cover object-[50%_8%] scale-[1.05]",
    aspectClassName: "aspect-[16/11]",
  },
  {
    label: "Versandpfad",
    title: "Rückkanal, Kontext und Versandgrund bleiben nachvollziehbar",
    text: "Der wichtige Unterschied für Käufer ist nicht der Providername, sondern ob Rückkanal, Kontext und nächster Schritt im Fall sichtbar bleiben.",
    src: "/marketing-screenshots/core/raw/conversation-context.png",
    alt: "Konversationsansicht mit Kontext- und Statusspalte",
    caption: "Versand und Bearbeitung bleiben im Fallkontext nachvollziehbar, nicht in einer Black Box.",
    imageClassName: "object-cover object-[53%_10%] scale-[1.05]",
    aspectClassName: "aspect-[16/11]",
  },
  {
    label: "Statusfluss",
    title: "Die Betriebslage bleibt auch nach dem Go-live sichtbar",
    text: "Ob Gmail oder Outlook: entscheidend ist, dass Versand, Deliverability und Automationszustand im Dashboard früh auffallen.",
    src: "/marketing-screenshots/core/raw/dashboard-systemstatus.png",
    alt: "Dashboard mit gemeinsamer Systemstatus-Zone",
    caption: "Go-live heißt nicht blind laufen lassen, sondern Betriebszustand aktiv sehen.",
    imageClassName: "object-cover object-[50%_10%] scale-[1.04]",
    aspectClassName: "aspect-[16/11]",
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

export const metadata = buildMarketingMetadata({
  title: "Integrationen | Advaic",
  ogTitle: "Integrationen | Advaic",
  description:
    "Übersicht der Advaic-Integrationen für Makler: Gmail und Outlook mit sicherer Verbindung, Guardrails und nachvollziehbarem Versandfluss.",
  path: "/integrationen",
  template: "integration",
  eyebrow: "Integrationen",
  proof: "Gmail und Outlook mit sicherem Setup, Guardrails und nachvollziehbarem Versandpfad.",
});

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
            Gmail im Detail
          </Link>
          <Link href="/integrationen/outlook" className="btn-secondary">
            Outlook im Detail
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4" data-tour="integrations-mobile-quickbar">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Springen Sie direkt in die Proof-Zone oder in den Gmail-/Outlook-Vergleich.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#integrations-proof" className="btn-secondary w-full justify-center">
              Produktbeweis
            </MarketingJumpLink>
            <MarketingJumpLink href="#integrations-compare" className="btn-secondary w-full justify-center">
              Vergleich öffnen
            </MarketingJumpLink>
          </div>
        </article>
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
          <div className="max-w-[76ch]">
            <p className="section-kicker">Vergleich statt Link-Hub</p>
            <h2 className="h2 mt-2">Gmail und Outlook im direkten Vergleich</h2>
            <p className="body mt-4 text-[var(--muted)] max-md:text-[0.98rem]">
              Diese Seite beantwortet zuerst die Integrationsfrage: Wie unterscheiden sich Setup, Verbindung,
              Versandpfad und Go-live-Prüfung zwischen Gmail und Outlook? Der Guardrail- und Freigabeprozess im
              Produkt bleibt dabei gleich.
            </p>
          </div>

          <div id="integrations-proof" className="mt-8" data-tour="integrations-proof-section">
            <IntegrationVisualProof cards={proofCards} />
          </div>

          <article className="card-base mt-8 p-6 md:p-7" data-tour="integrations-rollout-notes">
            <ul className="space-y-3 text-sm leading-6 text-[var(--muted)]">
              {rolloutNotes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <div
            id="integrations-compare"
            className="mt-8 rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] md:p-7"
            data-tour="integrations-comparison-table"
          >
            <div className="hidden md:grid md:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)] md:gap-4">
              <div className="rounded-xl bg-[var(--surface-2)] px-4 py-3 ring-1 ring-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Vergleich</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">Kriterium</p>
              </div>
              <div className="rounded-xl bg-[var(--surface-2)] px-4 py-3 ring-1 ring-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Integration</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">Gmail</p>
              </div>
              <div className="rounded-xl bg-[var(--surface-2)] px-4 py-3 ring-1 ring-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Integration</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">Outlook</p>
              </div>

              {comparisonRows.map((row) => (
                <Fragment key={row.label}>
                  <article className="rounded-xl bg-white px-4 py-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{row.label}</p>
                  </article>
                  <article className="rounded-xl bg-[var(--surface-2)] px-4 py-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm leading-6 text-[var(--muted)]">{row.gmail}</p>
                  </article>
                  <article className="rounded-xl bg-[var(--surface-2)] px-4 py-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm leading-6 text-[var(--muted)]">{row.outlook}</p>
                  </article>
                </Fragment>
              ))}
            </div>

            <div className="space-y-4 md:hidden">
              {comparisonRows.map((row) => (
                <article key={row.label} className="rounded-2xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{row.label}</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-[var(--border)]">
                      <p className="text-sm font-semibold text-[var(--text)]">Gmail</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{row.gmail}</p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-[var(--border)]">
                      <p className="text-sm font-semibold text-[var(--text)]">Outlook</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{row.outlook}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {fitCards.map((item) => (
              <article key={item.href} className="card-base p-6">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Details öffnen
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-6 hidden gap-4 md:grid md:grid-cols-2" data-tour="integrations-detail-grid">
            {detailCards.map((item) => (
              <article key={item.href} className="rounded-2xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-2">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Detailseite öffnen
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
