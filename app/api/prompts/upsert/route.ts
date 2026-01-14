import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  key?: string;
  name?: string;
  system_prompt?: string;
  user_prompt?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: "json" | "text";
  notes?: string;

  // versioning behavior
  make_active?: boolean; // if true, will set this prompt active and deactivate others for key
  version?: number; // if provided, upsert that version; if omitted -> auto next version
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;

  const key = safeTrim(body?.key);
  const system_prompt = safeTrim(body?.system_prompt);
  const user_prompt = safeTrim(body?.user_prompt);

  if (!key) return jsonError("Missing key", 400);
  if (!system_prompt) return jsonError("Missing system_prompt", 400);
  if (!user_prompt) return jsonError("Missing user_prompt", 400);

  const makeActive = Boolean(body?.make_active);
  const temperature =
    typeof body?.temperature === "number" ? body.temperature : 0.4;
  const max_tokens =
    typeof body?.max_tokens === "number" ? body.max_tokens : 400;
  const response_format = (body?.response_format ?? "json") as "json" | "text";

  const res = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return jsonError("Unauthorized", 401);

  // NOTE: For now, any logged-in user can write.
  // Later we can lock this down via RLS (admin only).

  // Determine version
  let version = typeof body?.version === "number" ? body.version : null;

  if (version == null) {
    const { data: latest, error: latestErr } = await supabase
      .from("ai_prompts")
      .select("version")
      .eq("key", key)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestErr) return jsonError(latestErr.message, 500);
    version = (latest?.version ?? 0) + 1;
  }

  // If make_active, deactivate current active first (best effort)
  if (makeActive) {
    const { error: deactErr } = await supabase
      .from("ai_prompts")
      .update({ is_active: false })
      .eq("key", key)
      .eq("is_active", true);

    if (deactErr) return jsonError(deactErr.message, 500);
  }

  const payload = {
    key,
    version,
    is_active: makeActive ? true : false,
    name: safeTrim(body?.name) || null,
    system_prompt,
    user_prompt,
    temperature,
    max_tokens,
    response_format,
    notes: safeTrim(body?.notes) || null,
  };

  const { data, error } = await supabase
    .from("ai_prompts")
    .upsert(payload, { onConflict: "key,version" })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ prompt: data });
}
