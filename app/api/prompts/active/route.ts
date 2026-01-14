import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}

export async function GET(req: NextRequest) {
  const key = safeTrim(req.nextUrl.searchParams.get("key"));
  if (!key) return jsonError("Missing key", 400);

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

  const { data, error } = await supabase
    .from("ai_prompts")
    .select(
      "id,key,version,is_active,name,system_prompt,user_prompt,temperature,max_tokens,response_format,notes,updated_at"
    )
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("No active prompt for this key", 404);

  return NextResponse.json({ prompt: data });
}
