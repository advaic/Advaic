"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type Lead = Database["public"]["Tables"]["leads"]["Row"];

type FollowUpMessage = Message & {
  leads: Lead | null;
};

export default function FollowUpList() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  const [followUps, setFollowUps] = useState<FollowUpMessage[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowUps = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*, leads(*)")
        .eq("was_followup", true)
        .eq("visible_to_agent", true)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("❌ Failed to fetch follow-up messages:", error.message);
        toast.error("Fehler beim Laden der Follow-ups");
        setFollowUps([]);
      } else {
        setFollowUps(data as FollowUpMessage[]);
      }

      setLoading(false);
    };

    fetchFollowUps();
  }, [supabase]);

  const handleClick = (leadId: string) => {
    router.push(`/nachrichten/${leadId}`);
  };

  return (
    <div className="space-y-4">
      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}

      {!loading && followUps?.length === 0 && (
        <p className="text-gray-500 text-sm">Keine Follow-ups vorhanden.</p>
      )}

      {!loading &&
        followUps?.map((msg) => (
          <Card
            key={msg.id}
            className="cursor-pointer hover:bg-gray-50 transition-shadow"
            onClick={() => handleClick(msg.lead_id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">
                  {msg.leads?.name || "Unbekannter Interessent"}
                </h3>
                <span className="text-xs text-gray-400">
                  {new Date(msg.timestamp).toLocaleString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <p className="line-clamp-2">{msg.text}</p>

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">
                  {msg.leads?.priority || "Unbekannt"}
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Follow-up
                </Badge>
                {msg.gpt_score && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    GPT Score: {msg.gpt_score}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
