type DraftPanelProps = {
  subject: string;
  inbound: string;
  draft: string;
  editedSuffix?: string;
  showEditedSuffix?: boolean;
  footer?: string;
  compact?: boolean;
};

export default function DraftPanel({
  subject,
  inbound,
  draft,
  editedSuffix,
  showEditedSuffix = false,
  footer,
  compact = false,
}: DraftPanelProps) {
  return (
    <section
      data-ref="draft-panel"
      className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]"
    >
      <div className="mb-4 border-b border-[var(--border)] pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Entwurf</p>
        <p className="mt-1 text-[15px] font-semibold text-[var(--text)]">{subject}</p>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Interessent</p>
          <p className="text-[14px] leading-6 text-[var(--text)]">{inbound}</p>
        </div>

        <div className="rounded-xl border border-[rgba(201,162,39,0.45)] bg-[rgba(201,162,39,0.08)] p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Advaic Entwurf</p>
          <p className="text-[14px] leading-6 text-[var(--text)]">{draft}</p>
          {showEditedSuffix && editedSuffix ? (
            <p className="mt-2 border-t border-[rgba(201,162,39,0.4)] pt-2 text-[13px] leading-5 text-[var(--text)]">
              {editedSuffix}
            </p>
          ) : null}
        </div>
      </div>

      {footer ? (
        <p className={compact ? "mt-3 text-[12px] text-[var(--muted)]" : "mt-4 text-[12px] text-[var(--muted)]"}>{footer}</p>
      ) : null}
    </section>
  );
}
