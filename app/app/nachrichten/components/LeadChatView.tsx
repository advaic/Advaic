"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Lead } from "@/types/lead";
import type { Message } from "@/types/message";
import type { Database, Json } from "@/types/supabase";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import LeadDocumentList from "./LeadDocumentList";
import LeadKeyInfoCard from "./LeadKeyInfoCard";
import { sendMessageToMake } from "@/lib/sendMessageToMake";

interface Document {
  id: string;
  lead_id: string;
  document_type: string;
  gpt_score?: string;
  gpt_summary?: string;
  file_url: string;
  created_at: string;
  key_info_raw?: Json;
}

interface LeadChatViewProps {
  leadId: string;
  documents: Document[];
}

export default function LeadChatView({
  leadId,
  documents: initialDocuments,
}: LeadChatViewProps) {
  const supabase = useSupabaseClient<Database>();

  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [newMessage, setNewMessage] = useState("");
  const [isEscalated, setIsEscalated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: leadData } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("timestamp", { ascending: true });

      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (leadData) setLead(leadData);
      if (messagesData) setMessages(messagesData);
      if (documentData) setDocuments(documentData);

      setLoading(false);
    };

    fetchData();
  }, [leadId, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("message-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          console.log("🔔 Realtime insert triggered!", payload);
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);

    const newMessageText = newMessage.trim();
    // Ensure all required fields are present when creating the new message
    const newMsg = {
      lead_id: leadId,
      sender: "assistant",
      text: newMessageText,
      timestamp: new Date().toISOString(),
      gpt_score: "", // default empty string, or null if preferred
      was_followup: false,
      visible_to_agent: true,
      approval_required: false,
    };

    const { data, error } = await supabase
      .from("messages")
      .insert(newMsg)
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage("");

      // Send full object with all required fields to sendMessageToMake
      const message = data;
      await sendMessageToMake({
        id: message.id,
        text: message.text,
        leadId: message.lead_id,
        sender: message.sender,
        timestamp: message.timestamp,
        gpt_score: message.gpt_score ?? "",
        was_followup: message.was_followup ?? false,
        visible_to_agent: message.visible_to_agent ?? true,
        approval_required: message.approval_required ?? false,
      });
    }

    setSending(false);
  };

  const groupMessagesByDate = () => {
    const grouped: { [date: string]: typeof messages } = {};
    messages.forEach((msg) => {
      const date = new Date(msg.timestamp).toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(msg);
    });
    return grouped;
  };

  if (loading) return <div className="p-6">Lade Konversation...</div>;
  if (!lead)
    return <div className="p-6 text-red-600">Interessent nicht gefunden.</div>;

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Chat Section */}
      <main className="flex-1 flex flex-col p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-1">{lead.name}</h1>
          <p className="text-sm text-muted-foreground">E-Mail: {lead.email}</p>
          <p className="text-sm text-muted-foreground">
            Kategorie: {lead.type} · Priorität: {lead.priority}
          </p>
          {/* Removed Bonitätsprofil block from here as per instructions */}
          {/* {lead.key_info && (
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {lead.key_info.name}</p>
              <p><strong>Geburtsdatum:</strong> {lead.key_info.birthdate}</p>
              <p><strong>Nettoeinkommen:</strong> {lead.key_info.income_net}</p>
              <p><strong>Arbeitgeber:</strong> {lead.key_info.employer}</p>
              <p><strong>Schufa-Score:</strong> {lead.key_info.schufa_score}</p>
              <p><strong>Negative Einträge:</strong> {lead.key_info.negatives}</p>
              <p><strong>Vertragsart:</strong> {lead.key_info.contract_type}</p>
              <p><strong>Beschäftigt seit:</strong> {lead.key_info.start_date}</p>
            </div>
          )} */}
        </div>

        {/* Chat Bubbles */}
        <div className="flex-1 overflow-y-auto space-y-6 bg-muted p-4 rounded-md shadow-inner">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="text-center text-xs text-gray-500 my-2">
                {date}
              </div>
              {msgs.map((msg) => {
                const isAgent = msg.sender === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isAgent ? "justify-end" : "justify-start"
                    } mb-3`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-line shadow-md
                        ${
                          isAgent
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                        }
                      `}
                    >
                      {(() => {
                        const isImage = msg.text.match(
                          /\.(jpeg|jpg|gif|png)$/i
                        );
                        const isPDF = msg.text.match(/\.pdf$/i);

                        if (isImage) {
                          return (
                            <img
                              src={msg.text}
                              alt="Bild"
                              className="max-w-full rounded-md"
                            />
                          );
                        } else if (isPDF) {
                          return (
                            <a
                              href={msg.text}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-200 hover:text-white"
                            >
                              📄 PDF ansehen
                            </a>
                          );
                        } else {
                          return (
                            <ReactMarkdown
                              components={{
                                p: ({ node, ...props }) => (
                                  <p
                                    className="prose prose-sm prose-invert"
                                    {...props}
                                  />
                                ),
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          );
                        }
                      })()}
                      <div
                        className={`text-[10px] text-right mt-1 opacity-70 ${
                          isAgent ? "text-white/80" : "text-gray-500"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 flex items-center gap-2 w-full"
        >
          <input
            type="text"
            placeholder="Antwort schreiben..."
            className="flex-1 px-4 py-2 border rounded-md text-sm focus:outline-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
          >
            Senden
          </button>
        </form>

        {/* Removed LeadKeyInfoCard from chat area as per instructions */}

        {/* Removed duplicate Bonitätsprofil block from here as per instructions */}
      </main>

      {/* Sidebar */}
      <aside className="w-[300px] border-l border-gray-200 p-6 bg-white shadow-inner hidden md:block">
        <h2 className="text-xl font-semibold mb-4">Interessenten-Profil</h2>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">
            Zusammenfassung
          </h3>
          <p className="text-sm text-gray-700">
            {lead.name} hat Interesse an einer Immobilie und führt aktiv eine
            Konversation.
          </p>
        </div>

        <div className="space-y-2 text-sm text-gray-800">
          <p>
            <strong>Name:</strong> {lead.name}
          </p>
          <p>
            <strong>Email:</strong> {lead.email}
          </p>
          <p>
            <strong>Anfrage:</strong> {lead.type}
          </p>
          <p>
            <strong>Priorität:</strong> {lead.priority}
          </p>
          <p>
            <strong>Letzte Aktivität:</strong>{" "}
            {new Date(lead.updated_at).toLocaleString()}
          </p>
          <p>
            <strong>Nachrichten:</strong> {lead.message_count}
          </p>
        </div>

        <LeadKeyInfoCard leadId={leadId} />

        <LeadDocumentList leadId={leadId} />

        <div className="mt-6 space-y-3">
          <button className="w-full text-sm bg-muted px-3 py-2 rounded-md">
            Verlauf exportieren
          </button>

          <button
            onClick={() => setIsEscalated(true)}
            disabled={isEscalated}
            className={`w-full text-sm px-3 py-2 rounded-md text-white ${
              isEscalated
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isEscalated ? "Eskalation aktiviert" : "Eskalieren"}
          </button>
        </div>
      </aside>
    </div>
  );
}
