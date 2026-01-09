"use client";

import { useState, useMemo } from "react";
import InboxView from "./components/InboxView";
import type { Lead } from "@/types/lead";

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

  const filteredLeads = useMemo(() => {
    const result = leads.filter((lead) => {
      const searchMatch =
        lead.name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.last_message?.toLowerCase().includes(search.toLowerCase());

      const categoryMatch = kategorie === "Alle" || lead.type === kategorie;

      const priorityMatch = priorität === "Alle" || lead.priority === priorität;

      const escalatedMatch = !escalatedOnly || lead.escalated === true;

      return searchMatch && categoryMatch && priorityMatch && escalatedMatch;
    });

    return result.sort((a, b) => {
      if (sortierung === "Neueste") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      } else if (sortierung === "Älteste") {
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      } else if (sortierung === "NameAZ") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });
  }, [leads, search, kategorie, priorität, escalatedOnly, sortierung]);

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nachrichten</h1>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Suche nach Name, E-Mail, Nachricht"
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={kategorie}
            onChange={(e) => setKategorie(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="Alle">Alle Kategorien</option>
            <option value="Kaufen">Kaufen</option>
            <option value="Mieten">Mieten</option>
            <option value="FAQ">FAQ</option>
          </select>

          <select
            value={priorität}
            onChange={(e) => setPriorität(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="Alle">Alle Prioritäten</option>
            <option value="Hoch">Hoch</option>
            <option value="Mittel">Mittel</option>
            <option value="Niedrig">Niedrig</option>
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={escalatedOnly}
              onChange={(e) => setEscalatedOnly(e.target.checked)}
              className="accent-black"
            />
            Nur eskalierte
          </label>

          <select
            value={sortierung}
            onChange={(e) => setSortierung(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="Neueste">Sortieren nach: Neueste</option>
            <option value="Älteste">Sortieren nach: Älteste</option>
            <option value="NameAZ">Sortieren nach: Name A-Z</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <InboxView leads={filteredLeads} userId={userId} />
      </div>
    </div>
  );
}
