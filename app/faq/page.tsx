import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import MarketingFAQ from "@/components/marketing/FAQ";
import FinalCTA from "@/components/marketing/FinalCTA";

export default function FAQPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="FAQ"
        title="Häufige Fragen zu Advaic"
        description="Hier finden Sie die wichtigsten Antworten zu Funktionsweise, Sicherheit, Steuerung und Testphase."
        actions={
          <>
            <Link href="/produkt" className="btn-secondary">
              Produktdetails
            </Link>
            <Link href="/signup" className="btn-primary">
              Kostenlos testen
            </Link>
          </>
        }
      />

      <section className="marketing-section-clear py-12 md:py-16">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="card-base p-5">
              <h2 className="h3">Autopilot</h2>
              <p className="helper mt-2">
                Wann automatisch gesendet wird, wann Freigabe greift und welche Guardrails aktiv sind.
              </p>
            </article>
            <article className="card-base p-5">
              <h2 className="h3">Sicherheit</h2>
              <p className="helper mt-2">
                Welche Qualitätschecks vor Auto-Versand laufen und wie Transparenz im Verlauf aussieht.
              </p>
            </article>
            <article className="card-base p-5">
              <h2 className="h3">Setup</h2>
              <p className="helper mt-2">
                Wie Sie starten, konservativ konfigurieren und Follow-ups kontrolliert aktivieren.
              </p>
            </article>
          </div>
        </Container>
      </section>

      <MarketingFAQ showDetailButton={false} />
      <FinalCTA />
    </PageShell>
  );
}
