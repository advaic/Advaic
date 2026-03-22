"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import DraftClaimHighlight from "@/components/crm/DraftClaimHighlight";
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
  city: string | null;
  object_focus: "miete" | "kauf" | "neubau" | "gemischt";
  priority: "A" | "B" | "C";
  fit_score: number;
  readiness_score?: number | null;
  stage: string;
  preferred_channel: string;
  next_action: string | null;
  next_action_at: string | null;
  personalization_hook: string | null;
  source_url?: string | null;
  source_checked_at?: string | null;
  linkedin_url?: string | null;
  linkedin_search_url?: string | null;
  linkedin_relevance_note?: string | null;
  active_listings_count?: number | null;
  share_miete_percent?: number | null;
  share_kauf_percent?: number | null;
  brand_tone?: string | null;
  primary_objection?: string | null;
  automation_readiness?: string | null;
  cta_preference_guess?: string | null;
  updated_at?: string | null;
};

type ProspectCandidate = {
  id: string;
  company_name: string;
  contact_email: string | null;
  contact_role: string | null;
  city: string | null;
  website_url: string | null;
  source_url: string | null;
  linkedin_url?: string | null;
  linkedin_search_url?: string | null;
  object_focus: "miete" | "kauf" | "neubau" | "gemischt";
  preferred_channel: string;
  priority: "A" | "B" | "C";
  fit_score: number;
  automation_readiness?: string | null;
  active_listings_count?: number | null;
  personalization_hook?: string | null;
  target_group?: string | null;
  process_hint?: string | null;
  source_checked_at?: string | null;
  metadata?: Record<string, any> | null;
  learned_fit_score?: number | null;
  discovery_learning_score?: number | null;
  discovery_learning_reason?: string | null;
  created_at?: string | null;
  review_status: "new" | "promoted" | "rejected" | "duplicate";
};

type AccountChangeQueueItem = {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  city: string | null;
  priority: "A" | "B" | "C";
  fit_score: number;
  stage: string;
  next_action: string | null;
  next_action_at: string | null;
  source_checked_at?: string | null;
  personalization_hook?: string | null;
  updated_at?: string | null;
  change_summary?: string | null;
  change_count?: number | null;
  change_detected_at?: string | null;
  latest_change_note?: string | null;
  change_items?: Array<{
    field?: string;
    label?: string;
    severity?: "high" | "medium";
    previous?: string | null;
    current?: string | null;
    summary?: string | null;
  }>;
};

type BlockedDraftQueueItem = {
  id: string;
  prospect_id: string;
  company_name: string;
  city: string | null;
  stage: string | null;
  priority: "A" | "B" | "C" | null;
  fit_score: number | null;
  channel: string;
  message_kind: string;
  subject: string | null;
  body: string;
  body_preview: string;
  status: string;
  review: DraftReview | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type FollowupDue = {
  prospect_id: string;
  company_name: string;
  contact_name: string | null;
  contact_email?: string | null;
  priority: "A" | "B" | "C";
  fit_score: number;
  recommended_action: string | null;
  recommended_reason?: string | null;
  recommended_code?: string | null;
  recommended_primary_label?: string | null;
  recommended_at: string | null;
};

type NextBestAction = {
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
  recommended_score?: number;
  readiness_score?: number;
  score_breakdown?: Array<{
    label: string;
    impact: number;
    detail: string;
  }>;
  guardrails?: {
    hard_stop: boolean;
    hard_stop_reason: string | null;
    open_reply: boolean;
    recent_bounce: boolean;
    has_ready_draft: boolean;
  };
  research?: {
    status: "ready" | "refresh_research" | "needs_research" | "missing_contact";
    score: number;
    summary: string;
    blockers: string[];
    warnings: string[];
  };
};

type Overview = {
  prospects_total: number;
  contacted_total: number;
  replied_total: number;
  pilot_invited_total: number;
  pilot_active_total: number;
  won_total: number;
  lost_total: number;
};

type CrmAutomationSettings = {
  sequence_automation_enabled: boolean;
  enrichment_automation_enabled: boolean;
  reason: string | null;
  updated_at: string | null;
  source: "table" | "default";
  schema_missing?: boolean;
};

type OverviewResponse = {
  ok: boolean;
  summary: Overview;
  followup_due: FollowupDue[];
  prospects: Prospect[];
  candidate_queue: ProspectCandidate[];
  account_change_queue: AccountChangeQueueItem[];
  blocked_draft_queue: BlockedDraftQueueItem[];
  open_feedback: {
    total: number;
    by_severity: { critical: number; high: number; medium: number; low: number };
  };
  automation: CrmAutomationSettings;
  error?: string;
  details?: string;
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

type OutreachMessage = {
  id: string;
  channel: string;
  message_kind: string;
  subject: string | null;
  body: string;
  personalization_score: number | null;
  status: "draft" | "ready" | "sent" | "failed" | "archived";
  sent_at: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

type DraftReview = DraftEvidenceReview;

type OutreachEvent = {
  id: string;
  message_id: string | null;
  event_type: string;
  details: string | null;
  event_at: string;
  created_at: string;
};

type PerformanceChannelMetric = {
  channel: string;
  sent_messages: number;
  touched_prospects: number;
  reply_prospects: number;
  reply_rate_pct: number;
  pilot_prospects: number;
  pilot_rate_pct: number;
  won_prospects?: number;
  won_rate_pct?: number;
  failed_messages?: number;
  failure_rate_pct?: number;
  bounce_events?: number;
  opt_out_events?: number;
  avg_response_hours: number | null;
};

type PerformanceTemplateMetric = {
  channel: string;
  template_variant: string;
  sent_messages: number;
  touched_prospects: number;
  reply_prospects: number;
  reply_rate_pct: number;
  pilot_prospects: number;
  pilot_rate_pct: number;
  won_prospects?: number;
  won_rate_pct?: number;
};

type PerformanceVariantSegmentMetric = {
  segment_key: string;
  channel: string;
  template_variant: string;
  sent_messages: number;
  touched_prospects: number;
  reply_prospects: number;
  reply_rate_pct: number;
  pilot_prospects: number;
  pilot_rate_pct: number;
  won_prospects?: number;
  won_rate_pct?: number;
};

type DeliverabilityCorrelationRow = {
  channel: string;
  sent_messages: number;
  failed_messages: number;
  failure_rate_pct: number;
  bounce_events: number;
  opt_out_events: number;
  reply_rate_pct: number;
  pilot_rate_pct: number;
  won_rate_pct: number;
  risk_level: "niedrig" | "mittel" | "hoch";
  recommendation: string;
};

type RevenueAttribution = {
  won_total: number;
  by_channel: Array<{
    channel: string;
    touched: number;
    reply_rate_pct: number;
    pilot_rate_pct: number;
    won_rate_pct: number;
  }>;
  by_template_variant: Array<{
    template_variant: string;
    touched: number;
    reply_rate_pct: number;
    pilot_rate_pct: number;
    won_rate_pct: number;
  }>;
  by_source_domain: Array<{
    source_domain: string;
    touched: number;
    reply_rate_pct: number;
    pilot_rate_pct: number;
    won_rate_pct: number;
  }>;
  close_loop_examples: Array<{
    prospect_id: string;
    company_name: string;
    source_domain: string | null;
    first_touch_channel: string;
    first_touch_variant: string;
    replied: boolean;
    pilot: boolean;
    won: boolean;
  }>;
};

type SequenceRollout = {
  message_kind: string;
  winner_variant: string;
  confidence: number;
  sample_size: number;
  updated_at: string;
};

type PerformanceResponse = {
  ok: boolean;
  updated_at: string;
  channel_metrics: PerformanceChannelMetric[];
  template_metrics: PerformanceTemplateMetric[];
  variant_segment_metrics?: PerformanceVariantSegmentMetric[];
  deliverability_correlation?: DeliverabilityCorrelationRow[];
  revenue_attribution?: RevenueAttribution;
  sequence_rollouts?: SequenceRollout[];
  error?: string;
  details?: string;
};

type ReplyInboxItem = {
  event_id: string;
  event_at: string;
  prospect_id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  city: string | null;
  stage: string;
  handled: boolean;
  next_action: string | null;
  next_action_at: string | null;
  object_focus: string;
  fit_score: number | null;
  priority: string;
  channel: string;
  message_kind: string | null;
  subject: string | null;
  sent_at: string | null;
  template_variant: string;
  reply_intent: "interesse" | "objection" | "nicht_jetzt" | "opt_out" | "falscher_kontakt" | "neutral";
  reply_intent_confidence: number | null;
  reply_signal?: string | null;
  reply_strength?: string | null;
  reply_intent_reason: string | null;
  recommendation: string | null;
  objection_topics?: string[];
  timeline_hint_days?: number | null;
  contact_resolution_needed?: boolean;
  contact_hint?: string | null;
  stop_automation?: boolean;
  response_time_hours: number | null;
};

type ReplyInboxResponse = {
  ok: boolean;
  updated_at: string;
  summary: {
    total: number;
    pending: number;
    by_intent: Record<string, number>;
  };
  items: ReplyInboxItem[];
  error?: string;
  details?: string;
};

type PublicChatLogItem = {
  id: string;
  created_at: string;
  event: string;
  path: string | null;
  session_id: string | null;
  visitor_id: string | null;
  message_preview: string | null;
  answer_preview: string | null;
  message_chars: number | null;
  answer_chars: number | null;
};

type PublicChatLogsResponse = {
  ok: boolean;
  total: number;
  logs: PublicChatLogItem[];
  note?: string;
  error?: string;
  details?: string;
};

type ProspectDiscoveryResponse = {
  ok: boolean;
  run_id?: string | null;
  cities: string[];
  selected: number;
  created: number;
  skipped_existing: number;
  skipped_irrelevant: number;
  failed: number;
  candidates: Array<{
    id: string;
    company_name: string;
    city: string | null;
    website_url: string | null;
    source_url: string | null;
    fit_score: number;
  }>;
  by_city: Array<{
    city: string;
    created: number;
    skipped_existing: number;
    skipped_irrelevant: number;
    failed: number;
  }>;
  error?: string;
  details?: string;
};

type CandidateReviewResponse = {
  ok: boolean;
  status: "promoted" | "rejected" | "duplicate";
  already_processed?: boolean;
  candidate_id: string;
  prospect_id?: string | null;
  prospect?: {
    id: string;
    company_name: string;
  } | null;
  reason?: string | null;
  error?: string;
  details?: string;
};

type ContactRepairResponse = {
  ok: boolean;
  status: "resolved" | "manual_review" | "no_candidate" | "skipped";
  summary: string;
  strategy?: {
    id: string;
    version: number;
    chosen_channel: string | null;
    chosen_contact_value: string | null;
  } | null;
  selected_contact?: {
    id: string | null;
    channel_type: string;
    channel_value: string;
  } | null;
  invalidated_contact?: {
    id: string | null;
    channel_type: string;
    channel_value: string;
  } | null;
  error?: string;
  details?: string;
};

type LearningSnapshotResponse = {
  ok: boolean;
  snapshot?: {
    id: string;
    lookback_days: number;
    computed_at: string;
    summary: {
      outbound_attempts: number;
      positive_outcomes: number;
      negative_outcomes: number;
      positive_rate: number;
      negative_rate: number;
      candidate_accept_rate: number;
      draft_approve_rate: number;
      draft_needs_work_rate: number;
      quality_pass_rate: number;
      wrong_contact_count: number;
      reply_rate: number;
      positive_reply_rate: number;
      pilot_rate: number;
      bounce_rate: number;
      avg_response_hours: number | null;
      manual_override_rate: number;
    };
    insights: {
      channel_biases: Array<{
        channel: string;
        score_adjustment: number;
        sample_size: number;
        positive_rate: number;
        negative_rate: number;
        reason: string;
      }>;
      segment_channel_biases: Array<{
        segment_key: string;
        channel: string;
        score_adjustment: number;
        sample_size: number;
        reason: string;
      }>;
      variant_biases: Array<{
        message_kind: string;
        variant: string;
        score_adjustment: number;
        sample_size: number;
        reason: string;
      }>;
      discovery_biases: Array<{
        city: string;
        discovery_source: string;
        query_pattern: string;
        score_adjustment: number;
        sample_size: number;
        accept_rate: number;
        positive_rate: number;
        negative_rate: number;
        reason: string;
      }>;
      timing_biases: Array<{
        channel: string;
        weekday: string;
        hour_bucket: string;
        score_adjustment: number;
        sample_size: number;
        positive_rate: number;
        negative_rate: number;
        reason: string;
      }>;
      quality_hotspots: Array<{
        label: string;
        type: "blocker" | "warning";
        count: number;
      }>;
      failure_postmortems: Array<{
        code: string;
        label: string;
        count: number;
        share: number;
        reason: string;
      }>;
    };
  } | null;
  error?: string;
  details?: string;
};

type NewProspectForm = {
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_role: string;
  city: string;
  region: string;
  website_url: string;
  source_url: string;
  source_checked_at: string;
  linkedin_url: string;
  linkedin_search_url: string;
  linkedin_headline: string;
  linkedin_relevance_note: string;
  object_focus: "miete" | "kauf" | "neubau" | "gemischt";
  priority: "A" | "B" | "C";
  fit_score: number;
  active_listings_count: number | "";
  new_listings_30d: number | "";
  share_miete_percent: number | "";
  share_kauf_percent: number | "";
  object_types_csv: string;
  response_promise_public: string;
  appointment_flow_public: string;
  docs_flow_public: string;
  brand_tone: "kurz_direkt" | "freundlich" | "professionell" | "gemischt" | "";
  primary_objection: string;
  cta_preference_guess: "kurze_mail_antwort" | "15_min_call" | "video_link" | "formular_antwort" | "";
  automation_readiness: "niedrig" | "mittel" | "hoch" | "";
  personalization_evidence: string;
  hypothesis_confidence: number | "";
  preferred_channel: "email" | "telefon" | "linkedin" | "kontaktformular";
  target_group: string;
  process_hint: string;
  personalization_hook: string;
  pain_point_hypothesis: string;
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

const REPLY_INTENT_LABELS: Record<string, string> = {
  interesse: "Interesse",
  objection: "Einwand",
  nicht_jetzt: "Nicht jetzt",
  opt_out: "Opt-out",
  falscher_kontakt: "Falscher Kontakt",
  neutral: "Neutral",
};

const REPLY_SIGNAL_LABELS: Record<string, string> = {
  meeting_ready: "Terminbereit",
  pilot_interest: "Interesse",
  info_request: "Info-Request",
  timing_deferral: "Timing",
  pricing_objection: "Preis",
  compliance_objection: "DSGVO",
  control_objection: "Kontrolle",
  quality_objection: "Qualitaet",
  capacity_objection: "Aufwand",
  wrong_contact_referral: "Kontakt-Hinweis",
  wrong_contact_dead_end: "Falscher Kontakt",
  hard_opt_out: "Stop",
  soft_rejection: "Absage",
  neutral: "Neutral",
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function replyIntentBadgeClass(intent: string) {
  if (intent === "interesse") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (intent === "objection") return "bg-amber-50 text-amber-800 ring-amber-200";
  if (intent === "nicht_jetzt") return "bg-blue-50 text-blue-700 ring-blue-200";
  if (intent === "opt_out" || intent === "falscher_kontakt")
    return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-gray-50 text-gray-700 ring-gray-200";
}

function buildLinkedInSearchUrl(companyName: string, contactName: string, city: string) {
  const q = [contactName, companyName, city, "LinkedIn Immobilien"].filter(Boolean).join(" ");
  if (!q.trim()) return "";
  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(q)}`;
}

function parseDiscoveryCitiesInput(value: string) {
  return [...new Set(value.split(",").map((part) => part.trim()).filter(Boolean))].slice(0, 10);
}

function stageBadgeClass(stage: string) {
  if (stage === "won") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (stage === "lost") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (stage.startsWith("pilot")) return "bg-blue-50 text-blue-700 ring-blue-200";
  if (stage === "replied") return "bg-sky-50 text-sky-700 ring-sky-200";
  return "bg-gray-50 text-gray-700 ring-gray-200";
}

function readinessBadgeClass(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (score >= 65) return "bg-blue-50 text-blue-700 ring-blue-200";
  if (score >= 50) return "bg-amber-50 text-amber-800 ring-amber-200";
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

function learningBiasBadgeClass(score: number | null | undefined) {
  const value = Number(score || 0);
  if (value >= 5) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (value > 0) return "bg-blue-50 text-blue-700 ring-blue-200";
  if (value <= -5) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (value < 0) return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-gray-50 text-gray-700 ring-gray-200";
}

function crmAutomationBadgeClass(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-rose-50 text-rose-700 ring-rose-200";
}

const defaultForm: NewProspectForm = {
  company_name: "",
  contact_name: "",
  contact_email: "",
  contact_role: "",
  city: "",
  region: "",
  website_url: "",
  source_url: "",
  source_checked_at: "",
  linkedin_url: "",
  linkedin_search_url: "",
  linkedin_headline: "",
  linkedin_relevance_note: "",
  object_focus: "gemischt",
  priority: "B",
  fit_score: 70,
  active_listings_count: "",
  new_listings_30d: "",
  share_miete_percent: "",
  share_kauf_percent: "",
  object_types_csv: "",
  response_promise_public: "",
  appointment_flow_public: "",
  docs_flow_public: "",
  brand_tone: "",
  primary_objection: "",
  cta_preference_guess: "",
  automation_readiness: "",
  personalization_evidence: "",
  hypothesis_confidence: "",
  preferred_channel: "email",
  target_group: "",
  process_hint: "",
  personalization_hook: "",
  pain_point_hypothesis: "",
};

export default function CrmControlCenter({
  initialData,
}: {
  initialData: OverviewResponse;
}) {
  const [data, setData] = useState<OverviewResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [form, setForm] = useState<NewProspectForm>(defaultForm);
  const [formBusy, setFormBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    initialData.ok ? null : initialData.details || initialData.error || null,
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [pipelineQuery, setPipelineQuery] = useState("");
  const [pipelineStage, setPipelineStage] = useState("all");
  const [pipelineSort, setPipelineSort] = useState<
    "fit_desc" | "readiness_desc" | "priority_fit" | "next_action_asc" | "updated_desc" | "company_asc"
  >("fit_desc");

  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(
    initialData.prospects?.[0]?.id || null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [events, setEvents] = useState<OutreachEvent[]>([]);

  const [newNote, setNewNote] = useState("");
  const [newDraftSubject, setNewDraftSubject] = useState("");
  const [newDraftBody, setNewDraftBody] = useState("");
  const [newDraftKind, setNewDraftKind] = useState("first_touch");
  const [newDraftChannel, setNewDraftChannel] = useState("email");
  const [newDraftReview, setNewDraftReview] = useState<DraftReview | null>(null);
  const [newDraftReviewStale, setNewDraftReviewStale] = useState(false);
  const [sendProvider, setSendProvider] = useState<"auto" | "gmail" | "outlook">("auto");
  const [noteBusy, setNoteBusy] = useState(false);
  const [draftBusy, setDraftBusy] = useState(false);
  const [nextAction, setNextAction] = useState<NextBestAction | null>(null);
  const [performance, setPerformance] = useState<PerformanceResponse | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [replyInbox, setReplyInbox] = useState<ReplyInboxResponse | null>(null);
  const [replyInboxLoading, setReplyInboxLoading] = useState(false);
  const [replyIntentFilter, setReplyIntentFilter] = useState("all");
  const [replyPendingOnly, setReplyPendingOnly] = useState(true);
  const [publicChatLogs, setPublicChatLogs] = useState<PublicChatLogsResponse | null>(null);
  const [publicChatLogsLoading, setPublicChatLogsLoading] = useState(false);
  const [learningSnapshot, setLearningSnapshot] = useState<LearningSnapshotResponse["snapshot"] | null>(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [recomputingExperiments, setRecomputingExperiments] = useState(false);
  const [discoveringProspects, setDiscoveringProspects] = useState(false);
  const [automationBusy, setAutomationBusy] = useState(false);
  const [automationNote, setAutomationNote] = useState(initialData.automation?.reason || "");
  const [candidateBusyId, setCandidateBusyId] = useState<string | null>(null);
  const [discoveryCitiesInput, setDiscoveryCitiesInput] = useState("Berlin, Hamburg, München");
  const [discoveryPerCityLimit, setDiscoveryPerCityLimit] = useState(3);

  const loadNextAction = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/next-action", { cache: "no-store" });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json?.ok) {
        return;
      }
      setNextAction((json?.next_action || null) as NextBestAction | null);
    } catch {
      // Keep UI usable even if this card fails.
    }
  }, []);

  const loadPerformance = useCallback(async () => {
    setPerformanceLoading(true);
    try {
      const res = await fetch("/api/crm/performance", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as PerformanceResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Performance-Daten konnten nicht geladen werden.");
      }
      setPerformance(json);
    } catch {
      setPerformance(null);
    } finally {
      setPerformanceLoading(false);
    }
  }, []);

  const loadReplyInbox = useCallback(async () => {
    setReplyInboxLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("limit", "60");
      if (replyIntentFilter && replyIntentFilter !== "all") q.set("intent", replyIntentFilter);
      if (replyPendingOnly) q.set("pending_only", "1");
      const res = await fetch(`/api/crm/replies/inbox?${q.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as ReplyInboxResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Reply-Inbox konnte nicht geladen werden.");
      }
      setReplyInbox(json);
    } catch {
      setReplyInbox(null);
    } finally {
      setReplyInboxLoading(false);
    }
  }, [replyIntentFilter, replyPendingOnly]);

  const loadPublicChatLogs = useCallback(async () => {
    setPublicChatLogsLoading(true);
    try {
      const res = await fetch("/api/crm/public-chat/logs?limit=120", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as PublicChatLogsResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Public-Chat-Logs konnten nicht geladen werden.");
      }
      setPublicChatLogs(json);
    } catch {
      setPublicChatLogs(null);
    } finally {
      setPublicChatLogsLoading(false);
    }
  }, []);

  const loadLearningSnapshot = useCallback(async () => {
    setLearningLoading(true);
    try {
      const res = await fetch("/api/crm/learning", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as LearningSnapshotResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Learning-Snapshot konnte nicht geladen werden.");
      }
      setLearningSnapshot(json.snapshot || null);
    } catch {
      setLearningSnapshot(null);
    } finally {
      setLearningLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/overview", { cache: "no-store" });
      const json = (await res.json()) as OverviewResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.details || json?.error || "CRM-Daten konnten nicht geladen werden.",
        );
      }
      setData(json);
      await loadNextAction();
      await loadPerformance();
      await loadReplyInbox();
      await loadPublicChatLogs();
      await loadLearningSnapshot();
      if (!selectedProspectId && json.prospects?.[0]?.id) {
        setSelectedProspectId(json.prospects[0].id);
      }
    } catch (e: any) {
      setError(String(e?.message || "CRM-Daten konnten nicht geladen werden."));
    } finally {
      setLoading(false);
    }
  }, [
    loadLearningSnapshot,
    loadNextAction,
    loadPerformance,
    loadPublicChatLogs,
    loadReplyInbox,
    selectedProspectId,
  ]);

  const loadProspectDetail = useCallback(async (prospectId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const [notesRes, messagesRes, eventsRes] = await Promise.all([
        fetch(`/api/crm/prospects/${prospectId}/notes`, { cache: "no-store" }),
        fetch(`/api/crm/prospects/${prospectId}/messages`, { cache: "no-store" }),
        fetch(`/api/crm/prospects/${prospectId}/events`, { cache: "no-store" }),
      ]);
      const notesJson = await notesRes.json().catch(() => ({} as any));
      const messagesJson = await messagesRes.json().catch(() => ({} as any));
      const eventsJson = await eventsRes.json().catch(() => ({} as any));

      if (!notesRes.ok || !notesJson?.ok) {
        throw new Error(notesJson?.details || notesJson?.error || "Notizen konnten nicht geladen werden.");
      }
      if (!messagesRes.ok || !messagesJson?.ok) {
        throw new Error(messagesJson?.details || messagesJson?.error || "Nachrichten konnten nicht geladen werden.");
      }
      if (!eventsRes.ok || !eventsJson?.ok) {
        throw new Error(eventsJson?.details || eventsJson?.error || "Events konnten nicht geladen werden.");
      }

      setNotes(Array.isArray(notesJson.notes) ? notesJson.notes : []);
      setMessages(Array.isArray(messagesJson.messages) ? messagesJson.messages : []);
      setEvents(Array.isArray(eventsJson.events) ? eventsJson.events : []);
    } catch (e: any) {
      setError(String(e?.message || "Prospect-Details konnten nicht geladen werden."));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedProspectId && data.prospects?.[0]?.id) {
      setSelectedProspectId(data.prospects[0].id);
    }
  }, [data.prospects, selectedProspectId]);

  useEffect(() => {
    setAutomationNote(data.automation?.reason || "");
  }, [data.automation?.reason, data.automation?.updated_at]);

  useEffect(() => {
    void loadNextAction();
    void loadPerformance();
    void loadReplyInbox();
    void loadPublicChatLogs();
    void loadLearningSnapshot();
  }, [loadLearningSnapshot, loadNextAction, loadPerformance, loadPublicChatLogs, loadReplyInbox]);

  useEffect(() => {
    if (!selectedProspectId) {
      setNotes([]);
      setMessages([]);
      setEvents([]);
      setNewDraftReview(null);
      setNewDraftReviewStale(false);
      return;
    }
    void loadProspectDetail(selectedProspectId);
  }, [loadProspectDetail, selectedProspectId]);

  useEffect(() => {
    setNewDraftReview(null);
    setNewDraftReviewStale(false);
  }, [selectedProspectId]);

  const selectedProspect = useMemo(
    () => data.prospects.find((p) => p.id === selectedProspectId) || null,
    [data.prospects, selectedProspectId],
  );
  const selectedChangeSummary = useMemo(() => {
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
  const selectedContactSafety = useMemo(() => {
    if (!selectedProspect) return null;
    const value =
      newDraftChannel === "email"
        ? selectedProspect.contact_email
        : newDraftChannel === "linkedin"
          ? selectedProspect.linkedin_url || selectedProspect.linkedin_search_url
          : selectedProspect.source_url;
    return assessContactSafety({
      preferredChannel: newDraftChannel || selectedProspect.preferred_channel,
      contact: {
        channel_type: newDraftChannel || selectedProspect.preferred_channel,
        channel_value: value || null,
        contact_name: selectedProspect.contact_name,
        source_type:
          newDraftChannel === "linkedin"
            ? selectedProspect.linkedin_url
              ? "linkedin-profil"
              : "linkedin-search"
            : newDraftChannel === "kontaktformular"
              ? "website"
              : "prospect",
        confidence:
          newDraftChannel === "email" && selectedProspect.contact_email
            ? 0.62
            : newDraftChannel === "linkedin" && (selectedProspect.linkedin_url || selectedProspect.linkedin_search_url)
              ? 0.58
              : 0.4,
        validation_status: "new",
        is_primary: true,
      },
    });
  }, [newDraftChannel, selectedProspect]);
  const automation = data.automation || {
    sequence_automation_enabled: true,
    enrichment_automation_enabled: true,
    reason: null,
    updated_at: null,
    source: "default" as const,
  };
  const allCrmAutomationActive =
    automation.sequence_automation_enabled && automation.enrichment_automation_enabled;
  const crmAutomationStatusLabel = allCrmAutomationActive
    ? "Aktiv"
    : !automation.sequence_automation_enabled && !automation.enrichment_automation_enabled
      ? "Pausiert"
      : "Teilweise pausiert";
  const prospectResearchById = useMemo(() => {
    const map = new Map<
      string,
      ReturnType<typeof assessResearchReadiness>
    >();
    for (const prospect of data.prospects || []) {
      map.set(
        prospect.id,
        assessResearchReadiness({
          preferredChannel: prospect.preferred_channel,
          contactEmail: prospect.contact_email,
          personalizationHook: prospect.personalization_hook,
          sourceCheckedAt: prospect.source_checked_at,
          activeListingsCount:
            typeof prospect.active_listings_count === "number"
              ? prospect.active_listings_count
              : null,
          automationReadiness: prospect.automation_readiness || null,
          linkedinUrl: prospect.linkedin_url || null,
          linkedinSearchUrl: prospect.linkedin_search_url || null,
        }),
      );
    }
    return map;
  }, [data.prospects]);
  const filteredProspects = useMemo(() => {
    const q = pipelineQuery.trim().toLowerCase();
    return (data.prospects || []).filter((p) => {
      if (pipelineStage !== "all" && p.stage !== pipelineStage) return false;
      if (!q) return true;
      const haystack = [
        p.company_name,
        p.contact_name || "",
        p.contact_email || "",
        p.city || "",
        p.object_focus || "",
        p.personalization_hook || "",
        p.linkedin_url || "",
        p.primary_objection || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data.prospects, pipelineQuery, pipelineStage]);

  const sortedProspects = useMemo(() => {
    const rankPriority = (p: "A" | "B" | "C") => (p === "A" ? 0 : p === "B" ? 1 : 2);
    const readiness = (p: Prospect) =>
      Number.isFinite(Number(p.readiness_score)) ? Number(p.readiness_score) : Number(p.fit_score || 0);
    return [...filteredProspects].sort((a, b) => {
      if (pipelineSort === "fit_desc") {
        if (b.fit_score !== a.fit_score) return b.fit_score - a.fit_score;
        return rankPriority(a.priority) - rankPriority(b.priority);
      }
      if (pipelineSort === "readiness_desc") {
        const d = readiness(b) - readiness(a);
        if (d !== 0) return d;
        return b.fit_score - a.fit_score;
      }
      if (pipelineSort === "priority_fit") {
        const prio = rankPriority(a.priority) - rankPriority(b.priority);
        if (prio !== 0) return prio;
        return b.fit_score - a.fit_score;
      }
      if (pipelineSort === "next_action_asc") {
        const aTs = a.next_action_at ? new Date(a.next_action_at).getTime() : Number.POSITIVE_INFINITY;
        const bTs = b.next_action_at ? new Date(b.next_action_at).getTime() : Number.POSITIVE_INFINITY;
        if (aTs !== bTs) return aTs - bTs;
        return b.fit_score - a.fit_score;
      }
      if (pipelineSort === "updated_desc") {
        const aTs = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTs = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        if (bTs !== aTs) return bTs - aTs;
        return b.fit_score - a.fit_score;
      }
      return String(a.company_name || "").localeCompare(String(b.company_name || ""), "de");
    });
  }, [filteredProspects, pipelineSort]);

  const readinessHotCount = useMemo(
    () =>
      (data.prospects || []).filter((p) => {
        const score = Number.isFinite(Number(p.readiness_score))
          ? Number(p.readiness_score)
          : Number(p.fit_score || 0);
        return score >= 75 && !["pilot_active", "pilot_finished", "won", "lost"].includes(p.stage);
      }).length,
    [data.prospects],
  );
  const researchGapProspects = useMemo(() => {
    return [...(data.prospects || [])]
      .map((prospect) => ({
        prospect,
        research: prospectResearchById.get(prospect.id),
      }))
      .filter(
        (item) =>
          item.research &&
          item.research.status !== "ready" &&
          !["won", "lost", "pilot_finished", "pilot_active"].includes(item.prospect.stage),
      )
      .sort((a, b) => {
        const scoreDiff = Number(a.research?.score || 0) - Number(b.research?.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return Number(b.prospect.fit_score || 0) - Number(a.prospect.fit_score || 0);
      })
      .slice(0, 12);
  }, [data.prospects, prospectResearchById]);
  const accountChangeQueue = useMemo(() => {
    return [...(data.account_change_queue || [])]
      .filter((item) => !["won", "lost", "pilot_finished"].includes(String(item.stage || "")))
      .sort((a, b) => {
        const aTs = a.change_detected_at ? new Date(a.change_detected_at).getTime() : Number.POSITIVE_INFINITY;
        const bTs = b.change_detected_at ? new Date(b.change_detected_at).getTime() : Number.POSITIVE_INFINITY;
        if (aTs !== bTs) return aTs - bTs;
        return Number(b.fit_score || 0) - Number(a.fit_score || 0);
      })
      .slice(0, 12);
  }, [data.account_change_queue]);
  const contactRepairQueue = useMemo(() => {
    return (data.followup_due || [])
      .filter((row) =>
        ["fill_contact_channel", "switch_channel_after_bounce"].includes(
          String(row.recommended_code || ""),
        ),
      )
      .map((row) => ({
        row,
        prospect: data.prospects.find((prospect) => prospect.id === row.prospect_id) || null,
        research: prospectResearchById.get(row.prospect_id) || null,
      }))
      .slice(0, 12);
  }, [data.followup_due, data.prospects, prospectResearchById]);

  const conversionRates = useMemo(() => {
    const s = data.summary;
    const total = Math.max(1, Number(s?.prospects_total || 0));
    return {
      reply: Math.round(((Number(s?.replied_total || 0) / total) * 100) * 10) / 10,
      pilot: Math.round(((Number(s?.pilot_active_total || 0) / total) * 100) * 10) / 10,
      win: Math.round(((Number(s?.won_total || 0) / total) * 100) * 10) / 10,
    };
  }, [data.summary]);

  async function createProspect() {
    if (!form.company_name.trim()) {
      setError("Bitte mindestens einen Firmennamen angeben.");
      return;
    }
    setFormBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const autoLinkedInSearchUrl =
        form.linkedin_search_url.trim() ||
        buildLinkedInSearchUrl(form.company_name, form.contact_name, form.city);
      const objectTypes = form.object_types_csv
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const payload = {
        ...form,
        linkedin_search_url: autoLinkedInSearchUrl,
        object_types: objectTypes,
        primary_pain_hypothesis: form.pain_point_hypothesis || "",
        secondary_pain_hypothesis: form.process_hint || "",
      };
      const res = await fetch("/api/crm/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Prospect konnte nicht erstellt werden.");
      }
      setForm(defaultForm);
      setSuccess(`Prospect „${json?.prospect?.company_name || "Neu"}“ wurde angelegt.`);
      await refresh();
      const createdId = String(json?.prospect?.id || "").trim();
      if (createdId) {
        setSelectedProspectId(createdId);
        try {
          await fetch(`/api/crm/prospects/${createdId}/enrich`, {
            method: "POST",
          });
          await refresh();
        } catch {
          // Fail-open: prospect creation remains successful.
        }
      }
    } catch (e: any) {
      setError(String(e?.message || "Prospect konnte nicht erstellt werden."));
    } finally {
      setFormBusy(false);
    }
  }

  async function runProspectDiscovery(opts?: { preset?: "top_cities" }) {
    const cities = opts?.preset === "top_cities" ? [] : parseDiscoveryCitiesInput(discoveryCitiesInput);
    if (opts?.preset !== "top_cities" && cities.length === 0) {
      setError("Bitte mindestens eine Stadt für die Prospect-Suche angeben.");
      return;
    }

    setDiscoveringProspects(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/discover/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: opts?.preset || null,
          cities,
          per_city_limit: discoveryPerCityLimit,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as ProspectDiscoveryResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Prospect-Discovery fehlgeschlagen.");
      }

      const citySummary = (Array.isArray(json.by_city) ? json.by_city : [])
        .filter((row) => Number(row.created || 0) > 0)
        .map((row) => `${row.city}: ${row.created}`)
        .join(" · ");

      setSuccess(
        `Discovery-Run: ${Number(json.created || 0)} neue Kandidaten, ${Number(json.skipped_existing || 0)} bereits vorhanden, ${Number(json.skipped_irrelevant || 0)} verworfen, ${Number(json.failed || 0)} Fehler bei ${Number(json.selected || 0)} geprüften Websites.${citySummary ? ` ${citySummary}` : ""}`,
      );
      await refresh();
    } catch (e: any) {
      setError(String(e?.message || "Prospect-Discovery fehlgeschlagen."));
    } finally {
      setDiscoveringProspects(false);
    }
  }

  async function acceptCandidate(candidateId: string) {
    setCandidateBusyId(candidateId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/candidates/${candidateId}/accept`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => ({}))) as CandidateReviewResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Kandidat konnte nicht übernommen werden.");
      }

      await refresh();
      const prospectId = String(json.prospect_id || "").trim();
      if (prospectId) {
        setSelectedProspectId(prospectId);
        await loadProspectDetail(prospectId);
      }

      if (json.status === "duplicate") {
        setSuccess(
          `Kandidat war bereits vorhanden und wurde als Duplikat markiert${json?.prospect?.company_name ? `: ${json.prospect.company_name}` : ""}.`,
        );
        return;
      }

      setSuccess(
        `Kandidat übernommen${json?.prospect?.company_name ? `: ${json.prospect.company_name}` : ""}.`,
      );
    } catch (e: any) {
      setError(String(e?.message || "Kandidat konnte nicht übernommen werden."));
    } finally {
      setCandidateBusyId(null);
    }
  }

  async function rejectCandidate(candidateId: string, reason = "Nicht passend für unsere Akquise.") {
    setCandidateBusyId(candidateId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/candidates/${candidateId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = (await res.json().catch(() => ({}))) as CandidateReviewResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Kandidat konnte nicht verworfen werden.");
      }
      await refresh();
      setSuccess("Kandidat verworfen.");
    } catch (e: any) {
      setError(String(e?.message || "Kandidat konnte nicht verworfen werden."));
    } finally {
      setCandidateBusyId(null);
    }
  }

  async function updateStage(prospectId: string, stage: string) {
    setSaving(prospectId);
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
      setSuccess("Stage wurde aktualisiert.");
      await refresh();
      if (selectedProspectId) await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Stage-Update fehlgeschlagen."));
    } finally {
      setSaving(null);
    }
  }

  async function markAccountChangeReviewed(item: AccountChangeQueueItem) {
    setSaving(item.id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/prospects/${item.id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: item.stage,
          next_action: null,
          next_action_at: null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Account-Aenderung konnte nicht abgeschlossen werden.");
      }
      setSuccess(`${item.company_name}: Account-Aenderung als geprüft markiert.`);
      await refresh();
      if (selectedProspectId) await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Account-Aenderung konnte nicht abgeschlossen werden."));
    } finally {
      setSaving(null);
    }
  }

  function rescueBlockedDraft(item: BlockedDraftQueueItem) {
    setSelectedProspectId(item.prospect_id);
    setNewDraftKind(item.message_kind || "custom");
    setNewDraftChannel(item.channel || "email");
    setNewDraftSubject(item.subject || "");
    setNewDraftBody(item.body || "");
    setNewDraftReview(item.review || null);
    setNewDraftReviewStale(false);
    setSuccess(`${item.company_name}: Draft in den Editor geladen.`);
  }

  async function logEvent(prospectId: string, eventType: string, label: string) {
    setSaving(prospectId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: prospectId,
          event_type: eventType,
          details: `${label} wurde manuell gesetzt`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Event konnte nicht gespeichert werden.");
      }
      setSuccess(`Event „${label}“ wurde gespeichert.`);
      await refresh();
      if (selectedProspectId) await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Event konnte nicht gespeichert werden."));
    } finally {
      setSaving(null);
    }
  }

  async function createNote() {
    if (!selectedProspectId) return;
    if (!newNote.trim()) {
      setError("Bitte zuerst eine Notiz eingeben.");
      return;
    }
    setNoteBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/prospects/${selectedProspectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: newNote,
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
      await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Notiz konnte nicht gespeichert werden."));
    } finally {
      setNoteBusy(false);
    }
  }

  async function createDraft() {
    if (!selectedProspectId) return;
    if (!newDraftBody.trim()) {
      setError("Bitte einen Nachrichtentext eingeben.");
      return;
    }
    setDraftBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/prospects/${selectedProspectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: newDraftChannel,
          message_kind: newDraftKind,
          subject: newDraftSubject,
          body: newDraftBody,
          status: "ready",
          personalization_score: 85,
          metadata: {
            source: "crm_control_center",
            cadence_key: "cadence_v1_5touch_14d",
            cadence_step:
              newDraftKind === "first_touch"
                ? 1
                : newDraftKind === "follow_up_1"
                  ? 2
                  : newDraftKind === "follow_up_2"
                    ? 3
                    : newDraftKind === "follow_up_3"
                      ? 4
                      : 5,
            template_variant: `manual_${newDraftKind}`,
            ab_intro_variant: "human_context_v1",
            ab_trigger_variant: "visible_signal_v1",
            ab_cta_variant: "relevance_question_v1",
            ab_subject_variant: newDraftChannel === "email" ? "operativ_kurz_v1" : "none",
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Draft konnte nicht gespeichert werden.");
      }
      const review = (json?.review || null) as DraftReview | null;
      setNewDraftReview(review);
      setNewDraftReviewStale(false);
      setSuccess(
        review
          ? `Nachrichtendraft gespeichert. ${outboundQualityStatusLabel(review.status)} · ${review.score}/100.`
          : "Nachrichtendraft gespeichert.",
      );
      await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Draft konnte nicht gespeichert werden."));
    } finally {
      setDraftBusy(false);
    }
  }

  async function generateTesterInviteTemplate() {
    if (!selectedProspectId) return;
    setDraftBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/crm/prospects/${selectedProspectId}/invite-template?channel=${encodeURIComponent(newDraftChannel)}`,
        { cache: "no-store" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Template konnte nicht erzeugt werden.");
      }
      setNewDraftSubject(String(json?.template?.subject || "").trim());
      setNewDraftBody(String(json?.template?.body || "").trim());
      const review = (json?.template_review || null) as DraftReview | null;
      setNewDraftReview(review);
      setNewDraftReviewStale(false);
      setSuccess(
        review
          ? `Tester-Einladung übernommen. ${outboundQualityStatusLabel(review.status)} · ${review.score}/100.`
          : "Tester-Einladung übernommen. Du kannst sie jetzt anpassen.",
      );
    } catch (e: any) {
      setError(String(e?.message || "Template konnte nicht erzeugt werden."));
    } finally {
      setDraftBusy(false);
    }
  }

  async function setMessageStatus(messageId: string, status: "sent" | "archived") {
    if (!selectedProspectId) return;
    setSaving(messageId);
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
        throw new Error(json?.details || json?.error || "Nachricht konnte nicht aktualisiert werden.");
      }
      setSuccess(status === "sent" ? "Nachricht als gesendet markiert." : "Nachricht archiviert.");
      await refresh();
      await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Nachricht konnte nicht aktualisiert werden."));
    } finally {
      setSaving(null);
    }
  }

  async function sendMessageNow(messageId: string) {
    setSaving(messageId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/crm/messages/${messageId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: sendProvider,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.details || json?.error || "Versand aus CRM fehlgeschlagen.",
        );
      }
      setSuccess(
        `Nachricht wurde über ${String(json?.tracking?.provider || "E-Mail").toUpperCase()} versendet.`,
      );
      await refresh();
      if (selectedProspectId) await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Versand aus CRM fehlgeschlagen."));
    } finally {
      setSaving(null);
    }
  }

  async function syncReplyTracking() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/tracking/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.details || json?.error || "Tracking-Sync fehlgeschlagen.",
        );
      }
      setSuccess(
        `Tracking-Sync abgeschlossen: ${Number(json?.synced_replies || 0)} neue Antworten erkannt.${
          json?.reply_intents
            ? ` Intent-Mix: ${Object.entries(json.reply_intents)
                .map(([k, v]) => `${k}=${v}`)
                .join(", ")}`
            : ""
        }`,
      );
      await refresh();
      if (selectedProspectId) await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Tracking-Sync fehlgeschlagen."));
    } finally {
      setLoading(false);
    }
  }

  async function syncBounceTracking() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/tracking/bounces/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.details || json?.error || "Bounce-Sync fehlgeschlagen.",
        );
      }
      setSuccess(
        `Bounce-Sync abgeschlossen: ${Number(json?.bounce_detected || 0)} Zustellfehler erkannt.`,
      );
      await refresh();
      if (selectedProspectId) await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Bounce-Sync fehlgeschlagen."));
    } finally {
      setLoading(false);
    }
  }

  async function runBatchEnrichment(force = false) {
    setEnrichingAll(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/enrich/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          force,
          limit: 40,
          stale_days: 21,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Batch-Enrichment fehlgeschlagen.");
      }
      setSuccess(
        `Research-Lauf: ${Number(json?.enriched || 0)} angereichert, ${Number(json?.skipped || 0)} ohne Änderungen, ${Number(json?.failed || 0)} Fehler bei ${Number(json?.selected || 0)} geprüften Prospects.`,
      );
      await refresh();
      if (selectedProspectId) await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Batch-Enrichment fehlgeschlagen."));
    } finally {
      setEnrichingAll(false);
    }
  }

  async function recomputeSequenceExperiments() {
    setRecomputingExperiments(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/sequences/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          min_samples: 10,
          lookback_days: 120,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Experiment-Rollout konnte nicht berechnet werden.");
      }
      setSuccess(
        `Experiment-Update: ${Array.isArray(json?.winners) ? json.winners.length : 0} Winner-Rollouts aktiv.`,
      );
      await loadPerformance();
    } catch (e: any) {
      setError(String(e?.message || "Experiment-Rollout konnte nicht berechnet werden."));
    } finally {
      setRecomputingExperiments(false);
    }
  }

  async function recomputeLearningSnapshotNow() {
    setLearningLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lookback_days: 120,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as LearningSnapshotResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Learning-Snapshot konnte nicht berechnet werden.");
      }
      setLearningSnapshot(json.snapshot || null);
      setSuccess("Learning-Snapshot neu berechnet.");
    } catch (e: any) {
      setError(String(e?.message || "Learning-Snapshot konnte nicht berechnet werden."));
    } finally {
      setLearningLoading(false);
    }
  }

  async function saveAutomationSettings(args: {
    sequence_automation_enabled?: boolean;
    enrichment_automation_enabled?: boolean;
    reason?: string | null;
    successMessage: string;
  }) {
    setAutomationBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/settings/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequence_automation_enabled: args.sequence_automation_enabled,
          enrichment_automation_enabled: args.enrichment_automation_enabled,
          reason: args.reason,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "CRM-Automation konnte nicht gespeichert werden.");
      }
      setData((prev) => ({
        ...prev,
        automation: json.settings as CrmAutomationSettings,
      }));
      setSuccess(args.successMessage);
    } catch (e: any) {
      setError(String(e?.message || "CRM-Automation konnte nicht gespeichert werden."));
    } finally {
      setAutomationBusy(false);
    }
  }

  async function runSequence(onlyProspectId?: string, overridePause = false) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/crm/sequences/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          only_prospect_id: onlyProspectId || null,
          dry_run: false,
          override_pause: overridePause,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.details || json?.error || "Sequenzlauf fehlgeschlagen.",
        );
      }
      const actionRows = Array.isArray(json?.actions) ? (json.actions as any[]) : [];
      const hardStops = actionRows.filter((row) =>
        String(row?.result || "").startsWith("stop_rule_"),
      ).length;
      const guardrailBlocks = actionRows.filter(
        (row) => String(row?.result || "") === "guardrail_blocked",
      ).length;
      const timingWaits = actionRows.filter(
        (row) => String(row?.result || "") === "timing_window_wait",
      ).length;
      setSuccess(
        `Sequenzlauf fertig: ${Number(json?.created || 0)} Drafts erstellt, ${Number(json?.skipped_existing || 0)} bereits vorhanden, ${hardStops} per Stop-Regel pausiert, ${guardrailBlocks} durch First-Touch-Guardrails blockiert, ${timingWaits} ins bessere Zeitfenster verschoben${overridePause ? ", manuell uebersteuert" : ""}.`,
      );
      await refresh();
      if (selectedProspectId) await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Sequenzlauf fehlgeschlagen."));
    } finally {
      setLoading(false);
    }
  }

  async function runProspectEnrichment(
    prospectId: string,
    opts?: {
      force?: boolean;
      expectContactChannel?: boolean;
    },
  ) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSelectedProspectId(prospectId);
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          force: Boolean(opts?.force),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Enrichment fehlgeschlagen.");
      }

      const pageCount = Array.isArray(json?.pages_crawled) ? json.pages_crawled.length : 0;
      const secondaryCount = Array.isArray(json?.secondary_sources_crawled)
        ? json.secondary_sources_crawled.length
        : 0;
      const researchSuffix = json?.research?.status
        ? ` ${researchStatusLabel(json.research.status)} · ${Number(json?.research?.score || 0)}/100.`
        : "";
      const contactSuffix =
        opts?.expectContactChannel && !json?.applied_updates?.contact_email && !json?.applied_updates?.linkedin_url
          ? " Kein neuer Kontaktkanal gefunden, Prospect ist jetzt für manuelle Ergänzung geöffnet."
          : "";
      const changeSuffix =
        Number(json?.change_summary?.count || 0) > 0
          ? ` ${String(json?.change_summary?.summary || "").trim()}`
          : "";

      setSuccess(
        `Research-Crawl fertig: ${pageCount} Seiten geprüft${secondaryCount > 0 ? `, ${secondaryCount} Zweitquellen verifiziert` : ""}.${researchSuffix}${contactSuffix}${changeSuffix}`,
      );
      await refresh();
      await loadProspectDetail(prospectId);
    } catch (e: any) {
      setError(String(e?.message || "Enrichment fehlgeschlagen."));
    } finally {
      setLoading(false);
    }
  }

  async function runContactRepair(
    prospectId: string,
    triggerType: "missing_contact" | "bounce" | "wrong_contact" | "manual" = "manual",
    opts?: {
      contactCandidateId?: string | null;
      messageId?: string | null;
    },
  ) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSelectedProspectId(prospectId);
    try {
      const res = await fetch(`/api/crm/prospects/${prospectId}/contact-repair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger_type: triggerType,
          contact_candidate_id: opts?.contactCandidateId || null,
          message_id: opts?.messageId || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as ContactRepairResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Kontakt-Reparatur fehlgeschlagen.");
      }

      const invalidatedPrefix = json?.invalidated_contact?.channel_value
        ? `Vorheriger Pfad verworfen: ${json.invalidated_contact.channel_value}. `
        : "";
      setSuccess(`${invalidatedPrefix}${json.summary}`);
      await refresh();
      await loadProspectDetail(prospectId);
      return json;
    } catch (e: any) {
      setError(String(e?.message || "Kontakt-Reparatur fehlgeschlagen."));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function applyNextBestAction() {
    if (!nextAction) return;
    const code = String(nextAction.recommended_code || "");
    const prospectId = String(nextAction.prospect_id || "");

    if (code.startsWith("send_")) {
      await runSequence(prospectId);
      return;
    }

    if (
      prospectId &&
      (code === "enrich_research_before_outreach" ||
        code === "refresh_research_before_outreach")
    ) {
      await runProspectEnrichment(prospectId, { force: code === "refresh_research_before_outreach" });
      return;
    }

    if (prospectId && code === "fill_contact_channel") {
      const repair = await runContactRepair(prospectId, "missing_contact");
      if (!repair || repair.status === "no_candidate") {
        await runProspectEnrichment(prospectId, {
          force: true,
          expectContactChannel: true,
        });
        await runContactRepair(prospectId, "missing_contact");
      }
      return;
    }

    if (prospectId) {
      setSelectedProspectId(prospectId);
    }

    if (code === "handle_reply_now") {
      setReplyPendingOnly(true);
      setSuccess("Prospect geöffnet. Reply-Inbox und Verlauf unten prüfen und Antwort bearbeiten.");
      return;
    }

    if (code === "invite_pilot_after_reply") {
      await logEvent(prospectId, "pilot_invited", "Pilot eingeladen");
      return;
    }

    if (code === "schedule_pilot_call") {
      await logEvent(prospectId, "call_booked", "Pilot-Call terminiert");
      return;
    }

    if (code === "switch_channel_after_bounce") {
      await runContactRepair(prospectId, "bounce");
      return;
    }

    if (code === "review_ready_draft") {
      setSuccess("Prospect geöffnet. Vorliegenden Entwurf unten prüfen und bei Bedarf direkt senden.");
      return;
    }

    setSuccess("Prospect geöffnet. Bitte nächsten Schritt manuell umsetzen.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">CRM · Tester-Akquise</h1>
            <p className="mt-1 text-sm text-gray-600">
              Persönliche Pilotansprache ohne Kaufdruck. Nur Owner-Zugriff aktiv.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/crm/sales-intel"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Sales Intel Lab
            </Link>
            <button
              onClick={() => void refresh()}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Aktualisiere…" : "Aktualisieren"}
            </button>
            <button
              onClick={() => void runSequence()}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              disabled={loading || !automation.sequence_automation_enabled}
            >
              Sequenz ausführen
            </button>
            <button
              onClick={() => void syncReplyTracking()}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 disabled:opacity-60"
              disabled={loading}
            >
              Antworten syncen
            </button>
            <button
              onClick={() => void syncBounceTracking()}
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-60"
              disabled={loading}
            >
              Bounces prüfen
            </button>
            <button
              onClick={() => void runBatchEnrichment(false)}
              className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-800 hover:bg-violet-100 disabled:opacity-60"
              disabled={enrichingAll}
            >
              {enrichingAll ? "Enrichment läuft…" : "Prospects anreichern"}
            </button>
            <button
              onClick={() => void recomputeSequenceExperiments()}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
              disabled={recomputingExperiments}
            >
              {recomputingExperiments ? "Berechne…" : "A/B Winner berechnen"}
            </button>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">CRM-Automation</div>
              <div className="mt-1 text-xs text-gray-600">
                Sequenzlauf und Nightly-Enrichment lassen sich hier hart pausieren, ohne manuelle Arbeit zu blockieren.
              </div>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${crmAutomationBadgeClass(allCrmAutomationActive)}`}
            >
              {crmAutomationStatusLabel}
            </span>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span
                  className={`inline-flex rounded-full px-2 py-1 ring-1 ${crmAutomationBadgeClass(automation.sequence_automation_enabled)}`}
                >
                  Sequenz {automation.sequence_automation_enabled ? "aktiv" : "pausiert"}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-1 ring-1 ${crmAutomationBadgeClass(automation.enrichment_automation_enabled)}`}
                >
                  Nightly-Enrichment {automation.enrichment_automation_enabled ? "aktiv" : "pausiert"}
                </span>
                {automation.updated_at ? <span>Letzte Aenderung: {formatDate(automation.updated_at)}</span> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  className="min-w-[240px] flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  placeholder="Pause-Grund oder Betriebsnotiz"
                  value={automationNote}
                  onChange={(e) => setAutomationNote(e.target.value)}
                />
                <button
                  onClick={() =>
                    void saveAutomationSettings({
                      reason: automationNote,
                      successMessage: "CRM-Automationsnotiz gespeichert.",
                    })
                  }
                  disabled={automationBusy}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  {automationBusy ? "Speichere…" : "Notiz speichern"}
                </button>
              </div>
              {automation.reason ? (
                <div className="mt-2 text-xs text-gray-600">Aktuelle Notiz: {automation.reason}</div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <button
                onClick={() =>
                  void saveAutomationSettings({
                    sequence_automation_enabled: !automation.sequence_automation_enabled,
                    reason: automationNote,
                    successMessage: automation.sequence_automation_enabled
                      ? "Sequenz-Automation pausiert."
                      : "Sequenz-Automation fortgesetzt.",
                  })
                }
                disabled={automationBusy}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {automation.sequence_automation_enabled ? "Sequenz pausieren" : "Sequenz fortsetzen"}
              </button>
              <button
                onClick={() =>
                  void saveAutomationSettings({
                    enrichment_automation_enabled: !automation.enrichment_automation_enabled,
                    reason: automationNote,
                    successMessage: automation.enrichment_automation_enabled
                      ? "Nightly-Enrichment pausiert."
                      : "Nightly-Enrichment fortgesetzt.",
                  })
                }
                disabled={automationBusy}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {automation.enrichment_automation_enabled ? "Nightly pausieren" : "Nightly fortsetzen"}
              </button>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              {!allCrmAutomationActive ? (
                <button
                  onClick={() =>
                    void saveAutomationSettings({
                      sequence_automation_enabled: true,
                      enrichment_automation_enabled: true,
                      reason: automationNote,
                      successMessage: "CRM-Automation vollstaendig fortgesetzt.",
                    })
                  }
                  disabled={automationBusy}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                >
                  Alles fortsetzen
                </button>
              ) : null}
              {!automation.sequence_automation_enabled ? (
                <button
                  onClick={() => void runSequence(undefined, true)}
                  disabled={loading}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                >
                  Sequenz einmalig uebersteuern
                </button>
              ) : null}
            </div>
          </div>
        </div>
        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Prospects gesamt</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{data.summary?.prospects_total || 0}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Antwortquote</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{conversionRates.reply}%</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Pilot aktiv</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{data.summary?.pilot_active_total || 0}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Gewonnen</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{data.summary?.won_total || 0}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="text-xs font-medium text-emerald-700">Ready jetzt</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-900">{readinessHotCount}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Learning Loop</h2>
            <p className="mt-1 text-sm text-gray-600">
              Verdichtet Outcomes, Qualitätsreviews und manuelles Feedback zu echten Kanal- und Varianten-Signalen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
              {learningSnapshot?.computed_at ? `Stand: ${formatDate(learningSnapshot.computed_at)}` : "Noch kein Snapshot"}
            </div>
            <button
              onClick={() => void recomputeLearningSnapshotNow()}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              disabled={learningLoading}
            >
              {learningLoading ? "Berechne…" : "Learning neu berechnen"}
            </button>
          </div>
        </div>

        {!learningSnapshot ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
            {learningLoading
              ? "Learning-Snapshot wird geladen…"
              : "Noch kein Learning-Snapshot vorhanden. Einmal berechnen, dann fließen die Signale in die Strategie zurück."}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-8">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Outcome-Basis</div>
              <div className="mt-2 text-sm text-gray-900">
                {learningSnapshot.summary.outbound_attempts} Touches · {Math.round(learningSnapshot.summary.positive_rate * 100)}% positiv
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Negativrate {Math.round(learningSnapshot.summary.negative_rate * 100)}% · Wrong Contact {learningSnapshot.summary.wrong_contact_count}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Operator-Feedback</div>
              <div className="mt-2 text-sm text-gray-900">
                Kandidaten-Akzeptanz {Math.round(learningSnapshot.summary.candidate_accept_rate * 100)}%
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Draft ok {Math.round(learningSnapshot.summary.draft_approve_rate * 100)}% · Rework {Math.round(learningSnapshot.summary.draft_needs_work_rate * 100)}%
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">QA-Passrate</div>
              <div className="mt-2 text-sm text-gray-900">
                {Math.round(learningSnapshot.summary.quality_pass_rate * 100)}% ohne direkten Rework-Bedarf
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Lookback {learningSnapshot.lookback_days} Tage
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Send-Eval</div>
              <div className="mt-2 text-sm text-gray-900">
                Reply {Math.round(learningSnapshot.summary.reply_rate * 100)}% · Positiv {Math.round(learningSnapshot.summary.positive_reply_rate * 100)}%
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Pilot {Math.round(learningSnapshot.summary.pilot_rate * 100)}% · Bounce {Math.round(learningSnapshot.summary.bounce_rate * 100)}%
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Timing-Disziplin</div>
              <div className="mt-2 text-sm text-gray-900">
                Override {Math.round(learningSnapshot.summary.manual_override_rate * 100)}%
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Ø erste Reaktion {learningSnapshot.summary.avg_response_hours === null ? "–" : `${learningSnapshot.summary.avg_response_hours}h`}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Top-Kanal</div>
              <div className="mt-2 text-sm text-gray-900">
                {learningSnapshot.insights.channel_biases[0]?.channel || "–"}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {learningSnapshot.insights.channel_biases[0]
                  ? `Bias ${learningSnapshot.insights.channel_biases[0].score_adjustment >= 0 ? "+" : ""}${learningSnapshot.insights.channel_biases[0].score_adjustment}`
                  : "Noch keine belastbare Präferenz"}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Top-Discovery</div>
              <div className="mt-2 text-sm text-gray-900">
                {learningSnapshot.insights.discovery_biases[0]
                  ? `${learningSnapshot.insights.discovery_biases[0].city} · ${learningSnapshot.insights.discovery_biases[0].query_pattern}`
                  : "–"}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {learningSnapshot.insights.discovery_biases[0]
                  ? `Bias ${learningSnapshot.insights.discovery_biases[0].score_adjustment >= 0 ? "+" : ""}${learningSnapshot.insights.discovery_biases[0].score_adjustment}`
                  : "Noch keine Discovery-Learnings"}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Top-Postmortem</div>
              <div className="mt-2 text-sm text-gray-900">
                {learningSnapshot.insights.failure_postmortems[0]?.label || "–"}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {learningSnapshot.insights.failure_postmortems[0]
                  ? `${Math.round(learningSnapshot.insights.failure_postmortems[0].share * 100)}% der negativen Outcomes`
                  : "Noch keine belastbaren Fehlermuster"}
              </div>
            </div>
          </div>
        )}

        {learningSnapshot ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-7">
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-900">Kanal-Bias</div>
              <div className="mt-3 space-y-2">
                {learningSnapshot.insights.channel_biases.slice(0, 4).map((item) => (
                  <div key={`channel-${item.channel}`} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="text-sm text-gray-900">
                      {item.channel} · Bias {item.score_adjustment >= 0 ? "+" : ""}{item.score_adjustment}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {item.reason} · Samples {item.sample_size}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-900">Segment-Signale</div>
              <div className="mt-3 space-y-2">
                {learningSnapshot.insights.segment_channel_biases.slice(0, 4).map((item) => (
                  <div key={`segment-${item.segment_key}-${item.channel}`} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="text-sm text-gray-900">
                      {item.segment_key} → {item.channel}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Bias {item.score_adjustment >= 0 ? "+" : ""}{item.score_adjustment} · {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-900">Varianten-Bias</div>
              <div className="mt-3 space-y-2">
                {learningSnapshot.insights.variant_biases.slice(0, 4).map((item) => (
                  <div key={`${item.message_kind}-${item.variant}`} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="text-sm text-gray-900">
                      {item.message_kind} → {item.variant}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Bias {item.score_adjustment >= 0 ? "+" : ""}{item.score_adjustment} · {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-900">Discovery-Bias</div>
              <div className="mt-3 space-y-2">
                {learningSnapshot.insights.discovery_biases.slice(0, 4).map((item) => (
                  <div
                    key={`discovery-${item.city}-${item.discovery_source}-${item.query_pattern}`}
                    className="rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <div className="text-sm text-gray-900">
                      {item.city} · {item.query_pattern}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Bias {item.score_adjustment >= 0 ? "+" : ""}{item.score_adjustment} · {item.reason}
                    </div>
                  </div>
                ))}
                {learningSnapshot.insights.discovery_biases.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    Noch keine belastbaren Discovery-Signale vorhanden.
                  </div>
                ) : null}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-900">Timing-Slots</div>
              <div className="mt-3 space-y-2">
                {learningSnapshot.insights.timing_biases.slice(0, 4).map((item) => (
                  <div key={`${item.channel}-${item.weekday}-${item.hour_bucket}`} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="text-sm text-gray-900">
                      {item.channel} · {item.weekday} · {item.hour_bucket}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Bias {item.score_adjustment >= 0 ? "+" : ""}{item.score_adjustment} · {item.reason}
                    </div>
                  </div>
                ))}
                {learningSnapshot.insights.timing_biases.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    Noch keine belastbaren Timing-Signale vorhanden.
                  </div>
                ) : null}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-900">Qualitäts-Hotspots</div>
              <div className="mt-3 space-y-2">
                {learningSnapshot.insights.quality_hotspots.slice(0, 4).map((item) => (
                  <div key={`${item.type}-${item.label}`} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="text-sm text-gray-900">
                      {item.type === "blocker" ? "Blocker" : "Warnung"} · {item.count}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-sm font-medium text-gray-900">Failure-Postmortems</div>
              <div className="mt-3 space-y-2">
                {learningSnapshot.insights.failure_postmortems.slice(0, 4).map((item) => (
                  <div key={item.code} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="text-sm text-gray-900">
                      {item.label} · {item.count}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {Math.round(item.share * 100)}% · {item.reason}
                    </div>
                  </div>
                ))}
                {learningSnapshot.insights.failure_postmortems.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    Noch keine negativen Outcomes mit belastbarer Root-Cause-Zuordnung vorhanden.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Performance-Layer</h2>
            <p className="mt-1 text-sm text-gray-600">
              Kanal- und Variantenvergleich für Antwortquote, Pilotquote und Reaktionszeit.
            </p>
          </div>
          <button
            onClick={() => void loadPerformance()}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={performanceLoading}
          >
            {performanceLoading ? "Aktualisiere…" : "Performance aktualisieren"}
          </button>
        </div>
        {!performance || performance.channel_metrics.length === 0 ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
            Noch keine belastbaren Daten. Sende zuerst Nachrichten, damit Kanal- und Variantenvergleich sichtbar wird.
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-3 py-2">Kanal</th>
                    <th className="px-3 py-2">Sent</th>
                    <th className="px-3 py-2">Reply %</th>
                    <th className="px-3 py-2">Pilot %</th>
                    <th className="px-3 py-2">Won %</th>
                    <th className="px-3 py-2">Fail %</th>
                    <th className="px-3 py-2">Ø h bis Reply</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.channel_metrics.map((row) => (
                    <tr key={row.channel} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-900">{row.channel}</td>
                      <td className="px-3 py-2 text-gray-700">{row.sent_messages}</td>
                      <td className="px-3 py-2 text-gray-700">{row.reply_rate_pct}%</td>
                      <td className="px-3 py-2 text-gray-700">{row.pilot_rate_pct}%</td>
                      <td className="px-3 py-2 text-gray-700">{row.won_rate_pct ?? 0}%</td>
                      <td className="px-3 py-2 text-gray-700">{row.failure_rate_pct ?? 0}%</td>
                      <td className="px-3 py-2 text-gray-700">
                        {row.avg_response_hours === null ? "–" : `${row.avg_response_hours}h`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500">
                      <th className="px-3 py-2">Variante</th>
                      <th className="px-3 py-2">Kanal</th>
                      <th className="px-3 py-2">Sent</th>
                      <th className="px-3 py-2">Reply %</th>
                      <th className="px-3 py-2">Pilot %</th>
                      <th className="px-3 py-2">Won %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.template_metrics.slice(0, 12).map((row) => (
                      <tr key={`${row.channel}-${row.template_variant}`} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-900">{row.template_variant}</td>
                        <td className="px-3 py-2 text-gray-700">{row.channel}</td>
                        <td className="px-3 py-2 text-gray-700">{row.sent_messages}</td>
                        <td className="px-3 py-2 text-gray-700">{row.reply_rate_pct}%</td>
                        <td className="px-3 py-2 text-gray-700">{row.pilot_rate_pct}%</td>
                        <td className="px-3 py-2 text-gray-700">{row.won_rate_pct ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500">
                      <th className="px-3 py-2">Segment</th>
                      <th className="px-3 py-2">Variante</th>
                      <th className="px-3 py-2">Sent</th>
                      <th className="px-3 py-2">Reply %</th>
                      <th className="px-3 py-2">Won %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(performance.variant_segment_metrics || []).slice(0, 12).map((row) => (
                      <tr
                        key={`${row.segment_key}-${row.channel}-${row.template_variant}`}
                        className="border-t border-gray-100"
                      >
                        <td className="px-3 py-2 text-gray-700">{row.segment_key}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{row.template_variant}</td>
                        <td className="px-3 py-2 text-gray-700">{row.sent_messages}</td>
                        <td className="px-3 py-2 text-gray-700">{row.reply_rate_pct}%</td>
                        <td className="px-3 py-2 text-gray-700">{row.won_rate_pct ?? 0}%</td>
                      </tr>
                    ))}
                    {(!performance.variant_segment_metrics ||
                      performance.variant_segment_metrics.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-xs text-gray-500">
                          Noch keine segmentierten Variantendaten verfügbar.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <h3 className="text-sm font-semibold text-gray-900">A/B Winner-Rollouts</h3>
                {performance.sequence_rollouts && performance.sequence_rollouts.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {performance.sequence_rollouts.map((rollout) => (
                      <div key={`${rollout.message_kind}-${rollout.winner_variant}`} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs">
                        <div className="font-medium text-gray-900">
                          {rollout.message_kind} → {rollout.winner_variant}
                        </div>
                        <div className="mt-1 text-gray-600">
                          Confidence {Math.round((rollout.confidence || 0) * 100)}% · Samples {rollout.sample_size}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-600">
                    Noch kein stabiler Winner. „A/B Winner berechnen“ nach mehr Versanddaten ausführen.
                  </div>
                )}
              </div>
            </div>
            {performance.deliverability_correlation && performance.deliverability_correlation.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500">
                      <th className="px-3 py-2">Deliverability-Korrelation</th>
                      <th className="px-3 py-2">Fail %</th>
                      <th className="px-3 py-2">Bounces</th>
                      <th className="px-3 py-2">Opt-outs</th>
                      <th className="px-3 py-2">Risk</th>
                      <th className="px-3 py-2">Empfehlung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.deliverability_correlation.map((row) => (
                      <tr key={`d-${row.channel}`} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-900">{row.channel}</td>
                        <td className="px-3 py-2 text-gray-700">{row.failure_rate_pct}%</td>
                        <td className="px-3 py-2 text-gray-700">{row.bounce_events}</td>
                        <td className="px-3 py-2 text-gray-700">{row.opt_out_events}</td>
                        <td className="px-3 py-2 text-gray-700">{row.risk_level}</td>
                        <td className="px-3 py-2 text-gray-700">{row.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {performance.revenue_attribution ? (
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Close-Loop Attribution</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {performance.revenue_attribution.won_total}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">Gewonnene Prospects mit First-Touch-Zuordnung</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 xl:col-span-2">
                  <div className="text-xs font-medium text-gray-500">Top-Channel nach Won-Rate</div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {performance.revenue_attribution.by_channel.slice(0, 4).map((row) => (
                      <div key={`rev-ch-${row.channel}`} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs">
                        <div className="font-medium text-gray-900">{row.channel}</div>
                        <div className="mt-1 text-gray-600">
                          Won {row.won_rate_pct}% · Pilot {row.pilot_rate_pct}% · Reply {row.reply_rate_pct}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nächste beste Aktion</h2>
            <p className="mt-1 text-sm text-gray-600">
              Eine klare Empfehlung mit Grund, damit du nicht zwischen Tabellen springen musst.
            </p>
          </div>
          {nextAction?.recommended_primary_label ? (
            <button
              onClick={() => void applyNextBestAction()}
              className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
              disabled={loading}
            >
              {nextAction.recommended_primary_label}
            </button>
          ) : null}
        </div>
        {nextAction ? (
          <div className="mt-4 grid gap-3 md:grid-cols-12">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 md:col-span-4">
              <div className="text-xs text-gray-500">Prospect</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {nextAction.company_name}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {nextAction.contact_name || "Kein Name"} · {nextAction.contact_email || "keine E-Mail"} ·{" "}
                {nextAction.object_focus || "gemischt"}
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 md:col-span-4">
              <div className="text-xs text-blue-700">Empfehlung</div>
              <div className="mt-1 text-sm font-semibold text-blue-900">
                {nextAction.recommended_action || "–"}
              </div>
              <div className="mt-1 text-xs text-blue-700">
                Fällig: {formatDate(nextAction.recommended_at)}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 md:col-span-4">
              <div className="text-xs text-emerald-700">Priorisierung</div>
              <div className="mt-1 text-sm font-semibold text-emerald-900">
                Score {Number(nextAction.recommended_score || 0)} / 100
              </div>
              <div className="mt-1 text-xs text-emerald-800">
                Readiness {Number(nextAction.readiness_score || 0)} / 100
              </div>
              {nextAction.research ? (
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ring-1 ${researchBadgeClass(
                      nextAction.research.status,
                    )}`}
                  >
                    {researchStatusLabel(nextAction.research.status)} · {nextAction.research.score}/100
                  </span>
                  <div className="mt-1 text-[11px] text-emerald-900">
                    {nextAction.research.summary}
                  </div>
                </div>
              ) : null}
              {nextAction.guardrails ? (
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  {nextAction.guardrails.open_reply ? (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700">
                      Offene Reply
                    </span>
                  ) : null}
                  {nextAction.guardrails.recent_bounce ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
                      Neuer Bounce
                    </span>
                  ) : null}
                  {nextAction.guardrails.has_ready_draft ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      Draft bereit
                    </span>
                  ) : null}
                  {nextAction.guardrails.hard_stop ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700">
                      Stop-Regel
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 md:col-span-12">
              <div className="text-xs text-amber-700">Warum</div>
              <div className="mt-1 text-sm text-amber-900">
                {nextAction.recommended_reason || "Kein zusätzlicher Grund verfügbar."}
              </div>
              {Array.isArray(nextAction.score_breakdown) && nextAction.score_breakdown.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-900">
                  {nextAction.score_breakdown.slice(0, 4).map((row, idx) => (
                    <li key={`${row.label}_${idx}`}>
                      {row.impact >= 0 ? "+" : ""}
                      {row.impact} {row.label}: {row.detail}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
            Aktuell keine offene Empfehlung. Sequenz und Tracking laufen stabil.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Antwort-Inbox mit Intent</h2>
            <p className="mt-1 text-sm text-gray-600">
              Neue Replies werden hier mit Intent-Label priorisiert, damit du sofort die richtigen Fälle bearbeitest.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              value={replyIntentFilter}
              onChange={(e) => setReplyIntentFilter(e.target.value)}
            >
              <option value="all">Alle Intents</option>
              <option value="interesse">Interesse</option>
              <option value="objection">Einwand</option>
              <option value="nicht_jetzt">Nicht jetzt</option>
              <option value="opt_out">Opt-out</option>
              <option value="falscher_kontakt">Falscher Kontakt</option>
              <option value="neutral">Neutral</option>
            </select>
            <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={replyPendingOnly}
                onChange={(e) => setReplyPendingOnly(e.target.checked)}
              />
              Nur offen
            </label>
            <button
              onClick={() => void loadReplyInbox()}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
              disabled={replyInboxLoading}
            >
              {replyInboxLoading ? "Lade…" : "Inbox aktualisieren"}
            </button>
          </div>
        </div>
        {!replyInbox ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
            Noch keine Reply-Inbox-Daten verfügbar. Klicke auf „Antworten syncen“ und lade diese Ansicht neu.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="text-xs text-gray-500">Replies gesamt</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {replyInbox.summary?.total || 0}
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <div className="text-xs text-amber-700">Offen</div>
                <div className="mt-1 text-xl font-semibold text-amber-900">
                  {replyInbox.summary?.pending || 0}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="text-xs text-emerald-700">Interesse</div>
                <div className="mt-1 text-xl font-semibold text-emerald-900">
                  {replyInbox.summary?.by_intent?.interesse || 0}
                </div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                <div className="text-xs text-rose-700">Opt-out/Falscher Kontakt</div>
                <div className="mt-1 text-xl font-semibold text-rose-900">
                  {(replyInbox.summary?.by_intent?.opt_out || 0) +
                    (replyInbox.summary?.by_intent?.falscher_kontakt || 0)}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-3 py-2">Prospect</th>
                    <th className="px-3 py-2">Intent</th>
                    <th className="px-3 py-2">Empfehlung</th>
                    <th className="px-3 py-2">Kontext</th>
                    <th className="px-3 py-2">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {replyInbox.items.map((item) => (
                    <tr key={item.event_id} className="border-t border-gray-100 align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{item.company_name}</div>
                        <div className="text-xs text-gray-500">
                          {item.contact_name || "Kein Name"} · {item.contact_email || "keine E-Mail"} ·{" "}
                          {item.city || "kein Ort"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Reply: {formatDate(item.event_at)} · Stage: {STAGE_LABELS[item.stage] || item.stage}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs ring-1 ${replyIntentBadgeClass(item.reply_intent)}`}
                        >
                          {REPLY_INTENT_LABELS[item.reply_intent] || item.reply_intent}
                        </span>
                        <div className="mt-1 text-xs text-gray-500">
                          {(item.reply_intent_confidence ?? 0) > 0
                            ? `Confidence ${Math.round((item.reply_intent_confidence || 0) * 100)}%`
                            : "Confidence n/a"}
                        </div>
                        {item.reply_signal ? (
                          <div className="mt-1 text-xs text-gray-500">
                            {REPLY_SIGNAL_LABELS[item.reply_signal] || item.reply_signal}
                            {item.reply_strength ? ` · ${item.reply_strength}` : ""}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <div>{item.recommendation || "Keine Empfehlung vorhanden."}</div>
                        {item.reply_intent_reason ? (
                          <div className="mt-1 text-xs text-gray-500">{item.reply_intent_reason}</div>
                        ) : null}
                        {item.contact_hint ? (
                          <div className="mt-1 text-xs text-gray-500">Kontakt-Hinweis: {item.contact_hint}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        <div>Kanal: {item.channel}</div>
                        <div>Variante: {item.template_variant}</div>
                        <div>
                          Reaktionszeit:{" "}
                          {item.response_time_hours === null ? "–" : `${item.response_time_hours}h`}
                        </div>
                        {item.timeline_hint_days !== null && item.timeline_hint_days !== undefined ? (
                          <div>Wiedervorlage: ca. {item.timeline_hint_days} Tage</div>
                        ) : null}
                        {Array.isArray(item.objection_topics) && item.objection_topics.length > 0 ? (
                          <div>Themen: {item.objection_topics.join(", ")}</div>
                        ) : null}
                        {item.stop_automation ? <div>Sequenz stoppen: Ja</div> : null}
                        <div>Offen: {item.handled ? "Nein" : "Ja"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProspectId(item.prospect_id);
                              setPipelineQuery(item.company_name);
                              setSuccess(`Prospect ${item.company_name} im Fokus geöffnet.`);
                            }}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                          >
                            Öffnen
                          </button>
                          <button
                            onClick={() => void updateStage(item.prospect_id, "replied")}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                          >
                            Als bearbeitet
                          </button>
                          {item.contact_resolution_needed ? (
                            <button
                              onClick={() => void runContactRepair(item.prospect_id, "wrong_contact")}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 hover:bg-amber-100"
                            >
                              Kontakt reparieren
                            </button>
                          ) : null}
                          {item.reply_intent === "interesse" ? (
                            <button
                              onClick={() => void logEvent(item.prospect_id, "pilot_invited", "Pilot eingeladen")}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
                            >
                              Pilot einladen
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {replyInbox.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-sm text-gray-500">
                        Keine Replies für diesen Filter. „Antworten syncen“ ausführen oder Filter erweitern.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Öffentlicher Chatbot-Verlauf</h2>
            <p className="mt-1 text-sm text-gray-600">
              Letzte Interaktionen aus dem Website-Widget (Analytics-Tracking mit Einwilligung).
            </p>
          </div>
          <button
            onClick={() => void loadPublicChatLogs()}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={publicChatLogsLoading}
          >
            {publicChatLogsLoading ? "Lade…" : "Chatbot-Logs aktualisieren"}
          </button>
        </div>
        {!publicChatLogs ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
            Noch keine Chatbot-Logs geladen.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="text-xs text-gray-500">Events geladen</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {publicChatLogs.total || 0}
                </div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
                <div className="text-xs text-blue-700">Nachrichten</div>
                <div className="mt-1 text-xl font-semibold text-blue-900">
                  {publicChatLogs.logs.filter((row) => row.event === "marketing_chat_message_send").length}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="text-xs text-emerald-700">Antworten</div>
                <div className="mt-1 text-xl font-semibold text-emerald-900">
                  {publicChatLogs.logs.filter((row) => row.event === "marketing_chat_message_response").length}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-3 py-2">Zeit</th>
                    <th className="px-3 py-2">Event</th>
                    <th className="px-3 py-2">Pfad</th>
                    <th className="px-3 py-2">Session</th>
                    <th className="px-3 py-2">Inhalt</th>
                  </tr>
                </thead>
                <tbody>
                  {publicChatLogs.logs.slice(0, 60).map((row) => (
                    <tr key={row.id} className="border-t border-gray-100 align-top">
                      <td className="px-3 py-2 text-xs text-gray-600">{formatDate(row.created_at)}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{row.event}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{row.path || "–"}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{row.session_id || row.visitor_id || "–"}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">
                        {row.message_preview ? (
                          <div>
                            <span className="font-medium text-gray-900">User:</span> {row.message_preview}
                          </div>
                        ) : null}
                        {row.answer_preview ? (
                          <div className="mt-1">
                            <span className="font-medium text-gray-900">Bot:</span> {row.answer_preview}
                          </div>
                        ) : null}
                        {!row.message_preview && !row.answer_preview ? "Kein Vorschautext im Event." : null}
                      </td>
                    </tr>
                  ))}
                  {publicChatLogs.logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-sm text-gray-500">
                        Noch keine Public-Chat-Events vorhanden.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Prospect manuell anlegen</h2>
          <p className="mt-1 text-sm text-gray-600">
            Fokus auf persönliche Relevanz: valide Quellen, Angebotsmix, Objection und Hook sauber eintragen.
          </p>
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-sky-900">Neue Kandidaten automatisch finden</div>
                <p className="mt-1 text-xs text-sky-800">
                  Sucht nach Makler-Websites pro Stadt, filtert Portale raus und legt nur reviewbare Kandidaten an, bevor sie in die echte Prospect-Pipeline kommen.
                </p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs text-sky-700">
                pro Stadt max. {discoveryPerCityLimit}
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
              <input
                className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm"
                placeholder="Städte, kommagetrennt (z. B. Berlin, Hamburg, München)"
                value={discoveryCitiesInput}
                onChange={(e) => setDiscoveryCitiesInput(e.target.value)}
              />
              <input
                className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm"
                type="number"
                min={1}
                max={5}
                value={discoveryPerCityLimit}
                onChange={(e) =>
                  setDiscoveryPerCityLimit(
                    Math.max(1, Math.min(5, Number(e.target.value || 3) || 3)),
                  )
                }
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => void runProspectDiscovery()}
                className="rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm text-sky-900 hover:bg-sky-100 disabled:opacity-60"
                disabled={discoveringProspects}
              >
                {discoveringProspects ? "Suche läuft…" : "Städte scannen"}
              </button>
              <button
                onClick={() => void runProspectDiscovery({ preset: "top_cities" })}
                className="rounded-xl border border-sky-300 bg-sky-900 px-3 py-2 text-sm text-white hover:bg-sky-950 disabled:opacity-60"
                disabled={discoveringProspects}
              >
                {discoveringProspects ? "Suche läuft…" : "Top-Städte scannen"}
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Firmenname *"
              value={form.company_name}
              onChange={(e) => setForm((s) => ({ ...s, company_name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Ansprechpartner"
                value={form.contact_name}
                onChange={(e) => setForm((s) => ({ ...s, contact_name: e.target.value }))}
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Kontakt-E-Mail"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((s) => ({ ...s, contact_email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Rolle (z. B. Inhaber)"
                value={form.contact_role}
                onChange={(e) => setForm((s) => ({ ...s, contact_role: e.target.value }))}
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Stadt"
                value={form.city}
                onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Region/Bundesland"
                value={form.region}
                onChange={(e) => setForm((s) => ({ ...s, region: e.target.value }))}
              />
            </div>
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Website-URL (https://...)"
              value={form.website_url}
              onChange={(e) => setForm((s) => ({ ...s, website_url: e.target.value }))}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Quell-URL (Portal/Website)"
                value={form.source_url}
                onChange={(e) => setForm((s) => ({ ...s, source_url: e.target.value }))}
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Quelle geprüft am (YYYY-MM-DD)"
                value={form.source_checked_at}
                onChange={(e) => setForm((s) => ({ ...s, source_checked_at: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="LinkedIn-Profil-URL (optional)"
                value={form.linkedin_url}
                onChange={(e) => setForm((s) => ({ ...s, linkedin_url: e.target.value }))}
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="LinkedIn-Such-URL (optional)"
                value={form.linkedin_search_url}
                onChange={(e) => setForm((s) => ({ ...s, linkedin_search_url: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="LinkedIn-Headline (optional)"
                value={form.linkedin_headline}
                onChange={(e) => setForm((s) => ({ ...s, linkedin_headline: e.target.value }))}
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="LinkedIn-Relevanznotiz (optional)"
                value={form.linkedin_relevance_note}
                onChange={(e) => setForm((s) => ({ ...s, linkedin_relevance_note: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                type="number"
                min={0}
                placeholder="Aktive Inserate"
                value={form.active_listings_count}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    active_listings_count: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                type="number"
                min={0}
                placeholder="Neue Inserate (30d)"
                value={form.new_listings_30d}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    new_listings_30d: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                type="number"
                min={0}
                max={100}
                placeholder="% Miete"
                value={form.share_miete_percent}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    share_miete_percent: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                type="number"
                min={0}
                max={100}
                placeholder="% Kauf"
                value={form.share_kauf_percent}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    share_kauf_percent: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={form.object_focus}
                onChange={(e) =>
                  setForm((s) => ({ ...s, object_focus: e.target.value as NewProspectForm["object_focus"] }))
                }
              >
                <option value="gemischt">Gemischt</option>
                <option value="miete">Miete</option>
                <option value="kauf">Kauf</option>
                <option value="neubau">Neubau</option>
              </select>
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => setForm((s) => ({ ...s, priority: e.target.value as "A" | "B" | "C" }))}
              >
                <option value="A">Priorität A</option>
                <option value="B">Priorität B</option>
                <option value="C">Priorität C</option>
              </select>
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                type="number"
                min={0}
                max={100}
                value={form.fit_score}
                onChange={(e) => setForm((s) => ({ ...s, fit_score: Number(e.target.value || 0) }))}
              />
            </div>
            <select
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={form.preferred_channel}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  preferred_channel: e.target.value as NewProspectForm["preferred_channel"],
                }))
              }
            >
              <option value="email">E-Mail</option>
              <option value="telefon">Telefon</option>
              <option value="linkedin">LinkedIn</option>
              <option value="kontaktformular">Kontaktformular</option>
            </select>
            <textarea
              className="min-h-[84px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Zielgruppe (z. B. Vermietung in Ballungsräumen)"
              value={form.target_group}
              onChange={(e) => setForm((s) => ({ ...s, target_group: e.target.value }))}
            />
            <textarea
              className="min-h-[84px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Prozess-Hinweis (z. B. Team, Antwort-Workflow, Besonderheiten)"
              value={form.process_hint}
              onChange={(e) => setForm((s) => ({ ...s, process_hint: e.target.value }))}
            />
            <textarea
              className="min-h-[84px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Personalisierungs-Hook (konkrete Beobachtung)"
              value={form.personalization_hook}
              onChange={(e) => setForm((s) => ({ ...s, personalization_hook: e.target.value }))}
            />
            <textarea
              className="min-h-[84px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Pain-Point-Hypothese"
              value={form.pain_point_hypothesis}
              onChange={(e) => setForm((s) => ({ ...s, pain_point_hypothesis: e.target.value }))}
            />
            <details className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-gray-800">
                Erweiterte Personalisierungsdaten
              </summary>
              <div className="mt-3 grid gap-3">
                <input
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  placeholder="Objekttypen (CSV, z. B. Wohnung,Haus,Gewerbe)"
                  value={form.object_types_csv}
                  onChange={(e) => setForm((s) => ({ ...s, object_types_csv: e.target.value }))}
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={form.brand_tone}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        brand_tone: e.target.value as NewProspectForm["brand_tone"],
                      }))
                    }
                  >
                    <option value="">Brand-Ton (optional)</option>
                    <option value="kurz_direkt">Kurz & direkt</option>
                    <option value="freundlich">Freundlich</option>
                    <option value="professionell">Professionell</option>
                    <option value="gemischt">Gemischt</option>
                  </select>
                  <select
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={form.automation_readiness}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        automation_readiness: e.target.value as NewProspectForm["automation_readiness"],
                      }))
                    }
                  >
                    <option value="">Automation-Readiness</option>
                    <option value="niedrig">Niedrig</option>
                    <option value="mittel">Mittel</option>
                    <option value="hoch">Hoch</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    placeholder="Primäre Objection (z. B. Kontrollverlust)"
                    value={form.primary_objection}
                    onChange={(e) => setForm((s) => ({ ...s, primary_objection: e.target.value }))}
                  />
                  <select
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={form.cta_preference_guess}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        cta_preference_guess: e.target.value as NewProspectForm["cta_preference_guess"],
                      }))
                    }
                  >
                    <option value="">CTA-Präferenz</option>
                    <option value="kurze_mail_antwort">Kurze Mail-Antwort</option>
                    <option value="15_min_call">15-Minuten-Call</option>
                    <option value="video_link">Video-Link</option>
                    <option value="formular_antwort">Formular-Antwort</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    placeholder="Öffentliches Reaktionsversprechen"
                    value={form.response_promise_public}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, response_promise_public: e.target.value }))
                    }
                  />
                  <input
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    placeholder="Terminablauf öffentlich"
                    value={form.appointment_flow_public}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, appointment_flow_public: e.target.value }))
                    }
                  />
                  <input
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    placeholder="Unterlagenablauf öffentlich"
                    value={form.docs_flow_public}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, docs_flow_public: e.target.value }))
                    }
                  />
                </div>
                <textarea
                  className="min-h-[72px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  placeholder="Personalisierungs-Evidenz (welches konkrete Faktum stützt die Nachricht?)"
                  value={form.personalization_evidence}
                  onChange={(e) => setForm((s) => ({ ...s, personalization_evidence: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  placeholder="Hypothesis Confidence (0.00-1.00)"
                  value={form.hypothesis_confidence}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      hypothesis_confidence: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
              </div>
            </details>
            <button
              onClick={() => void createProspect()}
              disabled={formBusy}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
            >
              {formBusy ? "Speichere…" : "Prospect anlegen"}
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-3">
          <h2 className="text-lg font-semibold text-gray-900">Fällige nächste Schritte</h2>
          <p className="mt-1 text-sm text-gray-600">
            Diese Liste priorisiert Follow-ups und Antwort-Auswertung.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 pr-3">Firma</th>
                  <th className="py-2 pr-3">Kontakt</th>
                  <th className="py-2 pr-3">Priorität</th>
                  <th className="py-2 pr-3">Aktion</th>
                  <th className="py-2 pr-3">Warum</th>
                  <th className="py-2">Zeitpunkt</th>
                </tr>
              </thead>
              <tbody>
                {(data.followup_due || []).map((row) => (
                  (() => {
                    const research = prospectResearchById.get(row.prospect_id) || null;
                    return (
                  <tr
                    key={row.prospect_id}
                    className={`border-t border-gray-100 ${selectedProspectId === row.prospect_id ? "bg-amber-50/40" : ""}`}
                  >
                    <td className="py-2 pr-3 font-medium text-gray-900">
                      <Link
                        href={`/app/crm/${row.prospect_id}`}
                        className="text-left hover:underline"
                      >
                        {row.company_name}
                      </Link>
                      <button
                        className="ml-2 text-xs text-gray-500 hover:underline"
                        onClick={() => setSelectedProspectId(row.prospect_id)}
                      >
                        Schnellansicht
                      </button>
                      {research ? (
                        <div className="mt-1">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ring-1 ${researchBadgeClass(
                              research.status,
                            )}`}
                          >
                            {researchStatusLabel(research.status)}
                          </span>
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 text-gray-700">{row.contact_name || "–"}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.priority}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.recommended_action || "–"}</td>
                    <td className="py-2 pr-3 text-gray-600">
                      {row.recommended_reason || "–"}
                    </td>
                    <td className="py-2 text-gray-600">{formatDate(row.recommended_at)}</td>
                  </tr>
                    );
                  })()
                ))}
                {(data.followup_due || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-5 text-sm text-gray-500">
                      Keine fälligen Follow-ups. Sehr gut.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Discovery-Kandidaten</h2>
              <p className="mt-1 text-sm text-gray-600">
                Neue Website-Funde erst prüfen, dann bewusst in die Prospect-Pipeline übernehmen.
              </p>
            </div>
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-800">
              Offen: {(data.candidate_queue || []).length}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {(data.candidate_queue || []).map((candidate) => {
              const learnedFitScore = Number.isFinite(Number(candidate.learned_fit_score))
                ? Number(candidate.learned_fit_score)
                : null;
              const discoveryLearningScore = Number.isFinite(Number(candidate.discovery_learning_score))
                ? Number(candidate.discovery_learning_score)
                : 0;
              return (
                <div key={candidate.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">
                        {candidate.company_name}
                        {candidate.city ? ` · ${candidate.city}` : ""}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Fit {candidate.fit_score}
                        {learnedFitScore !== null ? ` → Learned ${learnedFitScore}` : ""}
                        {" · "}
                        {candidate.priority} · {candidate.preferred_channel}
                        {typeof candidate.active_listings_count === "number"
                          ? ` · ${candidate.active_listings_count} Inserate`
                          : ""}
                        {candidate.created_at ? ` · gefunden ${formatDate(candidate.created_at)}` : ""}
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        {candidate.personalization_hook ||
                          candidate.process_hint ||
                          candidate.target_group ||
                          "Noch kein belastbarer Hook gespeichert."}
                      </div>
                      {candidate.discovery_learning_reason ? (
                        <div className="mt-2 text-xs text-gray-600">
                          Discovery-Learning: {candidate.discovery_learning_reason}
                        </div>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`rounded-full px-2 py-0.5 ring-1 ${learningBiasBadgeClass(discoveryLearningScore)}`}
                        >
                          Discovery-Bias {discoveryLearningScore >= 0 ? "+" : ""}
                          {discoveryLearningScore}
                        </span>
                        {candidate.contact_email ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
                            {candidate.contact_email}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 ring-1 ring-amber-200">
                            Kein E-Mail-Kontakt
                          </span>
                        )}
                        {candidate.automation_readiness ? (
                          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
                            Auto: {candidate.automation_readiness}
                          </span>
                        ) : null}
                        {candidate.source_checked_at ? (
                          <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
                            Quelle geprüft: {candidate.source_checked_at}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        {candidate.website_url ? (
                          <a
                            className="text-blue-700 hover:underline"
                            href={candidate.website_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Website
                          </a>
                        ) : null}
                        {!candidate.website_url && candidate.source_url ? (
                          <a
                            className="text-blue-700 hover:underline"
                            href={candidate.source_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Quelle
                          </a>
                        ) : null}
                        {candidate.linkedin_url ? (
                          <a
                            className="text-blue-700 hover:underline"
                            href={candidate.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            LinkedIn
                          </a>
                        ) : null}
                        {!candidate.linkedin_url && candidate.linkedin_search_url ? (
                          <a
                            className="text-blue-700 hover:underline"
                            href={candidate.linkedin_search_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            LinkedIn suchen
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                        disabled={candidateBusyId === candidate.id}
                        onClick={() => void acceptCandidate(candidate.id)}
                      >
                        {candidateBusyId === candidate.id ? "Übernehme…" : "Übernehmen"}
                      </button>
                      <button
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                        disabled={candidateBusyId === candidate.id}
                        onClick={() => void rejectCandidate(candidate.id)}
                      >
                        Verwerfen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {(data.candidate_queue || []).length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                Keine offenen Discovery-Kandidaten. Starte oben einen Städte-Scan oder lege Prospects manuell an.
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account geaendert</h2>
              <p className="mt-1 text-sm text-gray-600">
                Diese Prospects haben neue Website-, Kontakt- oder Prozesssignale, die Hook oder Strategie veraendern koennten.
              </p>
            </div>
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-800">
              Offen: {accountChangeQueue.length}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {accountChangeQueue.map((item) => (
              <div key={`change-${item.id}`} className="rounded-xl border border-gray-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.company_name}
                      {item.city ? ` · ${item.city}` : ""}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-800 ring-1 ring-sky-200">
                        {item.change_count ? `${item.change_count} Signal${item.change_count === 1 ? "" : "e"}` : "Neue Signale"}
                      </span>
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
                        Fit {item.fit_score}
                      </span>
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
                        {item.priority} · {STAGE_LABELS[item.stage] || item.stage}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      {item.change_summary || item.next_action || "Neue Signale pruefen und Hook neu bewerten."}
                    </div>
                    {item.latest_change_note ? (
                      <div className="mt-2 text-xs text-gray-500 line-clamp-3">{item.latest_change_note}</div>
                    ) : item.personalization_hook ? (
                      <div className="mt-2 text-xs text-gray-500">Bisheriger Hook: {item.personalization_hook}</div>
                    ) : null}
                    {item.change_items && item.change_items.length > 0 ? (
                      <ResearchChangeDiff
                        className="mt-2"
                        compact
                        summary={item.change_summary || null}
                        items={item.change_items}
                      />
                    ) : null}
                    <div className="mt-2 text-xs text-gray-500">
                      Erkannt: {formatDate(item.change_detected_at || item.next_action_at || item.updated_at || null)}
                      {item.source_checked_at ? ` · zuletzt geprüft ${formatDate(item.source_checked_at)}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                      disabled={saving === item.id}
                      onClick={() => void markAccountChangeReviewed(item)}
                    >
                      Als geprüft markieren
                    </button>
                    <button
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 hover:bg-blue-100 disabled:opacity-60"
                      disabled={loading}
                      onClick={() => void runProspectEnrichment(item.id, { force: true })}
                    >
                      Neu prüfen
                    </button>
                    <button
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setSelectedProspectId(item.id)}
                    >
                      Öffnen
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {accountChangeQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                Keine frischen Account-Aenderungen offen. Change-Watch bleibt im Hintergrund aktiv.
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Research-Lücken</h2>
              <p className="mt-1 text-sm text-gray-600">
                Diese Prospects sind noch nicht belastbar genug für automatisierten Outreach.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
              Offen: {researchGapProspects.length}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {researchGapProspects.map(({ prospect, research }) => (
              <div key={prospect.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {prospect.company_name}
                      {prospect.city ? ` · ${prospect.city}` : ""}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 ring-1 ${researchBadgeClass(
                          research?.status,
                        )}`}
                      >
                        {researchStatusLabel(research?.status || "needs_research")}
                      </span>
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
                        {research?.score || 0}/100
                      </span>
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
                        Fit {prospect.fit_score}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">{research?.summary || "Research fehlt."}</div>
                    {(research?.blockers?.[0] || research?.warnings?.[0]) ? (
                      <div className="mt-2 text-xs text-gray-500">
                        {research?.blockers?.[0] || research?.warnings?.[0]}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 hover:bg-blue-100 disabled:opacity-60"
                      disabled={loading}
                      onClick={() =>
                        void runProspectEnrichment(prospect.id, {
                          force: research?.status === "refresh_research" || research?.status === "missing_contact",
                          expectContactChannel: research?.status === "missing_contact",
                        })
                      }
                    >
                      {research?.status === "missing_contact"
                        ? "Kontakt finden"
                        : research?.status === "refresh_research"
                          ? "Research auffrischen"
                          : "Research schärfen"}
                    </button>
                    <button
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setSelectedProspectId(prospect.id)}
                    >
                      Öffnen
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {researchGapProspects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                Keine akuten Research-Lücken. Die wichtigsten Prospects sind sendbar oder bereits in späten Stages.
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Kontakt-Reparatur</h2>
              <p className="mt-1 text-sm text-gray-600">
                Wenn ein Kanal fehlt oder gebounced ist, wird hier der nächste sinnvolle Kontaktpfad gezogen.
              </p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
              Offen: {contactRepairQueue.length}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {contactRepairQueue.map(({ row, prospect, research }) => (
              <div key={`repair-${row.prospect_id}`} className="rounded-xl border border-gray-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {row.company_name}
                      {prospect?.city ? ` · ${prospect.city}` : ""}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
                        {row.recommended_code === "switch_channel_after_bounce" ? "Bounce-Fallback" : "Kontakt ergänzen"}
                      </span>
                      {research ? (
                        <span
                          className={`rounded-full px-2 py-0.5 ring-1 ${researchBadgeClass(
                            research.status,
                          )}`}
                        >
                          {researchStatusLabel(research.status)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      {row.recommended_reason || "Kontaktpfad prüfen und neu priorisieren."}
                    </div>
                    {prospect?.contact_email ? (
                      <div className="mt-2 text-xs text-gray-500">Aktuell: {prospect.contact_email}</div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                      disabled={loading}
                      onClick={async () => {
                        if (row.recommended_code === "fill_contact_channel") {
                          const repair = await runContactRepair(row.prospect_id, "missing_contact");
                          if (!repair || repair.status === "no_candidate") {
                            await runProspectEnrichment(row.prospect_id, {
                              force: true,
                              expectContactChannel: true,
                            });
                            await runContactRepair(row.prospect_id, "missing_contact");
                          }
                          return;
                        }
                        await runContactRepair(row.prospect_id, "bounce");
                      }}
                    >
                      {row.recommended_code === "switch_channel_after_bounce"
                        ? "Fallback ziehen"
                        : "Kontakt reparieren"}
                    </button>
                    <button
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setSelectedProspectId(row.prospect_id)}
                    >
                      Öffnen
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {contactRepairQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                Keine offenen Kontakt-Reparaturen. Fehlende oder gebouncte Kanäle werden hier gesammelt.
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Blocked-Draft-Queue</h2>
            <p className="mt-1 text-sm text-gray-600">
              Diese Drafts sind aktuell die besten Kandidaten für manuelle Rettung, weil QA oder Evidenz sie noch blockiert.
            </p>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
            Offen: {(data.blocked_draft_queue || []).length}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {(data.blocked_draft_queue || []).map((item) => (
            <div key={`blocked-${item.id}`} className="rounded-xl border border-gray-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900">
                    {item.company_name}
                    {item.city ? ` · ${item.city}` : ""}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
                      {item.message_kind} · {item.channel}
                    </span>
                    {item.review ? (
                      <span
                        className={`rounded-full px-2 py-0.5 ring-1 ${reviewBadgeClass(item.review.status)}`}
                      >
                        {outboundQualityStatusLabel(item.review.status)} · {item.review.score}/100
                      </span>
                    ) : null}
                    {item.priority ? (
                      <span className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
                        {item.priority} · Fit {item.fit_score || 0}
                      </span>
                    ) : null}
                  </div>
                  {item.subject ? <div className="mt-2 text-sm font-medium text-gray-900">{item.subject}</div> : null}
                  <div className="mt-1 text-sm text-gray-700 line-clamp-3">{item.body_preview}</div>
                  {item.review ? (
                    <OutboundEvidenceInspector
                      review={item.review}
                      compact
                      defaultOpen={Number(item.review.evidence_alignment?.unsupported_claim_count || 0) > 0}
                      className="mt-2"
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 hover:bg-blue-100"
                    onClick={() => rescueBlockedDraft(item)}
                  >
                    Im Editor öffnen
                  </button>
                  <button
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => setSelectedProspectId(item.prospect_id)}
                  >
                    Prospect öffnen
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(data.blocked_draft_queue || []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
              Keine geblockten oder review-bedürftigen Drafts offen. Gute Nachricht.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Prospects Pipeline</h2>
            <p className="mt-1 text-sm text-gray-600">
              Stage direkt pflegen und Kernereignisse in einem Klick dokumentieren.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Suchen (Firma, Kontakt, Stadt, Hook)"
              value={pipelineQuery}
              onChange={(e) => setPipelineQuery(e.target.value)}
            />
            <select
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              value={pipelineSort}
              onChange={(e) => setPipelineSort(e.target.value as any)}
            >
              <option value="fit_desc">Sortierung: Fit absteigend</option>
              <option value="readiness_desc">Sortierung: Readiness absteigend</option>
              <option value="priority_fit">Sortierung: Priorität + Fit</option>
              <option value="next_action_asc">Sortierung: Nächste Aktion</option>
              <option value="updated_desc">Sortierung: Zuletzt aktualisiert</option>
              <option value="company_asc">Sortierung: Firmenname A-Z</option>
            </select>
            <select
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              value={pipelineStage}
              onChange={(e) => setPipelineStage(e.target.value)}
            >
              <option value="all">Alle Stages</option>
              {STAGE_OPTIONS.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3">Firma</th>
                <th className="py-2 pr-3">Hook</th>
                <th className="py-2 pr-3">Fit/Readiness</th>
                <th className="py-2 pr-3">Stage</th>
                <th className="py-2 pr-3">Nächste Aktion</th>
                <th className="py-2">Events</th>
              </tr>
            </thead>
            <tbody>
              {sortedProspects.map((p) => (
                (() => {
                  const research = prospectResearchById.get(p.id) || null;
                  return (
                <tr key={p.id} className="border-t border-gray-100 align-top">
                  <td className="py-3 pr-3">
                    <Link
                      href={`/app/crm/${p.id}`}
                      className={`text-left ${selectedProspectId === p.id ? "font-semibold text-gray-900" : "font-medium text-gray-900"} hover:underline`}
                    >
                      {p.company_name}
                    </Link>
                    <div className="text-xs text-gray-500">
                      {p.contact_name || "Kein Name"} · {p.contact_email || "keine E-Mail"} · {p.city || "Kein Ort"} · {p.object_focus}
                      {typeof p.active_listings_count === "number" ? ` · ${p.active_listings_count} Inserate` : ""}
                      {typeof p.share_miete_percent === "number" || typeof p.share_kauf_percent === "number"
                        ? ` · Miete ${p.share_miete_percent ?? "?"}% / Kauf ${p.share_kauf_percent ?? "?"}%`
                        : ""}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {p.linkedin_url ? (
                        <a
                          className="text-blue-700 hover:underline"
                          href={p.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          LinkedIn-Profil
                        </a>
                      ) : null}
                      {!p.linkedin_url && p.linkedin_search_url ? (
                        <a
                          className="text-blue-700 hover:underline"
                          href={p.linkedin_search_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          LinkedIn suchen
                        </a>
                      ) : null}
                      {p.source_url ? (
                        <a
                          className="text-gray-600 hover:underline"
                          href={p.source_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Quelle
                        </a>
                      ) : null}
                      <button
                        className="text-gray-600 hover:underline"
                        onClick={() => setSelectedProspectId(p.id)}
                      >
                        Schnellansicht
                      </button>
                    </div>
                  </td>
                  <td className="max-w-[320px] py-3 pr-3 text-gray-700">
                    {p.personalization_hook || "–"}
                  </td>
                  <td className="py-3 pr-3 text-gray-700">
                    <div>
                      {p.fit_score} · {p.priority}
                    </div>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${readinessBadgeClass(
                        Number.isFinite(Number(p.readiness_score))
                          ? Number(p.readiness_score)
                          : Number(p.fit_score || 0),
                      )}`}
                    >
                      Ready{" "}
                      {Number.isFinite(Number(p.readiness_score))
                        ? Number(p.readiness_score)
                        : Number(p.fit_score || 0)}
                    </span>
                    {research ? (
                      <div className="mt-1">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ring-1 ${researchBadgeClass(
                            research.status,
                          )}`}
                        >
                          {researchStatusLabel(research.status)}
                        </span>
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs ring-1 ${stageBadgeClass(p.stage)}`}
                      >
                        {STAGE_LABELS[p.stage] || p.stage}
                      </span>
                      <select
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                        value={p.stage}
                        disabled={saving === p.id}
                        onChange={(e) => void updateStage(p.id, e.target.value)}
                      >
                        {STAGE_OPTIONS.map((stage) => (
                          <option key={stage} value={stage}>
                            {STAGE_LABELS[stage]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-gray-700">
                    <div>{p.next_action || "–"}</div>
                    <div className="text-xs text-gray-500">{formatDate(p.next_action_at)}</div>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                        disabled={saving === p.id}
                        onClick={() => void logEvent(p.id, "message_sent", "Erstkontakt gesendet")}
                      >
                        Erstkontakt
                      </button>
                      <button
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                        disabled={saving === p.id}
                        onClick={() => void logEvent(p.id, "reply_received", "Antwort erhalten")}
                      >
                        Antwort
                      </button>
                      <button
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                        disabled={saving === p.id}
                        onClick={() => void logEvent(p.id, "pilot_started", "Pilot gestartet")}
                      >
                        Pilot gestartet
                      </button>
                      <button
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                        disabled={saving === p.id}
                        onClick={() => void logEvent(p.id, "deal_won", "Gewonnen")}
                      >
                        Gewonnen
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })()
              ))}
              {sortedProspects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-sm text-gray-500">
                    Keine Treffer. Passe Suche/Stage an, prüfe Discovery-Kandidaten oder lege oben einen Prospect manuell an.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-4">
          <h3 className="text-base font-semibold text-gray-900">Prospect-Notizen</h3>
          <p className="mt-1 text-xs text-gray-600">
            {selectedProspect ? `Ausgewählt: ${selectedProspect.company_name}` : "Kein Prospect ausgewählt"}
          </p>
          {selectedProspect ? (
            <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
              <div>
                Fokus: {selectedProspect.object_focus} · Fit {selectedProspect.fit_score} ·{" "}
                {selectedProspect.automation_readiness || "Readiness offen"}
              </div>
              <div className="mt-1">
                Objection: {selectedProspect.primary_objection || "nicht gepflegt"} · Tone:{" "}
                {selectedProspect.brand_tone || "nicht gepflegt"}
              </div>
              <div className="mt-1">
                Quelle geprüft: {selectedProspect.source_checked_at || "unbekannt"}
              </div>
              {prospectResearchById.get(selectedProspect.id) ? (
                <div className="mt-1">
                  Research:{" "}
                  {researchStatusLabel(prospectResearchById.get(selectedProspect.id)?.status || "needs_research")} ·{" "}
                  {prospectResearchById.get(selectedProspect.id)?.score || 0}/100
                </div>
              ) : null}
              {selectedProspect.linkedin_relevance_note ? (
                <div className="mt-1">LinkedIn-Hinweis: {selectedProspect.linkedin_relevance_note}</div>
              ) : null}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {selectedProspect.linkedin_url ? (
                  <a
                    href={selectedProspect.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    LinkedIn-Profil öffnen
                  </a>
                ) : null}
                {!selectedProspect.linkedin_url && selectedProspect.linkedin_search_url ? (
                  <a
                    href={selectedProspect.linkedin_search_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    LinkedIn-Suche öffnen
                  </a>
                ) : null}
                {selectedProspect.source_url ? (
                  <a
                    href={selectedProspect.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-600 hover:underline"
                  >
                    Quellseite öffnen
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="mt-3 grid gap-2">
            <textarea
              className="min-h-[90px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Konkrete Beobachtung oder Insight"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button
              onClick={() => void createNote()}
              disabled={!selectedProspectId || noteBusy}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {noteBusy ? "Speichere…" : "Notiz speichern"}
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {selectedChangeSummary ? (
              <ResearchChangeDiff
                summary={String(selectedChangeSummary.summary || "")}
                items={Array.isArray(selectedChangeSummary.items) ? selectedChangeSummary.items : []}
                compact
              />
            ) : null}
            {detailLoading ? <div className="text-sm text-gray-500">Lade Notizen…</div> : null}
            {!detailLoading && notes.length === 0 ? (
              <div className="text-sm text-gray-500">Noch keine Notizen vorhanden.</div>
            ) : null}
            {notes.map((n) => (
              <div key={n.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-xs text-gray-500">
                  {n.source_type} · {formatDate(n.created_at)}
                </div>
                <div className="mt-1 text-sm text-gray-800">{n.note}</div>
                {n.metadata?.change_summary?.items ? (
                  <ResearchChangeDiff
                    className="mt-2"
                    compact
                    summary={String(n.metadata?.change_summary?.summary || "")}
                    items={Array.isArray(n.metadata?.change_summary?.items) ? n.metadata.change_summary.items : []}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900">Nachrichtendrafts</h3>
            <div className="flex items-center gap-2">
              <select
                className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs"
                value={sendProvider}
                onChange={(e) =>
                  setSendProvider(
                    e.target.value === "gmail" || e.target.value === "outlook"
                      ? e.target.value
                      : "auto",
                  )
                }
              >
                <option value="auto">Versand: Auto</option>
                <option value="gmail">Versand: Gmail</option>
                <option value="outlook">Versand: Outlook</option>
              </select>
              <button
                onClick={() => void generateTesterInviteTemplate()}
                disabled={!selectedProspectId || draftBusy}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-100 disabled:opacity-60"
              >
                Tester-Einladung erzeugen
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={newDraftKind}
                onChange={(e) => {
                  setNewDraftKind(e.target.value);
                  if (newDraftReview) setNewDraftReviewStale(true);
                }}
              >
                <option value="first_touch">Erstkontakt</option>
                <option value="follow_up_1">Follow-up 1</option>
                <option value="follow_up_2">Follow-up 2</option>
                <option value="follow_up_3">Follow-up 3</option>
                <option value="custom">Custom</option>
              </select>
              <select
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={newDraftChannel}
                onChange={(e) => {
                  setNewDraftChannel(e.target.value);
                  if (newDraftReview) setNewDraftReviewStale(true);
                }}
              >
                <option value="email">E-Mail</option>
                <option value="telefon">Telefon</option>
                <option value="linkedin">LinkedIn</option>
                <option value="kontaktformular">Kontaktformular</option>
              </select>
            </div>
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Betreff (optional)"
              value={newDraftSubject}
              onChange={(e) => {
                setNewDraftSubject(e.target.value);
                if (newDraftReview) setNewDraftReviewStale(true);
              }}
            />
            <textarea
              className="min-h-[130px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Nachrichtentext"
              value={newDraftBody}
              onChange={(e) => {
                setNewDraftBody(e.target.value);
                if (newDraftReview) setNewDraftReviewStale(true);
              }}
            />
            {selectedContactSafety ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 ${contactSafetyBadgeClass(selectedContactSafety.level)}`}
                  >
                    Kontakt {contactSafetyLabel(selectedContactSafety.level)} · {selectedContactSafety.score}/100
                  </span>
                </div>
                <div className="mt-1">{selectedContactSafety.summary}</div>
                {selectedContactSafety.reasons[0] ? (
                  <div className="mt-1 text-[11px] text-gray-500">{selectedContactSafety.reasons[0]}</div>
                ) : null}
              </div>
            ) : null}
            {newDraftReview ? (
              <OutboundEvidenceInspector
                review={newDraftReview}
                defaultOpen={
                  newDraftReview.status !== "pass" ||
                  Number(newDraftReview.evidence_alignment?.unsupported_claim_count || 0) > 0
                }
              />
            ) : null}
            {newDraftReview ? (
              <DraftClaimHighlight
                body={newDraftBody}
                review={newDraftReview}
                stale={newDraftReviewStale}
              />
            ) : null}
            <button
              onClick={() => void createDraft()}
              disabled={!selectedProspectId || draftBusy}
              className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
            >
              {draftBusy ? "Speichere…" : "Draft speichern"}
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {detailLoading ? <div className="text-sm text-gray-500">Lade Drafts…</div> : null}
            {!detailLoading && messages.length === 0 ? (
              <div className="text-sm text-gray-500">Noch keine Drafts vorhanden.</div>
            ) : null}
            {messages.map((m) => (
              (() => {
                const review = (m.metadata?.outbound_review || null) as DraftReview | null;
                return (
              <div key={m.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-gray-500">
                    {m.message_kind} · {m.channel} · {formatDate(m.created_at)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-gray-200">
                      {m.status}
                    </span>
                    {review ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ring-1 ${reviewBadgeClass(review.status)}`}
                      >
                        {outboundQualityStatusLabel(review.status)} · {review.score}/100
                      </span>
                    ) : null}
                    {m.status !== "sent" ? (
                      <button
                        className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                        disabled={saving === m.id}
                        onClick={() => void sendMessageNow(m.id)}
                      >
                        Jetzt senden
                      </button>
                    ) : null}
                    {m.status !== "sent" ? (
                      <button
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                        disabled={saving === m.id}
                        onClick={() => void setMessageStatus(m.id, "sent")}
                      >
                        Als gesendet markieren
                      </button>
                    ) : null}
                    {m.status !== "archived" ? (
                      <button
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs hover:bg-white disabled:opacity-60"
                        disabled={saving === m.id}
                        onClick={() => void setMessageStatus(m.id, "archived")}
                      >
                        Archivieren
                      </button>
                    ) : null}
                  </div>
                </div>
                {m.subject ? <div className="mt-1 text-sm font-medium text-gray-900">{m.subject}</div> : null}
                <div className="mt-1 whitespace-pre-line text-sm text-gray-700">{m.body}</div>
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
              })()
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-3">
          <h3 className="text-base font-semibold text-gray-900">Event-Verlauf</h3>
          <div className="mt-3 space-y-2">
            {detailLoading ? <div className="text-sm text-gray-500">Lade Events…</div> : null}
            {!detailLoading && events.length === 0 ? (
              <div className="text-sm text-gray-500">Noch keine Events vorhanden.</div>
            ) : null}
            {events.map((e) => (
              <div key={e.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-xs text-gray-500">{formatDate(e.event_at)}</div>
                <div className="mt-1 text-sm font-medium text-gray-900">
                  {EVENT_LABELS[e.event_type] || e.event_type}
                </div>
                {e.details ? <div className="mt-1 text-sm text-gray-700">{e.details}</div> : null}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
