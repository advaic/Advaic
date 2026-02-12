// app/api/tour/skip/route.ts
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
    },
  );
}

function jsonError(status: number, error: string, extra?: Record<string, any>) {
  return NextResponse.json({ ok: false, error, ...(extra || {}) }, { status });
}

const DEFAULT_TOUR_KEY = "dashboard_v1";

type Body = {
  tour_key?: string;
  route?: string | null;
};

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseFromReq(req, res);

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return jsonError(401, "Unauthorized");

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError(400, "Missing body");

  const tour_key = String(body.tour_key || DEFAULT_TOUR_KEY).trim();
  const route = body.route ? String(body.route).trim() : null;

  // Load current (for event step)
  const current = await (supabase.from("agent_tour_state") as any)
    .select("current_step")
    .eq("agent_id", user.id)
    .eq("tour_key", tour_key)
    .maybeSingle();

  const step = Math.max(1, Number(current?.data?.current_step || 1));

  const { data, error } = await (supabase.from("agent_tour_state") as any)
    .upsert(
      {
        agent_id: user.id,
        tour_key,
        status: "skipped",
        last_seen_route: route,
        skipped_at: new Date().toISOString(),
      },
      { onConflict: "agent_id,tour_key" },
    )
    .select(
      "agent_id, tour_key, status, current_step, last_seen_route, started_at, completed_at, skipped_at, updated_at",
    )
    .maybeSingle();

  if (error)
    return jsonError(500, "Failed to skip tour", { details: error.message });

  await (supabase.from("agent_tour_step_events") as any).insert({
    agent_id: user.id,
    tour_key,
    step,
    event: "skipped",
    route,
    meta: {},
  });

  return NextResponse.json({ ok: true, state: data });
}
