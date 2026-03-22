import {
  ensureProspectStrategyDecision,
  type RankedContactCandidate,
  type StrategyDecisionView,
} from "@/lib/crm/strategyEngine";

export type ContactResolutionTrigger =
  | "missing_contact"
  | "bounce"
  | "wrong_contact"
  | "manual"
  | "sequence_run";

export type ContactResolutionStatus =
  | "resolved"
  | "manual_review"
  | "no_candidate"
  | "skipped";

type ContactSummary = {
  id: string | null;
  channel_type: string;
  channel_value: string;
  contact_name: string | null;
  contact_role: string | null;
  confidence: number | null;
  score: number;
  recommended_order: number;
};

type ContactRepairResult =
  | {
      ok: true;
      status: ContactResolutionStatus;
      summary: string;
      strategy: StrategyDecisionView | null;
      ranked_contacts: ContactSummary[];
      selected_contact: ContactSummary | null;
      invalidated_contact: ContactSummary | null;
      run_id: string | null;
    }
  | {
      ok: false;
      error: string;
      details: string;
    };

function clean(value: unknown, max = 320) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function isSchemaMismatch(
  error: { message?: string; details?: string; hint?: string; code?: string } | null | undefined,
) {
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

function normalizeCompareValue(channelType: string | null | undefined, channelValue: string | null | undefined) {
  const channel = clean(channelType, 24).toLowerCase();
  const value = clean(channelValue, 500);
  if (!value) return "";
  if (channel === "email") return value.toLowerCase();
  if (channel === "telefon") return value.replace(/[^\d+]/g, "");
  return value.toLowerCase().replace(/\/+$/, "");
}

function summarizeContact(contact: RankedContactCandidate | null | undefined): ContactSummary | null {
  if (!contact) return null;
  return {
    id: clean(contact.id, 120) || null,
    channel_type: clean(contact.channel_type, 24),
    channel_value: clean(contact.channel_value, 500),
    contact_name: clean(contact.contact_name, 160) || null,
    contact_role: clean(contact.contact_role, 120) || null,
    confidence:
      typeof contact.confidence === "number"
        ? Math.max(0, Math.min(1, Math.round(contact.confidence * 1000) / 1000))
        : null,
    score: Number.isFinite(Number(contact.score)) ? Math.round(Number(contact.score)) : 0,
    recommended_order: Number.isFinite(Number(contact.recommended_order))
      ? Number(contact.recommended_order)
      : 0,
  };
}

function preferredChannelValue(contact: ContactSummary | null) {
  if (!contact) return null;
  const channel = clean(contact.channel_type, 24).toLowerCase();
  if (channel === "email") return { preferred_channel: "email", contact_email: contact.channel_value.toLowerCase() };
  if (channel === "linkedin") return { preferred_channel: "linkedin", linkedin_url: contact.channel_value };
  if (channel === "kontaktformular") return { preferred_channel: "kontaktformular" };
  if (channel === "telefon") return { preferred_channel: "telefon" };
  if (channel === "whatsapp") return { preferred_channel: "whatsapp" };
  return { preferred_channel: channel || null };
}

async function loadRecentFailedContact(
  supabase: any,
  args: { agentId: string; prospectId: string; messageId?: string | null },
) {
  let query = (supabase.from("crm_outreach_messages") as any)
    .select("id, channel, metadata, updated_at")
    .eq("agent_id", args.agentId)
    .eq("prospect_id", args.prospectId)
    .eq("status", "failed")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (args.messageId) {
    query = query.eq("id", args.messageId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    return { error, signal: null };
  }

  const row = data as Record<string, any> | null;
  const meta = row?.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, any>) : {};
  const channel =
    clean(meta.strategy_contact_channel, 24) ||
    clean(meta.channel, 24) ||
    clean(row?.channel, 24) ||
    null;
  const channelValue =
    clean(meta.strategy_contact_value, 500) ||
    (String(channel || "").toLowerCase() === "email" ? clean(meta.to_email, 320).toLowerCase() : "") ||
    null;
  const contactCandidateId = clean(meta.strategy_contact_candidate_id, 120) || null;

  return {
    error: null,
    signal:
      channel || channelValue || contactCandidateId
        ? {
            message_id: clean(row?.id, 120) || null,
            channel,
            channel_value: channelValue,
            contact_candidate_id: contactCandidateId,
          }
        : null,
  };
}

export async function updateContactCandidateStatus(
  supabase: any,
  args: {
    agentId: string;
    prospectId?: string | null;
    contactCandidateId?: string | null;
    channelType?: string | null;
    channelValue?: string | null;
    validationStatus?: "new" | "verified" | "invalid" | "used";
    isPrimary?: boolean;
    metadataPatch?: Record<string, any>;
  },
) {
  let row: any = null;
  if (args.contactCandidateId) {
    const { data } = await (supabase.from("crm_contact_candidates") as any)
      .select(
        "id, prospect_id, contact_name, contact_role, channel_type, channel_value, confidence, is_primary, validation_status, metadata",
      )
      .eq("agent_id", args.agentId)
      .eq("id", args.contactCandidateId)
      .maybeSingle();
    row = data || null;
  } else if (args.prospectId && args.channelType && args.channelValue) {
    const { data } = await (supabase.from("crm_contact_candidates") as any)
      .select(
        "id, prospect_id, contact_name, contact_role, channel_type, channel_value, confidence, is_primary, validation_status, metadata",
      )
      .eq("agent_id", args.agentId)
      .eq("prospect_id", args.prospectId)
      .eq("channel_type", clean(args.channelType, 24))
      .eq("channel_value", clean(args.channelValue, 500))
      .order("confidence", { ascending: false })
      .limit(1)
      .maybeSingle();
    row = data || null;
  }

  if (!row?.id) return null;

  if (args.isPrimary && row.prospect_id) {
    await (supabase.from("crm_contact_candidates") as any)
      .update({ is_primary: false })
      .eq("agent_id", args.agentId)
      .eq("prospect_id", String(row.prospect_id))
      .neq("id", String(row.id));
  }

  const nextMetadata =
    args.metadataPatch && typeof args.metadataPatch === "object"
      ? {
          ...(row.metadata && typeof row.metadata === "object" ? row.metadata : {}),
          ...args.metadataPatch,
        }
      : row.metadata && typeof row.metadata === "object"
        ? row.metadata
        : {};

  const { data: updated } = await (supabase.from("crm_contact_candidates") as any)
    .update({
      validation_status: args.validationStatus || row.validation_status || "new",
      is_primary: typeof args.isPrimary === "boolean" ? args.isPrimary : Boolean(row.is_primary),
      metadata: nextMetadata,
    })
    .eq("agent_id", args.agentId)
    .eq("id", String(row.id))
    .select(
      "id, contact_name, contact_role, channel_type, channel_value, confidence, is_primary, validation_status",
    )
    .maybeSingle();

  return updated || row;
}

export async function applySelectedContactToProspect(
  supabase: any,
  args: {
    agentId: string;
    prospectId: string;
    selectedContact: ContactSummary | null;
    strategy?: StrategyDecisionView | null;
    note?: string | null;
  },
) {
  const selected = args.selectedContact;
  const base = preferredChannelValue(selected);
  const updates: Record<string, any> = {
    preferred_channel: base?.preferred_channel || args.strategy?.chosen_channel || null,
    next_action_at: new Date().toISOString(),
    next_action: selected
      ? `Kontaktpfad aktualisiert: nächster Touch über ${selected.channel_type}`
      : "Kein belastbarer Kontaktpfad gefunden. Manuelle Recherche nötig.",
  };

  if (selected?.channel_type === "email") {
    updates.contact_email = selected.channel_value.toLowerCase();
  }
  if (selected?.channel_type === "linkedin") {
    updates.linkedin_url = selected.channel_value;
  }
  if (selected?.contact_name) {
    updates.contact_name = selected.contact_name;
  }
  if (selected?.contact_role) {
    updates.contact_role = selected.contact_role;
  }

  await (supabase.from("crm_prospects") as any)
    .update(updates)
    .eq("agent_id", args.agentId)
    .eq("id", args.prospectId);
}

async function persistContactResolutionRun(
  supabase: any,
  args: {
    agentId: string;
    prospectId: string;
    triggerType: ContactResolutionTrigger;
    status: ContactResolutionStatus;
    strategyDecisionId?: string | null;
    failedMessageId?: string | null;
    invalidatedContactCandidateId?: string | null;
    selectedContact?: ContactSummary | null;
    notes?: string | null;
    metadata?: Record<string, any>;
  },
) {
  const { data, error } = await (supabase.from("crm_contact_resolution_runs") as any)
    .insert({
      agent_id: args.agentId,
      prospect_id: args.prospectId,
      trigger_type: args.triggerType,
      status: args.status,
      strategy_decision_id: args.strategyDecisionId || null,
      failed_message_id: args.failedMessageId || null,
      invalidated_contact_candidate_id: args.invalidatedContactCandidateId || null,
      selected_contact_candidate_id: args.selectedContact?.id || null,
      selected_channel: clean(args.selectedContact?.channel_type, 24) || null,
      selected_contact_value: clean(args.selectedContact?.channel_value, 500) || null,
      notes: clean(args.notes, 500) || null,
      metadata: args.metadata && typeof args.metadata === "object" ? args.metadata : {},
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (isSchemaMismatch(error as any)) return null;
    throw error;
  }

  return clean(data?.id, 120) || null;
}

function pickSelectedContact(
  strategy: StrategyDecisionView | null,
  rankedContacts: RankedContactCandidate[],
  invalidatedContact: ContactSummary | null,
) {
  const invalidatedKey = invalidatedContact
    ? `${clean(invalidatedContact.channel_type, 24)}:${normalizeCompareValue(
        invalidatedContact.channel_type,
        invalidatedContact.channel_value,
      )}`
    : null;

  const preferred = rankedContacts.find((contact) => {
    if (!contact) return false;
    if (contact.validation_status === "invalid") return false;
    const key = `${clean(contact.channel_type, 24)}:${normalizeCompareValue(
      contact.channel_type,
      contact.channel_value,
    )}`;
    if (invalidatedKey && key === invalidatedKey) return false;
    if (strategy?.chosen_contact_candidate_id && clean(contact.id, 120) === strategy.chosen_contact_candidate_id) {
      return true;
    }
    if (
      strategy?.chosen_contact_channel &&
      strategy?.chosen_contact_value &&
      clean(contact.channel_type, 24) === strategy.chosen_contact_channel &&
      normalizeCompareValue(contact.channel_type, contact.channel_value) ===
        normalizeCompareValue(strategy.chosen_contact_channel, strategy.chosen_contact_value)
    ) {
      return true;
    }
    return false;
  });

  if (preferred) return preferred;

  return (
    rankedContacts.find((contact) => {
      if (contact.validation_status === "invalid") return false;
      const key = `${clean(contact.channel_type, 24)}:${normalizeCompareValue(
        contact.channel_type,
        contact.channel_value,
      )}`;
      return !(invalidatedKey && key === invalidatedKey);
    }) || null
  );
}

export async function runContactRepair(
  supabase: any,
  args: {
    agentId: string;
    prospectId: string;
    triggerType: ContactResolutionTrigger;
    messageId?: string | null;
    contactCandidateId?: string | null;
  },
): Promise<ContactRepairResult> {
  let invalidatedContact: ContactSummary | null = null;
  let failedMessageId: string | null = clean(args.messageId, 120) || null;

  const failedSignalResult =
    args.triggerType === "bounce" || args.triggerType === "wrong_contact"
      ? await loadRecentFailedContact(supabase, {
          agentId: args.agentId,
          prospectId: args.prospectId,
          messageId: args.messageId || null,
        })
      : { error: null, signal: null };

  if (failedSignalResult.error && !isSchemaMismatch(failedSignalResult.error as any)) {
    return {
      ok: false,
      error: "crm_contact_failure_context_failed",
      details: failedSignalResult.error.message,
    };
  }

  const failedSignal = failedSignalResult.signal;
  failedMessageId = failedMessageId || clean(failedSignal?.message_id, 120) || null;

  const invalidatedRow = await updateContactCandidateStatus(supabase, {
    agentId: args.agentId,
    prospectId: args.prospectId,
    contactCandidateId: clean(args.contactCandidateId, 120) || clean(failedSignal?.contact_candidate_id, 120) || null,
    channelType: clean(failedSignal?.channel, 24) || null,
    channelValue: clean(failedSignal?.channel_value, 500) || null,
    validationStatus:
      args.triggerType === "bounce" || args.triggerType === "wrong_contact" ? "invalid" : undefined,
    metadataPatch:
      args.triggerType === "bounce" || args.triggerType === "wrong_contact"
        ? {
            last_resolution_trigger: args.triggerType,
            last_resolution_at: new Date().toISOString(),
          }
        : undefined,
  });

  if (invalidatedRow?.id) {
    invalidatedContact = {
      id: clean(invalidatedRow.id, 120) || null,
      channel_type: clean(invalidatedRow.channel_type, 24),
      channel_value: clean(invalidatedRow.channel_value, 500),
      contact_name: clean(invalidatedRow.contact_name, 160) || null,
      contact_role: clean(invalidatedRow.contact_role, 120) || null,
      confidence:
        typeof invalidatedRow.confidence === "number"
          ? Math.max(0, Math.min(1, Number(invalidatedRow.confidence)))
          : null,
      score: 0,
      recommended_order: 0,
    };
  }

  const strategyResult = await ensureProspectStrategyDecision(supabase, {
    agentId: args.agentId,
    prospectId: args.prospectId,
    force: true,
  });

  if (!strategyResult.ok) {
    const strategyError = strategyResult as Extract<typeof strategyResult, { ok: false }>;
    return {
      ok: false,
      error: strategyError.error,
      details: strategyError.details,
    };
  }

  const selectedRanked = pickSelectedContact(
    strategyResult.strategy,
    strategyResult.rankedContacts,
    invalidatedContact,
  );
  const selectedContact = summarizeContact(selectedRanked);
  const rankedContacts = strategyResult.rankedContacts
    .map((contact) => summarizeContact(contact))
    .filter(Boolean) as ContactSummary[];

  const status: ContactResolutionStatus = selectedContact
    ? selectedContact.score >= 52
      ? "resolved"
      : "manual_review"
    : "no_candidate";

  await applySelectedContactToProspect(supabase, {
    agentId: args.agentId,
    prospectId: args.prospectId,
    selectedContact,
    strategy: strategyResult.strategy,
    note:
      status === "resolved"
        ? `Kontaktpfad neu priorisiert (${selectedContact?.channel_type || "offen"}).`
        : "Kontaktpfad benötigt noch manuelle Prüfung.",
  });

  const summary =
    status === "resolved"
      ? `Kontaktpfad aktualisiert: ${selectedContact?.channel_type || "offen"} · ${selectedContact?.channel_value || "ohne Wert"}.`
      : status === "manual_review"
        ? `Neuer Kontaktpfad gefunden, sollte aber kurz geprüft werden: ${selectedContact?.channel_type || "offen"}.`
        : "Kein belastbarer Fallback-Kontakt gefunden. Manuelle Recherche nötig.";

  const runId = await persistContactResolutionRun(supabase, {
    agentId: args.agentId,
    prospectId: args.prospectId,
    triggerType: args.triggerType,
    status,
    strategyDecisionId: strategyResult.strategy.id,
    failedMessageId,
    invalidatedContactCandidateId: invalidatedContact?.id || null,
    selectedContact,
    notes: summary,
    metadata: {
      ranked_contact_count: rankedContacts.length,
      research_status: strategyResult.research.status,
      research_score: strategyResult.research.score,
    },
  }).catch((error: any) => {
    if (isSchemaMismatch(error as any)) return null;
    throw error;
  });

  return {
    ok: true,
    status,
    summary,
    strategy: strategyResult.strategy,
    ranked_contacts: rankedContacts,
    selected_contact: selectedContact,
    invalidated_contact: invalidatedContact,
    run_id: runId,
  };
}
