"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function editAndApproveMessage(messageId: string, newText: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // no cookie mutation in server actions
      setAll: async () => {},
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("❌ editAndApproveMessage: getUser failed:", userError?.message || "No user found");
    throw new Error("Nicht eingeloggt");
  }

  const nextText = String(newText ?? "").trim();
  if (!nextText) {
    throw new Error("Text darf nicht leer sein.");
  }

  const nowIso = new Date().toISOString();

  // Load message for Gmail IDs so we can mirror approval state into ingestion tables (best-effort)
  const { data: msgRow, error: msgRowErr } = await supabase
    .from("messages")
    .select("id, agent_id, gmail_message_id, gmail_thread_id")
    .eq("id", messageId)
    .eq("agent_id", user.id)
    .maybeSingle();

  if (msgRowErr) {
    console.error("❌ editAndApproveMessage: failed to load message:", msgRowErr.message);
    throw new Error(msgRowErr.message);
  }

  if (!msgRow) {
    throw new Error("Nachricht nicht gefunden");
  }

  const gmailMessageId = (msgRow as any).gmail_message_id as string | null | undefined;

  // Best-effort patch so UI + bulk logic stay stable even if schema evolves
  const patch: any = {
    text: nextText,
    approval_required: false,
    status: "approved",
    approved_at: nowIso,
    edited_at: nowIso,
    // optional (safe even if column doesn't exist thanks to `any`):
    rejected_at: null,
  };

  const { data, error } = await supabase
    .from("messages")
    .update(patch)
    .eq("id", messageId)
    .eq("agent_id", user.id)
    .select("id, lead_id, text, approval_required, status")
    .maybeSingle();

  if (error) {
    console.error("❌ editAndApproveMessage: update failed:", error.message);
    throw new Error(error.message);
  }

  // Best-effort: mirror into Gmail ingestion tables if they exist.
  // This MUST NOT block the edit+approve flow.
  if (gmailMessageId) {
    const mirrorPatch: any = {
      needs_approval: false,
      approval_required: false,
      status: "approved",
      approved_at: nowIso,
      edited_at: nowIso,
      rejected_at: null,
      // optionally store the final outgoing text if your table supports it
      approved_text: nextText,
    };

    try {
      const { error: bodyErr } = await supabase
        .from("email_message_bodies" as any)
        .update(mirrorPatch)
        .eq("agent_id", user.id)
        .eq("gmail_message_id", gmailMessageId);

      if (bodyErr) {
        console.warn("⚠️ editAndApproveMessage: email_message_bodies mirror update failed:", bodyErr.message);
      }
    } catch (e: any) {
      console.warn("⚠️ editAndApproveMessage: email_message_bodies mirror update threw:", e?.message || e);
    }

    try {
      const { error: attErr } = await supabase
        .from("email_attachments" as any)
        .update(mirrorPatch)
        .eq("agent_id", user.id)
        .eq("gmail_message_id", gmailMessageId);

      if (attErr) {
        console.warn("⚠️ editAndApproveMessage: email_attachments mirror update failed:", attErr.message);
      }
    } catch (e: any) {
      console.warn("⚠️ editAndApproveMessage: email_attachments mirror update threw:", e?.message || e);
    }
  }

  console.log("✅ Message edited and approved:", messageId);

  // Revalidate correct dashboard path
  revalidatePath("/app/zur-freigabe");

  return {
    ok: true,
    message: data ?? { id: messageId, text: nextText },
  };
}
