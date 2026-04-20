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
  "ImmoScout-Anfragen nachzufassen ist nicht dasselbe wie allgemeines Lead-Follow-up. Quelle, API-Logik, Objektbezug und mögliche Doppelverarbeitung müssen zuerst sauber eingeordnet werden.",
  "Gute Nachfasslogik für ImmoScout24 beginnt mit einer schnellen, klaren Erstantwort und stoppt konsequent, sobald Antwort, Terminbuchung, Dublettenhinweis oder ein anderer Kontextwechsel sichtbar wird.",
  "Der größte Fehler ist, Portalanfragen wie normale Postfachmails zu behandeln. Dann werden API-verknüpfte Vorgänge, zusätzliche Interessentendaten und echte Stoppsignale zu leicht übersehen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#warum", label: "Warum ImmoScout-Follow-up anders ist" },
  { href: "#situationen", label: "Situationen & Abstände" },
  { href: "#stoppfaelle", label: "Stoppsignale" },
  { href: "#prozess", label: "Sauberer Portalpfad" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Primärquellen von ImmoScout24, Propstack, onOffice, FLOWFACT und HubSpot mit Advaics Sicht auf portalnahe Folgekommunikation im Makleralltag.",
  "Bewertet werden nicht nur Abstände zwischen Nachrichten, sondern auch API-Verarbeitung, Quellenlogik, Dublettenvermeidung, Threading und die Frage, wann ein Portalfall aus der Standardlogik herausfällt.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist nicht möglichst viel Portalaktivität, sondern ein sauberer nächster Schritt pro Anfrage.",
];

const whyDifferent = [
  {
    title: "ImmoScout24 bringt eigenes Anfragegewicht mit",
    text: "ImmoScout24 verweist selbst auf Millionen Anfragen pro Monat. Für Makler bedeutet das: hoher Eingangsdruck, aber auch viele Standardfälle, die nur mit sauberer Portal-Logik wirklich gut bearbeitet werden.",
  },
  {
    title: "API- und E-Mail-Sicht können zeitlich auseinanderlaufen",
    text: "Propstack weist ausdrücklich darauf hin, dass ImmoScout24-Anfragen direkt per API übertragen und die E-Mail teils erst verzögert zugeordnet werden. Genau deshalb ist blindes Nachfassen riskant.",
  },
  {
    title: "Zusätzliche Interessentendaten ändern die Einordnung",
    text: "Je nach ImmoScout24- und Systemkonfiguration können zusätzliche Angaben wie Budget, Finanzierungsstatus oder Suchstatus vorliegen. Das beeinflusst, ob eine zweite Nachricht sinnvoll ist oder nicht.",
  },
  {
    title: "Portalfollow-up braucht Objekt- und Quellenklarheit",
    text: "Wenn unklar ist, zu welchem Objekt, welchem Bearbeiter oder welchem Systemfall eine Anfrage gehört, sollte kein automatisches Nachfassen loslaufen.",
  },
];

const scenarioRows = [
  {
    situation: "Klare Exposé-Anfrage ohne Reaktion auf die erste Antwort",
    timing: "Nach 1 bis 2 Werktagen",
    goal: "Interesse bestätigen und den nächsten Schritt konkretisieren",
    watch: "Vorher prüfen, ob Antwort, API-Update oder Dublettenhinweis schon vorliegt",
  },
  {
    situation: "Besichtigung vorgeschlagen, aber kein Termin bestätigt",
    timing: "Nach 1 Werktag",
    goal: "Zeitfenster oder einen konkreten Buchungsschritt anbieten",
    watch: "Nicht weiter nachfassen, wenn der Fall bereits in der Terminabstimmung oder manuell bearbeitet wird",
  },
  {
    situation: "Zusätzliche Profildaten sprechen für aktiven Suchstatus",
    timing: "Nach Sichtung der Daten zeitnah und fallbezogen",
    goal: "Die Anfrage präziser einordnen und passend fortführen",
    watch: "Nur nutzen, wenn die Daten wirklich vorliegen und korrekt übertragen wurden",
  },
  {
    situation: "Unklare oder doppelte Portalanfrage",
    timing: "Nicht automatisch nachfassen",
    goal: "Fall erst zusammenführen, zuordnen oder stoppen",
    watch: "Gerade bei API-/E-Mail-Verzögerung drohen sonst doppelte Kontaktpunkte",
  },
  {
    situation: "Zwei offene Nachfassstufen ohne Reaktion",
    timing: "Danach bewusst beenden oder manuell neu entscheiden",
    goal: "Kein künstliches Weiterdrehen des Vorgangs",
    watch: "Ab hier ist Prozessklarheit wichtiger als zusätzliche Versandmenge",
  },
];

const stopCases = [
  {
    title: "Antwort oder Portalreaktion liegt vor",
    text: "Sobald der Interessent antwortet, ein Termin gebucht wird oder eine andere echte Aktivität sichtbar ist, endet der bisherige Nachfasspfad und der konkrete Vorgang übernimmt.",
  },
  {
    title: "API-/E-Mail-Dubletten oder verspätete Zuordnung",
    text: "Bei ImmoScout24 dürfen verzögert verknüpfte E-Mails nicht fälschlich als neue offene Anfrage gelesen werden. Erst die Systemlage klären, dann entscheiden.",
  },
  {
    title: "Objekt, Zuständigkeit oder Kontext haben sich geändert",
    text: "Wenn Verfügbarkeit, Betreuer oder Risikolage nicht mehr zur ursprünglichen Antwort passen, sollte der Fall aus der Standardlogik raus und bewusst geprüft werden.",
  },
];

const processSteps = [
  {
    title: "1. Portalanfrage sicher erkennen",
    text: "Noch vor jeder Nachfasslogik muss feststehen, dass es sich um eine echte ImmoScout-Anfrage zum richtigen Objekt handelt.",
  },
  {
    title: "2. Erste Antwort mit klarem nächsten Schritt senden",
    text: "Ohne saubere Erstantwort wird Nachfassen fast immer schwächer. Besonders bei Portalen muss die erste Nachricht Orientierung und Richtung geben.",
  },
  {
    title: "3. Systemstatus vor Folgekontakt prüfen",
    text: "Antworten, API-Updates, Dublettenhinweise oder bereits laufende manuelle Bearbeitung müssen sichtbar sein, bevor eine zweite Nachricht ausgelöst wird.",
  },
  {
    title: "4. Nur offene Fälle mit klarem Ziel nachfassen",
    text: "Gute Portalfollow-ups wollen nicht einfach Aufmerksamkeit, sondern eine erkennbare Entscheidung: Termin, Unterlagen, Rückmeldung oder sauberer Stopp.",
  },
  {
    title: "5. Folgepfad bewusst beenden oder übergeben",
    text: "Spätestens nach zwei offenen Stufen sollte klar sein, ob der Fall endet, in die persönliche Bearbeitung wechselt oder in einen anderen Prozesspfad geht.",
  },
];

const metrics = [
  "Antwortquote auf die erste Nachfass-Mail bei ImmoScout-Anfragen",
  "Anteil Portalfälle, die wegen Antwort oder Termin korrekt gestoppt werden",
  "Quote erkannter Dubletten oder verspätet verknüpfter Anfrage-E-Mails",
  "Anteil ImmoScout-Anfragen mit nutzbaren Zusatzdaten für die Einordnung",
  "Zeit bis zum geklärten nächsten Schritt statt nur bis zur nächsten Mail",
];

const advaicFit = [
  "Ihr Team bekommt regelmäßig ImmoScout-Volumen und braucht einen saubereren Pfad zwischen schneller Erstantwort, portalnahem Nachfassen und bewussten Stopps.",
  "Sie möchten ImmoScout-Fälle nicht wie generische Sequenzkontakte behandeln, sondern anhand von Quelle, Objektbezug und Statuslogik steuern.",
  "Sie suchen keine breite Vertriebskadenz, sondern belastbare Folgekommunikation für konkrete Portalanfragen im Makleralltag.",
];

const advaicNotFit = [
  "Objekt- und Quellenlogik sind intern noch nicht stabil genug, um ImmoScout-Fälle verlässlich zuzuordnen.",
  "Ihr Portalvolumen ist sehr gering oder fast jeder Fall braucht ohnehin sofort persönliche Einzelbearbeitung.",
  "Die eigentliche Lücke liegt vor dem Nachfassen, etwa bei verspäteter Erstantwort oder unsauberer Qualifizierung.",
];

const faqItems = [
  {
    question: "Warum braucht ImmoScout-Nachfassen eine eigene Logik?",
    answer:
      "Weil Portalanfragen nicht nur Textverläufe sind. Quelle, API-Verarbeitung, Objektbezug und mögliche Zusatzdaten beeinflussen, ob ein Follow-up überhaupt sinnvoll und technisch sauber ist.",
  },
  {
    question: "Soll jede offene ImmoScout-Anfrage automatisch nachgefasst werden?",
    answer:
      "Nein. Erst wenn klar ist, dass keine Antwort, keine Dublette und kein anderer laufender Vorgang vorliegt, ist ein standardisiertes Nachfassen sinnvoll.",
  },
  {
    question: "Was ist bei ImmoScout-Dubletten besonders riskant?",
    answer:
      "Dass dieselbe Anfrage aus Systemsicht unterschiedlich sichtbar wird, etwa erst per API und später als E-Mail-Verknüpfung. Dann würde ein unvorsichtiger Folgekontakt unnötig doppelt laufen.",
  },
  {
    question: "Wie viele Nachfassstufen sind bei ImmoScout realistisch?",
    answer:
      "Für einen sauberen Start meist ein bis zwei. Danach ist eine bewusste Entscheidung besser als weitere Standardmails ohne klaren Erkenntnisgewinn.",
  },
];

const sources = [
  {
    label: "ImmoScout24: Top Leads & Kontaktanfragen",
    href: "https://www.immobilienscout24.de/lp/kunde-werden/",
    note: "Offizielle Einordnung von ImmoScout24 als starkem Anfragekanal mit hohem Lead- und Kontaktvolumen.",
  },
  {
    label: "Propstack: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Offizielle Hilfe zu Quellenlogik, API-Verarbeitung und verzögerter Verknüpfung von ImmoScout24-Anfrage-E-Mails.",
  },
  {
    label: "Propstack: Erweiterte Interessentendaten von ImmoScout24-Anfragen",
    href: "https://support.propstack.de/hc/de/articles/21686758191773-Erweiterte-Interessentendaten-von-ImmoScout24-Anfragen",
    note: "Offizielle Hilfe zu zusätzlichen Profildaten wie Budget, Finanzierungsstatus oder Suchstatus in ImmoScout24-Anfragen.",
  },
  {
    label: "onOffice Hilfe: Anfragenmanager einrichten",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/anfragenmanager-einrichten/",
    note: "Offizielle Hilfe zum geregelten Anfragepfad mit Zuständigkeiten und operativer Bearbeitungslogik.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite zur automatischen Erkennung, Verarbeitung und Zuordnung eingehender Anfragen.",
  },
  {
    label: "HubSpot: Unenroll contacts from a sequence",
    href: "https://knowledge.hubspot.com/sequences/unenroll-from-sequence",
    note: "Offizielle Quelle zu Stoppsignalen wie Antwort, Terminbuchung, Bounce und Abmeldung.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "ImmoScout-Anfragen nachfassen 2026",
  ogTitle: "ImmoScout-Anfragen nachfassen 2026 | Advaic",
  description:
    "Praxisleitfaden für Makler: Wie ImmoScout-Anfragen sinnvoll nachgefasst werden, ohne Dubletten, API-Logik oder Stoppsignale zu übersehen.",
  path: "/immobilienscout-anfragen-nachfassen",
  template: "guide",
  eyebrow: "ImmoScout nachfassen",
  proof:
    "Gutes ImmoScout-Follow-up prüft zuerst Quelle, Status und Dublettenlage und sendet erst dann die nächste Nachricht.",
});

export default function ImmoScoutAnfragenNachfassenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "ImmoScout-Anfragen nachfassen 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-14",
        mainEntityOfPage: `${siteUrl}/immobilienscout-anfragen-nachfassen`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["ImmoScout24", "Nachfassen", "Portalanfragen", "Immobilienmakler"],
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
        { name: "ImmoScout-Anfragen nachfassen", path: "/immobilienscout-anfragen-nachfassen" },
      ]}
      schema={schema}
      kicker="ImmoScout nachfassen"
      title="Wie Makler ImmoScout-Anfragen sinnvoll nachfassen"
      description="Portalfollow-up braucht eine eigene Logik. Gute zweite Schritte prüfen zuerst Quelle, Systemstatus und Dublettenlage, bevor sie automatisch weiterlaufen."
      actions={
        <>
          <Link href="/immobilienscout-anfragen-automatisieren" className="btn-secondary">
            ImmoScout automatisieren
          </Link>
          <Link href="/signup?entry=immobilienscout-anfragen-nachfassen" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu den Situationen oder Stoppsignalen springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#situationen" className="btn-secondary w-full justify-center">
              Situationen
            </MarketingJumpLink>
            <MarketingJumpLink href="#stoppfaelle" className="btn-secondary w-full justify-center">
              Stoppsignale
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="immobilienscout-anfragen-nachfassen"
      primaryHref="/signup?entry=immobilienscout-anfragen-nachfassen-stage"
      primaryLabel="Mit echten Portalfällen prüfen"
      secondaryHref="/immobilienanfragen-nachfassen"
      secondaryLabel="Allgemeines Nachfassen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung zu Portalvolumen, API-Verarbeitung, zusätzlichen Interessentendaten und Stoppsignalen im Follow-up. Für den echten Betrieb sollten Sie zusätzlich Ihre System- und Dublettenlage im Live-Bestand prüfen."
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
                Produkt- und Prozessteam mit Fokus auf Portaleingang, Folgekommunikation und kontrollierte Übergänge
                zwischen Standardfall und manueller Prüfung.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite Portalfollow-up bewertet</h2>
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
            <h2 className="h2">Warum ImmoScout-Follow-up anders ist als normales Nachfassen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Portalnahe Folgekommunikation scheitert selten an der Formulierung allein, sondern häufiger an Quelle,
              Status und Systemlage.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {whyDifferent.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="situationen" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche ImmoScout-Fälle welches Nachfassen tragen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Entscheidend ist nicht nur der Abstand, sondern ob der Fall portal- und systemseitig überhaupt noch offen ist.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={scenarioRows}
            rowKey={(item) => item.situation}
            columns={[
              { key: "situation", label: "Situation", emphasize: true },
              { key: "timing", label: "Sinnvoller Abstand" },
              { key: "goal", label: "Ziel" },
              { key: "watch", label: "Worauf achten" },
            ]}
          />
        </Container>
      </section>

      <section id="stoppfaelle" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Stoppsignale, die bei ImmoScout-Fällen besonders wichtig sind</h2>
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

      <section id="prozess" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Ein sauberer Portalpfad vom Eingang bis zum nächsten Schritt</h2>
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

      <section id="kennzahlen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen für sauberes ImmoScout-Nachfassen</h2>
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
              <h2 className="h3 mt-3">Portal-Follow-up lebt von der ersten Systementscheidung</h2>
              <p className="helper mt-3">
                Ohne saubere Quellenlogik, Zuordnung und Stoppsignale wird aus schneller Folgekommunikation leicht
                doppelte oder unpassende Kommunikation.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/immobilienscout-anfragen-automatisieren" className="btn-secondary">
                  ImmoScout automatisieren
                </Link>
                <Link href="/portalanfragen-priorisieren" className="btn-secondary">
                  Portalanfragen priorisieren
                </Link>
                <Link href="/immobilienscout-anfragen-qualifizieren" className="btn-secondary">
                  ImmoScout qualifizieren
                </Link>
                <Link href="/immobilienanfragen-nachfassen" className="btn-secondary">
                  Allgemeines Nachfassen
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
              <h2 className="h3 mt-3">Wenn ImmoScout-Fälle schneller, aber nicht blinder weiterlaufen sollen</h2>
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
                  ImmoScout automatisieren
                </Link>
                <Link href="/immobilienanfragen-nachfassen" className="btn-secondary">
                  Nachfassen
                </Link>
                <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                  Priorisieren
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn die Portal-Grundordnung noch fehlt</h2>
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
