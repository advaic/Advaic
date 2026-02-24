import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import Container from "./Container";

const outcomes = [
  "Klare Fälle werden automatisch beantwortet.",
  "Unklare Fälle gehen strukturiert zur Freigabe.",
  "Jede Entscheidung bleibt nachvollziehbar dokumentiert.",
];

export default function Solution() {
  return (
    <section id="solution" className="py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-8 md:gap-12">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="h2">Advaic nimmt Ihnen die Inbox-Routine ab.</h2>
            <p className="body mt-6 text-[var(--muted)]">
              Advaic erkennt eingehende Interessenten-Anfragen und erstellt
              passende Antworten in Ihrem Stil.
            </p>
            <p className="body mt-4 text-[var(--muted)]">
              Der automatische Versand läuft nur bei klarer Datenlage und
              bestandenen Qualitätschecks.
            </p>
            <p className="body mt-4 text-[var(--muted)]">
              Sobald Unsicherheit entsteht, geht der Fall automatisch an Sie zur
              Freigabe.
            </p>
            <div className="mt-6">
              <Link href="/produkt" className="btn-secondary">
                Produkt im Detail
              </Link>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <article className="card-base p-6">
              <h3 className="h3">Ergebnis</h3>
              <ul className="mt-5 space-y-3">
                {outcomes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </Container>
    </section>
  );
}
