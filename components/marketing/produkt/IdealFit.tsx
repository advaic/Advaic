import Container from "@/components/marketing/Container";

export default function IdealFit() {
  return (
    <section id="fuerwen" className="py-20 md:py-28">
      <Container>
        <h2 className="h2">Für wen Advaic ideal ist</h2>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <h3 className="h3">Ideal für</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Solo-Makler & kleine Teams</li>
              <li>viele Anfragen</li>
              <li>Miet- und mittelpreisige Objekte</li>
            </ul>
          </article>

          <article className="rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <h3 className="h3">Nicht ideal, wenn</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>sehr wenige Anfragen</li>
              <li>jede Antwort muss immer vollständig individuell sein</li>
            </ul>
          </article>
        </div>
      </Container>
    </section>
  );
}
