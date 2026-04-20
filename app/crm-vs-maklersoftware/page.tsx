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
  "CRM und Maklersoftware sind nicht sauber dasselbe. Ein CRM ordnet Beziehungen, Aktivitäten und Historie. Maklersoftware ist im Immobilienkontext meist breiter und verbindet CRM mit Objekt-, Portal-, Termin- und Vermarktungslogik.",
  "Der häufigste Fehler ist, allgemeines CRM und branchenspezifische Maklersoftware nur über Oberflächen oder Preis zu vergleichen. Die eigentliche Frage ist: Welche Arbeitsbasis braucht das Büro wirklich?",
  "Viele Maklersoftwares enthalten ein CRM. Das heißt aber nicht, dass jedes CRM automatisch eine gute Maklersoftware ersetzt.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#kernunterschied", label: "Kernunterschied" },
  { href: "#vergleich", label: "Vergleich" },
  { href: "#wann-was", label: "Wann was passt" },
  { href: "#fehler", label: "Typische Fehlentscheidungen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite stützt sich auf aktuelle offizielle Herstellerseiten von onOffice, FLOWFACT, Propstack und HubSpot. Stand der Einordnung ist der 13. April 2026.",
  "Verglichen wird nicht nach Branding oder Funktionslisten, sondern nach echter Aufgabe: Kontakte und Historie, Objektlogik, Portalprozesse, Terminsteuerung und Einführungsaufwand.",
  "Die Empfehlungen sind bewusst nüchtern. Für Maklerbüros ist wichtiger, welche Arbeitsbasis zum Bürotyp passt, als ob ein Anbieter sein Produkt CRM, Maklersoftware oder Plattform nennt.",
];

const coreDifference = [
  {
    title: "CRM ordnet Beziehungen",
    text: "Ein CRM verwaltet Kontakte, Aktivitäten, Aufgaben, Wiedervorlagen und Verlauf. Es hilft, Kundenbeziehungen sichtbar und teamweit nutzbar zu machen.",
  },
  {
    title: "Maklersoftware geht im Immobilienkontext weiter",
    text: "Sie verbindet CRM mit Objektverwaltung, Portalübertragung, Exposélogik, Suchprofilen, Kalender- und Vermarktungsprozessen.",
  },
  {
    title: "Viele Maklersoftwares enthalten ein CRM",
    text: "Die Trennung ist deshalb nicht immer technisch, aber in der Kaufentscheidung trotzdem wichtig: Brauchen Sie nur Beziehungsmanagement oder eine branchenspezifische Arbeitsumgebung?",
  },
  {
    title: "Allgemeine CRM-Systeme brauchen oft mehr Eigenaufbau",
    text: "Wer mit einem generischen CRM startet, muss Objektlogik, Maklerstatus, Portale und Teile des Prozessmodells häufig stärker selbst definieren.",
  },
];

const comparisonRows = [
  {
    topic: "Kernaufgabe",
    crm: "Kontakte, Aktivitäten, Aufgaben, Sales- und Servicehistorie verwalten",
    software: "Kontakte, Objekte, Portale, Exposés, Termine und Vermarktungslogik in einem branchenspezifischen Setup bündeln",
  },
  {
    topic: "Objektbezug",
    crm: "Meist nur mit eigenem Datenmodell oder Zusatzstruktur",
    software: "Im Kern der Anwendung angelegt",
  },
  {
    topic: "Portal- und Vermarktungslogik",
    crm: "Oft nur indirekt oder mit Integrationen abbildbar",
    software: "Typischer Bestandteil branchenspezifischer Maklersoftware",
  },
  {
    topic: "Einführung",
    crm: "Kann beim Einstieg leicht wirken, fordert später aber oft mehr Modellierungsdisziplin",
    software: "Hat häufig mehr eingebaute Struktur, braucht dafür aber saubere Konfiguration und Bürodisziplin",
  },
  {
    topic: "Geeignet für",
    crm: "Teams mit stärker allgemeinem Inbound-, Vertriebs- oder Servicefokus",
    software: "Maklerbüros mit klarem Objekt-, Portal- und Vermarktungsalltag",
  },
  {
    topic: "Typisches Risiko",
    crm: "Zu viel Eigenbau für Maklerlogik",
    software: "Zu schweres Setup oder zu hohe Komplexität für kleine Teams",
  },
];

const fitScenarios = [
  {
    title: "Allgemeines CRM reicht eher",
    text: "Wenn Ihr Team vor allem Kontakte, Follow-ups und generische Vertriebsarbeit organisieren will und branchenspezifische Objekt- und Portalprozesse noch nicht zentral sind.",
  },
  {
    title: "Maklersoftware passt eher",
    text: "Wenn Objekte, Exposés, Portalanbindung, Besichtigungen und Suchprofile Teil des täglichen Kerns sind und nicht nur als Zusatzprozess mitlaufen.",
  },
  {
    title: "Der eigentliche Engpass liegt woanders",
    text: "Wenn bereits ein CRM oder eine Maklersoftware steht, das Büro aber trotzdem im Anfrageeingang, in Freigabe oder im Nachfassen Zeit und Kontrolle verliert.",
  },
  {
    title: "Kleines Team sollte besonders vorsichtig wählen",
    text: "Kleine Maklerbüros brauchen nicht automatisch das größte System. Entscheidend ist, welches Setup das Team im Alltag wirklich sauber pflegt.",
  },
];

const commonMistakes = [
  "Ein allgemeines CRM zu kaufen und erst später zu merken, dass Objekt-, Portal- und Besichtigungslogik nur mit viel Eigenbau tragfähig werden.",
  "Eine große Maklersoftware einzuführen, obwohl das Büro noch nicht die Daten- und Prozessdisziplin für den Umfang hat.",
  "CRM und operative Anfragebearbeitung zu vermischen und dadurch die eigentliche Lücke im Postfach zu übersehen.",
  "Preis oder Oberfläche stärker zu gewichten als Bürotyp, Volumen und tatsächlichen Arbeitsalltag.",
];

const advaicFit = [
  "Ihr CRM oder Ihre Maklersoftware ist als Arbeitsbasis brauchbar, aber Anfrageeingang, Antwortlogik und Freigabe bleiben trotzdem eine operative Baustelle.",
  "Sie möchten nicht das ganze Kernsystem austauschen, nur weil der Antwortprozess im Postfach zu langsam oder zu unklar läuft.",
  "Sie wollen Standardfälle beschleunigen und Ausnahmen bewusst sichtbar manuell halten.",
];

const advaicNotFit = [
  "Es fehlt noch eine tragfähige Grundstruktur für Kontakte, Objekte und Zuständigkeiten.",
  "Das Team ist noch in der Frage blockiert, ob überhaupt CRM oder Maklersoftware eingeführt werden soll.",
  "Das Anfragevolumen ist so gering, dass eine zusätzliche operative Prozessschicht noch kaum Wirkung entfalten würde.",
];

const faqItems = [
  {
    question: "Ist Maklersoftware dasselbe wie CRM?",
    answer:
      "Nicht ganz. Maklersoftware enthält oft CRM-Funktionen, geht im Immobilienkontext aber meist weiter und verbindet Kontakte mit Objekt-, Portal-, Termin- und Vermarktungslogik.",
  },
  {
    question: "Wann reicht ein allgemeines CRM für Makler aus?",
    answer:
      "Wenn ein Team vor allem Kontakte, Follow-ups und allgemeine Vertriebsprozesse strukturieren will und branchenspezifische Immobilienlogik noch keine zentrale Rolle spielt.",
  },
  {
    question: "Wann ist Maklersoftware die bessere Wahl?",
    answer:
      "Wenn Objekte, Exposés, Portale, Suchprofile und Besichtigungen zum täglichen Kernprozess gehören und nicht nur als Zusatzlogik an ein allgemeines CRM angehängt werden sollen.",
  },
  {
    question: "Wo passt Advaic in diese Entscheidung?",
    answer:
      "Nicht an die Stelle von CRM oder Maklersoftware als Arbeitsbasis, sondern ergänzend dort, wo der operative Anfrageprozess trotz bestehendem System weiter zu viel Reibung erzeugt.",
  },
];

const sources = [
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://onoffice.com/immobiliensoftware/",
    note: "Offizielle Herstellerseite mit der klaren Positionierung als Maklersoftware und mehr als CRM.",
  },
  {
    label: "FLOWFACT Mini",
    href: "https://flowfact.de/flowfact_mini_crm/",
    note: "Offizielle Herstellerseite mit der Doppelperspektive aus Maklersoftware und CRM-System für kleine Teams.",
  },
  {
    label: "FLOWFACT: Kontaktverwaltung",
    href: "https://flowfact.de/kontaktverwaltung/",
    note: "Offizielle CRM-Seite zur Rolle von Kontaktpflege, Aktivitätenhistorie und Struktur im Makleralltag.",
  },
  {
    label: "Propstack: Immobilien-CRM",
    href: "https://www.propstack.de/immobilien-crm/",
    note: "Offizielle Herstellerseite zur Positionierung als branchenspezifisches Immobilien-CRM mit ganzheitlicher Arbeitsumgebung.",
  },
  {
    label: "HubSpot: CRM für Immobilienmakler",
    href: "https://www.hubspot.de/products/crm/real-estate",
    note: "Offizielle Herstellerseite für die allgemeine CRM-Perspektive im Immobilienkontext.",
  },
  {
    label: "HubSpot CRM",
    href: "https://www.hubspot.de/products/crm",
    note: "Offizielle Produktseite für ein generisches CRM ohne eingebettete Maklerlogik.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "CRM vs. Maklersoftware 2026: Was ist der Unterschied?",
  ogTitle: "CRM vs. Maklersoftware 2026 | Advaic",
  description:
    "CRM vs. Maklersoftware: Was Immobilienmakler wirklich brauchen, wann ein allgemeines CRM reicht und wann branchenspezifische Maklersoftware die bessere Arbeitsbasis ist.",
  path: "/crm-vs-maklersoftware",
  template: "compare",
  eyebrow: "CRM vs. Maklersoftware",
  proof:
    "Ein CRM ordnet Beziehungen. Maklersoftware verbindet diese Basis meist zusätzlich mit Objekt-, Portal- und Vermarktungslogik.",
});

export default function CrmVsMaklersoftwarePage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "CRM vs. Maklersoftware 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-13",
        mainEntityOfPage: `${siteUrl}/crm-vs-maklersoftware`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["CRM", "Maklersoftware", "Immobilienmakler", "Arbeitsbasis"],
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
        { name: "CRM vs. Maklersoftware", path: "/crm-vs-maklersoftware" },
      ]}
      schema={schema}
      kicker="CRM vs. Maklersoftware"
      title="CRM vs. Maklersoftware: Was Immobilienmakler wirklich vergleichen sollten"
      description="Diese Seite trennt eine häufig vermischte Frage sauber auf: Wann reicht ein CRM, wann ist Maklersoftware die bessere Arbeitsbasis und wo liegt die eigentliche Lücke trotz bestehendem System oft im Anfrageprozess?"
      actions={
        <>
          <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
            CRM-Vergleich
          </Link>
          <Link href="/signup?entry=crm-vs-maklersoftware" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zum Vergleich oder zu den Einsatzfällen springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#vergleich" className="btn-secondary w-full justify-center">
              Vergleich
            </MarketingJumpLink>
            <MarketingJumpLink href="#wann-was" className="btn-secondary w-full justify-center">
              Wann was passt
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="crm-vs-maklersoftware"
      primaryHref="/signup?entry=crm-vs-maklersoftware-stage"
      primaryLabel="Mit echten Anfragen prüfen"
      secondaryHref="/maklersoftware-vergleich"
      secondaryLabel="Maklersoftware Vergleich"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von CRM, Maklersoftware und branchenspezifischer Arbeitsbasis. Für die endgültige Auswahl sollten Sie immer Ihren echten Büroalltag gegen die Demo prüfen."
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
                Produkt- und Prozessteam mit Fokus auf Makleralltag, Systemwahl und der Trennung von Arbeitsbasis und
                operativem Anfrageprozess.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
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

      <section id="kernunterschied" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Der Kernunterschied zwischen CRM und Maklersoftware</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele Vergleiche tun so, als müsste man nur zwischen zwei Etiketten wählen. In der Praxis geht es um die
              Frage, welche Arbeitsbasis Ihr Büro wirklich braucht und wie viel Immobilienlogik darin bereits enthalten
              sein sollte.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {coreDifference.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="vergleich" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">CRM vs. Maklersoftware im direkten Vergleich</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die Tabelle unten vergleicht keine Marken, sondern zwei Systemlogiken. Genau das hilft bei der
              Kaufentscheidung meist mehr als jeder Funktionszähltest.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={comparisonRows}
            rowKey={(item) => item.topic}
            columns={[
              { key: "topic", label: "Vergleichspunkt", emphasize: true },
              { key: "crm", label: "CRM" },
              { key: "software", label: "Maklersoftware" },
            ]}
          />
        </Container>
      </section>

      <section id="wann-was" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Wann was typischerweise besser passt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {fitScenarios.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="fehler" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Typische Fehlentscheidungen bei CRM vs. Maklersoftware</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {commonMistakes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base p-6">
              <p className="label">Merksatz</p>
              <h2 className="h3 mt-3">Nicht jedes Problem ist ein Systemproblem</h2>
              <p className="helper mt-3">
                Viele Teams suchen ein neues Kernsystem, obwohl die eigentliche Reibung später im Anfrageprozess,
                in Freigaben oder im Nachfassen entsteht.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="advaic" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn die Arbeitsbasis steht, aber der Anfrageprozess weiter bremst</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
                  CRM für Immobilienmakler
                </Link>
                <Link href="/maklersoftware-vergleich" className="btn-secondary">
                  Maklersoftware Vergleich
                </Link>
                <Link href="/advaic-vs-crm-tools" className="btn-secondary">
                  Advaic vs. CRM-Tools
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn die Grundentscheidung noch offen ist</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicNotFit.map((item) => (
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
