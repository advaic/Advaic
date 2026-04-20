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
  "Portalanfragen zu priorisieren heißt nicht, einfach jede neue Anfrage als Top-Fall zu behandeln. Gute Priorisierung trennt Standardfälle, echte Chancen, Dubletten und Sonderfälle nach dem nächsten sinnvollen Schritt.",
  "Gerade bei Portalen entscheiden Quelle, Objektbezug, Dublettenlage und Zeitkritik darüber, ob eine Anfrage sofort bearbeitet, zuerst geprüft oder bewusst manuell übernommen werden sollte.",
  "Der häufigste Fehler ist, Portalanfragen nur nach Eingangszeit zu sortieren. Dadurch werden sowohl gute Standardfälle als auch heikle Sonderfälle falsch eingeordnet.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#signale", label: "Welche Signale zählen" },
  { href: "#matrix", label: "Portal-Matrix" },
  { href: "#teamlogik", label: "Arbeitslogik im Team" },
  { href: "#fehler", label: "Typische Fehler" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Primärquellen von ImmoScout24, onOffice, Propstack und FLOWFACT mit Advaics Sicht auf Portaleingang, Dublettenlage und Folgepfade im Makleralltag.",
  "Priorisierung wird hier nicht als abstraktes Lead-Scoring verstanden, sondern als operative Entscheidung über den nächsten sinnvollen Schritt für Portalanfragen.",
  "Die Empfehlungen sind bewusst konservativ: wenige saubere Prioritätsstufen, klare Sonderfälle und feste Prüfpfade statt komplizierter Punktesysteme.",
];

const signalCards = [
  {
    title: "Quelle und Objekt müssen sofort klar sein",
    text: "Bei Portalanfragen ist ein schneller Eingang noch kein gutes Signal, wenn Objektbezug, Bearbeiter oder Systemfall unklar bleiben.",
  },
  {
    title: "Portaldaten verändern den Reifegrad",
    text: "Zusätzliche Angaben wie Budget, Suchstatus oder Finanzierungsstatus können helfen, echte Chancen schneller von allgemeinen Erstkontakten zu trennen.",
  },
  {
    title: "Dubletten sind Priorisierungsfehler, nicht nur Technikfehler",
    text: "Wenn dieselbe Anfrage mehrfach oder zeitversetzt sichtbar wird, darf sie nicht automatisch als neuer Top-Fall in die Queue springen.",
  },
  {
    title: "Sonderfälle sind wichtig, aber nicht standardisierbar",
    text: "Beschwerden, Preisverhandlungen, Widersprüche oder heikle Aussagen verdienen hohe Sichtbarkeit, aber keinen normalen Schnellpfad.",
  },
];

const matrixRows = [
  {
    category: "P1 Sofort weiterführen",
    case: "Klare Portalanfrage mit sicherem Objektbezug, vollständigem Kontakt und erkennbarem nächsten Schritt wie Besichtigungswunsch oder konkrete Rückfrage",
    nextStep: "Sofort beantworten oder direkt in Qualifizierung oder Terminpfad überführen",
    watch: "Nur sinnvoll, wenn keine Dublette und kein widersprüchlicher Status vorliegt",
  },
  {
    category: "P2 Schnell standardisiert bearbeiten",
    case: "Klarer Standardfall zu Exposé, Verfügbarkeit oder Unterlagen bei stabilem Kontext",
    nextStep: "Schnelle Standardantwort mit sauberem Folgepfad",
    watch: "Portalquelle und Objekt müssen belastbar zugeordnet sein",
  },
  {
    category: "P3 Erst prüfen und zusammenführen",
    case: "Dublettenverdacht, verspätete E-Mail-Verknüpfung, unklare Quelle oder widersprüchliche Angaben",
    nextStep: "Kontext klären, Datensätze prüfen, dann neu priorisieren",
    watch: "Hier schadet falsche Eile oft mehr als ein kurzer Prüfblock",
  },
  {
    category: "P4 Sonderfall mit hoher Sichtbarkeit",
    case: "Beschwerde, Preisverhandlung, Konfliktsignal oder reputationskritische Nachricht aus dem Portal",
    nextStep: "Bewusst manuell prüfen und priorisiert übernehmen",
    watch: "Wichtig heißt hier nicht automatisch standardisierbar",
  },
  {
    category: "P5 Kein echter Anfragefall",
    case: "Spam, interner Lärm, Portalrauschen oder technisch sichtbarer Vorgang ohne echten Bearbeitungsbedarf",
    nextStep: "Nicht in die normale Bearbeitungsqueue ziehen",
    watch: "Nur so bleibt die Queue für echte Fälle sauber",
  },
];

const teamRules = [
  {
    title: "Schnell sichtbare P1-/P2-Fälle, kleiner Stapel",
    text: "Wenn fast alles als dringend markiert wird, fehlt meist die eigentliche Portallogik. Gute Priorisierung hält die vorderen Stufen bewusst klein.",
  },
  {
    title: "P3-Fälle gebündelt prüfen",
    text: "Dubletten, unklare Quellen und verspätete Verknüpfungen sollten in festen Blöcken geprüft werden statt ständig den normalen Flow zu unterbrechen.",
  },
  {
    title: "Sonderfälle bewusst herausziehen",
    text: "Beschwerden oder heikle Aussagen gehören nicht zwischen normale Standardfragen. Sie brauchen eigene Sichtbarkeit und manuelle Entscheidung.",
  },
  {
    title: "Portalpriorität immer mit Folgepfad koppeln",
    text: "Eine Prioritätsstufe ist nur dann nützlich, wenn daraus klar folgt, ob beantwortet, qualifiziert, geprüft, freigegeben oder bewusst gestoppt wird.",
  },
];

const commonMistakes = [
  "Jede Portalanfrage pauschal als Top-Priorität lesen und damit Sonderfälle, Dubletten und Standardfälle in denselben Schnellpfad werfen.",
  "Nur nach Eingangszeit statt nach Objektklarheit, Reifegrad und Dublettenlage arbeiten.",
  "API- oder E-Mail-verzögerte Portalfälle als neue offene Chancen missverstehen.",
  "Beschwerden oder Verhandlungen wie normale Standardanfragen behandeln und dadurch falsch beschleunigen.",
];

const metrics = [
  "Median-Zeit bis zur ersten sinnvollen Priorisierungsentscheidung bei Portalanfragen",
  "Anteil Portalfälle, die direkt der richtigen Prioritätsstufe zugeordnet werden",
  "Quote erkannter Dubletten oder verspätet verknüpfter Fälle vor Versand",
  "Anteil Sonderfälle, die aus dem normalen Schnellpfad herausgezogen werden",
  "Anteil P1-/P2-Fälle, die ohne unnötige Rückfragen in den nächsten klaren Schritt übergehen",
];

const advaicFit = [
  "Ihr Team hat relevantes Portalvolumen und braucht mehr Klarheit, welche Fälle sofort weiterlaufen und welche zuerst geprüft werden müssen.",
  "Sie möchten Portalanfragen nicht nur schneller, sondern sauberer priorisieren, ohne Dubletten oder Sonderfälle falsch zu beschleunigen.",
  "Sie suchen keinen abstrakten Lead-Score, sondern eine belastbare Arbeitslogik für den realen Eingangsqueue.",
];

const advaicNotFit = [
  "Objekt- und Quellenlogik sind noch so unscharf, dass schon die Basiserkennung offener Portalfälle wackelt.",
  "Es gibt kaum Portalvolumen und die Queue ist operativ nicht komplex genug für einen eigenen Priorisierungsrahmen.",
  "Der eigentliche Engpass liegt später, etwa in Nachfassen oder Terminpfad, nicht in der Eingangssortierung.",
];

const faqItems = [
  {
    question: "Warum reicht allgemeine Anfrage-Priorisierung für Portale nicht aus?",
    answer:
      "Weil Portalanfragen zusätzliche Signale und Risiken mitbringen: Quelle, API-Verarbeitung, mögliche Dubletten und teils erweiterte Interessentendaten. Das verändert die operative Entscheidung deutlich.",
  },
  {
    question: "Sollten Portalanfragen immer höher priorisiert sein als normale E-Mails?",
    answer:
      "Nicht automatisch. Viele Portalanfragen sind zeitkritisch, aber Sonderfälle, Dubletten oder unklare Zuordnungen gehören trotz Sichtbarkeit erst in die Prüfung.",
  },
  {
    question: "Wie viele Prioritätsstufen sind bei Portalen sinnvoll?",
    answer:
      "Meist vier bis fünf klare Arbeitsstufen plus echte Sonderfälle. Mehr Stufen klingen präzise, verlangsamen den Alltag aber oft unnötig.",
  },
  {
    question: "Was ist bei Dubletten im Portal-Queue besonders wichtig?",
    answer:
      "Dass sie nicht als neue Chancen nach vorn springen. Erst der zusammengeführte Kontext zeigt, welche Priorität der Fall wirklich hat.",
  },
];

const sources = [
  {
    label: "ImmoScout24: Top Leads & Kontaktanfragen",
    href: "https://www.immobilienscout24.de/lp/kunde-werden/",
    note: "Offizielle Einordnung von ImmoScout24 als starkem Anfrage- und Leadkanal.",
  },
  {
    label: "onOffice Hilfe: Einstellungen Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Offizielle Quelle zu Portalerkennung, Abbruchbedingungen, Dublettenprüfung und Weiterbearbeitung.",
  },
  {
    label: "Propstack: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Offizielle Hilfe zu Quellenlogik, API-Verarbeitung und der Trennung echter Anfragen von sonstigen Aktivitäten.",
  },
  {
    label: "FLOWFACT Serviceportal: Zuordnung neuer Deals",
    href: "https://service.flowfact.de/hc/de/articles/10027504066589-Zuordnung-neuer-Deals",
    note: "Offizielle Dokumentation zur Trennung von neuen Anfragen und späteren Prozessstufen.",
  },
  {
    label: "FLOWFACT Serviceportal: Dublettenprüfung bei der Anfragenverarbeitung",
    href: "https://service.flowfact.de/hc/de/articles/4417428216081-Dublettenpr%C3%BCfung-bei-der-Anfragenverarbeitung",
    note: "Offizielle Quelle zu Kontaktabgleich und Dublettenlogik bei Portalanfragen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Portalanfragen priorisieren 2026",
  ogTitle: "Portalanfragen priorisieren 2026 | Advaic",
  description:
    "Leitfaden für Makler: Wie Portalanfragen nach Objektklarheit, Reifegrad, Dublettenlage und Sonderfallstatus priorisiert werden.",
  path: "/portalanfragen-priorisieren",
  template: "guide",
  eyebrow: "Portalanfragen priorisieren",
  proof: "Gute Portalpriorisierung trennt Standardfälle, Dubletten und Sonderfälle sauber nach dem nächsten sinnvollen Schritt.",
});

export default function PortalanfragenPriorisierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Portalanfragen priorisieren 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-20",
        mainEntityOfPage: `${siteUrl}/portalanfragen-priorisieren`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Portalanfragen priorisieren", "ImmoScout24", "Makler", "Anfrage-Queue"],
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
        { name: "Portalanfragen priorisieren", path: "/portalanfragen-priorisieren" },
      ]}
      schema={schema}
      kicker="Portalanfragen priorisieren"
      title="Wie Makler Portalanfragen sauber priorisieren"
      description="Portaleingang ist kein einheitlicher Stapel. Gute Priorisierung trennt schnelle Standardfälle, echte Chancen, Dubletten und Sonderfälle nach dem nächsten sinnvollen Schritt."
      actions={
        <>
          <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
            Allgemeine Priorisierung
          </Link>
          <Link href="/signup?entry=portalanfragen-priorisieren" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zur Portal-Matrix oder zu den Teamregeln springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#matrix" className="btn-secondary w-full justify-center">
              Matrix
            </MarketingJumpLink>
            <MarketingJumpLink href="#teamlogik" className="btn-secondary w-full justify-center">
              Teamlogik
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="portalanfragen-priorisieren"
      primaryHref="/signup?entry=portalanfragen-priorisieren-stage"
      primaryLabel="Mit echten Portalqueues prüfen"
      secondaryHref="/immobilienscout-anfragen-automatisieren"
      secondaryLabel="ImmoScout automatisieren"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung zu Portalerkennung, Dublettenlogik, Systemstufen und der Priorisierung von Anfragefällen. Für die echte Steuerung sollten Sie zusätzlich Ihre eigene Queue nach Dubletten, Sonderfällen und Reaktionszeiten auswerten."
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
                Produkt- und Prozessteam mit Fokus auf Eingangsqueue, Portallogik und kontrollierte Übergänge zwischen Standardfall und Sonderfall.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite Portaleingänge bewertet</h2>
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
            <h2 className="h2">Welche Signale bei Portalanfragen wirklich zählen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Priorisierung beginnt nicht bei der Lautstärke der Anfrage, sondern bei ihrer Klarheit und ihrem realen nächsten Schritt.
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
            <h2 className="h2">Eine belastbare Priorisierungsmatrix für Portalanfragen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Wenige klare Stufen sind im Alltag fast immer stärker als komplizierte Scoring-Modelle ohne echte Arbeitswirkung.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={matrixRows}
            rowKey={(item) => item.category}
            columns={[
              { key: "category", label: "Priorität", emphasize: true },
              { key: "case", label: "Typischer Fall" },
              { key: "nextStep", label: "Nächster Schritt" },
              { key: "watch", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="teamlogik" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Wie ein Maklerteam diese Priorisierung wirklich leben kann</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {teamRules.map((item) => (
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
              <h2 className="h3">Typische Fehler bei der Priorisierung von Portalanfragen</h2>
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
              <h2 className="h3 mt-3">Nicht alles Neue gehört nach ganz vorn</h2>
              <p className="helper mt-3">
                Gerade Portaleingänge wirken schnell dringlich. Wirklich stark wird die Queue aber erst, wenn Standardfälle, Dubletten und Sonderfälle sauber getrennt werden.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen für eine belastbare Portal-Priorisierung</h2>
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
              <h2 className="h3 mt-3">Priorisierung wirkt erst mit klaren Folgepfaden</h2>
              <p className="helper mt-3">
                Sobald Portalfälle sauber sortiert sind, entscheiden Qualifizierung, Nachfassen und Terminpfad über den eigentlichen Unterschied im Alltag.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/immobilienscout-anfragen-automatisieren" className="btn-secondary">
                  ImmoScout automatisieren
                </Link>
                <Link href="/immobilienscout-anfragen-nachfassen" className="btn-secondary">
                  ImmoScout nachfassen
                </Link>
                <Link href="/immobilienscout-anfragen-qualifizieren" className="btn-secondary">
                  ImmoScout qualifizieren
                </Link>
                <Link href="/anfragenqualifizierung-immobilienmakler" className="btn-secondary">
                  Anfragenqualifizierung
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
              <h2 className="h3 mt-3">Wenn der Portalqueue nicht nur schneller, sondern klarer werden soll</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                  Allgemeine Priorisierung
                </Link>
                <Link href="/immobilienscout-anfragen-automatisieren" className="btn-secondary">
                  ImmoScout automatisieren
                </Link>
                <Link href="/immobilienscout-anfragen-nachfassen" className="btn-secondary">
                  ImmoScout nachfassen
                </Link>
                <Link href="/immobilienscout-anfragen-qualifizieren" className="btn-secondary">
                  ImmoScout qualifizieren
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn die Basiserkennung noch wackelt</h2>
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
