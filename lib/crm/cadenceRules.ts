import { inferSegmentFromProspect, type SalesSegmentKey } from "@/lib/crm/salesIntelResearch";

export type CadenceMessageKind =
  | "first_touch"
  | "follow_up_1"
  | "follow_up_2"
  | "follow_up_3"
  | "custom";

export type CadenceChannel =
  | "email"
  | "linkedin"
  | "telefon"
  | "kontaktformular"
  | "whatsapp"
  | "sonstiges";

export type CadenceStep = {
  step_number: 1 | 2 | 3 | 4 | 5;
  day_offset: number;
  message_kind: CadenceMessageKind;
  channel: CadenceChannel;
  label: string;
  objective: string;
  intro_variant: string;
  trigger_variant: string;
  cta_variant: string;
  subject_variant: string;
};

export type TriggerEvidenceInput = {
  companyName?: string | null;
  city?: string | null;
  region?: string | null;
  objectFocus?: string | null;
  activeListingsCount?: number | null;
  newListings30d?: number | null;
  shareMietePercent?: number | null;
  shareKaufPercent?: number | null;
  targetGroup?: string | null;
  processHint?: string | null;
  personalizationHook?: string | null;
  personalizationEvidence?: string | null;
  sourceCheckedAt?: string | null;
};

export type FirstTouchGuardrailResult = {
  pass: boolean;
  reasons: string[];
  word_count: number;
  sentence_count: number;
  trigger_evidence_count: number;
};

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 2000) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

export function collectTriggerEvidence(input: TriggerEvidenceInput) {
  const list: string[] = [];
  const companyName = normalizeLine(input.companyName, 160);
  const city = normalizeLine(input.city, 120);
  const region = normalizeLine(input.region, 120);
  const focus = normalizeLine(input.objectFocus, 32);

  if (
    Number.isFinite(Number(input.activeListingsCount)) &&
    Number(input.activeListingsCount) > 0
  ) {
    const miete =
      Number.isFinite(Number(input.shareMietePercent)) && Number(input.shareMietePercent) >= 0
        ? Number(input.shareMietePercent)
        : null;
    const kauf =
      Number.isFinite(Number(input.shareKaufPercent)) && Number(input.shareKaufPercent) >= 0
        ? Number(input.shareKaufPercent)
        : null;
    list.push(
      `${companyName || "Firma"} hat aktuell rund ${Math.round(
        Number(input.activeListingsCount),
      )} aktive Inserate${
        miete !== null || kauf !== null ? ` (Miete ${miete ?? "?"}% / Kauf ${kauf ?? "?"}%)` : ""
      }.`,
    );
  }

  if (Number.isFinite(Number(input.newListings30d)) && Number(input.newListings30d) > 0) {
    list.push(
      `In den letzten 30 Tagen sind etwa ${Math.round(
        Number(input.newListings30d),
      )} neue Inserate sichtbar.`,
    );
  }

  if (city || region) {
    list.push(`Regionale Präsenz in ${[city, region].filter(Boolean).join(", ")} ist klar erkennbar.`);
  }

  if (focus) {
    const focusLabel =
      focus === "miete"
        ? "Vermietung"
        : focus === "kauf"
          ? "Verkauf"
          : focus === "neubau"
            ? "Neubau"
            : "gemischte Vermarktung";
    list.push(`Der sichtbare Schwerpunkt liegt bei ${focusLabel}.`);
  }

  const target = normalizeText(input.targetGroup, 220);
  if (target) list.push(`Die Zielgruppe wirkt auf ${target} fokussiert.`);

  const processHint = normalizeText(input.processHint, 220);
  if (processHint) list.push(processHint);

  const hook = normalizeText(input.personalizationHook, 240);
  if (hook) list.push(hook);

  const evidence = normalizeText(input.personalizationEvidence, 260);
  if (evidence) list.push(evidence);

  const sourceChecked = normalizeLine(input.sourceCheckedAt, 40);
  if (sourceChecked) list.push(`Öffentliche Daten zuletzt geprüft am ${sourceChecked}.`);

  return Array.from(new Set(list.filter(Boolean))).slice(0, 8);
}

function wordCount(text: string) {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words.length;
}

function sentenceCount(text: string) {
  return text
    .split(/[.!?]+/)
    .map((x) => x.trim())
    .filter(Boolean).length;
}

export function evaluateFirstTouchGuardrails(args: {
  body: string;
  triggerEvidenceCount: number;
}) : FirstTouchGuardrailResult {
  const body = normalizeText(args.body, 4000);
  const lower = body.toLowerCase();
  const words = wordCount(body);
  const sentences = sentenceCount(body);
  const reasons: string[] = [];

  if (!body) reasons.push("Nachrichtentext fehlt.");
  if (words > 95) reasons.push("Erstkontakt ist zu lang (maximal 95 Wörter).");
  if (words < 18) reasons.push("Erstkontakt ist zu kurz und wirkt unklar.");
  if (sentences > 5) reasons.push("Erstkontakt hat zu viele Sätze (maximal 5).");
  if (!lower.includes("?")) reasons.push("Erstkontakt endet nicht mit einer kleinen Frage.");
  if (args.triggerEvidenceCount < 2) reasons.push("Zu wenig Trigger-Evidenz (mindestens 2 konkrete Signale).");

  const bannedPitchPatterns = [
    /\bdemo\b/i,
    /\bkostenlos testen\b/i,
    /\b30 minuten\b/i,
    /\bangebot\b/i,
    /\bpreis\b/i,
    /\bvertrag\b/i,
    /\babschlus(s|squote)\b/i,
    /\b10x\b/i,
    /\brevolution[aä]r\b/i,
    /\bnext level\b/i,
  ];
  if (bannedPitchPatterns.some((r) => r.test(body))) {
    reasons.push("Erstkontakt enthält zu harten oder werblichen Pitch.");
  }

  const hasSafetySignal =
    lower.includes("freigabe") &&
    (lower.includes("qualitätscheck") ||
      lower.includes("qualitaetscheck") ||
      lower.includes("qualitätskontroll") ||
      lower.includes("qualitaetskontroll"));
  if (!hasSafetySignal) {
    reasons.push("Sicherheitslogik (Freigabe + Qualitätschecks) ist nicht klar genug enthalten.");
  }

  return {
    pass: reasons.length === 0,
    reasons,
    word_count: words,
    sentence_count: sentences,
    trigger_evidence_count: args.triggerEvidenceCount,
  };
}

function defaultChannels(args: {
  preferredChannel: string | null | undefined;
  hasLinkedin: boolean;
}) {
  const preferred = String(args.preferredChannel || "").trim().toLowerCase();
  const c2: CadenceChannel = args.hasLinkedin ? "linkedin" : "email";
  const c4: CadenceChannel = preferred === "telefon" ? "telefon" : args.hasLinkedin ? "linkedin" : "email";
  return {
    step1: "email" as CadenceChannel,
    step2: c2,
    step3: "email" as CadenceChannel,
    step4: c4,
    step5: "email" as CadenceChannel,
  };
}

function cadenceBySegment(segment: SalesSegmentKey, channels: ReturnType<typeof defaultChannels>): CadenceStep[] {
  const base: CadenceStep[] = [
    {
      step_number: 1,
      day_offset: 0,
      message_kind: "first_touch",
      channel: channels.step1,
      label: "Tag 0 · Relevanz prüfen",
      objective: "Problemrelevanz prüfen, kein Produktpitch.",
      intro_variant: "founder_context_v1",
      trigger_variant: "visible_setup_signal_v1",
      cta_variant: "relevance_question_v1",
      subject_variant: "operativ_kurz_v1",
    },
    {
      step_number: 2,
      day_offset: 2,
      message_kind: "follow_up_1",
      channel: channels.step2,
      label: "Tag 2 · Kurz nachfassen",
      objective: "Reibungsarm erinnern, gleiche Problemhypothese bestätigen.",
      intro_variant: "soft_bump_v1",
      trigger_variant: "capacity_pressure_v1",
      cta_variant: "quick_relevance_check_v1",
      subject_variant: "none",
    },
    {
      step_number: 3,
      day_offset: 5,
      message_kind: "follow_up_2",
      channel: channels.step3,
      label: "Tag 5 · Lösung vorsichtig öffnen",
      objective: "Advaic erstmals nennen, Guardrails konkret machen.",
      intro_variant: "problem_to_solution_v1",
      trigger_variant: "workflow_mechanic_v1",
      cta_variant: "send_examples_v1",
      subject_variant: "safety_angle_v1",
    },
    {
      step_number: 4,
      day_offset: 9,
      message_kind: "follow_up_3",
      channel: channels.step4,
      label: "Tag 9 · Einwand adressieren",
      objective: "Kontroll-/Qualitäts-Einwand sauber beantworten.",
      intro_variant: "objection_route_v1",
      trigger_variant: "guardrail_proof_v1",
      cta_variant: "permission_next_step_v1",
      subject_variant: "none",
    },
    {
      step_number: 5,
      day_offset: 13,
      message_kind: "custom",
      channel: channels.step5,
      label: "Tag 13 · Breakup",
      objective: "Respektvoll abschließen oder Erlaubnis für später klären.",
      intro_variant: "breakup_respectful_v1",
      trigger_variant: "last_relevance_check_v1",
      cta_variant: "close_or_keep_open_v1",
      subject_variant: "breakup_short_v1",
    },
  ];

  if (segment === "solo_miete_volumen") {
    base[0].trigger_variant = "miete_volume_signal_v1";
    base[2].trigger_variant = "speed_to_reply_v1";
    base[3].cta_variant = "micro_call_permission_v1";
  } else if (segment === "solo_kauf_beratung") {
    base[0].trigger_variant = "consulting_quality_signal_v1";
    base[2].trigger_variant = "clarity_and_style_v1";
  } else if (segment === "neubau_vertrieb") {
    base[0].trigger_variant = "parallel_objects_signal_v1";
    base[2].trigger_variant = "team_governance_signal_v1";
  } else if (segment === "vorsichtig_starter") {
    base[2].cta_variant = "safe_start_question_v1";
    base[3].intro_variant = "trust_reassurance_v1";
  }

  return base;
}

export function buildCadenceV1(args: {
  objectFocus?: string | null;
  shareMietePercent?: number | null;
  shareKaufPercent?: number | null;
  activeListingsCount?: number | null;
  automationReadiness?: string | null;
  preferredChannel?: string | null;
  hasLinkedin?: boolean;
}) {
  const segment = inferSegmentFromProspect({
    object_focus: args.objectFocus || null,
    share_miete_percent:
      Number.isFinite(Number(args.shareMietePercent)) ? Number(args.shareMietePercent) : null,
    share_kauf_percent:
      Number.isFinite(Number(args.shareKaufPercent)) ? Number(args.shareKaufPercent) : null,
    active_listings_count:
      Number.isFinite(Number(args.activeListingsCount)) ? Number(args.activeListingsCount) : null,
    automation_readiness: args.automationReadiness || null,
  });
  const channels = defaultChannels({
    preferredChannel: args.preferredChannel || null,
    hasLinkedin: Boolean(args.hasLinkedin),
  });
  return {
    cadence_key: "cadence_v1_5touch_14d",
    segment,
    steps: cadenceBySegment(segment, channels),
    stop_rules: [
      "stop_on_reply_received",
      "stop_on_bounce_detected",
      "stop_on_opt_out",
      "stop_on_no_interest",
      "stop_on_risk_high",
    ],
  };
}

export function deriveAbFields(args: {
  messageKind: CadenceMessageKind;
  templateVariant: string | null | undefined;
  cadenceStep?: number | null;
}) {
  const variant = normalizeLine(args.templateVariant, 120).toLowerCase();

  const fromCadenceStep = (step: number | null | undefined) => {
    if (step === 1) return "relevance_question_v1";
    if (step === 2) return "quick_relevance_check_v1";
    if (step === 3) return "send_examples_v1";
    if (step === 4) return "permission_next_step_v1";
    if (step === 5) return "close_or_keep_open_v1";
    return "unspecified_v1";
  };

  let ab_intro_variant = "human_context_v1";
  let ab_trigger_variant = "visible_signal_v1";
  let ab_cta_variant = fromCadenceStep(args.cadenceStep);
  let ab_subject_variant = args.messageKind === "custom" ? "breakup_short_v1" : "operativ_kurz_v1";

  if (variant.includes("pain_metric")) {
    ab_intro_variant = "founder_direct_v2";
    ab_trigger_variant = "pain_metric_v1";
    ab_cta_variant = "relevance_question_v2";
    ab_subject_variant = "reaktionszeit_v1";
  } else if (variant.includes("value_safe_start")) {
    ab_intro_variant = "founder_direct_v1";
    ab_trigger_variant = "safe_start_value_v1";
    ab_cta_variant = "relevance_question_v1";
    ab_subject_variant = "anfragen_v1";
  } else if (variant.includes("soft_reminder")) {
    ab_intro_variant = "soft_bump_v1";
    ab_cta_variant = "quick_relevance_check_v1";
    ab_subject_variant = "none";
  } else if (variant.includes("guardrail_proof")) {
    ab_intro_variant = "objection_route_v1";
    ab_trigger_variant = "guardrail_proof_v1";
    ab_cta_variant = "permission_next_step_v1";
    ab_subject_variant = "none";
  } else if (variant.includes("risk_reversal")) {
    ab_intro_variant = "risk_reversal_v1";
    ab_trigger_variant = "safety_mechanic_v1";
    ab_cta_variant = "send_examples_v1";
    ab_subject_variant = "kontrolle_v1";
  } else if (variant.includes("last_call") || variant.includes("breakup")) {
    ab_intro_variant = "breakup_respectful_v1";
    ab_trigger_variant = "last_relevance_check_v1";
    ab_cta_variant = "close_or_keep_open_v1";
    ab_subject_variant = "breakup_short_v1";
  } else if (variant.includes("email_personal_v2")) {
    ab_intro_variant = "founder_context_v1";
    ab_trigger_variant = "visible_setup_signal_v1";
    ab_cta_variant = "relevance_question_v1";
    ab_subject_variant = "anfragen_v1";
  } else if (variant.includes("linkedin_compact_v2")) {
    ab_intro_variant = "social_short_v1";
    ab_trigger_variant = "capacity_pressure_v1";
    ab_cta_variant = "quick_relevance_check_v1";
    ab_subject_variant = "none";
  }

  return {
    ab_intro_variant,
    ab_trigger_variant,
    ab_cta_variant,
    ab_subject_variant,
  };
}
