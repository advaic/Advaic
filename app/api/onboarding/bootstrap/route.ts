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

export async function POST(req: NextRequest) {
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

  // Create row if missing, then return it
  const { data, error } = await (admin.from("agent_onboarding") as any)
    .upsert(
      {
        agent_id: agentId,
        // default state, safe if already exists
        total_steps: 6,
        current_step: 1,
      },
      { onConflict: "agent_id" }
    )
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to bootstrap onboarding", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, onboarding: data });
}
