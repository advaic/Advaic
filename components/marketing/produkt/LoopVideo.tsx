"use client";

import { useEffect, useRef, useState } from "react";

type LoopVideoProps = {
  webm?: string;
  mp4?: string;
  poster?: string;
  ariaLabel: string;
  className?: string;
  placeholderLabel?: string;
  isActive?: boolean;
};

export default function LoopVideo({
  webm,
  mp4,
  poster,
  ariaLabel,
  className = "",
  placeholderLabel = "Video-Vorschau",
  isActive = true,
}: LoopVideoProps) {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      video.pause();
      return;
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Autoplay restrictions can block playback in some environments.
      });
    }
  }, [isActive]);

  if (hasError || (!webm && !mp4)) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-[var(--surface-2)] px-4 text-center text-sm text-[var(--muted)]`}
        role="img"
        aria-label={ariaLabel}
      >
        {placeholderLabel}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload={isActive ? "metadata" : "none"}
      poster={poster}
      aria-label={ariaLabel}
      aria-hidden={!isActive}
      className={className}
      onError={() => setHasError(true)}
    >
      {webm ? <source src={webm} type="video/webm" /> : null}
      {mp4 ? <source src={mp4} type="video/mp4" /> : null}
      Ihr Browser unterstützt das Video-Element nicht.
    </video>
  );
}
