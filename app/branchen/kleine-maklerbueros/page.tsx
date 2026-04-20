import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const painPoints = [
  "Wenig Personal für viele parallele Aufgaben",
  "Antwortzeiten schwanken je nach Tageslast",
  "Wichtige Sonderfälle bleiben zu lange im Postfach liegen",
];

const quickTake = [
  "Für kleine Maklerbüros lohnt sich Automatisierung vor allem bei wiederkehrenden Erstantworten, die fachlich sauber prüfbar sind.",
  "Preisverhandlung, Beschwerden, Ausnahmen und Nachrichten mit fehlenden Angaben sollten bewusst manuell bleiben.",
  "Ein sicherer Start ist konservativ: hohe Freigabequote, kurze Lernschleife und erst danach kontrollierter Ausbau.",
];

const guardrails = [
  "Auto nur für wiederkehrende Erstantworten mit prüfbarem Objektbezug und vollständigen Pflichtangaben",
  "Freigabe als Pflichtpfad bei Beschwerden, Ausnahmen, Konflikten oder fehlenden Informationen",
  "Follow-up-Stufen erst aktivieren, wenn Antwortqualität und Freigabevolumen stabil bleiben",
];

const manualBoundaries = [
  "Preis- und Verhandlungsgespräche",
  "Beschwerden, Eskalationen und konfliktnahe Nachrichten",
  "Anfragen ohne klaren Objektbezug oder ohne nötige Angaben",
  "Ausnahmesituationen, bei denen Teamentscheidung wichtiger ist als Geschwindigkeit",
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
  "Tag 1–3: Nur wiederkehrende Erstantworten mit klaren Angaben auf Auto, alles andere in Freigabe.",
  "Tag 4–10: Freigabe-Muster analysieren und Regeln nachschärfen.",
  "Tag 11–20: Follow-up Stufe 1 vorsichtig aktivieren.",
  "Tag 21–30: Auto-Anteil nur bei stabiler QA, nachvollziehbarem Verlauf und tragbarem Freigabeaufwand anheben.",
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

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wie kleine Maklerbüros Anfragen sauber skalieren",
  ogTitle: "Kleine Maklerbüros | Branchenprofil Advaic",
  description:
    "Leitfaden für kleine Maklerbüros: Wo Automatisierung wirklich entlastet, welche Nachrichten manuell bleiben sollten und wie ein sicherer 30-Tage-Start aussieht.",
  path: "/branchen/kleine-maklerbueros",
  template: "usecase",
  eyebrow: "Branchenprofil",
  proof: "Wiederkehrende Erstantworten automatisieren, Ausnahmen bewusst manuell halten und konservativ ausrollen.",
});

export default function BranchenKleineMaklerbuerosPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Branchenprofil kleine Maklerbüros",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/branchen/kleine-maklerbueros`,
    about: ["kleine Maklerbüros", "Freigabe", "Anfrageprozess", "Guardrails"],
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageIntro
        kicker="Branchenprofil"
        title="Wie kleine Maklerbüros Anfragen sauber skalieren"
        description="In kleinen Teams ist nicht maximale Automatisierung das Ziel, sondern spürbare Entlastung ohne Kontrollverlust. Entscheidend ist, welche Nachrichten wiederkehrend und sauber prüfbar sind und welche bewusst manuell bleiben."
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

      <section id="kurzfassung" className="py-8 md:py-10">
        <Container>
          <article className="card-base p-6">
            <h2 className="h3">Kurzantwort in 60 Sekunden</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {quickTake.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Container>
      </section>

      <StageCTA
        stage="bewertung"
        primaryHref="/produkt#setup"
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
              <li>Mit hoher Freigabequote starten und nur klar prüfbare Erstantworten automatisch senden.</li>
              <li>Nach einer Woche Freigabe-Muster auswerten und Regeln verfeinern.</li>
              <li>Auto-Anteil schrittweise anheben, sobald Qualität stabil nachweisbar ist.</li>
            </ol>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Was kleine Teams bewusst manuell halten sollten</h2>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {manualBoundaries.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/maklersoftware-fuer-kleine-maklerbueros" className="btn-secondary">
                Passende Maklersoftware
              </Link>
              <Link href="/immobilienanfragen-priorisieren" className="btn-secondary">
                Anfragen priorisieren
              </Link>
            </div>
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
                  rel="noopener noreferrer"
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
