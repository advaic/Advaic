import Link from "next/link";
import { ExternalLink, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import SupportHub from "@/components/admin/SupportHub";

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

async function getFineTuneReadiness() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const url = base
    ? `${base}/api/admin/ai/finetune-readiness`
    : "/api/admin/ai/finetune-readiness";

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
      "Failed to load fine-tune readiness";
    throw new Error(String(msg));
  }
  return data as any;
}

export default async function AdminOverviewPage() {
  const [health, fineTuneReadiness] = await Promise.all([
    getHealth(),
    getFineTuneReadiness().catch((error) => ({
      ok: false,
      error: error instanceof Error ? error.message : "unknown_error",
    })),
  ]);

  const readyToSend = Number(health.queue?.ready_to_send ?? 0);
  const needsApproval = Number(health.queue?.needs_approval ?? 0);
  const needsHuman = Number(health.queue?.needs_human ?? 0);
  const failedSends = Number(health.send_status?.failed ?? 0);

  const outboxItems: any[] = Array.isArray(health.outbox) ? health.outbox : [];
  const stuckSending = outboxItems.filter(
    (m) => String(m.send_status || "").toLowerCase() === "sending",
  );

  const approvalQuality = (health.approval_quality_week || {}) as any;
  const aqTotal = Number(approvalQuality.total_reviews ?? 0);
  const aqNoEdit = Number(approvalQuality.no_edit_count ?? 0);
  const aqEdited = Number(approvalQuality.edited_count ?? 0);
  const aqRate = typeof approvalQuality.no_edit_rate === "number"
    ? approvalQuality.no_edit_rate
    : null;
  const aqPrevRate = typeof approvalQuality.previous_no_edit_rate === "number"
    ? approvalQuality.previous_no_edit_rate
    : null;
  const aqRatePct = aqRate === null ? null : Math.round(aqRate * 1000) / 10;
  const aqPrevRatePct =
    aqPrevRate === null ? null : Math.round(aqPrevRate * 1000) / 10;
  const aqDeltaPp =
    aqRatePct !== null && aqPrevRatePct !== null
      ? Math.round((aqRatePct - aqPrevRatePct) * 10) / 10
      : null;

  const trustKpis = (health.trust_kpis || {}) as any;
  const approvalToSend = (trustKpis.approval_to_send || {}) as any;
  const correctionTime = (trustKpis.correction_time_seconds || {}) as any;

  const approvalToSendRate =
    typeof approvalToSend.current_rate === "number"
      ? approvalToSend.current_rate
      : null;
  const approvalToSendPrevRate =
    typeof approvalToSend.previous_rate === "number"
      ? approvalToSend.previous_rate
      : null;
  const approvalToSendRatePct =
    approvalToSendRate === null ? null : Math.round(approvalToSendRate * 1000) / 10;
  const approvalToSendPrevRatePct =
    approvalToSendPrevRate === null
      ? null
      : Math.round(approvalToSendPrevRate * 1000) / 10;
  const approvalToSendRelChangePct =
    typeof approvalToSend.relative_change_pct === "number"
      ? Math.round(approvalToSend.relative_change_pct * 10) / 10
      : null;

  const correctionMedianSec =
    typeof correctionTime.current_median === "number"
      ? Math.max(0, Math.round(correctionTime.current_median))
      : null;
  const correctionMedianPrevSec =
    typeof correctionTime.previous_median === "number"
      ? Math.max(0, Math.round(correctionTime.previous_median))
      : null;
  const correctionRelChangePct =
    typeof correctionTime.relative_change_pct === "number"
      ? Math.round(correctionTime.relative_change_pct * 10) / 10
      : null;

  const formatSec = (v: number | null) => {
    if (v === null) return "–";
    if (v < 60) return `${v}s`;
    const mins = Math.floor(v / 60);
    const sec = v % 60;
    return sec === 0 ? `${mins}m` : `${mins}m ${sec}s`;
  };

  const sprint3GoalSendMet =
    approvalToSendRelChangePct !== null && approvalToSendRelChangePct >= 15;
  const sprint3GoalCorrectionMet =
    correctionRelChangePct !== null && correctionRelChangePct <= -20;

  const ftOk = Boolean(fineTuneReadiness?.ok);
  const ftReady = Boolean(ftOk && fineTuneReadiness?.ready);
  const ftStatus = String(fineTuneReadiness?.status || "not_ready");
  const ftQualified = Number(fineTuneReadiness?.dataset?.qualified_examples ?? 0);
  const ftPassRate = Number(fineTuneReadiness?.qa?.pass_rate ?? 0);
  const ftRecentPass = Number(fineTuneReadiness?.dataset?.recent_pass_30d ?? 0);
  const ftMinExamples = Number(fineTuneReadiness?.thresholds?.min_examples ?? 0);
  const ftMinRecentPass = Number(
    fineTuneReadiness?.thresholds?.min_recent_pass_30d ?? 0,
  );
  const ftMinPassRate = Number(fineTuneReadiness?.thresholds?.min_pass_rate ?? 0);
  const ftBlockers: string[] = Array.isArray(fineTuneReadiness?.blockers)
    ? fineTuneReadiness.blockers
    : [];

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
              href="/app/admin/quality"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Quality
            </Link>
            <Link
              href="/app/admin/funnel"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Funnel
            </Link>
            <Link
              href="/app/admin/rollout"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Rollout
            </Link>
            <Link
              href="/app/admin/readiness"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Readiness
            </Link>
            <Link
              href="/app/admin/compliance"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Compliance
            </Link>
            <Link
              href="/app/admin/tickets"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Tickets
            </Link>
            <Link
              href="/app/admin/ops"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Ops
            </Link>
            <Link
              href="/app/admin/deliverability"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Deliverability
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
              rel="noopener noreferrer"
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

        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card
            title="Freigaben ohne Korrektur (7 Tage)"
            value={aqRatePct === null ? "–" : `${aqRatePct}%`}
            tone={aqRatePct !== null && aqRatePct < 70 ? "warning" : "neutral"}
          />
          <Card title="Geprüfte Freigaben (7 Tage)" value={aqTotal} />
          <Card
            title="Mit Korrektur (7 Tage)"
            value={aqEdited}
            tone={aqEdited > 0 ? "warning" : "neutral"}
          />
          <Card
            title="Trend zur Vorwoche"
            value={
              aqDeltaPp === null
                ? "–"
                : `${aqDeltaPp >= 0 ? "+" : ""}${aqDeltaPp} pp`
            }
            tone={aqDeltaPp !== null && aqDeltaPp < 0 ? "warning" : "neutral"}
          />
        </div>

        <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Sprint 3 · Produktvertrauen KPIs (7 Tage)
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Ziel: +15% Freigabe-zu-Senden, -20% manuelle Korrekturzeit
                (gegenüber Vorwoche).
              </div>
            </div>
            <Link
              href="/app/admin/quality"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs hover:bg-gray-50"
            >
              Quality öffnen
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
              <div className="text-[11px] text-gray-500">Freigabe → Gesendet</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {approvalToSendRatePct === null ? "–" : `${approvalToSendRatePct}%`}
              </div>
              <div className="mt-1 text-[11px] text-gray-600">
                {Number(approvalToSend.current_sent ?? 0)}/
                {Number(approvalToSend.current_total ?? 0)} Freigaben wurden gesendet.
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
              <div className="text-[11px] text-gray-500">Trend vs. Vorwoche</div>
              <div
                className={`mt-1 text-lg font-semibold ${
                  approvalToSendRelChangePct !== null && approvalToSendRelChangePct < 0
                    ? "text-red-700"
                    : "text-gray-900"
                }`}
              >
                {approvalToSendRelChangePct === null
                  ? "–"
                  : `${approvalToSendRelChangePct >= 0 ? "+" : ""}${approvalToSendRelChangePct}%`}
              </div>
              <div className="mt-1 text-[11px] text-gray-600">
                Vorwoche:{" "}
                {approvalToSendPrevRatePct === null
                  ? "–"
                  : `${approvalToSendPrevRatePct}%`}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
              <div className="text-[11px] text-gray-500">Median Korrekturzeit</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {formatSec(correctionMedianSec)}
              </div>
              <div className="mt-1 text-[11px] text-gray-600">
                Bearbeitete Fälle: {Number(correctionTime.current_edited_count ?? 0)}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
              <div className="text-[11px] text-gray-500">Korrekturzeit vs. Vorwoche</div>
              <div
                className={`mt-1 text-lg font-semibold ${
                  correctionRelChangePct !== null && correctionRelChangePct > 0
                    ? "text-red-700"
                    : "text-gray-900"
                }`}
              >
                {correctionRelChangePct === null
                  ? "–"
                  : `${correctionRelChangePct >= 0 ? "+" : ""}${correctionRelChangePct}%`}
              </div>
              <div className="mt-1 text-[11px] text-gray-600">
                Vorwoche: {formatSec(correctionMedianPrevSec)}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full border px-2 py-1 ${
                sprint3GoalSendMet
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              Ziel 1 (+15%): {sprint3GoalSendMet ? "erreicht" : "noch offen"}
            </span>
            <span
              className={`rounded-full border px-2 py-1 ${
                sprint3GoalCorrectionMet
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              Ziel 2 (-20%): {sprint3GoalCorrectionMet ? "erreicht" : "noch offen"}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Fine-Tune Readiness · Reply Writer
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Automatischer Trigger-Status für den nächsten Fine-Tune-Start.
              </div>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                !ftOk
                  ? "border-red-200 bg-red-50 text-red-800"
                  : ftReady
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : ftStatus === "warming_up"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-gray-200 bg-gray-50 text-gray-700"
              }`}
            >
              {!ftOk
                ? "Readiness-Check Fehler"
                : ftReady
                  ? "Ready für Fine-Tune"
                  : ftStatus === "warming_up"
                    ? "Im Aufbau"
                    : "Noch nicht ready"}
            </span>
          </div>

          {!ftOk ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {String(fineTuneReadiness?.error || "Readiness konnte nicht geladen werden.")}
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                  <div className="text-[11px] text-gray-500">Qualifizierte Beispiele</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {ftQualified}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-600">
                    Ziel: mindestens {ftMinExamples}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                  <div className="text-[11px] text-gray-500">QA-Pass-Rate</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {(ftPassRate * 100).toFixed(1)}%
                  </div>
                  <div className="mt-1 text-[11px] text-gray-600">
                    Ziel: mindestens {(ftMinPassRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                  <div className="text-[11px] text-gray-500">Pass-Fälle (30 Tage)</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {ftRecentPass}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-600">
                    Ziel: mindestens {ftMinRecentPass}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                  <div className="text-[11px] text-gray-500">QA-Fälle im Fenster</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {Number(fineTuneReadiness?.qa?.total ?? 0)}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-600">
                    seit {new Date(String(fineTuneReadiness?.since || new Date())).toLocaleDateString("de-DE")}
                  </div>
                </div>
              </div>

              {ftBlockers.length > 0 ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="text-xs font-medium text-amber-900">
                    Warum noch nicht ready
                  </div>
                  <ul className="mt-1 list-disc pl-4 text-xs text-amber-900 space-y-1">
                    {ftBlockers.slice(0, 4).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href="/api/admin/ai/finetune-readiness"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs hover:bg-gray-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Readiness JSON
                </a>
                <span className="text-xs text-gray-600">
                  {String(
                    fineTuneReadiness?.recommendation ||
                      "Noch keine Empfehlung vorhanden.",
                  )}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mt-2 text-xs text-gray-600">
          Basis: nur Freigaben mit menschlicher Entscheidung aus{" "}
          <code>approval_review_v1</code>. Ohne Korrektur = direkt freigegeben;
          mit Korrektur = Text vor Versand geändert.
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc]">
            <div className="font-medium">Schnellzugriff</div>
            <div className="text-sm text-gray-600">
              Spring direkt in Debug-/Support-Views. Alles von hier – keine
              Navbar nötig.
            </div>
          </div>
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
              href="/app/admin/tickets"
              className="group rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="text-sm text-gray-600">Support</div>
              <div className="mt-1 text-lg font-semibold">Tickets</div>
              <div className="mt-2 text-sm text-gray-600">
                Owner, SLA, Verlauf und Notizen für jeden Vorfall.
              </div>
              <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-900">
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
              href="/app/admin/quality"
              className="group rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="text-sm text-gray-600">Performance</div>
              <div className="mt-1 text-lg font-semibold">Quality</div>
              <div className="mt-2 text-sm text-gray-600">
                Korrekturquote, Fehlerrate und Antwortverhalten pro Agent.
              </div>
              <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-900">
                Öffnen →
              </div>
            </Link>

            <Link
              href="/app/admin/ops"
              className="group rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="text-sm text-gray-600">Monitoring</div>
              <div className="mt-1 text-lg font-semibold">Ops</div>
              <div className="mt-2 text-sm text-gray-600">
                Alert-Regeln, Pipeline-Status und Notfall-Pause zentral steuern.
              </div>
              <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-900">
                Öffnen →
              </div>
            </Link>

            <Link
              href="/app/admin/funnel"
              className="group rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="text-sm text-gray-600">Onboarding</div>
              <div className="mt-1 text-lg font-semibold">Funnel</div>
              <div className="mt-2 text-sm text-gray-600">
                Start, Drop-off, Abschlussrate und Event-Verteilung pro Agent.
              </div>
              <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-900">
                Öffnen →
              </div>
            </Link>

            <Link
              href="/app/admin/rollout"
              className="group rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="text-sm text-gray-600">Steuerung</div>
              <div className="mt-1 text-lg font-semibold">Rollout</div>
              <div className="mt-2 text-sm text-gray-600">
                Beobachten, Assist oder Autopilot je Agent kontrollieren.
              </div>
              <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-900">
                Öffnen →
              </div>
            </Link>

            <Link
              href="/app/admin/readiness"
              className="group rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="text-sm text-gray-600">Datenlage</div>
              <div className="mt-1 text-lg font-semibold">Readiness</div>
              <div className="mt-2 text-sm text-gray-600">
                Immobilien-Datenqualität und Autopilot-Eignung je Agent.
              </div>
              <div className="mt-3 text-xs text-gray-500 group-hover:text-gray-900">
                Öffnen →
              </div>
            </Link>

            <Link
              href="/app/admin/compliance"
              className="group rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
            >
              <div className="text-sm text-gray-600">Trust</div>
              <div className="mt-1 text-lg font-semibold">Compliance</div>
              <div className="mt-2 text-sm text-gray-600">
                Audit-Feed, Guardrails und CSV-Exporte für Nachweise.
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

        <SupportHub />
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
