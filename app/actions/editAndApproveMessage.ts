"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function editAndApproveMessage(
  messageId: string,
  newText: string
) {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // no cookie mutation in server actions
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

  // Best-effort patch so UI + bulk logic stay stable even if schema evolves
  const patch: any = {
    text: newText,
    approval_required: false,
    status: "approved",
    approved_at: new Date().toISOString(),
    edited_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("messages")
    .update(patch)
    .eq("id", messageId)
    .eq("agent_id", user.id)
    .select("id, lead_id, text, approval_required, status")
    .maybeSingle();

  if (error) {
    console.error("❌ Failed to edit & approve message:", error.message);
    throw new Error(error.message);
  }

  console.log("✅ Message edited and approved:", messageId);

  // Revalidate correct dashboard path
  revalidatePath("/app/zur-freigabe");

  return {
    ok: true,
    message: data ?? { id: messageId, text: newText },
  };
}
