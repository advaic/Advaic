"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, PauseCircle, PlayCircle, RefreshCw, ShieldCheck } from "lucide-react";

type OpsStatus = {
  ok: boolean;
  generated_at: string;
  level: "ok" | "warning" | "critical";
  summary: {
    critical_alerts: number;
    warning_alerts: number;
    stale_pipelines: number;
  };
  control: {
    pause_all: boolean;
    pause_reply_ready_send: boolean;
    pause_followups: boolean;
    pause_onboarding_recovery: boolean;
    pause_outlook_fetch: boolean;
    reason: string | null;
    updated_at: string | null;
  };
  pipelines: Array<{
    key: string;
    label: string;
    stale: boolean;
    last_run_at: string | null;
    status: string;
    duration_ms: number | null;
    processed: number;
    success: number;
    failed: number;
    skipped: number;
  }>;
  alerts: Array<{
    alert_key: string;
    severity: "warning" | "critical";
    status: "open" | "resolved";
    first_opened_at: string | null;
    last_fired_at: string | null;
    resolved_at: string | null;
    last_payload?: {
      title?: string;
      body?: string;
      deep_link?: string;
    } | null;
  }>;
};

function toneClass(level: "ok" | "warning" | "critical") {
  if (level === "critical") return "border-red-200 bg-red-50 text-red-800";
  if (level === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function fmtTs(value: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "–";
  return date.toLocaleString("de-DE");
}

export default function OpsControlCenter() {
  const [data, setData] = useState<OpsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const res = await fetch("/api/admin/ops/status", { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as OpsStatus | null;
    if (!res.ok || !json?.ok) {
      throw new Error(String((json as any)?.error || "ops_status_load_failed"));
    }
    setData(json);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    load()
      .catch((e: any) => {
        if (!active) return;
        setError(String(e?.message || "ops_status_load_failed"));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeAlerts = useMemo(
    () =>
      (data?.alerts || []).filter(
        (a) => String(a.status || "").toLowerCase() === "open",
      ),
    [data?.alerts],
  );

  const runControl = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/admin/ops/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok !== true) {
        throw new Error(String(json?.error || "ops_control_failed"));
      }
      await load();
    } catch (e: any) {
      setError(String(e?.message || "ops_control_failed"));
    } finally {
      setBusy(false);
    }
  };

  const triggerAlerts = async () => {
    setBusy(true);
    setError(null);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/admin/ops/alerts/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_pause: true }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.ok !== true) {
        throw new Error(String(json?.error || "ops_alert_trigger_failed"));
      }
      setTriggerResult(
        `Alerts geprüft: ${Number(json?.alerts?.length || 0)} aktiv, ${Number(json?.fired || 0)} neu gesendet.`,
      );
      await load();
    } catch (e: any) {
      setError(String(e?.message || "ops_alert_trigger_failed"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
        Lädt Ops-Status…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Ops-Status konnte nicht geladen werden.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">Betriebsstatus</div>
            <div className="mt-1 text-xs text-gray-600">
              Letztes Update: {fmtTs(data.generated_at)}
            </div>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneClass(data.level)}`}>
            {data.level === "critical" ? "Kritisch" : data.level === "warning" ? "Auffällig" : "Stabil"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Stat label="Kritische Alerts" value={data.summary.critical_alerts} />
          <Stat label="Warnungen" value={data.summary.warning_alerts} />
          <Stat label="Stale Pipelines" value={data.summary.stale_pipelines} />
          <Stat label="Notfall-Pause" value={data.control.pause_all ? "Aktiv" : "Aus"} />
        </div>

        {data.control.reason ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Letzter Grund: {data.control.reason}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="text-sm font-semibold text-gray-900">Notfall-Steuerung</div>
        <div className="mt-1 text-xs text-gray-600">
          Nutze diese Schalter, wenn Versand oder Follow-ups kritisch auffällig sind.
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Grund (optional)"
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => runControl({ action: "pause_all", reason: note })}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
          >
            <PauseCircle className="h-4 w-4" />
            Alles pausieren
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => runControl({ action: "resume_all", reason: note })}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
          >
            <PlayCircle className="h-4 w-4" />
            Alles fortsetzen
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={triggerAlerts}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Alert-Check jetzt ausführen
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <PipelineToggle
            label="Reply-Ready Send"
            paused={data.control.pause_reply_ready_send}
            busy={busy}
            onPause={() =>
              runControl({ action: "pause_pipeline", pipeline: "reply_ready_send", reason: note })
            }
            onResume={() =>
              runControl({ action: "resume_pipeline", pipeline: "reply_ready_send", reason: note })
            }
          />
          <PipelineToggle
            label="Follow-ups"
            paused={data.control.pause_followups}
            busy={busy}
            onPause={() =>
              runControl({ action: "pause_pipeline", pipeline: "followups", reason: note })
            }
            onResume={() =>
              runControl({ action: "resume_pipeline", pipeline: "followups", reason: note })
            }
          />
          <PipelineToggle
            label="Onboarding-Recovery"
            paused={data.control.pause_onboarding_recovery}
            busy={busy}
            onPause={() =>
              runControl({ action: "pause_pipeline", pipeline: "onboarding_recovery", reason: note })
            }
            onResume={() =>
              runControl({ action: "resume_pipeline", pipeline: "onboarding_recovery", reason: note })
            }
          />
          <PipelineToggle
            label="Outlook-Fetch"
            paused={data.control.pause_outlook_fetch}
            busy={busy}
            onPause={() =>
              runControl({ action: "pause_pipeline", pipeline: "outlook_fetch", reason: note })
            }
            onResume={() =>
              runControl({ action: "resume_pipeline", pipeline: "outlook_fetch", reason: note })
            }
          />
        </div>

        {triggerResult ? (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {triggerResult}
          </div>
        ) : null}
        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="text-sm font-semibold text-gray-900">Pipeline-Läufe</div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {data.pipelines.map((row) => (
            <div key={row.key} className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-gray-900">{row.label}</div>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
                    row.status === "error"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : row.status === "warning" || row.stale
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : row.status === "paused"
                          ? "border-gray-300 bg-gray-100 text-gray-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  {row.stale ? "stale" : row.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-600">Zuletzt: {fmtTs(row.last_run_at)}</div>
              <div className="mt-2 text-xs text-gray-700">
                {row.processed} verarbeitet · {row.success} ok · {row.failed} fehlerhaft · {row.skipped} übersprungen
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="text-sm font-semibold text-gray-900">Aktive Alerts</div>
        {activeAlerts.length === 0 ? (
          <div className="mt-2 text-sm text-emerald-700 inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Keine offenen Alerts.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {activeAlerts.map((a) => (
              <div
                key={a.alert_key}
                className={`rounded-xl border px-3 py-2 ${
                  a.severity === "critical"
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-gray-900">
                    {(a.last_payload?.title || a.alert_key).toString()}
                  </div>
                  <span className="text-xs text-gray-700">
                    {a.severity === "critical" ? (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        kritisch
                      </span>
                    ) : (
                      "warnung"
                    )}
                  </span>
                </div>
                {a.last_payload?.body ? (
                  <div className="mt-1 text-xs text-gray-700">{String(a.last_payload.body)}</div>
                ) : null}
                <div className="mt-1 text-[11px] text-gray-600">
                  Eröffnet: {fmtTs(a.first_opened_at)} · zuletzt gesendet: {fmtTs(a.last_fired_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function PipelineToggle({
  label,
  paused,
  busy,
  onPause,
  onResume,
}: {
  label: string;
  paused: boolean;
  busy: boolean;
  onPause: () => void;
  onResume: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-gray-800">{label}</div>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${
            paused
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {paused ? "pausiert" : "aktiv"}
        </span>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={busy || paused}
          onClick={onPause}
          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-800 disabled:opacity-50"
        >
          Pause
        </button>
        <button
          type="button"
          disabled={busy || !paused}
          onClick={onResume}
          className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800 disabled:opacity-50"
        >
          Fortsetzen
        </button>
      </div>
    </div>
  );
}

