"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Database } from "@/types/supabase";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import InboxItem from "../nachrichten/components/InboxItem";
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Clock,
  Copy,
  Download,
  Mail,
  RotateCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Square,
  X,
} from "lucide-react";

type Lead = Omit<Database["public"]["Tables"]["leads"]["Row"], "key_info"> & {
  key_info?: any;
};

interface EskalationenUIProps {
  leads: Lead[];
  userId: string;
}

type SortKey =
  | "updated_desc"
  | "updated_asc"
  | "priority_desc"
  | "priority_asc";

type EscalationFilter = "all" | "open" | "closed";

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

function formatAgeFromUpdatedAt(updatedAt: unknown): string {
  const t = new Date(String(updatedAt ?? "")).getTime();
  if (!Number.isFinite(t) || t <= 0) return "–";
  const diffMs = Date.now() - t;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

function ageBadgeTone(updatedAt: unknown): "ok" | "warn" | "bad" {
  const t = new Date(String(updatedAt ?? "")).getTime();
  if (!Number.isFinite(t) || t <= 0) return "ok";
  const hours = (Date.now() - t) / 36e5;
  if (hours >= 48) return "bad";
  if (hours >= 24) return "warn";
  return "ok";
}

function toCsv(rows: Array<Record<string, any>>): string {
  const headers = Object.keys(rows[0] ?? {});
  const esc = (v: any) => {
    const s = String(v ?? "")
      .replace(/\r?\n/g, " ")
      .trim();
    const q = s.replace(/"/g, '""');
    return `"${q}"`;
  };
  const lines = [headers.map(esc).join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => esc(r[h])).join(","));
  }
  return lines.join("\n");
}

function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8"
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EskalationenUI({ leads, userId }: EskalationenUIProps) {
  const supabase = useSupabaseClient<Database>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep local copy so we can do UI-only updates without a full page reload.
  const [localLeads, setLocalLeads] = useState<Lead[]>(leads ?? []);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("updated_desc");
  const [statusFilter, setStatusFilter] = useState<EscalationFilter>("all");

  const [onlyWithEmail, setOnlyWithEmail] = useState(false);
  const [onlyHighPriority, setOnlyHighPriority] = useState(false);

  // pagination
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState<number>(1);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

  const refreshBusyRef = useRef(false);

  // Sync when server prop changes (navigation / reload)
  useEffect(() => {
    setLocalLeads(leads ?? []);
  }, [leads]);

  // URL -> state init
  useEffect(() => {
    const q = searchParams?.get("q") ?? "";
    const sort = (searchParams?.get("sort") as SortKey) ?? "updated_desc";
    const status = (searchParams?.get("status") as EscalationFilter) ?? "all";
    const email = searchParams?.get("email") === "1";
    const high = searchParams?.get("high") === "1";
    const ps = Number(searchParams?.get("ps") ?? "50");
    const p = Number(searchParams?.get("p") ?? "1");

    if (q) setSearchQuery(q);
    if (sort) setSortBy(sort);
    if (status) setStatusFilter(status);
    setOnlyWithEmail(email);
    setOnlyHighPriority(high);
    if (Number.isFinite(ps) && ps > 0) setPageSize(ps);
    if (Number.isFinite(p) && p > 0) setPage(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // state -> URL persistence
  useEffect(() => {
    const sp = new URLSearchParams();
    if (searchQuery.trim()) sp.set("q", searchQuery.trim());
    if (sortBy) sp.set("sort", sortBy);
    if (statusFilter) sp.set("status", statusFilter);
    if (onlyWithEmail) sp.set("email", "1");
    if (onlyHighPriority) sp.set("high", "1");
    if (pageSize !== 50) sp.set("ps", String(pageSize));
    if (page !== 1) sp.set("p", String(page));
    const qs = sp.toString();
    router.replace(qs ? `?${qs}` : "?");
  }, [
    searchQuery,
    sortBy,
    statusFilter,
    onlyWithEmail,
    onlyHighPriority,
    pageSize,
    page,
    router,
  ]);

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected]
  );

  const clearSelection = () => setSelected({});
  const toggleSelected = (id: string) =>
    setSelected((p) => ({ ...p, [id]: !p[id] }));

  const counts = useMemo(() => {
    const open = (localLeads ?? []).filter((l) => {
      const s = safeStr((l as any).status).toLowerCase();
      return !s || s === "open";
    }).length;

    const closed = (localLeads ?? []).filter(
      (l) => safeStr((l as any).status).toLowerCase() === "closed"
    ).length;

    return { open, closed, total: localLeads?.length ?? 0 };
  }, [localLeads]);

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const base = (localLeads ?? []).filter((lead) => {
      // Status filter (best-effort)
      if (statusFilter !== "all") {
        const status = safeStr((lead as any).status).toLowerCase();
        if (statusFilter === "open" && status && status !== "open")
          return false;
        if (statusFilter === "closed" && status && status !== "closed")
          return false;
      }

      if (onlyWithEmail) {
        const email = safeStr((lead as any).email);
        if (!email) return false;
      }

      if (onlyHighPriority) {
        const pri = Number((lead as any).priority ?? 0);
        if (pri < 2) return false;
      }

      if (!q) return true;

      const name = safeStr((lead as any).name).toLowerCase();
      const email = safeStr((lead as any).email).toLowerCase();
      const lastMsg = safeStr((lead as any).last_message).toLowerCase();
      const keyInfo = safeStr((lead as any).key_info).toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        lastMsg.includes(q) ||
        keyInfo.includes(q)
      );
    });

    const sorted = [...base].sort((a, b) => {
      const aPri = Number((a as any).priority ?? 0);
      const bPri = Number((b as any).priority ?? 0);
      const aUpd = new Date((a as any).updated_at ?? 0).getTime();
      const bUpd = new Date((b as any).updated_at ?? 0).getTime();

      switch (sortBy) {
        case "priority_desc":
          return bPri - aPri;
        case "priority_asc":
          return aPri - bPri;
        case "updated_asc":
          return aUpd - bUpd;
        case "updated_desc":
        default:
          return bUpd - aUpd;
      }
    });

    return sorted;
  }, [
    localLeads,
    searchQuery,
    sortBy,
    statusFilter,
    onlyWithEmail,
    onlyHighPriority,
  ]);

  const shownCount = filteredLeads.length;

  const totalPages = Math.max(1, Math.ceil(shownCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage]);

  const pagedLeads = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, safePage, pageSize]);

  const selectAllShown = () =>
    setSelected((p) => {
      const copy = { ...p };
      for (const l of pagedLeads) copy[l.id] = true;
      return copy;
    });

  const deselectAllShown = () =>
    setSelected((p) => {
      const copy = { ...p };
      for (const l of pagedLeads) delete copy[l.id];
      return copy;
    });

  const bulkUpdateStatus = async (nextStatus: "open" | "closed") => {
    if (selectedIds.length === 0) return;
    try {
      setBulkBusy(true);
      const { error } = await supabase
        .from("leads")
        .update({ status: nextStatus } as any)
        .in("id", selectedIds);

      if (error) throw error;

      // UI sync
      setLocalLeads((prev) =>
        prev.map((l) =>
          selectedIds.includes(l.id)
            ? ({ ...(l as any), status: nextStatus } as any)
            : l
        )
      );

      toast.success(
        nextStatus === "closed"
          ? `Als erledigt markiert (${selectedIds.length}).`
          : `Wieder geöffnet (${selectedIds.length}).`
      );

      clearSelection();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Konnte Status nicht aktualisieren.");
    } finally {
      setBulkBusy(false);
    }
  };

  const copySelectedEmails = async () => {
    const emails = selectedIds
      .map((id) => filteredLeads.find((l) => l.id === id))
      .map((l) => safeStr((l as any)?.email))
      .filter(Boolean);

    if (emails.length === 0) {
      toast.error("Keine E-Mails in der Auswahl.");
      return;
    }

    try {
      await navigator.clipboard.writeText(emails.join(", "));
      toast.success(`${emails.length} E-Mails kopiert.`);
    } catch {
      toast.error("Konnte nicht kopieren.");
    }
  };

  // Refresh: safe mode (only updates leads that are already in the escalation list)
  const refreshLeads = useCallback(async () => {
    if (refreshBusyRef.current) return;
    refreshBusyRef.current = true;

    try {
      const currentIds = new Set((localLeads ?? []).map((l) => l.id));
      if (currentIds.size === 0) {
        toast.error("Keine Eskalationen zum Aktualisieren.");
        return;
      }

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("id", Array.from(currentIds))
        .limit(500);

      if (error) throw error;

      const byId = new Map<string, any>();
      for (const row of data ?? []) byId.set(String((row as any).id), row);

      setLocalLeads((prev) =>
        prev.map((l) => {
          const upd = byId.get(l.id);
          return upd ? ({ ...(l as any), ...(upd as any) } as any) : l;
        })
      );

      toast.success("Aktualisiert.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Konnte nicht aktualisieren.");
    } finally {
      refreshBusyRef.current = false;
    }
  }, [supabase, localLeads]);

  // Realtime: safe mode (updates only existing)
  useEffect(() => {
    if (!userId) return;

    const ch = supabase
      .channel(`escalations-leads-safe-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `agent_id=eq.${userId}`,
        },
        (payload) => {
          const row: any = payload.new;
          const id = String(row?.id ?? "");
          if (!id) return;

          setLocalLeads((prev) => {
            const idx = prev.findIndex((x) => x.id === id);

            // Only update items already shown as escalated (safe, because we lack an escalation flag)
            if (idx === -1) return prev;

            if (payload.eventType === "DELETE") {
              const copy = [...prev];
              copy.splice(idx, 1);
              return copy;
            }

            const copy = [...prev];
            copy[idx] = { ...(copy[idx] as any), ...(row as any) };
            return copy;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, userId]);

  // Clean selection when filters/pagination change (avoid phantom selections)
  useEffect(() => {
    setSelected((prev) => {
      const setShown = new Set(pagedLeads.map((l) => l.id));
      const next: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v && setShown.has(k)) next[k] = true;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    sortBy,
    statusFilter,
    onlyWithEmail,
    onlyHighPriority,
    safePage,
    pageSize,
  ]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200">
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-semibold">
                  Eskalationen
                </h1>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                  Advaic
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                  Angezeigt: {shownCount}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                  Offen: {counts.open}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                  Erledigt: {counts.closed}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Eskalierte Gespräche werden nicht automatisch beantwortet – hier
                übernimmt dein Team manuell.
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suche… (Name, E-Mail, Nachricht)"
                  className="w-64 pl-9 pr-9 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
                    title="Suche löschen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status filter */}
              <select
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as EscalationFilter);
                  setPage(1);
                }}
                title="Status"
              >
                <option value="all">Alle</option>
                <option value="open">Offen</option>
                <option value="closed">Erledigt</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setOnlyWithEmail((v) => !v);
                  setPage(1);
                }}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  onlyWithEmail
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                title="Nur Interessenten mit E-Mail"
              >
                <Mail className="h-4 w-4 inline-block mr-2" />
                Mit E-Mail
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnlyHighPriority((v) => !v);
                  setPage(1);
                }}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  onlyHighPriority
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                title="Nur hohe Priorität (>= 2)"
              >
                <ShieldAlert className="h-4 w-4 inline-block mr-2" />
                Hoch
              </button>

              {/* Sort */}
              <div className="hidden sm:flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                <select
                  className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  title="Sortierung"
                >
                  <option value="updated_desc">Neueste zuerst</option>
                  <option value="updated_asc">Älteste zuerst</option>
                  <option value="priority_desc">
                    Priorität: hoch → niedrig
                  </option>
                  <option value="priority_asc">
                    Priorität: niedrig → hoch
                  </option>
                </select>
              </div>

              {/* refresh */}
              <button
                type="button"
                onClick={refreshLeads}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Neu laden"
              >
                <RotateCw className="h-4 w-4 inline-block mr-2" />
                Aktualisieren
              </button>

              {/* csv */}
              <button
                type="button"
                onClick={() => {
                  const rows = (
                    selectedIds.length
                      ? selectedIds
                      : filteredLeads.map((l) => l.id)
                  )
                    .map((id) => filteredLeads.find((l) => l.id === id))
                    .filter(Boolean)
                    .map((l: any) => ({
                      id: l.id,
                      name: safeStr(l.name),
                      email: safeStr(l.email),
                      priority: Number(l.priority ?? 0),
                      status: safeStr(l.status),
                      updated_at: safeStr(l.updated_at),
                      last_message: safeStr(l.last_message),
                    }));

                  if (rows.length === 0) {
                    toast.error("Nichts zum Exportieren.");
                    return;
                  }

                  const csv = toCsv(rows as any);
                  const stamp = new Date().toISOString().slice(0, 10);
                  downloadTextFile(
                    `eskalationen-${stamp}.csv`,
                    csv,
                    "text/csv;charset=utf-8"
                  );
                  toast.success(`CSV exportiert (${rows.length}).`);
                }}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="CSV exportieren (Auswahl oder alle Treffer)"
              >
                <Download className="h-4 w-4 inline-block mr-2" />
                CSV
              </button>

              {/* page size */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-gray-500">Pro Seite</span>
                <select
                  className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  title="Einträge pro Seite"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Suche… (Name, E-Mail, Nachricht)"
                className="w-full pl-9 pr-9 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
                  title="Suche löschen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="py-6">
          {/* Info banner */}
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-amber-900">
                  Automatische Antworten sind deaktiviert
                </div>
                <div className="text-sm text-amber-800 mt-1">
                  Sobald ein Gespräch eskaliert wird (automatisch oder manuell),
                  stoppt Advaic die Auto-Antworten. Bearbeite diese
                  Interessenten manuell und markiere sie anschließend als
                  erledigt.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between gap-3">
              <div className="text-sm text-gray-600 inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Sortierung:{" "}
                <span className="font-medium">{labelForSort(sortBy)}</span>
              </div>
              <div className="text-xs text-gray-500 hidden sm:block">
                Tipp: Öffne die Konversation und antworte direkt.
              </div>
            </div>

            <div className="p-4 md:p-6">
              {selectedIds.length > 0 && (
                <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-sm text-gray-700 inline-flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    <span className="font-medium">{selectedIds.length}</span>
                    <span>ausgewählt</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        selectedIds.length === pagedLeads.length
                          ? deselectAllShown()
                          : selectAllShown()
                      }
                      className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                      disabled={bulkBusy}
                    >
                      {selectedIds.length === pagedLeads.length
                        ? "Alles abwählen"
                        : "Alles auswählen"}
                    </button>

                    <button
                      type="button"
                      onClick={copySelectedEmails}
                      className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                      disabled={bulkBusy}
                      title="E-Mails der Auswahl kopieren"
                    >
                      <Mail className="h-4 w-4 inline-block mr-2" />
                      E-Mails kopieren
                    </button>

                    <button
                      type="button"
                      onClick={() => bulkUpdateStatus("closed")}
                      className="px-3 py-2 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                      disabled={bulkBusy}
                      title="Als erledigt markieren"
                    >
                      <CheckCircle2 className="h-4 w-4 inline-block mr-2" />
                      Erledigt
                    </button>

                    <button
                      type="button"
                      onClick={() => bulkUpdateStatus("open")}
                      className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                      disabled={bulkBusy}
                      title="Wieder öffnen"
                    >
                      Offen
                    </button>

                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                      disabled={bulkBusy}
                    >
                      <X className="h-4 w-4 inline-block mr-2" />
                      Auswahl löschen
                    </button>
                  </div>
                </div>
              )}

              {/* pagination info */}
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-gray-500">
                  Seite{" "}
                  <span className="font-medium text-gray-700">{safePage}</span>{" "}
                  / {totalPages} · Gesamt Treffer: {shownCount}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Zurück
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Weiter
                  </button>
                </div>
              </div>

              {filteredLeads.length === 0 ? (
                <EmptyState
                  title="Keine eskalierten Interessenten"
                  subtitle={
                    searchQuery.trim()
                      ? "Keine Treffer für deine Suche."
                      : "Aktuell ist alles ruhig — keine offenen Eskalationen."
                  }
                />
              ) : (
                <div className="space-y-2">
                  {pagedLeads.map((lead) => {
                    const checked = !!selected[lead.id];
                    const tone = ageBadgeTone((lead as any).updated_at);
                    const ageCls =
                      tone === "bad"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : tone === "warn"
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-white border-gray-200 text-gray-700";

                    return (
                      <div
                        key={lead.id}
                        className={`group flex items-stretch gap-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${
                          checked ? "ring-2 ring-amber-300/40" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSelected(lead.id)}
                          className="p-3 text-gray-500 hover:text-gray-900"
                          title={checked ? "Auswahl entfernen" : "Auswählen"}
                        >
                          {checked ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 p-1">
                          <InboxItem lead={lead as any} userId={userId} />
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2 p-3">
                          <span
                            className={`text-[11px] font-medium px-2 py-1 rounded-full border ${ageCls}`}
                            title="Zeit seit letztem Update"
                          >
                            Alter:{" "}
                            {formatAgeFromUpdatedAt((lead as any).updated_at)}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="px-3 py-2 text-xs rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                              onClick={async () => {
                                const email = safeStr((lead as any).email);
                                if (!email) {
                                  toast.error("Keine E-Mail vorhanden.");
                                  return;
                                }
                                try {
                                  await navigator.clipboard.writeText(email);
                                  toast.success("E-Mail kopiert.");
                                } catch {
                                  toast.error("Konnte nicht kopieren.");
                                }
                              }}
                              title="E-Mail kopieren"
                            >
                              <Copy className="h-4 w-4 inline-block mr-2" />
                              Kopieren
                            </button>

                            <button
                              type="button"
                              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                                safeStr((lead as any).status).toLowerCase() ===
                                "closed"
                                  ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                              }`}
                              disabled={bulkBusy}
                              onClick={async () => {
                                const nextStatus =
                                  safeStr(
                                    (lead as any).status
                                  ).toLowerCase() === "closed"
                                    ? "open"
                                    : "closed";
                                try {
                                  const { error } = await supabase
                                    .from("leads")
                                    .update({ status: nextStatus } as any)
                                    .eq("id", lead.id);

                                  if (error) throw error;

                                  toast.success(
                                    nextStatus === "closed"
                                      ? "Als erledigt markiert."
                                      : "Wieder geöffnet."
                                  );

                                  setLocalLeads((prev) =>
                                    prev.map((x) =>
                                      x.id === lead.id
                                        ? ({
                                            ...(x as any),
                                            status: nextStatus,
                                          } as any)
                                        : x
                                    )
                                  );
                                } catch (e: any) {
                                  console.error(e);
                                  toast.error(
                                    e?.message ??
                                      "Konnte Status nicht aktualisieren."
                                  );
                                }
                              }}
                              title="Status toggeln"
                            >
                              <CheckCircle2 className="h-4 w-4 inline-block mr-2" />
                              {safeStr((lead as any).status).toLowerCase() ===
                              "closed"
                                ? "Offen"
                                : "Erledigt"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function labelForSort(sortBy: SortKey): string {
  switch (sortBy) {
    case "updated_desc":
      return "Neueste zuerst";
    case "updated_asc":
      return "Älteste zuerst";
    case "priority_desc":
      return "Priorität: hoch → niedrig";
    case "priority_asc":
      return "Priorität: niedrig → hoch";
    default:
      return "—";
  }
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-[#fbfbfc] p-6 text-center">
      <div className="inline-flex items-center gap-2 text-gray-900 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div className="text-sm text-gray-600 mt-2">{subtitle}</div>
    </div>
  );
}
