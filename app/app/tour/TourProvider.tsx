"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export type TourStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

export type TourState = {
  tour_key: string | null;
  status: TourStatus;
  current_step: number;
  isOpen: boolean;
};

type Ctx = {
  state: TourState;
  startTour: (tourKey: string, opts?: { step?: number }) => Promise<void>;
  closeTour: () => void;
  completeTour: () => Promise<void>;
  skipTour: () => Promise<void>;
  next: (nextStep: number) => Promise<void>;
  resetTour: (tourKey: string) => Promise<void>;
  startTourForCurrentPage: () => Promise<void>;
};

const TourContext = createContext<Ctx | null>(null);

function tourKeyFromPathname(pathname: string): string {
  // Passe das Mapping an eure Routen an:
  if (pathname === "/app" || pathname === "/app/") return "dashboard_home";
  if (pathname.startsWith("/app/nachrichten")) return "messages";
  if (pathname.startsWith("/app/eskalationen")) return "escalations";
  if (pathname.startsWith("/app/zur-freigabe")) return "approvals";
  if (pathname.startsWith("/app/follow-ups")) return "followups";
  if (pathname.startsWith("/app/immobilien")) return "properties";
  if (pathname.startsWith("/app/einstellungen")) return "settings";
  return "dashboard_home";
}

async function postEvent(tour_key: string, event: string, step_index?: number) {
  const res = await fetch("/api/tours/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tour_key, event, step_index }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Tour event failed");
  return data?.tour;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [state, setState] = useState<TourState>({
    tour_key: null,
    status: "not_started",
    current_step: 0,
    isOpen: false,
  });

  const startTour = useCallback(
    async (tourKey: string, opts?: { step?: number }) => {
      const step = opts?.step ?? 0;
      const tour = await postEvent(tourKey, "start", step);
      setState({
        tour_key: tourKey,
        status: tour?.status ?? "in_progress",
        current_step: tour?.current_step ?? step,
        isOpen: true,
      });
    },
    [],
  );

  const closeTour = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  const next = useCallback(
    async (nextStep: number) => {
      if (!state.tour_key) return;
      const tour = await postEvent(state.tour_key, "next", nextStep);
      setState((s) => ({
        ...s,
        status: tour?.status ?? "in_progress",
        current_step: tour?.current_step ?? nextStep,
        isOpen: true,
      }));
    },
    [state.tour_key],
  );

  const completeTour = useCallback(async () => {
    if (!state.tour_key) return;
    const tour = await postEvent(
      state.tour_key,
      "complete",
      state.current_step,
    );
    setState((s) => ({
      ...s,
      status: tour?.status ?? "completed",
      isOpen: false,
    }));
  }, [state.tour_key, state.current_step]);

  const skipTour = useCallback(async () => {
    if (!state.tour_key) return;
    const tour = await postEvent(state.tour_key, "skip", state.current_step);
    setState((s) => ({
      ...s,
      status: tour?.status ?? "skipped",
      isOpen: false,
    }));
  }, [state.tour_key, state.current_step]);

  const resetTour = useCallback(async (tourKey: string) => {
    await postEvent(tourKey, "reset", 0);
    setState((s) => ({
      ...s,
      tour_key: null,
      status: "not_started",
      current_step: 0,
      isOpen: false,
    }));
  }, []);

  const startTourForCurrentPage = useCallback(async () => {
    const key = tourKeyFromPathname(pathname || "/app");
    // optional: zur Startseite der jeweiligen Section navigieren
    // router.push(...); -> später, wenn wir die Multi-Page Tour exakt definieren
    await startTour(key, { step: 0 });
  }, [pathname, startTour]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      startTour,
      closeTour,
      completeTour,
      skipTour,
      next,
      resetTour,
      startTourForCurrentPage,
    }),
    [
      state,
      startTour,
      closeTour,
      completeTour,
      skipTour,
      next,
      resetTour,
      startTourForCurrentPage,
    ],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}
