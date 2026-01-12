"use client";

import { useMemo, useState } from "react";
import InboxView from "./components/InboxView";
import Link from "next/link";
import type { Lead } from "@/types/lead";
import { Mail, RotateCcw, Search, ShieldAlert, SlidersHorizontal, X } from "lucide-react";

type Props = {
  leads: Lead[];
  userId: string;
};

export default function NachrichtenPageClient({ leads, userId }: Props) {
  const [search, setSearch] = useState("");
  const [kategorie, setKategorie] = useState("Alle");
  const [priorität, setPriorität] = useState("Alle");
  const [escalatedOnly, setEscalatedOnly] = useState(false);
  const [sortierung, setSortierung] = useState("Neueste");

  const hasActiveFilters =
    search.trim().length > 0 ||
    kategorie !== "Alle" ||
    priorität !== "Alle" ||
    escalatedOnly ||
    sortierung !== "Neueste";

  const resetFilters = () => {
    setSearch("");
    setKategorie("Alle");
    setPriorität("Alle");
    setEscalatedOnly(false);
    setSortierung("Neueste");
  };

  const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

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

      const escalatedMatch = !escalatedOnly || lead.escalated === true;

      return searchMatch && categoryMatch && priorityMatch && escalatedMatch;
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
  }, [leads, search, kategorie, priorität, escalatedOnly, sortierung]);

  const counts = useMemo(() => {
    const total = leads?.length ?? 0;
    const shown = filteredLeads.length;
    const escalated = filteredLeads.filter((l) => l.escalated === true).length;
    return { total, shown, escalated };
  }, [leads, filteredLeads]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200">
          <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap leading-none">
                <h1 className="text-xl md:text-2xl font-semibold">Nachrichten</h1>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                  Advaic
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                  Angezeigt: {counts.shown}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                  Gesamt: {counts.total}
                </span>
                {counts.escalated > 0 ? (
                  <Link
                    href="/app/eskalationen"
                    className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 inline-flex items-center gap-1"
                    title="Eskalationen öffnen"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Eskaliert: {counts.escalated}
                  </Link>
                ) : (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                    Eskaliert: {counts.escalated}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-gray-600 max-w-3xl">
                Hier siehst du alle Nachrichten deiner Interessenten – filtere nach Kategorie, Priorität oder Eskalation.
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end md:flex-nowrap">
              {/* Desktop search */}
              <div className="relative hidden md:block md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Suche… (Name, E-Mail, Nachricht)"
                  className="w-64 pl-9 pr-9 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                />
                {search.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
                    title="Suche löschen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <select
                value={kategorie}
                onChange={(e) => setKategorie(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Kategorie"
              >
                <option value="Alle">Alle Kategorien</option>
                <option value="Kaufen">Kaufen</option>
                <option value="Mieten">Mieten</option>
                <option value="FAQ">FAQ</option>
              </select>

              <select
                value={priorität}
                onChange={(e) => setPriorität(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Priorität"
              >
                <option value="Alle">Alle Prioritäten</option>
                <option value="Hoch">Hoch</option>
                <option value="Mittel">Mittel</option>
                <option value="Niedrig">Niedrig</option>
              </select>

              <button
                type="button"
                onClick={() => setEscalatedOnly((v) => !v)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors inline-flex items-center gap-2 ${
                  escalatedOnly
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                title="Nur eskalierte Interessenten"
              >
                <ShieldAlert className="h-4 w-4" />
                Nur eskalierte
              </button>

              <button
                type="button"
                onClick={copyShownEmails}
                disabled={filteredLeads.length === 0}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors inline-flex items-center gap-2 ${
                  filteredLeads.length > 0
                    ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    : "bg-white border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                }`}
                title="E-Mails der angezeigten Interessenten kopieren"
              >
                <Mail className="h-4 w-4" />
                E-Mails
              </button>

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors inline-flex items-center gap-2 ${
                  hasActiveFilters
                    ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    : "bg-white border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                }`}
                title="Filter zurücksetzen"
              >
                <RotateCcw className="h-4 w-4" />
                Zurücksetzen
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                <select
                  value={sortierung}
                  onChange={(e) => setSortierung(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                  title="Sortierung"
                >
                  <option value="Neueste">Neueste zuerst</option>
                  <option value="Älteste">Älteste zuerst</option>
                  <option value="NameAZ">Name A–Z</option>
                  <option value="PrioHigh">Priorität: Hoch → Niedrig</option>
                  <option value="PrioLow">Priorität: Niedrig → Hoch</option>
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suche… (Name, E-Mail, Nachricht)"
                className="w-full pl-9 pr-9 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              />
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
                  title="Suche löschen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEscalatedOnly((v) => !v)}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors inline-flex items-center justify-center gap-2 ${
                  escalatedOnly
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                title="Nur eskalierte Interessenten"
              >
                <ShieldAlert className="h-4 w-4" />
                Nur eskalierte
              </button>

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors inline-flex items-center justify-center gap-2 ${
                  hasActiveFilters
                    ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    : "bg-white border-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                }`}
                title="Filter zurücksetzen"
              >
                <RotateCcw className="h-4 w-4" />
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="py-6">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                Tipp: Öffne eine Konversation und antworte direkt.
              </div>
              <div className="text-xs text-gray-500 hidden sm:block">
                Enter/Shift+Enter Steuerung findest du im Chat.
              </div>
            </div>

            <div className="p-4 md:p-6">
              {filteredLeads.length === 0 ? (
                <div className="w-full rounded-2xl border border-gray-200 bg-[#fbfbfc] p-6 text-center">
                  <div className="text-gray-900 font-medium">Keine passenden Nachrichten</div>
                  <div className="text-sm text-gray-600 mt-2">
                    {search.trim()
                      ? "Keine Treffer für deine Suche."
                      : hasActiveFilters
                      ? "Keine Treffer mit diesen Filtern. Tipp: Filter zurücksetzen."
                      : "Aktuell gibt es keine Nachrichten in dieser Ansicht."}
                  </div>
                </div>
              ) : (
                <div className="h-[calc(100vh-260px)] overflow-y-auto pr-2">
                  <InboxView leads={filteredLeads} userId={userId} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
