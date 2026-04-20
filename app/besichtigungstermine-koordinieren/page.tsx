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
  "Besichtigungstermine zu koordinieren heißt nicht nur, freie Kalenderlücken zu verschicken. Entscheidend ist, welches Terminmodell zum Objekt, zur Nachfrage und zum Teamrhythmus passt.",
  "Der häufigste Fehler ist, Einzeltermine, Zeitfenster und Massentermine mit derselben Logik zu behandeln. Dadurch entstehen unnötige Rückfragen, Doppelzusagen und unklare Verantwortlichkeiten.",
  "Gute Terminkoordination beginnt nach der Qualifizierung und endet nicht mit der Bestätigung. Änderungen, Absagen, Erinnerungen und Nachbereitung müssen genauso sauber geregelt sein.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#modelle", label: "Terminmodelle" },
  { href: "#auswahl", label: "Welches Modell wann passt" },
  { href: "#ablauf", label: "Sauberer Ablauf" },
  { href: "#aenderungen", label: "Änderungen & Absagen" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Primärquellen von onOffice, onPointment, Propstack und FLOWFACT mit Advaics Sicht auf Besichtigungspfad, Erinnerungen und Statuslogik.",
  "Bewertet wird nicht nur die Buchung selbst, sondern die gesamte Terminkoordination: Auswahl des Modells, Einladung, Bestätigung, Erinnerungen, Änderungen, Ausfälle und Anschlussprozess.",
  "Die Empfehlungen sind bewusst pragmatisch. Für Maklerbüros ist nicht der eleganteste Kalender entscheidend, sondern ob Termine zuverlässig zustande kommen und das Team den Überblick behält.",
];

const coordinationModels = [
  {
    model: "Einzeltermin",
    bestFor: "Beratungsintensive Objekte, hochwertige Einzelinteressenten, komplexe Abstimmung",
    strengths: "Hohe Kontrolle, persönliche Abstimmung, geringe Verwechslungsgefahr",
    watch: "Zeitaufwendig bei hohem Volumen und anfällig für Ping-Pong-Kommunikation",
  },
  {
    model: "Zeitfenster",
    bestFor: "Gut planbare Standardbesichtigungen mit klaren Verfügbarkeiten",
    strengths: "Schnellere Auswahl, weniger manuelle Abstimmung, gute Planbarkeit",
    watch: "Braucht saubere Freigaberegeln und klare Slot-Verwaltung im Kalender",
  },
  {
    model: "Online-Buchungslink",
    bestFor: "Teams mit wiederkehrenden Standardterminen und stabilem Kalender-Setup",
    strengths: "Hohe Geschwindigkeit, weniger Rückfragen, direkte Verknüpfung von Termin und Datensatz",
    watch: "Nur sinnvoll, wenn Rückfragen, Absagen und Sonderfälle trotzdem sichtbar abgefangen werden",
  },
  {
    model: "Massentermin",
    bestFor: "Hohe Nachfrage auf einzelne Miet- oder Standardobjekte",
    strengths: "Gebündelte Kommunikation, bessere Auslastung, weniger Einzelabstimmung",
    watch: "Teilnehmerzahl, Zu- und Absagen sowie Dealphase müssen sauber gesteuert werden",
  },
];

const officeFits = [
  {
    title: "Wenige hochwertige Anfragen",
    text: "Hier ist der Einzeltermin oft sinnvoller als jede technische Optimierung. Der größte Hebel liegt in sauberer Vorbereitung und verbindlicher Nachbereitung.",
  },
  {
    title: "Regelmäßiges Standardvolumen",
    text: "Sobald ähnliche Anfragen häufiger auftreten, helfen Zeitfenster oder ein kontrollierter Buchungslink deutlich mehr als ständige Einzelabstimmung per Mail.",
  },
  {
    title: "Hoher Andrang auf einzelne Objekte",
    text: "Dann sind Massentermine oft die stabilste Lösung, weil sie Kommunikation bündeln und die Dealphase klarer strukturieren.",
  },
  {
    title: "Kleines Team mit engem Kalender",
    text: "Hier zählt weniger Featuretiefe als ein Terminmodell, das Zuständigkeiten, Rückmeldungen und Änderungen ohne ständige Unterbrechung handhabbar macht.",
  },
];

const processSteps = [
  {
    title: "1. Nur terminreife Anfragen in die Koordination ziehen",
    text: "Vor der Terminvergabe sollte klar sein, ob Objektbezug, Interesse und nächster Schritt wirklich passen. Sonst wird der Kalender zum Filter für unreife Fälle.",
  },
  {
    title: "2. Passendes Terminmodell pro Objekt wählen",
    text: "Je nach Nachfrage, Teamgröße und Beratungsintensität passt Einzeltermin, Zeitfenster, Buchungslink oder Massentermin.",
  },
  {
    title: "3. Einladung eindeutig formulieren",
    text: "Eine gute Einladung zeigt Datum, Uhrzeit, Ort, Ansprechpartner, Änderungsweg und den Status der Zusage ohne Interpretationsspielraum.",
  },
  {
    title: "4. Änderungen und Absagen als Prozess behandeln",
    text: "Nicht jede Verschiebung ist nur ein Kalenderproblem. Gerade bei mehreren Beteiligten braucht es klare Zuständigkeit und Sichtbarkeit im Datensatz.",
  },
  {
    title: "5. Nachbereitung sofort anschließen",
    text: "Nach dem Termin sollte direkt klar sein, ob Nachfassen, weitere Qualifizierung, Dokumentennachreichung oder Abschlussvorbereitung folgt.",
  },
];

const changeRules = [
  {
    title: "Änderungen brauchen einen einzigen sichtbaren Pfad",
    text: "Wenn Rückfragen per Telefon, Mail und Portal parallel laufen, verliert das Team schnell den Überblick über den echten Stand des Termins.",
  },
  {
    title: "Absagen müssen Folgepfade stoppen",
    text: "Reminder, Anfahrtsinformationen oder Nachfassmails dürfen nach einer Absage nicht ungebremst weiterlaufen.",
  },
  {
    title: "No-Shows sollten nicht nur ärgerlich, sondern auswertbar sein",
    text: "Wer No-Shows nicht sichtbar macht, kann weder Slot-Länge noch Reminder-Taktung oder Terminmodell sinnvoll verbessern.",
  },
  {
    title: "Massentermine brauchen eigene Zu- und Absagelogik",
    text: "Bei mehreren Interessenten pro Slot muss klar sein, wie Plätze vergeben, verschoben oder individuell wieder freigegeben werden.",
  },
];

const metrics = [
  "Zeit vom Besichtigungswunsch bis zur bestätigten Rückmeldung",
  "No-Show-Quote nach Bestätigung und Erinnerung",
  "Anteil manuell nachkorrigierter Terminabsprachen",
  "Anteil Termine mit sauber dokumentierter Zu- oder Absage",
  "Quote qualifizierter Anfragen, die tatsächlich in einen Termin münden",
  "Anteil bestätigter Termine, aus denen direkt ein sinnvoller Folgepfad entsteht",
];

const faqItems = [
  {
    question: "Was ist der Unterschied zwischen Besichtigungsanfragen automatisieren und Besichtigungstermine koordinieren?",
    answer:
      "Bei Besichtigungsanfragen geht es um den Übergang von der Anfrage in den Terminpfad. Bei der Terminkoordination geht es um das eigentliche Organisieren von Slots, Bestätigungen, Änderungen, Absagen und Nachbereitung.",
  },
  {
    question: "Wann sind Zeitfenster sinnvoller als Einzeltermine?",
    answer:
      "Wenn ein Objekt regelmäßig ähnliche Besichtigungen erzeugt und der nächste Schritt klar genug ist. Bei beratungsintensiven oder sehr individuellen Fällen bleiben Einzeltermine oft besser.",
  },
  {
    question: "Wann lohnt sich ein Online-Buchungslink für Makler?",
    answer:
      "Wenn Kalender, Zuständigkeiten und Rückfallregeln stabil sind. Ein Buchungslink spart nur dann wirklich Zeit, wenn Änderungen, Sonderfälle und Absagen weiterhin sauber abgefangen werden.",
  },
  {
    question: "Was ist bei Massenterminen der häufigste Fehler?",
    answer:
      "Zu viele Einladungen ohne klare Teilnehmer- und Statuslogik. Dann wird aus einem operativen Vorteil schnell ein chaotischer Besichtigungstag.",
  },
];

const sources = [
  {
    label: "onPointment: Online-Terminbuchungssystem für Immobilienmakler",
    href: "https://at.onoffice.com/immobiliensoftware/online-terminbuchungssystem/",
    note: "Offizielle Herstellerseite zur Online-Terminbuchung, Kalenderverknüpfung und kontrollierten Freigabe von Zeitfenstern.",
  },
  {
    label: "onOffice Hilfe: Zeitfenster für Termine definieren",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/zeitfenster-fuer-termine-definieren/",
    note: "Offizielle Hilfeseite zur Steuerung verfügbarer Terminfenster im Makleralltag.",
  },
  {
    label: "Propstack Hilfe: Massentermine",
    href: "https://support.propstack.de/hc/de/articles/18385951788317-Massentermine",
    note: "Offizielle Hilfeseite zu Slot-Logik, Einladungen, Dealphasen und individuellen Zu- und Absagen bei Massenterminen.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite zum Übergang von Anfrageerkennung in strukturierte Folgeprozesse.",
  },
  {
    label: "Harvard Business Review: The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum schnelle und passende Weiterführung nach einer eingehenden Anfrage wirtschaftlich relevant bleibt.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Besichtigungstermine koordinieren 2026: Wie Makler Termine ohne Chaos organisieren",
  ogTitle: "Besichtigungstermine koordinieren 2026 | Advaic",
  description:
    "Leitfaden für Makler: Wie Besichtigungstermine mit Einzelterminen, Zeitfenstern, Buchungslinks und Massenterminen sauber koordiniert werden.",
  path: "/besichtigungstermine-koordinieren",
  template: "guide",
  eyebrow: "Besichtigungstermine",
  proof:
    "Gute Terminkoordination trennt Terminmodelle sauber, hält Änderungen sichtbar und verbindet Zusagen mit einem klaren Folgepfad.",
});

export default function BesichtigungstermineKoordinierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Besichtigungstermine koordinieren 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-13",
        mainEntityOfPage: `${siteUrl}/besichtigungstermine-koordinieren`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Besichtigungstermine", "Terminlogik", "Immobilienmakler", "Massentermine"],
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
        { name: "Besichtigungstermine koordinieren", path: "/besichtigungstermine-koordinieren" },
      ]}
      schema={schema}
      kicker="Besichtigungstermine"
      title="Wie Makler Besichtigungstermine sauber koordinieren"
      description="Die beste Terminlogik hängt von Nachfrage, Objekt und Teamgröße ab. Wer Einzeltermine, Zeitfenster, Buchungslinks und Massentermine sauber trennt, spart Zeit und vermeidet Chaos."
      actions={
        <>
          <Link href="/besichtigungsanfragen-automatisieren" className="btn-secondary">
            Besichtigungsanfragen
          </Link>
          <Link href="/signup?entry=besichtigungstermine-koordinieren" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu den Terminmodellen oder zum Ablauf springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#modelle" className="btn-secondary w-full justify-center">
              Terminmodelle
            </MarketingJumpLink>
            <MarketingJumpLink href="#ablauf" className="btn-secondary w-full justify-center">
              Ablauf
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="besichtigungstermine-koordinieren"
      primaryHref="/signup?entry=besichtigungstermine-koordinieren-stage"
      primaryLabel="Mit echten Terminen prüfen"
      secondaryHref="/anfragenqualifizierung-immobilienmakler"
      secondaryLabel="Anfragenqualifizierung"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Terminfenstern, Buchungslogik, Massenterminen und Folgepfaden. Für die konkrete Umsetzung sollte Ihr Team immer den eigenen Kalender- und Objektalltag gegenprüfen."
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
                Produkt- und Prozessteam mit Fokus auf Anfragepfad, Terminlogik, Reminder und kontrollierte
                Kommunikation im Makleralltag.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite gelesen werden sollte</h2>
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

      <section id="modelle" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Vier Terminmodelle, die Makler sauber unterscheiden sollten</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Viele Koordinationsprobleme entstehen nicht im Kalender, sondern bei der falschen Modellwahl. Erst wenn
              klar ist, ob Sie Einzeltermine, Zeitfenster, Buchungslinks oder Massentermine brauchen, wird der Rest
              stabil.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={coordinationModels}
            rowKey={(item) => item.model}
            columns={[
              { key: "model", label: "Modell", emphasize: true },
              { key: "bestFor", label: "Geeignet für" },
              { key: "strengths", label: "Stärken" },
              { key: "watch", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="auswahl" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <h2 className="h2">Welches Modell zu welchem Makleralltag passt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {officeFits.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="ablauf" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Ein sauberer Ablauf für die Terminkoordination</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Koordination ist eine Folge von klaren Schritten. Wer den Ablauf trennt, spart Zeit und vermeidet
              widersprüchliche Kommunikation.
            </p>
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

      <section id="aenderungen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Änderungen, Absagen und Ausfälle brauchen eigene Regeln</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Ein bestätigter Termin ist erst stabil, wenn auch Rückfragen, Verschiebungen, Absagen und No-Shows
              kontrolliert abgefangen werden.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {changeRules.map((item) => (
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
              <h2 className="h3">Kennzahlen für eine belastbare Terminkoordination</h2>
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
              <p className="label">Wo Advaic ergänzt</p>
              <h2 className="h3 mt-3">Vor dem Kalender und nach dem Termin</h2>
              <p className="helper mt-3">
                Wenn Maklersoftware und Kalender stehen, liegt der operative Hebel oft davor und danach: bei
                Qualifizierung, Priorisierung, Freigabe und sauberem Nachfassen.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                  Anfragen priorisieren
                </Link>
                <Link href="/besichtigung-bestaetigen" className="btn-secondary">
                  Besichtigung bestätigen
                </Link>
                <Link href="/massenbesichtigungen-organisieren" className="btn-secondary">
                  Massenbesichtigungen
                </Link>
                <Link href="/besichtigungserinnerungen-automatisieren" className="btn-secondary">
                  Erinnerungen automatisieren
                </Link>
                <Link href="/no-show-besichtigungen-reduzieren" className="btn-secondary">
                  No-Shows reduzieren
                </Link>
                <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
                  Follow-up-E-Mails
                </Link>
              </div>
            </aside>
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
