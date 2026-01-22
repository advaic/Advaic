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

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function GET(req: NextRequest) {
  const supabaseAuth = createServerClient<Database>(
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

  const {
    data: { user },
    error: authErr,
  } = await supabaseAuth.auth.getUser();
  if (authErr || !user) return jsonError(401, "Unauthorized");

  const supabaseAdmin = createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  const { data, error } = await (supabaseAdmin.from("agent_settings") as any)
    .select("reply_mode, auto_send_min_confidence")
    .eq("agent_id", user.id)
    .maybeSingle();

  if (error) return jsonError(500, "Failed to load settings");

  return NextResponse.json({
    reply_mode: data?.reply_mode ?? "approval",
    auto_send_min_confidence: data?.auto_send_min_confidence ?? 0.97,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as any;
  if (!body) return jsonError(400, "Missing body");

  const nextMode = String(body.reply_mode || "").toLowerCase();
  if (!["approval", "auto"].includes(nextMode)) {
    return jsonError(400, "Invalid reply_mode");
  }

  const supabaseAuth = createServerClient<Database>(
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

  const {
    data: { user },
    error: authErr,
  } = await supabaseAuth.auth.getUser();
  if (authErr || !user) return jsonError(401, "Unauthorized");

  const supabaseAdmin = createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  const { error } = await (supabaseAdmin.from("agent_settings") as any).upsert(
    {
      agent_id: user.id,
      reply_mode: nextMode,
      // auto_send_min_confidence: body.auto_send_min_confidence ?? 0.97,
    },
    { onConflict: "agent_id" }
  );

  if (error) return jsonError(500, "Failed to save settings");

  return NextResponse.json({ ok: true, reply_mode: nextMode });
}
