import Link from "next/link";
import Container from "./Container";

const intents = [
  {
    title: "E-Mail-Automatisierung für Immobilienmakler",
    text: "Überblick für Makler, die Antwortzeiten verkürzen und Standardfälle sicher automatisieren möchten.",
    href: "/email-automatisierung-immobilienmakler",
  },
  {
    title: "Makler-Freigabe-Workflow",
    text: "Detailliert, wie Freigabe, Risiken und manuelle Entscheidungen in der Praxis organisiert sind.",
    href: "/makler-freigabe-workflow",
  },
  {
    title: "DSGVO & E-Mail-Autopilot",
    text: "Konkrete Übersicht zu Datenminimierung, Zugriffskontrolle und dokumentierbaren Prozessgrenzen.",
    href: "/dsgvo-email-autopilot",
  },
];

export default function SearchIntentTeaser() {
  return (
    <section id="suchintention" className="marketing-section-clear py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-[72ch]">
            <h2 className="h2">Vertiefende Einstiegsseiten nach Suchintention</h2>
            <p className="body mt-4 text-[var(--muted)]">
              Diese Seiten beantworten zentrale Entscheidungsfragen im Detail und führen gezielt in den passenden
              nächsten Schritt.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {intents.map((item) => (
            <article key={item.title} className="card-base card-hover p-6">
              <h3 className="h3">{item.title}</h3>
              <p className="helper mt-3">{item.text}</p>
              <Link href={item.href} className="btn-secondary mt-4">
                Seite öffnen
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
