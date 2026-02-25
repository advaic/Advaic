export type FollowupSendWindowConfig = {
  timezone: string;
  sendStartHour: number; // 0..23
  sendEndHour: number; // 0..23, equals start means 24h window
  sendOnWeekends: boolean;
};

const DEFAULT_WINDOW: FollowupSendWindowConfig = {
  timezone: "Europe/Berlin",
  sendStartHour: 8,
  sendEndHour: 20,
  sendOnWeekends: false,
};

function clampInt(n: unknown, min: number, max: number, fallback: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}

function normalizeBool(v: unknown, fallback: boolean) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    if (s === "true" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "0" || s === "no") return false;
  }
  return fallback;
}

function isValidTimeZone(v: unknown): v is string {
  const tz = String(v || "").trim();
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("de-DE", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function readPart(parts: Intl.DateTimeFormatPart[], type: string) {
  return parts.find((p) => p.type === type)?.value ?? "";
}

function localTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const weekday = readPart(parts, "weekday");
  const hour = Number(readPart(parts, "hour"));
  const minute = Number(readPart(parts, "minute"));

  return {
    weekday,
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

function isWeekendDay(weekday: string) {
  return weekday === "Sat" || weekday === "Sun";
}

function hourAllowed(
  hour: number,
  windowStart: number,
  windowEnd: number,
): boolean {
  if (windowStart === windowEnd) return true;
  if (windowStart < windowEnd) {
    return hour >= windowStart && hour < windowEnd;
  }
  return hour >= windowStart || hour < windowEnd;
}

function isAllowedAt(date: Date, window: FollowupSendWindowConfig): boolean {
  const local = localTimeParts(date, window.timezone);
  if (!window.sendOnWeekends && isWeekendDay(local.weekday)) return false;
  return hourAllowed(local.hour, window.sendStartHour, window.sendEndHour);
}

export function normalizeFollowupSendWindow(
  input: Partial<{
    followups_timezone: unknown;
    followups_send_start_hour: unknown;
    followups_send_end_hour: unknown;
    followups_send_on_weekends: unknown;
  }>,
): FollowupSendWindowConfig {
  const timezone = isValidTimeZone(input.followups_timezone)
    ? String(input.followups_timezone)
    : DEFAULT_WINDOW.timezone;

  const sendStartHour = clampInt(
    input.followups_send_start_hour,
    0,
    23,
    DEFAULT_WINDOW.sendStartHour,
  );
  const sendEndHour = clampInt(
    input.followups_send_end_hour,
    0,
    23,
    DEFAULT_WINDOW.sendEndHour,
  );
  const sendOnWeekends = normalizeBool(
    input.followups_send_on_weekends,
    DEFAULT_WINDOW.sendOnWeekends,
  );

  return {
    timezone,
    sendStartHour,
    sendEndHour,
    sendOnWeekends,
  };
}

export function computeFollowupNextAt(args: {
  baseIso?: string | null;
  delayHours: number;
  window: FollowupSendWindowConfig;
}): string {
  const baseMs = args.baseIso ? Date.parse(args.baseIso) : Date.now();
  const safeBase = Number.isFinite(baseMs) ? baseMs : Date.now();
  const safeDelay = clampInt(args.delayHours, 1, 24 * 14, 24);

  const stepMs = 30 * 60 * 1000;
  let candidate = safeBase + safeDelay * 60 * 60 * 1000;
  candidate = Math.ceil(candidate / stepMs) * stepMs;

  // Search up to 28 days ahead in 30-min steps.
  const maxSteps = 28 * 24 * 2;
  for (let i = 0; i < maxSteps; i++) {
    const probe = new Date(candidate);
    if (isAllowedAt(probe, args.window)) {
      return probe.toISOString();
    }
    candidate += stepMs;
  }

  return new Date(candidate).toISOString();
}

