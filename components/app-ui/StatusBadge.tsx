import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { statusBadgeClass, type StatusTone } from "./status";

type StatusSize = "sm" | "md";

const sizeClasses: Record<StatusSize, string> = {
  sm: "px-2.5 py-1.5",
  md: "px-3 py-1.5",
};

type StatusBadgeProps = ComponentPropsWithoutRef<"span"> & {
  children: ReactNode;
  tone?: StatusTone;
  size?: StatusSize;
  icon?: ReactNode;
};

export default function StatusBadge({
  children,
  tone = "neutral",
  size = "md",
  icon,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "motion-transition app-text-badge inline-flex items-center gap-1 rounded-full border",
        statusBadgeClass(tone),
        sizeClasses[size],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
