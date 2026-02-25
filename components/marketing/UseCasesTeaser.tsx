import Link from "next/link";
import Container from "./Container";

const cases = [
  {
    title: "Vermietung in Ballungsräumen",
    text: "Wenn viele ähnliche Anfragen in kurzer Zeit eintreffen und schnelle Erstreaktionen entscheidend sind.",
    href: "/branchen/vermietung-ballungsraum",
  },
  {
    title: "Kleine Maklerbüros",
    text: "Wenn Postfacharbeit Zeit frisst und klare Routinen automatisiert werden sollen, ohne die Kontrolle abzugeben.",
    href: "/branchen/kleine-maklerbueros",
  },
  {
    title: "Neubau-Vertrieb",
    text: "Wenn viele Projektanfragen parallel laufen und schnelle, konsistente Erstinformationen gebraucht werden.",
    href: "/branchen/neubau-vertrieb",
  },
  {
    title: "Mittelpreisige Objekte",
    text: "Wenn Verfügbarkeit, Unterlagen und Besichtigungstermine besonders häufig wiederkehren.",
    href: "/use-cases/mittelpreisige-objekte",
  },
];

export default function UseCasesTeaser() {
  return (
    <section id="use-cases" className="marketing-section-clear py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-[72ch]">
            <h2 className="h2">Anwendungsfälle aus dem Makleralltag</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Keine abstrakten Versprechen: Hier sehen Sie, in welchen realen Situationen Advaic besonders sinnvoll ist
              und wo Grenzen liegen.
            </p>
          </div>
          <Link href="/branchen" className="btn-secondary">
            Alle Branchenprofile
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cases.map((item) => (
            <article key={item.title} className="card-base card-hover p-6">
              <h3 className="h3">{item.title}</h3>
              <p className="helper mt-3">{item.text}</p>
              <Link href={item.href} className="btn-secondary mt-4">
                Details ansehen
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
