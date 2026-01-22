import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
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

  // Wichtig: agent_id filtern, sonst RLS/Leaking/Fehler
  const { data: rows, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      lead_id,
      agent_id,
      sender,
      text,
      timestamp,
      gpt_score,
      was_followup,
      visible_to_agent,
      approval_required,

      send_status,
      send_locked_at,
      send_error,
      sent_at,

      gmail_message_id,
      gmail_thread_id,
      snippet,
      email_type,
      classification_confidence,
      attachments,
      
      leads (
        name
      )
    `
    )
    .eq("agent_id", userId)
    .eq("visible_to_agent", true)
    .eq("approval_required", true)
    .in("sender", ["assistant", "system"])
    .in("send_status", ["pending", "failed"])
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Nachrichten zur Freigabe:", error);
    return (
      <div className="p-6">
        <div className="max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="font-semibold">
            Fehler beim Laden der Nachrichten.
          </div>
          <div className="mt-2 text-sm whitespace-pre-wrap">
            {error.message}
          </div>
        </div>
      </div>
    );
  }

  const messages: ApprovalMessage[] = (rows ?? []).map((msg: any) => ({
    id: String(msg.id),
    lead_id: String(msg.lead_id),
    agent_id: String(msg.agent_id),

    sender: msg.sender,
    text: msg.text ?? "",
    timestamp: msg.timestamp ?? new Date().toISOString(),

    visible_to_agent: !!msg.visible_to_agent,
    approval_required: !!msg.approval_required,

    send_status: msg.send_status ?? null,
    send_locked_at: msg.send_locked_at ?? null,
    send_error: msg.send_error ?? null,
    sent_at: msg.sent_at ?? null,

    was_followup: msg.was_followup ?? null,
    gpt_score: msg.gpt_score ?? null,

    gmail_message_id: msg.gmail_message_id ?? null,
    gmail_thread_id: msg.gmail_thread_id ?? null,
    snippet: msg.snippet ?? null,
    email_type: msg.email_type ?? null,
    classification_confidence: msg.classification_confidence ?? null,

    attachments: msg.attachments ?? null,

    lead_name: (msg.leads as any)?.name ?? "Unbekannter Interessent",
  }));

  return <ZurFreigabeUI messages={messages} />;
}
