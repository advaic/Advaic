import { NextRequest, NextResponse } from "next/server";

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
  reason: string; // <= 120 chars
};

function jsonError(
  message: string,
  status: number,
  extra?: Record<string, any>
) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status });
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

// Very strict: only valid JSON output
function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function clamp01(x: any) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function s(v: any, max: number) {
  return String(v ?? "").slice(0, max);
}

function looksLikeMailerDaemon(from: string, subject: string) {
  const f = from.toLowerCase();
  const sub = subject.toLowerCase();
  return (
    f.includes("mailer-daemon") ||
    f.includes("postmaster") ||
    sub.includes("delivery status notification") ||
    sub.includes("undelivered") ||
    sub.includes("mail delivery")
  );
}

function hasBillingSignals(subject: string, snippet: string) {
  const t = `${subject}\n${snippet}`.toLowerCase();
  // Keep conservative; this only forces needs_approval.
  const keywords = [
    "rechnung",
    "invoice",
    "payment",
    "zahlung",
    "mahnung",
    "overdue",
    "due",
    "kontoauszug",
    "iban",
    "sepa",
    "billing",
    "order confirmation",
    "bestellbestätigung",
    "subscription",
    "abo",
  ];
  return keywords.some((k) => t.includes(k));
}

function isNoReplyAddress(from: string, replyTo: string) {
  const f = from.toLowerCase();
  const r = replyTo.toLowerCase();
  const patterns = ["no-reply", "noreply", "do-not-reply", "donotreply"];
  return patterns.some((p) => f.includes(p) || r.includes(p));
}

function looksLikePortalSender(from: string, replyTo: string, to: string) {
  const hay = `${from} ${replyTo} ${to}`.toLowerCase();
  // Add/extend as you onboard more portals
  const portalDomains = [
    "immobilienscout24",
    "immoscout24",
    "immowelt",
    "immonet",
    "funda",
    "pararius",
    "idealista",
    "rightmove",
    "zoopla",
  ];
  return portalDomains.some((d) => hay.includes(d));
}

function looksLikePropertyInquiry(subject: string, snippet: string) {
  const t = `${subject}\n${snippet}`.toLowerCase();
  // Conservative keywords for real-estate inquiries / viewing requests
  const kw = [
    "anfrage",
    "kontaktanfrage",
    "interesse",
    "ich interessiere mich",
    "besichtigung",
    "viewing",
    "exposé",
    "expose",
    "immobilie",
    "wohnung",
    "haus",
    "rückfrage",
    "availability",
    "verfügbar",
    "available",
    "termin",
  ];
  return kw.some((k) => t.includes(k));
}

function hasUsableReplyTarget(from: string, replyTo: string) {
  const r = String(replyTo || "").trim();
  if (!r) return false;
  // If reply-to is also a no-reply address, it's not usable.
  if (isNoReplyAddress(from, r)) return false;
  return true;
}

function isBulkOrNewsletterSignal(
  body: Body,
  subject: string,
  snippet: string
) {
  // We only get boolean signals + short snippet; be conservative.
  if (body.hasListUnsubscribe) return true;
  if (body.isBulk) return true;

  const t = `${subject}\n${snippet}`.toLowerCase();
  // Keywords that often show newsletters/promotions
  const kw = [
    "newsletter",
    "unsubscribe",
    "abbestellen",
    "abmelden",
    "promo",
    "promotion",
    "angebot",
    "sale",
    "%",
  ];
  return kw.some((k) => t.includes(k));
}

function enforceHardRules(
  body: Body,
  fields: { subject: string; from: string; replyTo: string; snippet: string }
): Result | null {
  const { subject, from, replyTo, snippet } = fields;

  // 1) System / bounce mail => ignore
  if (looksLikeMailerDaemon(from, subject)) {
    return {
      decision: "ignore",
      email_type: "SYSTEM",
      confidence: 1,
      reason: "system_or_bounce",
    };
  }

  const portalLike = looksLikePortalSender(from, replyTo, body.to || "");
  const inquiryLike = looksLikePropertyInquiry(subject, snippet);

  // 2) no-reply => never auto-reply UNLESS this is a portal inquiry and we have a usable Reply-To.
  // Many portals send from no-reply but set Reply-To to a relay address that accepts replies.
  if (body.isNoReply || isNoReplyAddress(from, replyTo)) {
    if (portalLike && inquiryLike && hasUsableReplyTarget(from, replyTo)) {
      // Let the model decide (could be PORTAL lead). Do not hard-block.
      return null;
    }

    return {
      decision: "needs_approval",
      email_type: portalLike ? "PORTAL" : "UNKNOWN",
      confidence: 1,
      reason: "no_reply_address",
    };
  }

  // 3) Bulk / list-unsubscribe / newsletter-like => ignore by default,
  // BUT never ignore if it looks like a portal or a property inquiry.
  if (isBulkOrNewsletterSignal(body, subject, snippet)) {
    if (portalLike || inquiryLike) {
      // Let the model decide; worst case becomes needs_approval.
      return null;
    }

    return {
      decision: "ignore",
      email_type: "NEWSLETTER",
      confidence: 1,
      reason: "bulk_or_newsletter_signal",
    };
  }

  // 4) Billing signals => always needs approval
  if (hasBillingSignals(subject, snippet)) {
    return {
      decision: "needs_approval",
      email_type: "BILLING",
      confidence: 1,
      reason: "billing_signal",
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError("Missing body", 400);

  // Minimal required identifiers for auditing / routing
  // (We don't enforce agentId yet, because some callers may only classify raw Gmail events.
  //  But we keep it available.)

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  // Dedicated classifier deployment (preferred). Fallback to your previous env if needed.
  const deployment =
    process.env.AZURE_OPENAI_DEPLOYMENT_EMAIL_CLASSIFIER ||
    process.env.AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES ||
    "";

  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

  if (!endpoint || !apiKey || !deployment) {
    return jsonError("Azure env missing", 500, {
      missing: {
        AZURE_OPENAI_ENDPOINT: !endpoint,
        AZURE_OPENAI_API_KEY: !apiKey,
        AZURE_OPENAI_DEPLOYMENT_EMAIL_CLASSIFIER:
          !process.env.AZURE_OPENAI_DEPLOYMENT_EMAIL_CLASSIFIER,
      },
    });
  }

  const subject = s(body.subject, 200);
  const from = s(body.from, 300);
  const to = s(body.to, 300);
  const replyTo = s(body.replyTo, 300);
  const snippet = s(body.snippet, 600);

  // HARD RULES FIRST (deterministic > AI-first)
  const hard = enforceHardRules(body, { subject, from, replyTo, snippet });
  if (hard) return NextResponse.json(hard);

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
- "auto_reply" ONLY if it is clearly a property inquiry lead OR a portal inquiry (e.g., ImmoScout24) AND replying will reach the requester (Reply-To usable).
- If sender is no-reply but Reply-To is a valid relay address, treat it as potentially safe portal routing.
- If legal/vendor/business/unknown/system/newsletter/billing/spam => never auto_reply.
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
  const confidence = clamp01((parsed as any).confidence);
  const decision = (parsed as any).decision;
  const email_type = (parsed as any).email_type;

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
    reason: s((parsed as any).reason, 120) || "n/a",
  };

  // Extra safety: never auto-reply if caller marked isNoReply
  if (
    final.decision === "auto_reply" &&
    (body.isNoReply || isNoReplyAddress(from, replyTo))
  ) {
    final.decision = "needs_approval";
    final.reason = "no_reply_guard";
  }

  // Extra safety: if From is no-reply and Reply-To is missing/empty, never auto-reply.
  if (
    final.decision === "auto_reply" &&
    isNoReplyAddress(from, replyTo) &&
    !hasUsableReplyTarget(from, replyTo)
  ) {
    final.decision = "needs_approval";
    final.reason = "no_reply_missing_replyto_guard";
  }

  return NextResponse.json(final);
}
