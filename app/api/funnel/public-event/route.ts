import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

type Body = {
  event?: string;
  source?: string | null;
  path?: string | null;
  page_group?: string | null;
  cta_variant?: string | null;
  visitor_id?: string | null;
  session_id?: string | null;
  referrer?: string | null;
  meta?: Record<string, unknown> | null;
};

function clean(value: unknown, max = 160): string | null {
  const s = String(value ?? "")
    .trim()
    .slice(0, max);
  return s || null;
}

function sanitizeEvent(value: unknown): string {
  const s = String(value ?? "")
    .trim()
    .slice(0, 96);
  if (!s) return "";
  return s.replace(/[^a-zA-Z0-9_:-]/g, "_");
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ ok: false, error: "missing_body" }, { status: 400 });

  const event = sanitizeEvent(body.event);
  if (!event) return NextResponse.json({ ok: false, error: "missing_event" }, { status: 400 });

  const source = clean(body.source, 64) || "marketing";
  const path = clean(body.path, 256);
  const pageGroup = clean(body.page_group, 64);
  const ctaVariant = clean(body.cta_variant, 32);
  const visitorId = clean(body.visitor_id, 96);
  const sessionId = clean(body.session_id, 96);
  const referrer = clean(body.referrer, 256);
  const userAgent = clean(req.headers.get("user-agent"), 280);
  const meta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? body.meta
      : {};

  const admin = supabaseAdmin();
  const { error } = await (admin.from("marketing_events") as any).insert({
    event,
    source,
    path,
    page_group: pageGroup,
    cta_variant: ctaVariant,
    visitor_id: visitorId,
    session_id: sessionId,
    referrer,
    user_agent: userAgent,
    meta,
    created_at: new Date().toISOString(),
  });

  // Tracking must never break the public site.
  if (error) {
    return NextResponse.json({
      ok: true,
      stored: false,
      warning: "insert_failed",
      details: error.message,
    });
  }

  return NextResponse.json({ ok: true, stored: true });
}

