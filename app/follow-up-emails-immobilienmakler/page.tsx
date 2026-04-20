import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "Nachfass-E-Mails funktionieren im Makleralltag nur dann gut, wenn die erste Antwort schnell und hilfreich war. Follow-up repariert keinen schwachen Anfrageeingang.",
  "Für die meisten Büros reichen zum Start ein bis zwei Erinnerungen mit klarer Begründung, festen Abständen in Werktagen und harten Stoppsignalen.",
  "Wirklich gute Nachfasslogik erhöht nicht die Zahl versendeter Mails, sondern die Zahl sinnvoll fortgeführter Gespräche.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#grundregeln", label: "Grundregeln" },
  { href: "#situationen", label: "Typische Situationen" },
  { href: "#taktung", label: "Zeitabstände" },
  { href: "#stoppsignale", label: "Stoppsignale" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Empfehlungen verbinden aktuelle offizielle HubSpot-Dokumentation zu Sequenzen, Antworten im selben Verlauf und automatischen Stopps mit allgemeiner Forschung zur Reaktionsgeschwindigkeit digitaler Leads.",
  "Die Zeitabstände auf dieser Seite sind bewusst als Richtwerte formuliert. Markt, Objekttyp, Teamgröße und die eigene Erstreaktionszeit verändern, was im Alltag wirklich sinnvoll ist.",
  "Der Fokus liegt auf hilfreicher Kommunikation im Anfrageprozess, nicht auf maximaler Kontaktfrequenz oder künstlichem Druck.",
];

const coreRules = [
  {
    title: "Erstreaktion vor Nachfassen",
    text: "Wenn die erste Antwort schon zu spät, unklar oder unvollständig war, bringt eine automatische Erinnerung meist wenig. Follow-up baut auf einem sauberen Start auf.",
  },
  {
    title: "Nur bei offenem Gespräch nachfassen",
    text: "Nachfass-E-Mails sollten an eine echte offene Frage anschließen: Unterlagen erhalten, Besichtigung abstimmen, Rückfrage klären oder nächsten Schritt bestätigen.",
  },
  {
    title: "Ein klarer nächster Schritt pro Mail",
    text: "Gute Follow-ups bitten nicht um alles gleichzeitig. Sie geben eine konkrete Handlung vor: Rückmeldung zu Unterlagen, Terminauswahl oder kurze Bestätigung.",
  },
  {
    title: "Sofort stoppen, wenn sich der Kontext ändert",
    text: "Antworten, Termine, Abwesenheitsnotizen, Konfliktsignale oder neue Informationen sind keine Randfälle, sondern der Kern einer sauberen Nachfasslogik.",
  },
];

const situations = [
  {
    title: "Exposé oder Unterlagen gesendet, keine Rückmeldung",
    text: "Eine kurze Erinnerung nach zwei Werktagen ist oft sinnvoll, wenn klar gefragt wurde, ob weitere Informationen oder ein Termin gewünscht sind.",
  },
  {
    title: "Besichtigung vorgeschlagen, aber kein Termin bestätigt",
    text: "Eine zweite Erinnerung darf helfen, offene Terminvorschläge zu klären. Danach ist meist eine manuelle Prüfung sinnvoller als weitere Automatik.",
  },
  {
    title: "Interessent hat eine konkrete Rückfrage offengelassen",
    text: "Hier darf die Nachfass-E-Mail direkt auf die unbeantwortete Frage Bezug nehmen. Ohne klaren Bezug wirkt dieselbe Nachricht schnell wie Serienversand.",
  },
  {
    title: "Es liegt schon eine Antwort oder Abwesenheitsnotiz vor",
    text: "Dann ist kein weiteres automatisches Nachfassen sinnvoll. Der Fall gehört entweder in den manuellen nächsten Schritt oder bleibt bis zum passenden Zeitpunkt gestoppt.",
  },
];

const timingSteps = [
  {
    title: "Tag 0: Erstantwort senden",
    text: "Schnell, hilfreich und mit einem eindeutigen nächsten Schritt. Ohne saubere Erstreaktion sollten Sie keine Folgestufen planen.",
  },
  {
    title: "Nach 2 Werktagen: erste Erinnerung",
    text: "Kurz halten, Bezug auf die vorherige Nachricht nehmen und nur einen konkreten nächsten Schritt anbieten.",
  },
  {
    title: "Nach weiteren 2 bis 3 Werktagen: zweite Erinnerung",
    text: "Nur bei weiterhin offenem Gespräch und nur dann, wenn der Fall operativ noch aktuell ist. Danach steigt das Risiko unnötiger Reibung deutlich.",
  },
  {
    title: "Danach: stoppen oder manuell entscheiden",
    text: "Mehrere automatische Stufen sind für Maklerbüros selten der beste Start. Besser ist ein kontrollierter Übergang in manuelle Prüfung oder bewusster Stopp.",
  },
];

const stopSignals = [
  "Der Interessent antwortet direkt oder in einem anderen Verlauf.",
  "Ein Termin wird gebucht oder der nächste Schritt ist bestätigt.",
  "Eine Abwesenheitsnotiz verschiebt den sinnvollen Zeitpunkt.",
  "Objekt, Verfügbarkeit oder Zuständigkeit haben sich geändert.",
  "Qualitäts- oder Risikoprüfungen markieren die Nachricht als Ausnahmefall.",
  "Der Tonfall oder die Vorgeschichte sprechen gegen weitere Automatisierung.",
];

const messagePrinciples = [
  {
    title: "Im selben E-Mail-Verlauf bleiben, wenn der Kontext dort schon sauber liegt",
    text: "Gerade bei offenen Anfragen hilft ein gemeinsamer Verlauf, weil der Empfänger nicht neu zusammensuchen muss, worum es ging. Genau deshalb unterstützen viele Sequenz-Tools Antworten im selben Verlauf.",
  },
  {
    title: "Hilfreich erinnern, nicht drängen",
    text: "Eine gute Nachfass-E-Mail fragt nicht pauschal nach, sondern bietet eine sinnvolle Entscheidung an: Termin abstimmen, Unterlagen ergänzen oder kurz Rückmeldung geben.",
  },
  {
    title: "Unsicherheit lieber anhalten als kaschieren",
    text: "Wenn Angaben fehlen oder der Fall sensibel geworden ist, sollte keine generische Mail verschickt werden. Dann ist Freigabe oder manuelle Übernahme sauberer.",
  },
];

const kpis = [
  {
    title: "Antwortquote nach der ersten Erinnerung",
    text: "Zeigt, ob die erste Nachfassstufe wirklich hilfreiche offene Gespräche trifft oder nur zusätzliche Aktivität erzeugt.",
  },
  {
    title: "Stopprate durch Antwort oder Termin",
    text: "Macht sichtbar, wie oft Folgekommunikation korrekt beendet wird, statt unnötig weiterzulaufen.",
  },
  {
    title: "Manuelle Übernahmequote",
    text: "Zeigt, wie viele Fälle bewusst aus der Automatik herausgenommen werden. Das ist kein Makel, sondern oft ein Zeichen kontrollierter Qualität.",
  },
  {
    title: "Negative Reaktionen auf Nachfass-E-Mails",
    text: "Beschwerden, Abmeldungen oder irritierte Antworten sind ein frühes Warnsignal für zu viel Frequenz oder zu wenig Kontext.",
  },
  {
    title: "Zeit bis zum geklärten nächsten Schritt",
    text: "Nicht jede Antwort ist wertvoll. Entscheidend ist, ob aus dem Follow-up ein klarer nächster Schritt entsteht.",
  },
];

const advaicFit = [
  "Wenn Ihr Team viele ähnliche Interessenten-Anfragen bearbeitet und Nachfassen bisher uneinheitlich oder zu spät passiert.",
  "Wenn Sie Folgekommunikation nur dann automatisch senden wollen, wenn Kontext, Qualitätsprüfung und Stoppsignale sauber zusammenpassen.",
  "Wenn Nachfassen nicht als starre Sequenz, sondern als Fortsetzung eines realen Anfrageverlaufs organisiert werden soll.",
];

const advaicNotFit = [
  "Wenn die Erstreaktion schon ungeklärt ist und der eigentliche Engpass noch im Anfrageeingang liegt.",
  "Wenn fast jede Folgekommunikation hoch individuell, konfliktbeladen oder verhandlungsnah ist.",
  "Wenn Sie primär ein allgemeines Tool für Newsletter- oder Vertriebssequenzen suchen und nicht eine operative Schicht für Makleranfragen.",
];

const faqItems = [
  {
    question: "Wie viele Nachfass-E-Mails sind für Makler sinnvoll?",
    answer:
      "Für einen sauberen Start reichen meist ein bis zwei Erinnerungen. Alles darüber hinaus sollte nur mit klarer Begründung und nach Sicht auf echte Reaktionen erweitert werden.",
  },
  {
    question: "Soll die Nachfass-E-Mail im selben Verlauf bleiben?",
    answer:
      "Oft ja, weil der Empfänger den bisherigen Kontext direkt sieht. Entscheidend ist, dass der bestehende Verlauf sauber ist und nicht bereits durch Antworten oder Sonderfälle überholt wurde.",
  },
  {
    question: "Wann sollte nicht automatisch nachgefasst werden?",
    answer:
      "Sobald eine Antwort vorliegt, ein Termin bestätigt wurde, eine Abwesenheitsnotiz aktiv ist, wichtige Informationen fehlen oder der Fall inhaltlich sensibel geworden ist.",
  },
  {
    question: "Ist Follow-up das Gleiche wie Lead-Nurturing?",
    answer:
      "Nein. Auf dieser Seite geht es um konkrete offene Makleranfragen. Lead-Nurturing beschreibt meist breitere Kommunikationsstrecken ohne unmittelbaren Anfragekontext.",
  },
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Zeigt, warum schnelle und strukturierte Reaktion auf digitale Anfragen wirtschaftlich relevant bleibt.",
  },
  {
    label: "HubSpot: Create and edit sequences",
    href: "https://knowledge.hubspot.com/sequences/create-and-edit-sequences",
    note: "Offizielle Dokumentation zu Sendefenstern, Werktagen und grundlegender Ablaufsteuerung in Sequenzen.",
  },
  {
    label: "HubSpot: Unenroll contacts from a sequence",
    href: "https://knowledge.hubspot.com/sequences/unenroll-from-sequence",
    note: "Offizielle Quelle zu automatischen Stoppsignalen wie Antwort, Termin oder Abmeldung.",
  },
  {
    label: "HubSpot: Create an email thread in a sequence",
    href: "https://knowledge.hubspot.com/de/sequences/create-an-email-thread-with-your-sequence",
    note: "Offizielle Dokumentation dazu, wann eine Nachfass-Mail im selben E-Mail-Verlauf sinnvoll geführt werden kann.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare und risikobewusste Automationsentscheidungen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Follow-up-E-Mails für Immobilienmakler 2026",
  ogTitle: "Follow-up-E-Mails für Immobilienmakler 2026 | Advaic",
  description:
    "Praxisleitfaden für Makler: sinnvolle Zeitabstände, klare Stoppsignale und bessere Nachfass-E-Mails im echten Anfrageprozess.",
  path: "/follow-up-emails-immobilienmakler",
  template: "guide",
  eyebrow: "Follow-up-E-Mails",
  proof: "Gutes Nachfassen folgt klaren Zeitabständen, bleibt im Kontext und stoppt bei Antwort oder Termin.",
});

export default function FollowUpEmailsImmobilienmaklerPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Follow-up-E-Mails für Immobilienmakler 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/follow-up-emails-immobilienmakler`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: [
          "Follow-up-E-Mails",
          "Immobilienmakler",
          "Nachfassen",
          "E-Mail-Verlauf",
          "Stoppsignale",
          "Anfrageprozess",
        ],
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
        { name: "Follow-up-E-Mails für Immobilienmakler", path: "/follow-up-emails-immobilienmakler" },
      ]}
      schema={schema}
      kicker="Follow-up-E-Mails"
      title="Follow-up-E-Mails für Immobilienmakler: sinnvoll nachfassen, rechtzeitig stoppen"
      description="Diese Seite zeigt, welche Zeitabstände im Makleralltag für Nachfass-E-Mails sinnvoll sind, wann Sie im selben E-Mail-Verlauf bleiben sollten und bei welchen Signalen automatische Folgekommunikation sofort endet."
      actions={
        <>
          <Link href="/follow-up-logik" className="btn-secondary">
            Produktlogik ansehen
          </Link>
          <Link href="/signup?entry=follow-up-emails" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu den Zeitabständen oder den Stoppsignalen springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#taktung" className="btn-secondary w-full justify-center">
              Zeitabstände
            </MarketingJumpLink>
            <MarketingJumpLink href="#stoppsignale" className="btn-secondary w-full justify-center">
              Stoppsignale
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="follow-up-emails-immobilienmakler"
      primaryHref="/signup?entry=follow-up-emails-stage"
      primaryLabel="Mit echten Fällen testen"
      secondaryHref="/anfragenmanagement-immobilienmakler"
      secondaryLabel="Anfragenmanagement"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten verbinden aktuelle offizielle Produktdokumentation zu Sequenzen und Stopplogik mit allgemeiner Forschung zur Bearbeitung digitaler Anfragen. Die genannten Zeitabstände sind bewusst als Richtwerte zu lesen, nicht als starre Branchenregel."
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
                Produkt- und Prozessteam mit Fokus auf Antwortqualität, Nachfassen und kontrollierte
                Kommunikationslogik für Maklerbüros.
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

      <section id="grundregeln" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Vier Grundregeln für gute Nachfass-E-Mails</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {coreRules.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="situationen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Typische Situationen im Makleralltag</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Nachfassen ist nur dann hilfreich, wenn die Situation noch offen und verständlich ist. Die besten
              Setups unterscheiden deshalb nicht nach Marketingkampagne, sondern nach echtem Anfragekontext.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {situations.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="taktung" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Zeitabstände, mit denen viele Teams gut starten</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Diese Abstände sind ein vorsichtiger Start für offene Makleranfragen. Entscheidend ist nicht die
              Schlagzahl, sondern ob jede Stufe noch nachvollziehbar zum Fall passt.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {timingSteps.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="stoppsignale" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Stoppsignale vor jeder weiteren Nachricht</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {stopSignals.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Was eine gute Nachfass-Mail auszeichnet</h2>
              <div className="mt-4 space-y-4">
                {messagePrinciples.map((item) => (
                  <article key={item.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                    <p className="helper mt-2">{item.text}</p>
                  </article>
                ))}
              </div>
            </article>
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Kennzahlen, die Nachfassen wirklich steuerbar machen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Follow-up-Logik misst nicht nur Versandmengen. Wichtiger ist, ob aus offenen Gesprächen schneller
              ein geklärter nächster Schritt wird und unnötige Folgekommunikation zuverlässig stoppt.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kpis.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="advaic" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn Nachfassen Teil des echten Anfrageprozesses sein soll</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/follow-up-logik" className="btn-secondary">
                  Nachfasslogik im Produkt
                </Link>
                <Link href="/immobilienanfragen-nachfassen" className="btn-secondary">
                  Immobilienanfragen nachfassen
                </Link>
                <Link href="/immobilienscout-anfragen-nachfassen" className="btn-secondary">
                  ImmoScout nachfassen
                </Link>
                <Link href="/besichtigungserinnerungen-automatisieren" className="btn-secondary">
                  Besichtigungserinnerungen
                </Link>
                <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                  Anfragenmanagement
                </Link>
                <Link href="/antwortzeit-immobilienanfragen" className="btn-secondary">
                  Antwortzeit
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn der Engpass noch woanders liegt</h2>
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
