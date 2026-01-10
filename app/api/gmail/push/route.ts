import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { createServerClient } from "@supabase/ssr";
import { google } from "googleapis";
import { cookies } from "next/headers";

// Setup Google OAuth2 Client
const oauth2Client = new OAuth2Client();

// Get the Bearer token from the request headers
function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer (.+)$/i);
  return match ? match[1] : null;
}

export const runtime = "nodejs";

async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
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

export async function POST(req: Request) {
  try {
    // 1. Verify the Pub/Sub JWT token from the header
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Missing Bearer token" },
        { status: 401 }
      );
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GMAIL_PUBSUB_PUSH_AUDIENCE, // Should match what we set in Pub/Sub Subscription
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid JWT payload" },
        { status: 401 }
      );
    }

    // 2. Parse the Pub/Sub message (base64-decoded)
    const body = await req.json();
    const messageDataB64 = body?.message?.data;
    if (!messageDataB64) {
      return NextResponse.json(
        { error: "No message data in request" },
        { status: 400 }
      );
    }

    const decodedData = Buffer.from(messageDataB64, "base64").toString("utf8");
    const data = JSON.parse(decodedData);

    const emailAddress = data?.emailAddress;
    const historyId = data?.historyId;

    if (!emailAddress || !historyId) {
      return NextResponse.json(
        { error: "Missing emailAddress or historyId" },
        { status: 400 }
      );
    }

    // 3. Fetch the user's email connection details from Supabase
    const supabase = await supabaseServer();
    const { data: conn, error: connErr } = await supabase
      .from("email_connections")
      .select("*")
      .eq("email_address", emailAddress)
      .single();

    if (connErr || !conn) {
      return NextResponse.json(
        { error: "User Gmail connection not found" },
        { status: 400 }
      );
    }

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

    // Fetch the history from Gmail using the historyId
    const historyRes = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId,
      historyTypes: ["messageAdded", "messageModified"],
    });

    // Process each message from the history
    const newMessages = historyRes.data.history || [];
    for (const history of newMessages) {
      const messages = history.messages || [];
      for (const message of messages) {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: message.id!,
        });

        // Insert the message into Supabase
        await supabase.from("messages").upsert({
          lead_id: conn.agent_id,
          sender: msg.data.payload.headers?.find((h) => h.name === "From")
            ?.value,
          text: msg.data.snippet,
          timestamp: new Date(msg.data.internalDate),
          gpt_score: "", // Add GPT score logic if needed
          was_followup: false, // Set based on your application logic
          visible_to_agent: true, // You can update this based on your needs
          approval_required: false, // Set this based on your needs
          agent_id: conn.agent_id,
          snippet: msg.data.snippet,
          history_id: historyId,
          email_address: emailAddress,
          status: "new", // You can add logic to determine status
        });

        console.log(`Inserted new message with ID: ${msg.data.id}`);
      }
    }

    // Respond with success
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gmail Push error:", error);
    return NextResponse.json(
      { error: "Failed to process push" },
      { status: 500 }
    );
  }
}
