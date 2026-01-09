"use server";

import { supabase } from "@/lib/supabaseClient";
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

  const { error } = await supabase
    .from("messages")
    .update({ text: newText, approval_required: false })
    .eq("id", messageId)
    .eq("agent_id", user.id);

  if (error) {
    console.error("❌ Failed to update and approve message:", error.message);
    throw new Error(error.message);
  }

  console.log("✅ Message edited and approved:", messageId);
  revalidatePath("/zur-freigabe");
}
