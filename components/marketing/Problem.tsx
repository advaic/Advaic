import { AlertCircle } from "lucide-react";
import Container from "./Container";

const symptoms = [
  "Anfragen kommen gebündelt statt gleichmäßig.",
  "Ein großer Teil der Antworten wiederholt sich.",
  "Sonderfälle und Routine landen im selben Postfach.",
];

export default function Problem() {
  return (
    <section id="problem" className="marketing-section-warm py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-8 md:gap-12">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="h2">Ihr Postfach frisst Ihren Feierabend.</h2>
            <p className="body mt-6 text-[var(--muted)]">
              Interessenten-Anfragen treffen oft gleichzeitig ein. Dadurch verschiebt sich Arbeit in den Abend, obwohl
              viele Antworten standardisierbar sind.
            </p>
            <p className="body mt-4 text-[var(--muted)]">
              Ohne klaren Entscheidungsfluss entsteht ein permanenter Reaktionsmodus: erst sortieren, dann schreiben,
              dann nachfassen.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <article className="card-base p-6">
              <h3 className="h3">Typische Symptome</h3>
              <ul className="mt-5 space-y-3">
                {symptoms.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
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
