"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Database } from "@/types/supabase";
import { sendMessageToMake } from "@/lib/sendMessageToMake";
import { supabase } from "@/lib/supabaseClient";
import { rejectMessage } from "../../actions/rejectMessage";
// import { approveMessage } from "@/actions/approveMessage";
import { approveMessage } from "../../actions/approveMessage";
import { editAndApproveMessage } from "../../actions/editAndApproveMessage";

type Message = Database["public"]["Tables"]["messages"]["Row"];

interface ZurFreigabeUIProps {
  messages: Message[];
}

export default function ZurFreigabeUI({
  messages: initialMessages,
}: ZurFreigabeUIProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");

  const handleApprove = async (id: string) => {
    const message = messages.find((msg) => msg.id === id);
    if (!message) return;

    await sendMessageToMake({
      id: message.id,
      leadId: message.lead_id,
      sender: message.sender,
      text: message.text,
      timestamp: message.timestamp,
      was_followup: message.was_followup,
      visible_to_agent: message.visible_to_agent,
      gpt_score: message.gpt_score,
      approval_required: true,
    });

    await approveMessage(id);

    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleReject = async (id: string) => {
    await rejectMessage(id);
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleEdit = (id: string, text: string) => {
    setEditingMessageId(id);
    setEditedText(text);
  };

  const handleSaveEditedMessage = async (id: string) => {
    const message = messages.find((msg) => msg.id === id);
    if (!message) return;

    await sendMessageToMake({
      id: message.id,
      leadId: message.lead_id,
      sender: message.sender,
      text: editedText,
      timestamp: message.timestamp,
      was_followup: message.was_followup,
      visible_to_agent: message.visible_to_agent,
      gpt_score: message.gpt_score,
      approval_required: true,
    });

    await editAndApproveMessage(id, editedText);

    setMessages((prev) => prev.filter((msg) => msg.id !== id));
    setEditingMessageId(null);
    setEditedText("");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Zur Freigabe</h1>
      <p className="text-gray-700 mb-6">
        Hier siehst du alle Nachrichten, die zur Freigabe bereitstehen.
      </p>

      <div className="space-y-4">
        {messages
          .filter((msg) => msg.approval_required)
          .map((message) => (
            <div
              key={message.id}
              onClick={() => router.push(`/nachrichten/${message.lead_id}`)}
              className="cursor-pointer hover:bg-gray-50 transition-colors p-4 border rounded-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold mb-1">
                    {message.sender === "user"
                      ? "Interessent"
                      : message.sender === "agent"
                      ? "Du"
                      : "System"}
                  </h2>
                  <p className="text-sm text-gray-600 mb-1">
                    {message.text.slice(0, 80)}...
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(message.id);
                    }}
                    className="text-green-600 border border-green-600 rounded px-2 py-1 text-xs hover:bg-green-50"
                  >
                    Freigeben
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(message.id, message.text);
                    }}
                    className="text-blue-600 border border-blue-600 rounded px-2 py-1 text-xs hover:bg-blue-50"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(message.id);
                    }}
                    className="text-red-600 border border-red-600 rounded px-2 py-1 text-xs hover:bg-red-50"
                  >
                    Ablehnen
                  </button>
                </div>
              </div>

              {editingMessageId === message.id && (
                <div className="mt-4">
                  <textarea
                    className="w-full p-2 border rounded text-sm"
                    rows={3}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEditedMessage(message.id);
                    }}
                    className="mt-2 bg-blue-600 text-white px-3 py-1 text-sm rounded"
                  >
                    Speichern & Freigeben
                  </button>
                </div>
              )}
            </div>
          ))}
        {messages.filter((msg) => msg.approval_required).length === 0 && (
          <p>Keine Nachrichten zur Freigabe.</p>
        )}
      </div>
    </div>
  );
}
