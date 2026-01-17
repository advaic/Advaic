"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function approveMessage(messageId: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // We don’t set cookies inside server actions for this flow.
        setAll: async () => {},
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("❌ getUser failed:", userError?.message || "No user found");
    throw new Error("Nicht eingeloggt");
  }

  // Get current timestamp once
  const nowIso = new Date().toISOString();

  // Fetch the message so we can link to Gmail entities
  const { data: msgRow, error: msgRowErr } = await supabase
    .from("messages")
    .select("id, agent_id, gmail_message_id, gmail_thread_id")
    .eq("id", messageId)
    .eq("agent_id", user.id)
    .maybeSingle();

  if (msgRowErr) {
    console.error("❌ Failed to load message before approving:", msgRowErr.message);
    throw new Error(msgRowErr.message);
  }

  if (!msgRow) {
    throw new Error("Nachricht nicht gefunden");
  }

  const gmailMessageId = (msgRow as any).gmail_message_id as string | null | undefined;
  const gmailThreadId = (msgRow as any).gmail_thread_id as string | null | undefined;

  // Best-effort update. Some columns may not exist on your table yet.
  // Using `as any` avoids TS getting in the way while keeping runtime behavior.
  const patch: any = {
    approval_required: false,
    status: "approved",
    approved_at: nowIso,
  };

  const { data, error } = await supabase
    .from("messages")
    .update(patch)
    .eq("id", messageId)
    .eq("agent_id", user.id)
    .select("id, lead_id, approval_required, status")
    .maybeSingle();

  if (error) {
    console.error("❌ Failed to approve message:", error.message);
    throw new Error(error.message);
  }

  // Best-effort: mirror approval state into Gmail ingestion tables (if you created them).
  // This must NOT block approval if those tables/columns are not present yet.
  if (gmailMessageId) {
    const mirrorPatch: any = {
      needs_approval: false,
      approval_required: false,
      status: "approved",
      approved_at: nowIso,
    };

    try {
      const { error: bodyErr } = await supabase
        .from("email_message_bodies" as any)
        .update(mirrorPatch)
        .eq("agent_id", user.id)
        .eq("gmail_message_id", gmailMessageId);

      if (bodyErr) {
        console.warn("⚠️ email_message_bodies mirror update failed:", bodyErr.message);
      }
    } catch (e: any) {
      console.warn("⚠️ email_message_bodies mirror update threw:", e?.message || e);
    }

    try {
      const { error: attErr } = await supabase
        .from("email_attachments" as any)
        .update(mirrorPatch)
        .eq("agent_id", user.id)
        .eq("gmail_message_id", gmailMessageId);

      if (attErr) {
        console.warn("⚠️ email_attachments mirror update failed:", attErr.message);
      }
    } catch (e: any) {
      console.warn("⚠️ email_attachments mirror update threw:", e?.message || e);
    }
  }

  // Optional: if you store anything at thread level later
  void gmailThreadId;

  console.log("✅ Message approved:", messageId);

  // Revalidate the dashboard route (your app lives under /app)
  revalidatePath("/app/zur-freigabe");

  return {
    ok: true,
    message: data ?? { id: messageId },
  };
}
