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
  "Gute Anfragenqualifizierung bedeutet nicht, Menschen mit Fantasie-Scores zu sortieren. Sie bedeutet, Anfragen nach Relevanz, Klarheit, Dringlichkeit und nächstem sinnvollen Schritt zu ordnen.",
  "Der häufigste Fehler ist, jede Anfrage sofort wie einen Besichtigungskandidaten zu behandeln. Dadurch werden Teams hektisch und echte Chancen gehen zwischen Standardfällen verloren.",
  "Qualifizierung ist die Brücke zwischen Eingang und Besichtigung. Wenn diese Stufe sauber läuft, werden Antwortzeit, Terminkoordination und Nachfassen deutlich stabiler.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#worum-es-geht", label: "Worum es geht" },
  { href: "#signale", label: "Wichtige Signale" },
  { href: "#matrix", label: "Qualifizierungsmatrix" },
  { href: "#fehler", label: "Typische Fehler" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Primärquellen von onOffice, FLOWFACT und Propstack mit Advaics Sicht auf operatives Lead Routing im Makleralltag.",
  "Bewertet wird nicht, welcher Lead theoretisch am wertvollsten klingt, sondern welcher nächste Schritt fachlich sauber ist: sofort beantworten, weiter qualifizieren, in die Besichtigung führen, freigeben oder archivieren.",
  "Die Empfehlungen sind bewusst pragmatisch. Ziel ist kein künstlich kompliziertes Scoring, sondern ein belastbarer Qualifizierungsrahmen für das Tagesgeschäft.",
];

const whyQualificationMatters = [
  {
    title: "Nicht jede Anfrage ist gleich reif",
    text: "Zwischen erstem Interesse, Exposé-Klick, ernsthafter Rückfrage und Besichtigungswunsch liegen operative Unterschiede, die im Eingangspfad sichtbar werden müssen.",
  },
  {
    title: "Zu frühe Gleichbehandlung kostet Zeit",
    text: "Wenn jede Anfrage sofort gleich intensiv bearbeitet wird, blockiert das Team sich selbst und verliert Geschwindigkeit bei den wirklich klaren Fällen.",
  },
  {
    title: "Zu grobe Filter kosten Abschlüsse",
    text: "Wer zu hart vorsortiert, übersieht oft gute Interessenten mit unvollständiger Erstnachricht. Deshalb braucht Qualifizierung eine Zwischenstufe statt nur Ja oder Nein.",
  },
  {
    title: "Besichtigung ist kein Startpunkt, sondern Ergebnis",
    text: "Gute Qualifizierung führt Interessenten geordnet in Exposé, Rückfrage, Nachfassen und Besichtigung. Schlechte Qualifizierung überspringt diese Reihenfolge.",
  },
];

const qualificationSignals = [
  {
    title: "Objekt- und Quellenbezug",
    text: "Die stärkste Grundlage ist eine sauber zuordenbare Anfrage: welches Objekt, welcher Kanal, welcher Zusammenhang, welcher Ansprechpartner.",
  },
  {
    title: "Vollständigkeit und Kontaktierbarkeit",
    text: "Name, Rückkanal, Inhalt und nachvollziehbarer Zweck entscheiden darüber, ob ein Fall sofort bearbeitbar ist oder erst qualifiziert werden muss.",
  },
  {
    title: "Interesse und Reifegrad",
    text: "Eine konkrete Rückfrage, ein klarer Besichtigungswunsch oder ein erkennbarer nächster Schritt sind stärkere Signale als ein sehr allgemeines Erstinteresse.",
  },
  {
    title: "Risiko und Sonderfall",
    text: "Beschwerden, Konflikte, Widersprüche, Preisverhandlungen oder unsaubere Angaben gehören nicht in einen normalen Qualifizierungspfad, sondern in Freigabe oder manuelle Bearbeitung.",
  },
];

const qualificationRows = [
  {
    stage: "Sofort beantworten",
    signals: "Sauberer Objektbezug, klare Standardfrage, vollständiger Rückkanal",
    nextStep: "Erstantwort und nächster sinnvoller Schritt",
    purpose: "Schnelle Reaktion auf eindeutige Standardfälle",
  },
  {
    stage: "Weiter qualifizieren",
    signals: "Grundinteresse ist erkennbar, aber Angaben oder nächster Schritt sind noch zu unklar",
    nextStep: "Gezielte Rückfrage oder Exposé-/Info-Pfad",
    purpose: "Gute Interessenten nicht verlieren, ohne zu früh zu weit zu gehen",
  },
  {
    stage: "Besichtigung vorbereiten",
    signals: "Konkreter Besichtigungswunsch oder deutlich erkennbarer nächster Schritt",
    nextStep: "Terminpfad, Slot-Vorschlag oder individuelle Abstimmung",
    purpose: "Reife Anfragen zügig in den Terminprozess führen",
  },
  {
    stage: "Zur Freigabe",
    signals: "Widerspruch, Sonderfall, Beschwerde, sensible Aussage oder unklarer Kontext",
    nextStep: "Bewusst manuell entscheiden",
    purpose: "Risiko begrenzen und unklare Fälle nicht blind routen",
  },
  {
    stage: "Archivieren oder ignorieren",
    signals: "Rundmail, Systemrauschen, Spam oder keine echte Interessenten-Anfrage",
    nextStep: "Nicht in den Antwortpfad ziehen",
    purpose: "Operativen Fokus auf relevante Fälle halten",
  },
];

const commonMistakes = [
  "Jede Anfrage sofort als heißen Lead behandeln, obwohl Kontext und Reifegrad noch unklar sind.",
  "Mit zu vielen künstlichen Scores arbeiten, aber keine klaren nächsten Schritte definieren.",
  "Besichtigungen zu früh anbieten, bevor Objektbezug, Erwartung und Kontaktierbarkeit sauber geprüft sind.",
  "Freigabefälle und gewöhnliche Qualifizierungsfälle vermischen, bis niemand mehr den Unterschied sieht.",
];

const metrics = [
  "Anteil Anfragen mit sauberem nächstem Schritt innerhalb der ersten Reaktion",
  "Quote qualifizierter Fälle, die in den Besichtigungspfad übergehen",
  "Freigabequote bei widersprüchlichen oder sensiblen Fällen",
  "Median-Zeit vom Eingang bis zur Qualifizierungsentscheidung",
  "Anteil unnötig früh angesetzter Besichtigungsvorschläge",
  "Anteil qualifizierter Fälle, die im Nachfassen weiterentwickelt werden",
];

const advaicFit = [
  "Ihr Team braucht einen klareren Übergang zwischen Erstantwort, Qualifizierung, Besichtigung und Freigabe.",
  "Sie möchten Anfragen nach echtem nächstem Schritt ordnen statt nach Bauchgefühl oder starren Punktesystemen.",
  "Sie suchen operative Steuerung im Anfrageeingang und nicht nur ein CRM-Feld für Lead-Status.",
];

const advaicNotFit = [
  "Objekte, Zuständigkeiten und Kommunikationswege sind intern noch zu unsauber für einen belastbaren Qualifizierungspfad.",
  "Das Anfragevolumen ist so gering, dass eine explizite Qualifizierungslogik kaum operative Wirkung entfaltet.",
  "Sie möchten vor allem Vertriebsreporting oder Pipeline-Statistiken und nicht zuerst bessere Entscheidungen im Eingang.",
];

const faqItems = [
  {
    question: "Was ist der Unterschied zwischen Anfragenqualifizierung und Lead-Scoring?",
    answer:
      "Lead-Scoring arbeitet oft abstrakt mit Punkten. Gute Anfragenqualifizierung im Makleralltag ordnet dagegen konkrete nächste Schritte zu: beantworten, weiter qualifizieren, Besichtigung vorbereiten, freigeben oder archivieren.",
  },
  {
    question: "Sollte jede interessante Anfrage direkt zur Besichtigung führen?",
    answer:
      "Nein. Erst wenn Kontext, Reifegrad und nächster Schritt klar sind. Sonst entstehen unnötige Termine, Rückfragen und operative Unruhe.",
  },
  {
    question: "Wann gehört eine Anfrage nicht in die Qualifizierung, sondern in die Freigabe?",
    answer:
      "Bei Beschwerden, Widersprüchen, Sonderfällen, sensiblen Aussagen oder unklarer Zuordnung. Dort hilft ein normaler Qualifizierungsprozess nicht mehr weiter.",
  },
  {
    question: "Was ist ein guter Start für kleine Maklerteams?",
    answer:
      "Mit einer einfachen Matrix aus Standardfall, weiter qualifizieren, Besichtigung vorbereiten, Freigabe und Archivieren. Mehr Komplexität lohnt sich oft erst später.",
  },
];

const sources = [
  {
    label: "onOffice Enterprise Hilfe: Interessenten - Von Abgesagt bis Vertrag",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/reiter-interessenten-von-abgesagt-bis-vertrag/",
    note: "Offizielle Quelle zu Interessentenstatus, Reifegrad und Übergängen zwischen Exposé, Besichtigung und Vertrag im Maklerprozess.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Offizielle Hilfeseite zur Einordnung verschiedener Anfragearten und ihrer Bedeutung für den operativen Pfad.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite zur automatischen Erkennung, Kontaktanlage und Weiterverarbeitung eingehender Anfragen.",
  },
  {
    label: "Harvard Business Review: The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum zügige und passende Reaktion wirtschaftlich relevant ist, sobald der nächste Schritt sauber bestimmt wurde.",
  },
  {
    label: "ImmoScout24: Über ImmoScout24",
    href: "https://www.immobilienscout24.de/unternehmen/immobilienscout24/",
    note: "Markteinordnung für einen der wichtigsten Anfragekanäle im deutschen Immobilienmarkt.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Anfragenqualifizierung für Immobilienmakler 2026: Welche Leads zuerst bearbeitet werden sollten",
  ogTitle: "Anfragenqualifizierung für Immobilienmakler 2026 | Advaic",
  description:
    "Leitfaden für Makler: Wie Anfragen nach Relevanz, Reifegrad und nächstem sinnvollen Schritt qualifiziert werden, statt mit unscharfem Lead-Scoring zu arbeiten.",
  path: "/anfragenqualifizierung-immobilienmakler",
  template: "guide",
  eyebrow: "Anfragenqualifizierung",
  proof:
    "Gute Qualifizierung ordnet keine Fantasie-Scores zu, sondern klare nächste Schritte zwischen Antwort, Qualifizierung, Besichtigung, Freigabe und Archiv.",
});

export default function AnfragenqualifizierungImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Anfragenqualifizierung für Immobilienmakler 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-10",
        mainEntityOfPage: `${siteUrl}/anfragenqualifizierung-immobilienmakler`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Anfragenqualifizierung", "Lead Routing", "Immobilienmakler", "Besichtigungsreife"],
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
        { name: "Anfragenqualifizierung", path: "/anfragenqualifizierung-immobilienmakler" },
      ]}
      schema={schema}
      kicker="Anfragenqualifizierung"
      title="Wie Makler Anfragen sinnvoll qualifizieren, statt sie nur zu sortieren"
      description="Eine gute Qualifizierungslogik entscheidet nicht über schöne Scores, sondern über den nächsten sinnvollen Schritt. Genau dort entsteht der operative Unterschied zwischen Hektik und Struktur."
      actions={
        <>
          <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
            Anfragenmanagement
          </Link>
          <Link href="/signup?entry=anfragenqualifizierung-immobilienmakler" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu Signalen oder zur Qualifizierungsmatrix springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#signale" className="btn-secondary w-full justify-center">
              Signale
            </MarketingJumpLink>
            <MarketingJumpLink href="#matrix" className="btn-secondary w-full justify-center">
              Matrix
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="anfragenqualifizierung-immobilienmakler"
      primaryHref="/signup?entry=anfragenqualifizierung-immobilienmakler-stage"
      primaryLabel="Mit echten Anfragen testen"
      secondaryHref="/besichtigungsanfragen-automatisieren"
      secondaryLabel="Besichtigungsanfragen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Interessentenstatus, Anfragearten und operativer Weiterverarbeitung. Für die konkrete Umsetzung sollten Sie immer Ihre echten Eingangsmuster und Ihr Vermarktungsmodell mitprüfen."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Qualifizierung, Besichtigungspfad und
                kontrollierte Prozesssteuerung im Makleralltag.
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

      <section id="worum-es-geht" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Worum es bei Anfragenqualifizierung im Makleralltag wirklich geht</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Qualifizierung ordnet nicht nur ein, ob ein Lead spannend klingt. Sie definiert, welcher nächste
              Schritt fachlich sauber und operativ sinnvoll ist.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {whyQualificationMatters.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="signale" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Welche Signale für die Qualifizierung wirklich zählen</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {qualificationSignals.map((item) => (
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
            <h2 className="h2">Eine einfache Qualifizierungsmatrix für den Alltag</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die stärkste Matrix ist meist nicht die komplexeste, sondern die, die das Team täglich sauber anwenden
              kann.
            </p>
          </div>

          <ResponsiveComparisonTable
            columns={[
              { key: "stage", label: "Stufe", emphasize: true },
              { key: "signals", label: "Typische Signale" },
              { key: "nextStep", label: "Nächster Schritt", mobileLabel: "Nächster Schritt" },
              { key: "purpose", label: "Zweck" },
            ]}
            rows={qualificationRows}
            rowKey={(row) => row.stage}
          />
        </Container>
      </section>

      <section id="fehler" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Typische Fehler in der Anfragenqualifizierung</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {commonMistakes.map((item) => (
                  <article key={item} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="card-base p-6">
              <p className="label">Merksatz</p>
              <h2 className="h3 mt-3">Qualifizierung ist Routing, nicht Rätselraten</h2>
              <p className="helper mt-3">
                Wenn niemand im Team sagen kann, warum eine Anfrage genau in diesen nächsten Schritt geht, ist die
                Logik zu diffus.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen für belastbare Qualifizierung</h2>
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
              <h2 className="h3 mt-3">Nach Qualifizierung wird der Besichtigungspfad wichtig</h2>
              <p className="helper mt-3">
                Wenn Qualifizierung sauber funktioniert, entsteht der nächste große Hebel fast immer in der
                Terminlogik und im Nachfassen rund um Besichtigungen.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                  Anfragen priorisieren
                </Link>
                <Link href="/besichtigungsanfragen-automatisieren" className="btn-secondary">
                  Besichtigungsanfragen
                </Link>
                <Link href="/immobilienanfragen-nachfassen" className="btn-secondary">
                  Immobilienanfragen nachfassen
                </Link>
                <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
                  Follow-up-E-Mails
                </Link>
                <Link href="/immobilienscout-anfragen-qualifizieren" className="btn-secondary">
                  ImmoScout qualifizieren
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
              <h2 className="h3 mt-3">Wenn der nächste Schritt klarer werden soll</h2>
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
                  ImmoScout-Anfragen
                </Link>
                <Link href="/immobilienscout-anfragen-qualifizieren" className="btn-secondary">
                  ImmoScout qualifizieren
                </Link>
                <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                  Anfragen priorisieren
                </Link>
                <Link href="/immobilienanfragen-nachfassen" className="btn-secondary">
                  Immobilienanfragen nachfassen
                </Link>
                <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                  Anfragenmanagement
                </Link>
                <Link href="/besichtigungsanfragen-automatisieren" className="btn-secondary">
                  Besichtigungen
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn der Grundprozess noch zu unscharf ist</h2>
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
