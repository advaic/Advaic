import { Json } from "./supabase";

export type Document = {
  id: string;
  lead_id: string;
  document_type: string;
  gpt_score: "pass" | "warning" | "fail";
  gpt_summary: string | null;
  file_url: string;
  created_at: string;
  key_info_raw?: Json;
};
