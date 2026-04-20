import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import ResponsiveComparisonTable from "@/components/marketing/ResponsiveComparisonTable";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "10. April 2026";

const summary = [
  "ImmoScout-Anfragen sind kein gewöhnlicher E-Mail-Eingang. Quelle, Objektbezug, Zuständigkeit und Dublettenschutz müssen sauber zusammenspielen, bevor Automatisierung überhaupt sinnvoll wird.",
  "Gerade bei Portalanfragen lohnt sich Automatisierung besonders, weil Standardfragen, hohe Volumina und Erwartung an schnelle Erstreaktion zusammenkommen.",
  "Der häufigste Fehler ist, jede Portal-Mail wie eine normale Inbox-Nachricht zu behandeln. Dadurch gehen Zuordnung, Priorisierung und Freigabegrenzen durcheinander.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#warum", label: "Warum ImmoScout anders ist" },
  { href: "#voraussetzungen", label: "Voraussetzungen" },
  { href: "#ablauf", label: "Sauberer Ablauf" },
  { href: "#entscheidungen", label: "Auto vs. Freigabe" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Primärquellen von ImmoScout24, onOffice, FLOWFACT und Propstack mit Advaics Sicht auf Portalanfragen im Makleralltag.",
  "Bewertet wird nicht nur der Texteingang, sondern der gesamte Pfad: Quelle erkennen, Objekt zuordnen, Dubletten vermeiden, qualifizieren, antworten oder bewusst stoppen.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist keine aggressive Vollautomation, sondern ein belastbarer Eingangspfad für wiederkehrende Standardfälle.",
];

const whyItIsDifferent = [
  {
    title: "Volumen und Erwartungsdruck sind höher",
    text: "ImmoScout24 ist als führender Online-Marktplatz für Immobilien in Deutschland ein zentraler Anfragekanal. Entsprechend groß ist der Druck auf schnelle und konsistente Erstreaktion.",
  },
  {
    title: "Objekt- und Quellenzuordnung sind Pflicht",
    text: "Bei Portalanfragen reicht eine gute Formulierung nicht. Entscheidend ist, ob Anfrage, Objekt, Ansprechpartner und Quelle technisch sauber zusammenfinden.",
  },
  {
    title: "Doppelte Verarbeitung ist ein echtes Risiko",
    text: "Gerade bei Portalen mit API- oder XML-Logik kann dieselbe Anfrage zeitversetzt an mehreren Stellen auftauchen. Ohne klare Regeln drohen Dubletten und widersprüchliche Antworten.",
  },
  {
    title: "Viele Fragen sind wiederkehrend, aber nicht alle",
    text: "Verfügbarkeit, Exposé, Unterlagen und nächster Schritt sind gute Standardfälle. Preisverhandlung, Beschwerde oder Sonderwunsch sind es nicht.",
  },
];

const prerequisites = [
  "Objekte sind sauber gepflegt und aus dem führenden System heraus veröffentlicht",
  "Das zuständige Postfach oder die API-Anbindung ist klar mit Quelle und Objektpfad verknüpft",
  "Quellenlogik, Ansprechpartner und Dublettenschutz sind vor dem Pilot geklärt",
  "Das Team hat klare Freigabegrenzen für unklare, sensible oder konfliktbehaftete Fälle",
];

const workflowSteps = [
  {
    title: "1. Eingang als Portalanfrage erkennen",
    text: "Noch bevor ein Textentwurf erzeugt wird, sollte klar sein, dass es sich um eine echte Portalanfrage handelt und nicht um Rauschen oder eine nachgelagerte Service-Mail.",
  },
  {
    title: "2. Quelle, Objekt und Ansprechpartner zuordnen",
    text: "Der Kernschritt ist die sichere Zuordnung von Anfragequelle, Immobilie und verantwortlicher Person. Genau hier entscheidet sich, ob Standardautomation überhaupt tragfähig ist.",
  },
  {
    title: "3. Anfrage qualifizieren",
    text: "Vollständigkeit, Objektbezug, Antwortzweck und offensichtliche Risikosignale werden geprüft. Erst danach gehört ein Fall in Auto, Freigabe oder manuelle Bearbeitung.",
  },
  {
    title: "4. Erstreaktion oder Freigabe auslösen",
    text: "Klare Standardfragen können direkt beantwortet werden. Unklare Fälle, Beschwerden, Preisverhandlungen oder Sonderkonstellationen bleiben beim Team.",
  },
  {
    title: "5. Nachfassen und Besichtigung vorbereiten",
    text: "Der Prozess endet nicht bei der ersten Antwort. Gute Systeme führen Interessenten strukturiert in Exposé, Qualifizierung, Termin und Nachfassen weiter.",
  },
];

const decisionRows = [
  {
    situation: "Klare Anfrage zu Verfügbarkeit, Exposé oder nächstem Schritt mit sicherem Objektbezug",
    route: "Automatisch beantworten",
    reason: "Typischer Standardfall mit hohem Zeitwert und geringem inhaltlichen Risiko.",
    watch: "Nur sinnvoll, wenn Quelle und Objekt sicher zugeordnet sind.",
  },
  {
    situation: "Portalanfrage ohne eindeutige Objektzuordnung oder mit unsauberem Zusammenhang",
    route: "Zur Freigabe",
    reason: "Eine schnelle, aber falsche Antwort ist hier teurer als eine kurze Verzögerung.",
    watch: "Gerade bei Weiterleitungen, Einzelplatzbuchung oder fehlenden Anhängen genau prüfen.",
  },
  {
    situation: "Doppelte oder zeitversetzte Verarbeitung derselben Anfrage",
    route: "Prüfen und zusammenführen",
    reason: "Ohne Dublettenschutz drohen widersprüchliche Antworten und unübersichtliche Historien.",
    watch: "Portal-API, E-Mail-Eingang und manuelle Bearbeitung dürfen sich nicht gegenseitig überholen.",
  },
  {
    situation: "Beschwerde, Preisverhandlung, Sonderwunsch oder heikle Aussage",
    route: "Bewusst manuell",
    reason: "Das sind keine Standardfälle und gehören nicht in eine operative Automatik.",
    watch: "Diese Grenze muss im Team glasklar sein.",
  },
];

const metrics = [
  "Median-Zeit bis zur ersten Antwort auf echte Portalanfragen",
  "Anteil sauber zugeordneter ImmoScout-Anfragen ohne manuelle Nacharbeit",
  "Quote doppelt verarbeiteter oder zusammengeführter Anfragen",
  "Freigabequote bei unklaren oder sensiblen Portalfällen",
  "Anteil nachträglicher Korrekturen nach automatischer Erstreaktion",
  "Anteil qualifizierter Anfragen, die in den Besichtigungspfad übergehen",
];

const advaicFit = [
  "Ihr Team hat regelmäßig ImmoScout-Volumen und braucht einen klareren Eingangspfad zwischen Auto, Freigabe und Nachfassen.",
  "Sie möchten Portalanfragen schneller beantworten, ohne die Objekt- und Quellenlogik zu verlieren.",
  "Sie suchen keine weitere Maklersoftware, sondern eine operative Schicht für Eingang, Entscheidung und Antwortqualität.",
];

const advaicNotFit = [
  "Objekte, Ansprechpartner oder Veröffentlichungswege sind intern noch nicht sauber genug gepflegt.",
  "Es gibt kaum Portalanfragen oder fast jede Nachricht ist stark individuell und verhandlungsnah.",
  "Sie brauchen zuerst CRM-Grundlagen, bevor der Anfrageeingang sinnvoll automatisiert werden kann.",
];

const faqItems = [
  {
    question: "Warum braucht ImmoScout24 einen eigenen Automatisierungsleitfaden?",
    answer:
      "Weil Portalanfragen andere operative Anforderungen haben als normale Postfachmails. Quelle, Objektbezug, Zuständigkeit und Dublettenschutz spielen hier eine deutlich größere Rolle.",
  },
  {
    question: "Kann jede ImmoScout-Anfrage automatisch beantwortet werden?",
    answer:
      "Nein. Gute Kandidaten sind klare Standardfragen. Unklare Zuordnung, Beschwerden, Preisverhandlungen oder Sonderfälle sollten bewusst beim Team bleiben.",
  },
  {
    question: "Warum reicht ein normales Shared-Inbox-Tool oft nicht aus?",
    answer:
      "Weil Shared Inboxes zwar verteilen können, aber oft nicht tief genug zwischen Quelle, Objekt, Anfragezweck, Freigabegrund und Dublettenschutz unterscheiden.",
  },
  {
    question: "Was ist der wichtigste Startpunkt?",
    answer:
      "Saubere Objekt- und Quellenlogik. Wenn diese Zuordnung nicht stabil ist, wird auch eine gute Antwortautomatik im Alltag unsicher.",
  },
];

const sources = [
  {
    label: "ImmoScout24: Über ImmoScout24",
    href: "https://www.immobilienscout24.de/unternehmen/immobilienscout24/",
    note: "Aktuelle Einordnung der Marktbedeutung von ImmoScout24 als zentralem Anfragekanal im deutschen Immobilienmarkt.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Offizielle Hilfeseite zu Quellenlogik, XML-/API-Voraussetzungen und der Besonderheit von ImmoScout24 in der automatischen Anfragenverarbeitung.",
  },
  {
    label: "onOffice Enterprise Hilfe: Anfragenmanager einrichten",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/anfragenmanager-einrichten/",
    note: "Offizielle Quelle zur Einrichtung eines geregelten Anfragepfads mit Zuständigkeiten und operativen Regeln.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite zur automatischen Erkennung, Kontaktanlage und Verknüpfung eingehender Portalanfragen.",
  },
  {
    label: "Harvard Business Review: The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum schnelle und passende Erstreaktion gerade bei inbound-getriebenen Kanälen wirtschaftlich relevant ist.",
  },
  {
    label: "NIST: AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare und risikobewusste Automatisierungsentscheidungen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "ImmoScout-Anfragen automatisieren 2026: Wie Makler Portalanfragen sauber steuern",
  ogTitle: "ImmoScout-Anfragen automatisieren 2026 | Advaic",
  description:
    "Leitfaden für Makler: Wie ImmoScout-Anfragen mit sauberer Objekt- und Quellenlogik, Freigabegrenzen und schneller Erstreaktion automatisiert werden können.",
  path: "/immobilienscout-anfragen-automatisieren",
  template: "guide",
  eyebrow: "ImmoScout-Anfragen",
  proof:
    "Portalanfragen brauchen klare Quellenlogik, sichere Objektzuordnung und bewusste Freigabegrenzen, bevor Automatisierung wirklich trägt.",
});

export default function ImmoScoutAnfragenAutomatisierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "ImmoScout-Anfragen automatisieren 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-10",
        mainEntityOfPage: `${siteUrl}/immobilienscout-anfragen-automatisieren`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["ImmoScout24", "Portalanfragen", "Automatisierung", "Immobilienmakler"],
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
        { name: "ImmoScout-Anfragen automatisieren", path: "/immobilienscout-anfragen-automatisieren" },
      ]}
      schema={schema}
      kicker="ImmoScout-Anfragen"
      title="Wie Makler ImmoScout-Anfragen sauber automatisieren können"
      description="Portalanfragen brauchen einen eigenen Prozess. Entscheidend sind Quelle, Objektbezug, Dublettenschutz, Freigabegrenzen und eine schnelle Erstreaktion ohne operative Unschärfe."
      actions={
        <>
          <Link href="/immobilienanfragen-automatisieren" className="btn-secondary">
            Gesamtleitfaden
          </Link>
          <Link href="/signup?entry=immobilienscout-anfragen-automatisieren" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zum Ablauf oder zu Auto-vs.-Freigabe springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#ablauf" className="btn-secondary w-full justify-center">
              Ablauf
            </MarketingJumpLink>
            <MarketingJumpLink href="#entscheidungen" className="btn-secondary w-full justify-center">
              Auto vs. Freigabe
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="immobilienscout-anfragen-automatisieren"
      primaryHref="/signup?entry=immobilienscout-anfragen-automatisieren-stage"
      primaryLabel="Mit echten Portalanfragen testen"
      secondaryHref="/anfragenmanagement-immobilienmakler"
      secondaryLabel="Anfragenmanagement"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Portalanfragen, Quellenlogik und kontrollierter Automatisierung. Für die konkrete Umsetzung sollten Sie immer Ihre echten Veröffentlichungswege und Eingangsmuster mitprüfen."
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
                Produkt- und Prozessteam mit Fokus auf Portalanfragen, Freigabepfade, Antwortqualität und
                kontrollierte Automatisierung im Makleralltag.
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

      <section id="warum" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Warum ImmoScout-Anfragen operativ anders behandelt werden sollten</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Portalanfragen wirken auf den ersten Blick wie normale E-Mails. In der Praxis hängen daran aber
              Quelllogik, Objektzuordnung, Veröffentlichungswege und oft auch mehrere technische Pfade gleichzeitig.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {whyItIsDifferent.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
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
              <h2 className="h3">Welche Voraussetzungen vor der Automatisierung geklärt sein sollten</h2>
              <p className="helper mt-3">
                Gute Automatisierung beginnt hier nicht im Text, sondern in der Infrastruktur des Anfragepfads.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {prerequisites.map((item) => (
                  <article key={item} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="card-base p-6">
              <p className="label">Merksatz</p>
              <h2 className="h3 mt-3">Ohne saubere Zuordnung ist Geschwindigkeit wertlos</h2>
              <p className="helper mt-3">
                Ein schneller Versand hilft nicht, wenn Quelle, Objekt oder zuständige Person falsch getroffen werden.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="ablauf" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Ein sauberer Ablauf für ImmoScout-Anfragen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Der operative Wert entsteht aus Reihenfolge. Erst Eingang und Zuordnung, dann Qualifizierung, dann
              Antwort oder Freigabe.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {workflowSteps.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="entscheidungen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wann Auto sinnvoll ist und wann Freigabe greifen sollte</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Bei Portalanfragen zählt nicht die höchste Auto-Quote, sondern ob Standardfälle schnell laufen und
              Grenzfälle sauber abgefangen werden.
            </p>
          </div>

          <ResponsiveComparisonTable
            columns={[
              { key: "situation", label: "Situation", emphasize: true },
              { key: "route", label: "Sinnvoller Pfad", mobileLabel: "Pfad" },
              { key: "reason", label: "Warum" },
              { key: "watch", label: "Worauf achten" },
            ]}
            rows={decisionRows}
            rowKey={(row) => row.situation}
          />
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen für einen belastbaren Portalanfrage-Pfad</h2>
              <ul className="mt-5 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
                {metrics.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base p-6">
              <p className="label">Nächster Schritt</p>
              <h2 className="h3 mt-3">Nach dem Eingang kommt die Qualifizierung</h2>
              <p className="helper mt-3">
                Wenn der Portaleingang stabil läuft, entscheidet sich der nächste Hebel meist in der
                Anfragenqualifizierung und im Besichtigungspfad.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/anfragenqualifizierung-immobilienmakler" className="btn-secondary">
                  Anfragenqualifizierung
                </Link>
                <Link href="/portalanfragen-priorisieren" className="btn-secondary">
                  Portalanfragen priorisieren
                </Link>
                <Link href="/immobilienscout-anfragen-qualifizieren" className="btn-secondary">
                  ImmoScout qualifizieren
                </Link>
                <Link href="/immobilienscout-anfragen-nachfassen" className="btn-secondary">
                  ImmoScout nachfassen
                </Link>
                <Link href="/besichtigungsanfragen-automatisieren" className="btn-secondary">
                  Besichtigungsanfragen
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section id="advaic" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn Portalanfragen operativ sauber laufen sollen</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                  Anfragenmanagement
                </Link>
                <Link href="/immobilienanfragen-automatisieren" className="btn-secondary">
                  Immobilienanfragen automatisieren
                </Link>
                <Link href="/immobilienscout-anfragen-qualifizieren" className="btn-secondary">
                  ImmoScout qualifizieren
                </Link>
                <Link href="/antwortzeit-immobilienanfragen" className="btn-secondary">
                  Antwortzeit
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn der Grundpfad noch nicht trägt</h2>
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

      <section id="faq" className="marketing-soft-warm py-20 md:py-28">
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
