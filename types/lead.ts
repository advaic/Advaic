import { Document } from './document';

export type Lead = {
  id: string;
  agent_id: string;
  created_at: string;
  email?: string;
  escalated: boolean;
  last_message: string;
  message_count: number;
  name?: string;
  phone?: string;
  priority: "Hoch" | "Mittel" | "Niedrig";
  type: "Kaufen" | "Mieten" | "FAQ";
  updated_at: string;
  key_info?: string;
  documents?: Document[];
};
