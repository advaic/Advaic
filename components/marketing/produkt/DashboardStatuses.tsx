import Container from "@/components/marketing/Container";

const statuses = [
  {
    name: "Auto gesendet",
    detail: "Klare Anfrage, sicher beantwortet.",
    toneClass: "ring-[var(--gold-soft)] bg-[var(--surface-2)]",
  },
  {
    name: "Zur Freigabe",
    detail: "Unklar, heikel oder wichtige Infos fehlen.",
    toneClass: "ring-[var(--gold-soft)] bg-[var(--surface-2)]",
  },
  {
    name: "Ignoriert",
    detail: "Newsletter, Spam oder Systemmails.",
    toneClass: "ring-[var(--border)] bg-[var(--surface-2)]",
  },
  {
    name: "Fehlgeschlagen",
    detail: "Nicht gesendet. Sie können prüfen und erneut senden.",
    toneClass: "ring-[var(--border)] bg-[var(--surface-2)]",
  },
];

export default function DashboardStatuses() {
  return (
    <section id="dashboard" className="py-20 md:py-28">
      <Container>
        <div className="max-w-[70ch]">
          <h2 className="h2">Was Sie im Dashboard sehen</h2>
          <p className="body mt-4 text-[var(--muted)]">
            Sie sollen jederzeit nachvollziehen können, was passiert ist — ohne zu suchen.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statuses.map((status) => (
            <article
              key={status.name}
              className="card-hover rounded-[var(--radius)] bg-white p-5 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)]"
            >
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold text-[var(--text)] ring-1 ${status.toneClass}`}
              >
                {status.name}
              </span>
              <p className="helper mt-3">{status.detail}</p>
            </article>
          ))}
        </div>

        <p className="body mt-6">So bleibt alles transparent, auch wenn Autopilot aktiv ist.</p>

        <div className="mt-8 rounded-[var(--radius)] bg-white p-6 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] md:p-7">
          <h3 className="h3">Zusätzlich bei Follow-ups</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <p className="rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]">
              <strong className="text-[var(--text)]">Wartet/Geplant:</strong> Das nächste Nachfassen ist terminiert,
              solange keine Antwort vom Interessenten vorliegt.
            </p>
            <p className="rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)] ring-1 ring-[var(--border)]">
              <strong className="text-[var(--text)]">Gesendet/Pausiert:</strong> Sie sehen, ob ein Follow-up
              verschickt wurde oder bewusst pausiert ist.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
