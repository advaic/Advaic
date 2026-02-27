type ApprovalPanelProps = {
  sent: boolean;
  editing: boolean;
  why: string;
};

export default function ApprovalPanel({ sent, editing, why }: ApprovalPanelProps) {
  const status = sent ? "Freigegeben & gesendet" : "Zur Freigabe";

  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-[var(--text)]">Freigabe-Inbox</h3>
        <span
          className={[
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold",
            sent
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {status}
        </span>
      </div>

      <div data-ref="approve-why" className="mt-4 rounded-xl border border-[rgba(201,162,39,0.4)] bg-[rgba(201,162,39,0.1)] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Warum hier?</p>
        <p className="mt-1 text-[14px] text-[var(--text)]">{why}</p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          data-ref="approve-edit"
          className={[
            "rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--text)]",
            editing ? "ring-2 ring-[var(--gold-soft)]" : "",
          ].join(" ")}
        >
          Bearbeiten
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[13px] font-semibold text-[var(--text)]"
        >
          Ablehnen
        </button>
        <button
          type="button"
          data-ref="approve-send"
          className="rounded-lg bg-[var(--black)] px-3 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-sm)]"
        >
          Freigeben & senden
        </button>
      </div>
    </section>
  );
}
