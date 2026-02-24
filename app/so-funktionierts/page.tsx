import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import HowItWorks from "@/components/marketing/HowItWorks";
import StickyTour from "@/components/marketing/StickyTour";
import FinalCTA from "@/components/marketing/FinalCTA";

const flowDetails = [
  {
    title: "1. Eingang und Klassifizierung",
    body: "Advaic analysiert den Eingangskontext und trennt relevante Interessenten-Anfragen von Newslettern und sonstigen Nicht-Anfragen.",
  },
  {
    title: "2. Regel- und Qualitätslogik",
    body: "Die Nachricht durchläuft Auto/Freigabe/Ignorieren plus Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeitsprüfung.",
  },
  {
    title: "3. Versand oder Freigabe",
    body: "Nur klare Fälle werden automatisch versendet. Unklare Fälle gehen mit sauberem Kontext zur Freigabe an Sie.",
  },
  {
    title: "4. Optional: Follow-up Ablauf",
    body: "Wenn keine Antwort kommt, kann Advaic je nach Einstellung kontrollierte Follow-ups in Stufen planen und automatisch stoppen, sobald eine Antwort eingeht.",
  },
];

export default function SoFunktioniertsPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Prozess im Detail"
        title="So funktioniert Advaic Schritt für Schritt"
        description="Der Ablauf ist bewusst so aufgebaut, dass Sie Zeit sparen und gleichzeitig die Kontrolle über sensible Entscheidungen behalten."
        actions={
          <>
            <Link href="/produkt" className="btn-secondary">
              Zur Produktseite
            </Link>
            <Link href="/signup" className="btn-primary">
              Kostenlos testen
            </Link>
          </>
        }
      />

      <HowItWorks />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {flowDetails.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <StickyTour />
      <FinalCTA />
    </PageShell>
  );
}
