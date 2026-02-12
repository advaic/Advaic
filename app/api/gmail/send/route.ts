import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  function jsonError(
    status: number,
    error: string,
    extra?: Record<string, any>,
  ) {
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

  type AttachmentInput = {
    bucket: string;
    path: string;
    name: string;
    mime: string;
  };

  const ATTACHMENTS_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || "attachments";

  const MAX_ATTACHMENTS = 10;
  const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024; // 12MB per file
  const MAX_TOTAL_ATTACHMENTS_BYTES = 25 * 1024 * 1024; // 25MB total (Gmail-safe)

  const ALLOWED_MIME = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

  const ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

  function sanitizeHeaderValue(input: unknown): string {
    // Prevent header injection + keep headers well-formed
    return String(input ?? "")
      .replace(/[\r\n]+/g, " ")
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sanitizeFilename(name: unknown): string {
    const n = String(name ?? "attachment").trim() || "attachment";
    // Remove path separators and quotes
    return n
      .replace(/[\\/]+/g, "-")
      .replace(/[\r\n]+/g, " ")
      .replace(/"/g, "'")
      .slice(0, 120);
  }

  function getExt(name: string): string {
    const ext = (name.split(".").pop() || "").toLowerCase();
    return ext;
  }

  function assertAttachmentAllowed(a: AttachmentInput) {
    if (!a?.bucket || !a?.path)
      throw new Error("Attachment missing bucket/path");

    // Force to our bucket (do NOT allow arbitrary bucket names)
    if (a.bucket !== ATTACHMENTS_BUCKET) {
      throw new Error("Invalid attachment bucket");
    }

    const filename = sanitizeFilename(a.name);
    const ext = getExt(filename);
    if (!ALLOWED_EXT.has(ext)) {
      throw new Error(`Disallowed file type: .${ext || "?"}`);
    }

    const mime = String(a.mime || "").toLowerCase();
    // Some clients may send empty mime; accept based on extension
    if (mime && !ALLOWED_MIME.has(mime)) {
      throw new Error(`Disallowed mime type: ${mime}`);
    }

    if (!a.name || !a.path) {
      throw new Error("Invalid attachment metadata");
    }
  }

  function assertScopedPath(agentId: string, leadId: string, path: string) {
    // Expected: agents/<uid>/leads/<leadId>/...
    const expectedPrefix = `agents/${agentId}/leads/${leadId}/`;
    if (!path.startsWith(expectedPrefix)) {
      throw new Error("Attachment path not allowed");
    }
    // Basic traversal guard
    if (path.includes("..")) {
      throw new Error("Attachment path invalid");
    }
  }

  const {
    id,
    lead_id,
    gmail_thread_id,
    to,
    subject,
    text,
    was_followup,
    attachments,
  } = (body || {}) as {
    id?: string;
    lead_id?: string;
    gmail_thread_id?: string | null;
    to?: string;
    subject?: string;
    text?: string;
    was_followup?: boolean;
    attachments?: AttachmentInput[];
  };

  if (!id || !lead_id || !to || !subject || !text) {
    return jsonError(400, "Missing required fields", {
      required: ["id", "lead_id", "to", "subject", "text"],
    });
  }

  const internal = isInternal(req);

  const SEND_LOCK_STALE_MS = Number(
    process.env.ADVAIC_SEND_LOCK_STALE_MS || 10 * 60 * 1000,
  ); // default 10 minutes

  function isFiniteMs(n: number) {
    return Number.isFinite(n) && n > 0;
  }

  function isoNow() {
    return new Date().toISOString();
  }

  // Admin client for DB reads/writes (service role)
  const supabaseAdmin = createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );

  // Resolve ownership from the message row (source of truth)
  const messageId = String(id).trim();

  const { data: msgRow, error: msgRowErr } = await (
    supabaseAdmin.from("messages") as any
  )
    .select("id, agent_id, lead_id, send_status")
    .eq("id", messageId)
    .maybeSingle();

  if (msgRowErr) {
    console.error("[gmail/send] message lookup failed:", msgRowErr.message);
    return jsonError(500, "Failed to load message");
  }

  if (!msgRow) {
    return jsonError(404, "Message not found");
  }

  // Prevent mismatched payloads
  if (String(msgRow.lead_id) !== String(lead_id)) {
    return jsonError(400, "lead_id does not match message.lead_id");
  }

  const agentIdFromMessage = String(msgRow.agent_id);
  if (!agentIdFromMessage) {
    return jsonError(400, "Message has no agent_id");
  }

  const safeTo = sanitizeHeaderValue(to);
  const safeSubject = sanitizeHeaderValue(subject);
  const safeText = String(text ?? "");

  if (!safeTo || !safeSubject || !safeText.trim()) {
    return jsonError(400, "Invalid required fields");
  }

  // 1️⃣ Authenticate agent
  // UI calls authenticate via cookies. Pipeline calls authenticate via an internal secret header.
  let user: { id: string } | null = null;

  if (internal) {
    // Internal pipeline: trust agentId resolved from message row
    user = { id: agentIdFromMessage };
  } else {
    // Cookie-based auth (UI)
    const supabaseAuth = createServerClient<Database>(
      mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
      mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        cookies: {
          get(name) {
            return req.cookies.get(name)?.value;
          },
          // no-op (we're not refreshing sessions here)
          set() {},
          remove() {},
        },
      },
    );

    const {
      data: { user: u },
      error: authErr,
    } = await supabaseAuth.auth.getUser();

    if (authErr || !u) {
      return jsonError(401, "Unauthorized");
    }

    // Source of truth ownership check
    if (String(u.id) !== agentIdFromMessage) {
      return jsonError(403, "Forbidden");
    }

    user = { id: String(u.id) };
  }

  // 2️⃣ Ensure lead belongs to the authenticated agent and lock recipient/thread defaults

  const { data: leadRow, error: leadErr } = await (
    supabaseAdmin.from("leads") as any
  )
    .select("id, agent_id, email, gmail_thread_id")
    .eq("id", lead_id)
    .maybeSingle();

  if (leadErr) {
    console.error("[gmail/send] lead lookup failed:", leadErr.message);
    return jsonError(500, "Failed to load lead");
  }

  if (!leadRow) {
    return jsonError(404, "Lead not found");
  }

  if (String(leadRow.agent_id) !== String(user.id)) {
    return jsonError(403, "Forbidden");
  }

  // Prevent accidental mis-sends: only allow sending to the lead's stored email.
  const leadEmail = String(leadRow.email || "").trim();
  if (!leadEmail) {
    return jsonError(400, "Lead has no email");
  }

  if (safeTo.toLowerCase() !== leadEmail.toLowerCase()) {
    return jsonError(400, "Recipient does not match lead email", {
      expected: leadEmail,
      got: safeTo,
    });
  }

  // 2b) Idempotency + send lock (prevents double-send)

  // 2b.1) Reclaim stale send locks (self-heal)
  // If a previous send attempt set send_status='sending' but never cleared the lock
  // (e.g., function crash/timeout), allow recovery after a short TTL.
  if (isFiniteMs(SEND_LOCK_STALE_MS)) {
    const cutoffIso = new Date(Date.now() - SEND_LOCK_STALE_MS).toISOString();

    // If the row is stuck in `sending` with an old lock timestamp, mark as failed and clear lock.
    // This is safe because we still have the `already_sent` short-circuit above.
    await (supabaseAdmin.from("messages") as any)
      .update({
        send_status: "failed",
        send_error: "stale_lock_reclaimed",
        send_locked_at: null,
      })
      .eq("id", messageId)
      .eq("agent_id", user.id)
      .eq("send_status", "sending")
      .lt("send_locked_at", cutoffIso);

    // Also clear any old lock timestamp if status is pending/failed but lock wasn't cleared.
    await (supabaseAdmin.from("messages") as any)
      .update({ send_locked_at: null })
      .eq("id", messageId)
      .eq("agent_id", user.id)
      .in("send_status", ["pending", "failed"])
      .lt("send_locked_at", cutoffIso);
  }

  // If already sent, short-circuit
  {
    const { data: statusRow, error: statusErr } = await (
      supabaseAdmin.from("messages") as any
    )
      .select("id, send_status")
      .eq("id", messageId)
      .eq("agent_id", user.id)
      .maybeSingle();

    if (statusErr) {
      console.error(
        "[gmail/send] send_status lookup failed:",
        statusErr.message,
      );
      return jsonError(500, "Failed to load message status");
    }

    if (!statusRow) {
      return jsonError(404, "Message not found");
    }

    if (String((statusRow as any).send_status || "").toLowerCase() === "sent") {
      return NextResponse.json(
        { ok: true, status: "already_sent" },
        { status: 200 },
      );
    }
  }

  // Acquire lock: allow retry from failed, but only when unlocked
  const nowIsoLock = isoNow();
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
    console.error("[gmail/send] lock acquire failed:", lockErr.message);
    return jsonError(500, "Failed to lock message");
  }

  if (!lockRows || lockRows.length === 0) {
    // Someone else is sending or it was already handled
    return NextResponse.json(
      { ok: true, status: "locked_or_in_progress" },
      { status: 200 },
    );
  }

  // If caller didn't pass a threadId, default to the one stored on the lead.
  const effectiveThreadId = (gmail_thread_id ??
    leadRow.gmail_thread_id ??
    null) as string | null;

  const { data: conn, error: connErr } = await supabaseAdmin
    .from("email_connections")
    .select("id, refresh_token, email_address, status")
    .eq("agent_id", user.id)
    .eq("provider", "gmail")
    .in("status", ["connected", "active"])
    .single();

  type GmailConnection = {
    id: string;
    refresh_token: string;
    email_address: string | null;
    status: string | null;
  };

  const gmailConn = conn as GmailConnection | null;

  if (!gmailConn || !gmailConn.refresh_token) {
    return jsonError(400, "Gmail not connected");
  }

  const fromEmail = gmailConn.email_address || "";

  // 3️⃣ Gmail OAuth client
  const oauth2 = new google.auth.OAuth2(
    mustEnv("GOOGLE_CLIENT_ID"),
    mustEnv("GOOGLE_CLIENT_SECRET"),
    new URL(
      "/api/auth/gmail/callback",
      mustEnv("NEXT_PUBLIC_SITE_URL"),
    ).toString(),
  );

  oauth2.setCredentials({
    refresh_token: gmailConn.refresh_token,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  // 4️⃣ Build RFC 2822 raw email (supports real attachments)
  function base64UrlEncode(input: Buffer | string) {
    const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return b
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  function wrapBase64(str: string) {
    return str.replace(/(.{76})/g, "$1\r\n");
  }

  async function downloadAttachmentAsBase64(bucket: string, path: string) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .download(path);
    if (error || !data) {
      throw new Error(
        `Attachment download failed: ${error?.message ?? "no data"}`,
      );
    }
    const arrayBuffer = await data.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);

    if (buf.length === 0) {
      throw new Error("Attachment is empty");
    }

    if (buf.length > MAX_ATTACHMENT_BYTES) {
      throw new Error(
        `Attachment too large (max ${Math.round(
          MAX_ATTACHMENT_BYTES / (1024 * 1024),
        )}MB)`,
      );
    }

    return {
      bytes: buf.length,
      base64: buf.toString("base64"),
    };
  }

  async function buildEncodedEmail() {
    const attInputsRaw: AttachmentInput[] = Array.isArray(attachments)
      ? attachments.filter(
          (a): a is AttachmentInput =>
            !!a &&
            typeof a.bucket === "string" &&
            typeof a.path === "string" &&
            typeof a.name === "string" &&
            typeof a.mime === "string",
        )
      : [];
    if (attInputsRaw.length > MAX_ATTACHMENTS) {
      throw new Error(`Too many attachments (max ${MAX_ATTACHMENTS})`);
    }

    // Validate and lock down attachment metadata
    const attInputs = attInputsRaw.map((a) => {
      assertAttachmentAllowed(a);
      assertScopedPath(user.id, lead_id, a.path);
      return {
        bucket: ATTACHMENTS_BUCKET,
        path: a.path,
        name: sanitizeFilename(a.name),
        mime: String(a.mime || "").toLowerCase(),
      };
    });

    // No attachments → simple text email
    if (attInputs.length === 0) {
      const raw = [
        ...(fromEmail ? [`From: ${fromEmail}`] : []),
        `To: ${safeTo}`,
        `Subject: ${safeSubject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "MIME-Version: 1.0",
        "",
        safeText,
      ].join("\r\n");

      return base64UrlEncode(raw);
    }

    // Attachments → multipart/mixed
    const boundary = `advaic_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}`;

    const headers: string[] = [
      ...(fromEmail ? [`From: ${fromEmail}`] : []),
      `To: ${safeTo}`,
      `Subject: ${safeSubject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary=\"${boundary}\"`,
    ];

    let body = "";
    body += `--${boundary}\r\n`;
    body += `Content-Type: text/plain; charset=\"UTF-8\"\r\n`;
    body += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    body += `${safeText}\r\n\r\n`;

    let totalBytes = 0;

    for (const a of attInputs) {
      const dl = await downloadAttachmentAsBase64(a.bucket, a.path);
      totalBytes += dl.bytes;
      if (totalBytes > MAX_TOTAL_ATTACHMENTS_BYTES) {
        throw new Error(
          `Total attachment size exceeds ${Math.round(
            MAX_TOTAL_ATTACHMENTS_BYTES / (1024 * 1024),
          )}MB`,
        );
      }

      const filename = sanitizeFilename(a.name);
      const mime =
        a.mime && ALLOWED_MIME.has(a.mime)
          ? a.mime
          : "application/octet-stream";

      body += `--${boundary}\r\n`;
      body += `Content-Type: ${mime}; name=\"${filename}\"\r\n`;
      body += `Content-Disposition: attachment; filename=\"${filename}\"\r\n`;
      body += "Content-Transfer-Encoding: base64\r\n\r\n";
      body += wrapBase64(dl.base64) + "\r\n\r\n";
    }

    body += `--${boundary}--`;

    const raw = headers.join("\r\n") + "\r\n\r\n" + body;
    return base64UrlEncode(raw);
  }

  let encodedMessage: string;
  try {
    encodedMessage = await buildEncodedEmail();
  } catch (e: any) {
    console.error("[gmail/send] Attachment build failed:", e?.message || e);

    // Release lock + mark as failed so the agent can retry.
    try {
      await (supabaseAdmin.from("messages") as any)
        .update({
          send_status: "failed",
          send_error: String(e?.message || "Attachment build failed").slice(
            0,
            5000,
          ),
          send_locked_at: null,
        })
        .eq("id", messageId)
        .eq("agent_id", user.id);
    } catch {
      // ignore
    }

    return jsonError(400, `Attachment failed: ${e?.message ?? "unknown"}`);
  }

  // 5️⃣ Send email via Gmail API (capture Gmail message id/thread id)
  let sentMessageId: string | null = null;
  let sentThreadId: string | null = effectiveThreadId ?? null;

  // Build attachment metadata once (used for DB storage). Actual attachment bytes are built in buildEncodedEmail().
  const attachmentsMeta = Array.isArray(attachments)
    ? attachments
        .filter(
          (a): a is AttachmentInput =>
            !!a &&
            typeof a.bucket === "string" &&
            typeof a.path === "string" &&
            typeof a.name === "string" &&
            typeof a.mime === "string",
        )
        .slice(0, MAX_ATTACHMENTS)
        .map((a) => ({
          bucket: ATTACHMENTS_BUCKET,
          path: a.path,
          name: sanitizeFilename(a.name),
          mime: String(a.mime || "").toLowerCase(),
          // optional fields (ignored by DB if not stored)
          size: (a as any).size ?? null,
        }))
    : [];

  async function markDraftAsSentOnMessageRow(args: {
    gmailMessageId: string | null;
    gmailThreadId: string | null;
  }) {
    const nowIso = new Date().toISOString();

    const updateWithAttachments: Record<string, any> = {
      send_status: "sent",
      sent_at: nowIso,
      send_locked_at: null,
      send_error: null,
      approval_required: false,
      status: "sent",
      visible_to_agent: true,
      email_address: safeTo,
      gmail_thread_id: args.gmailThreadId,
      gmail_message_id: args.gmailMessageId,
      was_followup: !!was_followup,
      attachments: attachmentsMeta,
    };

    // Try updating with attachments. If the column doesn't exist, retry without it.
    let upd = await (supabaseAdmin.from("messages") as any)
      .update(updateWithAttachments)
      .eq("id", messageId)
      .eq("agent_id", user.id);

    if (
      upd?.error?.message?.toLowerCase?.().includes("column") &&
      upd.error.message.toLowerCase().includes("attachments")
    ) {
      const retry = { ...updateWithAttachments };
      delete retry.attachments;
      upd = await (supabaseAdmin.from("messages") as any)
        .update(retry)
        .eq("id", messageId)
        .eq("agent_id", user.id);
    }

    return { nowIso };
  }

  try {
    const sendRes = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        ...(effectiveThreadId ? { threadId: effectiveThreadId } : {}),
      },
    });

    sentMessageId = sendRes.data.id ?? null;
    sentThreadId = sendRes.data.threadId ?? sentThreadId;

    // 5b) Mark THIS draft message row as sent (idempotent audit on the same row)
    await markDraftAsSentOnMessageRow({
      gmailMessageId: sentMessageId,
      gmailThreadId: sentThreadId,
    });
  } catch (e: any) {
    const status = Number(e?.code) || Number(e?.response?.status) || 500;
    const details = {
      code: e?.code,
      status: e?.response?.status,
      message: e?.message,
      errors: e?.errors,
      data: e?.response?.data,
    };
    console.error("[gmail/send] Gmail API error:", details);

    // Mark original approval message as failed + release lock
    try {
      await (supabaseAdmin.from("messages") as any)
        .update({
          send_status: "failed",
          send_error: String(details?.message || "Failed to send email").slice(
            0,
            5000,
          ),
          send_locked_at: null,
        })
        .eq("id", messageId)
        .eq("agent_id", user.id);
    } catch {
      // ignore
    }

    // Common: 429 quota / rate limit
    if (status === 429) {
      return jsonError(429, "Gmail quota exceeded / rate limited", details);
    }

    return jsonError(500, "Failed to send email", details);
  }

  // 6️⃣ Persist message in Supabase (dedupe via gmail_message_id)
  // (Removed: message row creation/duplication. Only update original row.)

  // 7️⃣ Persist threadId on lead so Gmail Push can map future events to the same lead
  const nowIso = new Date().toISOString();

  // Always keep last_message_at in sync, and set last_agent_message_at because this endpoint sends agent emails.
  const baseLeadUpdate: Record<string, any> = {
    last_message_at: nowIso,
    last_agent_message_at: nowIso,
    ...(sentThreadId ? { gmail_thread_id: sentThreadId } : {}),
  };

  const { error: baseLeadErr } = await (supabaseAdmin.from("leads") as any)
    .update(baseLeadUpdate)
    .eq("id", lead_id);

  if (baseLeadErr) {
    console.error(
      "[gmail/send] Failed to update lead base fields:",
      baseLeadErr.message,
    );
  }

  // If this email is a follow-up, advance follow-up state (new data model)
  if (was_followup) {
    // Read current state
    const { data: st, error: stErr } = await (
      supabaseAdmin.from("leads") as any
    )
      .select("followup_stage, followups_enabled")
      .eq("id", lead_id)
      .maybeSingle();

    if (stErr) {
      console.error(
        "[gmail/send] Failed to read lead followup state:",
        stErr.message,
      );
    }

    const currentStage = Math.max(0, Number((st as any)?.followup_stage ?? 0));
    const nextStage = Math.min(currentStage + 1, 2);
    const autoEnabled = Boolean((st as any)?.followups_enabled ?? true);

    // If stage 1 was just sent (0->1) and auto is enabled, plan stage 2 for +72h. Otherwise clear next_at.
    const nextAt =
      autoEnabled && nextStage === 1
        ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
        : null;

    const followupUpdate: Record<string, any> = {
      followup_last_sent_at: nowIso,
      followup_stage: nextStage,
      followup_status: "sent",
      followup_stop_reason: null,
      followup_paused_until: null,
      followup_next_at: nextAt,
    };

    const { error: fuErr } = await (supabaseAdmin.from("leads") as any)
      .update(followupUpdate)
      .eq("id", lead_id);

    if (fuErr) {
      console.error(
        "[gmail/send] Failed to update lead followup fields:",
        fuErr.message,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    inserted_id: messageId,
    message: {
      gmail_message_id: sentMessageId,
      gmail_thread_id: sentThreadId,
    },
    status: "sent",
  });
}
