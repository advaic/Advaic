import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import crypto from "crypto";
import {
  decryptSecretFromStorage,
  encryptSecretForStorage,
} from "@/lib/security/secrets";
import { logPipelineRun } from "@/lib/ops/pipeline-runs";

export const runtime = "nodejs";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET || "";
  const internalSecret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET || "";

  const auth = req.headers.get("authorization") || "";
  const bearerToken = auth.startsWith("Bearer ")
    ? auth.slice("Bearer ".length)
    : "";
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("secret") || "";
  const headerInternal = req.headers.get("x-advaic-internal-secret") || "";

  const headerOk =
    (!!bearerToken &&
      (bearerToken === cronSecret || bearerToken === internalSecret)) ||
    (!!headerInternal && headerInternal === internalSecret);
  const queryOk =
    !!queryToken &&
    (queryToken === cronSecret || queryToken === internalSecret);

  return headerOk || queryOk;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function nowIso() {
  return new Date().toISOString();
}

function addHoursIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
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

function isValidHttpsOrLocalhost(urlValue: string) {
  try {
    const u = new URL(urlValue);
    if (u.protocol === "https:") return true;
    return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

function safeClientState(v: unknown) {
  const s = String(v || "").trim();
  return s ? s.slice(0, 128) : "";
}

function randomClientState() {
  return crypto.randomBytes(16).toString("hex");
}

function safeErrorMessage(error: unknown, max = 5000) {
  return String((error as any)?.message || error || "unknown_error").slice(0, max);
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
    throw new Error("missing_outlook_client_env");
  }

  const tenant =
    process.env.OUTLOOK_TENANT_ID ||
    process.env.MICROSOFT_TENANT_ID ||
    process.env.AZURE_AD_TENANT_ID ||
    "common";

  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  form.set("grant_type", "refresh_token");
  form.set("refresh_token", args.refreshToken);
  form.set(
    "scope",
    process.env.OUTLOOK_REFRESH_SCOPE ||
      "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access",
  );

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  }).catch(() => null);
  if (!res || !res.ok) {
    const t = await res?.text().catch(() => "");
    throw new Error(`token_refresh_failed:${res?.status ?? 0}:${t.slice(0, 220)}`);
  }

  const json = (await res.json().catch(() => null)) as any;
  const accessToken = typeof json?.access_token === "string" ? json.access_token : "";
  const refreshToken = typeof json?.refresh_token === "string" ? json.refresh_token : null;
  const expiresIn = Number(json?.expires_in);
  if (!accessToken || !Number.isFinite(expiresIn)) {
    throw new Error("token_refresh_invalid_payload");
  }

  const expiresAtIso = new Date(Date.now() + Math.max(300, expiresIn - 60) * 1000).toISOString();
  return {
    accessToken,
    refreshToken,
    expiresAtIso,
  };
}

async function getValidOutlookAccessToken(supabase: any, conn: any) {
  const currentAccessToken =
    decryptSecretFromStorage(conn?.access_token || "");
  const currentRefreshToken =
    decryptSecretFromStorage(conn?.refresh_token || "");
  const currentExpiresAt = toDate(conn?.expires_at);

  if (
    currentAccessToken &&
    currentExpiresAt &&
    currentExpiresAt.getTime() - Date.now() > 2 * 60 * 1000
  ) {
    return { ok: true as const, accessToken: currentAccessToken };
  }

  if (!currentRefreshToken) {
    return { ok: false as const, error: "missing_refresh_token" };
  }

  try {
    const refreshed = await refreshOutlookAccessToken({
      refreshToken: currentRefreshToken,
    });

    await (supabase.from("email_connections") as any)
      .update({
        access_token: encryptSecretForStorage(refreshed.accessToken),
        refresh_token: encryptSecretForStorage(
          refreshed.refreshToken || currentRefreshToken,
        ),
        expires_at: refreshed.expiresAtIso,
        last_error: null,
        updated_at: nowIso(),
      })
      .eq("id", conn.id);

    return { ok: true as const, accessToken: refreshed.accessToken };
  } catch (e: any) {
    return { ok: false as const, error: safeErrorMessage(e, 400) };
  }
}

async function graphPatchSubscription(args: {
  accessToken: string;
  subscriptionId: string;
  newExpirationIso: string;
}) {
  const url = `https://graph.microsoft.com/v1.0/subscriptions/${encodeURIComponent(
    args.subscriptionId,
  )}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expirationDateTime: args.newExpirationIso,
    }),
  }).catch(() => null);

  if (!res) return { ok: false as const, status: 0, error: "graph_patch_network_error" };
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false as const,
      status: res.status,
      error: `graph_patch_failed:${res.status}:${body.slice(0, 220)}`,
    };
  }

  const data = (await res.json().catch(() => ({}))) as any;
  return { ok: true as const, data };
}

async function graphCreateSubscription(args: {
  accessToken: string;
  notificationUrl: string;
  expirationIso: string;
  clientState: string;
}) {
  const resource =
    process.env.OUTLOOK_SUBSCRIPTION_RESOURCE ||
    "/me/mailFolders('Inbox')/messages";

  const res = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      changeType: "created,updated",
      notificationUrl: args.notificationUrl,
      resource,
      expirationDateTime: args.expirationIso,
      clientState: args.clientState,
      latestSupportedTlsVersion: "v1_2",
    }),
  }).catch(() => null);

  if (!res) return { ok: false as const, status: 0, error: "graph_create_network_error" };
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false as const,
      status: res.status,
      error: `graph_create_failed:${res.status}:${body.slice(0, 220)}`,
    };
  }

  const data = (await res.json().catch(() => ({}))) as any;
  const id = String(data?.id || "").trim();
  const expiration = String(data?.expirationDateTime || "").trim();
  if (!id || !expiration) {
    return { ok: false as const, status: 200, error: "graph_create_invalid_payload" };
  }
  return {
    ok: true as const,
    subscriptionId: id,
    expiration,
  };
}

async function runOutlookRenewals() {
  const supabase = supabaseAdmin();
  const siteUrl = mustEnv("NEXT_PUBLIC_SITE_URL");
  const notificationUrl = new URL("/api/outlook/webhook", siteUrl).toString();

  if (!isValidHttpsOrLocalhost(notificationUrl)) {
    throw new Error("invalid_outlook_notification_url");
  }

  const RENEW_WITHIN_HOURS = 24;
  const TARGET_EXPIRATION_HOURS = 48;

  const { data: conns, error } = await (supabase.from("email_connections") as any)
    .select(
      "id, agent_id, provider, status, watch_active, watch_topic, last_error, access_token, refresh_token, expires_at, outlook_subscription_id, outlook_subscription_expiration",
    )
    .eq("provider", "outlook")
    .in("status", ["connected", "active", "watching"])
    .limit(500);

  if (error) throw new Error(`load_connections_failed:${error.message}`);

  const results: any[] = [];
  let renewed = 0;
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const conn of conns || []) {
    const id = String(conn.id || "");
    const agentId = String(conn.agent_id || "");
    const currentSubId = String(conn.outlook_subscription_id || "").trim();
    const exp = toDate(conn.outlook_subscription_expiration);
    const watchActive = !!conn.watch_active;

    const token = await getValidOutlookAccessToken(supabase, conn);
    if (!token.ok) {
      failed++;
      const reason = `token_error:${token.error}`;
      await (supabase.from("email_connections") as any)
        .update({
          watch_active: false,
          last_error: reason.slice(0, 5000),
          watch_last_renewed_at: nowIso(),
        })
        .eq("id", id);
      results.push({ id, agentId, status: "failed_token", error: token.error });
      continue;
    }

    const shouldRenewExisting =
      !!currentSubId && (isExpiringSoon(exp, RENEW_WITHIN_HOURS) || !watchActive);

    if (currentSubId && !shouldRenewExisting) {
      skipped++;
      results.push({ id, agentId, status: "skipped_healthy" });
      continue;
    }

    const targetExpirationIso = addHoursIso(TARGET_EXPIRATION_HOURS);

    if (currentSubId) {
      const patched = await graphPatchSubscription({
        accessToken: token.accessToken,
        subscriptionId: currentSubId,
        newExpirationIso: targetExpirationIso,
      });

      if (patched.ok) {
        const finalExp = String(patched.data?.expirationDateTime || targetExpirationIso);
        renewed++;
        await (supabase.from("email_connections") as any)
          .update({
            watch_active: true,
            status: "active",
            outlook_subscription_id: currentSubId,
            outlook_subscription_expiration: finalExp,
            watch_expiration: finalExp,
            watch_last_renewed_at: nowIso(),
            last_error: null,
          })
          .eq("id", id);
        results.push({ id, agentId, status: "renewed", expiration: finalExp });
        continue;
      }

      const gone = patched.status === 404 || patched.status === 410;
      if (!gone) {
        failed++;
        await (supabase.from("email_connections") as any)
          .update({
            watch_active: false,
            last_error: patched.error.slice(0, 5000),
            watch_last_renewed_at: nowIso(),
          })
          .eq("id", id);
        results.push({
          id,
          agentId,
          status: "renew_failed",
          error: patched.error,
          httpStatus: patched.status,
        });
        continue;
      }
    }

    const clientState =
      safeClientState(conn.watch_topic) || randomClientState();
    const createdSub = await graphCreateSubscription({
      accessToken: token.accessToken,
      notificationUrl,
      expirationIso: targetExpirationIso,
      clientState,
    });

    if (!createdSub.ok) {
      failed++;
      await (supabase.from("email_connections") as any)
        .update({
          watch_active: false,
          last_error: createdSub.error.slice(0, 5000),
          watch_last_renewed_at: nowIso(),
        })
        .eq("id", id);
      results.push({
        id,
        agentId,
        status: "create_failed",
        error: createdSub.error,
        httpStatus: createdSub.status,
      });
      continue;
    }

    created++;
    await (supabase.from("email_connections") as any)
      .update({
        watch_active: true,
        status: "active",
        watch_topic: clientState,
        outlook_subscription_id: createdSub.subscriptionId,
        outlook_subscription_expiration: createdSub.expiration,
        watch_expiration: createdSub.expiration,
        watch_last_renewed_at: nowIso(),
        last_error: null,
      })
      .eq("id", id);

    results.push({
      id,
      agentId,
      status: "created",
      subscriptionId: createdSub.subscriptionId,
      expiration: createdSub.expiration,
    });
  }

  return {
    ok: true,
    processed: results.length,
    renewed,
    created,
    skipped,
    failed,
    results,
  };
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAtMs = Date.now();
  const supabase = supabaseAdmin();
  try {
    const result = await runOutlookRenewals();
    await logPipelineRun(supabase as any, {
      pipeline: "outlook_subscription_renew",
      status:
        result.failed === 0
          ? "ok"
          : result.failed >= Math.max(1, result.processed)
            ? "error"
            : "warning",
      startedAtMs,
      processed: result.processed,
      success: result.renewed + result.created,
      failed: result.failed,
      skipped: result.skipped,
      meta: {
        renewed: result.renewed,
        created: result.created,
      },
    });
    return NextResponse.json(result);
  } catch (e: any) {
    await logPipelineRun(supabase as any, {
      pipeline: "outlook_subscription_renew",
      status: "error",
      startedAtMs,
      processed: 0,
      success: 0,
      failed: 1,
      skipped: 0,
      meta: {
        error: String(e?.message || e || "renew_failed"),
      },
    });
    return NextResponse.json(
      { error: String(e?.message || e || "renew_failed") },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
