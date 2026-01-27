

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type AttachmentInput = {
  bucket: string;
  path: string;
  name: string;
  mime: string;
  size?: number | null;
};

type SendBody = {
  id?: string;
  lead_id?: string;
  to?: string;
  subject?: string;
  text?: string;
  was_followup?: boolean;
  // Optional: allow explicitly providing an anchor message id for reply
  in_reply_to_outlook_message_id?: string | null;
  attachments?: AttachmentInput[];
};

function jsonError(status: number, error: string, extra?: Record<string, any>) {
  return NextResponse.json({ error, ...(extra || {}) }, { status });
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function isInternal(req: NextRequest) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-advaic-internal-secret");
  return !!got && got === secret;
}

function sanitizeHeaderValue(input: unknown): string {
  return String(input ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeFilename(name: unknown): string {
  const n = String(name ?? "attachment").trim() || "attachment";
  return n
    .replace(/[\\/]+/g, "-")
    .replace(/[\r\n]+/g, " ")
    .replace(/"/g, "'")
    .slice(0, 120);
}

function getExt(name: string): string {
  return (name.split(".").pop() || "").toLowerCase();
}

const ATTACHMENTS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || "attachments";

const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024; // 12MB per file
const MAX_TOTAL_ATTACHMENTS_BYTES = 25 * 1024 * 1024; // safe-ish

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

function assertAttachmentAllowed(a: AttachmentInput) {
  if (!a?.bucket || !a?.path) throw new Error("Attachment missing bucket/path");

  if (a.bucket !== ATTACHMENTS_BUCKET) {
    throw new Error("Invalid attachment bucket");
  }

  const filename = sanitizeFilename(a.name);
  const ext = getExt(filename);
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(`Disallowed file type: .${ext || "?"}`);
  }

  const mime = String(a.mime || "").toLowerCase();
  if (mime && !ALLOWED_MIME.has(mime)) {
    throw new Error(`Disallowed mime type: ${mime}`);
  }

  if (!a.name || !a.path) {
    throw new Error("Invalid attachment metadata");
  }
}

function assertScopedPath(agentId: string, leadId: string, path: string) {
  const expectedPrefix = `agents/${agentId}/leads/${leadId}/`;
  if (!path.startsWith(expectedPrefix)) {
    throw new Error("Attachment path not allowed");
  }
  if (path.includes("..")) {
    throw new Error("Attachment path invalid");
  }
}

function parseIsoOrNull(v: any): string | null {
  const s = String(v || "").trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isTokenExpired(expiresAtIso: string | null) {
  if (!expiresAtIso) return true;
  const t = new Date(expiresAtIso).getTime();
  if (!Number.isFinite(t)) return true;
  // refresh 2 minutes early
  return Date.now() > t - 2 * 60 * 1000;
}

async function refreshOutlookAccessToken(args: {
  refreshToken: string;
}) {
  const tenant = process.env.OUTLOOK_TENANT_ID || "common";
  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  const clientId = mustEnv("OUTLOOK_CLIENT_ID");
  const clientSecret = mustEnv("OUTLOOK_CLIENT_SECRET");

  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", args.refreshToken);
  // Keep conservative; many apps use .default here.
  form.set("scope", "https://graph.microsoft.com/.default");

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  }).catch(() => null);

  if (!resp || !resp.ok) {
    const txt = await resp?.text().catch(() => "");
    return { ok: false as const, error: "token_refresh_failed", details: txt };
  }

  const data = (await resp.json().catch(() => null)) as any;
  const accessToken = typeof data?.access_token === "string" ? data.access_token : "";
  const refreshToken = typeof data?.refresh_token === "string" ? data.refresh_token : undefined;
  const expiresIn = Number(data?.expires_in ?? 0);

  if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return { ok: false as const, error: "token_refresh_invalid_response" };
  }

  const expiresAtIso = new Date(Date.now() + expiresIn * 1000).toISOString();
  return { ok: true as const, accessToken, refreshToken, expiresAtIso };
}

async function getGraphAccessToken(supabaseAdmin: any, agentId: string) {
  const { data: conn, error } = await (supabaseAdmin.from("email_connections") as any)
    .select(
      "id, refresh_token, access_token, expires_at, status, email_address, outlook_mailbox_id"
    )
    .eq("agent_id", agentId)
    .eq("provider", "outlook")
    .in("status", ["connected", "active"])
    .maybeSingle();

  if (error || !conn) {
    return { ok: false as const, error: "outlook_not_connected" };
  }

  const refreshToken = String(conn.refresh_token || "");
  if (!refreshToken) return { ok: false as const, error: "missing_refresh_token" };

  const expiresAtIso = parseIsoOrNull(conn.expires_at);
  const accessToken = String(conn.access_token || "");

  if (accessToken && !isTokenExpired(expiresAtIso)) {
    return { ok: true as const, accessToken };
  }

  const refreshed = await refreshOutlookAccessToken({ refreshToken });
  if (!refreshed.ok) {
    await (supabaseAdmin.from("email_connections") as any)
      .update({ last_error: refreshed.error })
      .eq("id", conn.id);
    return { ok: false as const, error: refreshed.error };
  }

  // Store new tokens
  await (supabaseAdmin.from("email_connections") as any)
    .update({
      access_token: refreshed.accessToken,
      expires_at: refreshed.expiresAtIso,
      ...(refreshed.refreshToken ? { refresh_token: refreshed.refreshToken } : {}),
      last_error: null,
      status: "active",
    })
    .eq("id", conn.id);

  return { ok: true as const, accessToken: refreshed.accessToken };
}

async function graphFetch(
  accessToken: string,
  url: string,
  init?: RequestInit
) {
  return await fetch(url, {
    ...(init || {}),
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

async function downloadAttachmentAsBase64(
  supabaseAdmin: any,
  bucket: string,
  path: string
) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(`Attachment download failed: ${error?.message ?? "no data"}`);
  }
  const arrayBuffer = await data.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  if (buf.length === 0) throw new Error("Attachment is empty");
  if (buf.length > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `Attachment too large (max ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))}MB)`
    );
  }

  return {
    bytes: buf.length,
    base64: buf.toString("base64"),
  };
}

function pickAttachmentsMeta(attachments: unknown): AttachmentInput[] {
  const raw: AttachmentInput[] = Array.isArray(attachments)
    ? (attachments as any[]).filter(
        (a): a is AttachmentInput =>
          !!a &&
          typeof (a as any).bucket === "string" &&
          typeof (a as any).path === "string" &&
          typeof (a as any).name === "string" &&
          typeof (a as any).mime === "string"
      )
    : [];

  return raw.slice(0, MAX_ATTACHMENTS).map((a) => ({
    bucket: ATTACHMENTS_BUCKET,
    path: String(a.path),
    name: sanitizeFilename(a.name),
    mime: String(a.mime || "").toLowerCase(),
    size: typeof a.size === "number" ? a.size : null,
  }));
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as SendBody | null;
  if (!body) return jsonError(400, "Missing body");

  const { id, lead_id, to, subject, text, was_followup, attachments } = body;
  const attachmentsMeta = pickAttachmentsMeta(attachments);

  if (!id || !lead_id || !to || !subject || !text) {
    return jsonError(400, "Missing required fields", {
      required: ["id", "lead_id", "to", "subject", "text"],
    });
  }

  const internal = isInternal(req);

  // Admin client for DB reads/writes
  const supabaseAdmin = createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const messageId = String(id).trim();
  const leadId = String(lead_id).trim();

  // Resolve message ownership (source of truth)
  const { data: msgRow, error: msgRowErr } = await (
    supabaseAdmin.from("messages") as any
  )
    .select("id, agent_id, lead_id, send_status")
    .eq("id", messageId)
    .maybeSingle();

  if (msgRowErr) {
    console.error("[outlook/send] message lookup failed:", msgRowErr.message);
    return jsonError(500, "Failed to load message");
  }
  if (!msgRow) return jsonError(404, "Message not found");
  if (String(msgRow.lead_id) !== leadId) {
    return jsonError(400, "lead_id does not match message.lead_id");
  }

  const agentIdFromMessage = String(msgRow.agent_id || "");
  if (!agentIdFromMessage) return jsonError(400, "Message has no agent_id");

  // Auth: internal secret OR cookie auth
  let user: { id: string } | null = null;
  if (internal) {
    user = { id: agentIdFromMessage };
  } else {
    const supabaseAuth = createServerClient<Database>(
      mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
      mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        cookies: {
          get(name) {
            return req.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { user: u },
      error: authErr,
    } = await supabaseAuth.auth.getUser();

    if (authErr || !u) return jsonError(401, "Unauthorized");
    if (String(u.id) !== agentIdFromMessage) return jsonError(403, "Forbidden");
    user = { id: String(u.id) };
  }

  const safeTo = sanitizeHeaderValue(to);
  const safeSubject = sanitizeHeaderValue(subject);
  const safeText = String(text ?? "");

  if (!safeTo || !safeSubject || !safeText.trim()) {
    return jsonError(400, "Invalid required fields");
  }

  // Lead ownership + recipient lock-down
  const { data: leadRow, error: leadErr } = await (
    supabaseAdmin.from("leads") as any
  )
    .select("id, agent_id, email, outlook_conversation_id, email_provider")
    .eq("id", leadId)
    .maybeSingle();

  if (leadErr) {
    console.error("[outlook/send] lead lookup failed:", leadErr.message);
    return jsonError(500, "Failed to load lead");
  }
  if (!leadRow) return jsonError(404, "Lead not found");
  if (String(leadRow.agent_id) !== String(user.id)) return jsonError(403, "Forbidden");

  const leadEmail = String(leadRow.email || "").trim();
  if (!leadEmail) return jsonError(400, "Lead has no email");
  if (safeTo.toLowerCase() !== leadEmail.toLowerCase()) {
    return jsonError(400, "Recipient does not match lead email", {
      expected: leadEmail,
      got: safeTo,
    });
  }

  // Idempotency: already sent => short-circuit
  {
    const { data: statusRow, error: statusErr } = await (
      supabaseAdmin.from("messages") as any
    )
      .select("id, send_status")
      .eq("id", messageId)
      .eq("agent_id", user.id)
      .maybeSingle();

    if (statusErr) {
      console.error("[outlook/send] send_status lookup failed:", statusErr.message);
      return jsonError(500, "Failed to load message status");
    }

    if (!statusRow) return jsonError(404, "Message not found");

    if (String((statusRow as any).send_status || "").toLowerCase() === "sent") {
      return NextResponse.json({ ok: true, status: "already_sent" }, { status: 200 });
    }
  }

  // Acquire send lock
  const nowIsoLock = new Date().toISOString();
  const { data: lockRows, error: lockErr } = await (
    supabaseAdmin.from("messages") as any
  )
    .update({
      send_status: "sending",
      send_locked_at: nowIsoLock,
      send_error: null,
    })
    .eq("id", messageId)
    .eq("agent_id", user.id)
    .in("send_status", ["pending", "failed"])
    .is("send_locked_at", null)
    .select("id");

  if (lockErr) {
    console.error("[outlook/send] lock acquire failed:", lockErr.message);
    return jsonError(500, "Failed to lock message");
  }

  if (!lockRows || lockRows.length === 0) {
    return NextResponse.json(
      { ok: true, status: "locked_or_in_progress" },
      { status: 200 }
    );
  }

  // Get Graph access token
  const tokenRes = await getGraphAccessToken(supabaseAdmin, user.id);
  if (!tokenRes.ok) {
    await (supabaseAdmin.from("messages") as any)
      .update({
        send_status: "failed",
        send_error: String(tokenRes.error || "outlook_auth_failed"),
        send_locked_at: null,
      })
      .eq("id", messageId)
      .eq("agent_id", user.id);

    return jsonError(400, "Outlook not connected", { reason: tokenRes.error });
  }

  const accessToken = tokenRes.accessToken;

  // Build attachments for Graph
  let graphAttachments: any[] = [];
  try {
    if (attachmentsMeta.length > MAX_ATTACHMENTS) {
      throw new Error(`Too many attachments (max ${MAX_ATTACHMENTS})`);
    }

    let totalBytes = 0;

    for (const a0 of attachmentsMeta) {
      assertAttachmentAllowed(a0);
      assertScopedPath(user.id, leadId, a0.path);

      const name = sanitizeFilename(a0.name);
      const mime = String(a0.mime || "").toLowerCase();
      const dl = await downloadAttachmentAsBase64(
        supabaseAdmin,
        ATTACHMENTS_BUCKET,
        a0.path
      );

      totalBytes += dl.bytes;
      if (totalBytes > MAX_TOTAL_ATTACHMENTS_BYTES) {
        throw new Error(
          `Total attachment size exceeds ${Math.round(
            MAX_TOTAL_ATTACHMENTS_BYTES / (1024 * 1024)
          )}MB`
        );
      }

      graphAttachments.push({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name,
        contentType: mime && ALLOWED_MIME.has(mime) ? mime : "application/octet-stream",
        contentBytes: dl.base64,
      });
    }
  } catch (e: any) {
    console.error("[outlook/send] attachment build failed:", e?.message || e);

    await (supabaseAdmin.from("messages") as any)
      .update({
        send_status: "failed",
        send_error: String(e?.message || "attachment_failed").slice(0, 5000),
        send_locked_at: null,
      })
      .eq("id", messageId)
      .eq("agent_id", user.id);

    return jsonError(400, `Attachment failed: ${e?.message ?? "unknown"}`);
  }

  // Find an anchor outlook_message_id to reply to.
  // Priority:
  // 1) explicit body.in_reply_to_outlook_message_id
  // 2) latest inbound message in this lead with outlook_message_id
  // If none => fail-closed (needs_human) to avoid sending an unthreaded email accidentally.
  const explicitAnchor = body.in_reply_to_outlook_message_id
    ? String(body.in_reply_to_outlook_message_id)
    : null;

  let anchorMessageId: string | null = explicitAnchor;

  if (!anchorMessageId) {
    const { data: inboundAnchor } = await (supabaseAdmin.from("messages") as any)
      .select("outlook_message_id")
      .eq("lead_id", leadId)
      .eq("sender", "user")
      .not("outlook_message_id", "is", null)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    anchorMessageId = inboundAnchor?.outlook_message_id
      ? String(inboundAnchor.outlook_message_id)
      : null;
  }

  if (!anchorMessageId) {
    // Release lock + mark failed so agent can handle
    await (supabaseAdmin.from("messages") as any)
      .update({
        send_status: "failed",
        send_error: "missing_outlook_anchor_message",
        send_locked_at: null,
        approval_required: true,
        status: "needs_human",
      })
      .eq("id", messageId)
      .eq("agent_id", user.id);

    return jsonError(400, "Cannot send Outlook reply: missing anchor message id");
  }

  // Send as a reply in the same conversation using createReply -> patch -> send
  let sentGraphMessageId: string | null = null;
  let sentConversationId: string | null = null;

  try {
    // 1) createReply
    const createReplyUrl = `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(
      anchorMessageId
    )}/createReply`;

    const createRes = await graphFetch(accessToken, createReplyUrl, {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (!createRes.ok) {
      const txt = await createRes.text().catch(() => "");
      throw new Error(`createReply_failed_${createRes.status}: ${txt.slice(0, 800)}`);
    }

    const draftReply = (await createRes.json().catch(() => null)) as any;
    const replyId = typeof draftReply?.id === "string" ? draftReply.id : "";
    if (!replyId) throw new Error("createReply_missing_id");

    sentGraphMessageId = replyId;
    sentConversationId =
      typeof draftReply?.conversationId === "string"
        ? draftReply.conversationId
        : null;

    // 2) update reply draft (subject/body/recipients + optional attachments)
    const patchUrl = `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(
      replyId
    )}`;

    const patchBody: any = {
      subject: safeSubject,
      body: {
        contentType: "Text",
        content: safeText,
      },
      toRecipients: [
        {
          emailAddress: { address: leadEmail },
        },
      ],
    };

    const patchRes = await graphFetch(accessToken, patchUrl, {
      method: "PATCH",
      body: JSON.stringify(patchBody),
    });

    if (!patchRes.ok) {
      const txt = await patchRes.text().catch(() => "");
      throw new Error(`patchReply_failed_${patchRes.status}: ${txt.slice(0, 800)}`);
    }

    // 2.5) Add attachments (Graph: POST /attachments)
    if (graphAttachments.length > 0) {
      for (const att of graphAttachments) {
        const attUrl = `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(
          replyId
        )}/attachments`;

        const attRes = await graphFetch(accessToken, attUrl, {
          method: "POST",
          body: JSON.stringify(att),
        });

        if (!attRes.ok) {
          const txt = await attRes.text().catch(() => "");
          throw new Error(`addAttachment_failed_${attRes.status}: ${txt.slice(0, 800)}`);
        }
      }
    }

    // 3) send the reply draft
    const sendUrl = `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(
      replyId
    )}/send`;

    const sendRes = await graphFetch(accessToken, sendUrl, {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (!sendRes.ok) {
      const txt = await sendRes.text().catch(() => "");
      throw new Error(`send_failed_${sendRes.status}: ${txt.slice(0, 800)}`);
    }

    // Mark draft row as sent (idempotency source-of-truth)
    const nowIso = new Date().toISOString();

    const finalConversationId =
      sentConversationId ?? (leadRow as any).outlook_conversation_id ?? null;

    await (supabaseAdmin.from("messages") as any)
      .update({
        send_status: "sent",
        sent_at: nowIso,
        send_locked_at: null,
        send_error: null,
        approval_required: false,
        status: "approved",
        email_provider: "outlook",
        outlook_message_id: sentGraphMessageId,
        outlook_conversation_id: finalConversationId,
        was_followup: !!was_followup,
      })
      .eq("id", messageId)
      .eq("agent_id", user.id);


    // Persist conversation mapping on lead (thread-equivalent)
    await (supabaseAdmin.from("leads") as any)
      .update({
        outlook_conversation_id: finalConversationId,
        email_provider: "outlook",
        last_message_at: nowIso,
      })
      .eq("id", leadId);

    return NextResponse.json({
      ok: true,
      status: "sent",
      message: {
        outlook_message_id: sentGraphMessageId,
        outlook_conversation_id: sentConversationId ?? (leadRow as any).outlook_conversation_id ?? null,
      },
    });
  } catch (e: any) {
    const errMsg = String(e?.message || e || "send_failed").slice(0, 5000);
    console.error("[outlook/send] error:", errMsg);

    // Mark failed + release lock
    await (supabaseAdmin.from("messages") as any)
      .update({
        send_status: "failed",
        send_error: errMsg,
        send_locked_at: null,
      })
      .eq("id", messageId)
      .eq("agent_id", user.id);

    return jsonError(500, "Failed to send Outlook email", {
      details: errMsg,
    });
  }
}