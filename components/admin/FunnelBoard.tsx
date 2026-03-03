"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Minus,
  RefreshCw,
} from "lucide-react";

type StepRow = {
  step: number;
  label: string;
  reached_agents: number;
  next_step_agents: number | null;
  conversion_to_next: number | null;
  drop_off_agents: number | null;
};

type EventRow = {
  key: string;
  label: string;
  total: number;
  unique_agents: number;
};

type AgentRow = {
  agent_id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  highest_step: number;
  started: boolean;
  completed: boolean;
  event_count: number;
  completion_hours: number | null;
  last_event_at: string | null;
};

type Data = {
  ok: boolean;
  days: number;
  since: string;
  count_agents: number;
  summary: {
    started_agents: number;
    completed_agents: number;
    completion_rate: number | null;
    completion_rate_delta: number | null;
    median_completion_hours: number | null;
    first_value_agents: number;
    first_value_rate: number | null;
    first_value_rate_delta: number | null;
    first_value_in_30m_rate: number | null;
    median_first_value_minutes: number | null;
    active_agents_with_events: number;
  };
  steps: StepRow[];
  events: EventRow[];
  billing: {
    summary: {
      total_gate_triggered: number;
      total_cta_clicked: number;
      total_page_viewed: number;
      total_checkout_started: number;
      total_checkout_success: number;
      overall_to_checkout_from_page: number | null;
      overall_to_success_from_checkout: number | null;
      overall_to_success_from_page: number | null;
    };
    previous_window: {
      page_viewed: number;
      checkout_started: number;
      checkout_success: number;
    };
    deltas: {
      checkout_started_abs: number;
      checkout_started_pct: number | null;
    };
    spotlight: {
      top_source_by_checkout: SourceRow | null;
      best_source_by_success: SourceRow | null;
      highest_leakage_source:
        | (SourceRow & { leakage: number })
        | null;
    };
    groups: SourceGroupRow[];
    sources: Array<{
      source: string;
      gate_triggered: number;
      cta_clicked: number;
      page_viewed: number;
      checkout_started: number;
      checkout_success: number;
      cta_from_gate: number | null;
      page_from_cta: number | null;
      checkout_from_cta: number | null;
      to_checkout_from_page: number | null;
      to_success_from_checkout: number | null;
      to_success_from_page: number | null;
    }>;
  };
  rows: AgentRow[];
};

type SourceRow = {
  source: string;
  gate_triggered: number;
  cta_clicked: number;
  page_viewed: number;
  checkout_started: number;
  checkout_success: number;
  cta_from_gate: number | null;
  page_from_cta: number | null;
  checkout_from_cta: number | null;
  to_checkout_from_page: number | null;
  to_success_from_checkout: number | null;
  to_success_from_page: number | null;
};

type SourceGroupRow = {
  group: string;
  sources: number;
  gate_triggered: number;
  cta_clicked: number;
  page_viewed: number;
  checkout_started: number;
  checkout_success: number;
  cta_from_gate: number | null;
  page_from_cta: number | null;
  checkout_from_cta: number | null;
  to_checkout_from_page: number | null;
  to_success_from_checkout: number | null;
  to_success_from_page: number | null;
};

type PublicCount = {
  key: string;
  count: number;
};

type PublicData = {
  ok: boolean;
  window_days: number;
  since: string;
  total_events: number;
  event_counts: PublicCount[];
  cta_variant_counts: PublicCount[];
  top_paths: PublicCount[];
};

function fmtPct(v: number | null) {
  if (v === null || !Number.isFinite(v)) return "–";
  return `${Math.round(v * 1000) / 10}%`;
}

function fmtHours(v: number | null) {
  if (v === null || !Number.isFinite(v)) return "–";
  return `${Math.round(v * 10) / 10} h`;
}

function fmtMinutes(v: number | null) {
  if (v === null || !Number.isFinite(v)) return "–";
  return `${Math.round(v)} Min`;
}

function StepPill({ row }: { row: AgentRow }) {
  if (row.completed) {
    return (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
        Abgeschlossen
      </span>
    );
  }
  if (!row.started) {
    return (
      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
        Nicht gestartet
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-900">
      Schritt {Math.max(1, row.highest_step)}
    </span>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Minus className="h-3 w-3" />
        Kein Vergleich
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
        <ArrowUpRight className="h-3.5 w-3.5" />
        +{Math.round(value * 1000) / 10} pp
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-700">
        <ArrowDownRight className="h-3.5 w-3.5" />
        {Math.round(value * 1000) / 10} pp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
      <Minus className="h-3 w-3" />
      0.0 pp
    </span>
  );
}

export default function FunnelBoard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [publicData, setPublicData] = useState<PublicData | null>(null);
  const [publicError, setPublicError] = useState<string | null>(null);
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
      setPublicError(null);

      const [mainRes, publicRes] = await Promise.all([
        fetch(`/api/admin/funnel?${qs.toString()}`, { cache: "no-store" }),
        fetch(`/api/admin/funnel/public?days=${days}`, { cache: "no-store" }),
      ]);

      const mainJson = await mainRes.json().catch(() => ({}));
      if (!mainRes.ok) {
        throw new Error(String((mainJson as any)?.error || "funnel_fetch_failed"));
      }
      setData(mainJson as Data);

      const publicJson = await publicRes.json().catch(() => ({}));
      if (!publicRes.ok) {
        setPublicError(String((publicJson as any)?.error || "public_funnel_fetch_failed"));
        setPublicData(null);
      } else {
        setPublicData(publicJson as PublicData);
      }
    } catch (e: any) {
      setError(String(e?.message || "funnel_fetch_failed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void runFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = useMemo(() => data?.steps || [], [data]);
  const events = useMemo(
    () => [...(data?.events || [])].sort((a, b) => b.total - a.total),
    [data],
  );
  const rows = useMemo(() => data?.rows || [], [data]);
  const billing = useMemo(
    () =>
      data?.billing || {
        summary: {
          total_gate_triggered: 0,
          total_cta_clicked: 0,
          total_page_viewed: 0,
          total_checkout_started: 0,
          total_checkout_success: 0,
          overall_to_checkout_from_page: null,
          overall_to_success_from_checkout: null,
          overall_to_success_from_page: null,
        },
        previous_window: {
          page_viewed: 0,
          checkout_started: 0,
          checkout_success: 0,
        },
        deltas: {
          checkout_started_abs: 0,
          checkout_started_pct: null,
        },
        spotlight: {
          top_source_by_checkout: null,
          best_source_by_success: null,
          highest_leakage_source: null,
        },
        groups: [],
        sources: [],
      },
    [data],
  );
  const publicEventCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of publicData?.event_counts || []) {
      m.set(String(row.key || ""), Number(row.count || 0));
    }
    return m;
  }, [publicData]);
  const maxReached = useMemo(
    () => Math.max(...steps.map((s) => s.reached_agents), 1),
    [steps],
  );

  const summary = data?.summary;
  const updatedAt = data?.since
    ? new Date(data.since).toLocaleDateString("de-DE")
    : null;
  const publicUpdatedAt = publicData?.since
    ? new Date(publicData.since).toLocaleDateString("de-DE")
    : null;

  const ctaImpressions = publicEventCounts.get("marketing_cta_variant_impression") || 0;
  const ctaPrimaryClicks = publicEventCounts.get("marketing_cta_variant_primary_click") || 0;
  const ctaSecondaryClicks = publicEventCounts.get("marketing_cta_variant_secondary_click") || 0;
  const ctaPrimaryCtr = ctaImpressions > 0 ? ctaPrimaryClicks / ctaImpressions : null;
  const ctaSecondaryCtr = ctaImpressions > 0 ? ctaSecondaryClicks / ctaImpressions : null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin · Onboarding Funnel</h1>
            <p className="mt-1 text-sm text-gray-600">
              Sehen, wo Agenten im Onboarding aussteigen, wie schnell sie fertig
              werden und welche Ereignisse wirklich stattfinden.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/admin/overview"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Overview
            </Link>
            <Link
              href="/app/admin/quality"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Quality
            </Link>
            <Link
              href="/app/admin/readiness"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Readiness
            </Link>
            <button
              onClick={() => void runFetch(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Aktualisieren
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suche Agent, E-Mail, Firma…"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") void runFetch(true);
              }}
            />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value={14}>Zeitraum: 14 Tage</option>
              <option value={30}>Zeitraum: 30 Tage</option>
              <option value={60}>Zeitraum: 60 Tage</option>
              <option value={90}>Zeitraum: 90 Tage</option>
            </select>
            <button
              onClick={() => void runFetch(true)}
              className="rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-gray-800"
            >
              Anwenden
            </button>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              Basis seit: {updatedAt || "–"}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <KpiCard
            title="Gestartet"
            value={summary?.started_agents ?? 0}
            hint="Agenten mit Startsignal im Zeitraum"
          />
          <KpiCard
            title="Abgeschlossen"
            value={summary?.completed_agents ?? 0}
            hint="Agenten mit Abschluss im Zeitraum"
          />
          <KpiCard
            title="Completion Rate"
            value={fmtPct(summary?.completion_rate ?? null)}
            hint="Abgeschlossen / Gestartet"
            footer={<Delta value={summary?.completion_rate_delta ?? null} />}
          />
          <KpiCard
            title="Median bis Abschluss"
            value={fmtHours(summary?.median_completion_hours ?? null)}
            hint="Nur Agenten mit Start + Abschluss"
          />
          <KpiCard
            title="First Value"
            value={summary?.first_value_agents ?? 0}
            hint="Agenten mit erstem messbaren Nutzen"
          />
          <KpiCard
            title="First Value Rate"
            value={fmtPct(summary?.first_value_rate ?? null)}
            hint="First Value / Gestartet"
            footer={<Delta value={summary?.first_value_rate_delta ?? null} />}
          />
          <KpiCard
            title="First Value ≤ 30 Min"
            value={fmtPct(summary?.first_value_in_30m_rate ?? null)}
            hint="Anteil mit First Value in 30 Minuten"
          />
          <KpiCard
            title="Median bis First Value"
            value={fmtMinutes(summary?.median_first_value_minutes ?? null)}
            hint="Nur Agenten mit Start + First Value"
          />
          <KpiCard
            title="Aktiv mit Events"
            value={summary?.active_agents_with_events ?? 0}
            hint="Agenten mit mind. 1 Funnel-Event"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 bg-[#fbfbfc] px-4 py-3">
            <div className="font-medium">Billing Conversion nach Quelle</div>
            <div className="text-sm text-gray-600">
              Vergleich von Upgrade-Gates, CTA-Klicks, Checkout-Starts und Erfolgen je Source-Key.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-5">
            <KpiCard
              title="Gate Trigger"
              value={billing.summary.total_gate_triggered}
              hint="billing_upgrade_gate_triggered"
            />
            <KpiCard
              title="Checkout Starts"
              value={billing.summary.total_checkout_started}
              hint="billing_checkout_started"
            />
            <KpiCard
              title="Checkout Erfolge"
              value={billing.summary.total_checkout_success}
              hint="billing_checkout_return_success"
            />
            <KpiCard
              title="Success / Checkout"
              value={fmtPct(billing.summary.overall_to_success_from_checkout)}
              hint="Gesamtquote im Zeitraum"
            />
            <KpiCard
              title="Success / Abo-Seite"
              value={fmtPct(billing.summary.overall_to_success_from_page)}
              hint="End-to-End ab billing_upgrade_page_viewed"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="text-xs text-gray-500">Top-Quelle nach Checkout</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {billing.spotlight.top_source_by_checkout?.source || "–"}
              </div>
              <div className="mt-1 text-xs text-gray-700">
                {billing.spotlight.top_source_by_checkout?.checkout_started ?? 0} Checkout-Starts
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="text-xs text-gray-500">Beste Success-Quote</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {billing.spotlight.best_source_by_success?.source || "–"}
              </div>
              <div className="mt-1 text-xs text-gray-700">
                {fmtPct(
                  billing.spotlight.best_source_by_success
                    ?.to_success_from_checkout ?? null,
                )}{" "}
                Erfolg / Checkout
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="text-xs text-gray-500">Größtes Leck (Seite → Checkout)</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {billing.spotlight.highest_leakage_source?.source || "–"}
              </div>
              <div className="mt-1 text-xs text-gray-700">
                {billing.spotlight.highest_leakage_source?.leakage ?? 0} verlorene Sessions
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-[#fcfcfd] px-4 py-3 text-xs text-gray-600">
            Vorperiode: {billing.previous_window.checkout_started} Checkout-Starts, aktuell{" "}
            {billing.summary.total_checkout_started}. Delta:{" "}
            <span className="font-medium text-gray-900">
              {billing.deltas.checkout_started_abs >= 0 ? "+" : ""}
              {billing.deltas.checkout_started_abs}
            </span>{" "}
            ({fmtPct(billing.deltas.checkout_started_pct)})
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
            </div>
          ) : billing.sources.length === 0 ? (
            <div className="px-4 pb-4 text-sm text-gray-600">
              Noch keine Billing-Conversion-Events im ausgewählten Zeitraum.
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-gray-200">
              <div className="px-4 py-2 text-xs font-medium text-gray-600 bg-[#fbfbfc] border-b border-gray-200">
                Quellen-Gruppen
              </div>
              <table className="min-w-full text-sm border-b border-gray-200">
                <thead className="bg-white">
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="px-4 py-2">Gruppe</th>
                    <th className="px-4 py-2">Sources</th>
                    <th className="px-4 py-2">Abo-Seite</th>
                    <th className="px-4 py-2">Checkout</th>
                    <th className="px-4 py-2">Erfolg</th>
                    <th className="px-4 py-2">Checkout / CTA</th>
                    <th className="px-4 py-2">Erfolg / Checkout</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.groups.map((row) => (
                    <tr key={row.group} className="border-b border-gray-100 align-top">
                      <td className="px-4 py-2 font-medium">{row.group}</td>
                      <td className="px-4 py-2">{row.sources}</td>
                      <td className="px-4 py-2">{row.page_viewed}</td>
                      <td className="px-4 py-2">{row.checkout_started}</td>
                      <td className="px-4 py-2">{row.checkout_success}</td>
                      <td className="px-4 py-2">{fmtPct(row.checkout_from_cta)}</td>
                      <td className="px-4 py-2">{fmtPct(row.to_success_from_checkout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-4 py-2 text-xs font-medium text-gray-600 bg-[#fbfbfc] border-b border-gray-200">
                Source-Key Vergleich (Details)
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-white">
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Gate</th>
                    <th className="px-4 py-3">CTA</th>
                    <th className="px-4 py-3">Abo-Seite</th>
                    <th className="px-4 py-3">Checkout</th>
                    <th className="px-4 py-3">Erfolg</th>
                    <th className="px-4 py-3">CTA / Gate</th>
                    <th className="px-4 py-3">Seite / CTA</th>
                    <th className="px-4 py-3">Checkout / CTA</th>
                    <th className="px-4 py-3">Checkout / Seite</th>
                    <th className="px-4 py-3">Erfolg / Checkout</th>
                    <th className="px-4 py-3">Erfolg / Seite</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.sources.map((row) => (
                    <tr
                      key={row.source}
                      className="border-b border-gray-100 align-top hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium">{row.source}</td>
                      <td className="px-4 py-3">{row.gate_triggered}</td>
                      <td className="px-4 py-3">{row.cta_clicked}</td>
                      <td className="px-4 py-3">{row.page_viewed}</td>
                      <td className="px-4 py-3">{row.checkout_started}</td>
                      <td className="px-4 py-3">{row.checkout_success}</td>
                      <td className="px-4 py-3">{fmtPct(row.cta_from_gate)}</td>
                      <td className="px-4 py-3">{fmtPct(row.page_from_cta)}</td>
                      <td className="px-4 py-3">{fmtPct(row.checkout_from_cta)}</td>
                      <td className="px-4 py-3">{fmtPct(row.to_checkout_from_page)}</td>
                      <td className="px-4 py-3">{fmtPct(row.to_success_from_checkout)}</td>
                      <td className="px-4 py-3">{fmtPct(row.to_success_from_page)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 bg-[#fbfbfc] px-4 py-3">
            <div className="font-medium">Public Funnel (Website)</div>
            <div className="text-sm text-gray-600">
              CTA-Varianten, Klickverhalten und Top-Seiten im Zeitraum {publicData?.window_days ?? days} Tage.
            </div>
          </div>

          {publicError ? (
            <div className="px-4 py-3 text-sm text-red-700">
              Public-Daten konnten nicht geladen werden: {publicError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
            <KpiCard
              title="Public Events gesamt"
              value={publicData?.total_events ?? 0}
              hint={`Seit ${publicUpdatedAt || "–"}`}
            />
            <KpiCard
              title="CTA-Impressions"
              value={ctaImpressions}
              hint="marketing_cta_variant_impression"
            />
            <KpiCard
              title="Primary CTR"
              value={fmtPct(ctaPrimaryCtr)}
              hint={`${ctaPrimaryClicks} Klicks auf Primary`}
            />
            <KpiCard
              title="Secondary CTR"
              value={fmtPct(ctaSecondaryCtr)}
              hint={`${ctaSecondaryClicks} Klicks auf Secondary`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-gray-200 p-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b border-gray-200 bg-[#fbfbfc] px-3 py-2 text-sm font-medium">
                CTA-Varianten-Verteilung
              </div>
              <div className="divide-y divide-gray-100">
                {(publicData?.cta_variant_counts || []).map((row) => (
                  <div key={row.key} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium">{row.key}</span>
                    <span className="text-gray-700">{row.count}</span>
                  </div>
                ))}
                {(publicData?.cta_variant_counts || []).length === 0 ? (
                  <div className="px-3 py-3 text-sm text-gray-500">Keine Varianten-Daten.</div>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b border-gray-200 bg-[#fbfbfc] px-3 py-2 text-sm font-medium">
                Top-Seiten (Public)
              </div>
              <div className="divide-y divide-gray-100">
                {(publicData?.top_paths || []).slice(0, 10).map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="truncate text-gray-700">{row.key}</span>
                    <span className="shrink-0 font-medium">{row.count}</span>
                  </div>
                ))}
                {(publicData?.top_paths || []).length === 0 ? (
                  <div className="px-3 py-3 text-sm text-gray-500">Keine Seiten-Daten.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 bg-[#fbfbfc] px-4 py-3">
            <div className="font-medium">Funnel je Schritt</div>
            <div className="text-sm text-gray-600">
              Konversion zum nächsten Schritt und Abbruch pro Stufe.
            </div>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
            </div>
          ) : steps.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">Keine Daten.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {steps.map((s) => {
                const width = Math.max(
                  4,
                  Math.round((s.reached_agents / maxReached) * 100),
                );
                return (
                  <div key={s.step} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          Schritt {s.step}: {s.label}
                        </div>
                        <div className="text-xs text-gray-600">
                          {s.reached_agents} erreicht
                          {s.step < 6
                            ? ` · ${fmtPct(s.conversion_to_next)} zu Schritt ${s.step + 1}`
                            : ""}
                        </div>
                      </div>
                      {s.step < 6 ? (
                        <div className="text-xs text-gray-600">
                          Abbruch: {s.drop_off_agents ?? 0}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-gray-900"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-200 bg-[#fbfbfc] px-4 py-3">
              <div className="font-medium">Event-Verteilung</div>
              <div className="text-sm text-gray-600">
                Welche Funnel-Ereignisse wirklich häufig auftreten.
              </div>
            </div>
            {loading ? (
              <div className="space-y-2 p-4">
                <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {events.map((ev) => (
                  <div
                    key={ev.key}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{ev.label}</div>
                      <div className="text-xs text-gray-500">{ev.key}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{ev.total}</div>
                      <div className="text-xs text-gray-500">
                        {ev.unique_agents} Agenten
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="font-medium">Einordnung</div>
            <div className="mt-1 text-sm text-gray-600">
              Wenn viele Agenten bei Schritt 2 oder 3 aussteigen, ist meist die
              Verbindungs- oder Einstellungsphase die Hürde. Wenn Schritt 5
              schwach ist, fehlen oft Objektdaten oder klare Handlungsführung.
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Nutze diese Seite zusammen mit
              <span className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">
                /app/admin/readiness
              </span>
              und
              <span className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-700">
                /app/admin/quality
              </span>
              , um die Ursache pro Agent schnell zu erkennen.
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-200 bg-[#fbfbfc] px-4 py-3 text-sm text-gray-600">
            {rows.length} Agenten • Zeitraum {data?.days ?? days} Tage
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-14 animate-pulse rounded-lg bg-gray-100" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">Keine Daten.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white">
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Events</th>
                    <th className="px-4 py-3">Zeit bis Abschluss</th>
                    <th className="px-4 py-3">Letzte Aktivität</th>
                    <th className="px-4 py-3">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.agent_id}
                      className="border-b border-gray-100 align-top hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name || "—"}</div>
                        <div className="text-xs text-gray-600">
                          {r.email || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {r.company || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StepPill row={r} />
                      </td>
                      <td className="px-4 py-3">{r.event_count}</td>
                      <td className="px-4 py-3">{fmtHours(r.completion_hours)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {r.last_event_at
                          ? new Date(r.last_event_at).toLocaleString("de-DE")
                          : "–"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/admin/agents/${r.agent_id}`}
                          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                        >
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

function KpiCard({
  title,
  value,
  hint,
  footer,
}: {
  title: string;
  value: string | number;
  hint: string;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{hint}</div>
      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}
