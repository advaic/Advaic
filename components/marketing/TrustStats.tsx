import Container from "./Container";

const stats = [
  {
    value: "3",
    title: "klare Entscheidungswege je Nachricht",
    description:
      "Jede Nachricht wird in genau einen Pfad eingeordnet: Auto, Freigabe oder Ignorieren.",
  },
  {
    value: "6",
    title: "Qualitätschecks vor Auto-Versand",
    description:
      "Relevanz, Kontext, Vollständigkeit, Ton & Stil, Risiko und Lesbarkeit werden vor dem Versand geprüft.",
  },
  {
    value: "0,97",
    title: "Standard-Sicherheitsniveau im Autopilot",
    description:
      "Der Auto-Sendeprozess nutzt standardmäßig eine hohe Mindest-Sicherheit und stoppt bei Unsicherheit.",
  },
  {
    value: "2",
    title: "konfigurierbare Follow-up-Stufen",
    description:
      "Follow-ups sind steuerbar (z. B. 24 h und 72 h) und stoppen automatisch, sobald eine Antwort eingeht.",
  },
];

export default function TrustStats() {
  return (
    <section id="proof" className="marketing-section-clear py-20 md:py-28">
      <Container>
        <h2 className="h2">Verifizierbare Produktfakten statt Marketing-Floskeln</h2>
        <p className="body mt-4 max-w-[70ch] text-[var(--muted)]">
          Die folgenden Punkte basieren direkt auf der aktuellen Systemlogik von Advaic und sind keine externen
          Schätzwerte.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <article key={item.value + item.title} className="card-base card-hover p-5">
              <p className="text-3xl font-semibold tracking-[-0.02em] text-[var(--text)]">{item.value}</p>
              <p className="mt-3 text-sm font-medium text-[var(--text)]">{item.title}</p>
              <p className="helper mt-2">{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
