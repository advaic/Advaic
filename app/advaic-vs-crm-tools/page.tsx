import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";

const comparisonRows = [
  {
    topic: "Kernaufgabe",
    crm: "Kontakt- und Pipelineverwaltung, Aufgaben, Reporting, Historie.",
    advaic: "Operative Anfragebearbeitung in Echtzeit: Eingang, Entscheidung, Antwort, Freigabe, Verlauf.",
  },
  {
    topic: "Entscheidungslogik pro E-Mail",
    crm: "Häufig nur indirekt über Workflows oder manuelle Regeln.",
    advaic: "Direkt pro Nachricht: Auto senden, Zur Freigabe oder Ignorieren mit Begründung.",
  },
  {
    topic: "Qualitätschecks vor Versand",
    crm: "Nicht der typische Schwerpunkt klassischer CRM-Flows.",
    advaic: "Verbindlich vor Auto-Versand: Relevanz, Kontext, Vollständigkeit, Ton, Risiko, Lesbarkeit.",
  },
  {
    topic: "Fail-Safe bei Unsicherheit",
    crm: "Je nach Setup; oft kein spezialisierter Freigabeweg für Antwortentwürfe.",
    advaic: "Unklare Fälle gehen standardmäßig in die Freigabe-Inbox.",
  },
  {
    topic: "Verlauf für Support und Kontrolle",
    crm: "Kontakt-/Deal-Historie stark, operative Versandentscheidung nicht immer granular.",
    advaic: "Nachrichtenspezifischer Verlauf: Eingang → Entscheidung → Checks → Versand/Freigabe.",
  },
  {
    topic: "Follow-up-Steuerung",
    crm: "Meist kampagnen- oder aufgabenorientiert.",
    advaic: "Antwortbezogene Follow-up-Logik mit Stop-Regeln und Risikopfaden.",
  },
];

const stackRecommendation = [
  {
    title: "CRM bleibt System of Record",
    text: "Objekte, Kontakte, Pipeline und Teamsteuerung bleiben im CRM.",
  },
  {
    title: "Advaic wird das Ausführungssystem für Anfragen",
    text: "Advaic übernimmt den operativen Antwortfluss und sichert Entscheidungen mit Guardrails ab.",
  },
  {
    title: "Gemeinsame KPI statt Tool-Silos",
    text: "Messen Sie Antwortzeit, Freigabequote, QA-Korrekturzeit und Conversion entlang desselben Prozesses.",
  },
];

const decisionSignals = [
  "Wenn Ihr Team viele ähnliche Anfrage-E-Mails hat: Advaic als Ergänzung zum CRM priorisieren.",
  "Wenn Ihr Hauptproblem Reporting und Pipeline-Transparenz ist: CRM-Optimierung zuerst priorisieren.",
  "Wenn beides relevant ist: CRM + Advaic als kombinierten Stack aufsetzen.",
];

const sources = [
  {
    label: "G2: Real Estate CRM Category",
    href: "https://www.g2.com/categories/real-estate-crm",
    note: "Externe Übersicht zur CRM-Landschaft im Immobilienkontext.",
  },
  {
    label: "Capterra: Real Estate Software",
    href: "https://www.capterra.com/real-estate-software/",
    note: "Externe Marktübersicht für Vergleich von Softwaretypen.",
  },
  {
    label: "Google: Software App structured data",
    href: "https://developers.google.com/search/docs/appearance/structured-data/software-app",
    note: "Strukturierte Einordnung von Softwareseiten für bessere maschinelle Lesbarkeit.",
  },
  {
    label: "NIST AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für risikobewussten Einsatz von KI-gestützten Entscheidungen.",
  },
];

export const metadata: Metadata = {
  title: "Advaic vs CRM-Tools",
  description:
    "Vergleich: Was CRM-Tools leisten und was ein spezialisierter Makler-Anfrage-Autopilot wie Advaic zusätzlich abdeckt.",
  alternates: {
    canonical: "/advaic-vs-crm-tools",
  },
  openGraph: {
    title: "Advaic vs CRM-Tools | Vergleich für Makler",
    description:
      "Vergleich: Was CRM-Tools leisten und was ein spezialisierter Makler-Anfrage-Autopilot wie Advaic zusätzlich abdeckt.",
    url: "/advaic-vs-crm-tools",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Advaic vs CRM-Tools | Vergleich für Makler",
    description:
      "Vergleich: Was CRM-Tools leisten und was ein spezialisierter Makler-Anfrage-Autopilot wie Advaic zusätzlich abdeckt.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function AdvaicVsCrmToolsPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Advaic vs CRM-Tools",
    inLanguage: "de-DE",
    about: ["CRM", "Maklerprozesse", "E-Mail-Automatisierung", "Freigabe-Logik"],
    mainEntityOfPage: `${siteUrl}/advaic-vs-crm-tools`,
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Advaic vs CRM-Tools", path: "/advaic-vs-crm-tools" },
      ]}
      schema={schema}
      kicker="Vergleich"
      title="Advaic vs CRM-Tools: kein Entweder-oder, sondern klare Rollen"
      description="CRM und Advaic lösen unterschiedliche Aufgaben. Diese Seite zeigt präzise, wann welches System den größeren Hebel hat und wie Sie beides sinnvoll kombinieren."
      actions={
        <>
          <Link href="/produkt" className="btn-secondary">
            Produkt verstehen
          </Link>
          <Link href="/signup?entry=advaic-vs-crm" className="btn-primary">
            Kombi-Setup testen
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="advaic-vs-crm-tools"
      primaryHref="/signup?entry=advaic-vs-crm-stage"
      primaryLabel="Advaic im Alltag testen"
      secondaryHref="/manuell-vs-advaic"
      secondaryLabel="Manuell-Vergleich"
      sources={sources}
      sourcesDescription="Die Quellen unterstützen die Markt- und Risikoeinordnung. Für die konkrete Toolauswahl sollten Sie immer mit Ihren realen Anfragefällen testen."
    >
      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Direktvergleich nach operativer Wirkung</h2>
            <p className="body mt-4 max-w-[74ch] text-[var(--muted)]">
              Wenn Sie schneller und sicherer auf Interessenten reagieren wollen, ist die Frage nicht nur „haben wir
              ein CRM?“, sondern „wie steuern wir die Antwortausführung pro Anfrage?“.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-3 py-3 font-semibold text-[var(--text)]">Vergleichspunkt</th>
                    <th className="px-3 py-3 font-semibold text-[var(--text)]">CRM-Tools</th>
                    <th className="px-3 py-3 font-semibold text-[var(--text)]">Advaic</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.topic} className="border-b border-[var(--border)] align-top">
                      <td className="px-3 py-4 font-medium text-[var(--text)]">{row.topic}</td>
                      <td className="px-3 py-4 text-[var(--muted)]">{row.crm}</td>
                      <td className="px-3 py-4 text-[var(--muted)]">{row.advaic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </Container>
      </section>

      <section className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Empfohlener Ziel-Stack für kleine Maklerteams</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stackRecommendation.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Entscheidungssignale für die Priorisierung</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {decisionSignals.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Nächste sinnvolle Schritte</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/produkt#regeln" className="btn-secondary">
                  Regeln prüfen
                </Link>
                <Link href="/produkt#qualitaet" className="btn-secondary">
                  Qualitätschecks prüfen
                </Link>
                <Link href="/produkt#freigabe" className="btn-secondary">
                  Freigabe-Inbox prüfen
                </Link>
                <Link href="/faq" className="btn-secondary">
                  FAQ öffnen
                </Link>
              </div>
            </article>
          </div>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
