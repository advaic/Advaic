import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
  sticky?: boolean;
  dataTour?: string;
};

export default function PageHeader({
  title,
  meta,
  description,
  actions,
  footer,
  className,
  contentClassName,
  footerClassName,
  sticky = true,
  dataTour,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        sticky && "sticky top-16 md:top-0 z-30 pt-4 app-shell-header backdrop-blur border-b",
        "motion-enter",
        className,
      )}
      data-tour={dataTour}
    >
      <div
        className={cn(
          "flex flex-col gap-4 pb-4 md:flex-row md:items-start md:justify-between",
          contentClassName,
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {title}
            {meta}
          </div>
          {description ? <div className="app-text-helper mt-1">{description}</div> : null}
        </div>
        {actions ? <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">{actions}</div> : null}
      </div>
      {footer ? <div className={cn("pb-4", footerClassName)}>{footer}</div> : null}
    </div>
  );
}
