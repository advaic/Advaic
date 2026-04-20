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
  "Besichtigungserinnerungen sollten nicht als lästige Zusatzmail behandelt werden. Sie sind ein fester Teil des Terminprozesses und wirken direkt auf No-Shows, Rückfragen und die Verlässlichkeit des Ablaufs.",
  "Der häufigste Fehler ist, Erinnerungen zu spät, zu unklar oder ohne saubere Stopplogik zu versenden. Dann entsteht eher mehr Verwirrung als echte Entlastung.",
  "Gute Erinnerungssysteme sind knapp, eindeutig und an den echten Terminstatus gekoppelt. Genau dort unterscheiden sich belastbare Prozesse von hektischer Nacharbeit.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#warum", label: "Warum Erinnerungen wichtig sind" },
  { href: "#kanal-und-timing", label: "Kanal & Timing" },
  { href: "#inhalt", label: "Was hinein gehört" },
  { href: "#regeln", label: "Automatisch oder manuell?" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Primärquellen von Propstack, onOffice und onPointment mit Advaics Sicht auf Terminpfad, Stopplogik und Folgekommunikation im Makleralltag.",
  "Bewertet wird nicht nur, ob eine Erinnerung verschickt werden kann, sondern ob Timing, Kanal, Textbaustein, Terminstatus und Ausnahmeregeln sauber zusammenpassen.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist nicht maximale Versandmenge, sondern ein verlässlicher Terminpfad mit weniger No-Shows und weniger operativer Unruhe.",
];

const whyRemindersMatter = [
  {
    title: "No-Shows sind oft ein Prozessproblem",
    text: "Ausbleibende Rückmeldungen oder vergessene Termine entstehen häufig nicht wegen fehlendem Interesse, sondern wegen unklarer Bestätigung, fehlender Erinnerung oder zu spätem Hinweis auf Änderungen.",
  },
  {
    title: "Erinnerungen entlasten vor allem kurz vor dem Termin",
    text: "Gerade in den letzten 24 Stunden sinkt der Wert allgemeiner Kommunikation und steigt der Wert klarer, präziser Erinnerung mit Ort, Uhrzeit und Ansprechpartner.",
  },
  {
    title: "Massentermine brauchen andere Erinnerungspflichten",
    text: "Sobald mehrere Interessenten im gleichen Terminpfad laufen, müssen Zu- und Absagen noch sauberer dokumentiert und Erinnerungen systematisch ausgelöst werden.",
  },
  {
    title: "Eine Erinnerung ist keine Mini-Kampagne",
    text: "Sie soll nicht verkaufen, sondern Sicherheit herstellen: Was ist bestätigt, wann beginnt der Termin und was ist bei Änderung oder Absage zu tun?",
  },
];

const channelRows = [
  {
    channel: "E-Mail 24 Stunden vorher",
    bestFor: "Standardtermine mit sauber bestätigtem Status und vorhandener E-Mail-Adresse",
    strength: "Gut dokumentierbar, mit Textbausteinen sauber standardisierbar",
    watch: "Nur sinnvoll, wenn Absagen und Änderungen den Versand auch wieder stoppen können",
  },
  {
    channel: "SMS kurz vor Termin",
    bestFor: "Termine mit hoher No-Show-Gefahr oder engem Zeitfenster",
    strength: "Hohe Aufmerksamkeit kurz vor dem Termin",
    watch: "Nur sinnvoll mit sauberer Mobilnummernqualität und klarer technischer Anbindung",
  },
  {
    channel: "Massentermin-Erinnerung",
    bestFor: "Mehrere Teilnehmer auf einem Objekt oder einer Vermietungswelle",
    strength: "Skaliert Erinnerungen über Textbaustein- und Terminlogik",
    watch: "Teilnehmerstatus und automatische Zu- oder Absagen müssen zuverlässig gepflegt sein",
  },
  {
    channel: "Manuelle Einzel-Erinnerung",
    bestFor: "Beratungsintensive Premium-Fälle oder sensible Einzeltermine",
    strength: "Sehr persönlich, gut bei Sonderfällen und hochwertigen Objekten",
    watch: "Nicht effizient für hohes Standardvolumen",
  },
];

const contentRules = [
  "Datum, Uhrzeit und Ort müssen sofort sichtbar sein, ohne dass der Interessent erst die alte Terminmail suchen muss.",
  "Der Ansprechpartner und der richtige Rückkanal für Änderungen oder Absagen gehören klar in die Erinnerung.",
  "Erinnerungen sollten keine neuen offenen Fragen erzeugen. Wer zusätzliche Unterlagen, Anfahrthinweise oder Zugangsdetails braucht, sollte diese präzise und knapp erhalten.",
  "Der Text muss zum Status passen: bestätigt, gebucht, wartend oder verschoben sind unterschiedliche Situationen und sollten nicht gleich klingen.",
];

const automationRules = [
  {
    title: "Gut automatisierbar",
    text: "Bestätigte Standardtermine mit sauberem Status, gültiger E-Mail-Adresse und klarer Stopplogik bei Änderung oder Absage.",
  },
  {
    title: "Nur mit sauberer Regelbasis",
    text: "Massentermine, SMS-Erinnerungen oder Terminserien, in denen Teilnehmerstatus und Textbausteine konsequent gepflegt werden müssen.",
  },
  {
    title: "Bewusst manuell",
    text: "Sensible Einzeltermine, Beschwerden, Premium-Objekte oder Fälle mit laufender Umplanung und persönlicher Abstimmung.",
  },
];

const metrics = [
  "No-Show-Quote vor und nach Einführung automatischer Erinnerungen",
  "Anteil Termine mit sauber dokumentierter Bestätigung, Änderung oder Absage",
  "Quote manuell nachtelefonierter Termine trotz bestehender Erinnerungslogik",
  "Anteil Erinnerungen, die wegen Statusänderung rechtzeitig gestoppt wurden",
  "Zeitaufwand des Teams für Termin-Nacharbeit in den letzten 24 Stunden vor der Besichtigung",
  "Anteil bestätigter Termine, die ohne Widerspruch im richtigen Folgepfad landen",
];

const advaicFit = [
  "Ihr Team hat bereits einen klaren Terminpfad, verliert aber kurz vor Besichtigungen noch Zeit durch Rückfragen, Nachtelefonieren oder unsaubere Statuswechsel.",
  "Sie möchten Erinnerungen nur dann automatisieren, wenn Terminstatus, Stoppsignale und Folgekommunikation sauber mitlaufen.",
  "Sie suchen keine allgemeine Marketing-Automation, sondern einen belastbaren Prozess zwischen bestätigtem Termin, Änderung, Absage und Nachbereitung.",
];

const advaicNotFit = [
  "Besichtigungstermine werden noch zu unstrukturiert koordiniert und haben keinen stabilen Statuspfad.",
  "Das Volumen ist sehr gering und fast jeder Termin wird ohnehin individuell abgestimmt.",
  "Die eigentliche Lücke liegt früher im Prozess, etwa bei Qualifizierung oder Terminvereinbarung, nicht erst bei Erinnerungen.",
];

const faqItems = [
  {
    question: "Wann sollte eine Besichtigungserinnerung verschickt werden?",
    answer:
      "Für viele Standardtermine ist eine Erinnerung 24 Stunden vorher sinnvoll, weil sie klar genug vor dem Termin liegt und gleichzeitig noch rechtzeitig Änderungen oder Absagen sichtbar macht.",
  },
  {
    question: "Sind SMS-Erinnerungen für Makler sinnvoll?",
    answer:
      "Nur in passenden Fällen. Sie können bei enger Terminlage oder höherer No-Show-Gefahr hilfreich sein, brauchen aber saubere Mobilnummern und eine belastbare technische Anbindung.",
  },
  {
    question: "Was ist bei Massenterminen anders?",
    answer:
      "Massentermine brauchen eine eigene Logik für Teilnehmerstatus, Erinnerungszeitpunkt und automatische Zu- oder Absagen. Eine normale Einzelerinnerung reicht dafür nicht.",
  },
  {
    question: "Wann sollten Erinnerungen bewusst manuell bleiben?",
    answer:
      "Bei sensiblen Einzelterminen, Premium-Objekten, laufender Umplanung oder überall dort, wo die persönliche Abstimmung wichtiger ist als Standardisierung.",
  },
];

const sources = [
  {
    label: "Propstack: Automatische Terminerinnerung (E-Mail & SMS)",
    href: "https://support.propstack.de/hc/de/articles/18385882191645-Automatische-Terminerinnerung-E-Mail-SMS",
    note: "Offizielle Hilfeseite zu E-Mail- und SMS-Erinnerungen, 24-Stunden-Taktung und technischen Grenzen.",
  },
  {
    label: "Propstack: E-Mail-Benachrichtigung bei Massenterminen",
    href: "https://support.propstack.de/hc/de/articles/18385721095069-E-Mail-Benachrichtigung-bei-Massenterminen",
    note: "Offizielle Anleitung zur Erinnerungslogik für Massentermine über Folgeaktivitäten und Textbausteine.",
  },
  {
    label: "Propstack: Massentermine",
    href: "https://support.propstack.de/hc/de/articles/18385951788317-Massentermine",
    note: "Offizielle Hilfeseite zu Teilnahmestatus, automatischen Bestätigungen, Absagen und Kunden-Erinnerungen.",
  },
  {
    label: "onPointment: Online-Terminbuchungssystem für Immobilienmakler",
    href: "https://at.onoffice.com/immobiliensoftware/online-terminbuchungssystem/",
    note: "Offizielle Herstellerseite zur Terminbuchung mit Kalenderanbindung und Datensatzverknüpfung.",
  },
  {
    label: "onOffice Hilfe: Zeitfenster für Termine",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/zeitfenster-fuer-termine/",
    note: "Offizielle Hilfe zur Ermittlung und Rückmeldung möglicher Terminfenster als Teil der Terminabstimmung.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Besichtigungserinnerungen automatisieren 2026: Weniger No-Shows, sauberer Terminpfad",
  ogTitle: "Besichtigungserinnerungen automatisieren 2026 | Advaic",
  description:
    "Leitfaden für Makler: Wie Besichtigungserinnerungen per E-Mail oder SMS sauber automatisiert werden, ohne Statuschaos oder unnötige Nacharbeit zu erzeugen.",
  path: "/besichtigungserinnerungen-automatisieren",
  template: "guide",
  eyebrow: "Besichtigungserinnerungen",
  proof:
    "Gute Erinnerungen sind knapp, statusbezogen und mit klarer Stopplogik verbunden.",
});

export default function BesichtigungserinnerungenAutomatisierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Besichtigungserinnerungen automatisieren 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-13",
        mainEntityOfPage: `${siteUrl}/besichtigungserinnerungen-automatisieren`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Besichtigungserinnerungen", "Terminlogik", "No-Shows", "Immobilienmakler"],
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
        { name: "Besichtigungserinnerungen automatisieren", path: "/besichtigungserinnerungen-automatisieren" },
      ]}
      schema={schema}
      kicker="Besichtigungserinnerungen"
      title="Wie Makler Besichtigungserinnerungen sauber automatisieren"
      description="Erinnerungen sind ein Teil des Terminprozesses, nicht nur eine Zusatzmail. Wer Timing, Status, Textbaustein und Stoppsignale sauber verbindet, reduziert No-Shows und Nacharbeit deutlich."
      actions={
        <>
          <Link href="/besichtigungstermine-koordinieren" className="btn-secondary">
            Termine koordinieren
          </Link>
          <Link href="/signup?entry=besichtigungserinnerungen-automatisieren" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu Kanal und Timing oder zu den Regeln springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#kanal-und-timing" className="btn-secondary w-full justify-center">
              Kanal & Timing
            </MarketingJumpLink>
            <MarketingJumpLink href="#regeln" className="btn-secondary w-full justify-center">
              Regeln
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="besichtigungserinnerungen-automatisieren"
      primaryHref="/signup?entry=besichtigungserinnerungen-automatisieren-stage"
      primaryLabel="Mit echten Terminen prüfen"
      secondaryHref="/besichtigungsanfragen-automatisieren"
      secondaryLabel="Besichtigungsanfragen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Erinnerungen, Textbausteinen, Zeitpunkten und Stopplogik. Für den echten Betrieb sollten Sie immer auch Ihre eigenen Termin- und No-Show-Muster prüfen."
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
                Produkt- und Prozessteam mit Fokus auf Terminpfad, Folgekommunikation und kontrollierter
                Prozessautomatisierung im Makleralltag.
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

      <section id="warum" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Warum Besichtigungserinnerungen operativ wichtiger sind als viele Teams denken</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Erinnerungen wirken oft klein, greifen aber an einer kritischen Stelle: kurz vor dem Termin, wenn
              Unsicherheit, Verhinderung oder fehlende Klarheit den Prozess noch kippen können.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {whyRemindersMatter.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="kanal-und-timing" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welcher Kanal und welches Timing zu welchem Termin passt</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Erinnerungslogik ist kein Einheitsversand. Sie hängt von Terminart, Volumen, Status und
              Datenqualität ab.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={channelRows}
            rowKey={(item) => item.channel}
            columns={[
              { key: "channel", label: "Kanal / Timing", emphasize: true },
              { key: "bestFor", label: "Geeignet für" },
              { key: "strength", label: "Stärke" },
              { key: "watch", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="inhalt" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Was in eine gute Besichtigungserinnerung gehört</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {contentRules.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <aside className="card-base p-6">
              <p className="label">Merksatz</p>
              <h2 className="h3 mt-3">Erinnerungen sollen Sicherheit schaffen, nicht neue Fragen</h2>
              <p className="helper mt-3">
                Je näher der Termin rückt, desto mehr zählen Klarheit, Kürze und ein sauberer Rückkanal.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="regeln" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Wann Erinnerungen automatisch laufen sollten und wann nicht</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {automationRules.map((item) => (
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
              <h2 className="h3">Kennzahlen für einen belastbaren Erinnerungsprozess</h2>
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
              <h2 className="h3 mt-3">Erinnerungen wirken nur im sauberen Terminpfad</h2>
              <p className="helper mt-3">
                Wenn Zusagen, Änderungen und Absagen nicht sauber dokumentiert sind, kann auch die beste Erinnerung die
                operative Unruhe nur begrenzt lösen.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/besichtigungstermine-koordinieren" className="btn-secondary">
                  Termine koordinieren
                </Link>
                <Link href="/besichtigungsanfragen-automatisieren" className="btn-secondary">
                  Besichtigungsanfragen
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
              <h2 className="h3 mt-3">Wenn Erinnerungen Teil des echten Prozesspfads sein sollen</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/besichtigungstermine-koordinieren" className="btn-secondary">
                  Termine koordinieren
                </Link>
                <Link href="/no-show-besichtigungen-reduzieren" className="btn-secondary">
                  No-Shows reduzieren
                </Link>
                <Link href="/besichtigung-absagen-reduzieren" className="btn-secondary">
                  Absagen reduzieren
                </Link>
                <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                  Anfragen priorisieren
                </Link>
                <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
                  Follow-up-E-Mails
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn die Terminlogik noch zu lose ist</h2>
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
