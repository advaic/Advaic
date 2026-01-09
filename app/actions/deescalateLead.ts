// app/actions/deescalateLead.ts
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type DeescalateLeadResult =
  | { success: true }
  | { success: false; error: string };

export async function deescalateLead(leadId: string): Promise<DeescalateLeadResult> {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: async () => {}, // Optional: implement if you plan to modify cookies
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

  const { data, error } = await supabase
    .from("leads")
    .update({ escalated: false })
    .match({ id: leadId, agent_id: user.id })
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase update error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("✅ Lead deescalated:", data);
  revalidatePath("/nachrichten");
  return { success: true };
}