import type { TimelineEvent } from "@/components/marketing-demo/types";

type TimelinePanelProps = {
  title?: string;
  events: TimelineEvent[];
  footer?: string;
  large?: boolean;
};

function toneClass(tone: TimelineEvent["tone"]) {
  if (tone === "ok") return "bg-emerald-500";
  if (tone === "warn") return "bg-amber-500";
  return "bg-slate-400";
}

export default function TimelinePanel({
  title = "Verlauf",
  events,
  footer,
  large = false,
}: TimelinePanelProps) {
  return (
    <section
      data-ref="timeline-panel"
      className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]"
    >
      <h3 className={large ? "text-[24px] font-semibold tracking-[-0.01em] text-[var(--text)]" : "text-[20px] font-semibold text-[var(--text)]"}>
        {title}
      </h3>

      <ol className="mt-4 space-y-3">
        {events.map((event) => (
          <li key={`${event.time}-${event.label}`} className="flex items-start gap-3">
            <span className={[
              "mt-[5px] inline-block h-2.5 w-2.5 rounded-full",
              toneClass(event.tone),
            ].join(" ")} />
            <div className="min-w-0 flex-1 border-b border-[var(--border)] pb-2 last:border-b-0 last:pb-0">
              <p className="font-mono text-[12px] text-[var(--muted)]">{event.time}</p>
              <p className="text-[14px] text-[var(--text)]">{event.label}</p>
            </div>
          </li>
        ))}
      </ol>

      {footer ? <p className="mt-4 text-[12px] text-[var(--muted)]">{footer}</p> : null}
    </section>
  );
}
