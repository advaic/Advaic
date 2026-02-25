import type { SupabaseClient } from "@supabase/supabase-js";

export type PipelineRunStatus = "ok" | "warning" | "error" | "paused";

export type PipelineRunInput = {
  pipeline: string;
  status: PipelineRunStatus;
  startedAtMs: number;
  processed?: number;
  success?: number;
  failed?: number;
  skipped?: number;
  meta?: Record<string, unknown>;
};

function toNonNegativeInt(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

export async function logPipelineRun(
  supabase: SupabaseClient<any, "public", any>,
  input: PipelineRunInput,
): Promise<void> {
  const durationMs = Math.max(0, Date.now() - Math.max(0, input.startedAtMs || 0));
  const row = {
    pipeline: String(input.pipeline || "unknown").slice(0, 120),
    status: input.status,
    duration_ms: toNonNegativeInt(durationMs, 0),
    processed: toNonNegativeInt(input.processed, 0),
    success: toNonNegativeInt(input.success, 0),
    failed: toNonNegativeInt(input.failed, 0),
    skipped: toNonNegativeInt(input.skipped, 0),
    meta:
      input.meta && typeof input.meta === "object" && !Array.isArray(input.meta)
        ? input.meta
        : {},
  };

  await (supabase.from("pipeline_runs") as any)
    .insert(row)
    .then(() => null)
    .catch(() => null);
}

