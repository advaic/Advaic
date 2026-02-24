import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { upsertHumanApprovalReview } from "@/lib/security/approval-review";

export const runtime = "nodejs";

type Body = {
  agent_id: string; // auth.users id
  message_id: string; // messages.id (draft message)
  event_id?: string | null; // optional
};

function buildSubject(lead: any) {
  const s = lead?.subject || lead?.type || "Anfrage";
  return `Re: ${String(s).slice(0, 140)}`;
}

async function readSendResponse(res: Response) {
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    return {
      ok: false,
      status: "error",
      error: String(data?.error || "send_failed"),
      data,
    };
  }
  const status = String(data?.status || data?.message?.status || "ok");
  return { ok: true, status, data };
}

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

  // Load message (for gmail ids + ownership)
  const { data: msgRow, error: msgRowErr } = await (
    supabase.from("messages") as any
  )
    .select(
      "id, agent_id, lead_id, gmail_message_id, gmail_thread_id, text, snippet, was_followup",
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
  const isFollowup = !!(msgRow as any).was_followup;

  // Load lead and trigger provider send directly.
  // This ensures "Freigeben & senden" from Slack sends immediately.
  const { data: lead, error: leadErr } = await (supabase.from("leads") as any)
    .select(
      "id, agent_id, email, gmail_thread_id, outlook_conversation_id, email_provider, subject, type",
    )
    .eq("id", String((msgRow as any).lead_id || ""))
    .eq("agent_id", agentId)
    .maybeSingle();

  if (leadErr) {
    return NextResponse.json(
      { ok: false, error: leadErr.message },
      { status: 500 },
    );
  }
  if (!lead?.email) {
    return NextResponse.json(
      { ok: false, error: "missing_lead_email" },
      { status: 400 },
    );
  }

  const provider = String(
    lead?.email_provider ||
      ((lead as any)?.outlook_conversation_id ? "outlook" : "gmail"),
  )
    .toLowerCase()
    .trim();

  if (provider !== "gmail" && provider !== "outlook") {
    return NextResponse.json(
      { ok: false, error: `invalid_email_provider:${provider}` },
      { status: 400 },
    );
  }

  const text = String((msgRow as any).text || "").trim();
  if (!text) {
    return NextResponse.json(
      { ok: false, error: "empty_draft_text" },
      { status: 400 },
    );
  }

  const reviewTrack = await upsertHumanApprovalReview(supabase, {
    agentId,
    leadId: String((msgRow as any).lead_id || ""),
    messageId,
    edited: false,
    originalText: text,
    finalText: text,
    source: "api_approve",
  });
  if (!reviewTrack.ok) {
    console.warn("⚠️ approval review tracking failed in /api/messages/approve:", reviewTrack.error);
  }

  const site = mustEnv("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
  const sendPath = provider === "outlook" ? "/api/outlook/send" : "/api/gmail/send";
  const sendPayload: Record<string, any> =
    provider === "outlook"
      ? {
          id: messageId,
          lead_id: String((msgRow as any).lead_id || ""),
          to: String(lead.email),
          subject: buildSubject(lead),
          text,
          outlook_conversation_id: (lead as any).outlook_conversation_id ?? null,
          was_followup: isFollowup,
        }
      : {
          id: messageId,
          lead_id: String((msgRow as any).lead_id || ""),
          gmail_thread_id: (lead as any).gmail_thread_id ?? null,
          to: String(lead.email),
          subject: buildSubject(lead),
          text,
          was_followup: isFollowup,
        };

  const sendRes = await fetch(new URL(sendPath, site).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-advaic-internal-secret": mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET"),
    },
    body: JSON.stringify(sendPayload),
  }).catch((e) => ({ __err: e } as any));

  if (!sendRes || (sendRes as any).__err) {
    return NextResponse.json(
      { ok: false, error: "network_error" },
      { status: 502 },
    );
  }

  const send = await readSendResponse(sendRes);
  if (
    !send.ok ||
    !(
      send.status === "already_sent" ||
      send.status === "locked_or_in_progress" ||
      send.status === "ok" ||
      send.status === "sent"
    )
  ) {
    // Fail-closed if provider route reports a hard failure.
    await (supabase.from("messages") as any)
      .update({
        send_status: "failed",
        send_error: send.error || "unknown",
        status: "needs_human",
        approval_required: true,
      })
      .eq("id", messageId)
      .eq("agent_id", agentId);

    return NextResponse.json(
      { ok: false, error: send.error || "send_failed", send },
      { status: 500 },
    );
  }

  // Update approval state only after provider send path succeeded.
  // This avoids "approved but not sent" inconsistencies on early validation failures.
  const patch: any = {
    approval_required: false,
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

  return NextResponse.json({
    ok: true,
    message: updated ?? { id: messageId },
    send,
    provider,
  });
}
