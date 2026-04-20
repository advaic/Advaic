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
  "Ein CRM für Immobilienmakler ist zuerst die Arbeitsbasis für Kontakte, Objekte, Aktivitäten, Aufgaben und Historie.",
  "Die eigentliche Auswahlfrage lautet oft nicht nur: Welches CRM ist gut? Sondern: Brauchen wir ein branchenspezifisches Makler-CRM oder ein allgemeineres CRM mit mehr Eigenaufbau?",
  "Wenn der Engpass trotz CRM im Anfragepostfach bleibt, reicht die Datenbasis allein meist nicht. Dann braucht das Büro zusätzlich eine operative Schicht für Antwortlogik, Freigabe und Nachfassen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#crm-job", label: "CRM-Aufgabe" },
  { href: "#vergleich", label: "Vergleich" },
  { href: "#preise", label: "Preislogik" },
  { href: "#team-fit", label: "Bürotyp" },
  { href: "#demo-fragen", label: "Demo-Fragen" },
  { href: "#anfrageprozess", label: "Anfrageprozess" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Search-Console-Signale von Advaic mit offiziellen Herstellerseiten von onOffice, FLOWFACT, Propstack und HubSpot.",
  "Verglichen wird nicht nach künstlicher Punktewertung, sondern nach vier Kaufkriterien: CRM-Arbeitsbasis, Anfragebezug, Einführbarkeit und öffentliche Preislogik.",
  "Preisangaben unten sind aus öffentlichen Herstellerseiten vom 4. April 2026 zusammengefasst. Sie ersetzen kein individuelles Angebot und keine Live-Demo.",
];

const crmJobs = [
  {
    title: "Zentrale Datenbasis",
    text: "Ein gutes Makler-CRM verbindet Kontakte, Objekte, Aktivitäten und Zuständigkeiten an einem Ort statt über Tabellen, Postfächer und Einzellösungen.",
  },
  {
    title: "Nachvollziehbare Historie",
    text: "Das Team muss sehen, wer wann mit wem Kontakt hatte, welches Objekt betroffen ist und welche Aufgabe als Nächstes ansteht.",
  },
  {
    title: "Objekt- und Vermarktungsbezug",
    text: "Im Makleralltag reicht ein reines Adress-CRM selten. Entscheidend ist, wie sauber Objektverwaltung, Portale, Suchprofile und Vermarktungsabläufe mitlaufen.",
  },
  {
    title: "Teamsteuerung statt Einzelpostfach",
    text: "Ein CRM soll Verantwortung, Wiedervorlagen und Transparenz im Büro verbessern. Genau daran scheitern viele gewachsene Setups ohne saubere Systembasis.",
  },
];

const crmRows = [
  {
    system: "onOffice",
    focus: "Branchenspezifisches Makler-CRM mit Objekt-, Adress-, E-Mail-, Portal- und Vermarktungslogik in einer breiten Suite.",
    price: "ab 79 € pro Nutzer/Monat; all-in 99 €; zzgl. 50 € Servicepauschale je Unternehmen und Setup",
    fit: "Passt zu Büros, die ein etabliertes Makler-CRM mit vielen Modulen, Portalnähe und tiefer Objektlogik suchen.",
    watch: "Wichtig ist, wie viel Konfiguration, Pflege und Prozessdisziplin Ihr Team im Alltag wirklich tragen kann.",
  },
  {
    system: "FLOWFACT",
    focus: "Makler-CRM mit Kontaktverwaltung, Objekt- und Portalprozessen sowie breitem digitalem Branchen-Setup.",
    price: "79 € pro Lizenz/Monat zzgl. 279 € Einrichtung",
    fit: "Gut für Maklerbüros, die ein branchenspezifisches CRM mit klarer Kontakt- und Vermarktungsbasis suchen.",
    watch: "Prüfen Sie sauber, welche Teile Ihres Anfragealltags im Standard gut abgedeckt sind und wo zusätzliche Prozesslogik nötig wird.",
  },
  {
    system: "Propstack",
    focus: "Browserbasiertes Immobilien-CRM mit starkem Fokus auf Geschwindigkeit, mobile Nutzung und digitale Standardprozesse.",
    price: "Standard 99 € pro Lizenz/Monat zzgl. 279 € Einrichtung; Enterprise auf Anfrage",
    fit: "Sinnvoll für Teams, die ein modernes Makler-CRM mit schneller Bedienung und klaren Standardabläufen priorisieren.",
    watch: "Entscheidend ist, wie weit die Standardisierung zu Ihrer konkreten Maklerpraxis passt und wo Individualisierung erforderlich wird.",
  },
  {
    system: "HubSpot",
    focus: "Allgemeines CRM mit Marketing-, Vertriebs-, Service- und Inbox-Funktionen, aber ohne branchenspezifische Maklerlogik von Haus aus.",
    price: "kostenloser Einstieg; zusätzliche Hubs und tiefere Automatisierung kosten extra",
    fit: "Passt eher zu inbound- und marketingstarken Teams, die Immobilienlogik, Datenmodell und Prozesse bewusst selbst aufbauen wollen.",
    watch: "Nicht maklerspezifisch. Der Fit hängt stark daran, wie viel Struktur, Automatisierung und Objektlogik intern modelliert werden soll.",
  },
];

const priceNotes = [
  {
    title: "Monatspreis ist nur der Einstieg",
    text: "Bei onOffice, FLOWFACT und Propstack kommen neben der Lizenz je nach Modell Einrichtung, Service, Schulung oder Zusatzmodule hinzu.",
  },
  {
    title: "Branchenspezifisch heißt nicht automatisch günstiger",
    text: "Ein Makler-CRM spart oft Eigenaufbau. Dafür können Einführung, Migration und laufende Pflege stärker ins Gewicht fallen als der nackte Lizenzpreis.",
  },
  {
    title: "Freier Einstieg heißt nicht automatisch niedrige Gesamtkosten",
    text: "Allgemeine CRM-Plattformen wie HubSpot senken die Einstiegshürde. Für tiefere Automatisierung, Teamprozesse und zusätzliche Hubs steigen die realen Kosten oft später an.",
  },
];

const teamFits = [
  {
    title: "Neugründung oder Einzelmakler",
    text: "Wichtig sind Übersicht, schneller Start und ein System, das im Alltag wirklich gepflegt wird. Ein riesiger Funktionsumfang hilft wenig, wenn die Datenbasis nicht sauber bleibt.",
  },
  {
    title: "Kleines Maklerbüro mit viel Portalgeschäft",
    text: "Hier lohnt die Trennung zwischen CRM und Anfrageprozess besonders. Das CRM strukturiert Kontakte und Objekte, der eigentliche Engpass liegt aber oft in der Erstreaktion auf eingehende Anfragen.",
  },
  {
    title: "Etabliertes Büro mit gewachsener Datenbasis",
    text: "Bevor Sie migrieren, sollten Sie prüfen, ob wirklich das CRM das Problem ist oder eher Freigabe, Nachfassen und operative Steuerung im Anfrageeingang.",
  },
  {
    title: "Inbound- und marketingstarkes Team",
    text: "Dann können allgemeinere CRM-Plattformen attraktiv werden. Entscheidend ist, wie gut sich Objektlogik, Zuständigkeiten und Makleralltag ohne zu viel Eigenbau abbilden lassen.",
  },
];

const demoQuestions = [
  "Wie sauber verbindet das CRM Kontakte, Objekte, Aktivitäten, Aufgaben und Zuständigkeiten im Alltag?",
  "Welche Teile von Portal-, E-Mail- und Anfrageprozessen sind im Kernprodukt enthalten und welche nicht?",
  "Was kostet das System realistisch im ersten Jahr inklusive Einrichtung, Zusatzmodulen und Onboarding?",
  "Wie gut funktioniert das CRM für ein kleines Team ohne Vollzeit-Admin wirklich?",
  "Welche Daten müssen vor dem Start bereinigt oder ergänzt werden, damit das System tragfähig wird?",
  "Wo sieht das Team, was automatisch lief, was manuell nachgefasst wurde und welche Fälle offen sind?",
];

const requestProcessTruth = [
  {
    title: "Wann CRM die Hauptbaustelle ist",
    text: "Wenn Kontakte, Objekte, Zuständigkeiten und Historie nicht sauber strukturiert sind, sollten Sie zuerst das CRM als Arbeitsbasis stabilisieren.",
  },
  {
    title: "Wann CRM allein nicht reicht",
    text: "Wenn das Büro bereits ein funktionierendes CRM hat, aber im Anfragepostfach weiter Zeit, Qualität oder Kontrolle verliert, liegt das Problem meist nicht mehr in der Datenhaltung.",
  },
  {
    title: "Wo Advaic sinnvoll ergänzt",
    text: "Advaic ist kein CRM, sondern eine zusätzliche operative Schicht für Anfrageeingang, Antwortlogik, Freigabe, Qualitätschecks und Nachfassen.",
  },
];

const advaicFit = [
  "Ihr CRM ist als Datenbasis grundsätzlich brauchbar, aber der Anfrageeingang bleibt trotzdem langsam, uneinheitlich oder schwer kontrollierbar.",
  "Sie möchten automatische Antworten nur für klar prüfbare Standardfälle freigeben und Ausnahmen bewusst in eine Freigabe legen.",
  "Sie wollen keine komplette CRM-Migration erzwingen, nur weil der operative Antwortprozess hakt.",
];

const advaicNotFit = [
  "Sie brauchen zuerst ein sauberes System für Kontakte, Objekte, Verantwortlichkeiten und Historie.",
  "Ihr Team arbeitet noch ohne belastbare Datenbasis oder mit stark verstreuten Einzelsystemen.",
  "Sie suchen primär ein vollwertiges Makler-CRM und nicht zuerst eine zusätzliche Schicht für Anfragebearbeitung.",
];

const faqItems = [
  {
    question: "Welches CRM ist 2026 das beste für Immobilienmakler?",
    answer:
      "Es gibt keinen seriösen pauschalen Sieger. Das passende CRM hängt daran, ob Sie vor allem ein branchenspezifisches Makler-CRM, ein allgemeineres Inbound-CRM oder zusätzlich eine operative Lösung für den Anfrageprozess brauchen.",
  },
  {
    question: "Brauchen Immobilienmakler überhaupt ein CRM?",
    answer:
      "Sobald Kontakte, Objekte, Aktivitäten und Wiedervorlagen teamweit gesteuert werden müssen, ist ein CRM meist sinnvoll. Es schafft die zentrale Arbeitsbasis für Makleralltag, Vermarktung und Historie.",
  },
  {
    question: "Reicht ein CRM auch für eingehende Immobilienanfragen?",
    answer:
      "Teilweise ja. Viele Systeme dokumentieren Anfragen und unterstützen Standardabläufe. Wenn die eigentliche Lücke aber in Antwortlogik, Freigabe und Qualitätskontrolle pro Nachricht liegt, reicht CRM allein oft nicht aus.",
  },
  {
    question: "Was kostet ein CRM für Immobilienmakler?",
    answer:
      "Öffentliche Preise zeigen aktuell grob: onOffice startet bei 79 € pro Nutzer und Monat, FLOWFACT Residential bei 79 € pro Lizenz und Monat, Propstack Standard bei 99 € pro Lizenz und Monat. Dazu kommen je nach Anbieter Einrichtung, Service oder Zusatzmodule.",
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
    note: "Offizielle Herstellerseite mit Makler-CRM-, Objekt-, Portal- und Preisinformationen.",
  },
  {
    label: "FLOWFACT: Produkt",
    href: "https://flowfact.de/produkt/",
    note: "Offizielle Herstellerseite mit CRM-Funktionen, Preisrahmen und Branchenfokus für Maklerbüros.",
  },
  {
    label: "FLOWFACT: Kontaktverwaltung",
    href: "https://flowfact.de/kontaktverwaltung/",
    note: "Offizielle CRM-Seite zur Rolle von Kontaktpflege, Historie und Anfrageprozess im Makleralltag.",
  },
  {
    label: "Propstack: Immobilien-CRM",
    href: "https://www.propstack.de/immobilien-crm/",
    note: "Offizielle Herstellerseite mit Fokus auf browserbasiertes Makler-CRM und digitale Standardprozesse.",
  },
  {
    label: "Propstack: Preise & Lizenzen",
    href: "https://www.propstack.de/preis/",
    note: "Offizielle Preis- und Lizenzseite mit Standard- und Enterprise-Modell.",
  },
  {
    label: "HubSpot: CRM-Software für Immobilienmakler",
    href: "https://www.hubspot.de/products/crm/real-estate",
    note: "Offizielle Herstellerseite zur allgemeinen CRM-Perspektive mit Marketing-, Vertriebs- und Inbox-Fokus.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "CRM für Immobilienmakler 2026: Welches CRM passt?",
  ogTitle: "CRM für Immobilienmakler 2026 | Advaic",
  description:
    "CRM für Immobilienmakler im Vergleich: onOffice, FLOWFACT, Propstack und HubSpot. Mit Preislogik, Bürotyp, CRM-Aufgabe und der Grenze zwischen CRM und Anfrageprozess.",
  path: "/crm-fuer-immobilienmakler",
  template: "compare",
  eyebrow: "CRM für Immobilienmakler",
  proof: "Ein CRM löst Datenbasis und Historie. Antwortlogik im Anfragepostfach ist oft eine eigene operative Baustelle.",
});

export default function CrmFuerImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "CRM für Immobilienmakler 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-04",
        mainEntityOfPage: `${siteUrl}/crm-fuer-immobilienmakler`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["CRM für Immobilienmakler", "Makler-CRM", "Immobilien-CRM", "Anfrageprozess"],
      },
      {
        "@type": "ItemList",
        name: "CRM-Systeme für Immobilienmakler im Vergleich",
        itemListElement: crmRows.map((row, index) => ({
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
        { name: "CRM für Immobilienmakler", path: "/crm-fuer-immobilienmakler" },
      ]}
      schema={schema}
      kicker="CRM für Immobilienmakler"
      title="CRM für Immobilienmakler 2026: Welches CRM passt wirklich?"
      description="Diese Seite beantwortet die eigentliche Kauffrage hinter vielen Suchen nach CRM für Immobilienmakler: Welches System trägt Kontakte, Objekte und Teamarbeit wirklich gut und wo beginnt eine eigene Baustelle im Anfrageprozess?"
      actions={
        <>
          <Link href="/maklersoftware-vergleich" className="btn-secondary">
            Maklersoftware Vergleich
          </Link>
          <Link href="/signup?entry=crm-fuer-immobilienmakler" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zum CRM-Vergleich oder zum Anfrageprozess springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#vergleich" className="btn-secondary w-full justify-center">
              Vergleich öffnen
            </MarketingJumpLink>
            <MarketingJumpLink href="#anfrageprozess" className="btn-secondary w-full justify-center">
              Anfrageprozess
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="crm-fuer-immobilienmakler"
      primaryHref="/signup?entry=crm-stage"
      primaryLabel="Mit echten Anfragen prüfen"
      secondaryHref="/tools-fuer-immobilienmakler"
      secondaryLabel="Maklertools einordnen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten verbinden aktuelle Herstellerseiten mit Googles Leitlinie für hilfreiche Vergleichsseiten. Für die Auswahl sollten Sie immer zusätzlich mit echten Objekt-, Kontakt- und Anfragefällen testen."
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
                Produkt- und Prozessteam mit Fokus auf Maklersoftware, CRM-Abgrenzung und operative Auswahlkriterien
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

      <section id="crm-job" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Was ein CRM für Immobilienmakler wirklich leisten soll</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele CRM-Seiten reden über Funktionen. Für die Auswahl ist wichtiger, welchen Grundjob das System im
              Makleralltag zuverlässig trägt. Genau daran sollte sich die Entscheidung zuerst orientieren.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {crmJobs.map((item) => (
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
            <h2 className="h2">CRM für Immobilienmakler im Vergleich: System, Preislogik und typischer Fit</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Der Vergleich unten trennt branchenspezifische Makler-CRMs von einem allgemeineren CRM-Ansatz und zeigt,
              wo die Unterschiede in Preislogik, Einführungsaufwand und Alltagstauglichkeit liegen.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={crmRows}
            rowKey={(row) => row.system}
            columns={[
              { key: "system", label: "System", emphasize: true },
              { key: "focus", label: "CRM-Schwerpunkt" },
              { key: "price", label: "Öffentliche Preislogik" },
              { key: "fit", label: "Typischer Fit" },
              { key: "watch", label: "Worauf Sie achten sollten" },
            ]}
          />
        </Container>
      </section>

      <section id="preise" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Was die Preisangaben bei CRM-Systemen wirklich bedeuten</h2>
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

      <section id="team-fit" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Welches CRM zu welchem Maklerbüro passt</h2>
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

      <section id="demo-fragen" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Sechs Fragen, die Sie in jeder CRM-Demo stellen sollten</h2>
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
            <h2 className="h2">Was viele CRM-Seiten auslassen: den Anfrageprozess</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Ein CRM organisiert Daten, Historie und Teamarbeit. Die eigentliche Friktion im Makleralltag entsteht
              aber oft im Eingang neuer Anfragen: Wer antwortet, wann automatisch gesendet wird und welche Fälle
              bewusst in die Freigabe gehen.
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
              <h3 className="h3">Wann Advaic ein CRM sinnvoll ergänzt</h3>
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
              <Link href="/maklersoftware-vergleich" className="btn-secondary">
                Maklersoftware Vergleich
              </Link>
              <Link href="/crm-vs-maklersoftware" className="btn-secondary">
                CRM vs. Maklersoftware
              </Link>
              <Link href="/tools-fuer-immobilienmakler" className="btn-secondary">
                Tools für Immobilienmakler
              </Link>
              <Link href="/best-software-immobilienanfragen" className="btn-secondary">
                Software für Immobilienanfragen
              </Link>
              <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
                KI-Tools Vergleich
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section id="faq" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Häufige Fragen zu CRM für Immobilienmakler</h2>
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
