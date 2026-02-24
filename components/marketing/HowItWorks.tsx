import Link from "next/link";
import Container from "./Container";

const steps = [
  {
    title: "E-Mail verbinden (OAuth)",
    text: "Sie verbinden Gmail oder Outlook sicher über OAuth.",
  },
  {
    title: "Ton & Stil festlegen",
    text: "Sie definieren, wie Advaic formuliert und wann Freigabe gilt.",
  },
  {
    title: "Autopilot aktivieren (optional)",
    text: "Klare Fälle laufen automatisch. Unklare Fälle bleiben bei Ihnen.",
  },
  {
    title: "Follow-ups konfigurieren (optional)",
    text: "Sie steuern Nachfass-Stufen und Abstände; bei Antwort stoppt der Ablauf automatisch.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="h2">So funktioniert es</h2>
          <Link href="/so-funktionierts" className="btn-secondary">
            Ablauf im Detail
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <article key={step.title} className="card-base card-hover p-6">
              <p className="label">Schritt {index + 1}</p>
              <h3 className="h3 mt-3">{step.title}</h3>
              <p className="helper mt-3">{step.text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
