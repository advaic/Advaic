import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const profiles = [
  {
    title: "Vermietung in Ballungsräumen",
    shortTitle: "Ballungsraum",
    text: "Für Märkte mit hohem täglichen Anfrageaufkommen, kurzer Erwartung an die erste Rückmeldung und vielen ähnlichen Erstfragen.",
    href: "/branchen/vermietung-ballungsraum",
    fit: "Besonders stark bei hoher Taktung, engem Zeitfenster und wiederkehrenden Fragen zu Verfügbarkeit, Unterlagen und Besichtigung.",
    caution: "Weniger passend, wenn fast jede Anfrage individuell verhandelt oder manuell vorqualifiziert werden muss.",
    starter: "Erstantworten eng freigeben, Besichtigungs- und Unterlagenpfad zuerst öffnen.",
    signals: ["hoher Eingangsdruck", "kurze Reaktionsfenster", "wiederkehrende Erstfragen"],
  },
  {
    title: "Kleine Maklerbüros",
    shortTitle: "Kleines Team",
    text: "Für Solo-Makler und kleine Teams, bei denen Postfacharbeit regelmäßig Beratungs- und Vertriebszeit verdrängt.",
    href: "/branchen/kleine-maklerbueros",
    fit: "Besonders stark, wenn ein kleines Team zwischen Besichtigungen, Telefon und E-Mail ständig umschalten muss.",
    caution: "Weniger passend, wenn das Anfragevolumen insgesamt zu gering ist oder fast alles telefonisch geklärt wird.",
    starter: "Nur die häufigsten Erstkontakte starten, damit Beratung und Besichtigung wieder Vorrang bekommen.",
    signals: ["wenige Schultern", "viele Unterbrechungen", "Zeitverlust im Postfach"],
  },
  {
    title: "Neubau-Vertrieb",
    shortTitle: "Neubau",
    text: "Für strukturierte Projektmärkte mit vielen Anfragen zu Einheiten, Bauabschnitten, Unterlagen und Verfügbarkeiten.",
    href: "/branchen/neubau-vertrieb",
    fit: "Besonders stark bei wiederkehrenden Projektfragen mit klaren Vorlagen, Freigabepfaden und sauberem Einheitenbezug.",
    caution: "Weniger passend, wenn fast jede Anfrage einen individuellen Projektabgleich in Echtzeit verlangt.",
    starter: "Projektbezogene Erstantworten mit sauberem Einheitenbezug und enger Freigabe starten.",
    signals: ["projektförmige Nachfrage", "klare Vorlagen", "sauberer Einheitenbezug"],
  },
];

const marketChecks = [
  {
    title: "Anfragedruck",
    text: "Wie schnell muss im Markt realistisch geantwortet werden und wie viel Eingang entsteht parallel?",
  },
  {
    title: "Teamrealität",
    text: "Wer bearbeitet das Postfach heute und an welcher Stelle verdrängt E-Mail-Arbeit Umsatz- oder Beratungszeit?",
  },
  {
    title: "Objektstruktur",
    text: "Sind Objekte, Einheiten oder Angebotsarten sauber genug strukturiert, damit Antworten zuverlässig zugeordnet werden können?",
  },
  {
    title: "Rollout-Grenze",
    text: "Welcher Startkorridor ist sinnvoll: enge Freigabe, nur Erstantworten oder nur bestimmte Objektsegmente?",
  },
];

const teamSignals = [
  "Diese Seite beantwortet zuerst Markt- und Teamfit, nicht einzelne Nachrichtenmuster.",
  "Wenn Sie eher wissen wollen, welche Anfragearten sich automatisieren lassen, ist `/use-cases` die bessere nächste Seite.",
  "Ein Branchenprofil ist passend, wenn Marktlogik, Teamgröße und Objektsystematik zusammenpassen.",
];

const marketMatrix = [
  {
    label: "Anfragedruck",
    values: [
      "Sehr hoch, Antwortfenster oft in Stunden statt Tagen.",
      "Mittel, aber jeder Kontextwechsel ist teuer.",
      "Wellenförmig, stark abhängig von Projektlaunches und Vermarktungsphasen.",
    ],
  },
  {
    label: "Teamrealität",
    values: [
      "Mehrere parallele Interessentenströme und viel Triage im Eingang.",
      "Wenige Personen, Postfacharbeit verdrängt Telefon, Besichtigung und Vertrieb.",
      "Projektvertrieb, häufig mit engem Abstimmungsbedarf zwischen Einheiten und Status.",
    ],
  },
  {
    label: "Objektstruktur",
    values: [
      "Meist saubere Objekt- und Angebotszuordnung, aber viel Wiederholung.",
      "Häufig gemischter Bestand, deshalb Start nur mit den klarsten Objektpfaden.",
      "Sauber, wenn Einheiten, Unterlagen und Verfügbarkeiten gepflegt vorliegen.",
    ],
  },
  {
    label: "Sicherer Start",
    values: [
      "Erstantworten und Unterlagenpfad zuerst, danach Besichtigungslogik.",
      "Enger Safe-Start nur für häufige Erstfragen und klare Besichtigungsanfragen.",
      "Projektbezogene Erstantworten und Unterlagenpfad zuerst freischalten.",
    ],
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

export const metadata: Metadata = buildMarketingMetadata({
  title: "Branchenprofile",
  ogTitle: "Branchenprofile | Advaic",
  description:
    "Branchenprofile für Immobilienmakler: Welche Markt- und Teamkonstellationen besonders gut zu Advaic passen und welcher Startkorridor je Markt sinnvoll ist.",
  path: "/branchen",
  template: "usecase",
  eyebrow: "Branchen",
  proof: "Rollout-Logik und Maklerfit für unterschiedliche Anfrageprofile.",
});

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
      title="Welche Markt- und Teamprofile am besten zu Advaic passen"
      description="Sie sehen je Marktumfeld die typischen Engpässe, die Teamrealität und den passenden Startkorridor."
      actions={
        <>
          <Link href="/use-cases" className="btn-secondary">
            Anfrage-Muster ansehen
          </Link>
          <Link href="/signup" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4" data-tour="branchen-mobile-quickbar">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Öffnen Sie direkt die Markt-Matrix oder springen Sie zu den drei Profilen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#branchen-market-matrix" className="btn-secondary w-full justify-center">
              Markt-Matrix
            </MarketingJumpLink>
            <MarketingJumpLink href="#branchen-profile-grid" className="btn-secondary w-full justify-center">
              Profile ansehen
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="branchen-hub"
      primaryHref="/produkt#setup"
      primaryLabel="Safe-Start berechnen"
      secondaryHref="/use-cases"
      secondaryLabel="Operative Muster"
      sources={sources}
      sourcesDescription="Die Quellen sind ein Orientierungsrahmen für Marktumfeld, Prozessdruck und Rolloutlogik. Sie ersetzen keine individuelle Unternehmensanalyse."
    >
      <section className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-start">
            <article className="card-base p-6 md:p-8" data-tour="branchen-fit-canvas">
              <p className="section-kicker">Marktumfeld zuerst</p>
              <h2 className="h2 mt-2">Welche Marktlogik den sicheren Start bestimmt</h2>
              <p className="body mt-4 text-[var(--muted)] max-md:text-[0.98rem]">
                Branchenprofile sind hier bewusst kein SEO-Raster, sondern eine Bewertungsfläche. Sie prüfen erst
                Reaktionsdruck, Teamrealität, Objektstruktur und den passenden Startkorridor pro Markt.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {marketChecks.map((step, index) => (
                  <article
                    key={step.title}
                    className="rounded-2xl bg-white/80 p-4 ring-1 ring-[var(--border)] backdrop-blur"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(218,170,54,0.14)] text-sm font-semibold text-[var(--gold-strong)]">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--text)]">{step.title}</h3>
                        <p className="helper mt-2">{step.text}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <div className="space-y-4">
              <article className="card-base p-6 md:p-7">
                <p className="label">Seitenrolle</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                  {teamSignals.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-[var(--radius)] bg-[var(--text)] p-6 text-white shadow-[var(--shadow-md)]">
                <p className="label text-white/70">Danach sinnvoll weiter</p>
                <h3 className="mt-2 text-xl font-semibold">Wenn der Markt passt, prüfen Sie als Nächstes die Nachrichtentypen.</h3>
                <p className="mt-3 text-sm leading-6 text-white/78">
                  `/use-cases` beantwortet danach die operative Frage: Welche Anfragearten gehören in Auto, Freigabe,
                  Ignore oder Follow-up?
                </p>
                <Link href="/use-cases" className="btn-secondary mt-5 w-full justify-center border-white/20 bg-white/10 text-white hover:bg-white/15">
                  Zu den Anwendungsfällen
                </Link>
              </article>
            </div>
          </div>

          <article
            id="branchen-market-matrix"
            className="mt-8 rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] md:p-7"
            data-tour="branchen-market-matrix"
          >
            <div className="max-w-[72ch]">
              <p className="section-kicker">Markt-Matrix</p>
              <h2 className="h3 mt-2">Dieselbe Software, aber nicht derselbe Startkorridor</h2>
              <p className="helper mt-3 hidden md:block">
                Die Matrix zeigt bewusst Markt- und Teamdynamik. So sehen Sie schneller, welches Branchenprofil Ihrer
                operativen Realität am nächsten kommt.
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-[var(--border)]">
              <div className="hidden bg-[var(--surface-2)] lg:grid lg:grid-cols-[200px_repeat(3,minmax(0,1fr))]">
                <div className="border-r border-[var(--border)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Bewertung</p>
                </div>
                {profiles.map((profile) => (
                  <div key={profile.title} className="border-r border-[var(--border)] px-4 py-4 last:border-r-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--gold-strong)]">
                      {profile.shortTitle}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--text)]">{profile.title}</p>
                  </div>
                ))}
              </div>

              {marketMatrix.map((row) => (
                <div
                  key={row.label}
                  className="grid border-t border-[var(--border)] first:border-t-0 lg:grid-cols-[200px_repeat(3,minmax(0,1fr))]"
                >
                  <div className="bg-[var(--surface-2)] px-4 py-4 lg:border-r lg:border-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{row.label}</p>
                  </div>
                  {row.values.map((value, index) => (
                    <div
                      key={`${row.label}-${profiles[index]?.title ?? index}`}
                      className="px-4 py-4 text-sm leading-6 text-[var(--muted)] lg:border-r lg:border-[var(--border)] lg:last:border-r-0"
                    >
                      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--gold-strong)] lg:hidden">
                        {profiles[index]?.shortTitle}
                      </span>
                      {value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </article>

          <div id="branchen-profile-grid" className="mt-8 grid gap-4 md:grid-cols-3" data-tour="branchen-profile-grid">
            {profiles.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <p className="label text-[var(--gold-strong)]">{item.shortTitle}</p>
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.signals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full bg-[rgba(218,170,54,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--gold-strong)]"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Besonders passend, wenn:</p>
                <p className="helper mt-1">{item.fit}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Weniger passend, wenn:</p>
                <p className="helper mt-1">{item.caution}</p>
                <p className="mt-3 text-sm font-semibold text-[var(--text)]">Sinnvoller Start:</p>
                <p className="helper mt-1">{item.starter}</p>
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
