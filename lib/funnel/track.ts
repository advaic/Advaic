type TrackInput = {
  event: string;
  step?: number;
  source?: string;
  path?: string;
  meta?: Record<string, unknown>;
};

export async function trackFunnelEvent(input: TrackInput): Promise<void> {
  if (typeof window === "undefined") return;
  const event = String(input.event || "").trim();
  if (!event) return;

  const body = {
    event,
    step: typeof input.step === "number" ? input.step : null,
    source: input.source || "app",
    path: input.path || window.location.pathname,
    meta: input.meta || {},
  };

  try {
    await fetch("/api/funnel/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Telemetry must never break product flows.
  }
}

