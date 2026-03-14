import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("w-full rounded-2xl border app-surface-muted p-6 text-center", className)}>
      <div className="app-text-section-title text-gray-900">{title}</div>
      {description ? <div className="app-text-helper mt-2">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
