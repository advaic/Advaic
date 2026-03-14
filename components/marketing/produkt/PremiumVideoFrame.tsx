import { type ReactNode } from "react";
import LoopVideo from "./LoopVideo";

type PremiumVideoFrameProps = {
  label?: string;
  caption?: string;
  captionClassName?: string;
  webm?: string;
  mp4?: string;
  poster?: string;
  ariaLabel?: string;
  priority?: boolean;
  children?: ReactNode;
  className?: string;
  mediaClassName?: string;
};

export default function PremiumVideoFrame({
  label,
  caption,
  captionClassName = "",
  webm,
  mp4,
  poster,
  ariaLabel,
  priority = false,
  children,
  className = "",
  mediaClassName = "",
}: PremiumVideoFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius)] bg-[linear-gradient(180deg,#ffffff,#fbfbfd)] p-1 ring-1 ring-[rgba(11,15,23,.08)] shadow-[0_22px_54px_rgba(15,23,42,0.09)] ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[rgba(11,15,23,.08)] px-2 pb-2 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#f87171]" />
          <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
          <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
        </div>
        {label ? (
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] ring-1 ring-[rgba(11,15,23,.08)]">
            {label}
          </span>
        ) : null}
      </div>

      <div className="mt-1 overflow-hidden rounded-[12px] bg-[var(--surface-2)] p-0 ring-1 ring-[rgba(11,15,23,.08)]">
        {children ? (
          children
        ) : (
          <LoopVideo
            webm={webm}
            mp4={mp4}
            poster={poster}
            priority={priority}
            ariaLabel={ariaLabel ?? "Produktvideo"}
            className={`aspect-video w-full bg-[var(--surface-2)] object-cover ${mediaClassName}`}
            placeholderLabel="Video-Platzhalter"
          />
        )}
      </div>

      {caption ? <p className={`helper mt-1.5 px-1 text-left ${captionClassName}`}>{caption}</p> : null}
    </div>
  );
}
