import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // No-op: this route doesn't need to mutate cookies.
        set() {},
        remove() {},
      },
    }
  );
}

function computeRedirectUri() {
  // Prefer explicit redirect URI if you have it; otherwise derive from site URL.
  const explicit = process.env.GOOGLE_REDIRECT_URI;
  if (explicit && explicit.trim()) return explicit.trim();
  const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (!site) throw new Error("Missing env var: GOOGLE_REDIRECT_URI or NEXT_PUBLIC_SITE_URL");
  const base = site.startsWith("http") ? site : `https://${site}`;
  return new URL("/api/auth/gmail/callback", base).toString();
}

function toIso(msLike: unknown) {
  const ms = Number(msLike);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return new Date(ms).toISOString();
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();

    // ✅ Verify user server-side (don’t trust session cookie payload)
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = userRes.user;

    // 1) Load Gmail connection row for this user
    const { data: conn, error: connErr } = await supabase
      .from("email_connections")
      .select("id, agent_id, provider, refresh_token, status")
      .eq("agent_id", user.id)
      .eq("provider", "gmail")
      .maybeSingle();

    if (connErr) {
      return NextResponse.json(
        { error: `Failed to load Gmail connection: ${connErr.message}` },
        { status: 500 }
      );
    }

    if (!conn || !conn.refresh_token) {
      return NextResponse.json(
        { error: "No Gmail connection found. Please connect Gmail first." },
        { status: 400 }
      );
    }

    // Optional: enforce only connected/active rows can watch
    const st = String(conn.status || "").toLowerCase();
    if (st && !["connected", "active", "watching"].includes(st)) {
      return NextResponse.json(
        { error: `Gmail connection not active (status=${conn.status}). Reconnect Gmail.` },
        { status: 400 }
      );
    }

    // 2) Create OAuth client with stored refresh_token
    const oauth2 = new google.auth.OAuth2(
      mustEnv("GOOGLE_CLIENT_ID"),
      mustEnv("GOOGLE_CLIENT_SECRET"),
      computeRedirectUri()
    );

    oauth2.setCredentials({
      refresh_token: conn.refresh_token,
      // Do NOT set access_token here; let googleapis refresh it on-demand.
    });

    // 3) Call Gmail watch
    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    // Prefer a single env for the full topic name, but keep backward compatible fallbacks.
    const topicName =
      (process.env.GMAIL_PUBSUB_TOPIC_NAME && process.env.GMAIL_PUBSUB_TOPIC_NAME.trim()) ||
      `projects/${mustEnv("GCP_PROJECT_ID")}/topics/${mustEnv("GMAIL_PUBSUB_TOPIC_ID")}`;

    // NOTE: labelIds limits which mailbox labels trigger push.
    // INBOX is typically what we want for lead intake.
    const watchRes = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName,
        labelIds: ["INBOX"],
      },
    });

    const historyId = watchRes.data.historyId ?? null;
    const expirationIso = toIso(watchRes.data.expiration);

    // Fail-closed: if Gmail did not return a historyId, we can't safely process history deltas.
    if (!historyId) {
      return NextResponse.json(
        { error: "Gmail watch did not return historyId" },
        { status: 502 }
      );
    }

    // 4) Persist watch state
    // NOTE: `email_connections` may not have `watch_topic` yet. We try to write it,
    // and if the column doesn't exist we retry without it (backward compatible).

    const baseUpdate: Record<string, any> = {
      last_history_id: String(historyId),
      watch_expiration: expirationIso,
      watch_active: true,
      status: "watching",
    };

    const withTopic: Record<string, any> = { ...baseUpdate, watch_topic: topicName };

    let upErr: any = null;

    // First attempt: write topicName for renew/debugging.
    {
      const res = await supabase
        .from("email_connections")
        .update(withTopic as any)
        .eq("agent_id", user.id)
        .eq("provider", "gmail");
      upErr = res.error;
    }

    // Backward compatible retry if the column doesn't exist.
    if (
      upErr?.message &&
      typeof upErr.message === "string" &&
      upErr.message.toLowerCase().includes("watch_topic") &&
      upErr.message.toLowerCase().includes("column")
    ) {
      const res2 = await supabase
        .from("email_connections")
        .update(baseUpdate as any)
        .eq("agent_id", user.id)
        .eq("provider", "gmail");
      upErr = res2.error;
    }

    if (upErr) {
      return NextResponse.json(
        { error: `DB update failed: ${upErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      historyId: String(historyId),
      expiration: expirationIso,
      topicName,
    });
  } catch (e: any) {
    console.error("[gmail/watch] error:", e?.message || e);
    return NextResponse.json(
      { error: "watch failed", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
