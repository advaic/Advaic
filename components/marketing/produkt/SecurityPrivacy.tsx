import Link from "next/link";
import Container from "@/components/marketing/Container";

export default function SecurityPrivacy() {
  return (
    <section id="sicherheit" className="produkt-band-surface py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <h2 className="h2">Klarer Zugriff. Klare Regeln. Klare Grenzen.</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Advaic arbeitet mit DSGVO-konformer Verarbeitungslogik: nicht auf beliebige E-Mails antworten, sondern
            nur auf echte Interessenten-Anfragen mit klarer Entscheidungslage.
          </p>
          <p className="body mt-4 text-[var(--muted)]">
            Nicht relevante E-Mails werden nicht automatisch beantwortet. Bei unklarem oder technischem Absender geht
            der Fall in die Freigabe, damit Sie die letzte Entscheidung treffen.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="card-hover rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <h3 className="text-[1.1rem] font-semibold tracking-[-0.01em] text-[var(--text)]">Technische Schutzebenen</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li>Postfach-Anbindung über OAuth (kein manuelles Passwort-Sharing).</li>
              <li>Agentenbezogene Trennung von Regeln, Entwürfen und Status.</li>
              <li>Fail-Safe-Logik: Bei Unsicherheit keine Auto-Antwort.</li>
            </ul>
          </article>

          <article className="card-hover rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <h3 className="text-[1.1rem] font-semibold tracking-[-0.01em] text-[var(--text)]">Nachvollziehbarkeit</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li>Verlauf mit Status und Zeitstempeln für jede Entscheidung.</li>
              <li>Freigabe-Inbox für alle unklaren oder risikoreichen Fälle.</li>
              <li>Verarbeitungsübersicht und Exporte im Onboarding.</li>
            </ul>
          </article>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <article className="card-hover rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <h3 className="h3">Ignoriert</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Newsletter / Rundmails</li>
              <li>System- und Bounce-Mails</li>
              <li>Werbung / Spam</li>
            </ul>
          </article>

          <article className="card-hover rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <h3 className="h3">Auto (klar)</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Eindeutige Interessenten-Anfrage</li>
              <li>Standard-Situation</li>
              <li>Keine kritischen Informationen fehlen</li>
            </ul>
          </article>

          <article className="card-hover rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <h3 className="h3">Freigabe (unklar)</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Sonderfälle oder ungewöhnliche Anliegen</li>
              <li>Beschwerden / Konflikte / heikle Themen</li>
              <li>Objektbezug unklar oder wichtige Infos fehlen</li>
              <li>no-reply ohne sicheren Reply-To</li>
            </ul>
          </article>
        </div>

        <p className="body mt-6 max-w-[70ch] text-[var(--muted)]">
          Für Follow-ups gelten zusätzliche Stop-Regeln: Wenn der Interessent zuletzt geantwortet hat, eine Pause aktiv
          ist oder die maximale Follow-up-Stufe erreicht wurde, stoppt Advaic automatisch.
        </p>

        <p className="helper mt-6">
          Im Onboarding erhalten Sie auf Anfrage die Dokumentation (z. B. AVV, TOM-Übersicht,
          Verarbeitungsübersicht sowie Export- und Löschprozess). Keine Rechtsberatung.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-[var(--radius)] bg-white p-4 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <h4 className="text-sm font-semibold text-[var(--text)]">Datenminimierung</h4>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Advaic verarbeitet nur die Inhalte, die für Erkennen, Entscheiden und Antworten in der
              Interessenten-Kommunikation
              erforderlich sind.
            </p>
          </article>
          <article className="rounded-[var(--radius)] bg-white p-4 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <h4 className="text-sm font-semibold text-[var(--text)]">Zugriffskontrolle</h4>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Zugriff ist rollen- und agentenbezogen getrennt. Änderungen und Versandstatus sind im Verlauf
              nachvollziehbar.
            </p>
          </article>
          <article className="rounded-[var(--radius)] bg-white p-4 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]">
            <h4 className="text-sm font-semibold text-[var(--text)]">Betroffenenrechte</h4>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Export- und Löschprozesse sind vorgesehen. Details zu Fristen und Umsetzung erhalten Sie im Onboarding.
            </p>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/datenschutz" className="link-subtle underline underline-offset-4">
            Datenschutz
          </Link>
          <Link href="/cookie-und-storage" className="link-subtle underline underline-offset-4">
            Cookie & Storage
          </Link>
          <Link href="/app/konto/loeschen" className="link-subtle underline underline-offset-4">
            Konto/Löschung
          </Link>
        </div>
      </Container>
    </section>
  );
}
