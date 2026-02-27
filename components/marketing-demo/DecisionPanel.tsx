import { CheckCircle2, MinusCircle, TriangleAlert } from "lucide-react";
import type { ComponentType } from "react";
import type { DecisionState } from "@/components/marketing-demo/types";

type DecisionPanelProps = {
  selected: DecisionState;
  why: string;
  secondaryWhy?: string;
  large?: boolean;
  title?: string;
};

const OPTIONS: Array<{
  key: DecisionState;
  label: string;
  refId: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "auto", label: "Auto senden", refId: "decision-auto", icon: CheckCircle2 },
  { key: "approve", label: "Zur Freigabe", refId: "decision-approve", icon: TriangleAlert },
  { key: "ignore", label: "Ignorieren", refId: "decision-ignore", icon: MinusCircle },
];

function optionClass(isSelected: boolean, key: DecisionState) {
  if (!isSelected) {
    return "border-[var(--border)] bg-white text-[var(--muted)]";
  }
  if (key === "auto") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100";
  }
  if (key === "approve") {
    return "border-amber-200 bg-amber-50 text-amber-700 ring-2 ring-amber-100";
  }
  return "border-slate-200 bg-slate-100 text-slate-700 ring-2 ring-slate-200";
}

export default function DecisionPanel({
  selected,
  why,
  secondaryWhy,
  large = false,
  title = "Entscheidung",
}: DecisionPanelProps) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <h3 className={large ? "text-[24px] font-semibold tracking-[-0.01em] text-[var(--text)]" : "text-[20px] font-semibold text-[var(--text)]"}>
        {title}
      </h3>

      <div className="mt-4 space-y-2.5">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = option.key === selected;
          return (
            <div
              key={option.key}
              data-ref={option.refId}
              className={[
                "flex items-center justify-between rounded-xl border px-3 py-2.5 text-[14px] font-medium",
                optionClass(isSelected, option.key),
              ].join(" ")}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {option.label}
              </span>
              {isSelected ? <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Aktiv</span> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-[rgba(201,162,39,0.4)] bg-[rgba(201,162,39,0.1)] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Warum?</p>
        <p className="mt-1 text-[14px] text-[var(--text)]">{why}</p>
        {secondaryWhy ? <p className="mt-1 text-[13px] text-[var(--muted)]">{secondaryWhy}</p> : null}
      </div>
    </section>
  );
}
