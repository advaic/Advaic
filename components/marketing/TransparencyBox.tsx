import Container from "./Container";

const leftPoints = [
  "Advaic prüft eingehende E-Mails auf echte Interessenten-Signale.",
  "Newsletter, Systemmails und Spam werden nicht automatisch beantwortet.",
  "Technische no-reply Absender ohne Reply-To werden zuerst geprüft.",
  "Erstantworten mit sauberem Objektbezug können automatisch beantwortet werden.",
  "Nachrichten mit fehlenden Angaben oder Risikosignalen gehen automatisch zur Freigabe.",
  "Jeder Schritt ist im Verlauf sichtbar.",
];

export default function TransparencyBox() {
  return (
    <section id="transparency" className="py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-12 gap-8 md:gap-12">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="h2">Was passiert mit Ihrem Postfach?</h2>
            <p className="body mt-5 text-[var(--muted)]">
              Sie sehen jederzeit klar, worauf Advaic reagiert und was bewusst
              nicht automatisiert wird.
            </p>
            <ul className="mt-5 space-y-2">
              {leftPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <article className="card-base p-6">
              <h3 className="h3">Policy-Überblick</h3>
              <div className="mt-5 space-y-3 text-sm">
                <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                  <strong>Auto-Senden:</strong> klare Interessenten-Anfragen
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                  <strong>Freigabe:</strong> fehlende Angaben, Konflikte oder sensible Aussagen
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-[var(--text)] ring-1 ring-[var(--border)]">
                  <strong>Ignorieren:</strong> Newsletter, Systemmails, Spam
                </div>
              </div>
            </article>
          </div>
        </div>
      </Container>
    </section>
  );
}
