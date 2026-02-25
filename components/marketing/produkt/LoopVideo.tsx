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
  priority?: boolean;
};

export default function LoopVideo({
  webm,
  mp4,
  poster,
  ariaLabel,
  className = "",
  placeholderLabel = "Video-Vorschau",
  isActive = true,
  priority = false,
}: LoopVideoProps) {
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    if (priority) {
      setIsInView(true);
      return;
    }
    if (!isActive) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.25, rootMargin: "120px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isActive, priority]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPrefersReducedMotion(media.matches);
    apply();
    media.addEventListener?.("change", apply);
    return () => media.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive || !isInView || prefersReducedMotion) {
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
      autoPlay={!prefersReducedMotion}
      muted
      loop
      playsInline
      preload={isInView && isActive ? "metadata" : "none"}
      poster={poster}
      aria-label={ariaLabel}
      aria-hidden={!isActive || !isInView}
      className={className}
      onError={() => setHasError(true)}
    >
      {webm ? <source src={webm} type="video/webm" /> : null}
      {mp4 ? <source src={mp4} type="video/mp4" /> : null}
      Ihr Browser unterstützt das Video-Element nicht.
    </video>
  );
}
