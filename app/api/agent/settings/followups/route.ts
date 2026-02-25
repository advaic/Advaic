import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { normalizeFollowupSendWindow } from "@/lib/followups/scheduling";
import {
  getCommercialAccess,
  paymentRequiredMeta,
} from "@/lib/billing/commercial-access";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function jsonError(status: number, error: string, extra?: Record<string, any>) {
  return NextResponse.json({ error, ...(extra || {}) }, { status });
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function clampInt(n: any, min: number, max: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return Math.min(max, Math.max(min, Math.round(x)));
}

type FollowupSettings = {
  followups_enabled_default: boolean;
  followups_max_stage_rent: number; // 0..2
  followups_max_stage_buy: number; // 0..2
  followups_delay_hours_stage1: number; // 1..336
  followups_delay_hours_stage2: number; // 1..336
  followups_sender_mode: "always_approval" | "autosend_if_enabled" | null;
  followups_send_start_hour: number; // 0..23
  followups_send_end_hour: number; // 0..23
  followups_send_on_weekends: boolean;
  followups_timezone: string;
};

const DEFAULTS: FollowupSettings = {
  followups_enabled_default: true,
  followups_max_stage_rent: 2,
  followups_max_stage_buy: 2,
  followups_delay_hours_stage1: 24,
  followups_delay_hours_stage2: 72,
  followups_sender_mode: null,
  followups_send_start_hour: 8,
  followups_send_end_hour: 20,
  followups_send_on_weekends: false,
  followups_timezone: "Europe/Berlin",
};

function validate(body: any): FollowupSettings | null {
  const enabled =
    typeof body?.followups_enabled_default === "boolean"
      ? body.followups_enabled_default
      : DEFAULTS.followups_enabled_default;

  const maxRent =
    clampInt(body?.followups_max_stage_rent, 0, 2) ??
    DEFAULTS.followups_max_stage_rent;
  const maxBuy =
    clampInt(body?.followups_max_stage_buy, 0, 2) ??
    DEFAULTS.followups_max_stage_buy;

  const d1 =
    clampInt(body?.followups_delay_hours_stage1, 1, 336) ??
    DEFAULTS.followups_delay_hours_stage1;
  const d2 =
    clampInt(body?.followups_delay_hours_stage2, 1, 336) ??
    DEFAULTS.followups_delay_hours_stage2;

  const modeRaw = body?.followups_sender_mode;
  const mode =
    modeRaw === null || modeRaw === undefined
      ? null
      : modeRaw === "always_approval" || modeRaw === "autosend_if_enabled"
        ? modeRaw
        : null;

  const sendWindow = normalizeFollowupSendWindow({
    followups_send_start_hour: body?.followups_send_start_hour,
    followups_send_end_hour: body?.followups_send_end_hour,
    followups_send_on_weekends: body?.followups_send_on_weekends,
    followups_timezone: body?.followups_timezone,
  });

  return {
    followups_enabled_default: enabled,
    followups_max_stage_rent: maxRent,
    followups_max_stage_buy: maxBuy,
    followups_delay_hours_stage1: d1,
    followups_delay_hours_stage2: d2,
    followups_sender_mode: mode,
    followups_send_start_hour: sendWindow.sendStartHour,
    followups_send_end_hour: sendWindow.sendEndHour,
    followups_send_on_weekends: sendWindow.sendOnWeekends,
    followups_timezone: sendWindow.timezone,
  };
}

function createSupabase(req: NextRequest) {
  return createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );
}

const LEGACY_SELECT =
  "agent_id, followups_enabled_default, followups_max_stage_rent, followups_max_stage_buy, followups_delay_hours_stage1, followups_delay_hours_stage2, followups_sender_mode";
const EXTENDED_SELECT =
  `${LEGACY_SELECT}, followups_send_start_hour, followups_send_end_hour, followups_send_on_weekends, followups_timezone`;

export async function GET(req: NextRequest) {
  const supabase = createSupabase(req);

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return jsonError(401, "Unauthorized");
  const agentId = auth.user.id;
  const billingAccess = await getCommercialAccess({
    supabase: supabaseAdmin(),
    agentId,
  });

  let data: any = null;
  let error: any = null;
  try {
    const ext = await (supabase.from("agent_settings") as any)
      .select(EXTENDED_SELECT)
      .eq("agent_id", agentId)
      .maybeSingle();
    data = ext?.data ?? null;
    error = ext?.error ?? null;
  } catch (e: any) {
    error = e;
  }

  if (error) {
    const legacy = await (supabase.from("agent_settings") as any)
      .select(LEGACY_SELECT)
      .eq("agent_id", agentId)
      .maybeSingle();
    data = legacy?.data ?? null;
    error = legacy?.error ?? null;
  }

  if (error)
    return jsonError(500, "Failed to load settings", {
      details: error.message,
    });

  const merged: FollowupSettings = {
    followups_enabled_default:
      data?.followups_enabled_default ?? DEFAULTS.followups_enabled_default,
    followups_max_stage_rent:
      data?.followups_max_stage_rent ?? DEFAULTS.followups_max_stage_rent,
    followups_max_stage_buy:
      data?.followups_max_stage_buy ?? DEFAULTS.followups_max_stage_buy,
    followups_delay_hours_stage1:
      data?.followups_delay_hours_stage1 ??
      DEFAULTS.followups_delay_hours_stage1,
    followups_delay_hours_stage2:
      data?.followups_delay_hours_stage2 ??
      DEFAULTS.followups_delay_hours_stage2,
    followups_sender_mode:
      data?.followups_sender_mode ?? DEFAULTS.followups_sender_mode,
    followups_send_start_hour:
      clampInt(
        data?.followups_send_start_hour,
        0,
        23,
      ) ?? DEFAULTS.followups_send_start_hour,
    followups_send_end_hour:
      clampInt(
        data?.followups_send_end_hour,
        0,
        23,
      ) ?? DEFAULTS.followups_send_end_hour,
    followups_send_on_weekends:
      typeof data?.followups_send_on_weekends === "boolean"
        ? data.followups_send_on_weekends
        : DEFAULTS.followups_send_on_weekends,
    followups_timezone:
      typeof data?.followups_timezone === "string" &&
      data.followups_timezone.trim().length > 0
        ? data.followups_timezone
        : DEFAULTS.followups_timezone,
  };

  return NextResponse.json({
    ok: true,
    settings: merged,
    billing_access: billingAccess.access,
  });
}

export async function POST(req: NextRequest) {
  const supabase = createSupabase(req);

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return jsonError(401, "Unauthorized");
  const agentId = auth.user.id;
  const billingAccess = await getCommercialAccess({
    supabase: supabaseAdmin(),
    agentId,
  });
  if (billingAccess.access.upgrade_required) {
    return NextResponse.json(paymentRequiredMeta(billingAccess.access), {
      status: 402,
    });
  }

  const body = await req.json().catch(() => null);
  if (!body) return jsonError(400, "Missing body");

  const validated = validate(body);
  if (!validated) return jsonError(400, "Invalid body");

  const payload = { agent_id: agentId, ...validated };
  const legacyPayload = {
    agent_id: agentId,
    followups_enabled_default: validated.followups_enabled_default,
    followups_max_stage_rent: validated.followups_max_stage_rent,
    followups_max_stage_buy: validated.followups_max_stage_buy,
    followups_delay_hours_stage1: validated.followups_delay_hours_stage1,
    followups_delay_hours_stage2: validated.followups_delay_hours_stage2,
    followups_sender_mode: validated.followups_sender_mode,
  };

  let data: any = null;
  let error: any = null;
  try {
    const ext = await (supabase.from("agent_settings") as any)
      .upsert(payload, { onConflict: "agent_id" })
      .select(EXTENDED_SELECT)
      .single();
    data = ext?.data ?? null;
    error = ext?.error ?? null;
  } catch (e: any) {
    error = e;
  }

  if (error) {
    const legacy = await (supabase.from("agent_settings") as any)
      .upsert(legacyPayload, { onConflict: "agent_id" })
      .select(LEGACY_SELECT)
      .single();
    data = legacy?.data ?? null;
    error = legacy?.error ?? null;
  }

  if (error)
    return jsonError(500, "Failed to save settings", {
      details: error.message,
    });

  return NextResponse.json({
    ok: true,
    settings: data,
    billing_access: billingAccess.access,
  });
}
