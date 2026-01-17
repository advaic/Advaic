"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function supabaseAdmin() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function rejectMessage(messageId: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: async () => {}, // no-op
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "❌ rejectMessage: getUser failed:",
      userError?.message || "No user"
    );
    throw new Error("Nicht eingeloggt");
  }

  const nowIso = new Date().toISOString();

  // Load message for gmail ids (so we can cleanup ingestion rows)
  const { data: msgRow, error: msgRowErr } = await supabase
    .from("messages")
    .select("id, agent_id, gmail_message_id, gmail_thread_id")
    .eq("id", messageId)
    .eq("agent_id", user.id)
    .maybeSingle();

  if (msgRowErr) {
    console.error("❌ rejectMessage: load message failed:", msgRowErr.message);
    throw new Error(msgRowErr.message);
  }
  if (!msgRow) throw new Error("Nachricht nicht gefunden");

  const gmailMessageId = (msgRow as any).gmail_message_id as
    | string
    | null
    | undefined;

  // Update message reject state
  const patch: any = {
    approval_required: false,
    status: "rejected",
    rejected_at: nowIso,
    // optional:
    approved_at: null,
  };

  const { data, error } = await supabase
    .from("messages")
    .update(patch)
    .eq("id", messageId)
    .eq("agent_id", user.id)
    .select("id, lead_id, approval_required, status")
    .maybeSingle();

  if (error) {
    console.error("❌ rejectMessage: update failed:", error.message);
    throw new Error(error.message);
  }

  // Best-effort cleanup of ingestion tables + storage
  if (gmailMessageId) {
    // 1) Try to fetch attachment paths before deleting (so we can delete storage objects)
    let attachmentPathsByBucket: Record<string, string[]> = {};

    try {
      const { data: atts, error: attSelErr } = await supabase
        .from("email_attachments" as any)
        .select("bucket, storage_path, path")
        .eq("agent_id", user.id)
        .eq("gmail_message_id", gmailMessageId);

      if (!attSelErr && Array.isArray(atts)) {
        for (const a of atts as any[]) {
          const bucket = String(a.bucket || "attachments");
          const p = String(a.storage_path || a.path || "").trim();
          if (!p) continue;
          attachmentPathsByBucket[bucket] =
            attachmentPathsByBucket[bucket] || [];
          attachmentPathsByBucket[bucket].push(p);
        }
      }
    } catch (e: any) {
      console.warn(
        "⚠️ rejectMessage: attachment select threw:",
        e?.message || e
      );
    }

    // 2) Delete ingestion rows (bodies + attachments). If you prefer “mark rejected” instead, say so.
    try {
      const { error: bodyDelErr } = await supabase
        .from("email_message_bodies" as any)
        .delete()
        .eq("agent_id", user.id)
        .eq("gmail_message_id", gmailMessageId);

      if (bodyDelErr)
        console.warn(
          "⚠️ rejectMessage: email_message_bodies delete failed:",
          bodyDelErr.message
        );
    } catch (e: any) {
      console.warn(
        "⚠️ rejectMessage: email_message_bodies delete threw:",
        e?.message || e
      );
    }

    try {
      const { error: attDelErr } = await supabase
        .from("email_attachments" as any)
        .delete()
        .eq("agent_id", user.id)
        .eq("gmail_message_id", gmailMessageId);

      if (attDelErr)
        console.warn(
          "⚠️ rejectMessage: email_attachments delete failed:",
          attDelErr.message
        );
    } catch (e: any) {
      console.warn(
        "⚠️ rejectMessage: email_attachments delete threw:",
        e?.message || e
      );
    }

    // 3) Best-effort delete storage objects (service role)
    try {
      const admin = supabaseAdmin();
      const buckets = Object.keys(attachmentPathsByBucket);

      for (const b of buckets) {
        const paths = attachmentPathsByBucket[b] || [];
        if (paths.length === 0) continue;

        const { error: rmErr } = await admin.storage.from(b).remove(paths);
        if (rmErr)
          console.warn(
            "⚠️ rejectMessage: storage remove failed:",
            b,
            rmErr.message
          );
      }
    } catch (e: any) {
      console.warn("⚠️ rejectMessage: storage remove threw:", e?.message || e);
    }
  }

  revalidatePath("/app/zur-freigabe");

  return { ok: true, message: data ?? { id: messageId } };
}
