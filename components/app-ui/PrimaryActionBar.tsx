import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PrimaryActionBarProps = {
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "className">;

export default function PrimaryActionBar({
  leading,
  trailing,
  className,
  ...props
}: PrimaryActionBarProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border app-surface-panel app-panel-padding-compact flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
        className,
      )}
      {...props}
    >
      {leading ? <div className="min-w-0 flex flex-wrap items-center gap-2">{leading}</div> : null}
      {trailing ? <div className="flex w-full items-center gap-2 md:w-auto">{trailing}</div> : null}
    </div>
  );
}
