import Link from "next/link";
import Container from "@/components/marketing/Container";

const guardrails = [
  "Nur wenn Follow-ups aktiv sind (global, pro Lead und optional pro Objekt).",
  "Nur wenn der Interessent zuletzt nicht geantwortet hat.",
  "Bei Pause oder Stopp wird nichts gesendet.",
  "Vor Versand laufen dieselben Qualitätsprüfungen wie bei normalen Antworten.",
  "Wenn QA oder Sicherheit nicht passt, geht es zur Freigabe statt in den Autopilot.",
];

const stopCases = [
  "Der Interessent hat geantwortet (Ablauf stoppt sofort).",
  "Die maximale Follow-up-Stufe ist erreicht.",
  "Autopilot oder Follow-ups wurden pausiert.",
];

export default function FollowUps() {
  return (
    <section id="followups" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[72ch]">
          <h2 className="h2">Wenn keine Antwort kommt: kontrollierte Follow-ups</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Advaic kann Nachfass-Nachrichten automatisch planen. Das Ziel ist nicht mehr Druck, sondern ein klarer,
            verlässlicher Prozess: freundlich erinnern, sauber dokumentieren, rechtzeitig stoppen.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-12 gap-8 md:gap-12">
          <article className="col-span-12 rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] lg:col-span-7 md:p-7">
            <h3 className="h3">Ablauf in Stufen (konfigurierbar)</h3>
            <div className="mt-5 space-y-4">
              <div className="card-hover rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Stufe 1: Erster Reminder</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Nach einer konfigurierten Wartezeit (häufig 24 Stunden) kann eine kurze, höfliche Erinnerung
                  versendet werden.
                </p>
              </div>
              <div className="card-hover rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)]">Stufe 2: Zweites Nachfassen</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Falls weiter keine Antwort eingeht, kann ein zweites Follow-up nach weiterer Wartezeit folgen
                  (häufig 72 Stunden).
                </p>
              </div>
            </div>
            <p className="helper mt-4">
              Anzahl und Timing sind steuerbar. In den Einstellungen sind bis zu zwei Follow-up-Stufen vorgesehen.
            </p>
          </article>

          <article className="col-span-12 rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] lg:col-span-5 md:p-7">
            <h3 className="h3">Sicherheitslogik für Follow-ups</h3>
            <ul className="mt-5 space-y-3">
              {guardrails.map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--text)]">Wann stoppt ein Follow-up automatisch?</p>
              <ul className="mt-3 space-y-2">
                {stopCases.map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/app/follow-ups" className="btn-secondary">
            Follow-up-Inbox ansehen
          </Link>
          <Link href="/app/follow-ups/settings" className="btn-secondary">
            Follow-up-Regeln öffnen
          </Link>
        </div>
      </Container>
    </section>
  );
}
