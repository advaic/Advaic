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

function extractEmails(raw: string): string[] {
  const t = String(raw || "");
  const matches = t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return Array.from(new Set((matches || []).map((m) => m.trim())));
}

function getEmailDomain(email: string): string {
  const e = String(email || "")
    .trim()
    .toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 0) return "";
  return e.slice(at + 1).replace(/[^a-z0-9.-]/g, "");
}

function isProbablyValidEmail(email: string): boolean {
  const e = String(email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function parsePrimaryEmail(raw: string): string {
  const emails = extractEmails(raw);
  return emails[0] || "";
}

function domainIsOneOf(domain: string, allow: string[]): boolean {
  const d = String(domain || "").toLowerCase();
  if (!d) return false;
  return allow.some((a) => d === a || d.endsWith(`.${a}`));
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

function normalizeHaystack(...parts: string[]) {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikePortalSender(from: string, replyTo: string, to: string) {
  const hay = normalizeHaystack(from, replyTo, to);

  // Sender-side portal fingerprints (used for routing confidence)
  const portalNeedles = [
    "immobilienscout24",
    "immoscout24",
    "immowelt",
    "immonet",
    "funda",
    "pararius",
    "idealista",
    "rightmove",
    "zoopla",
    "scout24",
  ];

  return portalNeedles.some((d) => hay.includes(d));
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

function looksLikePortalInquiry(subject: string, snippet: string) {
  const t = `${subject}\n${snippet}`.toLowerCase();
  // Phrases that frequently appear in portal contact requests
  const kw = [
    "kontaktanfrage",
    "neue anfrage",
    "neue kontaktanfrage",
    "interessent",
    "nachricht von",
    "kontaktformular",
    "exposé angefordert",
    "expose angefordert",
    "besichtigung anfragen",
    "besichtigungstermin",
    "anfrage zur immobilie",
  ];
  return kw.some((k) => t.includes(k));
}

function hasUsableReplyTarget(from: string, replyTo: string) {
  const fRaw = String(from || "").trim();
  const rRaw = String(replyTo || "").trim();

  const f = parsePrimaryEmail(fRaw);
  const r = parsePrimaryEmail(rRaw);

  if (!r || !isProbablyValidEmail(r)) return false;

  // If reply-to is also a no-reply address, it's not usable.
  if (isNoReplyAddress(fRaw, rRaw)) return false;

  // If From is a no-reply address, we require Reply-To to be different.
  if (f && r && f.toLowerCase() === r.toLowerCase()) return false;

  return true;
}

function isPortalReplyRelayAllowed(from: string, replyTo: string, to: string) {
  const f = parsePrimaryEmail(from);
  const r = parsePrimaryEmail(replyTo);

  if (!hasUsableReplyTarget(from, replyTo)) return false;

  const fromDomain = getEmailDomain(f);
  const replyDomain = getEmailDomain(r);

  // Adjustable allowlists (keep short + expand as you see real data)
  const PORTAL_SENDER_DOMAINS = [
    "immobilienscout24.de",
    "immoscout24.de",
    "scout24.com",
    "immowelt.de",
    "immonet.de",
    "funda.nl",
    "pararius.com",
    "idealista.com",
    "rightmove.co.uk",
    "zoopla.co.uk",
  ];

  // Reply relays frequently used by portals.
  // We allow subdomains as well (domainIsOneOf handles that).
  const PORTAL_REPLY_RELAY_DOMAINS = [
    "reply.immobilienscout24.de",
    "reply.immoscout24.de",
    "reply.scout24.com",
    "reply.immowelt.de",
    "reply.immonet.de",
  ];

  const portalLike = looksLikePortalSender(from, replyTo, to);

  // If the From domain is a known portal domain, we accept a relay that is either:
  // - in explicit relay allowlist OR
  // - different from From and looks like a relay (starts with reply.*)
  const fromIsPortal = domainIsOneOf(fromDomain, PORTAL_SENDER_DOMAINS);
  const replyIsKnownRelay = domainIsOneOf(
    replyDomain,
    PORTAL_REPLY_RELAY_DOMAINS
  );

  const replyLooksLikeRelay =
    !!replyDomain &&
    (replyDomain.startsWith("reply.") || replyDomain.includes("reply"));

  // Strict mode: if From is clearly no-reply and portal-like, require reply relay allow.
  // This prevents accidental auto-replies to random newsletters that happen to include keywords.
  if (portalLike) {
    if (fromIsPortal) {
      return replyIsKnownRelay || replyLooksLikeRelay;
    }
    // If we don't recognize the sender domain as portal but it still looks portal-like,
    // allow only if reply domain looks like a relay (conservative).
    return replyLooksLikeRelay;
  }

  // Non-portal senders should not pass this portal relay check.
  return false;
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
  const portalInquiryLike = looksLikePortalInquiry(subject, snippet);

  // 1.5) Deterministic fast-path: portal inquiry that we can safely reply to.
  // Many portals send from no-reply but set Reply-To to a relay that forwards to the requester.
  if (
    portalLike &&
    (inquiryLike || portalInquiryLike) &&
    isPortalReplyRelayAllowed(from, replyTo, body.to || "")
  ) {
    return {
      decision: "auto_reply",
      email_type: "PORTAL",
      confidence: 1,
      reason: "portal_inquiry_replyto_relay_allowed",
    };
  }

  // 2) no-reply => never auto-reply UNLESS this is a portal inquiry and we have a usable Reply-To.
  // Many portals send from no-reply but set Reply-To to a relay address that accepts replies.
  if (body.isNoReply || isNoReplyAddress(from, replyTo)) {
    if (
      portalLike &&
      inquiryLike &&
      isPortalReplyRelayAllowed(from, replyTo, body.to || "")
    ) {
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
  // EXCEPT: portal inquiries where Reply-To is an allowed relay.
  if (
    final.decision === "auto_reply" &&
    (body.isNoReply || isNoReplyAddress(from, replyTo))
  ) {
    const portalLike = looksLikePortalSender(from, replyTo, to);
    const inquiryLike =
      looksLikePropertyInquiry(subject, snippet) ||
      looksLikePortalInquiry(subject, snippet);
    const relayOk = isPortalReplyRelayAllowed(from, replyTo, to);

    if (!(portalLike && inquiryLike && relayOk)) {
      final.decision = "needs_approval";
      final.reason = "no_reply_guard";
    }
  }

  // Extra safety: if From is no-reply and Reply-To relay is not allowed, never auto-reply.
  if (
    final.decision === "auto_reply" &&
    isNoReplyAddress(from, replyTo) &&
    !isPortalReplyRelayAllowed(from, replyTo, to)
  ) {
    final.decision = "needs_approval";
    final.reason = "no_reply_missing_or_untrusted_replyto_guard";
  }

  return NextResponse.json(final);
}
