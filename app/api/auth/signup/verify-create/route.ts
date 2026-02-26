import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { createHash, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

const CONSENT_VERSION = "2026-02-26";
const MAX_CODE_ATTEMPTS = 6;

type Body = {
  email?: string;
  phone?: string;
  code?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  allowNewsletter?: boolean;
  acceptTerms?: boolean;
  acceptPrivacy?: boolean;
  signupEntry?: string | null;
};

type TwilioVerifyConfig = {
  accountSid: string;
  authToken: string;
  serviceSid: string;
};

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

function hashCode(email: string, phone: string, code: string) {
  const pepper = mustEnv("SUPABASE_SERVICE_ROLE_KEY").slice(0, 32);
  return createHash("sha256")
    .update(`${email}::${phone}::${code}::${pepper}`)
    .digest("hex");
}

function safeHashEqual(a: string, b: string) {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
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

async function checkTwilioVerifyCode(config: TwilioVerifyConfig, to: string, code: string) {
  const resp = await fetch(
    `https://verify.twilio.com/v2/Services/${config.serviceSid}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        Code: code,
      }),
    },
  );

  const payload = await resp.json().catch(() => null);
  const status = String(payload?.status || "").toLowerCase();
  const valid = payload?.valid === true || status === "approved";

  if (resp.ok && valid) {
    return { ok: true as const };
  }

  const details = String(payload?.message || payload?.detail || `http_${resp.status}`);
  const detailsLc = details.toLowerCase();

  if (resp.status === 429 || status === "max_attempts_reached" || detailsLc.includes("max check attempts")) {
    return { ok: false as const, error: "verification_locked", details };
  }
  if (status === "expired" || status === "canceled" || detailsLc.includes("expired")) {
    return { ok: false as const, error: "verification_expired", details };
  }
  if (
    resp.status === 400 ||
    resp.status === 404 ||
    status === "pending" ||
    detailsLc.includes("not valid") ||
    detailsLc.includes("incorrect")
  ) {
    return { ok: false as const, error: "verification_invalid", details };
  }

  return { ok: false as const, error: "verification_provider_failed", details };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError(400, "missing_body");

  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const code = String(body.code || "").trim();
  const password = String(body.password || "");
  const firstName = String(body.firstName || "").trim().slice(0, 80);
  const lastName = String(body.lastName || "").trim().slice(0, 120);
  const company = String(body.company || "").trim().slice(0, 120);
  const allowNewsletter = body.allowNewsletter === true;
  const acceptTerms = body.acceptTerms === true;
  const acceptPrivacy = body.acceptPrivacy === true;
  const signupEntry = String(body.signupEntry || "")
    .trim()
    .slice(0, 80)
    .replace(/[^\w-]/g, "");

  if (!isValidEmail(email)) return jsonError(400, "invalid_email");
  if (!phone) return jsonError(400, "invalid_phone");
  if (!/^\d{6}$/.test(code)) return jsonError(400, "invalid_code_format");
  if (!firstName || !lastName) return jsonError(400, "missing_name");
  if (password.length < 8) return jsonError(400, "invalid_password");
  if (!acceptTerms || !acceptPrivacy) return jsonError(400, "missing_legal_consent");

  const supabase = supabaseAdmin();
  const nowIso = new Date().toISOString();

  const twilioVerify = getTwilioVerifyConfig();
  if (!twilioVerify && hasAnyTwilioVerifyEnv()) {
    return jsonError(500, "twilio_verify_misconfigured");
  }
  if (twilioVerify) {
    if (!phone.startsWith("+")) return jsonError(400, "invalid_phone_e164");

    const check = await checkTwilioVerifyCode(twilioVerify, phone, code);
    if (!check.ok) {
      if (check.error === "verification_locked") return jsonError(429, "verification_locked", check.details);
      if (check.error === "verification_expired") return jsonError(400, "verification_expired", check.details);
      if (check.error === "verification_invalid") return jsonError(400, "verification_invalid", check.details);
      return jsonError(500, "verification_provider_failed", check.details);
    }
  } else {
    const { data: verification, error: verificationErr } = await (supabase.from("signup_verifications") as any)
      .select("*")
      .eq("email", email)
      .eq("phone", phone)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verificationErr) return jsonError(500, "verification_lookup_failed", verificationErr.message);
    if (!verification?.id) return jsonError(400, "verification_not_found");

    const attempts = Number(verification.attempts || 0);
    const maxAttempts = Math.max(1, Number(verification.max_attempts || MAX_CODE_ATTEMPTS));
    if (attempts >= maxAttempts) return jsonError(429, "verification_locked");

    const expiresAt = new Date(String(verification.expires_at || "")).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return jsonError(400, "verification_expired");
    }

    const expectedHash = String(verification.code_hash || "");
    const gotHash = hashCode(email, phone, code);
    if (!expectedHash || !safeHashEqual(expectedHash, gotHash)) {
      await (supabase.from("signup_verifications") as any)
        .update({ attempts: attempts + 1 })
        .eq("id", verification.id);
      return jsonError(400, "verification_invalid");
    }

    await (supabase.from("signup_verifications") as any)
      .update({ used_at: nowIso, attempts: attempts + 1 })
      .eq("id", verification.id);
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const metadata = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName || null,
    name: fullName || null,
    company: company || null,
    phone: phone || null,
    telefon: phone || null,
    terms_accepted: true,
    terms_accepted_at: nowIso,
    terms_version: CONSENT_VERSION,
    privacy_accepted: true,
    privacy_accepted_at: nowIso,
    privacy_version: CONSENT_VERSION,
    marketing_email_opt_in: allowNewsletter,
    marketing_email_opt_in_at: allowNewsletter ? nowIso : null,
    marketing_email_opt_out_at: allowNewsletter ? null : nowIso,
    signup_source: signupEntry ? `website:${signupEntry}` : "website:signup",
    signup_path: "/signup",
    consent_locale: "de-DE",
    signup_email_code_verified_at: nowIso,
  };

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (createErr) {
    const msg = String(createErr.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return jsonError(409, "email_already_registered");
    }
    return jsonError(500, "signup_create_failed", createErr.message);
  }

  const userId = String(created?.user?.id || "");
  if (!userId) return jsonError(500, "signup_create_failed");

  const enrichedAgent = {
    id: userId,
    email,
    name: fullName || null,
    company: company || null,
    phone: phone || null,
    terms_accepted_at: nowIso,
    terms_version: CONSENT_VERSION,
    privacy_accepted_at: nowIso,
    privacy_version: CONSENT_VERSION,
    marketing_email_opt_in: allowNewsletter,
    marketing_email_opt_in_at: allowNewsletter ? nowIso : null,
    marketing_email_opt_out_at: allowNewsletter ? null : nowIso,
    signup_source: signupEntry ? `website:${signupEntry}` : "website:signup",
    updated_at: nowIso,
  };

  const basicAgent = {
    id: userId,
    email,
    name: fullName || null,
    company: company || null,
    updated_at: nowIso,
  };

  let { error: agentUpsertErr } = await (supabase.from("agents") as any).upsert(enrichedAgent, {
    onConflict: "id",
  });

  if (agentUpsertErr && /column .* does not exist/i.test(String(agentUpsertErr.message || ""))) {
    const fallback = await (supabase.from("agents") as any).upsert(basicAgent, { onConflict: "id" });
    agentUpsertErr = fallback.error ?? null;
  }
  if (agentUpsertErr) return jsonError(500, "agent_upsert_failed", agentUpsertErr.message);

  return NextResponse.json({
    ok: true,
    created: true,
    email,
  });
}
