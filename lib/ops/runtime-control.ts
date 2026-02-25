import type { SupabaseClient } from "@supabase/supabase-js";

export type PipelineKey =
  | "reply_ready_send"
  | "followups"
  | "onboarding_recovery"
  | "outlook_fetch";

export type RuntimeControlState = {
  source: "table" | "default";
  pause_all: boolean;
  pause_reply_ready_send: boolean;
  pause_followups: boolean;
  pause_onboarding_recovery: boolean;
  pause_outlook_fetch: boolean;
  reason: string | null;
  updated_at: string | null;
};

const DEFAULT_CONTROL: RuntimeControlState = {
  source: "default",
  pause_all: false,
  pause_reply_ready_send: false,
  pause_followups: false,
  pause_onboarding_recovery: false,
  pause_outlook_fetch: false,
  reason: null,
  updated_at: null,
};

export async function readRuntimeControl(
  supabase: SupabaseClient<any, "public", any>,
): Promise<RuntimeControlState> {
  try {
    const { data, error } = await (supabase.from("ops_runtime_controls") as any)
      .select(
        "pause_all, pause_reply_ready_send, pause_followups, pause_onboarding_recovery, pause_outlook_fetch, reason, updated_at",
      )
      .eq("id", true)
      .maybeSingle();

    if (error || !data) return DEFAULT_CONTROL;

    return {
      source: "table",
      pause_all: Boolean(data.pause_all),
      pause_reply_ready_send: Boolean(data.pause_reply_ready_send),
      pause_followups: Boolean(data.pause_followups),
      pause_onboarding_recovery: Boolean(data.pause_onboarding_recovery),
      pause_outlook_fetch: Boolean(data.pause_outlook_fetch),
      reason: data.reason ? String(data.reason) : null,
      updated_at: data.updated_at ? String(data.updated_at) : null,
    };
  } catch {
    return DEFAULT_CONTROL;
  }
}

export function isPipelinePaused(control: RuntimeControlState, pipeline: PipelineKey): boolean {
  if (control.pause_all) return true;
  if (pipeline === "reply_ready_send") return control.pause_reply_ready_send;
  if (pipeline === "followups") return control.pause_followups;
  if (pipeline === "onboarding_recovery") return control.pause_onboarding_recovery;
  if (pipeline === "outlook_fetch") return control.pause_outlook_fetch;
  return false;
}

