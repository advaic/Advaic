import { collectTriggerEvidence } from "@/lib/crm/cadenceRules";
import {
  getChannelLearningAdjustment,
  loadCurrentLearningSnapshot,
  type LearningSnapshotView,
} from "@/lib/crm/learningLoop";
import { routeObjection } from "@/lib/crm/objectionLibrary";
import { assessResearchReadiness } from "@/lib/crm/outboundQuality";
import { getPlaybookForSegment, inferSegmentFromProspect } from "@/lib/crm/salesIntelResearch";
import { evaluateSendTiming } from "@/lib/crm/timingPolicy";

export type RankedContactCandidate = {
  id: string | null;
  channel_type: string;
  channel_value: string;
  contact_name: string | null;
  contact_role: string | null;
  source_type: string | null;
  confidence: number | null;
  is_primary: boolean;
  validation_status: string | null;
  source_url: string | null;
  score: number;
  reason: string;
  recommended_order: number;
};

export type StrategyDecisionView = {
  id: string;
  version: number;
  strategy_status: string;
  segment_key: string;
  playbook_key: string | null;
  playbook_title: string | null;
  chosen_channel: string | null;
  channel_plan: string[];
  chosen_contact_channel: string | null;
  chosen_contact_value: string | null;
  chosen_contact_confidence: number | null;
  chosen_contact_candidate_id: string | null;
  chosen_cta: string | null;
  chosen_angle: string | null;
  chosen_trigger: string | null;
  trigger_evidence: string[];
  research_status: string | null;
  research_score: number | null;
  risk_level: string | null;
  strategy_score: number | null;
  rationale: string | null;
  fallback_plan: string | null;
  research_gaps: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

type StrategySupportError = {
  ok: false;
  error: string;
  details: string;
};

type StrategySupportSuccess = {
  ok: true;
  prospect: ProspectRow;
  evidenceRows: EvidenceRow[];
  contactRows: ContactRow[];
  notes: string[];
};

export type EnsureProspectStrategyDecisionResult =
  | {
      ok: true;
      strategy: StrategyDecisionView;
      rankedContacts: RankedContactCandidate[];
      research: ReturnType<typeof assessResearchReadiness>;
      generated: boolean;
    }
  | {
      ok: false;
      error: string;
      details: string;
    };

type ProspectRow = Record<string, any>;
type EvidenceRow = Record<string, any>;
type ContactRow = Record<string, any>;

function clean(value: unknown, max = 260) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function toConfidence(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
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

function dedupeList(values: Array<string | null | undefined>, max = 8) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = clean(value, 220);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
    if (out.length >= max) break;
  }
  return out;
}

function valueNarrativeForSegment(segmentKey: string, objectFocus: string | null | undefined) {
  if (segmentKey === "solo_miete_volumen") {
    return "weniger Zeitverlust bei Standardanfragen und schnellere Rueckmeldungen";
  }
  if (segmentKey === "solo_kauf_beratung") {
    return "Standardfaelle beschleunigen, ohne Beratungsqualitaet zu verlieren";
  }
  if (segmentKey === "kleines_team_gemischt") {
    return "kontrollierte Entlastung mit Safe-Start statt riskanter Vollautomation";
  }
  if (segmentKey === "neubau_vertrieb") {
    return "klare Governance und saubere Anfrageprozesse bei mehreren Beteiligten";
  }
  if (segmentKey === "vorsichtig_starter") {
    return "kontrollierter Einstieg mit Freigabe-First und klaren Stop-Regeln";
  }
  const focus = clean(objectFocus, 40).toLowerCase();
  if (focus === "miete") return "Anfragen schneller beantworten und Termine strukturierter vergeben";
  if (focus === "kauf") return "Rueckfragen effizient klaeren und Beratungszeit auf relevante Faelle konzentrieren";
  return "Routine-Kommunikation entlasten und trotzdem die volle Kontrolle behalten";
}

function genericEmailPenalty(email: string) {
  return /^(info|kontakt|office|team|hello|hallo|mail|post|service|verwaltung)@/i.test(email) ? 9 : 0;
}

function roleBonus(role: string | null) {
  const safe = clean(role, 120).toLowerCase();
  if (!safe) return 0;
  if (/(inhaber|owner|gruender|grunder|geschaeftsfuehrer|geschaftsfuhrer|geschaeftsleitung)/i.test(safe)) {
    return 10;
  }
  if (/(leitung|head|makler|berater|agent)/i.test(safe)) return 5;
  return 0;
}

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function sourceBonus(row: ContactRow) {
  const sourceType = clean(row.source_type, 24).toLowerCase();
  const meta = metadataObject(row.metadata);
  let score = 0;
  if (sourceType === "linkedin") score += 6;
  if (sourceType === "website") score += 2;
  if (sourceType === "portal") score += 3;
  if (meta.source_kind === "linkedin_profile") score += 8;
  if (meta.source_kind === "linkedin_company") score += 3;
  if (meta.source_kind === "google_reviews" || meta.source_kind === "provenexpert") score += 4;
  if (
    meta.source_kind === "immoscout_portal" ||
    meta.source_kind === "immowelt_portal" ||
    meta.source_kind === "immonet_portal" ||
    meta.source_kind === "bellevue_directory"
  ) {
    score += 5;
  }
  if (meta.verified_contact_surface === "named_person") score += 8;
  if (meta.verified_contact_surface === "company_profile") score += 3;
  if (meta.verified_contact_surface === "review_profile") score += 2;
  if (meta.verified_contact_surface === "listing_profile") score += 4;
  if (meta.decision_maker) score += 10;
  if (meta.page_kind === "team" || meta.page_kind === "about") score += 5;
  if (meta.page_kind === "contact") score += 2;
  if (meta.source_contact_name) score += 4;
  if (meta.corroborated_by_secondary) score += 6;
  if (typeof meta.verification_score === "number" && meta.verification_score > 0) {
    score += Math.round(Math.min(8, meta.verification_score * 8));
  }
  if (typeof meta.external_source_count === "number" && meta.external_source_count > 1) {
    score += Math.min(6, meta.external_source_count * 2);
  }
  return score;
}

function genericContactPenalty(row: ContactRow) {
  const channelType = clean(row.channel_type, 24).toLowerCase();
  const channelValue = clean(row.channel_value, 500).toLowerCase();
  const hasName = Boolean(clean(row.contact_name, 160));
  const meta = metadataObject(row.metadata);
  if (channelType === "email" && /^(info|kontakt|office|team|hello|mail|post|service|verwaltung)@/i.test(channelValue)) {
    return hasName ? 3 : 8;
  }
  if (
    channelType === "linkedin" &&
    (/linkedin\.com\/company\//i.test(channelValue) || meta.source_kind === "linkedin_company")
  ) {
    return hasName ? 1 : 5;
  }
  if (meta.verified_contact_surface === "review_profile" && !hasName && channelType !== "telefon") return 4;
  return 0;
}

function contactSourceReason(row: ContactRow) {
  const meta = metadataObject(row.metadata);
  if (meta.source_kind === "linkedin_profile") return "LinkedIn-Profil";
  if (meta.source_kind === "linkedin_company") return "LinkedIn-Unternehmensseite";
  if (meta.source_kind === "google_reviews") return "Google-Bewertungen";
  if (meta.source_kind === "provenexpert") return "ProvenExpert-Profil";
  if (meta.source_kind === "immoscout_portal") return "ImmoScout-Profil";
  if (meta.source_kind === "immowelt_portal") return "Immowelt-Profil";
  if (meta.source_kind === "immonet_portal") return "Immonet-Profil";
  if (meta.source_kind === "bellevue_directory") return "Bellevue-Eintrag";
  if (meta.corroborated_by_secondary) return "extern bestaetigt";
  if (meta.decision_maker) return "Entscheider-Signal";
  if (meta.page_kind === "team") return "Team-Seite";
  if (meta.page_kind === "about") return "Ueber-uns-Seite";
  const sourceType = clean(row.source_type, 24).toLowerCase();
  if (sourceType === "linkedin") return "LinkedIn-Pfad";
  if (sourceType === "portal") return "Portal-Signal";
  if (sourceType === "website") return "Website-Signal";
  return null;
}

function contactReason(args: {
  channelType: string;
  score: number;
  confidence: number | null;
  role: string | null;
  isPrimary: boolean;
  preferredChannel: string | null;
  sourceReason?: string | null;
}) {
  const reasons: string[] = [];
  if (args.isPrimary) reasons.push("primaerer Kontaktpfad");
  if (args.confidence !== null) reasons.push(`Konfidenz ${Math.round(args.confidence * 100)}%`);
  if (args.role) reasons.push(args.role);
  if (args.sourceReason) reasons.push(args.sourceReason);
  if (args.preferredChannel && args.preferredChannel === args.channelType) {
    reasons.push("passt zum Wunschkanal");
  }
  if (reasons.length === 0) reasons.push(`Score ${args.score}`);
  return reasons.join(" · ");
}

function buildVirtualContacts(prospect: ProspectRow): ContactRow[] {
  const rows: ContactRow[] = [];
  const contactName = clean(prospect.contact_name, 160) || null;
  const contactRole = clean(prospect.contact_role, 120) || null;
  const email = clean(prospect.contact_email, 320).toLowerCase();
  const linkedinUrl = clean(prospect.linkedin_url, 500) || clean(prospect.linkedin_search_url, 500);
  const websiteUrl = clean(prospect.website_url, 500) || clean(prospect.source_url, 500);

  if (email) {
    rows.push({
      id: null,
      channel_type: "email",
      channel_value: email,
      contact_name: contactName,
      contact_role: contactRole,
      source_type: "website",
      confidence: 0.78,
      is_primary: true,
      validation_status: "new",
      source_url: websiteUrl || null,
    });
  }
  if (linkedinUrl) {
    rows.push({
      id: null,
      channel_type: "linkedin",
      channel_value: linkedinUrl,
      contact_name: contactName,
      contact_role: contactRole,
      source_type: "linkedin",
      confidence: 0.62,
      is_primary: !email,
      validation_status: "new",
      source_url: linkedinUrl,
    });
  }
  if (websiteUrl) {
    rows.push({
      id: null,
      channel_type: "kontaktformular",
      channel_value: websiteUrl,
      contact_name: contactName,
      contact_role: contactRole,
      source_type: "website",
      confidence: 0.4,
      is_primary: !email && !linkedinUrl,
      validation_status: "new",
      source_url: websiteUrl,
    });
  }
  return rows;
}

export function rankContactCandidates(args: {
  prospect: ProspectRow;
  contactRows: ContactRow[];
  researchStatus: string;
}) {
  const preferredChannel = clean(args.prospect.preferred_channel, 24).toLowerCase() || null;
  const rows = [...(args.contactRows || []), ...buildVirtualContacts(args.prospect)];
  const seen = new Set<string>();
  const ranked: RankedContactCandidate[] = [];

  for (const row of rows) {
    const channelType = clean(row.channel_type, 24).toLowerCase();
    const channelValue = clean(row.channel_value, 500);
    if (!channelType || !channelValue) continue;
    const key = `${channelType}:${channelValue.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const confidence = toConfidence(row.confidence);
    const isPrimary = Boolean(row.is_primary);
    const validationStatus = clean(row.validation_status, 24) || null;
    let score = confidence !== null ? confidence * 55 : 28;

    if (channelType === "email") score += 18;
    else if (channelType === "linkedin") score += 12;
    else if (channelType === "telefon") score += 10;
    else if (channelType === "kontaktformular") score += 6;
    else if (channelType === "whatsapp") score += 8;

    if (isPrimary) score += 8;
    if (preferredChannel && preferredChannel === channelType) score += 7;
    if (validationStatus === "verified") score += 8;
    if (validationStatus === "invalid") score -= 40;
    if (channelType === "email") score -= genericEmailPenalty(channelValue);
    score -= genericContactPenalty(row);
    if (channelType === "kontaktformular") score -= 5;
    if (args.researchStatus === "missing_contact" && (channelType === "linkedin" || channelType === "kontaktformular")) {
      score += 4;
    }
    score += roleBonus(clean(row.contact_role, 120) || null);
    score += sourceBonus(row);
    if (clean(row.contact_name, 140)) score += 4;

    ranked.push({
      id: clean(row.id, 120) || null,
      channel_type: channelType,
      channel_value: channelValue,
      contact_name: clean(row.contact_name, 160) || null,
      contact_role: clean(row.contact_role, 120) || null,
      source_type: clean(row.source_type, 24) || null,
      confidence,
      is_primary: isPrimary,
      validation_status: validationStatus,
      source_url: clean(row.source_url, 500) || null,
      score: clamp(score),
      reason: "",
      recommended_order: 0,
    });
  }

  ranked.sort((a, b) => b.score - a.score || String(a.channel_type).localeCompare(String(b.channel_type)));
  return ranked.map((row, index) => ({
    ...row,
    recommended_order: index + 1,
    reason: contactReason({
      channelType: row.channel_type,
      score: row.score,
      confidence: row.confidence,
      role: row.contact_role,
      isPrimary: row.is_primary,
      preferredChannel,
      sourceReason: contactSourceReason(rows.find((candidate) => {
        return (
          clean(candidate.channel_type, 24).toLowerCase() === row.channel_type &&
          clean(candidate.channel_value, 500).toLowerCase() === row.channel_value.toLowerCase()
        );
      }) || {}),
    }),
  }));
}

function chooseAngle(prospect: ProspectRow, evidenceRows: EvidenceRow[], notes: string[]) {
  return (
    clean(prospect.primary_pain_hypothesis, 260) ||
    clean(prospect.pain_point_hypothesis, 260) ||
    clean(prospect.secondary_pain_hypothesis, 260) ||
    clean(prospect.process_hint, 220) ||
    clean(evidenceRows.find((row) => clean(row.field_name, 80) === "process_hint")?.field_value, 220) ||
    clean(notes[0], 220) ||
    "Viele aehnliche Interessentenanfragen erzeugen vermeidbaren Routineaufwand."
  );
}

function chooseTrigger(triggerEvidence: string[], evidenceRows: EvidenceRow[], prospect: ProspectRow) {
  return (
    clean(triggerEvidence[0], 220) ||
    clean(
      evidenceRows.find((row) =>
        ["personalization_hook", "personalization_evidence", "response_promise_public"].includes(
          clean(row.field_name, 80),
        ),
      )?.field_value,
      220,
    ) ||
    clean(prospect.personalization_hook, 220) ||
    "Es gibt genug oeffentliche Signale fuer eine konkrete, persoenliche Ansprache."
  );
}

function chooseCta(args: {
  researchScore: number;
  automationReadiness: string | null;
  topContact: RankedContactCandidate | null;
}) {
  if (args.researchScore >= 80 && args.automationReadiness === "hoch" && args.topContact?.channel_type === "telefon") {
    return "15_min_call";
  }
  if (args.researchScore >= 74 && args.topContact?.channel_type === "email") {
    return "kurze_mail_antwort";
  }
  return "relevanzfrage";
}

function chooseRiskLevel(args: {
  researchStatus: string;
  researchScore: number;
  topContact: RankedContactCandidate | null;
}) {
  if (args.researchStatus === "missing_contact" || args.researchScore < 55) return "hoch";
  if (args.researchStatus === "ready" && (args.topContact?.score || 0) >= 75) return "niedrig";
  return "mittel";
}

function buildChannelPlan(preferredChannel: string | null, rankedContacts: RankedContactCandidate[]) {
  const channels = dedupeList([
    preferredChannel,
    ...rankedContacts.map((row) => row.channel_type),
    "email",
    "linkedin",
    "kontaktformular",
  ]);
  return channels.slice(0, 4);
}

function applyLearningToRankedContacts(args: {
  rankedContacts: RankedContactCandidate[];
  learningSnapshot: LearningSnapshotView | null;
  segmentKey: string;
}) {
  if (!args.learningSnapshot) return args.rankedContacts;
  const adjusted = args.rankedContacts.map((row) => {
    const learning = getChannelLearningAdjustment(
      args.learningSnapshot,
      row.channel_type,
      args.segmentKey,
    );
    const nextScore = clamp(row.score + learning.score_adjustment);
    return {
      ...row,
      score: nextScore,
      reason: learning.reason ? `${row.reason} · Learning: ${learning.reason}` : row.reason,
    };
  });

  adjusted.sort((a, b) => b.score - a.score || String(a.channel_type).localeCompare(String(b.channel_type)));
  return adjusted.map((row, index) => ({
    ...row,
    recommended_order: index + 1,
  }));
}

function strategyFingerprint(input: {
  segmentKey: string;
  playbookKey: string | null;
  chosenChannel: string | null;
  chosenContactValue: string | null;
  chosenAngle: string;
  chosenTrigger: string;
  chosenCta: string;
  riskLevel: string;
  researchStatus: string;
  researchScore: number;
}) {
  return JSON.stringify(input);
}

function mapStrategyRow(row: any): StrategyDecisionView {
  return {
    id: String(row.id),
    version: Number(row.version || 1),
    strategy_status: clean(row.strategy_status, 24) || "active",
    segment_key: clean(row.segment_key, 80),
    playbook_key: clean(row.playbook_key, 120) || null,
    playbook_title: clean(row.playbook_title, 180) || null,
    chosen_channel: clean(row.chosen_channel, 24) || null,
    channel_plan: asArray(row.channel_plan).map((item) => clean(item, 40)).filter(Boolean),
    chosen_contact_channel: clean(row.chosen_contact_channel, 24) || null,
    chosen_contact_value: clean(row.chosen_contact_value, 500) || null,
    chosen_contact_confidence: toConfidence(row.chosen_contact_confidence),
    chosen_contact_candidate_id: clean(row.chosen_contact_candidate_id, 120) || null,
    chosen_cta: clean(row.chosen_cta, 80) || null,
    chosen_angle: clean(row.chosen_angle, 280) || null,
    chosen_trigger: clean(row.chosen_trigger, 280) || null,
    trigger_evidence: asArray(row.trigger_evidence).map((item) => clean(item, 220)).filter(Boolean),
    research_status: clean(row.research_status, 24) || null,
    research_score: Number.isFinite(Number(row.research_score)) ? Number(row.research_score) : null,
    risk_level: clean(row.risk_level, 24) || null,
    strategy_score: Number.isFinite(Number(row.strategy_score)) ? Number(row.strategy_score) : null,
    rationale: clean(row.rationale, 600) || null,
    fallback_plan: clean(row.fallback_plan, 400) || null,
    research_gaps: asArray(row.research_gaps).map((item) => clean(item, 220)).filter(Boolean),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

async function loadProspectStrategySupportData(supabase: any, args: {
  agentId: string;
  prospectId: string;
  prospect?: ProspectRow | null;
}): Promise<StrategySupportError | StrategySupportSuccess> {
  const prospectPromise = args.prospect
    ? Promise.resolve({ data: args.prospect, error: null })
    : (supabase.from("crm_prospects") as any)
        .select(
          "id, company_name, contact_name, contact_email, contact_role, city, region, website_url, source_url, source_checked_at, linkedin_url, linkedin_search_url, object_focus, active_listings_count, new_listings_30d, share_miete_percent, share_kauf_percent, target_group, process_hint, personalization_hook, personalization_evidence, pain_point_hypothesis, primary_pain_hypothesis, secondary_pain_hypothesis, primary_objection, response_promise_public, appointment_flow_public, docs_flow_public, automation_readiness, preferred_channel, fit_score",
        )
        .eq("agent_id", args.agentId)
        .eq("id", args.prospectId)
        .maybeSingle();

  const [prospectRes, evidenceRes, contactsRes, notesRes] = await Promise.all([
    prospectPromise,
    (supabase.from("crm_research_evidence") as any)
      .select("field_name, field_value, source_type, source_url, confidence, metadata, captured_at")
      .eq("agent_id", args.agentId)
      .eq("prospect_id", args.prospectId)
      .order("confidence", { ascending: false }),
    (supabase.from("crm_contact_candidates") as any)
      .select("id, channel_type, channel_value, confidence, is_primary, contact_name, contact_role, validation_status, source_type, source_url, metadata")
      .eq("agent_id", args.agentId)
      .eq("prospect_id", args.prospectId)
      .order("is_primary", { ascending: false })
      .order("confidence", { ascending: false }),
    (supabase.from("crm_research_notes") as any)
      .select("note, confidence, is_key_insight, created_at")
      .eq("agent_id", args.agentId)
      .eq("prospect_id", args.prospectId)
      .order("is_key_insight", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const firstError = prospectRes.error || evidenceRes.error || contactsRes.error || notesRes.error;
  if (firstError) {
    return {
      ok: false as const,
      error: isSchemaMismatch(firstError as any) ? "crm_strategy_schema_missing" : "crm_strategy_context_failed",
      details:
        isSchemaMismatch(firstError as any)
          ? "CRM-Strategie-Schema fehlt. Bitte zuerst die passende Migration ausfuehren."
          : firstError.message,
    };
  }
  if (!prospectRes.data) {
    return {
      ok: false as const,
      error: "prospect_not_found",
      details: "Prospect nicht gefunden.",
    };
  }

  return {
    ok: true as const,
    prospect: prospectRes.data as ProspectRow,
    evidenceRows: ((evidenceRes.data || []) as EvidenceRow[]),
    contactRows: ((contactsRes.data || []) as ContactRow[]),
    notes: ((notesRes.data || []) as any[])
      .map((row) => clean(row?.note, 240))
      .filter(Boolean),
  };
}

export async function ensureProspectStrategyDecision(supabase: any, args: {
  agentId: string;
  prospectId: string;
  force?: boolean;
  prospect?: ProspectRow | null;
}): Promise<EnsureProspectStrategyDecisionResult> {
  const loaded = await loadProspectStrategySupportData(supabase, args);
  if (!loaded.ok) {
    const loadedError = loaded as StrategySupportError;
    return {
      ok: false,
      error: loadedError.error,
      details: loadedError.details,
    };
  }

  const { prospect, evidenceRows, contactRows, notes } = loaded;
  const segmentKey = inferSegmentFromProspect({
    object_focus: clean(prospect.object_focus, 24) || null,
    share_miete_percent: Number.isFinite(Number(prospect.share_miete_percent))
      ? Number(prospect.share_miete_percent)
      : null,
    share_kauf_percent: Number.isFinite(Number(prospect.share_kauf_percent))
      ? Number(prospect.share_kauf_percent)
      : null,
    active_listings_count: Number.isFinite(Number(prospect.active_listings_count))
      ? Number(prospect.active_listings_count)
      : null,
    automation_readiness: clean(prospect.automation_readiness, 24) || null,
  });
  const playbook = getPlaybookForSegment(segmentKey);
  const learningSnapshot = await loadCurrentLearningSnapshot(supabase, args.agentId).catch(() => null);
  const triggerEvidence = collectTriggerEvidence({
    companyName: clean(prospect.company_name, 160),
    city: clean(prospect.city, 120) || null,
    region: clean(prospect.region, 120) || null,
    objectFocus: clean(prospect.object_focus, 24) || null,
    activeListingsCount: Number.isFinite(Number(prospect.active_listings_count))
      ? Number(prospect.active_listings_count)
      : null,
    newListings30d: Number.isFinite(Number(prospect.new_listings_30d))
      ? Number(prospect.new_listings_30d)
      : null,
    shareMietePercent: Number.isFinite(Number(prospect.share_miete_percent))
      ? Number(prospect.share_miete_percent)
      : null,
    shareKaufPercent: Number.isFinite(Number(prospect.share_kauf_percent))
      ? Number(prospect.share_kauf_percent)
      : null,
    targetGroup: clean(prospect.target_group, 180) || null,
    processHint: clean(prospect.process_hint, 220) || null,
    personalizationHook: clean(prospect.personalization_hook, 220) || null,
    personalizationEvidence: clean(prospect.personalization_evidence, 240) || null,
    sourceCheckedAt: clean(prospect.source_checked_at, 40) || null,
  });
  const research = assessResearchReadiness({
    preferredChannel: clean(prospect.preferred_channel, 24) || null,
    contactEmail: clean(prospect.contact_email, 320) || null,
    personalizationHook: clean(prospect.personalization_hook, 220) || null,
    personalizationEvidence: clean(prospect.personalization_evidence, 320) || null,
    researchInsights: notes.join(" "),
    sourceCheckedAt: clean(prospect.source_checked_at, 40) || null,
    targetGroup: clean(prospect.target_group, 180) || null,
    processHint: clean(prospect.process_hint, 220) || null,
    responsePromisePublic: clean(prospect.response_promise_public, 180) || null,
    appointmentFlowPublic: clean(prospect.appointment_flow_public, 180) || null,
    docsFlowPublic: clean(prospect.docs_flow_public, 180) || null,
    activeListingsCount: Number.isFinite(Number(prospect.active_listings_count))
      ? Number(prospect.active_listings_count)
      : null,
    automationReadiness: clean(prospect.automation_readiness, 24) || null,
    linkedinUrl: clean(prospect.linkedin_url, 320) || null,
    linkedinSearchUrl: clean(prospect.linkedin_search_url, 320) || null,
  });
  const rankedContacts = applyLearningToRankedContacts({
    rankedContacts: rankContactCandidates({
      prospect,
      contactRows,
      researchStatus: research.status,
    }),
    learningSnapshot,
    segmentKey,
  });
  const topContact = rankedContacts[0] || null;
  const chosenChannel = topContact?.channel_type || clean(prospect.preferred_channel, 24) || "email";
  const chosenAngle = chooseAngle(prospect, evidenceRows, notes);
  const chosenTrigger = chooseTrigger(triggerEvidence, evidenceRows, prospect);
  const chosenCta = chooseCta({
    researchScore: research.score,
    automationReadiness: clean(prospect.automation_readiness, 24) || null,
    topContact,
  });
  const riskLevel = chooseRiskLevel({
    researchStatus: research.status,
    researchScore: research.score,
    topContact,
  });
  const channelPlan = buildChannelPlan(clean(prospect.preferred_channel, 24) || null, rankedContacts);
  const timingPolicy = evaluateSendTiming({
    channel: chosenChannel,
    prospect,
    learningSnapshot,
    timezone: "Europe/Berlin",
  });
  const researchGaps = dedupeList([...research.blockers, ...research.warnings], 6);
  const valueNarrative = valueNarrativeForSegment(segmentKey, clean(prospect.object_focus, 24) || null);
  const objection = routeObjection(clean(prospect.primary_objection, 240) || null);
  const strategyScore = clamp(
    research.score * 0.55 +
      (topContact ? topContact.score : 25) * 0.3 +
      (Number.isFinite(Number(prospect.fit_score)) ? Number(prospect.fit_score) : 50) * 0.15 +
      Number(getChannelLearningAdjustment(learningSnapshot, chosenChannel, segmentKey).score_adjustment || 0) * 0.35,
  );
  const learningReason = getChannelLearningAdjustment(learningSnapshot, chosenChannel, segmentKey).reason;
  const fallbackPlan =
    chosenChannel === "email"
      ? "Wenn keine Antwort kommt oder die Mail nicht passt: LinkedIn testen, danach Kontaktformular oder Telefon."
      : chosenChannel === "linkedin"
        ? "Wenn LinkedIn nicht greift: E-Mail probieren, danach Kontaktformular oder Telefon."
        : "Wenn der erste Kontaktpfad nicht greift: auf E-Mail oder LinkedIn ausweichen und Kontakt neu priorisieren.";
  const rationale = clean(
    `${clean(prospect.company_name, 160)} passt ins Segment ${segmentKey}. Start mit ${chosenChannel} ueber ${
      topContact?.channel_value || "den besten verfuegbaren Kontaktpfad"
    }, weil ${chosenTrigger} Angle: ${chosenAngle} CTA: ${chosenCta}. Timing: ${timingPolicy.recommended_window_label}. Nutzen: ${valueNarrative}. Einwandlinie: ${objection.label}.${learningReason ? ` Learning: ${learningReason}.` : ""}`,
    600,
  );

  const fingerprint = strategyFingerprint({
    segmentKey,
    playbookKey: playbook?.key || null,
    chosenChannel,
    chosenContactValue: topContact?.channel_value || null,
    chosenAngle,
    chosenTrigger,
    chosenCta,
    riskLevel,
    researchStatus: research.status,
    researchScore: research.score,
  });

  const { data: currentRow, error: currentError } = await (supabase.from("crm_strategy_decisions") as any)
    .select("*")
    .eq("agent_id", args.agentId)
    .eq("prospect_id", args.prospectId)
    .eq("is_current", true)
    .maybeSingle();

  if (currentError) {
    return {
      ok: false as const,
      error: isSchemaMismatch(currentError as any) ? "crm_strategy_schema_missing" : "crm_strategy_lookup_failed",
      details:
        isSchemaMismatch(currentError as any)
          ? "CRM-Strategie-Schema fehlt. Bitte zuerst die passende Migration ausfuehren."
          : currentError.message,
    };
  }

  const currentFingerprint = clean(currentRow?.metadata?.fingerprint, 5000);
  if (currentRow && !args.force && currentFingerprint === fingerprint) {
    return {
      ok: true as const,
      strategy: mapStrategyRow(currentRow),
      rankedContacts,
      research,
      generated: false,
    };
  }

  const nextVersion = Number(currentRow?.version || 0) + 1;
  if (currentRow?.id) {
    await (supabase.from("crm_strategy_decisions") as any)
      .update({
        is_current: false,
        strategy_status: currentRow.strategy_status === "rejected" ? "rejected" : "superseded",
      })
      .eq("id", currentRow.id)
      .eq("agent_id", args.agentId);
  }

  const insertPayload = {
    agent_id: args.agentId,
    prospect_id: args.prospectId,
    version: nextVersion,
    is_current: true,
    strategy_status: "active",
    segment_key: segmentKey,
    playbook_key: playbook?.key || null,
    playbook_title: playbook?.title || null,
    chosen_channel: chosenChannel,
    channel_plan: channelPlan,
    chosen_contact_channel: topContact?.channel_type || null,
    chosen_contact_value: topContact?.channel_value || null,
    chosen_contact_confidence: topContact?.confidence,
    chosen_contact_candidate_id: topContact?.id || null,
    chosen_cta: chosenCta,
    chosen_angle: chosenAngle,
    chosen_trigger: chosenTrigger,
    trigger_evidence: triggerEvidence.slice(0, 6),
    research_status: research.status,
    research_score: research.score,
    risk_level: riskLevel,
    strategy_score: strategyScore,
    rationale,
    fallback_plan: fallbackPlan,
    research_gaps: researchGaps,
    metadata: {
      fingerprint,
      ranked_contacts: rankedContacts.slice(0, 6),
      evidence_highlights: evidenceRows.slice(0, 6).map((row) => ({
        field_name: clean(row.field_name, 80),
        field_value: clean(row.field_value, 220),
        confidence: toConfidence(row.confidence),
      })),
      note_highlights: notes.slice(0, 4),
      learning_summary: learningSnapshot
        ? {
            computed_at: learningSnapshot.computed_at,
            positive_rate: learningSnapshot.summary.positive_rate,
            negative_rate: learningSnapshot.summary.negative_rate,
            channel_reason: learningReason,
          }
        : null,
      playbook_sequence: playbook?.sequence || [],
      playbook_stop_rules: playbook?.stop_rules || [],
      objection_route: {
        key: objection.key,
        label: objection.label,
        response_pillar: objection.response_pillar,
      },
      timing_policy: timingPolicy,
      value_narrative: valueNarrative,
    },
  };

  const { data: insertedRow, error: insertError } = await (supabase.from("crm_strategy_decisions") as any)
    .insert(insertPayload)
    .select("*")
    .single();

  if (insertError || !insertedRow) {
    const isDuplicateCurrentStrategy =
      !!insertError &&
      (String((insertError as any)?.code || "") === "23505" ||
        String(insertError?.message || "").includes("crm_strategy_decisions_current_unique"));

    if (isDuplicateCurrentStrategy) {
      const { data: recoveredRow, error: recoveredError } = await (supabase.from("crm_strategy_decisions") as any)
        .select("*")
        .eq("agent_id", args.agentId)
        .eq("prospect_id", args.prospectId)
        .eq("is_current", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!recoveredError && recoveredRow) {
        return {
          ok: true as const,
          strategy: mapStrategyRow(recoveredRow),
          rankedContacts,
          research,
          generated: false,
        };
      }
    }

    return {
      ok: false as const,
      error: "crm_strategy_insert_failed",
      details: insertError?.message || "Strategie konnte nicht gespeichert werden.",
    };
  }

  return {
    ok: true as const,
    strategy: mapStrategyRow(insertedRow),
    rankedContacts,
    research,
    generated: true,
  };
}
