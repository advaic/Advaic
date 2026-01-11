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


function ok200() {
  // Pub/Sub stops retrying on any 2xx. Use 200 to avoid 204 edge-cases in Next runtime.
  return NextResponse.json({ ok: true }, { status: 200 });
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
      return ok200();
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
      return ok200();
    }

    // --- 2) Read Pub/Sub envelope ---
    let body: any;
    try {
      body = await req.json();
    } catch (e: any) {
      console.error("❌ Gmail Push: req.json() failed", e?.message || e);
      return ok200();
    }

    const messageDataB64 = body?.message?.data;
    if (!messageDataB64) {
      console.error("❌ Gmail Push: No body.message.data", {
        bodyKeys: Object.keys(body || {}),
      });
      return ok200();
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
      return ok200();
    }

    const emailAddress = data?.emailAddress;
    const historyId = data?.historyId;

    if (!emailAddress || !historyId) {
      console.error("❌ Gmail Push: Missing emailAddress/historyId", { data });
      return ok200();
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
      return ok200();
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
    // Gmail push sends the *latest* historyId. To fetch changes, we must diff from the
    // previously stored last_history_id. If we don't have a baseline yet, we store the
    // current historyId and exit — the next push will produce a real diff.
    const prevHistoryId = conn.last_history_id;

    if (!prevHistoryId) {
      const { error: baselineErr } = await supabase
        .from("email_connections")
        .update({
          last_history_id: String(historyId),
          status: "active",
        })
        .eq("id", conn.id);

      if (baselineErr) {
        console.error(
          "⚠️ Gmail Push: failed setting baseline last_history_id",
          baselineErr.message
        );
      }

      console.log("🧷 Set baseline last_history_id (no diff on first push)", {
        emailAddress,
        historyId,
      });

      return ok200();
    }

    const startHistoryId = String(prevHistoryId);   

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
      return ok200();
    }

    const history = historyRes.data.history || [];
    console.log("📚 Gmail history items", { count: history.length });

    // --- 6) Insert/update Leads + Messages using Gmail threadId mapping ---
    // Assumes you added:
    // - leads.gmail_thread_id + unique index (agent_id, gmail_thread_id)
    // - messages.gmail_message_id (unique) + messages.gmail_thread_id

    const insertedMessageIds: string[] = [];

    for (const h of history) {
      const msgs = h.messages || [];

      for (const m of msgs) {
        if (!m.id) continue;

        // Fetch message metadata so we get threadId + snippet + headers
        let msgRes;
        try {
          msgRes = await gmail.users.messages.get({
            userId: "me",
            id: m.id,
            format: "metadata",
            metadataHeaders: ["From", "To", "Subject", "Date"],
          });
        } catch (e: any) {
          console.error("❌ Gmail Push: gmail.messages.get failed", {
            gmailMessageId: m.id,
            err: e?.message || String(e),
          });
          continue;
        }

        const gmailMessageId = msgRes.data.id;
        const threadId = msgRes.data.threadId;
        if (!gmailMessageId || !threadId) continue;

        const headers = msgRes.data.payload?.headers || [];
        const from =
          headers.find((x) => x.name?.toLowerCase() === "from")?.value || "";

        const snippet = msgRes.data.snippet || "";
        const internalDateMs = msgRes.data.internalDate
          ? Number(msgRes.data.internalDate)
          : Date.now();
        const timestampIso = new Date(internalDateMs).toISOString();

        // Determine sender: agent if message is from the connected Gmail account, else user
        const isFromAgent =
          from.toLowerCase().includes(emailAddress.toLowerCase());

        const sender = isFromAgent ? "agent" : "user";

        // 6a) Find or create Lead for (agent_id, gmail_thread_id)
        let leadId: string | null = null;

        const { data: existingLead, error: leadSelErr } = await supabase
          .from("leads")
          .select("id")
          .eq("agent_id", conn.agent_id)
          .eq("gmail_thread_id", threadId)
          .maybeSingle();

        if (leadSelErr) {
          console.error("❌ Gmail Push: lead select failed", leadSelErr.message);
          continue;
        }

        if (existingLead?.id) {
          leadId = existingLead.id;

          // keep last_message_at current
          const { error: leadUpdErr } = await supabase
            .from("leads")
            .update({ last_message_at: timestampIso } as any)
            .eq("id", leadId);

          if (leadUpdErr) {
            console.error(
              "⚠️ Gmail Push: failed updating lead last_message_at",
              leadUpdErr.message
            );
          }
        } else {
          // Never create a lead from an outgoing (agent) email.
          // Outgoing messages should only be stored if we can already map them to an existing lead/thread.
          if (sender === "agent") {
            console.log(
              "↩️ Gmail Push: outgoing message without lead match - skipping lead creation",
              { threadId, gmailMessageId }
            );
            continue;
          }

          // Minimal insert; if your leads table has other NOT NULL cols without defaults,
          // this insert will fail and we need to adjust accordingly.
          const { data: newLead, error: leadInsErr } = await supabase
            .from("leads")
            .insert({
              agent_id: conn.agent_id,
              gmail_thread_id: threadId,
              last_message_at: timestampIso,
            } as any)
            .select("id")
            .single();

          if (leadInsErr) {
            console.error("❌ Gmail Push: lead insert failed", leadInsErr.message);
            continue;
          }

          leadId = newLead.id;
        }

        // If this is an outgoing message and it already exists, skip early
        if (sender === "agent") {
          const { data: existingMsg } = await supabase
            .from("messages")
            .select("id")
            .eq("gmail_message_id", gmailMessageId)
            .maybeSingle();

          if (existingMsg) {
            continue;
          }
        }

        // 6b) Upsert message (dedupe via gmail_message_id)
        const { error: msgUpsertErr } = await supabase
          .from("messages")
          .upsert(
            {
              lead_id: leadId,
              agent_id: conn.agent_id,
              // Determine sender: agent if message is from the connected Gmail account, else user
              sender,
              text: snippet,
              timestamp: timestampIso,

              gpt_score: null,
              was_followup: false,
              visible_to_agent: true,
              approval_required: false,

              snippet,
              history_id: String(h.id || historyId),
              email_address: emailAddress,
              status: "new",

              gmail_message_id: gmailMessageId,
              gmail_thread_id: threadId,
            } as any,
            { onConflict: "gmail_message_id" }
          );

        if (msgUpsertErr) {
          console.error("❌ Gmail Push: message upsert failed", msgUpsertErr.message);
          continue;
        }

        insertedMessageIds.push(gmailMessageId);
      }
    }

    console.log("✅ Inserted/Upserted Gmail messages", {
      count: insertedMessageIds.length,
      sample: insertedMessageIds.slice(0, 20),
    });

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

    // Always 200 to stop Pub/Sub retries
    return ok200();
  } catch (err: any) {
    console.error("💥 Gmail Push: Unhandled error", err?.message || err);
    // Still return 200 so Pub/Sub stops hammering you
    return ok200();
  }
}
