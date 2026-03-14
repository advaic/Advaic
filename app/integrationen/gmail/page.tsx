import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import ProductStillFrame from "@/components/marketing/produkt/ProductStillFrame";

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

const proofCards = [
  {
    title: "Setup-Signal",
    text: "Die technische Verbindung ist erst dann gut, wenn das richtige Gmail-Postfach aktiv ist und der Versandpfad im Alltag sauber geprüft werden kann.",
  },
  {
    title: "Status-Signal",
    text: "Sie müssen im Verlauf direkt sehen, wann etwas automatisch lief, wann Freigabe griff und wann ein Versand blockiert wurde.",
  },
  {
    title: "Versand-Signal",
    text: "Auto ist nur sinnvoll, wenn Rückkanal, Angaben und Guardrails stabil zusammenpassen. Genau das prüfen Sie nach der Verbindung.",
  },
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

export const metadata = buildMarketingMetadata({
  title: "Gmail-Integration für Immobilienmakler",
  ogTitle: "Gmail-Integration für Immobilienmakler | Advaic",
  description:
    "So verbinden Sie Advaic mit Gmail: OAuth-basierter Zugriff, sichere Guardrails, Freigabe-Logik und sauberer Versand über Ihr Postfach.",
  path: "/integrationen/gmail",
  template: "integration",
  eyebrow: "Integration: Gmail",
  proof: "OAuth-Verbindung, Guardrails, Freigabe-Logik und nachvollziehbarer Versand über Ihr Gmail-Postfach.",
});

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
      description="Die Gmail-Integration ist für stabilen Alltag gebaut: sichere OAuth-Verbindung, kontrollierter Auto-Versand und klare Freigabe bei fehlenden Angaben oder Risikosignalen."
      actions={
        <>
          <Link href="/produkt#setup" className="btn-secondary">
            Setup ansehen
          </Link>
          <Link href="/signup?entry=integrationen-gmail" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="orientierung"
      stageContext="integrationen-gmail"
      primaryHref="/signup?entry=integrationen-gmail"
      primaryLabel="Mit Gmail testen"
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]" data-tour="integration-detail-proof">
            <ProductStillFrame
              label="Gmail-Betrieb"
              src="/marketing-screenshots/core/raw/messages-inbox.png"
              alt="Nachrichtenliste mit sichtbaren Status- und Filterinformationen"
              caption="Nach der Gmail-Verbindung prüfen Sie im echten Eingang, ob Regeln, Freigabe und Versandpfad sauber greifen."
              imageClassName="object-cover object-[50%_8%] scale-[1.05]"
              aspectClassName="aspect-[16/11]"
              frameTour="integration-gmail-main-frame"
              stageTour="integration-gmail-main-shot"
            />
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Empfohlener Setup-Ablauf</h2>
              <p className="helper mt-3">
                Die eigentliche Gmail-Verbindung erfolgt nach Anmeldung in den Verknüpfungen. Diese Seite zeigt
                Ihnen vorab, wie der sichere Setup-Pfad aufgebaut ist.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {setupSteps.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 grid gap-3">
                {proofCards.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]"
                  >
                    <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.text}</p>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <article className="card-base mt-6 p-6 md:p-8" data-tour="integration-gmail-checks">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div>
                <h2 className="h3">Go-Live-Checks</h2>
                <p className="helper mt-3">
                  Diese vier Signale sollten Sie in den ersten Tagen mit Gmail wirklich sehen, bevor Sie mehr Auto zulassen.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                  {checks.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <ProductStillFrame
                label="Status & Verlauf"
                src="/marketing-screenshots/core/raw/conversation-context.png"
                alt="Konversationsansicht mit Kontext- und Statusspalte"
                caption="Status, Kontext und nächster Schritt müssen nach dem Go-live im Fall selbst lesbar bleiben."
                imageClassName="object-cover object-[53%_10%] scale-[1.05]"
                aspectClassName="aspect-[16/10]"
                frameTour="integration-gmail-secondary-frame"
                stageTour="integration-gmail-secondary-shot"
              />
            </div>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
