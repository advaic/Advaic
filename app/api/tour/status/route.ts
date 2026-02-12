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

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseFromReq(req, res);

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return jsonError(401, "Unauthorized");

  const url = new URL(req.url);
  const tour_key = (url.searchParams.get("tour_key") || "").trim();

  if (!tour_key) return jsonError(400, "Missing tour_key");

  const { data, error } = await (supabase.from("agent_tours") as any)
    .select(
      "agent_id, tour_key, status, current_step, completed_steps, skipped_steps, last_seen_at, started_at, completed_at",
    )
    .eq("agent_id", user.id)
    .eq("tour_key", tour_key)
    .maybeSingle();

  if (error)
    return jsonError(500, "Failed to load tour status", {
      details: error.message,
    });

  // Fail-open Default (noch keine Row)
  const fallback = {
    agent_id: user.id,
    tour_key,
    status: "not_started",
    current_step: 0,
    completed_steps: [],
    skipped_steps: [],
    last_seen_at: null,
    started_at: null,
    completed_at: null,
  };

  return NextResponse.json({ ok: true, tour: data || fallback });
}
