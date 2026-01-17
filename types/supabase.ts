export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

// NOTE:
// This file is a *local* Supabase type shim used across the app.
// It does not need to be perfectly exhaustive, but it MUST include
// the tables/columns the code reads (otherwise TS infers `never`).
//
// We therefore model the schema with the fields we actively use,
// and keep non-essential/unknown fields optional.

export type Database = {
  public: {
    Tables: {
      // --------------------
      // AUTH / AGENTS
      // --------------------
      agents: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          company: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          company?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>;
      };

      agent_style: {
        Row: {
          agent_id: string;
          brand_name: string | null;
          language: string | null;
          tone: string | null;
          formality: string | null;
          length_pref: string | null;
          emoji_level: string | null;
          sign_off: string | null;
          do_rules: string | null;
          dont_rules: string | null;
          example_phrases: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          agent_id: string;
          brand_name?: string | null;
          language?: string | null;
          tone?: string | null;
          formality?: string | null;
          length_pref?: string | null;
          emoji_level?: string | null;
          sign_off?: string | null;
          do_rules?: string | null;
          dont_rules?: string | null;
          example_phrases?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_style"]["Insert"]>;
      };

      // --------------------
      // CRM / LEADS + MESSAGES
      // --------------------
      leads: {
        Row: {
          id: string;
          agent_id: string;
          created_at: string | null;
          updated_at: string | null;

          // Contact/profile fields
          name: string | null;
          email: string | null;
          phone: string | null;

          // Sorting / inbox
          last_message_at: string | null;
          last_message: string | null;

          // Gmail mapping
          gmail_thread_id: string | null;

          // Anything else you might store
          status: string | null;
          priority: string | null;
          message_count: number | null;
          escalated: boolean | null;

          // Free-form
          meta: Json | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          created_at?: string | null;
          updated_at?: string | null;

          name?: string | null;
          email?: string | null;
          phone?: string | null;

          last_message_at?: string | null;
          last_message?: string | null;

          gmail_thread_id?: string | null;

          status?: string | null;
          priority?: string | null;
          message_count?: number | null;
          escalated?: boolean | null;

          meta?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };

      messages: {
        Row: {
          id: string;
          lead_id: string;
          agent_id: string | null;
          sender: "user" | "agent" | "assistant" | "system";
          text: string;
          timestamp: string | null;

          // QA / flags
          gpt_score: number | null;
          was_followup: boolean | null;
          visible_to_agent: boolean | null;
          approval_required: boolean | null;

          // Gmail metadata
          gmail_message_id: string | null;
          gmail_thread_id: string | null;
          snippet: string | null;
          history_id: string | null;
          email_address: string | null;
          status: string | null;

          // Classification (optional)
          email_type: string | null;
          classification_confidence: number | null;

          // Attachments
          attachments: Json | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          agent_id?: string | null;
          sender: "user" | "agent" | "assistant" | "system";
          text: string;
          timestamp?: string | null;

          gpt_score?: number | null;
          was_followup?: boolean | null;
          visible_to_agent?: boolean | null;
          approval_required?: boolean | null;

          gmail_message_id?: string | null;
          gmail_thread_id?: string | null;
          snippet?: string | null;
          history_id?: string | null;
          email_address?: string | null;
          status?: string | null;

          email_type?: string | null;
          classification_confidence?: number | null;

          attachments?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };

      // --------------------
      // PROPERTIES
      // --------------------
      properties: {
        Row: {
          id: string;
          agent_id: string | null;
          created_at: string | null;
          updated_at: string | null;

          // Main fields used across hinzufügen/bearbeiten/detail
          city: string | null;
          neighbourhood: string | null;
          street_address: string | null;
          type: string | null;
          price: number | null;
          price_type: string | null;
          rooms: number | null;
          size_sqm: number | null;
          floor: number | null;
          year_built: number | null;
          furnished: boolean | null;
          pets_allowed: boolean | null;
          heating: string | null;
          energy_label: string | null;
          available_from: string | null;
          elevator: boolean | null;
          parking: string | null;
          listing_summary: string | null;
          description: string | null;
          uri: string | null;

          // Images are stored as storage paths/urls
          image_urls: string[] | null;

          // Status/publishing
          status: string | null;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;

          city?: string | null;
          neighbourhood?: string | null;
          street_address?: string | null;
          type?: string | null;
          price?: number | null;
          price_type?: string | null;
          rooms?: number | null;
          size_sqm?: number | null;
          floor?: number | null;
          year_built?: number | null;
          furnished?: boolean | null;
          pets_allowed?: boolean | null;
          heating?: string | null;
          energy_label?: string | null;
          available_from?: string | null;
          elevator?: boolean | null;
          parking?: string | null;
          listing_summary?: string | null;
          description?: string | null;
          uri?: string | null;

          image_urls?: string[] | null;

          status?: string | null;
          published_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };

      // --------------------
      // RESPONSE TEMPLATES
      // --------------------
      response_templates: {
        Row: {
          id: string;
          agent_id: string;
          title: string | null;
          content: string | null;
          category: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          title?: string | null;
          content?: string | null;
          category?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["response_templates"]["Insert"]>;
      };

      // --------------------
      // AI PROMPT REGISTRY
      // --------------------
      ai_prompts: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          model: string | null;
          version: number | null;
          prompt: string;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          model?: string | null;
          version?: number | null;
          prompt: string;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ai_prompts"]["Insert"]>;
      };

      // --------------------
      // EMAIL CONNECTIONS (GMAIL OAUTH)
      // --------------------
      email_connections: {
        Row: {
          id: string;
          agent_id: string;
          provider: string | null; // "gmail" etc
          email_address: string;

          access_token: string | null;
          refresh_token: string | null;

          last_history_id: string | null;
          status: string | null;

          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          provider?: string | null;
          email_address: string;

          access_token?: string | null;
          refresh_token?: string | null;

          last_history_id?: string | null;
          status?: string | null;

          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["email_connections"]["Insert"]>;
      };

      // Optional: store classification decisions (so you can audit/undo)
      email_classifications: {
        Row: {
          id: string;
          agent_id: string;
          email_address: string | null;
          gmail_message_id: string | null;
          gmail_thread_id: string | null;
          decision: string | null; // "lead" | "ignore" | "uncertain"
          confidence: number | null;
          reasons: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          email_address?: string | null;
          gmail_message_id?: string | null;
          gmail_thread_id?: string | null;
          decision?: string | null;
          confidence?: number | null;
          reasons?: Json | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["email_classifications"]["Insert"]>;
      };
    };
  };
};
