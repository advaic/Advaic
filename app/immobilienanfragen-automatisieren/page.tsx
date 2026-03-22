import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import MarketingJumpLink from "@/components/marketing/MarketingJumpLink";
import AiDiscoveryPageTemplate from "@/components/marketing/ai-discovery/AiDiscoveryPageTemplate";
import { MARKETING_PRIMARY_CTA_LABEL } from "@/components/marketing/cta-copy";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const LAST_UPDATED = "21. März 2026";

const summary = [
  "Immobilienanfragen zu automatisieren lohnt sich dann, wenn wiederkehrende Standardanfragen schnell, korrekt und nachvollziehbar beantwortet werden müssen.",
  "Der Engpass ist selten reine Textgenerierung. Entscheidend ist die saubere Entscheidung zwischen automatisch senden, Freigabe und ignorieren.",
  "Eine gute Einführung startet vorsichtig: wenige Antworttypen, klare Ausnahmen, sichtbare Qualitätschecks und Kennzahlen statt Vollautomatik-Versprechen.",
];

const contents = [
  { href: "#kurzfassung", label: "Kurzfassung" },
  { href: "#methodik", label: "Methodik" },
  { href: "#fit", label: "Wann es sich lohnt" },
  { href: "#prozess", label: "Der Automatisierungsprozess" },
  { href: "#grenzen", label: "Grenzen & Ausnahmen" },
  { href: "#rollout", label: "Einführungsplan für 30 Tage" },
  { href: "#kpis", label: "Kennzahlen" },
];

const methodology = [
  "Die Seite kombiniert aktuelle Herstellerinformationen zu Portalanfragen und Anfragebearbeitung mit Advaics operativer Sicht auf einen vorsichtigen Start, Freigabe und Qualitätskontrolle.",
  "Empfohlen wird kein maximaler Auto-Anteil, sondern ein sicherer Betriebsstart mit klaren Antworttypen, Abbruchgründen und sichtbarer Nachvollziehbarkeit.",
  "Die Quellen unten sind Markt- und Methodenquellen. Für die konkrete Umsetzung zählt am Ende Ihr tatsächlicher Arbeitsalltag mit echten Nachrichten.",
];

const fitSignals = [
  "Es gibt regelmäßiges Anfragevolumen mit ähnlichen Erstantworten zu Verfügbarkeit, Unterlagen, Besichtigung oder nächsten Standardschritten.",
  "Das Team verliert heute Zeit in Sortierung, Wiederholung und manuellem Nachfassen statt in Beratung und Abschlussarbeit.",
  "Es besteht der Wunsch, Reaktionszeit zu senken, ohne Preis-, Konflikt- oder Ausnahmesituationen blind zu automatisieren.",
];

const nonFitSignals = [
  "Es gibt kaum wiederkehrende Muster im Anfrageeingang.",
  "Die Datenlage zu Objekten, Zuständigkeiten und Antwortvorlagen ist noch zu unklar.",
  "Ein großer Teil der Kommunikation ist verhandlungsnah, konfliktbehaftet oder hoch individuell.",
];

const processSteps = [
  {
    step: "01",
    title: "Eingang erkennen",
    text: "Relevante Portalanfragen und Website-Nachrichten werden von Newslettern, Systemmails und Dubletten getrennt.",
  },
  {
    step: "02",
    title: "Kontext prüfen",
    text: "Objektbezug, Quelle, vorhandene Historie und Pflichtangaben müssen ausreichend sauber erkennbar sein.",
  },
  {
    step: "03",
    title: "Entscheidung erzwingen",
    text: "Jede Nachricht landet bewusst in automatisch senden, zur Freigabe oder ignorieren.",
  },
  {
    step: "04",
    title: "Qualitätschecks ausführen",
    text: "Vor dem Versand werden Relevanz, Kontext, Vollständigkeit, Ton, Risiko und Lesbarkeit geprüft.",
  },
  {
    step: "05",
    title: "Verlauf dokumentieren",
    text: "Status, Zeitstempel und Gründe machen später sichtbar, was warum passiert ist.",
  },
  {
    step: "06",
    title: "Nachfassen steuern",
    text: "Nachfassen darf nur laufen, wenn keine Antwort vorliegt und kein Stoppsignal aktiv ist.",
  },
];

const boundaries = [
  {
    title: "Gut automatisierbar",
    text: "Klare Erstantworten zu Verfügbarkeit, Exposé, Unterlagen, Besichtigung und nächsten Standardschritten.",
  },
  {
    title: "Nur mit Freigabe",
    text: "Unklarer Objektbezug, fehlende Angaben, mögliche Dubletten, Beschwerden, Ausnahmen oder sensible Aussagen.",
  },
  {
    title: "Bewusst manuell halten",
    text: "Preisverhandlungen, Konflikte, Sonderwünsche, Eskalationen und andere reputativ oder rechtlich sensible Fälle.",
  },
];

const rolloutPlan = [
  {
    title: "Woche 1: Vorsichtiger Start mit hoher Freigabequote",
    text: "Auto nur für wenige, eindeutig wiederkehrende Fälle aktivieren. Alles andere geht in die Freigabe.",
  },
  {
    title: "Woche 2: Vorlagen, Ton und Objektlogik schärfen",
    text: "Antwortstil, Pflichtangaben und Eskalationsgrenzen an echten Fällen kalibrieren.",
  },
  {
    title: "Woche 3: Nachfassen vorsichtig ergänzen",
    text: "Erst wenn Erstantwort und Freigabe stabil laufen, konservative Nachfass-Stufen einführen.",
  },
  {
    title: "Woche 4: Nach Kennzahlen entscheiden",
    text: "Auto-Anteil nur anheben, wenn Erstreaktionszeit, Freigabequote und QA-Verlauf stabil bleiben.",
  },
];

const kpis = [
  "Ø Erstreaktionszeit auf neue Interessenten-Anfragen",
  "Freigabequote je 100 eingehende Anfragen",
  "QA-Fehlerquote vor Versand",
  "Manuelle Minuten pro Standard-Erstantwort",
  "Antwortquote nach Erstreaktion und Nachfassen",
];

const advaicFit = [
  "Advaic passt dort, wo der eigentliche Engpass nicht die CRM-Datenhaltung, sondern die operative Antwortlogik im Anfrageeingang ist.",
  "Die Stärke liegt in klaren Regeln, Freigabe, Qualitätschecks und nachvollziehbarer Entscheidung pro Nachricht.",
  "Advaic ist kein pauschaler Ersatz für Maklersoftware oder CRM, sondern eine spezialisierte Ausführungsschicht für den Anfrageprozess.",
];

const sources = [
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
    note: "Referenz für die operative Bedeutung schneller Reaktion auf digitale Anfragen.",
  },
  {
    label: "onOffice Hilfe: Einstellungen Anfragenmanager",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/einstellungen-anfragenmanager/",
    note: "Praxisnahe Herstellerquelle zu Auto-Bearbeitung, Wartezeiten, Ausnahmen und manueller Weiterbearbeitung.",
  },
  {
    label: "onOffice Hilfe: Anfragenmanager einrichten",
    href: "https://de.enterprisehilfe.onoffice.com/help_entries/administrative-anleitungen/anfragenmanager-einrichten/",
    note: "Praxisnahe Herstellerquelle zur Prozessstruktur von E-Mailanfragen, Adressanlage und Anfrageverarbeitung.",
  },
  {
    label: "FLOWFACT: Automatische Anfragenverarbeitung",
    href: "https://flowfact.de/anfragenverarbeitung/",
    note: "Herstellerseite zu Portalanfragen, Dubletten-Check, Exposéversand und Statusübersicht.",
  },
  {
    label: "Propstack Hilfe: Anfragen verstehen",
    href: "https://support.propstack.de/hc/de/articles/18360650832413-Anfragen-verstehen",
    note: "Praxisnahe Herstellerquelle zur Definition und Zuordnung eingehender Anfragen.",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    note: "Rahmen für kontrollierte, nachvollziehbare Automationsentscheidungen.",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Immobilienanfragen automatisieren: Leitfaden 2026",
  ogTitle: "Immobilienanfragen automatisieren | Advaic",
  description:
    "Praxisleitfaden für Makler: Wie Immobilienanfragen sinnvoll automatisiert werden, welche Fälle sich eignen und wie eine sichere Einführung mit Freigabe und Qualitätschecks aussieht.",
  path: "/immobilienanfragen-automatisieren",
  template: "guide",
  eyebrow: "Leitfaden 2026",
  proof: "Richtige Anfrageautomation trennt Auto, Freigabe und Ignorieren sauber und startet konservativ.",
});

export default function ImmobilienanfragenAutomatisierenPage() {
  const siteUrl = getSiteUrl();
  const faqItems = [
    {
      question: "Welche Immobilienanfragen lassen sich gut automatisieren?",
      answer:
        "Vor allem wiederkehrende Standardanfragen mit klarem Objektbezug und ausreichenden Pflichtangaben. Dazu gehören oft Verfügbarkeit, Unterlagen, Besichtigung und nächste Standardschritte.",
    },
    {
      question: "Welche Fälle sollten Makler nicht automatisch beantworten?",
      answer:
        "Beschwerden, Ausnahmen, Preisverhandlungen, konfliktnahe Fälle und Nachrichten mit unklarem Objektbezug oder fehlenden Angaben sollten in die Freigabe oder in die manuelle Bearbeitung gehen.",
    },
    {
      question: "Wie startet man ohne unnötiges Risiko?",
      answer:
        "Mit einem vorsichtigen Start: hohe Freigabequote, wenige automatische Fälle, sichtbare Qualitätschecks und ein klarer Rahmen aus Kennzahlen für Ausbau oder Stopp.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Immobilienanfragen automatisieren",
        inLanguage: "de-DE",
        mainEntityOfPage: `${siteUrl}/immobilienanfragen-automatisieren`,
        dateModified: "2026-03-21",
        author: {
          "@type": "Organization",
          name: "Advaic Redaktion",
        },
        about: ["Immobilienanfragen", "Automatisierung", "Freigabe", "Qualitätschecks", "Makler"],
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
        { name: "Immobilienanfragen automatisieren", path: "/immobilienanfragen-automatisieren" },
      ]}
      schema={schema}
      kicker="Leitfaden 2026"
      title="Immobilienanfragen automatisieren: sicher, nachvollziehbar, ausbaufähig"
      description="Der entscheidende Unterschied ist nicht mehr Automatisierung, sondern bessere Automatisierung: klare Fälle für automatische Antworten, harte Freigabegrenzen und eine Einführung, die über Qualität und Kennzahlen gesteuert wird."
      actions={
        <>
          <Link href="/anfragenmanagement-immobilienmakler" className="btn-secondary">
            Anfragenmanagement
          </Link>
          <Link href="/signup?entry=immobilienanfragen-automatisieren-2026" className="btn-primary">
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </>
      }
      mobileQuickActions={
        <article className="card-base p-4">
          <p className="label">Schnellwahl</p>
          <p className="helper mt-2">Direkt zum Prozess oder zum Einführungsplan für 30 Tage springen.</p>
          <div className="mt-3 grid gap-2">
            <MarketingJumpLink href="#prozess" className="btn-secondary w-full justify-center">
              Prozess öffnen
            </MarketingJumpLink>
            <MarketingJumpLink href="#rollout" className="btn-secondary w-full justify-center">
              Einführungsplan
            </MarketingJumpLink>
          </div>
        </article>
      }
      stage="bewertung"
      stageContext="immobilienanfragen-automatisieren"
      primaryHref="/signup?entry=immobilienanfragen-automatisieren-stage-2026"
      primaryLabel="Kontrolliert testen"
      secondaryHref="/antwortzeit-immobilienanfragen"
      secondaryLabel="Antwortzeit prüfen"
      sources={sources}
      sourcesCheckedLabel={LAST_UPDATED}
      sourcesDescription="Die Quellen unten verbinden aktuelle Herstellerhinweise zur Anfragebearbeitung mit übergreifender Research- und Risikoperspektive. Für den Live-Betrieb zählt immer Ihr eigener Prozess mit echten Nachrichten."
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
                Produkt- und Prozessteam mit Fokus auf Anfrageeingang, Freigabe, Qualitätschecks und kontrollierte
                Einführung im Makleralltag.
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

      <section id="fit" className="marketing-soft-cool py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Woran Sie einen guten Fit erkennen</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {fitSignals.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card-base p-6 md:p-8">
              <h2 className="h3">Wann Sie zuerst intern aufräumen sollten</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {nonFitSignals.map((item) => (
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

      <section id="prozess" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[78ch]">
            <h2 className="h2">Der richtige Automatisierungsprozess für Makleranfragen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Gute Anfrageautomation ist kein reiner Textgenerator. Sie ist ein Prozess, der Eingang, Kontext,
              Entscheidung, Qualität und Nachverfolgung bewusst trennt.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {processSteps.map((item) => (
              <article key={item.step} className="card-base p-6">
                <p className="label">{item.step}</p>
                <h3 className="mt-3 text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="grenzen" className="marketing-soft-warm py-20 md:py-28">
        <Container>
          <h2 className="h2">Welche Fälle sich eignen und welche bewusst manuell bleiben sollten</h2>
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

      <section id="rollout" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Empfohlener Einführungsplan für 30 Tage</h2>
            <div className="mt-5 space-y-3">
              {rolloutPlan.map((item) => (
                <article key={item.title} className="rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                  <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                  <p className="helper mt-2">{item.text}</p>
                </article>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/autopilot-regeln" className="btn-secondary">
                Autopilot-Regeln
              </Link>
              <Link href="/qualitaetschecks" className="btn-secondary">
                Qualitätschecks
              </Link>
              <Link href="/follow-up-emails-immobilienmakler" className="btn-secondary">
                Nachfass-E-Mails
              </Link>
            </div>
          </article>
        </Container>
      </section>

      <section id="kpis" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h2">Kennzahlen für Ausbau oder Stopp</h2>
            <ul className="mt-5 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {kpis.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-6 p-6 md:p-8">
            <h2 className="h3">Wo Advaic in diesem Prozess passt</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {advaicFit.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>
    </AiDiscoveryPageTemplate>
  );
}
