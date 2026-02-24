import { Eye, Power, Send } from "lucide-react";
import Container from "./Container";

const cards = [
  {
    title: "Autopilot EIN/AUS (Notbremse)",
    text: "Sie können den Autopilot jederzeit pausieren und direkt manuell übernehmen.",
    Icon: Power,
  },
  {
    title: "Verlauf & Status: Eingang → Entscheidung → Versand",
    text: "Jeder Schritt bleibt mit Zeitstempel dokumentiert und nachvollziehbar.",
    Icon: Eye,
  },
  {
    title: "Antworten laufen über Ihr eigenes Postfach",
    text: "Die Kommunikation bleibt in Ihrem Kanal und in Ihrem Markenauftritt.",
    Icon: Send,
  },
];

export default function Control() {
  return (
    <section id="control" className="py-20 md:py-28">
      <Container>
        <h2 className="h2">Kontrolle und Transparenz</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="card-base card-hover p-6">
              <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2">
                <card.Icon className="h-4 w-4 text-[var(--gold)]" />
              </div>
              <h3 className="h3 mt-4">{card.title}</h3>
              <p className="helper mt-3">{card.text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
