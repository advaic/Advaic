import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";

const profiles = [
  {
    title: "Vermietung in Ballungsräumen",
    text: "Für Teams mit hohem täglichen Anfrageaufkommen, schneller Erstreaktions-Erwartung und klar wiederkehrenden Standardfragen.",
    href: "/branchen/vermietung-ballungsraum",
    fit: "Besonders stark bei hoher Taktung und standardisierbaren Erstanfragen.",
    caution: "Weniger passend, wenn nahezu jede Anfrage hochindividuell verhandelt werden muss.",
  },
  {
    title: "Kleine Maklerbüros",
    text: "Für Solo-Makler und kleine Teams, die knappe Zeit ohne Kontrollverlust skalieren möchten.",
    href: "/branchen/kleine-maklerbueros",
    fit: "Besonders stark, wenn Postfacharbeit regelmäßig Beratungszeit verdrängt.",
    caution: "Weniger passend, wenn kaum Anfragevolumen vorhanden ist.",
  },
  {
    title: "Neubau-Vertrieb",
    text: "Für strukturierte Erstantworten bei vielen Projektanfragen über mehrere Objekte und Bauabschnitte.",
    href: "/branchen/neubau-vertrieb",
    fit: "Besonders stark bei wiederkehrenden Projektfragen mit klaren Vorlagen.",
    caution: "Weniger passend, wenn jeder Fall individuellen Projektabgleich in Echtzeit erfordert.",
  },
];

const funnelSteps = [
  {
    title: "1) Segment präzise wählen",
    text: "Wählen Sie das Profil nach Anfrage-Mix und Teamrealität, nicht nur nach Branchenetikett.",
  },
  {
    title: "2) Engpass offenlegen",
    text: "Prüfen Sie die größten Verlustquellen: Reaktionsverzug, Freigabe-Überlast, unklare Priorisierung.",
  },
  {
    title: "3) Safe-Start definieren",
    text: "Legen Sie fest, welche Standardfälle zuerst auf Auto laufen und welche Fälle Pflicht-Freigabe bleiben.",
  },
  {
    title: "4) KPI-gesteuert ausbauen",
    text: "Erhöhen Sie Automatisierung nur bei stabiler Qualität, sauberer Nachvollziehbarkeit und klarer Entlastung.",
  },
];

const sources = [
  {
    label: "Destatis – Wohnen in Deutschland",
    href: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Wohnen/_inhalt.html",
    note: "Öffentliche Markteinordnung für Wohn- und Vermietungsumfelder in Deutschland.",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    note: "Kontext zum Produktivitätshebel in Kommunikations- und Wissensarbeit.",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum schnelle Reaktionszeiten im Interessenten-Prozess kritisch sind.",
  },
  {
    label: "Google Search Essentials",
    href: "https://developers.google.com/search/docs/essentials",
    note: "Leitlinien für saubere Informationsarchitektur und Auffindbarkeit.",
  },
];

export const metadata: Metadata = {
  title: "Branchenprofile",
  description:
    "Detaillierte Branchen-Landingpages für Immobilienmakler: Vermietung in Ballungsräumen, kleine Maklerbüros und Neubau-Vertrieb.",
  alternates: {
    canonical: "/branchen",
  },
  openGraph: {
    title: "Branchenprofile | Advaic",
    description:
      "Detaillierte Branchen-Landingpages für Immobilienmakler: Vermietung in Ballungsräumen, kleine Maklerbüros und Neubau-Vertrieb.",
    url: "/branchen",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Branchenprofile | Advaic",
    description:
      "Detaillierte Branchen-Landingpages für Immobilienmakler: Vermietung in Ballungsräumen, kleine Maklerbüros und Neubau-Vertrieb.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function BranchenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Branchenprofile für Maklerteams",
        inLanguage: "de-DE",
        about: ["Vermietung", "Neubau", "kleine Maklerbüros", "Safe-Start"],
        mainEntityOfPage: `${siteUrl}/branchen`,
      },
      {
        "@type": "ItemList",
        name: "Branchenprofile",
        itemListElement: profiles.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          url: `${siteUrl}${item.href}`,
        })),
      },
    ],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Branchen", path: "/branchen" },
      ]}
      schema={schema}
      kicker="Branchenprofile"
      title="Welche Konfiguration passt zu Ihrem Markt?"
      description="Diese Seite ist als Branchen-Entscheidungsmatrix aufgebaut: typische Engpässe, passende Guardrails und ein sicherer Startpfad je Marktumfeld."
      actions={
        <>
          <Link href="/manuell-vs-advaic" className="btn-secondary">
            Vergleich ansehen
          </Link>
          <Link href="/signup" className="btn-primary">
            14 Tage testen
          </Link>
        </>
      }
      stage="bewertung"
      stageContext="branchen-hub"
      primaryHref="/produkt#safe-start-konfiguration"
      primaryLabel="Safe-Start berechnen"
      secondaryHref="/manuell-vs-advaic"
      secondaryLabel="Prozessvergleich"
      sources={sources}
      sourcesDescription="Die Quellen sind ein Orientierungsrahmen für Marktumfeld, Prozessdruck und Rolloutlogik. Sie ersetzen keine individuelle Unternehmensanalyse."
    >
      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[76ch]">
            <h2 className="h2">So lesen Sie die Branchenprofile als Entscheidungsfunnel</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Jedes Profil beantwortet drei kaufentscheidende Fragen: Wo entsteht aktuell der größte operative Verlust,
              welche Guardrails sind zwingend und welche Startkonfiguration minimiert Risiko bei maximalem Lerngewinn.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {funnelSteps.map((step) => (
              <article key={step.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{step.title}</h3>
                <p className="helper mt-3">{step.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {profiles.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Ideal, wenn:</p>
                <p className="helper mt-1">{item.fit}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Weniger passend, wenn:</p>
                <p className="helper mt-1">{item.caution}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Profil öffnen
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
