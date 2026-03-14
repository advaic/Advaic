import Link from "next/link";
import Container from "./Container";

const objections = [
  {
    question: "„Was, wenn Advaic etwas Falsches sendet?“",
    answer:
      "Advaic sendet nur automatisch, wenn Objektbezug, Empfänger, Inhalt und Qualitätschecks sauber passen. Bei fehlenden Angaben, Konfliktpotenzial oder Qualitätswarnung geht der Fall zur Freigabe.",
    href: "/einwaende/qualitaet",
    label: "Einwand Qualität",
  },
  {
    question: "„Ich will nicht, dass alles blind automatisiert wird.“",
    answer:
      "Der Standard ist ein kontrollierter Start mit hoher Freigabequote. Den Automatisierungsgrad erhöhen Sie erst, wenn die Ergebnisse stabil sind.",
    href: "/einwaende/kontrolle",
    label: "Einwand Kontrolle",
  },
  {
    question: "„Wie behalte ich die Kontrolle über Nachrichten mit Freigabebedarf?“",
    answer:
      "Beschwerden, rechtlich sensible Aussagen oder Nachrichten mit fehlenden Kerndaten landen in der Freigabe-Inbox. Dort entscheiden Sie final.",
    href: "/einwaende/kontrolle",
    label: "Freigabelogik im Detail",
  },
  {
    question: "„Wie datenschutzkonform ist der Betrieb?“",
    answer:
      "DSGVO-konformer Betrieb braucht Technik und Organisation: klare Zweckbindung, Zugriffsgrenzen und dokumentierte Prozesse.",
    href: "/einwaende/dsgvo",
    label: "Einwand DSGVO",
  },
  {
    question: "„Wie hoch ist der Einführungsaufwand wirklich?“",
    answer:
      "Advaic ist auf einen stufenweisen Start ausgelegt. Sie aktivieren nicht alles auf einmal, sondern beginnen mit den wichtigsten wiederkehrenden Erstantworten.",
    href: "/einwaende/aufwand",
    label: "Einwand Aufwand",
  },
  {
    question: "„Rechnet sich das wirtschaftlich?“",
    answer:
      "Die Entscheidung sollte auf KPI basieren: Zeitgewinn, Erstreaktionszeit, Freigabequote und Qualitätsstabilität.",
    href: "/einwaende/kosten",
    label: "Einwand Kosten",
  },
];

export default function ObjectionHandling() {
  return (
    <section id="einwaende" className="marketing-section-clear py-20 md:py-28">
      <Container>
        <div className="max-w-[72ch]">
          <h2 className="h2">Häufige Einwände, klar beantwortet</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Gute Entscheidungen entstehen nicht durch Versprechen, sondern durch überprüfbare Antworten auf die
            kritischen Fragen im Makleralltag.
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

        <article className="card-base mt-4 p-6">
          <h3 className="text-base font-semibold text-[var(--text)]">Alle Einwände in einer Übersicht</h3>
          <p className="helper mt-3">
            Für die Entscheidungsphase gibt es eine eigene Hub-Seite mit strukturierten Detailartikeln zu DSGVO,
            Kontrolle, Qualität, Aufwand und Kosten.
          </p>
          <Link href="/einwaende" className="btn-secondary mt-4">
            Zur Einwand-Übersicht
          </Link>
        </article>
      </Container>
    </section>
  );
}
