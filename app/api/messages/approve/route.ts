import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  agent_id: string; // auth.users id
  message_id: string; // messages.id (draft message)
  event_id?: string | null; // optional
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function safeJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

async function enqueueBestEffort(payload: any) {
  try {
    const site = mustEnv("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
    await fetch(`${site}/api/notifications/enqueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-advaic-internal-secret": mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET"),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // swallow
  }
}

export async function POST(req: Request) {
  // Internal secret gate
  const headerSecret = req.headers.get("x-advaic-internal-secret") || "";
  if (headerSecret !== process.env.ADVAIC_INTERNAL_PIPELINE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await safeJson<Body>(req);
  if (!body?.agent_id || !body?.message_id) {
    return NextResponse.json(
      {
        error: "missing_required_fields",
        required: ["agent_id", "message_id"],
      },
      { status: 400 },
    );
  }

  const supabase = supabaseAdmin();

  const agentId = String(body.agent_id).trim();
  const messageId = String(body.message_id).trim();

  // Load message (for gmail ids + ownership)
  const { data: msgRow, error: msgRowErr } = await (
    supabase.from("messages") as any
  )
    .select(
      "id, agent_id, lead_id, gmail_message_id, gmail_thread_id, text, snippet",
    )
    .eq("id", messageId)
    .eq("agent_id", agentId)
    .maybeSingle();

  if (msgRowErr) {
    return NextResponse.json(
      { ok: false, error: msgRowErr.message },
      { status: 500 },
    );
  }
  if (!msgRow) {
    return NextResponse.json(
      { ok: false, error: "message_not_found" },
      { status: 404 },
    );
  }

  const nowIso = new Date().toISOString();
  const gmailMessageId = (msgRow as any).gmail_message_id as
    | string
    | null
    | undefined;

  // Update approval state
  const patch: any = {
    approval_required: false,
    status: "approved",
    approved_at: nowIso,
    rejected_at: null,
  };

  const { data: updated, error: updErr } = await (
    supabase.from("messages") as any
  )
    .update(patch)
    .eq("id", messageId)
    .eq("agent_id", agentId)
    .select("id, lead_id, approval_required, status")
    .maybeSingle();

  if (updErr) {
    return NextResponse.json(
      { ok: false, error: updErr.message },
      { status: 500 },
    );
  }

  // Best-effort mirror into Gmail ingestion tables
  if (gmailMessageId) {
    const mirrorPatch: any = {
      needs_approval: false,
      approval_required: false,
      status: "approved",
      approved_at: nowIso,
      rejected_at: null,
    };

    try {
      const { error } = await (
        supabase.from("email_message_bodies" as any) as any
      )
        .update(mirrorPatch)
        .eq("agent_id", agentId)
        .eq("gmail_message_id", gmailMessageId);
      if (error)
        console.warn("⚠️ approve mirror bodies failed:", error.message);
    } catch {}

    try {
      const { error } = await (supabase.from("email_attachments" as any) as any)
        .update(mirrorPatch)
        .eq("agent_id", agentId)
        .eq("gmail_message_id", gmailMessageId);
      if (error) console.warn("⚠️ approve mirror atts failed:", error.message);
    } catch {}
  }

  // Optional: enqueue a “status update” notification (usually not necessary).
  // Leave off by default to avoid spam.

  return NextResponse.json({ ok: true, message: updated ?? { id: messageId } });
}
