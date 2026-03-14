import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = ComponentPropsWithoutRef<"div">;

export default function Skeleton({
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "app-skeleton rounded-[calc(var(--radius)-2px)]",
        className,
      )}
      {...props}
    />
  );
}
