import Link from "next/link";
import { Ban, CircleHelp, ShieldCheck } from "lucide-react";
import Container from "./Container";

const columns = [
  {
    title: "Auto senden (wenn klar)",
    icon: ShieldCheck,
    items: [
      "Echte Interessenten-Anfragen mit vollständigen Angaben",
      "Standardfragen zu Verfügbarkeit, Besichtigung und Unterlagen",
      "Klare Fälle mit niedrigem Risiko",
    ],
  },
  {
    title: "Zur Freigabe (wenn unklar)",
    icon: CircleHelp,
    items: [
      "Sonderfälle oder ungewöhnliche Anliegen",
      "Beschwerden oder heikle Themen",
      "Unklare Objektzuordnung oder fehlende Informationen",
      "Technischer Absender ohne sicheren Reply-To",
    ],
  },
  {
    title: "Ignorieren (kein Versand)",
    icon: Ban,
    items: [
      "Newsletter und Rundmails",
      "Systemmails und Mailer-Daemon",
      "Offensichtliche Werbung/Spam",
    ],
  },
];

export default function Rules() {
  return (
    <section id="rules" className="py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="h2">Autopilot-Regeln auf einen Blick</h2>
          <Link href="/autopilot-regeln" className="btn-secondary focus-ring">
            Regeln im Detail
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {columns.map((column) => (
            <article key={column.title} className="card-base card-hover p-6">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--gold-soft)]">
                <column.icon className="h-4 w-4 text-[var(--gold)]" />
              </div>
              <h3 className="h3 mt-4">{column.title}</h3>
              <ul className="mt-4 space-y-2">
                {column.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="body mt-6 text-[var(--muted)]">
          Im Zweifel geht es zur Freigabe – nicht in den Autopilot.
        </p>
      </Container>
    </section>
  );
}
