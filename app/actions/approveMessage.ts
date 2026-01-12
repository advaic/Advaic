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

  // Best-effort update. Some columns may not exist on your table yet.
  // Using `as any` avoids TS getting in the way while keeping runtime behavior.
  const patch: any = {
    approval_required: false,
    status: "approved",
    approved_at: new Date().toISOString(),
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

  console.log("✅ Message approved:", messageId);

  // Revalidate the dashboard route (your app lives under /app)
  revalidatePath("/app/zur-freigabe");

  return {
    ok: true,
    message: data ?? { id: messageId },
  };
}
