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
  "Gute Autopilot-Regeln beschreiben keine Stimmung, sondern konkrete Entscheidungssignale für `automatisch senden`, `zur Freigabe` oder `ignorieren`.",
  "Die wichtigste Frage ist nicht, wie viel automatisch laufen kann, sondern welche Fälle sicher genug für den Standardpfad sind und welche bewusst gestoppt werden müssen.",
  "Wenn Regeln unklar formuliert sind, wird der Autopilot entweder zu vorsichtig und langsam oder zu locker und riskant. Beides ist im Makleralltag teuer.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#logik", label: "Entscheidungslogik" },
  { href: "#matrix", label: "Regelmatrix" },
  { href: "#beispiele", label: "Typische Fälle" },
  { href: "#kalibrierung", label: "Kalibrierung" },
  { href: "#kennzahlen", label: "Kennzahlen" },
  { href: "#advaic", label: "Advaic" },
  { href: "#faq", label: "FAQ" },
];

const methodology = [
  "Die Seite verbindet offizielle Quellen zu Makler-Anfragenmanagement, Portalanfragen und kontrollierter Automatisierung mit Advaics Sicht auf Entscheidungsregeln im Anfrageeingang.",
  "Verglichen wird nicht nur nach Regelbegriffen, sondern nach echter Reihenfolge: Relevanz prüfen, Kontext prüfen, Vollständigkeit prüfen, Risiko stoppen und erst dann eine Aktion ausführen.",
  "Die Empfehlungen sind bewusst konservativ. Ziel ist keine maximale Automationsquote, sondern ein belastbares Regelwerk, das Standardfälle beschleunigt und Sonderfälle sauber aussteuert.",
];

const decisionFlow = [
  {
    title: "1. Relevanz prüfen",
    text: "Zuerst wird geklärt, ob überhaupt eine echte Interessenten-Anfrage vorliegt und keine Rundmail, Systemnachricht oder irrelevante Nachricht.",
  },
  {
    title: "2. Kontext prüfen",
    text: "Dann muss Objektbezug, Anfragezweck und Zusammenhang sauber erkennbar sein. Ohne klaren Kontext darf kein automatischer Versand folgen.",
  },
  {
    title: "3. Vollständigkeit prüfen",
    text: "Fehlende Kerndaten, widersprüchliche Angaben oder unklare Voraussetzungen stoppen den Standardpfad.",
  },
  {
    title: "4. Risiko prüfen",
    text: "Beschwerden, Konflikte, heikle Aussagen, Fristen oder Sonderfälle gehören bewusst in Freigabe statt in den automatischen Versand.",
  },
  {
    title: "5. Aktion ausführen",
    text: "Erst danach wird entschieden, ob eine Nachricht automatisch gesendet, zur Freigabe gelegt oder bewusst ignoriert wird.",
  },
];

const matrixRows = [
  {
    signal: "Eindeutige Interessenten-Anfrage mit klarem Objektbezug, vollständigem Kontext und bestandenem Prüfpfad",
    action: "Automatisch senden",
    reason: "Hier bringt schnelle Reaktion echten Nutzen, ohne dass der Qualitätsrahmen verlassen wird.",
  },
  {
    signal: "Unklarer Objektbezug, fehlende Kerndaten oder widersprüchlicher Zusammenhang",
    action: "Zur Freigabe",
    reason: "Nachrichten mit Lücken sollten nicht automatisch beantwortet werden, auch wenn der Entwurf sprachlich gut wirkt.",
  },
  {
    signal: "Beschwerde, Konflikt, Sonderfall oder risikoreiche Aussage",
    action: "Zur Freigabe",
    reason: "Hier ist menschliche Prüfung Teil des Regelwerks und kein optionaler Zusatz.",
  },
  {
    signal: "Newsletter, Rundmail, Spam, Systemmail oder sonstige Nicht-Anfrage",
    action: "Ignorieren",
    reason: "Keine relevante Interessenten-Kommunikation, daher kein Antwortpfad.",
  },
];

const examples = [
  {
    title: "Typische Fälle für automatischen Versand",
    items: [
      "„Ist die Immobilie noch verfügbar?“ bei klarem Objektbezug",
      "„Welche Unterlagen brauche ich für die Besichtigung?“ bei sauberem Kontext",
      "„Wie läuft der weitere Prozess bis zum Termin?“ bei eindeutigem Anfragezweck",
    ],
  },
  {
    title: "Typische Fälle für Freigabe",
    items: [
      "„Ich beziehe mich auf die Wohnung in der Innenstadt“ ohne eindeutige Zuordnung",
      "„Ich bin sehr unzufrieden mit dem letzten Termin“ als Beschwerde oder Konfliktfall",
      "„Bitte Sonderregelung für meinen Fall“ bei ungewöhnlichem oder riskantem Anliegen",
    ],
  },
  {
    title: "Typische Fälle zum Ignorieren",
    items: [
      "Newsletter und Rundmails ohne Interessentenbezug",
      "Automatische Systemmeldungen oder Zustellhinweise",
      "Spam und sonstige irrelevante Nachrichten ohne Antwortzweck",
    ],
  },
];

const calibrationRules = [
  "Wenn zu viele harmlose Standardfälle in die Freigabe gehen, sind die Regeln meist zu grob oder zu eng formuliert.",
  "Wenn unklare oder riskante Fälle zu oft automatisch durchlaufen, ist das kein Effizienzgewinn, sondern ein Zeichen für zu lockere Regeln.",
  "Jede Regel sollte an einem konkreten Signal hängen, nicht an vagen Formulierungen wie `wirkt plausibel` oder `wahrscheinlich passend`.",
  "Wiederkehrende Freigabegründe und Fehlentscheidungen gehören in die Regelpflege, nicht nur in manuelle Nacharbeit.",
];

const metrics = [
  "Automationsquote bei sauber prüfbaren Standardfällen",
  "Freigabequote bei unklaren oder sensiblen Fällen",
  "Anteil unnötig geblockter Standardfälle",
  "Quote nachträglicher manueller Korrekturen",
  "Median-Zeit bis zur Entscheidung bei Freigabefällen",
  "Häufigste Regelgründe pro Woche",
];

const advaicFit = [
  "Sie wollen ein klares Regelwerk, das nachvollziehbar zwischen automatischem Versand, Freigabe und Ignorieren unterscheidet.",
  "Ihr Team möchte schnelle Reaktion auf Standardfälle, ohne Beschwerden, Konflikte oder unklare Fälle unkontrolliert zu verschicken.",
  "Sie brauchen Regeln, die auf echte Eingangssignale reagieren und später anhand von Freigabegründen nachgeschärft werden können.",
];

const advaicNotFit = [
  "Sie erwarten, dass der Autopilot auch bei unklarem Objektbezug oder fehlenden Angaben einfach trotzdem sendet.",
  "Es gibt noch keine klare Vorstellung davon, welche Fälle bewusst ignoriert, geprüft oder manuell entschieden werden sollen.",
  "Sie suchen primär ein allgemeines CRM oder eine Postfachlösung und nicht zuerst ein belastbares Entscheidungsregelwerk.",
];

const faqItems = [
  {
    question: "Was ist die wichtigste Regel im Autopilot?",
    answer:
      "Im Zweifel geht ein Fall in die Freigabe und nicht in den automatischen Versand. Diese Grundregel schützt besser als jede aggressive Automationsquote.",
  },
  {
    question: "Woran erkennt man zu grobe Regeln?",
    answer:
      "Wenn viele harmlose Standardfälle ständig in die Freigabe rutschen oder der Autopilot oft stoppt, obwohl der Fall eigentlich klar war. Dann sind die Signale nicht scharf genug beschrieben.",
  },
  {
    question: "Woran erkennt man zu lockere Regeln?",
    answer:
      "Wenn unklare, konfliktgeladene oder unvollständige Fälle zu oft automatisch verschickt werden. Dann fehlt dem Regelwerk eine saubere Grenze zwischen Standardfall und Sonderfall.",
  },
  {
    question: "Sollte ein gut formulierter Entwurf automatisch gesendet werden?",
    answer:
      "Nein. Gute Sprache allein reicht nicht. Erst wenn Relevanz, Kontext, Vollständigkeit und Risiko sauber geprüft sind, ist automatischer Versand überhaupt sinnvoll.",
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
    label: "Harvard Business Review: The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Einordnung, warum schnelle und passende Erstreaktion wirtschaftlich relevant ist, wenn die Eingangslogik sauber stimmt.",
  },
  {
    label: "NIST: AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare und risikobewusste Automatisierungsentscheidungen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Autopilot-Regeln 2026: Wann automatisch gesendet, geprüft oder ignoriert wird",
  ogTitle: "Autopilot-Regeln 2026 | Advaic",
  description:
    "Leitfaden für Makler: Welche Signale zu automatischem Versand, Freigabe oder Ignorieren führen, wie die Reihenfolge funktioniert und woran man gute Regelkalibrierung erkennt.",
  path: "/autopilot-regeln",
  template: "guide",
  eyebrow: "Entscheidungslogik",
  proof: "Ein gutes Regelwerk trennt klar zwischen automatischem Versand, Freigabe und Ignorieren und lässt diese Grenze später sauber prüfen.",
});

export default function AutopilotRegelnPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Autopilot-Regeln 2026",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/autopilot-regeln`,
        dateModified: "2026-04-04",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Autopilot-Regeln", "Freigabe", "Ignorieren", "Anfragenmanagement"],
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
        { name: "Autopilot-Regeln", path: "/autopilot-regeln" },
      ]}
      schema={schema}
      kicker="Entscheidungslogik"
      title="Wann Advaic automatisch sendet und wann bewusst stoppt"
      description="Diese Seite zeigt die Entscheidungslogik hinter dem Autopilot: welche Eingangssignale zu automatischem Versand, Freigabe oder Ignorieren führen und warum die Reihenfolge der Prüfungen wichtiger ist als einzelne Schlagwörter."
      actions={
        <>
          <Link href="/qualitaetschecks" className="btn-secondary">
            Qualitätschecks
          </Link>
          <Link href="/signup?entry=autopilot-regeln" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zur Regelmatrix oder zu typischen Fällen springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#matrix" className="btn-secondary w-full justify-center">
              Regelmatrix
            </MarketingJumpLink>
            <MarketingJumpLink href="#beispiele" className="btn-secondary w-full justify-center">
              Typische Fälle
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="autopilot-regeln"
      primaryHref="/signup?entry=autopilot-regeln-stage"
      primaryLabel="Mit echten Fällen testen"
      secondaryHref="/freigabe-inbox"
      secondaryLabel="Freigabe-Inbox"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten stützen die Einordnung von Makler-Anfragenmanagement, kontrollierter Automatisierung und risikobewusster Entscheidungslogik. Für die konkrete Umsetzung sollten Sie immer Ihre echten Eingangsmuster und Freigabegründe mitprüfen."
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

      <section id="logik" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Die Entscheidungslogik ist wichtiger als die einzelne Regel</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Ein starkes Regelwerk funktioniert als Reihenfolge. Erst wenn Relevanz, Kontext, Vollständigkeit und
              Risiko sauber geprüft sind, darf überhaupt eine Aktion folgen.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {decisionFlow.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="matrix" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Regelmatrix im Alltag</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Die Matrix unten zeigt nicht nur die Aktion, sondern auch die Begründung dahinter. Genau diese Klarheit
              entscheidet, ob ein Autopilot betriebstauglich ist.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {matrixRows.map((row) => (
              <article key={row.signal} className="card-base card-hover p-5 md:p-6">
                <div className="grid gap-4 md:grid-cols-12 md:items-start">
                  <div className="md:col-span-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Eingangssignal
                    </p>
                    <p className="mt-1 text-sm text-[var(--text)]">{row.signal}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      Aktion
                    </p>
                    <span className="mt-1 inline-flex rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--border)]">
                      {row.action}
                    </span>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Warum</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{row.reason}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="beispiele" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Typische Fälle für Versand, Freigabe und Ignorieren</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Regeln bleiben im Alltag nur dann vertrauenswürdig, wenn Teams an echten Beispielen nachvollziehen
              können, warum eine Nachricht in genau diese Spur fällt.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {examples.map((group) => (
              <article key={group.title} className="card-base p-6">
                <h3 className="h3">{group.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="kalibrierung" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Woran man gute Regelkalibrierung erkennt</h2>
              <p className="helper mt-3">
                Gute Regeln sind weder mutlos noch leichtsinnig. Sie schaffen einen stabilen Standardpfad und halten
                trotzdem klare Grenzen für Ausnahmefälle.
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
              <p className="label">Grundregel</p>
              <h2 className="h3 mt-3">Im Zweifel geht der Fall in die Freigabe</h2>
              <p className="helper mt-3">
                Diese Leitlinie ist kein Zeichen von Schwäche, sondern der eigentliche Schutzmechanismus eines
                belastbaren Autopiloten.
              </p>
            </aside>
          </div>
        </Container>
      </section>

      <section id="kennzahlen" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Kennzahlen für die Regelpflege</h2>
              <p className="helper mt-3">
                Gute Kennzahlen zeigen nicht nur, wie oft etwas automatisch läuft, sondern auch, ob zu viele Fälle
                unnötig blockiert oder riskant durchgelassen werden.
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
              <h2 className="h3 mt-3">Hohe Automationsquote allein ist kein Qualitätsbeweis</h2>
              <p className="helper mt-3">
                Wenn die Quote nur deshalb hoch ist, weil Regeln unklare oder riskante Fälle nicht sauber stoppen,
                wirkt der Autopilot schneller, als er tatsächlich sicher ist.
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
              <h2 className="h3 mt-3">Wenn Regeln nachvollziehbar statt diffus sein sollen</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                {advaicFit.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/qualitaetschecks" className="btn-secondary">
                  Qualitätschecks
                </Link>
                <Link href="/freigabe-inbox" className="btn-secondary">
                  Freigabe-Inbox
                </Link>
                <Link href="/makler-freigabe-workflow" className="btn-secondary">
                  Freigabe-Workflow
                </Link>
              </div>
            </article>

            <article className="card-base p-6 md:p-8">
              <p className="label">Wo Advaic eher nicht passt</p>
              <h2 className="h3 mt-3">Wenn Sie trotz unklarer Lage einfach senden wollen</h2>
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
