import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import ResponsiveComparisonTable from "@/components/marketing/ResponsiveComparisonTable";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "14. April 2026";

const summary = [
  "Nicht jede Absage ist ein Problem. Für Maklerbüros teuer werden vor allem späte, stille oder schlecht dokumentierte Absagen kurz vor der Besichtigung.",
  "Der beste Weg, Besichtigungs-Absagen zu reduzieren, ist nicht Härte im Ton, sondern ein sauberer Pfad aus Bestätigung, Erinnerung, einfacher Rückmeldung und früher Einordnung unsicherer Fälle.",
  "Gute Prozesse machen Absagen früher sichtbar. Das senkt Leerlauf, spart Anfahrten und verbessert gleichzeitig die Datenlage für Eigentümergespräche und Folgemaßnahmen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#einordnung", label: "Welche Absagen schaden wirklich" },
  { href: "#hebel", label: "Die stärksten Hebel" },
  { href: "#prozess", label: "Sauberer Ablauf" },
  { href: "#auswertung", label: "Absagegründe auswerten" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Primärquellen von Propstack und onOffice mit Advaics Sicht auf Terminpfad, Rückkanäle und strukturierte Auswertung von Besichtigungs-Absagen.",
  "Bewertet wird nicht, wie sich jede Absage verhindern lässt, sondern wie sich späte und unproduktive Ausfälle reduzieren lassen, ohne den Prozess unfreundlich oder hektisch zu machen.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist ein ruhigerer Besichtigungspfad mit klaren Rückmeldungen statt maximaler Terminzahl im Kalender.",
];

const framingCards = [
  {
    title: "Frühe Absage ist besser als spätes Nichterscheinen",
    text: "Ein sauberer Rückkanal macht Absagen nicht häufiger problematisch, sondern früher sichtbar. Genau das schützt Teamzeit und schafft Raum für sinnvolle Nachsteuerung.",
  },
  {
    title: "Späte Absagen sind oft ein Prozesssignal",
    text: "Wenn Interessenten erst kurz vor dem Termin absagen, lagen oft schon vorher Unsicherheit, fehlende Bestätigung oder offene Fragen im Vorgang.",
  },
  {
    title: "Dokumentierte Gründe sind operativ wertvoll",
    text: "Absagen ohne Grund helfen kaum weiter. Strukturiert erfasste Gründe zeigen dagegen, ob eher Preis, Lage, Timing, Finanzierung oder Prozessfehler die Ausfälle treiben.",
  },
  {
    title: "Nicht jeder Termin verdient dieselbe Stabilisierung",
    text: "Einzeltermine, Massentermine und hochwertige Sonderfälle brauchen unterschiedliche Vorsicht. Eine einzige Standardlogik überdeckt diese Unterschiede eher, als sie zu lösen.",
  },
];

const leverRows = [
  {
    lever: "Klare Terminbestätigung",
    bestFor: "Einzeltermine mit fester Uhrzeit und eindeutiger Zuständigkeit",
    effect: "Reduziert schwebende Zusagen und macht den Termin verbindlicher",
    watch: "Nur belastbar, wenn Änderungen und Verschiebungen denselben Pfad weiter nutzen",
  },
  {
    lever: "Einfache Terminabsage per Klick oder kurzem Rückweg",
    bestFor: "Standardtermine und Besichtigungen mit höherem Volumen",
    effect: "Macht frühe Rückmeldungen wahrscheinlicher als stilles Wegfallen",
    watch: "Absagen müssen intern sofort sichtbar und als Status verarbeitet werden",
  },
  {
    lever: "Erinnerung mit klarer Rückfrageoption",
    bestFor: "Termine 24 Stunden vor Besichtigung oder bei längerer Vorlaufzeit",
    effect: "Holt Unsicherheit rechtzeitig nach vorn, statt sie am Terminmorgen zu entdecken",
    watch: "Nicht als bloße Kalendermail behandeln; Rückweg für Änderung oder Absage gehört dazu",
  },
  {
    lever: "Zeitfenster oder Alternativen statt starrem Pingpong",
    bestFor: "Fälle mit Abstimmungsaufwand oder mehreren Beteiligten",
    effect: "Reduziert späte Absagen, die nur aus Terminunklarheit entstanden sind",
    watch: "Die finale Auswahl muss danach sauber bestätigt werden",
  },
  {
    lever: "Absagegründe strukturiert erfassen",
    bestFor: "Teams mit wiederkehrenden Ausfällen oder Eigentümerberichtspflicht",
    effect: "Zeigt, welche Gründe häufiger auftreten und wo der Prozess angepasst werden sollte",
    watch: "Nur wertvoll, wenn die Gründe regelmäßig gepflegt und ausgewertet werden",
  },
];

const processSteps = [
  {
    title: "1. Termin nur aus qualifiziertem nächsten Schritt heraus vergeben",
    text: "Wenn ein Termin aus unklarer Anfrage, offener Verfügbarkeit oder zu frühem Enthusiasmus entsteht, steigt das Absagerisiko schon am Start.",
  },
  {
    title: "2. Zusage sichtbar machen",
    text: "Sobald ein Termin steht, braucht das Team einen klaren Status. Wer nur auf lose Mailverläufe vertraut, erkennt instabile Zusagen oft zu spät.",
  },
  {
    title: "3. Rückweg für Änderung oder Absage vereinfachen",
    text: "Interessenten sollen ohne Reibung absagen oder verschieben können. Das Ziel ist nicht weniger Ehrlichkeit, sondern weniger stille oder späte Ausfälle.",
  },
  {
    title: "4. Kurz vor dem Termin aktiv stabilisieren",
    text: "Eine gute Erinnerung mit Uhrzeit, Ort und Ansprechpartner macht Unsicherheit sichtbar, solange der Kalender noch reagieren kann.",
  },
  {
    title: "5. Gründe dokumentieren und für nächste Fälle nutzen",
    text: "Wenn Absagen sauber erfasst werden, entsteht aus jeder verlorenen Besichtigung wenigstens ein besseres Verständnis für Timing, Objektfit oder Beratungsbedarf.",
  },
];

const analysisBlocks = [
  {
    title: "Absagegründe helfen nur mit System",
    text: "Wenn Gründe frei im Notizfeld verschwinden, ist später kaum erkennbar, ob eher Preis, Lage, Finanzierung oder Terminprozess die Ausfälle treiben. Ein fester Katalog bringt Vergleichbarkeit.",
  },
  {
    title: "Frühe Signale sind wichtiger als perfekte Kategorisierung",
    text: "Schon die Trennung zwischen früher Absage, später Absage und stillem Ausfall bringt operativ viel. Danach lohnt sich die feinere Aufschlüsselung.",
  },
  {
    title: "Eigentümergespräche profitieren von sauberer Dokumentation",
    text: "Wer Absagen strukturiert belegt, kann Vermarktungsprobleme sachlicher besprechen statt sich auf Einzelanekdoten zu verlassen.",
  },
];

const metrics = [
  "Anteil früher Absagen gegenüber Absagen am Termin- oder Vortag",
  "Quote stiller Ausfälle gegenüber dokumentierten Absagen",
  "Durchschnittliche Zeit zwischen Absage und ursprünglichem Termin",
  "Häufigste Absagegründe nach Objektart oder Vermarktungsphase",
  "Anteil Termine mit Erinnerung und klar dokumentiertem Rückkanal",
  "Zeitaufwand des Teams für Ersatzplanung oder Nachtelefonieren bei abgesagten Terminen",
];

const advaicFit = [
  "Ihr Team verliert vor Besichtigungen zu viel Zeit durch späte Absagen, unklare Terminlage oder fehlende Rückmeldungen.",
  "Sie möchten Erinnerungen, Rückwege und Statuswechsel enger an den echten Besichtigungspfad koppeln statt lose Einzelmails zu verschicken.",
  "Sie suchen keine aggressive Termindisziplin, sondern einen ruhigeren Ablauf mit früheren und besser dokumentierten Entscheidungen.",
];

const advaicNotFit = [
  "Termine werden intern noch so lose gepflegt, dass schon die Grundfrage offen ist, welche Besichtigungen überhaupt wirklich bestätigt sind.",
  "Das Volumen ist sehr niedrig und fast jeder Termin wird ohnehin individuell telefonisch begleitet.",
  "Der größere Engpass liegt vor dem Termin, zum Beispiel in schwacher Qualifizierung oder verspäteter Erstreaktion auf neue Anfragen.",
];

const faqItems = [
  {
    question: "Sollten Makler Absagen wirklich reduzieren oder nur früher sichtbar machen?",
    answer:
      "Beides, aber der erste Schritt ist fast immer: frühere, klarere Rückmeldung. Eine früh sichtbare Absage ist operativ deutlich besser als ein stiller oder sehr später Ausfall.",
  },
  {
    question: "Welche Absagen sind besonders teuer?",
    answer:
      "Vor allem späte Absagen am Vortag oder kurz vor dem Termin sowie stille Ausfälle ohne Rückmeldung. Sie verursachen Leerlauf, unnötige Anfahrt und hektische Nacharbeit.",
  },
  {
    question: "Braucht jedes Büro formale Absagegründe?",
    answer:
      "Spätestens bei regelmäßigem Besichtigungsvolumen ja. Schon ein kleiner, klarer Katalog hilft, Muster zu erkennen und Eigentümergespräche besser zu führen.",
  },
  {
    question: "Macht ein leichter Absageweg nicht alles schlimmer?",
    answer:
      "In der Praxis meist nicht. Ein leichter Absageweg ersetzt eher stille Ausfälle durch frühere, nutzbare Information und verbessert damit den Ablauf.",
  },
];

const sources = [
  {
    label: "Propstack: Terminabsage per Klick",
    href: "https://support.propstack.de/hc/de/articles/23749142496541-Terminabsage-per-Klick",
    note: "Offizielle Hilfeseite für einen vereinfachten digitalen Absageweg direkt aus der Terminlogik heraus.",
  },
  {
    label: "Propstack: Absagegründe",
    href: "https://support.propstack.de/hc/de/articles/26699317000349-Absagegr%C3%BCnde-Nutzung-und-individuelle-Anpassung",
    note: "Offizielle Anleitung zur strukturierten Erfassung, Automatisierung und Auswertung von Absagegründen.",
  },
  {
    label: "Propstack: Feedback-Landing-Page",
    href: "https://support.propstack.de/hc/de/articles/18363189895965-Feedback-Landing-Page",
    note: "Offizielle Hilfe zum Erfassen von Absagen und Gründen über einen direkten Rückkanal für Interessenten.",
  },
  {
    label: "onOffice Hilfe: Interessenten – Von Abgesagt bis Vertrag",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/immobiliendetailansicht/interessenten-ueberblick/interessentenreiter-abgesagt-expose-besichtigung-vertrag/",
    note: "Offizielle Hilfe zu Statusreiter und sauberer Trennung zwischen abgesagten und fortlaufenden Interessentenständen.",
  },
  {
    label: "onOffice Hilfe: Zeitfenster für Termine",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/zeitfenster-fuer-termine/",
    note: "Offizielle Hilfe zu strukturierten Zeitfenstern als Mittel gegen Abstimmungschaos vor Besichtigungen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Besichtigung-Absagen reduzieren 2026",
  ogTitle: "Besichtigung-Absagen reduzieren 2026 | Advaic",
  description:
    "Praxisleitfaden für Makler: Wie späte und stille Besichtigungs-Absagen durch klarere Bestätigung, Rückwege und Auswertung reduziert werden.",
  path: "/besichtigung-absagen-reduzieren",
  template: "guide",
  eyebrow: "Besichtigungs-Absagen",
  proof: "Weniger teure Absagen entstehen durch frühe Rückmeldung, klare Statuspflege und auswertbare Gründe.",
});

export default function BesichtigungAbsagenReduzierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Besichtigung-Absagen reduzieren 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-14",
        mainEntityOfPage: `${siteUrl}/besichtigung-absagen-reduzieren`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Besichtigungs-Absagen", "Terminpfad", "Immobilienmakler", "Besichtigungen"],
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
        { name: "Besichtigung-Absagen reduzieren", path: "/besichtigung-absagen-reduzieren" },
      ]}
      schema={schema}
      kicker="Besichtigungs-Absagen"
      title="Wie Makler teure Besichtigungs-Absagen reduzieren"
      description="Wirklich schädlich sind selten frühe, klare Absagen. Teuer werden späte und stille Ausfälle. Genau dort helfen sauberere Bestätigung, klarere Rückwege und bessere Auswertung."
      actions={
        <>
          <Link href="/no-show-besichtigungen-reduzieren" className="btn-secondary">
            No-Shows reduzieren
          </Link>
          <Link href="/signup?entry=besichtigung-absagen-reduzieren" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu den Hebeln oder zur Auswertung springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#hebel" className="btn-secondary w-full justify-center">
              Hebel
            </MarketingJumpLink>
            <MarketingJumpLink href="#auswertung" className="btn-secondary w-full justify-center">
              Auswertung
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="besichtigung-absagen-reduzieren"
      primaryHref="/signup?entry=besichtigung-absagen-reduzieren-stage"
      primaryLabel="Mit echten Terminen prüfen"
      secondaryHref="/besichtigungserinnerungen-automatisieren"
      secondaryLabel="Erinnerungen automatisieren"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung zu Terminabsagen, Absagegründen, Statuspflege und strukturierten Rückwegen. Für die echte Steuerung sollten Sie Ihre Absagen zusätzlich nach Objektart und Vorlaufzeit auswerten."
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
                Produkt- und Prozessteam mit Fokus auf Besichtigungspfad, Folgekommunikation und dokumentierte
                Entscheidungslogik im Makleralltag.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite Absagen bewertet</h2>
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

      <section id="einordnung" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche Besichtigungs-Absagen wirklich schaden</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Ziel ist nicht, jede Absage zu verhindern. Ziel ist, späte, stille und schlecht dokumentierte Ausfälle zu
              vermeiden.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {framingCards.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="hebel" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Die stärksten Hebel gegen teure Absagen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Gegenmaßnahmen machen Rückmeldungen früher und klarer, statt einfach nur mehr Druck vor dem Termin
              aufzubauen.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={leverRows}
            rowKey={(item) => item.lever}
            columns={[
              { key: "lever", label: "Hebel", emphasize: true },
              { key: "bestFor", label: "Sinnvoll für" },
              { key: "effect", label: "Wirkung" },
              { key: "watch", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="prozess" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Ein sauberer Ablauf, der späte Ausfälle unwahrscheinlicher macht</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {processSteps.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="auswertung" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Warum Absagegründe operativ Gold wert sind</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {analysisBlocks.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen für weniger späte Ausfälle</h2>
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
              <h2 className="h3 mt-3">Absagen, No-Shows und Erinnerungen hängen zusammen</h2>
              <p className="helper mt-3">
                Wer teure Absagen senken will, muss meist an mehreren Stellen gleichzeitig klarer werden: vor dem
                Termin, kurz davor und bei der Rückmeldung danach.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/no-show-besichtigungen-reduzieren" className="btn-secondary">
                  No-Shows reduzieren
                </Link>
                <Link href="/besichtigung-bestaetigen" className="btn-secondary">
                  Besichtigung bestätigen
                </Link>
                <Link href="/besichtigungserinnerungen-automatisieren" className="btn-secondary">
                  Erinnerungen
                </Link>
                <Link href="/besichtigungstermine-koordinieren" className="btn-secondary">
                  Termine koordinieren
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
              <h2 className="h3 mt-3">Wenn späte Ausfälle im Terminpfad noch zu viel Zeit kosten</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/besichtigung-bestaetigen" className="btn-secondary">
                  Bestätigen
                </Link>
                <Link href="/besichtigungserinnerungen-automatisieren" className="btn-secondary">
                  Erinnerungen
                </Link>
                <Link href="/no-show-besichtigungen-reduzieren" className="btn-secondary">
                  No-Shows
                </Link>
                <Link href="/besichtigungstermine-koordinieren" className="btn-secondary">
                  Terminlogik
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn die Grundordnung noch zu lose ist</h2>
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
