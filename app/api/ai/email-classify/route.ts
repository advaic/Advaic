import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  agentId?: string;
  emailAddress?: string;
  gmailThreadId?: string;
  gmailMessageId?: string;

  // minimal metadata
  subject?: string;
  from?: string;
  to?: string;
  replyTo?: string;

  // signals
  hasListUnsubscribe?: boolean;
  isBulk?: boolean;
  isNoReply?: boolean;

  // tiny snippet only (optional)
  snippet?: string;
};

type Result = {
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

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Very strict: only valid JSON output
function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError("Missing body", 400);

  // You can keep these env vars per “task deployment”
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES; // or a dedicated classifier deployment
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

  if (!endpoint || !apiKey || !deployment) {
    return jsonError("Azure env missing", 500);
  }

  const subject = String(body.subject ?? "").slice(0, 200);
  const from = String(body.from ?? "").slice(0, 300);
  const to = String(body.to ?? "").slice(0, 300);
  const replyTo = String(body.replyTo ?? "").slice(0, 300);
  const snippet = String(body.snippet ?? "").slice(0, 400);

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
- If legal/vendor/business/unknown/system/newsletter/billing/spam => never auto_reply.
- If "no-reply" or bulk/newsletter signals exist: usually needs_approval or ignore.
- If ambiguous: needs_approval.
`.trim();

  const user = `
Metadata:
subject: ${subject}
from: ${from}
to: ${to}
replyTo: ${replyTo}
signals:
hasListUnsubscribe: ${Boolean(body.hasListUnsubscribe)}
isBulk: ${Boolean(body.isBulk)}
isNoReply: ${Boolean(body.isNoReply)}

snippet:
${snippet}
`.trim();

  // Call Azure Chat Completions REST
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

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
    return jsonError("Azure request failed", 502);
  }

  const data = (await resp.json().catch(() => null)) as any;
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    return jsonError("No model output", 502);
  }

  const parsed = safeJsonParse<Result>(text);
  if (!parsed) return jsonError("Invalid JSON from model", 502);

  // Clamp + validate
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence)));
  const decision = parsed.decision;
  const email_type = parsed.email_type;

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

  if (!allowedDecision.has(decision) || !allowedType.has(email_type)) {
    return jsonError("Model output schema invalid", 502);
  }

  // Enforce fail-closed: block auto_reply unless very confident + lead-ish
  const safeAuto =
    (email_type === "LEAD" || email_type === "PORTAL") && confidence >= 0.97;

  const final: Result = {
    decision: safeAuto
      ? "auto_reply"
      : decision === "ignore"
      ? "ignore"
      : "needs_approval",
    email_type,
    confidence,
    reason: String(parsed.reason ?? "").slice(0, 120) || "n/a",
  };

  return NextResponse.json(final);
}
