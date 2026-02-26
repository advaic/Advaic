"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  withIcon?: boolean;
  iconPriority?: boolean;
  className?: string;
};

const SIZE_MAP: Record<
  NonNullable<BrandLogoProps["size"]>,
  { icon: number; wordmarkW: number; wordmarkH: number; text: string }
> = {
  sm: { icon: 26, wordmarkW: 92, wordmarkH: 19, text: "text-[1.2rem]" },
  md: { icon: 34, wordmarkW: 116, wordmarkH: 24, text: "text-[1.55rem]" },
  lg: { icon: 42, wordmarkW: 146, wordmarkH: 30, text: "text-[2rem]" },
};

export default function BrandLogo({
  size = "md",
  withIcon = true,
  iconPriority = false,
  className = "",
}: BrandLogoProps) {
  const cfg = SIZE_MAP[size];
  // Expected asset paths:
  // - /public/brand/advaic-icon.png
  // - /public/brand/advaic-wordmark.png
  const iconCandidates = useMemo(() => ["/brand/advaic-icon.png", "/Advaic_Logo_Cropped.webp"], []);
  const [iconSrcIdx, setIconSrcIdx] = useState(0);
  const [iconBroken, setIconBroken] = useState(false);
  const [wordmarkBroken, setWordmarkBroken] = useState(false);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      {withIcon && !iconBroken ? (
        <span className="relative inline-flex shrink-0 items-center justify-center rounded-[10px] border border-[rgba(11,15,23,0.12)] bg-[linear-gradient(145deg,#ffffff,#f4f6fa_40%,#f8f5eb)] p-[3px] shadow-[0_10px_26px_rgba(11,15,23,0.14)]">
          <Image
            src={iconCandidates[iconSrcIdx]}
            alt="Advaic"
            width={cfg.icon}
            height={cfg.icon}
            priority={iconPriority}
            className="h-auto w-auto object-contain"
            onError={() => {
              if (iconSrcIdx < iconCandidates.length - 1) {
                setIconSrcIdx((curr) => curr + 1);
                return;
              }
              setIconBroken(true);
            }}
          />
        </span>
      ) : null}

      {!wordmarkBroken ? (
        <Image
          src="/brand/advaic-wordmark.png"
          alt="Advaic"
          width={cfg.wordmarkW}
          height={cfg.wordmarkH}
          className="h-auto w-auto object-contain"
          onError={() => setWordmarkBroken(true)}
        />
      ) : (
        <span className={`brand-wordmark ${cfg.text} leading-none`} aria-label="Advaic">
          <span className="brand-wordmark-core">adv</span>
          <span className="brand-wordmark-ai">ai</span>
          <span className="brand-wordmark-core">c</span>
        </span>
      )}
    </span>
  );
}
