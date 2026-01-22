import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
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
  return { ok: true, status: String(data?.status || "ok"), data };
}

function buildSubject(lead: any) {
  const s = lead?.subject || lead?.type || "Anfrage";
  return `Re: ${String(s).slice(0, 140)}`;
}

export async function POST() {
  const supabase = supabaseAdmin();

  const siteUrl = mustEnv("NEXT_PUBLIC_SITE_URL");
  const secret = mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET");

  // 1) Pull ready_to_send drafts
  const { data: drafts, error: draftsErr } = await (
    supabase.from("messages") as any
  )
    .select(
      "id, agent_id, lead_id, text, status, approval_required, send_status, timestamp"
    )
    .eq("sender", "assistant")
    .eq("status", "ready_to_send")
    .eq("approval_required", false)
    .in("send_status", ["pending", "failed"])
    .order("timestamp", { ascending: true })
    .limit(25);

  if (draftsErr) {
    return NextResponse.json(
      {
        error: "Failed to load ready_to_send drafts",
        details: draftsErr.message,
      },
      { status: 500 }
    );
  }

  if (!drafts || drafts.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, results: [] });
  }

  // 2) Preload agent_settings for autosend gate
  const agentIds = Array.from(
    new Set(drafts.map((d: any) => String(d.agent_id)))
  );
  const { data: settingsRows } = await (supabase.from("agent_settings") as any)
    .select("agent_id, autosend_enabled")
    .in("agent_id", agentIds);

  const autosendMap = new Map<string, boolean>();
  for (const s of settingsRows || []) {
    autosendMap.set(String(s.agent_id), !!s.autosend_enabled);
  }

  const results: any[] = [];

  for (const d of drafts) {
    const messageId = String(d.id);
    const agentId = String(d.agent_id);
    const leadId = String(d.lead_id);

    // Safety: only send if autosend_enabled is still true
    if (!autosendMap.get(agentId)) {
      // downgrade to approval so it doesn't get stuck
      await (supabase.from("messages") as any)
        .update({ status: "needs_approval", approval_required: true })
        .eq("id", messageId);

      results.push({ messageId, leadId, status: "skipped_autosend_disabled" });
      continue;
    }

    // 3) Load lead (to, thread_id, subject)
    const { data: lead } = await (supabase.from("leads") as any)
      .select("id, agent_id, email, gmail_thread_id, subject, type")
      .eq("id", leadId)
      .maybeSingle();

    if (!lead?.email) {
      await (supabase.from("messages") as any)
        .update({
          status: "needs_human",
          approval_required: true,
          send_status: "failed",
          send_error: "missing_lead_email",
        })
        .eq("id", messageId);

      results.push({ messageId, leadId, status: "failed_missing_lead_email" });
      continue;
    }

    const subject = buildSubject(lead);
    const text = String(d.text || "").trim();

    if (!text) {
      await (supabase.from("messages") as any)
        .update({
          status: "needs_human",
          approval_required: true,
          send_status: "failed",
          send_error: "empty_draft_text",
        })
        .eq("id", messageId);

      results.push({ messageId, leadId, status: "failed_empty_text" });
      continue;
    }

    // 4) Call your idempotent send route
    const res = await fetch(new URL("/api/gmail/send", siteUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-advaic-internal-secret": secret,
      },
      body: JSON.stringify({
        id: messageId,
        lead_id: leadId,
        gmail_thread_id: lead.gmail_thread_id,
        to: lead.email,
        subject,
        text,
        // attachments: optional – send route already reads attachments from message row if you designed it that way
      }),
    }).catch(() => null);

    if (!res) {
      results.push({ messageId, leadId, status: "network_error" });
      continue;
    }

    const send = await readSendResponse(res);

    // We treat these as ok outcomes because send route is idempotent/locked.
    if (
      send.ok &&
      (send.status === "already_sent" ||
        send.status === "locked_or_in_progress" ||
        send.status === "ok")
    ) {
      results.push({ messageId, leadId, status: send.status });
      continue;
    }

    // else: mark failed (send route likely did already, but safe)
    results.push({
      messageId,
      leadId,
      status: "failed",
      error: send.error || "unknown",
    });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
