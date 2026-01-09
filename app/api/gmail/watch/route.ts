import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function POST() {
  try {
    const supabase = await supabaseServer();

    // ✅ verify user server-side (don’t trust session cookie payload)
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const user = userRes.user;

    // 1) Load Gmail connection row for this user
    const { data: conn, error: connErr } = await supabase
      .from("email_connections")
      .select("*")
      .eq("agent_id", user.id)
      .eq("provider", "gmail")
      .single();

    if (connErr || !conn) {
      return NextResponse.json(
        { error: "No Gmail connection found. Please connect Gmail first." },
        { status: 400 }
      );
    }

    // 2) Create OAuth client with stored refresh_token
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI! // set this in env (prod: https://www.advaic.com/api/auth/gmail/callback)
    );

    oauth2.setCredentials({
      refresh_token: conn.refresh_token,
      access_token: conn.access_token ?? undefined,
    });

    // 3) Call Gmail watch
    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    const topicName = `projects/${process.env.GCP_PROJECT_ID}/topics/${process.env.GMAIL_PUBSUB_TOPIC_ID}`;
    // Example env: GCP_PROJECT_ID=advaic ; GMAIL_PUBSUB_TOPIC_ID=gmail-push

    const watchRes = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName,
        labelIds: ["INBOX"],
      },
    });

    const historyId = watchRes.data.historyId ?? null;

    const expirationMs = watchRes.data.expiration
      ? Number(watchRes.data.expiration)
      : null;

    const expirationIso = expirationMs
      ? new Date(expirationMs).toISOString()
      : null;

    // 4) Persist watch state
    const { error: upErr } = await supabase
      .from("email_connections")
      .update({
        last_history_id: historyId,
        watch_expiration: expirationIso,
        watch_active: true,
        status: "watching",
      })
      .eq("agent_id", user.id)
      .eq("provider", "gmail");

    if (upErr) {
      return NextResponse.json(
        { error: `DB update failed: ${upErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      historyId,
      expiration: expirationIso,
      topicName,
    });
  } catch (e: any) {
    console.error("watch error:", e?.message || e);
    return NextResponse.json({ error: "watch failed" }, { status: 500 });
  }
}
