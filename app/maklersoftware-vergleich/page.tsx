import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "21. März 2026";

const summary = [
  "Wer nach Maklersoftware sucht, meint oft drei Dinge gleichzeitig: CRM, Objektverwaltung und operative Anfragebearbeitung. Genau diese Vermischung macht viele Vergleiche unbrauchbar.",
  "Es gibt keinen seriösen pauschalen Testsieger für jedes Maklerbüro. Gute Entscheidungen hängen vor allem an Bürogröße, Prozessreife und dem größten operativen Engpass.",
  "Wenn Ihr Kernproblem im Anfragepostfach liegt, reicht der reine Blick auf klassische Maklersoftware oft nicht aus. Dann brauchen Sie zusätzlich eine spezialisierte Ausführungsschicht.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#vergleich", label: "Systemvergleich" },
  { href: "#buero-fit", label: "Was zu welchem Bürotyp passt" },
  { href: "#demo-fragen", label: "Demo-Fragen" },
  { href: "#advaic-rolle", label: "Rolle von Advaic" },
];

const methodology = [
  "Die Seite fasst aktuelle Herstellerinformationen, aktuelle Suchsignale aus der Search Console und den typischen Einsatz im deutschsprachigen Makleralltag zusammen.",
  "Bewertet wird nach Bürotyp, Prozessfokus, Einführungsaufwand, Steuerbarkeit und der Frage, ob ein System eher Datenhaltung oder operative Ausführung löst.",
  "Die Tabelle unten ist bewusst keine Punktewertung mit künstlichem Gesamtsieger, sondern eine Orientierung für die passende Kombination.",
];

const softwareRows = [
  {
    system: "onOffice",
    focus: "Klassische Maklersoftware mit Objekt-, Adress-, E-Mail- und Portalprozessen.",
    fit: "Büros, die ein breites System für Immobilienverwaltung, CRM und Vermarktungsabläufe suchen.",
    watch: "Prüfen, wie gut Ihr Team mit Konfiguration, Datenpflege und täglichem Mail-Handling im echten Betrieb arbeitet.",
  },
  {
    system: "FLOWFACT",
    focus: "CRM-/Immobiliensoftware mit Kontaktverwaltung, E-Mail-Funktionen, API und Zusatzmodulen.",
    fit: "Maklerbüros, die einen breiten digitalen Arbeitsalltag in einem etablierten Immobilien-Ökosystem abbilden wollen.",
    watch: "Achten Sie auf Einrichtungsaufwand, Tiefe der Einführung und darauf, ob der operative Anfrageprozess wirklich sauber genug abgedeckt ist.",
  },
  {
    system: "Propstack",
    focus: "Modernes Immobilien-CRM mit mobiler Nutzung, E-Mail-Bearbeitung und digitalen Standardprozessen.",
    fit: "Teams, die stark auf browserbasiertes Arbeiten, Geschwindigkeit und ein zeitgemäßes CRM setzen.",
    watch: "Wichtig ist die Frage, ob Standardprozesse und die E-Mail-Bearbeitung im System für Ihren Anfragebetrieb ausreichen oder ergänzt werden müssen.",
  },
  {
    system: "HubSpot",
    focus: "Allgemeines CRM mit starkem Marketing-, Vertriebs- und Service-Ökosystem.",
    fit: "Maklerteams mit starkem Inbound-, Marketing- oder Multichannel-Fokus und der Bereitschaft, Immobilienlogik selbst zu modellieren.",
    watch: "Nicht immobilien-spezifisch. Der Fit hängt stark daran, wie viel Struktur Sie selbst aufbauen wollen.",
  },
  {
    system: "Advaic",
    focus: "Spezialisierte Anfrageausführung mit Eingang, Entscheidungslogik, Qualitätschecks, Freigabe und Nachfassen.",
    fit: "Teams, die bereits Systeme für Daten und Vermarktung haben, aber die Antwortlogik im Postfach sauberer lösen müssen.",
    watch: "Kein Ersatz für ein vollständiges Makler-CRM oder für umfassende Objekt- und Dealverwaltung.",
  },
];

const officeFits = [
  {
    title: "Einzelmakler oder Neugründung",
    text: "Priorisieren Sie Übersicht, schnelle Einführung und saubere Grundprozesse. Oft ist eine schlanke Maklersoftware oder ein CRM zuerst sinnvoll, bevor weitere Ebenen dazukommen.",
  },
  {
    title: "Kleines Team mit viel Portalanfrage-Aufkommen",
    text: "Hier lohnt sich der Blick auf zwei Ebenen: Maklersoftware für Daten und Vermarktung plus eine spezialisierte Schicht für Anfrageeingang, Freigabe und Antwortqualität.",
  },
  {
    title: "Etabliertes Büro mit bestehendem CRM",
    text: "Vor einer Migration sollten Sie prüfen, ob wirklich das CRM das Problem ist oder ob eher Reaktionszeit, Nachfassen und operative Kontrolllogik fehlen.",
  },
];

const demoQuestions = [
  "Wie wird eine neue Portalanfrage vom Eingang bis zur Antwort dokumentiert?",
  "Wo sehen Sie pro Nachricht, warum automatisch gesendet oder gestoppt wurde?",
  "Wie aufwändig ist der Systemstart für ein kleines Team ohne Vollzeit-Admin?",
  "Welche Rolle spielen Objektbezug, Pflichtangaben und Freigabe im operativen Standardfall?",
  "Welche Daten müssen Sie vor der Einführung sauber gepflegt haben, damit das System im Alltag trägt?",
];

const advaicFit = [
  "Wenn Ihr Büro bereits CRM- oder Maklersoftware nutzt, aber im Anfragepostfach Zeit, Konsistenz oder Kontrolle verliert.",
  "Wenn Sie Auto-Senden nur für klar prüfbare Fälle freigeben wollen und alles andere sicher in einer Freigabe landen soll.",
  "Wenn Sie eine zusätzliche operative Ebene suchen, statt das gesamte CRM zu ersetzen.",
];

const advaicNotFit = [
  "Wenn Sie zuerst ein zentrales System für Kontakte, Objekte und Deals benötigen.",
  "Wenn Ihr Büro praktisch keine wiederkehrenden Anfrage-Muster hat.",
  "Wenn Sie einen einzigen Anbieter für wirklich alle Maklerprozesse suchen und keine modulare Kombination wollen.",
];

const sources = [
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://onoffice.com/immobiliensoftware/",
    note: "Offizielle Herstellerseite mit Fokus auf Maklersoftware, CRM und Portalprozesse.",
  },
  {
    label: "FLOWFACT: Produkt",
    href: "https://flowfact.de/produkt/",
    note: "Offizielle Herstellerseite für CRM-/Immobiliensoftware, API und Zusatzleistungen.",
  },
  {
    label: "Propstack: Immobilien-CRM",
    href: "https://www.propstack.de/",
    note: "Offizielle Herstellerseite für modernes Immobilien-CRM und mobile Arbeitsweise.",
  },
  {
    label: "HubSpot: CRM-Software für Immobilienmakler",
    href: "https://www.hubspot.de/products/crm/real-estate",
    note: "Offizielle Herstellerseite für ein allgemeineres CRM mit Immobilien-Use-Case.",
  },
  {
    label: "Google: How to write reviews",
    href: "https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews",
    note: "Leitlinie für hilfreiche Vergleichsinhalte mit Methodik, Differenzierung und Originalnutzen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Maklersoftware Vergleich 2026",
  ogTitle: "Maklersoftware Vergleich 2026 | Advaic",
  description:
    "Maklersoftware im Vergleich: onOffice, FLOWFACT, Propstack, HubSpot und die Rolle spezialisierter Anfrage-Logik wie Advaic. Für wen welches System passt.",
  path: "/maklersoftware-vergleich",
  template: "compare",
  eyebrow: "Maklersoftware",
  proof: "Nicht jeder Makler braucht denselben Stack. Entscheidend sind Bürotyp, Prozessreife und Anfrage-Engpass.",
});

export default function MaklersoftwareVergleichPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Maklersoftware Vergleich 2026",
        inLanguage: "de-DE",
        dateModified: "2026-03-21",
        mainEntityOfPage: `${siteUrl}/maklersoftware-vergleich`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Maklersoftware", "CRM für Immobilienmakler", "Immobiliensoftware", "Anfrageautomation"],
      },
      {
        "@type": "ItemList",
        name: "Maklersoftware im Vergleich",
        itemListElement: softwareRows.map((row, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: row.system,
        })),
      },
    ],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Maklersoftware Vergleich", path: "/maklersoftware-vergleich" },
      ]}
      schema={schema}
      kicker="Maklersoftware"
      title="Maklersoftware Vergleich 2026: Welches System für welchen Makleralltag passt"
      description="Diese Seite sucht keinen künstlichen Testsieger. Sie trennt sauber zwischen Maklersoftware, CRM und spezialisierter Anfrageausführung und zeigt, welche Kombination typischerweise wann passt."
      actions={
        <>
          <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
            CRM-Leitfaden öffnen
          </Link>
          <Link href="/signup?entry=maklersoftware-vergleich" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zur Vergleichstabelle oder zur Rolle von Advaic springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#vergleich" className="btn-secondary w-full justify-center">
              Vergleich öffnen
            </MarketingJumpLink>
            <MarketingJumpLink href="#advaic-rolle" className="btn-secondary w-full justify-center">
              Advaic-Rolle
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="maklersoftware-vergleich"
      primaryHref="/signup?entry=maklersoftware-vergleich-stage"
      primaryLabel="Mit echten Fällen prüfen"
      secondaryHref="/best-ai-tools-immobilienmakler"
      secondaryLabel="KI-Tools Vergleich"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten zeigen aktuelle Herstellerpositionierungen und die Google-Leitlinie für hilfreiche Vergleichsseiten. Für die Beschaffung sollten Sie immer zusätzlich Live-Demos und reale Anfragefälle prüfen."
    >
      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kurzfassung in 90 Sekunden</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {summary.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base hidden p-6 lg:block">
              <p className="label">Inhaltsverzeichnis</p>
              <div className="mt-4 grid gap-2">
                {contents.map((item) => (
                  <MarketingJumpLink
                    key={item.href}
                    href={item.href}
                    className="rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text)] ring-1 ring-[var(--border)] transition hover:-translate-y-[1px]"
                  >
                    {item.label}
                  </MarketingJumpLink>
                ))}
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section id="methodik" className="marketing-section-clear py-14 md:py-18">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <p className="label">Autor & Stand</p>
              <h2 className="h3 mt-3">Advaic Redaktion</h2>
              <p className="helper mt-3">
                Produkt- und Prozessteam mit Fokus auf Anfrageprozesse, Freigabelogik und Auswahlkriterien für
                Systemlandschaften für Makler.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Was hier verglichen wird und was nicht</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {methodology.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </Container>
      </section>

      <section id="vergleich" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Systemvergleich: Wer welchen Job im Makleralltag gut abdeckt</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Kaufentscheidungen entstehen nicht durch die Frage „welches System ist objektiv das beste“, sondern
              durch die Frage „welches System löst unseren Engpass mit vertretbarem Einführungsaufwand“.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-[var(--radius)] bg-white ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">System</th>
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Fokus</th>
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Typischer Fit</th>
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Worauf Sie achten sollten</th>
                </tr>
              </thead>
              <tbody>
                {softwareRows.map((row) => (
                  <tr key={row.system} className="border-b border-[var(--border)] align-top">
                    <td className="px-4 py-4 font-medium text-[var(--text)]">{row.system}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{row.focus}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{row.fit}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{row.watch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section id="buero-fit" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Welche Lösung zu welchem Bürotyp passt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {officeFits.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="demo-fragen" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Fünf Fragen, die Sie in jeder Demo stellen sollten</h2>
            <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
              {demoQuestions.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <section id="advaic-rolle" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann Advaic zusätzlich Sinn ergibt</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann Advaic nicht die erste Baustelle ist</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {advaicNotFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Nächste sinnvolle Seiten</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
                CRM für Immobilienmakler
              </Link>
              <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
                KI-Tools Vergleich
              </Link>
              <Link href="/advaic-vs-crm-tools" className="btn-secondary">
                Advaic vs. CRM
              </Link>
              <Link href="/produkt" className="btn-secondary">
                Produkt ansehen
              </Link>
            </div>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
