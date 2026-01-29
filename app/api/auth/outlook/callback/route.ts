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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const returnToCookie = sanitizeReturnTo(
    req.cookies.get("advaic_outlook_return_to")?.value || null
  );

  // 0) Provider error -> redirect back with error, clear transient cookies
  if (error) {
    const redirectBase = mustEnv("NEXT_PUBLIC_SITE_URL");
    const target = returnToCookie || "/app/konto";
    const joiner = target.includes("?") ? "&" : "?";
    const res = NextResponse.redirect(
      new URL(
        `${target}${joiner}outlook=error&reason=${encodeURIComponent(
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

  // 6) Trigger subscription creation/renew via the dedicated internal route
  // Keep subscription logic centralized (idempotent + shared with renew cron).
  const siteUrl = mustEnv("NEXT_PUBLIC_SITE_URL");
  const pipelineSecret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET || "";

  // Best-effort trigger: connection is already stored. If this fails,
  // renew cron / manual retry can fix it.
  if (pipelineSecret) {
    const subUrl = new URL("/api/outlook/subscribe", siteUrl).toString();

    const subResp = await fetchJson(subUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-advaic-internal-secret": pipelineSecret,
      },
      body: JSON.stringify({ agentId }),
    });

    if (!subResp.ok) {
      console.error("[outlook/callback] subscribe trigger failed:", {
        status: subResp.status,
        json: subResp.json,
        text: subResp.text?.slice(0, 800),
      });

      // Fail-soft: keep connection usable, mark for renew/backfill.
      await (supabaseAdmin.from("email_connections") as any)
        .update({
          watch_active: false,
          needs_backfill: true,
          last_error: "subscribe_trigger_failed",
        })
        .eq("agent_id", agentId)
        .eq("provider", "outlook");
    }
  } else {
    // If secret missing, we can't trigger internally. Mark for renew/backfill.
    await (supabaseAdmin.from("email_connections") as any)
      .update({
        watch_active: false,
        needs_backfill: true,
        last_error: "missing_pipeline_secret",
      })
      .eq("agent_id", agentId)
      .eq("provider", "outlook");
  }

  // 7) Redirect back to UI and clear transient cookies
  const redirectBase = mustEnv("NEXT_PUBLIC_SITE_URL");
  const target = returnToCookie || "/app/konto?outlook=connected";

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