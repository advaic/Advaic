"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
// import { Database } from "@/types/supabase";
import { supabase } from "@/lib/supabaseClient";
import { rejectMessage } from "../../actions/rejectMessage";

export type ApprovalMessage = {
  id: string;
  lead_id: string;
  agent_id: string;

  sender: "system" | "user" | "agent" | "assistant";
  text: string;
  timestamp: string;

  visible_to_agent: boolean;
  approval_required: boolean;

  // sending state (optional)
  send_status?: "pending" | "sending" | "sent" | "failed" | string | null;
  send_locked_at?: string | null;
  send_error?: string | null;
  sent_at?: string | null;

  was_followup?: boolean | null;
  gpt_score?: number | null;

  // email / classification meta (optional)
  gmail_message_id?: string | null;
  gmail_thread_id?: string | null;
  snippet?: string | null;
  email_type?: string | null;
  classification_confidence?: number | null;

  // for UI label
  lead_name?: string;

  // attachments meta json
  attachments_meta?: any;
  attachments?: any;
  attachmentsMeta?: any;
};

type AttachmentMeta = {
  bucket: string;
  path: string;
  name?: string;
  mime?: string;
  size?: number;
};

function formatBytes(n?: number) {
  if (!n || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function normalizeAttachments(msg: any): AttachmentMeta[] {
  const raw =
    msg?.attachments_meta ?? msg?.attachments ?? msg?.attachmentsMeta ?? null;
  if (!raw) return [];

  try {
    const arr = Array.isArray(raw)
      ? raw
      : typeof raw === "string"
      ? JSON.parse(raw)
      : [];

    return (arr || [])
      .filter(Boolean)
      .map((a: any) => ({
        bucket: String(a.bucket || "attachments"),
        path: String(a.path || ""),
        name: a.name ? String(a.name) : undefined,
        mime: a.mime ? String(a.mime) : undefined,
        size: typeof a.size === "number" ? a.size : undefined,
      }))
      .filter((a: AttachmentMeta) => !!a.path);
  } catch {
    return [];
  }
}

function safeLineDiff(original: string, edited: string) {
  const o = (original || "").split("\n");
  const e = (edited || "").split("\n");
  const max = Math.max(o.length, e.length);
  const rows: Array<{ left: string; right: string; changed: boolean }> = [];
  for (let i = 0; i < max; i++) {
    const left = o[i] ?? "";
    const right = e[i] ?? "";
    rows.push({ left, right, changed: left !== right });
  }
  return rows;
}

async function readSendResponse(
  res: Response
): Promise<
  { ok: boolean; status?: string; error?: string } & Record<string, any>
> {
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    return {
      ok: false,
      error: String((data as any)?.error || "Gmail Send fehlgeschlagen."),
      ...data,
    };
  }
  return { ok: true, status: String((data as any)?.status || "ok"), ...data };
}

interface ZurFreigabeUIProps {
  messages: ApprovalMessage[];
}

export default function ZurFreigabeUI({
  messages: initialMessages,
}: ZurFreigabeUIProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ApprovalMessage[]>(initialMessages);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");

  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<Record<string, string | null>>(
    {}
  );
  const [search, setSearch] = useState<string>("");

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);

  const [previewUrls, setPreviewUrls] = useState<
    Record<string, Record<string, string>>
  >({});
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const setPending = (id: string, v: boolean) =>
    setPendingIds((prev) => ({ ...prev, [id]: v }));

  const setErr = (id: string, msg: string | null) =>
    setActionError((prev) => ({ ...prev, [id]: msg }));

  const approvalMessages = useMemo(() => {
    const base = messages.filter((msg) => msg.approval_required);
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((m) =>
      String(m.text ?? "")
        .toLowerCase()
        .includes(q)
    );
  }, [messages, search]);

  const approvalIds = useMemo(
    () => approvalMessages.map((m) => m.id),
    [approvalMessages]
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const next: Record<string, boolean> = {};
      for (const id of approvalIds) next[id] = !!prev[id];
      return next;
    });
    setSelectAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalIds.join("|")]);

  const selectedCount = useMemo(() => {
    return Object.values(selectedIds).filter(Boolean).length;
  }, [selectedIds]);

  const toggleSelectAll = (v: boolean) => {
    setSelectAll(v);
    setSelectedIds(() => {
      const next: Record<string, boolean> = {};
      for (const id of approvalIds) next[id] = v;
      return next;
    });
  };

  const toggleSelected = (id: string, v: boolean) => {
    setSelectedIds((prev) => ({ ...prev, [id]: v }));
  };

  const ensurePreviews = async (message: ApprovalMessage) => {
    const atts = normalizeAttachments(message as any);
    if (atts.length === 0) return;

    setPreviewOpen((prev) => ({ ...prev, [message.id]: true }));

    // If already fetched, skip
    if (previewUrls[message.id]) return;

    // Group by bucket (API supports one bucket per request; we can do multiple requests)
    const byBucket: Record<string, string[]> = {};
    for (const a of atts) {
      const b = String(a.bucket || "attachments");
      if (!byBucket[b]) byBucket[b] = [];
      byBucket[b].push(a.path);
    }

    const perPath: Record<string, string> = {};

    for (const [bucket, paths] of Object.entries(byBucket)) {
      try {
        const res = await fetch("/api/storage/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bucket, paths, expiresIn: 120 }),
        });

        if (!res.ok) continue;

        const data = await res.json().catch(() => ({} as any));

        // supports both single + batch shapes
        if (
          data?.signedUrl &&
          typeof data.signedUrl === "string" &&
          paths.length === 1
        ) {
          perPath[paths[0]] = data.signedUrl;
        }

        if (data?.signedUrls && typeof data.signedUrls === "object") {
          for (const [p, url] of Object.entries(data.signedUrls)) {
            if (typeof url === "string") perPath[p] = url;
          }
        }
      } catch {
        // ignore
      }
    }

    setPreviewUrls((prev) => ({ ...prev, [message.id]: perPath }));
  };

  const handleApprove = async (id: string) => {
    if (pendingIds[id]) return;

    const message = messages.find((msg) => msg.id === id);
    if (!message) return;

    // If the message is already being sent (server-side lock), do not attempt again.
    if (String(message.send_status || "").toLowerCase() === "sending") {
      setErr(id, "Diese Nachricht wird bereits gesendet.");
      return;
    }

    setPending(id, true);
    setErr(id, null);

    // optimistic: remove immediately
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
          id: message.id,
          lead_id: lead.id,
          gmail_thread_id: lead.gmail_thread_id,
          to: lead.email,
          subject,
          text: message.text,
          attachments: normalizeAttachments(message as any),
        }),
      });

      const send = await readSendResponse(res);

      // Idempotency outcomes
      if (!send.ok) {
        throw new Error(send.error || "Gmail Send fehlgeschlagen.");
      }

      // If another worker/process is currently sending, rollback and surface a friendly note.
      if (send.status === "locked_or_in_progress") {
        throw new Error(
          "Diese Nachricht wird bereits gesendet. Bitte warte kurz und aktualisiere die Seite."
        );
      }

      if (send.status === "already_sent") {
        // treat as success; server already handled it
        router.refresh();
        return;
      }

      // Send route handles idempotency + DB status updates (approval_required/send_status/etc.).
      setErr(id, null);
      router.refresh();

      const idx = approvalIds.indexOf(id);
      const nextId = approvalIds[idx + 1] ?? approvalIds[idx - 1] ?? null;
      if (nextId) {
        setTimeout(() => {
          cardRefs.current[nextId]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 50);
      }
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
    if (pendingIds[id]) return;
    setPending(id, true);
    try {
      await rejectMessage(id);
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    } finally {
      setPending(id, false);
      router.refresh();
    }
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
          id: message.id,
          lead_id: lead.id,
          gmail_thread_id: lead.gmail_thread_id,
          to: lead.email,
          subject,
          text: nextText,
          attachments: normalizeAttachments(message as any),
        }),
      });

      const send = await readSendResponse(res);
      if (!send.ok) {
        throw new Error(send.error || "Gmail Send fehlgeschlagen.");
      }
      if (send.status === "locked_or_in_progress") {
        throw new Error(
          "Diese Nachricht wird bereits gesendet. Bitte warte kurz und aktualisiere die Seite."
        );
      }

      if (send.status === "already_sent") {
        // treat as success; server already handled it
        router.refresh();
        return;
      }

      // Send route handles DB status updates; we refresh to reflect the latest state.
      router.refresh();

      const idx = approvalIds.indexOf(id);
      const nextId = approvalIds[idx + 1] ?? approvalIds[idx - 1] ?? null;
      if (nextId) {
        setTimeout(() => {
          cardRefs.current[nextId]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 50);
      }

      setEditingMessageId(null);
      setEditedText("");
      setErr(id, null);
    } catch (e: any) {
      console.error("❌ Save+Approve failed", e);
      setErr(id, e?.message ?? "Speichern & Freigeben fehlgeschlagen.");

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [message, ...prev];
      });
    } finally {
      setPending(id, false);
    }
  };

  const bulkApprove = async () => {
    const ids = approvalIds.filter((id) => selectedIds[id]);
    if (ids.length === 0) return;

    for (const id of ids) {
      if (editingMessageId && editingMessageId !== id) continue;
      await handleApprove(id);
    }
    toggleSelectAll(false);
  };

  const bulkReject = async () => {
    const ids = approvalIds.filter((id) => selectedIds[id]);
    if (ids.length === 0) return;

    for (const id of ids) {
      if (pendingIds[id]) continue;
      await handleReject(id);
    }
    toggleSelectAll(false);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-semibold">
                Zur Freigabe
              </h1>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                Advaic
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                {approvalMessages.length} offen
              </span>
            </div>
            <p className="text-gray-700 mt-2 max-w-2xl">
              Hier siehst du alle Nachrichten, die zur Freigabe bereitstehen. Du
              kannst sie sofort senden, vorher bearbeiten oder ablehnen.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche im Text…"
              className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
            />
          </div>
        </div>

        {/* Bulk bar */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-800 select-none">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => toggleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Alle auswählen
            </label>
            <div className="text-sm text-gray-600">
              {selectedCount} ausgewählt
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={bulkApprove}
              className="px-3 py-2 rounded-xl text-sm border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bulk: Freigeben
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={bulkReject}
              className="px-3 py-2 rounded-xl text-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bulk: Ablehnen
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {approvalMessages.map((message) => {
            const pending =
              !!pendingIds[message.id] ||
              String(message.send_status || "").toLowerCase() === "sending";
            const isEditing = editingMessageId === message.id;

            const senderLabel =
              message.sender === "user"
                ? "Interessent"
                : message.sender === "agent"
                ? "Du"
                : message.sender === "assistant"
                ? "Advaic"
                : "System";

            const ts = message.timestamp ? new Date(message.timestamp) : null;

            return (
              <div
                ref={(el) => {
                  cardRefs.current[message.id] = el;
                }}
                key={message.id}
                onClick={() => {
                  if (isEditing || pending) return;
                  router.push(`/app/nachrichten/${message.lead_id}`);
                }}
                className={`group rounded-2xl border border-gray-200 bg-white transition-colors p-5 ${
                  isEditing || pending
                    ? "cursor-default opacity-95"
                    : "cursor-pointer hover:bg-[#fbfbfc]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                        <input
                          type="checkbox"
                          checked={!!selectedIds[message.id]}
                          onChange={(e) =>
                            toggleSelected(message.id, e.target.checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                          disabled={pending}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </label>

                      <div className="text-sm font-semibold text-gray-900">
                        {senderLabel}
                        {message.lead_name ? (
                          <span className="text-gray-500 font-medium">
                            {" "}
                            · {message.lead_name}
                          </span>
                        ) : null}
                      </div>

                      <div className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                        {ts ? ts.toLocaleString() : "—"}
                      </div>

                      {pending && (
                        <div className="text-xs px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                          Wird gesendet…
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      {String(message.text ?? "").slice(0, 240)}
                      {String(message.text ?? "").length > 240 ? "…" : ""}
                    </p>

                    {/* Attachments preview */}
                    {(() => {
                      const atts = normalizeAttachments(message as any);
                      if (atts.length === 0) return null;

                      const open = !!previewOpen[message.id];
                      const map = previewUrls[message.id] || {};

                      return (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!open) ensurePreviews(message);
                              else
                                setPreviewOpen((prev) => ({
                                  ...prev,
                                  [message.id]: false,
                                }));
                            }}
                            className="text-sm px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
                          >
                            {open
                              ? "Anhänge ausblenden"
                              : `Anhänge anzeigen (${atts.length})`}
                          </button>

                          {open && (
                            <div className="mt-2 grid gap-2">
                              {atts.map((a) => {
                                const url = map[a.path];
                                const label =
                                  a.name || a.path.split("/").pop() || "Anhang";
                                return (
                                  <div
                                    key={a.path}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-[#fbfbfc] px-4 py-3"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        📎 {label}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        {a.mime ? a.mime : "Datei"}{" "}
                                        {a.size
                                          ? `· ${formatBytes(a.size)}`
                                          : ""}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {url ? (
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white hover:bg-gray-50"
                                        >
                                          Vorschau
                                        </a>
                                      ) : (
                                        <span className="text-xs text-gray-500">
                                          Vorschau nicht verfügbar
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="text-[11px] text-gray-500">
                                Vorschau-Links sind kurz gültig (Sicherheit).
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {(actionError[message.id] ||
                      (message.send_status &&
                        String(message.send_status).toLowerCase() ===
                          "failed" &&
                        message.send_error)) && (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
                        {actionError[message.id] || message.send_error}
                      </div>
                    )}

                    {/* Editor */}
                    {isEditing && (
                      <div
                        className="mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-gray-200 bg-[#fbfbfc] p-4">
                            <div className="text-xs font-medium text-gray-600 mb-2">
                              Original
                            </div>
                            <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                              {String(message.text ?? "")}
                            </pre>
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-white p-4">
                            <div className="text-xs font-medium text-gray-600 mb-2">
                              Bearbeitet
                            </div>
                            <textarea
                              className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                              rows={6}
                              value={editedText}
                              onChange={(e) => setEditedText(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4">
                          <div className="text-xs font-medium text-gray-600 mb-2">
                            Diff (Zeilen)
                          </div>
                          <div className="space-y-1">
                            {safeLineDiff(
                              String(message.text ?? ""),
                              editedText
                            ).map((r, idx) => (
                              <div
                                key={idx}
                                className={`grid grid-cols-2 gap-3 rounded-xl px-3 py-2 text-xs ${
                                  r.changed
                                    ? "bg-amber-50 border border-amber-200"
                                    : "bg-[#fbfbfc]"
                                }`}
                              >
                                <div className="whitespace-pre-wrap text-gray-800">
                                  {r.left || " "}
                                </div>
                                <div className="whitespace-pre-wrap text-gray-900 font-medium">
                                  {r.right || " "}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <button
                            disabled={pending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEditedMessage(message.id);
                            }}
                            className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {pending ? "Sende…" : "Speichern & Freigeben"}
                          </button>
                          <button
                            disabled={pending}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMessageId(null);
                              setEditedText("");
                              setErr(message.id, null);
                            }}
                            className="px-4 py-2 rounded-xl text-sm bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <button
                      disabled={pending || isEditing}
                      onClick={() => handleApprove(message.id)}
                      className="px-3 py-2 rounded-xl text-sm border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Freigeben & senden"
                    >
                      {pending ? "…" : "Freigeben"}
                    </button>

                    <button
                      disabled={pending || isEditing}
                      onClick={() => {
                        if (editingMessageId) return;
                        handleEdit(message.id, String(message.text ?? ""));
                      }}
                      className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Vor dem Senden bearbeiten"
                    >
                      Bearbeiten
                    </button>

                    <button
                      disabled={pending || isEditing}
                      onClick={() => handleReject(message.id)}
                      className="px-3 py-2 rounded-xl text-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Ablehnen"
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {approvalMessages.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <div className="text-gray-900 font-semibold">
                Keine Nachrichten zur Freigabe.
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Sobald Advaic eine Nachricht markiert, erscheint sie hier
                automatisch.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
