import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export const runtime = "nodejs";

const oidcClient = new OAuth2Client();

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer (.+)$/i);
  return match ? match[1] : null;
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function ok204(extra?: any) {
  // Pub/Sub only cares about 2xx. 204 is perfect.
  return new NextResponse(extra ? JSON.stringify(extra) : null, {
    status: 204,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const host = req.headers.get("host");
    console.log("📩 Gmail Push HIT", {
      url: req.url,
      host,
      at: new Date().toISOString(),
    });

    // --- 1) Verify Pub/Sub push JWT (OIDC) ---
    const token = getBearerToken(req);
    if (!token) {
      console.error("❌ Gmail Push: Missing Authorization Bearer token");
      return ok204({ ok: false, reason: "missing_bearer" });
    }

    // If you left "Audience" empty in Pub/Sub, Google sets aud = endpoint URL.
    // So we verify against req.url by default.
    const expectedAud = process.env.GMAIL_PUBSUB_PUSH_AUDIENCE || req.url;

    try {
      await oidcClient.verifyIdToken({
        idToken: token,
        audience: expectedAud,
      });
    } catch (e: any) {
      console.error("❌ Gmail Push: JWT verify failed", {
        expectedAud,
        err: e?.message || String(e),
      });
      return ok204({ ok: false, reason: "jwt_verify_failed" });
    }

    // --- 2) Read Pub/Sub envelope ---
    let body: any;
    try {
      body = await req.json();
    } catch (e: any) {
      console.error("❌ Gmail Push: req.json() failed", e?.message || e);
      return ok204({ ok: false, reason: "invalid_json" });
    }

    const messageDataB64 = body?.message?.data;
    if (!messageDataB64) {
      console.error("❌ Gmail Push: No body.message.data", {
        bodyKeys: Object.keys(body || {}),
      });
      return ok204({ ok: false, reason: "missing_message_data" });
    }

    // --- 3) Decode Gmail push payload ---
    let data: any;
    try {
      const decoded = Buffer.from(messageDataB64, "base64").toString("utf8");
      data = JSON.parse(decoded);
    } catch (e: any) {
      console.error(
        "❌ Gmail Push: Failed to decode/parse data",
        e?.message || e
      );
      return ok204({ ok: false, reason: "decode_parse_failed" });
    }

    const emailAddress = data?.emailAddress;
    const historyId = data?.historyId;

    if (!emailAddress || !historyId) {
      console.error("❌ Gmail Push: Missing emailAddress/historyId", { data });
      return ok204({ ok: false, reason: "missing_email_or_history" });
    }

    console.log("✅ Gmail Push payload", { emailAddress, historyId });

    // --- 4) Fetch connection from Supabase (service role, bypass RLS) ---
    const supabase = supabaseAdmin();

    const { data: conn, error: connErr } = await supabase
      .from("email_connections")
      .select("*")
      .eq("email_address", emailAddress)
      .single();

    if (connErr || !conn) {
      console.error("❌ Gmail Push: email_connections not found", {
        emailAddress,
        connErr: connErr?.message,
      });
      return ok204({ ok: false, reason: "connection_not_found" });
    }

    // --- 5) Gmail API client with refresh token ---
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    oauth2.setCredentials({
      refresh_token: conn.refresh_token,
      access_token: conn.access_token ?? undefined,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    // IMPORTANT:
    // For history.list you should use the *previous* stored history id, not the new one.
    // Otherwise you often get empty history.
    const startHistoryId = conn.last_history_id || historyId;

    let historyRes;
    try {
      historyRes = await gmail.users.history.list({
        userId: "me",
        startHistoryId: String(startHistoryId),
        historyTypes: ["messageAdded"],
      });
    } catch (e: any) {
      console.error("❌ Gmail Push: gmail.history.list failed", {
        emailAddress,
        startHistoryId,
        err: e?.message || String(e),
      });
      return ok204({ ok: false, reason: "gmail_history_failed" });
    }

    const history = historyRes.data.history || [];
    console.log("📚 Gmail history items", { count: history.length });

    // --- 6) TODO: Insert into messages (this may fail if lead_id mapping isn’t solved yet) ---
    // For now, we just log message ids so we know ingestion works.
    const messageIds: string[] = [];
    for (const h of history) {
      for (const m of h.messages || []) {
        if (m.id) messageIds.push(m.id);
      }
    }
    console.log("📨 New Gmail message IDs", messageIds.slice(0, 20));

    // --- 7) Update connection last_history_id so next push uses correct startHistoryId ---
    const { error: updErr } = await supabase
      .from("email_connections")
      .update({
        last_history_id: String(historyId),
        status: "active",
      })
      .eq("id", conn.id);

    if (updErr) {
      console.error(
        "⚠️ Gmail Push: failed updating email_connections",
        updErr.message
      );
    }

    console.log("✅ Gmail Push done", {
      ms: Date.now() - startedAt,
    });

    // Always 204 to stop Pub/Sub retries
    return ok204({ ok: true });
  } catch (err: any) {
    console.error("💥 Gmail Push: Unhandled error", err?.message || err);
    // Still return 204 so Pub/Sub stops hammering you
    return ok204({ ok: false, reason: "unhandled" });
  }
}
