import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  function jsonError(status: number, error: string, extra?: Record<string, any>) {
    return NextResponse.json({ error, ...(extra || {}) }, { status });
  }

  function mustEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
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
    lead_id,
    gmail_thread_id,
    to,
    subject,
    text,
    was_followup,
    attachments,
  } = (body || {}) as {
    lead_id?: string;
    gmail_thread_id?: string | null;
    to?: string;
    subject?: string;
    text?: string;
    was_followup?: boolean;
    attachments?: AttachmentInput[];
  };

  if (!lead_id || !to || !subject || !text) {
    return jsonError(400, "Missing required fields", {
      required: ["lead_id", "to", "subject", "text"],
    });
  }

  const safeTo = sanitizeHeaderValue(to);
  const safeSubject = sanitizeHeaderValue(subject);
  const safeText = String(text ?? "");

  if (!safeTo || !safeSubject || !safeText.trim()) {
    return jsonError(400, "Invalid required fields");
  }

  // 1️⃣ Authenticate agent
  // IMPORTANT: this route returns JSON, so we do not attempt to mutate cookies on a NextResponse we don't return.
  // We only need cookie reads here to authenticate the current user.
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
    }
  );

  const {
    data: { user },
    error: authErr,
  } = await supabaseAuth.auth.getUser();

  if (authErr || !user) {
    return jsonError(401, "Unauthorized");
  }

  // 2️⃣ Load Gmail connection
  const supabaseAdmin = createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

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
      mustEnv("NEXT_PUBLIC_SITE_URL")
    ).toString()
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
        `Attachment download failed: ${error?.message ?? "no data"}`
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
          MAX_ATTACHMENT_BYTES / (1024 * 1024)
        )}MB)`
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
            typeof a.mime === "string"
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
            MAX_TOTAL_ATTACHMENTS_BYTES / (1024 * 1024)
          )}MB`
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
    return jsonError(400, `Attachment failed: ${e?.message ?? "unknown"}`);
  }

  // 5️⃣ Send email via Gmail API (capture Gmail message id/thread id)
  let sentMessageId: string | null = null;
  let sentThreadId: string | null = gmail_thread_id ?? null;

  try {
    const sendRes = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        ...(gmail_thread_id ? { threadId: gmail_thread_id } : {}),
      },
    });

    sentMessageId = sendRes.data.id ?? null;
    sentThreadId = sendRes.data.threadId ?? sentThreadId;
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

    // Common: 429 quota / rate limit
    if (status === 429) {
      return jsonError(429, "Gmail quota exceeded / rate limited", details);
    }

    return jsonError(500, "Failed to send email", details);
  }

  // 6️⃣ Persist message in Supabase (dedupe via gmail_message_id)
  const attachmentsMeta = Array.isArray(attachments)
    ? attachments
        .filter((a): a is AttachmentInput =>
          !!a &&
          typeof a.bucket === "string" &&
          typeof a.path === "string" &&
          typeof a.name === "string" &&
          typeof a.mime === "string"
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

  const nowIso = new Date().toISOString();

  const baseRow: Record<string, any> = {
    lead_id,
    agent_id: user.id,
    sender: "agent",
    text: safeText,
    timestamp: nowIso,
    email_address: safeTo, // recipient
    gmail_thread_id: sentThreadId,
    gmail_message_id: sentMessageId,
    was_followup: !!was_followup,
    visible_to_agent: true,
    status: "sent",
    // best-effort: store attachment references (requires a json/jsonb column named `attachments`)
    attachments: attachmentsMeta,
  };

  let insertedMessageId: string | null = null;

  async function upsertMessageRow(row: Record<string, any>) {
    // Prefer returning the DB id so the UI can reconcile optimistic sends
    const hasGmailMessageId =
      typeof row.gmail_message_id === "string" && row.gmail_message_id.length > 0;

    const qBase = (supabaseAdmin.from("messages") as any);

    const q = hasGmailMessageId
      ? qBase.upsert(row, { onConflict: "gmail_message_id" })
      : qBase.insert(row);

    return await q.select("id,gmail_message_id,gmail_thread_id,timestamp");
  }

  let upsertRes = await upsertMessageRow(baseRow);

  // If the `attachments` column doesn't exist, retry without it.
  if (upsertRes?.error?.message?.toLowerCase?.().includes("column") &&
      upsertRes.error.message.toLowerCase().includes("attachments")) {
    const retryRow = { ...baseRow };
    delete retryRow.attachments;
    upsertRes = await upsertMessageRow(retryRow);
  }

  if (upsertRes?.error) {
    console.error("[gmail/send] Message upsert failed:", upsertRes.error.message);
  } else {
    const first = Array.isArray(upsertRes.data) ? upsertRes.data[0] : upsertRes.data;
    insertedMessageId = first?.id ?? null;
  }

  // 7️⃣ Persist threadId on lead so Gmail Push can map future events to the same lead
  if (sentThreadId) {
    const { error: leadUpdateErr } = await (supabaseAdmin.from("leads") as any)
      .update({ gmail_thread_id: sentThreadId })
      .eq("id", lead_id);

    if (leadUpdateErr) {
      console.error(
        "[gmail/send] Failed to update lead gmail_thread_id:",
        leadUpdateErr.message
      );
    }
  }

  return NextResponse.json({
    ok: true,
    inserted_id: insertedMessageId,
    message: {
      gmail_message_id: sentMessageId,
      gmail_thread_id: sentThreadId,
    },
  });
}
