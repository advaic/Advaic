import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import Rules from "@/components/marketing/Rules";
import QualityChecks from "@/components/marketing/QualityChecks";
import DecisionSimulator from "@/components/marketing/DecisionSimulator";
import Guarantee from "@/components/marketing/Guarantee";
import FinalCTA from "@/components/marketing/FinalCTA";

const principles = [
  "Automatisierung nur bei klaren Fällen",
  "Manuelle Freigabe als Standard bei Unsicherheit",
  "Nachvollziehbare Entscheidung je Nachricht",
  "Sicherheitsorientierter Fallback statt Risiko",
];

const summary = [
  "Autopilot ist regelbasiert: keine Blackbox, keine freie Interpretation ohne Guardrails.",
  "Unsichere Fälle werden nicht automatisch gesendet, sondern in die Freigabe gelegt.",
  "Jede Entscheidung ist im Verlauf nachvollziehbar und kann operativ ausgewertet werden.",
];

const decisionLevels = [
  {
    title: "Relevanzebene",
    text: "Ist die Nachricht überhaupt eine echte Interessenten-Anfrage oder nur Nicht-Anfrage?",
  },
  {
    title: "Kontextebene",
    text: "Sind Objektbezug und notwendige Informationen für eine sichere Antwort vorhanden?",
  },
  {
    title: "Risikobene",
    text: "Liegt ein Sonderfall, Konflikt oder sonstige Unsicherheit vor, die Freigabe erfordert?",
  },
];

const deepDives = [
  {
    title: "Autopilot-Regeln im Detail",
    text: "Signal-zu-Aktion Matrix für Auto, Freigabe und Ignorieren.",
    href: "/autopilot-regeln",
  },
  {
    title: "Qualitätschecks im Detail",
    text: "Alle Prüfungen mit Zweck, Beispiel und Fail-Safe-Verhalten.",
    href: "/qualitaetschecks",
  },
  {
    title: "Freigabe-Inbox im Detail",
    text: "Wie unklare Fälle strukturiert geprüft und sauber entschieden werden.",
    href: "/freigabe-inbox",
  },
  {
    title: "Follow-up-Logik im Detail",
    text: "Stufenmodell, Guardrails und Stop-Kriterien für Nachfassmails.",
    href: "/follow-up-logik",
  },
];

const sources = [
  {
    label: "NIST – AI Risk Management Framework",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    label: "Harvard Business Review – The Short Life of Online Sales Leads",
    href: "https://hbr.org/2011/03/the-short-life-of-online-sales-leads",
  },
  {
    label: "McKinsey – The social economy",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
];

export const metadata: Metadata = {
  title: "Autopilot-Regeln | Advaic",
  description:
    "Verstehen Sie die Autopilot-Logik von Advaic: klare Auto-Fälle, Freigabe bei Unsicherheit, Ignorieren bei Nicht-Anfragen und Fail-Safe Guardrails.",
};

export default function AutopilotPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Autopilot-Logik"
        title="Regeln statt Blackbox"
        description="Advaic entscheidet nicht beliebig. Jeder Auto-Versand basiert auf klaren Regeln und dokumentierten Qualitätschecks."
        actions={
          <>
            <Link href="/sicherheit" className="btn-secondary">
              Sicherheitsdetails
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
            <h2 className="h3">Kurzfassung in 60 Sekunden</h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {summary.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="#autopilot-details" className="btn-secondary">
                Detail-Logik
              </a>
              <a href="#autopilot-quellen" className="btn-secondary">
                Quellen
              </a>
            </div>
          </article>
        </Container>
      </section>

      <section id="autopilot-details" className="marketing-section-clear py-20 md:py-28">
        <Container>
          <article className="card-base p-8 md:p-10">
            <h2 className="h2">Kernprinzipien des Autopiloten</h2>
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {principles.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="helper mt-6">
              In der Praxis gilt: Auto-Senden nur bei klaren Standardanfragen mit vollständigem Kontext. Beschwerden,
              Sonderfälle oder unklare Zuordnung gehen grundsätzlich in die Freigabe.
            </p>
          </article>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {decisionLevels.map((item) => (
              <article key={item.title} className="card-base p-6">
                <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {deepDives.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h3 className="h3">{item.title}</h3>
                <p className="helper mt-2">{item.text}</p>
                <Link href={item.href} className="btn-secondary mt-4">
                  Detailseite öffnen
                </Link>
              </article>
            ))}
          </div>

          <article id="autopilot-quellen" className="card-base mt-8 p-6">
            <h2 className="h3">Quellen & Einordnung</h2>
            <p className="helper mt-3">
              Die Autopilot-Logik ist auf kontrollierte, risikobewusste Automatisierung ausgelegt. Die verlinkten
              Quellen unterstützen die Einordnung von Reaktionsgeschwindigkeit und Risiko-Governance.
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

      <DecisionSimulator
        title="Regel-Simulator für den Autopilot"
        description="Anhand typischer Eingänge sehen Sie, wie die Entscheidung zwischen Auto, Freigabe und Ignorieren konkret zustande kommt."
      />
      <Rules />
      <QualityChecks />
      <Guarantee />
      <FinalCTA />
    </PageShell>
  );
}
