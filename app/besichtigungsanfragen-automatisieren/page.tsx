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
  "Besichtigungsanfragen sollten nicht direkt aus der ersten Kontaktaufnahme heraus automatisiert werden. Der stärkste Hebel entsteht, wenn erst sauber qualifiziert und dann kontrolliert terminiert wird.",
  "Gute Automatisierung im Besichtigungspfad spart nicht nur Terminabstimmung. Sie reduziert No-Shows, hält alle Beteiligten im gleichen Status und verhindert unnötiges Hinterhertelefonieren.",
  "Der häufigste Fehler ist, Termine zu früh freizugeben oder zu unstrukturiert zu koordinieren. Dadurch verlieren Teams Übersicht, und Interessenten bekommen widersprüchliche Signale.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#worum-es-geht", label: "Worum es geht" },
  { href: "#voraussetzungen", label: "Voraussetzungen" },
  { href: "#modelle", label: "Terminmodelle" },
  { href: "#ablauf", label: "Ablauf" },
  { href: "#grenzen", label: "Grenzen" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite bündelt aktuelle Primärquellen von onOffice, IMMOinstant und Propstack mit Advaics Sicht auf den Übergang von qualifizierter Anfrage zu konkretem Besichtigungspfad.",
  "Bewertet wird nicht nur die Terminbuchung selbst, sondern der gesamte Ablauf davor und danach: Qualifizierung, Slot-Logik, Bestätigung, Erinnerung, Änderung, Nachbereitung und weiterer Kontakt.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist nicht, jeden Termin blind zu automatisieren, sondern den Pfad zwischen Interesse und Besichtigung belastbar zu machen.",
];

const whyItMatters = [
  {
    title: "Besichtigungen binden viel Koordinationszeit",
    text: "Sobald mehrere Interessenten, Termine, Rückfragen und Absagen zusammenkommen, wird die Besichtigungsorganisation schnell zum operativen Engpass.",
  },
  {
    title: "Nicht jede Anfrage ist sofort terminreif",
    text: "Ohne vorgelagerte Qualifizierung führt Automatisierung oft nur dazu, dass zu viele falsche oder unreife Fälle früh im Terminprozess landen.",
  },
  {
    title: "Der Nutzen liegt auch nach der Terminvergabe",
    text: "Bestätigung, Erinnerung, Aktualisierung und Nachbereitung sind genauso wichtig wie der erste Vorschlag. Genau dort entsteht oft der größte Zeitgewinn.",
  },
  {
    title: "Besichtigungspfad ist Vertrauensarbeit",
    text: "Widersprüchliche Mails, doppelte Zusagen oder fehlende Erinnerungen wirken schnell unprofessionell. Deshalb braucht die Terminlogik klare Regeln statt lose Handarbeit.",
  },
];

const prerequisites = [
  "Anfragen sind vor der Terminlogik bereits sauber qualifiziert",
  "Objekt, Ansprechpartner, Verfügbarkeit und Terminmodell sind klar im führenden System hinterlegt",
  "Das Team weiß, welche Termine automatisiert vorgeschlagen werden dürfen und welche individuell freigegeben bleiben",
  "Erinnerungen, Änderungen, Absagen und Nachbereitung haben einen festen Folgepfad",
];

const schedulingModels = [
  {
    model: "Individueller Vorschlag",
    bestFor: "Wenige hochwertige Anfragen oder beratungsintensive Objekte",
    automation: "Standardisierte Einladung, Bestätigung und Erinnerung",
    boundary: "Terminauswahl bleibt individuell beim Team",
  },
  {
    model: "Zeitfenster oder Slot-Auswahl",
    bestFor: "Gut planbare Besichtigungen mit regelmäßigem Volumen",
    automation: "Vorschlag, Bestätigung, Erinnerung und Statuspflege",
    boundary: "Nur für sauber qualifizierte und terminreife Fälle freigeben",
  },
  {
    model: "Massentermine",
    bestFor: "Hohe Nachfrage auf einzelne Objekte oder Vermietungsphasen",
    automation: "Gebündelte Kommunikation, Reminder und geordnete Teilnehmerlogik",
    boundary: "Zugang und Teilnehmerzahl müssen sauber gesteuert werden",
  },
];

const processSteps = [
  {
    title: "1. Anfrage qualifizieren",
    text: "Besichtigung ist kein Startpunkt. Erst wenn Reifegrad, Objektbezug und nächster Schritt klar sind, sollte die Terminlogik beginnen.",
  },
  {
    title: "2. Passendes Terminmodell wählen",
    text: "Je nach Objekt, Nachfrage und Teamgröße passt Einzelvorschlag, Slot-Buchung oder Massentermin. Nicht jedes Modell passt zu jedem Büro.",
  },
  {
    title: "3. Einladung und Bestätigung sauber versenden",
    text: "Die Einladung sollte klar zeigen, was bestätigt ist, was mitgebracht werden soll und wie Änderungen oder Absagen laufen.",
  },
  {
    title: "4. Erinnerungen und Änderungen steuern",
    text: "Gerade kurz vor dem Termin entscheidet saubere Kommunikation über No-Show-Quote, Rückfragen und operative Ruhe.",
  },
  {
    title: "5. Nachbereitung anschließen",
    text: "Nach der Besichtigung sollte direkt klar sein, ob Nachfassen, weitere Qualifizierung oder Abschlussvorbereitung folgt.",
  },
];

const boundaries = [
  {
    title: "Gut automatisierbar",
    text: "Bestätigung, Reminder, Standardinformationen vor dem Termin und strukturierte Nachbereitung bei klaren Standardfällen.",
  },
  {
    title: "Nur mit sauberer Freigabe",
    text: "Sonderwünsche, Terminänderungen mit mehreren Beteiligten, heikle Rückfragen oder unsaubere Zuständigkeiten.",
  },
  {
    title: "Bewusst manuell",
    text: "Beschwerden, Konflikte, hochindividuelle Premium-Objekte oder Fälle, in denen Beratung und Beziehungsarbeit klar vor Standardisierung stehen.",
  },
];

const metrics = [
  "Quote qualifizierter Anfragen, die in den Besichtigungspfad übergehen",
  "Zeit vom Besichtigungswunsch bis zur bestätigten Terminrückmeldung",
  "No-Show-Quote nach Bestätigung und Erinnerung",
  "Anteil manuell nachkorrigierter Termine oder widersprüchlicher Zusagen",
  "Anteil Termine, die direkt in den Nachfass- oder Abschlussprozess übergehen",
  "Median-Zeit für Änderungen oder Absagen im laufenden Terminprozess",
];

const faqItems = [
  {
    question: "Sollte man Besichtigungen direkt aus der ersten Anfrage heraus automatisieren?",
    answer:
      "Meist nicht. Erst wenn die Anfrage qualifiziert und der nächste Schritt klar ist. Sonst landen zu viele unreife oder unpassende Fälle zu früh im Terminprozess.",
  },
  {
    question: "Was ist der größte Hebel in der Terminlogik?",
    answer:
      "Nicht nur die Slot-Buchung selbst, sondern die saubere Kette aus Einladung, Bestätigung, Erinnerung, Änderung und Nachbereitung.",
  },
  {
    question: "Wann sind Massentermine sinnvoll?",
    answer:
      "Vor allem bei hohem Nachfragevolumen auf einzelne Objekte oder Vermietungssituationen, in denen gebündelte Besichtigungen operativ sinnvoller sind als reine Einzeltermine.",
  },
  {
    question: "Wann sollte der Besichtigungspfad bewusst manuell bleiben?",
    answer:
      "Bei Beschwerden, Konflikten, Sonderwünschen, Premium-Objekten oder immer dann, wenn die persönliche Abstimmung operativ wichtiger ist als Standardisierung.",
  },
];

const sources = [
  {
    label: "Propstack Hilfe: Massentermine",
    href: "https://support.propstack.de/hc/de/articles/18360837861021-Massentermine",
    note: "Offizielle Hilfeseite zur gebündelten Terminorganisation und operativen Besichtigungslogik.",
  },
  {
    label: "onOffice Marketplace: IMMOinstant Terminbuchungstool",
    href: "https://marketplace.onoffice.de/plugins/immoinstant-terminbuchungstool",
    note: "Offizielle Produktseite zur digitalen Terminbuchung, Bestätigung und Erinnerung im Maklerkontext.",
  },
  {
    label: "onOffice Enterprise Hilfe: Zeitfenster für Termine definieren",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/zeitfenster-fuer-termine-definieren/",
    note: "Offizielle Quelle zur Steuerung von Terminlogik und verfügbaren Zeitfenstern.",
  },
  {
    label: "onOffice Enterprise Hilfe: Interessenten - Von Abgesagt bis Vertrag",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/reiter-interessenten-von-abgesagt-bis-vertrag/",
    note: "Offizielle Einordnung des Übergangs von Interesse über Besichtigung bis in spätere Prozessstufen.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite zur systematischen Weiterverarbeitung eingehender Anfragen als Grundlage für den Terminpfad.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Besichtigungsanfragen automatisieren 2026: Von der Anfrage bis zum bestätigten Termin",
  ogTitle: "Besichtigungsanfragen automatisieren 2026 | Advaic",
  description:
    "Leitfaden für Makler: Wie Besichtigungsanfragen nach sauberer Qualifizierung, passendem Terminmodell und klarer Nachbereitung automatisiert werden können.",
  path: "/besichtigungsanfragen-automatisieren",
  template: "guide",
  eyebrow: "Besichtigungsanfragen",
  proof:
    "Gute Terminautomation beginnt nicht bei der Slot-Buchung, sondern bei sauberer Qualifizierung, klaren Terminmodellen und verlässlicher Nachbereitung.",
});

export default function BesichtigungsanfragenAutomatisierenPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Besichtigungsanfragen automatisieren 2026",
        inLanguage: "de-DE",
        dateModified: "2026-04-10",
        mainEntityOfPage: `${siteUrl}/besichtigungsanfragen-automatisieren`,
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Besichtigungsanfragen", "Terminlogik", "Immobilienmakler", "Automation"],
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
        { name: "Besichtigungsanfragen automatisieren", path: "/besichtigungsanfragen-automatisieren" },
      ]}
      schema={schema}
      kicker="Besichtigungsanfragen"
      title="Wie Makler Besichtigungsanfragen kontrolliert automatisieren können"
      description="Besichtigungslogik beginnt nicht beim Kalender, sondern bei sauber qualifizierten Anfragen. Erst dann tragen Terminmodelle, Bestätigungen, Reminder und Nachbereitung wirklich."
      actions={
        <>
          <Link href="/anfragenqualifizierung-immobilienmakler" className="btn-secondary">
            Anfragenqualifizierung
          </Link>
          <Link href="/signup?entry=besichtigungsanfragen-automatisieren" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu Terminmodellen oder zum Ablauf springen.</p>
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
      stageContext="besichtigungsanfragen-automatisieren"
      primaryHref="/signup?entry=besichtigungsanfragen-automatisieren-stage"
      primaryLabel="Mit echten Terminpfaden testen"
      secondaryHref="/follow-up-emails-immobilienmakler"
      secondaryLabel="Nachfassen verstehen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Terminlogik, Zeitfenstern, Massenterminen und dem Übergang von Anfrage zu Besichtigung. Für die konkrete Umsetzung sollten Sie immer Ihr Objektportfolio und Ihr Teammodell mitprüfen."
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
                Produkt- und Prozessteam mit Fokus auf Anfragenqualifizierung, Terminpfade, Reminder-Logik und
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
            <h2 className="h2">Worum es bei automatisierten Besichtigungsanfragen wirklich geht</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Wer nur an einen Kalender-Link denkt, unterschätzt den eigentlichen Prozess. Terminlogik beginnt bei
              der richtigen Auswahl von Fällen und endet erst nach Bestätigung, Änderung oder Nachbereitung.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {whyItMatters.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="voraussetzungen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Welche Voraussetzungen vor der Terminautomatisierung stehen sollten</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {prerequisites.map((item) => (
                  <article key={item} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="card-base p-6">
              <p className="label">Merksatz</p>
              <h2 className="h3 mt-3">Ohne Qualifizierung wird Terminlogik hektisch</h2>
              <p className="helper mt-3">
                Ein schneller Besichtigungsvorschlag hilft nicht, wenn der Fall fachlich noch gar nicht terminreif ist.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="modelle" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welches Terminmodell zu welchem Bürotyp passt</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Automatisierung wählt nicht ein Lieblingsmodell, sondern das passende Modell für Objektart,
              Nachfrage und Teamstruktur.
            </p>
          </div>

          <ResponsiveComparisonTable
            columns={[
              { key: "model", label: "Terminmodell", emphasize: true },
              { key: "bestFor", label: "Sinnvoll für" },
              { key: "automation", label: "Gut automatisierbar" },
              { key: "boundary", label: "Worauf achten" },
            ]}
            rows={schedulingModels}
            rowKey={(row) => row.model}
          />
        </Container>
      </section>

      <section id="ablauf" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Ein sauberer Ablauf von der qualifizierten Anfrage bis zum Termin</h2>
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

      <section id="grenzen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <h2 className="h2">Was sich automatisieren lässt und was bewusst manuell bleiben sollte</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {boundaries.map((item) => (
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
              <h2 className="h3">Kennzahlen für einen belastbaren Besichtigungspfad</h2>
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
              <p className="label">Weiterer Leitfaden</p>
              <h2 className="h3 mt-3">Vor der Besichtigung zählt die Qualifizierung</h2>
              <p className="helper mt-3">
                Wenn zu viele falsche Fälle in Termine laufen, liegt der Engpass meist eine Stufe davor und nicht im
                Kalender selbst.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/anfragenqualifizierung-immobilienmakler" className="btn-secondary">
                  Anfragenqualifizierung
                </Link>
                <Link href="/besichtigungstermine-koordinieren" className="btn-secondary">
                  Termine koordinieren
                </Link>
                <Link href="/massenbesichtigungen-organisieren" className="btn-secondary">
                  Massenbesichtigungen
                </Link>
                <Link href="/no-show-besichtigungen-reduzieren" className="btn-secondary">
                  No-Shows reduzieren
                </Link>
                <Link href="/immobilienscout-anfragen-automatisieren" className="btn-secondary">
                  ImmoScout-Anfragen
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
