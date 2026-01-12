"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
    console.error("❌ getUser failed:", userError?.message || "No user found");
    throw new Error("Nicht eingeloggt");
  }

  // Best-effort patch. Some columns may not exist on your table yet.
  const patch: any = {
    approval_required: false,
    status: "rejected",
    rejected_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("messages")
    .update(patch)
    .eq("id", messageId)
    .eq("agent_id", user.id)
    .select("id, lead_id, approval_required, status")
    .maybeSingle();

  if (error) {
    console.error("❌ Failed to reject message:", error.message);
    throw new Error(error.message);
  }

  console.log("✅ Message rejected:", messageId);

  // Revalidate correct dashboard path
  revalidatePath("/app/zur-freigabe");

  return {
    ok: true,
    message: data ?? { id: messageId },
  };
}
