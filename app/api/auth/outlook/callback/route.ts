import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function cookieOpts(req: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
}

function sanitizeReturnTo(v: string | null) {
  // Allow ONLY relative paths to prevent open redirect
  if (!v) return null;
  const s = String(v).trim();
  if (!s.startsWith("/")) return null;
  if (s.startsWith("//")) return null;
  if (s.includes("\r") || s.includes("\n")) return null;
  return s.slice(0, 500);
}

async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, init).catch(() => null);
  if (!res) {
    return { ok: false as const, status: 0, json: null as any, text: "" };
  }
  const text = await res.text().catch(() => "");
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text };
}

function nowIso() {
  return new Date().toISOString();
}

function parseIso(v: any): Date | null {
  const s = typeof v === "string" ? v : "";
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function minutesFromNow(d: Date) {
  return (d.getTime() - Date.now()) / 1000 / 60;
}

async function upsertEmailConnection(
  supabaseAdmin: any,
  row: Record<string, any>
) {
  return await (supabaseAdmin.from("email_connections") as any).upsert(row, {
    onConflict: "agent_id,provider",
  });
}

type GraphSubscription = {
  id: string;
  resource: string;
  expirationDateTime: string;
};

async function createGraphSubscription(args: {
  accessToken: string;
  notificationUrl: string;
  clientState: string;
  resource: string;
}) {
  const resp = await fetchJson("https://graph.microsoft.com/v1.0/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      changeType: "created,updated",
      notificationUrl: args.notificationUrl,
      resource: args.resource,
      expirationDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 60min (safe default)
      clientState: args.clientState,
      latestSupportedTlsVersion: "v1_2",
    }),
  });

  if (!resp.ok) {
    console.error("[outlook/callback] subscription create failed:", {
      status: resp.status,
      json: resp.json,
      text: resp.text?.slice(0, 800),
    });
    return null;
  }

  const id = String(resp.json?.id || "");
  const expirationDateTime = String(resp.json?.expirationDateTime || "");
  const resource = String(resp.json?.resource || "");
  if (!id || !expirationDateTime) return null;
  return { id, expirationDateTime, resource } as GraphSubscription;
}

async function renewGraphSubscription(args: {
  accessToken: string;
  subscriptionId: string;
}) {
  // Extend by +60min (safe default)
  const newExp = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const url = `https://graph.microsoft.com/v1.0/subscriptions/${encodeURIComponent(
    args.subscriptionId
  )}`;

  const resp = await fetchJson(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expirationDateTime: newExp }),
  });

  if (!resp.ok) {
    console.error("[outlook/callback] subscription renew failed:", {
      status: resp.status,
      json: resp.json,
      text: resp.text?.slice(0, 800),
    });
    return null;
  }

  const expirationDateTime = String(resp.json?.expirationDateTime || newExp);
  return {
    id: String(resp.json?.id || args.subscriptionId),
    expirationDateTime,
    resource: String(resp.json?.resource || ""),
  } as GraphSubscription;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // 0) Provider error -> redirect back with error, clear transient cookies
  if (error) {
    const redirectBase = mustEnv("NEXT_PUBLIC_SITE_URL");
    const res = NextResponse.redirect(
      new URL(
        `/konto?outlook=error&reason=${encodeURIComponent(
          String(error).slice(0, 200)
        )}`,
        redirectBase
      )
    );

    res.cookies.set({
      name: "advaic_outlook_oauth_state",
      value: "",
      ...cookieOpts(req),
      maxAge: 0,
    });
    res.cookies.set({
      name: "advaic_outlook_pkce_verifier",
      value: "",
      ...cookieOpts(req),
      maxAge: 0,
    });
    res.cookies.set({
      name: "advaic_outlook_return_to",
      value: "",
      ...cookieOpts(req),
      maxAge: 0,
    });

    console.error("[outlook/callback] OAuth error:", error, errorDescription);
    return res;
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code/state" }, { status: 400 });
  }

  // 1) Validate CSRF state + PKCE verifier + returnTo
  const stateCookie =
    req.cookies.get("advaic_outlook_oauth_state")?.value || "";
  const verifierCookie =
    req.cookies.get("advaic_outlook_pkce_verifier")?.value || "";
  const returnToCookie = sanitizeReturnTo(
    req.cookies.get("advaic_outlook_return_to")?.value || null
  );

  if (!stateCookie || stateCookie !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  if (!verifierCookie) {
    return NextResponse.json(
      { error: "Missing PKCE verifier" },
      { status: 400 }
    );
  }

  // 2) Authenticated agent (cookie-based)
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
    error: userErr,
  } = await supabaseAuth.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = String(user.id);

  // 3) Exchange code for tokens
  const tenant = process.env.OUTLOOK_TENANT_ID || "common";
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(
    tenant
  )}/oauth2/v2.0/token`;

  const redirectUri = new URL(
    "/api/auth/outlook/callback",
    mustEnv("NEXT_PUBLIC_SITE_URL")
  ).toString();

  const tokenBody = new URLSearchParams();
  tokenBody.set("client_id", mustEnv("OUTLOOK_CLIENT_ID"));
  if (process.env.OUTLOOK_CLIENT_SECRET) {
    tokenBody.set("client_secret", process.env.OUTLOOK_CLIENT_SECRET);
  }
  tokenBody.set("grant_type", "authorization_code");
  tokenBody.set("code", code);
  tokenBody.set("redirect_uri", redirectUri);
  tokenBody.set("code_verifier", verifierCookie);

  const tokenResp = await fetchJson(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });

  if (!tokenResp.ok) {
    console.error("[outlook/callback] Token exchange failed:", {
      status: tokenResp.status,
      json: tokenResp.json,
      text: tokenResp.text?.slice(0, 800),
    });
    return NextResponse.json({ error: "Token exchange failed" }, { status: 502 });
  }

  const accessToken = String(tokenResp.json?.access_token || "");
  const refreshToken = String(tokenResp.json?.refresh_token || "");
  const expiresIn = Number(tokenResp.json?.expires_in || 0);

  if (!accessToken || !refreshToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    console.error("[outlook/callback] Token response incomplete:", tokenResp.json);
    return NextResponse.json(
      { error: "Token response incomplete" },
      { status: 502 }
    );
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  // 4) Determine mailbox identity (Graph /me)
  const meResp = await fetchJson(
    "https://graph.microsoft.com/v1.0/me?$select=id,mail,userPrincipalName",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const outlookMailboxId = meResp.ok ? String(meResp.json?.id || "").trim() : "";
  const emailAddress = meResp.ok
    ? String(meResp.json?.mail || meResp.json?.userPrincipalName || "").trim()
    : "";

  // 5) Store connection in Supabase (service role)
  const supabaseAdmin = createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const baseRow: Record<string, any> = {
    agent_id: agentId,
    provider: "outlook",
    email_address: emailAddress || null,
    status: "connected",
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    last_error: null,
    outlook_mailbox_id: outlookMailboxId || null,
    // Webhook/Sync flags
    watch_active: false,
    needs_backfill: true,
  };

  const upsertRes = await upsertEmailConnection(supabaseAdmin, baseRow);

  if (upsertRes?.error) {
    console.error("[outlook/callback] Supabase upsert failed:", upsertRes.error);
    return NextResponse.json(
      { error: "Failed to store connection" },
      { status: 500 }
    );
  }

  // 6) Ensure subscription exists (create/renew)
  // We store: outlook_subscription_id + outlook_subscription_expiration + watch_topic (resource marker)
  const notificationUrl = new URL(
    "/api/outlook/webhook",
    mustEnv("NEXT_PUBLIC_SITE_URL")
  ).toString();

  const clientState = mustEnv("OUTLOOK_WEBHOOK_CLIENT_STATE");

  // Default: Inbox only (safer, less noise)
  const resource = "me/mailFolders('Inbox')/messages";

  const { data: existingConn } = await (supabaseAdmin.from("email_connections") as any)
    .select("outlook_subscription_id, outlook_subscription_expiration, watch_topic")
    .eq("agent_id", agentId)
    .eq("provider", "outlook")
    .maybeSingle();

  let sub: GraphSubscription | null = null;

  const existingId = String(existingConn?.outlook_subscription_id || "").trim();
  const existingExp = parseIso(existingConn?.outlook_subscription_expiration);

  // If subscription exists and is still healthy (>20min left), keep it.
  if (existingId && existingExp && minutesFromNow(existingExp) > 20) {
    sub = {
      id: existingId,
      expirationDateTime: existingExp.toISOString(),
      resource: String(existingConn?.watch_topic || resource),
    };
  } else if (existingId) {
    // Try renew first (best effort)
    sub = await renewGraphSubscription({ accessToken, subscriptionId: existingId });
  }

  if (!sub) {
    sub = await createGraphSubscription({
      accessToken,
      notificationUrl,
      clientState,
      resource,
    });
  }

  if (sub) {
    await (supabaseAdmin.from("email_connections") as any)
      .update({
        outlook_subscription_id: sub.id,
        outlook_subscription_expiration: sub.expirationDateTime,
        watch_active: true,
        watch_topic: sub.resource || resource,
        watch_last_renewed_at: nowIso(),
        last_error: null,
        needs_backfill: true,
      })
      .eq("agent_id", agentId)
      .eq("provider", "outlook");
  } else {
    // Fail-soft: connection is stored; webhook can be created later by cron/manual
    await (supabaseAdmin.from("email_connections") as any)
      .update({
        watch_active: false,
        last_error: "subscription_create_failed",
        needs_backfill: true,
      })
      .eq("agent_id", agentId)
      .eq("provider", "outlook");
  }

  // 7) Redirect back to UI and clear transient cookies
  const redirectBase = mustEnv("NEXT_PUBLIC_SITE_URL");
  const target = returnToCookie || "/konto?outlook=connected";

  const res = NextResponse.redirect(new URL(target, redirectBase));

  res.cookies.set({
    name: "advaic_outlook_oauth_state",
    value: "",
    ...cookieOpts(req),
    maxAge: 0,
  });
  res.cookies.set({
    name: "advaic_outlook_pkce_verifier",
    value: "",
    ...cookieOpts(req),
    maxAge: 0,
  });
  res.cookies.set({
    name: "advaic_outlook_return_to",
    value: "",
    ...cookieOpts(req),
    maxAge: 0,
  });

  return res;
}