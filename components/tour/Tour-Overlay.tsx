"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useTour } from "./Tour-Provider";

// Local, forward-compatible step shape (keeps Overlay independent from TourStep typings)
type StepLike = {
  id: string;
  title: string;
  body: string;
  // routing
  pathname?: string;
  requiresPath?: string;
  goTo?: string;
  // spotlight
  anchorSelector?: string;
  // gating
  requireClickSelector?: string;
  requireClickText?: string;
  gateText?: string;
};

function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type CardPos = { top: number; left: number; mode: "anchored" | "dragged" };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeAnchoredCardPos(opts: {
  spotlight: SpotlightRect;
  cardW: number;
  cardH: number;
  gap?: number;
}): { top: number; left: number } {
  const { spotlight, cardW, cardH } = opts;
  const gap = opts.gap ?? 16;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const candidates = [
    {
      name: "right",
      top: spotlight.top + spotlight.height / 2 - cardH / 2,
      left: spotlight.left + spotlight.width + gap,
    },
    {
      name: "left",
      top: spotlight.top + spotlight.height / 2 - cardH / 2,
      left: spotlight.left - cardW - gap,
    },
    {
      name: "bottom",
      top: spotlight.top + spotlight.height + gap,
      left: spotlight.left + spotlight.width / 2 - cardW / 2,
    },
    {
      name: "top",
      top: spotlight.top - cardH - gap,
      left: spotlight.left + spotlight.width / 2 - cardW / 2,
    },
  ];

  const score = (p: { top: number; left: number }) => {
    const right = p.left + cardW;
    const bottom = p.top + cardH;
    const overflowX = Math.max(0, -p.left) + Math.max(0, right - vw);
    const overflowY = Math.max(0, -p.top) + Math.max(0, bottom - vh);
    return overflowX + overflowY;
  };

  let best = candidates[0];
  let bestScore = score(best);
  for (const c of candidates.slice(1)) {
    const s = score(c);
    if (s < bestScore) {
      best = c;
      bestScore = s;
    }
  }

  const pad = 12;
  const top = clamp(best.top, pad, vh - cardH - pad);
  const left = clamp(best.left, pad, vw - cardW - pad);
  return { top, left };
}

function getRectForElement(el: Element): SpotlightRect {
  const r = el.getBoundingClientRect();
  const pad = 8;
  const top = Math.max(0, r.top - pad);
  const left = Math.max(0, r.left - pad);
  const width = Math.max(0, r.width + pad * 2);
  const height = Math.max(0, r.height + pad * 2);
  return { top, left, width, height };
}

export default function TourOverlay() {
  const {
    state,
    currentStep,
    steps,
    closeTour,
    next,
    prev,
    skip,
    setGateSatisfied,
    canGoNext,
  } = useTour();

  const pathname = usePathname(); // <-- NICHT normalisieren!
  const router = useRouter();

  const stepCount = steps.length;
  const idx = state.stepIndex;
  const step = currentStep as unknown as StepLike | null;

  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const spotlightElRef = useRef<Element | null>(null);

  const [clickRect, setClickRect] = useState<SpotlightRect | null>(null);
  const clickElRef = useRef<Element | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardPos, setCardPos] = useState<CardPos | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  // Handle ESC to close
  useEffect(() => {
    if (!state.isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTour();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.isOpen, closeTour]);

  // Spotlight: find anchor + keep updated
  useEffect(() => {
    if (!state.isOpen || !step?.anchorSelector) {
      setSpotlight(null);
      spotlightElRef.current = null;
      return;
    }

    const selector = step.anchorSelector;
    let raf = 0;
    let interval: any = null;

    const update = () => {
      if (!spotlightElRef.current) return;
      setSpotlight(getRectForElement(spotlightElRef.current));
    };

    const findAndInit = () => {
      const el = document.querySelector(selector);
      if (!el) return false;
      spotlightElRef.current = el;

      try {
        (el as any).scrollIntoView?.({ block: "center", behavior: "smooth" });
      } catch {}

      setSpotlight(getRectForElement(el));
      return true;
    };

    if (!findAndInit()) {
      interval = setInterval(() => {
        if (findAndInit()) {
          clearInterval(interval);
          interval = null;
        }
      }, 120);
    }

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      if (interval) clearInterval(interval);
    };
  }, [state.isOpen, step?.id, step?.anchorSelector]);

  // Click target rect: find requireClickSelector + keep updated
  useEffect(() => {
    if (!state.isOpen || !step?.requireClickSelector) {
      setClickRect(null);
      clickElRef.current = null;
      return;
    }

    const selector = step.requireClickSelector;
    let raf = 0;
    let interval: any = null;

    const update = () => {
      if (!clickElRef.current) return;
      setClickRect(getRectForElement(clickElRef.current));
    };

    const findAndInit = () => {
      const el = document.querySelector(selector);
      if (!el) return false;
      clickElRef.current = el;

      try {
        (el as any).scrollIntoView?.({ block: "center", behavior: "smooth" });
      } catch {}

      setClickRect(getRectForElement(el));
      return true;
    };

    if (!findAndInit()) {
      interval = setInterval(() => {
        if (findAndInit()) {
          clearInterval(interval);
          interval = null;
        }
      }, 120);
    }

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      if (interval) clearInterval(interval);
    };
  }, [state.isOpen, step?.id, step?.requireClickSelector]);

  // Position card near spotlight (anchored, unless user dragged)
  const cardPosMode = cardPos?.mode ?? "none";

  useLayoutEffect(() => {
    if (!state.isOpen || !step) return;

    if (!spotlight) {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      const w = 720;
      const h = 520;
      setCardPos({
        top: Math.max(12, vh / 2 - h / 2),
        left: Math.max(12, vw / 2 - w / 2),
        mode: "anchored",
      });
      return;
    }

    if (cardPosMode === "dragged") return;

    const rect = cardRef.current?.getBoundingClientRect();
    const cardW = rect?.width ?? 720;
    const cardH = rect?.height ?? 520;

    const { top, left } = computeAnchoredCardPos({
      spotlight,
      cardW,
      cardH,
      gap: 18,
    });
    setCardPos({ top, left, mode: "anchored" });
  }, [state.isOpen, step?.id, spotlight, cardPosMode]);

  // Drag handlers
  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      const off = dragOffsetRef.current;
      if (!off) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = cardRef.current?.getBoundingClientRect();
      const w = rect?.width ?? 720;
      const h = rect?.height ?? 520;

      const top = clamp(e.clientY - off.y, 12, vh - h - 12);
      const left = clamp(e.clientX - off.x, 12, vw - w - 12);
      setCardPos({ top, left, mode: "dragged" });
    };

    const onUp = () => {
      setIsDragging(false);
      dragOffsetRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  // ✅ Gate: requiredPath FIRST (block until correct route),
  // then requireClickSelector (block until click happens)
  const clickHandlerRef = useRef<((e: Event) => void) | null>(null);

  useEffect(() => {
    if (!state.isOpen || !step) return;

    const requiredPath = step.requiresPath ?? step.pathname ?? null;

    // If there is a requiredPath and we are NOT on it -> gate stays false (must navigate)
    if (requiredPath && !pathname.startsWith(requiredPath)) {
      setGateSatisfied(false);
      return;
    }

    // If no click requirement -> gate satisfied (once route is ok)
    if (!step.requireClickSelector) {
      setGateSatisfied(true);
      return;
    }

    // Click required
    setGateSatisfied(false);

    let disposed = false;
    let interval: any = null;

    const attachOnce = () => {
      if (disposed) return;
      const sel = step.requireClickSelector;
      if (!sel) return;

      const el = document.querySelector(sel);
      if (!el) return;

      const handler = () => setGateSatisfied(true);
      clickHandlerRef.current = handler;

      try {
        el.addEventListener("click", handler, { once: true });
      } catch {}

      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    attachOnce();
    if (!document.querySelector(step.requireClickSelector)) {
      interval = setInterval(attachOnce, 120);
    }

    return () => {
      disposed = true;
      if (interval) clearInterval(interval);

      const handler = clickHandlerRef.current;
      clickHandlerRef.current = null;

      try {
        const sel = step.requireClickSelector;
        if (!sel) return;
        const el = document.querySelector(sel);
        if (el && handler) el.removeEventListener("click", handler);
      } catch {}
    };
  }, [
    state.isOpen,
    step?.id,
    step?.requireClickSelector,
    pathname,
    setGateSatisfied,
  ]);

  const progressPct = useMemo(() => {
    if (stepCount <= 1) return 100;
    return Math.round(((idx + 1) / stepCount) * 100);
  }, [idx, stepCount]);

  if (!state.isOpen || !step) return null;

  const requiredPath = step.pathname ?? step.requiresPath ?? null;
  const goTo = step.goTo ?? null;

  const targetRoute = goTo || requiredPath;
  const needsNavigate = (() => {
    if (!targetRoute) return false;

    if (targetRoute === "/app/immobilien") {
      return !isExactPath(pathname, "/app/immobilien");
    }

    if (targetRoute === "/app/immobilien/[id]") {
      return !isDetailPath(pathname);
    }

    return !isExactPath(pathname, targetRoute);
  })();

  function isDetailPath(pathname: string) {
    // Matches paths like /app/immobilien/123 or /app/immobilien/abc
    return /^\/app\/immobilien\/[^/]+$/.test(pathname.replace(/\/+$/, ""));
  }
  const allowClickThrough = Boolean(step.requireClickSelector && clickRect);
  const gateActive =
    !canGoNext && (needsNavigate || !!step.requireClickSelector);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {!allowClickThrough && (
        <div className="absolute inset-0 bg-black/40 pointer-events-auto" />
      )}

      {allowClickThrough &&
        clickRect &&
        (() => {
          const s = clickRect;
          const topH = s.top;
          const leftW = s.left;
          const rightLeft = s.left + s.width;
          const bottomTop = s.top + s.height;

          return (
            <>
              <div
                className="absolute left-0 top-0 w-full bg-black/40 pointer-events-auto"
                style={{ height: topH }}
              />
              <div
                className="absolute left-0 bg-black/40 pointer-events-auto"
                style={{ top: topH, width: leftW, height: s.height }}
              />
              <div
                className="absolute bg-black/40 pointer-events-auto"
                style={{
                  top: topH,
                  left: rightLeft,
                  right: 0,
                  height: s.height,
                }}
              />
              <div
                className="absolute left-0 bg-black/40 pointer-events-auto"
                style={{
                  top: bottomTop,
                  height: `calc(100% - ${bottomTop}px)`,
                  width: "100%",
                }}
              />
              {/* Hole: nothing here -> click falls through */}
            </>
          );
        })()}

      {spotlight && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute rounded-[16px]"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow:
                "0 0 0 2px rgba(201,162,63,0.95), 0 0 0 9999px rgba(0,0,0,0.45)",
              transition: "all 160ms ease-out",
            }}
          />
        </div>
      )}

      {clickRect && step?.requireClickSelector && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute rounded-[16px]"
            style={{
              top: clickRect.top,
              left: clickRect.left,
              width: clickRect.width,
              height: clickRect.height,
              boxShadow: "0 0 0 2px rgba(201,162,63,0.95)",
              transition: "all 160ms ease-out",
            }}
          />
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div
          ref={cardRef}
          className="pointer-events-auto w-full max-w-[720px] rounded-[18px] bg-white border border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.10)] overflow-hidden"
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            top: cardPos?.top ?? "50%",
            left: cardPos?.left ?? "50%",
            transform: cardPos ? "translate(0,0)" : "translate(-50%, -50%)",
          }}
        >
          <div
            className={cn(
              "flex items-center justify-between px-5 py-4 border-b border-black/10 bg-[#fbfbfa]",
              "select-none",
              "cursor-grab",
              isDragging && "cursor-grabbing",
            )}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              const rect = cardRef.current?.getBoundingClientRect();
              if (!rect) return;
              setIsDragging(true);
              dragOffsetRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              };
            }}
            title="Ziehen, um die Tour zu verschieben"
          >
            <div className="min-w-0">
              <div className="text-xs text-black/60">Tour</div>
              <div className="text-[15px] font-semibold text-[#0E0E11] truncate">
                {step.title}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCardPos(null)}
                className="h-9 px-3 rounded-xl border border-black/10 hover:border-black/20 hover:bg-black/5 transition text-xs text-black/70"
                title="Position zurücksetzen"
              >
                Reset
              </button>

              <button
                onClick={closeTour}
                className="h-9 w-9 rounded-xl border border-black/10 hover:border-black/20 hover:bg-black/5 transition"
                aria-label="Tour schließen"
              >
                <X className="h-4 w-4 mx-auto text-black/70" />
              </button>
            </div>
          </div>

          <div className="px-5 pt-4">
            <div className="flex items-center justify-between text-xs text-black/60">
              <span>
                Schritt {idx + 1} von {stepCount}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="mt-2 h-[3px] rounded-full bg-black/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background:
                    "linear-gradient(90deg, #C9A23F 0%, #D8B24A 100%)",
                  transition: "width 220ms ease-out",
                }}
              />
            </div>
          </div>

          <div className="px-5 py-5">
            <p className="text-[15px] leading-6 text-[#0E0E11]">{step.body}</p>

            {gateActive && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {step.gateText ??
                  step.requireClickText ??
                  (needsNavigate
                    ? "Bitte die angegebene Seite öffnen, um fortzufahren."
                    : "Bitte die erforderliche Aktion durchführen, um fortzufahren.")}

                {needsNavigate && targetRoute && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => router.push(String(targetRoute))}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-white border border-amber-200 hover:bg-amber-100 transition"
                    >
                      Zur Seite wechseln
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-xs text-black/45">
              Aktuelle Seite:{" "}
              <span className="font-medium text-black/60">{pathname}</span>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-black/10 flex items-center justify-between bg-white">
            <div className="flex items-center gap-4">
              <button
                onClick={skip}
                className="text-sm text-black/60 hover:text-black underline underline-offset-4 decoration-black/20 hover:decoration-black/40 transition"
              >
                Schritt überspringen
              </button>

              <button
                onClick={closeTour}
                className="text-sm text-black/60 hover:text-black underline underline-offset-4 decoration-black/20 hover:decoration-black/40 transition"
              >
                Tour beenden
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                disabled={idx === 0}
                className={cn(
                  "h-10 px-3 rounded-xl border border-black/10 bg-white text-sm text-black/80 hover:bg-black/5 transition inline-flex items-center gap-1",
                  idx === 0 && "opacity-40 cursor-not-allowed",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </button>

              <button
                onClick={() => {
                  if (targetRoute && !pathname.startsWith(targetRoute)) {
                    router.push(String(targetRoute));
                    return;
                  }
                  next();
                }}
                disabled={
                  !canGoNext &&
                  !(targetRoute && !pathname.startsWith(targetRoute))
                }
                className={cn(
                  "h-10 px-4 rounded-xl text-sm font-medium inline-flex items-center gap-2",
                  "bg-[#0E0E11] text-white border border-[#C9A23F]",
                  "hover:bg-[#C9A23F] hover:text-[#0E0E11] transition",
                  !canGoNext &&
                    !(targetRoute && !pathname.startsWith(targetRoute)) &&
                    "opacity-50 cursor-not-allowed hover:bg-[#0E0E11] hover:text-white",
                )}
              >
                {targetRoute && !pathname.startsWith(targetRoute)
                  ? "Zur Seite"
                  : "Weiter"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function isExactPath(pathname: string, target: string) {
    // Remove trailing slashes for comparison
    const normalize = (p: string) => p.replace(/\/+$/, "");
    return normalize(pathname) === normalize(target);
}

