export type SafeStartFollowupMode = "aus" | "vorsichtig" | "aktiv";

export type SafeStartPreset = {
  preset: "safe-start";
  autoShare: number;
  approvalShare: number;
  ignoreShare: number;
  followupMode: SafeStartFollowupMode;
  capturedAt: string;
  source: "signup" | "login" | "website";
};

type QueryParamsLike = {
  get(name: string): string | null;
};

const STORAGE_KEY = "advaic_safe_start_preset_v1";
const TTL_MS = 14 * 24 * 60 * 60 * 1000;

function clampPercent(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parsePercent(value: unknown, fallback: number) {
  const parsed = Number(value);
  return clampPercent(parsed, fallback);
}

function normalizeFollowupMode(value: unknown): SafeStartFollowupMode {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (v === "aus" || v === "aktiv" || v === "vorsichtig") return v;
  return "vorsichtig";
}

function hasWindow() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function parseSafeStartPresetFromParams(
  params: QueryParamsLike | null | undefined,
  source: SafeStartPreset["source"] = "website",
): SafeStartPreset | null {
  if (!params) return null;
  const presetRaw = String(params.get("preset") || "")
    .trim()
    .toLowerCase();
  if (presetRaw !== "safe-start") return null;

  const autoShare = parsePercent(params.get("auto"), 20);
  const approvalShare = parsePercent(params.get("approval"), 70);
  const computedIgnore = 100 - autoShare - approvalShare;
  const ignoreShare = clampPercent(computedIgnore, 10);

  return {
    preset: "safe-start",
    autoShare,
    approvalShare,
    ignoreShare,
    followupMode: normalizeFollowupMode(params.get("followup")),
    capturedAt: new Date().toISOString(),
    source,
  };
}

export function serializeSafeStartPresetToQuery(
  preset: Pick<SafeStartPreset, "preset" | "autoShare" | "approvalShare" | "followupMode">,
): string {
  const qs = new URLSearchParams();
  qs.set("preset", preset.preset);
  qs.set("auto", String(clampPercent(preset.autoShare, 20)));
  qs.set("approval", String(clampPercent(preset.approvalShare, 70)));
  qs.set("followup", normalizeFollowupMode(preset.followupMode));
  return qs.toString();
}

export function saveSafeStartPreset(preset: SafeStartPreset) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
  } catch {
    // Best effort only.
  }
}

export function readSafeStartPreset(): SafeStartPreset | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SafeStartPreset> | null;
    if (!parsed || parsed.preset !== "safe-start") {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const createdAt = new Date(String(parsed.capturedAt || "")).getTime();
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const autoShare = parsePercent(parsed.autoShare, 20);
    const approvalShare = parsePercent(parsed.approvalShare, 70);
    const ignoreShare = clampPercent(100 - autoShare - approvalShare, 10);

    return {
      preset: "safe-start",
      autoShare,
      approvalShare,
      ignoreShare,
      followupMode: normalizeFollowupMode(parsed.followupMode),
      capturedAt: new Date(createdAt).toISOString(),
      source:
        parsed.source === "signup" || parsed.source === "login" || parsed.source === "website"
          ? parsed.source
          : "website",
    };
  } catch {
    return null;
  }
}

export function clearSafeStartPreset() {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best effort only.
  }
}

