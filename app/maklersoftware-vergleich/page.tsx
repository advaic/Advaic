import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import ResponsiveComparisonTable from "@/components/marketing/ResponsiveComparisonTable";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "Wer nach Maklersoftware sucht, meint oft CRM, Objektverwaltung, Portalanbindung und Anfrageprozess gleichzeitig. Genau diese Vermischung macht viele Vergleiche schwach.",
  "Es gibt keinen seriösen pauschalen Testsieger für jedes Maklerbüro. Die beste Maklersoftware hängt an Bürotyp, Datenlage, Anfragevolumen und Einführungsaufwand.",
  "Für viele Teams ist nicht nur die Maklersoftware entscheidend, sondern die Frage, ob der eigentliche Engpass in Datenpflege oder im Anfragepostfach liegt.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#testsieger", label: "Testsieger?" },
  { href: "#vergleich", label: "Vergleich" },
  { href: "#preise", label: "Preislogik" },
  { href: "#buero-fit", label: "Bürotyp" },
  { href: "#demo-fragen", label: "Demo-Fragen" },
  { href: "#anfrageprozess", label: "Anfrageprozess" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Search-Console-Signale von Advaic mit aktuellen Herstellerseiten von onOffice, FLOWFACT, Propstack und HubSpot.",
  "Verglichen wird nicht nach künstlicher Punktewertung, sondern nach vier realen Kaufkriterien: Arbeitsbasis, Anfrageprozess, Einführbarkeit und öffentliche Preislogik.",
  "Preisangaben unten sind aus öffentlichen Herstellerseiten vom 4. April 2026 zusammengefasst. Sie ersetzen kein individuelles Angebot und keine Live-Demo.",
];

const testsiegerReality = [
  {
    title: "Kein pauschaler Testsieger",
    text: "Die beste Maklersoftware für ein kleines Team mit viel Portalvolumen ist nicht automatisch die beste Lösung für ein größeres Büro mit starker Akquise- und Objektverwaltung.",
  },
  {
    title: "Maklersoftware und Anfrageprozess sind nicht dasselbe",
    text: "Viele Systeme decken Kontakt-, Objekt- und Portalprozesse ab. Der Engpass liegt im Alltag aber oft bei der Entscheidung über einzelne eingehende Anfragen.",
  },
  {
    title: "Öffentliche Preise sind nur der Einstieg",
    text: "Monatspreise sind hilfreich, aber Setup, Schulung, Zusatzmodule, Schnittstellen und interner Pflegeaufwand entscheiden oft stärker über die echte Gesamtkostenlage.",
  },
];

const softwareRows = [
  {
    system: "onOffice",
    focus: "Breite Maklersoftware für Objekte, Adressen, E-Mails, Portale und standardisierte Vermarktungsabläufe.",
    price: "ab 79 € pro Nutzer/Monat; all-in 99 €; zzgl. 50 € Servicepauschale je Unternehmen und Setup",
    fit: "Stark für Büros, die ein etabliertes, funktionsreiches System mit vielen Modulen und Portalnähe suchen.",
    watch: "Prüfen Sie genau, wie viel Konfiguration, Pflege und tägliches Mail-Handling Ihr Team realistisch tragen kann.",
  },
  {
    system: "FLOWFACT",
    focus: "Immobiliensoftware und CRM mit Akquise, Kontaktverwaltung, Portalübertragung und automatisierter Anfragenverarbeitung.",
    price: "79 € pro Lizenz/Monat zzgl. 279 € Einrichtung",
    fit: "Gut für Maklerbüros, die einen breiten digitalen Standardprozess mit Branchenfokus und kurzerem Einstieg suchen.",
    watch: "Achten Sie darauf, ob Ihr Anfrageprozess im Alltag wirklich mit den Standardabläufen abgedeckt ist oder zusätzliche Logik braucht.",
  },
  {
    system: "Propstack",
    focus: "Browserbasiertes Immobilien-CRM mit mobilen Prozessen, E-Mail-Postfach-Integration und starkem Fokus auf digitale Standardabläufe.",
    price: "Standard 99 € pro Lizenz/Monat zzgl. 279 € Einrichtung; Enterprise auf Anfrage",
    fit: "Sinnvoll für Teams, die moderne Bedienung, Geschwindigkeit und mobiles Arbeiten priorisieren.",
    watch: "Wichtig ist die Frage, wie weit die Standardprozesse für Ihre konkrete Maklerpraxis reichen und wo Individualisierung nötig wird.",
  },
  {
    system: "HubSpot",
    focus: "Allgemeines CRM mit Marketing-, Vertriebs-, Service- und Inbox-Funktionen, aber ohne Maklerlogik von Haus aus.",
    price: "kostenloser Einstieg; zusätzliche Hubs und tiefere Automatisierung kosten extra",
    fit: "Passt eher zu Teams mit starkem Inbound-, Marketing- oder Multichannel-Fokus und hoher Bereitschaft zur eigenen Modellierung.",
    watch: "Nicht maklerspezifisch. Der operative Fit hängt stark daran, wie viel Immobilienlogik, Datenstruktur und Automation Sie selbst aufbauen wollen.",
  },
];

const priceNotes = [
  {
    title: "Lizenzpreis ist nicht Gesamtkosten",
    text: "Bei onOffice, FLOWFACT und Propstack kommen neben der monatlichen Lizenz je nach Modell Einrichtung, Service oder Schulung hinzu.",
  },
  {
    title: "Freier Einstieg heißt nicht automatisch günstiger Betrieb",
    text: "HubSpot senkt die Hürde beim Start. Für größere Teams oder tiefere Automatisierung steigen die tatsächlichen Kosten jedoch oft erst später sichtbar an.",
  },
  {
    title: "Zusatzmodule und Partnerlösungen prüfen",
    text: "Ein günstiger Grundpreis hilft wenig, wenn genau Ihre Kernlücke nur über Zusatzprodukte, Schnittstellen oder Prozessumbauten geschlossen wird.",
  },
];

const officeFits = [
  {
    title: "Einzelmakler oder Neugründung",
    text: "Wichtig sind Übersicht, schneller Einstieg und eine saubere Datenbasis. Hier zählt weniger der größte Funktionsumfang als ein System, das Sie wirklich im Alltag pflegen.",
  },
  {
    title: "Kleines Team mit viel Portalanfrage-Volumen",
    text: "Die größte Frage ist oft nicht nur Maklersoftware, sondern Reaktionsgeschwindigkeit. Prüfen Sie deshalb Maklersoftware und Anfrageprozess getrennt.",
  },
  {
    title: "Etabliertes Büro mit gewachsener Datenbasis",
    text: "Bevor Sie migrieren, sollten Sie sauber prüfen, ob wirklich das Kernsystem schwach ist oder ob eher Anfragefluss, Freigabe und Nachfassen nicht sauber gelöst sind.",
  },
  {
    title: "Marketing- und Inbound-starkes Team",
    text: "Dann können allgemeinere CRM-Plattformen interessant werden. Entscheidend ist aber, wie viel branchenspezifische Struktur Sie zusätzlich aufbauen müssen.",
  },
];

const demoQuestions = [
  "Wie läuft eine neue Portalanfrage vom Eingang bis zur ersten Antwort in Ihrem Standardprozess?",
  "Welche Teile der E-Mail- und Anfragebearbeitung sind im Kernprodukt enthalten und welche brauchen Zusatzlogik?",
  "Was kostet das System realistisch inklusive Einrichtung, Zusatzmodulen und Onboarding im ersten Jahr?",
  "Wie gut funktioniert der Alltag für ein kleines Team ohne Vollzeit-Admin wirklich?",
  "Welche Datenpflege muss vor dem Go-live sauber stehen, damit das System nicht im Alltag ausfranst?",
  "Wo sehen Sie im System, was automatisch lief, was manuell geprüft wurde und warum?",
];

const requestProcessTruth = [
  {
    title: "Wann Maklersoftware allein oft reicht",
    text: "Wenn Ihr Hauptproblem heute in Objekten, Kontakten, Portalpflege, Historie und Aufgaben liegt, sollten Sie zuerst die Maklersoftware sauber aufsetzen.",
  },
  {
    title: "Wann Maklersoftware allein oft nicht reicht",
    text: "Wenn der Engpass trotz bestehendem CRM weiter im Anfragepostfach liegt, helfen Datenhaltung und Portalverwaltung allein meist nicht genug.",
  },
  {
    title: "Wo Advaic in der Landschaft sinnvoll passt",
    text: "Advaic ist keine Maklersoftware, sondern eine zusätzliche operative Schicht für Anfrageeingang, Entscheidungslogik, Freigabe, Qualitätschecks und Nachfassen.",
  },
];

const advaicFit = [
  "Ihr Büro nutzt bereits ein CRM oder eine Maklersoftware, verliert aber im Anfragepostfach weiter Zeit, Konsistenz oder Kontrolle.",
  "Sie wollen Auto-Senden nur für klar prüfbare Standardfälle freigeben und Lücken-, Risiko- oder Ausnahmefälle bewusst in der Freigabe halten.",
  "Sie möchten nicht das ganze CRM ersetzen, sondern den operativen Antwortfluss sauberer und nachvollziehbarer machen.",
];

const advaicNotFit = [
  "Sie brauchen zuerst ein zentrales System für Kontakte, Objekte und Deals.",
  "Ihr Büro hat kaum wiederkehrende Anfrage-Muster oder sehr wenig E-Mail-Volumen.",
  "Sie suchen einen einzigen Anbieter, der jede Maklerfunktion und jede Sonderlogik in einer Oberfläche abbildet.",
];

const faqItems = [
  {
    question: "Welche Maklersoftware ist 2026 die beste?",
    answer:
      "Es gibt keinen seriösen pauschalen Testsieger. Die beste Maklersoftware hängt davon ab, ob Ihr Engpass in der Datenbasis, der Vermarktung oder im Anfrageprozess liegt.",
  },
  {
    question: "Was kostet Maklersoftware für Immobilienmakler?",
    answer:
      "Öffentliche Herstellerpreise zeigen aktuell grob: onOffice startet bei 79 € pro Nutzer und Monat, FLOWFACT Residential bei 79 € pro Lizenz und Monat, Propstack Standard bei 99 € pro Lizenz und Monat. Dazu kommen je nach Anbieter Einrichtung, Service oder Zusatzmodule.",
  },
  {
    question: "Welche Maklersoftware passt für kleine Büros?",
    answer:
      "Für kleine Büros ist meist entscheidend, wie schnell das Team produktiv wird und wie viel laufende Pflege realistisch ist. Ein großes Funktionspaket hilft wenig, wenn der Alltag daran hängen bleibt.",
  },
  {
    question: "Reicht Maklersoftware allein für Portalanfragen?",
    answer:
      "Teilweise ja. Viele Systeme decken Portalprozesse und Anfragenverarbeitung ab. Wenn die eigentliche Lücke aber in Freigabe, Qualitätskontrolle und der Entscheidung pro Nachricht liegt, braucht es oft zusätzliche Prozesslogik.",
  },
];

const sources = [
  {
    label: "Google: How to write reviews",
    href: "https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews",
    note: "Leitlinie für hilfreiche Vergleichsseiten mit Methodik, Differenzierung und echtem Nutzwert.",
  },
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://onoffice.com/immobiliensoftware/",
    note: "Offizielle Herstellerseite mit Maklersoftware-Funktionen, Anfragenmanager und öffentlicher Preisübersicht.",
  },
  {
    label: "FLOWFACT: Produkt",
    href: "https://flowfact.de/produkt/",
    note: "Offizielle Herstellerseite mit Funktionsumfang, Preisrahmen und Branchenfokus für Maklerbüros.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Produktseite zur automatischen Verarbeitung von Portalanfragen und Exposéversand.",
  },
  {
    label: "Propstack: Preise & Lizenzen",
    href: "https://www.propstack.de/preis/",
    note: "Offizielle Preis- und Lizenzseite mit Standard- und Enterprise-Modell.",
  },
  {
    label: "HubSpot: CRM-Software für Immobilienmakler",
    href: "https://www.hubspot.de/products/crm/real-estate",
    note: "Offizielle Herstellerseite für den kostenlosen Einstieg und die allgemeine CRM-/Inbox-Perspektive.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Maklersoftware Vergleich 2026: Welche Immobilienmakler-Software passt?",
  ogTitle: "Maklersoftware Vergleich 2026 | Advaic",
  description:
    "Maklersoftware im Vergleich: onOffice, FLOWFACT, Propstack und HubSpot. Mit Preislogik, Bürotyp, Testsieger-Frage und der Rolle von Advaic im Anfrageprozess.",
  path: "/maklersoftware-vergleich",
  template: "compare",
  eyebrow: "Maklersoftware",
  proof: "Kein pauschaler Testsieger: relevant sind Bürotyp, Preislogik und der echte Anfrage-Engpass.",
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
        dateModified: "2026-04-04",
        mainEntityOfPage: `${siteUrl}/maklersoftware-vergleich`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Maklersoftware", "Immobilienmakler Software", "CRM für Immobilienmakler", "Anfrageprozess"],
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
        { name: "Maklersoftware Vergleich", path: "/maklersoftware-vergleich" },
      ]}
      schema={schema}
      kicker="Maklersoftware"
      title="Maklersoftware Vergleich 2026: Welche Immobilienmakler-Software passt wirklich?"
      description="Diese Seite beantwortet die ehrliche Frage hinter vielen Suchen nach Maklersoftware, Makler Software oder Immobilienmakler-Software-Testsieger: Welches System passt zu Ihrem Bürotyp, Ihrer Preislogik und Ihrem Anfrageprozess?"
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
          <p className="helper mt-2">Direkt zum Vergleich oder zur Preislogik springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#vergleich" className="btn-secondary w-full justify-center">
              Vergleich öffnen
            </MarketingJumpLink>
            <MarketingJumpLink href="#preise" className="btn-secondary w-full justify-center">
              Preislogik
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="maklersoftware-vergleich"
      primaryHref="/signup?entry=maklersoftware-vergleich-stage"
      primaryLabel="Mit echten Fällen prüfen"
      secondaryHref="/tools-fuer-immobilienmakler"
      secondaryLabel="Maklertools einordnen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten verbinden aktuelle Herstellerseiten mit Googles Leitlinie für hilfreiche Vergleichsseiten. Für die Beschaffung sollten Sie immer zusätzlich mit echten Objekt- und Anfragefällen testen."
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
                Produkt- und Prozessteam mit Fokus auf Maklersoftware, Anfrageprozesse und operative Auswahlkriterien
                für kleine und mittlere Maklerbüros.
              </p>
              <div className="mt-5 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="font-semibold text-[var(--text)]">Aktualisiert</p>
                  <p className="mt-2">{LAST_UPDATED}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="font-semibold text-[var(--text)]">Seitentyp</p>
                  <p className="mt-2">Vergleichs- und Auswahlhilfe</p>
                </div>
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

      <section id="testsieger" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Maklersoftware Testsieger? Die ehrliche Antwort</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele Suchanfragen lauten nach Testsieger oder bester Maklersoftware. Für Maklerbüros ist die wichtigere
              Frage aber fast immer: Welche Immobilienmakler-Software passt zu unserem Alltag, unserem Anfragevolumen
              und unserem Team wirklich?
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testsiegerReality.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="vergleich" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Maklersoftware im Vergleich: System, Preislogik und typischer Fit</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Der Vergleich unten kombiniert den öffentlichen Preisrahmen mit Bürotyp und Engpass. Genau das fehlt in
              vielen Seiten, die nur Features nebeneinanderstellen.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={softwareRows}
            rowKey={(row) => row.system}
            columns={[
              { key: "system", label: "System", emphasize: true },
              { key: "focus", label: "Fokus" },
              { key: "price", label: "Öffentliche Preislogik" },
              { key: "fit", label: "Typischer Fit" },
              { key: "watch", label: "Worauf Sie achten sollten" },
            ]}
          />
        </Container>
      </section>

      <section id="preise" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Was die Preisangaben bei Maklersoftware wirklich bedeuten</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {priceNotes.map((item) => (
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
          <h2 className="h2">Welche Maklersoftware zu welchem Bürotyp passt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
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
            <h2 className="h2">Sechs Fragen, die Sie in jeder Maklersoftware-Demo stellen sollten</h2>
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

      <section id="anfrageprozess" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Was viele Maklersoftware-Vergleiche auslassen: den Anfrageprozess</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Genau hier entsteht im Alltag oft die eigentliche Friktion. Ein gutes CRM hilft bei Daten und Historie.
              Der Engpass kann trotzdem weiter bei Freigabe, Qualitätskontrolle und der Entscheidung pro Nachricht
              liegen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {requestProcessTruth.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h3 className="h3">Wann Advaic zusätzlich Sinn ergibt</h3>
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
              <h3 className="h3">Wann Advaic nicht die erste Baustelle ist</h3>
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
              <Link href="/tools-fuer-immobilienmakler" className="btn-secondary">
                Tools für Immobilienmakler
              </Link>
              <Link href="/maklersoftware-preise-vergleichen" className="btn-secondary">
                Preise vergleichen
              </Link>
              <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
                CRM für Immobilienmakler
              </Link>
              <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
                KI-Tools Vergleich
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
          <h2 className="h2">Häufige Fragen zu Maklersoftware</h2>
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
