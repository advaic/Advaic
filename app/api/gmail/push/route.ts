import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

export const runtime = "nodejs";

const client = new OAuth2Client();

// Set this in Vercel env to EXACTLY the Pub/Sub push audience you configured:
const EXPECTED_AUDIENCE = process.env.GMAIL_PUBSUB_PUSH_AUDIENCE!;

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer (.+)$/i);
  return m?.[1] || null;
}

export async function POST(req: Request) {
  try {
    // 1) Verify Pub/Sub OIDC JWT
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: EXPECTED_AUDIENCE,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    // Optional hardening: ensure token is from Google + has service account email
    // console.log("Push JWT payload:", payload);

    // 2) Parse Pub/Sub envelope
    const body = await req.json();

    const messageDataB64 = body?.message?.data;
    if (!messageDataB64) {
      return NextResponse.json({ ok: true, note: "No message data" });
    }

    const decoded = Buffer.from(messageDataB64, "base64").toString("utf8");
    const data = JSON.parse(decoded);

    // Gmail watch push format typically contains:
    // { emailAddress: "...", historyId: "..." }
    const emailAddress = data?.emailAddress;
    const historyId = data?.historyId;

    // 3) Minimal log + ACK
    console.log("📩 Gmail Push:", { emailAddress, historyId });

    // IMPORTANT: return 200 quickly. Do heavy work async (queue/db)
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Gmail push handler error:", err?.message || err);
    // If you return non-2xx, Pub/Sub retries.
    return NextResponse.json({ error: "Push handler failed" }, { status: 500 });
  }
}