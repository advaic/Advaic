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

      agent_settings: {
        Row: {
          id: string;
          agent_id: string | null;
          email_connected: boolean | null;
          email_filter_active: boolean | null;
          custom_tone: string | null;
          text_library_enabled: boolean | null;
          onboarding_completed: boolean | null;
          calendar_connected: boolean | null;
          created_at: string | null;

          reply_mode: "approval" | "auto" | string;
          auto_send_min_confidence: number | null;
          autosend_enabled: boolean | null;
        };
        Insert: {
          id?: string;
          agent_id?: string | null;
          email_connected?: boolean | null;
          email_filter_active?: boolean | null;
          custom_tone?: string | null;
          text_library_enabled?: boolean | null;
          onboarding_completed?: boolean | null;
          calendar_connected?: boolean | null;
          created_at?: string | null;

          reply_mode?: "approval" | "auto" | string;
          auto_send_min_confidence?: number | null;
          autosend_enabled?: boolean | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_settings"]["Insert"]>;
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

          name: string | null;
          email: string | null;
          phone: string | null;

          last_message_at: string | null;
          last_message: string | null;

          gmail_thread_id: string | null;

          status: string | null;
          priority: string | null;
          message_count: number | null;
          escalated: boolean | null;

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

          gpt_score: number | null;
          was_followup: boolean | null;
          visible_to_agent: boolean | null;
          approval_required: boolean | null;

          gmail_message_id: string | null;
          gmail_thread_id: string | null;
          snippet: string | null;
          history_id: string | null;
          email_address: string | null;
          status: string | null;

          email_type: string | null;
          classification_confidence: number | null;
          classification_reason: string | null;

          send_status: "pending" | "sending" | "sent" | "failed" | null;
          send_locked_at: string | null;
          send_error: string | null;
          sent_at: string | null;

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
          classification_reason?: string | null;

          send_status?: "pending" | "sending" | "sent" | "failed" | null;
          send_locked_at?: string | null;
          send_error?: string | null;
          sent_at?: string | null;

          attachments?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };

      message_drafts: {
        Row: {
          id: string;
          agent_id: string;
          lead_id: string;
          inbound_message_id: string;
          draft_message_id: string;
          prompt_key: string | null;
          prompt_version: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          lead_id: string;
          inbound_message_id: string;
          draft_message_id: string;
          prompt_key?: string | null;
          prompt_version?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["message_drafts"]["Insert"]>;
      };

      message_qas: {
        Row: {
          id: string;
          agent_id: string;
          lead_id: string;
          inbound_message_id: string;
          draft_message_id: string | null;

          stage: string | null; // e.g. "qa_v1" | "recheck_v1"
          verdict: "pass" | "warn" | "fail" | string;
          reason: string | null;

          model: string | null;
          prompt_key: string | null;
          prompt_version: string | null;

          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          lead_id: string;
          inbound_message_id: string;
          draft_message_id?: string | null;

          stage?: string | null;
          verdict: "pass" | "warn" | "fail" | string;
          reason?: string | null;

          model?: string | null;
          prompt_key?: string | null;
          prompt_version?: string | null;

          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["message_qas"]["Insert"]>;
      };

      message_intents: {
        Row: {
          id: string;
          agent_id: string;
          lead_id: string;
          message_id: string;

          intent: string;
          confidence: number;
          reason: string | null;
          entities: Json;

          model: string | null;
          prompt_version: string | null;

          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          lead_id: string;
          message_id: string;

          intent: string;
          confidence?: number;
          reason?: string | null;
          entities?: Json;

          model?: string | null;
          prompt_version?: string | null;

          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["message_intents"]["Insert"]>;
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

          image_urls: string[] | null;

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
          provider: string | null;
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

      email_classifications: {
        Row: {
          id: string;
          agent_id: string;

          email_address: string | null;
          gmail_message_id: string | null;
          gmail_thread_id: string | null;

          decision: "auto_reply" | "needs_approval" | "ignore" | null;
          email_type:
            | "LEAD"
            | "PORTAL"
            | "BUSINESS_CONTACT"
            | "LEGAL"
            | "VENDOR"
            | "NEWSLETTER"
            | "BILLING"
            | "SYSTEM"
            | "SPAM"
            | "UNKNOWN"
            | null;
          confidence: number | null;
          reason: string | null;

          subject: string | null;
          from: string | null;
          to: string | null;
          reply_to: string | null;
          has_list_unsubscribe: boolean | null;
          is_bulk: boolean | null;
          is_no_reply: boolean | null;
          snippet: string | null;

          created_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;

          email_address?: string | null;
          gmail_message_id?: string | null;
          gmail_thread_id?: string | null;

          decision?: "auto_reply" | "needs_approval" | "ignore" | null;
          email_type?:
            | "LEAD"
            | "PORTAL"
            | "BUSINESS_CONTACT"
            | "LEGAL"
            | "VENDOR"
            | "NEWSLETTER"
            | "BILLING"
            | "SYSTEM"
            | "SPAM"
            | "UNKNOWN"
            | null;
          confidence?: number | null;
          reason?: string | null;

          subject?: string | null;
          from?: string | null;
          to?: string | null;
          reply_to?: string | null;
          has_list_unsubscribe?: boolean | null;
          is_bulk?: boolean | null;
          is_no_reply?: boolean | null;
          snippet?: string | null;

          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["email_classifications"]["Insert"]>;
      };

      email_message_bodies: {
        Row: {
          id: string;
          agent_id: string;
          lead_id: string | null;

          gmail_message_id: string;
          gmail_thread_id: string | null;
          email_address: string | null;

          subject: string | null;
          from: string | null;
          to: string | null;
          reply_to: string | null;

          body_text: string | null;
          body_html: string | null;
          headers_json: Json | null;

          fetched_at: string | null;
          created_at: string | null;
          updated_at: string | null;

          status: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          lead_id?: string | null;

          gmail_message_id: string;
          gmail_thread_id?: string | null;
          email_address?: string | null;

          subject?: string | null;
          from?: string | null;
          to?: string | null;
          reply_to?: string | null;

          body_text?: string | null;
          body_html?: string | null;
          headers_json?: Json | null;

          fetched_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;

          status?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["email_message_bodies"]["Insert"]>;
      };

      email_attachments: {
        Row: {
          id: string;
          agent_id: string;
          lead_id: string | null;

          gmail_message_id: string;
          gmail_thread_id: string | null;
          email_address: string | null;

          filename: string | null;
          mime: string | null;
          size_bytes: number | null;

          bucket: string | null;
          path: string | null;
          sha256: string | null;

          created_at: string | null;
          updated_at: string | null;

          status: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;
          lead_id?: string | null;

          gmail_message_id: string;
          gmail_thread_id?: string | null;
          email_address?: string | null;

          filename?: string | null;
          mime?: string | null;
          size_bytes?: number | null;

          bucket?: string | null;
          path?: string | null;
          sha256?: string | null;

          created_at?: string | null;
          updated_at?: string | null;

          status?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["email_attachments"]["Insert"]>;
      };

      // --------------------
      // IMMOSCOUT (OAUTH1 CONNECTIONS)
      // --------------------
      immoscout_connections: {
        Row: {
          id: string;
          agent_id: string;

          environment: "sandbox" | "prod" | string;
          status: "disconnected" | "pending" | "connected" | "error" | string;

          request_token: string | null;
          request_token_secret: string | null;
          request_token_created_at: string | null;

          access_token: string | null;
          access_token_secret: string | null;
          access_token_created_at: string | null;

          last_error: string | null;

          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          agent_id: string;

          environment?: "sandbox" | "prod" | string;
          status?: "disconnected" | "pending" | "connected" | "error" | string;

          request_token?: string | null;
          request_token_secret?: string | null;
          request_token_created_at?: string | null;

          access_token?: string | null;
          access_token_secret?: string | null;
          access_token_created_at?: string | null;

          last_error?: string | null;

          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["immoscout_connections"]["Insert"]>;
      };
    };
  };
};