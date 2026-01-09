"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { TooltipWrapper } from "@/components/ui/TooltipWrapper";
import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import InboxItem from "../nachrichten/components/InboxItem";

function calculateAverageResponseTime(leads: any[]): string {
  const responseTimes: number[] = [];

  leads.forEach((lead) => {
    const messages = lead.messages;
    if (!messages || messages.length < 2) return;

    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1];
      const curr = messages[i];

      if (prev.sender === "user" && curr.sender === "assistant") {
        const deltaMs =
          new Date(curr.timestamp).getTime() -
          new Date(prev.timestamp).getTime();

        if (deltaMs > 0 && deltaMs < 1000 * 60 * 60 * 24) {
          responseTimes.push(deltaMs);
        }
      }
    }
  });

  if (responseTimes.length === 0) return "–";

  const avgMs =
    responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

  const avgMinutes = Math.round(avgMs / 1000 / 60);

  return `${avgMinutes} Min`;
}

export default function StartseiteUI({
  userId,
  leads,
}: {
  userId: string;
  leads?: any[];
}) {
  const supabase = useSupabaseClient<Database>();
  const [session, setSession] = useState<Session | null>(null);
  const agentId = session?.user?.id || null;
  const [newLeads, setNewLeads] = useState<any[] | null>(null);
  const [openConversations, setOpenConversations] = useState<any[] | null>(
    null
  );
  const [highPriorityLeads, setHighPriorityLeads] = useState<any[] | null>(
    null
  );
  const [avgResponseTime, setAvgResponseTime] = useState("–");

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
      }
    };
    fetchSession();
  }, [supabase]);

  useEffect(() => {
    if (!session || !agentId) return;
    console.log("Session object:", session);
    console.log("Resolved agentId:", agentId);

    const fetchKPIData = async () => {
      // New leads (last 48 hours)
      const { data: newLeads, error: newLeadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("agent_id", agentId)
        .gte(
          "created_at",
          new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        );

      if (newLeadsError) {
        console.error("Error fetching new leads:", newLeadsError);
      } else {
        console.log("newLeads result:", newLeads);
      }
      setNewLeads(newLeads || []);

      // Open conversations (status === Offen or Neu)
      const { data: openLeads, error: openLeadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("agent_id", agentId)
        .in("status", ["Offen", "Neu"]);

      if (openLeadsError) {
        console.error("Error fetching open conversations:", openLeadsError);
      } else {
        console.log("openLeads result:", openLeads);
      }
      setOpenConversations(openLeads || []);

      // High priority leads
      const { data: highPriorityLeads, error: highPriorityLeadsError } =
        await supabase
          .from("leads")
          .select("*")
          .eq("agent_id", agentId)
          .eq("priority", "Hoch");

      if (highPriorityLeadsError) {
        console.error(
          "Error fetching high priority leads:",
          highPriorityLeadsError
        );
      } else {
        console.log("highPriorityLeads result:", highPriorityLeads);
      }
      setHighPriorityLeads(highPriorityLeads || []);

      // Calculate average response time locally
      const calculatedResponseTime = calculateAverageResponseTime(leads || []);
      setAvgResponseTime(calculatedResponseTime);
    };

    fetchKPIData();
  }, [session, agentId, supabase, leads]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Willkommen zurück";
    return "Schönen Abend";
  };

  const userName =
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "";

  const truncate = (text: string, maxLength: number) =>
    text.length > maxLength ? text.slice(0, maxLength) + "…" : text;

  // Helper to get last message snippet and tags for a lead/conversation
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>(
    {}
  );
  const [lastMessageDates, setLastMessageDates] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!session || !agentId) return;

    const fetchLastMessagesAndCounts = async (leads: any[] | null) => {
      if (!leads) return;
      const lastMsgs: Record<string, any> = {};
      const counts: Record<string, number> = {};
      const dates: Record<string, string> = {};
      await Promise.all(
        leads.map(async (lead) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("text, timestamp")
            .eq("lead_id", lead.id)
            .order("timestamp", { ascending: false });

          counts[lead.id] = messages ? messages.length : 0;
          if (messages && messages.length > 0) {
            lastMsgs[lead.id] = messages[0];
            dates[lead.id] = new Date(messages[0].timestamp).toLocaleDateString(
              "de-DE"
            );
          } else {
            lastMsgs[lead.id] = null;
            dates[lead.id] = "";
          }
        })
      );
      setLastMessages((prev) => ({ ...prev, ...lastMsgs }));
      setMessageCounts((prev) => ({ ...prev, ...counts }));
      setLastMessageDates((prev) => ({ ...prev, ...dates }));
    };

    fetchLastMessagesAndCounts(newLeads);
    fetchLastMessagesAndCounts(openConversations);
    fetchLastMessagesAndCounts(highPriorityLeads);
  }, [newLeads, openConversations, highPriorityLeads, session, agentId, supabase]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {getGreeting()}
          {userName
            ? `, ${userName[0].toUpperCase()}${userName.slice(1)}!`
            : "!"}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TooltipWrapper content="Zeigt alle Interessenten der letzten 48 Stunden.">
          <Card className="flex flex-col justify-between min-h-[120px] p-6">
            <h3 className="text-lg font-semibold">Neue Interessenten</h3>
            <p className="text-4xl font-bold">
              {newLeads ? newLeads.length : "–"}
            </p>
          </Card>
        </TooltipWrapper>

        <TooltipWrapper content="Interessenten, deren Status nicht archiviert oder abgeschlossen ist.">
          <Card className="flex flex-col justify-between min-h-[120px] p-6">
            <h3 className="text-lg font-semibold">Konversationen offen</h3>
            <p className="text-4xl font-bold">
              {openConversations ? openConversations.length : "–"}
            </p>
          </Card>
        </TooltipWrapper>

        <TooltipWrapper content="Alle Interessenten mit der Priorität „Hoch“.">
          <Card className="flex flex-col justify-between min-h-[120px] p-6">
            <h3 className="text-lg font-semibold">Hohe Priorität</h3>
            <p className="text-4xl font-bold">
              {highPriorityLeads ? highPriorityLeads.length : "–"}
            </p>
          </Card>
        </TooltipWrapper>

        <TooltipWrapper content="Durchschnittliche Zeit zwischen Nutzerfrage und Agentenantwort.">
          <Card className="flex flex-col justify-between min-h-[120px] p-6">
            <h3 className="text-lg font-semibold">Ø Antwortzeit</h3>
            <p className="text-4xl font-bold">{avgResponseTime}</p>
          </Card>
        </TooltipWrapper>
      </div>

      <div className="flex flex-col gap-8 mt-10">
        <section>
          <h2 className="text-xl font-semibold mb-4">Freigaben ausstehend</h2>
          <div className="flex flex-col gap-3">
            {newLeads?.slice(0, 2).map((lead) => (
              <Link
                key={lead.id}
                href={`/nachrichten/${lead.id}`}
                className="block"
              >
                <InboxItem
                  lead={{
                    ...lead,
                    lastMessage: lastMessages[lead.id]?.text || null,
                    lastMessageDate: lastMessageDates[lead.id] || "",
                    messageCount: messageCounts[lead.id] ?? 0,
                  }}
                  userId={userId}
                />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            High Priority Interessenten
          </h2>
          <div className="flex flex-col gap-3">
            {highPriorityLeads?.slice(0, 2).map((lead) => (
              <Link
                key={lead.id}
                href={`/nachrichten/${lead.id}`}
                className="block"
              >
                <InboxItem
                  lead={{
                    ...lead,
                    lastMessage: lastMessages[lead.id]?.text || null,
                    lastMessageDate: lastMessageDates[lead.id] || "",
                    messageCount: messageCounts[lead.id] ?? 0,
                  }}
                  userId={userId}
                />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Letzte Konversationen</h2>
          <div className="flex flex-col gap-3">
            {openConversations?.slice(0, 2).map((conv) => (
              <Link
                key={conv.id}
                href={`/nachrichten/${conv.id}`}
                className="block"
              >
                <InboxItem
                  lead={{
                    ...conv,
                    lastMessage: lastMessages[conv.id]?.text || null,
                    lastMessageDate: lastMessageDates[conv.id] || "",
                    messageCount: messageCounts[conv.id] ?? 0,
                  }}
                  userId={userId}
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
