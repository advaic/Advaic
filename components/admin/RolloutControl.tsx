"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

type Mode = "observe" | "assist" | "autopilot";

type Row = {
  agent_id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  mode: Mode;
  onboarding_completed: boolean;
  autosend_enabled: boolean;
  followups_enabled_default: boolean;
  reply_mode: string | null;
  auto_send_min_confidence: number | null;
  sent_7d: number;
  failed_7d: number;
  needs_human_7d: number;
  failed_rate_7d: number;
  risk: "low" | "medium" | "high";
  settings_updated_at: string | null;
};

type Data = {
  ok: boolean;
  since: string;
  rows: Row[];
};

function riskPill(risk: Row["risk"]) {
  if (risk === "high") return "border-red-200 bg-red-50 text-red-800";
  if (risk === "medium") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export default function RolloutControl() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");

  const runFetch = async (silent?: boolean) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/rollout", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || "rollout_fetch_failed"));
      setData(json as Data);
    } catch (e: any) {
      setError(String(e?.message || "rollout_fetch_failed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void runFetch();
  }, []);

  const setMode = async (agentId: string, mode: Mode) => {
    const key = `${agentId}:${mode}`;
    if (busy[key]) return;
    setBusy((prev) => ({ ...prev, [key]: true }));
    setError(null);
    try {
      const res = await fetch("/api/admin/rollout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_mode", agent_id: agentId, mode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || "set_mode_failed"));
      await runFetch(true);
    } catch (e: any) {
      setError(String(e?.message || "set_mode_failed"));
    } finally {
      setBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  const rows = useMemo(() => {
    const base = data?.rows || [];
    const term = q.trim().toLowerCase();
    if (!term) return base;
    return base.filter((r) =>
      `${r.name || ""} ${r.email || ""} ${r.company || ""}`.toLowerCase().includes(term),
    );
  }, [data, q]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin · Rollout Control</h1>
            <p className="mt-1 text-sm text-gray-600">
              Stufenweiser Rollout: Beobachten, Assist, Autopilot pro Agent.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/admin/quality" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Quality
            </Link>
            <Link href="/app/admin/readiness" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Readiness
            </Link>
            <button
              onClick={() => void runFetch(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Aktualisieren
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suche Agent/Company…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 bg-[#fbfbfc] px-4 py-3 text-sm text-gray-600">
            {rows.length} Agents
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">Keine Treffer.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {rows.map((r) => (
                <div key={r.agent_id} className="px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{r.name || "—"} <span className="text-xs font-normal text-gray-500">• {r.email || "—"}</span></div>
                      <div className="text-xs text-gray-600">{r.company || "—"}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        7 Tage: sent {r.sent_7d} · failed {r.failed_7d} · needs_human {r.needs_human_7d}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${riskPill(r.risk)}`}>{r.risk}</span>
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                        Modus: {r.mode}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => void setMode(r.agent_id, "observe")}
                      disabled={!!busy[`${r.agent_id}:observe`]}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                    >
                      Beobachten
                    </button>
                    <button
                      onClick={() => void setMode(r.agent_id, "assist")}
                      disabled={!!busy[`${r.agent_id}:assist`]}
                      className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                    >
                      Assist
                    </button>
                    <button
                      onClick={() => void setMode(r.agent_id, "autopilot")}
                      disabled={!!busy[`${r.agent_id}:autopilot`]}
                      className="rounded-md border border-gray-900 bg-gray-900 px-2 py-1 text-xs font-medium text-amber-200 hover:bg-gray-800 disabled:opacity-60"
                    >
                      Autopilot
                    </button>
                    <Link href={`/app/admin/agents/${r.agent_id}`} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50">
                      Agent öffnen
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
