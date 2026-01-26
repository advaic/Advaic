import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function isInternal(req: NextRequest) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-advaic-internal-secret");
  return !!got && got === secret;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function nowIso() {
  return new Date().toISOString();
}

function addHoursIso(hours: number) {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  return d.toISOString();
}

function toDate(x: any): Date | null {
  const d = new Date(String(x || ""));
  return Number.isFinite(d.getTime()) ? d : null;
}

function isExpiringSoon(exp: Date | null, withinHours: number) {
  if (!exp) return true;
  const ms = exp.getTime() - Date.now();
  return ms <= withinHours * 60 * 60 * 1000;
}

type OutlookTokenResponse = {
  token_type?: string;
  scope?: string;
  expires_in?: number;
  ext_expires_in?: number;
  access_token?: string;
  refresh_token?: string;
};

async function refreshOutlookAccessToken(args: {
  refreshToken: string;
}): Promise<
  | {
      ok: true;
      accessToken: string;
      refreshToken?: string;
      expiresAtIso: string;
    }
  | { ok: false; error: string }
> {
  const clientId = mustEnv("MICROSOFT_CLIENT_ID");
  const clientSecret = mustEnv("MICROSOFT_CLIENT_SECRET");
  const tenant = process.env.MICROSOFT_TENANT_ID || "common";
  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", args.refreshToken);
  // Important: request Graph scopes again (must match what you requested in auth)
  // Keep as broad as your app needs. These are typical for reading mail + webhooks.
  form.set(
    "scope",
    "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access"
  );

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  }).catch(() => null);

  if (!res || !res.ok) {
    const t = await res?.text().catch(() => "");
    return {
      ok: false,
      error: `token_refresh_failed:${res?.status ?? "no_res"}:${t.slice(
        0,
        300
      )}`,
    };
  }

  const data = (await res
    .json()
    .catch(() => null)) as OutlookTokenResponse | null;
  const accessToken = data?.access_token;
  if (!accessToken)
    return { ok: false, error: "token_refresh_no_access_token" };

  const expiresIn = Number(data?.expires_in ?? 3600);
  const expiresAtIso = new Date(
    Date.now() + Math.max(300, expiresIn - 60) * 1000
  ).toISOString();

  return {
    ok: true,
    accessToken,
    refreshToken: data?.refresh_token,
    expiresAtIso,
  };
}

async function getValidOutlookAccessToken(supabase: any, conn: any) {
  const accessToken =
    typeof conn?.access_token === "string" ? conn.access_token : "";
  const refreshToken =
    typeof conn?.refresh_token === "string" ? conn.refresh_token : "";
  const expiresAt = toDate(conn?.expires_at);

  // If we have a token that’s valid for at least 2 minutes, keep it.
  if (
    accessToken &&
    expiresAt &&
    expiresAt.getTime() - Date.now() > 2 * 60 * 1000
  ) {
    return { ok: true as const, accessToken };
  }

  if (!refreshToken) {
    return { ok: false as const, error: "missing_refresh_token" };
  }

  const refreshed = await refreshOutlookAccessToken({ refreshToken });
  if (refreshed.ok === false) {
    return { ok: false as const, error: refreshed.error };
  }

  // Persist new tokens
  try {
    await (supabase.from("email_connections") as any)
      .update({
        access_token: refreshed.accessToken,
        refresh_token: refreshed.refreshToken ?? refreshToken,
        expires_at: refreshed.expiresAtIso,
        last_error: null,
        updated_at: nowIso(),
      })
      .eq("id", conn.id);
  } catch {
    // ignore – we can still use the new access token for this run
  }

  return { ok: true as const, accessToken: refreshed.accessToken };
}

async function graphPatchSubscription(args: {
  accessToken: string;
  subscriptionId: string;
  newExpirationIso: string;
}) {
  const url = `https://graph.microsoft.com/v1.0/subscriptions/${encodeURIComponent(
    args.subscriptionId
  )}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expirationDateTime: args.newExpirationIso }),
  }).catch(() => null);

  if (!res) return { ok: false as const, status: 0, error: "network_error" };

  // Graph returns 200 with updated subscription
  if (res.ok) {
    const data = await res.json().catch(() => ({} as any));
    return { ok: true as const, data };
  }

  const txt = await res.text().catch(() => "");
  return {
    ok: false as const,
    status: res.status,
    error: `graph_patch_failed:${res.status}:${txt.slice(0, 300)}`,
  };
}

export async function POST(req: NextRequest) {
  // This is an internal pipeline route (cron / server-to-server)
  if (!isInternal(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  // Strategy:
  // - Renew only subscriptions that are expiring soon (<= 24h) or missing expiration.
  // - If Graph says subscription is gone (404/410), mark watch inactive and require backfill.
  // - Keep it idempotent: safe to run multiple times per day.

  const RENEW_WITHIN_HOURS = 24;
  // Outlook/Graph message subscriptions typically allow up to ~3 days.
  // We renew to +48h to stay comfortably inside limits.
  const TARGET_EXPIRATION_HOURS = 48;

  const { data: conns, error } = await (
    supabase.from("email_connections") as any
  )
    .select(
      "id, agent_id, provider, status, watch_active, watch_topic, last_error, access_token, refresh_token, expires_at, outlook_subscription_id, outlook_subscription_expiration"
    )
    .eq("provider", "outlook")
    .eq("watch_active", true)
    .not("outlook_subscription_id", "is", null)
    .order("outlook_subscription_expiration", {
      ascending: true,
      nullsFirst: true,
    })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load outlook connections", details: error.message },
      { status: 500 }
    );
  }

  const results: any[] = [];

  for (const conn of conns || []) {
    const id = String(conn.id);
    const agentId = String(conn.agent_id || "");
    const subId = String(conn.outlook_subscription_id || "");

    if (!agentId || !subId) {
      results.push({ id, agentId, subId, status: "skipped_missing_ids" });
      continue;
    }

    const expDate = toDate(conn.outlook_subscription_expiration);
    if (!isExpiringSoon(expDate, RENEW_WITHIN_HOURS)) {
      results.push({ id, agentId, subId, status: "skipped_not_expiring" });
      continue;
    }

    const token = await getValidOutlookAccessToken(supabase, conn);

    // Use an explicit comparison so TS narrows the union correctly.
    if (token.ok === false) {
      await (supabase.from("email_connections") as any)
        .update({
          last_error: `renew_token_error:${token.error}`.slice(0, 5000),
          watch_active: false,
          needs_backfill: true,
          outlook_subscription_expiration: null,
          watch_last_renewed_at: nowIso(),
        })
        .eq("id", conn.id);

      results.push({
        id,
        agentId,
        subId,
        status: "failed_token",
        error: token.error,
      });
      continue;
    }

    const newExpIso = addHoursIso(TARGET_EXPIRATION_HOURS);
    const patched = await graphPatchSubscription({
      accessToken: token.accessToken,
      subscriptionId: subId,
      newExpirationIso: newExpIso,
    });

    if (patched.ok) {
      const gotExp = patched.data?.expirationDateTime;
      const finalExpIso =
        typeof gotExp === "string" && gotExp ? gotExp : newExpIso;

      await (supabase.from("email_connections") as any)
        .update({
          outlook_subscription_expiration: finalExpIso,
          watch_active: true,
          last_error: null,
          watch_last_renewed_at: nowIso(),
          // keep needs_backfill as-is; renewal does not imply we’re fully in sync
        })
        .eq("id", conn.id);

      results.push({
        id,
        agentId,
        subId,
        status: "renewed",
        expiration: finalExpIso,
      });
      continue;
    }

    // If subscription no longer exists
    const gone = patched.status === 404 || patched.status === 410;

    await (supabase.from("email_connections") as any)
      .update({
        last_error: patched.error.slice(0, 5000),
        watch_active: false,
        needs_backfill: true,
        outlook_subscription_id: gone ? null : conn.outlook_subscription_id,
        outlook_subscription_expiration: null,
        watch_last_renewed_at: nowIso(),
      })
      .eq("id", conn.id);

    results.push({
      id,
      agentId,
      subId,
      status: gone ? "subscription_gone" : "renew_failed",
      error: patched.error,
      httpStatus: patched.status,
    });
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}
