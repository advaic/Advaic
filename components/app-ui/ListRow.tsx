import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ListRowProps = {
  children: ReactNode;
  className?: string;
};

export default function ListRow({ children, className }: ListRowProps) {
  return <div className={cn("block w-full", className)}>{children}</div>;
}
