// components/ui/Skeleton.tsx

import { cn } from "@/lib/utils"; // Only if you're using a className utility

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md",
        className
      )}
    />
  );
}
