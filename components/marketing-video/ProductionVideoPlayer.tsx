"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, Pause, Play, RotateCcw } from "lucide-react";

import type { ProductionVideo } from "@/lib/video/production-videos";
import { getProductionVideoProgressStops, getProductionVideoRuntimeMs } from "@/lib/video/production-videos";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function mediaPath(type: "audio" | "captions" | "poster", slug: string) {
  if (type === "audio") return `/videos/audio/${slug}.m4a`;
  if (type === "captions") return `/videos/captions/${slug}.vtt`;
  return `/videos/posters/${slug}.png`;
}

export default function ProductionVideoPlayer({
  video,
  autoplay = false,
  loopPlayback = false,
  clean = false,
  controlsInline = false,
}: {
  video: ProductionVideo;
  autoplay?: boolean;
  loopPlayback?: boolean;
  clean?: boolean;
  controlsInline?: boolean;
}) {
  const totalMs = useMemo(() => getProductionVideoRuntimeMs(video), [video]);
  const stops = useMemo(() => getProductionVideoProgressStops(video), [video]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const lastFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSrc = mediaPath("audio", video.slug);

  useEffect(() => {
    setElapsedMs(0);
    setIsPlaying(autoplay);
  }, [autoplay, video.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      void audio.play().catch(() => {});
      return;
    }

    audio.pause();
  }, [isPlaying, video.id]);

  useEffect(() => {
    if (!isPlaying) {
      lastFrameRef.current = null;
      return;
    }

    let frameId = 0;

    const step = (timestamp: number) => {
      const last = lastFrameRef.current ?? timestamp;
      const delta = timestamp - last;
      lastFrameRef.current = timestamp;
      const audio = audioRef.current;

      setElapsedMs((current) => {
        const syncedMs =
          audio && Number.isFinite(audio.currentTime) && audio.currentTime > 0
            ? audio.currentTime * 1000
            : current + delta;
        const next = syncedMs;
        if (next >= totalMs) {
          if (loopPlayback) {
            if (audio) {
              audio.currentTime = 0;
              void audio.play().catch(() => {});
            }
            lastFrameRef.current = timestamp;
            return next % totalMs;
          }
          if (audio) {
            audio.pause();
          }
          setIsPlaying(false);
          return totalMs;
        }
        return next;
      });

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [isPlaying, loopPlayback, totalMs]);

  const activeSceneIndex = useMemo(() => {
    const match = stops.findIndex((scene) => elapsedMs >= scene.startMs && elapsedMs < scene.endMs);
    return match === -1 ? stops.length - 1 : match;
  }, [elapsedMs, stops]);

  const activeScene = video.scenes[activeSceneIndex];
  const progress = totalMs > 0 ? clamp(elapsedMs / totalMs, 0, 1) : 0;

  const seekToScene = (sceneIndex: number) => {
    const target = stops[sceneIndex];
    if (!target) return;
    setElapsedMs(target.startMs);
    lastFrameRef.current = null;
    if (audioRef.current) {
      audioRef.current.currentTime = target.startMs / 1000;
    }
  };

  const resetPlayback = () => {
    setElapsedMs(0);
    lastFrameRef.current = null;
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const stage = (
    <div
      className="overflow-hidden rounded-[34px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,#0b1220,#101827)] shadow-[0_30px_90px_rgba(11,15,23,0.28)]"
      data-tour="marketing-video-player"
    >
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      <div className="border-b border-white/10 px-5 py-4 text-white/75 md:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              {video.eyebrow}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white md:text-2xl" data-tour="marketing-video-title">
              {video.title}
            </h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70" data-tour="marketing-video-runtime">
            {formatTime(elapsedMs)} / {formatTime(totalMs)}
          </div>
        </div>
      </div>

      <div className="relative aspect-video bg-[#09101c]" data-tour="marketing-video-scene">
        {activeScene.type === "loop" ? (
          <video
            key={`${video.id}-${activeScene.id}`}
            className="h-full w-full object-cover"
            src={activeScene.src}
            poster={activeScene.poster}
            autoPlay
            loop
            muted
            playsInline
            data-tour="marketing-video-loop"
          />
        ) : (
          <img
            key={`${video.id}-${activeScene.id}`}
            className="h-full w-full object-cover"
            src={activeScene.src}
            alt={activeScene.title}
            data-tour="marketing-video-still"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,12,20,0.08),rgba(7,12,20,0.2)_45%,rgba(7,12,20,0.78))]" />

        <div className="absolute left-0 right-0 top-0 flex items-center justify-between gap-3 px-5 py-5 md:px-7">
          <div className="max-w-[75%]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
              {activeScene.chapter}
            </p>
            <h3 className="mt-2 max-w-[18ch] text-2xl font-semibold tracking-[-0.04em] text-white md:text-[34px]">
              {activeScene.title}
            </h3>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)] md:px-7 md:py-7">
          <div className="rounded-[24px] border border-white/12 bg-[rgba(6,10,18,0.62)] p-4 backdrop-blur-sm md:p-5" data-tour="marketing-video-overlay">
            <p className="text-sm leading-7 text-white/88">{activeScene.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {activeScene.bullets.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/78"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div
            className="rounded-[24px] border border-[rgba(212,180,72,0.24)] bg-[rgba(6,10,18,0.84)] p-4 backdrop-blur-sm md:p-5"
            data-tour="marketing-video-caption"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(233,212,146,0.84)]">
              Voice-over / Caption
            </p>
            <p className="mt-3 text-base leading-7 text-white/92">{activeScene.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0d1524] px-5 py-4 md:px-7" data-tour="marketing-video-progress">
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#d9c06a,#f3e1a8)] transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {video.scenes.map((scene, index) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => seekToScene(index)}
              className={[
                "rounded-[18px] border px-3 py-3 text-left transition",
                index === activeSceneIndex
                  ? "border-[rgba(233,212,146,0.42)] bg-[rgba(233,212,146,0.12)] text-white"
                  : "border-white/8 bg-white/[0.03] text-white/72 hover:bg-white/[0.06]",
              ].join(" ")}
              data-tour="marketing-video-scene-tab"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                {scene.chapter}
              </p>
              <p className="mt-2 text-sm font-medium leading-6">{scene.title}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (clean) {
    return (
      <div className="mx-auto max-w-[1480px] space-y-4">
        {stage}
        {controlsInline ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--border)] bg-white px-4 py-4 shadow-[var(--shadow-sm)]"
            data-tour="marketing-video-inline-controls"
          >
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying((current) => !current)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--text)] px-4 py-2 text-sm font-semibold text-white"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? "Pause" : "Abspielen"}
              </button>
              <button
                type="button"
                onClick={resetPlayback}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)]"
              >
                <RotateCcw className="h-4 w-4" />
                Zurücksetzen
              </button>
            </div>
            <div className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
              {formatTime(elapsedMs)} / {formatTime(totalMs)}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_360px]">
      {stage}

      <aside className="space-y-5">
        <section className="rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Produktionsmodus
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--text)]">
            {video.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{video.summary}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((current) => !current)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--text)] px-4 py-2 text-sm font-semibold text-white"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Pause" : "Abspielen"}
            </button>
            <button
              type="button"
              onClick={resetPlayback}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)]"
            >
              <RotateCcw className="h-4 w-4" />
              Zurücksetzen
            </button>
          </div>
        </section>

        <section className="rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]" data-tour="marketing-video-downloads">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Produktionsdateien
          </p>
          <div className="mt-4 space-y-3">
            <Link
              href={mediaPath("poster", video.slug)}
              className="flex min-h-[48px] items-center justify-between rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text)]"
            >
              Poster
              <Download className="h-4 w-4 text-[var(--muted)]" />
            </Link>
            <Link
              href={mediaPath("captions", video.slug)}
              className="flex min-h-[48px] items-center justify-between rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text)]"
            >
              Captions (.vtt)
              <Download className="h-4 w-4 text-[var(--muted)]" />
            </Link>
            <Link
              href={mediaPath("audio", video.slug)}
              className="flex min-h-[48px] items-center justify-between rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text)]"
            >
              Voice-over (.m4a)
              <Download className="h-4 w-4 text-[var(--muted)]" />
            </Link>
          </div>
        </section>
      </aside>
    </div>
  );
}
