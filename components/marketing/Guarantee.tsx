import { CheckCircle2 } from "lucide-react";
import Container from "./Container";

const points = [
  "Im Zweifel zur Freigabe",
  "Jederzeit pausierbar",
  "Voller Verlauf",
];

export default function Guarantee() {
  return (
    <section id="guarantee" className="py-20 md:py-28">
      <Container>
        <article className="card-base overflow-hidden">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,var(--gold),var(--gold-2))]" />
          <div className="p-8 md:p-10">
            <h2 className="h2">Sicherheitsgarantie</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Advaic ist so aufgebaut, dass im Zweifel nicht automatisch gesendet wird. Sie behalten die finale
              Kontrolle.
            </p>
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {points.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--gold)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </Container>
    </section>
  );
}
