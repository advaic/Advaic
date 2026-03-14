import Container from "@/components/marketing/Container";
import Link from "next/link";

const checkPhases = [
  {
    phase: "Phase 1",
    title: "Ist die Nachricht relevant und eindeutig?",
    lead: "Bevor Inhalte erzeugt werden, prüft Advaic zuerst den Eingangs-Kontext.",
    checks: [
      {
        title: "Relevanz-Check",
        purpose: "Verhindert Antworten auf Newsletter, Spam und Systemmails.",
        example: "Wenn ‘list-unsubscribe’ vorkommt, wird ignoriert.",
      },
      {
        title: "Kontext-Check",
        purpose: "Advaic nutzt nur Informationen, die wirklich vorhanden sind.",
        example: "Wenn keine Immobilie erkennbar ist, geht es zur Freigabe oder es wird nachgefragt.",
      },
    ],
  },
  {
    phase: "Phase 2",
    title: "Ist die Antwort fachlich und stilistisch sauber?",
    lead: "Dann bewertet Advaic Qualität und Ton der vorgeschlagenen Antwort.",
    checks: [
      {
        title: "Vollständigkeits-Check",
        purpose: "Wenn wichtige Infos fehlen, wird nicht ‘irgendwas’ behauptet.",
        example: "Wenn ‘Ist noch frei?’ kommt, aber die Immobilie unklar ist: Rückfrage oder Freigabe.",
      },
      {
        title: "Ton-&-Stil-Check",
        purpose: "Die Antwort klingt wie Sie — nicht wie eine KI.",
        example: "Wenn Sie kurze Sätze wollen, bleibt die Antwort kurz und klar.",
      },
    ],
  },
  {
    phase: "Phase 3",
    title: "Darf sicher versendet werden?",
    lead: "Erst nach Risiko- und Lesbarkeitsprüfung wird Versand freigegeben.",
    checks: [
      {
        title: "Risiko-Check (Fail-Safe)",
        purpose: "Bei niedriger Sicherheit wird nicht automatisch gesendet.",
        example: "Beschwerde oder Konfliktmail → Zur Freigabe.",
      },
      {
        title: "Lesbarkeits-Check",
        purpose: "Die Antwort bleibt verständlich und strukturiert.",
        example: "Klare nächste Schritte statt langer Textblöcke.",
      },
    ],
  },
];

export default function QualityChecks() {
  return (
    <section id="qualitaet" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <p className="section-kicker">Schritt 4 von 5</p>
          <h2 className="h2 mt-2">Welche Prüfungen vor jedem automatischen Versand greifen</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Erst wenn Relevanz, Kontext, Vollständigkeit, Ton, Risiko und Lesbarkeit sauber genug sind, wird Versand überhaupt erlaubt.
          </p>
          <div className="mt-4">
            <Link href="/qualitaetschecks" className="btn-secondary">
              Alle Checks mit Beispielen
            </Link>
          </div>
        </div>

        <div className="mt-10 space-y-5">
          {checkPhases.map((phase) => (
            <section
              key={phase.phase}
              className="rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-7"
            >
              <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
                <div className="lg:col-span-4">
                  <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--gold-soft)]">
                    {phase.phase}
                  </span>
                  <h3 className="h3 mt-3">{phase.title}</h3>
                  <p className="helper mt-2">{phase.lead}</p>
                </div>

                <div className="grid gap-4 lg:col-span-8 md:grid-cols-2">
                  {phase.checks.map((check) => (
                    <article
                      key={check.title}
                      className="card-hover rounded-xl bg-[var(--surface-2)] p-5 ring-1 ring-[var(--border)]"
                    >
                      <h4 className="text-[1.15rem] leading-[1.3] font-semibold tracking-[-0.01em] text-[var(--text)]">
                        {check.title}
                      </h4>
                      <p className="body mt-3 text-[var(--muted)]">
                        <strong className="text-[var(--text)]">Zweck:</strong> {check.purpose}
                      </p>
                      <div className="mt-3 h-px w-full bg-[var(--border)]" />
                      <p className="body mt-2 text-[var(--muted)]">
                        <strong className="text-[var(--text)]">Beispiel:</strong> {check.example}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}
