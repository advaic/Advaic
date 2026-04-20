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
  "Massenbesichtigungen funktionieren nicht wie viele kleine Einzeltermine. Sobald mehrere Interessenten in einem gemeinsamen Zeitfenster laufen, braucht das Team Teilnehmerstatus, klare Rückwege und eine andere Erinnerungstaktik.",
  "Der häufigste Fehler ist, Massenbesichtigungen nur als Terminmenge zu sehen. In der Praxis scheitern sie eher an unklaren Zu- und Absagen, fehlender Vor-Ort-Logik und zu spätem Bereinigen der Teilnehmerliste.",
  "Stark werden Massentermine dann, wenn sie operativ einfach bleiben: wenige feste Stufen, sichtbarer Status pro Interessent und ein klarer Pfad von Einladung bis Vor-Ort-Nachbereitung.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#warum", label: "Warum Massentermine anders laufen" },
  { href: "#bausteine", label: "Was organisiert sein muss" },
  { href: "#ablauf", label: "Sauberer Ablauf" },
  { href: "#fehler", label: "Typische Fehler" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Primärquellen von onOffice, onPointment und Propstack mit Advaics Sicht auf Teilnehmerstatus, Terminfenster und Folgekommunikation bei Massenbesichtigungen.",
  "Bewertet wird nicht nur der Versand einer Einladung, sondern der gesamte operative Pfad: Zeitfenster, Zu- oder Absage, Erinnerungslogik, Vor-Ort-Steuerung und Nachbereitung.",
  "Die Empfehlungen sind bewusst pragmatisch. Ziel ist kein schweres Veranstaltungsmanagement, sondern weniger Verwirrung, weniger stille Ausfälle und sauberere Besichtigungstage.",
];

const framingCards = [
  {
    title: "Massentermine brauchen ein eigenes Terminmodell",
    text: "Sobald mehrere Interessenten gleichzeitig oder in klaren Wellen eingeladen werden, reichen Einzeltermin-Gewohnheiten nicht mehr aus.",
  },
  {
    title: "Teilnehmerstatus ist wichtiger als Mailgefühl",
    text: "Bei vielen parallelen Rückmeldungen wird schnell unsichtbar, wer bestätigt, unsicher, abgesagt oder still geblieben ist. Genau dort kippt die Organisation.",
  },
  {
    title: "Frühe Absage ist operativ oft ein Gewinn",
    text: "Ein sauberer Absageweg verbessert Massenbesichtigungen meist mehr als eine besonders freundliche Einladung. Frühe Klarheit ist wertvoller als späte Hoffnung.",
  },
  {
    title: "Erinnerung und Vor-Ort-Liste gehören zusammen",
    text: "Wer Einladungen verschickt, aber Teilnehmer kurz vor dem Termin nicht noch einmal stabilisiert, läuft in volle Kalender mit halbleeren Besichtigungen.",
  },
];

const setupRows = [
  {
    item: "Zeitfenster statt lose Einzelabsprachen",
    meaning: "Interessenten sollen erkennen, in welchem festen Rahmen der Termin stattfindet und ob es ein offenes oder enges Zeitfenster ist.",
    whyItMatters: "Das reduziert Rückfragen und verhindert, dass unterschiedliche Erwartungen an denselben Termin entstehen.",
    watch: "Zeitfenster dürfen nicht so breit sein, dass Vor-Ort-Steuerung und Andrang unklar werden.",
  },
  {
    item: "Teilnehmerstatus je Interessent",
    meaning: "Bestätigt, offen, abgesagt oder verschoben müssen sichtbar getrennt sein.",
    whyItMatters: "Nur so lassen sich Erinnerungen, Wartelisten und Vor-Ort-Erwartungen sauber steuern.",
    watch: "Freitext im Postfach ersetzt keinen belastbaren Status für den Termin.",
  },
  {
    item: "Klare Zu- und Absagewege",
    meaning: "Interessenten brauchen einen einfachen Weg, Zusage, Absage oder Rückfrage sauber zurückzuspielen.",
    whyItMatters: "Gerade bei vielen Teilnehmern senkt das stilles Nichterscheinen und spätes Chaos deutlich.",
    watch: "Absagen müssen sofort aus der Teilnehmerlogik herausfallen, nicht erst manuell nachträglich.",
  },
  {
    item: "Erinnerungen nach Status",
    meaning: "Nicht jede angeschriebene Person bekommt dieselbe Erinnerung. Maßgeblich ist, wer wirklich als Teilnehmer gilt.",
    whyItMatters: "Sonst laufen Erinnerungen an abgesagte oder unsichere Fälle weiter und erzeugen Unruhe.",
    watch: "Stoppsignale müssen direkt an den Teilnehmerstatus gekoppelt sein.",
  },
  {
    item: "Vor-Ort-Liste und Nachbereitung",
    meaning: "Das Team braucht vor dem Termin eine belastbare Sicht, wer erwartet wird und was nach dem Termin passieren soll.",
    whyItMatters: "Ohne diese Übersicht werden Massenbesichtigungen schnell zu losem Erinnern statt zu steuerbaren Prozessschritten.",
    watch: "Nachbereitung darf nicht erst am Abend improvisiert werden.",
  },
];

const processSteps = [
  {
    title: "1. Terminmodell festlegen",
    text: "Vor dem Versand muss klar sein, ob ein offenes Zeitfenster, ein enges Slot-Modell oder mehrere Wellen sinnvoll sind. Das steuert alle späteren Zusagen.",
  },
  {
    title: "2. Geeignete Interessenten einladen",
    text: "Nicht jede offene Anfrage gehört sofort in denselben Termin. Vorqualifizierung spart gerade bei knappen Slots viel operative Unruhe.",
  },
  {
    title: "3. Teilnehmerstatus sichtbar aufbauen",
    text: "Zugesagt, offen und abgesagt sollten laufend sauber getrennt werden. Erst dadurch entsteht eine belastbare Teilnehmerliste.",
  },
  {
    title: "4. Kurz vor dem Termin stabilisieren",
    text: "Erinnerungen, letzte Rückfragen und Absagen gehören in einen engen Zeitraum vor dem Termin. Dort entscheidet sich, wie belastbar die Liste wirklich ist.",
  },
  {
    title: "5. Nach dem Termin direkt weiterführen",
    text: "Dokumente, Nachfassungen oder die nächste Auswahlstufe sollten noch am selben Prozesspfad hängen, damit Momentum nicht verloren geht.",
  },
];

const commonMistakes = [
  "Zu viele Interessenten ohne erkennbare Teilnehmerlogik einladen und erst kurz vor dem Termin versuchen, die Liste zu sortieren.",
  "Massentermine wie Einzeltermine behandeln und dadurch jede Rückmeldung wieder manuell interpretieren zu müssen.",
  "Erinnerungen zu breit streuen statt nur an klar bestätigte Teilnehmer zu senden.",
  "Absagen und Rückfragen nicht konsequent in die Vor-Ort-Liste zurückzuspielen.",
];

const metrics = [
  "Quote klar bestätigter Teilnehmer vor Versand der letzten Erinnerung",
  "Anteil Absagen, die vor dem Termin sauber im Status landen",
  "No-Show-Quote bei Massenterminen",
  "Zeitaufwand des Teams für manuelle Rückfragen pro Terminserie",
  "Anteil Teilnehmer, die nach der Besichtigung sauber in den nächsten Folgepfad übergehen",
];

const advaicFit = [
  "Ihr Team organisiert regelmäßig Besichtigungswellen und braucht mehr Ordnung zwischen Einladung, Zusage, Erinnerung und Nachbereitung.",
  "Sie möchten Massenbesichtigungen nicht nur schneller, sondern mit klarer Teilnehmerlogik und weniger stillen Ausfällen organisieren.",
  "Sie suchen keinen Event-Baukasten, sondern einen stabilen Maklerprozess für wiederkehrende Besichtigungstage.",
];

const advaicNotFit = [
  "Ihr Büro arbeitet fast nur mit hochindividuellen Einzelterminen, bei denen ein gemeinsamer Terminrahmen kaum vorkommt.",
  "Das Volumen ist so gering, dass ein eigener Massentermin-Pfad operativ wenig zusätzlichen Nutzen bringt.",
  "Ihre eigentliche Schwäche liegt früher, etwa in der Anfragequalifizierung oder bei unklaren Zuständigkeiten, nicht in der Terminlogik.",
];

const faqItems = [
  {
    question: "Wann lohnt sich eine Massenbesichtigung wirklich?",
    answer:
      "Dann, wenn auf ein Objekt oder einen Terminblock mehrere passende Interessenten in engem Zeitraum kommen und der organisatorische Vorteil höher ist als der Verlust an Individualität.",
  },
  {
    question: "Warum ist Teilnehmerstatus bei Massenbesichtigungen so wichtig?",
    answer:
      "Weil das Team sonst nicht sauber unterscheiden kann, wer wirklich erwartet wird, wer noch offen ist und wer längst abgesagt hat. Genau daraus entstehen viele unnötige No-Shows und Rückfragen.",
  },
  {
    question: "Reicht eine Einladung mit Uhrzeit und Adresse?",
    answer:
      "Für belastbare Massentermine meist nicht. Es braucht zusätzlich einen klaren Zu- oder Absageweg, sichtbare Status und eine Erinnerung, die sich am echten Teilnehmerstand orientiert.",
  },
  {
    question: "Wie eng sollten Zeitfenster bei Massenbesichtigungen sein?",
    answer:
      "So eng, dass das Team Vor-Ort-Erwartung und Andrang noch steuern kann, aber nicht so eng, dass jede kleine Verspätung den ganzen Termin kippt. Die passende Breite hängt stark vom Objekt und der Zahl der Teilnehmer ab.",
  },
];

const sources = [
  {
    label: "onPointment: Online-Terminbuchungssystem für Immobilienmakler",
    href: "https://at.onoffice.com/immobiliensoftware/online-terminbuchungssystem/",
    note: "Offizielle Herstellerseite zur Terminlogik mit Kalenderabgleich und Buchungsabläufen.",
  },
  {
    label: "onOffice Hilfe: Zeitfenster für Termine",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/zeitfenster-fuer-termine/",
    note: "Offizielle Hilfe zur strukturierten Sammlung und Rückmeldung von Terminvorschlägen.",
  },
  {
    label: "Propstack: Massentermine",
    href: "https://support.propstack.de/hc/de/articles/18385951788317-Massentermine",
    note: "Offizielle Hilfe zu Teilnehmerstatus, Einladungen und Terminorganisation für mehrere Interessenten.",
  },
  {
    label: "Propstack: E-Mail-Benachrichtigung bei Massenterminen",
    href: "https://support.propstack.de/hc/de/articles/18385721095069-E-Mail-Benachrichtigung-bei-Massenterminen",
    note: "Offizielle Anleitung zur Benachrichtigungs- und Erinnerungskommunikation rund um Massentermine.",
  },
  {
    label: "Propstack: Terminabsage per Klick",
    href: "https://support.propstack.de/hc/de/articles/23749142496541-Terminabsage-per-Klick",
    note: "Offizielle Hilfe für einfache Absagepfade und deren operative Wirkung auf die Teilnehmerliste.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Massenbesichtigungen organisieren 2026",
  ogTitle: "Massenbesichtigungen organisieren 2026 | Advaic",
  description:
    "Praxisleitfaden für Makler: Wie Massenbesichtigungen mit klaren Teilnehmerstatus, Zeitfenstern, Erinnerungen und Nachbereitung sauber organisiert werden.",
  path: "/massenbesichtigungen-organisieren",
  template: "guide",
  eyebrow: "Massenbesichtigungen organisieren",
  proof: "Starke Massenbesichtigungen entstehen aus Teilnehmerstatus, klaren Rückwegen und belastbarer Vor-Ort-Logik.",
});

export default function MassenbesichtigungenOrganisierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Massenbesichtigungen organisieren 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-20",
        mainEntityOfPage: `${siteUrl}/massenbesichtigungen-organisieren`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Massenbesichtigungen organisieren", "Massentermine", "Immobilienmakler", "Besichtigungen"],
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
        { name: "Massenbesichtigungen organisieren", path: "/massenbesichtigungen-organisieren" },
      ]}
      schema={schema}
      kicker="Massenbesichtigungen organisieren"
      title="Wie Makler Massenbesichtigungen sauber organisieren"
      description="Massentermine brauchen ein anderes Betriebsmodell als Einzeltermine. Entscheidend sind Zeitfenster, Teilnehmerstatus, klare Rückwege und eine belastbare Vor-Ort-Liste."
      actions={
        <>
          <Link href="/besichtigungstermine-koordinieren" className="btn-secondary">
            Termine koordinieren
          </Link>
          <Link href="/signup?entry=massenbesichtigungen-organisieren" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu Bausteinen oder Ablauf springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#bausteine" className="btn-secondary w-full justify-center">
              Bausteine
            </MarketingJumpLink>
            <MarketingJumpLink href="#ablauf" className="btn-secondary w-full justify-center">
              Ablauf
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="massenbesichtigungen-organisieren"
      primaryHref="/signup?entry=massenbesichtigungen-organisieren-stage"
      primaryLabel="Mit echten Massenterminen prüfen"
      secondaryHref="/besichtigungserinnerungen-automatisieren"
      secondaryLabel="Erinnerungen automatisieren"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung zu Zeitfenstern, Teilnehmerstatus, Erinnerungen und Absagewegen. Für den echten Betrieb sollten Sie zusätzlich prüfen, wie viele Interessenten pro Terminwelle heute mit losem statt klarem Teilnehmerstatus laufen."
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
                Produkt- und Prozessteam mit Fokus auf Terminlogik, Teilnehmerstatus und kontrollierte Folgepfade im
                Besichtigungsprozess.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite Massenbesichtigungen bewertet</h2>
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
            <h2 className="h2">Warum Massenbesichtigungen ein eigener Prozess sind</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Ein Massentermin ist kein Einzeltermin im Plural. Mit jedem zusätzlichen Teilnehmer steigt nicht nur die
              Zahl der Nachrichten, sondern vor allem die Notwendigkeit für klare Status und einfache Rückwege.
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

      <section id="bausteine" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Was bei Massenbesichtigungen sauber organisiert sein muss</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Sobald diese Bausteine sichtbar im Prozess hängen, sinken Rückfragen, stille Ausfälle und Vor-Ort-Chaos
              spürbar.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={setupRows}
            rowKey={(item) => item.item}
            columns={[
              { key: "item", label: "Baustein", emphasize: true },
              { key: "meaning", label: "Was gemeint ist" },
              { key: "whyItMatters", label: "Warum es zählt" },
              { key: "watch", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="ablauf" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Ein belastbarer Ablauf für Massenbesichtigungen</h2>
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

      <section id="fehler" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Typische Fehler bei der Organisation von Massenbesichtigungen</h2>
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
              <h2 className="h3 mt-3">Ein voller Termin ist nicht automatisch ein belastbarer Termin</h2>
              <p className="helper mt-3">
                Wirklich stark werden Massenbesichtigungen erst dann, wenn das Team vor Ort weiß, wen es tatsächlich
                erwarten darf und welche Fälle danach direkt weitergeführt werden.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen für starke Massenbesichtigungen</h2>
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
              <h2 className="h3 mt-3">Massentermine leben von klarer Erinnerung und belastbarer Bestätigung</h2>
              <p className="helper mt-3">
                Wenn Bestätigung, Erinnerung oder Absageweg schwach sind, kippt auch die beste Terminplanung schnell in
                operative Unruhe.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/besichtigung-bestaetigen" className="btn-secondary">
                  Besichtigung bestätigen
                </Link>
                <Link href="/besichtigungserinnerungen-automatisieren" className="btn-secondary">
                  Erinnerungen automatisieren
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
              <h2 className="h3 mt-3">Wenn Massentermine im Alltag wieder berechenbar werden sollen</h2>
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
                  Terminlogik ansehen
                </Link>
                <Link href="/signup?entry=massenbesichtigungen-organisieren-fit" className="btn-primary">
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
            <h2 className="h2">FAQ zu Massenbesichtigungen</h2>
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
