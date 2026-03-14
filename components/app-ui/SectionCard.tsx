import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  surface?: "card" | "panel";
} & Omit<ComponentPropsWithoutRef<"section">, "title" | "children" | "className">;

export default function SectionCard({
  title,
  description,
  meta,
  actions,
  children,
  className,
  headerClassName,
  bodyClassName,
  surface = "card",
  ...props
}: SectionCardProps) {
  const surfaceClass = surface === "panel" ? "app-surface-panel" : "app-surface-card";
  const hasHeader = title || description || meta || actions;

  return (
    <section
      className={cn("motion-enter-soft motion-delay-1 rounded-2xl border overflow-hidden", surfaceClass, className)}
      {...props}
    >
      {hasHeader ? (
        <div className={cn("border-b app-surface-muted app-panel-padding", headerClassName)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {title ? <div className="app-text-section-title text-gray-900">{title}</div> : null}
              {description ? <div className="app-text-helper mt-1">{description}</div> : null}
            </div>
            {meta || actions ? (
              <div className="flex shrink-0 items-center gap-2">
                {meta}
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={cn("app-panel-padding", bodyClassName)}>{children}</div>
    </section>
  );
}
