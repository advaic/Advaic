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
const TOUR_PROGRESS_STORAGE_KEY = "advaic:tour:progress:v1";

export type TourVariant = "full" | "compact";

const COMPACT_STEP_ID_SET = new Set<string>([
  "home_intro",
  "home_nav_primary",
  "messages_go",
  "messages_filters",
  "approval_go",
  "followups_go",
  "properties_go",
  "templates_go",
  "tone_style_intro",
  "settings_go",
  "done",
]);

type StoredTourState = {
  tourKey: TourKey;
  stepIndex: number;
  isOpen: boolean;
  tourVariant?: TourVariant;
};

type TourState = {
  isOpen: boolean;
  tourKey: TourKey | null;
  stepIndex: number;
  tourVariant: TourVariant;
  // UI-gate for “do the thing” steps (e.g. click a card) before allowing Next
  stepGateSatisfied: boolean;
};

type TourContextValue = {
  state: TourState;
  openTour: (key: TourKey, startIndex?: number, variant?: TourVariant) => void;
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
    variant?: TourVariant;
  }) => void;
  resumeTourForCurrentPage: (opts?: {
    key?: TourKey;
    forceFullTour?: boolean;
    variant?: TourVariant;
  }) => void;
  resetTour: (key?: TourKey) => void;
};

function getStepsSafe(key: TourKey | null, variant: TourVariant) {
  if (!key) return [];
  const steps = TOUR_STEPS[key] ?? [];
  if (variant === "full") return steps;

  const compactSteps = steps.filter((step: any) => COMPACT_STEP_ID_SET.has(String(step?.id ?? "")));
  if (compactSteps.length > 0) return compactSteps;
  return steps.filter((step: any) => step?.mode === "core");
}

function getCurrentStepSafe(key: TourKey | null, idx: number, variant: TourVariant) {
  const steps = getStepsSafe(key, variant);
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

function findStartIndexForPath(steps: any[], path: string): number {
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

type PersistedTourProgress = Record<
  string,
  {
    stepId?: string;
    stepIndex?: number;
    updatedAt?: number;
  }
>;

function buildProgressStorageKey(key: TourKey, variant: TourVariant) {
  return `${key}:${variant}`;
}

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
  delete all[buildProgressStorageKey(key, "full")];
  delete all[buildProgressStorageKey(key, "compact")];
  // Legacy fallback key (old format without variant).
  delete all[key];
  writeProgress(all);
}

function getSavedStartIndex(key: TourKey, steps: any[], variant: TourVariant): number | null {
  const all = readProgress();
  const saved =
    all?.[buildProgressStorageKey(key, variant)] ??
    (variant === "full" ? all?.[key] : undefined);
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
        tourVariant: "full",
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
        tourVariant: parsed.tourVariant === "compact" ? "compact" : "full",
        stepGateSatisfied: true, // recalculated per step
      };
    } catch {
      return {
        isOpen: false,
        tourKey: null,
        stepIndex: 0,
        tourVariant: "full",
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
      tourVariant: state.tourVariant,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [state.tourKey, state.stepIndex, state.isOpen, state.tourVariant]);

  const pathnameRaw = usePathname();
  const pathname = useMemo(
    () => normalizeDynamicPath(pathnameRaw),
    [pathnameRaw],
  );

  const steps = useMemo(
    () => getStepsSafe(state.tourKey, state.tourVariant),
    [state.tourKey, state.tourVariant],
  );
  const currentStep = useMemo(
    () => getCurrentStepSafe(state.tourKey, state.stepIndex, state.tourVariant),
    [state.tourKey, state.stepIndex, state.tourVariant],
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
    const stepsForKey = getStepsSafe(key, state.tourVariant);
    const step = stepsForKey[state.stepIndex] ?? null;

    const all = readProgress();
    all[buildProgressStorageKey(key, state.tourVariant)] = {
      stepId: String(step?.id ?? ""),
      stepIndex: state.stepIndex,
      updatedAt: Date.now(),
    };
    writeProgress(all);
  }, [state.isOpen, state.tourKey, state.stepIndex, state.tourVariant]);

  const openTour = useCallback(
    (key: TourKey, startIndex = 0, variant: TourVariant = "full") => {
      const s = getStepsSafe(key, variant);
    const clamped = Math.max(
      0,
      Math.min(startIndex, Math.max(0, s.length - 1)),
    );

    const firstStep = s[clamped] ?? null;

    setState({
      isOpen: true,
      tourKey: key,
      stepIndex: clamped,
      tourVariant: variant,
      stepGateSatisfied: initialGateForStep(firstStep),
    });
    },
    [],
  );

  const closeTour = useCallback(() => {
    setState((p) => ({ ...p, isOpen: false }));
  }, []);

  const resetTour = useCallback((key?: TourKey) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    if (key) {
      clearProgressForKey(key);
    } else {
      clearProgressForKey("dashboard");
    }

    setState({
      isOpen: false,
      tourKey: key ?? null,
      stepIndex: 0,
      tourVariant: "full",
      stepGateSatisfied: true,
    });
  }, []);

  const startTourForCurrentPage = useCallback(
    (opts?: { key?: TourKey; forceFullTour?: boolean; variant?: TourVariant }) => {
      const key = opts?.key ?? "dashboard";
      const variant = opts?.variant ?? "full";
      const allSteps = getStepsSafe(key, variant);

      // If forceFullTour is true, always start at the first step.
      // Otherwise, start at the first step that matches the current route.
      const startIndex = opts?.forceFullTour
        ? 0
        : findStartIndexForPath(allSteps, pathname);

      openTour(key, startIndex, variant);
    },
    [openTour, pathname],
  );

  const resumeTourForCurrentPage = useCallback(
    (opts?: { key?: TourKey; forceFullTour?: boolean; variant?: TourVariant }) => {
      const key = opts?.key ?? "dashboard";
      const variant = opts?.variant ?? "full";
      const allSteps = getStepsSafe(key, variant);

      if (opts?.forceFullTour) {
        openTour(key, 0, variant);
        return;
      }

      // Try to resume where the user left off.
      const savedIdx = getSavedStartIndex(key, allSteps, variant);
      if (savedIdx !== null) {
        const step = allSteps[savedIdx] ?? null;
        // Only resume if it still makes sense for the current page (handles dynamic routes).
        if (isPathSatisfiedForStep(step as any, pathname)) {
          openTour(key, savedIdx, variant);
          return;
        }
      }

      // Fallback: start at the first step relevant for this page.
      const startIndex = findStartIndexForPath(allSteps, pathname);
      openTour(key, startIndex, variant);
    },
    [openTour, pathname],
  );

  const setGateSatisfied = useCallback((ok: boolean) => {
    setState((p) => ({ ...p, stepGateSatisfied: ok }));
  }, []);

  const next = useCallback(() => {
    setState((p) => {
      if (!p.tourKey) return p;
      const s = getStepsSafe(p.tourKey, p.tourVariant);
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
      const s = getStepsSafe(p.tourKey, p.tourVariant);
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
      const s = getStepsSafe(p.tourKey, p.tourVariant);
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
