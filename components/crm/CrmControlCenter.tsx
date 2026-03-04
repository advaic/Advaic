"use client";

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

type NewProspectForm = {
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_role: string;
  city: string;
  region: string;
  website_url: string;
  object_focus: "miete" | "kauf" | "neubau" | "gemischt";
  priority: "A" | "B" | "C";
  fit_score: number;
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
  object_focus: "gemischt",
  priority: "B",
  fit_score: 70,
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
      if (!selectedProspectId && json.prospects?.[0]?.id) {
        setSelectedProspectId(json.prospects[0].id);
      }
    } catch (e: any) {
      setError(String(e?.message || "CRM-Daten konnten nicht geladen werden."));
    } finally {
      setLoading(false);
    }
  }, [loadNextAction, selectedProspectId]);

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
  }, [loadNextAction]);

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
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data.prospects, pipelineQuery, pipelineStage]);

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
      const res = await fetch("/api/crm/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Prospect konnte nicht erstellt werden.");
      }
      setForm(defaultForm);
      setSuccess(`Prospect „${json?.prospect?.company_name || "Neu"}“ wurde angelegt.`);
      await refresh();
      const createdId = String(json?.prospect?.id || "").trim();
      if (createdId) setSelectedProspectId(createdId);
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
        `Tracking-Sync abgeschlossen: ${Number(json?.synced_replies || 0)} neue Antworten erkannt.`,
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
            Fokus auf persönliche Relevanz: Hook und Pain-Point sauber eintragen.
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
                      <button
                        className="text-left hover:underline"
                        onClick={() => setSelectedProspectId(row.prospect_id)}
                      >
                        {row.company_name}
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
              {filteredProspects.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 align-top">
                  <td className="py-3 pr-3">
                    <button
                      className={`text-left ${selectedProspectId === p.id ? "font-semibold text-gray-900" : "font-medium text-gray-900"} hover:underline`}
                      onClick={() => setSelectedProspectId(p.id)}
                    >
                      {p.company_name}
                    </button>
                    <div className="text-xs text-gray-500">
                      {p.contact_name || "Kein Name"} · {p.contact_email || "keine E-Mail"} · {p.city || "Kein Ort"} · {p.object_focus}
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
              {filteredProspects.length === 0 ? (
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
