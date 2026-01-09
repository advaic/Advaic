import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "types/supabase";
import StartseiteUI from "./StartseiteUI";

export default async function StartseitePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: async () => {}, // if needed later, handle setting cookies
      },
    }
  );

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("❌ Error loading leads:", error.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <StartseiteUI leads={leads ?? []} userId={user?.id ?? ""} />;
}
