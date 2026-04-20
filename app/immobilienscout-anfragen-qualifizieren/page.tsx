import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import ResponsiveComparisonTable from "@/components/marketing/ResponsiveComparisonTable";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "20. April 2026";

const summary = [
  "ImmoScout-Anfragen zu qualifizieren heißt nicht, Interessenten nach Sympathie zu sortieren. Entscheidend sind Objektklarheit, mitgesendete Zusatzdaten, Dublettenlage und der nächste sinnvolle Schritt im Maklerprozess.",
  "Der größte Fehler ist, alle Portal-Anfragen gleich zu behandeln. Gerade bei ImmoScout verändern Quelle, Profilfelder und Nachrichtenkontext die operative Einordnung deutlich.",
  "Starke Qualifizierung bleibt dabei bewusst einfach: wenige saubere Stufen, klare Prüfregeln und kein künstlich kompliziertes Punktesystem ohne spürbare Wirkung im Alltag.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#signale", label: "Welche Signale tragen" },
  { href: "#matrix", label: "Qualifizierungs-Matrix" },
  { href: "#fragen", label: "Praktische Prüfregeln" },
  { href: "#fehler", label: "Typische Fehler" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Primärquellen von ImmoScout24, Propstack, onOffice und FLOWFACT mit Advaics Sicht auf Quellenerkennung, Zusatzdaten und den nächsten sinnvollen Maklerschritt.",
  "Qualifizierung wird hier nicht als Marketing-Score verstanden, sondern als operative Einordnung: direkt weiterführen, standardisiert beantworten, erst prüfen oder bewusst manuell übernehmen.",
  "Die Empfehlungen sind konservativ. Zusätzliche Daten aus dem Portal helfen bei der Einordnung, ersetzen aber nie Objektklarheit, Prozesskontext und saubere Dublettenprüfung.",
];

const signalCards = [
  {
    title: "Objektklarheit kommt vor Zusatzdaten",
    text: "Auch eine ausführliche Anfrage bleibt operativ schwach, wenn Objektbezug, Zuständigkeit oder bisheriger Verlauf unklar sind.",
  },
  {
    title: "Profilfelder helfen nur, wenn sie bewusst mitgesendet wurden",
    text: "Budget, Haushaltsgröße, Finanzierungsstand oder Suchstatus sind nützlich, aber nicht jede ImmoScout-Anfrage enthält diese Angaben vollständig.",
  },
  {
    title: "Nachrichtenkontext verändert die Einordnung",
    text: "Ein Erstkontakt, eine Rückfrage nach Exposé, eine Terminbitte oder ein verhandelnder Folgekontakt sind keine gleichartigen Fälle.",
  },
  {
    title: "Dubletten sind ein Qualifizierungsthema",
    text: "Wenn Anfragen mehrfach auftauchen oder verspätet verknüpft werden, muss zuerst der Kontext sauber zusammengeführt werden, bevor beschleunigt wird.",
  },
];

const matrixRows = [
  {
    category: "Q1 Direkt weiterführen",
    case: "Klarer Objektbezug, belastbarer Kontext und ein erkennbarer nächster Schritt wie Besichtigungswunsch oder konkrete Rückfrage",
    nextStep: "Sofort beantworten oder in Termin- bzw. Qualifizierungspfad überführen",
    watch: "Nur sinnvoll, wenn keine Dublette und kein widersprüchlicher Status vorliegt",
  },
  {
    category: "Q2 Standardisiert qualifizieren",
    case: "Klarer Portal-Erstkontakt mit noch offenen Punkten, aber stabilem Objekt- und Quellenbezug",
    nextStep: "Mit wenigen gezielten Fragen oder einem passenden Standardpfad weiterführen",
    watch: "Nicht künstlich überfrachten; nur Informationen abfragen, die für den nächsten Schritt wirklich zählen",
  },
  {
    category: "Q3 Erst prüfen und zusammenführen",
    case: "Unklare Quelle, Dublettenverdacht, verspätete Verknüpfung oder widersprüchliche Angaben",
    nextStep: "Kontext prüfen, Datensätze abgleichen, danach neu einordnen",
    watch: "Falsche Eile ist hier teurer als ein kurzer sauberer Prüfblock",
  },
  {
    category: "Q4 Bewusst manuell übernehmen",
    case: "Beschwerde, Verhandlung, heikler Einzelfall oder operative Ausnahme außerhalb des normalen Anfragepfads",
    nextStep: "Nicht standardisiert beschleunigen, sondern priorisiert manuell führen",
    watch: "Hohe Sichtbarkeit heißt nicht automatisch Standardisierung",
  },
  {
    category: "Q5 Kein sinnvoller Anfragefall",
    case: "Spam, technischer Lärm oder reiner Systemvorgang ohne echten Bearbeitungsbedarf",
    nextStep: "Nicht in den normalen Qualifizierungspfad ziehen",
    watch: "Nur so bleibt die Qualifizierung für echte Interessenten belastbar",
  },
];

const qualificationRules = [
  {
    title: "Welche Information fehlt wirklich für den nächsten Schritt?",
    text: "Nicht jede nette Zusatzfrage ist sinnvoll. Gute Qualifizierung fragt nur das ab, was Besichtigung, Exposé-Freigabe oder sinnvolles Nachfassen tatsächlich beeinflusst.",
  },
  {
    title: "Welche Angaben kommen aus dem Portal und welche fehlen intern?",
    text: "Mitgesendete ImmoScout-Daten können helfen, aber sie ersetzen keine interne Klarheit zu Objekt, Verantwortlichkeit und Prozessstatus.",
  },
  {
    title: "Ist das ein Erstkontakt oder schon ein Folgefall?",
    text: "Je weiter ein Interessent schon im Prozess ist, desto weniger passt ein allgemeiner Standardblock. Sonst fällt der Verlauf wieder auf Anfang zurück.",
  },
  {
    title: "Spricht etwas gegen sofortige Beschleunigung?",
    text: "Dubletten, Sonderfälle, Widersprüche oder unklare Quelle sind keine Randnotizen, sondern oft der Grund, warum eine schnelle Standardreaktion schadet.",
  },
];

const commonMistakes = [
  "ImmoScout-Anfragen nur nach Umfang oder Freundlichkeit des Textes zu bewerten statt nach Objektklarheit und nächstem sinnvollen Schritt.",
  "Zusatzdaten wie Budget oder Finanzierungsstatus als harte Wahrheit zu behandeln, obwohl sie optional und nicht immer vollständig sind.",
  "Dubletten oder verspätet eingespielte Fälle als neue Chancen zu lesen und dadurch falsche Priorität zu vergeben.",
  "Erstkontakte, Folgekontakte und heikle Sonderfälle in denselben Standardpfad zu drücken.",
];

const metrics = [
  "Zeit bis zur ersten sinnvollen Qualifizierungsentscheidung bei ImmoScout-Anfragen",
  "Anteil ImmoScout-Fälle, die direkt der richtigen Qualifizierungsstufe zugeordnet werden",
  "Quote erkannter Dubletten oder Kontextbrüche vor Versand",
  "Anteil standardisierter Portal-Erstkontakte, die ohne unnötige Rückfragen in den nächsten Schritt übergehen",
  "Anteil heikler Sonderfälle, die aus dem normalen Schnellpfad herausgezogen werden",
];

const advaicFit = [
  "Ihr Team verarbeitet relevantes ImmoScout-Volumen und braucht eine klarere Einordnung zwischen Standardfall, echter Chance und Prüfbedarf.",
  "Sie möchten Zusatzdaten aus ImmoScout sinnvoll nutzen, ohne daraus ein künstlich kompliziertes Scoring-System zu bauen.",
  "Sie suchen keine isolierte Portalantwort, sondern eine belastbare Brücke zwischen Portal, Qualifizierung, Besichtigung und Folgepfad.",
];

const advaicNotFit = [
  "Die Basiserkennung Ihrer ImmoScout-Fälle ist noch unscharf, etwa weil Quelle, Objekt oder Zuständigkeit nicht sauber zugeordnet werden.",
  "Es gibt kaum Portalvolumen und der Aufwand für einen eigenen ImmoScout-Qualifizierungspfad wäre größer als sein Nutzen.",
  "Das eigentliche Problem liegt später, etwa in Terminlogik oder Nachfassen, nicht in der ersten Einordnung von Portal-Anfragen.",
];

const faqItems = [
  {
    question: "Was ist bei ImmoScout-Anfragen anders als bei normalen E-Mail-Anfragen?",
    answer:
      "ImmoScout-Fälle bringen oft zusätzliche Signale mit: klarere Quellen, Nachrichtenkontext und teils optionale Profilfelder. Gleichzeitig entstehen eigene Risiken wie Dubletten, Alias-Kommunikation oder verspätete Verknüpfungen.",
  },
  {
    question: "Sind zusätzliche Interessentendaten automatisch ein starkes Signal?",
    answer:
      "Nicht automatisch. Sie helfen bei der Einordnung, wenn sie vorhanden und zum nächsten Schritt relevant sind. Sie ersetzen aber weder Objektklarheit noch saubere Kontextprüfung.",
  },
  {
    question: "Wie viele Qualifizierungsstufen sind für ImmoScout sinnvoll?",
    answer:
      "Meist vier bis fünf klare Arbeitsstufen plus echte Sonderfälle. Mehr Stufen wirken präzise, machen den Alltag aber oft nur träger.",
  },
  {
    question: "Wann sollte eine ImmoScout-Anfrage zuerst geprüft statt sofort beantwortet werden?",
    answer:
      "Wenn Dublettenverdacht, widersprüchliche Angaben, unklare Quelle oder ein heikler Sonderfall vorliegen. Dann ist saubere Einordnung wichtiger als maximale Geschwindigkeit.",
  },
];

const sources = [
  {
    label: "ImmoScout24: Nachrichten-Manager",
    href: "https://www.immobilienscout24.de/anbieten/gewerbliche-anbieter/tipps/anwender-handbuch/nachrichtenmanager.html",
    note: "Offizielle Einordnung des Nachrichten-Managers als zentralem Eingang für Kontaktanfragen und Verlauf pro Objekt.",
  },
  {
    label: "ImmoScout24: Nachrichten-Manager für Immobilienmakler",
    href: "https://www.immobilienscout24.de/anbieten/gewerbliche-anbieter/tipps/anwender-tipps/anwender-handbuch/VermarktungAkquiseMarkenbildung/Vermarktung/Kontaktemanagen/Kontaktanfragenmanagen.html",
    note: "Offizielle Übersicht zu Kontaktanfragen, Sammelantworten, Antwortbausteinen und Terminverwaltung im Portalumfeld.",
  },
  {
    label: "Propstack: Erweiterte Interessentendaten von ImmoScout24-Anfragen",
    href: "https://support.propstack.de/hc/de/articles/21686758191773-Erweiterte-Interessentendaten-von-ImmoScout24-Anfragen",
    note: "Offizielle Hilfe zu zusätzlichen ImmoScout-Feldern wie Budget, Suchstatus oder Finanzierungsstand.",
  },
  {
    label: "onOffice Hilfe: Einstellungen Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Offizielle Quelle zu Portalerkennung, Dublettenprüfung, Abbruchbedingungen und Weiterbearbeitung.",
  },
  {
    label: "FLOWFACT Serviceportal: Zuordnung neuer Deals",
    href: "https://service.flowfact.de/hc/de/articles/10027504066589-Zuordnung-neuer-Deals",
    note: "Offizielle Dokumentation zur Trennung neuer Anfragen von späteren Prozessstufen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "ImmoScout-Anfragen qualifizieren 2026",
  ogTitle: "ImmoScout-Anfragen qualifizieren 2026 | Advaic",
  description:
    "Leitfaden für Makler: Wie ImmoScout-Anfragen nach Objektklarheit, Zusatzdaten, Dublettenlage und nächstem sinnvollen Schritt qualifiziert werden.",
  path: "/immobilienscout-anfragen-qualifizieren",
  template: "guide",
  eyebrow: "ImmoScout-Anfragen qualifizieren",
  proof: "Starke ImmoScout-Qualifizierung trennt Standardfälle, Zusatzdaten und Prüfbedarf sauber nach dem nächsten sinnvollen Schritt.",
});

export default function ImmoscoutAnfragenQualifizierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "ImmoScout-Anfragen qualifizieren 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-20",
        mainEntityOfPage: `${siteUrl}/immobilienscout-anfragen-qualifizieren`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["ImmoScout-Anfragen qualifizieren", "ImmoScout24", "Immobilienmakler", "Portal-Anfragen"],
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
        { name: "ImmoScout-Anfragen qualifizieren", path: "/immobilienscout-anfragen-qualifizieren" },
      ]}
      schema={schema}
      kicker="ImmoScout-Anfragen qualifizieren"
      title="Wie Makler ImmoScout-Anfragen sauber qualifizieren"
      description="ImmoScout-Anfragen brauchen eine eigene Qualifizierungslogik. Entscheidend sind Objektklarheit, Zusatzdaten, Dublettenlage und der passende nächste Schritt."
      actions={
        <>
          <Link href="/immobilienscout-anfragen-automatisieren" className="btn-secondary">
            ImmoScout automatisieren
          </Link>
          <Link href="/signup?entry=immobilienscout-anfragen-qualifizieren" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zur Matrix oder zu den Prüfregeln springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#matrix" className="btn-secondary w-full justify-center">
              Matrix
            </MarketingJumpLink>
            <MarketingJumpLink href="#fragen" className="btn-secondary w-full justify-center">
              Prüfregeln
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="immobilienscout-anfragen-qualifizieren"
      primaryHref="/signup?entry=immobilienscout-anfragen-qualifizieren-stage"
      primaryLabel="Mit echten ImmoScout-Fällen prüfen"
      secondaryHref="/portalanfragen-priorisieren"
      secondaryLabel="Portal-Priorisierung ansehen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung zu Nachrichten-Manager, Zusatzdaten, Portalerkennung und Deal-Zuordnung. Für die echte Steuerung sollten Sie zusätzlich prüfen, wie viele ImmoScout-Fälle bei Ihnen heute mit Dubletten, Kontextbrüchen oder unnötigen Rückfragen starten."
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
                Produkt- und Prozessteam mit Fokus auf Portaleingang, Qualifizierungslogik und kontrollierte Übergänge
                zwischen Standardfall, Prüfung und Sonderfall.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite ImmoScout-Fälle bewertet</h2>
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

      <section id="signale" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche Signale bei ImmoScout-Anfragen wirklich tragen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Qualifizierung beginnt nicht bei möglichst vielen Fragen, sondern bei sauberer Einordnung dessen,
              was aus dem Portal wirklich verlässlich und für den nächsten Schritt relevant ist.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {signalCards.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="matrix" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Eine belastbare Qualifizierungs-Matrix für ImmoScout-Anfragen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Wenige klare Arbeitsstufen sind in der Praxis fast immer stärker als komplizierte Punktelogik ohne
              sichtbaren Prozessgewinn.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={matrixRows}
            rowKey={(item) => item.category}
            columns={[
              { key: "category", label: "Stufe", emphasize: true },
              { key: "case", label: "Typischer Fall" },
              { key: "nextStep", label: "Nächster Schritt" },
              { key: "watch", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="fragen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Praktische Prüfregeln für den Makleralltag</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {qualificationRules.map((item) => (
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
              <h2 className="h3">Typische Fehler bei der Qualifizierung von ImmoScout-Anfragen</h2>
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
              <h2 className="h3 mt-3">Mehr Daten sind nur dann hilfreich, wenn sie den nächsten Schritt klären</h2>
              <p className="helper mt-3">
                Gute ImmoScout-Qualifizierung beschleunigt nicht blind, sondern trennt echte Chancen, Standardfälle und
                Prüfbedarf sauber voneinander.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen für starke ImmoScout-Qualifizierung</h2>
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
              <p className="label">Weiterführend</p>
              <h2 className="h3 mt-3">Qualifizierung wirkt erst mit Priorisierung und Folgepfad</h2>
              <p className="helper mt-3">
                Sobald ImmoScout-Fälle sauber qualifiziert sind, entscheiden Priorisierung, Nachfassen und Terminpfad
                darüber, wie viel aus dem Portal wirklich im Alltag ankommt.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/portalanfragen-priorisieren" className="btn-secondary">
                  Portal-Priorisierung
                </Link>
                <Link href="/immobilienscout-anfragen-nachfassen" className="btn-secondary">
                  ImmoScout nachfassen
                </Link>
                <Link href="/anfragenqualifizierung-immobilienmakler" className="btn-secondary">
                  Allgemeine Qualifizierung
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section id="advaic" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn ImmoScout-Fälle klarer statt nur schneller werden sollen</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/immobilienscout-anfragen-automatisieren" className="btn-secondary">
                  ImmoScout-Prozess ansehen
                </Link>
                <Link href="/signup?entry=immobilienscout-anfragen-qualifizieren-fit" className="btn-primary">
                  {MARKETING_PRIMARY_CTA_LABEL}
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
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
          <div className="max-w-[78ch]">
            <h2 className="h2">FAQ zu ImmoScout-Anfragen</h2>
          </div>
          <div className="mt-8 grid gap-4">
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
