import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  agent_id: string;
  message_id: string; // messages.id (draft)
  event_id?: string | null;
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

  const nowIso = new Date().toISOString();

  // Load message for gmail ids (ownership enforced)
  const { data: msgRow, error: msgRowErr } = await (
    supabase.from("messages") as any
  )
    .select("id, agent_id, lead_id, gmail_message_id, gmail_thread_id")
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

  const gmailMessageId = (msgRow as any).gmail_message_id as
    | string
    | null
    | undefined;

  // Update reject state
  const patch: any = {
    approval_required: false,
    status: "rejected",
    rejected_at: nowIso,
    approved_at: null,
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

  // Best-effort cleanup of ingestion tables
  if (gmailMessageId) {
    try {
      const { error } = await (
        supabase.from("email_message_bodies" as any) as any
      )
        .delete()
        .eq("agent_id", agentId)
        .eq("gmail_message_id", gmailMessageId);
      if (error) console.warn("⚠️ reject bodies delete failed:", error.message);
    } catch {}

    try {
      const { error } = await (supabase.from("email_attachments" as any) as any)
        .delete()
        .eq("agent_id", agentId)
        .eq("gmail_message_id", gmailMessageId);
      if (error) console.warn("⚠️ reject atts delete failed:", error.message);
    } catch {}
  }

  return NextResponse.json({ ok: true, message: updated ?? { id: messageId } });
}
