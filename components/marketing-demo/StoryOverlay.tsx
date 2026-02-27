"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { RefObject } from "react";
import type { StoryArrow, StoryBeat } from "@/components/marketing-demo/types";

type StoryOverlayProps = {
  stageRef: RefObject<HTMLDivElement | null>;
  tickMs: number;
  beats: StoryBeat[];
};

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Anchor = NonNullable<StoryArrow["fromAnchor"]>;

type Point = {
  x: number;
  y: number;
};

const MEASURE_BUCKET_MS = 120;

function getActiveBeat(beats: StoryBeat[], tickMs: number) {
  const beat = beats.find((entry) => tickMs >= entry.startMs && tickMs < entry.endMs);
  return beat || beats[beats.length - 1] || null;
}

function centerOf(box: Box): Point {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

function resolveAutoAnchors(from: Box, to: Box): { from: Anchor; to: Anchor } {
  const fc = centerOf(from);
  const tc = centerOf(to);
  const dx = tc.x - fc.x;
  const dy = tc.y - fc.y;

  if (Math.abs(dx) >= Math.abs(dy) * 1.12) {
    return dx >= 0 ? { from: "right", to: "left" } : { from: "left", to: "right" };
  }

  return dy >= 0 ? { from: "bottom", to: "top" } : { from: "top", to: "bottom" };
}

function pointForAnchor(box: Box, anchor: Anchor): Point {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const pull = 4;

  if (anchor === "left") return { x: box.x - pull, y: cy };
  if (anchor === "right") return { x: box.x + box.width + pull, y: cy };
  if (anchor === "top") return { x: cx, y: box.y - pull };
  if (anchor === "bottom") return { x: cx, y: box.y + box.height + pull };
  return { x: cx, y: cy };
}

function buildPath(from: Point, to: Point, orientation: "horizontal" | "vertical") {
  if (orientation === "horizontal") {
    const sign = to.x >= from.x ? 1 : -1;
    const spread = Math.max(44, Math.min(120, Math.abs(to.x - from.x) * 0.45));
    const c1x = from.x + sign * spread;
    const c2x = to.x - sign * spread;
    return `M ${from.x} ${from.y} C ${c1x} ${from.y}, ${c2x} ${to.y}, ${to.x} ${to.y}`;
  }

  const sign = to.y >= from.y ? 1 : -1;
  const spread = Math.max(44, Math.min(120, Math.abs(to.y - from.y) * 0.45));
  const c1y = from.y + sign * spread;
  const c2y = to.y - sign * spread;
  return `M ${from.x} ${from.y} C ${from.x} ${c1y}, ${to.x} ${c2y}, ${to.x} ${to.y}`;
}

function arrowGeometry(
  arrow: StoryArrow,
  boxes: Record<string, Box>
): { path: string; stroke: string } | null {
  const fromBox = boxes[arrow.fromRef];
  const toBox = boxes[arrow.toRef];
  if (!fromBox || !toBox) return null;

  const auto = resolveAutoAnchors(fromBox, toBox);
  const fromAnchor = arrow.fromAnchor === "auto" || !arrow.fromAnchor ? auto.from : arrow.fromAnchor;
  const toAnchor = arrow.toAnchor === "auto" || !arrow.toAnchor ? auto.to : arrow.toAnchor;

  const fromPoint = pointForAnchor(fromBox, fromAnchor);
  const toPoint = pointForAnchor(toBox, toAnchor);

  const orientation: "horizontal" | "vertical" =
    fromAnchor === "left" || fromAnchor === "right" || toAnchor === "left" || toAnchor === "right"
      ? "horizontal"
      : "vertical";

  return {
    path: buildPath(fromPoint, toPoint, orientation),
    stroke: arrow.color === "gold" ? "rgba(201,162,39,0.72)" : "rgba(11,15,23,0.4)",
  };
}

export default function StoryOverlay({ stageRef, tickMs, beats }: StoryOverlayProps) {
  const activeBeat = useMemo(() => getActiveBeat(beats, tickMs), [beats, tickMs]);
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const tickBucket = Math.floor(tickMs / MEASURE_BUCKET_MS);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !activeBeat) {
      setBoxes({});
      return;
    }

    const refs = new Set<string>();
    (activeBeat.highlights || []).forEach((id) => refs.add(id));
    (activeBeat.arrows || []).forEach((arrow) => {
      refs.add(arrow.fromRef);
      refs.add(arrow.toRef);
    });

    const stageRect = stage.getBoundingClientRect();
    const nextBoxes: Record<string, Box> = {};

    refs.forEach((refId) => {
      const el = stage.querySelector<HTMLElement>(`[data-ref="${refId}"]`);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      nextBoxes[refId] = {
        x: Math.round((rect.left - stageRect.left) * 10) / 10,
        y: Math.round((rect.top - stageRect.top) * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      };
    });

    setStageSize({ width: stageRect.width, height: stageRect.height });
    setBoxes(nextBoxes);
  }, [activeBeat, stageRef]);

  useLayoutEffect(() => {
    measure();
  }, [measure, tickBucket]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const syncSize = () => {
      const rect = stage.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
      measure();
    };

    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(stage);

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(stage, { childList: true, subtree: true, characterData: true, attributes: true });

    window.addEventListener("resize", syncSize);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", syncSize);
    };
  }, [measure, stageRef]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !activeBeat) return;

    const highlighted = (activeBeat.highlights || [])
      .map((refId) => stage.querySelector<HTMLElement>(`[data-ref="${refId}"]`))
      .filter((el): el is HTMLElement => Boolean(el));

    highlighted.forEach((el) => el.classList.add("story-highlight-target"));

    return () => {
      highlighted.forEach((el) => el.classList.remove("story-highlight-target"));
    };
  }, [activeBeat, stageRef, tickBucket]);

  if (!activeBeat || stageSize.width <= 0 || stageSize.height <= 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {activeBeat.dim ? <div className="absolute inset-0 bg-[rgba(11,15,23,0.13)]" /> : null}

      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${stageSize.width} ${stageSize.height}`}>
        <defs>
          <marker id="story-arrow-muted" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
            <path d="M 0 0 L 9 4.5 L 0 9 z" fill="rgba(11,15,23,0.42)" />
          </marker>
          <marker id="story-arrow-gold" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
            <path d="M 0 0 L 9 4.5 L 0 9 z" fill="rgba(201,162,39,0.8)" />
          </marker>
        </defs>

        {(activeBeat.arrows || []).map((arrow, index) => {
          const geometry = arrowGeometry(arrow, boxes);
          if (!geometry) return null;
          const marker = arrow.color === "gold" ? "url(#story-arrow-gold)" : "url(#story-arrow-muted)";

          return (
            <path
              key={`${arrow.fromRef}-${arrow.toRef}-${index}`}
              d={geometry.path}
              fill="none"
              stroke={geometry.stroke}
              strokeWidth={2.2}
              strokeDasharray="8 6"
              markerEnd={marker}
              className="[animation:story-dash_5.2s_linear_infinite]"
            />
          );
        })}
      </svg>

      {activeBeat.stepLabel ? (
        <div className="absolute left-4 top-4 inline-flex items-center rounded-full border border-[rgba(201,162,39,0.62)] bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text)] shadow-[var(--shadow-sm)]">
          {activeBeat.stepLabel}
        </div>
      ) : null}

      <style jsx global>{`
        .story-highlight-target {
          position: relative !important;
          z-index: 35 !important;
          border-color: rgba(201, 162, 39, 0.62) !important;
          box-shadow:
            0 0 0 2px rgba(201, 162, 39, 0.72),
            0 0 0 8px rgba(201, 162, 39, 0.15) !important;
          animation: story-target-glow 1.8s ease-in-out infinite !important;
        }

        @keyframes story-dash {
          to {
            stroke-dashoffset: -140;
          }
        }

        @keyframes story-target-glow {
          0%,
          100% {
            box-shadow:
              0 0 0 2px rgba(201, 162, 39, 0.58),
              0 0 0 6px rgba(201, 162, 39, 0.1);
          }
          50% {
            box-shadow:
              0 0 0 2px rgba(201, 162, 39, 0.75),
              0 0 0 10px rgba(201, 162, 39, 0.18);
          }
        }
      `}</style>
    </div>
  );
}
