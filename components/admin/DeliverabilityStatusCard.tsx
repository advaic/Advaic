"use client";

import { useEffect, useState } from "react";

type DeliverabilityResponse = {
  ok: boolean;
  level: "ok" | "warning" | "critical";
  sender_from: string | null;
  sender_domain: string | null;
  dmarc_policy: string | null;
  checks: Array<{
    host: string;
    ok: boolean;
    details: string;
    error: string | null;
  }>;
  summary: {
    failed_sends_24h: number;
    deliverability_like_failures_24h: number;
    failed_samples: Array<{
      updated_at: string | null;
      send_error: string;
    }>;
  };
  recommendations: string[];
};

function tone(level: "ok" | "warning" | "critical") {
  if (level === "critical") return "border-red-200 bg-red-50 text-red-800";
  if (level === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export default function DeliverabilityStatusCard() {
  const [data, setData] = useState<DeliverabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/deliverability/status", {
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as DeliverabilityResponse | null;
        if (!res.ok || !json?.ok) {
          throw new Error(String((json as any)?.error || "deliverability_status_failed"));
        }
        if (active) setData(json);
      } catch (e: any) {
        if (active) setError(String(e?.message || "deliverability_status_failed"));
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
        Lade Deliverability-Status…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Deliverability-Status konnte nicht geladen werden: {error || "Unbekannter Fehler"}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Deliverability</div>
          <div className="mt-1 text-xs text-gray-600">
            Absender: {data.sender_from || "nicht gesetzt"}
          </div>
        </div>
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${tone(data.level)}`}>
          {data.level === "critical" ? "Kritisch" : data.level === "warning" ? "Auffällig" : "Stabil"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
          <div className="text-xs text-gray-600">Failed Sends (24h)</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{data.summary.failed_sends_24h}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
          <div className="text-xs text-gray-600">Deliverability-nahe Fehler (24h)</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {data.summary.deliverability_like_failures_24h}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
          <div className="text-xs text-gray-600">DMARC Policy</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{data.dmarc_policy || "–"}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {data.checks.map((check) => (
          <div key={check.host} className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-medium text-gray-900">{check.host}</div>
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${
                  check.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {check.ok ? "ok" : "fehlt"}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-600">{check.details}</div>
            {check.error ? <div className="mt-1 text-[11px] text-red-700">DNS-Fehler: {check.error}</div> : null}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium text-gray-900">Empfehlungen</div>
        <ul className="mt-2 space-y-1 text-xs text-gray-700">
          {data.recommendations.map((item, idx) => (
            <li key={`${idx}-${item}`} className="rounded-lg border border-gray-200 bg-[#fbfbfc] px-2 py-1.5">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

