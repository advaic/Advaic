import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { google } from "googleapis";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function updateEmailConnectionSafe(
  supabaseAdmin: any,
  id: string | number,
  payload: Record<string, any>
) {
  // Try once with full payload
  let res = await (supabaseAdmin.from("email_connections") as any)
    .update(payload)
    .eq("id", id);

  // If the DB rejects unknown columns (e.g., watch_topic), retry without them.
  const msg = String(res?.error?.message || "").toLowerCase();
  if (msg.includes("column") && msg.includes("watch_topic")) {
    const retry = { ...payload };
    delete retry.watch_topic;

    res = await (supabaseAdmin.from("email_connections") as any)
      .update(retry)
      .eq("id", id);
  }

  return res;
}

async function exchangeCodeForTokens(code: string) {
  const siteUrl = mustEnv("NEXT_PUBLIC_SITE_URL");
  const redirectUri = new URL("/api/auth/gmail/callback", siteUrl).toString();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: mustEnv("GOOGLE_CLIENT_ID"),
      client_secret: mustEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${text.slice(0, 300)}`);
  }

  const json = JSON.parse(text) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!json.access_token) {
    throw new Error("Token exchange failed: missing access_token");
  }

  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_in: typeof json.expires_in === "number" ? json.expires_in : 3600,
  };
}

async function getGoogleEmail(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to fetch Google userinfo: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { email?: string };
  if (!data.email) throw new Error("Google userinfo missing email");
  return data.email;
}

export async function GET(req: NextRequest) {
  const siteUrl = mustEnv("NEXT_PUBLIC_SITE_URL");
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const rawState = url.searchParams.get("state") || "";
  const decodedState = safeDecodeURIComponent(rawState);

  // Only allow internal redirects (we use `state` as a return path).
  // NOTE: In Next.js, the first `app/` is just the folder. The URL for `app/app/...` is `/app/...`.
  // We support callers that send:
  // - `/app/...` (already correct)
  // - `/onboarding/...` (legacy)  -> normalize to `/app/onboarding/...`
  // - `/konto/...` (legacy)       -> normalize to `/app/konto/...`
  // Everything else falls back to the connections page.
  const normalizeReturnPath = (raw: string) => {
    const s = (raw || "").trim();
    if (!s) return "";

    // Block absolute URLs and protocol-relative URLs
    const lower = s.toLowerCase();
    if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("//")) {
      return "";
    }

    // Ensure it starts with `/`
    const path = s.startsWith("/") ? s : `/${s}`;

    if (path === "/app" || path.startsWith("/app/")) return path;
    if (path.startsWith("/onboarding")) return `/app${path}`;
    if (path.startsWith("/konto")) return `/app${path}`;

    return "";
  };

  const normalizedState = normalizeReturnPath(decodedState);

  const nextPath = normalizedState || "/app/konto/verknuepfungen";

  if (!code) {
    const redirectUrl = new URL(nextPath, siteUrl);
    redirectUrl.searchParams.set("gmail", "missing_code");
    return NextResponse.redirect(redirectUrl);
  }

  // Prepare final redirect response first (so Supabase can write refreshed cookies onto it)
  const successRedirect = new URL(nextPath, siteUrl);
  successRedirect.searchParams.set("gmail", "connected");
  const res = NextResponse.redirect(successRedirect);

  try {
    // Verify current Supabase user using cookie-based server client
    const supabaseAuth = createServerClient<Database>(
      mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
      mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            res.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            res.cookies.set({ name, value: "", ...options, maxAge: 0 });
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      const loginUrl = new URL("/login", siteUrl);
      loginUrl.searchParams.set("error", "not_authenticated");
      loginUrl.searchParams.set("next", nextPath);
      return NextResponse.redirect(loginUrl);
    }

    // Service-role client for secure DB read/write
    const supabaseAdmin = createClient<Database>(
      mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
      mustEnv("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Fetch existing connection first so we NEVER wipe refresh_token when Google omits it
    type EmailConnMinimal = { id: string; refresh_token: string | null };

    const existingConnRes = await supabaseAdmin
      .from("email_connections")
      .select("id, refresh_token")
      .eq("agent_id", user.id)
      .eq("provider", "gmail")
      .maybeSingle();

    const existingConn = existingConnRes.data as EmailConnMinimal | null;

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const email = await getGoogleEmail(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Choose refresh token safely: prefer new token, else keep existing
    const refreshToken =
      (tokens.refresh_token ?? undefined) || (existingConn?.refresh_token ?? undefined);

    // Upsert connection WITHOUT wiping refresh_token
    // - if Google sent refresh_token → persist it
    // - if not → keep existing refresh_token
    const upsertPayload: Record<string, any> = {
      agent_id: user.id,
      provider: "gmail",
      email_address: email,
      status: "connected",
      access_token: tokens.access_token,
      expires_at: expiresAt,
    };

    if (refreshToken) {
      upsertPayload.refresh_token = refreshToken;
    }

    const { error: upsertErr } = await supabaseAdmin
      .from("email_connections")
      .upsert(upsertPayload as any, { onConflict: "agent_id,provider" as any });

    if (upsertErr) {
      throw new Error(`DB upsert failed: ${upsertErr.message}`);
    }

    // --- Start Gmail watch immediately on connect (so push works without manual steps) ---
    const topicName =
      process.env.GMAIL_PUBSUB_TOPIC_NAME ||
      `projects/${mustEnv("GCP_PROJECT_NUMBER")}/topics/${mustEnv(
        "GMAIL_PUBSUB_TOPIC_ID"
      )}`;

    // Fetch the persisted connection to get its id + final refresh_token
    const connRes = await supabaseAdmin
      .from("email_connections")
      .select("id, refresh_token")
      .eq("agent_id", user.id)
      .eq("provider", "gmail")
      .maybeSingle();

    const persistedConn = connRes.data as EmailConnMinimal | null;
    const connFetchErr = connRes.error;

    if (connFetchErr || !persistedConn) {
      throw new Error(
        `Failed to load persisted email connection: ${connFetchErr?.message || "unknown"}`
      );
    }

    const finalRefreshToken = persistedConn.refresh_token ?? refreshToken;

    if (!finalRefreshToken) {
      // Without a refresh token we cannot reliably renew watch or access Gmail long-term.
      // This usually means Google did not return it because the user previously consented.
      // Fix: ensure the initial connect flow uses prompt=consent.
      throw new Error(
        "Missing refresh_token. Please disconnect/reconnect Gmail with consent (prompt=consent)."
      );
    }

    const oauth2 = new google.auth.OAuth2(
      mustEnv("GOOGLE_CLIENT_ID"),
      mustEnv("GOOGLE_CLIENT_SECRET"),
      new URL("/api/auth/gmail/callback", siteUrl).toString()
    );

    oauth2.setCredentials({
      refresh_token: finalRefreshToken,
      access_token: tokens.access_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    let watchRes;
    try {
      watchRes = await gmail.users.watch({
        userId: "me",
        requestBody: {
          topicName,
          labelIds: ["INBOX"],
        },
      });
    } catch (e: any) {
      console.error("[gmail/callback] users.watch failed:", e?.message || e);
      throw new Error(`Gmail watch failed: ${e?.message || String(e)}`);
    }

    const newHistoryId = watchRes.data.historyId;
    const expiration = watchRes.data.expiration; // string ms timestamp

    // Gmail returns expiration as epoch milliseconds (string). Our DB column is timestamptz.
    const expirationIso = expiration
      ? new Date(Number(expiration)).toISOString()
      : null;

    const watchUpdatePayload: Record<string, any> = {
      last_history_id: newHistoryId ? String(newHistoryId) : null,
      watch_expiration: expirationIso,
      watch_active: true,
      last_error: null,
      status: "active",
      // ensure refresh_token is persisted even if Google omitted it this time
      refresh_token: finalRefreshToken,
      // optional: persist the Pub/Sub topic if your table has the column
      watch_topic: topicName,
    };

    const watchUpdRes = await updateEmailConnectionSafe(
      supabaseAdmin,
      persistedConn.id,
      watchUpdatePayload
    );

    if (watchUpdRes.error) {
      throw new Error(
        `Failed to persist watch state: ${watchUpdRes.error.message}`
      );
    }

    console.log("[gmail/callback] watch active", {
      agent_id: user.id,
      provider: "gmail",
      historyId: newHistoryId ? String(newHistoryId) : null,
      watch_expiration: expirationIso,
    });

    // Notify Make (optional)
    if (process.env.MAKE_GMAIL_CONNECTED_WEBHOOK_URL) {
      try {
        await fetch(process.env.MAKE_GMAIL_CONNECTED_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "gmail_connected",
            agent_id: user.id,
            email,
            provider: "gmail",
            connected_at: new Date().toISOString(),
            expires_at: expiresAt,
          }),
        });
      } catch {
        // Non-blocking
      }
    }

    return res;
  } catch (e) {
    console.error("[gmail/callback] error:", e);

    // Do NOT leak raw error messages into a public URL query param.
    // Keep it user-friendly + stable, and log details server-side only.
    const errUrl = new URL(nextPath, siteUrl);
    errUrl.searchParams.set("gmail", "error");
    errUrl.searchParams.set("reason", "connect_failed");

    return NextResponse.redirect(errUrl);
  }
}
