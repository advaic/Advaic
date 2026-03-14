import { useEffect, useRef } from "react";
import { trackFunnelEvent } from "@/lib/funnel/track";

type UiMetricEventInput = {
  event: string;
  source: string;
  path?: string;
  routeKey?: string;
  meta?: Record<string, unknown>;
};

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

export function trackUiMetricEvent({
  event,
  source,
  path,
  routeKey,
  meta,
}: UiMetricEventInput) {
  void trackFunnelEvent({
    event,
    source,
    path,
    meta: {
      ...(routeKey ? { route_key: routeKey } : {}),
      ...(meta || {}),
    },
  });
}

export function trackSettingsToggleAttempt(args: {
  source: string;
  path: string;
  routeKey: string;
  settingKey: string;
  nextValue: boolean | null;
  surface?: string;
  meta?: Record<string, unknown>;
}) {
  trackUiMetricEvent({
    event: "settings_toggle_attempt",
    source: args.source,
    path: args.path,
    routeKey: args.routeKey,
    meta: {
      setting_key: args.settingKey,
      next_value: args.nextValue,
      surface: args.surface || null,
      ...(args.meta || {}),
    },
  });
}

export function trackSettingsToggleSuccess(args: {
  source: string;
  path: string;
  routeKey: string;
  settingKey: string;
  nextValue: boolean | null;
  surface?: string;
  meta?: Record<string, unknown>;
}) {
  trackUiMetricEvent({
    event: "settings_toggle_success",
    source: args.source,
    path: args.path,
    routeKey: args.routeKey,
    meta: {
      setting_key: args.settingKey,
      next_value: args.nextValue,
      surface: args.surface || null,
      ...(args.meta || {}),
    },
  });
}

export function useUiRouteMetric(args: {
  routeKey: string;
  source: string;
  path?: string;
  viewMeta?: Record<string, unknown>;
}) {
  const startedAtRef = useRef(0);
  const firstActionTrackedRef = useRef(false);
  const initialViewMetaRef = useRef(args.viewMeta || {});

  useEffect(() => {
    startedAtRef.current = nowMs();
    trackUiMetricEvent({
      event: "app_route_view",
      source: args.source,
      path: args.path,
      routeKey: args.routeKey,
      meta: initialViewMetaRef.current,
    });
  }, [args.path, args.routeKey, args.source]);

  const markFirstAction = (action: string, meta?: Record<string, unknown>) => {
    if (firstActionTrackedRef.current) return;
    firstActionTrackedRef.current = true;
    trackUiMetricEvent({
      event: "ui_first_action",
      source: args.source,
      path: args.path,
      routeKey: args.routeKey,
      meta: {
        action,
        time_to_first_action_ms: Math.max(0, Math.round(nowMs() - startedAtRef.current)),
        ...(meta || {}),
      },
    });
  };

  return { markFirstAction };
}
