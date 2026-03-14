import type { ReactNode } from "react";
import Image from "next/image";

type ProductStillFrameProps = {
  label?: string;
  caption?: string;
  src: string;
  alt: string;
  sizes?: string;
  aspectClassName?: string;
  imageClassName?: string;
  className?: string;
  frameTour?: string;
  stageTour?: string;
  children?: ReactNode;
};

export default function ProductStillFrame({
  label,
  caption,
  src,
  alt,
  sizes = "(max-width: 1280px) 100vw, 760px",
  aspectClassName = "aspect-[16/10]",
  imageClassName = "object-cover object-top",
  className = "",
  frameTour,
  stageTour,
  children,
}: ProductStillFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius)] bg-[linear-gradient(180deg,#ffffff,#fbfbfd)] p-1 ring-1 ring-[rgba(11,15,23,.08)] shadow-[0_22px_54px_rgba(15,23,42,0.09)] ${className}`}
      data-tour={frameTour}
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
        <div className={`relative ${aspectClassName}`} data-tour={stageTour}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className={imageClassName}
          />
          {children}
        </div>
      </div>

      {caption ? <p className="helper mt-1.5 px-1 text-left">{caption}</p> : null}
    </div>
  );
}
