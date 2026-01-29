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

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseFromReq(req, res);

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await (supabase.from("agent_onboarding") as any)
    .select(
      "agent_id,current_step,total_steps,step_welcome_done,step_email_connected_done,step_autosend_done,step_tone_style_done,step_listings_sync_done,step_finish_done,completed_at,tour_completed_at,created_at,updated_at"
    )
    .eq("agent_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to load onboarding", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, onboarding: data || null });
}
