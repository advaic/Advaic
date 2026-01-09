import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";
import EskalationenUI from "./EskalationenUI";
import Link from "next/link";

export default async function EskalationenPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !session.user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="mb-4 text-lg">Nicht eingeloggt.</p>
        <Link
          href="/login"
          className="px-4 py-2 text-white bg-black rounded hover:bg-gray-800"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  const userId = session.user.id;

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .eq("agent_id", userId)
    .eq("escalated", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der eskalierten Leads:", error.message);
  }

  return <EskalationenUI leads={leads ?? []} userId={userId} />;
}
