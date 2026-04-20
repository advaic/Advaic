import type { Metadata } from "next";
import Link from "next/link";
import { CheckCheck, CircleOff, ShieldCheck, TriangleAlert, Waypoints, Workflow } from "lucide-react";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "Ein guter Makler-Autopilot beantwortet nicht einfach möglichst viele E-Mails. Er beschleunigt nur die sauber prüfbaren Standardfälle.",
  "Der eigentliche Qualitätsunterschied liegt nicht im Textentwurf, sondern in der Entscheidungslogik davor: Was darf automatisch raus, was gehört in die Freigabe und was wird bewusst ignoriert?",
  "Belastbar wird der Betrieb erst dann, wenn Regeln, Qualitätschecks, Freigabe und Nachsteuerung als zusammenhängender Prozess gedacht werden und nicht als einzelne Oberfläche.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#prinzip", label: "Autopilot-Prinzip" },
  { href: "#voraussetzungen", label: "Voraussetzungen" },
  { href: "#entscheidungswege", label: "Entscheidungswege" },
  { href: "#betriebsmodell", label: "Betriebsmodell" },
  { href: "#warnzeichen", label: "Warnzeichen" },
  { href: "#detailseiten", label: "Detailseiten" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Primärquellen zu Makler-Anfragenmanagement, Portalanfragen, Reaktionsgeschwindigkeit und risikobewusster Automatisierung mit Advaics Sicht auf den operativen Anfrageeingang.",
  "Bewertet wird nicht nur, ob ein System Texte generieren kann, sondern ob der Gesamtpfad im Alltag trägt: Eingang erkennen, Relevanz prüfen, Risiko stoppen, Freigaben bearbeiten und Entscheidungen dokumentieren.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist kein maximaler Auto-Anteil, sondern ein stabiler Autopilot, der Standardfälle schneller macht und Sonderfälle bewusst aus dem Versand hält.",
];

const principles = [
  {
    title: "Er erkennt erst Relevanz, dann Antwortbedarf",
    text: "Ein belastbarer Autopilot trennt echte Interessenten-Anfragen sauber von Rundmails, Systemhinweisen, Spam und sonstigen Nachrichten ohne operativen Antwortzweck.",
    Icon: Waypoints,
  },
  {
    title: "Er prüft vor dem Versand statt danach",
    text: "Objektbezug, Vollständigkeit, Ton, Risiko und nächste Schritte werden vor dem Versand geprüft. Gute Sprache allein reicht nicht.",
    Icon: ShieldCheck,
  },
  {
    title: "Er behandelt Freigabe als festen Pfad",
    text: "Freigabe ist kein Notausgang. Sie ist der normale Prüfpfad für unklare, sensible oder konfliktanfällige Fälle.",
    Icon: Workflow,
  },
  {
    title: "Er hält Entscheidungen nachvollziehbar",
    text: "Ein Team muss später sehen können, warum etwas automatisch gesendet, gestoppt oder ignoriert wurde. Erst dann ist der Prozess steuerbar.",
    Icon: CheckCheck,
  },
];

const prerequisites = [
  "Klare Regeln, welche Anfragearten überhaupt automatisch beantwortet werden dürfen",
  "Sauberer Objekt- und Kontextbezug statt bloßer Textgenerierung ohne belastbare Grundlage",
  "Definierte Freigabefälle, Zuständigkeiten und Zielzeiten für die Prüfung",
  "Sichtbare Gründe für Stopp, Freigabe und Ignorieren, damit Regeln später nachgeschärft werden können",
];

const decisionPaths = [
  {
    title: "Automatisch senden",
    text: "Nur bei klarer relevanter Anfrage, sauberem Objektbezug, ausreichenden Angaben und bestandenen Qualitätsprüfungen.",
    Icon: CheckCheck,
  },
  {
    title: "Zur Freigabe",
    text: "Bei unklarem Kontext, fehlenden Angaben, Beschwerden, Sonderwünschen oder heiklen Aussagen, die bewusst manuell entschieden werden sollten.",
    Icon: TriangleAlert,
  },
  {
    title: "Ignorieren",
    text: "Bei Spam, Newslettern, Systemmails oder sonstigen Nachrichten, für die es keinen operativen Antwortpfad geben sollte.",
    Icon: CircleOff,
  },
];

const operatingModel = [
  {
    title: "Regelwerk",
    text: "Definiert die Signale für automatischen Versand, Freigabe und Ignorieren. Ohne diese Ebene bleibt der Autopilot zufällig.",
    href: "/autopilot-regeln",
    cta: "Regelwerk vertiefen",
  },
  {
    title: "Qualitätsprüfungen",
    text: "Sichern vor dem Versand Relevanz, Kontext, Vollständigkeit, Ton, Risiko und Lesbarkeit. Genau hier trennt sich schnell von vorschnell.",
    href: "/qualitaetschecks",
    cta: "Qualitätschecks lesen",
  },
  {
    title: "Freigabe-Inbox",
    text: "Ist die Arbeitsansicht für Fälle, die bewusst nicht automatisch versendet werden. Gründe, Priorität und Entscheidung müssen dort sofort sichtbar sein.",
    href: "/freigabe-inbox",
    cta: "Freigabe-Inbox ansehen",
  },
  {
    title: "Freigabe-Workflow",
    text: "Beschreibt den gesamten Prüfpfad von der Erkennung bis zur dokumentierten Entscheidung. Er hält den operativen Alltag zusammen.",
    href: "/makler-freigabe-workflow",
    cta: "Workflow ansehen",
  },
];

const warningSigns = [
  "Der Autopilot kann nicht klar erklären, warum eine Nachricht automatisch gesendet oder gestoppt wurde.",
  "Beschwerden, Preisverhandlungen oder unklare Fälle laufen ohne bewusste Freigabe in den Versandpfad.",
  "Fast alles landet in der Freigabe-Inbox, weil Regeln und Pflichtsignale zu grob formuliert sind.",
  "Der Start ist zu aggressiv auf Auto-Anteil optimiert, bevor Freigabegründe und Fehlentscheidungen sauber ausgewertet werden.",
];

const detailPages = [
  {
    title: "Autopilot-Regeln",
    text: "Die konkrete Logik hinter automatisch senden, Freigabe und Ignorieren.",
    href: "/autopilot-regeln",
  },
  {
    title: "Qualitätschecks",
    text: "Die Pflichtprüfungen vor dem Versand und die typischen Stoppgründe.",
    href: "/qualitaetschecks",
  },
  {
    title: "Freigabe-Inbox",
    text: "Wie prüfbedürftige Fälle priorisiert, entschieden und dokumentiert werden.",
    href: "/freigabe-inbox",
  },
  {
    title: "Makler-Freigabe-Workflow",
    text: "Der komplette Prüfpfad vom Eingang bis zur finalen Entscheidung.",
    href: "/makler-freigabe-workflow",
  },
  {
    title: "Manuell vs. Advaic",
    text: "Wann reine Handarbeit noch sinnvoll ist und ab wann sie operativ kippt.",
    href: "/manuell-vs-advaic",
  },
  {
    title: "Follow-up-Logik",
    text: "Wie Nachfassen regelbasiert statt nach Bauchgefühl gesteuert werden sollte.",
    href: "/follow-up-logik",
  },
];

const advaicFit = [
  "Sie wollen einen Autopiloten, der auf klaren Regeln, Prüfungen und Freigaben beruht statt auf bloßer Textautomatik.",
  "Ihr Team bearbeitet viele ähnliche Standardfälle, möchte aber Beschwerden, Konflikte und unklare Anfragen bewusst beim Menschen halten.",
  "Sie brauchen einen nachvollziehbaren Betrieb, in dem Freigabegründe, Stopps und Korrekturen sichtbar bleiben und zur Regelpflege genutzt werden.",
];

const advaicNotFit = [
  "Sie erwarten, dass auch bei unklarem Objektbezug oder fehlenden Angaben automatisch gesendet wird.",
  "Es gibt noch keine klare Zuständigkeit für Freigaben, Nachsteuerung und laufende Regelpflege.",
  "Sie suchen zuerst ein CRM für Kontakte, Objekte und Stammdaten und noch nicht primär einen operativen Antwortpfad für den Anfrageeingang.",
];

const faqItems = [
  {
    question: "Was ist der wichtigste Unterschied zwischen einem guten und einem schwachen Autopilot?",
    answer:
      "Ein guter Autopilot trifft vor dem Versand eine saubere Entscheidung. Er prüft Relevanz, Kontext, Vollständigkeit und Risiko, statt nur schnell einen Text zu formulieren.",
  },
  {
    question: "Soll ein Autopilot möglichst viele Fälle automatisch beantworten?",
    answer:
      "Nein. Für Makler ist nicht die größte Automationsquote entscheidend, sondern ob klare Standardfälle schneller laufen und sensible oder unklare Fälle sauber gestoppt werden.",
  },
  {
    question: "Wann ist Freigabe kein Zeichen von Schwäche?",
    answer:
      "Immer dann, wenn Objektbezug, Pflichtangaben, Ton oder Risiko nicht sauber genug sind. Genau dort ist Freigabe die kontrollierte Schutzschicht und nicht bloß eine Notlösung.",
  },
  {
    question: "Was sollte vor einem Pilotstart unbedingt geklärt sein?",
    answer:
      "Welche Fälle automatisch beantwortet werden dürfen, welche in die Freigabe müssen, wer diese Freigaben prüft und wie Gründe für Stopp oder Korrektur später ausgewertet werden.",
  },
];

const sources = [
  {
    label: "onOffice Enterprise Hilfe: Anfragenmanager einrichten",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/anfragenmanager-einrichten/",
    note: "Offizielle Quelle zur Einrichtung eines geregelten Makler-Anfrageprozesses mit definierten Zuständigkeiten und Bearbeitungswegen.",
  },
  {
    label: "onOffice Enterprise Hilfe: Einstellungen im Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Offizielle Quelle zur operativen Steuerung, Priorisierung und Konfiguration im Anfrageeingang.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite zur strukturierten Bearbeitung von Portalanfragen im Makleralltag.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Offizielle Hilfeseite zur Einordnung von Anfragearten und deren Bedeutung im operativen Prozess.",
  },
  {
    label: "Harvard Business Review: The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum schnelle und passende Reaktion wirtschaftlich relevant ist, wenn die Eingangslogik sauber funktioniert.",
  },
  {
    label: "NIST: AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare und risikobewusste Automatisierung mit menschlicher Aufsicht.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Autopilot für Immobilienmakler 2026: Was ein guter E-Mail-Autopilot leisten sollte",
  ogTitle: "Autopilot für Immobilienmakler 2026 | Advaic",
  description:
    "Leitfaden für Makler: Wie ein E-Mail-Autopilot zwischen Versand, Freigabe und Ignorieren unterscheidet, welche Voraussetzungen nötig sind und woran man einen belastbaren Betrieb erkennt.",
  path: "/autopilot",
  template: "guide",
  eyebrow: "Leitfaden Autopilot",
  proof:
    "Ein brauchbarer Makler-Autopilot beschleunigt nur klare Standardfälle und hält unklare, sensible oder irrelevante Nachrichten bewusst aus dem Versand.",
});

export default function AutopilotPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Autopilot für Immobilienmakler 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/autopilot`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Autopilot", "Immobilienmakler", "Anfragenmanagement", "Freigabe", "Qualitätschecks"],
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
        { name: "Autopilot", path: "/autopilot" },
      ]}
      schema={schema}
      kicker="Leitfaden Autopilot"
      title="Autopilot für Immobilienmakler: Was ein guter E-Mail-Autopilot wirklich leisten sollte"
      description="Ein brauchbarer Autopilot macht den Makleralltag nicht durch möglichst viele Antworten besser, sondern durch eine saubere Entscheidung davor. Genau dort entstehen Tempo, Kontrolle und Vertrauen."
      actions={
        <>
          <Link href="/autopilot-regeln" className="btn-secondary">
            Regeln im Detail
          </Link>
          <Link href="/signup?entry=autopilot" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu Entscheidungswegen oder zu den Detailseiten springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#entscheidungswege" className="btn-secondary w-full justify-center">
              Entscheidungswege
            </MarketingJumpLink>
            <MarketingJumpLink href="#detailseiten" className="btn-secondary w-full justify-center">
              Detailseiten
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="orientierung"
      stageContext="autopilot"
      primaryHref="/signup?entry=autopilot-stage"
      primaryLabel="Autopilot mit echten Fällen prüfen"
      secondaryHref="/autopilot-regeln"
      secondaryLabel="Regellogik ansehen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Makler-Anfragenmanagement, Reaktionsgeschwindigkeit und kontrollierter Automatisierung. Für die konkrete Umsetzung sollten Sie immer Ihre echten Anfragearten, Freigabegründe und Bearbeitungszeiten mitprüfen."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Qualitätsprüfung, Freigaben und kontrollierte
                Versandentscheidungen im Makleralltag.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite zu lesen ist</h2>
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

      <section id="prinzip" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Ein guter Autopilot ist vor allem eine saubere Vorentscheidung</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Wer nur auf den Antworttext schaut, verpasst den eigentlichen Kern. Der Qualitätsgewinn entsteht in der
              Reihenfolge davor: erkennen, einordnen, prüfen, stoppen oder gezielt versenden.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {principles.map((item) => (
              <article key={item.title} className="card-base p-6">
                <item.Icon className="h-5 w-5 text-[var(--gold)]" />
                <h3 className="mt-3 text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="voraussetzungen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Was vor einem Pilotstart geklärt sein sollte</h2>
              <p className="helper mt-3">
                Ein Autopilot scheitert selten an fehlender Textqualität, sondern meist an unklaren Grenzen. Deshalb
                sollte vor dem Start feststehen, welche Fälle sauber in den Standardpfad gehören und welche bewusst
                nicht.
              </p>
              <ul className="mt-5 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
                {prerequisites.map((item) => (
                  <li key={item} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base p-6">
              <p className="label">Grundsatz</p>
              <h2 className="h3 mt-3">Erst enger starten, dann bewusst erweitern</h2>
              <p className="helper mt-3">
                Ein stabiler Startkorridor mit klaren Standardfällen ist im Makleralltag fast immer besser als ein
                früher Vollautomatismus mit unscharfen Grenzen.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="entscheidungswege" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Die drei Entscheidungswege im Alltag</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Ein brauchbarer Autopilot braucht nicht dutzende Status. Er braucht drei klar getrennte Wege, die Teams
              sofort verstehen und später sauber prüfen können.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {decisionPaths.map((item) => (
              <article key={item.title} className="card-base card-hover relative overflow-hidden p-6">
                <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
                <item.Icon className="h-5 w-5 text-[var(--gold)]" />
                <h3 className="h3 mt-3">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="betriebsmodell" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Woraus ein belastbarer Autopilot-Betrieb tatsächlich besteht</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die eigentliche Stärke entsteht nicht aus einer einzelnen Ansicht, sondern aus dem Zusammenspiel von
              Regeln, Prüfungen, Freigabe und geordneter Nachsteuerung.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {operatingModel.map((item) => (
              <article key={item.title} className="card-base card-hover p-6 md:p-8">
                <h3 className="h3">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-5">
                  {item.cta}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="warnzeichen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Warnzeichen im Auswahl- und Pilotprozess</h2>
              <p className="helper mt-3">
                Viele Autopilot-Projekte wirken auf dem Papier überzeugend und kippen erst im Alltag. Die folgenden
                Signale sind meist früher sichtbar, als Teams denken.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {warningSigns.map((item) => (
                  <article key={item} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="card-base p-6">
              <p className="label">Warnsignal</p>
              <h2 className="h3 mt-3">Hohe Auto-Quote kann trotzdem ein schlechtes Zeichen sein</h2>
              <p className="helper mt-3">
                Wenn die Quote nur deshalb gut aussieht, weil Regeln unklare oder heikle Fälle nicht sauber stoppen,
                entsteht eine trügerische Form von Effizienz.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="detailseiten" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Die wichtigsten Detailseiten rund um den Autopilot</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Diese Seite ist bewusst der Überblick. Für operative Entscheidungen lohnt sich danach fast immer der
              Sprung in die vertiefenden Seiten.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {detailPages.map((item) => (
              <article key={item.href} className="card-base card-hover p-6">
                <h3 className="h3">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-5">
                  Detailseite öffnen
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="advaic" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn Autopilot als kontrollierter Prozess gedacht wird</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/autopilot-regeln" className="btn-secondary">
                  Autopilot-Regeln
                </Link>
                <Link href="/qualitaetschecks" className="btn-secondary">
                  Qualitätschecks
                </Link>
                <Link href="/freigabe-inbox" className="btn-secondary">
                  Freigabe-Inbox
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn Grenzen bewusst unscharf bleiben sollen</h2>
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
