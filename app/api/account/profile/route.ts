import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { isOwnerUserId } from "@/lib/auth/ownerAccess";

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

function clean(value: unknown, max = 120) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

function error(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

type ProfilePayload = {
  vorname?: string;
  nachname?: string;
  telefon?: string;
  firma?: string;
  position?: string;
};

function parseUserMetadata(user: any) {
  const meta =
    user?.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, any>)
      : {};

  const fullName = clean(meta.full_name || meta.name, 160);
  const [firstFromFull = "", ...rest] = fullName.split(" ");
  const lastFromFull = rest.join(" ").trim();

  const vorname = clean(meta.vorname || meta.first_name || firstFromFull);
  const nachname = clean(meta.nachname || meta.last_name || lastFromFull);
  const telefon = clean(meta.telefon || meta.phone, 60);
  const firma = clean(meta.firma || meta.company, 120);
  const position = clean(meta.position || meta.job_title, 120);

  return {
    vorname,
    nachname,
    telefon,
    firma,
    position,
  };
}

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createRouteClient(req, res);
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return error(401, "Unauthorized");

  const profile = parseUserMetadata(user);

  return NextResponse.json({
    ok: true,
    profile: {
      ...profile,
      user_id: String(user.id || ""),
      is_owner: isOwnerUserId(user.id),
      email: String(user.email || ""),
    },
  });
}

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createRouteClient(req, res);
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return error(401, "Unauthorized");

  const body = (await req.json().catch(() => null)) as ProfilePayload | null;
  if (!body) return error(400, "Missing body");

  const vorname = clean(body.vorname, 80);
  const nachname = clean(body.nachname, 120);
  const telefon = clean(body.telefon, 60);
  const firma = clean(body.firma, 120);
  const position = clean(body.position, 120);

  if (!vorname || !nachname) {
    return error(400, "Vorname und Nachname sind erforderlich");
  }

  const fullName = clean(`${vorname} ${nachname}`, 180);
  const existingMeta =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, any>)
      : {};

  const nextMeta = {
    ...existingMeta,
    vorname,
    nachname,
    telefon: telefon || null,
    firma: firma || null,
    position: position || null,
    first_name: vorname || null,
    last_name: nachname || null,
    full_name: fullName || null,
    name: fullName || null,
    phone: telefon || null,
    company: firma || null,
    job_title: position || null,
  };

  const admin = createAdminClient();
  const { error: updateAuthErr } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: nextMeta,
  });

  if (updateAuthErr) {
    return error(500, `Profil konnte nicht gespeichert werden: ${updateAuthErr.message}`);
  }

  // Best effort sync for legacy reads from public.agents.
  await (admin.from("agents") as any).upsert(
    {
      id: user.id,
      email: user.email || null,
      name: fullName || null,
      company: firma || null,
      phone: telefon || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  return NextResponse.json({
    ok: true,
    profile: {
      vorname,
      nachname,
      user_id: String(user.id || ""),
      is_owner: isOwnerUserId(user.id),
      email: String(user.email || ""),
      telefon,
      firma,
      position,
    },
  });
}
