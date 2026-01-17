import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";
import ZurFreigabeUI, { type ApprovalMessage } from "./ZurFreigabeUI";
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
      agent_id,
      lead_id,
      text,
      sender,
      timestamp,
      visible_to_agent,
      approval_required,
      was_followup,
      gpt_score,
      attachments_meta,
      gmail_message_id,
      gmail_thread_id,
      snippet,
      email_type,
      classification_confidence,
      leads (
        name
      )
      `
    )
    // 🔒 Wichtig: nur die Messages des eingeloggten Agents
    .eq("agent_id", userId)
    .eq("visible_to_agent", true)
    .eq("approval_required", true)
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Nachrichten zur Freigabe:", error);
    return <div>Fehler beim Laden der Nachrichten.</div>;
  }

  const formattedMessages: ApprovalMessage[] = (messages ?? []).map(
    (msg: any) => ({
      id: String(msg.id),
      lead_id: String(msg.lead_id),
      agent_id: String(msg.agent_id),

      text: String(msg.text ?? ""),
      sender: msg.sender,
      timestamp: String(msg.timestamp ?? ""),

      visible_to_agent: Boolean(msg.visible_to_agent),
      approval_required: Boolean(msg.approval_required),
      was_followup: msg.was_followup ?? null,
      gpt_score: msg.gpt_score ?? null,

      // optional meta used for attachment previews
      attachments_meta: msg.attachments_meta ?? null,

      gmail_message_id: msg.gmail_message_id ?? null,
      gmail_thread_id: msg.gmail_thread_id ?? null,
      snippet: msg.snippet ?? null,

      email_type: msg.email_type ?? null,
      classification_confidence: msg.classification_confidence ?? null,

      // UI label (safe fallback)
      lead_name:
        (msg.leads as { name?: string } | null)?.name ??
        "Unbekannter Interessent",
    })
  );

  return <ZurFreigabeUI messages={formattedMessages} />;
}
