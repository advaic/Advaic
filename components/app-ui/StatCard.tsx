import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
  compact?: boolean;
};

export default function StatCard({
  title,
  value,
  hint,
  icon,
  className,
  compact = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border app-surface-panel",
        compact ? "px-3 py-3 md:app-panel-padding" : "app-panel-padding",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="app-text-meta-label">{title}</div>
        {icon ? <div className="text-gray-600">{icon}</div> : null}
      </div>
      <div className="app-text-stat-value mt-2 text-gray-900">{value}</div>
      {hint ? (
        <div className={cn("app-text-helper mt-1", compact && "md:block")}>{hint}</div>
      ) : null}
    </div>
  );
}
