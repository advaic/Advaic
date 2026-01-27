// app/api/auth/outlook/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * Outlook / Microsoft OAuth2 Authorization Code + PKCE (production-ready)
 *
 * Flow:
 * 1) Client hits /api/auth/outlook/start?returnTo=/somewhere
 * 2) We generate:
 *   - state (CSRF)
 *   - PKCE code_verifier + code_challenge
 * 3) Store state + verifier in httpOnly cookies
 * 4) Redirect to Microsoft authorize endpoint
 *
 * Callback route must:
 *  - verify state cookie matches query state
 *  - exchange code with code_verifier
 *  - upsert into email_connections (provider="outlook")
 */

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function base64Url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sha256Base64Url(input: string) {
  return base64Url(crypto.createHash("sha256").update(input).digest());
}

function randomBase64Url(bytes = 32) {
  return base64Url(crypto.randomBytes(bytes));
}

function isProd() {
  return process.env.NODE_ENV === "production";
}

function safeReturnTo(req: NextRequest) {
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") || "/";

  // Only allow same-site relative paths to prevent open redirects
  if (!returnTo.startsWith("/")) return "/";
  if (returnTo.startsWith("//")) return "/";
  // optionally constrain further:
  // if (!returnTo.startsWith("/dashboard")) return "/dashboard";

  return returnTo;
}

export async function GET(req: NextRequest) {
  const siteUrl = mustEnv("NEXT_PUBLIC_SITE_URL").trim(); // e.g. https://advaic.com
  const clientId = mustEnv("OUTLOOK_CLIENT_ID").trim(); // Azure app client id
  const tenant =
    process.env.OUTLOOK_TENANT_ID && process.env.OUTLOOK_TENANT_ID.trim()
      ? process.env.OUTLOOK_TENANT_ID.trim()
      : "common";

  const returnTo = safeReturnTo(req);

  // PKCE
  const state = randomBase64Url(32);
  const codeVerifier = randomBase64Url(48); // 43-128 chars recommended
  const codeChallenge = sha256Base64Url(codeVerifier);

  const redirectUri = new URL("/api/auth/outlook/callback", siteUrl).toString();

  // Scopes:
  // - offline_access: refresh_token
  // - openid profile email: basic identity + email claim
  // - User.Read: often required for /me if email claim missing
  // - Mail.Read: fetch mail
  // - Mail.Send: send mail
  // IMPORTANT: You can start with less and expand later, but for your product these are typical.
  const defaultScope = [
    "offline_access",
    "openid",
    "profile",
    "email",
    "User.Read",
    "Mail.Read",
    "Mail.Send",
  ].join(" ");

  // Optional override (space-separated). Keep this aligned with your Azure app delegated permissions.
  const scope = (process.env.OUTLOOK_SCOPES && process.env.OUTLOOK_SCOPES.trim())
    ? process.env.OUTLOOK_SCOPES.trim()
    : defaultScope;

  const authorizeUrl = new URL(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
  );

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_mode", "query");
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);

  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  // prompt=select_account makes it nicer in multi-account setups
  authorizeUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authorizeUrl.toString());
  res.headers.set("Cache-Control", "no-store");

  // Cookies (httpOnly) for CSRF + PKCE
  // Keep TTL short (10 minutes)
  const maxAgeSeconds = 10 * 60;

  const cookieBase = {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };

  res.cookies.set("advaic_outlook_oauth_state", state, cookieBase);
  res.cookies.set("advaic_outlook_pkce_verifier", codeVerifier, cookieBase);

  // returnTo cookie (not strictly secret, but keep httpOnly to reduce tampering)
  res.cookies.set("advaic_outlook_return_to", returnTo, cookieBase);

  return res;
}
