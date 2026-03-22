import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import Container from "./Container";

const checks = [
  {
    title: "Relevanz-Check",
    detail: "Newsletter, Spam und Systemmails werden nicht automatisch beantwortet.",
  },
  {
    title: "Kontext-Check",
    detail: "Advaic nutzt nur Informationen, die in der Nachricht und im Kontext vorhanden sind.",
  },
  {
    title: "Vollständigkeits-Check",
    detail: "Fehlende Pflichtinformationen führen zu Rückfrage oder Freigabe statt spekulativer Antwort.",
  },
  {
    title: "Ton-&-Stil-Check",
    detail: "Antworten folgen Ihrem hinterlegten Stil, damit Kommunikation konsistent bleibt.",
  },
  {
    title: "Risiko-Check (Fail-Safe)",
    detail: "Bei fehlenden Angaben, Konfliktthemen oder anderen Risikoindikatoren stoppt der Auto-Versand und geht in die Freigabe.",
  },
  {
    title: "Lesbarkeits-Check",
    detail: "Antworten bleiben klar strukturiert und handlungsorientiert.",
  },
];

export default function QualityChecks() {
  return (
    <section id="quality" className="marketing-soft-cool py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="h2">Vor jedem Versand laufen Qualitätschecks</h2>
          <Link href="/qualitaetschecks" className="btn-secondary">
            Checks im Detail
          </Link>
        </div>
        <p className="body mt-4 max-w-[70ch] text-[var(--muted)]">
          Damit Autopilot im Alltag sicher nutzbar bleibt, wird jede automatisch gesendete Antwort vor dem Versand in
          mehreren Schritten geprüft.
        </p>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {checks.map((check) => (
            <article key={check.title} className="card-base card-hover p-5">
              <p className="text-sm font-semibold text-[var(--text)]">{check.title}</p>
              <p className="helper mt-2">{check.detail}</p>
            </article>
          ))}
        </div>
        <p className="body mt-8 flex items-start gap-2 text-[var(--muted)]">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[var(--gold)]" />
          <span>
            Wenn Objektbezug, Inhalt oder Versandfreigabe nicht sauber passen, landet die Nachricht bei Ihnen statt
            beim Interessenten.
          </span>
        </p>
      </Container>
    </section>
  );
}
