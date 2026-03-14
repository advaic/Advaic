import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const mustHaveCriteria = [
  "Klare Trennung zwischen echten Interessenten-Anfragen und irrelevanten E-Mails.",
  "Verbindliche Entscheidungspfade: Auto senden, Zur Freigabe oder Ignorieren.",
  "Qualitätschecks vor Versand (Relevanz, Kontext, Vollständigkeit, Ton, Risiko, Lesbarkeit).",
  "Verlauf mit Zeitstempel, damit jede Entscheidung nachprüfbar bleibt.",
  "Kontrollierte Follow-up-Logik mit Stop-Regeln bei Antwort oder Risiko.",
];

const evaluationFramework = [
  {
    title: "Eingang",
    question: "Erkennt das System zuverlässig, was eine Anfrage ist?",
    warning: "Wenn alles im gleichen Topf landet, steigt der manuelle Aufwand trotz Tool weiter.",
  },
  {
    title: "Entscheidung",
    question: "Ist klar geregelt, wann Auto-Versand erlaubt ist?",
    warning: "Ohne klare Policy landen Nachrichten mit fehlenden Angaben oder Risiko schnell im falschen Kanal.",
  },
  {
    title: "Antwortqualität",
    question: "Gibt es vor Versand harte Prüfungen jenseits reiner Textgenerierung?",
    warning: "Ohne QA-Checks steigt das Risiko unpassender Antworten.",
  },
  {
    title: "Kontrolle",
    question: "Können Sie Nachrichten mit Lücken oder Risiko aktiv freigeben, bearbeiten oder stoppen?",
    warning: "Ohne Freigabepfad fehlt das Sicherheitsnetz im Alltag.",
  },
  {
    title: "Nachvollziehbarkeit",
    question: "Sehen Sie pro Anfrage den kompletten Verlauf?",
    warning: "Ohne Verlauf wird Support und Teamsteuerung schnell reaktiv.",
  },
];

const implementationSteps = [
  {
    title: "1) Startprofil definieren",
    text: "Konservativ beginnen: hoher Freigabeanteil, nur Anfragen mit sauberem Objektbezug und vollständigen Angaben automatisiert senden.",
  },
  {
    title: "2) Qualitätsgrenzen festziehen",
    text: "Fälle mit unklarem Objektbezug, Konflikten oder fehlenden Pflichtinfos verpflichtend in die Freigabe legen.",
  },
  {
    title: "3) Follow-ups stufenweise aktivieren",
    text: "Erst wenn Erstreaktion und Freigabequalität stabil sind, Follow-up-Regeln ausrollen.",
  },
  {
    title: "4) KPI-basiert ausbauen",
    text: "Freigabe-zu-Senden-Quote, QA-Korrekturzeit und Erstreaktionszeit wöchentlich prüfen.",
  },
];

const sources = [
  {
    label: "Google: Creating helpful, reliable, people-first content",
    href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    note: "Einordnung, warum inhaltliche Qualität wichtiger ist als skalierte SEO-Masse ohne Mehrwert.",
  },
  {
    label: "Google: FAQ structured data",
    href: "https://developers.google.com/search/docs/appearance/structured-data/faqpage",
    note: "Maschinenlesbare FAQ-Auszeichnung für präzisere Einordnung.",
  },
  {
    label: "Google: Review snippet structured data",
    href: "https://developers.google.com/search/docs/appearance/structured-data/review-snippet",
    note: "Orientierung zur strukturierten Darstellung von Bewertungsinformationen.",
  },
  {
    label: "Capterra: Real Estate Software",
    href: "https://www.capterra.com/real-estate-software/",
    note: "Externe Marktübersicht für Vergleich und Vendor-Recherche.",
  },
  {
    label: "G2: Real Estate CRM",
    href: "https://www.g2.com/categories/real-estate-crm",
    note: "Externe Kategorieübersicht zur Bewertung von CRM-zentrierten Lösungen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Best Software für Immobilienanfragen",
  ogTitle: "Best Software für Immobilienanfragen | Advaic",
  description:
    "Auswahlleitfaden für Makler: Welche Software erkennt Anfragen sauber, trifft belastbare Versandentscheidungen und hält Freigabe und Verlauf im Griff?",
  path: "/best-software-immobilienanfragen",
  template: "compare",
  eyebrow: "Softwarevergleich",
  proof: "Eingang, Freigabe und Qualitätschecks sind wichtiger als generisches KI-Wording.",
});

export default function BestSoftwareImmobilienanfragenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Best Software für Immobilienanfragen",
        inLanguage: "de-DE",
        about: ["Immobilienanfragen", "E-Mail-Automatisierung", "Maklerprozesse"],
        mainEntityOfPage: `${siteUrl}/best-software-immobilienanfragen`,
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Welche Funktion ist bei Anfrage-Software am wichtigsten?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Entscheidend ist eine klare Entscheidungslogik: wann automatisch gesendet wird, wann Freigabe nötig ist und wie Qualitätschecks vor Versand greifen.",
            },
          },
          {
            "@type": "Question",
            name: "Reicht ein allgemeines KI-Schreibtool aus?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Für reines Formulieren kann es reichen. Für Maklerprozesse braucht es zusätzlich Eingangserkennung, Guardrails, Freigabe-Inbox und nachvollziehbaren Verlauf.",
            },
          },
          {
            "@type": "Question",
            name: "Wie startet man ohne unnötiges Risiko?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Mit einem konservativen Startprofil: hohe Freigabequote, klare Auto-Fälle und kontrollierter Ausbau erst nach stabilen KPI.",
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
        { name: "Best Software Immobilienanfragen", path: "/best-software-immobilienanfragen" },
      ]}
      schema={schema}
      kicker="Kaufentscheidung"
      title="Best Software für Immobilienanfragen: Welche Lösungen wirklich zuverlässig arbeiten"
      description="Prüfen Sie Eingang, Entscheidungslogik, Qualitätschecks, Freigabe und Verlauf. Genau daran entscheidet sich, ob Software Maklerteams wirklich entlastet."
      actions={
        <>
          <Link href="/produkt#ablauf" className="btn-secondary">
            Ablauf im Produkt ansehen
          </Link>
          <Link href="/signup?entry=best-software-anfragen" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="best-software-immobilienanfragen"
      primaryHref="/signup?entry=best-software-stage"
      primaryLabel="Mit echten Anfragen prüfen"
      secondaryHref="/manuell-vs-advaic"
      secondaryLabel="Prozessvergleich öffnen"
      sources={sources}
      sourcesDescription="Die Quellen unten helfen bei SEO-/AI-Auffindbarkeit und Softwarevergleich. Sie dienen als Orientierungs- und Prüfgrundlage für Ihre eigene Entscheidung."
    >
      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12">
            <article className="card-base p-6 lg:col-span-8 md:p-8">
              <h2 className="h3">Woran Sie gute Anfrage-Software sofort erkennen</h2>
              <p className="body mt-4 text-[var(--muted)]">
                Gute Software reduziert Klicks und operative Reibung. Sie brauchen ein System,
                das klar begründet, warum etwas automatisch gesendet wird oder bewusst in Ihrer Freigabe bleibt.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {mustHaveCriteria.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6 lg:col-span-4">
              <h2 className="h3">Kurzregel für die Auswahl</h2>
              <p className="helper mt-3">
                Wenn ein Tool nicht sauber beantwortet, wann es sendet, wann es stoppt und warum, reicht es für
                risikoarme Anfrageautomatisierung meist nicht aus.
              </p>
            </article>
          </div>
        </Container>
      </section>

      <section className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <h2 className="h2">Das 5-Punkte-Prüfschema für Ihre Shortlist</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {evaluationFramework.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="mt-3 text-sm font-medium text-[var(--text)]">{item.question}</p>
                <p className="helper mt-2">{item.warning}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">So führen Sie neue Anfrage-Software kontrolliert ein</h2>
            <div className="mt-5 space-y-3">
              {implementationSteps.map((step) => (
                <article key={step.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="text-sm font-semibold text-[var(--text)]">{step.title}</p>
                  <p className="helper mt-2">{step.text}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="card-base mt-4 p-6 md:p-8">
            <h2 className="h3">Diese Seiten helfen bei der Auswahl</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
                Best AI Tools Immobilienmakler
              </Link>
              <Link href="/advaic-vs-crm-tools" className="btn-secondary">
                Advaic vs. CRM-Tools
              </Link>
              <Link href="/produkt" className="btn-secondary">
                Produktseite
              </Link>
              <Link href="/faq" className="btn-secondary">
                FAQ
              </Link>
            </div>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
