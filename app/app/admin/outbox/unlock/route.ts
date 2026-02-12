import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function requireAdminUserId() {
  const adminId = mustEnv("ADMIN_DASHBOARD_USER_ID");

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) return { ok: false as const, error: "unauthorized" };
  if (user.id !== adminId) return { ok: false as const, error: "forbidden" };

  return { ok: true as const, userId: user.id };
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminUserId();
    if (!auth.ok)
      return NextResponse.json({ error: auth.error }, { status: 401 });

    const body = await req.json().catch(() => ({}) as any);
    const messageId = String(body?.messageId || "").trim();
    if (!messageId) {
      return NextResponse.json({ error: "missing_messageId" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Unlock = clear lock + set send_status=failed (retry-fähig)
    const { error } = await (supabase.from("messages") as any)
      .update({
        send_locked_at: null,
        send_status: "failed",
        send_error: "admin_unlock",
      })
      .eq("id", messageId);

    if (error) {
      return NextResponse.json(
        { error: "unlock_update_failed", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "unknown_error" },
      { status: 500 },
    );
  }
}
