import { getPropertyStartklarMissingFields } from "@/lib/properties/readiness";

type GateCheck = {
  key: string;
  label: string;
  ok: boolean;
  detail?: string | null;
};

export type AutosendBaseline = {
  eligible: boolean;
  checks: GateCheck[];
  reasons: string[];
  metrics: {
    property_count: number;
    reviewed_reply_count: number;
    failed_sends_last_14d: number;
    min_reviewed_replies: number;
    max_failed_sends_last_14d: number;
  };
};

export type LeadPropertyGate = {
  ready: boolean;
  active_property_id: string | null;
  reason: string | null;
  missing_fields: string[];
};

export const AUTOSEND_MIN_REVIEWED_REPLIES = 3;
export const AUTOSEND_MAX_FAILED_SENDS_14D = 2;

function uniqStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((v) => String(v || "").trim()).filter(Boolean)));
}

async function countByHead(query: any): Promise<number> {
  try {
    const { count, error } = await query;
    if (error) return 0;
    return Number(count || 0);
  } catch {
    return 0;
  }
}

async function loadPropertyCount(supabase: any, agentId: string) {
  const count = await countByHead(
    (supabase.from("properties") as any)
      .select("id", { head: true, count: "exact" })
      .eq("agent_id", agentId),
  );
  return count;
}

async function loadReviewedReplyCount(supabase: any, agentId: string) {
  try {
    const { data: qas, error: qaErr } = await (supabase.from("message_qas") as any)
      .select("draft_message_id")
      .eq("agent_id", agentId)
      .eq("prompt_key", "approval_review_v1")
      .eq("verdict", "pass")
      .order("created_at", { ascending: false })
      .limit(150);

    if (qaErr || !Array.isArray(qas) || qas.length === 0) return 0;
    const draftIds = uniqStrings(qas.map((r: any) => r?.draft_message_id)).slice(0, 120);
    if (draftIds.length === 0) return 0;

    const { data: rows, error: rowsErr } = await (supabase.from("messages") as any)
      .select("id, send_status, was_followup")
      .in("id", draftIds);

    if (rowsErr || !Array.isArray(rows)) return 0;

    return rows.reduce((acc: number, row: any) => {
      const sent = String(row?.send_status || "").toLowerCase() === "sent";
      const followup = Boolean(row?.was_followup);
      return sent && !followup ? acc + 1 : acc;
    }, 0);
  } catch {
    return 0;
  }
}

async function loadFailedSends14d(supabase: any, agentId: string) {
  const sinceIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const count = await countByHead(
    (supabase.from("messages") as any)
      .select("id", { head: true, count: "exact" })
      .eq("agent_id", agentId)
      .eq("send_status", "failed")
      .gte("timestamp", sinceIso),
  );
  return count;
}

async function loadEmailConnected(supabase: any, agentId: string) {
  try {
    const { data } = await (supabase.from("agent_settings") as any)
      .select("email_connected")
      .eq("agent_id", agentId)
      .maybeSingle();
    return Boolean(data?.email_connected);
  } catch {
    return false;
  }
}

export async function getAutosendBaseline(supabase: any, agentId: string): Promise<AutosendBaseline> {
  const [emailConnected, propertyCount, reviewedReplyCount, failedSends14d] = await Promise.all([
    loadEmailConnected(supabase, agentId),
    loadPropertyCount(supabase, agentId),
    loadReviewedReplyCount(supabase, agentId),
    loadFailedSends14d(supabase, agentId),
  ]);

  const checks: GateCheck[] = [
    {
      key: "email_connected",
      label: "Postfach ist verbunden",
      ok: emailConnected,
      detail: "Ohne verbundenes Postfach werden keine Antworten gesendet.",
    },
    {
      key: "property_catalog_ready",
      label: "Mindestens eine Immobilie ist hinterlegt",
      ok: propertyCount >= 1,
      detail: "Ohne Immobilien bleibt Auto-Send gesperrt.",
    },
    {
      key: "review_baseline",
      label: `Mindestens ${AUTOSEND_MIN_REVIEWED_REPLIES} Freigaben ohne Textänderung wurden sicher versendet`,
      ok: reviewedReplyCount >= AUTOSEND_MIN_REVIEWED_REPLIES,
      detail: "Auto-Send wird erst freigeschaltet, wenn genügend Freigaben ohne Korrekturbedarf vorliegen.",
    },
    {
      key: "failure_rate",
      label: `In den letzten 14 Tagen höchstens ${AUTOSEND_MAX_FAILED_SENDS_14D} fehlgeschlagene Sendungen`,
      ok: failedSends14d <= AUTOSEND_MAX_FAILED_SENDS_14D,
      detail: "Bei erhöhter Fehlerquote bleibt Auto-Send vorsorglich aus.",
    },
  ];

  const reasons = checks.filter((c) => !c.ok).map((c) => c.label);
  return {
    eligible: reasons.length === 0,
    checks,
    reasons,
    metrics: {
      property_count: propertyCount,
      reviewed_reply_count: reviewedReplyCount,
      failed_sends_last_14d: failedSends14d,
      min_reviewed_replies: AUTOSEND_MIN_REVIEWED_REPLIES,
      max_failed_sends_last_14d: AUTOSEND_MAX_FAILED_SENDS_14D,
    },
  };
}

export async function getLeadPropertyGate(
  supabase: any,
  agentId: string,
  leadId: string,
): Promise<LeadPropertyGate> {
  try {
    const { data: state, error: stateErr } = await (supabase.from("lead_property_state") as any)
      .select("active_property_id")
      .eq("agent_id", agentId)
      .eq("lead_id", leadId)
      .maybeSingle();

    if (stateErr) {
      return {
        ready: false,
        active_property_id: null,
        reason: "Objektzuordnung konnte nicht geprüft werden.",
        missing_fields: [],
      };
    }

    const activePropertyId = state?.active_property_id ? String(state.active_property_id) : null;
    if (!activePropertyId) {
      return {
        ready: false,
        active_property_id: null,
        reason: "Für diesen Lead ist keine aktive Immobilie zugeordnet.",
        missing_fields: [],
      };
    }

    const { data: property } = await (supabase.from("properties") as any)
      .select(
        "id,title,street_address,city,type,price_type,price,rooms,size_sqm,listing_summary,url",
      )
      .eq("agent_id", agentId)
      .eq("id", activePropertyId)
      .maybeSingle();

    if (!property?.id) {
      return {
        ready: false,
        active_property_id: activePropertyId,
        reason: "Die zugeordnete Immobilie ist nicht mehr verfügbar.",
        missing_fields: [],
      };
    }

    const missing = getPropertyStartklarMissingFields(property as any);
    if (missing.length > 0) {
      const labels = missing.map((m) => m.label);
      const preview = labels.slice(0, 3).join(", ");
      const more = labels.length > 3 ? ` (+${labels.length - 3} weitere)` : "";
      return {
        ready: false,
        active_property_id: activePropertyId,
        reason: `Aktive Immobilie nicht startklar: ${preview}${more}.`,
        missing_fields: labels,
      };
    }

    return {
      ready: true,
      active_property_id: activePropertyId,
      reason: null,
      missing_fields: [],
    };
  } catch {
    return {
      ready: false,
      active_property_id: null,
      reason: "Objektzuordnung konnte nicht geprüft werden.",
      missing_fields: [],
    };
  }
}
