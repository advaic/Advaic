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
  "Ein gutes CRM für Immobilienmakler ist zuerst ein zentrales System für Kontakte, Objekte, Aktivitäten, Aufgaben und Pipeline.",
  "Viele Makler versuchen zusätzlich den kompletten Anfrageprozess im CRM zu lösen. Das kann funktionieren, ist aber nicht automatisch die beste operative Lösung.",
  "Der Kernunterschied liegt zwischen Datenhaltung und Ausführung: Ein CRM organisiert Beziehungen und Vorgänge, ein Anfrage-System steuert Antworten, Freigabe und Nachfassen pro Nachricht.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#was-ein-crm-loest", label: "Was ein CRM lösen soll" },
  { href: "#grenzen", label: "Wo CRM an Grenzen stößt" },
  { href: "#crm-vs-anfrage", label: "CRM vs. Anfrage-System" },
  { href: "#auswahl", label: "Auswahlkriterien" },
  { href: "#advaic-fit", label: "Wann Advaic ergänzt" },
];

const crmJobs = [
  "Kontakte, Eigentümer, Interessenten und Partner zentral pflegen",
  "Objekte, Suchprofile, Aktivitäten und Aufgaben strukturiert verwalten",
  "Pipeline- und Vermarktungsfortschritt nachvollziehbar halten",
  "Teamarbeit, Rechte, Historie und Wiedervorlagen organisieren",
];

const crmLimits = [
  "Ob eine einzelne eingehende E-Mail automatisch beantwortet, gestoppt oder zur Freigabe gelegt werden sollte, ist nicht automatisch eine CRM-Kernstärke.",
  "Je allgemeiner das CRM, desto mehr Prozesslogik muss das Maklerbüro oft selbst modellieren.",
  "Wenn das Postfach der operative Engpass ist, reichen Kontakt- und Vorgangsdaten allein für bessere Reaktionsqualität meist nicht aus.",
];

const comparisonRows = [
  {
    topic: "Kernaufgabe",
    crm: "Kontakte, Objekte, Pipeline, Historie, Teamstruktur.",
    workflow: "Eingehende Anfragen prüfen, Antwortpfad steuern, Qualität sichern, Freigabe und Nachfassen steuern.",
  },
  {
    topic: "Entscheidung pro Nachricht",
    crm: "Je nach System und Einrichtung indirekt oder über selbst gebaute Regeln.",
    workflow: "Direkt als Kernlogik: automatisch senden, zur Freigabe oder ignorieren, jeweils mit Begründung.",
  },
  {
    topic: "Datenpflege",
    crm: "Sehr stark. Saubere Stammdaten sind die Grundlage des Systems.",
    workflow: "Nutzt vorhandene Daten, löst aber primär den operativen Nachrichtenteil.",
  },
  {
    topic: "Freigabe bei Risiko oder Lücken",
    crm: "Nicht automatisch die zentrale Stärke.",
    workflow: "Typischer Kernfall für klare Regeln und manuelle Prüfung.",
  },
  {
    topic: "Einführung",
    crm: "Kann umfangreicher sein, weil Datenmodell, Rechte und Prozesse sauber aufgesetzt werden müssen.",
    workflow: "Kann schlanker starten, wenn der Umfang bewusst auf Anfragebearbeitung begrenzt bleibt.",
  },
];

const selectionCriteria = [
  {
    title: "1) Wie sauber ist Ihr Datenmodell?",
    text: "Ohne Objekt-, Kontakt- und Zuständigkeitslogik bringt auch das beste CRM keinen stabilen Betrieb.",
  },
  {
    title: "2) Wo verlieren Sie heute die meiste Zeit?",
    text: "Bei Wiedervorlagen und Historie spricht viel für CRM-Optimierung. Bei Eingang, Antwort und Freigabe spricht viel für einen ergänzenden Anfrageprozess.",
  },
  {
    title: "3) Wie standardisiert sind Ihre Antworten?",
    text: "Je mehr wiederkehrende Erstantworten es gibt, desto stärker lohnt sich eine spezialisierte operative Logik zusätzlich zum CRM.",
  },
  {
    title: "4) Wer administriert das System?",
    text: "Die beste Auswahl nützt wenig, wenn das Team keinen realistischen Weg in Einrichtung, Training und laufende Pflege hat.",
  },
];

const advaicFit = [
  "Ihr CRM ist im Grundsatz okay, aber der Anfrageeingang bleibt trotzdem langsam oder inkonsistent.",
  "Sie möchten Auto-Senden nur bei sauberen Fällen erlauben und Konflikt-, Lücken- oder Ausnahmefälle bewusst in die Freigabe legen.",
  "Sie wollen keine komplette CRM-Migration erzwingen, nur weil der operative Antwortprozess hakt.",
];

const crmFirst = [
  "Sie arbeiten noch mit Tabellen, Einzelsystemen oder verstreuten Postfächern ohne zentrale Historie.",
  "Kontakte, Objekte und Zuständigkeiten sind im Büro nicht konsistent gepflegt.",
  "Das größere Problem liegt in Transparenz, Aufgabensteuerung und Deal- oder Objektverwaltung, nicht in der Antwortlogik einzelner Anfragen.",
];

const sources = [
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://onoffice.com/immobiliensoftware/",
    note: "Offizielle Herstellerseite für Immobilienverwaltung, CRM und Portalprozesse.",
  },
  {
    label: "FLOWFACT: Kontaktverwaltung",
    href: "https://flowfact.de/kontaktverwaltung/",
    note: "Offizielle Herstellerseite für zentrale Kontakt- und Aktivitätsverwaltung im Maklerkontext.",
  },
  {
    label: "Propstack: Immobilien-CRM",
    href: "https://www.propstack.de/",
    note: "Offizielle Herstellerseite für CRM, mobile Nutzung und digitale Standardprozesse.",
  },
  {
    label: "HubSpot: CRM-Software für Immobilienmakler",
    href: "https://www.hubspot.de/products/crm/real-estate",
    note: "Beispiel für eine allgemeinere CRM-Plattform mit Marketing-, Service- und Vertriebsfokus.",
  },
  {
    label: "Zendesk: CRM für Immobilienmakler",
    href: "https://www.zendesk.de/sell/crm/crm-fur-immobilienmakler/",
    note: "Beispiel für eine stärker kommunikations- und servicebezogene CRM-Perspektive.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "CRM für Immobilienmakler: Auswahlhilfe 2026",
  ogTitle: "CRM für Immobilienmakler | Advaic",
  description:
    "Leitfaden für Makler: Was ein CRM wirklich lösen soll, wo CRM an operative Grenzen stößt und wann spezialisierte Anfrage-Logik wie Advaic zusätzlich sinnvoll wird.",
  path: "/crm-fuer-immobilienmakler",
  template: "guide",
  eyebrow: "CRM-Leitfaden",
  proof: "CRM organisiert Daten und Beziehungen. Anfrageausführung ist eine eigene operative Schicht.",
});

export default function CrmFuerImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const faqItems = [
    {
      question: "Brauchen Immobilienmakler überhaupt ein CRM?",
      answer:
        "Sobald Kontakte, Objekte, Aktivitäten und Wiedervorlagen teamweit gesteuert werden müssen, ist ein CRM meist sinnvoll. Es bildet die Daten- und Prozessbasis für den Makleralltag.",
    },
    {
      question: "Reicht ein CRM auch für eingehende Anfragen?",
      answer:
        "Teilweise ja, aber nicht automatisch optimal. Ein CRM kann Anfragen dokumentieren, doch die operative Entscheidung über Auto, Freigabe und Qualitätschecks pro Nachricht ist oft eine eigene Stärke spezialisierter Systeme.",
    },
    {
      question: "Wann ergänzt Advaic ein CRM sinnvoll?",
      answer:
        "Wenn das CRM als zentrale Datenbasis funktioniert, aber der Anfrageeingang trotzdem langsam, inkonsistent oder schwer kontrollierbar bleibt. Dann ergänzt Advaic den operativen Antwortfluss.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "CRM für Immobilienmakler",
        inLanguage: "de-DE",
        dateModified: "2026-03-21",
        mainEntityOfPage: `${siteUrl}/crm-fuer-immobilienmakler`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["CRM für Immobilienmakler", "Immobiliensoftware", "Anfrageprozesse", "Maklerbetrieb"],
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
      kicker="CRM-Leitfaden"
      title="CRM für Immobilienmakler: Was ein CRM wirklich lösen soll"
      description="Diese Seite trennt bewusst zwischen CRM als zentraler Datenbasis und operativer Anfrageausführung. Genau an dieser Grenze entstehen im Makleralltag viele Fehlentscheidungen bei der Software-Auswahl."
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
          <p className="helper mt-2">Direkt zur Tabelle CRM vs. Anfrage-System oder zu der Frage springen, wann Advaic passt.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#crm-vs-anfrage" className="btn-secondary w-full justify-center">
              Vergleich öffnen
            </MarketingJumpLink>
            <MarketingJumpLink href="#advaic-fit" className="btn-secondary w-full justify-center">
              Advaic ergänzt
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="crm-fuer-immobilienmakler"
      primaryHref="/signup?entry=crm-stage"
      primaryLabel="Mit echten Anfragen prüfen"
      secondaryHref="/advaic-vs-crm-tools"
      secondaryLabel="Advaic vs. CRM"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen zeigen aktuelle Herstellerpositionierungen im CRM-/Maklersoftware-Markt. Für die Auswahl sollten Sie zusätzlich mit echten Objekt- und Anfragefällen testen."
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

      <section id="was-ein-crm-loest" className="marketing-section-clear py-14 md:py-18">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <p className="label">Autor & Stand</p>
              <h2 className="h3 mt-3">Advaic Redaktion</h2>
              <p className="helper mt-3">
                Produkt- und Prozessteam mit Fokus auf Anfrageprozesse, CRM-Abgrenzung und operative Einführung in
                Maklerbüros.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Was ein CRM lösen soll</p>
              <h2 className="h3 mt-3">Die Grundjobs eines guten Makler-CRM</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {crmJobs.map((item) => (
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

      <section id="grenzen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Wo CRM im Anfragebetrieb oft an Grenzen stößt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {crmLimits.map((item) => (
              <article key={item} className="card-base p-6">
                <p className="helper">{item}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="crm-vs-anfrage" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">CRM vs. Anfrage-System: Zwei Ebenen, zwei Jobs</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele Makler versuchen beide Ebenen in einer einzigen Kaufentscheidung zu lösen. In der Praxis hilft es,
              sauber zwischen Datenhaltung und operativer Nachrichtenausführung zu unterscheiden.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-[var(--radius)] bg-white ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Vergleichspunkt</th>
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">CRM</th>
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Anfrage-System</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.topic} className="border-b border-[var(--border)] align-top">
                    <td className="px-4 py-4 font-medium text-[var(--text)]">{row.topic}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{row.crm}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{row.workflow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section id="auswahl" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <h2 className="h2">Vier Auswahlkriterien vor jeder CRM-Entscheidung</h2>
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

      <section id="advaic-fit" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann Advaic ein CRM sinnvoll ergänzt</h2>
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
              <h2 className="h3">Wann CRM zuerst die richtige Baustelle ist</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {crmFirst.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h2 className="h3">Weiterlesen</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/maklersoftware-vergleich" className="btn-secondary">
                Maklersoftware Vergleich
              </Link>
              <Link href="/advaic-vs-crm-tools" className="btn-secondary">
                Advaic vs. CRM
              </Link>
              <Link href="/best-ai-tools-immobilienmakler" className="btn-secondary">
                KI-Tools Vergleich
              </Link>
              <Link href="/integrationen" className="btn-secondary">
                Integrationen
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section className="marketing-section-clear py-20 md:py-28">
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
