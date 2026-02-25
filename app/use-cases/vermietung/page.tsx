import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import StageCTA from "@/components/marketing/StageCTA";
import FinalCTA from "@/components/marketing/FinalCTA";

const standardfragen = [
  "Ist die Wohnung noch verfügbar?",
  "Welche Unterlagen werden für die Besichtigung benötigt?",
  "Wann wäre ein Besichtigungstermin möglich?",
  "Wie ist der weitere Ablauf nach meiner Anfrage?",
];

const guardrails = [
  "Unklarer Objektbezug geht zur Freigabe.",
  "Beschwerden und Konfliktthemen gehen zur Freigabe.",
  "Newsletter, Systemmails und Spam werden ignoriert.",
  "Vor Auto-Versand laufen Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeits-Checks.",
];

const operatingModel = [
  {
    title: "1) Standardfälle bündeln",
    text: "Häufige Erstfragen werden auf feste Antwortpfade mit klaren Textbausteinen gelegt.",
  },
  {
    title: "2) Unklare Fälle isolieren",
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

export const metadata: Metadata = {
  title: "Anwendungsfall Vermietung | Advaic",
  description:
    "Wie Advaic bei hohem Anfragevolumen in der Vermietung Zeit spart und dabei über Freigabe- und Qualitätslogik sicher bleibt.",
};

export default function UseCaseVermietungPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Anwendungsfall"
        title="Vermietung mit hohem Anfragevolumen"
        description="Wenn täglich viele ähnliche Anfragen eingehen, entscheidet Geschwindigkeit. Advaic automatisiert Standardfälle und hält Sonderfälle bewusst in Ihrer Freigabe."
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
              dabei eine klare Sicherheitslogik: Auto bei eindeutigen Standards, Freigabe bei Unsicherheit.
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
                {standardfragen.map((item) => (
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
            <h2 className="h3">Sinnvoller Start in 3 Schritten</h2>
            <ol className="mt-4 space-y-2 pl-5 text-sm text-[var(--muted)] list-decimal">
              <li>Mit hoher Freigabequote starten und nur klare Standardfälle automatisch senden.</li>
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
