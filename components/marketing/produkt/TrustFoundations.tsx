import Link from "next/link";
import { FileCheck2, ShieldCheck, Workflow, Clock3 } from "lucide-react";
import Container from "@/components/marketing/Container";

const pillars = [
  {
    title: "Klare Entscheidungsregeln",
    text: "Autopilot nur bei sauberem Objektbezug, vollständigen Angaben und prüfbarem Empfänger. Fehlt etwas, greift die Freigabe.",
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
    text: "Vor automatischem Versand greifen Qualitätschecks. Bei fehlenden Angaben, Risikosignalen oder unsicherem Rückkanal stoppt der Autopilot.",
    Icon: FileCheck2,
  },
];

export default function TrustFoundations() {
  return (
    <section id="vertrauen" className="py-20 md:py-28" data-tour="produkt-trust-block">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="max-w-[72ch]">
            <p className="section-kicker">Prüfbarer Betrieb</p>
            <h2 className="h2 mt-2">Woran Sie merken, dass Advaic kontrollierbar bleibt</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Auf dieser Seite sollten Sie eine belastbare Versandlogik sehen. Entscheidend ist, dass Auto,
              Freigabe, Verlauf und Unterlagen zusammenpassen.
            </p>
            <p className="helper mt-3">
              Wenn Sie diese vier Punkte sauber beantworten können, ist Advaic als Arbeitsprozess deutlich besser
              prüfbar als viele generische AI-Demos.
            </p>
          </div>

          <article className="card-base p-5">
            <p className="label">Vier Fragen für Ihre Produktprüfung</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                <span>Wann darf Auto überhaupt senden?</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                <span>Wann stoppt Advaic bewusst und schiebt in die Freigabe?</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                <span>Wo bleibt der Verlauf pro Nachricht sichtbar?</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                <span>Welche Unterlagen und Prüfseiten gibt es außerhalb der Demo?</span>
              </li>
            </ul>

            <div className="mt-5 grid gap-2">
              <Link href="/sicherheit" className="btn-secondary w-full justify-center">
                Sicherheitsseite lesen
              </Link>
              <Link href="/datenschutz" className="btn-secondary w-full justify-center">
                Datenschutz lesen
              </Link>
              <Link href="/preise" className="btn-secondary w-full justify-center">
                Preis prüfen
              </Link>
            </div>
          </article>
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
