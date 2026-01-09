// supabase.ts or types/supabase.ts

export type KeyInfo = {
  name: string;
  birthdate: string;
  income_net: string;
  employer: string;
  schufa_score: string;
  negatives: string;
  contract_type: string;
  start_date: string;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          agent_id: string;
          created_at: string;
          updated_at: string;
          name: string;
          email: string;
          phone: string;
          type: "Kaufen" | "Mieten" | "FAQ";
          last_message: string;
          priority: "Hoch" | "Mittel" | "Niedrig";
          message_count: number;
          escalated: boolean;
          key_info?: string | null;
        };
        Insert: {
          agent_id: string;
          name: string;
          email: string;
          phone: string;
          type: "Kaufen" | "Mieten" | "FAQ";
          last_message: string;
          priority: "Hoch" | "Mittel" | "Niedrig";
          message_count?: number;
          escalated?: boolean;
          created_at?: string;
          updated_at?: string;
          key_info?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };

      agents: {
        Row: {
          id: string;
          email: string;
          name: string;
          company: string;
          tone_preference: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          company: string;
          tone_preference: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>;
      };

      messages: {
        Row: {
          id: string;
          lead_id: string;
          text: string;
          sender: "user" | "agent" | "system";
          timestamp: string;
          gpt_score?: number;
          was_followup?: boolean;
          visible_to_agent: boolean;
          approval_required?: boolean;
        };
        Insert: {
          id?: string;
          lead_id: string;
          text: string;
          sender: "user" | "agent" | "system";
          timestamp?: string;
          gpt_score?: number;
          was_followup?: boolean;
          visible_to_agent?: boolean;
          approval_required?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };

      properties: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          location: string;
          image_urls: string[];
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price?: number;
          location: string;
          image_urls?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };

      property_images: {
        Row: {
          id: string;
          property_id: string;
          url: string;
          order_index: number;
        };
        Insert: {
          property_id: string;
          url: string;
          order_index?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["property_images"]["Insert"]
        >;
      };

      documents: {
        Row: {
          id: string;
          lead_id: string;
          document_type: string;
          gpt_score?: string;
          gpt_summary?: string;
          file_url: string;
          created_at: string;
          key_info_raw?: Json;
        };
        Insert: {
          id?: string;
          lead_id: string;
          document_type: string;
          gpt_score?: string;
          gpt_summary?: string;
          file_url: string;
          created_at?: string;
          key_info_raw?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
    };
  };
};
