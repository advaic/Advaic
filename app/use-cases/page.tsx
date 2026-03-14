import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import ProductStillFrame from "@/components/marketing/produkt/ProductStillFrame";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const cases = [
  {
    title: "Vermietung mit hohem Anfragevolumen",
    lane: "Auto zuerst",
    text: "Viele ähnliche Erstfragen in kurzer Zeit. Fokus auf schnelle Erstantwort bei engem Auto-Korridor.",
    href: "/use-cases/vermietung",
    fit: "Wenn täglich viele Erstkontakte mit ähnlichen Kernfragen eingehen.",
    caution: "Wenn nahezu jede Antwort individuell verhandelt werden muss.",
    starter: "Erstantwort + Unterlagen + Besichtigungspfad als erster Auto-Korridor.",
  },
  {
    title: "Kleine Teams mit knapper Zeit",
    lane: "Freigabe entlasten",
    text: "Wenige Personen, viele parallele Aufgaben. Fokus auf Entlastung im Tagesgeschäft ohne Kontrollverlust.",
    href: "/use-cases/kleines-team",
    fit: "Wenn Postfacharbeit regelmäßig operative Kernaufgaben verdrängt.",
    caution: "Wenn kaum Anfragevolumen vorhanden ist.",
    starter: "Nur die häufigsten Nachrichtentypen freigeben und manuelle Sonderfälle sichtbar sammeln.",
  },
  {
    title: "Mittelpreisige Objekte",
    lane: "Routing klären",
    text: "Wiederkehrende Fragen zu Verfügbarkeit, Unterlagen, Besichtigung und nächsten Schritten.",
    href: "/use-cases/mittelpreisige-objekte",
    fit: "Wenn wiederkehrende Erstfragen einen hohen Anteil der Eingangsmails ausmachen.",
    caution: "Wenn der Objektbezug in Eingängen häufig unklar bleibt.",
    starter: "Objektbezug zuerst absichern, dann wiederkehrende Erstfragen automatisieren.",
  },
];

const chooser = [
  "Welche Fragearten tauchen in Ihrem Eingang jeden Tag wieder auf?",
  "Welche Antworten folgen einem ähnlichen Muster und welche brauchen fast immer individuelles Urteil?",
  "An welcher Stelle entstehen fehlende Angaben, Beschwerden oder Freigabebedarf?",
  "Welche Eingangsmails sollten grundsätzlich ignoriert werden und welche gehören in einen klaren Arbeitsprozess?",
  "An welchen Stellen verlieren Sie heute Zeit: Erstantwort, Priorisierung, Nachfassen oder manuelle Freigabe?",
  "Welche Nachrichtengruppe wäre der sicherste erste Auto-Korridor für einen Test?",
];

const operatingSignals = [
  "Diese Seite beantwortet operative Muster und Anfragearten, nicht Markt- oder Teamfit.",
  "Wenn Sie zuerst prüfen wollen, ob Ihr Marktumfeld oder Ihre Teamgröße grundsätzlich passt, ist `/branchen` die bessere Seite.",
  "Ein Use Case ist passend, wenn Frageart, Datenlage und Freigabebedarf klar genug für einen konkreten Startkorridor sind.",
];

const patternChecks = [
  {
    title: "Auto",
    eyebrow: "Wiederkehrend und vollständig",
    text: "Wiederkehrende Erstfragen mit klarem Objektbezug, vollständigen Angaben und geringem Konfliktpotenzial.",
    tone: "bg-[rgba(34,197,94,0.10)] text-[#166534] ring-[#bbf7d0]",
  },
  {
    title: "Freigabe",
    eyebrow: "Lücken oder Konfliktpotenzial",
    text: "Anfragen mit fehlenden Kerndaten, Ausnahmefällen, Sonderwünschen oder Beschwerden.",
    tone: "bg-[rgba(245,158,11,0.12)] text-[#9a6700] ring-[rgba(245,158,11,0.22)]",
  },
  {
    title: "Ignore",
    eyebrow: "Kein echter Fall",
    text: "Newsletter, Systemmails, Spam und andere Eingänge ohne echten Interessentenbezug.",
    tone: "bg-[rgba(100,116,139,0.12)] text-[#334155] ring-[rgba(100,116,139,0.18)]",
  },
  {
    title: "Follow-up",
    eyebrow: "Nachfassen mit Stop-Logik",
    text: "Fälle mit klarer Erstreaktion, sauberem Rückkanal und nachvollziehbarer Stop-Logik.",
    tone: "bg-[rgba(59,130,246,0.10)] text-[#1d4ed8] ring-[rgba(59,130,246,0.18)]",
  },
];

const sources = [
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Reaktionszeit als zentraler Hebel in digitalen Anfrageprozessen.",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
    note: "Einordnung zum Potenzial besserer Kommunikations-Workflows.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierten und nachvollziehbaren KI-Betrieb.",
  },
  {
    label: "Google Search Essentials",
    href: "https://developers.google.com/search/docs/essentials",
    note: "Best Practices für klare, indexierbare Informationsseiten.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Anwendungsfälle",
  ogTitle: "Anwendungsfälle | Advaic",
  description:
    "Anwendungsfälle für Makler: Welche Anfrage- und Arbeitsmuster sich für Auto, Freigabe, Ignore und Follow-up besonders eignen.",
  path: "/use-cases",
  template: "usecase",
  eyebrow: "Use Cases",
  proof: "Konkrete Einsatzszenarien mit echter Prozesslogik und klarem Rollout-Pfad.",
});

export default function UseCasesPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Anwendungsfälle für Maklerteams",
        inLanguage: "de-DE",
        about: ["Immobilienmakler", "Anfrageautomatisierung", "Safe-Start", "Freigabe"],
        mainEntityOfPage: `${siteUrl}/use-cases`,
      },
      {
        "@type": "ItemList",
        name: "Use-Case-Profile",
        itemListElement: cases.map((item, index) => ({
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
        { name: "Anwendungsfälle", path: "/use-cases" },
      ]}
      schema={schema}
      kicker="Anwendungsfälle"
      title="Für welche Makler-Setups Advaic besonders sinnvoll ist"
      description="Sie sehen für jedes Szenario den Fit, die Grenzen und welche Anfragearten in Auto, Freigabe oder Follow-up gehören."
      actions={
        <>
          <Link href="/branchen" className="btn-secondary">
            Marktprofile ansehen
          </Link>
          <Link href="/signup" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4" data-tour="use-cases-mobile-quickbar">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Springen Sie direkt in das operative Routing oder zu den drei Kernmustern.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#use-cases-routing" className="btn-secondary w-full justify-center">
              Routing prüfen
            </MarketingJumpLink>
            <MarketingJumpLink href="#use-cases-cases" className="btn-secondary w-full justify-center">
              Kernmuster
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="use-cases"
      primaryHref="/signup"
      primaryLabel="14 Tage testen"
      secondaryHref="/branchen"
      secondaryLabel="Marktfit prüfen"
      sources={sources}
    >
      <section className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-start">
            <article id="use-cases-routing" className="card-base p-6 md:p-8" data-tour="use-cases-routing-board">
              <p className="section-kicker">Operatives Routing</p>
              <h2 className="h2 mt-2">Welche Nachricht wohin gehört</h2>
              <p className="body mt-4 text-[var(--muted)] max-md:text-[0.98rem]">
                Diese Seite beantwortet zuerst die operative Frage. Sie sortiert typische Eingangsmuster in Auto,
                Freigabe, Ignore und Follow-up, bevor Sie den passenden Detail-Use-Case öffnen.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {patternChecks.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl bg-white p-4 ring-1 ring-[var(--border)]"
                    data-tour="use-cases-routing-lane"
                  >
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ring-1 ${item.tone}`}
                    >
                      {item.title}
                    </span>
                    <p className="mt-3 text-sm font-semibold text-[var(--text)]">{item.eyebrow}</p>
                    <p className="helper mt-2">{item.text}</p>
                  </article>
                ))}
              </div>
            </article>

            <div className="space-y-4">
              <ProductStillFrame
                label="Operativer Eingang"
                caption="Im Produkt bleibt sichtbar, welche Nachricht in Auto, Freigabe oder Follow-up landet."
                src="/marketing-screenshots/core/raw/messages-inbox.png"
                alt="Nachrichtenliste mit sichtbaren Status- und Filterinformationen"
                imageClassName="object-cover object-[50%_8%] scale-[1.05]"
                aspectClassName="aspect-[16/11]"
                frameTour="use-cases-routing-visual"
                stageTour="use-cases-routing-shot"
              />

              <article className="card-base p-6 md:p-7">
                <p className="label">Abgrenzung</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                  {operatingSignals.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>

          <div id="use-cases-cases" className="mt-8 grid gap-4 md:grid-cols-2" data-tour="use-cases-case-grid">
            {cases.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <p className="label text-[#1d4ed8]">{item.lane}</p>
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Besonders passend, wenn:</p>
                <p className="helper mt-1">{item.fit}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Weniger passend, wenn:</p>
                <p className="helper mt-1">{item.caution}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Sinnvoller Start:</p>
                <p className="helper mt-1">{item.starter}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Anwendungsfall öffnen
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <article className="card-base p-6 md:p-8" data-tour="use-cases-checklist">
              <h2 className="h3">Diese Fragen klären vor dem ersten Use Case</h2>
              <ul className="mt-4 hidden gap-2 text-sm text-[var(--muted)] md:grid md:grid-cols-2">
                {chooser.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)] md:hidden" data-tour="use-cases-mobile-checklist">
                {chooser.slice(0, 3).map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="helper mt-4 md:hidden">
                Die Detailseiten vertiefen danach nur noch den Fall, der zu Ihrem Startkorridor passt.
              </p>
            </article>

            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Nächster sinnvoller Check</h2>
              <p className="helper mt-3">
                Wenn Sie Marktumfeld und Teamgröße noch nicht sauber eingeordnet haben, prüfen Sie als Nächstes die
                Branchenprofile. Wenn der Marktfit klar ist, führen die Detailseiten hier tiefer in den gewählten
                Anwendungsfall.
              </p>
              <div className="mt-5 grid gap-2">
                <Link href="/branchen" className="btn-secondary w-full justify-center">
                  Branchenprofile prüfen
                </Link>
                <Link href="/produkt#setup" className="btn-secondary w-full justify-center">
                  Safe-Start ansehen
                </Link>
              </div>
            </article>
          </div>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
