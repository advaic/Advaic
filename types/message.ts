export interface Message {
  id: string;
  lead_id: string;
  sender: "assistant" | "user";
  text: string;
  timestamp: string;
  gpt_score?: number | null;
  was_followup?: boolean | null;
  visible_to_agent?: boolean | null;
}
