"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TOUR_STEPS, type TourKey } from "./tour-steps";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "advaic:tour:dashboard";

type StoredTourState = {
  tourKey: TourKey;
  stepIndex: number;
  isOpen: boolean;
};

type TourState = {
  isOpen: boolean;
  tourKey: TourKey | null;
  stepIndex: number;
  // UI-gate for “do the thing” steps (e.g. click a card) before allowing Next
  stepGateSatisfied: boolean;
};

type TourContextValue = {
  state: TourState;
  openTour: (key: TourKey, startIndex?: number) => void;
  closeTour: () => void;
  setGateSatisfied: (ok: boolean) => void;

  next: () => void;
  prev: () => void;
  skip: () => void;

  steps: ReturnType<typeof getStepsSafe>;
  currentStep: ReturnType<typeof getCurrentStepSafe>;
  isPathSatisfied: boolean;
  canGoNext: boolean;

  startTourForCurrentPage: (opts?: {
    key?: TourKey;
    forceFullTour?: boolean;
  }) => void;
  resumeTourForCurrentPage: (opts?: {
    key?: TourKey;
    forceFullTour?: boolean;
  }) => void;
  resetTour: (key?: TourKey) => void;
};

function getStepsSafe(key: TourKey | null) {
  if (!key) return [];
  return TOUR_STEPS[key] ?? [];
}

function getCurrentStepSafe(key: TourKey | null, idx: number) {
  const steps = getStepsSafe(key);
  return steps[idx] ?? null;
}

function getRequiredPath(step: any): string | null {
  const p = String(step?.requiresPath || step?.pathname || "").trim();
  return p ? p : null;
}

function initialGateForStep(step: any): boolean {
  // If the step requires a click, Next should be disabled until the click happens.
  return !step?.requireClickSelector;
}

function findStartIndexForPath(key: TourKey, path: string): number {
  const steps = TOUR_STEPS[key] ?? [];
  if (!steps.length) return 0;

  // Prefer a step whose required path matches the current pathname.
  const idx = steps.findIndex((s: any) => {
    const required = getRequiredPath(s);
    if (!required) return false;
    return path.startsWith(required);
  });

  // If no strict required-path match exists, fall back to first step that anchors on something
  // that is likely to exist on this page.
  if (idx >= 0) return idx;

  const idx2 = steps.findIndex((s: any) => {
    const p = String(s?.pathname || s?.requiresPath || "").trim();
    return p ? path.startsWith(p) : false;
  });

  return idx2 >= 0 ? idx2 : 0;
}

const TOUR_PROGRESS_STORAGE_KEY = "advaic:tour:progress:v1";

type PersistedTourProgress = {
  [key in TourKey]?: {
    stepId?: string;
    stepIndex?: number;
    updatedAt?: number;
  };
};

function readProgress(): PersistedTourProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TOUR_PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (
      parsed && typeof parsed === "object" ? parsed : {}
    ) as PersistedTourProgress;
  } catch {
    return {};
  }
}

function writeProgress(next: PersistedTourProgress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      TOUR_PROGRESS_STORAGE_KEY,
      JSON.stringify(next),
    );
  } catch {
    // ignore
  }
}

function clearProgressForKey(key: TourKey) {
  const all = readProgress();
  if (!all[key]) return;
  delete all[key];
  writeProgress(all);
}

function getSavedStartIndex(key: TourKey, steps: any[]): number | null {
  const all = readProgress();
  const saved = all?.[key];
  if (!saved) return null;

  // Prefer restoring by stepId if possible.
  const stepId = String(saved.stepId ?? "").trim();
  if (stepId) {
    const idx = steps.findIndex((s: any) => String(s?.id ?? "") === stepId);
    if (idx >= 0) return idx;
  }

  const idxNum = Number(saved.stepIndex);
  if (Number.isFinite(idxNum)) {
    const clamped = Math.max(
      0,
      Math.min(idxNum, Math.max(0, steps.length - 1)),
    );
    return clamped;
  }

  return null;
}

function normalizeDynamicPath(path: string): string {
  const p = String(path || "/");
  // Collapse dynamic routes so a tour can resume on the right section.
  // Example: /app/nachrichten/<id> should behave like /app/nachrichten
  if (p.startsWith("/app/nachrichten/")) return "/app/nachrichten";
  if (p.startsWith("/app/immobilien/")) return "/app/immobilien";
  return p;
}

function isPathSatisfiedForStep(step: any, pathname: string): boolean {
  if (!step) return true;
  const required = getRequiredPath(step);
  if (!required) return true;
  const cur = normalizeDynamicPath(pathname);
  const req = normalizeDynamicPath(required);
  return cur.startsWith(req);
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TourState>(() => {
    if (typeof window === "undefined") {
      return {
        isOpen: false,
        tourKey: null,
        stepIndex: 0,
        stepGateSatisfied: true,
      };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error("no stored tour");

      const parsed = JSON.parse(raw) as StoredTourState;

      return {
        isOpen: parsed.isOpen ?? false,
        tourKey: parsed.tourKey ?? null,
        stepIndex: parsed.stepIndex ?? 0,
        stepGateSatisfied: true, // recalculated per step
      };
    } catch {
      return {
        isOpen: false,
        tourKey: null,
        stepIndex: 0,
        stepGateSatisfied: true,
      };
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.tourKey) return;

    const payload: StoredTourState = {
      tourKey: state.tourKey,
      stepIndex: state.stepIndex,
      isOpen: state.isOpen,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [state.tourKey, state.stepIndex, state.isOpen]);

  const pathnameRaw = usePathname();
  const pathname = useMemo(
    () => normalizeDynamicPath(pathnameRaw),
    [pathnameRaw],
  );

  const steps = useMemo(() => getStepsSafe(state.tourKey), [state.tourKey]);
  const currentStep = useMemo(
    () => getCurrentStepSafe(state.tourKey, state.stepIndex),
    [state.tourKey, state.stepIndex],
  );

  const isPathSatisfied = useMemo(() => {
    return isPathSatisfiedForStep(currentStep as any, pathname);
  }, [currentStep, pathname]);

  const canGoNext = useMemo(() => {
    return Boolean(isPathSatisfied && state.stepGateSatisfied);
  }, [isPathSatisfied, state.stepGateSatisfied]);

  useEffect(() => {
    if (!state.isOpen) return;
    if (!state.tourKey) return;

    const key = state.tourKey;
    const stepsForKey = TOUR_STEPS[key] ?? [];
    const step = stepsForKey[state.stepIndex] ?? null;

    const all = readProgress();
    all[key] = {
      stepId: String(step?.id ?? ""),
      stepIndex: state.stepIndex,
      updatedAt: Date.now(),
    };
    writeProgress(all);
  }, [state.isOpen, state.tourKey, state.stepIndex]);

  const openTour = useCallback((key: TourKey, startIndex = 0) => {
    const s = TOUR_STEPS[key] ?? [];
    const clamped = Math.max(
      0,
      Math.min(startIndex, Math.max(0, s.length - 1)),
    );

    const firstStep = s[clamped] ?? null;

    setState({
      isOpen: true,
      tourKey: key,
      stepIndex: clamped,
      stepGateSatisfied: initialGateForStep(firstStep),
    });
  }, []);

  const closeTour = useCallback(() => {
    setState((p) => ({ ...p, isOpen: false }));
  }, []);

  const resetTour = useCallback((key?: TourKey) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }

    setState({
      isOpen: false,
      tourKey: key ?? null,
      stepIndex: 0,
      stepGateSatisfied: true,
    });
  }, []);

  const startTourForCurrentPage = useCallback(
    (opts?: { key?: TourKey; forceFullTour?: boolean }) => {
      const key = opts?.key ?? "dashboard";
      const allSteps = TOUR_STEPS[key] ?? [];

      // If forceFullTour is true, always start at the first step.
      // Otherwise, start at the first step that matches the current route.
      const startIndex = opts?.forceFullTour
        ? 0
        : findStartIndexForPath(key, pathname);

      openTour(key, startIndex);
    },
    [openTour, pathname],
  );

  const resumeTourForCurrentPage = useCallback(
    (opts?: { key?: TourKey; forceFullTour?: boolean }) => {
      const key = opts?.key ?? "dashboard";
      const allSteps = TOUR_STEPS[key] ?? [];

      if (opts?.forceFullTour) {
        openTour(key, 0);
        return;
      }

      // Try to resume where the user left off.
      const savedIdx = getSavedStartIndex(key, allSteps);
      if (savedIdx !== null) {
        const step = allSteps[savedIdx] ?? null;
        // Only resume if it still makes sense for the current page (handles dynamic routes).
        if (isPathSatisfiedForStep(step as any, pathname)) {
          openTour(key, savedIdx);
          return;
        }
      }

      // Fallback: start at the first step relevant for this page.
      const startIndex = findStartIndexForPath(key, pathname);
      openTour(key, startIndex);
    },
    [openTour, pathname],
  );

  const setGateSatisfied = useCallback((ok: boolean) => {
    setState((p) => ({ ...p, stepGateSatisfied: ok }));
  }, []);

  const next = useCallback(() => {
    setState((p) => {
      if (!p.tourKey) return p;
      const s = TOUR_STEPS[p.tourKey] ?? [];
      const curStep = s[p.stepIndex] ?? null;

      // Gate 1: correct page
      if (!isPathSatisfiedForStep(curStep as any, pathname)) return p;
      // Gate 2: required UI interaction completed
      if (!p.stepGateSatisfied) return p;

      const nextIdx = Math.min(p.stepIndex + 1, Math.max(0, s.length - 1));
      if (nextIdx === p.stepIndex) return p;

      const nextStep = s[nextIdx] ?? null;
      return {
        ...p,
        stepIndex: nextIdx,
        stepGateSatisfied: initialGateForStep(nextStep),
      };
    });
  }, [pathname]);

  const prev = useCallback(() => {
    setState((p) => {
      if (!p.tourKey) return p;
      const s = TOUR_STEPS[p.tourKey] ?? [];
      const prevIdx = Math.max(0, p.stepIndex - 1);
      if (prevIdx === p.stepIndex) return p;
      const prevStep = s[prevIdx] ?? null;
      return {
        ...p,
        stepIndex: prevIdx,
        stepGateSatisfied: initialGateForStep(prevStep),
      };
    });
  }, []);

  const skip = useCallback(() => {
    setState((p) => {
      if (!p.tourKey) return { ...p, isOpen: false, stepGateSatisfied: true };
      const s = TOUR_STEPS[p.tourKey] ?? [];
      const lastIdx = Math.max(0, s.length - 1);
      // If we're already at the end, close the tour.
      if (p.stepIndex >= lastIdx) {
        return { ...p, isOpen: false, stepGateSatisfied: true };
      }
      // Otherwise: skip this step and move on.
      const nextIdx = Math.min(p.stepIndex + 1, lastIdx);
      const nextStep = s[nextIdx] ?? null;
      return {
        ...p,
        stepIndex: nextIdx,
        stepGateSatisfied: initialGateForStep(nextStep),
      };
    });
  }, []);

  const value = useMemo<TourContextValue>(
    () => ({
      state,
      openTour,
      closeTour,
      startTourForCurrentPage,
      resumeTourForCurrentPage,
      resetTour,
      setGateSatisfied,
      next,
      prev,
      skip,
      steps,
      currentStep,
      isPathSatisfied,
      canGoNext,
    }),
    [
      state,
      openTour,
      closeTour,
      startTourForCurrentPage,
      resumeTourForCurrentPage,
      resetTour,
      setGateSatisfied,
      next,
      prev,
      skip,
      steps,
      currentStep,
      isPathSatisfied,
      canGoNext,
    ],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}
