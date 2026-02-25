import { FileCheck2, ShieldCheck, Workflow, Clock3 } from "lucide-react";
import Container from "@/components/marketing/Container";

const pillars = [
  {
    title: "Klare Entscheidungsregeln",
    text: "Autopilot nur bei klaren Standardfällen. Unklare Fälle gehen in die Freigabe.",
    Icon: Workflow,
  },
  {
    title: "Nachvollziehbarer Verlauf",
    text: "Jeder Schritt bleibt sichtbar: Eingang, Entscheidung, Versand mit Status und Zeitstempel.",
    Icon: Clock3,
  },
  {
    title: "DSGVO-konforme Prozesse",
    text: "Verarbeitung, Rollen und Nachweise sind auf DSGVO-Anforderungen ausgerichtet. AVV/TOM und Exporte erhalten Sie im Onboarding.",
    Icon: ShieldCheck,
  },
  {
    title: "Fail-Safe vor Auto-Versand",
    text: "Vor automatischem Versand greifen Qualitätschecks. Bei Unsicherheit stoppt der Autopilot.",
    Icon: FileCheck2,
  },
];

export default function TrustFoundations() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <div className="max-w-[72ch]">
          <h2 className="h2">Vertrauen entsteht durch klare Regeln, nicht durch Buzzwords</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Deshalb zeigt Advaic nicht nur Ergebnisse, sondern die zugrunde liegende Entscheidungslogik. Sie wissen
            jederzeit, warum automatisch gesendet wurde, warum etwas in der Freigabe landet oder warum eine E-Mail
            ignoriert wurde.
          </p>
          <p className="helper mt-2">
            Aktuell gibt es noch keine veröffentlichten Kundenbeispiele. Diese Seite zeigt deshalb bewusst konkrete
            Produktmechanik statt unkonkreter Erfolgszahlen.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] transition hover:-translate-y-[2px] hover:shadow-[var(--shadow-md)] hover:ring-[rgba(11,15,23,.16)]"
            >
              <pillar.Icon className="h-5 w-5 text-[var(--gold)]" />
              <h3 className="mt-3 text-[1.15rem] font-semibold leading-[1.25] tracking-[-0.01em] text-[var(--text)]">
                {pillar.title}
              </h3>
              <p className="helper mt-3">{pillar.text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
