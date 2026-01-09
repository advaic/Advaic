import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";
import ZurFreigabeUI from "./ZurFreigabeUI";
import Link from "next/link";

export default async function ZurFreigabePage() {
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

  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      lead_id,
      text,
      sender,
      timestamp,
      visible_to_agent,
      approval_required,
      was_followup,
      gpt_score,
      leads (
        name
      )
      `
    )
    .eq("visible_to_agent", true)
    .eq("approval_required", true)
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Nachrichten zur Freigabe:", error);
    return <div>Fehler beim Laden der Nachrichten.</div>;
  }

  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    lead_id: msg.lead_id,
    text: msg.text ?? "",
    sender: msg.sender,
    timestamp: msg.timestamp ?? "",
    visible_to_agent: msg.visible_to_agent,
    approval_required: msg.approval_required,
    gpt_score: msg.gpt_score,
    was_followup: msg.was_followup,
    preview: msg.text?.slice(0, 50) ?? "",
    name: (msg.leads as { name?: string })?.name ?? "Unbekannter Interessent",
  }));

  return <ZurFreigabeUI messages={formattedMessages} />;
}
