import type { DemoInboxItem, DemoStatus } from "@/components/marketing-demo/types";

type InboxListProps = {
  title?: string;
  subtitle?: string;
  items: DemoInboxItem[];
  activeId?: string;
  compact?: boolean;
  showActions?: boolean;
};

function statusClass(status: DemoStatus) {
  if (status === "Auto gesendet" || status === "Freigegeben & gesendet") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "Zur Freigabe") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "Ignoriert") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  if (status === "Eskalation") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function priorityClass(priority: DemoInboxItem["priority"]) {
  if (priority === "Hoch") return "bg-rose-50 text-rose-700 border border-rose-200";
  if (priority === "Mittel") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

export default function InboxList({
  title = "Interessenten-Postfach",
  subtitle,
  items,
  activeId,
  compact = false,
  showActions = true,
}: InboxListProps) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-4">
        <h3 className="text-[20px] font-semibold tracking-[-0.01em] text-[var(--text)]">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
      </div>

      <div className={compact ? "space-y-3" : "space-y-4"}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <article
              key={item.id}
              data-ref={item.refId}
              className={[
                "rounded-[var(--radius)] border bg-white px-4 py-3 shadow-[var(--shadow-sm)] transition",
                isActive
                  ? "border-[rgba(201,162,39,0.6)] ring-2 ring-[var(--gold-soft)]"
                  : "border-[var(--border)]",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)]">
                    {item.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-[var(--text)]">{item.name}</p>
                    <p className="truncate text-[12px] text-[var(--muted)]">{item.email}</p>
                  </div>
                </div>

                <span
                  className={[
                    "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    statusClass(item.status),
                  ].join(" ")}
                >
                  {item.status}
                </span>
              </div>

              <p className="mt-2 text-[13px] leading-5 text-[var(--text)]">{item.snippet}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {item.category ? (
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
                    {item.category}
                  </span>
                ) : null}
                <span className={[
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  priorityClass(item.priority),
                ].join(" ")}>
                  {item.priority}
                </span>
              </div>

              {showActions ? (
                <div className="mt-3 flex items-center gap-2">
                  {item.primaryAction ? (
                    <button
                      type="button"
                      className="rounded-lg bg-[var(--black)] px-3 py-1.5 text-[12px] font-semibold text-white shadow-[var(--shadow-sm)]"
                    >
                      {item.primaryAction}
                    </button>
                  ) : null}
                  {item.secondaryAction ? (
                    <button
                      type="button"
                      className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--text)]"
                    >
                      {item.secondaryAction}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
