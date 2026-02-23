import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function createRouteClient(req: NextRequest, res: NextResponse) {
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
    },
  );
}

function createAdminClient() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function createVerifierClient() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function scorePassword(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createRouteClient(req, res);
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return jsonError(401, "Unauthorized");

  const body = (await req.json().catch(() => null)) as {
    current_password?: string;
    new_password?: string;
  } | null;

  const currentPassword = String(body?.current_password || "");
  const newPassword = String(body?.new_password || "");

  if (!currentPassword || !newPassword) {
    return jsonError(400, "Aktuelles und neues Passwort sind erforderlich");
  }

  if (newPassword === currentPassword) {
    return jsonError(400, "Das neue Passwort muss sich unterscheiden");
  }

  if (scorePassword(newPassword) < 3) {
    return jsonError(400, "Das neue Passwort ist zu schwach");
  }

  if (!user.email) {
    return jsonError(400, "Benutzerkonto hat keine E-Mail-Adresse");
  }

  const verifier = createVerifierClient();
  const { error: verifyErr } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyErr) {
    return jsonError(400, "Aktuelles Passwort ist falsch");
  }

  const admin = createAdminClient();
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (updateErr) {
    return jsonError(500, `Passwort konnte nicht geändert werden: ${updateErr.message}`);
  }

  return NextResponse.json({ ok: true });
}
