import crypto from "crypto";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

type Primitive = string | number | boolean | null | undefined;
type FormValue = Primitive | FormValue[] | { [k: string]: FormValue };

function appendForm(
  form: URLSearchParams,
  key: string,
  value: FormValue,
): void {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendForm(form, `${key}[${index}]`, item);
    });
    return;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([childKey, childValue]) => {
      appendForm(form, `${key}[${childKey}]`, childValue);
    });
    return;
  }

  form.append(key, String(value));
}

function toFormBody(data: Record<string, FormValue>) {
  const form = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => appendForm(form, key, value));
  return form.toString();
}

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function unixToIso(ts: number | null | undefined): string | null {
  if (!Number.isFinite(ts)) return null;
  return new Date(Number(ts) * 1000).toISOString();
}

export async function stripeRequest<T = any>(args: {
  path: string;
  method?: "GET" | "POST";
  body?: Record<string, FormValue>;
}) {
  const method = args.method || "POST";
  const secret = mustEnv("STRIPE_SECRET_KEY");
  const url = `${STRIPE_API_BASE}${args.path}`;

  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  };

  if (args.body && method === "POST") {
    (init.headers as any)["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = toFormBody(args.body);
  }

  const res = await fetch(url, init);
  const data = (await res.json().catch(() => null)) as any;

  if (!res.ok) {
    const errMsg = String(
      data?.error?.message || data?.message || `stripe_http_${res.status}`,
    );
    throw new Error(errMsg);
  }

  return data as T;
}

function parseStripeSignature(header: string) {
  const parts = header.split(",").map((p) => p.trim());
  const out: { t?: string; v1: string[] } = { v1: [] };

  for (const p of parts) {
    const i = p.indexOf("=");
    if (i <= 0) continue;
    const key = p.slice(0, i);
    const value = p.slice(i + 1);
    if (key === "t") out.t = value;
    if (key === "v1") out.v1.push(value);
  }

  return out;
}

export function verifyStripeWebhook(args: {
  payload: string;
  signatureHeader: string | null;
  toleranceSeconds?: number;
}) {
  const signatureHeader = args.signatureHeader || "";
  const secret = mustEnv("STRIPE_WEBHOOK_SECRET");
  const toleranceSeconds = args.toleranceSeconds ?? 300;

  if (!signatureHeader) return { ok: false as const, error: "missing_signature" };

  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed.t || parsed.v1.length === 0) {
    return { ok: false as const, error: "bad_signature_header" };
  }

  const timestamp = Number(parsed.t);
  if (!Number.isFinite(timestamp)) {
    return { ok: false as const, error: "bad_signature_timestamp" };
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (age > toleranceSeconds) {
    return { ok: false as const, error: "signature_too_old" };
  }

  const signedPayload = `${parsed.t}.${args.payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const valid = parsed.v1.some((sig) => {
    const got = Buffer.from(sig, "utf8");
    if (got.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(got, expectedBuf);
  });

  if (!valid) return { ok: false as const, error: "signature_mismatch" };
  return { ok: true as const };
}
