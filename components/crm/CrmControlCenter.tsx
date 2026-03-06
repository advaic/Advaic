"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Prospect = {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  city: string | null;
  object_focus: "miete" | "kauf" | "neubau" | "gemischt";
  priority: "A" | "B" | "C";
  fit_score: number;
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

type OverviewResponse = {
  ok: boolean;
  summary: Overview;
  followup_due: FollowupDue[];
  prospects: Prospect[];
  open_feedback: {
    total: number;
    by_severity: { critical: number; high: number; medium: number; low: number };
  };
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
  created_at: string;
  updated_at: string;
};

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
  deliverability_correlation?: DeliverabilityCorrelationRow[];
  revenue_attribution?: RevenueAttribution;
  sequence_rollouts?: SequenceRollout[];
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

function formatDate(iso: string | null | undefined) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function buildLinkedInSearchUrl(companyName: string, contactName: string, city: string) {
  const q = [contactName, companyName, city, "LinkedIn Immobilien"].filter(Boolean).join(" ");
  if (!q.trim()) return "";
  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(q)}`;
}

function stageBadgeClass(stage: string) {
  if (stage === "won") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (stage === "lost") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (stage.startsWith("pilot")) return "bg-blue-50 text-blue-700 ring-blue-200";
  if (stage === "replied") return "bg-sky-50 text-sky-700 ring-sky-200";
  return "bg-gray-50 text-gray-700 ring-gray-200";
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
    "fit_desc" | "priority_fit" | "next_action_asc" | "updated_desc" | "company_asc"
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
  const [sendProvider, setSendProvider] = useState<"auto" | "gmail" | "outlook">("auto");
  const [noteBusy, setNoteBusy] = useState(false);
  const [draftBusy, setDraftBusy] = useState(false);
  const [nextAction, setNextAction] = useState<NextBestAction | null>(null);
  const [performance, setPerformance] = useState<PerformanceResponse | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [recomputingExperiments, setRecomputingExperiments] = useState(false);

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
      if (!selectedProspectId && json.prospects?.[0]?.id) {
        setSelectedProspectId(json.prospects[0].id);
      }
    } catch (e: any) {
      setError(String(e?.message || "CRM-Daten konnten nicht geladen werden."));
    } finally {
      setLoading(false);
    }
  }, [loadNextAction, loadPerformance, selectedProspectId]);

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
    void loadNextAction();
    void loadPerformance();
  }, [loadNextAction, loadPerformance]);

  useEffect(() => {
    if (!selectedProspectId) {
      setNotes([]);
      setMessages([]);
      setEvents([]);
      return;
    }
    void loadProspectDetail(selectedProspectId);
  }, [loadProspectDetail, selectedProspectId]);

  const selectedProspect = useMemo(
    () => data.prospects.find((p) => p.id === selectedProspectId) || null,
    [data.prospects, selectedProspectId],
  );
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
    return [...filteredProspects].sort((a, b) => {
      if (pipelineSort === "fit_desc") {
        if (b.fit_score !== a.fit_score) return b.fit_score - a.fit_score;
        return rankPriority(a.priority) - rankPriority(b.priority);
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
      setSuccess("Nachrichtendraft gespeichert.");
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
      setSuccess("Tester-Einladung übernommen. Du kannst sie jetzt anpassen.");
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
        `Enrichment-Lauf: ${Number(json?.enriched || 0)} angereichert, ${Number(json?.skipped || 0)} ohne Änderungen, ${Number(json?.failed || 0)} Fehler.`,
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

  async function runSequence(onlyProspectId?: string) {
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
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(
          json?.details || json?.error || "Sequenzlauf fehlgeschlagen.",
        );
      }
      setSuccess(
        `Sequenzlauf fertig: ${Number(json?.created || 0)} Drafts erstellt, ${Number(json?.skipped_existing || 0)} bereits vorhanden.`,
      );
      await refresh();
      if (selectedProspectId) await loadProspectDetail(selectedProspectId);
    } catch (e: any) {
      setError(String(e?.message || "Sequenzlauf fehlgeschlagen."));
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

    if (prospectId) {
      setSelectedProspectId(prospectId);
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
      setSuccess(
        "Kanalwechsel empfohlen. Prospect wurde markiert. Nächster Schritt: Telefon, LinkedIn oder Kontaktformular.",
      );
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
              disabled={loading}
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

      <section className="grid gap-3 md:grid-cols-4">
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
            <div className="grid gap-4 xl:grid-cols-2">
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 md:col-span-4">
              <div className="text-xs text-amber-700">Warum</div>
              <div className="mt-1 text-sm text-amber-900">
                {nextAction.recommended_reason || "Kein zusätzlicher Grund verfügbar."}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
            Aktuell keine offene Empfehlung. Sequenz und Tracking laufen stabil.
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Neuen Tester-Kandidaten anlegen</h2>
          <p className="mt-1 text-sm text-gray-600">
            Fokus auf persönliche Relevanz: valide Quellen, Angebotsmix, Objection und Hook sauber eintragen.
          </p>
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
                    </td>
                    <td className="py-2 pr-3 text-gray-700">{row.contact_name || "–"}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.priority}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.recommended_action || "–"}</td>
                    <td className="py-2 pr-3 text-gray-600">
                      {row.recommended_reason || "–"}
                    </td>
                    <td className="py-2 text-gray-600">{formatDate(row.recommended_at)}</td>
                  </tr>
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
                <th className="py-2 pr-3">Fit</th>
                <th className="py-2 pr-3">Stage</th>
                <th className="py-2 pr-3">Nächste Aktion</th>
                <th className="py-2">Events</th>
              </tr>
            </thead>
            <tbody>
              {sortedProspects.map((p) => (
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
                    {p.fit_score} · {p.priority}
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
              ))}
              {sortedProspects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-sm text-gray-500">
                    Keine Treffer. Passe Suche/Stage an oder lege oben einen neuen Tester-Kandidaten an.
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
                onChange={(e) => setNewDraftKind(e.target.value)}
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
                onChange={(e) => setNewDraftChannel(e.target.value)}
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
              onChange={(e) => setNewDraftSubject(e.target.value)}
            />
            <textarea
              className="min-h-[130px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Nachrichtentext"
              value={newDraftBody}
              onChange={(e) => setNewDraftBody(e.target.value)}
            />
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
              <div key={m.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-gray-500">
                    {m.message_kind} · {m.channel} · {formatDate(m.created_at)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-gray-200">
                      {m.status}
                    </span>
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
              </div>
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
