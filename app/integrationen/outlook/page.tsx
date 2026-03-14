import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import ProductStillFrame from "@/components/marketing/produkt/ProductStillFrame";

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

const proofCards = [
  {
    title: "Setup-Signal",
    text: "Die Microsoft-Verbindung ist erst wirklich sauber, wenn Statusfluss, Rückkanal und richtiges Postfach im Betrieb stimmen. Eine erfolgreiche Freigabe im Microsoft-Dialog allein reicht dafür nicht.",
  },
  {
    title: "Status-Signal",
    text: "Sie müssen im Fall sofort sehen, ob Outlook sauber zugestellt hat oder ob Freigabe, Pause oder Fehler dazwischenlagen.",
  },
  {
    title: "Versand-Signal",
    text: "Entscheidend ist, ob Guardrails und Verlauf nach dem Go-live stabil bleiben und für Ihr Team im Alltag sauber lesbar sind.",
  },
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

export const metadata = buildMarketingMetadata({
  title: "Outlook-Integration für Immobilienmakler",
  ogTitle: "Outlook-Integration für Immobilienmakler | Advaic",
  description:
    "So verbinden Sie Advaic mit Outlook: sichere OAuth-Anbindung, Guardrails, Freigabe-Logik und nachvollziehbarer Versandverlauf.",
  path: "/integrationen/outlook",
  template: "integration",
  eyebrow: "Integration: Outlook",
  proof: "OAuth-Anbindung, Guardrails, Freigabe-Logik und nachvollziehbarer Versandpfad für Outlook.",
});

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
          <Link href="/produkt#setup" className="btn-secondary">
            Setup ansehen
          </Link>
          <Link href="/signup?entry=integrationen-outlook" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="orientierung"
      stageContext="integrationen-outlook"
      primaryHref="/signup?entry=integrationen-outlook"
      primaryLabel="Mit Outlook testen"
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]" data-tour="integration-detail-proof">
            <ProductStillFrame
              label="Outlook-Betrieb"
              src="/marketing-screenshots/core/raw/dashboard-systemstatus.png"
              alt="Dashboard mit gemeinsamer Systemstatus-Zone"
              caption="Nach der Outlook-Verbindung müssen Versand, Deliverability und Automationszustand im Alltag sichtbar bleiben."
              imageClassName="object-cover object-[50%_10%] scale-[1.04]"
              aspectClassName="aspect-[16/11]"
              frameTour="integration-outlook-main-frame"
              stageTour="integration-outlook-main-shot"
            />
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Empfohlener Setup-Ablauf</h2>
              <p className="helper mt-3">
                Die eigentliche Outlook-Verbindung erfolgt nach Anmeldung in den Verknüpfungen. Diese Seite zeigt
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

          <article className="card-base mt-6 p-6 md:p-8" data-tour="integration-outlook-checks">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div>
                <h2 className="h3">Go-Live-Checks</h2>
                <p className="helper mt-3">
                  Diese vier Signale sollten Sie in den ersten Tagen mit Outlook sehen, bevor der Auto-Korridor größer wird.
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
                label="Verlauf & Entscheidung"
                src="/marketing-screenshots/core/raw/conversation-context.png"
                alt="Konversationsansicht mit Kontext- und Statusspalte"
                caption="Auch mit Outlook muss der Entscheidungs- und Versandpfad pro Fall transparent bleiben."
                imageClassName="object-cover object-[53%_10%] scale-[1.05]"
                aspectClassName="aspect-[16/10]"
                frameTour="integration-outlook-secondary-frame"
                stageTour="integration-outlook-secondary-shot"
              />
            </div>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
