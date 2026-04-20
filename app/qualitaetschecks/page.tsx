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
  "Vor dem Versand zählt nicht nur, ob ein Entwurf gut klingt, sondern ob er überhaupt rausgehen darf.",
  "Gute Qualitätsprüfungen stoppen nicht nur riskante Fälle. Sie verhindern auch vorschnelle Zusagen bei unklarem Objektbezug, fehlenden Angaben oder unpassendem Ton.",
  "Der Prüfpfad ist nur dann belastbar, wenn klar ist, welcher Check wofür zuständig ist, was bei einem Fehler passiert und welche Fälle grundsätzlich in die Freigabe müssen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#pruefphasen", label: "Prüfphasen" },
  { href: "#checks", label: "Die sechs Prüfungen" },
  { href: "#stoppfaelle", label: "Wann gestoppt wird" },
  { href: "#kalibrierung", label: "Kalibrierung" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet offizielle Quellen zu Makler-Anfragenmanagement, Portalanfragen und risikobewusster Automatisierung mit Advaics Sicht auf Qualitätsprüfungen vor dem Versand.",
  "Verglichen wird nicht nur nach Begriffen wie Kontrolle oder Sicherheit, sondern nach echtem Ablauf: Relevanz prüfen, Kontext prüfen, Inhalt bewerten, Risiko stoppen und Entscheidung dokumentieren.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist nicht die höchste Versandquote, sondern ein verlässlicher Prüfpfad, der falsche oder voreilige Antworten früh stoppt.",
];

const phases = [
  {
    title: "1. Relevanz prüfen",
    detail: "Zuerst muss klar sein, ob überhaupt eine echte Interessenten-Anfrage vorliegt und keine Rundmail, Systemnachricht oder irrelevante E-Mail.",
  },
  {
    title: "2. Kontext und Inhalt prüfen",
    detail: "Danach wird geprüft, ob Objektbezug, Pflichtangaben, Ton und Lesbarkeit ausreichen, um eine brauchbare Antwort zu tragen.",
  },
  {
    title: "3. Risiko und Freigabe entscheiden",
    detail: "Erst wenn Risiko, Sonderfalllogik und Versandbedingungen sauber bestanden sind, darf die Nachricht automatisch rausgehen.",
  },
];

const checks = [
  {
    title: "Relevanzprüfung",
    purpose: "Verhindert Antworten auf Nicht-Anfragen.",
    blocks: "Newsletter, Spam, Systemmails, irrelevante Rundmails",
    example: "Eine E-Mail mit typischen Rundmail-Signalen oder ohne Interessentenbezug wird nicht in den Antwortpfad gezogen.",
    onFail: "Die Nachricht wird ignoriert oder bewusst aus dem Prozess gehalten.",
  },
  {
    title: "Kontextprüfung",
    purpose: "Sichert, dass nur belegbarer Objekt- und Anfragekontext genutzt wird.",
    blocks: "Antworten ohne klaren Objektbezug oder mit widersprüchlichem Zusammenhang",
    example: "Ohne eindeutig erkennbare Immobilie wird keine Zusage oder Auskunft automatisch verschickt.",
    onFail: "Die Nachricht geht in Rückfrage oder Freigabe statt in den Versand.",
  },
  {
    title: "Vollständigkeitsprüfung",
    purpose: "Verhindert spekulative Aussagen bei fehlenden Kerndaten.",
    blocks: "Antworten mit fehlenden Pflichtinformationen oder unklaren nächsten Schritten",
    example: "Bei einer Verfügbarkeitsfrage ohne saubere Zuordnung wird nicht automatisch bestätigt, dass ein Objekt noch frei ist.",
    onFail: "Versand bleibt blockiert, bis die Lücke geklärt oder bewusst manuell entschieden ist.",
  },
  {
    title: "Ton- und Stilprüfung",
    purpose: "Sichert, dass die Antwort zur Kommunikationslinie des Büros passt.",
    blocks: "Unpassende Tonalität, unnötige Länge oder missverständliche Formulierungen",
    example: "Wenn ein Büro bewusst kurze, klare Antworten bevorzugt, darf kein ausufernder Standardtext automatisch rausgehen.",
    onFail: "Der Entwurf wird überarbeitet oder in die Freigabe geschoben.",
  },
  {
    title: "Risikoprüfung",
    purpose: "Stoppt sensible, konfliktgeladene oder heikle Fälle.",
    blocks: "Beschwerden, Konflikte, Fristen, heikle Zusagen oder riskante Aussagen",
    example: "Eine Konfliktmail oder Beschwerde bleibt grundsätzlich bei der Freigabe und wird nicht automatisch beantwortet.",
    onFail: "Kein Versand. Der Fall landet direkt in einem bewussten Prüfpfad.",
  },
  {
    title: "Lesbarkeitsprüfung",
    purpose: "Sichert klare, umsetzbare und nachvollziehbare Antworten.",
    blocks: "Unstrukturierte Textblöcke, unklare nächste Schritte oder schwer verständliche Formulierungen",
    example: "Eine Antwort soll klar zeigen, was als Nächstes passiert, statt mehrere lose Aussagen ineinander zu schieben.",
    onFail: "Der Entwurf wird angepasst oder manuell geprüft.",
  },
];

const stopCases = [
  {
    title: "Objektbezug nicht sicher",
    text: "Wenn unklar bleibt, auf welches Objekt oder welche Anfrage sich die Nachricht bezieht, sollte kein automatischer Versand erfolgen.",
  },
  {
    title: "Pflichtangaben fehlen",
    text: "Fehlende Kerndaten, unvollständiger Kontext oder unklare Voraussetzungen gehören nicht in einen automatischen Versandpfad.",
  },
  {
    title: "Beschwerde, Konflikt oder Sonderfall",
    text: "Sobald Ton oder Thema eskalationsgefährdet wirken, ist Freigabe der sauberere Weg als jede automatische Reaktion.",
  },
  {
    title: "Prüfungen widersprechen sich",
    text: "Wenn ein Entwurf formal gut klingt, aber Kontext- oder Risikosignale dagegen sprechen, muss der Versand trotzdem gestoppt bleiben.",
  },
];

const calibrationRules = [
  "Zu viele harmlose Fälle in der Freigabe sind kein Qualitätsbeweis, sondern oft ein Zeichen für zu grobe Regeln.",
  "Zu wenige Stopps bei unklaren oder riskanten Fällen sind kein Effizienzgewinn, sondern meist ein Sicherheitsproblem.",
  "Jeder blockierte Entwurf sollte einen klaren Grund tragen, damit Regeln später nachgeschärft werden können.",
  "Wiederkehrende Fehler gehören zuerst in Regeln und Prüflogik, nicht nur in manuelle Nacharbeit.",
];

const metrics = [
  "Anteil blockierter Entwürfe pro Prüftyp",
  "Freigabequote wegen fehlender Angaben oder Risikosignalen",
  "Median-Zeit bis zur Freigabeentscheidung bei gestoppten Fällen",
  "Quote nachträglicher Korrekturen nach manueller Freigabe",
  "Anteil unnötig blockierter Standardfälle",
  "Häufigste Prüfgründe pro Woche",
];

const advaicFit = [
  "Sie möchten automatische Antworten nur dann zulassen, wenn Relevanz, Kontext, Vollständigkeit, Ton und Risiko sauber geprüft sind.",
  "Ihr Team will Sonderfälle früh stoppen, statt sie erst nach einem problematischen Versand einzufangen.",
  "Sie brauchen einen nachvollziehbaren Prüfpfad mit klaren Stopps, Freigaben und wiederkehrenden Prüfgründen.",
];

const advaicNotFit = [
  "Sie erwarten, dass Automatisierung auch bei unklarem Objektbezug oder fehlenden Kerndaten einfach trotzdem sendet.",
  "Es gibt noch keine klare Vorstellung davon, welche Fälle bewusst gestoppt oder manuell entschieden werden sollen.",
  "Sie suchen primär ein allgemeines CRM oder Postfachsystem und nicht zuerst einen belastbaren Prüfpfad vor dem Versand.",
];

const faqItems = [
  {
    question: "Welcher Qualitätscheck ist der wichtigste?",
    answer:
      "Die Risikoprüfung ist oft der sichtbarste Stopp, aber in der Praxis sind Kontext- und Vollständigkeitsprüfung genauso wichtig. Viele problematische Antworten entstehen nicht aus böser Absicht, sondern aus fehlendem Objektbezug oder unklaren Angaben.",
  },
  {
    question: "Reicht ein guter Ton allein für automatischen Versand?",
    answer:
      "Nein. Ein höflicher Entwurf kann trotzdem falsch sein, wenn Objektbezug, Vollständigkeit oder Risiko nicht sauber geklärt sind. Ton ist nur eine von mehreren Pflichtprüfungen.",
  },
  {
    question: "Woran erkennt man schlecht kalibrierte Qualitätsprüfungen?",
    answer:
      "Entweder werden zu viele harmlose Standardfälle blockiert oder zu viele riskante Fälle laufen trotzdem durch. Beide Extreme zeigen, dass die Prüflogik nicht sauber zum Alltag passt.",
  },
  {
    question: "Wann sollte statt eines Versands direkt die Freigabe greifen?",
    answer:
      "Sobald ein Entwurf an fehlenden Angaben, unklarem Kontext, Risikosignalen oder konfliktträchtigen Inhalten hängt. Genau dort ist Freigabe stärker als ein voreiliger Versand.",
  },
];

const sources = [
  {
    label: "onOffice Enterprise Hilfe: Einstellungen im Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Offizielle Quelle zur operativen Steuerung, Priorisierung und Bearbeitung im Makler-Anfragenmanager.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Offizielle Herstellerseite zur strukturierten Bearbeitung eingehender Portalanfragen im Makleralltag.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Offizielle Hilfeseite zur Einordnung verschiedener Anfragearten und ihrer operativen Bedeutung.",
  },
  {
    label: "NIST: AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für risikobewusste, nachvollziehbare und kontrollierte Entscheidungen mit menschlicher Prüfung im Prozess.",
  },
  {
    label: "BSI: IT-Grundschutz",
    href: "https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html",
    note: "Orientierung für robuste technische und organisatorische Schutzmaßnahmen im Betrieb.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Qualitätschecks vor dem Versand 2026: Welche Prüfungen Pflicht sind",
  ogTitle: "Qualitätschecks vor dem Versand 2026 | Advaic",
  description:
    "Leitfaden für Makler: Welche Qualitätsprüfungen eine automatische Antwort vor dem Versand bestehen muss, wann gestoppt wird und woran man gute Kalibrierung erkennt.",
  path: "/qualitaetschecks",
  template: "trust",
  eyebrow: "Leitfaden Qualitätschecks",
  proof: "Vor dem Versand zählen Relevanz, Kontext, Vollständigkeit, Ton, Risiko und Lesbarkeit, nicht nur ein gut formulierter Entwurf.",
});

export default function QualitaetschecksPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Qualitätschecks vor dem Versand 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/qualitaetschecks`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Qualitätschecks", "Freigabe", "Risikoprüfung", "Anfragenmanagement"],
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
        { name: "Qualitätschecks", path: "/qualitaetschecks" },
      ]}
      schema={schema}
      kicker="Leitfaden Qualitätschecks"
      title="Welche Qualitätschecks vor dem Versand wirklich Pflicht sind"
      description="Die relevante Frage lautet nicht, ob ein Entwurf gut klingt. Die relevante Frage lautet, ob die Nachricht nach Relevanz, Kontext, Vollständigkeit, Ton, Risiko und Lesbarkeit überhaupt automatisch rausgehen darf."
      actions={
        <>
          <Link href="/freigabe-inbox" className="btn-secondary">
            Freigabe-Inbox
          </Link>
          <Link href="/signup?entry=qualitaetschecks" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu den Prüfungen oder zu den Stopps springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#checks" className="btn-secondary w-full justify-center">
              Prüfungen
            </MarketingJumpLink>
            <MarketingJumpLink href="#stoppfaelle" className="btn-secondary w-full justify-center">
              Stopps
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="qualitaetschecks"
      primaryHref="/signup?entry=qualitaetschecks-stage"
      primaryLabel="Mit echten Fällen testen"
      secondaryHref="/autopilot-regeln"
      secondaryLabel="Regeln ansehen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Makler-Anfragenmanagement, kontrollierter Automatisierung und risikobewussten Prüfpfaden vor dem Versand. Für die konkrete Umsetzung sollten Sie immer Ihre echten Anfragen und Freigabegründe mitprüfen."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Qualitätsprüfung, Freigaberegeln und
                kontrollierte Versandentscheidungen im Makleralltag.
              </p>
              <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Aktualisiert</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{LAST_UPDATED}</p>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Methodik</p>
              <h2 className="h3 mt-3">Wie dieser Leitfaden zu lesen ist</h2>
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

      <section id="pruefphasen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Prüfphasen vor jedem automatischen Versand</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Ein belastbarer Prüfpfad arbeitet in einer festen Reihenfolge. Erst wenn die frühen Prüfungen sauber
              bestanden sind, lohnt sich die Frage nach Stil, Risiko oder Freigabe überhaupt.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {phases.map((phase) => (
              <article key={phase.title} className="card-base relative overflow-hidden p-6">
                <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.08))]" />
                <h3 className="text-base font-semibold text-[var(--text)]">{phase.title}</h3>
                <p className="helper mt-3">{phase.detail}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="checks" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Die sechs Prüfungen, die vor dem Versand zusammenpassen müssen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Einzelne Prüfungen wirken nur im Zusammenspiel. Ein freundlicher Entwurf ohne Kontext ist genauso
              problematisch wie ein vollständiger Entwurf mit Risikosignalen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {checks.map((check) => (
              <article key={check.title} className="card-base card-hover p-6">
                <h3 className="h3">{check.title}</h3>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Zweck:</strong> {check.purpose}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Blockiert:</strong> {check.blocks}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Beispiel:</strong> {check.example}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  <strong className="text-[var(--text)]">Bei Fehler:</strong> {check.onFail}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="stoppfaelle" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Wann der Versand bewusst gestoppt bleiben muss</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Qualitätsprüfungen stoppen nicht wahllos, sondern genau dort, wo ein Versand mit hoher
              Wahrscheinlichkeit zu unklar, zu riskant oder schlicht falsch wäre.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {stopCases.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="kalibrierung" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Woran man gute Kalibrierung erkennt</h2>
              <p className="helper mt-3">
                Prüflogik ist nur dann nützlich, wenn sie weder zu streng noch zu leichtfertig arbeitet. Genau diese
                Balance muss sichtbar überprüft werden.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {calibrationRules.map((item) => (
                  <article key={item} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{item}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="card-base p-6">
              <p className="label">Warnsignal</p>
              <h2 className="h3 mt-3">Ein gut formulierter Entwurf ist noch kein Freifahrtschein</h2>
              <p className="helper mt-3">
                Wenn gute Sprache fehlenden Kontext oder Risikosignale überdeckt, ist die Prüflogik zu oberflächlich.
                Gerade das sollte ein sauberer Prüfpfad verhindern.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen für die Qualitätssteuerung</h2>
              <p className="helper mt-3">
                Gute Kennzahlen zeigen nicht nur, wie oft etwas blockiert wird, sondern auch, ob die Stopps sinnvoll
                waren und wie viel manuelle Nacharbeit später noch entsteht.
              </p>
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
              <p className="label">Praktischer Prüfpunkt</p>
              <h2 className="h3 mt-3">Viele unnötige Stopps sind genauso problematisch wie zu wenige</h2>
              <p className="helper mt-3">
                Wenn harmlose Standardfälle ständig blockiert werden, verliert das Team Vertrauen in die Prüflogik.
                Wenn riskante Fälle zu oft durchlaufen, verliert das System seine Schutzwirkung.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="advaic" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn Versand nur nach sauberer Prüfung passieren soll</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/freigabe-inbox" className="btn-secondary">
                  Freigabe-Inbox
                </Link>
                <Link href="/makler-freigabe-workflow" className="btn-secondary">
                  Freigabe-Workflow
                </Link>
                <Link href="/autopilot-regeln" className="btn-secondary">
                  Autopilot-Regeln
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn Sie trotz unklarem Fall einfach senden wollen</h2>
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
