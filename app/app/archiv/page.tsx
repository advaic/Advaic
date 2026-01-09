"use client";

import { useRouter } from "next/navigation";

const archivedLeads = [
  {
    id: "7",
    name: "Sabine Schulze",
    email: "sabine@example.com",
    message: "Danke für die Infos. Ich melde mich ggf. später noch mal.",
    archivedAt: "2025-07-02T15:10:00",
  },
];

export default function ArchivPage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Archivierte Interessenten</h1>
      <p className="text-gray-700 mb-6">
        Hier findest du alle Konversationen, die als abgeschlossen markiert
        wurden.
      </p>

      <div className="grid gap-4">
        {archivedLeads.map((lead) => (
          <div
            key={lead.id}
            className="border rounded-lg p-4 shadow-sm hover:bg-gray-50 cursor-pointer"
            onClick={() => router.push(`/nachrichten/${lead.id}`)}
          >
            <div className="font-semibold text-lg">{lead.name}</div>
            <div className="text-sm text-muted-foreground">{lead.email}</div>
            <div className="text-sm text-gray-600 mt-1 italic">
              „{lead.message}“
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Archiviert am:{" "}
              {new Date(lead.archivedAt).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
