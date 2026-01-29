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
  autosend_enabled?: boolean;
};

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

  if (typeof body.autosend_enabled !== "boolean") {
    return jsonError(400, "Missing or invalid autosend_enabled");
  }

  // Upsert agent_settings row (RLS should ensure only self can upsert)
  const { data, error } = await (supabase.from("agent_settings") as any)
    .upsert(
      {
        agent_id: user.id,
        autosend_enabled: body.autosend_enabled,
      },
      { onConflict: "agent_id" }
    )
    .select("agent_id, autosend_enabled")
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
    .select("agent_id, autosend_enabled")
    .eq("agent_id", user.id)
    .maybeSingle();

  if (error) {
    return jsonError(500, "Failed to load autosend", {
      details: error.message,
    });
  }

  return NextResponse.json({
    ok: true,
    settings: data || { agent_id: user.id, autosend_enabled: false },
  });
}
