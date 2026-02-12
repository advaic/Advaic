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

  const cookieStorePromise = cookies();
  const supabase = createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookieStorePromise;
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
    const runNow = !!body?.runNow;

    if (!messageId) {
      return NextResponse.json({ error: "missing_messageId" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Retry = set pending + clear lock + clear error (but DO NOT change approval_required here)
    const { error } = await (supabase.from("messages") as any)
      .update({
        send_locked_at: null,
        send_status: "pending",
        send_error: null,
        // status can remain as-is; BUT to be safe, if it’s in ready_to_send lane, keep it.
        // If your pipeline expects status=ready_to_send:
        status: "ready_to_send",
      })
      .eq("id", messageId);

    if (error) {
      return NextResponse.json(
        { error: "retry_update_failed", details: error.message },
        { status: 500 },
      );
    }

    // Optional: run pipeline sender immediately (server-to-server)
    if (runNow) {
      const siteUrl = mustEnv("NEXT_PUBLIC_SITE_URL");
      const secret = mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET");

      // This is your batch sender runner:
      // /api/pipeline/reply-ready/send/run
      await fetch(
        new URL("/api/pipeline/reply-ready/send/run", siteUrl).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-advaic-internal-secret": secret,
          },
          body: JSON.stringify({ reason: "admin_retry_runNow" }),
        },
      ).catch(() => null);
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
