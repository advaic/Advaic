import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  children: ReactNode;
  className?: string;
};

export default function FilterBar({ children, className }: FilterBarProps) {
  return <div className={cn("flex flex-wrap items-center gap-2 justify-start", className)}>{children}</div>;
}
