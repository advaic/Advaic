import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const selectionCriteria = [
  {
    title: "1) Prozess-Fit vor Funktionsliste",
    text: "Prüfen Sie zuerst den Ablauf: Eingang, Entscheidung, Versand, Verlauf, Follow-up. Ein Tool ist nur dann sinnvoll, wenn es genau die Engpässe in diesem Fluss reduziert.",
  },
  {
    title: "2) Sicherheitslogik im Live-Betrieb",
    text: "Für Makler entscheidend: klare Guardrails, Freigabe bei fehlenden Angaben oder Risiko, nachvollziehbare Gründe pro Entscheidung und Qualitätskontrollen vor Versand.",
  },
  {
    title: "3) Nachvollziehbarkeit pro Nachricht",
    text: "Jede Entscheidung muss prüfbar sein: Was kam rein, warum wurde gesendet oder gestoppt und welche Qualitätssignale lagen vor.",
  },
  {
    title: "4) Einführbarkeit für kleine Teams",
    text: "Die beste Lösung startet konservativ und lässt sich schrittweise erweitern. Ohne kontrollierten Einstieg sinkt die Akzeptanz im Team.",
  },
];

const toolLandscape = [
  {
    type: "CRM-Systeme",
    strength: "Kontakt- und Pipelineverwaltung, Reporting, Aufgabensteuerung.",
    gap: "Antwortentscheidungen auf Nachrichtenebene sind häufig nicht der Kernfokus.",
    fit: "Gut als System of Record, oft mit zusätzlicher Antwortlogik kombinieren.",
  },
  {
    type: "Geteilte Inbox-Tools",
    strength: "Teamkoordination und Zuständigkeiten im Postfach.",
    gap: "Meist wenig guardrail-basierte Entscheidung zwischen Auto/Freigabe/Ignorieren.",
    fit: "Gut für Kollaboration, begrenzter Nutzen bei tiefer Entscheidungsautomation.",
  },
  {
    type: "Allgemeine KI-Schreibtools",
    strength: "Schnelles Formulieren von Texten.",
    gap: "Keine verlässliche Prozesslogik für Eingangsklassifikation, Risiko-Fail-Safe und Verlauf.",
    fit: "Nützlich als Schreibhilfe, aber selten als vollständiger Anfrage-Workflow.",
  },
  {
    type: "Advaic (spezialisiert)",
    strength: "Maklerfokus auf Eingang → Entscheidung → Qualitätschecks → Versand/Freigabe.",
    gap: "Kein Ersatz für ein vollwertiges CRM-System; gezielter Fokus auf Nachrichtenausführung.",
    fit: "Stark, wenn Ihr Engpass in Antwortgeschwindigkeit, Qualität und Kontrolllogik liegt.",
  },
];

const bestFit = [
  "Sie bearbeiten regelmäßig ähnliche Interessenten-Anfragen per E-Mail.",
  "Sie möchten Anfragen mit sauberem Objektbezug und vollständigen Angaben automatisch senden, ohne Kontrolle aufzugeben.",
  "Ihr Team braucht nachvollziehbare Gründe, warum etwas automatisch gesendet oder gestoppt wurde.",
  "Sie wollen Follow-ups regelbasiert steuern und nicht einzeln manuell verwalten.",
];

const notFit = [
  "Sie haben nur sehr wenige Anfragen pro Monat und keinen wiederkehrenden Prozess.",
  "Jede Antwort muss immer vollständig individuell ohne jede Regelstruktur erstellt werden.",
  "Sie erwarten ein Komplett-CRM mit Objekt-, Finanz- und Transaktionsverwaltung in einem Tool.",
];

const sources = [
  {
    label: "Google Search Essentials",
    href: "https://developers.google.com/search/docs/essentials",
    note: "Grundlagen, wie Inhalte crawlbar und indexierbar bleiben.",
  },
  {
    label: "Google: Sitemaps overview",
    href: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview",
    note: "Technische Grundlage für saubere URL-Entdeckung.",
  },
  {
    label: "Google: Software App structured data",
    href: "https://developers.google.com/search/docs/appearance/structured-data/software-app",
    note: "Schema-Hinweise, damit Softwareseiten maschinenlesbar verstanden werden.",
  },
  {
    label: "OpenAI: Build with the Apps SDK",
    href: "https://help.openai.com/en/articles/12515353-build-with-the-apps-sdk",
    note: "Einordnung, wie App-/Tool-Integrationen aufgebaut werden können.",
  },
  {
    label: "Anthropic: Model Context Protocol (MCP)",
    href: "https://docs.anthropic.com/en/docs/mcp",
    note: "Einordnung zum Tool-Zugriff von KI-Systemen über MCP.",
  },
  {
    label: "G2: Real Estate CRM",
    href: "https://www.g2.com/categories/real-estate-crm",
    note: "Externe Kategorieansicht für Markt- und Toolvergleich.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Best AI Tools für Immobilienmakler (Deutschland)",
  ogTitle: "Best AI Tools für Immobilienmakler | Advaic",
  description:
    "Vergleich für Makler: Wann CRM, Inbox-Tools, Schreibtools oder spezialisierte Antwortautomatisierung sinnvoll sind und welcher Engpass damit jeweils gelöst wird.",
  path: "/best-ai-tools-immobilienmakler",
  template: "compare",
  eyebrow: "Vergleich",
  proof: "Die stärkste Lösung verbindet Prozess-Fit, Sicherheitslogik und saubere Einführung.",
});

export default function BestAiToolsImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Best AI Tools für Immobilienmakler (Deutschland)",
        inLanguage: "de-DE",
        about: ["Immobilienmakler", "E-Mail-Automatisierung", "Antwortgeschwindigkeit", "Guardrails"],
        mainEntityOfPage: `${siteUrl}/best-ai-tools-immobilienmakler`,
      },
      {
        "@type": "ItemList",
        name: "Tool-Typen für Makleranfragen",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "CRM-Systeme", url: `${siteUrl}/advaic-vs-crm-tools` },
          { "@type": "ListItem", position: 2, name: "Geteilte Inbox-Tools", url: `${siteUrl}/manuell-vs-advaic` },
          {
            "@type": "ListItem",
            position: 3,
            name: "Allgemeine KI-Schreibtools",
            url: `${siteUrl}/best-software-immobilienanfragen`,
          },
          { "@type": "ListItem", position: 4, name: "Advaic", url: `${siteUrl}/produkt` },
        ],
      },
    ],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Best AI Tools Immobilienmakler", path: "/best-ai-tools-immobilienmakler" },
      ]}
      schema={schema}
      kicker="Vergleich"
      title="Best AI Tools für Immobilienmakler: Welche Tools welche Aufgabe lösen"
      description="Vergleichen Sie CRM, Inbox-Tools, Schreibtools und spezialisierte Antwortautomatisierung nach Prozess-Fit, Sicherheitslogik und Einführbarkeit."
      actions={
        <>
          <Link href="/produkt" className="btn-secondary">
            Produkt prüfen
          </Link>
          <Link href="/signup?entry=best-ai-tools" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="best-ai-tools-immobilienmakler"
      primaryHref="/signup?entry=best-ai-tools-stage"
      primaryLabel="Mit echten Anfragen testen"
      secondaryHref="/advaic-vs-crm-tools"
      secondaryLabel="CRM-Vergleich öffnen"
      sources={sources}
      sourcesDescription="Diese Quellen dienen zur Orientierung bei Auffindbarkeit, Strukturierung und Tool-Integration. Keine einzelne Quelle ersetzt eine eigene Produkt- und Marktprüfung."
    >
      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[74ch]">
            <h2 className="h2">Vier Kriterien, mit denen Sie Tools für Makleranfragen sauber vergleichen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele Vergleiche bleiben zu allgemein. Für Maklerteams zählt, ob wiederkehrende Anfragen schneller
              bearbeitet werden, ohne dass Nachrichten mit Lücken oder Risiko automatisch rausgehen.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {selectionCriteria.map((item) => (
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
          <h2 className="h2">Welche Tool-Kategorie welchen Engpass löst</h2>
          <p className="body mt-4 max-w-[74ch] text-[var(--muted)]">
            Die bessere Frage lautet nicht „welches Tool ist generell das beste“, sondern „welches Tool löst den
            Engpass im Anfragefluss am zuverlässigsten“.
          </p>
          <div className="mt-8 space-y-4">
            {toolLandscape.map((item) => (
              <article key={item.type} className="card-base p-6">
                <h3 className="h3">{item.type}</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">Stärke</p>
                    <p className="helper mt-2">{item.strength}</p>
                  </div>
                  <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">Grenze</p>
                    <p className="helper mt-2">{item.gap}</p>
                  </div>
                  <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">Typischer Fit</p>
                    <p className="helper mt-2">{item.fit}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann spezialisierte Antwortautomatisierung stark ist</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {bestFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann Sie zuerst etwas anderes lösen sollten</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {notFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article className="card-base mt-4 p-6 md:p-8">
            <h2 className="h3">Diese Vergleiche vertiefen die Entscheidung</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/best-software-immobilienanfragen" className="btn-secondary">
                Best Software Immobilienanfragen
              </Link>
              <Link href="/advaic-vs-crm-tools" className="btn-secondary">
                Advaic vs CRM-Tools
              </Link>
              <Link href="/manuell-vs-advaic" className="btn-secondary">
                Manuell vs. Advaic
              </Link>
              <Link href="/email-automatisierung-immobilienmakler" className="btn-secondary">
                E-Mail-Automatisierung
              </Link>
            </div>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
