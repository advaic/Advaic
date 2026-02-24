import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import Rules from "@/components/marketing/Rules";
import QualityChecks from "@/components/marketing/QualityChecks";
import Guarantee from "@/components/marketing/Guarantee";
import FinalCTA from "@/components/marketing/FinalCTA";

const principles = [
  "Automatisierung nur bei klaren Fällen",
  "Manuelle Freigabe als Standard bei Unsicherheit",
  "Nachvollziehbare Entscheidung je Nachricht",
  "Sicherheitsorientierter Fallback statt Risiko",
];

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
              Kostenlos testen
            </Link>
          </>
        }
      />

      <section className="marketing-section-clear py-20 md:py-28">
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
        </Container>
      </section>

      <Rules />
      <QualityChecks />
      <Guarantee />
      <FinalCTA />
    </PageShell>
  );
}
