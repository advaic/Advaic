"use client";

import { useCallback, useMemo, useState } from "react";

type Prospect = {
  id: string;
  company_name: string;
  contact_name: string | null;
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
  priority: "A" | "B" | "C";
  fit_score: number;
  recommended_action: string | null;
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

type NewProspectForm = {
  company_name: string;
  contact_name: string;
  city: string;
  object_focus: "miete" | "kauf" | "neubau" | "gemischt";
  priority: "A" | "B" | "C";
  fit_score: number;
  preferred_channel: "email" | "telefon" | "linkedin" | "kontaktformular";
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
  city: "",
  object_focus: "gemischt",
  priority: "B",
  fit_score: 70,
  preferred_channel: "email",
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
  const [error, setError] = useState<string | null>(initialData.ok ? null : initialData.details || initialData.error || null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/overview", { cache: "no-store" });
      const json = (await res.json()) as OverviewResponse;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.details || json?.error || "CRM-Daten konnten nicht geladen werden.");
      }
      setData(json);
    } catch (e: any) {
      setError(String(e?.message || "CRM-Daten konnten nicht geladen werden."));
    } finally {
      setLoading(false);
    }
  }, []);

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
    } catch (e: any) {
      setError(String(e?.message || "Event konnte nicht gespeichert werden."));
    } finally {
      setSaving(null);
    }
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
          <button
            onClick={() => void refresh()}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Aktualisiere…" : "Aktualisieren"}
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
                placeholder="Stadt"
                value={form.city}
                onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
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
                  <th className="py-2">Zeitpunkt</th>
                </tr>
              </thead>
              <tbody>
                {(data.followup_due || []).map((row) => (
                  <tr key={row.prospect_id} className="border-t border-gray-100">
                    <td className="py-2 pr-3 font-medium text-gray-900">{row.company_name}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.contact_name || "–"}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.priority}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.recommended_action || "–"}</td>
                    <td className="py-2 text-gray-600">{formatDate(row.recommended_at)}</td>
                  </tr>
                ))}
                {(data.followup_due || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-5 text-sm text-gray-500">
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
        <h2 className="text-lg font-semibold text-gray-900">Prospects Pipeline</h2>
        <p className="mt-1 text-sm text-gray-600">
          Stage direkt pflegen und Kernereignisse in einem Klick dokumentieren.
        </p>
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
              {(data.prospects || []).map((p) => (
                <tr key={p.id} className="border-t border-gray-100 align-top">
                  <td className="py-3 pr-3">
                    <div className="font-medium text-gray-900">{p.company_name}</div>
                    <div className="text-xs text-gray-500">
                      {p.contact_name || "Kein Name"} · {p.city || "Kein Ort"} · {p.object_focus}
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
              {(data.prospects || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-sm text-gray-500">
                    Noch keine Prospects vorhanden. Lege oben den ersten Tester-Kandidaten an.
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
