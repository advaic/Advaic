import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export const runtime = "nodejs";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(req: Request) {
  // Simple bearer protection so nobody can trigger this publicly
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const { data: conns, error } = await supabase
    .from("email_connections")
    .select("*")
    .eq("provider", "gmail")
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const renewBeforeMs = 24 * 60 * 60 * 1000; // 24h

  let renewed = 0;
  let skipped = 0;
  let failed = 0;

  for (const conn of conns || []) {
    try {
      const exp = conn.watch_expiration ? Number(conn.watch_expiration) : null;
      const needsRenew = !exp || exp - now < renewBeforeMs;

      if (!needsRenew) {
        skipped++;
        continue;
      }

      const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!
      );

      oauth2.setCredentials({
        refresh_token: conn.refresh_token,
      });

      const gmail = google.gmail({ version: "v1", auth: oauth2 });

      const topicName = `projects/${process.env.GCP_PROJECT_NUMBER}/topics/${process.env.GMAIL_PUBSUB_TOPIC_ID}`;

      const watchRes = await gmail.users.watch({
        userId: "me",
        requestBody: {
          topicName,
          labelIds: ["INBOX"], // optional: limit to inbox
        },
      });

      const newHistoryId = watchRes.data.historyId;
      const expiration = watchRes.data.expiration; // ms timestamp string

      await supabase
        .from("email_connections")
        .update({
          last_history_id: newHistoryId ? String(newHistoryId) : conn.last_history_id,
          watch_expiration: expiration ? String(expiration) : conn.watch_expiration,
          status: "active",
        })
        .eq("id", conn.id);

      renewed++;
    } catch (e) {
      console.error("Renew watch failed for", conn.email_address, e);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, renewed, skipped, failed });
}