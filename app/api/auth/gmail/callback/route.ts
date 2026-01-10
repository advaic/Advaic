import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { google } from "googleapis";

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function exchangeCodeForTokens(code: string) {
  const redirectUri = new URL(
    "/api/auth/gmail/callback",
    process.env.NEXT_PUBLIC_SITE_URL
  ).toString();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    // Google often returns JSON in text; keep it readable but not too huge
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
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const rawState = url.searchParams.get("state") || "";
  const decodedState = safeDecodeURIComponent(rawState);
  const nextPath = decodedState.startsWith("/app")
    ? decodedState
    : "/app/konto/verknuepfungen";

  if (!code) {
    const redirectUrl = new URL(
      "/app/konto/verknuepfungen",
      process.env.NEXT_PUBLIC_SITE_URL
    );
    redirectUrl.searchParams.set("gmail", "missing_code");
    return NextResponse.redirect(redirectUrl);
  }

  // Prepare final redirect response first (so Supabase can write refreshed cookies onto it)
  const successRedirect = new URL(nextPath, process.env.NEXT_PUBLIC_SITE_URL);
  successRedirect.searchParams.set("gmail", "connected");
  const res = NextResponse.redirect(successRedirect);

  try {
    // Verify current Supabase user using cookie-based server client
    const supabaseAuth = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
      const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_SITE_URL);
      loginUrl.searchParams.set("error", "not_authenticated");
      loginUrl.searchParams.set("next", nextPath);
      return NextResponse.redirect(loginUrl);
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const email = await getGoogleEmail(tokens.access_token);
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    // Service-role client for secure DB write
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from("email_connections")
      .upsert(
        {
          agent_id: user.id,
          provider: "gmail",
          email_address: email,
          status: "connected",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          expires_at: expiresAt,
        } as any,
        { onConflict: "agent_id,provider" as any }
      );

    if (error) {
      throw new Error(`DB upsert failed: ${error.message}`);
    }

    // --- Start Gmail watch immediately on connect (so push works without manual steps) ---
    const projectNumber = process.env.GCP_PROJECT_NUMBER;
    const topicId = process.env.GMAIL_PUBSUB_TOPIC_ID;
    if (!projectNumber || !topicId) {
      throw new Error("Missing env vars: GCP_PROJECT_NUMBER or GMAIL_PUBSUB_TOPIC_ID");
    }

    // Fetch the persisted connection to get the final refresh_token (Google may omit it on re-connect)
    type EmailConnMinimal = { id: number; refresh_token: string | null };

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

    const refreshToken =
      (tokens.refresh_token ?? undefined) ||
      (persistedConn.refresh_token ?? undefined);

    if (!refreshToken) {
      // Without a refresh token we cannot reliably renew watch or access Gmail long-term.
      // This usually means Google did not return it because the user previously consented.
      throw new Error(
        "Missing refresh_token. Please disconnect/reconnect Gmail with consent (prompt=consent)."
      );
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      new URL("/api/auth/gmail/callback", process.env.NEXT_PUBLIC_SITE_URL).toString()
    );

    oauth2.setCredentials({
      refresh_token: refreshToken,
      access_token: tokens.access_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    const topicName = `projects/${projectNumber}/topics/${topicId}`;

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

    const watchUpdatePayload: Record<string, any> = {
      last_history_id: newHistoryId ? String(newHistoryId) : null,
      watch_expiration: expiration ? String(expiration) : null,
      status: "active",
      // ensure refresh_token is persisted even if Google omitted it this time
      refresh_token: refreshToken,
    };

    const { error: watchUpdErr } = await (supabaseAdmin
      .from("email_connections") as any)
      .update(watchUpdatePayload)
      .eq("id", persistedConn.id);

    if (watchUpdErr) {
      throw new Error(`Failed to persist watch state: ${watchUpdErr.message}`);
    }

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

    const errUrl = new URL(
      "/app/konto/verknuepfungen",
      process.env.NEXT_PUBLIC_SITE_URL
    );
    errUrl.searchParams.set("gmail", "error");

    const msg = e instanceof Error ? e.message : String(e);
    errUrl.searchParams.set("reason", msg.slice(0, 180));

    return NextResponse.redirect(errUrl);
  }
}
