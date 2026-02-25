"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPublicEvent } from "@/lib/funnel/public-track";

const MILESTONES = [25, 50, 75, 90];

function computeScrollDepthPercent() {
  const doc = document.documentElement;
  const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
  const value = (window.scrollY / scrollable) * 100;
  return Math.max(0, Math.min(100, value));
}

export default function PublicExperienceTracker() {
  const pathname = usePathname() || "/";
  const firedMilestonesRef = useRef<Set<number>>(new Set());
  const startedAtRef = useRef<number>(0);

  const timerMilestones = useMemo(
    () => [
      { seconds: 30, event: "marketing_time_on_page_30s" },
      { seconds: 90, event: "marketing_time_on_page_90s" },
    ],
    [],
  );

  useEffect(() => {
    startedAtRef.current = Date.now();
    firedMilestonesRef.current = new Set();

    void trackPublicEvent({
      event: "marketing_page_view",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: { section: "experience-tracker" },
    });

    const onScroll = () => {
      const depth = computeScrollDepthPercent();
      for (const milestone of MILESTONES) {
        if (depth < milestone) continue;
        if (firedMilestonesRef.current.has(milestone)) continue;
        firedMilestonesRef.current.add(milestone);
        void trackPublicEvent({
          event: "marketing_scroll_depth",
          source: "website",
          path: pathname,
          pageGroup: "marketing",
          meta: {
            section: "experience-tracker",
            milestone_percent: milestone,
            depth_percent: Math.round(depth),
          },
        });
      }
    };

    const timeoutIds = timerMilestones.map((timer) =>
      window.setTimeout(() => {
        void trackPublicEvent({
          event: timer.event,
          source: "website",
          path: pathname,
          pageGroup: "marketing",
          meta: {
            section: "experience-tracker",
            seconds: timer.seconds,
          },
        });
      }, timer.seconds * 1000),
    );

    const onBeforeUnload = () => {
      const seconds = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));
      void trackPublicEvent({
        event: "marketing_page_exit",
        source: "website",
        path: pathname,
        pageGroup: "marketing",
        meta: {
          section: "experience-tracker",
          duration_seconds: seconds,
          reached_milestones: Array.from(firedMilestonesRef.current).sort((a, b) => a - b),
        },
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", onBeforeUnload);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onBeforeUnload);
      for (const id of timeoutIds) window.clearTimeout(id);
      onBeforeUnload();
    };
  }, [pathname, timerMilestones]);

  return null;
}
