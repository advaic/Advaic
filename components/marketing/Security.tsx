import Link from "next/link";
import Container from "./Container";

const ignored = [
  "Newsletter",
  "Systemmails",
  "Offensichtliche Werbung und Spam",
];

const checkFirst = [
  "Technische no-reply Absender ohne nutzbaren Rückkanal",
];

const auto = [
  "Echte Interessenten-Anfragen",
  "Standardfragen zu Verfügbarkeit",
  "Typische Rückfragen zu Besichtigungen und Unterlagen",
  "Fälle mit klarem Objektbezug und vollständigem Kontext",
];

const approval = [
  "Sonderfälle und ungewöhnliche Anliegen",
  "Beschwerden und Konfliktthemen",
  "Unklarer Objektbezug",
  "Fehlende Pflichtinformationen",
];

export default function Security() {
  return (
    <section id="security" className="marketing-section-cool py-20 md:py-28">
      <Container>
        <h2 className="h2">Sicherheit und Datenschutz</h2>
        <p className="body mt-4 max-w-3xl text-[var(--muted)]">
          Klarer Zugriff, klare Regeln, klare Grenzen. Sie sehen jederzeit, wie Advaic entscheidet und wann bewusst
          manuelle Freigabe greift.
        </p>
        <div className="mt-6">
          <Link href="/sicherheit" className="btn-secondary">
            Sicherheitsdetails ansehen
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <article className="card-base card-hover p-6">
            <h3 className="h3">Ignoriert</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {ignored.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base card-hover p-6">
            <h3 className="h3">Auto beantwortet (wenn klar)</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {auto.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card-base card-hover p-6">
            <h3 className="h3">Zur Freigabe/Prüfung</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              {approval.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
              {checkFirst.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <p className="helper mt-6">
          Dokumentation und Exportmöglichkeiten erhalten Sie im Onboarding. Diese Seite bietet keine Rechtsberatung.
        </p>
      </Container>
    </section>
  );
}
