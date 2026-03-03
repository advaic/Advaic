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

function clamp01(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n));
}

function computeQualityScoreForReview(input: {
  qaScore?: number | null;
  qaConfidence?: number | null;
  clsConfidence?: number | null;
  verdict?: string | null;
  riskFlags?: string[] | null;
  sendStatus?: string | null;
}): number | null {
  const qaScore = clamp01(input.qaScore);
  const qaConfidence = clamp01(input.qaConfidence);
  const clsConfidence = clamp01(input.clsConfidence);
  const verdict = String(input.verdict || "").toLowerCase();
  const riskFlags = Array.isArray(input.riskFlags) ? input.riskFlags.length : 0;
  const sendStatus = String(input.sendStatus || "").toLowerCase();
  const hasSignals =
    qaScore !== null ||
    qaConfidence !== null ||
    clsConfidence !== null ||
    verdict.length > 0 ||
    riskFlags > 0;

  if (!hasSignals) return null;

  let score =
    qaScore !== null
      ? qaScore
      : qaConfidence !== null
        ? qaConfidence
        : clsConfidence !== null
          ? clsConfidence
          : 0.6;

  if (qaConfidence !== null) score = score * 0.72 + qaConfidence * 0.28;
  if (clsConfidence !== null) score = score * 0.78 + clsConfidence * 0.22;

  if (verdict === "fail") score -= 0.35;
  else if (verdict === "warn") score -= 0.18;

  score -= Math.min(0.25, riskFlags * 0.06);
  if (sendStatus === "failed") score -= 0.25;

  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

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
      "id, agent_id, lead_id, gmail_message_id, gmail_thread_id, text, snippet, was_followup, timestamp, classification_confidence, send_status",
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

  const { data: latestQa } = await (supabase.from("message_qas") as any)
    .select("score, verdict, risk_flags, meta, created_at")
    .eq("draft_message_id", messageId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const qaConfidenceRaw = Number((latestQa as any)?.meta?.confidence);
  const qaConfidence =
    Number.isFinite(qaConfidenceRaw) && qaConfidenceRaw >= 0 && qaConfidenceRaw <= 1
      ? qaConfidenceRaw
      : null;
  const qualityScoreBeforeSend = computeQualityScoreForReview({
    qaScore:
      typeof (latestQa as any)?.score === "number" ? (latestQa as any).score : null,
    qaConfidence,
    clsConfidence:
      typeof (msgRow as any).classification_confidence === "number"
        ? (msgRow as any).classification_confidence
        : null,
    verdict: (latestQa as any)?.verdict ?? null,
    riskFlags: Array.isArray((latestQa as any)?.risk_flags)
      ? ((latestQa as any).risk_flags as string[])
      : null,
    sendStatus: (msgRow as any).send_status ?? null,
  });
  const messageTs = new Date(String((msgRow as any).timestamp || "")).getTime();
  const approvalAgeMinutes =
    Number.isFinite(messageTs) && messageTs > 0
      ? Math.max(0, Math.floor((Date.now() - messageTs) / 60000))
      : null;

  const reviewTrack = await upsertHumanApprovalReview(supabase, {
    agentId,
    leadId: String((msgRow as any).lead_id || ""),
    messageId,
    edited: false,
    originalText: text,
    finalText: text,
    source: "api_approve",
    qualityScoreBeforeSend,
    approvalAgeMinutes,
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
  if (!send.ok && send.error === "payment_required") {
    return NextResponse.json(
      {
        ok: false,
        error: "payment_required",
        details:
          String(
            (send as any)?.data?.details ||
              "Testphase beendet. Bitte Starter aktivieren.",
          ) || "payment_required",
        billing_access: (send as any)?.data?.billing_access || null,
        next_action: (send as any)?.data?.next_action || {
          type: "open_billing",
          path: "/app/konto/abo",
        },
      },
      { status: 402 },
    );
  }
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
