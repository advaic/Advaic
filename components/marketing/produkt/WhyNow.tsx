import Container from "@/components/marketing/Container";

const bullets = [
  "Viele Anfragen sind Standardfragen (Besichtigung, Unterlagen, Verfügbarkeit).",
  "Manche Anfragen sind unklar oder heikel (Beschwerden, Sonderwünsche).",
  "Newsletter, Systemmails und sonstige Nicht-Anfragen erhöhen zusätzlich den Prüfaufwand.",
];

export default function WhyNow() {
  return (
    <section id="warum" className="produkt-band-surface-2 py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-8 md:gap-12">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="h2 max-w-[26ch]">Warum Anfragen heute so viel Zeit fressen</h2>
            <div className="mt-6 max-w-[68ch] space-y-4">
              <p className="body text-[var(--muted)]">
                Früher kamen Anfragen verteilt über den Tag. Heute starten viele Anfragen online — oft gleichzeitig.
              </p>
              <p className="body text-[var(--muted)]">
                Bei Miet- und mittelpreisigen Objekten sind viele Fragen ähnlich. Trotzdem müssen Sie alles lesen,
                sortieren und beantworten.
              </p>
              <p className="body text-[var(--muted)]">
                Das Ergebnis: Abends sitzen Sie im Postfach oder Sie antworten später, als Sie möchten.
              </p>
            </div>
            <p className="body mt-6 max-w-[68ch]">Advaic trennt diese Fälle sauber — und nimmt Ihnen die Routine ab.</p>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <article className="rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
              <ul className="space-y-3 text-sm text-[var(--muted)]">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{bullet}</span>
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
