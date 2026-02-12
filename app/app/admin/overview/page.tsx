import Link from "next/link";
import { ExternalLink, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";

export const dynamic = "force-dynamic";

async function getHealth() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const url = base ? `${base}/api/admin/health` : "/api/admin/health";

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as any)?.error || (data as any)?.message || "Failed to load health";
    throw new Error(String(msg));
  }
  return data as any;
}

export default async function AdminOverviewPage() {
  const health = await getHealth();

  const readyToSend = Number(health.queue?.ready_to_send ?? 0);
  const needsApproval = Number(health.queue?.needs_approval ?? 0);
  const needsHuman = Number(health.queue?.needs_human ?? 0);
  const failedSends = Number(health.send_status?.failed ?? 0);

  const outboxItems: any[] = Array.isArray(health.outbox) ? health.outbox : [];
  const stuckSending = outboxItems.filter(
    (m) => String(m.send_status || "").toLowerCase() === "sending",
  );

  // heuristic health level (V1):
  // red if failed sends >= 3 or needs_human >= 5
  // yellow if needs_approval >= 10 or ready_to_send >= 10
  // green otherwise
  const level: "green" | "yellow" | "red" =
    failedSends >= 3 || needsHuman >= 5
      ? "red"
      : needsApproval >= 10 || readyToSend >= 10
        ? "yellow"
        : "green";

  const levelLabel =
    level === "green"
      ? "Alles stabil"
      : level === "yellow"
        ? "Auffällig"
        : "Kritisch";

  const levelHint =
    level === "green"
      ? "Keine akuten Staus oder Fehler."
      : level === "yellow"
        ? "Es gibt Auffälligkeiten – lohnt sich kurz reinzuschauen."
        : "Es gibt echte Probleme (Fehler/Stau). Bitte sofort prüfen.";

  const LevelIcon =
    level === "green"
      ? ShieldCheck
      : level === "yellow"
        ? ShieldAlert
        : ShieldX;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                  level === "green"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : level === "yellow"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <LevelIcon className="h-4 w-4" />
                {levelLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{levelHint}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/admin/agents"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Agents
            </Link>
            <Link
              href="/app/admin/outbox"
              className="inline-flex items-center justify-center rounded-xl border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-gray-800"
            >
              Outbox
            </Link>
            <a
              href="/api/admin/health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
              title="Health JSON öffnen"
            >
              <ExternalLink className="h-4 w-4" />
              Health JSON
            </a>
            <Link
              href="/app/admin/overview"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Refresh
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card title="Inbound (24h)" value={health.inbound_24h} />
          <Card
            title="Processed (24h)"
            value={health.processed_24h ?? health.drafts_24h}
          />
          <Card title="Drafts (24h)" value={health.drafts_24h} />
          <Card
            title="Ready to send"
            value={readyToSend}
            href="/app/admin/outbox?status=ready_to_send"
          />
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card
            title="Needs approval"
            value={needsApproval}
            href="/app/admin/outbox?status=needs_approval"
          />
          <Card
            title="Needs human"
            value={needsHuman}
            href="/app/admin/outbox?status=needs_human"
          />
          <Card
            title="Failed sends"
            value={failedSends}
            href="/app/admin/outbox?status=failed"
            tone={failedSends > 0 ? "danger" : "neutral"}
          />
          <Card
            title="Stuck sending"
            value={stuckSending.length}
            href="/app/admin/outbox?status=sending"
            tone={stuckSending.length > 0 ? "warning" : "neutral"}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc]">
            <div className="font-medium">Schnellzugriff</div>
            <div className="text-sm text-gray-600">
              Spring direkt in Debug-/Support-Views. Alles von hier – keine
              Navbar nötig.
            </div>
          </div>
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Link
              href="/app/admin/agents"
              className="group rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="text-sm text-gray-600">Accounts</div>
              <div className="mt-1 text-lg font-semibold">Agents</div>
              <div className="mt-2 text-sm text-gray-600">
                Status, Onboarding, letzte Aktivität, Health Flags.
              </div>
              <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-900">
                Öffnen →
              </div>
            </Link>

            <Link
              href="/app/admin/outbox"
              className="group rounded-2xl border border-gray-200 bg-gray-900 p-4 text-amber-200 hover:bg-gray-800 transition"
            >
              <div className="text-sm text-amber-200/80">Sending</div>
              <div className="mt-1 text-lg font-semibold">Outbox</div>
              <div className="mt-2 text-sm text-amber-200/80">
                Failed / Sending / Ready-to-send – mit Aktionen.
              </div>
              <div className="mt-3 text-xs text-amber-200 group-hover:text-white">
                Öffnen →
              </div>
            </Link>

            <Link
              href="/app/admin/decisions"
              className="group rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="text-sm text-gray-600">Why / Audit</div>
              <div className="mt-1 text-lg font-semibold">Decisions</div>
              <div className="mt-2 text-sm text-gray-600">
                Inspector: Classification → Draft → QA → Rewrite → Send.
              </div>
              <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-900">
                Öffnen →
              </div>
            </Link>

            <Link
              href="/app/admin/overview"
              className="group rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="text-sm text-gray-600">Health</div>
              <div className="mt-1 text-lg font-semibold">Overview</div>
              <div className="mt-2 text-sm text-gray-600">
                KPIs, letzte Errors, Quick-Checks.
              </div>
              <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-900">
                Aktualisieren →
              </div>
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc]">
            <div className="font-medium">Letzte Fehler (Send)</div>
            <div className="text-sm text-gray-600">
              Wenn hier Peaks sind, ist dein System gerade “heiß”.
            </div>
          </div>
          <div className="p-4 md:p-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-gray-700">
                Failed sends: <span className="font-medium">{failedSends}</span>
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-gray-700">
                Needs human: <span className="font-medium">{needsHuman}</span>
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-gray-700">
                Needs approval:{" "}
                <span className="font-medium">{needsApproval}</span>
              </span>
            </div>
            {(health.last_failed || []).length === 0 ? (
              <div className="text-sm text-gray-600">
                Keine aktuellen Send-Fehler. Wenn trotzdem etwas „komisch“
                wirkt, schau in Outbox oder Decisions.
              </div>
            ) : (
              (health.last_failed || []).map((e: any) => (
                <div
                  key={e.id}
                  className="border border-gray-200 rounded-xl p-3"
                >
                  <div className="text-sm font-medium">
                    Message {String(e.id).slice(0, 8)}… •{" "}
                    {e.email_provider || "?"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(e.updated_at || e.timestamp).toLocaleString(
                      "de-DE",
                    )}
                  </div>
                  <div className="text-sm text-red-700 mt-2 whitespace-pre-wrap">
                    {e.send_error || "unknown_error"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between">
            <div>
              <div className="font-medium">Outbox Monitor</div>
              <div className="text-sm text-gray-600">
                Nachrichten im Status sending / failed / ready_to_send.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/app/admin/agents"
                className="text-xs inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 px-3 py-2"
              >
                Agent öffnen
              </Link>
              <Link
                href="/app/admin/outbox"
                className="text-xs inline-flex items-center gap-2 rounded-xl bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 px-3 py-2"
              >
                Outbox öffnen
              </Link>
            </div>
          </div>
          <div className="p-4 md:p-6">
            {(health.outbox || []).length === 0 ? (
              <div className="text-sm text-gray-600">
                Keine offenen Outbox-Einträge.
              </div>
            ) : (
              <div className="space-y-3">
                {(health.outbox || []).map((m: any) => (
                  <div
                    key={m.id}
                    className="border border-gray-200 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        Message {String(m.id).slice(0, 8)}…
                      </div>
                      <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {m.send_status || "unknown"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Lead: {m.lead_id ? String(m.lead_id).slice(0, 8) : "-"}
                    </div>
                    {m.send_error && (
                      <div className="text-sm text-red-700 mt-2 whitespace-pre-wrap">
                        {m.send_error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  href,
  tone = "neutral",
}: {
  title: string;
  value: any;
  href?: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const inner = (
    <div
      className={`rounded-2xl border bg-white p-4 transition ${
        tone === "danger"
          ? "border-red-200"
          : tone === "warning"
            ? "border-amber-200"
            : "border-gray-200"
      } ${href ? "hover:bg-gray-50" : ""}`}
    >
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="text-2xl font-semibold">{String(value ?? 0)}</div>
        {href ? <span className="text-xs text-gray-500">Öffnen →</span> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  return inner;
}
