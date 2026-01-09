"use client";

import { useContext } from "react";
import { Lead } from "@/types/lead";
import InboxItem from "./InboxItem";
import { SupabaseContext } from "@/app/ClientRootLayout";

function normalizePriority(p: string | null): "Hoch" | "Mittel" | "Niedrig" {
  switch (p) {
    case "Hot":
      return "Hoch";
    case "Warm":
      return "Mittel";
    case "Cold":
      return "Niedrig";
    default:
      return "Mittel";
  }
}

export default function InboxView({
  leads,
  userId,
}: {
  leads: Lead[];
  userId?: string;
}) {
  const { session } = useContext(SupabaseContext);
  const effectiveUserId = (userId && userId.length > 0) ? userId : (session?.user?.id ?? "");

  if (!leads || leads.length === 0) {
    return (
      <div>
        <p className="text-gray-500 text-sm">Keine Leads gefunden.</p>
        <pre className="text-xs text-gray-400">userId: {effectiveUserId}</pre>
      </div>
    );
  }

  const normalizedLeads: Lead[] = leads.map((lead) => ({
    ...lead,
    priority: normalizePriority(lead.priority),
  }));

  return (
    <div className="flex flex-col gap-2">
      {normalizedLeads.map((lead) => (
        <InboxItem key={lead.id} lead={lead} userId={effectiveUserId} />
      ))}
    </div>
  );
}
