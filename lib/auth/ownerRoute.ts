import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { isOwnerUserId } from "@/lib/auth/ownerAccess";

function mustEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export async function requireOwnerApiUser(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }),
    };
  }

  if (!isOwnerUserId(user.id)) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}
