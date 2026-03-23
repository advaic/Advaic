"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import DraftClaimHighlight from "@/components/crm/DraftClaimHighlight";
import DraftRewriteDiff, { type DraftRewriteSnapshot } from "@/components/crm/DraftRewriteDiff";
import OutboundEvidenceInspector, {
  type DraftEvidenceReview,
} from "@/components/crm/OutboundEvidenceInspector";
import ResearchChangeDiff from "@/components/crm/ResearchChangeDiff";
import {
  assessContactSafety,
  contactSafetyBadgeClass,
  contactSafetyLabel,
} from "@/lib/crm/contactSafety";
import {
  assessResearchReadiness,
  outboundQualityStatusLabel,
  researchStatusLabel,
} from "@/lib/crm/outboundQuality";

type Prospect = {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_role: string | null;
  city: string | null;
  region: string | null;
  website_url: string | null;
  source_url: string | null;
  source_checked_at: string | null;
  linkedin_url: string | null;
  linkedin_search_url: string | null;
  linkedin_headline: string | null;
  linkedin_relevance_note: string | null;
  object_focus: string | null;
  active_listings_count: number | null;
  new_listings_30d: number | null;
  share_miete_percent: number | null;
  share_kauf_percent: number | null;
  object_types: string[] | null;
  price_band_main: string | null;
  region_focus_micro: string | null;
  response_promise_public: string | null;
  appointment_flow_public: string | null;
  docs_flow_public: string | null;
  owner_led: boolean | null;
  years_in_market: number | null;
  trust_signals: string[] | null;
  brand_tone: string | null;
  primary_objection: string | null;
  primary_pain_hypothesis: string | null;
  secondary_pain_hypothesis: string | null;
  automation_readiness: string | null;
  cta_preference_guess: string | null;
  personalization_evidence: string | null;
  hypothesis_confidence: number | null;
  personalization_hook: string | null;
  target_group: string | null;
  process_hint: string | null;
  pain_point_hypothesis: string | null;
  fit_score: number;
  priority: "A" | "B" | "C";
  stage: string;
  preferred_channel: string;
  next_action: string | null;
  next_action_at: string | null;
};

type NextAction = {
  prospect_id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  object_focus: string | null;
  preferred_channel: string | null;
  priority: "A" | "B" | "C";
  fit_score: number;
  stage: string;
  recommended_action: string | null;
  recommended_reason: string | null;
  recommended_code: string | null;
  recommended_primary_label: string | null;
  recommended_at: string | null;
  research?: {
    status: "ready" | "refresh_research" | "needs_research" | "missing_contact";
    score: number;
    summary: string;
    blockers: string[];
    warnings: string[];
  };
};

type ResearchNote = {
  id: string;
  source_type: string;
  source_url: string | null;
  note: string;
  confidence: number | null;
  is_key_insight: boolean;
  metadata?: Record<string, any> | null;
  created_at: string;
};

type ResearchEvidenceRow = {
  id: string;
  field_name: string | null;
  field_value: string | null;
  source_type: string | null;
  source_url: string | null;
  confidence: number | null;
  metadata?: Record<string, any> | null;
  captured_at: string | null;
};

type OutreachMessage = {
  id: string;
  channel: string;
  message_kind: string;
  subject: string | null;
  body: string;
  personalization_score: number | null;
  status: "draft" | "ready" | "sent" | "failed" | "archived";
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any> | null;
};

type OutreachEvent = {
  id: string;
  message_id: string | null;
  event_type: string;
  details: string | null;
  event_at: string;
  created_at: string;
};

type MessagePackItem = {
  channel: "email" | "linkedin" | "telefon";
  variant: string;
  subject: string;
  body: string;
  why: string;
  review_status?: "pass" | "needs_review" | "blocked";
  review_score?: number;
  review_summary?: string;
};

type DraftReview = DraftEvidenceReview;

type DraftRewriteResponse = {
  ok: boolean;
  generated_with?: "ai" | "fallback";
  rewritten_draft?: {
    subject: string;
    body: string;
  } | null;
  current_review?: DraftReview | null;
  rewrite_review?: DraftReview | null;
  improvement_summary?: string | null;
  change_summary?: string | null;
  error?: string;
  details?: string;
};

type DraftReviewResponse = {
  ok: boolean;
  review?: DraftReview | null;
  error?: string;
  details?: string;
};

type RankedContactCandidate = {
  id: string | null;
  channel_type: string;
  channel_value: string;
  contact_name: string | null;
  contact_role: string | null;
  source_type?: string | null;
  confidence: number | null;
  is_primary: boolean;
  validation_status: string | null;
  source_url: string | null;
  score: number;
  reason: string;
  recommended_order: number;
};

type StrategyDecision = {
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
  metadata?: Record<string, any> | null;
};

type StrategyResponse = {
  ok: boolean;
  generated?: boolean;
  strategy?: StrategyDecision | null;
  ranked_contacts?: RankedContactCandidate[];
  research?: {
    status: "ready" | "refresh_research" | "needs_research" | "missing_contact";
    score: number;
    summary: string;
    blockers: string[];
    warnings: string[];
  } | null;
  error?: string;
  details?: string;
};

type SequenceStep = {
  step_number: 1 | 2 | 3 | 4 | 5;
  day_offset: number;
  message_kind: "first_touch" | "follow_up_1" | "follow_up_2" | "follow_up_3" | "custom";
  channel: "email" | "linkedin" | "telefon" | "kontaktformular" | "whatsapp";
  label: string;
};

const STAGE_OPTIONS = [
  "new",
  "researching",
  "contacted",
  "replied",
  "pilot_invited",
  "pilot_active",
  "pilot_finished",
  "won",
  "lost",
  "nurture",
];

const STAGE_LABELS: Record<string, string> = {
  new: "Neu",
  researching: "Recherche",
  contacted: "Kontaktiert",
  replied: "Antwort erhalten",
  pilot_invited: "Pilot eingeladen",
  pilot_active: "Pilot aktiv",
  pilot_finished: "Pilot abgeschlossen",
  won: "Gewonnen",
  lost: "Verloren",
  nurture: "Später nachfassen",
};

const EVENT_LABELS: Record<string, string> = {
  message_sent: "Nachricht gesendet",
  message_failed: "Nachricht fehlgeschlagen",
  reply_received: "Antwort erhalten",
  call_booked: "Call gebucht",
  pilot_invited: "Pilot eingeladen",
  pilot_accepted: "Pilot zugesagt",
  pilot_started: "Pilot gestartet",
  pilot_completed: "Pilot abgeschlossen",
  deal_won: "Gewonnen",
  deal_lost: "Verloren",
  unsubscribed: "Abgemeldet",
  no_interest: "Kein Interesse",
  follow_up_due: "Follow-up fällig",
};

function buildDraftSignature(args: {
  channel: string;
  kind: string;
  subject: string;
  body: string;
}) {
  return [
    String(args.channel || "").trim().toLowerCase(),
    String(args.kind || "").trim().toLowerCase(),
    String(args.subject || "").trim(),
    String(args.body || "")
      .replace(/\r/g, "")
      .trim(),
  ].join("::");
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function toDateTimeLocalValue(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeStringArray(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeStrategyDecision(input: StrategyDecision | Record<string, any> | null | undefined): StrategyDecision | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, any>;
  const id = String(row.id || "").trim();
  if (!id) return null;
  return {
    id,
    version: Number.isFinite(Number(row.version)) ? Number(row.version) : 1,
    strategy_status: String(row.strategy_status || "active").trim() || "active",
    segment_key: String(row.segment_key || "").trim(),
    playbook_key: row.playbook_key ? String(row.playbook_key).trim() : null,
    playbook_title: row.playbook_title ? String(row.playbook_title).trim() : null,
    chosen_channel: row.chosen_channel ? String(row.chosen_channel).trim() : null,
    channel_plan: normalizeStringArray(row.channel_plan),
    chosen_contact_channel: row.chosen_contact_channel ? String(row.chosen_contact_channel).trim() : null,
    chosen_contact_value: row.chosen_contact_value ? String(row.chosen_contact_value).trim() : null,
    chosen_contact_confidence: Number.isFinite(Number(row.chosen_contact_confidence))
      ? Number(row.chosen_contact_confidence)
      : null,
    chosen_contact_candidate_id: row.chosen_contact_candidate_id ? String(row.chosen_contact_candidate_id).trim() : null,
    chosen_cta: row.chosen_cta ? String(row.chosen_cta).trim() : null,
    chosen_angle: row.chosen_angle ? String(row.chosen_angle).trim() : null,
    chosen_trigger: row.chosen_trigger ? String(row.chosen_trigger).trim() : null,
    trigger_evidence: normalizeStringArray(row.trigger_evidence),
    research_status: row.research_status ? String(row.research_status).trim() : null,
    research_score: Number.isFinite(Number(row.research_score)) ? Number(row.research_score) : null,
    risk_level: row.risk_level ? String(row.risk_level).trim() : null,
    strategy_score: Number.isFinite(Number(row.strategy_score)) ? Number(row.strategy_score) : null,
    rationale: row.rationale ? String(row.rationale).trim() : null,
    fallback_plan: row.fallback_plan ? String(row.fallback_plan).trim() : null,
    research_gaps: normalizeStringArray(row.research_gaps),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
  };
}

function stageBadgeClass(stage: string) {
  if (stage === "won") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (stage === "lost") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (stage.startsWith("pilot")) return "bg-blue-50 text-blue-700 ring-blue-200";
  if (stage === "replied") return "bg-sky-50 text-sky-700 ring-sky-200";
  return "bg-gray-50 text-gray-700 ring-gray-200";
}

function researchBadgeClass(status: string | null | undefined) {
  if (status === "ready") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "refresh_research") return "bg-amber-50 text-amber-800 ring-amber-200";
  if (status === "missing_contact") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-blue-50 text-blue-700 ring-blue-200";
}

function reviewBadgeClass(status: string | null | undefined) {
  if (status === "pass") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "needs_review") return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

function getRiskLevel(args: { prospect: Prospect; nextAction: NextAction | null }) {
  const reasons: string[] = [];
  const research = assessResearchReadiness({
    preferredChannel: args.prospect.preferred_channel,
    contactEmail: args.prospect.contact_email,
    personalizationHook: args.prospect.personalization_hook,
    personalizationEvidence: args.prospect.personalization_evidence,
    sourceCheckedAt: args.prospect.source_checked_at,
    responsePromisePublic: args.prospect.response_promise_public,
    appointmentFlowPublic: args.prospect.appointment_flow_public,
    docsFlowPublic: args.prospect.docs_flow_public,
    activeListingsCount: args.prospect.active_listings_count,
    automationReadiness: args.prospect.automation_readiness,
    linkedinUrl: args.prospect.linkedin_url,
    linkedinSearchUrl: args.prospect.linkedin_search_url,
  });
  if (
    String(args.prospect.preferred_channel || "").toLowerCase() === "email" &&
    !String(args.prospect.contact_email || "").trim()
  ) {
    reasons.push("E-Mail als Präferenz, aber keine Kontakt-E-Mail hinterlegt");
  }
  if (!String(args.prospect.personalization_hook || "").trim()) {
    reasons.push("Personalisierungs-Hook fehlt");
  }
  if (!String(args.prospect.primary_objection || "").trim()) {
    reasons.push("Primäre Objection nicht dokumentiert");
  }
  if (String(args.nextAction?.recommended_code || "").includes("switch_channel_after_bounce")) {
    reasons.push("Kanalwechsel empfohlen (Bounce-/Zustellrisiko)");
  }
  if (research.status !== "ready") {
    reasons.push(`Research nicht sendbereit (${researchStatusLabel(research.status)})`);
  }
  const score = Math.max(0, 100 - reasons.length * 20);
  if (score >= 80) return { label: "Niedrig", score, reasons };
  if (score >= 55) return { label: "Mittel", score, reasons };
  return { label: "Hoch", score, reasons };
}

function isEmailChannel(channel: string | null | undefined) {
  return String(channel || "").trim().toLowerCase() === "email";
}

function cadenceStepForMessageKind(kind: string) {
  if (kind === "first_touch") return 1;
  if (kind === "follow_up_1") return 2;
  if (kind === "follow_up_2") return 3;
  if (kind === "follow_up_3") return 4;
  if (kind === "custom") return 5;
  return null;
}

function buildExternalChannelLink(
  channel: string | null | undefined,
  prospect: Prospect,
) {
  const safeChannel = String(channel || "").trim().toLowerCase();
  if (safeChannel === "linkedin") {
    const href = prospect.linkedin_url || prospect.linkedin_search_url;
    return href ? { href, label: "LinkedIn öffnen" } : null;
  }
  if (safeChannel === "kontaktformular") {
    return prospect.website_url
      ? { href: prospect.website_url, label: "Website öffnen" }
      : null;
  }
  if (safeChannel === "email") {
    return prospect.contact_email
      ? { href: `mailto:${prospect.contact_email}`, label: "E-Mail öffnen" }
      : null;
  }
  return null;
}

export default function CrmProspectDetail({
  prospectId,
  initialProspect,
  initialNextAction,
  initialNotes,
  initialMessages,
  initialEvents,
  initialEvidence,
}: {
  prospectId: string;
  initialProspect: Prospect;
  initialNextAction: NextAction | null;
  initialNotes: ResearchNote[];
  initialMessages: OutreachMessage[];
  initialEvents: OutreachEvent[];
  initialEvidence: ResearchEvidenceRow[];
}) {
  const [prospect, setProspect] = useState<Prospect>(initialProspect);
  const [nextAction, setNextAction] = useState<NextAction | null>(initialNextAction);
  const [notes, setNotes] = useState<ResearchNote[]>(initialNotes);
  const [messages, setMessages] = useState<OutreachMessage[]>(initialMessages);
  const [events, setEvents] = useState<OutreachEvent[]>(initialEvents);
  const [evidence, setEvidence] = useState<ResearchEvidenceRow[]>(initialEvidence);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [newNote, setNewNote] = useState("");
  const [draftChannel, setDraftChannel] = useState<"email" | "linkedin" | "kontaktformular" | "telefon">(
    "email",
  );
  const [draftKind, setDraftKind] = useState("first_touch");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [plannedAt, setPlannedAt] = useState("");
  const [sendProvider, setSendProvider] = useState<"auto" | "gmail" | "outlook">("auto");
  const [messagePack, setMessagePack] = useState<MessagePackItem[]>([]);
  const [messagePackReason, setMessagePackReason] = useState("");
  const [messagePackSource, setMessagePackSource] = useState<"ai" | "fallback" | null>(null);
  const [messagePackReview, setMessagePackReview] = useState<DraftReview | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [draftReview, setDraftReview] = useState<DraftReview | null>(null);
  const [draftReviewStale, setDraftReviewStale] = useState(false);
  const [draftReviewRefreshing, setDraftReviewRefreshing] = useState(false);
  const [draftRewriteSnapshot, setDraftRewriteSnapshot] = useState<DraftRewriteSnapshot | null>(null);
  const [lastReviewedDraftSignature, setLastReviewedDraftSignature] = useState<string | null>(null);
  const [rewriteBusy, setRewriteBusy] = useState(false);
  const [strategy, setStrategy] = useState<StrategyDecision | null>(null);
  const [rankedContacts, setRankedContacts] = useState<RankedContactCandidate[]>([]);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [feedbackBusyKey, setFeedbackBusyKey] = useState<string | null>(null);
  const draftReviewRequestRef = useRef(0);
  const [sequenceStartAt, setSequenceStartAt] = useState(
    toDateTimeLocalValue(new Date().toISOString()),
  );
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([
    {
      step_number: 1,
      day_offset: 0,
      message_kind: "first_touch",
      channel: "email",
      label: "Tag 0 · Relevanz prüfen",
    },
    {
      step_number: 2,
      day_offset: 2,
      message_kind: "follow_up_1",
      channel: "linkedin",
      label: "Tag 2 · Kurz nachfassen",
    },
    {
      step_number: 3,
      day_offset: 5,
      message_kind: "follow_up_2",
      channel: "email",
      label: "Tag 5 · Lösung öffnen",
    },
    {
      step_number: 4,
      day_offset: 9,
      message_kind: "follow_up_3",
      channel: "telefon",
      label: "Tag 9 · Einwand adressieren",
    },
    {
      step_number: 5,
      day_offset: 13,
      message_kind: "custom",
      channel: "email",
      label: "Tag 13 · Breakup",
    },
  ]);

  const risk = useMemo(
    () => getRiskLevel({ prospect, nextAction }),
    [prospect, nextAction],
  );
  const currentDraftSignature = useMemo(
    () =>
      buildDraftSignature({
        channel: draftChannel,
        kind: draftKind,
        subject: draftSubject,
        body: draftBody,
      }),
    [draftBody, draftChannel, draftKind, draftSubject],
  );
  const hasDetailedDraftReview = Boolean(draftReview?.evidence_alignment);
  const latestDraftSignatureRef = useRef(currentDraftSignature);
  const researchAssessment = useMemo(
    () =>
      assessResearchReadiness({
        preferredChannel: prospect.preferred_channel,
        contactEmail: prospect.contact_email,
        personalizationHook: prospect.personalization_hook,
        personalizationEvidence: prospect.personalization_evidence,
        sourceCheckedAt: prospect.source_checked_at,
        responsePromisePublic: prospect.response_promise_public,
        appointmentFlowPublic: prospect.appointment_flow_public,
        docsFlowPublic: prospect.docs_flow_public,
        activeListingsCount: prospect.active_listings_count,
        automationReadiness: prospect.automation_readiness,
        linkedinUrl: prospect.linkedin_url,
        linkedinSearchUrl: prospect.linkedin_search_url,
      }),
    [prospect],
  );

  const plannedMessages = useMemo(() => {
    return [...messages]
      .filter((m) => m.status === "ready" || m.status === "draft")
      .sort((a, b) => {
        const aPlanned = String(a?.metadata?.scheduled_for || "");
        const bPlanned = String(b?.metadata?.scheduled_for || "");
        const aTs = aPlanned ? new Date(aPlanned).getTime() : Number.POSITIVE_INFINITY;
        const bTs = bPlanned ? new Date(bPlanned).getTime() : Number.POSITIVE_INFINITY;
        return aTs - bTs;
      });
  }, [messages]);
  const latestChangeSummary = useMemo(() => {
    for (const note of notes) {
      const metadata = note?.metadata && typeof note.metadata === "object" ? note.metadata : {};
      const summary =
        metadata?.change_summary && typeof metadata.change_summary === "object"
          ? metadata.change_summary
          : null;
      if (summary?.detected || Number(summary?.count || 0) > 0) {
        return summary;
      }
    }
    return null;
  }, [notes]);
  const selectedContactForSafety = useMemo(() => {
    if (!strategy) return rankedContacts[0] || null;
    return (
      rankedContacts.find((contact) => {
        return (
          String(contact.channel_type || "").toLowerCase() === String(strategy.chosen_contact_channel || "").toLowerCase() &&
          String(contact.channel_value || "").trim() === String(strategy.chosen_contact_value || "").trim()
        );
      }) || rankedContacts[0] || null
    );
  }, [rankedContacts, strategy]);
  const contactSafety = useMemo(() => {
    return assessContactSafety({
      preferredChannel: draftChannel || strategy?.chosen_channel || prospect.preferred_channel,
      contact: selectedContactForSafety
        ? {
            channel_type: selectedContactForSafety.channel_type,
            channel_value: selectedContactForSafety.channel_value,
            contact_name: selectedContactForSafety.contact_name,
            contact_role: selectedContactForSafety.contact_role,
            source_type: selectedContactForSafety.source_type,
            confidence: selectedContactForSafety.confidence,
            validation_status: selectedContactForSafety.validation_status,
            is_primary: selectedContactForSafety.is_primary,
          }
        : {
            channel_type: draftChannel || prospect.preferred_channel,
            channel_value:
              draftChannel === "email"
                ? prospect.contact_email
                : draftChannel === "linkedin"
                  ? prospect.linkedin_url || prospect.linkedin_search_url
                  : prospect.website_url,
            contact_name: prospect.contact_name,
            confidence: draftChannel === "email" && prospect.contact_email ? 0.58 : 0.42,
            validation_status: "new",
            source_type: draftChannel === "linkedin" ? "linkedin-profil" : "prospect",
            is_primary: true,
          },
    });
  }, [draftChannel, prospect, rankedContacts, selectedContactForSafety, strategy]);

  function applyDraftImprovement(nextBody: string, successText: string) {
    setDraftBody(nextBody);
    if (draftReview) {
      setDraftReviewStale(true);
    }
    setError(null);
    setSuccess(successText);
  }

  async function rewriteDraftWithAi() {
    if (!draftBody.trim()) {
      setError("Bitte zuerst einen Nachrichtentext eingeben.");
      return;
    }
    const previousSubject = draftSubject;
    const previousBody = draftBody;
    const previousReview = draftReview;
    setRewriteBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}/draft-rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: draftChannel,
          message_kind: draftKind,
          subject: draftSubject,
          body: draftBody,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as DraftRewriteResponse;
      if (!res.ok || !json?.ok || !json?.rewritten_draft?.body) {
        throw new Error(json?.details || json?.error || "Rewrite konnte nicht erzeugt werden.");
      }
      const nextSubject = String(json.rewritten_draft.subject || "").trim();
      const nextBody = String(json.rewritten_draft.body || "").trim();
      const nextReview = (json.rewrite_review || null) as DraftReview | null;
      setDraftSubject(nextSubject);
      setDraftBody(nextBody);
      setDraftReview(nextReview);
      setDraftReviewStale(false);
      setDraftReviewRefreshing(false);
      setLastReviewedDraftSignature(
        buildDraftSignature({
          channel: draftChannel,
          kind: draftKind,
          subject: nextSubject,
          body: nextBody,
        }),
      );
      setDraftRewriteSnapshot({
        previousSubject,
        previousBody,
        nextSubject,
        nextBody,
        previousReview,
        nextReview,
        generatedWith: json.generated_with || null,
        improvementSummary: json.improvement_summary || null,
        changeSummary: json.change_summary || null,
      });
      setSuccess(
        [json.improvement_summary, json.change_summary]
          .map((item) => String(item || "").trim())
          .filter(Boolean)
          .join(" "),
      );
    } catch (e: any) {
      setError(String(e?.message || "Rewrite konnte nicht erzeugt werden."));
    } finally {
      setRewriteBusy(false);
    }
  }

  async function loadStrategy(force?: boolean) {
    setStrategyLoading(true);
    try {
      const url = `/api/crm/prospects/${prospectId}/strategy${force ? "?force=1" : ""}`;
      const res = await fetch(url, {
        cache: "no-store",
        method: force ? "POST" : "GET",
      });
      const json = (await res.json().catch(() => ({}))) as StrategyResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Strategie konnte nicht geladen werden.");
      }
      setStrategy(normalizeStrategyDecision(json.strategy));
      setRankedContacts(Array.isArray(json.ranked_contacts) ? json.ranked_contacts : []);
    } catch (e: any) {
      setStrategy(null);
      setRankedContacts([]);
      setError(String(e?.message || "Strategie konnte nicht geladen werden."));
    } finally {
      setStrategyLoading(false);
    }
  }

  async function refreshAll() {
    try {
      const [notesRes, messagesRes, eventsRes, evidenceRes, nextActionRes, strategyRes] = await Promise.all([
        fetch(`/api/crm/prospects/${prospectId}/notes`, { cache: "no-store" }),
        fetch(`/api/crm/prospects/${prospectId}/messages`, { cache: "no-store" }),
        fetch(`/api/crm/prospects/${prospectId}/events`, { cache: "no-store" }),
        fetch(`/api/crm/prospects/${prospectId}/evidence`, { cache: "no-store" }),
        fetch(`/api/crm/prospects/${prospectId}/next-action`, { cache: "no-store" }),
        fetch(`/api/crm/prospects/${prospectId}/strategy`, { cache: "no-store" }),
      ]);
      const notesJson = await notesRes.json().catch(() => ({} as any));
      const messagesJson = await messagesRes.json().catch(() => ({} as any));
      const eventsJson = await eventsRes.json().catch(() => ({} as any));
      const evidenceJson = await evidenceRes.json().catch(() => ({} as any));
      const nextActionJson = await nextActionRes.json().catch(() => ({} as any));
      const strategyJson = (await strategyRes.json().catch(() => ({}))) as StrategyResponse;

      if (!notesRes.ok || !notesJson?.ok) {
        throw new Error(notesJson?.details || notesJson?.error || "Notizen konnten nicht geladen werden.");
      }
      if (!messagesRes.ok || !messagesJson?.ok) {
        throw new Error(messagesJson?.details || messagesJson?.error || "Nachrichten konnten nicht geladen werden.");
      }
      if (!eventsRes.ok || !eventsJson?.ok) {
        throw new Error(eventsJson?.details || eventsJson?.error || "Events konnten nicht geladen werden.");
      }
      if (!evidenceRes.ok || !evidenceJson?.ok) {
        throw new Error(evidenceJson?.details || evidenceJson?.error || "Research-Evidenz konnte nicht geladen werden.");
      }

      setNotes(Array.isArray(notesJson.notes) ? notesJson.notes : []);
      setMessages(Array.isArray(messagesJson.messages) ? messagesJson.messages : []);
      setEvents(Array.isArray(eventsJson.events) ? eventsJson.events : []);
      setEvidence(Array.isArray(evidenceJson.evidence) ? evidenceJson.evidence : []);
      setNextAction(nextActionRes.ok && nextActionJson?.ok ? nextActionJson?.next_action || null : null);
      if (strategyRes.ok && strategyJson?.ok) {
        setStrategy(normalizeStrategyDecision(strategyJson.strategy));
        setRankedContacts(Array.isArray(strategyJson.ranked_contacts) ? strategyJson.ranked_contacts : []);
      }
    } catch (e: any) {
      setError(String(e?.message || "Details konnten nicht aktualisiert werden."));
    }
  }

  useEffect(() => {
    void loadStrategy();
  }, [prospectId]);

  useEffect(() => {
    latestDraftSignatureRef.current = currentDraftSignature;
  }, [currentDraftSignature]);

  useEffect(() => {
    const trimmedBody = draftBody.trim();
    if (!trimmedBody) {
      setDraftReview(null);
      setDraftReviewStale(false);
      setDraftReviewRefreshing(false);
      setLastReviewedDraftSignature(null);
      return;
    }

    const shouldRefresh =
      currentDraftSignature !== lastReviewedDraftSignature ||
      draftReviewStale ||
      !hasDetailedDraftReview;
    if (!shouldRefresh) return;

    const signatureAtSchedule = currentDraftSignature;
    const timeoutId = window.setTimeout(() => {
      const requestId = draftReviewRequestRef.current + 1;
      draftReviewRequestRef.current = requestId;
      setDraftReviewRefreshing(true);

      void (async () => {
        try {
          const res = await fetch(`/api/crm/prospects/${prospectId}/draft-review`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channel: draftChannel,
              message_kind: draftKind,
              subject: draftSubject,
              body: draftBody,
            }),
          });
          const json = (await res.json().catch(() => ({}))) as DraftReviewResponse;
          if (!res.ok || !json?.ok || !json?.review) {
            throw new Error(json?.details || json?.error || "Draft-Review konnte nicht aktualisiert werden.");
          }
          if (
            draftReviewRequestRef.current !== requestId ||
            latestDraftSignatureRef.current !== signatureAtSchedule
          ) {
            return;
          }
          setDraftReview(json.review);
          setDraftReviewStale(false);
          setDraftReviewRefreshing(false);
          setLastReviewedDraftSignature(signatureAtSchedule);
        } catch {
          if (
            draftReviewRequestRef.current !== requestId ||
            latestDraftSignatureRef.current !== signatureAtSchedule
          ) {
            return;
          }
        } finally {
          if (
            draftReviewRequestRef.current === requestId &&
            latestDraftSignatureRef.current === signatureAtSchedule
          ) {
            setDraftReviewRefreshing(false);
          }
        }
      })();
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentDraftSignature,
    draftBody,
    draftChannel,
    draftKind,
    draftReviewStale,
    draftSubject,
    hasDetailedDraftReview,
    lastReviewedDraftSignature,
    prospectId,
  ]);

  async function updateStage(stage: string) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Stage-Update fehlgeschlagen.");
      }
      setProspect((prev) => ({ ...prev, stage }));
      setSuccess("Stage wurde aktualisiert.");
      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Stage-Update fehlgeschlagen."));
    } finally {
      setBusy(false);
    }
  }

  async function markAccountChangeReviewed() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: prospect.stage,
          next_action: null,
          next_action_at: null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Account-Aenderung konnte nicht abgeschlossen werden.");
      }
      setProspect((prev) => ({
        ...prev,
        next_action: null,
        next_action_at: null,
      }));
      setSuccess("Account-Aenderung als geprüft markiert.");
      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Account-Aenderung konnte nicht abgeschlossen werden."));
    } finally {
      setBusy(false);
    }
  }

  async function logEvent(eventType: string, label: string) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: prospectId,
          event_type: eventType,
          details: `${label} wurde aus der Detailansicht gesetzt`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Event konnte nicht gespeichert werden.");
      }
      setSuccess(`Event „${label}“ gespeichert.`);
      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Event konnte nicht gespeichert werden."));
    } finally {
      setBusy(false);
    }
  }

  async function createNote() {
    if (!newNote.trim()) {
      setError("Bitte zuerst eine Notiz eingeben.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: newNote.trim(),
          source_type: "manual",
          is_key_insight: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Notiz konnte nicht gespeichert werden.");
      }
      setNewNote("");
      setSuccess("Notiz gespeichert.");
      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Notiz konnte nicht gespeichert werden."));
    } finally {
      setBusy(false);
    }
  }

  async function submitFeedback(args: {
    subjectType: "strategy" | "draft" | "contact";
    subjectId: string;
    feedbackValue: "approve" | "needs_work" | "preferred" | "wrong_contact";
    messageId?: string | null;
    successText: string;
    metadata?: Record<string, any>;
  }) {
    setFeedbackBusyKey(`${args.subjectType}:${args.subjectId}:${args.feedbackValue}`);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_type: args.subjectType,
          subject_id: args.subjectId,
          feedback_value: args.feedbackValue,
          prospect_id: prospectId,
          strategy_decision_id: args.subjectType === "strategy" ? args.subjectId : strategy?.id || null,
          message_id: args.messageId || null,
          metadata: {
            chosen_channel: strategy?.chosen_channel || null,
            chosen_cta: strategy?.chosen_cta || null,
            ...(args.metadata && typeof args.metadata === "object" ? args.metadata : {}),
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Feedback konnte nicht gespeichert werden.");
      }
      setSuccess(String(json?.summary || args.successText));
      if (args.subjectType === "strategy" || args.subjectType === "contact") {
        await refreshAll();
      }
    } catch (e: any) {
      setError(String(e?.message || "Feedback konnte nicht gespeichert werden."));
    } finally {
      setFeedbackBusyKey(null);
    }
  }

  async function generateRecommendedMessage() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/crm/prospects/${prospectId}/invite-template?channel=${encodeURIComponent(draftChannel)}`,
        { cache: "no-store" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Empfohlene Nachricht konnte nicht erzeugt werden.");
      }
      if (json?.strategy) {
        setStrategy(normalizeStrategyDecision(json.strategy));
      }
      const nextSubject = String(json?.template?.subject || "").trim();
      const nextBody = String(json?.template?.body || "").trim();
      const review = (json?.template_review || null) as DraftReview | null;
      setDraftSubject(nextSubject);
      setDraftBody(nextBody);
      setDraftReview(review);
      setDraftReviewStale(false);
      setDraftReviewRefreshing(false);
      setLastReviewedDraftSignature(
        buildDraftSignature({
          channel: draftChannel,
          kind: draftKind,
          subject: nextSubject,
          body: nextBody,
        }),
      );
      setDraftRewriteSnapshot(null);
      setSuccess(
        json?.template_review
          ? `Empfohlene Nachricht geladen. ${outboundQualityStatusLabel(json.template_review.status)} · ${json.template_review.score}/100.`
          : "Empfohlene Nachricht geladen. Du kannst sie jetzt anpassen.",
      );
    } catch (e: any) {
      setError(String(e?.message || "Empfohlene Nachricht konnte nicht erzeugt werden."));
    } finally {
      setBusy(false);
    }
  }

  async function generateMessagePack() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}/message-pack`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Nachrichtenpaket konnte nicht erzeugt werden.");
      }
      if (json?.strategy) {
        setStrategy(normalizeStrategyDecision(json.strategy));
      }
      const rows = Array.isArray(json?.messages) ? (json.messages as MessagePackItem[]) : [];
      setMessagePack(rows);
      setMessagePackReason(String(json?.recommendation_reason || "").trim());
      setMessagePackSource(
        json?.generated_with === "ai" || json?.generated_with === "fallback"
          ? json.generated_with
          : null,
      );
      setMessagePackReview((json?.pack_review || null) as DraftReview | null);
      if (rows.length > 0) {
        const first = rows[0];
        setSelectedVariant(first.variant);
        const nextChannel =
          first.channel === "email" || first.channel === "linkedin" || first.channel === "telefon"
            ? first.channel
            : "email";
        const nextSubject = first.subject || "";
        const nextBody = first.body || "";
        const review =
          first.review_status && typeof first.review_score === "number"
            ? {
                status: first.review_status,
                score: first.review_score,
                summary: String(first.review_summary || "").trim(),
              }
            : null;
        setDraftChannel(nextChannel);
        setDraftSubject(nextSubject);
        setDraftBody(nextBody);
        setDraftReview(review);
        setDraftReviewStale(false);
        setDraftReviewRefreshing(false);
        setLastReviewedDraftSignature(
          buildDraftSignature({
            channel: nextChannel,
            kind: draftKind,
            subject: nextSubject,
            body: nextBody,
          }),
        );
        setDraftRewriteSnapshot(null);
      }
      setSuccess(
        json?.pack_review
          ? `KI-Nachrichtenpaket geladen. ${outboundQualityStatusLabel(json.pack_review.status)} · ${json.pack_review.score}/100.`
          : "KI-Nachrichtenpaket geladen.",
      );
    } catch (e: any) {
      setError(String(e?.message || "Nachrichtenpaket konnte nicht erzeugt werden."));
    } finally {
      setBusy(false);
    }
  }

  function applyPackVariant(item: MessagePackItem) {
    setSelectedVariant(item.variant || null);
    const nextChannel = item.channel;
    const nextSubject = item.subject || "";
    const nextBody = item.body || "";
    const review =
      item.review_status && typeof item.review_score === "number"
        ? {
            status: item.review_status,
            score: item.review_score,
            summary: String(item.review_summary || "").trim(),
          }
        : null;
    setDraftChannel(nextChannel);
    setDraftSubject(nextSubject);
    setDraftBody(nextBody);
    setDraftReview(review);
    setDraftReviewStale(false);
    setDraftReviewRefreshing(false);
    setLastReviewedDraftSignature(
      buildDraftSignature({
        channel: nextChannel,
        kind: draftKind,
        subject: nextSubject,
        body: nextBody,
      }),
    );
    setDraftRewriteSnapshot(null);
    setSuccess(`Variante ${item.variant} übernommen.`);
  }

  async function saveDraft(sendNow: boolean) {
    if (!draftBody.trim()) {
      setError("Bitte zuerst einen Nachrichtentext eingeben.");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        channel: draftChannel,
        message_kind: draftKind,
        subject: draftSubject.trim() || null,
        body: draftBody.trim(),
        status: "ready",
        personalization_score: Math.max(0, Math.min(100, Number(prospect.fit_score || 0))),
        metadata: {
          source: "crm_detail_recommendation",
          scheduled_for: plannedAt ? new Date(plannedAt).toISOString() : null,
          recommended_code: nextAction?.recommended_code || null,
          recommended_reason: nextAction?.recommended_reason || null,
          cadence_key: "cadence_v1_5touch_14d",
          cadence_step: cadenceStepForMessageKind(draftKind),
          cadence_segment: "detail_manual",
          template_variant: selectedVariant || `manual_${draftKind}`,
          template_origin: messagePackSource || null,
          ab_intro_variant: "human_context_v1",
          ab_trigger_variant: "visible_signal_v1",
          ab_cta_variant: "relevance_question_v1",
          ab_subject_variant: draftChannel === "email" ? "operativ_kurz_v1" : "none",
          strategy_decision_id: strategy?.id || null,
          strategy_version: strategy?.version || null,
          strategy_channel: strategy?.chosen_channel || null,
          strategy_cta: strategy?.chosen_cta || null,
          strategy_angle: strategy?.chosen_angle || null,
          strategy_trigger: strategy?.chosen_trigger || null,
          strategy_contact_channel: strategy?.chosen_contact_channel || null,
          strategy_contact_value: strategy?.chosen_contact_value || null,
          strategy_contact_candidate_id: strategy?.chosen_contact_candidate_id || null,
          strategy_contact_confidence: strategy?.chosen_contact_confidence || null,
          strategy_risk_level: strategy?.risk_level || null,
        },
      };
      const createRes = await fetch(`/api/crm/prospects/${prospectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok || !createJson?.ok) {
        throw new Error(createJson?.details || createJson?.error || "Draft konnte nicht gespeichert werden.");
      }
      setDraftReview((createJson?.review || null) as DraftReview | null);
      setDraftReviewStale(false);
      setDraftReviewRefreshing(false);
      setLastReviewedDraftSignature(currentDraftSignature);

      const messageId = String(createJson?.message?.id || "");
      const createdChannel = String(createJson?.message?.channel || draftChannel);
      if (sendNow && messageId) {
        if (isEmailChannel(createdChannel)) {
          const sendRes = await fetch(`/api/crm/messages/${messageId}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: sendProvider }),
          });
          const sendJson = await sendRes.json().catch(() => ({}));
          if (!sendRes.ok || !sendJson?.ok) {
            throw new Error(sendJson?.details || sendJson?.error || "Versand fehlgeschlagen.");
          }
          setSuccess(
            `Nachricht wurde über ${String(sendJson?.tracking?.provider || "E-Mail").toUpperCase()} versendet.`,
          );
        } else {
          const statusRes = await fetch(`/api/crm/messages/${messageId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "sent" }),
          });
          const statusJson = await statusRes.json().catch(() => ({}));
          if (!statusRes.ok || !statusJson?.ok) {
            throw new Error(statusJson?.details || statusJson?.error || "Status konnte nicht gesetzt werden.");
          }
          setSuccess(
            `Nachricht wurde als gesendet markiert (${createdChannel}).`,
          );
        }
      } else {
        const review = (createJson?.review || null) as DraftReview | null;
        setSuccess(
          review
            ? `Geplante Nachricht als ready-Draft gespeichert. ${outboundQualityStatusLabel(review.status)} · ${review.score}/100.`
            : "Geplante Nachricht als ready-Draft gespeichert.",
        );
      }

      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Nachricht konnte nicht gespeichert werden."));
    } finally {
      setBusy(false);
    }
  }

  async function runSequencePlan() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}/sequence-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_at: sequenceStartAt ? new Date(sequenceStartAt).toISOString() : null,
          steps: sequenceSteps,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Sequenzplanung fehlgeschlagen.");
      }
      if (json?.next_action || json?.next_action_at) {
        setProspect((prev) => ({
          ...prev,
          next_action:
            typeof json?.next_action === "string" && json.next_action.trim()
              ? json.next_action
              : prev.next_action,
          next_action_at:
            typeof json?.next_action_at === "string" && json.next_action_at.trim()
              ? json.next_action_at
              : prev.next_action_at,
        }));
      }
      setSuccess(
        `Sequenz geplant: ${Number(json?.created_count || 0)} erstellt, ${Number(json?.skipped_count || 0)} übersprungen.`,
      );
      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Sequenzplanung fehlgeschlagen."));
    } finally {
      setBusy(false);
    }
  }

  async function enrichProspectSignals() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}/enrich`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Enrichment fehlgeschlagen.");
      }
      const updates =
        json?.applied_updates && typeof json.applied_updates === "object"
          ? (json.applied_updates as Record<string, any>)
          : {};
      if (Object.keys(updates).length > 0) {
        setProspect((prev) => ({ ...prev, ...updates }));
      }
      const pageCount = Array.isArray(json?.pages_crawled) ? json.pages_crawled.length : 0;
      const secondaryCount = Array.isArray(json?.secondary_sources_crawled)
        ? json.secondary_sources_crawled.length
        : 0;
      const changeSuffix =
        Number(json?.change_summary?.count || 0) > 0
          ? ` ${String(json?.change_summary?.summary || "").trim()}`
          : "";
      setSuccess(
        `Research-Crawl fertig: ${pageCount} Seiten geprüft${secondaryCount > 0 ? `, ${secondaryCount} Zweitquellen verifiziert` : ""}.${
          json?.research?.status ? ` ${researchStatusLabel(json.research.status)} · ${Number(json?.research?.score || 0)}/100.` : ""
        }${changeSuffix}`,
      );
      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Enrichment fehlgeschlagen."));
    } finally {
      setBusy(false);
    }
  }

  async function quickCompleteAndSetNext(messageId: string, channel: string) {
    setSavingId(messageId);
    setError(null);
    setSuccess(null);
    try {
      if (isEmailChannel(channel)) {
        const sendRes = await fetch(`/api/crm/messages/${messageId}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: sendProvider }),
        });
        const sendJson = await sendRes.json().catch(() => ({}));
        if (!sendRes.ok || !sendJson?.ok) {
          throw new Error(sendJson?.details || sendJson?.error || "Versand fehlgeschlagen.");
        }
      } else {
        const statusRes = await fetch(`/api/crm/messages/${messageId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "sent" }),
        });
        const statusJson = await statusRes.json().catch(() => ({}));
        if (!statusRes.ok || !statusJson?.ok) {
          throw new Error(statusJson?.details || statusJson?.error || "Status konnte nicht gesetzt werden.");
        }
      }

      const nextDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const stageRes = await fetch(`/api/crm/prospects/${prospectId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: prospect.stage,
          next_action: "Follow-up prüfen (nach Versand)",
          next_action_at: nextDate,
        }),
      });
      const stageJson = await stageRes.json().catch(() => ({}));
      if (!stageRes.ok || !stageJson?.ok) {
        throw new Error(stageJson?.details || stageJson?.error || "Nächster Schritt konnte nicht gesetzt werden.");
      }
      setProspect((prev) => ({
        ...prev,
        next_action: "Follow-up prüfen (nach Versand)",
        next_action_at: nextDate,
      }));
      setSuccess("Gesendet und nächster Follow-up in 3 Tagen gesetzt.");
      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Quick-Aktion fehlgeschlagen."));
    } finally {
      setSavingId(null);
    }
  }

  async function sendExistingMessage(messageId: string, channel: string) {
    setSavingId(messageId);
    setError(null);
    setSuccess(null);
    try {
      if (isEmailChannel(channel)) {
        const res = await fetch(`/api/crm/messages/${messageId}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: sendProvider }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) {
          throw new Error(json?.details || json?.error || "Versand fehlgeschlagen.");
        }
        setSuccess(
          `Nachricht wurde über ${String(json?.tracking?.provider || "E-Mail").toUpperCase()} versendet.`,
        );
      } else {
        const res = await fetch(`/api/crm/messages/${messageId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "sent" }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) {
          throw new Error(json?.details || json?.error || "Status konnte nicht gesetzt werden.");
        }
        setSuccess(`Nachricht wurde als gesendet markiert (${channel}).`);
      }
      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Versand fehlgeschlagen."));
    } finally {
      setSavingId(null);
    }
  }

  async function setMessageStatus(messageId: string, status: "archived" | "sent") {
    setSavingId(messageId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/messages/${messageId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Status konnte nicht gesetzt werden.");
      }
      setSuccess(status === "sent" ? "Als gesendet markiert." : "Nachricht archiviert.");
      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Status konnte nicht gesetzt werden."));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">
            <Link href="/app/crm" className="text-gray-600 hover:underline">
              CRM
            </Link>{" "}
            / Prospect
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{prospect.company_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span
              className={`inline-flex rounded-full px-2 py-1 ring-1 ${stageBadgeClass(prospect.stage)}`}
            >
              {STAGE_LABELS[prospect.stage] || prospect.stage}
            </span>
            <span>Fit {prospect.fit_score}</span>
            <span>Priorität {prospect.priority}</span>
            <span>{prospect.object_focus || "gemischt"}</span>
            {typeof prospect.active_listings_count === "number" ? (
              <span>{prospect.active_listings_count} Inserate</span>
            ) : null}
            {typeof prospect.share_miete_percent === "number" || typeof prospect.share_kauf_percent === "number" ? (
              <span>
                Miete {prospect.share_miete_percent ?? "?"}% / Kauf {prospect.share_kauf_percent ?? "?"}%
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/crm/sales-intel"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Sales Intel Lab
          </Link>
          <select
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={prospect.stage}
            disabled={busy}
            onChange={(e) => void updateStage(e.target.value)}
          >
            {STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={sendProvider}
            onChange={(e) =>
              setSendProvider(
                e.target.value === "gmail" || e.target.value === "outlook" ? e.target.value : "auto",
              )
            }
          >
            <option value="auto">Versand: Auto</option>
            <option value="gmail">Versand: Gmail</option>
            <option value="outlook">Versand: Outlook</option>
          </select>
          <button
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={busy}
            onClick={() => void enrichProspectSignals()}
          >
            Signale anreichern
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-4">
          <h2 className="text-base font-semibold text-gray-900">Profil & Quellen</h2>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <div>{prospect.contact_name || "Kein Ansprechpartner"} · {prospect.contact_role || "Rolle offen"}</div>
            <div>{prospect.city || "Ort offen"}{prospect.region ? `, ${prospect.region}` : ""}</div>
            <div>{prospect.contact_email || "Keine E-Mail gepflegt"}</div>
            <div>LinkedIn-Headline: {prospect.linkedin_headline || "nicht gepflegt"}</div>
            <div>Objection: {prospect.primary_objection || "nicht gepflegt"}</div>
            <div>Pain 1: {prospect.primary_pain_hypothesis || prospect.pain_point_hypothesis || "nicht gepflegt"}</div>
            <div>Pain 2: {prospect.secondary_pain_hypothesis || "nicht gepflegt"}</div>
            <div>Readiness: {prospect.automation_readiness || "offen"}</div>
            <div>Ton: {prospect.brand_tone || "offen"}</div>
            <div>CTA-Präferenz: {prospect.cta_preference_guess || "offen"}</div>
            <div>Owner-led: {prospect.owner_led === null ? "offen" : prospect.owner_led ? "ja" : "nein"}</div>
            <div>Jahre am Markt: {typeof prospect.years_in_market === "number" ? prospect.years_in_market : "offen"}</div>
            <div>Anzeigen 30 Tage: {typeof prospect.new_listings_30d === "number" ? prospect.new_listings_30d : "offen"}</div>
            <div>Preisband: {prospect.price_band_main || "offen"}</div>
            <div>Mikroregion: {prospect.region_focus_micro || "offen"}</div>
            <div>Reaktionsversprechen: {prospect.response_promise_public || "offen"}</div>
            <div>Terminablauf: {prospect.appointment_flow_public || "offen"}</div>
            <div>Unterlagenablauf: {prospect.docs_flow_public || "offen"}</div>
            <div>Quelle geprüft: {prospect.source_checked_at || "unbekannt"}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {prospect.website_url ? (
              <a href={prospect.website_url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 hover:bg-gray-100">
                Website
              </a>
            ) : null}
            {prospect.source_url ? (
              <a href={prospect.source_url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 hover:bg-gray-100">
                Quelle
              </a>
            ) : null}
            {prospect.linkedin_url ? (
              <a href={prospect.linkedin_url} target="_blank" rel="noreferrer" className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100">
                LinkedIn-Profil
              </a>
            ) : null}
            {!prospect.linkedin_url && prospect.linkedin_search_url ? (
              <a href={prospect.linkedin_search_url} target="_blank" rel="noreferrer" className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100">
                LinkedIn suchen
              </a>
            ) : null}
          </div>
          {prospect.linkedin_relevance_note ? (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              {prospect.linkedin_relevance_note}
            </div>
          ) : null}
          {prospect.personalization_evidence ? (
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
              Evidenz: {prospect.personalization_evidence}
            </div>
          ) : null}
          {Array.isArray(prospect.object_types) && prospect.object_types.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {prospect.object_types.map((type) => (
                <span
                  key={type}
                  className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600"
                >
                  {type}
                </span>
              ))}
            </div>
          ) : null}
          {Array.isArray(prospect.trust_signals) && prospect.trust_signals.length > 0 ? (
            <div className="mt-2 text-xs text-gray-600">
              Trust-Signale: {prospect.trust_signals.join(" · ")}
            </div>
          ) : null}
          {typeof prospect.hypothesis_confidence === "number" ? (
            <div className="mt-1 text-xs text-gray-500">
              Hypothesen-Konfidenz: {Math.round(prospect.hypothesis_confidence * 100)}%
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-5">
          <h2 className="text-base font-semibold text-gray-900">Empfohlene Aktion</h2>
          {nextAction ? (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="text-xs text-amber-700">Aktion</div>
                <div className="mt-1 text-sm font-medium text-amber-900">
                  {nextAction.recommended_action || "–"}
                </div>
                <div className="mt-1 text-xs text-amber-700">
                  Fällig: {formatDate(nextAction.recommended_at)}
                </div>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 md:col-span-2">
                <div className="text-xs text-sky-700">Grund</div>
                <div className="mt-1 text-sm text-sky-900">
                  {nextAction.recommended_reason || "Kein Grund verfügbar."}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                    disabled={busy}
                    onClick={() => void logEvent("reply_received", "Antwort erhalten")}
                  >
                    Antwort erhalten
                  </button>
                  <button
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                    disabled={busy}
                    onClick={() => void logEvent("pilot_invited", "Pilot eingeladen")}
                  >
                    Pilot eingeladen
                  </button>
                  <button
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    disabled={busy}
                    onClick={() => void logEvent("deal_won", "Gewonnen")}
                  >
                    Gewonnen
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Keine offene Empfehlung vorhanden.
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-3">
          <h2 className="text-base font-semibold text-gray-900">Command Center</h2>
          <div className="mt-3 space-y-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Risiko</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {risk.label} · Score {risk.score}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {risk.reasons.length > 0 ? risk.reasons[0] : "Keine kritischen Signale"}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Nächste Aktion</div>
              <div className="mt-1 text-sm text-gray-900">
                {nextAction?.recommended_action || prospect.next_action || "Keine offene Aktion"}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Termin: {formatDate(nextAction?.recommended_at || prospect.next_action_at)}
              </div>
              {String(prospect.next_action || "").startsWith("Account-Aenderung pruefen") ? (
                <button
                  className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-800 hover:bg-sky-100 disabled:opacity-60"
                  disabled={busy}
                  onClick={() => void markAccountChangeReviewed()}
                >
                  Aenderung geprueft
                </button>
              ) : null}
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Kern-Einwand</div>
              <div className="mt-1 text-sm text-gray-900">
                {prospect.primary_objection || "Nicht gepflegt"}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Research</div>
              <div className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${researchBadgeClass(
                    researchAssessment.status,
                  )}`}
                >
                  {researchStatusLabel(researchAssessment.status)} · {researchAssessment.score}/100
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-600">{researchAssessment.summary}</div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Strategie & Entscheidungslogik</h2>
              <p className="mt-1 text-xs text-gray-600">
                Warum genau dieser Kontaktpfad, welcher Angle zuerst getestet wird und was als Fallback gilt.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                disabled={busy || strategyLoading}
                onClick={() => void loadStrategy(true)}
              >
                {strategyLoading ? "Berechne..." : "Strategie neu berechnen"}
              </button>
              {strategy ? (
                <>
                  <button
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    disabled={feedbackBusyKey === `strategy:${strategy.id}:approve`}
                    onClick={() =>
                      void submitFeedback({
                        subjectType: "strategy",
                        subjectId: strategy.id,
                        feedbackValue: "approve",
                        successText: "Strategie als brauchbar markiert.",
                      })
                    }
                  >
                    Strategie passt
                  </button>
                  <button
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                    disabled={feedbackBusyKey === `strategy:${strategy.id}:needs_work`}
                    onClick={() =>
                      void submitFeedback({
                        subjectType: "strategy",
                        subjectId: strategy.id,
                        feedbackValue: "needs_work",
                        successText: "Strategie als ueberarbeitungsbeduerftig markiert.",
                      })
                    }
                  >
                    Strategie zu schwach
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {!strategy ? (
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
              {strategyLoading ? "Strategie wird geladen..." : "Noch keine Strategie berechnet."}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">
                  Version {strategy.version}
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">
                  {strategy.segment_key}
                </span>
                {strategy.playbook_title ? (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700">
                    {strategy.playbook_title}
                  </span>
                ) : null}
                {strategy.risk_level ? (
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">
                    Risiko {strategy.risk_level}
                  </span>
                ) : null}
                {typeof strategy.strategy_score === "number" ? (
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">
                    Strategie {strategy.strategy_score}/100
                  </span>
                ) : null}
              </div>
              {strategy.rationale ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700">
                  {strategy.rationale}
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Startkontakt</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {strategy.chosen_channel || "offen"}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {strategy.chosen_contact_value || "Kein Kontaktwert"}
                  </div>
                  <div className="mt-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${contactSafetyBadgeClass(contactSafety.level)}`}>
                      Kontakt {contactSafetyLabel(contactSafety.level)} · {contactSafety.score}/100
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Angle</div>
                  <div className="mt-1 text-sm text-gray-900">
                    {strategy.chosen_angle || "Noch kein Angle abgeleitet."}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">CTA</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {strategy.chosen_cta || "offen"}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Trigger: {strategy.chosen_trigger || "offen"}
                  </div>
                </div>
              </div>
              {normalizeStringArray(strategy.channel_plan).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {normalizeStringArray(strategy.channel_plan).map((channel) => (
                    <span
                      key={channel}
                      className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600"
                    >
                      Kanalplan: {channel}
                    </span>
                  ))}
                </div>
              ) : null}
              {normalizeStringArray(strategy.trigger_evidence).length > 0 ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  {normalizeStringArray(strategy.trigger_evidence).slice(0, 3).join(" · ")}
                </div>
              ) : null}
              {normalizeStringArray(strategy.research_gaps).length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Luecken: {normalizeStringArray(strategy.research_gaps).slice(0, 3).join(" · ")}
                </div>
              ) : null}
              {strategy.fallback_plan ? (
                <div className="text-xs text-gray-500">Fallback: {strategy.fallback_plan}</div>
              ) : null}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-5">
          <h2 className="text-base font-semibold text-gray-900">Kontakt-Ranking</h2>
          <p className="mt-1 text-xs text-gray-600">
            Priorisierte Kontaktpfade mit Score, damit Outreach nicht am falschen Kanal scheitert.
          </p>
          <div className="mt-3 space-y-2">
            {rankedContacts.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                Noch keine priorisierten Kontaktpfade vorhanden.
              </div>
            ) : (
              rankedContacts.slice(0, 5).map((contact) => {
                const safety = assessContactSafety({
                  preferredChannel: strategy?.chosen_channel || prospect.preferred_channel,
                  contact,
                });
                return (
                <div key={`${contact.channel_type}-${contact.channel_value}`} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-gray-900">
                      #{contact.recommended_order} · {contact.channel_type}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xs text-gray-500">Score {contact.score}</div>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${contactSafetyBadgeClass(safety.level)}`}>
                        {contactSafetyLabel(safety.level)} · {safety.score}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-700">{contact.channel_value}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {contact.contact_name || "ohne Namen"}
                    {contact.contact_role ? ` · ${contact.contact_role}` : ""}
                    {contact.source_type ? ` · ${contact.source_type}` : ""}
                    {contact.confidence !== null ? ` · ${Math.round(contact.confidence * 100)}%` : ""}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">{contact.reason}</div>
                  {safety.reasons[0] ? (
                    <div className="mt-1 text-[11px] text-gray-500">{safety.reasons[0]}</div>
                  ) : null}
                  {contact.source_url ? (
                    <a
                      href={contact.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-100"
                    >
                      Quelle oeffnen
                    </a>
                  ) : null}
                  {contact.id ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                        disabled={feedbackBusyKey === `contact:${contact.id}:preferred`}
                        onClick={() =>
                          void submitFeedback({
                            subjectType: "contact",
                            subjectId: contact.id || "",
                            feedbackValue: "preferred",
                            successText: "Kontakt priorisiert.",
                            metadata: {
                              contact_channel: contact.channel_type,
                              contact_value: contact.channel_value,
                            },
                          })
                        }
                      >
                        Bevorzugen
                      </button>
                      <button
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        disabled={feedbackBusyKey === `contact:${contact.id}:wrong_contact`}
                        onClick={() =>
                          void submitFeedback({
                            subjectType: "contact",
                            subjectId: contact.id || "",
                            feedbackValue: "wrong_contact",
                            successText: "Kontakt als unpassend markiert.",
                            metadata: {
                              contact_channel: contact.channel_type,
                              contact_value: contact.channel_value,
                            },
                          })
                        }
                      >
                        Falscher Kontakt
                      </button>
                    </div>
                  ) : null}
                </div>
              )})
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-900">KI‑Personalisierungs‑Paket</h2>
            <button
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-60"
              disabled={busy}
              onClick={() => void generateMessagePack()}
            >
              Paket erzeugen (E-Mail · LinkedIn · Call)
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Jede Variante enthält eine Begründung, warum sie genau zu diesem Prospect passt.
          </p>
          {messagePackReason ? (
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              {messagePackReason} {messagePackSource ? `(${messagePackSource === "ai" ? "KI" : "Fallback"})` : ""}
            </div>
          ) : null}
          {messagePackReview ? (
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${reviewBadgeClass(
                  messagePackReview.status,
                )}`}
              >
                {outboundQualityStatusLabel(messagePackReview.status)} · {messagePackReview.score}/100
              </span>
            </div>
          ) : null}
          <div className="mt-3 space-y-2">
            {messagePack.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                Noch kein Paket erzeugt.
              </div>
            ) : (
              messagePack.map((item) => (
                <div key={`${item.channel}-${item.variant}`} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-gray-500">
                      {item.channel} · {item.variant}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.review_status ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${reviewBadgeClass(
                            item.review_status,
                          )}`}
                        >
                          {outboundQualityStatusLabel(item.review_status)} · {item.review_score || 0}/100
                        </span>
                      ) : null}
                      <button
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => applyPackVariant(item)}
                      >
                        In Editor übernehmen
                      </button>
                    </div>
                  </div>
                  {item.subject ? <div className="mt-1 text-sm font-medium text-gray-900">{item.subject}</div> : null}
                  <div className="mt-1 line-clamp-3 text-sm text-gray-700">{item.body}</div>
                  <div className="mt-2 text-xs text-gray-600">Warum: {item.why}</div>
                  {item.review_summary ? (
                    <div className="mt-1 text-xs text-gray-500">{item.review_summary}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-5">
          <h2 className="text-base font-semibold text-gray-900">Sequenz‑Planer (5 Touches / 14 Tage)</h2>
          <p className="mt-1 text-xs text-gray-600">
            Fokus auf persönliche, druckfreie Akquise: erst Relevanz prüfen, dann behutsam nachfassen.
          </p>
          <div className="mt-3 space-y-2">
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              type="datetime-local"
              value={sequenceStartAt}
              onChange={(e) => setSequenceStartAt(e.target.value)}
            />
            {sequenceSteps.map((step, idx) => (
              <div key={step.message_kind} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-xs text-gray-500">{step.label}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    type="number"
                    min={0}
                    max={21}
                    value={step.day_offset}
                    onChange={(e) =>
                      setSequenceSteps((prev) =>
                        prev.map((s, i) =>
                          i === idx
                            ? { ...s, day_offset: Math.max(0, Math.min(21, Number(e.target.value || 0))) }
                            : s,
                        ),
                      )
                    }
                  />
                  <select
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    value={step.channel}
                    onChange={(e) =>
                      setSequenceSteps((prev) =>
                        prev.map((s, i) =>
                          i === idx
                            ? {
                                ...s,
                                channel: e.target.value as SequenceStep["channel"],
                              }
                            : s,
                        ),
                      )
                    }
                  >
                    <option value="email">E-Mail</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="telefon">Telefon</option>
                    <option value="kontaktformular">Kontaktformular</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                Stop bei Antwort
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                Stop bei Bounce
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                Stop bei Opt-out
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                Stop bei Risiko
              </span>
            </div>
            <button
              className="w-full rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
              disabled={busy}
              onClick={() => void runSequencePlan()}
            >
              Sequenz planen
            </button>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-900">Empfohlene Nachricht</h2>
            <div className="flex items-center gap-2">
              <select
                className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-sm"
                value={draftKind}
                onChange={(e) => {
                  setDraftKind(e.target.value);
                  if (draftReview) setDraftReviewStale(true);
                }}
              >
                <option value="first_touch">Erstkontakt</option>
                <option value="follow_up_1">Follow-up 1</option>
                <option value="follow_up_2">Follow-up 2</option>
                <option value="follow_up_3">Follow-up 3</option>
                <option value="custom">Custom</option>
              </select>
              <select
                className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-sm"
                value={draftChannel}
                onChange={(e) => {
                  setDraftChannel(e.target.value as any);
                  if (draftReview) setDraftReviewStale(true);
                }}
              >
                <option value="email">E-Mail</option>
                <option value="linkedin">LinkedIn</option>
                <option value="kontaktformular">Kontaktformular</option>
                <option value="telefon">Telefon</option>
              </select>
              <button
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                disabled={busy}
                onClick={() => void generateRecommendedMessage()}
              >
                Empfehlung laden
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-2">
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Betreff"
              value={draftSubject}
              onChange={(e) => {
                setDraftSubject(e.target.value);
                if (draftReview) setDraftReviewStale(true);
              }}
            />
            <textarea
              className="min-h-[170px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Nachrichtentext"
              value={draftBody}
              onChange={(e) => {
                setDraftBody(e.target.value);
                if (draftReview) setDraftReviewStale(true);
              }}
            />
            {draftReviewRefreshing && !draftReview ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Draft wird automatisch neu bewertet…
              </div>
            ) : null}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 ${contactSafetyBadgeClass(contactSafety.level)}`}>
                  Kontakt {contactSafetyLabel(contactSafety.level)} · {contactSafety.score}/100
                </span>
              </div>
              <div className="mt-1">{contactSafety.summary}</div>
              {contactSafety.reasons[0] ? (
                <div className="mt-1 text-[11px] text-gray-500">{contactSafety.reasons[0]}</div>
              ) : null}
            </div>
            {draftReview ? (
              <OutboundEvidenceInspector
                review={draftReview}
                defaultOpen={
                  draftReview.status !== "pass" ||
                  Number(draftReview.evidence_alignment?.unsupported_claim_count || 0) > 0
                }
              />
            ) : null}
            {draftReview ? (
              <DraftClaimHighlight
                body={draftBody}
                review={draftReview}
                stale={draftReviewStale}
                refreshing={draftReviewRefreshing}
                prospectContext={{
                  companyName: prospect.company_name,
                  city: prospect.city,
                  objectFocus: prospect.object_focus,
                  personalizationHook: prospect.personalization_hook,
                  targetGroup: prospect.target_group,
                  processHint: prospect.process_hint,
                  responsePromisePublic: prospect.response_promise_public,
                  appointmentFlowPublic: prospect.appointment_flow_public,
                  docsFlowPublic: prospect.docs_flow_public,
                }}
                evidenceRows={evidence}
                onApplySuggestion={applyDraftImprovement}
                onRequestAiRewrite={() => void rewriteDraftWithAi()}
                rewriteBusy={rewriteBusy}
              />
            ) : null}
            {draftRewriteSnapshot ? (
              <DraftRewriteDiff
                snapshot={draftRewriteSnapshot}
                currentSubject={draftSubject}
                currentBody={draftBody}
              />
            ) : null}
            <div className="grid gap-2 md:grid-cols-3">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                type="datetime-local"
                value={plannedAt}
                onChange={(e) => setPlannedAt(e.target.value)}
              />
              <button
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                disabled={busy}
                onClick={() => void saveDraft(false)}
              >
                Als geplant speichern
              </button>
              <button
                className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
                disabled={busy}
                onClick={() => void saveDraft(true)}
              >
                Jetzt senden
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {isEmailChannel(draftChannel)
                ? "E-Mail wird direkt über Gmail/Outlook versendet."
                : "Für LinkedIn, Kontaktformular und Telefon wird die Nachricht als manuell gesendet dokumentiert."}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-5">
          <h2 className="text-base font-semibold text-gray-900">Geplante Nachrichten</h2>
          <p className="mt-1 text-xs text-gray-600">
            Ready-/Draft-Nachrichten mit geplantem Versand oder offenem Status.
          </p>
          <div className="mt-3 space-y-2">
            {plannedMessages.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                Keine geplanten Nachrichten vorhanden.
              </div>
            ) : (
              plannedMessages.map((m) => {
                const scheduledFor = String(m?.metadata?.scheduled_for || "").trim();
                const externalLink = buildExternalChannelLink(m.channel, prospect);
                const templateVariant = String(m?.metadata?.template_variant || "").trim();
                const review = (m?.metadata?.outbound_review || null) as DraftReview | null;
                return (
                  <div key={m.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-gray-500">
                        {m.message_kind} · {m.channel} · {m.status}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {review ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${reviewBadgeClass(
                              review.status,
                            )}`}
                          >
                            {outboundQualityStatusLabel(review.status)} · {review.score}/100
                          </span>
                        ) : null}
                        {externalLink ? (
                          <a
                            href={externalLink.href}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            {externalLink.label}
                          </a>
                        ) : null}
                        {m.status !== "sent" ? (
                          <button
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                            disabled={savingId === m.id}
                            onClick={() => void sendExistingMessage(m.id, m.channel)}
                          >
                            {isEmailChannel(m.channel) ? "Jetzt senden" : "Als gesendet markieren"}
                          </button>
                        ) : null}
                        {m.status !== "archived" ? (
                          <button
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                            disabled={savingId === m.id}
                            onClick={() => void quickCompleteAndSetNext(m.id, m.channel)}
                          >
                            Gesendet + nächster Follow-up
                          </button>
                        ) : null}
                        {m.status !== "archived" ? (
                          <button
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                            disabled={savingId === m.id}
                            onClick={() => void setMessageStatus(m.id, "archived")}
                          >
                            Archivieren
                          </button>
                        ) : null}
                        <button
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          disabled={feedbackBusyKey === `draft:${m.id}:approve`}
                          onClick={() =>
                            void submitFeedback({
                              subjectType: "draft",
                              subjectId: m.id,
                              messageId: m.id,
                              feedbackValue: "approve",
                              successText: "Draft als gut markiert.",
                            })
                          }
                        >
                          Draft gut
                        </button>
                        <button
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                          disabled={feedbackBusyKey === `draft:${m.id}:needs_work`}
                          onClick={() =>
                            void submitFeedback({
                              subjectType: "draft",
                              subjectId: m.id,
                              messageId: m.id,
                              feedbackValue: "needs_work",
                              successText: "Draft als ueberarbeitungsbeduerftig markiert.",
                            })
                          }
                        >
                          Zu generisch
                        </button>
                      </div>
                    </div>
                    {m.subject ? <div className="mt-1 text-sm font-medium text-gray-900">{m.subject}</div> : null}
                    <div className="mt-1 line-clamp-3 text-sm text-gray-700">{m.body}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      Geplant: {scheduledFor ? formatDate(scheduledFor) : "nicht gesetzt"} · Erstellt: {formatDate(m.created_at)}
                    </div>
                    {templateVariant ? (
                      <div className="mt-1 text-[11px] text-gray-500">
                        Variante: {templateVariant}
                      </div>
                    ) : null}
                    {review ? (
                      <OutboundEvidenceInspector
                        review={review}
                        compact
                        defaultOpen={Number(review.evidence_alignment?.unsupported_claim_count || 0) > 0}
                        className="mt-2"
                      />
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Belegte Research-Fakten</h2>
            <p className="mt-1 text-xs text-gray-600">
              Direkt nutzbare, quellengestuetzte Signale für manuelle Ansprache und Review.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
            {evidence.length} Evidenzzeilen
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {evidence.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
              Noch keine strukturierte Evidenz gespeichert. Erst Research anreichern, dann erscheinen hier die belastbaren Fakten.
            </div>
          ) : (
            evidence.slice(0, 18).map((row) => (
              <div key={row.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-gray-200">
                    {row.field_name || "signal"}
                  </span>
                  {row.source_type ? (
                    <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-gray-200">
                      {row.source_type}
                    </span>
                  ) : null}
                  {typeof row.confidence === "number" ? (
                    <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-gray-200">
                      {Math.round(row.confidence * 100)}%
                    </span>
                  ) : null}
                  <span>{formatDate(row.captured_at)}</span>
                </div>
                <div className="mt-2 text-sm text-gray-900">{row.field_value || "–"}</div>
                {row.source_url ? (
                  <div className="mt-2 text-xs">
                    <a
                      href={row.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      Quelle öffnen
                    </a>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      {latestChangeSummary ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <ResearchChangeDiff
            summary={String(latestChangeSummary.summary || "")}
            items={Array.isArray(latestChangeSummary.items) ? latestChangeSummary.items : []}
          />
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-6">
          <h2 className="text-base font-semibold text-gray-900">Notizen & Insights</h2>
          <div className="mt-3 grid gap-2">
            <textarea
              className="min-h-[90px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Neue Recherche-Notiz"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              disabled={busy}
              onClick={() => void createNote()}
            >
              Notiz speichern
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {notes.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                Noch keine Notizen vorhanden.
              </div>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">
                    {n.source_type} · {formatDate(n.created_at)}
                  </div>
                  <div className="mt-1 text-sm text-gray-800">{n.note}</div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-6">
          <h2 className="text-base font-semibold text-gray-900">Verlauf</h2>
          <div className="mt-3 space-y-2">
            {events.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                Noch keine Events vorhanden.
              </div>
            ) : (
              events.map((e) => (
                <div key={e.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">{formatDate(e.event_at)}</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {EVENT_LABELS[e.event_type] || e.event_type}
                  </div>
                  {e.details ? <div className="mt-1 text-sm text-gray-700">{e.details}</div> : null}
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
