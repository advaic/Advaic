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

type EventType = "start" | "next" | "skip" | "complete" | "reset" | "seen";

type Body = {
  tour_key?: string;
  event?: EventType;
  step_index?: number; // current step after event
};

function normJsonArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  return [];
}

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

  const tour_key = String(body.tour_key || "").trim();
  const event = String(body.event || "").trim() as EventType;

  if (!tour_key) return jsonError(400, "Missing tour_key");
  if (!event) return jsonError(400, "Missing event");

  const nowIso = new Date().toISOString();
  const step_index = Number.isFinite(body.step_index as any)
    ? Number(body.step_index)
    : null;

  // Load existing row (optional)
  const existing = await (supabase.from("agent_tours") as any)
    .select(
      "agent_id, tour_key, status, current_step, completed_steps, skipped_steps, started_at, completed_at",
    )
    .eq("agent_id", user.id)
    .eq("tour_key", tour_key)
    .maybeSingle();

  if (existing.error)
    return jsonError(500, "Failed to load tour", {
      details: existing.error.message,
    });

  const row = existing.data || {
    agent_id: user.id,
    tour_key,
    status: "not_started",
    current_step: 0,
    completed_steps: [],
    skipped_steps: [],
    started_at: null,
    completed_at: null,
  };

  let status = row.status as string;
  let current_step =
    typeof step_index === "number" ? step_index : Number(row.current_step || 0);

  let completed_steps = normJsonArray(row.completed_steps);
  let skipped_steps = normJsonArray(row.skipped_steps);

  let started_at = row.started_at;
  let completed_at = row.completed_at;

  if (event === "start") {
    status = "in_progress";
    started_at = started_at || nowIso;
    completed_at = null;
    current_step =
      typeof step_index === "number" ? step_index : Math.max(0, current_step);
  }

  if (event === "seen") {
    // no status change, just heartbeat
  }

  if (event === "next") {
    status = status === "completed" ? "completed" : "in_progress";
    if (typeof step_index === "number") current_step = step_index;
  }

  if (event === "skip") {
    status = "skipped";
    if (typeof step_index === "number") current_step = step_index;
  }

  if (event === "complete") {
    status = "completed";
    completed_at = nowIso;
    if (typeof step_index === "number") current_step = step_index;
  }

  if (event === "reset") {
    status = "not_started";
    current_step = 0;
    completed_steps = [];
    skipped_steps = [];
    started_at = null;
    completed_at = null;
  }

  const patch = {
    agent_id: user.id,
    tour_key,
    status,
    current_step,
    completed_steps,
    skipped_steps,
    started_at,
    completed_at,
    last_seen_at: nowIso,
  };

  const { data, error } = await (supabase.from("agent_tours") as any)
    .upsert(patch, { onConflict: "agent_id,tour_key" })
    .select(
      "agent_id, tour_key, status, current_step, completed_steps, skipped_steps, last_seen_at, started_at, completed_at",
    )
    .maybeSingle();

  if (error)
    return jsonError(500, "Failed to persist tour event", {
      details: error.message,
    });

  return NextResponse.json({ ok: true, tour: data });
}
