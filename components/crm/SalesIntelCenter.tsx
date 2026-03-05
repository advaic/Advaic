"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADVAIC_SALES_SYSTEM,
  SALES_RESEARCH_ITEMS,
  SEGMENT_PLAYBOOKS,
  getPlaybookForSegment,
  inferSegmentFromProspect,
} from "@/lib/crm/salesIntelResearch";

type ProspectOption = {
  id: string;
  company_name: string;
  contact_name: string | null;
  city: string | null;
  object_focus: string | null;
  share_miete_percent: number | null;
  share_kauf_percent: number | null;
  active_listings_count: number | null;
  automation_readiness: string | null;
  fit_score: number;
  priority: "A" | "B" | "C";
  stage: string;
};

type AcqLogRow = {
  id: string;
  prospect_id: string | null;
  company_name: string | null;
  occurred_at: string;
  channel: string;
  action_type: string;
  segment_key: string | null;
  playbook_key: string | null;
  template_variant: string | null;
  cta_type: string | null;
  outcome: string | null;
  response_time_hours: number | null;
  personalization_depth: number | null;
  quality_self_score: number | null;
  quality_objective_score: number | null;
  failure_reason: string | null;
  winning_signal: string | null;
  hypothesis: string | null;
  analysis_note: string | null;
  postmortem_root_cause: string | null;
  postmortem_fix: string | null;
  postmortem_prevention: string | null;
};

type AnalysisResponse = {
  ok: boolean;
  days: number;
  summary: {
    total_actions: number;
    outbound_actions: number;
    reply_events: number;
    pilot_events: number;
    negative_events: number;
    touched_prospects: number;
    reply_rate_pct: number;
    pilot_rate_pct: number;
    negative_rate_pct: number;
    postmortem_compliance_pct: number;
    avg_quality_self_score: number | null;
    avg_quality_objective_score: number | null;
    quality_score_gap: number | null;
  };
  channel_metrics: Array<{
    channel: string;
    attempts: number;
    positive: number;
    negative: number;
    pending: number;
    positive_rate_pct: number;
    avg_response_hours: number | null;
    avg_personalization_depth: number | null;
    avg_quality_self_score: number | null;
    avg_quality_objective_score: number | null;
  }>;
  template_metrics: Array<{
    template_variant: string;
    attempts: number;
    positive_rate_pct: number;
  }>;
  segment_metrics: Array<{
    segment_key: string;
    attempts: number;
    positive_rate_pct: number;
    negative_rate_pct: number;
    avg_quality_objective_score: number | null;
    playbook_key: string | null;
    playbook_title: string | null;
  }>;
  playbook_metrics: Array<{
    playbook_key: string;
    attempts: number;
    positive_rate_pct: number;
    negative_rate_pct: number;
  }>;
  cta_metrics: Array<{
    cta_type: string;
    attempts: number;
    positive_rate_pct: number;
  }>;
  hypothesis_metrics: Array<{
    hypothesis: string;
    attempts: number;
    positive_rate_pct: number;
    negative_rate_pct: number;
  }>;
  top_failure_reasons: Array<{ label: string; count: number }>;
  top_winning_signals: Array<{ label: string; count: number }>;
  weekly_review: {
    this_week: {
      actions: number;
      outbound_actions: number;
      positive_rate_pct: number;
      negative_rate_pct: number;
      avg_quality_objective_score: number | null;
    };
    prev_week: {
      actions: number;
      outbound_actions: number;
      positive_rate_pct: number;
      negative_rate_pct: number;
      avg_quality_objective_score: number | null;
    };
    delta: {
      actions: number;
      positive_rate_pp: number;
      negative_rate_pp: number;
      quality_objective_delta: number;
    };
  };
  learning_recommendations: Array<{
    id: string;
    priority: "hoch" | "mittel" | "niedrig";
    title: string;
    reason: string;
    action: string;
    segment_key?: string;
  }>;
  insights: string[];
};

const CHANNEL_OPTIONS = [
  "email",
  "linkedin",
  "telefon",
  "kontaktformular",
  "meeting",
  "whatsapp",
  "sonstiges",
];

const ACTION_OPTIONS = [
  "outbound_sent",
  "outbound_manual",
  "reply_received",
  "no_reply",
  "followup_planned",
  "followup_sent",
  "call_booked",
  "call_completed",
  "objection_logged",
  "pilot_invited",
  "pilot_started",
  "pilot_won",
  "pilot_lost",
  "opt_out",
  "bounce",
];

const CTA_OPTIONS = [
  "kurze_mail_antwort",
  "15_min_call",
  "video_link",
  "formular_antwort",
  "linkedin_reply",
  "telefon_termin",
  "other",
];

const OUTCOME_OPTIONS = ["positive", "neutral", "negative", "pending"];

function formatDate(iso: string | null | undefined) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SalesIntelCenter({
  initialProspects,
  initialLogs,
  initialAnalysis,
}: {
  initialProspects: ProspectOption[];
  initialLogs: AcqLogRow[];
  initialAnalysis: AnalysisResponse | null;
}) {
  const [prospects] = useState<ProspectOption[]>(initialProspects);
  const [logs, setLogs] = useState<AcqLogRow[]>(initialLogs);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    prospect_id: initialProspects?.[0]?.id || "",
    occurred_at: toDatetimeLocal(new Date().toISOString()),
    channel: "email",
    action_type: "outbound_sent",
    template_variant: "",
    cta_type: "15_min_call",
    outcome: "pending",
    response_time_hours: "",
    personalization_depth: "80",
    quality_self_score: "80",
    failure_reason: "",
    postmortem_root_cause: "",
    postmortem_fix: "",
    postmortem_prevention: "",
    winning_signal: "",
    hypothesis: "",
    analysis_note: "",
  });

  const prospectMap = useMemo(() => {
    const map = new Map<string, ProspectOption>();
    for (const row of prospects) map.set(row.id, row);
    return map;
  }, [prospects]);

  const selectedProspect = useMemo(
    () => prospects.find((item) => item.id === form.prospect_id) || null,
    [prospects, form.prospect_id],
  );
  const inferredSegment = useMemo(() => {
    if (!selectedProspect) return "unspezifisch";
    return inferSegmentFromProspect(selectedProspect);
  }, [selectedProspect]);
  const inferredPlaybook = useMemo(
    () => getPlaybookForSegment(inferredSegment),
    [inferredSegment],
  );

  async function refreshLogs() {
    const res = await fetch("/api/crm/acq/log?limit=250", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      throw new Error(json?.details || json?.error || "Logs konnten nicht geladen werden.");
    }
    setLogs(Array.isArray(json.logs) ? json.logs : []);
  }

  async function refreshAnalysis() {
    const res = await fetch("/api/crm/acq/analysis?days=90", { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as AnalysisResponse;
    if (!res.ok || !json?.ok) {
      throw new Error((json as any)?.details || (json as any)?.error || "Analyse konnte nicht geladen werden.");
    }
    setAnalysis(json);
  }

  async function refreshAll() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refreshLogs(), refreshAnalysis()]);
    } catch (e: any) {
      setError(String(e?.message || "Aktualisierung fehlgeschlagen."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!analysis) {
      void refreshAnalysis().catch(() => null);
    }
  }, [analysis]);

  async function saveLog() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const isNegative =
        form.outcome === "negative" ||
        form.action_type === "bounce" ||
        form.action_type === "opt_out" ||
        form.action_type === "pilot_lost";
      if (isNegative) {
        const missing = [];
        if (!form.failure_reason.trim()) missing.push("Failure Reason");
        if (!form.analysis_note.trim()) missing.push("Analyse-Notiz");
        if (!form.postmortem_root_cause.trim()) missing.push("Postmortem: Root Cause");
        if (!form.postmortem_fix.trim()) missing.push("Postmortem: Korrekturmaßnahme");
        if (missing.length > 0) {
          throw new Error(`Für negative Outcomes fehlen Pflichtfelder: ${missing.join(", ")}`);
        }
      }

      const payload = {
        prospect_id: form.prospect_id || null,
        occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : new Date().toISOString(),
        channel: form.channel,
        action_type: form.action_type,
        template_variant: form.template_variant || null,
        cta_type: form.cta_type || null,
        outcome: form.outcome || null,
        response_time_hours: form.response_time_hours ? Number(form.response_time_hours) : null,
        personalization_depth: form.personalization_depth ? Number(form.personalization_depth) : null,
        quality_self_score: form.quality_self_score ? Number(form.quality_self_score) : null,
        failure_reason: form.failure_reason || null,
        postmortem_root_cause: form.postmortem_root_cause || null,
        postmortem_fix: form.postmortem_fix || null,
        postmortem_prevention: form.postmortem_prevention || null,
        winning_signal: form.winning_signal || null,
        hypothesis: form.hypothesis || null,
        analysis_note: form.analysis_note || null,
      };
      const res = await fetch("/api/crm/acq/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "Protokoll konnte nicht gespeichert werden.");
      }
      setSuccess("Akquise-Aktion protokolliert.");
      setForm((prev) => ({
        ...prev,
        outcome: "pending",
        response_time_hours: "",
        failure_reason: "",
        postmortem_root_cause: "",
        postmortem_fix: "",
        postmortem_prevention: "",
        winning_signal: "",
        analysis_note: "",
      }));
      await refreshAll();
    } catch (e: any) {
      setError(String(e?.message || "Speichern fehlgeschlagen."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Sales Intel Lab (Owner)</h1>
            <p className="mt-1 text-sm text-gray-600">
              Quellenbasierte Akquise-Strategie, operatives System und lückenlose Protokollierung mit Analyse.
            </p>
          </div>
          <button
            onClick={() => void refreshAll()}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Aktualisiere…" : "Daten aktualisieren"}
          </button>
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

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">3‑Schritt-System für deine Akquise</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {ADVAIC_SALES_SYSTEM.map((item) => (
            <article key={item.step} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-sm font-semibold text-gray-900">{item.step}</div>
              <p className="mt-1 text-sm text-gray-700">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Segment-Playbooks</h2>
        <p className="mt-1 text-sm text-gray-600">
          Jede Ansprache folgt einem klaren Segment mit Sequenz und Stop-Regeln.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {SEGMENT_PLAYBOOKS.map((playbook) => {
            const active = inferredPlaybook?.key === playbook.key;
            return (
              <article
                key={playbook.key}
                className={`rounded-xl border p-3 ${
                  active ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{playbook.title}</h3>
                  {active ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      aktiv für Auswahl
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-gray-700">{playbook.when_to_use}</p>
                <p className="mt-2 text-xs text-gray-800">
                  <span className="font-medium">Kernbotschaft:</span> {playbook.core_message}
                </p>
                <p className="mt-2 text-[11px] text-gray-600">
                  Sequenz: {playbook.sequence.join(" · ")}
                </p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Stop-Regeln: {playbook.stop_rules.join(" · ")}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Research-Basis (Web)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Jede Aussage hat eine Quelle und wird direkt in eine umsetzbare Sales-Regel übersetzt.
        </p>
        <div className="mt-4 space-y-3">
          {SALES_RESEARCH_ITEMS.map((item) => (
            <article key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-700">{item.claim}</p>
              <p className="mt-2 text-sm text-blue-900">
                <span className="font-medium">Für Advaic:</span> {item.implication_for_advaic}
              </p>
              <a
                href={item.source_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-xs text-gray-600 underline underline-offset-2"
              >
                {item.source_label}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-5">
          <h2 className="text-lg font-semibold text-gray-900">Akquise protokollieren</h2>
          <p className="mt-1 text-sm text-gray-600">
            Logge jede Aktion mit Variante, Hypothese, Outcome und Begründung.
          </p>
          <div className="mt-4 grid gap-3">
            <select
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              value={form.prospect_id}
              onChange={(e) => setForm((prev) => ({ ...prev, prospect_id: e.target.value }))}
            >
              {prospects.map((prospect) => (
                <option key={prospect.id} value={prospect.id}>
                  {prospect.company_name} · {prospect.contact_name || "Kein Name"} · Fit {prospect.fit_score}
                </option>
              ))}
            </select>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Automatisch erkannter Segment-Fit</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {inferredSegment}
                {inferredPlaybook ? ` · ${inferredPlaybook.title}` : ""}
              </div>
              <div className="mt-1 text-xs text-gray-700">
                {inferredPlaybook?.core_message ||
                  "Noch kein eindeutiges Playbook. Prospect-Daten weiter anreichern."}
              </div>
            </div>
            <input
              type="datetime-local"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={form.occurred_at}
              onChange={(e) => setForm((prev) => ({ ...prev, occurred_at: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.channel}
                onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value }))}
              >
                {CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.action_type}
                onChange={(e) => setForm((prev) => ({ ...prev, action_type: e.target.value }))}
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Template/Variante (z. B. email_personal_v1)"
              value={form.template_variant}
              onChange={(e) => setForm((prev) => ({ ...prev, template_variant: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.cta_type}
                onChange={(e) => setForm((prev) => ({ ...prev, cta_type: e.target.value }))}
              >
                {CTA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                value={form.outcome}
                onChange={(e) => setForm((prev) => ({ ...prev, outcome: e.target.value }))}
              >
                {OUTCOME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Antwortzeit (h)"
                type="number"
                min={0}
                step={0.1}
                value={form.response_time_hours}
                onChange={(e) => setForm((prev) => ({ ...prev, response_time_hours: e.target.value }))}
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Personalisierung 0-100"
                type="number"
                min={0}
                max={100}
                value={form.personalization_depth}
                onChange={(e) => setForm((prev) => ({ ...prev, personalization_depth: e.target.value }))}
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Qualität 0-100"
                type="number"
                min={0}
                max={100}
                value={form.quality_self_score}
                onChange={(e) => setForm((prev) => ({ ...prev, quality_self_score: e.target.value }))}
              />
            </div>
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Hypothese"
              value={form.hypothesis}
              onChange={(e) => setForm((prev) => ({ ...prev, hypothesis: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Failure Reason"
                value={form.failure_reason}
                onChange={(e) => setForm((prev) => ({ ...prev, failure_reason: e.target.value }))}
              />
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Winning Signal"
                value={form.winning_signal}
                onChange={(e) => setForm((prev) => ({ ...prev, winning_signal: e.target.value }))}
              />
            </div>
            <textarea
              className="min-h-[90px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Analyse-Notiz (warum hat es funktioniert / nicht funktioniert?)"
              value={form.analysis_note}
              onChange={(e) => setForm((prev) => ({ ...prev, analysis_note: e.target.value }))}
            />
            {form.outcome === "negative" || form.action_type === "bounce" || form.action_type === "opt_out" || form.action_type === "pilot_lost" ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <div className="text-xs font-medium text-rose-700">
                  Postmortem ist bei negativem Outcome verpflichtend
                </div>
                <div className="mt-2 grid gap-2">
                  <input
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm"
                    placeholder="Root Cause (Pflicht)"
                    value={form.postmortem_root_cause}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, postmortem_root_cause: e.target.value }))
                    }
                  />
                  <input
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm"
                    placeholder="Korrekturmaßnahme (Pflicht)"
                    value={form.postmortem_fix}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, postmortem_fix: e.target.value }))
                    }
                  />
                  <input
                    className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm"
                    placeholder="Prävention (optional, aber empfohlen)"
                    value={form.postmortem_prevention}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, postmortem_prevention: e.target.value }))
                    }
                  />
                </div>
              </div>
            ) : null}
            <button
              onClick={() => void saveLog()}
              disabled={saving}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
            >
              {saving ? "Speichere…" : "Akquise-Aktion speichern"}
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-7">
          <h2 className="text-lg font-semibold text-gray-900">Analyse: was funktioniert und warum</h2>
          {!analysis ? (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
              Noch keine Analyse verfügbar.
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-6">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Aktionen</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">{analysis.summary.total_actions}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Reply-Rate</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">{analysis.summary.reply_rate_pct}%</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Pilot-Rate</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">{analysis.summary.pilot_rate_pct}%</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Negative Rate</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">{analysis.summary.negative_rate_pct}%</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Postmortem-Quote</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {analysis.summary.postmortem_compliance_pct}%
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Objektiver Qualitätsscore</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {analysis.summary.avg_quality_objective_score ?? "–"}
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Gap zu Self-Score: {analysis.summary.quality_score_gap ?? "–"}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-3">
                  <h3 className="text-sm font-semibold text-gray-900">Top Kanal-Performance</h3>
                  <div className="mt-2 space-y-2">
                    {analysis.channel_metrics.slice(0, 5).map((row) => (
                      <div key={row.channel} className="rounded-lg bg-gray-50 px-2 py-1.5 text-xs">
                        {row.channel}: {row.positive_rate_pct}% positiv · Ø Reply{" "}
                        {row.avg_response_hours === null ? "–" : `${row.avg_response_hours}h`}
                        {" · "}Objektiv {row.avg_quality_objective_score ?? "–"}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <h3 className="text-sm font-semibold text-gray-900">Top Varianten</h3>
                  <div className="mt-2 space-y-2">
                    {analysis.template_metrics.slice(0, 5).map((row) => (
                      <div key={row.template_variant} className="rounded-lg bg-gray-50 px-2 py-1.5 text-xs">
                        {row.template_variant}: {row.positive_rate_pct}% positiv ({row.attempts} Aktionen)
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-3">
                  <h3 className="text-sm font-semibold text-gray-900">Segment-Leistung</h3>
                  <div className="mt-2 space-y-2">
                    {analysis.segment_metrics.length === 0 ? (
                      <div className="text-xs text-gray-600">Noch keine Segmentdaten vorhanden.</div>
                    ) : (
                      analysis.segment_metrics.slice(0, 6).map((row) => (
                        <div key={row.segment_key} className="rounded-lg bg-gray-50 px-2 py-1.5 text-xs">
                          <span className="font-medium text-gray-900">{row.segment_key}</span>:{" "}
                          {row.positive_rate_pct}% positiv / {row.negative_rate_pct}% negativ ·{" "}
                          Obj. {row.avg_quality_objective_score ?? "–"}
                          {row.playbook_title ? ` · ${row.playbook_title}` : ""}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <h3 className="text-sm font-semibold text-gray-900">Weekly Growth Review</h3>
                  <div className="mt-2 space-y-2 text-xs">
                    <div className="rounded-lg bg-gray-50 px-2 py-1.5 text-gray-800">
                      Diese Woche: {analysis.weekly_review.this_week.actions} Aktionen ·{" "}
                      {analysis.weekly_review.this_week.positive_rate_pct}% positiv ·{" "}
                      {analysis.weekly_review.this_week.negative_rate_pct}% negativ
                    </div>
                    <div className="rounded-lg bg-gray-50 px-2 py-1.5 text-gray-800">
                      Vorwoche: {analysis.weekly_review.prev_week.actions} Aktionen ·{" "}
                      {analysis.weekly_review.prev_week.positive_rate_pct}% positiv ·{" "}
                      {analysis.weekly_review.prev_week.negative_rate_pct}% negativ
                    </div>
                    <div className="rounded-lg bg-blue-50 px-2 py-1.5 text-blue-900">
                      Delta: Aktionen {analysis.weekly_review.delta.actions >= 0 ? "+" : ""}
                      {analysis.weekly_review.delta.actions} · Positiv{" "}
                      {analysis.weekly_review.delta.positive_rate_pp >= 0 ? "+" : ""}
                      {analysis.weekly_review.delta.positive_rate_pp}pp · Negativ{" "}
                      {analysis.weekly_review.delta.negative_rate_pp >= 0 ? "+" : ""}
                      {analysis.weekly_review.delta.negative_rate_pp}pp · Qualität{" "}
                      {analysis.weekly_review.delta.quality_objective_delta >= 0 ? "+" : ""}
                      {analysis.weekly_review.delta.quality_objective_delta}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-3">
                  <h3 className="text-sm font-semibold text-gray-900">Häufigste Failure Reasons</h3>
                  <div className="mt-2 space-y-2">
                    {analysis.top_failure_reasons.length === 0 ? (
                      <div className="text-xs text-gray-600">Noch keine Einträge.</div>
                    ) : (
                      analysis.top_failure_reasons.map((row) => (
                        <div key={row.label} className="rounded-lg bg-rose-50 px-2 py-1.5 text-xs text-rose-900">
                          {row.label} ({row.count}x)
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <h3 className="text-sm font-semibold text-gray-900">Häufigste Winning Signals</h3>
                  <div className="mt-2 space-y-2">
                    {analysis.top_winning_signals.length === 0 ? (
                      <div className="text-xs text-gray-600">Noch keine Einträge.</div>
                    ) : (
                      analysis.top_winning_signals.map((row) => (
                        <div key={row.label} className="rounded-lg bg-emerald-50 px-2 py-1.5 text-xs text-emerald-900">
                          {row.label} ({row.count}x)
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 p-3">
                <h3 className="text-sm font-semibold text-gray-900">Automatische Lernempfehlungen</h3>
                <div className="mt-2 space-y-2">
                  {analysis.learning_recommendations.length === 0 ? (
                    <div className="text-xs text-gray-600">
                      Noch keine Lernempfehlungen. Mit mehr Daten werden konkrete Maßnahmen erzeugt.
                    </div>
                  ) : (
                    analysis.learning_recommendations.map((item) => (
                      <article key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              item.priority === "hoch"
                                ? "bg-rose-100 text-rose-700"
                                : item.priority === "mittel"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-sky-100 text-sky-700"
                            }`}
                          >
                            {item.priority}
                          </span>
                          <span className="font-semibold text-gray-900">{item.title}</span>
                        </div>
                        <p className="mt-1 text-gray-700">{item.reason}</p>
                        <p className="mt-1 text-gray-800">
                          <span className="font-medium">Empfehlung:</span> {item.action}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 p-3">
                <h3 className="text-sm font-semibold text-gray-900">Automatische Erkenntnisse</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {analysis.insights.map((insight) => (
                    <li key={insight}>• {insight}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Letzte Protokolle</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-3">Zeit</th>
                <th className="py-2 pr-3">Firma</th>
                <th className="py-2 pr-3">Kanal</th>
                <th className="py-2 pr-3">Aktion</th>
                <th className="py-2 pr-3">Segment</th>
                <th className="py-2 pr-3">Variante</th>
                <th className="py-2 pr-3">Outcome</th>
                <th className="py-2 pr-3">Obj. Score</th>
                <th className="py-2">Warum</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 60).map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="py-2 pr-3 text-gray-600">{formatDate(row.occurred_at)}</td>
                  <td className="py-2 pr-3 text-gray-900">
                    {row.company_name || prospectMap.get(String(row.prospect_id || ""))?.company_name || "–"}
                  </td>
                  <td className="py-2 pr-3 text-gray-700">{row.channel}</td>
                  <td className="py-2 pr-3 text-gray-700">{row.action_type}</td>
                  <td className="py-2 pr-3 text-gray-700">{row.segment_key || "–"}</td>
                  <td className="py-2 pr-3 text-gray-700">{row.template_variant || "–"}</td>
                  <td className="py-2 pr-3 text-gray-700">{row.outcome || "–"}</td>
                  <td className="py-2 pr-3 text-gray-700">{row.quality_objective_score ?? "–"}</td>
                  <td className="py-2 text-gray-600">
                    {row.winning_signal || row.failure_reason || row.analysis_note || "–"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-sm text-gray-500">
                    Noch keine Protokolle vorhanden.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
