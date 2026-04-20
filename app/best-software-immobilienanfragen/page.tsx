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
  "Software für Immobilienanfragen ist keine einzelne Produktkategorie. In der Praxis stehen Makler meist zwischen Maklersoftware, CRM, Sequenzen und spezialisierter Anfrageausführung.",
  "Die wichtigste Unterscheidung ist nicht KI versus keine KI, sondern Datenbasis versus Ausführung: Wer hält Kontakte und Objekte sauber, und wer entscheidet über die nächste Nachricht?",
  "Für einen belastbaren Anfragebetrieb zählen vor allem Eingangserkennung, klare Regeln für Automatik oder Freigabe, Qualitätschecks, Verlauf und kontrolliertes Nachfassen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#aufgabe", label: "Grundjob" },
  { href: "#vergleich", label: "Vergleich" },
  { href: "#preise", label: "Preislogik" },
  { href: "#team-fit", label: "Bürotyp" },
  { href: "#demo-fragen", label: "Demo-Fragen" },
  { href: "#anfrageprozess", label: "Anfrageprozess" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Search-Console-Signale von Advaic mit offiziellen Herstellerseiten aus dem Maklersoftware-, CRM- und Anfrage-Umfeld.",
  "Verglichen wird nicht nur nach Feature-Listen, sondern nach der operativen Rolle im Makleralltag: Eingang, Antwortpfad, Freigabe, Verlauf und Nachfassen.",
  "Preisangaben unten sind aus öffentlichen Herstellerseiten vom 4. April 2026 zusammengefasst. Sie ersetzen kein individuelles Angebot und keine Live-Demo.",
];

const requestSoftwareJobs = [
  {
    title: "Eingang sauber erkennen",
    text: "Ein gutes System trennt echte Interessenten-Anfragen von unwichtigen Nachrichten, Dubletten oder unklaren Fällen. Ohne diese Trennung bleibt das Team im Postfach stecken.",
  },
  {
    title: "Antwortpfad sichtbar steuern",
    text: "Entscheidend ist nicht nur Textgenerierung, sondern die Frage, wann automatisch geantwortet, wann gestoppt und wann bewusst freigegeben wird.",
  },
  {
    title: "Qualität vor Versand absichern",
    text: "Relevante Systeme prüfen Kontext, Vollständigkeit, Ton und Risiko, statt nur schnell eine E-Mail zu formulieren.",
  },
  {
    title: "Nachfassen kontrollierbar halten",
    text: "Follow-ups müssen stoppbar, nachvollziehbar und an Antworten oder Termine gekoppelt sein. Sonst wird der Prozess schnell lästig oder riskant.",
  },
];

const softwareRows = [
  {
    system: "onOffice",
    focus: "Maklersoftware mit CRM-, Objekt-, Portal-, E-Mail- und Anfragenmanager-Logik als breite Arbeitsbasis.",
    price: "ab 79 € pro Nutzer/Monat; all-in 99 €; zzgl. 50 € Servicepauschale je Unternehmen und Setup",
    fit: "Passt zu Büros, die Datenbasis, Objektlogik und Anfragealltag möglichst nah in einem Maklersystem halten wollen.",
    watch: "Stark als Arbeitsbasis. Prüfen Sie trotzdem, wie gut Freigabe- und Qualitätslogik pro Anfrage im Alltag wirklich gelöst sind.",
  },
  {
    system: "FLOWFACT",
    focus: "Maklersoftware und CRM mit Kontaktverwaltung, Portalprozessen und automatisierter Anfragenverarbeitung.",
    price: "79 € pro Lizenz/Monat zzgl. 279 € Einrichtung",
    fit: "Gut für Maklerbüros, die einen branchenspezifischen digitalen Standardprozess mit CRM- und Anfragebezug suchen.",
    watch: "Wichtig ist, wie weit die Standardabläufe Ihren echten Anfragealltag abdecken und wo Zusatzlogik nötig wird.",
  },
  {
    system: "Propstack",
    focus: "Browserbasiertes Immobilien-CRM mit starkem Fokus auf digitale Standardprozesse, E-Mail-Arbeit und moderne Bedienung.",
    price: "Standard 99 € pro Lizenz/Monat zzgl. 279 € Einrichtung; Enterprise auf Anfrage",
    fit: "Sinnvoll für Teams, die ein modernes Makler-CRM mit hoher Geschwindigkeit und klaren Standardprozessen priorisieren.",
    watch: "Prüfen Sie, wie weit Anfragenmanager, Teamabläufe und Individualisierung zu Ihrer konkreten Maklerpraxis passen.",
  },
  {
    system: "HubSpot",
    focus: "Allgemeines CRM mit Sequenzen, Marketing-, Vertriebs- und Inbox-Funktionen, aber ohne Maklerlogik von Haus aus.",
    price: "kostenloser Einstieg; Sequenzen erst in höheren Hub-Plänen mit kostenpflichtigen Seats",
    fit: "Passt eher zu inbound- und marketingstarken Teams, die Immobilienlogik, Datenmodell und Nachfassprozess selbst modellieren wollen.",
    watch: "Nicht maklerspezifisch. Der operative Fit hängt daran, wie viel Objektbezug, Routing und Anfrageprozess Sie selbst abbilden.",
  },
  {
    system: "Advaic",
    focus: "Spezialisierte Anfrageausführung für Eingang, Antwortlogik, Qualitätschecks, Freigabe, Verlauf und Nachfassen.",
    price: "14 Tage Testphase; danach 199 € pro 4 Wochen",
    fit: "Passt zu Teams, deren CRM grundsätzlich steht, deren Anfragepostfach aber weiter langsam, inkonsistent oder schwer kontrollierbar bleibt.",
    watch: "Kein Ersatz für vollständige Objekt-, Kontakt- und Dealverwaltung. Die Stärke liegt im operativen Antwortfluss.",
  },
];

const priceNotes = [
  {
    title: "Lizenzpreis ist nicht Gesamtkosten",
    text: "Bei onOffice, FLOWFACT und Propstack kommen neben der monatlichen Lizenz je nach Modell Einrichtung, Service, Schulung oder Zusatzmodule hinzu.",
  },
  {
    title: "Freier Einstieg heißt nicht automatisch günstiger Betrieb",
    text: "Allgemeine CRM-Plattformen wie HubSpot wirken am Anfang günstig. Für Sequenzen, Seats und tiefere Prozessabbildung steigen die realen Kosten oft später an.",
  },
  {
    title: "Die eigentliche Kostenfrage ist Prozessfit",
    text: "Ein höherer Preis kann sinnvoll sein, wenn das System Ihren Anfragealltag wirklich entlastet. Ein günstiges Tool wird teuer, wenn Ihr Team weiter manuell improvisieren muss.",
  },
];

const teamFits = [
  {
    title: "Kleines Maklerbüro mit vielen Portalanfragen",
    text: "Dann ist die Reaktionsgeschwindigkeit oft die Hauptbaustelle. Prüfen Sie deshalb nicht nur CRM-Funktionen, sondern konkret Eingang, Freigabe und Nachfassen pro Anfrage.",
  },
  {
    title: "Maklerbüro ohne saubere Datenbasis",
    text: "Wenn Kontakte, Objekte und Zuständigkeiten noch nicht belastbar gepflegt sind, sollte zuerst Maklersoftware oder CRM stabilisiert werden. Sonst kippt jede spätere Automation.",
  },
  {
    title: "Etabliertes Team mit funktionierendem CRM",
    text: "Wenn das CRM im Grundsatz trägt, aber das Anfragepostfach trotzdem langsam oder uneinheitlich bleibt, lohnt sich eine zusätzliche Anfrage-Schicht eher als ein kompletter Systemwechsel.",
  },
  {
    title: "Inbound- und marketingstarkes Team",
    text: "Dann können Plattformen wie HubSpot interessant sein. Entscheidend ist, ob Sie die notwendige Immobilienlogik und den operativen Anfrageprozess intern sauber modellieren können.",
  },
];

const demoQuestions = [
  "Woran erkennt das System zuverlässig, dass eine Nachricht eine echte Interessenten-Anfrage ist?",
  "Wo sieht das Team, wann automatisch gesendet wurde, wann eine Freigabe nötig war und warum?",
  "Welche Qualitätsprüfungen laufen vor dem Versand und welche Risiken bleiben bewusst manuell?",
  "Wie funktioniert Nachfassen konkret, und wann stoppt das System automatisch?",
  "Was kostet das Setup realistisch im ersten Jahr inklusive Einrichtung, Zusatzmodulen und laufender Pflege?",
  "Wie schnell kommt ein kleines Maklerteam ohne Vollzeit-Admin zu einem sicheren Startprofil?",
];

const requestProcessTruth = [
  {
    title: "Wann Maklersoftware oder CRM reicht",
    text: "Wenn Ihr Hauptproblem heute in Kontakten, Objekten, Zuständigkeiten und Transparenz liegt, sollten Sie zuerst die Arbeitsbasis sauber aufsetzen.",
  },
  {
    title: "Wann zusätzliche Anfrage-Software nötig wird",
    text: "Wenn das Büro trotz CRM oder Maklersoftware weiter an Erstreaktion, Freigabe und Nachfassen hängt, liegt die eigentliche Lücke oft im operativen Anfrageprozess.",
  },
  {
    title: "Wo Advaic sinnvoll ergänzt",
    text: "Advaic ist keine Maklersoftware, sondern eine zusätzliche operative Schicht für den Teil des Prozesses, der im Postfach und in der Antwortlogik stattfindet.",
  },
];

const advaicFit = [
  "Sie haben wiederkehrende Interessenten-Anfragen, die mit klaren Regeln schneller und sauberer beantwortet werden könnten.",
  "Ihr Team braucht sichtbare Gründe, warum etwas automatisch gesendet oder in die Freigabe gelegt wurde.",
  "Sie möchten nicht das ganze CRM ersetzen, sondern den operativen Antwortfluss belastbar machen.",
];

const advaicNotFit = [
  "Sie suchen primär ein zentrales System für Objekt-, Kontakt- und Dealverwaltung.",
  "Fast alle Anfragen sind hoch individuell, verhandlungsnah oder konfliktbeladen.",
  "Sie haben noch keine belastbare Daten- und Zuständigkeitslogik im Maklerbüro.",
];

const faqItems = [
  {
    question: "Welche Software ist für Immobilienanfragen 2026 die beste?",
    answer:
      "Es gibt keinen pauschalen Sieger. Die beste Lösung hängt daran, ob Ihr Engpass in Datenbasis, Postfachorganisation, Nachfassen oder Freigabe- und Qualitätslogik pro Anfrage liegt.",
  },
  {
    question: "Reicht Maklersoftware allein für Immobilienanfragen?",
    answer:
      "Teilweise ja. Viele Maklersysteme unterstützen Anfrageprozesse. Wenn die eigentliche Lücke aber in Freigabe, Qualitätskontrolle und der Entscheidung pro Nachricht liegt, reicht die reine Arbeitsbasis oft nicht aus.",
  },
  {
    question: "Reicht ein allgemeines KI-Schreibtool aus?",
    answer:
      "Für einzelne Textaufgaben kann es reichen. Für einen belastbaren Anfragebetrieb fehlen meist Prozesslogik, Stop-Regeln, Freigabe und Verlauf.",
  },
  {
    question: "Wann ist Advaic sinnvoller als ein weiterer CRM-Umbau?",
    answer:
      "Wenn Ihr CRM als Datenbasis funktioniert, der Engpass aber weiter im Anfragepostfach liegt. Dann ist eine spezialisierte Anfrageausführung oft der klarere Hebel als ein kompletter Systemwechsel.",
  },
];

const sources = [
  {
    label: "Google: Creating helpful, reliable, people-first content",
    href: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    note: "Leitlinie für hilfreiche, originäre Seiten statt bloßer SEO-Umschreibungen.",
  },
  {
    label: "Google: How to write reviews",
    href: "https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews",
    note: "Leitlinie für Vergleichsseiten mit Methodik, Differenzierung und echtem Nutzwert.",
  },
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://onoffice.com/immobiliensoftware/",
    note: "Offizielle Herstellerseite mit Maklersoftware-, CRM-, E-Mail- und Anfragenmanager-Fokus.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite für Portal-Anfragen, automatische Verarbeitung und Exposéversand.",
  },
  {
    label: "Propstack: Funktionen für Immobilienunternehmen",
    href: "https://www.propstack.de/funktionen-fuer-immobilienunternehmen/",
    note: "Offizielle Herstellerseite mit Fokus auf Makler-CRM, E-Mail-Arbeit und digitale Vermarktungsprozesse.",
  },
  {
    label: "HubSpot: Create and edit sequences",
    href: "https://knowledge.hubspot.com/sequences/create-and-edit-sequences",
    note: "Offizielle Dokumentation zu Sequenzen, Seats, automatischer Steuerung und Stop-Logik bei Antworten oder Terminen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Software für Immobilienanfragen 2026: Welche Lösung passt?",
  ogTitle: "Software für Immobilienanfragen 2026 | Advaic",
  description:
    "Software für Immobilienanfragen im Vergleich: onOffice, FLOWFACT, Propstack, HubSpot und Advaic. Mit Preislogik, Bürotyp und der Frage, wann CRM allein nicht reicht.",
  path: "/best-software-immobilienanfragen",
  template: "compare",
  eyebrow: "Software für Immobilienanfragen",
  proof: "Für Anfrage-Software zählen Eingang, klare Regeln für Automatik oder Freigabe, Qualitätschecks und kontrolliertes Nachfassen.",
});

export default function BestSoftwareImmobilienanfragenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Software für Immobilienanfragen 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/best-software-immobilienanfragen`,
        dateModified: "2026-04-04",
        about: ["Software für Immobilienanfragen", "Maklersoftware", "CRM", "Freigabe", "Follow-up"],
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
      },
      {
        "@type": "ItemList",
        name: "Software für Immobilienanfragen im Vergleich",
        itemListElement: softwareRows.map((item, index) => ({
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
        { name: "Software für Immobilienanfragen", path: "/best-software-immobilienanfragen" },
      ]}
      schema={schema}
      kicker="Software für Immobilienanfragen"
      title="Software für Immobilienanfragen 2026: Welche Lösung passt wirklich?"
      description="Diese Seite vergleicht nicht nur Features, sondern die operative Rolle von Maklersoftware, CRM und spezialisierter Anfrageausführung. Genau dort entscheidet sich, ob Ihr Team wirklich schneller, sauberer und kontrollierter arbeitet."
      actions={
        <>
          <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
            Anfragenmanagement öffnen
          </Link>
          <Link href="/signup?entry=best-software-anfragen-2026" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zum Vergleich oder zum Anfrageprozess springen.</p>
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
      stageContext="best-software-immobilienanfragen"
      primaryHref="/signup?entry=best-software-stage-2026"
      primaryLabel="Mit echten Anfragen prüfen"
      secondaryHref="/maklersoftware-vergleich"
      secondaryLabel="Maklersoftware Vergleich"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten kombinieren Google-Leitlinien für hilfreiche Vergleichsinhalte mit aktuellen Herstellerseiten. Für die finale Auswahl sollten Sie immer Ihre eigenen Anfragefälle in einer Live-Demo testen."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageprozesse, Freigabelogik und sichere Einführung im
                Makleralltag.
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

      <section id="aufgabe" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Was Software für Immobilienanfragen wirklich leisten muss</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele Seiten reden nur über Automatisierung oder KI. Für Maklerbüros ist wichtiger, ob der konkrete
              Anfrageprozess am Ende schneller, sauberer und kontrollierter läuft.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {requestSoftwareJobs.map((item) => (
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
            <h2 className="h2">Software für Immobilienanfragen im Vergleich: System, Preislogik und typischer Fit</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Der Vergleich unten trennt Arbeitsbasis und Ausführung. Genau das entscheidet bei Immobilienanfragen oft
              stärker über den Alltag als die reine Frage, ob ein System KI eingebaut hat.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={softwareRows}
            rowKey={(item) => item.system}
            columns={[
              { key: "system", label: "System", emphasize: true },
              { key: "focus", label: "Schwerpunkt" },
              { key: "price", label: "Öffentliche Preislogik" },
              { key: "fit", label: "Typischer Fit" },
              { key: "watch", label: "Worauf Sie achten sollten" },
            ]}
          />
        </Container>
      </section>

      <section id="preise" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Was die Preisangaben bei Anfrage-Software wirklich bedeuten</h2>
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
          <h2 className="h2">Welche Lösung zu welchem Maklerbüro passt</h2>
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
            <h2 className="h2">Sechs Fragen, die Sie in jeder Anfrage-Software-Demo stellen sollten</h2>
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
            <h2 className="h2">Was viele Vergleichsseiten auslassen: den eigentlichen Anfrageprozess</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Im Makleralltag ist nicht nur wichtig, welche Daten im System liegen. Entscheidend ist, was mit einer
              neuen Anfrage dann wirklich passiert: Wer antwortet, wann automatisiert wird und welche Fälle bewusst in
              der Freigabe bleiben.
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
              <h3 className="h3">Wann Advaic gut passt</h3>
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
              <h3 className="h3">Wann Sie zuerst etwas anderes lösen sollten</h3>
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
            <h3 className="h3">Sinnvolle Vertiefungen</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/maklersoftware-vergleich" className="btn-secondary">
                Maklersoftware Vergleich
              </Link>
              <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
                CRM für Immobilienmakler
              </Link>
              <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                Anfragenmanagement
              </Link>
              <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
                Follow-up-E-Mails
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section id="faq" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Häufige Fragen zu Software für Immobilienanfragen</h2>
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
