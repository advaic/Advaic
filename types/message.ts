export interface Message {
  id: string;
  lead_id: string;

  // Sender / content
  sender: "assistant" | "user" | "agent";
  text: string;
  timestamp: string;

  // Agent / approval workflow
  agent_id?: string | null;
  approval_required?: boolean | null;
  visible_to_agent?: boolean | null;
  was_followup?: boolean | null;
  status?: "draft" | "approved" | "sent" | "failed" | "pending" | string | null;

  // GPT / AI metadata
  gpt_score?: number | null;
  snippet?: string | null;
  history_id?: string | number | null;

  // Email / Gmail
  email_address?: string | null;
  gmail_thread_id?: string | null;
  gmail_message_id?: string | null;

  // Attachments (stored in Supabase Storage)
  attachments?: Array<{
    bucket: string;
    path: string;
    name: string;
    mime: string;
    size?: number;
  }> | null;

  // System
  created_at?: string;
  updated_at?: string;
}
