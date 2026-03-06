import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";

const pillars = [
  {
    title: "Antwortgeschwindigkeit",
    text: "Bei hoher Anfragezahl entscheidet die Zeit bis zur ersten qualifizierten Antwort über Rücklauf und Terminquote.",
  },
  {
    title: "Kontrollierte Automatisierung",
    text: "Nicht alles wird automatisiert: klare Standardfälle laufen automatisch, unklare Fälle gehen zur Freigabe.",
  },
  {
    title: "Nachvollziehbare Entscheidungen",
    text: "Jede Nachricht bleibt prüfbar: Eingang, Entscheidung, Qualitätschecks und Versandstatus im Verlauf.",
  },
];

const whatMaklerNeed = [
  "Klare Auto/Freigabe/Ignorieren-Logik statt generischer Textautomatisierung",
  "Qualitätschecks vor Versand (Relevanz, Kontext, Vollständigkeit, Ton, Risiko, Lesbarkeit)",
  "Sicheren Start mit hoher Freigabequote und schrittweisem Ausbau",
  "Follow-up-Steuerung mit Stop-Regeln bei Antwort oder Unsicherheit",
];

const commonMistakes = [
  "Zu früh zu viel automatisieren, ohne Guardrails und Freigabeprozess",
  "Nur auf Textqualität schauen statt auf den End-to-End-Prozess",
  "Keine KPI-Definition vor Rollout (Antwortzeit, Freigabequote, Korrekturzeit)",
  "KI als Ersatz für Teamentscheidungen sehen statt als operatives Assistenzsystem",
];

const sources = [
  {
    label: "Google: Creating helpful, reliable, people-first content",
    href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    note: "Leitlinie für nutzerzentrierte Inhalte und saubere Suchintention.",
  },
  {
    label: "Google Search Essentials",
    href: "https://developers.google.com/search/docs/essentials",
    note: "Grundlagen für Crawlbarkeit, Indexierung und technische SEO-Qualität.",
  },
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Referenz zur wirtschaftlichen Relevanz schneller Reaktion in digitalen Interessenten-Prozessen.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für risikobewussten KI-Einsatz im operativen Alltag.",
  },
];

export const metadata: Metadata = {
  title: "KI für Immobilienmakler",
  description:
    "Wie KI für Immobilienmakler sinnvoll eingesetzt wird: schnelle Erstreaktion, klare Guardrails, Freigabe bei Unsicherheit und kontrollierter Rollout.",
  alternates: {
    canonical: "/ki-fuer-immobilienmakler",
  },
  openGraph: {
    title: "KI für Immobilienmakler | Advaic",
    description:
      "Wie KI für Immobilienmakler sinnvoll eingesetzt wird: schnelle Erstreaktion, klare Guardrails, Freigabe bei Unsicherheit und kontrollierter Rollout.",
    url: "/ki-fuer-immobilienmakler",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "KI für Immobilienmakler | Advaic",
    description:
      "Wie KI für Immobilienmakler sinnvoll eingesetzt wird: schnelle Erstreaktion, klare Guardrails, Freigabe bei Unsicherheit und kontrollierter Rollout.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function KiFuerImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "KI für Immobilienmakler",
        inLanguage: "de-DE",
        about: ["KI für Makler", "E-Mail-Automatisierung", "Freigabe", "Qualitätschecks"],
        mainEntityOfPage: `${siteUrl}/ki-fuer-immobilienmakler`,
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Sollten Makler sofort alles automatisieren?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Nein. Ein sicherer Start erfolgt konservativ: klare Standardfälle automatisch, unklare Fälle in die Freigabe.",
            },
          },
          {
            "@type": "Question",
            name: "Woran erkennt man gute KI-Lösungen für Makler?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "An klarer Entscheidungslogik, Qualitätschecks vor Versand, nachvollziehbarem Verlauf und kontrolliertem Rollout statt reiner Textgenerierung.",
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
        { name: "KI für Immobilienmakler", path: "/ki-fuer-immobilienmakler" },
      ]}
      schema={schema}
      kicker="High-Intent Leitfaden"
      title="KI für Immobilienmakler: sinnvoll einsetzen statt blind automatisieren"
      description="Die höchste Wirkung entsteht, wenn KI einen klaren Maklerprozess unterstützt: Anfrage erkennen, Entscheidung absichern, Qualität prüfen, Versand kontrollieren."
      actions={
        <>
          <Link href="/produkt" className="btn-secondary">
            Produkt im Detail
          </Link>
          <Link href="/signup?entry=ki-fuer-immobilienmakler" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="orientierung"
      stageContext="ki-fuer-immobilienmakler"
      primaryHref="/produkt"
      primaryLabel="Ablauf ansehen"
      secondaryHref="/manuell-vs-advaic"
      secondaryLabel="Manuell vergleichen"
      sources={sources}
    >
      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[74ch]">
            <h2 className="h2">Was KI im Makleralltag tatsächlich verbessern muss</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Für Makler ist KI kein Selbstzweck. Entscheidend sind schnelle Erstreaktion, stabile Qualität und
              klarer Schutz vor Fehlversand bei Unsicherheit.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pillars.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Was Makler von KI erwarten sollten</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {whatMaklerNeed.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Häufige Fehlentscheidungen</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {commonMistakes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <article className="card-base mt-4 p-6 md:p-8">
            <h2 className="h3">Nächste sinnvolle Seiten</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/immobilienanfragen-automatisieren" className="btn-secondary">
                Immobilienanfragen automatisieren
              </Link>
              <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
                Best AI Tools Makler
              </Link>
              <Link href="/advaic-vs-crm-tools" className="btn-secondary">
                Advaic vs. CRM-Tools
              </Link>
            </div>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
