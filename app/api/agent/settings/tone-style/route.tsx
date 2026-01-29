// app/api/agent/settings/tone-style/route.ts
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

function jsonError(status: number, error: string, extra?: Record<string, any>) {
  return NextResponse.json({ error, ...(extra || {}) }, { status });
}

function s(v: any, max: number) {
  return String(v ?? "")
    .trim()
    .slice(0, max);
}

type Body = {
  tone_language?: string; // "de" | "en" | ...
  tone_formality?: "locker" | "neutral" | "formal";
  tone_personality?: string; // free text / preset name
  tone_do?: string;
  tone_dont?: string;
  tone_signature?: string;
  tone_example_reply?: string;
};

const ALLOWED_FORMALITY = new Set(["locker", "neutral", "formal"]);

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseFromReq(req, res);

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return jsonError(401, "Unauthorized");

  const { data, error } = await (supabase.from("agent_settings") as any)
    .select(
      "agent_id, tone_language, tone_formality, tone_personality, tone_do, tone_dont, tone_signature, tone_example_reply"
    )
    .eq("agent_id", user.id)
    .maybeSingle();

  if (error)
    return jsonError(500, "Failed to load tone-style", {
      details: error.message,
    });

  return NextResponse.json({
    ok: true,
    settings: data || {
      agent_id: user.id,
      tone_language: "de",
      tone_formality: "neutral",
      tone_personality: "warm",
      tone_do: "",
      tone_dont: "",
      tone_signature: "",
      tone_example_reply: "",
    },
  });
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

  const tone_language = s(body.tone_language, 10) || "de";
  const tone_formality = s(body.tone_formality, 20) || "neutral";
  if (!ALLOWED_FORMALITY.has(tone_formality)) {
    return jsonError(400, "Invalid tone_formality", {
      allowed: Array.from(ALLOWED_FORMALITY),
    });
  }

  const patch = {
    agent_id: user.id,
    tone_language,
    tone_formality,
    tone_personality: s(body.tone_personality, 60),
    tone_do: s(body.tone_do, 1200),
    tone_dont: s(body.tone_dont, 1200),
    tone_signature: s(body.tone_signature, 180),
    tone_example_reply: s(body.tone_example_reply, 1200),
  };

  const { data, error } = await (supabase.from("agent_settings") as any)
    .upsert(patch, { onConflict: "agent_id" })
    .select(
      "agent_id, tone_language, tone_formality, tone_personality, tone_do, tone_dont, tone_signature, tone_example_reply"
    )
    .maybeSingle();

  if (error)
    return jsonError(500, "Failed to save tone-style", {
      details: error.message,
    });

  return NextResponse.json({ ok: true, settings: data });
}
