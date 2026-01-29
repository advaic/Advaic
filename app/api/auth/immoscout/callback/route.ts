import { NextRequest, NextResponse } from "next/server";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getImmoScoutEnv() {
  const env = (process.env.IMMOSCOUT_ENV || "sandbox").toLowerCase();
  if (env === "prod") {
    return {
      env: "prod",
      baseUrl: mustEnv("IMMOSCOUT_BASE_URL_PROD"),
      consumerKey: mustEnv("IMMOSCOUT_CONSUMER_KEY_PROD"),
      consumerSecret: mustEnv("IMMOSCOUT_CONSUMER_SECRET_PROD"),
    };
  }
  return {
    env: "sandbox",
    baseUrl: mustEnv("IMMOSCOUT_BASE_URL"),
    consumerKey: mustEnv("IMMOSCOUT_CONSUMER_KEY"),
    consumerSecret: mustEnv("IMMOSCOUT_CONSUMER_SECRET"),
  };
}

function oauthClient(consumerKey: string, consumerSecret: string) {
  return new OAuth({
    consumer: { key: consumerKey, secret: consumerSecret },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });
}

function parseOAuthResponse(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const out: Record<string, string> = {};
  params.forEach((v, k) => (out[k] = v));
  return out;
}

const IMMOSCOUT_RETURN_TO_COOKIE = "advaic_immoscout_return_to";

function safeReturnTo(v: string | null | undefined): string {
  const s = String(v ?? "").trim();
  if (!s) return "/app/konto/verknuepfungen";

  // only allow internal paths
  if (!s.startsWith("/")) return "/app/konto/verknuepfungen";

  // allowlist prefixes (avoid open redirects)
  const ok = s.startsWith("/app/") || s.startsWith("/onboarding") || s.startsWith("/app/onboarding");
  if (!ok) return "/app/konto/verknuepfungen";

  // very defensive: strip protocol-like patterns
  if (s.startsWith("//")) return "/app/konto/verknuepfungen";

  return s;
}

function redirectWithCookieClear(req: NextRequest, nextPath: string) {
  const url = new URL(nextPath, req.url);
  const res = NextResponse.redirect(url);
  res.cookies.set({ name: IMMOSCOUT_RETURN_TO_COOKIE, value: "", path: "/", maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const oauthToken = url.searchParams.get("oauth_token");
  const oauthVerifier = url.searchParams.get("oauth_verifier");

  // cookie auth
  const supabaseAuth = createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) return redirectWithCookieClear(req, "/login");

  // NOTE: We intentionally type this client as `any` so we can access tables
  // that may not yet exist in `types/supabase.ts` without TS inferring `never`.
  const supabaseAdmin = createClient<any>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const returnToCookie = req.cookies.get(IMMOSCOUT_RETURN_TO_COOKIE)?.value;
  const returnTo = safeReturnTo(returnToCookie);
  const next = new URL(returnTo, req.url);

  if (!oauthToken || !oauthVerifier) {
    next.searchParams.set("immoscout", "error");
    next.searchParams.set("reason", "missing_oauth_params");
    return redirectWithCookieClear(req, next.toString());
  }

  // Load pending request token secret from DB
  const { data: conn } = await (
    supabaseAdmin.from("immoscout_connections") as any
  )
    .select("request_token, request_token_secret, environment")
    .eq("agent_id", user.id)
    .maybeSingle();

  if (
    !conn?.request_token_secret ||
    String(conn.request_token || "") !== String(oauthToken)
  ) {
    next.searchParams.set("immoscout", "error");
    next.searchParams.set("reason", "no_pending_request_token");
    return redirectWithCookieClear(req, next.toString());
  }

  const { env, baseUrl, consumerKey, consumerSecret } = getImmoScoutEnv();
  const accessTokenUrl = `${baseUrl}/restapi/security/oauth/access_token`; // per docs  [oai_citation:3‡api.immobilienscout24.de](https://api.immobilienscout24.de/api-docs/authentication/three-legged/)

  const oauth = oauthClient(consumerKey, consumerSecret);

  const token = {
    key: oauthToken,
    secret: String(conn.request_token_secret),
  };

  const requestData = {
    url: accessTokenUrl,
    method: "POST",
    data: { oauth_verifier: oauthVerifier },
  };

  const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

  const resp = await fetch(accessTokenUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader.Authorization,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ oauth_verifier: oauthVerifier }).toString(),
  });

  const txt = await resp.text();

  if (!resp.ok) {
    await supabaseAdmin
      .from("immoscout_connections")
      .update({
        status: "error",
        last_error: `access_token_failed: ${resp.status} ${txt}`.slice(0, 800),
        updated_at: new Date().toISOString(),
      })
      .eq("agent_id", user.id);

    next.searchParams.set("immoscout", "error");
    next.searchParams.set("reason", "access_token_failed");
    return redirectWithCookieClear(req, next.toString());
  }

  const parsed = parseOAuthResponse(txt);
  const accessToken = parsed["oauth_token"];
  const accessTokenSecret = parsed["oauth_token_secret"];

  if (!accessToken || !accessTokenSecret) {
    next.searchParams.set("immoscout", "error");
    next.searchParams.set("reason", "missing_access_token");
    return redirectWithCookieClear(req, next.toString());
  }

  await supabaseAdmin
    .from("immoscout_connections")
    .update({
      environment: env,
      status: "connected",
      access_token: accessToken,
      access_token_secret: accessTokenSecret,
      access_token_created_at: new Date().toISOString(),
      // clear request token
      request_token: null,
      request_token_secret: null,
      request_token_created_at: null,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("agent_id", user.id);

  next.searchParams.set("immoscout", "connected");
  return redirectWithCookieClear(req, next.toString());
}
