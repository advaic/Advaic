import Container from "@/components/marketing/Container";
import Link from "next/link";

const flowSteps = [
  "Eingang prüfen",
  "Anfrage eindeutig?",
  "Qualitätschecks bestehen?",
  "Auto, Freigabe oder Ignorieren",
];

export default function PolicyRules() {
  return (
    <section id="regeln" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <p className="section-kicker">Schritt 2 von 5</p>
          <h2 className="h2 mt-2">Warum Advaic automatisch sendet oder bewusst stoppt</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Nach dem sichtbaren Ablauf kommt die eigentliche Entscheidungslogik: Auto, Freigabe oder Ignorieren.
          </p>
          <div className="mt-4">
            <Link href="/autopilot-regeln" className="btn-secondary">
              Entscheidungslogik im Detail
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-[var(--radius)] bg-white p-4 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {flowSteps.map((step, index) => (
              <div key={step} className="rounded-xl bg-[var(--surface-2)] p-3 ring-1 ring-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Schritt {index + 1}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <article className="card-hover relative overflow-hidden rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),rgba(201,162,39,0.1))]" />
            <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)] ring-1 ring-[var(--gold-soft)]">
              Auto
            </span>
            <h3 className="h3 mt-3">Automatisch senden (wenn klar)</h3>
            <p className="helper mt-3">Advaic sendet automatisch, wenn alle drei Punkte erfüllt sind:</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
              <li>Es ist eindeutig eine Interessenten-Anfrage.</li>
              <li>Objekt, Empfänger und Anliegen sind sauber zuordenbar.</li>
              <li>Es fehlen keine kritischen Informationen.</li>
            </ol>
            <p className="helper mt-4">Typische Auto-Fälle:</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li>Ist die Immobilie noch verfügbar?</li>
              <li>Kann ich einen Besichtigungstermin bekommen?</li>
              <li>Welche Unterlagen werden benötigt?</li>
              <li>Wie ist der Ablauf / nächste Schritte?</li>
            </ul>
          </article>

          <article className="card-hover relative overflow-hidden rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold-soft),rgba(201,162,39,0.05))]" />
            <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)] ring-1 ring-[var(--gold-soft)]">
              Freigabe
            </span>
            <h3 className="h3 mt-3">Zur Freigabe (bei Lücken, Konfliktpotenzial oder Risiko)</h3>
            <p className="helper mt-3">Advaic schickt zur Freigabe, wenn einer dieser Punkte zutrifft:</p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Anliegen mit zusätzlichem Klärungsbedarf</li>
              <li>Beschwerden, Konflikte oder sensible Inhalte</li>
              <li>Objektbezug unklar</li>
              <li>Wichtige Infos fehlen</li>
              <li>Technischer Absender ohne sicheren Rückkanal (z. B. no-reply ohne Reply-To)</li>
              <li>Prüfstatus reicht nicht für sicheren Auto-Versand</li>
            </ul>
          </article>

          <article className="card-hover relative overflow-hidden rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(11,15,23,0.45),rgba(11,15,23,0.08))]" />
            <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] ring-1 ring-[var(--border)]">
              Ignore
            </span>
            <h3 className="h3 mt-3">Ignorieren (kein Versand)</h3>
            <p className="helper mt-3">Advaic ignoriert:</p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Newsletter / Rundmails</li>
              <li>System- und Bounce-Mails (z. B. Mailer-Daemon)</li>
              <li>Werbung / Spam</li>
            </ul>
          </article>
        </div>
      </Container>
    </section>
  );
}
