// app/nachrichten/NachrichtenPageServer.tsx

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";
import NachrichtenPageClient from "./NachrichtenPageClient";
import Link from "next/link";

export default async function NachrichtenPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: async () => {},
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !session.user) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-lg font-medium text-gray-900">Nicht eingeloggt.</p>
            <p className="mt-2 text-sm text-gray-600">
              Bitte logge dich ein, um deine Nachrichten zu sehen.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/login"
                className="px-4 py-2 text-sm rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800"
              >
                Zum Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userId = session.user.id;

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .eq("agent_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Leads:", error.message);
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <NachrichtenPageClient leads={leads ?? []} userId={userId} />
      </div>
    </div>
  );
}
