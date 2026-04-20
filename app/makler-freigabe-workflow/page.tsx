import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";

const LAST_UPDATED = "4. April 2026";

const summary = [
  "Ein guter Freigabe-Workflow bremst Routinefälle nicht aus. Er schützt nur dort, wo automatische Antworten zu riskant, zu unklar oder zu unvollständig wären.",
  "Im Makleralltag gehören vor allem Beschwerden, Konflikte, fehlende Pflichtangaben, unklarer Objektbezug und widersprüchliche Signale in die Freigabe.",
  "Entscheidend ist nicht nur die Inbox, sondern die Betriebslogik dahinter: klare Gründe, saubere Priorisierung, feste Reaktionszeiten und nachvollziehbare Entscheidungen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#warum", label: "Warum Freigabe zählt" },
  { href: "#faelle", label: "Welche Fälle hinein gehören" },
  { href: "#workflow", label: "Ablauf" },
  { href: "#priorisierung", label: "Priorisierung" },
  { href: "#betriebsregeln", label: "Betriebsregeln" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet offizielle Quellen zu Makler-Anfragenmanagement, Portalanfragen und kontrollierter Automatisierung mit Advaics Sicht auf Freigabe- und Prüfpfade im Tagesgeschäft.",
  "Verglichen wird nicht nach abstrakten Steuerbegriffen, sondern nach echtem Ablauf: Erkennen, priorisieren, prüfen, entscheiden, dokumentieren und Regeln nachschärfen.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist kein maximaler automatischer Anteil, sondern ein belastbarer Freigabeprozess, der Routine beschleunigt und Sonderfälle sauber beim Team hält.",
];

const whyApprovalMatters = [
  {
    title: "Routine darf schnell bleiben",
    text: "Ohne Freigabelogik landen harmlose und heikle Fälle oft im selben manuellen Topf. Dann wird entweder alles langsam oder zu viel vorschnell automatisiert.",
  },
  {
    title: "Sensible Fälle brauchen einen eigenen Pfad",
    text: "Beschwerden, Konflikte, fehlende Angaben oder widersprüchliche Signale sollten nicht im normalen Antwortfluss untergehen, sondern klar sichtbar zur Entscheidung kommen.",
  },
  {
    title: "Freigabe ist auch Lernmaterial",
    text: "Die häufigsten Freigabegründe zeigen, wo Regeln geschärft, Texte verbessert oder Pflichtangaben früher abgefragt werden sollten.",
  },
  {
    title: "Ohne Dokumentation fehlt Vertrauen",
    text: "Wenn später unklar ist, warum etwas gesendet, gestoppt oder umformuliert wurde, wird die Freigabe-Inbox vom Schutzsystem zum schwarzen Loch.",
  },
];

const approvalCases = [
  {
    title: "Unklarer Objektbezug",
    text: "Wenn nicht eindeutig erkennbar ist, auf welches Objekt oder welche Anfrage sich die Nachricht bezieht, sollte kein automatischer Versand stattfinden.",
  },
  {
    title: "Fehlende Kerndaten",
    text: "Anfragen ohne zentrale Angaben wie Objektbezug, Kontaktkontext oder nötige Rückfragen sollten erst geklärt oder bewusst manuell beantwortet werden.",
  },
  {
    title: "Beschwerden und Konflikte",
    text: "Sobald eine Nachricht emotional aufgeladen, widersprüchlich oder eskalationsgefährdet ist, gehört sie in einen bewussten Prüfpfad.",
  },
  {
    title: "Aussagen mit höherem Risiko",
    text: "Rechtlich heikle Aussagen, unklare Zusagen, Fristen oder sensible Formulierungen sollten nicht automatisiert ohne menschliche Sichtung versendet werden.",
  },
];

const workflowSteps = [
  {
    title: "1. Erkennen",
    text: "Das System markiert Fälle mit fehlenden Angaben, Konfliktsignalen, Risikoindikatoren oder widersprüchlichem Kontext.",
  },
  {
    title: "2. Priorisieren",
    text: "Die Freigabe-Inbox sortiert nicht nach Lautstärke, sondern nach Risiko, Klarheit und erwarteter Auswirkung auf den weiteren Prozess.",
  },
  {
    title: "3. Prüfen",
    text: "Das Team sieht Originalnachricht, Entwurf, Freigabegrund und relevante Hinweise in einer gemeinsamen Sicht statt verteilt über mehrere Postfächer.",
  },
  {
    title: "4. Entscheiden",
    text: "Der Fall wird bewusst freigegeben, überarbeitet oder gestoppt. Gerade diese Trennung macht den Workflow belastbar.",
  },
  {
    title: "5. Dokumentieren",
    text: "Grund, Entscheidung, Zeitstempel und mögliche Korrekturen bleiben sichtbar, damit spätere Rückfragen nicht im Nebel enden.",
  },
  {
    title: "6. Regeln nachschärfen",
    text: "Wiederkehrende Freigabegründe fließen zurück in Regeln, Texte und Prüfungen, damit die Freigabe nicht dauerhaft überlastet.",
  },
];

const priorityBands = [
  {
    title: "Sofort prüfen",
    text: "Beschwerden, Konflikte, mögliche Fehladressierung, heikle Zusagen oder Fälle mit hohem Reputationsrisiko.",
  },
  {
    title: "Heute prüfen",
    text: "Klare Interessenten-Anfragen mit fehlenden Angaben, unklarem Kontext oder einer Rückfrage, die den Prozess sonst aufhält.",
  },
  {
    title: "Gebündelt prüfen",
    text: "Leichte Kontextlücken ohne direktes Risiko, bei denen keine voreilige Antwort droht, aber noch Klärung nötig ist.",
  },
];

const operatingRules = [
  "Jeder Freigabefall braucht einen klaren Grundcode statt freier Bauchgefühl-Notizen.",
  "Priorität wird nach Risiko und Prozesswirkung vergeben, nicht nach Eingangszeit allein.",
  "Für jede Prioritätsstufe sollte eine Zielzeit bis zur Entscheidung festgelegt sein.",
  "Wiederkehrende Freigabegründe werden wöchentlich ausgewertet und nur dann in Regeln überführt, wenn das Muster stabil ist.",
];

const metrics = [
  "Median-Zeit bis zur Freigabeentscheidung",
  "Anteil der Freigabefälle pro 100 relevante Anfragen",
  "Häufigste Freigabegründe pro Woche",
  "Quote nachträglicher Korrekturen nach Freigabe",
  "Anteil Fälle, die trotz Freigabe erneut eskalieren",
  "Anteil Routinefälle, die unnötig in der Freigabe landen",
];

const advaicFit = [
  "Sie wollen automatische Antworten nur für klar prüfbare Standardfälle zulassen und riskante Fälle konsequent aussteuern.",
  "Ihr Team verliert heute Zeit, weil Sonderfälle ungeordnet im Postfach hängen bleiben oder zu spät erkannt werden.",
  "Sie möchten eine nachvollziehbare Freigabe-Inbox mit Gründen, Priorität und sauberem Verlauf statt reiner Einzelfallbearbeitung.",
];

const advaicNotFit = [
  "Ihr Anfragevolumen ist so niedrig, dass eine strukturierte Freigabe-Inbox kaum operative Wirkung entfaltet.",
  "Es fehlt noch an klaren Zuständigkeiten oder an einer Person, die Freigabefälle zuverlässig bearbeitet.",
  "Sie suchen primär eine allgemeine Inbox oder ein CRM, nicht einen bewussten Prüfpfad für risikorelevante Nachrichten.",
];

const faqItems = [
  {
    question: "Wann sollte eine Nachricht in die Freigabe statt direkt in den Versand gehen?",
    answer:
      "Immer dann, wenn Objektbezug, Vollständigkeit, Ton, Risiko oder Prozesskontext nicht eindeutig genug sind. Gerade bei Beschwerden, Konflikten, widersprüchlichen Angaben oder heiklen Aussagen ist Freigabe der sauberere Pfad.",
  },
  {
    question: "Bremst ein Freigabe-Workflow die Antwortgeschwindigkeit?",
    answer:
      "Nur dann, wenn zu viele harmlose Fälle unnötig hineingeschoben werden. Ein guter Workflow hält den Freigabepfad bewusst eng, damit Routinefälle schnell bleiben und nur die wirklich prüfbedürftigen Fälle manuell entschieden werden.",
  },
  {
    question: "Welche Kennzahl zeigt am schnellsten, ob der Workflow funktioniert?",
    answer:
      "Die Median-Zeit bis zur Freigabeentscheidung ist meist der schnellste Frühindikator. Sie zeigt, ob das Team sensible Fälle zügig bearbeitet, ohne dass die Freigabe-Inbox zum Rückstau wird.",
  },
  {
    question: "Was ist der häufigste Fehler beim Einführen einer Freigabe-Inbox?",
    answer:
      "Zu breite Regeln. Wenn zu viele harmlose Fälle in der Freigabe landen, wird die Inbox laut, langsam und unbeliebt. Dann verliert das Team Vertrauen und der eigentliche Schutzmechanismus verwässert.",
  },
];

const sources = [
  {
    label: "onOffice Enterprise Hilfe: Einstellungen im Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Offizielle Quelle zur operativen Steuerung, Priorisierung und Bearbeitung im Makler-Anfragenmanager.",
  },
  {
    label: "onOffice Enterprise Hilfe: Anfragenmanager einrichten",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/anfragenmanager-einrichten/",
    note: "Offizielle Quelle zur Einrichtung und Struktur eines geregelten Anfrage-Workflows.",
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
    note: "Rahmen für kontrollierte, nachvollziehbare und risikobewusste Entscheidungen mit menschlicher Prüfung im Prozess.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Makler-Freigabe-Workflow 2026: So steuern Sie sensible Fälle sauber",
  ogTitle: "Makler-Freigabe-Workflow 2026 | Advaic",
  description:
    "Leitfaden für Makler: Welche Fälle in die Freigabe gehören, wie ein guter Freigabe-Workflow priorisiert und welche Kennzahlen zeigen, ob die Inbox wirklich funktioniert.",
  path: "/makler-freigabe-workflow",
  template: "guide",
  eyebrow: "Makler-Freigabe-Workflow",
  proof: "Freigabe ist dann stark, wenn Gründe, Priorität, Entscheidung und Dokumentation im Alltag klar zusammenpassen.",
});

export default function MaklerFreigabeWorkflowPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Makler-Freigabe-Workflow 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/makler-freigabe-workflow`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Freigabe-Workflow", "Immobilienmakler", "Anfragenmanagement", "Risikoprüfung"],
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
        { name: "Makler-Freigabe-Workflow", path: "/makler-freigabe-workflow" },
      ]}
      schema={schema}
      kicker="Makler-Freigabe-Workflow"
      title="Makler-Freigabe-Workflow: So steuern Sie sensible Fälle sauber, ohne Routine auszubremsen"
      description="Ein guter Freigabe-Workflow ist kein Stopp-Schild für alles. Er sorgt dafür, dass nur die wirklich prüfbedürftigen Fälle in Ihrer Entscheidung landen und Routineanfragen trotzdem zügig weiterlaufen."
      actions={
        <>
          <Link href="/freigabe-inbox" className="btn-secondary">
            Freigabe-Inbox
          </Link>
          <Link href="/signup?entry=makler-freigabe-workflow" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zu Fällen, Priorisierung oder Kennzahlen springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#faelle" className="btn-secondary w-full justify-center">
              Freigabefälle
            </MarketingJumpLink>
            <MarketingJumpLink href="#priorisierung" className="btn-secondary w-full justify-center">
              Priorisierung
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="makler-freigabe-workflow"
      primaryHref="/signup?entry=makler-freigabe-workflow-stage"
      primaryLabel="Freigabe mit echten Fällen testen"
      secondaryHref="/qualitaetschecks"
      secondaryLabel="Qualitätschecks verstehen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Makler-Anfragenmanagement, Freigabepfaden und kontrollierter Risiko-Logik. Für die konkrete Umsetzung sollten Sie immer Ihre echten Freigabegründe und Antwortmuster mitprüfen."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Qualitätsprüfung, Freigaberegeln und operative
                Entscheidungswege im Makleralltag.
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

      <section id="warum" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Warum ein sauberer Freigabe-Workflow im Maklerbüro mehr ist als ein Sicherheitsnetz</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Freigabe ist nicht nur für Problemfälle da. Ein guter Freigabeprozess schützt auch die Geschwindigkeit
              der Routine, weil nicht alles pauschal manuell werden muss.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {whyApprovalMatters.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="faelle" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Welche Fälle in die Freigabe gehören und welche lieber draußen bleiben sollten</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die häufigste Schwäche in der Praxis ist ein zu breiter Freigabepfad. Dann landen harmlose Fälle unnötig
              in der manuellen Prüfung und der eigentliche Nutzen der Automation verpufft.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {approvalCases.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="workflow" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">So sieht ein belastbarer Freigabe-Ablauf in sechs Schritten aus</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Entscheidend ist nicht nur, dass Fälle gestoppt werden, sondern dass sie danach geordnet, schnell und
              nachvollziehbar bearbeitet werden können.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workflowSteps.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="priorisierung" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Priorisierung in der Freigabe-Inbox</h2>
              <p className="helper mt-3">
                Eine gute Freigabe-Inbox arbeitet nicht bloß chronologisch. Sie ordnet Fälle danach, wie hoch Risiko,
                Dringlichkeit und Prozesswirkung tatsächlich sind.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {priorityBands.map((band) => (
                  <article key={band.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                    <p className="text-sm font-semibold text-[var(--text)]">{band.title}</p>
                    <p className="helper mt-2">{band.text}</p>
                  </article>
                ))}
              </div>
            </article>

            <aside className="card-base p-6">
              <p className="label">Praktischer Prüfpunkt</p>
              <h2 className="h3 mt-3">Wenn alles hoch aussieht, ist die Logik zu grob</h2>
              <p className="helper mt-3">
                Ein gesunder Workflow erzeugt sichtbar unterschiedliche Prioritäten. Wenn fast jeder Fall sofort geprüft
                werden soll, landen zu viele Standardfälle unnötig in der Freigabe.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="betriebsregeln" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Betriebsregeln, die einen Freigabe-Workflow stabil machen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Freigabe wird erst dann zum belastbaren Betriebssystem, wenn Zuständigkeiten, Gründe und Rückkopplung
              wirklich festgelegt sind.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {operatingRules.map((item) => (
              <article key={item} className="card-base p-6">
                <p className="text-base font-semibold text-[var(--text)]">{item}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen, die zeigen, ob der Workflow wirklich funktioniert</h2>
              <p className="helper mt-3">
                Gute Kennzahlen messen nicht nur Geschwindigkeit, sondern auch Übersteuerung, Rückstau und unnötige
                Freigaben.
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
              <p className="label">Warnsignal</p>
              <h2 className="h3 mt-3">Zu viele Freigaben sind kein Qualitätsbeweis</h2>
              <p className="helper mt-3">
                Wenn die Freigabequote dauerhaft sehr hoch ist, kann das ein Zeichen für zu enge Regeln oder zu wenig
                Vertrauen in den Standardpfad sein. Dann wird der Workflow teuer statt hilfreich.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="advaic" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic passt</p>
              <h2 className="h3 mt-3">Wenn sensible Fälle sichtbar beim Team landen sollen</h2>
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
                <Link href="/qualitaetschecks" className="btn-secondary">
                  Qualitätschecks
                </Link>
                <Link href="/manuell-vs-advaic" className="btn-secondary">
                  Manuell vs. Advaic
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn der Freigabepfad operativ noch nicht getragen werden kann</h2>
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
