"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

type Row = {
  agent_id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  property_count: number;
  published_count: number;
  avg_readiness_score: number | null;
  low_quality_count: number;
  stale_count: number;
  autopilot_ready: boolean;
};

type Data = {
  ok: boolean;
  rows: Row[];
};

function readinessTone(score: number | null) {
  if (score === null) return "border-gray-200 bg-gray-50 text-gray-700";
  if (score < 70) return "border-red-200 bg-red-50 text-red-800";
  if (score < 85) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export default function ReadinessBoard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState("");

  const runFetch = async (silent?: boolean) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const res = await fetch(`/api/admin/readiness${qs}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || "readiness_fetch_failed"));
      setData(json as Data);
    } catch (e: any) {
      setError(String(e?.message || "readiness_fetch_failed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => data?.rows || [], [data]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin · Property Readiness</h1>
            <p className="mt-1 text-sm text-gray-600">
              Bewertet, ob genug Immobiliendaten für sichere automatische Antworten vorhanden sind.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/admin/rollout" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Rollout
            </Link>
            <Link href="/app/admin/quality" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Quality
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
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suche Agent/Company…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <button
              onClick={() => void runFetch(true)}
              className="rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-gray-800"
            >
              Suchen
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 bg-[#fbfbfc] px-4 py-3 text-sm text-gray-600">{rows.length} Agents</div>
          {loading ? (
            <div className="space-y-2 p-4">
              <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">Keine Daten.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white">
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Readiness</th>
                    <th className="px-4 py-3">Objekte</th>
                    <th className="px-4 py-3">Niedrige Qualität</th>
                    <th className="px-4 py-3">Veraltet</th>
                    <th className="px-4 py-3">Autopilot-fähig</th>
                    <th className="px-4 py-3">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.agent_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name || "—"}</div>
                        <div className="text-xs text-gray-600">{r.email || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${readinessTone(r.avg_readiness_score)}`}>
                          {r.avg_readiness_score === null ? "Keine Daten" : `${r.avg_readiness_score}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">{r.property_count} (publiziert {r.published_count})</td>
                      <td className="px-4 py-3">{r.low_quality_count}</td>
                      <td className="px-4 py-3">{r.stale_count}</td>
                      <td className="px-4 py-3">
                        {r.autopilot_ready ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">Ja</span>
                        ) : (
                          <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">Nein</span>
                        )}
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
