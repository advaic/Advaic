import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { encryptSecretForStorage } from "@/lib/security/secrets";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseFromReq(req: NextRequest, res: NextResponse) {
  return createServerClient<Database>(
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
}

function redirect(url: string) {
  // NextResponse.redirect requires an absolute URL
  return NextResponse.redirect(new URL(url, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

async function safeUpsert(supabase: any, table: string, payload: Record<string, any>, onConflict?: string) {
  try {
    const q = supabase.from(table).upsert(payload, onConflict ? { onConflict } : undefined);
    await q;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Slack sometimes sends `error=access_denied` when the user cancels
  if (error) {
    return redirect(`/app/benachrichtigungen?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return redirect("/app/benachrichtigungen?error=missing_code");
  }

  // ✅ Use env vars (never hardcode secrets)
  const clientId = mustEnv("SLACK_CLIENT_ID");
  const clientSecret = mustEnv("SLACK_CLIENT_SECRET");
  const redirectUri = mustEnv("SLACK_REDIRECT_URI");

  // We want to preserve Supabase session cookies if Supabase needs to refresh them
  const res = redirect("/app/benachrichtigungen?slack_connected=1");
  const supabase = supabaseFromReq(req, res);

  // Ensure we know which agent connected Slack
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user?.id) {
    return redirect("/app/benachrichtigungen?error=not_logged_in");
  }

  try {
    // Slack OAuth v2 exchange
    const form = new URLSearchParams();
    form.set("code", code);
    form.set("client_id", clientId);
    form.set("client_secret", clientSecret);
    form.set("redirect_uri", redirectUri);

    const oauthResp = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const data = (await oauthResp.json().catch(() => null)) as any;

    if (!data || data.ok !== true) {
      console.error("Slack OAuth error:", data);
      return redirect("/app/benachrichtigungen?error=oauth_failed");
    }

    const accessToken: string | null = typeof data.access_token === "string" ? data.access_token : null;
    const teamId: string | null = data?.team?.id ? String(data.team.id) : null;
    const teamName: string | null = data?.team?.name ? String(data.team.name) : null;
    const authedUserId: string | null = data?.authed_user?.id ? String(data.authed_user.id) : null;

    // ✅ Store connection metadata for UI (safe, no secrets)
    // Expected columns (if present): slack_connected, slack_team_id, slack_team_name, slack_authed_user_id, slack_connected_at
    // If your schema differs, this upsert is best-effort.
    await safeUpsert(
      supabase,
      "agent_notification_settings",
      {
        agent_id: user.id,
        slack_connected: true,
        slack_team_id: teamId,
        slack_team_name: teamName,
        slack_authed_user_id: authedUserId,
        slack_connected_at: new Date().toISOString(),
      },
      "agent_id"
    );

    // ✅ Store token for sending notifications (best-effort).
    // Recommended: keep tokens in a dedicated table with RLS and minimal reads.
    // This upsert will only work if you created `slack_connections`.
    // Schema suggestion: (agent_id pk, access_token, team_id, team_name, authed_user_id, updated_at)
    if (accessToken) {
      const base = {
        agent_id: user.id,
        access_token: encryptSecretForStorage(accessToken),
        team_id: teamId,
        team_name: teamName,
        updated_at: new Date().toISOString(),
      };

      const modern = await safeUpsert(
        supabase,
        "slack_connections",
        {
          ...base,
          authed_user_id: authedUserId,
        },
        "agent_id"
      );

      // Backward-compatible fallback for older schemas.
      if (!modern.ok) {
        await safeUpsert(
          supabase,
          "slack_connections",
          {
            ...base,
            slack_authed_user_id: authedUserId,
          },
          "agent_id"
        );
      }
    }

    // If we got here, we keep the success redirect
    return res;
  } catch (err) {
    console.error("Slack OAuth Callback Error:", err);
    return redirect("/app/benachrichtigungen?error=server_error");
  }
}
