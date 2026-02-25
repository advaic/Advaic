"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
// import { Database } from "@/types/supabase";
import { supabase } from "@/lib/supabaseClient";
import { rejectMessage } from "../../actions/rejectMessage";
import { trackFunnelEvent } from "@/lib/funnel/track";

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

  classification_reason?: string | null;
  classification_reason_long?: string | null;

  // QA meta (optional)
  qa_verdict?: string | null;
  qa_score?: number | null;
  qa_reason?: string | null;
  qa_reason_long?: string | null;
  qa_risk_flags?: string[] | null;

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

function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (target.isContentEditable) return true;
  return tag === "input" || tag === "textarea" || tag === "select";
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

function buildReasonRows(message: ApprovalMessage) {
  const rows: Array<{ label: string; value: string }> = [];

  // Email classifier reasoning (inbound)
  const emailType = message.email_type ? String(message.email_type) : "";
  const conf =
    typeof message.classification_confidence === "number"
      ? message.classification_confidence
      : null;
  const confStr = conf === null ? "" : ` (Confidence: ${conf.toFixed(2)})`;

  const clsReason =
    (message as any).classification_reason_long ??
    (message as any).classification_reason ??
    null;

  if (emailType || clsReason || conf !== null) {
    rows.push({
      label: "E-Mail Klassifizierung",
      value:
        `${emailType ? emailType : "—"}${confStr}` +
        (clsReason ? `\n${String(clsReason)}` : ""),
    });
  }

  // QA reasoning (draft)
  const qaVerdict = (message as any).qa_verdict
    ? String((message as any).qa_verdict)
    : "";
  const qaScore =
    typeof (message as any).qa_score === "number"
      ? (message as any).qa_score
      : null;
  const qaScoreStr =
    qaScore === null ? "" : ` (Score: ${Number(qaScore).toFixed(2)})`;

  const qaReason =
    (message as any).qa_reason_long ?? (message as any).qa_reason ?? null;

  if (qaVerdict || qaReason || qaScore !== null) {
    rows.push({
      label: "QA Bewertung",
      value:
        `${qaVerdict ? qaVerdict : "—"}${qaScoreStr}` +
        (qaReason ? `\n${String(qaReason)}` : ""),
    });
  }

  const riskFlags = (message as any).qa_risk_flags as
    | string[]
    | null
    | undefined;
  if (Array.isArray(riskFlags) && riskFlags.length > 0) {
    rows.push({
      label: "Risiko-Flags",
      value: riskFlags.map((f) => String(f)).join(", "),
    });
  }

  if (message.was_followup) {
    rows.push({ label: "Typ", value: "Follow-up" });
  }

  // Fallback: keep wording product-safe, never expose internal debug text in UI.
  if (rows.length === 0) {
    rows.push({
      label: "Grund",
      value:
        "Die Nachricht wurde vorsorglich zur manuellen Prüfung markiert. " +
        "Sobald Klassifizierungs- und QA-Daten vorliegen, siehst du hier die detaillierte Begründung.",
    });
  }

  return rows;
}

function buildReplySubject(lead: any) {
  const raw = String(lead?.subject ?? lead?.type ?? "Anfrage").trim();
  if (!raw) return "Re: Anfrage";
  // Avoid double "Re:"
  if (/^re\s*:/i.test(raw)) return raw;
  return `Re: ${raw}`;
}

function sendStatusMeta(status: any): { label: string; cls: string } | null {
  const s = String(status ?? "").toLowerCase();
  if (!s) return null;
  if (s === "pending")
    return { label: "Bereit", cls: "border-gray-200 bg-gray-50 text-gray-700" };
  if (s === "sending")
    return {
      label: "Wird gesendet…",
      cls: "border-amber-200 bg-amber-50 text-amber-800",
    };
  if (s === "sent")
    return {
      label: "Gesendet",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  if (s === "failed")
    return {
      label: "Fehlgeschlagen",
      cls: "border-red-200 bg-red-50 text-red-700",
    };
  return { label: s, cls: "border-gray-200 bg-gray-50 text-gray-700" };
}

type ApprovalSortKey =
  | "default"
  | "newest"
  | "oldest"
  | "risk_desc"
  | "confidence_asc"
  | "confidence_desc";

function getConfidence(m: ApprovalMessage): number | null {
  const v = (m as any).classification_confidence;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function verdictWeight(v: any): number {
  const s = String(v ?? "").toLowerCase();
  if (s === "fail") return 3;
  if (s === "warn") return 2;
  if (s === "pass") return 0;
  return 1; // unknown
}

function tsMs(m: ApprovalMessage): number {
  const t = new Date(String(m.timestamp ?? "")).getTime();
  return Number.isFinite(t) ? t : 0;
}

function riskScore(m: ApprovalMessage): number {
  // Higher = riskier => review first
  const flags = Array.isArray((m as any).qa_risk_flags)
    ? ((m as any).qa_risk_flags as any[])
    : [];
  const flagScore = Math.min(5, flags.length) * 1.0;

  const vw = verdictWeight((m as any).qa_verdict);

  const qaScoreRaw = (m as any).qa_score;
  const qaScore =
    typeof qaScoreRaw === "number" && Number.isFinite(qaScoreRaw)
      ? qaScoreRaw
      : null;

  // assumes qa_score ~ 0..1 (lower worse). Still gives sensible ordering if scale differs.
  const qaPenalty =
    qaScore === null ? 0.25 : Math.max(0, Math.min(1, 1 - qaScore));

  const conf = getConfidence(m);
  const confPenalty = conf === null ? 0.15 : Math.max(0, Math.min(1, 1 - conf));

  const sendStatus = String(m.send_status ?? "").toLowerCase();
  const sendPenalty =
    sendStatus === "failed" ? 1.5 : sendStatus === "sending" ? 0.75 : 0;

  const followupPenalty = m.was_followup ? 0.15 : 0;

  return (
    vw * 1.25 +
    flagScore +
    qaPenalty * 1.25 +
    confPenalty * 1.0 +
    sendPenalty +
    followupPenalty
  );
}

function recommendedAction(m: ApprovalMessage): {
  label: string;
  detail: string;
  cls: string;
} {
  const rs = riskScore(m);
  const verdict = String((m as any).qa_verdict || "").toLowerCase();
  const conf = getConfidence(m);
  const sendStatus = String(m.send_status || "").toLowerCase();

  if (sendStatus === "failed") {
    return {
      label: "Technik prüfen",
      detail: "Vor erneutem Versand kurz Fehlerursache prüfen.",
      cls: "border-red-200 bg-red-50 text-red-800",
    };
  }
  if (verdict === "fail" || rs >= 5) {
    return {
      label: "Bearbeiten vor Versand",
      detail: "Risikofall: erst anpassen, dann freigeben.",
      cls: "border-amber-300 bg-amber-50 text-amber-900",
    };
  }
  if (verdict === "warn" || (conf !== null && conf < 0.8)) {
    return {
      label: "Kurz prüfen",
      detail: "Objektbezug und Ton kurz validieren.",
      cls: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  return {
    label: "Direkt freigeben",
    detail: "Klarer Standardfall mit niedrigem Risiko.",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
}

function ageMinutes(timestamp: string): number | null {
  const ms = new Date(String(timestamp || "")).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((Date.now() - ms) / 60000));
}

function formatAgeLabel(minutes: number | null): string {
  if (minutes === null) return "–";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

async function readSendResponse(
  res: Response,
): Promise<
  { ok: boolean; status?: string; error?: string } & Record<string, any>
> {
  const data = await res.json().catch(() => ({}) as any);
  if (!res.ok) {
    return {
      ok: false,
      error: String((data as any)?.error || "Versand fehlgeschlagen."),
      ...data,
    };
  }
  return { ok: true, status: String((data as any)?.status || "ok"), ...data };
}

async function trackApprovalReviewEvent(args: {
  messageId: string;
  edited: boolean;
  originalText?: string;
  finalText?: string;
}) {
  try {
    const res = await fetch("/api/messages/approval-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_id: args.messageId,
        edited: args.edited,
        original_text: args.originalText ?? "",
        final_text: args.finalText ?? "",
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const msg = String(body?.error || "approval_review_track_failed");
      throw new Error(msg);
    }
  } catch (e: any) {
    console.warn("⚠️ approval review tracking failed:", e?.message || e);
  }
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
    {},
  );
  const [search, setSearch] = useState<string>("");
  const [sortKey, setSortKey] = useState<ApprovalSortKey>("default");
  const [expandedText, setExpandedText] = useState<Record<string, boolean>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{
    mode: "approve" | "reject" | null;
    done: number;
    total: number;
  }>({ mode: null, done: 0, total: 0 });

  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);

  const [previewUrls, setPreviewUrls] = useState<
    Record<string, Record<string, string>>
  >({});
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});
  const [reasonOpen, setReasonOpen] = useState<Record<string, boolean>>({});
  const [helpOpen, setHelpOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    void trackFunnelEvent({
      event: "approval_inbox_viewed",
      source: "approval_inbox",
      meta: { initial_count: initialMessages.length },
    });
  }, [initialMessages.length]);

  const setPending = (id: string, v: boolean) =>
    setPendingIds((prev) => ({ ...prev, [id]: v }));

  const setErr = (id: string, msg: string | null) =>
    setActionError((prev) => ({ ...prev, [id]: msg }));

  const approvalMessages = useMemo(() => {
    const base0 = messages.filter((msg) => msg.approval_required);

    const q = search.trim().toLowerCase();
    const base = !q
      ? base0
      : base0.filter((m) =>
          String(m.text ?? "")
            .toLowerCase()
            .includes(q),
        );

    const sorted = [...base].sort((a, b) => {
      const aT = tsMs(a);
      const bT = tsMs(b);

      switch (sortKey) {
        case "newest":
          return bT - aT;
        case "oldest":
          return aT - bT;

        case "confidence_asc": {
          const ac = getConfidence(a);
          const bc = getConfidence(b);
          if (ac === null && bc === null) return bT - aT;
          if (ac === null) return 1;
          if (bc === null) return -1;
          if (ac !== bc) return ac - bc;
          return bT - aT;
        }

        case "confidence_desc": {
          const ac = getConfidence(a);
          const bc = getConfidence(b);
          if (ac === null && bc === null) return bT - aT;
          if (ac === null) return 1;
          if (bc === null) return -1;
          if (ac !== bc) return bc - ac;
          return bT - aT;
        }

        case "risk_desc": {
          const ar = riskScore(a);
          const br = riskScore(b);
          if (ar !== br) return br - ar;
          return bT - aT;
        }

        case "default":
        default:
          // keep the previous feel: newest first
          return bT - aT;
      }
    });

    return sorted;
  }, [messages, search, sortKey]);

  const approvalIds = useMemo(
    () => approvalMessages.map((m) => m.id),
    [approvalMessages],
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const next: Record<string, boolean> = {};
      for (const id of approvalIds) next[id] = !!prev[id];
      return next;
    });
    setSelectAll(false);

    setReasonOpen((prev) => {
      const next: Record<string, boolean> = {};
      for (const id of approvalIds) next[id] = !!prev[id];
      return next;
    });
    setExpandedText((prev) => {
      const next: Record<string, boolean> = {};
      for (const id of approvalIds) next[id] = !!prev[id];
      return next;
    });

    setFocusedId((prev) => {
      if (!approvalIds.length) return null;
      if (prev && approvalIds.includes(prev)) return prev;
      return approvalIds[0];
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvalIds.join("|")]);

  const selectedCount = useMemo(() => {
    return Object.values(selectedIds).filter(Boolean).length;
  }, [selectedIds]);
  const bulkRunning = bulkProgress.mode !== null;

  const triageStats = useMemo(() => {
    const highRisk = approvalMessages.filter((m) => riskScore(m) >= 5).length;
    const lowConfidence = approvalMessages.filter((m) => {
      const c = getConfidence(m);
      return c !== null && c < 0.8;
    }).length;
    const followups = approvalMessages.filter((m) => !!m.was_followup).length;
    const failed = approvalMessages.filter(
      (m) => String(m.send_status || "").toLowerCase() === "failed",
    ).length;
    const oldestMinutes = approvalMessages.reduce<number | null>((acc, m) => {
      const current = ageMinutes(m.timestamp);
      if (current === null) return acc;
      if (acc === null) return current;
      return Math.max(acc, current);
    }, null);

    return {
      highRisk,
      lowConfidence,
      followups,
      failed,
      oldestMinutes,
    };
  }, [approvalMessages]);

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

  const moveFocus = (delta: number) => {
    if (!approvalIds.length) return;
    const currentIdx = focusedId ? approvalIds.indexOf(focusedId) : -1;
    const startIdx = currentIdx === -1 ? 0 : currentIdx;
    const nextIdx = Math.max(
      0,
      Math.min(approvalIds.length - 1, startIdx + delta),
    );
    const nextId = approvalIds[nextIdx] || null;
    if (!nextId) return;
    setFocusedId(nextId);
    cardRefs.current[nextId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = String(e.key || "");
      const lower = key.toLowerCase();
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      const typing = isTypingTarget(e.target);

      if (cmdOrCtrl && lower === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (typing) {
        if (cmdOrCtrl && lower === "enter" && editingMessageId) {
          e.preventDefault();
          void handleSaveEditedMessage(editingMessageId);
        }
        if (key === "Escape" && editingMessageId) {
          setEditingMessageId(null);
          setEditedText("");
        }
        return;
      }

      if (lower === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (lower === "j") {
        e.preventDefault();
        moveFocus(1);
        return;
      }
      if (lower === "k") {
        e.preventDefault();
        moveFocus(-1);
        return;
      }

      if (!focusedId) return;

      if (cmdOrCtrl && lower === "enter") {
        e.preventDefault();
        if (editingMessageId === focusedId) {
          void handleSaveEditedMessage(focusedId);
        } else if (!pendingIds[focusedId]) {
          void handleApprove(focusedId);
        }
        return;
      }

      if (lower === "x") {
        e.preventDefault();
        toggleSelected(focusedId, !selectedIds[focusedId]);
        return;
      }
      if (lower === "a") {
        e.preventDefault();
        if (!pendingIds[focusedId]) void handleApprove(focusedId);
        return;
      }
      if (lower === "e") {
        e.preventDefault();
        if (!pendingIds[focusedId]) {
          const msg = messages.find((m) => m.id === focusedId);
          if (msg) handleEdit(focusedId, String(msg.text ?? ""));
        }
        return;
      }
      if (lower === "r") {
        e.preventDefault();
        if (!pendingIds[focusedId]) void handleReject(focusedId);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    approvalIds,
    editingMessageId,
    focusedId,
    messages,
    pendingIds,
    selectedIds,
  ]);

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

        const data = await res.json().catch(() => ({}) as any);

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
    setExpandedText((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    try {
      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .select(
          "id, email, gmail_thread_id, outlook_conversation_id, email_provider, type, subject",
        )
        .eq("id", message.lead_id)
        .single();

      if (leadErr || !lead?.email) {
        throw new Error("Lead fehlt oder E-Mail fehlt beim Interessenten.");
      }

      const subject = buildReplySubject(lead);
      const provider =
        String(
          (lead as any).email_provider ||
            ((lead as any).outlook_conversation_id ? "outlook" : "gmail"),
        )
          .toLowerCase()
          .trim() === "outlook"
          ? "outlook"
          : "gmail";
      const endpoint =
        provider === "outlook" ? "/api/outlook/send" : "/api/gmail/send";
      const payload: Record<string, any> = {
        id: message.id,
        lead_id: lead.id,
        to: lead.email,
        subject,
        text: message.text,
        attachments: normalizeAttachments(message as any),
      };

      if (provider === "outlook") {
        payload.outlook_conversation_id =
          (lead as any).outlook_conversation_id ?? null;
      } else {
        payload.gmail_thread_id = (lead as any).gmail_thread_id ?? null;
      }

      await trackApprovalReviewEvent({
        messageId: message.id,
        edited: false,
        originalText: message.text,
        finalText: message.text,
      });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const send = await readSendResponse(res);

      // Idempotency outcomes
      if (!send.ok) {
        throw new Error(send.error || "Versand fehlgeschlagen.");
      }

      // If another worker/process is currently sending, rollback and surface a friendly note.
      if (send.status === "locked_or_in_progress") {
        throw new Error(
          "Diese Nachricht wird bereits gesendet. Bitte warte kurz und aktualisiere die Seite.",
        );
      }

      if (send.status === "already_sent") {
        // treat as success; server already handled it
        void trackFunnelEvent({
          event: "approval_message_already_sent",
          source: "approval_inbox",
          meta: { message_id: message.id, lead_id: message.lead_id, edited: false },
        });
        router.refresh();
        return;
      }

      // Send route handles idempotency + DB status updates (approval_required/send_status/etc.).
      void trackFunnelEvent({
        event: "approval_message_approved",
        source: "approval_inbox",
        meta: {
          message_id: message.id,
          lead_id: message.lead_id,
          edited: false,
          was_followup: Boolean(message.was_followup),
        },
      });
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
      void trackFunnelEvent({
        event: "approval_message_rejected",
        source: "approval_inbox",
        meta: { message_id: id },
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      setExpandedText((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
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
        .select(
          "id, email, gmail_thread_id, outlook_conversation_id, email_provider, type, subject",
        )
        .eq("id", message.lead_id)
        .single();

      if (leadErr || !lead?.email) {
        throw new Error("Lead fehlt oder E-Mail fehlt beim Interessenten.");
      }

      const subject = buildReplySubject(lead);
      const provider =
        String(
          (lead as any).email_provider ||
            ((lead as any).outlook_conversation_id ? "outlook" : "gmail"),
        )
          .toLowerCase()
          .trim() === "outlook"
          ? "outlook"
          : "gmail";
      const endpoint =
        provider === "outlook" ? "/api/outlook/send" : "/api/gmail/send";
      const payload: Record<string, any> = {
        id: message.id,
        lead_id: lead.id,
        to: lead.email,
        subject,
        text: nextText,
        attachments: normalizeAttachments(message as any),
      };

      if (provider === "outlook") {
        payload.outlook_conversation_id =
          (lead as any).outlook_conversation_id ?? null;
      } else {
        payload.gmail_thread_id = (lead as any).gmail_thread_id ?? null;
      }

      await trackApprovalReviewEvent({
        messageId: message.id,
        edited: true,
        originalText: message.text,
        finalText: nextText,
      });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const send = await readSendResponse(res);
      if (!send.ok) {
        throw new Error(send.error || "Versand fehlgeschlagen.");
      }
      if (send.status === "locked_or_in_progress") {
        throw new Error(
          "Diese Nachricht wird bereits gesendet. Bitte warte kurz und aktualisiere die Seite.",
        );
      }

      if (send.status === "already_sent") {
        // treat as success; server already handled it
        void trackFunnelEvent({
          event: "approval_message_already_sent",
          source: "approval_inbox",
          meta: { message_id: message.id, lead_id: message.lead_id, edited: true },
        });
        router.refresh();
        return;
      }

      // Send route handles DB status updates; we refresh to reflect the latest state.
      void trackFunnelEvent({
        event: "approval_message_approved",
        source: "approval_inbox",
        meta: {
          message_id: message.id,
          lead_id: message.lead_id,
          edited: true,
          was_followup: Boolean(message.was_followup),
        },
      });
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

    const ok = window.confirm(
      `Du sendest jetzt ${ids.length} Nachricht(en). Fortfahren?`,
    );
    if (!ok) return;

    void trackFunnelEvent({
      event: "approval_bulk_approve_started",
      source: "approval_inbox",
      meta: { count: ids.length },
    });

    setBulkProgress({ mode: "approve", done: 0, total: ids.length });
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      if (editingMessageId && editingMessageId !== id) continue;
      await handleApprove(id);
      setBulkProgress({ mode: "approve", done: i + 1, total: ids.length });
    }
    setBulkProgress({ mode: null, done: 0, total: 0 });
    toggleSelectAll(false);
  };

  const bulkReject = async () => {
    const ids = approvalIds.filter((id) => selectedIds[id]);
    if (ids.length === 0) return;

    void trackFunnelEvent({
      event: "approval_bulk_reject_started",
      source: "approval_inbox",
      meta: { count: ids.length },
    });

    setBulkProgress({ mode: "reject", done: 0, total: ids.length });
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i];
      if (pendingIds[id]) continue;
      await handleReject(id);
      setBulkProgress({ mode: "reject", done: i + 1, total: ids.length });
    }
    setBulkProgress({ mode: null, done: 0, total: 0 });
    toggleSelectAll(false);
  };

  const selectRecommendedForBulk = () => {
    const next: Record<string, boolean> = {};
    for (const m of approvalMessages) {
      const rec = recommendedAction(m);
      next[m.id] = rec.label === "Direkt freigeben" && !pendingIds[m.id];
    }
    setSelectedIds(next);
    setSelectAll(false);
  };

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900"
      data-tour="approval-page"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 mb-6"
          data-tour="approval-header"
        >
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

          <div className="w-full max-w-sm" data-tour="approval-search">
            <div className="flex flex-col gap-2">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as ApprovalSortKey)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                title="Sortierung"
              >
                <option value="default">Sortierung: Neueste zuerst</option>
                <option value="risk_desc">
                  Sortierung: Höchstes Risiko zuerst
                </option>
                <option value="confidence_asc">
                  Sortierung: Niedrigste Confidence zuerst
                </option>
                <option value="confidence_desc">
                  Sortierung: Höchste Confidence zuerst
                </option>
                <option value="newest">Sortierung: Neueste zuerst</option>
                <option value="oldest">Sortierung: Älteste zuerst</option>
              </select>

              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suche im Text…"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              />
            </div>
          </div>
        </div>

        {/* Bulk bar */}
        <div
          className="mt-4 rounded-2xl border border-gray-200 bg-white p-4"
          data-tour="approval-bulk-actions"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-800 select-none">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  disabled={bulkRunning}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Alle auswählen
              </label>
              <div className="text-sm text-gray-600">
                {selectedCount} ausgewählt
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={selectRecommendedForBulk}
                disabled={bulkRunning}
                className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
              >
                Sichere Fälle markieren
              </button>
              <button
                type="button"
                onClick={() => toggleSelectAll(false)}
                disabled={bulkRunning}
                className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
              >
                Auswahl löschen
              </button>
              <button
                type="button"
                disabled={selectedCount === 0 || bulkRunning}
                onClick={bulkApprove}
                className="px-3 py-2 rounded-xl text-sm border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bulk: Freigeben
              </button>
              <button
                type="button"
                disabled={selectedCount === 0 || bulkRunning}
                onClick={bulkReject}
                className="px-3 py-2 rounded-xl text-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bulk: Ablehnen
              </button>
            </div>
          </div>

          {bulkProgress.mode && bulkProgress.total > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {bulkProgress.mode === "approve"
                    ? "Bulk-Freigabe läuft"
                    : "Bulk-Ablehnung läuft"}
                </span>
                <span className="font-medium text-gray-800">
                  {bulkProgress.done}/{bulkProgress.total}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-900 transition-all"
                  style={{
                    width: `${Math.round(
                      (bulkProgress.done / bulkProgress.total) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-600">
            Shortcuts: <span className="font-medium">J/K</span> nächste/vorherige Nachricht,{" "}
            <span className="font-medium">A</span> freigeben,{" "}
            <span className="font-medium">E</span> bearbeiten,{" "}
            <span className="font-medium">R</span> ablehnen,{" "}
            <span className="font-medium">X</span> auswählen,{" "}
            <span className="font-medium">/</span> Suche,{" "}
            <span className="font-medium">Cmd/Ctrl+Enter</span> senden.
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 md:col-span-1">
            <div className="text-[11px] text-gray-500">Hohes Risiko</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {triageStats.highRisk}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3 md:col-span-1">
            <div className="text-[11px] text-gray-500">Niedrige Confidence</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {triageStats.lowConfidence}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3 md:col-span-1">
            <div className="text-[11px] text-gray-500">Follow-up Fälle</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {triageStats.followups}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3 md:col-span-1">
            <div className="text-[11px] text-gray-500">Fehlgeschlagen</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {triageStats.failed}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3 md:col-span-1">
            <div className="text-[11px] text-gray-500">Ältester Fall</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {formatAgeLabel(triageStats.oldestMinutes)}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3 md:col-span-1">
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              className="w-full text-left"
              title="Wie triagiere ich effizient?"
            >
              <div className="text-[11px] text-gray-500">Schnellhilfe</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {helpOpen ? "Ausblenden" : "Wie priorisieren?"}
              </div>
            </button>
          </div>
        </div>

        {helpOpen && (
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <div className="font-medium text-gray-900">
              Empfohlene Reihenfolge für schnelle Freigaben
            </div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Sortierung auf „Höchstes Risiko zuerst“ stellen.</li>
              <li>
                Erst Fälle mit niedriger Confidence oder Konflikt-Signal prüfen.
              </li>
              <li>
                Danach klare Standardfälle gesammelt per Bulk freigeben.
              </li>
              <li>
                Fehlgeschlagene Sendungen zuerst neu prüfen, dann erneut senden.
              </li>
            </ul>
          </div>
        )}

        {/* List */}
        <div className="space-y-3" data-tour="approval-list">
          {approvalMessages.map((message) => {
            const pending =
              !!pendingIds[message.id] ||
              String(message.send_status || "").toLowerCase() === "sending";
            const isEditing = editingMessageId === message.id;
            const isFocused = focusedId === message.id;

            const senderLabel =
              message.sender === "user"
                ? "Interessent"
                : message.sender === "agent"
                  ? "Du"
                  : message.sender === "assistant"
                    ? "Advaic"
                    : "System";

            const ts = message.timestamp ? new Date(message.timestamp) : null;
            const recommendation = recommendedAction(message);

            return (
              <div
                ref={(el) => {
                  cardRefs.current[message.id] = el;
                }}
                key={message.id}
                data-tour="approval-card"
                tabIndex={0}
                onFocus={() => setFocusedId(message.id)}
                onClick={() => setFocusedId(message.id)}
                className={`group rounded-2xl border bg-white transition-colors p-5 ${
                  isFocused
                    ? "border-amber-300 ring-2 ring-amber-200/70"
                    : "border-gray-200"
                } ${
                  isEditing || pending ? "opacity-95" : "hover:bg-[#fbfbfc]"
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

                      {(() => {
                        const m = sendStatusMeta(message.send_status);
                        if (!m) return null;
                        return (
                          <div
                            className={`text-xs px-2 py-1 rounded-full border ${m.cls}`}
                          >
                            {m.label}
                          </div>
                        );
                      })()}

                      {(message.email_type ||
                        typeof message.classification_confidence ===
                          "number") && (
                        <div className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                          {message.email_type
                            ? String(message.email_type)
                            : "E-Mail"}
                          {typeof message.classification_confidence === "number"
                            ? ` · ${message.classification_confidence.toFixed(2)}`
                            : ""}
                        </div>
                      )}

                      {((message as any).qa_verdict ||
                        typeof (message as any).qa_score === "number") && (
                        <div className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                          {(message as any).qa_verdict
                            ? String((message as any).qa_verdict)
                            : "QA"}
                          {typeof (message as any).qa_score === "number"
                            ? ` · ${Number((message as any).qa_score).toFixed(2)}`
                            : ""}
                        </div>
                      )}

                      {(() => {
                        const rows = buildReasonRows(message);
                        const open = !!reasonOpen[message.id];
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReasonOpen((prev) => ({
                                ...prev,
                                [message.id]: !open,
                              }));
                            }}
                            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                              open
                                ? "border-amber-300 bg-amber-50 text-amber-900"
                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                            title="Warum ist diese Nachricht zur Freigabe?"
                          >
                            Warum hier?
                          </button>
                        );
                      })()}
                    </div>

                    {(() => {
                      const full = String(message.text ?? "");
                      const isOpen = !!expandedText[message.id];
                      const tooLong =
                        full.length > 260 || full.split("\n").length > 3;
                      const preview =
                        full.length > 260 ? `${full.slice(0, 260)}…` : full;

                      return (
                        <div className="mt-2">
                          <p
                            className={`text-sm text-gray-700 ${isOpen ? "" : "line-clamp-2"}`}
                          >
                            {isOpen ? full : preview}
                          </p>

                          {tooLong && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedText((prev) => ({
                                  ...prev,
                                  [message.id]: !isOpen,
                                }));
                              }}
                              className="mt-2 text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                              title={
                                isOpen ? "Text einklappen" : "Volltext anzeigen"
                              }
                            >
                              {isOpen
                                ? "Volltext ausblenden"
                                : "Volltext anzeigen"}
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    <div className={`mt-3 inline-flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${recommendation.cls}`}>
                      <span className="font-semibold">{recommendation.label}:</span>
                      <span>{recommendation.detail}</span>
                    </div>

                    {(() => {
                      const rows = buildReasonRows(message);
                      const open = !!reasonOpen[message.id];
                      if (!open) return null;

                      return (
                        <div
                          className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-xs font-semibold text-amber-900 mb-2">
                            Warum ist diese Nachricht zur Freigabe?
                          </div>

                          <div className="space-y-2">
                            {rows.map((r, idx) => (
                              <div key={idx} className="text-xs text-gray-900">
                                <div className="font-medium text-gray-900">
                                  {r.label}
                                </div>
                                <pre className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-gray-800">
                                  {r.value}
                                </pre>
                              </div>
                            ))}
                          </div>

                          <div className="mt-2 text-[11px] text-gray-600">
                            Hinweis: Wenn Autosend deaktiviert ist oder
                            Sicherheitsregeln greifen (z.B. no-reply, Billing,
                            niedrige Confidence), landet die Nachricht hier zur
                            Kontrolle.
                          </div>
                        </div>
                      );
                    })()}

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
                            data-tour="approval-attachments"
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
                        data-tour="approval-editor"
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
                              editedText,
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
                            data-tour="approval-editor-send"
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
                            data-tour="approval-editor-cancel"
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
                    data-tour="approval-card-actions"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <button
                      type="button"
                      disabled={isEditing || pending}
                      onClick={() =>
                        router.push(`/app/nachrichten/${message.lead_id}`)
                      }
                      className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Konversation öffnen"
                    >
                      Konversation öffnen
                    </button>

                    <button
                      disabled={pending || isEditing}
                      data-tour="approval-send"
                      onClick={() => handleApprove(message.id)}
                      className="px-3 py-2 rounded-xl text-sm border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Senden"
                    >
                      {pending
                        ? "…"
                        : String(message.send_status || "").toLowerCase() ===
                            "failed"
                          ? "Erneut senden"
                          : "Freigeben"}
                    </button>

                    <button
                      disabled={pending || isEditing}
                      data-tour="approval-edit"
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
                      data-tour="approval-reject"
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
            <div
              className="rounded-2xl border border-gray-200 bg-white p-10 text-center"
              data-tour="approval-empty"
            >
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
