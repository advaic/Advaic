// app/api/agent/settings/autosend/route.ts
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
  // When true, we also set reply_mode = "auto" (unless explicitly provided)
  autosend_enabled?: boolean;
  // Must be one of the DB-allowed values
  reply_mode?: "approval" | "auto";
  // Optional threshold (0..1). Defaults to existing value in DB.
  auto_send_min_confidence?: number;
};

const ALLOWED_REPLY_MODE = new Set(["approval", "auto"]);

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0.97;
  return Math.max(0, Math.min(1, n));
}

function jsonError(status: number, error: string, extra?: Record<string, any>) {
  return NextResponse.json({ error, ...(extra || {}) }, { status });
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

  const hasAutosend = typeof body.autosend_enabled === "boolean";
  const hasReplyMode = typeof body.reply_mode === "string";
  const hasConfidence = typeof body.auto_send_min_confidence === "number";

  if (!hasAutosend && !hasReplyMode && !hasConfidence) {
    return jsonError(400, "Missing fields", {
      expected: ["autosend_enabled", "reply_mode", "auto_send_min_confidence"],
    });
  }

  if (hasReplyMode && !ALLOWED_REPLY_MODE.has(body.reply_mode!)) {
    return jsonError(400, "Invalid reply_mode", {
      allowed: Array.from(ALLOWED_REPLY_MODE),
    });
  }

  // If autosend_enabled is provided but reply_mode is not, map it deterministically
  const inferredReplyMode: "approval" | "auto" | undefined =
    typeof body.autosend_enabled === "boolean"
      ? body.autosend_enabled
        ? "auto"
        : "approval"
      : undefined;

  const patch: Record<string, any> = {
    agent_id: user.id,
  };

  if (typeof body.autosend_enabled === "boolean") {
    patch.autosend_enabled = body.autosend_enabled;
  }

  if (typeof body.reply_mode === "string") {
    patch.reply_mode = body.reply_mode;
  } else if (inferredReplyMode) {
    patch.reply_mode = inferredReplyMode;
  }

  if (typeof body.auto_send_min_confidence === "number") {
    patch.auto_send_min_confidence = clamp01(body.auto_send_min_confidence);
  }

  const { data, error } = await (supabase.from("agent_settings") as any)
    .upsert(patch, { onConflict: "agent_id" })
    .select("agent_id, autosend_enabled, reply_mode, auto_send_min_confidence")
    .maybeSingle();

  if (error) {
    return jsonError(500, "Failed to save autosend", {
      details: error.message,
    });
  }

  return NextResponse.json({ ok: true, settings: data });
}

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseFromReq(req, res);

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return jsonError(401, "Unauthorized");

  const { data, error } = await (supabase.from("agent_settings") as any)
    .select("agent_id, autosend_enabled, reply_mode, auto_send_min_confidence")
    .eq("agent_id", user.id)
    .maybeSingle();

  if (error) {
    return jsonError(500, "Failed to load autosend", {
      details: error.message,
    });
  }

  return NextResponse.json({
    ok: true,
    settings:
      data ||
      ({
        agent_id: user.id,
        autosend_enabled: false,
        reply_mode: "approval",
        auto_send_min_confidence: 0.97,
      } as const),
  });
}
