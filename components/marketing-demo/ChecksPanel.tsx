import { Check, Circle, TriangleAlert } from "lucide-react";

type ChecksPanelProps = {
  progress: number;
  result?: "auto" | "approve";
  resultLabel?: string;
  whyLabel?: string;
  contextHint?: string;
  riskUnsafe?: boolean;
};

const CHECKS = ["Relevanz", "Kontext", "Vollständigkeit", "Ton & Stil", "Risiko", "Lesbarkeit"];

export default function ChecksPanel({
  progress,
  result,
  resultLabel,
  whyLabel,
  contextHint,
  riskUnsafe = false,
}: ChecksPanelProps) {
  const doneCount = Math.max(0, Math.min(6, progress));

  return (
    <section
      data-ref="checks-panel"
      className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]"
    >
      <h3 className="text-[20px] font-semibold text-[var(--text)]">Qualitätschecks</h3>

      <div className="mt-4 space-y-2.5">
        {CHECKS.map((check, index) => {
          const isDone = index < doneCount;
          const isActive = index === doneCount && doneCount < CHECKS.length;
          const isRiskUnsafe = riskUnsafe && check === "Risiko";

          return (
            <div
              key={check}
              className={[
                "flex items-center justify-between rounded-lg border px-3 py-2 text-[13px]",
                isRiskUnsafe
                  ? "border-amber-200 bg-amber-50"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50"
                    : isActive
                      ? "border-[rgba(201,162,39,0.45)] bg-[rgba(201,162,39,0.1)]"
                      : "border-[var(--border)] bg-[var(--surface-2)]",
              ].join(" ")}
            >
              <span className="font-medium text-[var(--text)]">{check}</span>
              {isRiskUnsafe ? (
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-700">
                  <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                  unsicher
                </span>
              ) : isDone ? (
                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      {contextHint ? (
        <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[12px] text-[var(--muted)]">
          {contextHint}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <span
            className={[
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold",
              result === "auto"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            {resultLabel || (result === "auto" ? "Auto-Versand erlaubt" : "Zur Freigabe")}
          </span>
          {whyLabel ? <p className="mt-2 text-[12px] text-[var(--muted)]">{whyLabel}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
