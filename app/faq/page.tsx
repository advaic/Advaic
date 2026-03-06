import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import FAQDecisionTree from "@/components/marketing/FAQDecisionTree";
import MarketingFAQ from "@/components/marketing/FAQ";

const detailLinks = [
  { title: "Autopilot-Regeln", href: "/autopilot-regeln" },
  { title: "Qualitätschecks", href: "/qualitaetschecks" },
  { title: "Freigabe-Inbox", href: "/freigabe-inbox" },
  { title: "Follow-up-Logik", href: "/follow-up-logik" },
  { title: "ROI-Rechner", href: "/roi-rechner" },
  { title: "Einwand-Hub", href: "/einwaende" },
  { title: "Anwendungsfälle", href: "/use-cases" },
  { title: "Vergleich", href: "/manuell-vs-advaic" },
  { title: "E-Mail-Automatisierung", href: "/email-automatisierung-immobilienmakler" },
];

const faqUse = [
  "Wenn Sie wissen wollen, ob der Autopilot sicher ist: mit Entscheidungsbaum und Regeln starten.",
  "Wenn Sie den operativen Ablauf planen: erst Setup, dann Follow-up-Logik und Freigabeprozess prüfen.",
  "Wenn Sie Compliance bewerten: Sicherheitsseite, DSGVO-Seite und Datenschutzhinweise gemeinsam lesen.",
];

const externalSources = [
  {
    label: "EUR-Lex – DSGVO Zusammenfassung",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
    note: "Rechtliche Grundstruktur für datenschutzkonformen Betrieb.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für Risikokontrolle in KI-gestützten Prozessen.",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum Reaktionszeit im Interessenten-Prozess entscheidend ist.",
  },
];

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Antworten zu Autopilot, Freigabe, Qualitätschecks, Follow-ups, Sicherheit und Testphase von Advaic für Immobilienmakler.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ | Advaic",
    description:
      "Antworten zu Autopilot, Freigabe, Qualitätschecks, Follow-ups, Sicherheit und Testphase von Advaic für Immobilienmakler.",
    url: "/faq",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "FAQ | Advaic",
    description:
      "Antworten zu Autopilot, Freigabe, Qualitätschecks, Follow-ups, Sicherheit und Testphase von Advaic für Immobilienmakler.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function FAQPage() {
  const siteUrl = getSiteUrl();
  const faqSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "FAQ zu Advaic",
        inLanguage: "de-DE",
        about: ["Autopilot", "Freigabe", "Qualitätschecks", "Sicherheit", "Follow-up"],
        mainEntityOfPage: `${siteUrl}/faq`,
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Sendet Advaic automatisch?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ja, wenn der Fall klar ist und die Qualitätschecks bestanden sind. Unklare Fälle gehen zur Freigabe.",
            },
          },
          {
            "@type": "Question",
            name: "Was verhindert unpassende Antworten?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Vor jedem Auto-Versand laufen Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeitschecks.",
            },
          },
          {
            "@type": "Question",
            name: "Kann ich den Autopilot jederzeit stoppen?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ja, der Autopilot kann jederzeit pausiert werden.",
            },
          },
        ],
      },
    ],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "FAQ", path: "/faq" },
      ]}
      schema={faqSchema}
      kicker="FAQ"
      title="Häufige Fragen zu Advaic"
      description="Hier finden Sie die wichtigsten Antworten zu Funktionsweise, Sicherheit, Steuerung und Testphase."
      actions={
        <>
          <Link href="/produkt" className="btn-secondary">
            Produktdetails
          </Link>
          <Link href="/signup" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="orientierung"
      stageContext="faq"
      primaryHref="/produkt"
      primaryLabel="Produktablauf ansehen"
      secondaryHref="/einwaende"
      secondaryLabel="Einwände prüfen"
      sources={externalSources}
      sourcesDescription="Die Quellen unterstützen die Einordnung von Datenschutz, Risiko-Governance und Reaktionsgeschwindigkeit."
    >
      <section className="marketing-section-clear py-12 md:py-16">
        <Container>
          <article className="card-base p-5 md:p-6">
            <h2 className="h3">So nutzen Sie diese FAQ sinnvoll</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {faqUse.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="card-base p-5">
              <h2 className="h3">Autopilot</h2>
              <p className="helper mt-2">
                Wann automatisch gesendet wird, wann Freigabe greift und welche Guardrails aktiv sind.
              </p>
            </article>
            <article className="card-base p-5">
              <h2 className="h3">Sicherheit</h2>
              <p className="helper mt-2">
                Welche Qualitätschecks vor Auto-Versand laufen und wie Transparenz im Verlauf aussieht.
              </p>
            </article>
            <article className="card-base p-5">
              <h2 className="h3">Setup</h2>
              <p className="helper mt-2">
                Wie Sie starten, konservativ konfigurieren und Follow-ups kontrolliert aktivieren.
              </p>
            </article>
          </div>

          <div className="mt-6 card-base p-5">
            <h2 className="h3">Direkt zu den Detailseiten</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {detailLinks.map((item) => (
                <Link key={item.href} href={item.href} className="btn-secondary">
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <article className="card-base mt-6 p-5 md:p-6">
            <h2 className="h3">Weiterführende Vergleichsseiten</h2>
            <p className="helper mt-3">
              Für detaillierte Kaufentscheidungen finden Sie hier zusätzliche Seiten mit Auswahlkriterien, direkter
              Abgrenzung und operativen Beispielen.
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

      <FAQDecisionTree />
      <MarketingFAQ showDetailButton={false} />
    </AiDiscoveryPageTemplate>
  );
}
