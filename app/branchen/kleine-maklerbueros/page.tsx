import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";

const painPoints = [
  "Wenig Personal für viele parallele Aufgaben",
  "Antwortzeiten schwanken je nach Tageslast",
  "Wichtige Sonderfälle bleiben zu lange im Postfach liegen",
];

const guardrails = [
  "Auto nur für eindeutig wiederkehrende Standardfälle",
  "Freigabe als Pflichtpfad bei Unsicherheit und Konfliktthemen",
  "Follow-up-Stufen nur in kleinen Schritten aktivieren",
];

const pitfalls = [
  {
    title: "Zu früher Vollautopilot",
    text: "Wenn kleine Teams ohne Lernphase direkt hoch automatisieren, fehlt die Kalibrierung von Ton, Kontext und Freigaberegeln.",
  },
  {
    title: "Freigabe ohne Prioritätslogik",
    text: "Nicht jeder Fall braucht dieselbe Aufmerksamkeit. Ohne Priorisierung bleibt kritische Kommunikation zu lange offen.",
  },
  {
    title: "Kein KPI-System im Onboarding",
    text: "Ohne feste Kennzahlen bleibt unklar, ob der Prozess wirklich besser wird oder nur anders aussieht.",
  },
];

const rollout = [
  "Tag 1–3: Nur klarste Standardfälle auf Auto, alle unsicheren Fälle in Freigabe.",
  "Tag 4–10: Freigabe-Muster analysieren und Regeln nachschärfen.",
  "Tag 11–20: Follow-up Stufe 1 vorsichtig aktivieren.",
  "Tag 21–30: Auto-Anteil nur bei stabiler QA und sauberem Verlauf anheben.",
];

const sources = [
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    label: "EUR-Lex – DSGVO Zusammenfassung",
    href: "https://eur-lex.europa.eu/DE/legal-content/summary/general-data-protection-regulation-gdpr.html",
  },
];

export const metadata: Metadata = {
  title: "Kleine Maklerbüros | Branchenprofil Advaic",
  description:
    "Branchenprofil für kleine Maklerbüros: Entlastung bei Standardanfragen mit klaren Guardrails, Freigabelogik und kontrolliertem Safe-Start.",
};

export default function BranchenKleineMaklerbuerosPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Branchenprofil"
        title="Kleine Maklerbüros"
        description="Wenn wenige Personen ein hohes Anfragevolumen bearbeiten, muss Automatisierung zuverlässig entlasten, ohne die Kontrolle über sensible Kommunikation zu verlieren."
        actions={
          <>
            <Link href="/branchen" className="btn-secondary">
              Alle Branchenprofile
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />

      <StageCTA
        stage="bewertung"
        primaryHref="/produkt#safe-start-konfiguration"
        primaryLabel="Safe-Start berechnen"
        secondaryHref="/freigabe-inbox"
        secondaryLabel="Freigabe-Inbox prüfen"
        context="branche-kleine-maklerbueros"
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="max-w-[76ch]">
            <h2 className="h2">Warum kleine Maklerbüros eine andere Rollout-Logik brauchen</h2>
            <p className="body mt-4 text-[var(--muted)]">
              In kleinen Teams erzeugt bereits ein moderates Anfragevolumen operativen Druck, weil dieselben Personen
              Vertrieb, Kommunikation und Objektarbeit parallel steuern. Deshalb ist nicht maximale Automatisierung das
              Ziel, sondern ein stabiler, kontrollierbarer Ablauf.
            </p>
            <p className="body mt-4 text-[var(--muted)]">
              Dieses Branchenprofil ist als Entscheidungs- und Umsetzungsbrief formuliert: erst typische Fehlmuster,
              dann Guardrails und abschließend ein stufenweiser 30-Tage-Plan.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h2 className="h3">Typische Engpässe</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {painPoints.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card-base p-6">
              <h2 className="h3">Empfohlene Betriebslogik</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {guardrails.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {pitfalls.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Praktischer Startablauf</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
              <li>Mit hoher Freigabequote starten und nur klarste Fälle automatisch senden.</li>
              <li>Nach einer Woche Freigabe-Muster auswerten und Regeln verfeinern.</li>
              <li>Auto-Anteil schrittweise anheben, sobald Qualität stabil nachweisbar ist.</li>
            </ol>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">30-Tage-Rolloutplan für kleine Teams</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {rollout.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Die Empfehlungen kombinieren öffentliche Forschung zu Reaktionsgeschwindigkeit, Arbeitslast und
              datenschutzkonformer Prozessführung mit konservativer Rollout-Logik für kleine Teams.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sources.map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  {source.label}
                </a>
              ))}
            </div>
          </article>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
