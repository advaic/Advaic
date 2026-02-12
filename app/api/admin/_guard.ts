import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function supabaseUser(req: NextRequest) {
  // cookie-auth, server-verified
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
    },
  );
}

export async function requireAdmin(req: NextRequest) {
  const supa = supabaseUser(req);

  const { data: auth, error: authErr } = await supa.auth.getUser();
  if (authErr || !auth?.user) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  // Founder-only admin gate (recommended for V1)
  // If ADVAIC_ADMIN_USER_ID is set, ONLY that user can access /admin APIs.
  const founderId = process.env.ADVAIC_ADMIN_USER_ID;
  if (founderId && founderId.trim().length > 0) {
    if (auth.user.id !== founderId.trim()) {
      return { ok: false as const, status: 403, error: "Forbidden" };
    }
    return { ok: true as const, user: auth.user, role: "superadmin" };
  }

  // IMPORTANT: this query runs with user session => admin_users must allow "select own"
  const { data: adminRow, error: adminErr } = await (
    supa.from("admin_users") as any
  )
    .select("id, user_id, role, is_active")
    .eq("user_id", auth.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminErr || !adminRow) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  const role = String(adminRow.role || "").toLowerCase();
  const allowed = role === "admin" || role === "superadmin";
  if (!allowed) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, user: auth.user, role };
}
