"use client";

import { useState } from "react";
import { Database } from "@/types/supabase";
import InboxItem from "../nachrichten/components/InboxItem";

type Lead = Omit<Database["public"]["Tables"]["leads"]["Row"], "key_info"> & {
  key_info?: any;
};

interface EskalationenUIProps {
  leads: Lead[];
  userId: string;
}

export default function EskalationenUI({ leads, userId }: EskalationenUIProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");

  const filteredLeads = leads
    .filter((lead) => {
      if (!searchQuery) return true;
      return lead.key_info?.toString().toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        return Number(b.priority ?? 0) - Number(a.priority ?? 0);
      }
      if (sortBy === "date") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      return 0;
    });

  return (
    <div className="p-6">
      <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded p-4 mb-4">
        <p>
          Hinweis: Sobald ein Gespräch eskaliert wird – entweder automatisch
          durch das System oder manuell durch einen Agenten – wird die Advaic KI
          für automatische Antworten deaktiviert.
        </p>
      </div>

      <div className="flex justify-center items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Suchen..."
          className="w-96 px-4 py-2 border border-gray-300 rounded text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="px-4 py-2 border border-gray-300 rounded text-base"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="">Sortieren nach...</option>
          <option value="priority">Priorität</option>
          <option value="date">Datum</option>
        </select>
      </div>

      <h1 className="text-2xl font-semibold mb-4">Eskalationen</h1>
      <div className="space-y-2">
        {filteredLeads.map((lead) => (
          <InboxItem key={lead.id} lead={lead} userId={userId} />
        ))}
        {filteredLeads.length === 0 && <p>Keine eskalierten Interessenten.</p>}
      </div>
    </div>
  );
}
