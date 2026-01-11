"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Lead } from "@/types/lead";
import type { Message } from "@/types/message";
import type { Database, Json } from "@/types/supabase";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import LeadDocumentList from "./LeadDocumentList";
import LeadKeyInfoCard from "./LeadKeyInfoCard";

type MessageSender = "user" | "agent" | "assistant";

type LocalMessage = Omit<
  Message,
  | "agent_id"
  | "approval_required"
  | "visible_to_agent"
  | "was_followup"
  | "gpt_score"
  | "snippet"
  | "history_id"
  | "email_address"
  | "status"
> & {
  agent_id?: string | null;
  approval_required?: boolean;
  visible_to_agent?: boolean;
  was_followup?: boolean;
  gpt_score?: string | number | null;
  snippet?: string | null;
  history_id?: string | number | null;
  email_address?: string | null;
  status?: string | null;

  _localId?: string;
  _localStatus?: "sending" | "failed";
};

function isAgentSender(sender: unknown): boolean {
  const s = String(sender ?? "").toLowerCase();
  return s === "assistant" || s === "agent";
}

function normalizeText(s: unknown): string {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyUrl(text: string): boolean {
  try {
    const u = new URL(text);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function shortEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user}@${domain}`;
}

const QUICK_TEMPLATES: Array<{ label: string; value: string }> = [
  { label: "Vorlage wählen…", value: "" },
  {
    label: "Kurze Rückfrage",
    value:
      "Danke für Ihre Nachricht! Ich habe noch eine kurze Rückfrage:\n\n1) Ab wann möchten Sie einziehen?\n2) Wie viele Personen ziehen ein?\n3) Haben Sie Haustiere?\n\nDann schicke ich Ihnen passende Optionen.\n",
  },
  {
    label: "Besichtigung vorschlagen",
    value:
      "Gerne! Passt Ihnen eine Besichtigung diese Woche?\n\nVorschläge:\n- \n- \n\nWelche Uhrzeit wäre ideal?\n",
  },
  {
    label: "Unterlagen anfragen",
    value:
      "Damit wir den nächsten Schritt machen können, brauche ich bitte kurz:\n- Kurzbeschreibung (Beruf / Einkommen)\n- Einzugsdatum\n- Anzahl Personen\n\nSobald ich das habe, gehen wir direkt weiter.\n",
  },
];

/** -------- Attachment validation (client-side) -------- */
const MAX_ATTACHMENT_MB = 12;
const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

// Strict allowlist (real estate: PDFs + common images)
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

function validateAttachmentFile(file: File): string | null {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `Datei ist zu groß (max. ${MAX_ATTACHMENT_MB} MB).`;
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return "Dateityp nicht erlaubt. Erlaubt: PDF, JPG, PNG, WEBP.";
  }

  // Some browsers give empty mime → allow if extension ok
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return "MIME-Type nicht erlaubt. Bitte PDF oder Bild hochladen.";
  }

  return null;
}

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
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);

  const [newMessage, setNewMessage] = useState("");
  const [isEscalated, setIsEscalated] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [templateValue, setTemplateValue] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  type PendingAttachment = {
    bucket: string;
    path: string;
    name: string;
    mime: string;
    size?: number;
    previewUrl?: string | null;
    previewLoading?: boolean;
  };

  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);

  const [search, setSearch] = useState("");
  const [isSolved, setIsSolved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      const text = String(m.text ?? "").toLowerCase();
      const sender = String(m.sender ?? "").toLowerCase();
      return text.includes(q) || sender.includes(q);
    });
  }, [messages, search]);

  const handleToggleSolved = async () => {
    const next = !isSolved;
    setIsSolved(next);

    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: next ? "closed" : "open" } as any)
        .eq("id", leadId);
      if (error) console.warn("Could not update lead status", error);
    } catch (e) {
      console.warn("Could not update lead status", e);
    }
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const bucket =
      (process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET as string) ||
      "attachments";

    setSendError(null);

    const owner = (currentUserId || (lead as any)?.agent_id || "").toString();
    if (!owner) {
      setSendError("Upload nicht möglich: Kein User gefunden.");
      return;
    }

    for (const file of Array.from(files)) {
      try {
        const validationError = validateAttachmentFile(file);
        if (validationError) {
          setSendError(`${validationError} (${file.name})`);
          continue;
        }

        const ext = file.name.split(".").pop() || "bin";
        const safeExt = ext.toLowerCase();

        const path = `agents/${owner}/leads/${leadId}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadError) {
          console.error("Upload failed", uploadError);
          setSendError(
            `Upload fehlgeschlagen (${file.name}). Bitte Storage Bucket/RLS prüfen.`
          );
          continue;
        }

        setPendingAttachments((prev) => [
          ...prev,
          {
            bucket,
            path,
            name: file.name,
            mime: file.type || "application/octet-stream",
            size: file.size,
            previewUrl: null,
            previewLoading: false,
          },
        ]);
      } catch (e) {
        console.error("Upload failed", e);
        setSendError(`Upload fehlgeschlagen (${(e as any)?.message ?? ""}).`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePreviewAttachment = async (att: PendingAttachment) => {
    // toggle off
    if (att.previewUrl) {
      setPendingAttachments((prev) =>
        prev.map((a) => (a.path === att.path ? { ...a, previewUrl: null } : a))
      );
      return;
    }

    setPendingAttachments((prev) =>
      prev.map((a) =>
        a.path === att.path ? { ...a, previewLoading: true } : a
      )
    );

    try {
      const { data, error } = await supabase.storage
        .from(att.bucket)
        .createSignedUrl(att.path, 60 * 10); // 10 min

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || "Kein Signed URL erhalten");
      }

      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.path === att.path
            ? { ...a, previewUrl: data.signedUrl, previewLoading: false }
            : a
        )
      );
    } catch (e: any) {
      console.error("Signed preview failed", e);
      setSendError(
        `Vorschau nicht möglich. Prüfe Storage RLS (SELECT) für diesen Pfad. (${att.name})`
      );
      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.path === att.path ? { ...a, previewLoading: false } : a
        )
      );
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData?.user?.id ?? null);

      const { data: leadData, error: leadErr } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      const { data: messagesData, error: msgErr } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("timestamp", { ascending: true });

      const { data: documentData, error: docErr } = await supabase
        .from("documents")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (leadErr) console.error("❌ lead fetch", leadErr);
      if (msgErr) console.error("❌ messages fetch", msgErr);
      if (docErr) console.error("❌ documents fetch", docErr);

      if (leadData) setLead(leadData);
      if (messagesData) setMessages(messagesData as unknown as LocalMessage[]);
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
          const newMsg = payload.new as Message;

          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newMsg.id);
            if (exists) return prev;

            const now = Date.now();
            const filtered = prev.filter((m) => {
              if (!m._localId) return true;
              const sameSender = String(m.sender) === String(newMsg.sender);
              const sameText =
                normalizeText(m.text) === normalizeText(newMsg.text);
              if (!sameSender || !sameText) return true;

              const t = new Date(m.timestamp).getTime();
              return isNaN(t) ? true : now - t > 2 * 60 * 1000;
            });

            return [...filtered, newMsg as unknown as LocalMessage];
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

    if (!lead?.email) {
      setSendError(
        "Kein Empfänger gefunden (E-Mail fehlt beim Interessenten)."
      );
      return;
    }

    setSending(true);
    setSendError(null);

    const newMessageText = newMessage.trim();
    const subject = `Re: ${lead.type ?? "Anfrage"}`;

    const optimisticId = `local-${Date.now()}`;
    const optimisticMsg: LocalMessage = {
      id: crypto.randomUUID(),
      lead_id: leadId as any,
      agent_id: (lead as any).agent_id ?? null,
      sender: "agent" as any,
      text: newMessageText,
      timestamp: new Date().toISOString() as any,
      gpt_score: null as any,
      was_followup: false as any,
      visible_to_agent: true as any,
      approval_required: false as any,
      snippet: null as any,
      history_id: null as any,
      email_address: null as any,
      status: null as any,
      _localId: optimisticId,
      _localStatus: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");

    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          gmail_thread_id: (lead as any).gmail_thread_id ?? null,
          to: lead.email,
          subject,
          text: newMessageText,
          attachments: pendingAttachments.map(
            ({ bucket, path, name, mime }) => ({
              bucket,
              path,
              name,
              mime,
            })
          ),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data?.error || "Senden fehlgeschlagen.";
        setSendError(errMsg);

        setMessages((prev) =>
          prev.map((m) =>
            m._localId === optimisticId ? { ...m, _localStatus: "failed" } : m
          )
        );

        setSending(false);
        return;
      }

      const returnedId =
        data?.message?.id || data?.inserted?.id || data?.inserted_id || null;

      if (returnedId) {
        setMessages((prev) =>
          prev.map((m) =>
            m._localId === optimisticId
              ? { ...m, id: returnedId, _localStatus: undefined }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m._localId === optimisticId ? { ...m, _localStatus: undefined } : m
          )
        );
      }

      setPendingAttachments([]);
    } catch (err) {
      console.error("Failed to send via /api/gmail/send", err);
      setSendError("Senden fehlgeschlagen (Netzwerkfehler).");

      setMessages((prev) =>
        prev.map((m) =>
          m._localId === optimisticId ? { ...m, _localStatus: "failed" } : m
        )
      );
    }

    setSending(false);
  };

  const groupMessagesByDate = () => {
    const grouped: { [date: string]: LocalMessage[] } = {};
    filteredMessages.forEach((msg) => {
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

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#f7f7f8] px-4 md:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-10 w-64 bg-white rounded-xl border border-gray-200 animate-pulse mb-3" />
          <div className="h-4 w-96 bg-white rounded-xl border border-gray-200 animate-pulse mb-6" />
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 text-red-600 bg-[#f7f7f8]">
        Interessent nicht gefunden.
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate();
  const hasMessages = filteredMessages.length > 0;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200">
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-semibold truncate">
                  {lead.name}
                </h1>

                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                  {lead.type ?? "Anfrage"}
                </span>

                <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                  Priorität: {lead.priority}
                </span>

                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                  Advaic
                </span>
              </div>

              <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                <span className="truncate">{shortEmail(lead.email)}</span>
                {copied && (
                  <span className="text-xs text-emerald-600">{copied}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Suche…"
                  className="w-48 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                />
              </div>

              <button
                type="button"
                onClick={handleToggleSolved}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  isSolved
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                title="Als erledigt markieren"
              >
                {isSolved ? "Erledigt" : "Offen"}
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(lead.email ?? "");
                    setCopied("Kopiert");
                    setTimeout(() => setCopied(null), 1200);
                  } catch {
                    setCopied("Nicht möglich");
                    setTimeout(() => setCopied(null), 1200);
                  }
                }}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="E-Mail kopieren"
              >
                E-Mail kopieren
              </button>

              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Profil öffnen"
              >
                Profil
              </button>

              <button
                type="button"
                onClick={() => alert("Export folgt – kommt als nächstes.")}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Verlauf exportieren"
              >
                Export
              </button>

              <button
                type="button"
                onClick={() => setIsEscalated(true)}
                disabled={isEscalated}
                className={`px-3 py-2 text-sm rounded-lg border ${
                  isEscalated
                    ? "bg-red-50 border-red-200 text-red-700 opacity-60 cursor-not-allowed"
                    : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                }`}
                title="Eskalieren"
              >
                {isEscalated ? "Eskaliert" : "Eskalieren"}
              </button>
            </div>
          </div>
        </div>

        {/* Chat + Composer */}
        <div className="py-6">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            {/* Messages */}
            <div className="h-[calc(100vh-260px)] overflow-y-auto px-3 md:px-6 py-4 space-y-6 bg-white">
              {!hasMessages && (
                <div className="rounded-2xl border border-gray-200 bg-[#fbfbfc] p-6 text-center">
                  <div className="text-gray-900 font-medium">
                    Noch keine Nachrichten.
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Schreibe deine erste Antwort – Enter sendet, Shift+Enter
                    macht eine neue Zeile.
                  </div>
                </div>
              )}

              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-3 my-2">
                    <div className="h-px flex-1 bg-gray-200" />
                    <div className="text-[11px] px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-600">
                      {date}
                    </div>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  {msgs.map((msg) => {
                    const isAgent = isAgentSender(msg.sender);
                    const text = String(msg.text ?? "");

                    const looksLikeImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(
                      text
                    );
                    const looksLikePDF = /\.pdf$/i.test(text);
                    const looksLikeUrl = isLikelyUrl(text);

                    return (
                      <div
                        key={(msg as any).id}
                        className={`flex ${
                          isAgent ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[640px] w-fit px-4 py-3 rounded-2xl text-sm shadow-sm border ${
                            isAgent
                              ? "bg-gray-900 text-white border-amber-300/40 rounded-br-md"
                              : "bg-white text-gray-900 border-gray-200 rounded-bl-md"
                          }`}
                        >
                          {looksLikeImage ? (
                            <a
                              href={text}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={text}
                                alt="Bild"
                                className="max-w-full rounded-xl border border-gray-200 hover:opacity-95"
                              />
                            </a>
                          ) : looksLikePDF ? (
                            <a
                              href={text}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block rounded-xl border px-4 py-3 hover:bg-gray-50 ${
                                isAgent
                                  ? "border-amber-300/40"
                                  : "border-gray-200"
                              }`}
                            >
                              <div
                                className={`text-sm font-medium ${
                                  isAgent ? "text-amber-100" : "text-gray-900"
                                }`}
                              >
                                📄 PDF öffnen
                              </div>
                              <div
                                className={`text-xs mt-1 break-all ${
                                  isAgent ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                {text}
                              </div>
                            </a>
                          ) : looksLikeUrl ? (
                            <a
                              href={text}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block rounded-xl border px-4 py-3 hover:bg-gray-50 ${
                                isAgent
                                  ? "border-amber-300/40"
                                  : "border-gray-200"
                              }`}
                            >
                              <div
                                className={`text-sm font-medium ${
                                  isAgent ? "text-amber-100" : "text-gray-900"
                                }`}
                              >
                                🔗 Link öffnen
                              </div>
                              <div
                                className={`text-xs mt-1 break-all ${
                                  isAgent ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                {text}
                              </div>
                            </a>
                          ) : (
                            <ReactMarkdown
                              components={{
                                p: ({ ...props }) => (
                                  <p
                                    className={`prose prose-sm leading-relaxed max-w-none ${
                                      isAgent ? "prose-invert" : "prose-gray"
                                    }`}
                                    {...props}
                                  />
                                ),
                                a: ({ ...props }) => (
                                  <a
                                    className={`underline underline-offset-4 ${
                                      isAgent
                                        ? "text-amber-200 hover:text-amber-100"
                                        : "text-gray-900 hover:text-gray-700"
                                    }`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    {...props}
                                  />
                                ),
                                li: ({ ...props }) => (
                                  <li className="my-1" {...props} />
                                ),
                              }}
                            >
                              {text}
                            </ReactMarkdown>
                          )}

                          {(msg as LocalMessage)._localStatus === "sending" && (
                            <div
                              className={`text-[10px] mt-2 opacity-80 ${
                                isAgent ? "text-amber-200" : "text-gray-500"
                              }`}
                            >
                              Wird gesendet…
                            </div>
                          )}

                          {(msg as LocalMessage)._localStatus === "failed" && (
                            <div className="text-[10px] mt-2 text-red-300">
                              Senden fehlgeschlagen
                            </div>
                          )}

                          <div
                            className={`text-[10px] text-right mt-2 opacity-70 ${
                              isAgent ? "text-gray-300" : "text-gray-500"
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

            {/* Error banner */}
            {sendError && (
              <div className="px-3 md:px-6">
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
                  {sendError}
                </div>
              </div>
            )}

            {/* Composer */}
            {pendingAttachments.length > 0 && (
              <div className="px-3 md:px-6 pt-4">
                <div className="mb-3 flex flex-col gap-2">
                  <div className="text-xs text-gray-600">
                    Anhänge werden als echte E-Mail-Anhänge gesendet (privater
                    Bucket).
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {pendingAttachments.map((a) => (
                      <div
                        key={`${a.bucket}:${a.path}`}
                        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs"
                      >
                        <span className="truncate max-w-[220px]">
                          📎 {a.name}
                        </span>

                        <button
                          type="button"
                          onClick={() => handlePreviewAttachment(a)}
                          className="px-2 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
                          title="Vorschau (Signed URL)"
                          disabled={a.previewLoading}
                        >
                          {a.previewLoading
                            ? "…"
                            : a.previewUrl
                            ? "Schließen"
                            : "Vorschau"}
                        </button>

                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-900"
                          onClick={() =>
                            setPendingAttachments((prev) =>
                              prev.filter((x) => x.path !== a.path)
                            )
                          }
                          title="Anhang entfernen"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {pendingAttachments.some((a) => a.previewUrl) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {pendingAttachments
                        .filter((a) => a.previewUrl)
                        .map((a) => {
                          const url = a.previewUrl as string;
                          const isImg = /^image\//.test(a.mime);
                          const isPdf =
                            a.mime === "application/pdf" ||
                            a.name.toLowerCase().endsWith(".pdf");

                          return (
                            <div
                              key={`preview:${a.path}`}
                              className="rounded-2xl border border-gray-200 bg-white p-3"
                            >
                              <div className="text-xs text-gray-600 mb-2 truncate">
                                {a.name}
                              </div>

                              {isImg ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={url}
                                    alt={a.name}
                                    className="w-full max-h-56 object-contain rounded-xl border border-gray-100"
                                  />
                                </a>
                              ) : isPdf ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm underline"
                                >
                                  📄 PDF in neuem Tab öffnen
                                </a>
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm underline"
                                >
                                  Datei öffnen
                                </a>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="px-3 md:px-6 py-4 border-t border-gray-200 bg-[#fbfbfc]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <select
                    value={templateValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTemplateValue(v);
                      if (v) {
                        setNewMessage((prev) =>
                          prev?.trim().length ? `${prev}\n\n${v}` : v
                        );
                      }
                    }}
                    className="text-sm rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-800"
                  >
                    {QUICK_TEMPLATES.map((t) => (
                      <option key={t.label} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <div className="text-xs text-gray-500 hidden md:block">
                    Enter = senden · Shift+Enter = neue Zeile
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePickFile}
                    className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                    title="Datei hochladen (privat, als Anhang)"
                  >
                    Anhang
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelected(e.target.files)}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                  />
                </div>

                <div className="text-xs text-gray-500 md:hidden">
                  Shift+Enter: neue Zeile
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  rows={3}
                  placeholder="Antwort schreiben…"
                  className="flex-1 px-4 py-3 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-3 rounded-xl text-sm font-medium bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-50"
                >
                  {sending ? "Sende…" : "Senden"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Drawer */}
      {profileOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setProfileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white border-l border-gray-200 shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm text-gray-500">
                  Interessenten-Profil
                </div>
                <div className="text-lg font-semibold truncate">
                  {lead.name}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {lead.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm"
              >
                Schließen
              </button>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-72px)]">
              <div className="space-y-2 text-sm text-gray-800">
                <p>
                  <span className="text-gray-500">Name:</span> {lead.name}
                </p>
                <p>
                  <span className="text-gray-500">E-Mail:</span> {lead.email}
                </p>
                <p>
                  <span className="text-gray-500">Anfrage:</span> {lead.type}
                </p>
                <p>
                  <span className="text-gray-500">Priorität:</span>{" "}
                  {lead.priority}
                </p>
                <p>
                  <span className="text-gray-500">Letzte Aktivität:</span>{" "}
                  {new Date(lead.updated_at).toLocaleString()}
                </p>
                <p>
                  <span className="text-gray-500">Nachrichten:</span>{" "}
                  {lead.message_count}
                </p>
              </div>

              <div className="mt-6">
                <LeadKeyInfoCard leadId={leadId} />
              </div>

              <div className="mt-6">
                <LeadDocumentList leadId={leadId} />
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => alert("Export folgt – kommt als nächstes.")}
                  className="w-full text-sm bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-xl"
                >
                  Verlauf exportieren
                </button>

                <button
                  type="button"
                  onClick={() => setIsEscalated(true)}
                  disabled={isEscalated}
                  className={`w-full text-sm px-3 py-2 rounded-xl border ${
                    isEscalated
                      ? "bg-red-50 border-red-200 text-red-700 opacity-60 cursor-not-allowed"
                      : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  }`}
                >
                  {isEscalated ? "Eskalation aktiviert" : "Eskalieren"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
