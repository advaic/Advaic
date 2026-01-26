import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  action?: "approve" | "reject";
  // New (preferred): our internal message row id
  message_id?: string;
  // Backward-compat (legacy): gmail_message_id
  gmail_message_id?: string;
};

function jsonError(message: string, status: number, extra?: Record<string, any>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status });
}

function supabaseAdminDb() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// NOTE: Supabase Storage typing + generated Database types can infer bucket as `never`.
// Use an untyped client for storage operations.
function supabaseAdminStorage() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function buildSubject(lead: any) {
  const s = lead?.subject || lead?.type || "Anfrage";
  return `Re: ${String(s).slice(0, 140)}`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;

  const action = body?.action;
  const messageId = String(body?.message_id || "").trim();
  const gmailMessageId = String(body?.gmail_message_id || "").trim();

  if (!action || (action !== "approve" && action !== "reject")) {
    return jsonError("Missing/invalid action", 400);
  }

  // We support either message_id (preferred) or gmail_message_id (legacy)
  if (!messageId && !gmailMessageId) {
    return jsonError("Missing message_id or gmail_message_id", 400);
  }

  // Auth via cookie session (agent must be logged in)
  const supabaseAuth = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        // No-op: this endpoint should not mutate auth cookies
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
    error: authErr,
  } = await supabaseAuth.auth.getUser();

  if (authErr || !user) return jsonError("Unauthorized", 401);

  const admin = supabaseAdminDb();
  const adminStorage = supabaseAdminStorage();

  // Load message to verify ownership + get lead_id
  // Prefer message_id (current system); fallback to gmail_message_id (legacy)
  const msgQuery = admin
    .from("messages")
    .select(
      "id, agent_id, lead_id, gmail_message_id, status, approval_required, send_status, text"
    );

  const { data: msg, error: msgErr } = messageId
    ? await (msgQuery as any).eq("id", messageId).maybeSingle()
    : await (msgQuery as any).eq("gmail_message_id", gmailMessageId).maybeSingle();

  if (msgErr) return jsonError(msgErr.message, 400);
  if (!msg) return jsonError("Message not found", 404);

  if (String((msg as any).agent_id) !== String(user.id)) {
    return jsonError("Forbidden", 403);
  }

  const leadId = String((msg as any).lead_id || "").trim();
  if (!leadId) return jsonError("Message has no lead_id", 400);

  if (action === "approve") {
    // We approve by sending through the idempotent send route.
    // This keeps all lock/idempotency rules centralized.

    // Load lead data needed for send payload
    const { data: lead, error: leadErr } = await (admin as any)
      .from("leads")
      .select("id, agent_id, email, gmail_thread_id, subject, type")
      .eq("id", leadId)
      .maybeSingle();

    if (leadErr) return jsonError(leadErr.message, 400);
    if (!lead?.email) return jsonError("Lead has no email", 400);

    const origin = req.nextUrl.origin;
    const sendUrl = new URL("/api/gmail/send", origin).toString();

    const res = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Use cookie auth (same browser session) — do NOT use internal secret here.
      },
      body: JSON.stringify({
        id: String((msg as any).id),
        lead_id: String(lead.id),
        gmail_thread_id: lead.gmail_thread_id ?? null,
        to: String(lead.email),
        subject: buildSubject(lead),
        text: String((msg as any).text || "").trim(),
      }),
    });

    const data = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      return jsonError(String(data?.error || "Failed to send"), res.status, data);
    }

    return NextResponse.json({ ok: true, action: "approve", send: data }, { status: 200 });
  }

  // --- reject ---
  const gmIdForCleanup = String((msg as any).gmail_message_id || "").trim();

  // 1) load attachments for storage cleanup
  const { data: atts, error: attErr } = gmIdForCleanup
    ? await admin
        .from("email_attachments")
        .select(
          "id, storage_bucket, storage_path, agent_id, lead_id, gmail_message_id"
        )
        .eq("gmail_message_id", gmIdForCleanup)
    : ({ data: [], error: null } as any);

  if (attErr) return jsonError(attErr.message, 400);

  const byBucket = new Map<string, string[]>();
  for (const a of (atts || []) as any[]) {
    const b = String(a?.storage_bucket || "").trim();
    const p = String(a?.storage_path || "").trim();
    if (!b || !p) continue;
    const arr = byBucket.get(b) || [];
    arr.push(p);
    byBucket.set(b, arr);
  }

  // Some Supabase TS setups infer `bucket`/`paths` as `never`. Use `any` for storage ops.
  const storageAny = (adminStorage as any).storage;

  for (const [bucket, paths] of byBucket.entries()) {
    if (!paths.length) continue;

    const { error } = await storageAny.from(bucket).remove(paths);

    if (error) {
      // Best-effort: we still proceed with DB cleanup
      console.warn("⚠️ Storage remove failed", { bucket, err: error.message });
    }
  }

  if (gmIdForCleanup) {
    const { error: delAttRowsErr } = await (admin as any)
      .from("email_attachments")
      .delete()
      .eq("gmail_message_id", gmIdForCleanup);

    if (delAttRowsErr) return jsonError(delAttRowsErr.message, 400);
  }

  if (gmIdForCleanup) {
    const { error: delBodyErr } = await (admin as any)
      .from("email_message_bodies")
      .delete()
      .eq("gmail_message_id", gmIdForCleanup);

    if (delBodyErr) return jsonError(delBodyErr.message, 400);
  }

  const { error: updErr } = await (admin as any)
    .from("messages")
    .update({
      status: "ignored",
      approval_required: false,
      // Ensure it won't ever send
      send_status: "failed",
      send_error: "rejected_by_agent",
      visible_to_agent: true,
    })
    .eq("id", String((msg as any).id));

  if (updErr) return jsonError(updErr.message, 400);

  return NextResponse.json(
    { ok: true, action: "reject", deleted_attachments: (atts || []).length },
    { status: 200 }
  );
}
