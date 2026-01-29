import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function safeNextPath(raw: string | null): string {
  // We only allow relative, dashboard-internal paths under /app
  const fallback = "/app/konto/verknuepfungen";

  const value = (raw || "").trim();
  if (!value) return fallback;

  // Reject absolute URLs / protocol-relative URLs
  if (/^https?:\/\//i.test(value) || value.startsWith("//")) return fallback;

  // Ensure it is a path (starts with /) and stays in /app
  if (!value.startsWith("/app")) return fallback;

  // Prevent header/cookie injection via weird characters
  if (/[\r\n]/.test(value)) return fallback;

  // Keep state compact (Google allows state up to ~1KB, but be conservative)
  return value.slice(0, 300);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const nextPath = safeNextPath(url.searchParams.get("next"));

  const base = "https://accounts.google.com/o/oauth2/v2/auth";

  const redirectUri = new URL(
    "/api/auth/gmail/callback",
    mustEnv("NEXT_PUBLIC_SITE_URL")
  ).toString();

  const params = new URLSearchParams({
    client_id: mustEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",

    // Ensures we get a refresh_token (Google may still not return it on re-consent)
    access_type: "offline",
    prompt: "consent",

    // Minimum set + Gmail modify
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.modify",
    ].join(" "),

    // Keep state as the return path (callback will read this and redirect there)
    state: nextPath,
  });

  // Optional: forward login_hint if provided (makes UX smoother)
  const loginHint = url.searchParams.get("login_hint");
  if (loginHint && loginHint.trim()) {
    params.set("login_hint", loginHint.trim().slice(0, 200));
  }

  const res = NextResponse.redirect(`${base}?${params.toString()}`);
  // Prevent caching of an auth redirect
  res.headers.set("Cache-Control", "no-store");
  return res;
}
