"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

type AuditEntry = {
  ts: string | null;
  category: string;
  agent_id: string | null;
  lead_id: string | null;
  message_id: string | null;
  summary: string;
  details: string | null;
};

type Data = {
  ok: boolean;
  days: number;
  since: string;
  metrics: {
    auto_sent: number;
    approval_sent: number;
    failed_send: number;
    queued_needs_approval: number;
    queued_needs_human: number;
    ignored_email_classifications: number;
    support_tickets_open: number;
    support_tickets_in_progress: number;
    support_tickets_resolved: number;
  };
  trust_notes: string[];
  audit: AuditEntry[];
};

function fmt(v?: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("de-DE");
  } catch {
    return String(v);
  }
}

export default function ComplianceCenter() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [days, setDays] = useState(30);

  const runFetch = async (silent?: boolean) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/compliance?days=${days}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json?.error || "compliance_fetch_failed"));
      setData(json as Data);
    } catch (e: any) {
      setError(String(e?.message || "compliance_fetch_failed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const m = data?.metrics;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin · Compliance & Trust Center</h1>
            <p className="mt-1 text-sm text-gray-600">
              Auditierbarkeit, Guardrails und Exporte für Support- und Versandentscheidungen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/admin/tickets" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Tickets
            </Link>
            <a
              href="/api/admin/compliance/export?kind=tickets"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Export Tickets CSV
            </a>
            <a
              href="/api/admin/compliance/export?kind=audit"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Export Audit CSV
            </a>
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
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value={30}>Zeitraum: 30 Tage</option>
            <option value={60}>Zeitraum: 60 Tage</option>
            <option value={90}>Zeitraum: 90 Tage</option>
          </select>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Auto gesendet" value={m?.auto_sent ?? 0} />
          <MetricCard label="Nach Freigabe gesendet" value={m?.approval_sent ?? 0} />
          <MetricCard label="Failed Sends" value={m?.failed_send ?? 0} />
          <MetricCard label="Queue Freigabe" value={m?.queued_needs_approval ?? 0} />
          <MetricCard label="Queue Human" value={m?.queued_needs_human ?? 0} />
          <MetricCard label="Ignorierte Mails" value={m?.ignored_email_classifications ?? 0} />
          <MetricCard label="Tickets offen" value={m?.support_tickets_open ?? 0} />
          <MetricCard label="Tickets in Arbeit" value={m?.support_tickets_in_progress ?? 0} />
          <MetricCard label="Tickets gelöst" value={m?.support_tickets_resolved ?? 0} />
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold">Trust Notes</div>
          <div className="mt-2 space-y-1 text-sm text-gray-700">
            {(data?.trust_notes || []).map((n, idx) => (
              <div key={idx}>• {n}</div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 bg-[#fbfbfc] px-4 py-3 text-sm text-gray-600">
            Audit Feed ({data?.audit?.length ?? 0})
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(data?.audit || []).map((a, idx) => (
                <div key={`${a.category}:${a.ts || idx}`} className="px-4 py-3">
                  <div className="text-sm font-medium">{a.summary}</div>
                  <div className="mt-1 text-xs text-gray-600">
                    {fmt(a.ts)} • category={a.category} • agent={a.agent_id || "—"} • lead={a.lead_id || "—"} • message={a.message_id || "—"}
                  </div>
                  {a.details ? <div className="mt-1 text-xs text-gray-700">{a.details}</div> : null}
                </div>
              ))}
              {!loading && (data?.audit || []).length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-600">Keine Audit-Einträge im Zeitraum.</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
