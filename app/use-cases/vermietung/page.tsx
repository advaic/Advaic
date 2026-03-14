import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo/site-url";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";
import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";

const recurringQuestions = [
  "Ist die Wohnung noch verfügbar?",
  "Welche Unterlagen werden für die Besichtigung benötigt?",
  "Wann wäre ein Besichtigungstermin möglich?",
  "Wie ist der weitere Ablauf nach meiner Anfrage?",
];

const quickTake = [
  "Im Vermietungsprozess lohnt sich Automatisierung vor allem bei wiederkehrenden Erstantworten mit klarem Objektbezug.",
  "Beschwerden, Ausnahmen und Nachrichten mit fehlenden Angaben sollten nicht automatisch versendet werden.",
  "Entscheidend für den Erfolg sind Antwortzeit, Freigabequote und eine stabile Qualitätsprüfung vor dem Versand.",
];

const guardrails = [
  "Unklarer Objektbezug geht zur Freigabe.",
  "Beschwerden und Konfliktthemen gehen zur Freigabe.",
  "Newsletter, Systemmails und Spam werden ignoriert.",
  "Vor Auto-Versand laufen Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeits-Checks.",
];

const operatingModel = [
  {
    title: "1) Wiederkehrende Erstantworten bündeln",
    text: "Häufige Erstfragen werden auf feste Antwortpfade mit klaren Textbausteinen und prüfbaren Informationen gelegt.",
  },
  {
    title: "2) Freigabegründe konsequent isolieren",
    text: "Objektunklarheit, Konfliktthemen und fehlende Kerninfos gehen konsequent in die Freigabe.",
  },
  {
    title: "3) Stufenweise skalieren",
    text: "Erst bei stabiler Qualität wird der Auto-Anteil oder die Follow-up-Logik erweitert.",
  },
];

const kpis = [
  "Reaktionszeit auf neue Interessenten-Anfragen",
  "Anteil der Anfragen mit Antwort innerhalb des Zielzeitfensters",
  "Freigabequote bei vermietungsrelevanten E-Mails",
  "Rate manueller Korrekturen nach Auto-Versand",
];

const manualBoundaries = [
  "Preis- oder Verhandlungssituationen",
  "Beschwerden und konfliktnahe Kommunikation",
  "Nachrichten ohne klaren Objektbezug",
  "Fälle, in denen Angaben für eine richtige Antwort fehlen",
];

const sources = [
  {
    label: "HBR – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    label: "Destatis – Wohnen in Deutschland",
    href: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Wohnen/_inhalt.html",
  },
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
];

export const metadata: Metadata = buildMarketingMetadata({
  title: "Use Case Vermietung: Wo Automatisierung wirklich hilft",
  ogTitle: "Anwendungsfall Vermietung | Advaic",
  description:
    "Praxisleitfaden für Vermietungsteams: Welche E-Mails sich für Automatisierung eignen, welche Freigabegründe wichtig sind und wie ein sicherer Start aussieht.",
  path: "/use-cases/vermietung",
  template: "usecase",
  eyebrow: "Anwendungsfall",
  proof: "Wiederkehrende Erstantworten beschleunigen, manuelle Grenzen sauber halten und über KPI steuern.",
});

export default function UseCaseVermietungPage() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Anwendungsfall Vermietung mit hohem Anfragevolumen",
    inLanguage: "de-DE",
    mainEntityOfPage: `${siteUrl}/use-cases/vermietung`,
    about: ["Vermietung", "Makleranfragen", "Freigabe", "Qualitätschecks"],
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageIntro
        kicker="Anwendungsfall"
        title="Vermietung mit hohem Anfragevolumen"
        description="Wenn täglich viele ähnliche Anfragen eingehen, entscheidet Geschwindigkeit nur dann, wenn Antworten fachlich sauber bleiben. Der wichtigste Hebel liegt bei wiederkehrenden Erstantworten, nicht bei Ausnahmen oder Konflikten."
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
        primaryHref="/signup"
        primaryLabel="Vermietung testen"
        secondaryHref="/produkt#setup"
        secondaryLabel="Safe-Start planen"
        context="use-case-vermietung"
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-6 md:p-8">
            <h2 className="h3">Kurzfassung für Vermietungsteams</h2>
            <p className="helper mt-3 max-w-[72ch]">
              In der Vermietung entsteht der größte Hebel aus schneller, konsistenter Erstantwort. Entscheidend ist
              dabei eine klare Sicherheitslogik: Auto bei prüfbarem Objektbezug und ausreichenden Angaben, Freigabe bei
              Konflikten, Ausnahmen oder fehlenden Informationen.
            </p>
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h2 className="h3">Typische Ausgangslage</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Viele parallele Interessenten-Anfragen am selben Tag</li>
                <li>Hoher Anteil wiederkehrender Standardfragen</li>
                <li>Antwortstau außerhalb der Kernzeiten</li>
              </ul>
            </article>
            <article className="card-base p-6">
              <h2 className="h3">Was Advaic hier übernimmt</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {recurringQuestions.map((item) => (
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
            <h2 className="h3">Sicherheitslogik für Vermietung</h2>
            <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
              {guardrails.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">Diese Nachrichten sollten bewusst manuell bleiben</h2>
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
            <h2 className="h3">Sinnvoller Start in 3 Schritten</h2>
            <ol className="mt-4 space-y-2 pl-5 text-sm text-[var(--muted)] list-decimal">
              <li>Mit hoher Freigabequote starten und nur wiederkehrende Erstantworten automatisch senden.</li>
              <li>Ton und Textbausteine anhand realer Fälle nachjustieren.</li>
              <li>Autopilot-Anteil schrittweise erhöhen, sobald Qualität stabil ist.</li>
            </ol>
          </article>

          <article className="card-base mt-4 p-6">
            <h2 className="h3">KPI-Set für die operative Steuerung</h2>
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
              Die Empfehlungen verbinden öffentliche Daten zum Wohnungsmarkt mit Forschung zu Reaktionsgeschwindigkeit
              und risikobewusster Automatisierung.
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
