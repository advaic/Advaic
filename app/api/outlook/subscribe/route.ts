// app/api/outlook/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import crypto from "crypto";

export const runtime = "nodejs";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function isInternal(req: NextRequest) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-advaic-internal-secret");
  return !!got && got === secret;
}

function nowIso() {
  return new Date().toISOString();
}

function safeString(x: unknown, max = 5000) {
  return String(x ?? "").slice(0, max);
}

function tokenIsValid(expiresAtIso: string | null) {
  if (!expiresAtIso) return false;
  const t = Date.parse(expiresAtIso);
  if (!Number.isFinite(t)) return false;
  // refresh early (2 minutes)
  return t - Date.now() > 2 * 60 * 1000;
}

async function refreshOutlookAccessToken(args: { refreshToken: string }) {
  const clientId =
    process.env.OUTLOOK_CLIENT_ID ||
    process.env.MICROSOFT_CLIENT_ID ||
    process.env.AZURE_AD_CLIENT_ID;

  const clientSecret =
    process.env.OUTLOOK_CLIENT_SECRET ||
    process.env.MICROSOFT_CLIENT_SECRET ||
    process.env.AZURE_AD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing OUTLOOK_CLIENT_ID / OUTLOOK_CLIENT_SECRET env vars"
    );
  }

  const tenant =
    process.env.OUTLOOK_TENANT_ID ||
    process.env.MICROSOFT_TENANT_ID ||
    process.env.AZURE_AD_TENANT_ID ||
    "common";

  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", args.refreshToken);

  // Refresh token calls must use a scope compatible with what the user consented.
  // Allow override via env to avoid tenant-specific issues.
  body.set(
    "scope",
    process.env.OUTLOOK_REFRESH_SCOPE || "https://graph.microsoft.com/.default"
  );

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }).catch(() => null);

  if (!resp || !resp.ok) {
    const t = await resp?.text().catch(() => "");
    throw new Error(`Outlook token refresh failed: ${resp?.status} ${t}`);
  }

  const json = (await resp.json().catch(() => null)) as any;

  const accessToken =
    typeof json?.access_token === "string" ? json.access_token : "";
  const refreshToken =
    typeof json?.refresh_token === "string" ? json.refresh_token : null;
  const expiresIn = Number(json?.expires_in);

  if (!accessToken || !Number.isFinite(expiresIn)) {
    throw new Error("Outlook token refresh returned invalid payload");
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return { accessToken, refreshToken, expiresAt };
}

async function graphPost(url: string, accessToken: string, body: any) {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!resp) throw new Error("Graph POST failed (network)");
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Graph POST failed: ${resp.status} ${t}`);
  }

  return (await resp.json().catch(() => null)) as any;
}

async function graphPatch(url: string, accessToken: string, body: any) {
  const resp = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!resp) throw new Error("Graph PATCH failed (network)");
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Graph PATCH failed: ${resp.status} ${t}`);
  }

  // PATCH returns updated subscription object
  return (await resp.json().catch(() => null)) as any;
}

function addMinutesIso(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function genClientState() {
  return crypto.randomBytes(16).toString("hex");
}

// Outlook subscription lifetimes are limited (often ~2–3 days).
// We renew frequently; for creation we pick a safe shorter TTL.
function computeExpirationIso() {
  // 2 days minus buffer is a common safe default
  // (Even if Graph allows longer for your tenant, renewing is cheap.)
  return addMinutesIso(60 * 24 * 2 - 60); // 2 days - 1 hour
}

type Body = {
  agentId?: string;
};

export async function POST(req: NextRequest) {
  if (!isInternal(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = supabaseAdmin();

  const body = (await req.json().catch(() => null)) as Body | null;
  const agentId = String(body?.agentId || "").trim();

  if (!agentId) {
    return NextResponse.json({ error: "Missing agentId" }, { status: 400 });
  }

  const siteUrl = mustEnv("NEXT_PUBLIC_SITE_URL");
  const notificationUrl = new URL("/api/outlook/webhook", siteUrl).toString();

  // Load connection
  const { data: conn, error: connErr } = await (
    supabase.from("email_connections") as any
  )
    .select(
      "id, agent_id, provider, status, email_address, access_token, refresh_token, expires_at, outlook_subscription_id, outlook_subscription_expiration, watch_topic"
    )
    .eq("agent_id", agentId)
    .eq("provider", "outlook")
    .in("status", ["connected", "active"])
    .maybeSingle();

  if (connErr) {
    return NextResponse.json(
      { error: "Failed to load email connection", details: connErr.message },
      { status: 500 }
    );
  }

  if (!conn?.id) {
    return NextResponse.json(
      { error: "Outlook connection not found / not connected" },
      { status: 404 }
    );
  }

  const connId = conn.id;

  let accessToken: string | null = conn.access_token || null;
  let refreshToken: string | null = conn.refresh_token || null;
  let expiresAt: string | null = conn.expires_at || null;

  try {
    if (!refreshToken) {
      await (supabase.from("email_connections") as any)
        .update({
          last_error: "missing_refresh_token",
          watch_active: false,
        })
        .eq("id", connId);

      return NextResponse.json(
        { error: "Missing refresh_token on outlook connection" },
        { status: 400 }
      );
    }

    if (!accessToken || !tokenIsValid(expiresAt)) {
      const refreshed = await refreshOutlookAccessToken({
        refreshToken,
      });
      accessToken = refreshed.accessToken;
      expiresAt = refreshed.expiresAt;
      if (refreshed.refreshToken) refreshToken = refreshed.refreshToken;

      await (supabase.from("email_connections") as any)
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          last_error: null,
        })
        .eq("id", connId);
    }

    const desiredExpiration = computeExpirationIso();

    // Ensure we have a stable clientState (store in watch_topic)
    const clientState =
      typeof conn.watch_topic === "string" && conn.watch_topic.trim()
        ? conn.watch_topic.trim()
        : genClientState();

    // 1) Try renew existing subscription if it exists and not too close to expiration
    const existingSubId =
      typeof conn.outlook_subscription_id === "string"
        ? conn.outlook_subscription_id.trim()
        : "";

    const existingExp =
      typeof conn.outlook_subscription_expiration === "string"
        ? conn.outlook_subscription_expiration
        : null;

    const expMs = existingExp ? Date.parse(existingExp) : NaN;
    const shouldRenew =
      !!existingSubId &&
      (!Number.isFinite(expMs) || expMs - Date.now() < 24 * 60 * 60 * 1000); // renew if missing/invalid exp or < 24h remaining

    if (existingSubId && shouldRenew) {
      const updated = await graphPatch(
        `https://graph.microsoft.com/v1.0/subscriptions/${encodeURIComponent(
          existingSubId
        )}`,
        accessToken!,
        { expirationDateTime: desiredExpiration }
      );

      const newExp =
        safeString(updated?.expirationDateTime, 64) || desiredExpiration;

      await (supabase.from("email_connections") as any)
        .update({
          outlook_subscription_id: existingSubId,
          outlook_subscription_expiration: newExp,
          watch_expiration: newExp,
          watch_active: true,
          watch_topic: clientState,
          watch_last_renewed_at: nowIso(),
          last_error: null,
        })
        .eq("id", connId);

      return NextResponse.json({
        ok: true,
        action: "renewed",
        connection_id: connId,
        outlook_subscription_id: existingSubId,
        outlook_subscription_expiration: newExp,
      });
    }

    // 2) If no subscription or not renewable, create a new one (safe path)
    const created = await graphPost(
      "https://graph.microsoft.com/v1.0/subscriptions",
      accessToken!,
      {
        changeType: "created,updated",
        notificationUrl,
        // For mailbox events, Graph typically supports this resource:
        // IMPORTANT: This is per-user /me subscription (works with delegated token).
        resource: "/me/mailFolders('Inbox')/messages",
        expirationDateTime: desiredExpiration,
        clientState,
        latestSupportedTlsVersion: "v1_2",
      }
    );

    const subId = safeString(created?.id, 200).trim();
    const subExp =
      safeString(created?.expirationDateTime, 64) || desiredExpiration;

    if (!subId) {
      throw new Error("Graph subscription create returned no id");
    }

    await (supabase.from("email_connections") as any)
      .update({
        outlook_subscription_id: subId,
        outlook_subscription_expiration: subExp,
        watch_expiration: subExp,
        watch_active: true,
        watch_topic: clientState, // used as clientState for webhook validation
        watch_last_renewed_at: nowIso(),
        last_error: null,
      })
      .eq("id", connId);

    return NextResponse.json({
      ok: true,
      action: "created",
      connection_id: connId,
      outlook_subscription_id: subId,
      outlook_subscription_expiration: subExp,
      notificationUrl,
    });
  } catch (e: any) {
    const msg = safeString(e?.message || e, 5000);

    await (supabase.from("email_connections") as any)
      .update({
        last_error: msg,
        watch_active: false,
      })
      .eq("id", connId);

    return NextResponse.json(
      { error: "Outlook subscribe failed", details: msg },
      { status: 500 }
    );
  }
}
