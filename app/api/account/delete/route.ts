import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

const CONFIRM_VALUES = new Set(["KONTO LOESCHEN", "KONTO LÖSCHEN", "DELETE"]);

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

async function tryDeleteByAgentId(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  agentId: string,
) {
  const { error } = await (admin.from(table as any) as any).delete().eq("agent_id", agentId);
  if (error) {
    const m = String(error.message || "");
    if (
      m.includes("does not exist") ||
      m.includes("relation") ||
      (m.includes("column") && m.includes("agent_id"))
    ) {
      return;
    }
  }
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
    confirm_text?: string;
  } | null;

  const currentPassword = String(body?.current_password || "");
  const confirmText = String(body?.confirm_text || "").trim().toUpperCase();

  if (!currentPassword) {
    return jsonError(400, "Aktuelles Passwort ist erforderlich");
  }
  if (!CONFIRM_VALUES.has(confirmText)) {
    return jsonError(400, "Bestätigungstext ungültig");
  }
  if (!user.email) {
    return jsonError(400, "Benutzerkonto hat keine E-Mail-Adresse");
  }

  const verifier = createVerifierClient();
  const { error: verifyErr } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyErr) return jsonError(400, "Aktuelles Passwort ist falsch");

  const admin = createAdminClient();

  // Best effort cleanup for app tables before deleting auth user.
  const agentScopedTables = [
    "billing_customers",
    "billing_subscriptions",
    "billing_invoices",
    "agent_style",
    "agent_settings",
    "agent_onboarding",
    "followup_configs",
    "followup_history",
    "notification_events",
    "notification_deliveries",
    "email_connections",
    "message_drafts",
    "message_qas",
    "messages",
    "leads",
  ];
  for (const table of agentScopedTables) {
    await tryDeleteByAgentId(admin, table, user.id);
  }

  await (admin.from("agents") as any).delete().eq("id", user.id);

  const { error: deleteUserErr } = await admin.auth.admin.deleteUser(user.id, false);
  if (deleteUserErr) {
    return jsonError(500, `Konto konnte nicht gelöscht werden: ${deleteUserErr.message}`);
  }

  return NextResponse.json({ ok: true });
}
