import Link from "next/link";
import { cookies } from "next/headers";
import { ExternalLink, ShieldCheck, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

async function cookieHeaderString() {
  // Make sure admin API sees the same session cookies
  const store = await cookies();
  const all = store.getAll();
  return all.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function getDecision(id: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const url = base
    ? new URL(`/api/admin/decisions/${id}`, base).toString()
    : `/api/admin/decisions/${id}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Cookie: await cookieHeaderString(),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String((data as any)?.error || "detail_failed"));
  }
  return data as any;
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

function JsonBlock({ value }: { value: any }) {
  const text =
    value == null
      ? "—"
      : typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2);

  return (
    <pre className="whitespace-pre-wrap break-words rounded-xl border border-gray-200 bg-[#fbfbfc] p-4 text-xs text-gray-800">
      {text}
    </pre>
  );
}

function TextBlock({ title, text }: { title: string; text: string | null }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 md:px-6 py-3 border-b border-gray-200 bg-[#fbfbfc]">
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="p-4 md:p-6">
        <div className="whitespace-pre-wrap text-sm text-gray-900">
          {text?.trim() ? text : "—"}
        </div>
      </div>
    </div>
  );
}

export default async function AdminDecisionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = String(params?.id || "").trim();
  const data = await getDecision(id);

  const item = data?.item || {};
  const qa = item?.qa || {};
  const agent = item?.agent || null;
  const lead = item?.lead || null;
  const inbound = item?.inbound || null;
  const draft = item?.draft || null;
  const property = item?.property || null;

  const vTone = verdictTone(String(qa?.verdict || ""));
  const sTone = sendTone(draft?.send_status ?? null);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/app/admin/decisions"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Link>

              <h1 className="text-2xl font-semibold">Decision Inspector</h1>

              <Badge tone="neutral">
                <ShieldCheck className="h-4 w-4 mr-1" />
                QA {String(qa?.id || id).slice(0, 8)}…
              </Badge>

              <Badge tone={vTone as any}>{String(qa?.verdict || "—")}</Badge>

              <Badge tone={sTone as any}>
                Send: {String(draft?.send_status || "—")}
              </Badge>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              Prompt:{" "}
              <span className="font-medium">
                {String(qa?.prompt_key || "—")}@
                {String(qa?.prompt_version || "—")}
              </span>{" "}
              · Score:{" "}
              <span className="font-medium">
                {Number(qa?.score ?? 0).toFixed(2)}
              </span>{" "}
              · Model: <span className="font-medium">{qa?.model ?? "—"}</span>
            </div>
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
              href={`/api/admin/decisions/${id}`}
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

        {/* Top meta cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Agent</div>
            <div className="mt-1 font-medium">{agent?.name ?? "—"}</div>
            <div className="mt-1 text-sm text-gray-600">
              {agent?.email ?? qa?.agent_id}
            </div>
            <div className="mt-2 text-xs text-gray-400 break-all">
              id: {qa?.agent_id}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Lead</div>
            <div className="mt-1 font-medium">{lead?.name ?? "—"}</div>
            <div className="mt-1 text-sm text-gray-600">
              {lead?.email ?? qa?.lead_id}
            </div>
            <div className="mt-2 text-xs text-gray-400 break-all">
              id: {qa?.lead_id}
            </div>
            <div className="mt-3">
              <Link
                href={`/app/nachrichten/${qa?.lead_id}`}
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
              >
                Chat öffnen →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Status</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={vTone as any}>
                QA: {String(qa?.verdict || "—")}
              </Badge>
              <Badge tone={sTone as any}>
                Send: {String(draft?.send_status || "—")}
              </Badge>
              <Badge tone="neutral">
                Draft status: {String(draft?.status || "—")}
                {draft?.approval_required ? " (approval)" : ""}
              </Badge>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              created_at:{" "}
              <span className="font-medium">
                {qa?.created_at
                  ? new Date(qa.created_at).toLocaleString("de-DE")
                  : "—"}
              </span>
            </div>

            {draft?.send_error ? (
              <div className="mt-3 text-xs text-red-700 whitespace-pre-wrap">
                Send error: {String(draft.send_error)}
              </div>
            ) : null}
          </div>
        </div>

        {/* Main 2-col layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: inbound + draft */}
          <div className="space-y-6">
            <TextBlock
              title={`Inbound Message (${String(inbound?.sender || "—")})`}
              text={inbound?.text ?? null}
            />
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 md:px-6 py-3 border-b border-gray-200 bg-[#fbfbfc]">
                <div className="text-sm font-medium">Inbound Meta</div>
              </div>
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-xs text-gray-500">timestamp</div>
                  <div className="mt-1 font-medium">
                    {inbound?.timestamp
                      ? new Date(inbound.timestamp).toLocaleString("de-DE")
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-xs text-gray-500">email_type</div>
                  <div className="mt-1 font-medium">
                    {inbound?.email_type ?? "—"}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    conf: {inbound?.classification_confidence ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3 md:col-span-2">
                  <div className="text-xs text-gray-500">
                    classification_reason
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm">
                    {inbound?.classification_reason ?? "—"}
                  </div>
                </div>
              </div>
            </div>

            <TextBlock
              title={`Draft Message (${String(draft?.sender || "—")} · was_followup=${draft?.was_followup ? "true" : "false"})`}
              text={draft?.text ?? null}
            />
          </div>

          {/* RIGHT: QA + risks + structured outputs + property */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 md:px-6 py-3 border-b border-gray-200 bg-[#fbfbfc]">
                <div className="text-sm font-medium">QA Reasoning</div>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                <div>
                  <div className="text-xs text-gray-500">reason</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                    {qa?.reason ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">reason_long</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                    {qa?.reason_long ?? "—"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone={vTone as any}>
                    {String(qa?.verdict || "—")}
                  </Badge>
                  <Badge tone="neutral">
                    action: {String(qa?.action || "—")}
                  </Badge>
                  <Badge tone="neutral">
                    score: {Number(qa?.score ?? 0).toFixed(2)}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs text-gray-500">risk_flags</div>
                  {(qa?.risk_flags || []).length === 0 ? (
                    <div className="mt-1 text-sm text-gray-400">—</div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(qa?.risk_flags || []).map((f: string) => (
                        <Badge key={f} tone="warn">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 md:px-6 py-3 border-b border-gray-200 bg-[#fbfbfc]">
                <div className="text-sm font-medium">Structured Output</div>
                <div className="mt-1 text-xs text-gray-500">
                  flags / suggestions / meta (raw)
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-2">flags</div>
                  <JsonBlock value={qa?.flags ?? null} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2">suggestions</div>
                  <JsonBlock value={qa?.suggestions ?? null} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2">meta</div>
                  <JsonBlock value={qa?.meta ?? null} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 md:px-6 py-3 border-b border-gray-200 bg-[#fbfbfc]">
                <div className="text-sm font-medium">Property Context</div>
                <div className="mt-1 text-xs text-gray-500">
                  (aus lead_property_state.active_property_id)
                </div>
              </div>
              <div className="p-4 md:p-6">
                {!property ? (
                  <div className="text-sm text-gray-600">
                    Keine Immobilie zugeordnet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="font-medium">
                      {property?.street_address ?? "—"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {property?.city ?? "—"}
                      {property?.neighborhood
                        ? `, ${property.neighborhood}`
                        : ""}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="text-xs text-gray-500">Preis</div>
                        <div className="mt-1 font-medium">
                          {property?.price ?? "—"} {property?.price_type ?? ""}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="text-xs text-gray-500">Fläche</div>
                        <div className="mt-1 font-medium">
                          {property?.size_sqm ?? "—"} m²
                        </div>
                      </div>
                    </div>

                    {property?.url ? (
                      <a
                        href={property.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        Listing öffnen <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-6 text-xs text-gray-500">
          Tipp: Als nächstes können wir hier “Rewrite History” (wenn vorhanden)
          und “Send Payload / Provider IDs” ergänzen.
        </div>
      </div>
    </div>
  );
}
