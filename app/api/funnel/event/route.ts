import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

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

type Body = {
  event?: string;
  step?: number | null;
  source?: string | null;
  path?: string | null;
  meta?: Record<string, unknown> | null;
};

function cleanText(value: unknown, fallback: string, max = 96) {
  const s = String(value ?? "")
    .trim()
    .slice(0, max);
  return s || fallback;
}

function addHoursIso(startIso: string, hours: number) {
  const start = new Date(startIso).getTime();
  if (!Number.isFinite(start)) return new Date().toISOString();
  return new Date(start + hours * 60 * 60 * 1000).toISOString();
}

async function updateOnboardingRecoveryByEvent(args: {
  admin: ReturnType<typeof supabaseAdmin>;
  agentId: string;
  event: string;
  createdAt: string;
}) {
  const { admin, agentId, event, createdAt } = args;
  if (
    event !== "onboarding_started" &&
    event !== "first_value_reached" &&
    event !== "onboarding_completed"
  ) {
    return;
  }

  const nowIso = createdAt;

  if (event === "onboarding_started") {
    const { data: existing } = await (admin.from("onboarding_recovery") as any)
      .select(
        "agent_id, onboarding_started_at, first_value_at, completed_at, remind_1h_due_at, remind_24h_due_at",
      )
      .eq("agent_id", agentId)
      .maybeSingle();

    if (!existing?.agent_id) {
      await (admin.from("onboarding_recovery") as any)
        .insert({
          agent_id: agentId,
          onboarding_started_at: nowIso,
          remind_1h_due_at: addHoursIso(nowIso, 1),
          remind_24h_due_at: addHoursIso(nowIso, 24),
          updated_at: nowIso,
        })
        .then(() => null)
        .catch(() => null);
      return;
    }

    const patch: Record<string, unknown> = { updated_at: nowIso };
    if (!existing.onboarding_started_at) {
      patch.onboarding_started_at = nowIso;
    }
    if (!existing.remind_1h_due_at) {
      patch.remind_1h_due_at = addHoursIso(nowIso, 1);
    }
    if (!existing.remind_24h_due_at) {
      patch.remind_24h_due_at = addHoursIso(nowIso, 24);
    }

    if (Object.keys(patch).length > 1) {
      await (admin.from("onboarding_recovery") as any)
        .update(patch)
        .eq("agent_id", agentId)
        .then(() => null)
        .catch(() => null);
    }
    return;
  }

  const { data: existing } = await (admin.from("onboarding_recovery") as any)
    .select("agent_id, first_value_at, completed_at")
    .eq("agent_id", agentId)
    .maybeSingle();

  if (!existing?.agent_id) {
    const insertPatch: Record<string, unknown> = {
      agent_id: agentId,
      updated_at: nowIso,
    };
    if (event === "first_value_reached") insertPatch.first_value_at = nowIso;
    if (event === "onboarding_completed") insertPatch.completed_at = nowIso;

    await (admin.from("onboarding_recovery") as any)
      .insert(insertPatch)
      .then(() => null)
      .catch(() => null);
    return;
  }

  const patch: Record<string, unknown> = { updated_at: nowIso };
  if (event === "first_value_reached" && !existing.first_value_at) {
    patch.first_value_at = nowIso;
  }
  if (event === "onboarding_completed" && !existing.completed_at) {
    patch.completed_at = nowIso;
  }

  if (Object.keys(patch).length > 1) {
    await (admin.from("onboarding_recovery") as any)
      .update(patch)
      .eq("agent_id", agentId)
      .then(() => null)
      .catch(() => null);
  }
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

  const event = cleanText(body.event, "");
  if (!event) return jsonError(400, "missing_event");

  const source = cleanText(body.source, "app", 64);
  const path = cleanText(body.path, "", 256);
  const step =
    typeof body.step === "number" && Number.isFinite(body.step)
      ? Math.max(0, Math.min(99, Math.floor(body.step)))
      : null;

  const payload = {
    event,
    source,
    step,
    path: path || null,
    meta:
      body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
        ? body.meta
        : {},
    created_at: new Date().toISOString(),
  };

  const { error } = await (admin.from("notification_events") as any).insert({
    agent_id: String(user.id),
    type: "funnel_event",
    entity_type: "funnel",
    entity_id: event,
    payload,
  });

  if (error) {
    return jsonError(500, "funnel_event_insert_failed", { details: error.message });
  }

  await updateOnboardingRecoveryByEvent({
    admin,
    agentId: String(user.id),
    event,
    createdAt: payload.created_at,
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
