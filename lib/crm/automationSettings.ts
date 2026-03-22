import type { SupabaseClient } from "@supabase/supabase-js";

export type CrmAutomationSettings = {
  sequence_automation_enabled: boolean;
  enrichment_automation_enabled: boolean;
  reason: string | null;
  updated_at: string | null;
  source: "table" | "default";
  schema_missing?: boolean;
};

export const DEFAULT_CRM_AUTOMATION_SETTINGS: CrmAutomationSettings = {
  sequence_automation_enabled: true,
  enrichment_automation_enabled: true,
  reason: null,
  updated_at: null,
  source: "default",
};

const CRM_AUTOMATION_SELECT =
  "crm_sequence_automation_enabled, crm_enrichment_automation_enabled, crm_automation_reason, crm_automation_updated_at";

function clean(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function isSchemaMismatch(error: { message?: string; details?: string; hint?: string; code?: string } | null | undefined) {
  const text = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  return (
    code === "42703" ||
    code === "42p01" ||
    text.includes("does not exist") ||
    text.includes("schema cache") ||
    text.includes("could not find the") ||
    text.includes("relation")
  );
}

function mapRow(row: any): CrmAutomationSettings {
  return {
    sequence_automation_enabled:
      typeof row?.crm_sequence_automation_enabled === "boolean"
        ? row.crm_sequence_automation_enabled
        : DEFAULT_CRM_AUTOMATION_SETTINGS.sequence_automation_enabled,
    enrichment_automation_enabled:
      typeof row?.crm_enrichment_automation_enabled === "boolean"
        ? row.crm_enrichment_automation_enabled
        : DEFAULT_CRM_AUTOMATION_SETTINGS.enrichment_automation_enabled,
    reason: clean(row?.crm_automation_reason, 240) || null,
    updated_at: clean(row?.crm_automation_updated_at, 80) || null,
    source: row ? "table" : "default",
  };
}

export async function loadCrmAutomationSettings(
  supabase: SupabaseClient<any, "public", any>,
  agentId: string,
): Promise<CrmAutomationSettings> {
  try {
    const { data, error } = await (supabase.from("agent_settings") as any)
      .select(CRM_AUTOMATION_SELECT)
      .eq("agent_id", agentId)
      .maybeSingle();

    if (error) {
      if (isSchemaMismatch(error)) {
        return {
          ...DEFAULT_CRM_AUTOMATION_SETTINGS,
          schema_missing: true,
        };
      }
      return DEFAULT_CRM_AUTOMATION_SETTINGS;
    }

    if (!data) return DEFAULT_CRM_AUTOMATION_SETTINGS;
    return mapRow(data);
  } catch {
    return DEFAULT_CRM_AUTOMATION_SETTINGS;
  }
}

export async function saveCrmAutomationSettings(
  supabase: SupabaseClient<any, "public", any>,
  args: {
    agentId: string;
    sequenceAutomationEnabled?: boolean;
    enrichmentAutomationEnabled?: boolean;
    reason?: string | null;
  },
): Promise<{ ok: true; settings: CrmAutomationSettings } | { ok: false; error: string; details?: string }> {
  const payload: Record<string, unknown> = {
    agent_id: args.agentId,
    crm_automation_updated_at: new Date().toISOString(),
  };

  if (typeof args.sequenceAutomationEnabled === "boolean") {
    payload.crm_sequence_automation_enabled = args.sequenceAutomationEnabled;
  }
  if (typeof args.enrichmentAutomationEnabled === "boolean") {
    payload.crm_enrichment_automation_enabled = args.enrichmentAutomationEnabled;
  }
  if (args.reason !== undefined) {
    payload.crm_automation_reason = clean(args.reason, 240) || null;
  }

  try {
    const { data, error } = await (supabase.from("agent_settings") as any)
      .upsert(payload, { onConflict: "agent_id" })
      .select(CRM_AUTOMATION_SELECT)
      .single();

    if (error) {
      if (isSchemaMismatch(error)) {
        return {
          ok: false,
          error: "crm_automation_schema_missing",
          details:
            "CRM-Automation-Felder fehlen. Bitte zuerst die Migration 20260322_crm_phase8_automation_controls.sql ausführen.",
        };
      }
      return {
        ok: false,
        error: "crm_automation_settings_save_failed",
        details: error.message,
      };
    }

    return {
      ok: true,
      settings: mapRow(data),
    };
  } catch (error: any) {
    return {
      ok: false,
      error: "crm_automation_settings_save_failed",
      details: String(error?.message || "CRM-Automation konnte nicht gespeichert werden."),
    };
  }
}
