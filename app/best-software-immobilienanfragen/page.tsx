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
  "Software für Immobilienanfragen ist keine einzelne Produktkategorie. In der Praxis stehen Makler meist zwischen Maklersoftware, CRM, gemeinsamem Postfach, Sequenzen und spezialisierter Anfrageautomation.",
  "Die wichtigste Unterscheidung ist nicht KI versus keine KI, sondern Datenhaltung versus Ausführung: Wer organisiert Daten, und wer entscheidet über die nächste Nachricht?",
  "Für einen belastbaren Anfragebetrieb zählen vor allem Eingangserkennung, klare Regeln für Automatik oder Freigabe, Qualitätschecks, Verlauf und kontrolliertes Nachfassen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#shortlist", label: "Kategorien im Überblick" },
  { href: "#checkliste", label: "Prüfschema" },
  { href: "#stack", label: "Welche Kombination passt?" },
  { href: "#advaic-fit", label: "Wann Advaic passt" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite kombiniert aktuelle Suchsignale aus der Search Console mit aktuellen Herstellerseiten aus dem Maklersoftware-, CRM- und Anfrage-Umfeld.",
  "Verglichen werden nicht nur Features, sondern die operative Rolle im Makleralltag: Eingang, Zuordnung, Antwort, Freigabe, Verlauf und Nachfassen.",
  "Genannte Anbieter stehen hier als Marktbeispiele für unterschiedliche Kategorien. Die Seite ist keine vollständige Marktübersicht und erhebt keinen pauschalen Anspruch auf einen Testsieger.",
];

const shortlist = [
  {
    category: "Maklersoftware / Immobilien-CRM",
    examples: "onOffice, FLOWFACT, Propstack",
    solves: "Objekte, Kontakte, Pipeline, Portalanbindung, E-Mail-Verwaltung, teamweite Datenhaltung.",
    watch: "Oft stark als Arbeitsbasis, aber nicht automatisch spezialisiert auf Freigabe- und Qualitätslogik pro Anfrage.",
  },
  {
    category: "Allgemeines CRM mit Sequenzen",
    examples: "HubSpot",
    solves: "CRM, Marketing, Sequenzen, Serviceprozesse, Reporting und Steuerung der Pipeline.",
    watch: "Nicht immobilien-spezifisch. Der operative Immobilien-Anfrageprozess muss oft erst modelliert werden.",
  },
  {
    category: "Gemeinsames Postfach / serviceorientierte Systeme",
    examples: "Zendesk",
    solves: "Teamverteilung, Ticketing, Status, Servicekommunikation und kanalübergreifende Unterstützung.",
    watch: "Stark für Inbox-Organisation, aber nicht automatisch auf Objektbezug, Immobilienquellen und Freigabe von Maklerantworten optimiert.",
  },
  {
    category: "Spezialisierte Anfrageausführung",
    examples: "Advaic",
    solves: "Eingang prüfen, Antwortpfad festlegen, Qualitätschecks, Freigabe, Nachfassen und Verlauf im Anfragealltag.",
    watch: "Kein Ersatz für vollständige Objekt- und Dealverwaltung.",
  },
];

const checkItems = [
  {
    title: "1) Eingang",
    text: "Erkennt das System zuverlässig, was eine echte Interessenten-Anfrage ist und was nicht? Ohne saubere Trennung steigen manuelle Klicks trotz Tool.",
  },
  {
    title: "2) Entscheidung",
    text: "Ist sichtbar, wann automatisch geantwortet, wann gestoppt und wann zur Freigabe gelegt wird? Genau hier scheitern viele scheinbar smarte Konfigurationen.",
  },
  {
    title: "3) Qualität",
    text: "Gibt es vor Versand Prüfungen auf Kontext, Vollständigkeit, Ton und Risiko statt nur Textgenerierung?",
  },
  {
    title: "4) Nachvollziehbarkeit",
    text: "Kann Ihr Team später noch sehen, was wann passiert ist und warum? Ohne Verlauf wird Support schnell reaktiv.",
  },
  {
    title: "5) Nachfassen",
    text: "Sind Nachfassungen kontrollierbar, stoppbar und an Antworten oder Meetings gekoppelt? Ohne Stopp-Logik wird Nachfassen schnell störend.",
  },
  {
    title: "6) Einführung",
    text: "Wie schnell kommt ein kleines Maklerteam zu einem sicheren Startprofil? Ein gutes Tool ist nicht nur mächtig, sondern einführbar.",
  },
];

const stackSignals = [
  {
    title: "CRM zuerst",
    text: "Wenn Kontakte, Objekte, Zuständigkeiten und Pipeline noch nicht sauber gepflegt sind, lösen Sie zuerst die Datenbasis. Sonst kippt jede spätere Automation.",
  },
  {
    title: "Anfrage-System zusätzlich",
    text: "Wenn Ihr CRM grundsätzlich passt, aber das Anfragepostfach trotzdem langsam, inkonsistent oder riskant bleibt, ergänzen Sie eine spezialisierte Anfrage-Schicht.",
  },
  {
    title: "Inbox-/Service-Fokus",
    text: "Wenn mehrere Kanäle, Status und Zuständigkeiten dominieren, sind Inbox- oder Service-Systeme wertvoll. Für Immobilienlogik reichen sie oft allein nicht aus.",
  },
];

const advaicFit = [
  "Sie haben wiederkehrende Interessenten-Anfragen, die mit klaren Regeln schneller beantwortet werden könnten.",
  "Ihr Team braucht sichtbare Gründe, warum etwas automatisch gesendet oder in die Freigabe gelegt wurde.",
  "Sie möchten nicht das ganze CRM ersetzen, sondern den operativen Antwortfluss sauberer machen.",
];

const advaicNotFit = [
  "Sie suchen primär ein zentrales System für Objekt-, Kontakt- und Dealverwaltung.",
  "Fast alle Anfragen sind hoch individuell, verhandlungsnah oder konfliktbeladen.",
  "Sie haben noch keine belastbare Daten- und Zuständigkeitslogik im Maklerbüro.",
];

const faqs = [
  {
    question: "Was ist bei Anfrage-Software am wichtigsten?",
    answer:
      "Am wichtigsten ist nicht Textqualität allein, sondern die saubere Kombination aus Eingangserkennung, Entscheidungslogik, Qualitätschecks, Freigabe und Verlauf.",
  },
  {
    question: "Reicht ein allgemeines KI-Schreibtool aus?",
    answer:
      "Für einzelne Textaufgaben kann es reichen. Für einen belastbaren Anfragebetrieb fehlen meist Prozesslogik, Stop-Regeln, Freigabe und Nachvollziehbarkeit.",
  },
  {
    question: "Wann ist Advaic sinnvoller als ein weiterer CRM-Umbau?",
    answer:
      "Wenn Ihr CRM als Datenbasis funktioniert, der Engpass aber weiterhin im Anfragepostfach liegt. Dann ist eine spezialisierte Ausführungsschicht oft der klarere Hebel als ein kompletter Systemwechsel.",
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
    note: "Orientierung für Vergleichsseiten mit Methodik, Differenzierung und Belegen.",
  },
  {
    label: "onOffice: Immobiliensoftware",
    href: "https://onoffice.com/immobiliensoftware/",
    note: "Herstellerseite mit Fokus auf Maklersoftware, CRM, E-Mail-Verwaltung und Anfragenmanager.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Herstellerseite für Portal-Anfragen, automatische Verarbeitung und Exposéversand.",
  },
  {
    label: "Propstack: Makler-CRM für Immobilienunternehmen",
    href: "https://www.propstack.de/immobilienunternehmen/",
    note: "Herstellerseite mit Fokus auf Makler-CRM, Anfragenmanager und digitale Vermarktungsprozesse.",
  },
  {
    label: "HubSpot: Create and edit sequences",
    href: "https://knowledge.hubspot.com/sequences/create-and-edit-sequences",
    note: "Offizielle Dokumentation zu Nachfass-Sequenzen, Sendefenstern und automatischer Steuerung.",
  },
  {
    label: "Zendesk: CRM für Immobilienmakler",
    href: "https://www.zendesk.de/sell/crm/crm-fur-immobilienmakler/",
    note: "Beispiel für service- und inbox-nahe CRM-/Kommunikationsprozesse im Immobilienkontext.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Software für Immobilienanfragen im Vergleich 2026",
  ogTitle: "Software für Immobilienanfragen im Vergleich | Advaic",
  description:
    "Vergleich für Makler: Welche Software eingehende Immobilienanfragen sauber erkennt, Antworten kontrolliert ausführt und wann CRM, Inbox oder Advaic sinnvoll sind.",
  path: "/best-software-immobilienanfragen",
  template: "compare",
  eyebrow: "Vergleich 2026",
  proof: "Für Anfrage-Software zählen Eingang, klare Regeln für Automatik oder Freigabe, Qualitätschecks und Stop-Regeln fürs Nachfassen.",
});

export default function BestSoftwareImmobilienanfragenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Software für Immobilienanfragen im Vergleich 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/best-software-immobilienanfragen`,
        dateModified: "2026-03-21",
        about: ["Software für Immobilienanfragen", "Makler-CRM", "Inbox", "Follow-up", "Freigabe"],
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
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
      kicker="Vergleich 2026"
      title="Software für Immobilienanfragen: Welche Lösungen im Alltag wirklich tragen"
      description="Diese Seite vergleicht nicht nur Features, sondern die operative Rolle von Maklersoftware, CRM, Inbox-Systemen und spezialisierter Anfrageausführung. Genau dort entscheidet sich, ob Ihr Team wirklich schneller und sicherer arbeitet."
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
          <p className="helper mt-2">Direkt zu den Kategorien oder zu der Frage springen, wann Advaic passt.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#shortlist" className="btn-secondary w-full justify-center">
              Kategorien
            </MarketingJumpLink>
            <MarketingJumpLink href="#advaic-fit" className="btn-secondary w-full justify-center">
              Wann Advaic passt
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
      sourcesDescription="Die Quellen unten kombinieren Google-Leitlinien für hilfreiche Vergleichsinhalte mit aktuellen Herstellerseiten aus dem Markt. Für die finale Beschaffung sollten Sie immer Ihre eigenen Anfragefälle in Demos testen."
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

      <section id="shortlist" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Die sinnvolle Auswahl: erst Kategorie verstehen, dann Produkt prüfen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele Makler springen direkt auf eine Produktdemo, obwohl noch nicht klar ist, welche Produktkategorie
              überhaupt den eigenen Engpass löst. Die Tabelle unten trennt deshalb zuerst die Systemrollen.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-[var(--radius)] bg-white ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Kategorie</th>
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Beispiele</th>
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Was sie löst</th>
                  <th className="px-4 py-3 font-semibold text-[var(--text)]">Worauf Sie achten sollten</th>
                </tr>
              </thead>
              <tbody>
                {shortlist.map((item) => (
                  <tr key={item.category} className="border-b border-[var(--border)] align-top">
                    <td className="px-4 py-4 font-medium text-[var(--text)]">{item.category}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{item.examples}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{item.solves}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{item.watch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section id="checkliste" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Das 6-Punkte-Prüfschema für Anfrage-Software</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {checkItems.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="stack" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <h2 className="h2">Welche Kombination typischerweise wann passt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stackSignals.map((item) => (
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
              <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
                CRM für Immobilienmakler
              </Link>
              <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                Anfragenmanagement
              </Link>
              <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
                Nachfass-E-Mails
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section id="advaic-fit" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann Advaic gut passt</h2>
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
              <h2 className="h3">Wann Sie zuerst etwas anderes lösen sollten</h2>
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
        </Container>
      </section>

      <section id="faq" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Häufige Fragen</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
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
