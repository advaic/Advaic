import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import ResponsiveComparisonTable from "@/components/marketing/ResponsiveComparisonTable";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "13. April 2026";

const summary = [
  "Maklersoftware-Preise zu vergleichen heißt nicht, nur Monatsbeträge nebeneinanderzustellen. Entscheidend ist, welche Kosten pro Nutzer, pro Unternehmen und pro Einführung tatsächlich zusammenkommen.",
  "Der häufigste Fehler ist, kostenlose Einstiege oder niedrige Grundpreise zu überschätzen und Einrichtungsaufwand, Servicepauschalen, Zusatzmodule oder interne Pflegekosten zu unterschätzen.",
  "Preisvergleiche sind trotzdem sinnvoll, wenn sie sauber zwischen Einstieg, laufender Lizenzlogik und dem tatsächlichen Alltagsfit unterscheiden.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#vergleich", label: "Preisvergleich" },
  { href: "#was-fehlt", label: "Was öffentliche Preise nicht zeigen" },
  { href: "#buero-fit", label: "Welcher Preis zu welchem Büro passt" },
  { href: "#demo-fragen", label: "Demo-Fragen" },
  { href: "#einordnung", label: "Einordnung" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite nutzt ausschließlich aktuelle offizielle Herstellerseiten von onOffice, FLOWFACT, Propstack und HubSpot. Stand der öffentlichen Preislogik ist der 13. April 2026.",
  "Verglichen werden öffentliche Einstiegspreise, erkennbare Zusatzkosten, Lizenzlogik und die Frage, was das jeweilige Modell über den späteren Betriebsaufwand verrät.",
  "Die Tabelle ist bewusst keine Kaufempfehlung allein nach Preis. Ein günstiger Start ist nur dann wirklich günstig, wenn das Team den Alltag mit dem System sauber tragen kann.",
];

const priceRows = [
  {
    system: "onOffice enterprise pro",
    publicPrice: "79 € pro User/Monat",
    setup: "zzgl. 50 € monatliche Servicepauschale je Unternehmen und Setup",
    logic: "Klassische pro-User-Lizenz mit zusätzlicher Unternehmenskomponente",
    watch: "Wichtig ist, wie viele Nutzer real gebraucht werden und ob Zusatzmodule oder höherwertige Pakete nötig sind.",
  },
  {
    system: "onOffice enterprise all-in",
    publicPrice: "99 € pro User/Monat",
    setup: "zzgl. 50 € monatliche Servicepauschale je Unternehmen und Setup",
    logic: "Höherer Paketpreis, aber mehr Funktionen im Kern enthalten",
    watch: "Der Aufpreis lohnt sich nur, wenn die zusätzlichen Module auch im Alltag genutzt werden.",
  },
  {
    system: "FLOWFACT Mini",
    publicPrice: "0 € monatlich",
    setup: "ohne klassische Einrichtungsgebühr laut Produktlogik des Einstiegsmodells",
    logic: "Kostenloser Einstieg mit Fokus auf Gründer und kleine Teams",
    watch: "Sehr guter Startpreis, aber die Frage ist, wann der Umstieg auf Residential oder weitere Struktur nötig wird.",
  },
  {
    system: "FLOWFACT Residential",
    publicPrice: "79 € pro Lizenz/Monat",
    setup: "zzgl. 279 € Einrichtungsgebühr",
    logic: "Klarer branchenspezifischer Standardtarif mit Einmalkosten zum Start",
    watch: "Die Einrichtungsgebühr fällt am Anfang an; entscheidend ist, ob das Team danach den Prozess wirklich konsequent nutzt.",
  },
  {
    system: "Propstack Standard",
    publicPrice: "99 € pro Lizenz/Monat",
    setup: "zzgl. 279 € Einrichtungsgebühr",
    logic: "Klarer SaaS-Preis mit inkludierten Standardprozessen und Mobile-App",
    watch: "Preislich gut vergleichbar mit onOffice all-in, aber mit anderer Produktlogik und anderem Einführungsprofil.",
  },
  {
    system: "Propstack Enterprise",
    publicPrice: "Auf Anfrage",
    setup: "individuell",
    logic: "Preislogik ab größerem oder spezifischerem Setup nicht mehr öffentlich standardisiert",
    watch: "Ab diesem Punkt wird der Vergleich ohne konkrete Demo- und Angebotslage schnell unpräzise.",
  },
  {
    system: "HubSpot CRM",
    publicPrice: "kostenloser Einstieg; Starter ab 15 €/Monat pro Lizenz",
    setup: "keine klassische Einrichtungsgebühr auf der Produktseite genannt",
    logic: "Niedrige Einstiegshürde, weitere Stufen wachsen mit Funktionsumfang und Nutzerzahl",
    watch: "Nicht maklerspezifisch. Der günstige Einstieg kann später mehr Modellierungs- und Integrationsaufwand bedeuten.",
  },
];

const missingCosts = [
  {
    title: "Einführung und Datenhygiene",
    text: "Öffentliche Preise sagen wenig darüber, wie viel Zeit Ihr Team in Stammdaten, Feldlogik, Zuständigkeiten und Migrationsdisziplin investieren muss.",
  },
  {
    title: "Zusatzmodule und Partnerlösungen",
    text: "Ein günstiger Grundpreis hilft wenig, wenn Ihre Kernlücke erst über Zusatzmodule, Schnittstellen oder externe Services geschlossen wird.",
  },
  {
    title: "Interner Pflegeaufwand",
    text: "Eine Software kann auf dem Papier preiswert sein und im Alltag trotzdem teuer werden, wenn Datensätze, Kalender und Anfragepfade laufend manuell nachgezogen werden müssen.",
  },
  {
    title: "Falsche Lizenzannahmen",
    text: "Viele Teams rechnen mit zu wenigen aktiven Nutzern oder übersehen Unternehmenspauschalen und Einmalkosten im ersten Jahr.",
  },
];

const teamFits = [
  {
    title: "Einzelmakler oder Gründung",
    text: "Hier ist ein kostenloser oder sehr schlanker Einstieg attraktiv, solange die Software den Alltag nicht sofort wieder in manuelle Nebenprozesse drängt.",
  },
  {
    title: "Kleines Team mit stabilem Anfragevolumen",
    text: "Dann sind transparente Pro-Lizenz-Modelle oft gut vergleichbar. Wichtiger als der niedrigste Preis ist, ob Portal- und Anfrageprozess ohne Zusatzchaos mitlaufen.",
  },
  {
    title: "Büro mit komplexerem Setup",
    text: "Sobald auf Anfrage kalkuliert wird, sollten Preisvergleiche nur noch mit konkreter Demo und belastbarem Pflichtenbild geführt werden.",
  },
  {
    title: "Team mit bestehender Maklersoftware",
    text: "Dann ist oft nicht mehr der Maklersoftware-Preis die zentrale Frage, sondern ob der verbleibende Engpass im Anfragepostfach günstiger über eine ergänzende Prozessschicht gelöst wird.",
  },
];

const demoQuestions = [
  "Welche Kosten entstehen im ersten Jahr realistisch inklusive Einrichtung, Unternehmenspauschalen, Schulung und notwendigen Zusatzmodulen?",
  "Wie viele Nutzer brauchen wir wirklich produktiv und welche Rolle spielt eine Unternehmenspauschale zusätzlich zur Lizenz?",
  "Welche zentralen Maklerprozesse sind im öffentlichen Paket wirklich enthalten und was nur indirekt oder gegen Aufpreis lösbar?",
  "Wie viel Modellierungs- oder Administrationsaufwand entsteht bei Portalanfragen, Terminlogik und Nachfassen im Alltag?",
  "Welcher Tarif passt zu unserem jetzigen Bürotyp und ab wann kippt die Preislogik in einen individuellen Enterprise-Fall?",
  "Welche Kosten entstehen nicht auf der Preis-Seite, aber sicher im Go-live oder laufenden Betrieb?",
];

const interpretationCards = [
  {
    title: "Billig ist nicht automatisch günstig",
    text: "Wenn ein günstiger Einstieg später mehr Pflege, Workarounds oder Zusatzsoftware erzeugt, ist der tatsächliche Betrieb teurer als die Preisseite vermuten lässt.",
  },
  {
    title: "Teurer ist nicht automatisch überdimensioniert",
    text: "Ein höherer Monatspreis kann sinnvoll sein, wenn dadurch zentrale Maklerlogik, Portalprozesse und Teamabläufe sauberer im Kernsystem landen.",
  },
  {
    title: "Advaic ist eine andere Preisfrage",
    text: "Wenn die Arbeitsbasis steht, aber Anfrageeingang, Freigabe und Nachfassen weiter bremsen, vergleichen Sie nicht Maklersoftware gegen Maklersoftware, sondern Kernsystem gegen operative Ergänzung.",
  },
];

const faqItems = [
  {
    question: "Welche Maklersoftware ist beim Preis 2026 am günstigsten?",
    answer:
      "Beim öffentlichen Einstieg liegt FLOWFACT Mini am niedrigsten, da es mit 0 € monatlich kommuniziert wird. Für einen fairen Vergleich müssen aber Einführungsaufwand, spätere Tarifwechsel und Alltagsfit mitgedacht werden.",
  },
  {
    question: "Welche Maklersoftware zeigt öffentliche Einrichtungskosten?",
    answer:
      "FLOWFACT Residential und Propstack Standard kommunizieren öffentlich eine Einrichtungsgebühr von 279 €. onOffice nennt auf seiner Preisseite zusätzlich eine monatliche Servicepauschale und Setup je Unternehmen.",
  },
  {
    question: "Ist HubSpot preislich mit Maklersoftware direkt vergleichbar?",
    answer:
      "Nur begrenzt. HubSpot hat einen sehr günstigen Einstieg, ist aber kein klassisches Maklersystem. Die fehlende Branchentiefe kann später zusätzlichen Modellierungs- und Integrationsaufwand bedeuten.",
  },
  {
    question: "Warum reicht ein Preisvergleich allein nicht für die Kaufentscheidung?",
    answer:
      "Weil Maklersoftware nicht nur nach Tarif, sondern nach Betriebsaufwand bewertet werden muss. Datenpflege, Portalprozesse, Kalenderlogik und Anfragebearbeitung entscheiden stärker über die echten Gesamtkosten als die Einstiegspreise allein.",
  },
];

const sources = [
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://onoffice.com/immobiliensoftware/",
    note: "Offizielle Herstellerseite mit öffentlichen Paketpreisen, Servicepauschale und Hinweis auf Setup je Unternehmen.",
  },
  {
    label: "FLOWFACT CRM",
    href: "https://flowfact.de/",
    note: "Offizielle Herstellerseite mit öffentlicher Preislogik für Residential und Hinweis auf FLOWFACT Mini.",
  },
  {
    label: "FLOWFACT Mini",
    href: "https://flowfact.de/flowfact_mini_crm/",
    note: "Offizielle Herstellerseite zum kostenfreien Einstiegsmodell für kleine Teams und Gründer.",
  },
  {
    label: "Propstack: Preis",
    href: "https://www.propstack.de/preis/",
    note: "Offizielle Preis- und Lizenzseite mit Standard- und Enterprise-Logik sowie Einrichtungsgebühr.",
  },
  {
    label: "HubSpot CRM",
    href: "https://www.hubspot.de/products/crm",
    note: "Offizielle Produktseite mit kostenlosem Einstieg und öffentlicher Starter-Preislogik.",
  },
  {
    label: "HubSpot Smart CRM",
    href: "https://www.hubspot.de/products/crm/ai-crm",
    note: "Offizielle Preisübersicht mit Starter-, Professional- und Enterprise-Einstieg in Euro.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Maklersoftware Preise vergleichen 2026: Was öffentliche Preise wirklich sagen",
  ogTitle: "Maklersoftware Preise vergleichen 2026 | Advaic",
  description:
    "Maklersoftware-Preise vergleichen: onOffice, FLOWFACT, Propstack und HubSpot mit öffentlicher Preislogik, Einrichtungsgebühren und der Frage, was Preisseiten nicht zeigen.",
  path: "/maklersoftware-preise-vergleichen",
  template: "compare",
  eyebrow: "Maklersoftware Preise",
  proof:
    "Ein guter Preisvergleich trennt Monatsbetrag, Einrichtungslogik und tatsächlichen Betriebsaufwand sauber voneinander.",
});

export default function MaklersoftwarePreiseVergleichenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Maklersoftware Preise vergleichen 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-13",
        mainEntityOfPage: `${siteUrl}/maklersoftware-preise-vergleichen`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Maklersoftware Preise", "onOffice Preise", "FLOWFACT Preise", "Propstack Preise"],
      },
      {
        "@type": "ItemList",
        name: "Maklersoftware Preise im Vergleich",
        itemListElement: priceRows.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.system,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <AiDiscoveryPageTemplate
      breadcrumbItems={[
        { name: "Startseite", path: "/" },
        { name: "Maklersoftware Preise vergleichen", path: "/maklersoftware-preise-vergleichen" },
      ]}
      schema={schema}
      kicker="Maklersoftware Preise"
      title="Maklersoftware Preise vergleichen: Was öffentliche Preise wirklich sagen"
      description="Öffentliche Preisseiten helfen beim ersten Sortieren. Wirklich aussagekräftig werden sie aber erst, wenn Monatsbeträge, Einmalkosten, Paketlogik und tatsächlicher Alltagsfit gemeinsam betrachtet werden."
      actions={
        <>
          <Link href="/maklersoftware-vergleich" className="btn-secondary">
            Maklersoftware Vergleich
          </Link>
          <Link href="/signup?entry=maklersoftware-preise-vergleichen" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zum Preisvergleich oder zur Einordnung springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#vergleich" className="btn-secondary w-full justify-center">
              Preisvergleich
            </MarketingJumpLink>
            <MarketingJumpLink href="#einordnung" className="btn-secondary w-full justify-center">
              Einordnung
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="maklersoftware-preise-vergleichen"
      primaryHref="/signup?entry=maklersoftware-preise-vergleichen-stage"
      primaryLabel="Mit echten Anfragen prüfen"
      secondaryHref="/maklersoftware-fuer-kleine-maklerbueros"
      secondaryLabel="Kleine Maklerbüros"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten sind offizielle Herstellerseiten und fassen die öffentliche Preislogik zusammen. Für eine finale Kaufentscheidung sollten Sie immer Angebot, Einführungsaufwand und Ihren echten Büroalltag gegentesten."
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
                Produkt- und Prozessteam mit Fokus auf Makleralltag, Anfrageprozesse und belastbare Kaufentscheidungen
                jenseits reiner Preisoptik.
              </p>
              <div className="mt-5 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="font-semibold text-[var(--text)]">Aktualisiert</p>
                  <p className="mt-2">{LAST_UPDATED}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="font-semibold text-[var(--text)]">Seitentyp</p>
                  <p className="mt-2">Preisvergleich und Kaufhilfe</p>
                </div>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite vergleicht</h2>
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
            <h2 className="h2">Öffentliche Maklersoftware-Preise im Vergleich</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die Tabelle unten zeigt die öffentliche Preislogik, nicht die vollständigen Gesamtkosten. Für eine
              saubere Einordnung müssen Lizenzmodell, Setup und tatsächlicher Betriebsfit zusammen gelesen werden.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={priceRows}
            rowKey={(item) => item.system}
            columns={[
              { key: "system", label: "System", emphasize: true },
              { key: "publicPrice", label: "Öffentlicher Preis" },
              { key: "setup", label: "Setup / Zusatzkosten" },
              { key: "logic", label: "Preislogik" },
              { key: "watch", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="was-fehlt" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <h2 className="h2">Was öffentliche Preise fast immer ausblenden</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {missingCosts.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="buero-fit" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Welcher Preis zu welchem Büro passt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {teamFits.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="demo-fragen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Sechs Fragen, die in jedem Preisgespräch gestellt werden sollten</h2>
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

      <section id="einordnung" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wie öffentliche Preise sinnvoll einzuordnen sind</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Ein Preisvergleich ist ein guter Start, aber keine fertige Kaufentscheidung. Erst wenn Bürotyp,
              Pflegeaufwand und Anfrageprozess mitgedacht sind, wird aus dem Tarif eine belastbare Wahl.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {interpretationCards.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Sinnvolle Vertiefungen</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/maklersoftware-vergleich" className="btn-secondary">
                Maklersoftware Vergleich
              </Link>
              <Link href="/maklersoftware-fuer-kleine-maklerbueros" className="btn-secondary">
                Kleine Maklerbüros
              </Link>
              <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
                CRM für Immobilienmakler
              </Link>
              <Link href="/best-software-immobilienanfragen" className="btn-secondary">
                Software für Immobilienanfragen
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section id="faq" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Häufige Fragen</h2>
          <div className="mt-8 space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="card-base p-6 md:p-8">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.question}</h3>
                <p className="helper mt-3">{item.answer}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
