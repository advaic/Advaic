"use client";

import type { ReactNode, RefObject } from "react";

type DemoFrameProps = {
  stageRef: RefObject<HTMLDivElement | null>;
  scale: number;
  clean: boolean;
  sidebar?: ReactNode;
  children: ReactNode;
};

export default function DemoFrame({ stageRef, scale, clean, sidebar, children }: DemoFrameProps) {
  const safeScale = Number.isFinite(scale) ? Math.min(1.25, Math.max(0.8, scale)) : 1;

  return (
    <div className="mx-auto w-full overflow-x-auto pb-4">
      <div
        className="origin-top-left"
        style={{
          width: `${100 / safeScale}%`,
          transform: `scale(${safeScale})`,
        }}
      >
        <section
          className="mx-auto w-[1680px] rounded-[20px] border border-[var(--border)] bg-white shadow-[0_16px_45px_rgba(11,15,23,0.1)]"
          data-tour="marketing-demo-shell"
        >
          <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden="true" />
              <span className="ml-3 text-xs font-semibold tracking-[0.08em] text-[var(--muted)]">Advaic</span>
            </div>

            <div className="flex items-center gap-2 text-[12px]">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                Autopilot: Aktiv
              </span>
              <span className="rounded-full border border-[rgba(201,162,39,0.55)] bg-[rgba(201,162,39,0.12)] px-2.5 py-1 font-medium text-[var(--text)]">
                Guardrails: Aktiv
              </span>
              {!clean ? (
                <span className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 font-medium text-[var(--muted)]">
                  Postfach verbunden
                </span>
              ) : null}
            </div>
          </header>

          <div className="flex min-h-[940px] bg-[var(--surface)]">
            {sidebar}
            <div ref={stageRef} className="relative flex-1 overflow-hidden p-6" data-tour="marketing-demo-stage">
              {children}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
