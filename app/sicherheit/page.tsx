import Link from "next/link";
import Container from "@/components/marketing/Container";
import PageShell from "@/components/marketing/PageShell";
import PageIntro from "@/components/marketing/PageIntro";
import TransparencyBox from "@/components/marketing/TransparencyBox";
import Security from "@/components/marketing/Security";
import Guarantee from "@/components/marketing/Guarantee";
import FinalCTA from "@/components/marketing/FinalCTA";

const highlights = [
  {
    title: "Klare Filtergrenzen",
    text: "Nicht relevante Mails werden nicht automatisch beantwortet.",
  },
  {
    title: "Freigabe bei Unsicherheit",
    text: "Unsichere Fälle werden an Sie übergeben, bevor etwas gesendet wird.",
  },
  {
    title: "Volle Nachvollziehbarkeit",
    text: "Der Verlauf dokumentiert alle Schritte von Eingang bis Versand.",
  },
];

export default function SicherheitPage() {
  return (
    <PageShell>
      <PageIntro
        kicker="Sicherheit und Datenschutz"
        title="Transparenz, Kontrolle und klare Grenzen"
        description="Advaic ist so aufgebaut, dass Sie jederzeit nachvollziehen können, was automatisiert wird und was bewusst in Ihrer Entscheidung bleibt."
        actions={
          <>
            <Link href="/autopilot" className="btn-secondary">
              Autopilot-Regeln
            </Link>
            <Link href="/signup" className="btn-primary">
              Kostenlos testen
            </Link>
          </>
        }
      />

      <section className="marketing-section-clear py-20 md:py-28">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="card-base card-hover p-6">
                <h2 className="h3">{item.title}</h2>
                <p className="helper mt-3">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="card-base p-6">
              <h2 className="h3">Technische Schutzlogik</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Postfach-Anbindung per OAuth statt Passwortweitergabe</li>
                <li>Auto-Senden nur mit klarer Entscheidung und bestandenen Checks</li>
                <li>Fail-Safe: Bei Unsicherheit geht der Fall in die Freigabe</li>
              </ul>
            </article>
            <article className="card-base p-6">
              <h2 className="h3">Datenschutz und Nachvollziehbarkeit</h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                <li>Verlauf je Nachricht mit Status und Zeitstempel</li>
                <li>Freigabe-Inbox für sensible oder unklare Fälle</li>
                <li>Dokumentation und Exporte im Onboarding (keine Rechtsberatung)</li>
              </ul>
            </article>
          </div>
        </Container>
      </section>

      <TransparencyBox />
      <Security />
      <Guarantee />
      <FinalCTA />
    </PageShell>
  );
}
