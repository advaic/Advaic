"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Unlock,
  RotateCw,
} from "lucide-react";

type OutboxRow = {
  message_id: string;
  agent_id: string;
  lead_id: string;

  agent_email: string | null;
  agent_name: string | null;

  lead_name: string | null;
  lead_email: string | null;

  provider: "gmail" | "outlook" | "unknown";
  status: string | null; // high-level message status
  approval_required: boolean | null;

  send_status: "pending" | "sending" | "sent" | "failed" | string | null;
  send_locked_at: string | null;
  send_error: string | null;
  sent_at: string | null;

  timestamp: string | null; // message timestamp
  text_preview: string | null;
};

type TabKey = "failed" | "stuck" | "pending" | "all";

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("de-DE");
  } catch {
    return String(dt);
  }
}

function ageMinutes(dt?: string | null) {
  if (!dt) return null;
  const t = new Date(dt).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 60000);
}

export default function AdminOutboxPage() {
  const [tab, setTab] = useState<TabKey>("failed");
  const [rows, setRows] = useState<OutboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");

  const setBusyFor = (id: string, v: boolean) =>
    setBusy((p) => ({ ...p, [id]: v }));

  async function load(opts?: { silent?: boolean }) {
    try {
      if (!opts?.silent) setLoading(true);

      const res = await fetch(`/app/admin/outbox/list?tab=${encodeURIComponent(tab)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "list_failed");

      setRows((data?.rows || []) as OutboxRow[]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Konnte Outbox nicht laden.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // auto-refresh (light)
  useEffect(() => {
    const t = setInterval(() => load({ silent: true }), 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
      const hay =
        `${r.agent_email ?? ""} ${r.agent_name ?? ""} ` +
        `${r.lead_name ?? ""} ${r.lead_email ?? ""} ` +
        `${r.send_error ?? ""} ${r.text_preview ?? ""} ` +
        `${r.provider ?? ""} ${r.send_status ?? ""} ${r.status ?? ""}`;
      return hay.toLowerCase().includes(s);
    });
  }, [rows, q]);

  const counts = useMemo(() => {
    const failed = rows.filter(
      (r) => String(r.send_status) === "failed",
    ).length;
    const pending = rows.filter(
      (r) => String(r.send_status) === "pending",
    ).length;

    const stuck = rows.filter((r) => {
      if (String(r.send_status) !== "sending") return false;
      const mins = ageMinutes(r.send_locked_at);
      return mins !== null && mins >= 10;
    }).length;

    return { failed, stuck, pending, all: rows.length };
  }, [rows]);

  async function unlock(messageId: string) {
    if (busy[messageId]) return;
    try {
      setBusyFor(messageId, true);
      const res = await fetch("/app/admin/outbox/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "unlock_failed");

      toast.success("Lock entfernt. Status auf failed gesetzt (retry-fähig).");
      await load({ silent: true });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Unlock fehlgeschlagen.");
    } finally {
      setBusyFor(messageId, false);
    }
  }

  async function retry(messageId: string) {
    if (busy[messageId]) return;
    try {
      setBusyFor(messageId, true);
      const res = await fetch("/app/admin/outbox/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, runNow: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "retry_failed");

      toast.success("Retry angestoßen.");
      await load({ silent: true });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Retry fehlgeschlagen.");
    } finally {
      setBusyFor(messageId, false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-semibold">
                Admin · Outbox
              </h1>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200 inline-flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                Advaic Admin
              </span>
              <span className="text-xs text-gray-500 hidden sm:inline">
                Send-Probleme in 10 Sekunden sichtbar.
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Failed / Stuck / Pending — inkl. Aktionen (Unlock, Retry).
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Suche… (Agent, Lead, Error, Text)"
                className="w-72 pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              />
            </div>

            <button
              onClick={() => load({ silent: true })}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              title="Neu laden"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs + mobile search */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="inline-flex gap-2 rounded-2xl border border-gray-200 bg-white p-1 w-fit">
            <TabButton
              active={tab === "failed"}
              onClick={() => setTab("failed")}
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Failed"
              count={counts.failed}
            />
            <TabButton
              active={tab === "stuck"}
              onClick={() => setTab("stuck")}
              icon={<Clock className="h-4 w-4" />}
              label="Stuck"
              count={counts.stuck}
            />
            <TabButton
              active={tab === "pending"}
              onClick={() => setTab("pending")}
              icon={<RotateCw className="h-4 w-4" />}
              label="Pending"
              count={counts.pending}
            />
            <TabButton
              active={tab === "all"}
              onClick={() => setTab("all")}
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="All"
              count={counts.all}
            />
          </div>

          <div className="md:hidden relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suche…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            />
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              {tab === "failed" && <>Failed Sends (Provider/Network/Lock). </>}
              {tab === "stuck" && (
                <>Sending-Stuck (Lock älter als 10 Minuten). </>
              )}
              {tab === "pending" && <>Pending (warten auf Runner). </>}
              {tab === "all" && <>Alles, was nicht “clean” ist. </>}
              <span className="text-xs text-gray-500">
                Klick auf Lead → Nachrichtenseite.
              </span>
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              Auto-Refresh: alle 8s
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="h-20 bg-gray-100 rounded-2xl animate-pulse mb-3" />
              <div className="h-20 bg-gray-100 rounded-2xl animate-pulse mb-3" />
              <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <div className="inline-flex items-center gap-2 font-medium text-gray-900">
                <CheckCircle2 className="h-4 w-4" />
                Keine Einträge.
              </div>
              <div className="mt-2 text-sm">
                Das ist gut — keine stuck/failed/pending Jobs.
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-3">
              {filtered.map((r) => {
                const minsLocked = ageMinutes(r.send_locked_at);
                const isStuck =
                  String(r.send_status) === "sending" &&
                  minsLocked !== null &&
                  minsLocked >= 10;

                return (
                  <div
                    key={r.message_id}
                    className="border border-gray-200 rounded-2xl p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium px-2 py-1 rounded-full border border-gray-200 bg-gray-50">
                            {r.provider}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full border ${
                              String(r.send_status) === "failed"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : isStuck
                                  ? "border-amber-200 bg-amber-50 text-amber-800"
                                  : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            {String(r.send_status)}
                            {isStuck ? ` • stuck ${minsLocked}m` : ""}
                          </span>

                          {r.approval_required ? (
                            <span className="text-xs font-medium px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                              needs approval
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800">
                              auto-send lane
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-sm">
                          <div className="font-medium text-gray-900">
                            Agent: {r.agent_name ?? "—"}{" "}
                            <span className="text-gray-500">
                              • {r.agent_email ?? "—"}
                            </span>
                          </div>
                          <div className="text-gray-700">
                            Lead: {r.lead_name ?? "—"}{" "}
                            <span className="text-gray-500">
                              • {r.lead_email ?? "—"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          message_id:{" "}
                          <span className="font-mono">{r.message_id}</span> ·
                          lead_id:{" "}
                          <span className="font-mono">{r.lead_id}</span>
                        </div>

                        <div className="mt-2 text-sm text-gray-700 line-clamp-2">
                          {r.text_preview ?? "—"}
                        </div>

                        {r.send_error && (
                          <div className="mt-2 text-xs text-red-600">
                            Error: {r.send_error}
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-500">
                          created/timestamp: {fmt(r.timestamp)} · locked_at:{" "}
                          {fmt(r.send_locked_at)} · sent_at: {fmt(r.sent_at)}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Link
                          href={`/app/nachrichten/${r.lead_id}`}
                          className="text-xs inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2"
                        >
                          Lead öffnen
                        </Link>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => unlock(r.message_id)}
                            disabled={!!busy[r.message_id]}
                            className="text-xs inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 disabled:opacity-60"
                            title="Lock entfernen (setzt send_status=failed)"
                          >
                            {busy[r.message_id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                            Unlock
                          </button>

                          <button
                            onClick={() => retry(r.message_id)}
                            disabled={!!busy[r.message_id]}
                            className="text-xs inline-flex items-center gap-2 rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 px-3 py-2 disabled:opacity-60"
                            title="Retry (setzt pending + optional Pipeline runNow)"
                          >
                            {busy[r.message_id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCw className="h-4 w-4" />
                            )}
                            Retry
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Hinweis: Unlock/Retry sind Admin-Aktionen. Retry setzt pending und
          kann optional sofort den Pipeline-Runner triggern.
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm rounded-xl transition-colors inline-flex items-center gap-2 ${
        active
          ? "bg-gray-900 text-amber-200"
          : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
      <span
        className={`text-[11px] px-2 py-0.5 rounded-full border ${
          active
            ? "border-amber-300/40 bg-gray-900 text-amber-200"
            : "border-gray-200 bg-gray-50 text-gray-700"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
