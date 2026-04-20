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
  "No-Shows bei Besichtigungen entstehen selten nur aus Desinteresse. Häufiger fehlen saubere Bestätigung, ein klarer Rückkanal für Absagen oder eine stabile Erinnerung kurz vor dem Termin.",
  "Der größte Hebel liegt nicht in noch mehr Nachrichten, sondern in einem verlässlichen Terminpfad: bestätigen, erinnern, Änderungen sauber dokumentieren und stille Ausfälle früh erkennen.",
  "Maklerbüros reduzieren Nichterscheinen besonders dann, wenn Einzeltermine, Massentermine und sensible Ausnahmen nicht über dieselbe Standardlogik laufen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#ursachen", label: "Warum No-Shows entstehen" },
  { href: "#hebel", label: "Die stärksten Hebel" },
  { href: "#ablauf", label: "Sauberer Terminpfad" },
  { href: "#stoppfaelle", label: "Stoppfälle" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Primärquellen von Propstack, onOffice und onPointment mit Advaics Sicht auf Terminlogik, Teilnehmerstatus und kontrollierte Folgekommunikation vor Besichtigungen.",
  "Bewertet wird nicht nur, ob eine Erinnerung verschickt werden kann, sondern ob Bestätigung, Terminstatus, Absageweg und Nacharbeit im Alltag wirklich zusammenpassen.",
  "Die Empfehlungen sind bewusst konservativ formuliert. Ziel ist kein maximal automatisierter Kalender, sondern weniger Nichterscheinen bei gleichzeitig ruhigerem Ablauf für das Team.",
];

const causes = [
  {
    title: "Der Termin ist nie wirklich bestätigt worden",
    text: "Viele vermeintliche No-Shows sind in Wahrheit schwebende Termine. Wenn Zusage, Uhrzeit oder Treffpunkt nicht eindeutig bestätigt wurden, fehlt dem Interessenten der klare Verpflichtungsmoment.",
  },
  {
    title: "Absagen sind operativ zu mühsam",
    text: "Wenn der Rückkanal unklar ist oder kurzfristige Änderungen nur telefonisch möglich scheinen, melden sich manche Interessenten gar nicht mehr und tauchen einfach nicht auf.",
  },
  {
    title: "Massentermine werden wie Einzeltermine behandelt",
    text: "Sobald mehrere Interessenten auf ein Objekt laufen, reichen lose Listen oder Einzelfall-Mails nicht mehr. Ohne Teilnehmerstatus und Erinnerungspfad steigen stille Ausfälle deutlich.",
  },
  {
    title: "Zu viele offene Schleifen kurz vor dem Termin",
    text: "Fehlende Anfahrthinweise, unklare Zugangssituation oder unbeantwortete Rückfragen führen dazu, dass Termine kurz vor knapp aus dem Fokus geraten oder innerlich schon abgesagt sind.",
  },
];

const leverRows = [
  {
    lever: "Eindeutige Terminbestätigung",
    bestFor: "Einzeltermine und hochwertige Besichtigungen mit fester Uhrzeit",
    effect: "Senkt Missverständnisse und macht aus einer losen Anfrage einen klaren Termin",
    watch: "Nur belastbar, wenn Änderungen und Absagen später denselben Statuspfad nutzen",
  },
  {
    lever: "Zeitfenster statt E-Mail-Pingpong",
    bestFor: "Teams mit vielen Terminanfragen und knappen Rückmeldefenstern",
    effect: "Reduziert Reibung vor dem Termin und verkürzt die Phase unklarer Zusagen",
    watch: "Zeitfenster helfen nur, wenn die finale Auswahl danach sauber verbucht wird",
  },
  {
    lever: "Erinnerung 24 Stunden vorher",
    bestFor: "Standardtermine mit bestätigter Teilnahme und belastbarer Adresse",
    effect: "Fängt Vergessen, Verwechslungen und späte Unsicherheit rechtzeitig ab",
    watch: "Nicht blind versenden, wenn der Terminstatus in der Zwischenzeit gekippt ist",
  },
  {
    lever: "Klarer Absage- und Änderungsweg",
    bestFor: "Alle Termine, besonders mit engem Kalender oder langen Anfahrten",
    effect: "Macht stille Ausfälle seltener, weil Absagen einfacher als Nichterscheinen werden",
    watch: "Der Rückkanal muss klar benannt und intern schnell sichtbar sein",
  },
  {
    lever: "Teilnehmerstatus bei Massenterminen",
    bestFor: "Vermietung, Neubau und Nachfragephasen mit mehreren Interessenten",
    effect: "Hilft, Zusagen, Absagen und Erinnerungen pro Teilnehmer sauber zu steuern",
    watch: "Ohne gepflegte Statuslogik erzeugt Massentermin-Automatik eher mehr Unruhe",
  },
];

const processSteps = [
  {
    title: "1. Termin nur aus klarem nächsten Schritt erzeugen",
    text: "Ein Termin sollte aus einer qualifizierten Anfrage oder einer bewusst bestätigten Einladung entstehen, nicht aus vager Sympathie oder offenem Mailwechsel.",
  },
  {
    title: "2. Teilnahme sichtbar bestätigen",
    text: "Sobald Uhrzeit und Ort stehen, braucht das Team einen klaren Status: zugesagt, wartend, verschoben oder abgesagt. Alles dazwischen ist operativ riskant.",
  },
  {
    title: "3. Kurz vor dem Termin aktiv stabilisieren",
    text: "Spätestens am Vortag muss der Termin im Postfach und im Kopf des Interessenten wieder präsent sein, inklusive Rückkanal für Änderungen.",
  },
  {
    title: "4. Änderungen sofort in den Terminpfad zurückspielen",
    text: "Verschiebungen, Absagen und Rückfragen sind keine Randfälle. Sie entscheiden darüber, ob Erinnerungen stoppen und ob das Team noch von einem echten Termin ausgehen darf.",
  },
  {
    title: "5. Nichterscheinen dokumentieren und auswerten",
    text: "No-Shows sollten nicht im Tageschaos verschwinden. Nur sauber dokumentierte Ausfälle zeigen, ob das Problem bei Bestätigung, Erinnerung oder Vorauswahl liegt.",
  },
];

const stopCases = [
  {
    title: "Sofort manuell prüfen",
    text: "Wenn ein Interessent kurz vor der Besichtigung umplant, unsicher wirkt oder Sonderfragen offen bleiben, sollte keine starre Erinnerungslogik weiterlaufen.",
  },
  {
    title: "Automatik stoppen",
    text: "Absage, Doppelbuchung, fehlender Objektbezug, Rückläufer oder ein bereits geschlossener Fall müssen Erinnerungen und Folgeschritte sofort beenden.",
  },
  {
    title: "Bewusst persönlich übernehmen",
    text: "Bei Premium-Objekten, langen Anfahrten oder konfliktanfälligen Fällen ist eine persönliche Absicherung oft wertvoller als eine weitere Standardmail.",
  },
];

const metrics = [
  "No-Show-Quote je Objektart, Region oder Terminmodell",
  "Quote sauber bestätigter Termine vor Versand der Erinnerung",
  "Anteil stiller Ausfälle gegenüber dokumentierten Absagen",
  "Anteil Erinnerungen, die wegen Statusänderung rechtzeitig gestoppt wurden",
  "Durchschnittliche Zeit zwischen Bestätigung und Besichtigung",
  "Zeitaufwand des Teams für Nachtelefonieren am Vortag und am Terminmorgen",
];

const advaicFit = [
  "Ihr Büro hat ausreichend Besichtigungsvolumen, aber vor Terminen noch zu viel manuelle Unruhe durch Rückfragen, Nachtelefonieren und ungeklärte Teilnahme.",
  "Sie möchten Erinnerungen, Stoppsignale und Nacharbeit an den echten Terminstatus koppeln statt lose Standardmails zu verschicken.",
  "Sie suchen keine Event-Marketing-Automation, sondern einen belastbaren Prozess zwischen Bestätigung, Erinnerung, Änderung und dokumentiertem Ausgang.",
];

const advaicNotFit = [
  "Terminabstimmung und Statuspflege sind noch so lose, dass das Team nicht verlässlich sagen kann, welche Besichtigungen wirklich bestätigt sind.",
  "Das Volumen ist sehr klein und jeder Termin läuft ohnehin individuell per Telefon oder persönlicher Nachricht.",
  "Die eigentliche Schwäche liegt vor dem Termin, zum Beispiel in schlechter Qualifizierung oder zu langsamer Erstreaktion auf neue Anfragen.",
];

const faqItems = [
  {
    question: "Wann sinken No-Shows bei Besichtigungen am stärksten?",
    answer:
      "Meist dann, wenn Terminbestätigung, Erinnerung und Absageweg sauber zusammenspielen. Eine einzelne zusätzliche Mail hilft deutlich weniger als ein klarer Terminpfad mit sichtbarem Status.",
  },
  {
    question: "Reicht eine Erinnerung 24 Stunden vorher aus?",
    answer:
      "Für viele Standardtermine ja. Entscheidend ist weniger die absolute Menge an Erinnerungen als ihre Passung zum Terminstatus und die klare Möglichkeit, Änderungen oder Absagen direkt zurückzugeben.",
  },
  {
    question: "Was ist bei Massenterminen anders?",
    answer:
      "Massentermine brauchen eine eigene Teilnehmerlogik. Zusagen, Absagen und Erinnerungen müssen pro Person sauber dokumentiert werden, sonst steigt die operative Unruhe trotz Automatisierung.",
  },
  {
    question: "Sollte jedes Nichterscheinen manuell nachgefasst werden?",
    answer:
      "Nicht automatisch. Erst sollte klar sein, ob es sich um einen echten No-Show, eine späte Absage oder einen zuvor schon instabilen Termin gehandelt hat. Daraus ergibt sich, ob persönliches Nachfassen sinnvoll ist.",
  },
];

const sources = [
  {
    label: "Propstack: Automatische Terminerinnerung (E-Mail & SMS)",
    href: "https://support.propstack.de/hc/de/articles/18385882191645-Automatische-Terminerinnerung-E-Mail-SMS",
    note: "Offizielle Hilfeseite zu automatischen Erinnerungen, Zeitpunkten und den Voraussetzungen für E-Mail- und SMS-Versand.",
  },
  {
    label: "Propstack: E-Mail-Benachrichtigung bei Massenterminen",
    href: "https://support.propstack.de/hc/de/articles/18385721095069-E-Mail-Benachrichtigung-bei-Massenterminen",
    note: "Offizielle Anleitung zur Erinnerungslogik bei Massenterminen über Folgeaktivitäten und Textbausteine.",
  },
  {
    label: "Propstack: Massentermine",
    href: "https://support.propstack.de/hc/de/articles/18385951788317-Massentermine",
    note: "Offizielle Hilfeseite zu Teilnehmerstatus, Zu- und Absagen sowie der Organisation mehrerer Interessenten auf einem Termin.",
  },
  {
    label: "onPointment: Online-Terminbuchungssystem für Immobilienmakler",
    href: "https://at.onoffice.com/immobiliensoftware/online-terminbuchungssystem/",
    note: "Offizielle Herstellerseite zur Buchung von Besichtigungsterminen mit Kalenderabgleich und Datensatzverknüpfung.",
  },
  {
    label: "onOffice Hilfe: Zeitfenster für Termine",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/zeitfenster-fuer-termine/",
    note: "Offizielle Hilfe zur strukturierten Rückmeldung möglicher Terminfenster als Teil eines saubereren Terminpfads.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "No-Shows bei Besichtigungen reduzieren 2026",
  ogTitle: "No-Shows bei Besichtigungen reduzieren 2026 | Advaic",
  description:
    "Praxisleitfaden für Makler: Wie No-Shows bei Besichtigungen mit sauberer Bestätigung, Erinnerung und Terminlogik spürbar sinken.",
  path: "/no-show-besichtigungen-reduzieren",
  template: "guide",
  eyebrow: "No-Shows reduzieren",
  proof:
    "Weniger Nichterscheinen entsteht durch klare Bestätigung, verlässliche Erinnerung und einen sichtbaren Absageweg.",
});

export default function NoShowBesichtigungenReduzierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "No-Shows bei Besichtigungen reduzieren 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-14",
        mainEntityOfPage: `${siteUrl}/no-show-besichtigungen-reduzieren`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Besichtigungen", "No-Shows", "Terminerinnerungen", "Immobilienmakler"],
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
        { name: "No-Shows bei Besichtigungen reduzieren", path: "/no-show-besichtigungen-reduzieren" },
      ]}
      schema={schema}
      kicker="No-Shows reduzieren"
      title="Wie Makler No-Shows bei Besichtigungen wirklich senken"
      description="Nichterscheinen sinkt selten durch eine einzelne Maßnahme. Entscheidend ist ein verlässlicher Pfad aus Bestätigung, Erinnerung, klarem Absageweg und sauber dokumentiertem Terminstatus."
      actions={
        <>
          <Link href="/besichtigungserinnerungen-automatisieren" className="btn-secondary">
            Erinnerungen automatisieren
          </Link>
          <Link href="/signup?entry=no-show-besichtigungen-reduzieren" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu den Hebeln oder zu den Kennzahlen springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#hebel" className="btn-secondary w-full justify-center">
              Hebel
            </MarketingJumpLink>
            <MarketingJumpLink href="#kennzahlen" className="btn-secondary w-full justify-center">
              Kennzahlen
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="no-show-besichtigungen-reduzieren"
      primaryHref="/signup?entry=no-show-besichtigungen-reduzieren-stage"
      primaryLabel="Mit echten Terminen prüfen"
      secondaryHref="/besichtigungstermine-koordinieren"
      secondaryLabel="Termine koordinieren"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung zu Bestätigung, Erinnerungslogik, Massenterminen und Terminbuchung. Für die echte Bewertung sollten Sie zusätzlich Ihre eigene No-Show-Quote nach Objektart und Terminmodell auswerten."
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
                Produkt- und Prozessteam mit Fokus auf Terminpfad, Folgekommunikation und kontrollierte
                Prozessautomatisierung im Makleralltag.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite einordnet</h2>
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

      <section id="ursachen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Warum No-Shows bei Besichtigungen überhaupt entstehen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Wer Nichterscheinen nur als Zuverlässigkeitsproblem betrachtet, verpasst meist die eigentlichen Ursachen
              im Ablauf davor.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {causes.map((item) => (
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
            <h2 className="h2">Die stärksten operativen Hebel gegen Nichterscheinen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die beste Wirkung kommt meist aus wenigen sauber kombinierten Maßnahmen, nicht aus immer mehr Kontaktpunkten.
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

      <section id="ablauf" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Ein belastbarer Besichtigungspfad vor dem eigentlichen Termin</h2>
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

      <section id="stoppfaelle" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Wann die Standardlogik stoppen oder persönlich übernehmen sollte</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stopCases.map((item) => (
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
              <h2 className="h3">Kennzahlen für weniger No-Shows und ruhigere Abläufe</h2>
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
              <h2 className="h3 mt-3">No-Shows sinken selten isoliert</h2>
              <p className="helper mt-3">
                Meist hängt das Thema direkt mit Erinnerungen, Terminabstimmung und der Qualität der vorangehenden
                Anfrage zusammen.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/besichtigungserinnerungen-automatisieren" className="btn-secondary">
                  Erinnerungen automatisieren
                </Link>
                <Link href="/besichtigung-absagen-reduzieren" className="btn-secondary">
                  Absagen reduzieren
                </Link>
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
              <h2 className="h3 mt-3">Wenn Termine vor dem Kalender noch zu instabil sind</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/besichtigungserinnerungen-automatisieren" className="btn-secondary">
                  Erinnerungen
                </Link>
                <Link href="/besichtigung-absagen-reduzieren" className="btn-secondary">
                  Absagen
                </Link>
                <Link href="/besichtigungstermine-koordinieren" className="btn-secondary">
                  Termine koordinieren
                </Link>
                <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                  Anfragen priorisieren
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn die Grundordnung im Terminpfad noch fehlt</h2>
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
