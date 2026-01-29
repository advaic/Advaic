export async function GET(req: NextRequest) {
  const auth = supabaseAuth(req);
  const {
    data: { user },
    error: authErr,
  } = await auth.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const agentId = user.id;

  // Ensure row exists (idempotent)
  await (admin.from("agent_onboarding") as any).upsert(
    { agent_id: agentId, total_steps: 6, current_step: 1 },
    { onConflict: "agent_id" }
  );

  const { data: onboarding, error: onboardingErr } = await (admin.from("agent_onboarding") as any)
    .select("agent_id, current_step, total_steps, completed_at, tour_completed_at")
    .eq("agent_id", agentId)
    .maybeSingle();
  if (onboardingErr) {
    return NextResponse.json(
      { error: "Failed to load onboarding", details: onboardingErr.message },
      { status: 500 }
    );
  }

  const { data: connections, error: connErr } = await (admin.from("email_connections") as any)
    .select("provider, status, email_address, watch_active, last_error")
    .eq("agent_id", agentId)
    .in("provider", ["gmail", "outlook"]);
  if (connErr) {
    return NextResponse.json(
      { error: "Failed to load email connections", details: connErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, onboarding: onboarding || null, connections: connections || [] });
}
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function supabaseAuth(req: NextRequest) {
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
    }
  );
}

type Body = {
  // 1..6 typically
  current_step?: number;

  // flags (send only what changed)
  step_welcome_done?: boolean;
  step_email_connected_done?: boolean;
  step_autosend_done?: boolean;
  step_tone_style_done?: boolean;
  step_listings_sync_done?: boolean;
  step_finish_done?: boolean;

  // special events
  mark_completed?: boolean;
  mark_tour_completed?: boolean;
};

function clampStep(n: number, min = 1, max = 12) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export async function POST(req: NextRequest) {
  const auth = supabaseAuth(req);
  const {
    data: { user },
    error: authErr,
  } = await auth.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;

  const admin = supabaseAdmin();
  const agentId = user.id;

  // Ensure row exists (idempotent)
  await (admin.from("agent_onboarding") as any).upsert(
    { agent_id: agentId, total_steps: 6, current_step: 1 },
    { onConflict: "agent_id" }
  );

  const patch: Record<string, any> = {};

  // Only allow known fields (prevent arbitrary updates)
  const boolFields: (keyof Body)[] = [
    "step_welcome_done",
    "step_email_connected_done",
    "step_autosend_done",
    "step_tone_style_done",
    "step_listings_sync_done",
    "step_finish_done",
  ];

  for (const k of boolFields) {
    if (typeof body?.[k] === "boolean") patch[k] = body[k];
  }

  if (typeof body?.current_step === "number") {
    patch.current_step = clampStep(body.current_step, 1, 12);
  }

  const now = new Date().toISOString();
  if (body?.mark_completed) patch.completed_at = now;
  if (body?.mark_tour_completed) patch.tour_completed_at = now;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  const { data, error } = await (admin.from("agent_onboarding") as any)
    .update(patch)
    .eq("agent_id", agentId)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update onboarding", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, onboarding: data });
}