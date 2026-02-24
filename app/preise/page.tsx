import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import Pricing from "@/components/marketing/Pricing";
import FinalCTA from "@/components/marketing/FinalCTA";

export default function PreisePage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Preise"
        title="Transparentes Preismodell"
        description="Starten Sie mit 14 Tagen Testphase. Danach läuft das Abo monatlich weiter und bleibt jederzeit kündbar."
        actions={
          <>
            <Link href="/produkt" className="btn-secondary">
              Produkt ansehen
            </Link>
            <Link href="/signup" className="btn-primary">
              Kostenlos testen
            </Link>
          </>
        }
      />

      <Pricing showDetailButton={false} />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-base p-8 md:p-10">
              <h2 className="h2">Was Sie in jedem Plan erhalten</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                <li>Auto/Freigabe/Ignorieren nach klarer Regel-Logik</li>
                <li>Qualitätskontrollen vor Auto-Versand</li>
                <li>Statusverlauf pro Nachricht (Eingang → Entscheidung → Versand)</li>
                <li>Freigabe-Inbox für unklare oder sensible Fälle</li>
              </ul>
            </article>

            <article className="card-base p-8 md:p-10">
              <h2 className="h2">Testphase und Start</h2>
              <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                <li>14 Tage Testphase ohne langfristige Bindung</li>
                <li>Monatliche Laufzeit nach der Testphase</li>
                <li>Kündbar; Autopilot kann zusätzlich jederzeit pausiert werden</li>
                <li>Empfohlener Start: konservativ mit mehr Freigaben</li>
              </ul>
            </article>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </PageShell>
  );
}
