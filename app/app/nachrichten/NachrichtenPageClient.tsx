"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import InboxView from "./components/InboxView";
import Link from "next/link";
import type { Lead } from "@/types/lead";
import type { Database } from "@/types/supabase";
import {
  appButtonClass,
  EmptyState,
  FilterBar,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/app-ui";
import { trackUiMetricEvent, useUiRouteMetric } from "@/lib/funnel/ui-metrics";
import { Mail, RotateCcw, Search, ShieldAlert, SlidersHorizontal, X } from "lucide-react";

type Props = {
  leads: Lead[];
  userId: string;
};

export default function NachrichtenPageClient({ leads, userId }: Props) {
  const supabase = useSupabaseClient<Database>();
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<"approval" | "escalation" | "high" | null>(
    null,
  );
  const [kategorie, setKategorie] = useState("Alle");
  const [priorität, setPriorität] = useState("Alle");
  const [sortierung, setSortierung] = useState("Neueste");
  const [showUtilityMenu, setShowUtilityMenu] = useState(false);
  const [approvalLeadIds, setApprovalLeadIds] = useState<Set<string>>(new Set());
  const trackedPrimaryFiltersRef = useRef<Set<string>>(new Set());
  const { markFirstAction: markMessagesFirstAction } = useUiRouteMetric({
    routeKey: "messages_inbox",
    source: "messages_inbox",
    path: "/app/nachrichten",
    viewMeta: { initial_lead_count: leads.length },
  });

  const trackPrimaryFilterUse = (
    filterKey: "search" | "approval" | "escalation" | "high",
    meta?: Record<string, unknown>,
  ) => {
    const trackingKey = `primary:${filterKey}`;
    if (trackedPrimaryFiltersRef.current.has(trackingKey)) return;
    trackedPrimaryFiltersRef.current.add(trackingKey);
    markMessagesFirstAction(`messages_filter_${filterKey}`, {
      filter_key: filterKey,
      ...(meta || {}),
    });
    trackUiMetricEvent({
      event: "inbox_primary_filter_used",
      source: "messages_inbox",
      path: "/app/nachrichten",
      routeKey: "messages_inbox",
      meta: {
        filter_key: filterKey,
        ...(meta || {}),
      },
    });
  };

  const toggleQuickFilter = (filterKey: "approval" | "escalation" | "high") => {
    setQuickFilter((current) => {
      const next = current === filterKey ? null : filterKey;
      if (next === filterKey) {
        trackPrimaryFilterUse(filterKey, {
          result_count:
            filterKey === "approval"
              ? quickFilterCounts.approval
              : filterKey === "escalation"
                ? quickFilterCounts.escalation
                : quickFilterCounts.high,
        });
      }
      return next;
    });
  };

  const handleLeadOpen = (
    lead: Lead,
    opts?: { focusApproval?: boolean },
  ) => {
    const action = opts?.focusApproval
      ? "messages_open_approval_conversation"
      : "messages_open_conversation";
    markMessagesFirstAction(action, {
      lead_id: lead.id,
      focus_approval: Boolean(opts?.focusApproval),
    });
    trackUiMetricEvent({
      event: "inbox_message_opened",
      source: "messages_inbox",
      path: "/app/nachrichten",
      routeKey: "messages_inbox",
      meta: {
        lead_id: lead.id,
        focus_approval: Boolean(opts?.focusApproval),
      },
    });
  };

  const hasActiveFilters =
    search.trim().length > 0 ||
    quickFilter !== null ||
    kategorie !== "Alle" ||
    priorität !== "Alle" ||
    sortierung !== "Neueste";

  const hasAdvancedSelections =
    kategorie !== "Alle" || priorität !== "Alle" || sortierung !== "Neueste";
  const utilityPanelOpen = showUtilityMenu || hasAdvancedSelections;

  const resetFilters = () => {
    setSearch("");
    setQuickFilter(null);
    setKategorie("Alle");
    setPriorität("Alle");
    setSortierung("Neueste");
    setShowUtilityMenu(false);
  };

  const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
  const isHighPriority = (v: unknown) => norm(v) === "hoch";

  useEffect(() => {
    let cancelled = false;

    async function loadApprovalLeads() {
      try {
        const { data, error } = await (supabase.from("messages") as any)
          .select("lead_id, status, approval_required")
          .eq("approval_required", true)
          .in("status", ["needs_approval", "needs_human", "ready_to_send"])
          .order("timestamp", { ascending: false })
          .limit(2000);

        if (cancelled) return;
        if (error) throw error;

        const next = new Set<string>();
        for (const row of (data || []) as any[]) {
          const leadId = String(row?.lead_id || "").trim();
          if (leadId) next.add(leadId);
        }
        setApprovalLeadIds(next);
      } catch (error) {
        console.error("Freigabe-Filter konnte nicht geladen werden:", error);
        if (!cancelled) setApprovalLeadIds(new Set());
      }
    }

    void loadApprovalLeads();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  useEffect(() => {
    const trimmedSearch = search.trim();
    if (!trimmedSearch) return;
    trackPrimaryFilterUse("search", {
      query_length: trimmedSearch.length,
    });
  }, [search]);

  const priorityRank = (p: unknown): number => {
    const s = norm(p);
    if (s === "hoch") return 3;
    if (s === "mittel") return 2;
    if (s === "niedrig") return 1;
    return 0;
  };

  const copyShownEmails = async () => {
    const emails = filteredLeads
      .map((l) => String(l.email ?? "").trim())
      .filter(Boolean);

    if (emails.length === 0) return;

    try {
      await navigator.clipboard.writeText(emails.join(", "));
    } catch {
      // ignore
    }
  };

  const filteredLeads = useMemo(() => {
    const result = leads.filter((lead) => {
      const q = search.trim().toLowerCase();
      const searchMatch =
        !q ||
        String(lead.name ?? "")
          .toLowerCase()
          .includes(q) ||
        String(lead.email ?? "")
          .toLowerCase()
          .includes(q) ||
        String(lead.last_message ?? "")
          .toLowerCase()
          .includes(q);

      const categoryMatch =
        kategorie === "Alle" || norm((lead as any).type) === norm(kategorie);

      const priorityMatch =
        priorität === "Alle" || norm((lead as any).priority) === norm(priorität);

      const quickFilterMatch =
        quickFilter === null ||
        (quickFilter === "approval"
          ? approvalLeadIds.has(lead.id)
          : quickFilter === "escalation"
            ? lead.escalated === true
            : isHighPriority((lead as any).priority));

      return searchMatch && categoryMatch && priorityMatch && quickFilterMatch;
    });

    return result.sort((a, b) => {
      const aUpd = new Date(a.updated_at ?? 0).getTime();
      const bUpd = new Date(b.updated_at ?? 0).getTime();

      if (sortierung === "Neueste") {
        return bUpd - aUpd;
      }
      if (sortierung === "Älteste") {
        return aUpd - bUpd;
      }
      if (sortierung === "NameAZ") {
        return String(a.name ?? "").localeCompare(String(b.name ?? ""));
      }
      if (sortierung === "PrioHigh") {
        return priorityRank(b.priority) - priorityRank(a.priority);
      }
      if (sortierung === "PrioLow") {
        return priorityRank(a.priority) - priorityRank(b.priority);
      }

      return 0;
    });
  }, [approvalLeadIds, kategorie, leads, priorität, quickFilter, search, sortierung]);

  const quickFilterCounts = useMemo(() => {
    return {
      approval: leads.filter((lead) => approvalLeadIds.has(lead.id)).length,
      escalation: leads.filter((lead) => lead.escalated === true).length,
      high: leads.filter((lead) => isHighPriority((lead as any).priority)).length,
    };
  }, [approvalLeadIds, leads]);

  const counts = useMemo(() => {
    const total = leads?.length ?? 0;
    const shown = filteredLeads.length;
    const escalated = filteredLeads.filter((l) => l.escalated === true).length;
    return { total, shown, escalated };
  }, [leads, filteredLeads]);

  return (
    <div className="min-h-[calc(100vh-80px)] app-shell text-gray-900" data-tour="messages-page">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <PageHeader
          dataTour="messages-header"
          title={<h1 className="app-text-page-title">Nachrichten</h1>}
          meta={<StatusBadge tone="brand">Advaic</StatusBadge>}
          description={
            <>
              <span>
                Suche und Schnellfilter bleiben oben. Kategorie,
                Prioritäts-Feinfilter, Sortierung und Utilities liegen bewusst im
                Mehr-Bereich.
              </span>
              <div
                className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500"
                data-tour="messages-counts"
              >
                <span>
                  Angezeigt{" "}
                  <span className="font-medium text-gray-700">{counts.shown}</span>
                </span>
                <span className="text-gray-300" aria-hidden="true">
                  ·
                </span>
                <span>
                  Gesamt{" "}
                  <span className="font-medium text-gray-700">{counts.total}</span>
                </span>
                <span className="text-gray-300" aria-hidden="true">
                  ·
                </span>
                {counts.escalated > 0 ? (
                  <Link
                    href="/app/eskalationen"
                    className="inline-flex items-center gap-1 text-gray-600 underline underline-offset-4 hover:text-gray-900"
                    title="Eskalationen öffnen"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Eskaliert{" "}
                    <span className="font-medium text-gray-900">
                      {counts.escalated}
                    </span>
                  </Link>
                ) : (
                  <span>
                    Eskaliert{" "}
                    <span className="font-medium text-gray-700">
                      {counts.escalated}
                    </span>
                  </span>
                )}
              </div>
            </>
          }
          footer={
            <div className="space-y-3" data-tour="messages-filters">
              <div className="hidden md:block">
                <FilterBar className="items-stretch">
                  <div
                    className="relative w-full md:w-80 md:min-w-[20rem]"
                    data-tour="messages-search"
                  >
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Suche… (Name, E-Mail, Nachricht)"
                      className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border app-field"
                      data-tour="messages-search-input"
                    />
                    {search.trim() && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="app-focusable absolute right-2 top-1.5 rounded-md p-1 text-gray-400 hover:text-gray-700 focus-visible:outline-none"
                        title="Suche löschen"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowUtilityMenu((current) => !current)}
                    className={appButtonClass({
                      variant: utilityPanelOpen ? "tertiary" : "utility",
                      size: "sm",
                    })}
                    title="Mehr Filter und Aktionen"
                    data-tour="messages-overflow-toggle"
                    aria-expanded={utilityPanelOpen}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Mehr
                  </button>
                </FilterBar>
              </div>

              <div className="md:hidden w-full space-y-2">
                <div className="relative" data-tour="messages-search-mobile">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Suche… (Name, E-Mail, Nachricht)"
                    className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border app-field"
                  />
                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="app-focusable absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:text-gray-700 focus-visible:outline-none"
                      title="Suche löschen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowUtilityMenu((current) => !current)}
                    className={appButtonClass({
                      variant: utilityPanelOpen ? "tertiary" : "utility",
                      size: "sm",
                    })}
                    title="Mehr Filter und Aktionen"
                    data-tour="messages-overflow-toggle-mobile"
                    aria-expanded={utilityPanelOpen}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Mehr
                  </button>
                </div>
              </div>

              <div data-tour="messages-quickfilters">
                <FilterBar className="items-stretch">
                  <button
                    type="button"
                    onClick={() => toggleQuickFilter("approval")}
                    className={appButtonClass({
                      variant: quickFilter === "approval" ? "tertiary" : "secondary",
                      size: "chip",
                      className: "whitespace-nowrap",
                    })}
                    data-tour="messages-chip-approval"
                  >
                    Freigabe
                    <span className="font-semibold">{quickFilterCounts.approval}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleQuickFilter("escalation")}
                    className={appButtonClass({
                      variant: quickFilter === "escalation" ? "tertiary" : "secondary",
                      size: "chip",
                      className: "whitespace-nowrap",
                    })}
                    data-tour="messages-chip-escalation"
                  >
                    Eskalation
                    <span className="font-semibold">{quickFilterCounts.escalation}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleQuickFilter("high")}
                    className={appButtonClass({
                      variant: quickFilter === "high" ? "tertiary" : "secondary",
                      size: "chip",
                      className: "whitespace-nowrap",
                    })}
                    data-tour="messages-chip-high"
                  >
                    Hoch
                    <span className="font-semibold">{quickFilterCounts.high}</span>
                  </button>
                </FilterBar>
              </div>

              {utilityPanelOpen ? (
                <div
                  className="rounded-2xl border app-surface-card app-panel-padding-compact"
                  data-tour="messages-overflow-panel"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <FilterBar className="w-full">
                      <select
                        value={kategorie}
                        onChange={(e) => setKategorie(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border app-field hover:bg-gray-50"
                        title="Kategorie"
                        data-tour="messages-filter-category"
                      >
                        <option value="Alle">Alle Kategorien</option>
                        <option value="Kaufen">Kaufen</option>
                        <option value="Mieten">Mieten</option>
                        <option value="FAQ">FAQ</option>
                      </select>

                      <select
                        value={priorität}
                        onChange={(e) => setPriorität(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border app-field hover:bg-gray-50"
                        title="Priorität"
                        data-tour="messages-filter-priority"
                      >
                        <option value="Alle">Alle Prioritäten</option>
                        <option value="Hoch">Hoch</option>
                        <option value="Mittel">Mittel</option>
                        <option value="Niedrig">Niedrig</option>
                      </select>

                      <div className="flex items-center gap-2" data-tour="messages-sort">
                        <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                        <select
                          value={sortierung}
                          onChange={(e) => setSortierung(e.target.value)}
                          className="px-3 py-2 text-sm rounded-lg border app-field hover:bg-gray-50"
                          title="Sortierung"
                        >
                          <option value="Neueste">Neueste zuerst</option>
                          <option value="Älteste">Älteste zuerst</option>
                          <option value="NameAZ">Name A–Z</option>
                          <option value="PrioHigh">Priorität: Hoch → Niedrig</option>
                          <option value="PrioLow">Priorität: Niedrig → Hoch</option>
                        </select>
                      </div>
                    </FilterBar>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={copyShownEmails}
                        disabled={filteredLeads.length === 0}
                        className={appButtonClass({
                          variant: "secondary",
                          size: "sm",
                        })}
                        title="E-Mails der angezeigten Interessenten kopieren"
                        data-tour="messages-copy-emails"
                      >
                        <Mail className="h-4 w-4" />
                        E-Mails
                      </button>

                      <button
                        type="button"
                        onClick={resetFilters}
                        disabled={!hasActiveFilters}
                        className={appButtonClass({
                          variant: "secondary",
                          size: "sm",
                        })}
                        title="Filter zurücksetzen"
                        data-tour="messages-reset-filters"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Zurücksetzen
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          }
        />

        {/* Content */}
        <div className="app-page-section">
          <div data-tour="messages-inbox">
            <SectionCard
              className="overflow-visible"
              bodyClassName="app-panel-padding"
              title={<span className="app-text-helper text-gray-700">Tipp: Öffne eine Konversation und antworte direkt.</span>}
              meta={<span className="app-text-meta-label hidden sm:block">Enter/Shift+Enter Steuerung findest du im Chat.</span>}
            >
              <div data-tour="messages-list">
                {filteredLeads.length === 0 ? (
                  <div data-tour="messages-empty">
                    <EmptyState
                      title="Keine passenden Nachrichten"
                      description={
                        search.trim()
                          ? "Keine Treffer für deine Suche."
                          : hasActiveFilters
                            ? "Keine Treffer mit diesen Filtern. Tipp: Filter zurücksetzen."
                            : "Aktuell gibt es keine Nachrichten in dieser Ansicht."
                      }
                      className=""
                    />
                  </div>
                ) : (
                  <div data-tour="messages-scroll">
                    <InboxView
                      leads={filteredLeads}
                      userId={userId}
                      onLeadOpen={handleLeadOpen}
                    />
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
