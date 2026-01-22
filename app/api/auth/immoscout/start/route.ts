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
  const siteUrl = mustEnv("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
  const callbackUrl = `${siteUrl}/api/auth/immoscout/callback`;

  if (env === "prod") {
    return {
      env: "prod",
      baseUrl: mustEnv("IMMOSCOUT_BASE_URL_PROD"),
      consumerKey: mustEnv("IMMOSCOUT_CONSUMER_KEY_PROD"),
      consumerSecret: mustEnv("IMMOSCOUT_CONSUMER_SECRET_PROD"),
      callbackUrl,
    };
  }

  return {
    env: "sandbox",
    baseUrl: mustEnv("IMMOSCOUT_BASE_URL"),
    consumerKey: mustEnv("IMMOSCOUT_CONSUMER_KEY"),
    consumerSecret: mustEnv("IMMOSCOUT_CONSUMER_SECRET"),
    callbackUrl,
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
  // response is application/x-www-form-urlencoded style
  const params = new URLSearchParams(body);
  const out: Record<string, string> = {};
  params.forEach((v, k) => (out[k] = v));
  return out;
}

export async function GET(req: NextRequest) {
  // 1) cookie auth
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
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  // 2) admin client (write tokens)
  const supabaseAdmin = createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { env, baseUrl, consumerKey, consumerSecret, callbackUrl } =
    getImmoScoutEnv();

  // ImmoScout endpoints (3-legged OAuth)
  // request_token + confirm_access + access_token per ImmoScout docs  [oai_citation:2‡api.immobilienscout24.de](https://api.immobilienscout24.de/api-docs/authentication/three-legged/)
  const requestTokenUrl = `${baseUrl}/restapi/security/oauth/request_token`;
  const confirmAccessUrl = `${baseUrl}/restapi/security/oauth/confirm_access`;

  const oauth = oauthClient(consumerKey, consumerSecret);

  const requestData = {
    url: requestTokenUrl,
    method: "POST",
    data: {
      oauth_callback: callbackUrl,
    },
  };

  const authHeader = oauth.toHeader(oauth.authorize(requestData));

  const resp = await fetch(requestTokenUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader.Authorization,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ oauth_callback: callbackUrl }).toString(),
  });

  const txt = await resp.text();

  if (!resp.ok) {
    await supabaseAdmin.from("immoscout_connections").upsert(
      {
        agent_id: user.id,
        environment: env,
        status: "error",
        last_error: `request_token_failed: ${resp.status} ${txt}`.slice(0, 800),
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "agent_id" }
    );

    const next = new URL("/app/konto/verknuepfungen", req.url);
    next.searchParams.set("immoscout", "error");
    next.searchParams.set("reason", "request_token_failed");
    return NextResponse.redirect(next);
  }

  const parsed = parseOAuthResponse(txt);
  const oauthToken = parsed["oauth_token"];
  const oauthTokenSecret = parsed["oauth_token_secret"];

  if (!oauthToken || !oauthTokenSecret) {
    const next = new URL("/app/konto/verknuepfungen", req.url);
    next.searchParams.set("immoscout", "error");
    next.searchParams.set("reason", "missing_request_token");
    return NextResponse.redirect(next);
  }

  await supabaseAdmin.from("immoscout_connections").upsert(
    {
      agent_id: user.id,
      environment: env,
      status: "pending",
      request_token: oauthToken,
      request_token_secret: oauthTokenSecret,
      request_token_created_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    } as any,
    { onConflict: "agent_id" }
  );

  // Redirect user to ImmoScout confirmation screen
  const redirectUrl = `${confirmAccessUrl}?oauth_token=${encodeURIComponent(
    oauthToken
  )}`;
  return NextResponse.redirect(redirectUrl);
}
