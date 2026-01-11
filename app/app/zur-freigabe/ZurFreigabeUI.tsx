"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Database } from "@/types/supabase";
// import { sendMessageToMake } from "@/lib/sendMessageToMake";
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

  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<Record<string, string | null>>({});

  const setPending = (id: string, v: boolean) =>
    setPendingIds((prev) => ({ ...prev, [id]: v }));

  const setErr = (id: string, msg: string | null) =>
    setActionError((prev) => ({ ...prev, [id]: msg }));

  const approvalMessages = useMemo(
    () => messages.filter((msg) => msg.approval_required),
    [messages]
  );

  const handleApprove = async (id: string) => {
    if (pendingIds[id]) return;

    const message = messages.find((msg) => msg.id === id);
    if (!message) return;

    // optimistic: remove immediately
    setPending(id, true);
    setErr(id, null);
    setMessages((prev) => prev.filter((msg) => msg.id !== id));

    try {
      // Load lead data
      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .select("id, email, gmail_thread_id, type")
        .eq("id", message.lead_id)
        .single();

      if (leadErr || !lead?.email) {
        throw new Error("Lead fehlt oder E-Mail fehlt beim Interessenten.");
      }

      const subject = `Re: ${lead.type ?? "Anfrage"}`;

      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          gmail_thread_id: lead.gmail_thread_id,
          to: lead.email,
          subject,
          text: message.text,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Gmail Send fehlgeschlagen.");
      }

      await approveMessage(id);
      setErr(id, null);
    } catch (e: any) {
      console.error("❌ Approve failed", e);
      setErr(id, e?.message ?? "Freigeben fehlgeschlagen.");

      // rollback optimistic removal
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [message, ...prev];
      });
    } finally {
      setPending(id, false);
    }
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
    if (pendingIds[id]) return;

    const message = messages.find((msg) => msg.id === id);
    if (!message) return;

    const nextText = editedText.trim();
    if (!nextText) {
      setErr(id, "Text darf nicht leer sein.");
      return;
    }

    // optimistic: remove immediately
    setPending(id, true);
    setErr(id, null);
    setMessages((prev) => prev.filter((msg) => msg.id !== id));

    try {
      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .select("id, email, gmail_thread_id, type")
        .eq("id", message.lead_id)
        .single();

      if (leadErr || !lead?.email) {
        throw new Error("Lead fehlt oder E-Mail fehlt beim Interessenten.");
      }

      const subject = `Re: ${lead.type ?? "Anfrage"}`;

      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          gmail_thread_id: lead.gmail_thread_id,
          to: lead.email,
          subject,
          text: nextText,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Gmail Send fehlgeschlagen.");
      }

      await editAndApproveMessage(id, nextText);

      setEditingMessageId(null);
      setEditedText("");
      setErr(id, null);
    } catch (e: any) {
      console.error("❌ Save+Approve failed", e);
      setErr(id, e?.message ?? "Speichern & Freigeben fehlgeschlagen.");

      // rollback optimistic removal
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [message, ...prev];
      });
    } finally {
      setPending(id, false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Zur Freigabe</h1>
      <p className="text-gray-700 mb-6">
        Hier siehst du alle Nachrichten, die zur Freigabe bereitstehen.
      </p>

      <div className="space-y-4">
        {approvalMessages.map((message) => (
          <div
            key={message.id}
            onClick={() => router.push(`/app/nachrichten/${message.lead_id}`)}
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
                {actionError[message.id] && (
                  <p className="text-xs text-red-600 mt-2">
                    {actionError[message.id]}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!!pendingIds[message.id]}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(message.id);
                  }}
                  className={`text-green-600 border border-green-600 rounded px-2 py-1 text-xs hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Freigeben
                </button>
                <button
                  disabled={!!pendingIds[message.id]}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(message.id, message.text);
                  }}
                  className="text-blue-600 border border-blue-600 rounded px-2 py-1 text-xs hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bearbeiten
                </button>
                <button
                  disabled={!!pendingIds[message.id]}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(message.id);
                  }}
                  className="text-red-600 border border-red-600 rounded px-2 py-1 text-xs hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ablehnen
                </button>
              </div>
              {pendingIds[message.id] && (
                <div className="text-xs text-gray-400 mt-2">
                  Wird gesendet…
                </div>
              )}
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
                  disabled={!!pendingIds[message.id]}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEditedMessage(message.id);
                  }}
                  className="mt-2 bg-blue-600 text-white px-3 py-1 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Speichern & Freigeben
                </button>
              </div>
            )}
          </div>
        ))}
        {approvalMessages.length === 0 && (
          <p>Keine Nachrichten zur Freigabe.</p>
        )}
      </div>
    </div>
  );
}
