"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useContext, useState, useTransition } from "react";
import { Lead } from "@/types/lead"; // ✅ Import shared Lead type
import { toast } from "sonner";
import { escalateLead } from "@/app/actions/escalateLead";
import { deescalateLead } from "@/app/actions/deescalateLead";
import { SupabaseContext } from "@/app/ClientRootLayout";

type InboxItemProps = {
  lead: Lead;
  userId?: string;
};

export default function InboxItem({ lead, userId }: InboxItemProps) {
  const router = useRouter();

  const { session } = useContext(SupabaseContext);
  const sessionUserId = session?.user?.id ?? "";
  const effectiveUserId = userId && userId.length > 0 ? userId : sessionUserId;

  if (!effectiveUserId || !lead.agent_id) {
    console.warn("⚠️ Missing userId or lead.agent_id:", {
      sessionUserId: effectiveUserId,
      leadAgentId: lead.agent_id,
    });
  } else if (effectiveUserId !== lead.agent_id) {
    console.warn(
      "⚠️ Authenticated user is not the owner of this lead (agent_id mismatch)."
    );
  }
  const [isEscalated, setIsEscalated] = useState(lead.escalated ?? false);

  const typeColor = {
    Kaufen: "bg-green-100 text-green-800",
    Mieten: "bg-blue-100 text-blue-800",
    FAQ: "bg-gray-100 text-gray-800",
  };

  const priorityColor = {
    Hoch: "bg-red-100 text-red-800",
    Mittel: "bg-yellow-100 text-yellow-800",
    Niedrig: "bg-gray-100 text-gray-800",
  };

  const handleClick = () => {
    router.push(`/app/nachrichten/${lead.id}`);
  };

  const [isPending, startTransition] = useTransition();

  const handleEscalate = async () => {
    const result = await escalateLead(lead.id);
    if ("error" in result) {
      toast.error("Fehler bei Eskalation: " + result.error);
    } else {
      setIsEscalated(true);
      toast.success("Eskalation erfolgreich");
    }
  };

  const handleDeescalate = async () => {
    const result = await deescalateLead(lead.id);
    if ("error" in result) {
      toast.error("Fehler bei Deeskalation: " + result.error);
    } else {
      setIsEscalated(false);
      toast.success("Deeskalierung erfolgreich");
    }
  };

  console.debug("📦 Final lead object received:", lead);
  return (
    <div
      onClick={handleClick}
      className="p-4 border rounded-xl shadow-sm hover:bg-gray-50 transition flex justify-between cursor-pointer"
    >
      <div className="flex flex-col justify-between max-w-[60%]">
        <div className="mb-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg">{lead.name}</h2>
            {isEscalated && (
              <span title="Eskalation" className="text-red-500 text-sm">
                ⚠️
              </span>
            )}
          </div>
          <p className="text-gray-700 text-sm line-clamp-2">
            {lead.last_message}
          </p>
        </div>
        <span className="text-xs text-gray-500">
          {lead.updated_at
            ? new Date(lead.updated_at).toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Unbekannt"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-y-2 sm:gap-x-6 text-sm text-right">
        <div className="min-w-[70px]">
          <div className="text-[11px] text-gray-500 font-medium">Kategorie</div>
          <Badge className={typeColor[lead.type]}>{lead.type}</Badge>
        </div>
        <div className="min-w-[70px]">
          <div className="text-[11px] text-gray-500 font-medium">Priorität</div>
          <Badge className={priorityColor[lead.priority]}>
            {lead.priority}
          </Badge>
        </div>
        <div className="min-w-[70px]">
          <div className="text-[11px] text-gray-500 font-medium">
            Nachrichten
          </div>
          <span className="font-medium text-gray-800">
            {lead.message_count}
          </span>
        </div>
        <div className="min-w-[70px]">
          <div className="text-[11px] text-gray-500 font-medium">E-Mail</div>
          <span className="font-medium text-gray-800">{lead.email}</span>
        </div>

        {isEscalated ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeescalate();
            }}
            className="text-xs border rounded px-2 py-1 min-w-[100px] border-green-600 text-green-600 hover:bg-green-50"
          >
            Deeskalieren
          </button>
        ) : (
          <button
            onClick={async (e) => {
              e.stopPropagation();
              await handleEscalate();
            }}
            disabled={isPending}
            className="text-xs border rounded px-2 py-1 min-w-[100px] border-red-600 text-red-600 hover:bg-red-50"
          >
            {isPending ? "..." : "Eskalieren"}
          </button>
        )}
      </div>
    </div>
  );
}
