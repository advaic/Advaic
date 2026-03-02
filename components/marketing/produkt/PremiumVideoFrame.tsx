import { type ReactNode } from "react";
import LoopVideo from "./LoopVideo";

type PremiumVideoFrameProps = {
  label?: string;
  caption?: string;
  webm?: string;
  mp4?: string;
  poster?: string;
  ariaLabel?: string;
  priority?: boolean;
  children?: ReactNode;
  className?: string;
};

export default function PremiumVideoFrame({
  label,
  caption,
  webm,
  mp4,
  poster,
  ariaLabel,
  priority = false,
  children,
  className = "",
}: PremiumVideoFrameProps) {
  return (
    <div
      className={`rounded-[var(--radius)] bg-white p-2 ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-2 pb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
        {label ? <span className="ml-2 text-xs text-[var(--muted)]">{label}</span> : null}
      </div>

      <div className="mt-2 overflow-hidden rounded-[10px] bg-[var(--surface-2)] p-0 ring-1 ring-[var(--border)]">
        {children ? (
          children
        ) : (
          <LoopVideo
            webm={webm}
            mp4={mp4}
            poster={poster}
            priority={priority}
            ariaLabel={ariaLabel ?? "Produktvideo"}
            className="aspect-video w-full rounded-[8px] bg-[var(--surface-2)] object-contain"
            placeholderLabel="Video-Platzhalter"
          />
        )}
      </div>

      {caption ? <p className="helper mt-3 text-center">{caption}</p> : null}
    </div>
  );
}
