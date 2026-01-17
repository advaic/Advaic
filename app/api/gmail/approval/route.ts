import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  action?: "approve" | "reject";
  gmail_message_id?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
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

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;

  const action = body?.action;
  const gmailMessageId = String(body?.gmail_message_id || "").trim();

  if (!action || (action !== "approve" && action !== "reject")) {
    return jsonError("Missing/invalid action", 400);
  }
  if (!gmailMessageId) {
    return jsonError("Missing gmail_message_id", 400);
  }

  // Auth via cookie session (agent must be logged in)
  const res = NextResponse.next();
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

  if (authErr || !user) return jsonError("Unauthorized", 401);

  const admin = supabaseAdminDb();
  const adminStorage = supabaseAdminStorage();

  // Load message to verify ownership + get lead_id
  const { data: msg, error: msgErr } = await admin
    .from("messages")
    .select(
      "id, agent_id, lead_id, gmail_message_id, status, approval_required"
    )
    .eq("gmail_message_id", gmailMessageId)
    .maybeSingle();

  if (msgErr) return jsonError(msgErr.message, 400);
  if (!msg) return jsonError("Message not found", 404);

  if (String((msg as any).agent_id) !== String(user.id)) {
    return jsonError("Forbidden", 403);
  }

  const leadId = String((msg as any).lead_id || "").trim();
  if (!leadId) return jsonError("Message has no lead_id", 400);

  if (action === "approve") {
    // Mark as ready for sending pipeline (you will decide when to actually send)
    const { error: updErr } = await (admin as any)
      .from("messages")
      .update({
        status: "ready",
        approval_required: false,
      })
      .eq("gmail_message_id", gmailMessageId);

    if (updErr) return jsonError(updErr.message, 400);

    return NextResponse.json({ ok: true, action: "approve" }, { status: 200 });
  }

  // --- reject ---
  // 1) load attachments for storage cleanup
  const { data: atts, error: attErr } = await admin
    .from("email_attachments")
    .select(
      "id, storage_bucket, storage_path, agent_id, lead_id, gmail_message_id"
    )
    .eq("gmail_message_id", gmailMessageId);

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

  // 3) delete attachment rows
  const { error: delAttRowsErr } = await (admin as any)
    .from("email_attachments")
    .delete()
    .eq("gmail_message_id", gmailMessageId);

  if (delAttRowsErr) return jsonError(delAttRowsErr.message, 400);

  // 4) delete body row
  const { error: delBodyErr } = await (admin as any)
    .from("email_message_bodies")
    .delete()
    .eq("gmail_message_id", gmailMessageId);

  if (delBodyErr) return jsonError(delBodyErr.message, 400);

  // 5) mark message as rejected (so it never sends and you can hide it in UI)
  const { error: updErr } = await (admin as any)
    .from("messages")
    .update({
      status: "rejected",
      approval_required: false,
      visible_to_agent: true,
    })
    .eq("gmail_message_id", gmailMessageId);

  if (updErr) return jsonError(updErr.message, 400);

  return NextResponse.json(
    { ok: true, action: "reject", deleted_attachments: (atts || []).length },
    { status: 200 }
  );
}
