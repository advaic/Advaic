"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

type DraftReview = {
  status: "pass" | "needs_review" | "blocked";
  score: number;
  summary: string;
  blockers?: string[];
  warnings?: string[];
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
}: {
  prospectId: string;
  initialProspect: Prospect;
  initialNextAction: NextAction | null;
  initialNotes: ResearchNote[];
  initialMessages: OutreachMessage[];
  initialEvents: OutreachEvent[];
}) {
  const [prospect, setProspect] = useState<Prospect>(initialProspect);
  const [nextAction, setNextAction] = useState<NextAction | null>(initialNextAction);
  const [notes, setNotes] = useState<ResearchNote[]>(initialNotes);
  const [messages, setMessages] = useState<OutreachMessage[]>(initialMessages);
  const [events, setEvents] = useState<OutreachEvent[]>(initialEvents);

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

  async function refreshAll() {
    try {
      const [notesRes, messagesRes, eventsRes, nextActionRes] = await Promise.all([
        fetch(`/api/crm/prospects/${prospectId}/notes`, { cache: "no-store" }),
        fetch(`/api/crm/prospects/${prospectId}/messages`, { cache: "no-store" }),
        fetch(`/api/crm/prospects/${prospectId}/events`, { cache: "no-store" }),
        fetch(`/api/crm/prospects/${prospectId}/next-action`, { cache: "no-store" }),
      ]);
      const notesJson = await notesRes.json().catch(() => ({} as any));
      const messagesJson = await messagesRes.json().catch(() => ({} as any));
      const eventsJson = await eventsRes.json().catch(() => ({} as any));
      const nextActionJson = await nextActionRes.json().catch(() => ({} as any));

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
      setNextAction(nextActionRes.ok && nextActionJson?.ok ? nextActionJson?.next_action || null : null);
    } catch (e: any) {
      setError(String(e?.message || "Details konnten nicht aktualisiert werden."));
    }
  }

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
      setDraftSubject(String(json?.template?.subject || "").trim());
      setDraftBody(String(json?.template?.body || "").trim());
      setDraftReview((json?.template_review || null) as DraftReview | null);
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
        setDraftChannel(first.channel === "email" || first.channel === "linkedin" || first.channel === "telefon" ? first.channel : "email");
        setDraftSubject(first.subject || "");
        setDraftBody(first.body || "");
        setDraftReview(
          first.review_status && typeof first.review_score === "number"
            ? {
                status: first.review_status,
                score: first.review_score,
                summary: String(first.review_summary || "").trim(),
              }
            : null,
        );
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
    setDraftChannel(item.channel);
    setDraftSubject(item.subject || "");
    setDraftBody(item.body || "");
    setDraftReview(
      item.review_status && typeof item.review_score === "number"
        ? {
            status: item.review_status,
            score: item.review_score,
            summary: String(item.review_summary || "").trim(),
          }
        : null,
    );
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
      setSuccess(
        `Research-Crawl fertig: ${Array.isArray(json?.pages_crawled) ? json.pages_crawled.length : 0} Seiten geprüft.${
          json?.research?.status ? ` ${researchStatusLabel(json.research.status)} · ${Number(json?.research?.score || 0)}/100.` : ""
        }`,
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
                  setDraftReview(null);
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
                  setDraftReview(null);
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
                setDraftReview(null);
              }}
            />
            <textarea
              className="min-h-[170px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Nachrichtentext"
              value={draftBody}
              onChange={(e) => {
                setDraftBody(e.target.value);
                setDraftReview(null);
              }}
            />
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
            {draftReview ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ring-1 ${reviewBadgeClass(
                    draftReview.status,
                  )}`}
                >
                  {outboundQualityStatusLabel(draftReview.status)} · {draftReview.score}/100
                </span>
                <div className="mt-1">{draftReview.summary}</div>
              </div>
            ) : null}
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
                    {review ? <div className="mt-1 text-[11px] text-gray-500">{review.summary}</div> : null}
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>

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
