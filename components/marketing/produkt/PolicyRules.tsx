import Container from "@/components/marketing/Container";
import { Ban, CircleHelp, ShieldCheck } from "lucide-react";
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
          <h2 className="h2">Wann Advaic automatisch sendet — und wann nicht</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Das ist der wichtigste Teil. Damit Sie immer wissen, was passiert.
          </p>
          <div className="mt-4">
            <Link href="/autopilot-regeln" className="btn-secondary">
              Entscheidungslogik im Detail
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-[var(--radius)] bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">
            Entscheidungslogik in Kurzform: Erst wird geprüft, ob es eine echte Anfrage ist. Danach wird nach klaren
            Regeln zwischen Autopilot, Freigabe oder Ignorieren entschieden. Vor jedem Auto-Versand greifen
            zusätzliche Qualitätschecks.
          </p>
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
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--gold-soft)]">
              <ShieldCheck className="h-4 w-4 text-[var(--gold)]" />
            </div>
            <h3 className="h3 mt-3">Automatisch senden (wenn klar)</h3>
            <p className="helper mt-3">Advaic sendet automatisch, wenn alle drei Punkte erfüllt sind:</p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
              <li>Es ist eindeutig eine Interessenten-Anfrage.</li>
              <li>Es ist eine Standard-Situation.</li>
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
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--gold-soft)]">
              <CircleHelp className="h-4 w-4 text-[var(--gold)]" />
            </div>
            <h3 className="h3 mt-3">Zur Freigabe (wenn unklar oder riskant)</h3>
            <p className="helper mt-3">Advaic schickt zur Freigabe, wenn einer dieser Punkte zutrifft:</p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Sonderfälle oder ungewöhnliche Anliegen</li>
              <li>Beschwerden / Konflikte / heikle Themen</li>
              <li>Objektbezug unklar</li>
              <li>Wichtige Infos fehlen</li>
              <li>Technischer Absender ohne sicheren Rückkanal (z. B. no-reply ohne Reply-To)</li>
              <li>Niedrige Sicherheit</li>
            </ul>
          </article>

          <article className="card-hover relative overflow-hidden rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(11,15,23,0.45),rgba(11,15,23,0.08))]" />
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--border)]">
              <Ban className="h-4 w-4 text-[var(--muted)]" />
            </div>
            <h3 className="h3 mt-3">Ignorieren (kein Versand)</h3>
            <p className="helper mt-3">Advaic ignoriert:</p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Newsletter / Rundmails</li>
              <li>System- und Bounce-Mails (z. B. Mailer-Daemon)</li>
              <li>Werbung / Spam</li>
            </ul>
          </article>
        </div>

        <p className="body mt-6">
          Im Zweifel geht es zur Freigabe — nicht in den Autopilot. Das gilt besonders bei unklarem Empfänger oder
          unsicherem Rückkanal. In der Freigabe versenden Sie erst nach Ihrer finalen Entscheidung.
        </p>
      </Container>
    </section>
  );
}
