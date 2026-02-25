import Link from "next/link";
import Container from "./Container";

const objections = [
  {
    question: "„Was, wenn Advaic etwas Falsches sendet?“",
    answer:
      "Advaic sendet nur automatisch, wenn der Fall klar ist und alle Checks bestanden sind. Bei Unsicherheit geht der Fall zur Freigabe.",
    href: "/qualitaetschecks",
    label: "Qualitätschecks ansehen",
  },
  {
    question: "„Ich will nicht, dass alles blind automatisiert wird.“",
    answer:
      "Der Standard ist ein kontrollierter Start mit mehr Freigaben. Den Automatisierungsgrad erhöhen Sie erst, wenn Ergebnisse stabil sind.",
    href: "/produkt#setup",
    label: "Safe-Start verstehen",
  },
  {
    question: "„Wie behalte ich die Kontrolle über Sonderfälle?“",
    answer:
      "Heikle, unklare oder konfliktbehaftete Nachrichten landen in der Freigabe-Inbox. Dort entscheiden Sie final.",
    href: "/freigabe-inbox",
    label: "Freigabe-Inbox ansehen",
  },
  {
    question: "„Was passiert bei no-reply, Newslettern oder Systemmails?“",
    answer:
      "Diese Nachrichten werden nicht automatisch beantwortet. Sie werden ignoriert oder bei Unsicherheit zur manuellen Prüfung markiert.",
    href: "/autopilot-regeln",
    label: "Regelmatrix öffnen",
  },
  {
    question: "„Kann ich Follow-ups stoppen?“",
    answer:
      "Ja. Follow-ups sind pausierbar und stoppen automatisch bei Antwort, Regelstopp oder Sicherheitsverletzung.",
    href: "/follow-up-logik",
    label: "Follow-up-Logik prüfen",
  },
  {
    question: "„Wie transparent ist das alles wirklich?“",
    answer:
      "Sie sehen pro Nachricht den Verlauf mit Status und Zeitstempeln: Eingang, Entscheidung, Freigabe und Versand.",
    href: "/sicherheit",
    label: "Sicherheitsseite öffnen",
  },
];

export default function ObjectionHandling() {
  return (
    <section id="einwaende" className="marketing-section-clear py-20 md:py-28">
      <Container>
        <div className="max-w-[72ch]">
          <h2 className="h2">Häufige Einwände, klar beantwortet</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Gute Entscheidungen entstehen nicht durch Marketingversprechen, sondern durch überprüfbare Antworten auf
            die kritischen Fragen im Makleralltag.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {objections.map((item) => (
            <article key={item.question} className="card-base card-hover p-6">
              <h3 className="text-base font-semibold text-[var(--text)]">{item.question}</h3>
              <p className="helper mt-3">{item.answer}</p>
              <Link href={item.href} className="btn-secondary mt-4">
                {item.label}
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
