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
  "Eine Besichtigung ist erst dann wirklich bestätigt, wenn Uhrzeit, Ort, Objektbezug und Rückweg für Änderungen sauber feststehen. Alles andere ist operativ eher eine lose Zusage als ein belastbarer Termin.",
  "Viele Maklerbüros verlieren Zeit, weil Bestätigung, Erinnerung und Statuswechsel nicht im selben Pfad laufen. Dann wirken Termine sicherer, als sie tatsächlich sind.",
  "Gute Bestätigungslogik ist kein hübscher Textbaustein, sondern eine klare Entscheidung: bestätigt, wartend, verschoben oder abgesagt. Genau das reduziert stille Ausfälle und hektische Nacharbeit.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#warum", label: "Warum Bestätigung mehr ist als Zusage" },
  { href: "#bestandteile", label: "Was bestätigt sein muss" },
  { href: "#prozess", label: "Sauberer Bestätigungspfad" },
  { href: "#sonderfaelle", label: "Sonderfälle" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Primärquellen von onOffice, onPointment und Propstack mit Advaics Sicht auf Terminstatus, Bestätigung und Rückwege im Besichtigungspfad.",
  "Bewertet wird nicht nur, ob ein Interessent zugesagt hat, sondern ob Termin, Zuständigkeit, Treffpunkt und Änderungsweg für das Team tatsächlich belastbar dokumentiert sind.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist kein überformalisierter Prozess, sondern weniger schwebende Zusagen und klarere Entscheidungen vor der Besichtigung.",
];

const framingCards = [
  {
    title: "Bestätigt ist mehr als 'passt für mich'",
    text: "Ein Termin ist erst dann operativ belastbar, wenn Zeit, Ort und Objektbezug klar sind und das Team den Fall im richtigen Status sieht.",
  },
  {
    title: "Schwebende Zusagen wirken gefährlich stabil",
    text: "Viele spätere Probleme beginnen mit halb bestätigten Besichtigungen: lose Ja-Signale ohne klaren Terminpfad, Rückweg oder dokumentierten Status.",
  },
  {
    title: "Massentermine brauchen andere Bestätigung",
    text: "Bei mehreren Interessenten auf demselben Objekt reicht eine informelle Rückmeldung nicht. Dort zählt die Teilnehmerlogik mehr als persönliches Bauchgefühl.",
  },
  {
    title: "Bestätigung und Erinnerung gehören zusammen",
    text: "Wer Bestätigung und spätere Erinnerung getrennt denkt, übersieht oft, dass beide auf denselben Statuswechseln und Stoppsignalen beruhen.",
  },
];

const confirmationRows = [
  {
    item: "Objekt und Termin eindeutig genannt",
    meaning: "Der Interessent muss sofort erkennen, um welches Objekt, welchen Ort und welche Uhrzeit es geht.",
    whyItMatters: "Vermeidet Verwechslungen und schließt lose Mehrdeutigkeiten vor dem Termin aus.",
    watch: "Gerade bei ähnlichen Objekten oder Serienbesichtigungen auf Klarheit achten.",
  },
  {
    item: "Status im System sichtbar",
    meaning: "Bestätigt, wartend, verschoben oder abgesagt dürfen nicht nur im Mailtext liegen, sondern müssen im Prozessstatus erkennbar sein.",
    whyItMatters: "Nur dann stoppen Erinnerungen richtig und das Team arbeitet nicht gegen alte Annahmen.",
    watch: "Lose Freitextnotizen ersetzen keinen belastbaren Statuspfad.",
  },
  {
    item: "Rückweg für Änderung oder Absage",
    meaning: "Wer bestätigen kann, muss auch unkompliziert verschieben oder absagen können.",
    whyItMatters: "Frühe Änderung ist operativ fast immer besser als späte Unsicherheit oder stilles Nichterscheinen.",
    watch: "Rückmeldungen müssen intern schnell sichtbar und eindeutig zuordenbar sein.",
  },
  {
    item: "Zuständigkeit klar benannt",
    meaning: "Ansprechpartner und Erreichbarkeit gehören zur Bestätigung dazu.",
    whyItMatters: "Unsicherheit vor dem Termin landet sonst an der falschen Stelle oder bleibt unbeantwortet.",
    watch: "Wechsel der Zuständigkeit darf nicht unbemerkt alte Bestätigungen entwerten.",
  },
  {
    item: "Bestätigung passt zum Terminmodell",
    meaning: "Einzeltermin, Zeitfenster, Buchungslink und Massentermin brauchen unterschiedliche Form der Bestätigung.",
    whyItMatters: "Was bei Einzelterminen genügt, ist bei mehreren Teilnehmern oft zu unscharf.",
    watch: "Massentermine brauchen Teilnehmerstatus statt rein persönlicher Notizen.",
  },
];

const processSteps = [
  {
    title: "1. Erst Terminoptionen sauber sammeln",
    text: "Bevor etwas bestätigt wird, muss klar sein, welche Zeitfenster wirklich verfügbar sind und wer zuständig ist. Sonst wird aus Bestätigung nur eine freundliche Vorannahme.",
  },
  {
    title: "2. Den konkreten Termin festziehen",
    text: "Sobald sich Zeit und Ort verfestigen, braucht der Fall einen sichtbaren Status und nicht nur einen impliziten Mailton.",
  },
  {
    title: "3. Rückweg für Änderung mitgeben",
    text: "Eine gute Bestätigung enthält nicht nur Sicherheit, sondern auch eine einfache Option für Verschiebung oder Absage.",
  },
  {
    title: "4. Kurz vor dem Termin noch einmal stabilisieren",
    text: "Bestätigung ohne spätere Absicherung reicht selten. Spätestens am Vortag sollte der Termin noch einmal klar im Kopf und im Verlauf auftauchen.",
  },
  {
    title: "5. Statusänderungen sofort zurück in den Pfad spielen",
    text: "Verschoben, abgesagt oder unsicher sind keine Randfälle. Sie entscheiden darüber, ob die ursprüngliche Bestätigung weiter gilt oder endet.",
  },
];

const edgeCases = [
  {
    title: "Einzeltermin mit hochwertigem Objekt",
    text: "Hier darf Bestätigung persönlicher sein, sollte aber trotzdem Status und Rückweg klar halten.",
  },
  {
    title: "Massentermin oder offene Besichtigungswelle",
    text: "Teilnehmerstatus und Bestätigungslogik müssen sauber getrennt geführt werden, sonst wird der Fall für das Team schnell unübersichtlich.",
  },
  {
    title: "Verschiebung kurz vor dem Termin",
    text: "Hier endet die alte Bestätigung praktisch sofort. Jeder Folgekontakt muss auf dem neuen Stand basieren.",
  },
];

const metrics = [
  "Anteil Besichtigungen mit sichtbar bestätigtem Status vor Versand der Erinnerung",
  "Quote schwebender Zusagen ohne klaren Terminstatus",
  "Anteil Verschiebungen oder Absagen, die rechtzeitig im Systemstatus landen",
  "Zeit zwischen konkreter Zusage und finaler Bestätigung",
  "Anteil bestätigter Termine, die ohne Rückfrage in den Erinnerungspfad übergehen",
];

const advaicFit = [
  "Ihr Team koordiniert viele Besichtigungen und braucht klarere Status statt lose Zusagen im Postfach.",
  "Sie möchten Bestätigung, Erinnerung und spätere Änderungen in einem durchgängigen Prozess statt in Einzelmails organisieren.",
  "Sie suchen keinen bloßen Kalenderhinweis, sondern einen belastbaren Besichtigungspfad zwischen Zusage, Bestätigung und Folgekontakt.",
];

const advaicNotFit = [
  "Termine werden noch so individuell und selten vergeben, dass formalisierte Bestätigung für das Volumen kaum Mehrwert bringt.",
  "Die größere Schwäche liegt deutlich früher, zum Beispiel in der Qualifizierung oder in unklaren Objekt- und Zuständigkeitsdaten.",
  "Ihr Team hat noch keinen sauberen Statuspfad zwischen bestätigt, wartend, verschoben und abgesagt.",
];

const faqItems = [
  {
    question: "Wann gilt eine Besichtigung wirklich als bestätigt?",
    answer:
      "Dann, wenn Zeit, Ort, Objektbezug und Ansprechpartner klar sind und der Termin für das Team sichtbar im passenden Status geführt wird. Ein loses Ja im Verlauf reicht operativ oft nicht aus.",
  },
  {
    question: "Reicht eine Terminbestätigung per E-Mail aus?",
    answer:
      "Nur dann, wenn die Information nicht im Mailtext stecken bleibt, sondern auch im Prozessstatus sauber abgebildet wird. Sonst laufen Erinnerung und Nacharbeit schnell auf Annahmen statt auf Fakten.",
  },
  {
    question: "Was ist bei Massenterminen anders?",
    answer:
      "Massentermine brauchen Teilnehmerstatus und eine klarere Logik dafür, wer wirklich bestätigt ist. Eine persönliche Einzelzusage skaliert dort meist nicht sauber.",
  },
  {
    question: "Warum ist der Rückweg für Änderungen Teil der Bestätigung?",
    answer:
      "Weil Bestätigung ohne klaren Änderungsweg später leicht zu stillen Ausfällen oder hektischen Last-Minute-Absprachen führt.",
  },
];

const sources = [
  {
    label: "onPointment: Online-Terminbuchungssystem für Immobilienmakler",
    href: "https://at.onoffice.com/immobiliensoftware/online-terminbuchungssystem/",
    note: "Offizielle Herstellerseite zur Terminbuchung mit Kalenderabgleich und Datensatzverknüpfung.",
  },
  {
    label: "onOffice Hilfe: Zeitfenster für Termine",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/zeitfenster-fuer-termine/",
    note: "Offizielle Hilfe zur strukturierten Sammlung und Rückmeldung möglicher Termine.",
  },
  {
    label: "onOffice Hilfe: Interessenten – Von Abgesagt bis Vertrag",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/immobiliendetailansicht/interessenten-ueberblick/interessentenreiter-abgesagt-expose-besichtigung-vertrag/",
    note: "Offizielle Hilfe zur Statuslogik zwischen Exposé, Besichtigung, abgesagt und Vertrag.",
  },
  {
    label: "Propstack: Massentermine",
    href: "https://support.propstack.de/hc/de/articles/18385951788317-Massentermine",
    note: "Offizielle Hilfe zu Teilnehmerstatus, Zu- und Absagen sowie der Organisation mehrerer Interessenten auf einem Termin.",
  },
  {
    label: "Propstack: E-Mail-Benachrichtigung bei Massenterminen",
    href: "https://support.propstack.de/hc/de/articles/18385721095069-E-Mail-Benachrichtigung-bei-Massenterminen",
    note: "Offizielle Anleitung zur E-Mail-Logik rund um Erinnerungen und Teilnehmerkommunikation bei Massenterminen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Besichtigung bestätigen 2026",
  ogTitle: "Besichtigung bestätigen 2026 | Advaic",
  description:
    "Praxisleitfaden für Makler: Wie Besichtigungen sauber bestätigt werden und warum Status, Rückweg und Terminmodell wichtiger sind als nur ein freundliches Ja.",
  path: "/besichtigung-bestaetigen",
  template: "guide",
  eyebrow: "Besichtigung bestätigen",
  proof: "Belastbare Bestätigung braucht klaren Status, sichtbaren Rückweg und den passenden Terminpfad.",
});

export default function BesichtigungBestaetigenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Besichtigung bestätigen 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-20",
        mainEntityOfPage: `${siteUrl}/besichtigung-bestaetigen`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Besichtigung bestätigen", "Terminstatus", "Immobilienmakler", "Besichtigungen"],
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
        { name: "Besichtigung bestätigen", path: "/besichtigung-bestaetigen" },
      ]}
      schema={schema}
      kicker="Besichtigung bestätigen"
      title="Wie Makler Besichtigungen sauber bestätigen"
      description="Belastbare Bestätigung ist ein Prozessschritt, nicht nur eine höfliche Mail. Entscheidend sind Terminstatus, Rückweg, Zuständigkeit und das passende Terminmodell."
      actions={
        <>
          <Link href="/besichtigungstermine-koordinieren" className="btn-secondary">
            Termine koordinieren
          </Link>
          <Link href="/signup?entry=besichtigung-bestaetigen" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu Bestätigungsbestandteilen oder zum Prozess springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#bestandteile" className="btn-secondary w-full justify-center">
              Bestandteile
            </MarketingJumpLink>
            <MarketingJumpLink href="#prozess" className="btn-secondary w-full justify-center">
              Prozess
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="besichtigung-bestaetigen"
      primaryHref="/signup?entry=besichtigung-bestaetigen-stage"
      primaryLabel="Mit echten Terminen prüfen"
      secondaryHref="/besichtigungserinnerungen-automatisieren"
      secondaryLabel="Erinnerungen automatisieren"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung zu Terminbuchung, Statuslogik, Zeitfenstern und Teilnehmerkommunikation. Für den echten Betrieb sollten Sie zusätzlich prüfen, wie viele Termine bei Ihnen heute nur lose zugesagt statt wirklich bestätigt sind."
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
                Produkt- und Prozessteam mit Fokus auf Besichtigungspfad, Statuslogik und kontrollierte Folgekommunikation.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite Bestätigung bewertet</h2>
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
            <h2 className="h2">Warum Besichtigung bestätigen mehr ist als höflich zusagen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Bestätigung macht Termine belastbar. Schlechte Bestätigung erzeugt nur scheinbare Sicherheit.
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

      <section id="bestandteile" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Was bei einer Besichtigung wirklich bestätigt sein muss</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Je klarer diese Punkte, desto weniger schwebende Termine und spätere Überraschungen entstehen.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={confirmationRows}
            rowKey={(item) => item.item}
            columns={[
              { key: "item", label: "Bestandteil", emphasize: true },
              { key: "meaning", label: "Was gemeint ist" },
              { key: "whyItMatters", label: "Warum es zählt" },
              { key: "watch", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="prozess" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Ein sauberer Bestätigungspfad vor der Besichtigung</h2>
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

      <section id="sonderfaelle" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Sonderfälle, bei denen Bestätigung anders läuft</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {edgeCases.map((item) => (
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
              <h2 className="h3">Kennzahlen für belastbare Bestätigung</h2>
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
              <h2 className="h3 mt-3">Bestätigung wirkt nur mit Erinnerung und Statuspflege</h2>
              <p className="helper mt-3">
                Wenn Rückwege, Erinnerungen oder spätere Änderungen nicht sauber geführt werden, bleibt auch gute
                Bestätigung zu fragil.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/besichtigungserinnerungen-automatisieren" className="btn-secondary">
                  Erinnerungen
                </Link>
                <Link href="/besichtigung-absagen-reduzieren" className="btn-secondary">
                  Absagen reduzieren
                </Link>
                <Link href="/massenbesichtigungen-organisieren" className="btn-secondary">
                  Massenbesichtigungen
                </Link>
                <Link href="/no-show-besichtigungen-reduzieren" className="btn-secondary">
                  No-Shows reduzieren
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
              <h2 className="h3 mt-3">Wenn aus losen Zusagen wieder belastbare Termine werden sollen</h2>
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
                  Terminlogik
                </Link>
                <Link href="/besichtigungserinnerungen-automatisieren" className="btn-secondary">
                  Erinnerungen
                </Link>
                <Link href="/massenbesichtigungen-organisieren" className="btn-secondary">
                  Massenbesichtigungen
                </Link>
                <Link href="/besichtigung-absagen-reduzieren" className="btn-secondary">
                  Absagen
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn der Statuspfad noch nicht steht</h2>
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
