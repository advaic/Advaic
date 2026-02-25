"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

type Row = {
  agent_id: string;
  agent_name: string | null;
  agent_email: string | null;
  company: string | null;
  inbound: number;
  drafts: number;
  sent_total: number;
  sent_auto: number;
  sent_after_approval: number;
  failed: number;
  queue_needs_approval: number;
  queue_needs_human: number;
  qa_total: number;
  qa_no_edit: number;
  qa_edited: number;
  feedback_helpful: number;
  feedback_not_helpful: number;
  feedback_negative_rate: number;
  correction_rate: number;
  failed_rate: number;
  median_response_mins: number | null;
  quality_score: number;
  risk: "low" | "medium" | "high";
};

type Data = {
  ok: boolean;
  days: number;
  count: number;
  rows: Row[];
};

function pct(v: number) {
  return `${Math.round(v * 1000) / 10}%`;
}

function riskPill(risk: Row["risk"]) {
  if (risk === "high") return "border-red-200 bg-red-50 text-red-800";
  if (risk === "medium") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export default function QualityCockpit() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState("");
  const [days, setDays] = useState(30);

  const runFetch = async (silent?: boolean) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const qs = new URLSearchParams();
      qs.set("days", String(days));
      if (q.trim()) qs.set("q", q.trim());
      const res = await fetch(`/api/admin/quality?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || "quality_fetch_failed"));
      setData(json as Data);
    } catch (e: any) {
      setError(String(e?.message || "quality_fetch_failed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const rows = useMemo(() => data?.rows || [], [data]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin · Quality Cockpit</h1>
            <p className="mt-1 text-sm text-gray-600">
              Qualitäts- und Risikoblick pro Agent: Korrekturquote, Fehlerrate, Response-Verhalten.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/admin/overview" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Overview
            </Link>
            <Link href="/app/admin/rollout" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Rollout
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suche Agent/Company…"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value={14}>Zeitraum: 14 Tage</option>
              <option value={30}>Zeitraum: 30 Tage</option>
              <option value={60}>Zeitraum: 60 Tage</option>
            </select>
            <button
              onClick={() => void runFetch(true)}
              className="rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-gray-800"
            >
              Anwenden
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 bg-[#fbfbfc] px-4 py-3 text-sm text-gray-600">
            {rows.length} Agents • Zeitraum {data?.days ?? days} Tage
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">Keine Daten.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white">
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Risiko</th>
                    <th className="px-4 py-3">Fehlerrate</th>
                    <th className="px-4 py-3">Korrekturquote</th>
                    <th className="px-4 py-3">Negatives Feedback</th>
                    <th className="px-4 py-3">Median Antwort</th>
                    <th className="px-4 py-3">Queue</th>
                    <th className="px-4 py-3">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.agent_id} className="border-b border-gray-100 align-top hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.agent_name || "—"}</div>
                        <div className="text-xs text-gray-600">{r.agent_email || "—"}</div>
                        <div className="text-xs text-gray-500">{r.company || "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{r.quality_score}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${riskPill(r.risk)}`}>{r.risk}</span>
                      </td>
                      <td className="px-4 py-3">{pct(r.failed_rate)}</td>
                      <td className="px-4 py-3">{pct(r.correction_rate)}</td>
                      <td className="px-4 py-3">
                        {pct(r.feedback_negative_rate)}
                        <div className="text-[11px] text-gray-500">
                          ({r.feedback_not_helpful}/{r.feedback_helpful + r.feedback_not_helpful})
                        </div>
                      </td>
                      <td className="px-4 py-3">{r.median_response_mins === null ? "—" : `${Math.round(r.median_response_mins)} Min`}</td>
                      <td className="px-4 py-3 text-xs">
                        Freigabe {r.queue_needs_approval} · Human {r.queue_needs_human}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/app/admin/agents/${r.agent_id}`} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50">
                          Agent öffnen
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
