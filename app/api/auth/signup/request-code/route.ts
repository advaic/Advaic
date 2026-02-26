import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { createHash, randomInt } from "crypto";

export const runtime = "nodejs";

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 15;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_PER_WINDOW = 5;

type Body = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  acceptTerms?: boolean;
  acceptPrivacy?: boolean;
};

type TwilioVerifyConfig = {
  accountSid: string;
  authToken: string;
  serviceSid: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __advaic_signup_code_rl_v1:
    | Map<string, { count: number; resetAt: number }>
    | undefined;
}

function mustEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function jsonError(status: number, message: string, details?: string) {
  return NextResponse.json({ ok: false, error: message, ...(details ? { details } : {}) }, { status });
}

function normalizeEmail(raw: unknown) {
  return String(raw || "").trim().toLowerCase();
}

function normalizePhone(raw: unknown) {
  const input = String(raw || "").trim();
  if (!input) return "";
  const hasPlus = input.startsWith("+");
  const digits = input.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  return `${hasPlus ? "+" : ""}${digits}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(req: NextRequest) {
  const forwarded = String(req.headers.get("x-forwarded-for") || "").trim();
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = String(req.headers.get("x-real-ip") || "").trim();
  if (realIp) return realIp;
  return "unknown";
}

function getRateMap() {
  if (!globalThis.__advaic_signup_code_rl_v1) {
    globalThis.__advaic_signup_code_rl_v1 = new Map();
  }
  return globalThis.__advaic_signup_code_rl_v1;
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const map = getRateMap();
  const current = map.get(key);
  if (!current || current.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }

  if (current.count >= RATE_LIMIT_PER_WINDOW) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  map.set(key, current);
  return { ok: true, retryAfterSec: 0 };
}

function hashCode(email: string, phone: string, code: string) {
  const pepper = mustEnv("SUPABASE_SERVICE_ROLE_KEY").slice(0, 32);
  return createHash("sha256")
    .update(`${email}::${phone}::${code}::${pepper}`)
    .digest("hex");
}

function maskEmail(email: string) {
  const [name = "", domain = ""] = email.split("@");
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0] || "*"}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string) {
  const raw = String(phone || "").trim();
  if (!raw) return "";
  const visibleTail = raw.slice(-2);
  const maskedCore = raw.slice(0, -2).replace(/\d/g, "*");
  return `${maskedCore}${visibleTail}`;
}

function getTwilioVerifyConfig(): TwilioVerifyConfig | null {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "").trim();
  const serviceSid = String(process.env.TWILIO_VERIFY_SERVICE_SID || "").trim();
  if (!accountSid || !authToken || !serviceSid) return null;
  return { accountSid, authToken, serviceSid };
}

function hasAnyTwilioVerifyEnv() {
  return Boolean(
    String(process.env.TWILIO_ACCOUNT_SID || "").trim() ||
      String(process.env.TWILIO_AUTH_TOKEN || "").trim() ||
      String(process.env.TWILIO_VERIFY_SERVICE_SID || "").trim(),
  );
}

async function startTwilioVerifySms(config: TwilioVerifyConfig, to: string) {
  const resp = await fetch(
    `https://verify.twilio.com/v2/Services/${config.serviceSid}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        Channel: "sms",
        Locale: "de",
      }),
    },
  );

  const payload = await resp.json().catch(() => null);
  if (!resp.ok) {
    return {
      ok: false as const,
      error: String(payload?.message || payload?.detail || `http_${resp.status}`),
      status: resp.status,
    };
  }

  return {
    ok: true as const,
    sid: String(payload?.sid || ""),
    status: String(payload?.status || ""),
  };
}

async function sendVerificationEmail(args: {
  to: string;
  code: string;
  firstName: string;
  expiresMinutes: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ADVAIC_EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: false as const, error: "email_provider_not_configured" };
  }

  const safeName = args.firstName.trim() || "Guten Tag";
  const subject = "Ihr Advaic Verifizierungscode";
  const text = [
    `Hallo ${safeName},`,
    "",
    "vielen Dank für Ihre Registrierung bei Advaic.",
    `Ihr Verifizierungscode lautet: ${args.code}`,
    "",
    `Der Code ist ${args.expiresMinutes} Minuten gültig.`,
    "Wenn Sie die Registrierung nicht gestartet haben, ignorieren Sie diese E-Mail.",
    "",
    "Viele Grüße",
    "Advaic",
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#0b0f17;line-height:1.55">
      <h2 style="margin:0 0 10px 0">Ihr Verifizierungscode</h2>
      <p style="margin:0 0 12px 0">Hallo ${safeName},</p>
      <p style="margin:0 0 12px 0">vielen Dank für Ihre Registrierung bei Advaic.</p>
      <p style="margin:0 0 12px 0">Ihr Verifizierungscode lautet:</p>
      <div style="display:inline-block;font-size:28px;font-weight:700;letter-spacing:0.18em;padding:10px 14px;border-radius:10px;border:1px solid rgba(11,15,23,.16);background:#f7f8fa">${args.code}</div>
      <p style="margin:14px 0 0 0">Der Code ist ${args.expiresMinutes} Minuten gültig.</p>
      <p style="margin:10px 0 0 0;color:#5b6472">Wenn Sie die Registrierung nicht gestartet haben, ignorieren Sie diese E-Mail.</p>
      <p style="margin:16px 0 0 0">Viele Grüße<br/>Advaic</p>
    </div>
  `.trim();

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject,
      text,
      html,
    }),
  });

  const payload = await resp.json().catch(() => null);
  if (!resp.ok || !payload?.id) {
    return {
      ok: false as const,
      error: String(payload?.error?.message || payload?.message || `http_${resp.status}`),
    };
  }
  return { ok: true as const, messageId: String(payload.id) };
}

async function sendVerificationSms(args: {
  to: string;
  code: string;
  firstName: string;
  expiresMinutes: number;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    return { ok: true as const, skipped: true as const };
  }

  // Twilio expects E.164 format for reliable delivery.
  if (!args.to.startsWith("+")) {
    return { ok: true as const, skipped: true as const };
  }

  const greeting = args.firstName.trim() || "Hallo";
  const body = `${greeting}, Ihr Advaic Verifizierungscode: ${args.code}. Gültig für ${args.expiresMinutes} Minuten.`;

  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: args.to,
        From: from,
        Body: body,
      }),
    },
  );

  if (!resp.ok) {
    const payload = await resp.text().catch(() => "");
    return {
      ok: false as const,
      error: `twilio_http_${resp.status}${payload ? `:${payload.slice(0, 240)}` : ""}`,
    };
  }

  return { ok: true as const, skipped: false as const };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError(400, "missing_body");

  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const firstName = String(body.firstName || "").trim().slice(0, 80);
  const lastName = String(body.lastName || "").trim().slice(0, 120);
  const acceptTerms = body.acceptTerms === true;
  const acceptPrivacy = body.acceptPrivacy === true;

  if (!isValidEmail(email)) return jsonError(400, "invalid_email");
  if (!phone) return jsonError(400, "invalid_phone");
  if (!firstName || !lastName) return jsonError(400, "missing_name");
  if (!acceptTerms || !acceptPrivacy) return jsonError(400, "missing_legal_consent");

  const ip = getClientIp(req);
  const rl = enforceRateLimit(`${ip}:${email}`);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const twilioVerify = getTwilioVerifyConfig();
  if (!twilioVerify && hasAnyTwilioVerifyEnv()) {
    return jsonError(500, "twilio_verify_misconfigured");
  }
  if (twilioVerify) {
    if (!phone.startsWith("+")) return jsonError(400, "invalid_phone_e164");

    const started = await startTwilioVerifySms(twilioVerify, phone);
    if (!started.ok) {
      const errorText = String(started.error || "").toLowerCase();
      if (started.status === 429) return jsonError(429, "verification_rate_limited", started.error);
      if (errorText.includes("phone number") || errorText.includes("invalid")) {
        return jsonError(400, "invalid_phone_e164", started.error);
      }
      return jsonError(500, "verification_sms_failed", started.error);
    }

    return NextResponse.json({
      ok: true,
      method: "sms_verify",
      maskedTarget: maskPhone(phone),
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString(),
    });
  }

  const code = String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
  const codeHash = hashCode(email, phone, code);
  const now = Date.now();
  const expiresAt = new Date(now + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  const supabase = supabaseAdmin();

  // Clear still-open attempts for this identity before issuing a fresh code.
  await (supabase.from("signup_verifications") as any)
    .delete()
    .eq("email", email)
    .eq("phone", phone)
    .is("used_at", null);

  const { data: inserted, error: insertErr } = await (supabase.from("signup_verifications") as any)
    .insert({
      email,
      phone,
      code_hash: codeHash,
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: 6,
      metadata: {
        first_name: firstName,
        requested_at: new Date(now).toISOString(),
        ip,
        ua: String(req.headers.get("user-agent") || "").slice(0, 240),
      },
    })
    .select("id")
    .single();

  if (insertErr || !inserted?.id) {
    return jsonError(500, "verification_store_failed", insertErr?.message);
  }

  const mail = await sendVerificationEmail({
    to: email,
    code,
    firstName,
    expiresMinutes: CODE_TTL_MINUTES,
  });

  if (!mail.ok) {
    await (supabase.from("signup_verifications") as any).delete().eq("id", inserted.id);
    return jsonError(500, "verification_email_failed", mail.error);
  }

  const sms = await sendVerificationSms({
    to: phone,
    code,
    firstName,
    expiresMinutes: CODE_TTL_MINUTES,
  });

  if (!sms.ok) {
    await (supabase.from("signup_verifications") as any).delete().eq("id", inserted.id);
    return jsonError(500, "verification_sms_failed", sms.error);
  }

  return NextResponse.json({
    ok: true,
    method: "email_code",
    maskedTarget: maskEmail(email),
    expiresAt,
    smsSent: sms.skipped ? false : true,
  });
}
