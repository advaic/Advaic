"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import { Archive, CheckCircle2, X } from "lucide-react";

import { Lead } from "@/types/lead";
import InboxItem from "./InboxItem";
import { SupabaseContext } from "@/app/ClientRootLayout";

function normalizePriority(p: unknown): "Hoch" | "Mittel" | "Niedrig" {
  const raw = String(p ?? "")
    .trim()
    .toLowerCase();

  if (raw === "hoch") return "Hoch";
  if (raw === "mittel") return "Mittel";
  if (raw === "niedrig" || raw === "niedrig.") return "Niedrig";

  if (raw === "hot" || raw === "high") return "Hoch";
  if (raw === "warm" || raw === "medium" || raw === "med") return "Mittel";
  if (raw === "cold" || raw === "low") return "Niedrig";

  const n = Number(raw);
  if (Number.isFinite(n)) {
    if (n >= 3) return "Hoch";
    if (n === 2) return "Mittel";
    if (n === 1) return "Niedrig";
  }

  return "Mittel";
}

type BulkAction = "archive" | "done";

export default function InboxView({
  leads,
  userId,
}: {
  leads: Lead[];
  userId?: string;
}) {
  const supabase = useSupabaseClient<Database>();
  const { session } = useContext(SupabaseContext);
  const effectiveUserId =
    userId && userId.length > 0 ? userId : session?.user?.id ?? "";

  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [pendingApprovalCountByLead, setPendingApprovalCountByLead] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    const normalized: Lead[] = (leads ?? []).map((lead) => ({
      ...lead,
      priority: normalizePriority((lead as any).priority),
    }));
    setLocalLeads(normalized);

    setSelectedIds((prev) => {
      const allowed = new Set(normalized.map((l) => l.id));
      const next = new Set<string>();
      for (const id of prev) if (allowed.has(id)) next.add(id);
      return next;
    });

    setPendingApprovalCountByLead((prev) => {
      const allowed = new Set(normalized.map((l) => l.id));
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (allowed.has(k)) next[k] = v;
      }
      return next;
    });
  }, [leads]);

  useEffect(() => {
    const ids = localLeads.map((l) => l.id);
    if (!ids.length) {
      setPendingApprovalCountByLead({});
      return;
    }

    let cancelled = false;

    async function loadPendingApprovals() {
      try {
        const { data, error } = await (supabase.from("messages") as any)
          .select("id, lead_id, status, approval_required")
          .in("lead_id", ids)
          .eq("approval_required", true)
          .in("status", ["needs_approval", "needs_human", "ready_to_send"])
          .order("timestamp", { ascending: false })
          .limit(1000);

        if (error) throw error;
        if (cancelled) return;

        const counts: Record<string, number> = {};
        for (const row of (data || []) as any[]) {
          const leadId = String(row.lead_id);
          counts[leadId] = (counts[leadId] || 0) + 1;
        }

        setPendingApprovalCountByLead(counts);
      } catch (e: any) {
        console.error("Failed to load pending approvals:", e);
      }
    }

    loadPendingApprovals();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, localLeads.map((l) => l.id).join(",")]);

  const allIds = useMemo(() => localLeads.map((l) => l.id), [localLeads]);
  const selectedCount = selectedIds.size;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());
  const selectAll = () => setSelectedIds(new Set(allIds));

  const applyBulk = async (action: BulkAction) => {
    if (!effectiveUserId) {
      toast.error("Nicht eingeloggt.");
      return;
    }
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setBulkBusy(true);

    const before = localLeads;
    const nowIso = new Date().toISOString();

    const patch: Record<string, any> = {};
    if (action === "archive") {
      patch.status = "archived";
      patch.archived_at = nowIso;
    } else if (action === "done") {
      patch.status = "done";
      patch.archived_at = nowIso;
    }

    // optimistic remove
    setLocalLeads((prev) => prev.filter((l) => !selectedIds.has(l.id)));
    setPendingApprovalCountByLead((prev) => {
      const next = { ...prev };
      for (const id of ids) delete next[id];
      return next;
    });

    try {
      const { data: updatedRows, error } = await (supabase.from("leads") as any)
        .update(patch)
        .in("id", ids)
        .select("id, status, archived_at");

      if (error) {
        console.error("Bulk update failed:", error);
        throw error;
      }

      const updatedCount = Array.isArray(updatedRows) ? updatedRows.length : 0;

      if (updatedCount !== ids.length) {
        console.warn(
          `Bulk update affected ${updatedCount}/${ids.length} rows. This is usually an RLS/ownership issue (agent_id mismatch) or stale IDs.`
        );
        toast.warning(
          `Nur ${updatedCount}/${ids.length} aktualisiert. Prüfe RLS + agent_id in leads.`
        );
      } else {
        toast.success(
          action === "done"
            ? `Erledigt (${ids.length}).`
            : `Archiviert (${ids.length}).`
        );
      }

      clearSelection();
    } catch (e: any) {
      console.error(e);
      const msg =
        e && typeof e === "object" && "message" in e && (e as any).message
          ? String((e as any).message)
          : "Bulk-Update fehlgeschlagen.";

      const code = (e as any)?.code ? ` (code ${(e as any).code})` : "";
      const details = (e as any)?.details ? ` – ${(e as any).details}` : "";

      toast.error(`${msg}${code}${details}`);
      setLocalLeads(before);
    } finally {
      setBulkBusy(false);
    }
  };

  if (!localLeads || localLeads.length === 0) {
    return (
      <div>
        <p className="text-gray-500 text-sm">Keine Interessenten gefunden.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk toolbar */}
      {selectedCount > 0 && (
        <div className="md:sticky md:top-[72px] z-20">
          <div className="rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate">
                {selectedCount} ausgewählt
              </span>

              <button
                onClick={clearSelection}
                disabled={bulkBusy}
                className="inline-flex items-center gap-2 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-2.5 py-1.5 disabled:opacity-60"
                title="Auswahl löschen"
              >
                <X className="h-4 w-4" />
                Auswahl löschen
              </button>

              {selectedCount < allIds.length && (
                <button
                  onClick={selectAll}
                  disabled={bulkBusy}
                  className="text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-2.5 py-1.5 disabled:opacity-60"
                >
                  Alle wählen
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={() => applyBulk("done")}
                disabled={bulkBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-60 flex-1 md:flex-none"
                title="Als erledigt markieren"
              >
                <CheckCircle2 className="h-4 w-4" />
                Erledigt
              </button>

              <button
                onClick={() => applyBulk("archive")}
                disabled={bulkBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 text-sm disabled:opacity-60 flex-1 md:flex-none"
                title="Archivieren"
              >
                <Archive className="h-4 w-4" />
                Archivieren
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {localLeads.map((lead) => (
          <InboxItem
            key={lead.id}
            lead={lead}
            userId={effectiveUserId}
            selected={selectedIds.has(lead.id)}
            pendingApprovalCount={pendingApprovalCountByLead[lead.id] ?? 0}
            onToggleSelect={() => toggleSelect(lead.id)}
          />
        ))}
      </div>
    </div>
  );
}
