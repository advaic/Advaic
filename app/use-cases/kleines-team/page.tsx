import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";

const painPoints = [
  "Postfacharbeit konkurriert mit Besichtigungen, Telefonaten und Exposés.",
  "Antworten hängen an wenigen Personen und bleiben liegen, wenn Termine dicht sind.",
  "Sonderfälle kosten überproportional viel Zeit und bremsen den Standardprozess.",
];

const gains = [
  "Wiederkehrende Standardantworten laufen zuverlässig im gewünschten Ton.",
  "Unklare Fälle landen strukturiert in der Freigabe statt verteilt im Postfach.",
  "Der Verlauf macht Übergaben im Team einfacher (Status + Zeitstempel).",
];

const operatingModel = [
  {
    title: "Eingang priorisieren",
    text: "Relevante Interessenten-E-Mails werden von Newslettern, Systemmails und Spam getrennt.",
  },
  {
    title: "Unsicherheit sauber auffangen",
    text: "Sonderfälle, Konflikte und unklare Kontexte gehen nicht in den Autopilot, sondern in die Freigabe.",
  },
  {
    title: "Kontrolliert ausweiten",
    text: "Der Auto-Anteil steigt nur, wenn QA, Freigabequote und Verlauf stabil bleiben.",
  },
];

const kpis = [
  "Median-Zeit bis Erstantwort pro Werktag",
  "Freigabequote im Verhältnis zu Auto-Antworten",
  "Anteil überfälliger Freigaben im Team",
  "Quote kritischer Korrekturen nach Versand",
];

const sources = [
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
];

export const metadata: Metadata = {
  title: "Anwendungsfall Kleines Team | Advaic",
  description:
    "Wie kleine Maklerteams mit Advaic Standardkommunikation entlasten, ohne sensible Fälle aus der Hand zu geben.",
  alternates: {
    canonical: "/use-cases/kleines-team",
  },
  openGraph: {
    title: "Anwendungsfall Kleines Team | Advaic",
    description:
      "Wie kleine Maklerteams mit Advaic Standardkommunikation entlasten, ohne sensible Fälle aus der Hand zu geben.",
    url: "/use-cases/kleines-team",
    images: ["/brand/advaic-icon.png"],
  },
  twitter: {
    title: "Anwendungsfall Kleines Team | Advaic",
    description:
      "Wie kleine Maklerteams mit Advaic Standardkommunikation entlasten, ohne sensible Fälle aus der Hand zu geben.",
    images: ["/brand/advaic-icon.png"],
  },
};

export default function UseCaseKleinesTeamPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Anwendungsfall kleines Maklerteam",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/use-cases/kleines-team`,
    about: ["kleines Maklerteam", "E-Mail-Prozess", "Freigabe", "Safe-Start"],
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageIntro
        kicker="Anwendungsfall"
        title="Kleine Teams mit knapper Zeit"
        description="Wenn wenige Personen viele Aufgaben tragen, braucht es einen sauberen Kommunikationsprozess. Advaic entlastet beim Standard und schützt bei Sonderfällen."
        actions={
          <>
            <Link href="/use-cases" className="btn-secondary">
              Alle Anwendungsfälle
            </Link>
            <Link href="/signup" className="btn-primary">
              14 Tage testen
            </Link>
          </>
        }
      />
      <StageCTA
        stage="bewertung"
        primaryHref="/signup"
        primaryLabel="Im Team testen"
        secondaryHref="/produkt#setup"
        secondaryLabel="Safe-Start planen"
        context="use-case-kleines-team"
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Kurzfassung für kleine Teams</h2>
            <p className="helper mt-3 max-w-[72ch]">
              Für kleine Maklerteams ist nicht maximale Automatisierung das Ziel, sondern ein robuster Ablauf: klare
              Standardfälle automatisch, heikle Fälle konsequent zur Freigabe und eine Teamlogik, die auch bei
              hoher Last stabil bleibt.
            </p>
          </article>

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
              <h2 className="h3">Konkreter Nutzen</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {gains.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {operatingModel.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Empfohlene Team-Konfiguration</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Autopilot zunächst auf klarste Standardfälle begrenzen.</li>
              <li>Freigabe-Inbox täglich in einem festen Slot bearbeiten.</li>
              <li>Tonregeln einmal definieren und danach nur gezielt nachschärfen.</li>
              <li>Follow-ups erst aktivieren, wenn der Erstantwort-Prozess stabil läuft.</li>
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">KPI-Set für die Teamsteuerung</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {kpis.map((item) => (
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
              Die Empfehlungen orientieren sich an publizierten Erkenntnissen zu Reaktionszeit auf
              Interessenten-Anfragen,
              Kommunikationsarbeitslast und risikobewusster Automatisierung.
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
