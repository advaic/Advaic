import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import ManualVsAdvaicComparison from "@/components/marketing/ManualVsAdvaicComparison";
import ProcessFlowComparison from "@/components/marketing/ProcessFlowComparison";
import SafeStartConfigurator from "@/components/marketing/SafeStartConfigurator";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "Manuelle Anfragebearbeitung ist nicht grundsätzlich falsch. Für wenige, stark individuelle Fälle bleibt sie oft der sauberste Weg.",
  "Sobald aber Anfragevolumen, Reaktionsdruck und Nachfassen gleichzeitig steigen, wird reine Handarbeit schnell uneinheitlich und schwer steuerbar.",
  "Advaic ersetzt nicht jeden manuellen Schritt, sondern entlastet vor allem klar prüfbare Standardfälle und hält Ausnahmen bewusst in der Freigabe.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#wann-manuell", label: "Wann manuell sinnvoll bleibt" },
  { href: "#vergleich", label: "Direkter Vergleich" },
  { href: "#prozessvergleich", label: "Prozessdarstellung" },
  { href: "#kippunkte", label: "Wo Handarbeit kippt" },
  { href: "#safe-start-konfiguration", label: "Sicherer Start" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet Primärquellen zu Antwortgeschwindigkeit, Makler-Postfächern, Anfragenverarbeitung und kontrollierter Automatisierung mit Advaics Sicht auf den operativen Anfrageprozess.",
  "Verglichen wird nicht nur nach Funktionslisten, sondern nach echter Alltagsarbeit: Eingang prüfen, priorisieren, beantworten, nachfassen und Verlauf dokumentieren.",
  "Die interaktiven Modelle auf der Seite sind konservative Planungswerkzeuge. Sie sollen helfen, einen vernünftigen Startkorridor zu definieren, nicht ein Ergebnis zu garantieren.",
];

const manualStillMakesSense = [
  {
    title: "Wenig relevantes Anfragevolumen",
    text: "Wenn nur wenige qualifizierte Anfragen pro Woche eingehen, ist der manuelle Aufwand häufig überschaubar und eine zusätzliche Prozessschicht nicht automatisch nötig.",
  },
  {
    title: "Hoher Anteil an Sonderfällen",
    text: "Wenn fast jede Anfrage individuelle Rückfragen, heikle Abstimmungen oder stark erklärungsbedürftige Objekte betrifft, sollte der Mensch weiterhin der Hauptpfad bleiben.",
  },
  {
    title: "Datenbasis und Zuständigkeiten sind noch unsauber",
    text: "Wenn Objektbezug, Verantwortlichkeiten oder Freigaberegeln noch ungeklärt sind, löst Automatisierung das Grundproblem nicht. Dann braucht das Team zuerst klare Abläufe.",
  },
  {
    title: "Es gibt niemanden für Freigabe und Nachsteuerung",
    text: "Kontrollierte Automatisierung funktioniert nur dann gut, wenn Regeln gepflegt, Freigaben geprüft und Korrekturgründe ernst genommen werden.",
  },
];

const pressurePoints = [
  {
    title: "Mehrere Kanäle zur gleichen Zeit",
    text: "Portale, Website, E-Mail und Rückfragen erzeugen schnell parallele Eingänge. Ohne klare Logik wird das Postfach zum Engpass.",
  },
  {
    title: "Viele wiederkehrende Erstantworten",
    text: "Standardfragen zu Verfügbarkeit, Unterlagen, Besichtigung oder nächstem Schritt binden im manuellen Betrieb täglich Zeit, obwohl sie inhaltlich ähnlich sind.",
  },
  {
    title: "Uneinheitliches Nachfassen",
    text: "Wenn Nachfass-E-Mails nur nach Bauchgefühl versendet werden, sinkt die Verlässlichkeit. Manche Fälle bekommen zu viel Aufmerksamkeit, andere gar keine.",
  },
  {
    title: "Lücken im Verlauf",
    text: "Sobald mehrere Personen beteiligt sind, wird ohne saubere Dokumentation unklar, was bereits geantwortet, geprüft oder bewusst gestoppt wurde.",
  },
];

const advaicFit = [
  "Ihr Team bearbeitet viele ähnliche Erstantworten, möchte aber riskante oder unklare Fälle bewusst manuell behalten.",
  "Sie wollen Reaktionszeit und Konsistenz verbessern, ohne den gesamten Anfrageprozess blind auf Vollautomatik zu stellen.",
  "Sie brauchen nachvollziehbare Freigabepfade und eine klarere Dokumentation, weil manuelle Bearbeitung im Tagesgeschäft zu unübersichtlich wird.",
];

const advaicNotFit = [
  "Ihr Büro hat nur sehr wenig relevantes Anfragevolumen oder fast ausschließlich Sonderfälle.",
  "Sie suchen vor allem ein System für Kontakte, Objekte und Zuständigkeiten. Dann ist zuerst ein CRM oder saubere Prozessgrundlage wichtiger.",
  "Niemand im Team kann Regeln, Freigaben und Ausnahmefälle verlässlich betreuen. Dann ist auch ein vorsichtiger Start zu früh.",
];

const faqItems = [
  {
    question: "Ist manuelle Anfragebearbeitung grundsätzlich schlechter als Advaic?",
    answer:
      "Nein. Für wenige, stark individuelle oder heikle Fälle ist manuelle Bearbeitung oft die richtige Wahl. Der Vorteil von Advaic entsteht vor allem dort, wo wiederkehrende Standardfälle sauber erkennbar sind und der manuelle Prozess unter Volumen oder Zeitdruck instabil wird.",
  },
  {
    question: "Welche Fälle sollten bewusst manuell bleiben?",
    answer:
      "Beschwerden, Konflikte, Preisverhandlungen, unklare Zuständigkeiten, fehlende Kerndaten oder sensible Sonderfälle sollten in der Regel nicht automatisch versendet werden. Genau dafür braucht es Freigabe- und Stopplogik.",
  },
  {
    question: "Muss Advaic von Anfang an vollautomatisch laufen?",
    answer:
      "Nein. Ein sauberer Start ist meist bewusst eng. Typisch ist ein kleiner Korridor für klar prüfbare Erstantworten, während der Rest zunächst in der Freigabe bleibt und erst später erweitert wird.",
  },
  {
    question: "Kann Advaic parallel zu CRM und manuellen Abläufen genutzt werden?",
    answer:
      "Ja. In vielen Maklerbüros ist genau diese Kombination sinnvoll: CRM für Datenbasis und Historie, Advaic für den operativen Anfragefluss und manuelle Bearbeitung für Sonderfälle, Eskalationen oder individuelle Beratung.",
  },
];

const sources = [
  {
    label: "Harvard Business Review: The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Grundlage für die Einordnung, warum Reaktionsgeschwindigkeit im Anfrageprozess wirtschaftlich relevant ist.",
  },
  {
    label: "onOffice Enterprise Hilfe: Anfragenmanager einrichten",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/anfragenmanager-einrichten/",
    note: "Offizielle Hilfeseite zur Strukturierung und Einrichtung eines Makler-Anfragenmanagers.",
  },
  {
    label: "onOffice Enterprise Hilfe: Einstellungen im Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Offizielle Quelle zur operativen Steuerung, Priorisierung und Bearbeitungslogik im Anfrageeingang.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite zur automatisierten Bearbeitung eingehender Portalanfragen im Maklerkontext.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Offizielle Hilfeseite zur Interpretation und operativen Einordnung von Anfragen im Makleralltag.",
  },
  {
    label: "HubSpot Knowledge Base: Create and edit sequences",
    href: "https://knowledge.hubspot.com/sequences/create-and-edit-sequences",
    note: "Offizielle Quelle für sauberes, regelbasiertes Nachfassen statt rein manueller Einzelsteuerung.",
  },
  {
    label: "NIST: AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte Automatisierung mit klaren Grenzen, Nachvollziehbarkeit und Risikobewusstsein.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Manuell vs. Advaic 2026: Wann Handarbeit reicht und wann Automatisierung sinnvoller ist",
  ogTitle: "Manuell vs. Advaic 2026 | Advaic",
  description:
    "Vergleich für Makler: Wo reine manuelle Anfragebearbeitung sinnvoll bleibt, wo sie kippt und wie Advaic mit Freigabe, Qualitätsprüfung und Nachfassen entlasten kann.",
  path: "/manuell-vs-advaic",
  template: "compare",
  eyebrow: "Manuell vs. Advaic",
  proof: "Vergleich zwischen reiner Handarbeit und kontrollierter Anfrageautomation mit Fokus auf Zeit, Risiko und Nachvollziehbarkeit.",
});

export default function ManualVsAdvaicPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Manuell vs. Advaic 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/manuell-vs-advaic`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Makler", "Anfragenmanagement", "manuelle Bearbeitung", "Automatisierung", "Freigabe"],
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
        { name: "Manuell vs. Advaic", path: "/manuell-vs-advaic" },
      ]}
      schema={schema}
      kicker="Manuell vs. Advaic"
      title="Manuell vs. Advaic: Wann reine Handarbeit reicht und wann kontrollierte Automatisierung sinnvoller wird"
      description="Die relevante Frage ist nicht, ob alles automatisiert werden kann. Die relevante Frage ist, welche Anfragen bewusst manuell bleiben sollten und wo kontrollierte Automatisierung den Makleralltag tatsächlich entlastet."
      actions={
        <>
          <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
            Anfragenmanagement
          </Link>
          <Link href="/signup?entry=manuell-vs-advaic" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt in den Vergleich oder zur Startempfehlung springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#vergleich" className="btn-secondary w-full justify-center">
              Vergleich
            </MarketingJumpLink>
            <MarketingJumpLink href="#safe-start-konfiguration" className="btn-secondary w-full justify-center">
              Sicherer Start
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="entscheidung"
      stageContext="manuell-vs-advaic"
      primaryHref="/signup?entry=manuell-vs-advaic-stage"
      primaryLabel="Mit echten Fällen testen"
      secondaryHref="/roi-rechner"
      secondaryLabel="ROI berechnen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Antwortgeschwindigkeit, Makler-Anfrageprozessen und kontrollierter Automatisierung. Für die konkrete Entscheidung sollten Sie immer eigene Anfrageverläufe, Freigabegründe und Ihr bestehendes Systemsetup mitprüfen."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Antwortlogik, Freigabe und saubere
                Arbeitsteilung zwischen Handarbeit und Automatisierung im Makleralltag.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie dieser Vergleich zu lesen ist</h2>
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

      <section id="wann-manuell" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wann manuelle Bearbeitung völlig sinnvoll bleiben kann</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Eine gute Vergleichsseite muss auch klar benennen, wann zusätzliche Automatisierung keinen echten Mehrwert
              bringt. Genau diese Fälle sollten Maklerbüros vor jeder Einführung sauber prüfen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {manualStillMakesSense.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <ManualVsAdvaicComparison id="vergleich" />

      <ProcessFlowComparison />

      <section id="kippunkte" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wo reine Handarbeit im Makleralltag typischerweise kippt</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Problematisch wird manuelle Bearbeitung selten wegen eines einzelnen Schritts. Der Engpass entsteht meist
              dann, wenn mehrere kleine Aufgaben gleichzeitig unter Zeitdruck sauber erledigt werden müssen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pressurePoints.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <SafeStartConfigurator />

      <section id="advaic" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn Sie Entlastung wollen, ohne die Kontrolle abzugeben</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/antwortzeit-immobilienanfragen" className="btn-secondary">
                  Antwortzeit
                </Link>
                <Link href="/email-automatisierung-immobilienmakler" className="btn-secondary">
                  E-Mail-Automatisierung
                </Link>
                <Link href="/crm-fuer-immobilienmakler" className="btn-secondary">
                  CRM-Vergleich
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn die Grundlagen noch nicht stehen</h2>
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

      <section id="faq" className="marketing-soft-cool py-20 md:py-28">
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
