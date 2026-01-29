import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
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
    }
  );
}

type Body = {
  // optional step number (1..12)
  current_step?: number;

  // allow toggling specific flags (only those you defined)
  step_welcome_done?: boolean;
  step_email_connected_done?: boolean;
  step_autosend_done?: boolean;
  step_tone_style_done?: boolean;
  step_listings_sync_done?: boolean;
  step_finish_done?: boolean;

  // finalization
  completed?: boolean;
  tour_completed?: boolean;
};

function clampInt(n: any, min: number, max: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return Math.max(min, Math.min(max, Math.trunc(x)));
}

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseFromReq(req, res);

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "Missing body" }, { status: 400 });
  }

  const patch: Record<string, any> = {};

  const step = clampInt(body.current_step, 1, 12);
  if (step !== null) patch.current_step = step;

  for (const key of [
    "step_welcome_done",
    "step_email_connected_done",
    "step_autosend_done",
    "step_tone_style_done",
    "step_listings_sync_done",
    "step_finish_done",
  ] as const) {
    if (typeof body[key] === "boolean") patch[key] = body[key];
  }

  if (body.completed === true) {
    patch.completed_at = new Date().toISOString();
    patch.step_finish_done = true;
  }

  if (body.tour_completed === true) {
    patch.tour_completed_at = new Date().toISOString();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  // RLS allows update only for own agent_id
  const { data, error } = await (supabase.from("agent_onboarding") as any)
    .update(patch)
    .eq("agent_id", user.id)
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
