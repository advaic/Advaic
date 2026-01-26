import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export const runtime = "nodejs";

// NOTE: We intentionally keep Supabase typing loose here because this API route
// touches tables that might not be included in your generated `Database` types yet.
// Using local row-shapes prevents the "type never" cascade in TS.

type EmailConnectionRow = {
  id: number; // bigint identity
  agent_id: string;
  email_address: string;
  refresh_token: string;
  access_token: string | null;
  last_history_id: string | null;
  status: string | null;
  watch_active: boolean;
};

type LeadIdRow = { id: string };

const ATTACHMENTS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET || "attachments";

type EmailMessageBodyRow = {
  agent_id: string;
  email_address: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  subject: string;
  from_email: string;
  to_email: string;
  reply_to: string;
  snippet: string;
  internal_date: string; // ISO
  body_text: string | null;
  body_html: string | null;
  status: "pending" | "approved" | "rejected" | "purged";
};

type EmailAttachmentInsert = {
  agent_id: string;
  email_address: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  attachment_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_bucket: string;
  storage_path: string;
  status: "pending" | "approved" | "rejected" | "purged";
};

// --- Classification (Azure) ---
// Use a dedicated deployment for email classification.
// Required envs:
// AZURE_OPENAI_ENDPOINT
// AZURE_OPENAI_API_KEY
// AZURE_OPENAI_DEPLOYMENT_EMAIL_CLASSIFIER
// Optional:
// AZURE_OPENAI_API_VERSION (default used below)
const AZURE_API_VERSION =
  process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

type ClassifyResult = {
  decision: "auto_reply" | "needs_approval" | "ignore";
  email_type:
    | "LEAD"
    | "PORTAL"
    | "BUSINESS_CONTACT"
    | "LEGAL"
    | "VENDOR"
    | "NEWSLETTER"
    | "BILLING"
    | "SYSTEM"
    | "SPAM"
    | "UNKNOWN";
  confidence: number; // 0..1
  reason: string;
};

function clamp01(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function extractHeader(headers: any[], key: string) {
  const k = String(key).toLowerCase();
  return (
    headers.find((x) => String(x?.name || "").toLowerCase() === k)?.value || ""
  );
}

function hasListUnsubscribe(headers: any[]) {
  return Boolean(extractHeader(headers, "List-Unsubscribe"));
}

function isBulkMail(headers: any[]) {
  const prec = extractHeader(headers, "Precedence").toLowerCase();
  const auto = extractHeader(headers, "Auto-Submitted").toLowerCase();
  const listId = extractHeader(headers, "List-Id");
  return (
    prec.includes("bulk") ||
    prec.includes("list") ||
    auto.includes("auto") ||
    Boolean(listId)
  );
}

function looksNoReply(from: string, replyTo: string) {
  const s = `${from} ${replyTo}`.toLowerCase();
  return (
    s.includes("no-reply") ||
    s.includes("noreply") ||
    s.includes("do-not-reply") ||
    s.includes("donotreply")
  );
}

function safeFileName(name: string) {
  const base = String(name || "file").trim() || "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function b64urlToBuffer(data: string) {
  const s = String(data || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const pad = s.length % 4;
  const padded = pad ? s + "=".repeat(4 - pad) : s;
  return Buffer.from(padded, "base64");
}

function decodeBodyData(data?: string | null) {
  if (!data) return "";
  try {
    return b64urlToBuffer(data).toString("utf8");
  } catch {
    return "";
  }
}

type GmailPart = {
  mimeType?: string;
  filename?: string;
  body?: { size?: number; data?: string; attachmentId?: string };
  parts?: GmailPart[];
};

function walkParts(part: GmailPart | null | undefined, out: GmailPart[]) {
  if (!part) return;
  out.push(part);
  const children = Array.isArray(part.parts) ? part.parts : [];
  for (const c of children) walkParts(c, out);
}

function extractBodiesFromPayload(payload: GmailPart | null | undefined) {
  const all: GmailPart[] = [];
  walkParts(payload, all);

  // Prefer explicit text/plain and text/html parts.
  const plain = all.find((p) =>
    String(p.mimeType || "")
      .toLowerCase()
      .startsWith("text/plain")
  );
  const html = all.find((p) =>
    String(p.mimeType || "")
      .toLowerCase()
      .startsWith("text/html")
  );

  const body_text = decodeBodyData(plain?.body?.data) || null;
  const body_html = decodeBodyData(html?.body?.data) || null;

  // Fallback: if no direct parts, some messages have body data at the top payload.
  const topMime = String(payload?.mimeType || "").toLowerCase();
  if (!body_text && topMime.startsWith("text/plain")) {
    const t = decodeBodyData(payload?.body?.data);
    return { body_text: t || null, body_html };
  }
  if (!body_html && topMime.startsWith("text/html")) {
    const h = decodeBodyData(payload?.body?.data);
    return { body_text, body_html: h || null };
  }

  return { body_text, body_html };
}

type AttachmentMeta = {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
};

function collectAttachments(
  payload: GmailPart | null | undefined
): AttachmentMeta[] {
  const all: GmailPart[] = [];
  walkParts(payload, all);

  const out: AttachmentMeta[] = [];
  for (const p of all) {
    const filename = String(p.filename || "").trim();
    const attachmentId = String(p.body?.attachmentId || "").trim();
    const size = Number(p.body?.size || 0);
    const mimeType = String(p.mimeType || "application/octet-stream");

    // Attachment heuristic: filename + attachmentId present
    if (filename && attachmentId) {
      out.push({
        attachmentId,
        filename,
        mimeType,
        size: Number.isFinite(size) ? size : 0,
      });
    }
  }
  return out;
}

function hardBlockBySubject(subject: string) {
  const s = subject.toLowerCase();
  // Only block very clear system/billing/security subjects
  return (
    s.includes("password") ||
    s.includes("passwort") ||
    s.includes("security") ||
    s.includes("sicherheits") ||
    s.includes("invoice") ||
    s.includes("rechnung") ||
    s.includes("zahlung") ||
    s.includes("subscription") ||
    s.includes("abonnement")
  );
}

async function classifyEmailAzure(input: {
  subject: string;
  from: string;
  to: string;
  replyTo: string;
  snippet: string;
  hasListUnsub: boolean;
  isBulk: boolean;
  isNoReply: boolean;
}): Promise<ClassifyResult> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_EMAIL_CLASSIFIER;

  // Fail closed if not configured
  if (!endpoint || !apiKey || !deployment) {
    return {
      decision: "needs_approval",
      email_type: "UNKNOWN",
      confidence: 0,
      reason: "classifier_not_configured",
    };
  }

  const system = `
You are an email safety classifier for a real-estate agent assistant.
Your #1 priority: NEVER allow an auto-reply to non-lead emails.
Fail closed: if uncertain, choose "needs_approval".

Return ONLY valid JSON with keys:
decision: "auto_reply" | "needs_approval" | "ignore"
email_type: one of ["LEAD","PORTAL","BUSINESS_CONTACT","LEGAL","VENDOR","NEWSLETTER","BILLING","SYSTEM","SPAM","UNKNOWN"]
confidence: number 0..1
reason: short string (max 120 chars)

Rules:
- "auto_reply" ONLY if it is clearly a property inquiry lead or portal inquiry and safe.
- Legal/vendor/business/unknown/system/newsletter/billing/spam => never auto_reply.
- "no-reply" / bulk / list-unsubscribe are signals, not automatic blocks.
- If ambiguous: needs_approval.
`.trim();

  const user = `
Metadata:
subject: ${String(input.subject || "").slice(0, 200)}
from: ${String(input.from || "").slice(0, 300)}
to: ${String(input.to || "").slice(0, 300)}
replyTo: ${String(input.replyTo || "").slice(0, 300)}
signals:
hasListUnsubscribe: ${Boolean(input.hasListUnsub)}
isBulk: ${Boolean(input.isBulk)}
isNoReply: ${Boolean(input.isNoReply)}

snippet:
${String(input.snippet || "").slice(0, 400)}
`.trim();

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${AZURE_API_VERSION}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  }).catch(() => null);

  if (!resp || !resp.ok) {
    return {
      decision: "needs_approval",
      email_type: "UNKNOWN",
      confidence: 0,
      reason: "classifier_failed",
    };
  }

  const data = (await resp.json().catch(() => null)) as any;
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    return {
      decision: "needs_approval",
      email_type: "UNKNOWN",
      confidence: 0,
      reason: "classifier_no_output",
    };
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  const allowedDecision = new Set(["auto_reply", "needs_approval", "ignore"]);
  const allowedType = new Set([
    "LEAD",
    "PORTAL",
    "BUSINESS_CONTACT",
    "LEGAL",
    "VENDOR",
    "NEWSLETTER",
    "BILLING",
    "SYSTEM",
    "SPAM",
    "UNKNOWN",
  ]);

  const decision = String(parsed?.decision || "needs_approval");
  const email_type = String(parsed?.email_type || "UNKNOWN");
  const confidence = clamp01(parsed?.confidence);
  const reason = String(parsed?.reason || "n/a").slice(0, 120);

  const safe = {
    decision: (allowedDecision.has(decision)
      ? (decision as any)
      : "needs_approval") as ClassifyResult["decision"],
    email_type: (allowedType.has(email_type)
      ? (email_type as any)
      : "UNKNOWN") as ClassifyResult["email_type"],
    confidence,
    reason,
  };

  // Enforce fail-closed: only allow auto_reply when very confident AND lead-ish
  const safeAuto =
    (safe.email_type === "LEAD" || safe.email_type === "PORTAL") &&
    safe.confidence >= 0.97;

  return {
    ...safe,
    decision: safeAuto
      ? "auto_reply"
      : safe.decision === "ignore"
      ? "ignore"
      : "needs_approval",
  };
}

const oidcClient = new OAuth2Client();

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer (.+)$/i);
  return match ? match[1] : null;
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function ok200() {
  // Pub/Sub stops retrying on any 2xx. Use 200 to avoid 204 edge-cases in Next runtime.
  return NextResponse.json({ ok: true }, { status: 200 });
}

// --- Backfill/catch-up helpers ---
function nowIso() {
  return new Date().toISOString();
}

async function markConnError(
  supabase: any,
  connectionId: number,
  message: string
) {
  try {
    await supabase
      .from("email_connections")
      .update({
        last_error: String(message || "unknown").slice(0, 2000),
        status: "active",
        watch_active: true,
      })
      .eq("id", connectionId);
  } catch {
    // ignore
  }
}

async function backfillRecentMessages(args: {
  gmail: any;
  supabase: any;
  connection: EmailConnectionRow;
  emailAddress: string;
  historyId: string;
}) {
  // Conservative backfill: pull a small window of recent inbox messages.
  // This prevents the system from “going dead” when historyId becomes too old.
  const { gmail, supabase, connection, emailAddress, historyId } = args;

  let listRes: any;
  try {
    listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 15,
      q: "newer_than:3d", // small window to avoid heavy scans
    });
  } catch (e: any) {
    await markConnError(
      supabase,
      connection.id,
      `backfill_list_failed: ${String(e?.message || e)}`
    );
    return;
  }

  const ids: string[] = Array.isArray(listRes?.data?.messages)
    ? listRes.data.messages.map((x: any) => String(x?.id || "")).filter(Boolean)
    : [];

  if (ids.length === 0) return;

  // Reuse the same ingestion logic by simulating a single history batch.
  // We call the same inner loop by inlining a tiny adapter.
  for (const id of ids) {
    try {
      // Fetch message metadata (same headers we use in push)
      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: [
          "From",
          "To",
          "Subject",
          "Date",
          "Reply-To",
          "List-Unsubscribe",
          "List-Id",
          "Precedence",
          "Auto-Submitted",
        ],
      });

      const gmailMessageId = msgRes.data.id;
      const threadId = msgRes.data.threadId;
      if (!gmailMessageId || !threadId) continue;

      const headers = msgRes.data.payload?.headers || [];
      const from = extractHeader(headers, "From");
      const subject = extractHeader(headers, "Subject");
      const toHeader = extractHeader(headers, "To");
      const replyTo = extractHeader(headers, "Reply-To");
      const snippet = msgRes.data.snippet || "";

      const signalListUnsub = hasListUnsubscribe(headers);
      const signalBulk = isBulkMail(headers);
      const signalNoReply = looksNoReply(from, replyTo);

      const internalDateMs = msgRes.data.internalDate
        ? Number(msgRes.data.internalDate)
        : Date.now();
      const timestampIso = new Date(internalDateMs).toISOString();

      function extractEmailAddress(h: string) {
        const s = String(h || "");
        const m = s.match(/<([^>]+)>/);
        const addr = (m ? m[1] : s).trim();
        return addr.toLowerCase();
      }

      const isFromAgent =
        extractEmailAddress(from) === String(emailAddress || "").toLowerCase();
      const sender = isFromAgent ? "agent" : "user";

      const hardBlocked =
        hardBlockBySubject(subject) &&
        (signalNoReply || signalBulk || signalListUnsub);

      let decision: ClassifyResult["decision"] = hardBlocked
        ? "ignore"
        : "needs_approval";
      let email_type: ClassifyResult["email_type"] = hardBlocked
        ? "SYSTEM"
        : "UNKNOWN";
      let confidence = hardBlocked ? 0.99 : 0.5;
      let reason = hardBlocked ? "hard_block" : "default_needs_approval";

      if (!hardBlocked && sender !== "agent") {
        const r = await classifyEmailAzure({
          subject,
          from,
          to: toHeader,
          replyTo,
          snippet,
          hasListUnsub: signalListUnsub,
          isBulk: signalBulk,
          isNoReply: signalNoReply,
        });
        decision = r.decision;
        email_type = r.email_type;
        confidence = r.confidence;
        reason = r.reason;
      }

      // Audit classification (best-effort)
      try {
        await supabase.from("email_classifications").upsert(
          {
            agent_id: connection.agent_id,
            email_address: emailAddress,
            gmail_thread_id: threadId,
            gmail_message_id: gmailMessageId,
            decision,
            email_type,
            confidence,
            reason,
            subject,
            from_email: from,
            to_email: toHeader,
            has_list_unsubscribe: signalListUnsub,
            is_bulk: signalBulk,
            is_no_reply: signalNoReply,
            model: "azure",
            prompt_version: "v1",
          } as any,
          { onConflict: "gmail_message_id" }
        );
      } catch {
        // ignore
      }

      if (decision === "ignore") continue;

      // Find or create lead by thread
      let leadId: string | null = null;

      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("agent_id", connection.agent_id)
        .eq("gmail_thread_id", threadId)
        .maybeSingle();

      if (existingLead && (existingLead as any).id) {
        leadId = (existingLead as any).id as string;
        await supabase
          .from("leads")
          .update({ last_message_at: timestampIso } as any)
          .eq("id", leadId);
      } else {
        if (sender === "agent") continue;
        const { data: newLead, error: leadInsErr } = await supabase
          .from("leads")
          .insert({
            agent_id: connection.agent_id,
            gmail_thread_id: threadId,
            last_message_at: timestampIso,
          } as any)
          .select("id")
          .single();
        if (leadInsErr) continue;
        leadId = (newLead as any)?.id || null;
        if (!leadId) continue;
      }

      // Phase B: full fetch for needs_approval (same as push)
      if (decision === "needs_approval" && sender !== "agent" && leadId) {
        try {
          const fullRes = await gmail.users.messages.get({
            userId: "me",
            id: gmailMessageId,
            format: "full",
          });

          const fullPayload = (fullRes.data.payload || null) as any;
          const bodies = extractBodiesFromPayload(fullPayload);

          const bodyRow: EmailMessageBodyRow = {
            agent_id: connection.agent_id,
            email_address: emailAddress,
            gmail_message_id: gmailMessageId,
            gmail_thread_id: threadId,
            subject,
            from_email: from,
            to_email: toHeader,
            reply_to: replyTo,
            snippet,
            internal_date: timestampIso,
            body_text: bodies.body_text,
            body_html: bodies.body_html,
            status: "pending",
          };

          await supabase
            .from("email_message_bodies")
            .upsert(bodyRow as any, { onConflict: "gmail_message_id" });

          const atts = collectAttachments(fullPayload);
          for (const att of atts) {
            try {
              const attRes = await gmail.users.messages.attachments.get({
                userId: "me",
                messageId: gmailMessageId,
                id: att.attachmentId,
              });

              const data = String(attRes.data.data || "");
              if (!data) continue;

              const bytes = b64urlToBuffer(data);

              const storagePath = `agents/${
                connection.agent_id
              }/leads/${leadId}/emails/${gmailMessageId}/${
                att.attachmentId
              }-${safeFileName(att.filename)}`;

              const { error: upErr } = await supabase.storage
                .from(ATTACHMENTS_BUCKET)
                .upload(storagePath, bytes, {
                  upsert: true,
                  contentType: att.mimeType || "application/octet-stream",
                  cacheControl: "3600",
                });

              if (upErr) continue;

              const attRow: EmailAttachmentInsert = {
                agent_id: connection.agent_id,
                email_address: emailAddress,
                gmail_message_id: gmailMessageId,
                gmail_thread_id: threadId,
                attachment_id: att.attachmentId,
                filename: att.filename,
                mime_type: att.mimeType || "application/octet-stream",
                size_bytes: Number.isFinite(att.size) ? att.size : bytes.length,
                storage_bucket: ATTACHMENTS_BUCKET,
                storage_path: storagePath,
                status: "pending",
              };

              await supabase.from("email_attachments").upsert(attRow as any, {
                onConflict: "gmail_message_id,attachment_id",
              });
            } catch {
              // ignore per-attachment
            }
          }
        } catch {
          // ignore phase B failures
        }
      }

      // Upsert message (dedupe)
      await supabase.from("messages").upsert(
        {
          lead_id: leadId,
          agent_id: connection.agent_id,
          sender,
          text: snippet,
          timestamp: timestampIso,
          gpt_score: null,
          was_followup: false,
          visible_to_agent: true,
          approval_required: false,
          status: sender === "agent" ? "sent" : "intent_pending",
          snippet,
          history_id: String(historyId),
          email_address: emailAddress,
          email_type,
          classification_confidence: confidence,
          gmail_message_id: gmailMessageId,
          gmail_thread_id: threadId,
        } as any,
        { onConflict: "gmail_message_id" }
      );
    } catch {
      // ignore per-message
      continue;
    }
  }
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const host = req.headers.get("host");
    console.log("📩 Gmail Push HIT", {
      url: req.url,
      host,
      at: new Date().toISOString(),
    });

    // --- 1) Verify Pub/Sub push JWT (OIDC) ---
    const token = getBearerToken(req);
    if (!token) {
      console.error("❌ Gmail Push: Missing Authorization Bearer token");
      return ok200();
    }

    // If you left "Audience" empty in Pub/Sub, Google sets aud = endpoint URL.
    // So we verify against req.url by default.
    const expectedAud = process.env.GMAIL_PUBSUB_PUSH_AUDIENCE || req.url;

    try {
      await oidcClient.verifyIdToken({
        idToken: token,
        audience: expectedAud,
      });
    } catch (e: any) {
      console.error("❌ Gmail Push: JWT verify failed", {
        expectedAud,
        err: e?.message || String(e),
      });
      return ok200();
    }

    // --- 2) Read Pub/Sub envelope ---
    let body: any;
    try {
      body = await req.json();
    } catch (e: any) {
      console.error("❌ Gmail Push: req.json() failed", e?.message || e);
      return ok200();
    }

    const messageDataB64 = body?.message?.data;
    if (!messageDataB64) {
      console.error("❌ Gmail Push: No body.message.data", {
        bodyKeys: Object.keys(body || {}),
      });
      return ok200();
    }

    // --- 3) Decode Gmail push payload ---
    let data: any;
    try {
      const decoded = Buffer.from(messageDataB64, "base64").toString("utf8");
      data = JSON.parse(decoded);
    } catch (e: any) {
      console.error(
        "❌ Gmail Push: Failed to decode/parse data",
        e?.message || e
      );
      return ok200();
    }

    const emailAddress = data?.emailAddress;
    const historyId = data?.historyId;

    if (!emailAddress || !historyId) {
      console.error("❌ Gmail Push: Missing emailAddress/historyId", { data });
      return ok200();
    }

    console.log("✅ Gmail Push payload", { emailAddress, historyId });

    // --- 4) Fetch connection from Supabase (service role, bypass RLS) ---
    const supabase = supabaseAdmin();

    const { data: conn, error: connErr } = await supabase
      .from("email_connections")
      .select(
        "id, agent_id, email_address, refresh_token, access_token, last_history_id, status, watch_active, provider"
      )
      .eq("provider", "gmail")
      .eq("email_address", emailAddress)
      .in("status", ["connected", "active"])
      .maybeSingle();

    const connection = conn as unknown as EmailConnectionRow | null;

    if (connErr || !conn) {
      console.error("❌ Gmail Push: email_connections not found", {
        emailAddress,
        connErr: connErr?.message,
      });
      return ok200();
    }

    // --- 5) Gmail API client with refresh token ---
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      (siteUrl ? new URL("/api/auth/gmail/callback", siteUrl).toString() : "");

    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !redirectUri
    ) {
      console.error("❌ Gmail Push: Missing Google OAuth env", {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasRedirectUri: !!redirectUri,
      });
      return ok200();
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    oauth2.setCredentials({
      refresh_token: connection.refresh_token,
      access_token: connection.access_token ?? undefined,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    // IMPORTANT:
    // Gmail push sends the *latest* historyId. To fetch changes, we must diff from the
    // previously stored last_history_id. If we don't have a baseline yet, we store the
    // current historyId and exit — the next push will produce a real diff.
    const prevHistoryId = connection.last_history_id;

    if (!prevHistoryId) {
      const { error: baselineErr } = await supabase
        .from("email_connections")
        .update({
          last_history_id: String(historyId),
          status: "active",
          watch_active: true,
          last_error: null,
        })
        .eq("id", connection.id);

      if (baselineErr) {
        console.error(
          "⚠️ Gmail Push: failed setting baseline last_history_id",
          baselineErr.message
        );
      }

      console.log("🧷 Set baseline last_history_id (no diff on first push)", {
        emailAddress,
        historyId,
      });

      return ok200();
    }

    const startHistoryId = String(prevHistoryId);

    // --- 5b) Fetch history with pagination ---
    const allHistory: any[] = [];
    let pageToken: string | undefined = undefined;

    try {
      do {
        const res = await gmail.users.history.list({
          userId: "me",
          startHistoryId: String(startHistoryId),
          historyTypes: ["messageAdded"],
          pageToken,
        });

        const items = res.data.history || [];
        allHistory.push(...items);
        pageToken = res.data.nextPageToken || undefined;
      } while (pageToken);
    } catch (e: any) {
      const msg = String(e?.message || "").toLowerCase();
      const code = Number(e?.code) || Number(e?.response?.status) || 0;

      // If startHistoryId is too old/invalid, reset baseline so the watch doesn't "die".
      // Optional backfill can be done by a separate runner.
      const staleHistory =
        code === 404 ||
        (msg.includes("start") &&
          msg.includes("history") &&
          (msg.includes("too old") || msg.includes("invalid"))) ||
        msg.includes("requested entity was not found");

      console.error("❌ Gmail Push: gmail.history.list failed", {
        emailAddress,
        startHistoryId,
        code,
        err: e?.message || String(e),
      });

      await markConnError(
        supabase,
        connection.id,
        `history_list_failed: ${String(e?.message || e)}`
      );

      if (staleHistory) {
        const { error: baselineErr } = await supabase
          .from("email_connections")
          .update({
            last_history_id: String(historyId),
            status: "active",
            watch_active: true,
          })
          .eq("id", connection.id);

        if (baselineErr) {
          console.error(
            "⚠️ Gmail Push: failed resetting baseline last_history_id",
            baselineErr.message
          );
        } else {
          console.log(
            "🧷 Reset baseline last_history_id after stale/invalid startHistoryId",
            {
              emailAddress,
              historyId,
            }
          );
        }
        // Best-effort: backfill recent messages so we don't miss leads while resetting baseline.
        await backfillRecentMessages({
          gmail,
          supabase,
          connection: connection as any,
          emailAddress,
          historyId: String(historyId),
        });
      }

      return ok200();
    }

    const history = allHistory;
    console.log("📚 Gmail history items", { count: history.length });

    // --- 6) Insert/update Leads + Messages using Gmail threadId mapping ---
    // Assumes you added:
    // - leads.gmail_thread_id + unique index (agent_id, gmail_thread_id)
    // - messages.gmail_message_id (unique) + messages.gmail_thread_id

    const insertedMessageIds: string[] = [];

    for (const h of history) {
      const msgs = h.messages || [];

      for (const m of msgs) {
        if (!m.id) continue;

        // IMPORTANT: Gmail `format: "metadata"` only returns headers listed in `metadataHeaders`.
        // We must request Reply-To + List/Precedence headers because we use them for safety signals.
        // Fetch message metadata so we get threadId + snippet + headers
        let msgRes;
        try {
          msgRes = await gmail.users.messages.get({
            userId: "me",
            id: m.id,
            format: "metadata",
            metadataHeaders: [
              "From",
              "To",
              "Subject",
              "Date",
              "Reply-To",
              "List-Unsubscribe",
              "List-Id",
              "Precedence",
              "Auto-Submitted",
            ],
          });
        } catch (e: any) {
          console.error("❌ Gmail Push: gmail.messages.get failed", {
            gmailMessageId: m.id,
            err: e?.message || String(e),
          });
          continue;
        }

        const gmailMessageId = msgRes.data.id;
        const threadId = msgRes.data.threadId;
        if (!gmailMessageId || !threadId) continue;

        const headers = msgRes.data.payload?.headers || [];
        const from = extractHeader(headers, "From");
        const subject = extractHeader(headers, "Subject");
        const toHeader = extractHeader(headers, "To");
        const replyTo = extractHeader(headers, "Reply-To");

        const snippet = msgRes.data.snippet || "";

        const signalListUnsub = hasListUnsubscribe(headers);
        const signalBulk = isBulkMail(headers);
        const signalNoReply = looksNoReply(from, replyTo);

        const internalDateMs = msgRes.data.internalDate
          ? Number(msgRes.data.internalDate)
          : Date.now();
        const timestampIso = new Date(internalDateMs).toISOString();

        // Determine sender: agent if message is from the connected Gmail account, else user
        function extractEmailAddress(h: string) {
          const s = String(h || "");
          const m = s.match(/<([^>]+)>/);
          const addr = (m ? m[1] : s).trim();
          return addr.toLowerCase();
        }

        const isFromAgent =
          extractEmailAddress(from) ===
          String(emailAddress || "").toLowerCase();

        const sender = isFromAgent ? "agent" : "user";

        // --- Classification (bombensicher / fail-closed) ---
        // Hard block only for very clear system/billing/security topics.
        const hardBlocked =
          hardBlockBySubject(subject) &&
          (signalNoReply || signalBulk || signalListUnsub);

        let decision: ClassifyResult["decision"] = hardBlocked
          ? "ignore"
          : "needs_approval";
        let email_type: ClassifyResult["email_type"] = hardBlocked
          ? "SYSTEM"
          : "UNKNOWN";
        let confidence = hardBlocked ? 0.99 : 0.5;
        let reason = hardBlocked ? "hard_block" : "default_needs_approval";

        // Never auto-reply to outgoing/agent messages.
        if (!hardBlocked && sender !== "agent") {
          const r = await classifyEmailAzure({
            subject,
            from,
            to: toHeader,
            replyTo,
            snippet,
            hasListUnsub: signalListUnsub,
            isBulk: signalBulk,
            isNoReply: signalNoReply,
          });
          decision = r.decision;
          email_type = r.email_type;
          confidence = r.confidence;
          reason = r.reason;
        }

        // Audit record (service role). This does NOT trigger any sending.
        // If you haven't created this table yet, create `email_classifications` per our earlier SQL.
        try {
          await supabase.from("email_classifications").upsert(
            {
              agent_id: connection.agent_id,
              email_address: emailAddress,
              gmail_thread_id: threadId,
              gmail_message_id: gmailMessageId,

              decision,
              email_type,
              confidence,
              reason,

              subject,
              from_email: from,
              to_email: toHeader,
              has_list_unsubscribe: signalListUnsub,
              is_bulk: signalBulk,
              is_no_reply: signalNoReply,

              model: "azure",
              prompt_version: "v1",
            } as any,
            { onConflict: "gmail_message_id" }
          );
        } catch (e: any) {
          console.warn(
            "⚠️ Gmail Push: could not upsert email_classifications",
            e?.message || e
          );
        }

        // If classifier says ignore, we do not store lead/message.
        if (decision === "ignore") {
          continue;
        }

        // 6a) Find or create Lead for (agent_id, gmail_thread_id)
        let leadId: string | null = null;

        const { data: existingLead, error: leadSelErr } = await supabase
          .from("leads")
          .select("id")
          .eq("agent_id", connection.agent_id)
          .eq("gmail_thread_id", threadId)
          .maybeSingle();

        if (leadSelErr) {
          console.error(
            "❌ Gmail Push: lead select failed",
            leadSelErr.message
          );
          continue;
        }

        if (existingLead && (existingLead as any).id) {
          leadId = (existingLead as any).id as string;

          // keep last_message_at current
          const { error: leadUpdErr } = await supabase
            .from("leads")
            .update({ last_message_at: timestampIso } as any)
            .eq("id", leadId);

          if (leadUpdErr) {
            console.error(
              "⚠️ Gmail Push: failed updating lead last_message_at",
              leadUpdErr.message
            );
          }
        } else {
          // Never create a lead from an outgoing (agent) email.
          // Outgoing messages should only be stored if we can already map them to an existing lead/thread.
          if (sender === "agent") {
            console.log(
              "↩️ Gmail Push: outgoing message without lead match - skipping lead creation",
              { threadId, gmailMessageId }
            );
            continue;
          }

          // Minimal insert; if your leads table has other NOT NULL cols without defaults,
          // this insert will fail and we need to adjust accordingly.
          const { data: newLead, error: leadInsErr } = await supabase
            .from("leads")
            .insert({
              agent_id: connection.agent_id,
              gmail_thread_id: threadId,
              last_message_at: timestampIso,
            } as any)
            .select("id")
            .single();

          if (leadInsErr) {
            console.error(
              "❌ Gmail Push: lead insert failed",
              leadInsErr.message
            );
            continue;
          }

          leadId = (newLead as any)?.id || null;
          if (!leadId) {
            console.error("❌ Gmail Push: lead insert returned no id");
            continue;
          }
        }

        // --- Phase B: For needs_approval, fetch full body + attachments and persist for review ---
        if (decision === "needs_approval" && sender !== "agent" && leadId) {
          try {
            const fullRes = await gmail.users.messages.get({
              userId: "me",
              id: gmailMessageId,
              format: "full",
            });

            const fullPayload = (fullRes.data.payload || null) as any;
            const bodies = extractBodiesFromPayload(fullPayload);

            const bodyRow: EmailMessageBodyRow = {
              agent_id: connection.agent_id,
              email_address: emailAddress,
              gmail_message_id: gmailMessageId,
              gmail_thread_id: threadId,
              subject,
              from_email: from,
              to_email: toHeader,
              reply_to: replyTo,
              snippet,
              internal_date: timestampIso,
              body_text: bodies.body_text,
              body_html: bodies.body_html,
              status: "pending",
            };

            await supabase
              .from("email_message_bodies")
              .upsert(bodyRow as any, { onConflict: "gmail_message_id" });

            const atts = collectAttachments(fullPayload);
            for (const att of atts) {
              try {
                const attRes = await gmail.users.messages.attachments.get({
                  userId: "me",
                  messageId: gmailMessageId,
                  id: att.attachmentId,
                });

                const data = String(attRes.data.data || "");
                if (!data) continue;

                const bytes = b64urlToBuffer(data);

                const storagePath = `agents/${
                  connection.agent_id
                }/leads/${leadId}/emails/${gmailMessageId}/${
                  att.attachmentId
                }-${safeFileName(att.filename)}`;

                const { error: upErr } = await supabase.storage
                  .from(ATTACHMENTS_BUCKET)
                  .upload(storagePath, bytes, {
                    upsert: true,
                    contentType: att.mimeType || "application/octet-stream",
                    cacheControl: "3600",
                  });

                if (upErr) {
                  console.warn("⚠️ Gmail Push: attachment upload failed", {
                    gmailMessageId,
                    attachmentId: att.attachmentId,
                    err: upErr.message,
                  });
                  continue;
                }

                const attRow: EmailAttachmentInsert = {
                  agent_id: connection.agent_id,
                  email_address: emailAddress,
                  gmail_message_id: gmailMessageId,
                  gmail_thread_id: threadId,
                  attachment_id: att.attachmentId,
                  filename: att.filename,
                  mime_type: att.mimeType || "application/octet-stream",
                  size_bytes: Number.isFinite(att.size)
                    ? att.size
                    : bytes.length,
                  storage_bucket: ATTACHMENTS_BUCKET,
                  storage_path: storagePath,
                  status: "pending",
                };

                await supabase.from("email_attachments").upsert(attRow as any, {
                  onConflict: "gmail_message_id,attachment_id",
                });
              } catch (e: any) {
                console.warn("⚠️ Gmail Push: attachment processing failed", {
                  gmailMessageId,
                  err: e?.message || String(e),
                });
              }
            }
          } catch (e: any) {
            console.warn("⚠️ Gmail Push: Phase B full-fetch failed", {
              gmailMessageId,
              err: e?.message || String(e),
            });
          }
        }

        // If this is an outgoing message and it already exists, skip early
        if (sender === "agent") {
          const { data: existingMsg } = await supabase
            .from("messages")
            .select("id")
            .eq("gmail_message_id", gmailMessageId)
            .maybeSingle();

          if (existingMsg) {
            continue;
          }
        }

        // 6b) Upsert message (dedupe via gmail_message_id)
        const { error: msgUpsertErr } = await supabase.from("messages").upsert(
          {
            lead_id: leadId,
            agent_id: connection.agent_id,
            // Determine sender: agent if message is from the connected Gmail account, else user
            sender,
            text: snippet,
            timestamp: timestampIso,

            gpt_score: null,
            was_followup: false,
            visible_to_agent: true,

            // IMPORTANT: Gmail Push is ingestion ONLY.
            // Inbound emails must NEVER become sendable drafts.
            // Drafts are created later by the pipeline (compose -> QA -> rewrite -> QA).
            approval_required: false,

            // Pipeline alignment:
            // - Gmail push only ingests.
            // - Inbound user emails should start at `intent_pending` so the intent runner can process them.
            // - Outgoing agent emails are stored as `sent`.
            status: sender === "agent" ? "sent" : "intent_pending",

            snippet,
            history_id: String(h.id || historyId),
            email_address: emailAddress,

            email_type,
            classification_confidence: confidence,

            gmail_message_id: gmailMessageId,
            gmail_thread_id: threadId,
          } as any,
          { onConflict: "gmail_message_id" }
        );

        if (msgUpsertErr) {
          console.error(
            "❌ Gmail Push: message upsert failed",
            msgUpsertErr.message
          );
          continue;
        }

        insertedMessageIds.push(gmailMessageId);
      }
    }

    console.log("✅ Inserted/Upserted Gmail messages", {
      count: insertedMessageIds.length,
      sample: insertedMessageIds.slice(0, 20),
    });

    // --- 7) Update connection last_history_id so next push uses correct startHistoryId ---
    const { error: updErr } = await supabase
      .from("email_connections")
      .update({
        last_history_id: String(historyId),
        status: "active",
        watch_active: true,
        last_error: null,
      })
      .eq("id", connection.id);

    if (updErr) {
      console.error(
        "⚠️ Gmail Push: failed updating email_connections",
        updErr.message
      );
    }

    console.log("✅ Gmail Push done", {
      ms: Date.now() - startedAt,
    });

    // Always 200 to stop Pub/Sub retries
    return ok200();
  } catch (err: any) {
    console.error("💥 Gmail Push: Unhandled error", err?.message || err);
    // Still return 200 so Pub/Sub stops hammering you
    return ok200();
  }
}
