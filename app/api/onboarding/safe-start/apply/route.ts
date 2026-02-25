import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type FollowupMode = "aus" | "vorsichtig" | "aktiv";

type Body = {
  preset?: string;
  auto_share?: number;
  approval_share?: number;
  followup_mode?: FollowupMode;
  source?: string;
};

function mustEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(extra || {}) }, { status });
}

function supabaseFromReq(req: NextRequest, res: NextResponse) {
  return createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    },
  );
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function clampPercent(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeMode(value: unknown): FollowupMode {
  const mode = String(value ?? "")
    .trim()
    .toLowerCase();
  if (mode === "aus" || mode === "aktiv" || mode === "vorsichtig") return mode;
  return "vorsichtig";
}

function confidenceFromAutoShare(autoShare: number) {
  if (autoShare <= 15) return 0.99;
  if (autoShare <= 30) return 0.98;
  return 0.97;
}

function followupDefaults(mode: FollowupMode) {
  if (mode === "aus") {
    return {
      followups_enabled_default: false,
      followups_sender_mode: "always_approval",
      followups_delay_hours_stage1: 48,
      followups_delay_hours_stage2: 96,
    } as const;
  }
  if (mode === "aktiv") {
    return {
      followups_enabled_default: true,
      followups_sender_mode: "autosend_if_enabled",
      followups_delay_hours_stage1: 24,
      followups_delay_hours_stage2: 72,
    } as const;
  }
  return {
    followups_enabled_default: true,
    followups_sender_mode: "always_approval",
    followups_delay_hours_stage1: 48,
    followups_delay_hours_stage2: 96,
  } as const;
}

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseFromReq(req, res);
  const admin = supabaseAdmin();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user?.id) return jsonError(401, "Unauthorized");

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError(400, "missing_body");

  const preset = String(body.preset || "")
    .trim()
    .toLowerCase();
  if (preset !== "safe-start") return jsonError(400, "invalid_preset");

  const autoShare = clampPercent(body.auto_share, 20);
  const approvalShare = clampPercent(body.approval_share, 70);
  const followupMode = normalizeMode(body.followup_mode);
  const source = String(body.source || "login").trim().slice(0, 80) || "login";
  const autoSendMinConfidence = confidenceFromAutoShare(autoShare);
  const followup = followupDefaults(followupMode);

  const sharedPatch = {
    agent_id: String(user.id),
    autosend_enabled: false,
    reply_mode: "approval",
    auto_send_min_confidence: autoSendMinConfidence,
    followups_enabled_default: followup.followups_enabled_default,
    followups_sender_mode: followup.followups_sender_mode,
    followups_delay_hours_stage1: followup.followups_delay_hours_stage1,
    followups_delay_hours_stage2: followup.followups_delay_hours_stage2,
  };

  let saved: any = null;
  const { data: fullData, error: fullErr } = await (admin.from("agent_settings") as any)
    .upsert(sharedPatch, { onConflict: "agent_id" })
    .select(
      "agent_id, autosend_enabled, reply_mode, auto_send_min_confidence, followups_enabled_default, followups_sender_mode, followups_delay_hours_stage1, followups_delay_hours_stage2",
    )
    .maybeSingle();

  if (fullErr) {
    // Fallback for environments where not all follow-up columns are present.
    const fallbackPatch = {
      agent_id: String(user.id),
      autosend_enabled: false,
      reply_mode: "approval",
      auto_send_min_confidence: autoSendMinConfidence,
      followups_enabled_default: followup.followups_enabled_default,
    };
    const { data: fallbackData, error: fallbackErr } = await (admin.from("agent_settings") as any)
      .upsert(fallbackPatch, { onConflict: "agent_id" })
      .select(
        "agent_id, autosend_enabled, reply_mode, auto_send_min_confidence, followups_enabled_default",
      )
      .maybeSingle();

    if (fallbackErr) {
      return jsonError(500, "safe_start_apply_failed", {
        details: String(fallbackErr.message || fallbackErr),
      });
    }
    saved = fallbackData || fallbackPatch;
  } else {
    saved = fullData || sharedPatch;
  }

  const createdAt = new Date().toISOString();
  const payload = {
    event: "safe_start_preset_applied",
    source: "onboarding_safe_start_apply_api",
    path: "/app/onboarding",
    step: 1,
    meta: {
      preset: "safe-start",
      preset_source: source,
      auto_share: autoShare,
      approval_share: approvalShare,
      followup_mode: followupMode,
      autosend_enabled: false,
      auto_send_min_confidence: autoSendMinConfidence,
    },
    created_at: createdAt,
  };

  await (admin.from("notification_events") as any)
    .insert({
      agent_id: String(user.id),
      type: "funnel_event",
      entity_type: "funnel",
      entity_id: "safe_start_preset_applied",
      payload,
    })
    .then(() => null)
    .catch(() => null);

  return NextResponse.json({
    ok: true,
    preset: {
      preset: "safe-start",
      auto_share: autoShare,
      approval_share: approvalShare,
      followup_mode: followupMode,
    },
    settings: saved,
  });
}

