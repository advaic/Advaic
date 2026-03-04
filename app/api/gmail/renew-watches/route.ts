import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import type { Database } from "@/types/supabase";
import { decryptSecretFromStorage } from "@/lib/security/secrets";
import { logPipelineRun } from "@/lib/ops/pipeline-runs";

export const runtime = "nodejs";

function mustEnv(name: string) {
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

/**
 * Cron auth:
 * - Prefer: Authorization: Bearer <CRON_SECRET>
 * - Also allow: ?secret=<CRON_SECRET>
 * - Also allow internal pipeline secret (useful if you reuse the same runner infra)
 */
function isAuthorized(req: Request) {
  const cronSecret = process.env.CRON_SECRET || "";
  const internalSecret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET || "";

  const auth = req.headers.get("authorization") || "";
  const bearerToken = auth.startsWith("Bearer ")
    ? auth.slice("Bearer ".length)
    : "";
  const internalHeader = req.headers.get("x-advaic-internal-secret") || "";

  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") || "";

  const headerOk =
    (!!bearerToken &&
      (bearerToken === cronSecret || bearerToken === internalSecret)) ||
    (!!internalHeader && internalHeader === internalSecret);
  const queryOk = !!secret && (secret === cronSecret || secret === internalSecret);

  return headerOk || queryOk;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function maskEmail(value: unknown) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw || !raw.includes("@")) return "";
  const [local, domain] = raw.split("@");
  if (!local || !domain) return "";
  const localMasked = local.length <= 2 ? `${local[0] || "*"}*` : `${local.slice(0, 2)}***`;
  return `${localMasked}@${domain}`;
}

async function withBackoff<T>(fn: () => Promise<T>, label: string) {
  // Conservative retry: handles transient Google 429/5xx.
  const delays = [500, 1500, 3500];
  let lastErr: any = null;

  for (let i = 0; i <= delays.length; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;

      const status = Number(e?.code) || Number(e?.response?.status) || 0;
      const retryable = status === 429 || (status >= 500 && status < 600);

      if (!retryable || i === delays.length) {
        const msg = e?.message || String(e);
        throw new Error(`${label} failed${status ? ` (HTTP ${status})` : ""}: ${msg}`);
      }

      await sleep(delays[i]);
    }
  }

  // Should never hit
  throw lastErr;
}

async function runRenewWatches() {
  const supabase = supabaseAdmin();

  // IMPORTANT:
  // - In your codebase you sometimes use status "connected" and sometimes "active".
  // - If we only select "active", watches will never renew for "connected" rows.
  const { data: conns, error } = await (supabase.from("email_connections") as any)
    .select(
      "id, agent_id, provider, status, refresh_token, email_address, last_history_id, watch_expiration, watch_active, watch_topic, last_error"
    )
    .eq("provider", "gmail")
    .in("status", ["connected", "active", "watching"])
    .limit(500);

  if (error) throw new Error(error.message);

  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // Gmail watch expiration is short-lived (often ~7 days). Renew early.
  // Keep 36h buffer so a single missed day doesn't kill pushes.
  const renewBeforeMs = 36 * 60 * 60 * 1000; // 36h

  const explicitTopicName = process.env.GMAIL_PUBSUB_TOPIC_NAME || "";
  const defaultProjectNumber =
    process.env.GCP_PROJECT_NUMBER || process.env.GCP_PROJECT_ID || "";
  const defaultTopicId = process.env.GMAIL_PUBSUB_TOPIC_ID || "";
  const defaultTopicName =
    explicitTopicName ||
    (defaultProjectNumber && defaultTopicId
      ? `projects/${defaultProjectNumber}/topics/${defaultTopicId}`
      : "");

  // Redirect URI is irrelevant for refresh_token usage, but googleapis expects it.
  // Prefer building from NEXT_PUBLIC_SITE_URL to avoid env drift.
  const redirectUri = new URL("/api/auth/gmail/callback", mustEnv("NEXT_PUBLIC_SITE_URL")).toString();

  let renewed = 0;
  let skipped = 0;
  let failed = 0;
  const checked = Array.isArray(conns) ? conns.length : 0;
  const failures: Array<{ id: string; email: string | null; error: string }> = [];

  for (const conn of conns || []) {
    const connId = String(conn.id);
    const email = (conn.email_address ? String(conn.email_address) : null) as string | null;

    try {
      const refreshToken = decryptSecretFromStorage(conn.refresh_token || "");
      if (!refreshToken) {
        failed++;
        try {
          await (supabase.from("email_connections") as any)
            .update({
              status: "connected",
              watch_active: false,
              watch_last_renewed_at: nowIso,
              last_error: "missing_refresh_token",
            })
            .eq("id", connId);
        } catch {
          // ignore
        }
        failures.push({
          id: connId,
          email: maskEmail(email),
          error: "missing_refresh_token",
        });
        continue;
      }

      const expRaw = conn.watch_expiration ? String(conn.watch_expiration) : "";
      const expMs = expRaw ? Date.parse(expRaw) : NaN; // DB stores ISO timestamptz
      const needsRenew =
        conn.watch_active === false || !Number.isFinite(expMs) || expMs - now < renewBeforeMs;

      if (!needsRenew) {
        skipped++;
        continue;
      }

      const topicName = (conn.watch_topic ? String(conn.watch_topic) : "").trim() || defaultTopicName;
      if (!topicName) {
        failed++;
        try {
          await (supabase.from("email_connections") as any)
            .update({
              status: "connected",
              watch_active: false,
              watch_last_renewed_at: nowIso,
              last_error: "missing_gmail_topic_name",
            })
            .eq("id", connId);
        } catch {
          // ignore
        }
        failures.push({
          id: connId,
          email: maskEmail(email),
          error:
            "missing_topicName (set email_connections.watch_topic or env GMAIL_PUBSUB_TOPIC_NAME or GCP_PROJECT_NUMBER/GCP_PROJECT_ID + GMAIL_PUBSUB_TOPIC_ID)",
        });
        continue;
      }

      const oauth2 = new google.auth.OAuth2(
        mustEnv("GOOGLE_CLIENT_ID"),
        mustEnv("GOOGLE_CLIENT_SECRET"),
        redirectUri
      );

      oauth2.setCredentials({ refresh_token: refreshToken });

      const gmail = google.gmail({ version: "v1", auth: oauth2 });

      const watchRes = await withBackoff(
        () =>
          gmail.users.watch({
            userId: "me",
            requestBody: {
              topicName,
              // Keep it strict to reduce noisy pushes.
              // If you later need more, add labels explicitly.
              labelIds: ["INBOX"],
            },
          }),
        "gmail.users.watch"
      );

      const newHistoryId = watchRes.data.historyId ? String(watchRes.data.historyId) : null;
      const expEpochMs = watchRes.data.expiration ? Number(String(watchRes.data.expiration)) : NaN;

      // If Google ever returns empty values, fail-closed so you notice.
      if (!Number.isFinite(expEpochMs) || expEpochMs <= 0) {
        throw new Error("watch returned invalid expiration");
      }

      const expirationIso = new Date(expEpochMs).toISOString();

      const updatePayload: Record<string, any> = {
        watch_expiration: expirationIso,
        watch_active: true,
        watch_topic: topicName,
        watch_last_renewed_at: nowIso,
        last_error: null,
        status: "active",
      };

      // Only overwrite last_history_id if we got one back.
      // (In practice, watch should return it.)
      if (newHistoryId) updatePayload.last_history_id = newHistoryId;

      const { error: updErr } = await (supabase.from("email_connections") as any)
        .update(updatePayload)
        .eq("id", connId);

      if (updErr) throw new Error(`db update failed: ${updErr.message}`);

      renewed++;
    } catch (e: any) {
      const msg = String(e?.message || e || "unknown_error").slice(0, 300);
      console.error("[renew-watches] renew failed", {
        connId,
        email: maskEmail(email),
        error: msg,
      });
      failed++;
      failures.push({ id: connId, email: maskEmail(email), error: msg });

      // Best-effort: mark as degraded so UI/monitoring can detect it.
      try {
        await (supabase.from("email_connections") as any)
          .update({
            status: "connected",
            watch_active: false,
            watch_last_renewed_at: nowIso,
            last_error: msg,
          })
          .eq("id", connId);
      } catch {
        // ignore
      }
    }
  }

  return {
    ok: true,
    checked,
    renewed,
    skipped,
    failed,
    // Return a small sample so GitHub Action logs show what's wrong.
    failures: failures.slice(0, 10),
  };
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAtMs = Date.now();
  const supabase = supabaseAdmin();
  try {
    const result = await runRenewWatches();
    await logPipelineRun(supabase as any, {
      pipeline: "gmail_watch_renew",
      status:
        result.failed === 0 ? "ok" : result.failed >= Math.max(1, result.checked) ? "error" : "warning",
      startedAtMs,
      processed: result.checked,
      success: result.renewed,
      failed: result.failed,
      skipped: result.skipped,
      meta: {
        failures_sample: result.failures,
      },
    });
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    await logPipelineRun(supabase as any, {
      pipeline: "gmail_watch_renew",
      status: "error",
      startedAtMs,
      processed: 0,
      success: 0,
      failed: 1,
      skipped: 0,
      meta: {
        error: String(e?.message || "Failed to renew watches"),
      },
    });
    return NextResponse.json(
      { error: String(e?.message || "Failed to renew watches") },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // GitHub Actions / some cron callers often use GET.
  return POST(req);
}
