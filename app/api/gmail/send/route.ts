import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const { lead_id, gmail_thread_id, to, subject, text } = body || {};

  if (!lead_id || !to || !subject || !text) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const res = NextResponse.next();

  // 1️⃣ Authenticate agent
  const supabaseAuth = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
    error: authErr,
  } = await supabaseAuth.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2️⃣ Load Gmail connection
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: conn, error: connErr } = await supabaseAdmin
    .from("email_connections")
    .select("refresh_token, email_address")
    .eq("agent_id", user.id)
    .eq("provider", "gmail")
    .in("status", ["connected", "active"])
    .single();

  type GmailConnection = {
    refresh_token: string;
    email_address: string | null;
  };

  const gmailConn = conn as GmailConnection | null;

  if (!gmailConn || !gmailConn.refresh_token) {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
  }

  // 3️⃣ Gmail OAuth client
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    new URL(
      "/api/auth/gmail/callback",
      process.env.NEXT_PUBLIC_SITE_URL
    ).toString()
  );

  oauth2.setCredentials({
    refresh_token: gmailConn.refresh_token,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  // 4️⃣ Build RFC 2822 raw email
  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "MIME-Version: 1.0",
    "",
    text,
  ].join("\n");

  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // 5️⃣ Send email via Gmail API (capture Gmail message id/thread id)
  let sentMessageId: string | null = null;
  let sentThreadId: string | null = gmail_thread_id ?? null;

  try {
    const sendRes = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        ...(gmail_thread_id ? { threadId: gmail_thread_id } : {}),
      },
    });

    sentMessageId = sendRes.data.id ?? null;
    sentThreadId = sendRes.data.threadId ?? sentThreadId;
  } catch (e: any) {
    console.error("[gmail/send] Gmail API error:", e?.message || e);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }

  // 6️⃣ Persist message in Supabase (dedupe via gmail_message_id when available)
  const baseRow: Record<string, any> = {
    lead_id,
    sender: "agent",
    text,
    gmail_thread_id: sentThreadId,
  };

  if (sentMessageId) baseRow.gmail_message_id = sentMessageId;

  let msgErr: any = null;

  if (sentMessageId) {
    // Prefer upsert to prevent duplicates with Gmail Push ingestion
    const { error } = await (supabaseAdmin.from("messages") as any).upsert(
      baseRow,
      { onConflict: "gmail_message_id" }
    );
    msgErr = error;

    // If the column/constraint isn't there yet, fall back to insert
    if (msgErr) {
      console.error("[gmail/send] DB upsert failed (falling back to insert):", msgErr.message);
      const { error: fallbackErr } = await (supabaseAdmin.from("messages") as any).insert(baseRow);
      msgErr = fallbackErr;
    }
  } else {
    const { error } = await (supabaseAdmin.from("messages") as any).insert(baseRow);
    msgErr = error;
  }

  if (msgErr) {
    console.error("[gmail/send] DB write failed:", msgErr.message);
    // Email was sent — don’t fail the request
  }

  return NextResponse.json({ ok: true, gmail_message_id: sentMessageId, gmail_thread_id: sentThreadId });
}
