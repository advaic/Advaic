"use client";

import { useContext } from "react";
import { Lead } from "@/types/lead";
import InboxItem from "./InboxItem";
import { SupabaseContext } from "@/app/ClientRootLayout";

function normalizePriority(p: unknown): "Hoch" | "Mittel" | "Niedrig" {
  const raw = String(p ?? "")
    .trim()
    .toLowerCase();

  // Already German labels
  if (raw === "hoch") return "Hoch";
  if (raw === "mittel") return "Mittel";
  if (raw === "niedrig" || raw === "niedrig.") return "Niedrig";

  // Common English / legacy labels
  if (raw === "hot" || raw === "high") return "Hoch";
  if (raw === "warm" || raw === "medium" || raw === "med") return "Mittel";
  if (raw === "cold" || raw === "low") return "Niedrig";

  // Numeric fallbacks (best-effort): 3=high, 2=medium, 1=low
  const n = Number(raw);
  if (Number.isFinite(n)) {
    if (n >= 3) return "Hoch";
    if (n === 2) return "Mittel";
    if (n === 1) return "Niedrig";
  }

  return "Mittel";
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
        <p className="text-gray-500 text-sm">Keine Interessenten gefunden.</p>
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
