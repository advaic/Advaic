import Container from "@/components/marketing/Container";

const inboxItems = [
  {
    subject: "Objektbezug unklar",
    note: "Interessent fragt nach Verfügbarkeit ohne klare Objektangabe.",
  },
  {
    subject: "Beschwerde zur letzten Besichtigung",
    note: "Konfliktthema mit erhöhtem Risiko.",
  },
  {
    subject: "Sonderwunsch zur Unterlagenprüfung",
    note: "Ungewöhnlicher Fall mit zusätzlichem Klärungsbedarf.",
  },
];

export default function ApprovalInbox() {
  return (
    <section id="freigabe" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <h2 className="h2">Zur Freigabe: Ihre Sicherheits-Inbox</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Alles, was nicht eindeutig ist, landet hier. Sie können freigeben & senden, bearbeiten oder ablehnen.
          </p>
          <p className="body mt-4">
            Sie behalten bei Sonderfällen die Kontrolle — genau dort, wo menschliches Fingerspitzengefühl zählt.
          </p>
        </div>

        <div className="mt-10 rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-7">
          <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--border)]">
            Beispielansicht (nicht interaktiv)
          </span>
          <ul className="space-y-3">
            {inboxItems.map((item) => (
              <li
                key={item.subject}
                className="mt-3 rounded-xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--border)] md:flex md:items-center md:justify-between md:gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{item.subject}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.note}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
                  <button
                    type="button"
                    disabled
                    className="cursor-default rounded-lg bg-[var(--black)] px-3 py-2 text-xs font-semibold text-white shadow-sm"
                  >
                    Freigeben & senden
                  </button>
                  <button
                    type="button"
                    disabled
                    className="cursor-default rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--border)]"
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    disabled
                    className="cursor-default rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--border)]"
                  >
                    Ablehnen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
