import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const quickTake = [
  "KI ist im Makleralltag dann nützlich, wenn sie wiederkehrende Arbeit beschleunigt und nicht Beratungs- oder Haftungsfragen pauschal übernimmt.",
  "Der größte Hebel liegt meist in Anfrageeingang, Antwortentwürfen, Qualitätsprüfung und Follow-up-Steuerung.",
  "Vor dem Tool-Kauf sollten Sie prüfen, ob Regeln, Freigaben, Verlauf und Datenqualität zum Betrieb passen.",
];

const useCases = [
  {
    title: "Anfrageeingang sortieren",
    text: "KI kann echte Interessenten-Anfragen von Spam, Newslettern und internen Mails trennen und damit das Postfach sauberer priorisieren.",
  },
  {
    title: "Antwortentwürfe vorbereiten",
    text: "Wiederkehrende Erstfragen lassen sich schneller beantworten, wenn Entwürfe auf Objektbezug, Stil und nächste Schritte abgestimmt werden.",
  },
  {
    title: "Qualität vor Versand prüfen",
    text: "Seriöse Systeme prüfen vor dem Versand Relevanz, fehlende Angaben, Ton, Risiko und Lesbarkeit statt nur Text zu generieren.",
  },
  {
    title: "Follow-ups regelbasiert steuern",
    text: "Nachfassen funktioniert gut, wenn Stop-Regeln, Timing und Eskalationsgrenzen vorab festgelegt sind.",
  },
];

const evaluationChecklist = [
  "Kann das System echte Anfragen, Freigabefälle und Nicht-Anfragen sauber unterscheiden?",
  "Sind blockierende Gründe pro Nachricht sichtbar und operativ prüfbar?",
  "Lässt sich der Start mit hoher Freigabequote und konservativen Regeln fahren?",
  "Bleiben Stil, Qualitätschecks und Verlauf auch bei mehreren Teammitgliedern konsistent?",
];

const manualBoundary = [
  "Beschwerden, Eskalationen und konfliktnahe Gespräche",
  "Preis-, Verhandlungs- und Ausnahmesituationen",
  "Nachrichten mit fehlenden Angaben, die sonst spekulative Antworten erzwingen würden",
  "Rechtlich sensible Aussagen oder Vorgänge mit besonderer Dokumentationspflicht",
];

const commonMistakes = [
  "Zu früh zu viel automatisieren, bevor Freigabegrenzen und Qualitätschecks stehen",
  "Nur auf Formulierungsqualität schauen statt auf den gesamten Interessenten-Prozess",
  "Keine KPI vor dem Rollout definieren, etwa Antwortzeit, Freigabequote und Korrekturaufwand",
  "KI als Ersatz für Teamentscheidung verkaufen, statt als operatives Assistenzsystem einzusetzen",
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

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wofür KI im Makleralltag wirklich sinnvoll ist",
  ogTitle: "KI für Immobilienmakler | Advaic",
  description:
    "Leitfaden für Makler: Wo KI echten Nutzen stiftet, welche Aufgaben besser manuell bleiben und woran Sie seriöse KI-Lösungen erkennen.",
  path: "/ki-fuer-immobilienmakler",
  template: "guide",
  eyebrow: "Leitfaden KI",
  proof: "Nutzen bei Anfrageeingang, Antwortentwürfen, Qualitätsprüfung und Follow-up statt KI als Allzweckversprechen.",
});

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
              text: "Nein. Ein sicherer Start erfolgt konservativ: sauber prüfbare Interessenten-Anfragen automatisieren, Beschwerden, fehlende Angaben und Ausnahmen manuell prüfen.",
            },
          },
          {
            "@type": "Question",
            name: "Woran erkennt man gute KI-Lösungen für Makler?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "An klarer Entscheidungslogik, Qualitätschecks vor Versand, sichtbaren blockierenden Gründen pro Nachricht und einem konservativen Rollout statt reiner Textgenerierung.",
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
      kicker="Leitfaden KI"
      title="Wofür KI im Makleralltag wirklich sinnvoll ist"
      description="Der größte Nutzen entsteht bei Anfrageeingang, Entwurfsunterstützung, Qualitätsprüfung und Follow-up-Steuerung. Schwach wird KI dort, wo Beratung, Ausnahmen oder Haftungsfragen den Ton angeben."
      actions={
        <>
          <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
            Vergleich ansehen
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
      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <article className="card-base p-6">
            <h2 className="h3">Kurzantwort in 60 Sekunden</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {quickTake.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#einsatzfelder" className="btn-secondary">
                Einsatzfelder ansehen
              </a>
              <a href="#tool-check" className="btn-secondary">
                Tool-Check öffnen
              </a>
            </div>
          </article>
        </Container>
      </section>

      <section id="einsatzfelder" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[74ch]">
            <h2 className="h2">Vier Einsatzfelder mit echtem Nutzen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute KI-Lösungen beschleunigen Arbeit, die sich wiederholt und sauber prüfen lässt. Sie ersetzen keine
              Beratung, sondern entlasten bei Routinen im Interessenten-Prozess.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {useCases.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="tool-check" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Woran Sie seriöse KI-Angebote erkennen</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {evaluationChecklist.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Diese Aufgaben sollten Makler bewusst manuell halten</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {manualBoundary.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
          <article className="card-base mt-4 p-6 md:p-8">
            <h2 className="h3">Häufige Fehlentscheidungen beim KI-Einsatz</h2>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {commonMistakes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

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
