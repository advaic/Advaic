import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function jsonError(status: number, error: string, extra?: Record<string, any>) {
  return NextResponse.json({ error, ...(extra || {}) }, { status });
}

function supabaseFromReq(req: NextRequest, res: NextResponse) {
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

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function normalizeRating(raw: unknown): "helpful" | "not_helpful" | null {
  const s = String(raw || "")
    .toLowerCase()
    .trim();
  if (s === "helpful" || s === "not_helpful") return s;
  return null;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseFromReq(req, res);
  const admin = supabaseAdmin();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user?.id) return jsonError(401, "Unauthorized");

  const url = new URL(req.url);
  const leadId = String(url.searchParams.get("lead_id") || "").trim();
  const messageId = String(url.searchParams.get("message_id") || "").trim();

  if (!leadId && !messageId) {
    return jsonError(400, "missing_filter", {
      expected_any_of: ["lead_id", "message_id"],
    });
  }

  let q = (admin.from("message_feedback") as any)
    .select(
      "id, agent_id, lead_id, message_id, rating, reason, note, source, meta, created_at, updated_at",
    )
    .eq("agent_id", String(user.id))
    .order("created_at", { ascending: false })
    .limit(200);

  if (leadId) q = q.eq("lead_id", leadId);
  if (messageId) q = q.eq("message_id", messageId);

  const { data, error } = await q;
  if (error) {
    return jsonError(500, "feedback_fetch_failed", { details: error.message });
  }

  return NextResponse.json({ ok: true, rows: data || [] });
}

type Body = {
  message_id?: string;
  rating?: "helpful" | "not_helpful" | string;
  reason?: string | null;
  note?: string | null;
  source?: string | null;
};

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = supabaseFromReq(req, res);
  const admin = supabaseAdmin();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user?.id) return jsonError(401, "Unauthorized");

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError(400, "missing_body");

  const messageId = String(body.message_id || "").trim();
  const rating = normalizeRating(body.rating);
  if (!messageId) return jsonError(400, "missing_message_id");
  if (!rating) return jsonError(400, "invalid_rating");

  const { data: msg, error: msgErr } = await (admin.from("messages") as any)
    .select("id, lead_id, agent_id, sender")
    .eq("id", messageId)
    .eq("agent_id", String(user.id))
    .maybeSingle();

  if (msgErr) return jsonError(500, "message_lookup_failed", { details: msgErr.message });
  if (!msg) return jsonError(404, "message_not_found");

  const sender = String(msg.sender || "").toLowerCase();
  if (!(sender === "agent" || sender === "assistant")) {
    return jsonError(400, "message_not_rateable");
  }

  const reason = String(body.reason || "")
    .trim()
    .slice(0, 240);
  const note = String(body.note || "")
    .trim()
    .slice(0, 2000);
  const source = String(body.source || "lead_chat")
    .trim()
    .slice(0, 64);

  const payload: Record<string, any> = {
    agent_id: String(user.id),
    lead_id: String(msg.lead_id),
    message_id: messageId,
    rating,
    reason: reason || null,
    note: note || null,
    source: source || "lead_chat",
    meta: {
      sender,
      updated_via: "api/messages/feedback",
    },
  };

  const { data, error } = await (admin.from("message_feedback") as any)
    .upsert(payload, { onConflict: "agent_id,message_id" })
    .select(
      "id, agent_id, lead_id, message_id, rating, reason, note, source, meta, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    return jsonError(500, "feedback_save_failed", { details: error.message });
  }

  return NextResponse.json({ ok: true, feedback: data || null });
}

