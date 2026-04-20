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
  "Immobilienanfragen sauber nachzufassen heißt nicht, möglichst oft zu schreiben. Sinnvoll ist Nachfassen nur, wenn der Fall offen ist, der Kontext klar bleibt und Stoppsignale technisch wie operativ ernst genommen werden.",
  "Die stärkste Nachfasslogik beginnt bei einer guten Erstantwort. Wer den ersten Schritt zu spät oder zu unklar sendet, verschiebt das Problem meist nur in eine zweite Mail.",
  "Maklerbüros gewinnen mit gutem Nachfassen vor allem Klarheit: Wer braucht noch Unterlagen, wer ist terminbereit, wer ist vorerst raus und wo lohnt sich persönliche Übernahme statt weiterer Automatik?",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#grundlogik", label: "Wann Nachfassen sinnvoll ist" },
  { href: "#situationen", label: "Situationen & Abstände" },
  { href: "#textprinzipien", label: "Textprinzipien" },
  { href: "#stoppsignale", label: "Stoppsignale" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet aktuelle Primärquellen von HubSpot, onOffice, Propstack und FLOWFACT mit Advaics Sicht auf Folgekommunikation im echten Anfrageprozess von Maklerbüros.",
  "Bewertet werden nicht nur Abstände zwischen Nachrichten, sondern auch Threading, automatische Stopps, Dublettenvermeidung und die Frage, wann Follow-up besser manuell als automatisch laufen sollte.",
  "Die Empfehlungen sind bewusst konservativ. Sie sollen Gespräche klären, nicht Kontaktvolumen aufblasen.",
];

const coreLogic = [
  {
    title: "Nachfassen braucht einen offenen nächsten Schritt",
    text: "Eine gute Nachfass-Mail erinnert nicht ins Leere. Sie knüpft an eine offene Entscheidung an: Unterlagen prüfen, Termin auswählen, Rückfrage klären oder den Fall sauber schließen.",
  },
  {
    title: "Der bestehende Verlauf ist oft der beste Kontext",
    text: "Wenn die erste Antwort sauber war, sollte Nachfassen möglichst im gleichen Gesprächsverlauf bleiben. Das spart Sucharbeit auf Empfängerseite und reduziert Missverständnisse.",
  },
  {
    title: "Stoppsignale sind Teil der Logik, nicht Sonderfälle",
    text: "Antwort, Terminbuchung, Abwesenheitsnotiz, Rückläufer oder Risikoindikatoren müssen Folgekommunikation stoppen oder neu bewerten, bevor eine weitere Mail herausgeht.",
  },
  {
    title: "Nicht jeder offene Fall gehört in dieselbe Taktung",
    text: "Exposé versendet, Besichtigung offen oder Daten unvollständig sind unterschiedliche Situationen. Wer sie gleich behandelt, wirkt schnell unscharf oder aufdringlich.",
  },
];

const situationRows = [
  {
    situation: "Exposé gesendet, keine Rückmeldung",
    timing: "Nach 2 Werktagen",
    goal: "Interesse einordnen und einen klaren nächsten Schritt anbieten",
    stop: "Antwort, Terminwunsch, Abwesenheitsnotiz oder bereits geschlossener Fall",
  },
  {
    situation: "Besichtigung vorgeschlagen, aber nicht bestätigt",
    timing: "Nach 1 bis 2 Werktagen",
    goal: "Terminvorschlag konkret machen oder alternative Zeitfenster einsammeln",
    stop: "Bestätigter Termin, Absage oder Wechsel in persönliche Abstimmung",
  },
  {
    situation: "Rückfrage des Interessenten blieb offen",
    timing: "Sobald die fehlende Information intern geklärt ist",
    goal: "Antwort liefern, nicht nur erinnern",
    stop: "Neue Unsicherheit, fehlende Freigabe oder veralteter Sachstand",
  },
  {
    situation: "Unvollständige Portalanfrage",
    timing: "Nur nach klarer Daten- oder Erreichbarkeitsprüfung",
    goal: "Kontakt vervollständigen und erst dann den eigentlichen Pfad fortsetzen",
    stop: "Dublettenhinweis, fehlende Bestätigung oder ausgeschlossene Adresse",
  },
  {
    situation: "Schon zwei offene Nachfassstufen ohne Reaktion",
    timing: "Danach nicht weiter automatisch",
    goal: "Fall bewusst beenden oder manuell neu bewerten",
    stop: "Ab diesem Punkt ist der Stopp selbst die saubere Entscheidung",
  },
];

const messagePrinciples = [
  {
    title: "Eine klare Frage oder Einladung pro Nachricht",
    text: "Mehrere Handlungsaufforderungen in einer Mail verwässern die Antwortwahrscheinlichkeit. Gute Nachfassungen machen den nächsten Schritt leicht und eindeutig.",
  },
  {
    title: "Bezug auf den bisherigen Verlauf",
    text: "Wer an eine frühere Nachricht anknüpft, sollte das sichtbar tun. So versteht der Interessent sofort, worum es geht und warum die Nachricht jetzt sinnvoll ist.",
  },
  {
    title: "Hilfreich bleiben statt Druck aufzubauen",
    text: "Makler-Follow-ups sollten Orientierung geben, nicht künstliche Dringlichkeit erzeugen. Gerade bei Standardanfragen wirkt ruhige Nützlichkeit stärker als Verkaufsrhetorik.",
  },
  {
    title: "Unklare Fälle lieber anhalten",
    text: "Wenn Objekt, Verfügbarkeit oder Zuständigkeit offen sind, ist eine weitere Standardmail fast immer schwächer als kurzes internes Klären und bewusste Freigabe.",
  },
];

const stopSignals = [
  {
    title: "Antworten und Terminbuchungen",
    text: "Sobald der Interessent reagiert oder einen Termin bucht, sollte der bisherige Nachfasspfad enden. Danach gilt wieder der konkrete Fall statt der Sequenzlogik.",
  },
  {
    title: "Abwesenheit, Rückläufer und Zustellprobleme",
    text: "Abwesenheitsnotizen dürfen nicht blind als normales Schweigen behandelt werden, und Bounces zeigen meist ein Zustellproblem statt fehlendes Interesse.",
  },
  {
    title: "Kontextwechsel im Objekt oder im Team",
    text: "Veränderte Verfügbarkeit, neue Zuständigkeit oder Konfliktsignale im Vorgang machen aus einem Standard-Follow-up schnell eine manuelle Entscheidung.",
  },
];

const metrics = [
  "Antwortquote nach der ersten Nachfass-Mail",
  "Anteil Folgekommunikation, der durch Antwort oder Termin korrekt stoppt",
  "Quote manuell übernommener Fälle nach offener zweiter Stufe",
  "Zeit bis zum geklärten nächsten Schritt statt nur bis zur nächsten Antwort",
  "Anteil technischer oder inhaltlicher Stoppsignale vor dem nächsten Versand",
];

const advaicFit = [
  "Ihr Team beantwortet viele ähnliche Immobilienanfragen, aber das Nachfassen läuft noch uneinheitlich oder hängt zu stark am Bauchgefühl einzelner Personen.",
  "Sie wollen Folgekommunikation nur dort automatisieren, wo Kontext, Stoppsignale und Qualitätsprüfung zusammenpassen.",
  "Sie suchen keinen generischen Vertriebs-Drip, sondern einen verlässlichen Nachfasspfad für echte Makleranfragen.",
];

const advaicNotFit = [
  "Die Erstantwort ist noch so unklar oder langsam, dass Nachfassen das eigentliche Problem nur überdeckt.",
  "Fast jeder Fall ist verhandlungsnah, konfliktbeladen oder objektseitig so individuell, dass standardisierte Folgelogik kaum hilft.",
  "Sie möchten vor allem breit gestreute Marketing-Sequenzen statt prozessnahe Folgekommunikation für konkrete Anfragen.",
];

const faqItems = [
  {
    question: "Wann ist eine Nachfass-Mail bei Immobilienanfragen sinnvoll?",
    answer:
      "Dann, wenn ein echter nächster Schritt offen ist und der bisherige Verlauf für den Interessenten nachvollziehbar bleibt. Ohne offenen Kontext wirkt Nachfassen schnell wie Serienversand.",
  },
  {
    question: "Wie viele Nachfassstufen sind für Maklerbüros sinnvoll?",
    answer:
      "Für einen sauberen Start reichen meist ein bis zwei Stufen. Danach sollte eher bewusst gestoppt oder manuell bewertet werden, statt die Kontaktfrequenz weiter zu erhöhen.",
  },
  {
    question: "Soll Nachfassen im gleichen E-Mail-Verlauf bleiben?",
    answer:
      "Oft ja, solange der bestehende Verlauf sauber ist. Threading hilft, weil der Interessent den bisherigen Kontext direkt sieht und nicht mehrere lose Nachrichten zusammensuchen muss.",
  },
  {
    question: "Wann sollte Nachfassen sofort stoppen?",
    answer:
      "Bei Antwort, Terminbuchung, Abwesenheitsnotiz, Rückläufer, unklarem Objektstatus oder immer dann, wenn der Fall inhaltlich nicht mehr in die Standardlogik passt.",
  },
];

const sources = [
  {
    label: "HubSpot: Create and edit sequences",
    href: "https://knowledge.hubspot.com/sequences/create-and-edit-sequences",
    note: "Offizielle Dokumentation zu Sequenzschritten, Verzögerungen in Werktagen und Threading-Optionen.",
  },
  {
    label: "HubSpot: Unenroll contacts from a sequence",
    href: "https://knowledge.hubspot.com/sequences/unenroll-from-sequence",
    note: "Offizielle Quelle zu automatischen Stoppsignalen wie Antwort, Terminbuchung, Bounce und Abmeldung.",
  },
  {
    label: "HubSpot: Create an email thread with your sequence",
    href: "https://knowledge.hubspot.com/de/sequences/create-an-email-thread-with-your-sequence",
    note: "Offizielle Dokumentation dazu, wie Folgekommunikation als Antwort im bestehenden Verlauf statt in neuen Threads laufen kann.",
  },
  {
    label: "onOffice Hilfe: Anfragenmanager einrichten",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/anfragenmanager-einrichten/",
    note: "Offizielle Hilfe zur Anfrageverarbeitung, Dublettenprüfung und dem Stoppen weiterer Nachfragen bei bereits laufender Klärung.",
  },
  {
    label: "Propstack: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Offizielle Hilfe zur strukturierten Auswertung und Einordnung eingehender Anfragen.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Produktseite zu automatischer Anfrageverarbeitung, Übersicht offener Kontakte und Absageprozessen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Immobilienanfragen nachfassen 2026",
  ogTitle: "Immobilienanfragen nachfassen 2026 | Advaic",
  description:
    "Leitfaden für Makler: Wie Immobilienanfragen sinnvoll nachgefasst werden, wann Follow-ups stoppen müssen und welche Abstände im Alltag tragfähig sind.",
  path: "/immobilienanfragen-nachfassen",
  template: "guide",
  eyebrow: "Immobilienanfragen nachfassen",
  proof: "Gutes Nachfassen bleibt im Kontext, bietet einen klaren nächsten Schritt und stoppt konsequent bei Antwort oder Termin.",
});

export default function ImmobilienanfragenNachfassenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Immobilienanfragen nachfassen 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-14",
        mainEntityOfPage: `${siteUrl}/immobilienanfragen-nachfassen`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Immobilienanfragen", "Nachfassen", "Follow-up", "Immobilienmakler"],
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
        { name: "Immobilienanfragen nachfassen", path: "/immobilienanfragen-nachfassen" },
      ]}
      schema={schema}
      kicker="Immobilienanfragen nachfassen"
      title="Wie Makler Immobilienanfragen sinnvoll nachfassen"
      description="Sauberes Nachfassen ist eine Prozessfrage, keine reine Taktungsfrage. Gute Follow-ups hängen an einem klaren Verlauf, eindeutigen Stoppsignalen und echten offenen nächsten Schritten."
      actions={
        <>
          <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
            Follow-up-E-Mails
          </Link>
          <Link href="/signup?entry=immobilienanfragen-nachfassen" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu Situationen oder Stoppsignalen springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#situationen" className="btn-secondary w-full justify-center">
              Situationen
            </MarketingJumpLink>
            <MarketingJumpLink href="#stoppsignale" className="btn-secondary w-full justify-center">
              Stoppsignale
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="immobilienanfragen-nachfassen"
      primaryHref="/signup?entry=immobilienanfragen-nachfassen-stage"
      primaryLabel="Mit echten Anfragen prüfen"
      secondaryHref="/anfragenmanagement-immobilienmakler"
      secondaryLabel="Anfragenmanagement"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung zu Werktagsabständen, Threading, Stoppsignalen und der technischen Behandlung offener Anfragefälle. Für den Betrieb zählen zusätzlich Ihre realen Antwortquoten und manuellen Übernahmen."
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
                Produkt- und Prozessteam mit Fokus auf Antwortlogik, Folgekommunikation und kontrollierte
                Übergänge zwischen Automatik, Freigabe und manueller Bearbeitung.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie diese Seite Nachfassen bewertet</h2>
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

      <section id="grundlogik" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wann Nachfassen bei Immobilienanfragen wirklich sinnvoll ist</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Nachfasslogik ist kein Ersatz für eine schwache Erstantwort. Sie ist die präzise Fortsetzung eines
              bereits geöffneten Gesprächs.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {coreLogic.map((item) => (
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
            <h2 className="h2">Welche offenen Situationen welches Nachfassen tragen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Entscheidend ist nicht nur der Abstand, sondern die Art des offenen Falls und das saubere Ende des
              jeweiligen Pfads.
            </p>
          </div>

          <ResponsiveComparisonTable
            rows={situationRows}
            rowKey={(item) => item.situation}
            columns={[
              { key: "situation", label: "Situation", emphasize: true },
              { key: "timing", label: "Sinnvoller Abstand" },
              { key: "goal", label: "Ziel" },
              { key: "stop", label: "Stoppsignal" },
            ]}
          />
        </Container>
      </section>

      <section id="textprinzipien" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <h2 className="h2">Was gute Nachfass-Mails von hektischer Folgekommunikation trennt</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {messagePrinciples.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="stoppsignale" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Stoppsignale, die nicht ignoriert werden dürfen</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stopSignals.map((item) => (
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
              <h2 className="h3">Kennzahlen für belastbares Nachfassen</h2>
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
              <h2 className="h3 mt-3">Nachfassen lebt vom Prozess davor</h2>
              <p className="helper mt-3">
                Wenn Antwortzeit, Qualifizierung oder Priorisierung unscharf bleiben, wird auch gutes Follow-up nie ganz
                ruhig laufen.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
                  Follow-up-E-Mails
                </Link>
                <Link href="/immobilienscout-anfragen-nachfassen" className="btn-secondary">
                  ImmoScout nachfassen
                </Link>
                <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
                  Anfragenmanagement
                </Link>
                <Link href="/antwortzeit-immobilienanfragen" className="btn-secondary">
                  Antwortzeit
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
              <h2 className="h3 mt-3">Wenn Follow-up prozessnah statt sequenzgetrieben laufen soll</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
                  Follow-up-E-Mails
                </Link>
                <Link href="/immobilienscout-anfragen-nachfassen" className="btn-secondary">
                  ImmoScout nachfassen
                </Link>
                <Link href="/anfragenqualifizierung-immobilienmakler" className="btn-secondary">
                  Anfragenqualifizierung
                </Link>
                <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                  Anfragen priorisieren
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn Nachfassen nur ein Symptom verdecken würde</h2>
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
