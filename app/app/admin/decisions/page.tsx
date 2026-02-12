import Link from "next/link";
import { ExternalLink, Filter, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

type DecisionRow = {
  id: string;
  created_at: string;
  agent_id: string;
  lead_id: string;
  inbound_message_id: string;
  draft_message_id: string;

  verdict: string;
  score: number;
  action: string | null;
  reason: string | null;
  reason_long: string | null;
  risk_flags: string[] | null;

  prompt_key: string;
  prompt_version: string;
  model: string | null;

  agent?: { id: string; email: string; name: string | null };
  lead?: { id: string; email: string | null; name: string | null };
  draft?: {
    id: string;
    send_status: string | null;
    email_provider: string | null;
    send_error: string | null;
    status: string | null;
    approval_required: boolean | null;
    timestamp: string | null;
  };
};

async function getDecisions(params: Record<string, string | undefined>) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && String(v).trim() !== "") qs.set(k, String(v));
  }

  const url = base
    ? `${base}/api/admin/decisions?${qs.toString()}`
    : `/api/admin/decisions?${qs.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as any)?.error ||
      (data as any)?.message ||
      "Failed to load decisions";
    throw new Error(String(msg));
  }

  const raw: any = data || {};
  const items = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.rows)
      ? raw.rows
      : Array.isArray(raw.data)
        ? raw.data
        : [];

  const count = Number(
    raw.count ?? raw.total ?? raw.items_count ?? (Array.isArray(items) ? items.length : 0)
  );

  return { ok: !!raw.ok, count, items: items as DecisionRow[] };
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "bad"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-gray-200 bg-gray-50 text-gray-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${cls}`}
    >
      {children}
    </span>
  );
}

function verdictTone(v: string) {
  const s = String(v || "").toLowerCase();
  if (s.includes("pass")) return "good";
  if (s.includes("warn")) return "warn";
  if (s.includes("fail")) return "bad";
  return "neutral";
}

function sendTone(v: string | null) {
  const s = String(v || "").toLowerCase();
  if (s === "sent") return "good";
  if (s === "sending") return "warn";
  if (s === "failed") return "bad";
  return "neutral";
}

export default async function AdminDecisionsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const verdict = searchParams.verdict || "";
  const risk = searchParams.risk || "";
  const agent_id = searchParams.agent_id || "";
  const lead_id = searchParams.lead_id || "";
  const limit = searchParams.limit || "100";

  const data = await getDecisions({
    verdict,
    risk,
    agent_id,
    lead_id,
    limit,
  });

  const items = Array.isArray(data.items) ? data.items : [];
  const count = Number.isFinite(Number(data.count)) ? Number(data.count) : items.length;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold">Decisions</h1>
              <Badge tone="neutral">
                <ShieldCheck className="h-4 w-4 mr-1" />
                {count} Ergebnisse
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              “Why did it do that?” — QA Verdicts + Reasons + Risiken +
              Send-Status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/admin/overview"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Overview
            </Link>
            <Link
              href="/app/admin/outbox"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Outbox
            </Link>
            <a
              href="/api/admin/decisions"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
              title="API JSON öffnen"
            >
              <ExternalLink className="h-4 w-4" />
              JSON
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <div className="font-medium">Filter</div>
            <div className="text-sm text-gray-600">
              (Optional) — nutze URL params
            </div>
          </div>

          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
            <FilterChip label="verdict" value={verdict} />
            <FilterChip label="risk" value={risk} />
            <FilterChip label="agent_id" value={agent_id} />
            <FilterChip label="lead_id" value={lead_id} />
            <FilterChip label="limit" value={limit} />
          </div>

          <div className="px-4 md:px-6 pb-4 text-xs text-gray-500">
            Beispiele:{" "}
            <code className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
              /app/admin/decisions?verdict=fail
            </code>{" "}
            <code className="bg-gray-50 border border-gray-200 rounded px-2 py-1 ml-2">
              /app/admin/decisions?risk=hallucination
            </code>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">Letzte QA Entscheidungen</div>
              <div className="text-sm text-gray-600">
                Sortiert nach{" "}
                <span className="font-medium">created_at desc</span>.
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Tipp: Risk Flags sind dein Schnellindikator für “risky” Verhalten.
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              Keine Decisions gefunden.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white sticky top-0">
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                    <th className="px-4 md:px-6 py-3">Zeit</th>
                    <th className="px-4 md:px-6 py-3">Agent</th>
                    <th className="px-4 md:px-6 py-3">Lead</th>
                    <th className="px-4 md:px-6 py-3">Verdict</th>
                    <th className="px-4 md:px-6 py-3">Score</th>
                    <th className="px-4 md:px-6 py-3">Action</th>
                    <th className="px-4 md:px-6 py-3">Reason</th>
                    <th className="px-4 md:px-6 py-3">Risiken</th>
                    <th className="px-4 md:px-6 py-3">Send</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => {
                    const vTone = verdictTone(r.verdict);
                    const sTone = sendTone(r.draft?.send_status ?? null);

                    return (
                      <tr
                        key={r.id}
                        className="border-b border-gray-100 hover:bg-gray-50 align-top"
                      >
                        <td className="px-4 md:px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                          {new Date(r.created_at).toLocaleString("de-DE")}
                          <div className="mt-1">
                            <Link
                              href={`/app/admin/decisions/${r.id}`}
                              className="text-[11px] text-gray-500 hover:text-gray-900 hover:underline"
                              title="Decision Inspector öffnen"
                            >
                              QA {String(r.id).slice(0, 8)}…
                            </Link>
                          </div>
                        </td>

                        <td className="px-4 md:px-6 py-3">
                          <div className="font-medium">
                            {r.agent?.name ?? "—"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {r.agent?.email ?? r.agent_id}
                          </div>
                        </td>

                        <td className="px-4 md:px-6 py-3">
                          <div className="font-medium">
                            {r.lead?.name ?? "—"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {r.lead?.email ?? r.lead_id}
                          </div>
                          <div className="mt-2">
                            <Link
                              href={`/app/nachrichten/${r.lead_id}`}
                              className="text-xs inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50"
                            >
                              Chat öffnen →
                            </Link>
                          </div>
                        </td>

                        <td className="px-4 md:px-6 py-3">
                          <Badge tone={vTone as any}>{r.verdict}</Badge>
                          <div className="mt-2 text-[11px] text-gray-400">
                            {r.prompt_key}@{r.prompt_version}
                          </div>
                        </td>

                        <td className="px-4 md:px-6 py-3">
                          <div className="font-medium">
                            {Number(r.score ?? 0).toFixed(2)}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {r.model ?? "—"}
                          </div>
                        </td>

                        <td className="px-4 md:px-6 py-3">
                          <div className="text-xs text-gray-800">
                            {r.action ?? "—"}
                          </div>
                          <div className="mt-2 text-[11px] text-gray-400">
                            inbound: {String(r.inbound_message_id).slice(0, 8)}…
                            <br />
                            draft: {String(r.draft_message_id).slice(0, 8)}…
                          </div>
                          <div className="mt-2">
                            <Link
                              href={`/app/admin/decisions/${r.id}`}
                              className="text-xs inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50"
                            >
                              Inspect →
                            </Link>
                          </div>
                        </td>

                        <td className="px-4 md:px-6 py-3 max-w-[420px]">
                          <div className="text-xs text-gray-800 whitespace-pre-wrap">
                            {r.reason_long || r.reason || "—"}
                          </div>

                          {r.draft?.send_error ? (
                            <div className="mt-2 text-xs text-red-700 whitespace-pre-wrap">
                              Send error: {r.draft.send_error}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-4 md:px-6 py-3">
                          {(r.risk_flags || []).length === 0 ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(r.risk_flags || []).slice(0, 6).map((f) => (
                                <Badge key={f} tone="warn">
                                  {f}
                                </Badge>
                              ))}
                              {(r.risk_flags || []).length > 6 ? (
                                <span className="text-[11px] text-gray-500">
                                  +{(r.risk_flags || []).length - 6}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </td>

                        <td className="px-4 md:px-6 py-3">
                          <Badge tone={sTone as any}>
                            {r.draft?.send_status ?? "—"}
                          </Badge>
                          <div className="mt-2 text-xs text-gray-500">
                            {r.draft?.email_provider ?? "—"}
                          </div>
                          <div className="mt-2 text-[11px] text-gray-400">
                            status: {r.draft?.status ?? "—"}{" "}
                            {r.draft?.approval_required ? "(approval)" : ""}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Hinweis: Öffne den Decision Inspector über die QA-ID oder „Inspect →“:{" "}
          <code className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
            /app/admin/decisions/[qa_id]
          </code>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-medium text-gray-900 break-all">
        {value || "—"}
      </div>
    </div>
  );
}
