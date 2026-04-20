import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "Anfragenmanagement beginnt nicht mit der Antwort, sondern mit der sauberen Trennung von relevanten Interessenten-Anfragen, Dubletten, Newslettern und internem Rauschen.",
  "Die besten Maklerprozesse kombinieren fünf Dinge: schnelle Einordnung, klare Zuständigkeit, nachvollziehbare Antwortpfade, sichtbare Freigabegründe und kontrolliertes Nachfassen.",
  "Die meisten Teams verlieren Zeit nicht an komplizierten Ausnahmefällen, sondern an wiederkehrenden Standardanfragen ohne saubere Systemlogik und ohne klare Eigentümerschaft.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#grundregeln", label: "Grundregeln" },
  { href: "#prozess", label: "Prozess" },
  { href: "#rollen", label: "Rollen" },
  { href: "#engpaesse", label: "Engpässe" },
  { href: "#kpis", label: "Kennzahlen" },
  { href: "#rollout", label: "Einführung" },
  { href: "#automation", label: "Automatisierung" },
  { href: "#advaic-fit", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Herstellerinformationen zu Anfragenverarbeitung und CRM mit Advaics operativer Sicht auf Anfrageeingang, Freigabe und Nachfassen.",
  "Die Empfehlung ist bewusst am Ablauf orientiert: nicht nur Toolauswahl, sondern wie Maklerbüros Eingang, Antwort, Freigabe und Nachverfolgung tatsächlich organisieren.",
  "Die Herstellerquellen unten sind Markt- und Prozessbeispiele, keine pauschale Rangliste. Entscheidend ist am Ende immer Ihr echter Alltag mit realen Anfragen.",
];

const operatingPrinciples = [
  {
    title: "Ein Eingang, nicht fünf Nebenkanäle",
    text: "Portale, Website, E-Mail und Weiterleitungen müssen in einem sichtbaren Arbeitsfluss landen. Sonst ist schon der Start des Prozesses unzuverlässig.",
  },
  {
    title: "Klare Zuständigkeit pro Fall",
    text: "Jede Anfrage braucht einen verantwortlichen Owner. Ohne klares Eigentum an nächstem Schritt, Objekt und Kontakt entstehen Verzögerungen und doppelte Arbeit.",
  },
  {
    title: "Antwortpfad statt Bauchgefühl",
    text: "Das Team muss sehen, wann automatisch gesendet wird, wann Freigabe nötig ist und wann bewusst nicht geantwortet werden sollte.",
  },
  {
    title: "Stoppsignale sind Teil des Prozesses",
    text: "Antwort, Termin, Rückzug oder Konfliktsignal müssen Nachfassen und Folgeschritte sauber stoppen. Genau das fehlt in vielen improvisierten Setups.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Eingang sammeln",
    text: "Portale, Website, E-Mail, Formulare und manuelle Weiterleitungen müssen an einer Stelle sichtbar werden.",
  },
  {
    step: "02",
    title: "Relevanz prüfen",
    text: "Das System muss echte Interessenten-Anfragen von Spam, Newslettern, Dubletten und internem Rauschen trennen.",
  },
  {
    step: "03",
    title: "Kontext zuordnen",
    text: "Objektbezug, Quelle, Kontakt, Historie und Zuständigkeit sollten sofort erkennbar sein.",
  },
  {
    step: "04",
    title: "Antwortpfad wählen",
    text: "Automatisch senden, zur Freigabe legen, manuell bearbeiten oder bewusst nicht reagieren. Genau diese Entscheidung ist der operative Kern.",
  },
  {
    step: "05",
    title: "Verlauf sichern",
    text: "Jede Aktion braucht Status, Zeitstempel und eine nachvollziehbare Begründung. Sonst wird das Team im Nachgang blind.",
  },
  {
    step: "06",
    title: "Nachfassen oder stoppen",
    text: "Nachfassen darf nur laufen, wenn keine Antwort vorliegt und kein Stoppsignal aktiv ist. Ansonsten wird der Prozess störend oder riskant.",
  },
];

const roleModel = [
  {
    title: "Eingangs-Owner",
    text: "Verantwortet die erste Einordnung: relevante Anfrage, Dublette, Ausnahmefall oder irrelevante Nachricht.",
  },
  {
    title: "Objekt- und Kontext-Owner",
    text: "Sichert, dass Objektbezug, Zuständigkeit und Kontaktinformationen sauber zugeordnet sind.",
  },
  {
    title: "Freigabe-Owner",
    text: "Übernimmt Fälle mit fehlenden Angaben, sensibler Kommunikation, Konflikten oder unklarem Antwortpfad.",
  },
  {
    title: "Nachfass-Owner",
    text: "Überwacht, ob Folgekommunikation läuft, stoppt oder manuell übernommen werden muss.",
  },
];

const bottlenecks = [
  {
    title: "Zu viele Anfragen im selben Postfach",
    text: "Wenn Portalanfragen, interne Mails und Systemnachrichten nebeneinander liegen, kostet schon die erste Sortierung zu viel Zeit.",
  },
  {
    title: "Keine saubere Quellen- und Objektzuordnung",
    text: "Fehlt der Objektbezug oder kommt die Anfrage nicht sauber aus Portal, API oder XML im System an, wird der Rest des Prozesses sofort brüchig.",
  },
  {
    title: "Antworten ohne sauberen Kontext",
    text: "Fehlt Pflichtinformation, Historie oder Zuständigkeit, steigt das Risiko unvollständiger oder falscher Antworten.",
  },
  {
    title: "Keine klare Stop-Logik",
    text: "Ohne Freigabe- und Stopregeln laufen Nachrichten oder Nachfassungen weiter, obwohl sich der Kontext längst geändert hat.",
  },
];

const kpis = [
  {
    title: "Erstreaktionszeit",
    text: "Misst, wie schnell neue Interessenten-Anfragen überhaupt im Prozess ankommen und beantwortet oder eingeordnet werden.",
  },
  {
    title: "Klassifizierungsquote",
    text: "Zeigt, wie viele Fälle sauber als relevante Anfrage, Ausnahme oder irrelevante Nachricht erkannt werden, statt später nachsortiert zu werden.",
  },
  {
    title: "Freigabequote",
    text: "Macht sichtbar, wie viele Fälle bewusst manuell geprüft werden müssen. Zu hoch heißt oft: Regelwerk oder Datenbasis sind noch schwach.",
  },
  {
    title: "Manuelle Minuten pro Standardfall",
    text: "Zeigt, ob Standardanfragen operativ wirklich leichter geworden sind oder ob das Team weiter versteckt improvisiert.",
  },
  {
    title: "Antwort- und Stopprate im Nachfassen",
    text: "Misst, ob Folgekommunikation sinnvoll weiterläuft oder unnötig aktiv bleibt, obwohl bereits geantwortet oder terminiert wurde.",
  },
];

const rolloutSteps = [
  {
    title: "Woche 1: Eingang sichtbar machen",
    text: "Postfächer, Quellen, Objektzuordnung und bestehende Ausnahmen prüfen. Ziel ist kein Vollausbau, sondern Transparenz über den Ist-Zustand.",
  },
  {
    title: "Woche 2: Standardfälle definieren",
    text: "Die häufigsten Anfragearten mit klaren Antwortpfaden festlegen: automatisch, mit Freigabe oder bewusst manuell.",
  },
  {
    title: "Woche 3: Freigaben und Stoppsignale schärfen",
    text: "Fehlende Angaben, Konflikte, Dubletten, Antworten und Termine als klare Stop- oder Freigabesignale im Prozess abbilden.",
  },
  {
    title: "Woche 4: KPIs beobachten und nachziehen",
    text: "Erstreaktion, Freigabequote und manuellen Aufwand messen. Erst danach sollte das Team mehr Fälle kontrolliert automatisieren.",
  },
];

const automationScopes = [
  {
    title: "Gut automatisierbar",
    text: "Wiederkehrende Erstantworten zu Verfügbarkeit, Unterlagen, Besichtigung und nächsten Standardschritten.",
  },
  {
    title: "Nur mit Freigabe",
    text: "Fälle mit unklarem Objektbezug, fehlenden Pflichtangaben, Beschwerden, Konflikten oder Ausnahmesituationen.",
  },
  {
    title: "Bewusst manuell halten",
    text: "Preisverhandlungen, Konfliktsituationen, Sonderwünsche und rechtlich oder reputativ sensible Kommunikation.",
  },
];

const advaicFit = [
  "Wenn das Team viele gleichartige Interessenten-Anfragen bearbeiten muss und Reaktionsqualität oder Antwortgeschwindigkeit unter Last schwanken.",
  "Wenn klar dokumentiert werden soll, warum eine Nachricht automatisch gesendet oder bewusst in die Freigabe gelegt wurde.",
  "Wenn das Maklerbüro kontrolliert von manueller Arbeit zu einem vorsichtigen Start wechseln will, statt Vollautomatik blind auszurollen.",
];

const advaicNotFit = [
  "Wenn Kontakte, Objekte und Zuständigkeiten noch nicht sauber gepflegt sind und zuerst die Arbeitsbasis fehlt.",
  "Wenn fast alle Anfragen hoch individuell, konfliktbeladen oder verhandlungsnah sind.",
  "Wenn Sie primär ein zentrales Makler-CRM suchen und nicht zuerst eine operative Schicht für den Anfrageprozess.",
];

const faqItems = [
  {
    question: "Ist Anfragenmanagement dasselbe wie CRM?",
    answer:
      "Nicht ganz. CRM organisiert Kontakte, Objekte und Historie. Anfragenmanagement beschreibt den operativen Ablauf vom Eingang bis zur Antwort, Freigabe und Nachverfolgung.",
  },
  {
    question: "Was ist die wichtigste Kennzahl im Anfrageprozess?",
    answer:
      "Für viele Teams ist die Erstreaktionszeit die sichtbarste Kennzahl. Operativ genauso wichtig sind aber Klassifizierungsqualität, Freigabequote und manuelle Minuten pro Standardanfrage.",
  },
  {
    question: "Wann lohnt sich Automatisierung im Anfragenmanagement?",
    answer:
      "Sobald viele ähnliche Standardanfragen auftreten und klare Regeln definierbar sind. Ohne wiederkehrende Muster oder ohne saubere Datenbasis bringt Automatisierung wenig.",
  },
  {
    question: "Wann hilft Advaic im Anfragenmanagement konkret?",
    answer:
      "Wenn die Arbeitsbasis grundsätzlich steht, der Engpass aber weiter im Anfrageeingang, in der Freigabe oder im kontrollierten Nachfassen liegt. Dann ergänzt Advaic die operative Ausführungsschicht.",
  },
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Referenz für die operative Bedeutung schneller Reaktion auf digitale Anfragen.",
  },
  {
    label: "onOffice Hilfe: Einstellungen Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Praxisnahe Herstellerquelle zu Bedingungen, Ausnahmen, manueller Weiterbearbeitung und Wartezeiten im Anfrageprozess.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Quelle zu Portal-Erkennung, Kontaktanlage, Objektverknüpfung, Statussichtbarkeit und automatischem Exposéversand.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Praxisnahe Herstellerquelle zu Quellen, E-Mail-Eingang, XML-Erkennung und Besonderheiten bei Portalanfragen.",
  },
  {
    label: "HubSpot: Unenroll contacts from a sequence",
    href: "https://knowledge.hubspot.com/sequences/unenroll-from-sequence",
    note: "Offizielle Dokumentation zu Stoppsignalen und automatischer Beendigung laufender Nachfass-Sequenzen.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare Automationsentscheidungen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Anfragenmanagement für Immobilienmakler 2026",
  ogTitle: "Anfragenmanagement für Immobilienmakler 2026 | Advaic",
  description:
    "Praxisleitfaden für Makler: So organisieren Sie Anfragenmanagement von Eingang bis Nachfassen mit klaren Rollen, Kennzahlen, Freigabelogik und Einführungsplan.",
  path: "/anfragenmanagement-immobilienmakler",
  template: "guide",
  eyebrow: "Anfragenmanagement",
  proof: "Gutes Anfragenmanagement trennt Eingang, Antwortpfad, Freigabe und Nachfassen sauber.",
});

export default function AnfragenmanagementImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Anfragenmanagement für Immobilienmakler 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/anfragenmanagement-immobilienmakler`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Anfragenmanagement", "Immobilienmakler", "Antwortprozesse", "Freigabe", "Follow-up"],
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
        { name: "Anfragenmanagement für Immobilienmakler", path: "/anfragenmanagement-immobilienmakler" },
      ]}
      schema={schema}
      kicker="Anfragenmanagement"
      title="Anfragenmanagement für Immobilienmakler 2026: So läuft der Prozess sauber"
      description="Diese Seite zeigt, wie Makler eingehende Anfragen operativ sauber organisieren: Eingang bündeln, Relevanz prüfen, Zuständigkeit klären, Antwortpfad wählen, Verlauf dokumentieren und Nachfassen kontrolliert steuern."
      actions={
        <>
          <Link href="/best-software-immobilienanfragen" className="btn-secondary">
            Software vergleichen
          </Link>
          <Link href="/signup?entry=anfragenmanagement" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zum Prozess oder zu den Kennzahlen springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#prozess" className="btn-secondary w-full justify-center">
              Prozess öffnen
            </MarketingJumpLink>
            <MarketingJumpLink href="#kpis" className="btn-secondary w-full justify-center">
              Kennzahlen
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="anfragenmanagement-immobilienmakler"
      primaryHref="/signup?entry=anfragenmanagement-stage"
      primaryLabel="Mit echten Anfragen testen"
      secondaryHref="/best-software-immobilienanfragen"
      secondaryLabel="Software vergleichen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten kombinieren aktuelle Herstellerhinweise zum Anfrageprozess mit einer übergreifenden Betriebs- und Risikoperspektive. Für die Umsetzung zählt am Ende Ihr tatsächlicher Arbeitsalltag mit echten Anfragen."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Freigabelogik und kontrollierte Ausführung im
                Makleralltag.
              </p>
              <div className="mt-5 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="font-semibold text-[var(--text)]">Aktualisiert</p>
                  <p className="mt-2">{LAST_UPDATED}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="font-semibold text-[var(--text)]">Seitentyp</p>
                  <p className="mt-2">Praxisleitfaden</p>
                </div>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite aufgebaut ist</h2>
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

      <section id="grundregeln" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Vier Grundregeln für sauberes Anfragenmanagement</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Bevor über Tools, Automatisierung oder KI gesprochen wird, braucht jedes Maklerbüro ein belastbares
              Grundmodell. Genau daran scheitern viele Prozesse noch vor dem ersten Versand.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {operatingPrinciples.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="prozess" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Der saubere Anfrageprozess für Maklerbüros</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Anfragenprozesse wirken einfach, weil die Logik im Hintergrund klar ist. Genau deshalb lohnt es
              sich, den Ablauf nicht als Postfacharbeit, sondern als Systemprozess zu betrachten.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {processSteps.map((item) => (
              <article key={item.step} className="card-base p-6">
                <p className="label">{item.step}</p>
                <h3 className="mt-3 text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="rollen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Welche Rollen im Anfrageprozess klar benannt sein sollten</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {roleModel.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="engpaesse" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Typische Engpässe im Makleralltag</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {bottlenecks.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="kpis" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Kennzahlen für belastbares Anfragenmanagement</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Ohne messbare Prozesssignale bleibt der Anfragebetrieb Bauchgefühl. Diese fünf Kennzahlen reichen für
              einen starken Start.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kpis.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="rollout" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Ein realistischer 30-Tage-Start für Maklerbüros</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {rolloutSteps.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="automation" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Was automatisierbar ist und was bewusst manuell bleiben sollte</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {automationScopes.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-6 p-6 md:p-8">
            <h3 className="h3">Nächste sinnvolle Leitfäden</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/best-software-immobilienanfragen" className="btn-secondary">
                Software für Immobilienanfragen
              </Link>
              <Link href="/immobilienanfragen-automatisieren" className="btn-secondary">
                Immobilienanfragen automatisieren
              </Link>
              <Link href="/anfragenqualifizierung-immobilienmakler" className="btn-secondary">
                Anfragenqualifizierung
              </Link>
              <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                Anfragen priorisieren
              </Link>
              <Link href="/besichtigungsanfragen-automatisieren" className="btn-secondary">
                Besichtigungsanfragen
              </Link>
              <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
                Follow-up-E-Mails
              </Link>
              <Link href="/immobilienanfragen-nachfassen" className="btn-secondary">
                Immobilienanfragen nachfassen
              </Link>
              <Link href="/antwortzeit-immobilienanfragen" className="btn-secondary">
                Antwortzeit
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section id="advaic-fit" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wo Advaic im Anfrageprozess hilft</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann zuerst eine andere Baustelle dran ist</h2>
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
