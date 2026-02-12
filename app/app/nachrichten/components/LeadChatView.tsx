"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Lead } from "@/types/lead";
import type { Message } from "@/types/message";
import type { Database, Json } from "@/types/supabase";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import LeadDocumentList from "./LeadDocumentList";
import LeadKeyInfoCard from "./LeadKeyInfoCard";

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
  is_system?: boolean;
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

function formatDateTimeDE(ts: any): string {
  if (!ts) return "–";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "–";
  return d.toLocaleString("de-DE");
}

function shortId(id: string): string {
  const s = String(id || "");
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

type LeadPropertyStateRow = {
  lead_id: string;
  agent_id: string;
  active_property_id: string | null;
  last_recommended_property_ids: any; // jsonb array
  updated_at: string;
  active_property_reason?: string | null;
  active_property_confidence?: number | null;
};

type PropertyMini = {
  id: string;
  city: string | null;
  neighborhood: string | null;
  street_address: string | null;
  type: string | null;
  price: number | null;
  price_type: string | null;
  rooms: number | null;
  size_sqm: number | null;
  url: string | null;
};

function followupStatusLabel(s: any): string {
  const v = String(s || "")
    .toLowerCase()
    .trim();
  if (!v) return "–";
  if (v === "idle") return "Wartet";
  if (v === "planned") return "Geplant";
  if (v === "queued") return "Geplant";
  if (v === "stopped") return "Gestoppt";
  if (v === "sent") return "Gesendet";
  if (v === "paused") return "Pausiert";
  if (v === "needs_approval") return "Freigabe nötig";
  return v;
}

function computeRuleSource(
  lead: any,
  agentDefaults: any | null,
  propertyPolicy: any | null,
): "Lead" | "Immobilie" | "Standard" {
  if (
    lead &&
    typeof lead.followups_enabled === "boolean" &&
    lead.followups_enabled === false
  ) {
    return "Lead";
  }
  if (propertyPolicy) return "Immobilie";
  return "Standard";
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
// Conservative defaults: real estate agents mostly need PDFs + images.
const MAX_ATTACHMENT_MB = 12; // per file
const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

const MAX_TOTAL_ATTACHMENTS_MB = 25; // total for one outgoing email
const MAX_TOTAL_ATTACHMENT_BYTES = MAX_TOTAL_ATTACHMENTS_MB * 1024 * 1024;

// Strict allowlist (real estate: PDFs + common images)
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

// Extra safety: block common executable / script / archive types
const BLOCKED_EXT = new Set([
  "exe",
  "bat",
  "cmd",
  "com",
  "scr",
  "msi",
  "dll",
  "js",
  "mjs",
  "cjs",
  "jar",
  "ps1",
  "vbs",
  "vb",
  "zip",
  "rar",
  "7z",
]);

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getExt(name: string): string {
  return (
    String(name || "")
      .split(".")
      .pop() || ""
  ).toLowerCase();
}

function validateAttachmentFile(file: File): string | null {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `Datei ist zu groß (max. ${MAX_ATTACHMENT_MB} MB).`;
  }

  const ext = getExt(file.name);
  if (BLOCKED_EXT.has(ext)) {
    return `Dateityp blockiert (.${ext}).`;
  }

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

  const debugEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get("debug") === "1";
    } catch {
      return false;
    }
  }, []);

  const [debugInfo, setDebugInfo] = useState<any>({});

  const debugLog = (...args: any[]) => {
    if (!debugEnabled) return;
    // eslint-disable-next-line no-console
    console.log("[LeadChatView:debug]", ...args);
  };

  const packErr = (err: any) => {
    if (!err) return null;
    return {
      message: err?.message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    };
  };

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
    size: number;
    previewUrl: string | null;
    previewLoading: boolean;
  };

  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);

  const [search, setSearch] = useState("");
  const [isSolved, setIsSolved] = useState(false);
  const [followupsEnabled, setFollowupsEnabled] = useState<boolean>(true);
  const [followupsBusy, setFollowupsBusy] = useState(false);
  const [followupsError, setFollowupsError] = useState<string | null>(null);
  const [copilotLoading, setCopilotLoading] = useState<boolean>(true);
  const [agentFollowupsDefaults, setAgentFollowupsDefaults] = useState<
    any | null
  >(null);
  const [propertyFollowupPolicy, setPropertyFollowupPolicy] = useState<
    any | null
  >(null);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [propertyState, setPropertyState] =
    useState<LeadPropertyStateRow | null>(null);
  const [activeProperty, setActiveProperty] = useState<PropertyMini | null>(
    null,
  );
  const [recommendedProperties, setRecommendedProperties] = useState<
    PropertyMini[]
  >([]);

  // Manual property assignment state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyResults, setPropertyResults] = useState<PropertyMini[]>([]);

  const trySelectProperties = async (agentId: string, q: string) => {
    const selectCols =
      "id, city, neighborhood, street_address, type, price, price_type, rooms, size_sqm, url";

    // Prefer scoping by agent_id if the column exists in this env.
    const base = (supabase.from("properties") as any).select(selectCols);

    const applySearch = (qb: any) => {
      const term = q.trim();
      if (!term) return qb;
      // best-effort OR search across common text fields
      return qb.or(
        `street_address.ilike.%${term}%,city.ilike.%${term}%,neighborhood.ilike.%${term}%,type.ilike.%${term}%`,
      );
    };

    // 1) Try with agent_id filter
    try {
      const qb = applySearch(
        base
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(50),
      );
      const { data, error } = await qb;
      if (error) throw error;
      return (data as PropertyMini[]) || [];
    } catch (e) {
      // 2) Fallback: no agent_id filter (older schema)
      const qb = applySearch(
        base.order("created_at", { ascending: false }).limit(50),
      );
      const { data } = await qb;
      return (data as PropertyMini[]) || [];
    }
  };

  const upsertLeadPropertyState = async (
    agentId: string,
    activePropertyId: string | null,
  ) => {
    const minimal = {
      lead_id: leadId,
      agent_id: agentId,
      active_property_id: activePropertyId,
      updated_at: new Date().toISOString(),
    };

    // If these columns exist, we store a clear manual reason.
    const extended = {
      ...minimal,
      active_property_reason: activePropertyId ? "manual" : null,
      active_property_confidence: activePropertyId ? 1 : null,
    };

    // 1) Try extended upsert
    const ext = await (supabase.from("lead_property_state") as any)
      .upsert(extended, { onConflict: "lead_id" })
      .select("lead_id")
      .maybeSingle();

    if (!ext?.error) return;

    // 2) Fallback: minimal upsert (for schemas without reason/confidence)
    const min = await (supabase.from("lead_property_state") as any)
      .upsert(minimal, { onConflict: "lead_id" })
      .select("lead_id")
      .maybeSingle();

    if (min?.error) throw min.error;
  };

  const openAssignModal = async () => {
    try {
      setAssignError(null);
      setAssignOpen(true);
      const agentId = String((lead as any)?.agent_id || "").trim();
      if (!agentId) return;
      const rows = await trySelectProperties(agentId, "");
      setPropertyResults(rows);
    } catch (e: any) {
      console.warn("⚠️ Could not load properties for assignment", e);
      setAssignError(String(e?.message || "Konnte Immobilien nicht laden."));
      setPropertyResults([]);
    }
  };

  const runPropertySearch = async (q: string) => {
    try {
      setAssignError(null);
      const agentId = String((lead as any)?.agent_id || "").trim();
      if (!agentId) return;
      const rows = await trySelectProperties(agentId, q);
      setPropertyResults(rows);
    } catch (e: any) {
      console.warn("⚠️ Property search failed", e);
      setAssignError(String(e?.message || "Suche fehlgeschlagen."));
      setPropertyResults([]);
    }
  };

  const assignProperty = async (propertyId: string | null) => {
    if (assignBusy) return;
    const agentId = String((lead as any)?.agent_id || "").trim();
    if (!agentId) {
      setAssignError("Kein Agent gefunden.");
      return;
    }

    setAssignBusy(true);
    setAssignError(null);

    try {
      await upsertLeadPropertyState(agentId, propertyId);

      // Refresh the card immediately.
      await loadPropertyState(agentId, null);

      if (propertyId) {
        pushSystemEvent("✅ Immobilie wurde manuell zugeordnet.");
      } else {
        pushSystemEvent("🧹 Immobilien-Zuordnung wurde entfernt.");
      }

      // Close modal after assigning (but keep it open when removing via modal search)
      setAssignOpen(false);
    } catch (e: any) {
      console.warn("⚠️ assignProperty failed", e);
      setAssignError(String(e?.message || "Konnte Zuordnung nicht speichern."));
    } finally {
      setAssignBusy(false);
    }
  };

  const [systemEvents, setSystemEvents] = useState<LocalMessage[]>([]);

  const pushSystemEvent = (text: string) => {
    const t = String(text || "").trim();
    if (!t) return;
    const ev: LocalMessage = {
      id: crypto.randomUUID(),
      lead_id: leadId as any,
      sender: "system" as any,
      text: t,
      timestamp: new Date().toISOString() as any,
      is_system: true,
    } as any;
    setSystemEvents((prev) => [...prev, ev]);
  };

  const loadPropertyState = async (
    agentIdMaybe?: string | null,
    fallbackActivePropertyId?: string | null,
  ) => {
    try {
      const agentId = String(
        agentIdMaybe || (lead as any)?.agent_id || "",
      ).trim();
      debugLog("loadPropertyState:start", {
        leadId,
        agentIdMaybe,
        agentId,
        fallbackActivePropertyId,
      });
      if (debugEnabled) {
        setDebugInfo((prev: any) => ({
          ...prev,
          start: {
            leadId,
            agentIdMaybe,
            agentId,
            fallbackActivePropertyId,
          },
        }));
      }

      const extendedSelect =
        "lead_id, agent_id, active_property_id, last_recommended_property_ids, updated_at, active_property_reason, active_property_confidence";
      const minimalSelect =
        "lead_id, agent_id, active_property_id, last_recommended_property_ids, updated_at";

      let stateRow: LeadPropertyStateRow | null = null;

      const ext = await (supabase.from("lead_property_state") as any)
        .select(extendedSelect)
        .eq("lead_id", leadId)
        .maybeSingle();
      debugLog("lead_property_state:extended", {
        data: ext?.data,
        error: packErr(ext?.error),
      });
      if (debugEnabled) {
        setDebugInfo((prev: any) => ({
          ...prev,
          lead_property_state_extended: {
            data: ext?.data,
            error: packErr(ext?.error),
          },
        }));
      }

      if (ext?.error) {
        console.warn("⚠️ lead_property_state fetch (extended)", ext.error);
        const min = await (supabase.from("lead_property_state") as any)
          .select(minimalSelect)
          .eq("lead_id", leadId)
          .maybeSingle();
        debugLog("lead_property_state:minimal", {
          data: min?.data,
          error: packErr(min?.error),
        });
        if (debugEnabled) {
          setDebugInfo((prev: any) => ({
            ...prev,
            lead_property_state_minimal: {
              data: min?.data,
              error: packErr(min?.error),
            },
          }));
        }
        if (min?.error)
          console.warn("⚠️ lead_property_state fetch (minimal)", min.error);
        stateRow = (min?.data as LeadPropertyStateRow | null) || null;
      } else {
        stateRow = (ext?.data as LeadPropertyStateRow | null) || null;
      }

      setPropertyState(stateRow);
      debugLog("lead_property_state:resolved", stateRow);
      if (debugEnabled) {
        setDebugInfo((prev: any) => ({
          ...prev,
          lead_property_state_resolved: stateRow,
        }));
      }

      // Fallback: some flows may still store the assigned property on the lead directly.
      // If no state row exists (or active_property_id is null), we try the fallback id.
      const fallbackId = String(fallbackActivePropertyId || "").trim();
      if ((!stateRow || !stateRow.active_property_id) && fallbackId) {
        stateRow = (stateRow || {
          lead_id: leadId,
          agent_id: agentId,
          active_property_id: null,
          last_recommended_property_ids: [],
          updated_at: new Date().toISOString(),
        }) as any;

        stateRow.active_property_id = fallbackId;
        setPropertyState(stateRow);
        debugLog("fallback_active_property_id_applied", {
          fallbackId,
          stateRow,
        });
        if (debugEnabled) {
          setDebugInfo((prev: any) => ({
            ...prev,
            fallback_active_property_id_applied: {
              fallbackId,
              stateRow,
            },
          }));
        }
      }

      // Active property mini
      if (stateRow?.active_property_id) {
        const { data: pRow, error: pErr } = await (
          supabase.from("properties") as any
        )
          .select(
            "id, city, neighborhood, street_address, type, price, price_type, rooms, size_sqm, url",
          )
          .eq("id", stateRow.active_property_id)
          .maybeSingle();

        if (pErr) console.warn("⚠️ active property fetch", pErr);
        debugLog("properties:active_property_fetch", {
          requestedId: stateRow.active_property_id,
          data: pRow,
          error: packErr(pErr),
        });
        if (debugEnabled) {
          setDebugInfo((prev: any) => ({
            ...prev,
            properties_active_property_fetch: {
              requestedId: stateRow.active_property_id,
              data: pRow,
              error: packErr(pErr),
            },
          }));
        }
        setActiveProperty((pRow as PropertyMini | null) || null);
      } else {
        setActiveProperty(null);
      }

      // Last recommended properties (best-effort)
      const idsRaw = (stateRow as any)?.last_recommended_property_ids;
      const ids: string[] = Array.isArray(idsRaw)
        ? idsRaw.map((x) => String(x)).filter(Boolean)
        : [];

      const top = ids.slice(0, 3);
      if (top.length > 0) {
        const { data: recRows, error: rErr } = await (
          supabase.from("properties") as any
        )
          .select(
            "id, city, neighborhood, street_address, type, price, price_type, rooms, size_sqm, url",
          )
          .in("id", top);

        if (rErr) console.warn("⚠️ recommended properties fetch", rErr);
        debugLog("properties:recommended_fetch", {
          ids: top,
          count: Array.isArray(recRows) ? recRows.length : null,
          error: packErr(rErr),
        });
        if (debugEnabled) {
          setDebugInfo((prev: any) => ({
            ...prev,
            properties_recommended_fetch: {
              ids: top,
              count: Array.isArray(recRows) ? recRows.length : null,
              error: packErr(rErr),
            },
          }));
        }
        setRecommendedProperties(((recRows as any[]) || []) as PropertyMini[]);
      } else {
        setRecommendedProperties([]);
      }
    } catch (e: any) {
      debugLog("loadPropertyState:catch", {
        message: String(e?.message || e),
        name: e?.name,
      });
      if (debugEnabled) {
        setDebugInfo((prev: any) => ({
          ...prev,
          loadPropertyState_error: {
            message: String(e?.message || e),
            name: e?.name,
          },
        }));
      }
      console.warn("⚠️ Property state error", e);
      setPropertyState(null);
      setActiveProperty(null);
      setRecommendedProperties([]);
    }
  };

  const propertyCardRef = useRef<HTMLDivElement>(null);
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

    // Total size guard (best-effort UX; server enforces again)
    const currentTotal = pendingAttachments.reduce(
      (sum, a) => sum + (a.size || 0),
      0,
    );
    const incomingTotal = Array.from(files).reduce(
      (sum, f) => sum + (f.size || 0),
      0,
    );
    if (currentTotal + incomingTotal > MAX_TOTAL_ATTACHMENT_BYTES) {
      setSendError(
        `Zu groß: Maximal ${formatBytes(
          MAX_TOTAL_ATTACHMENT_BYTES,
        )} insgesamt pro E-Mail.`,
      );
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
            `Upload fehlgeschlagen (${file.name}). Bitte Storage Bucket/RLS prüfen.`,
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
        prev.map((a) => (a.path === att.path ? { ...a, previewUrl: null } : a)),
      );
      return;
    }

    setPendingAttachments((prev) =>
      prev.map((a) =>
        a.path === att.path ? { ...a, previewLoading: true } : a,
      ),
    );

    try {
      // Preferred: ask the backend to sign (doesn't require Storage SELECT for the client session)
      const apiRes = await fetch("/api/storage/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: att.bucket,
          path: att.path,
          expiresIn: 600,
        }),
      });

      const apiData = await apiRes.json().catch(() => ({}));

      if (apiRes.ok && apiData?.signedUrl) {
        const url = String(apiData.signedUrl);
        setPendingAttachments((prev) =>
          prev.map((a) =>
            a.path === att.path
              ? { ...a, previewUrl: url, previewLoading: false }
              : a,
          ),
        );
        return;
      }

      // Fallback: client signed URL (may require Storage RLS SELECT)
      const { data, error } = await supabase.storage
        .from(att.bucket)
        .createSignedUrl(att.path, 60 * 10); // 10 min

      if (error || !data?.signedUrl) {
        throw new Error(
          apiData?.error || error?.message || "Kein Signed URL erhalten",
        );
      }

      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.path === att.path
            ? { ...a, previewUrl: data.signedUrl, previewLoading: false }
            : a,
        ),
      );
    } catch (e: any) {
      console.error("Signed preview failed", e);
      setSendError(
        `Vorschau nicht möglich. Prüfe Storage RLS/Backend Route. (${att.name})`,
      );
      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.path === att.path ? { ...a, previewLoading: false } : a,
        ),
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

      if (leadData) {
        setLead(leadData);
        const v = (leadData as any).followups_enabled;
        setFollowupsEnabled(typeof v === "boolean" ? v : true);

        // --- Property matching state (active property + last recommendations)
        const fallbackActiveId =
          (leadData as any)?.active_property_id ||
          (leadData as any)?.property_id ||
          (leadData as any)?.matched_property_id ||
          (leadData as any)?.propertyId ||
          null;

        await loadPropertyState(
          String((leadData as any)?.agent_id || "").trim(),
          fallbackActiveId ? String(fallbackActiveId).trim() : null,
        );

        // --- Copilot context: agent defaults + optional property policy
        try {
          setCopilotLoading(true);
          setCopilotError(null);

          const agentId = String((leadData as any)?.agent_id || "").trim();

          if (agentId) {
            const { data: aSettings, error: aErr } = await (
              supabase.from("agent_settings") as any
            )
              .select(
                "agent_id, followups_enabled_default, followups_max_stage_rent, followups_max_stage_buy, followups_delay_hours_stage1, followups_delay_hours_stage2",
              )
              .eq("agent_id", agentId)
              .maybeSingle();

            if (aErr) console.warn("⚠️ agent_settings fetch", aErr);
            setAgentFollowupsDefaults(aSettings || null);
          } else {
            setAgentFollowupsDefaults(null);
          }

          const possiblePropertyId =
            (leadData as any)?.property_id ||
            (leadData as any)?.matched_property_id ||
            (leadData as any)?.propertyId ||
            null;

          if (possiblePropertyId && agentId) {
            const { data: pRow, error: pErr } = await (
              supabase.from("property_followup_policies") as any
            )
              .select(
                "id, agent_id, property_id, enabled, max_stage_rent, max_stage_buy, stage1_delay_hours, stage2_delay_hours, updated_at",
              )
              .eq("agent_id", agentId)
              .eq("property_id", possiblePropertyId)
              .maybeSingle();

            if (pErr) console.warn("⚠️ property_followup_policies fetch", pErr);
            setPropertyFollowupPolicy(pRow || null);
          } else {
            setPropertyFollowupPolicy(null);
          }
        } catch (e: any) {
          console.warn("⚠️ Copilot context error", e);
          setCopilotError(
            String(e?.message || "Konnte Copilot-Daten nicht laden."),
          );
          setAgentFollowupsDefaults(null);
          setPropertyFollowupPolicy(null);
        } finally {
          setCopilotLoading(false);
        }
      }
      if (messagesData) setMessages(messagesData as unknown as LocalMessage[]);
      if (documentData) setDocuments(documentData);

      setLoading(false);
    };

    fetchData();
  }, [leadId, supabase]);
  // Realtime: keep property matching card in sync when active property/recommendations change
  useEffect(() => {
    // Wait until we know the agent_id (RLS / channel scoping is per lead anyway, but we also need agent_id for loadPropertyState helper)
    const agentId = String((lead as any)?.agent_id || "").trim();
    if (!leadId || !agentId) return;

    const channel = supabase
      .channel(`lead-property-state-updates-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_property_state",
          filter: `lead_id=eq.${leadId}`,
        },
        async (payload) => {
          try {
            const row = payload.new as any;
            if (row?.active_property_id) {
              pushSystemEvent("✅ Immobilie wurde zugeordnet.");
            }

            // Refresh state (use the known agentId)
            await loadPropertyState(agentId, null);
          } catch (e) {
            console.warn("⚠️ lead_property_state realtime refresh failed", e);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, supabase, lead]);

  const handleToggleFollowups = async () => {
    if (!lead || followupsBusy) return;

    const next = !followupsEnabled;
    setFollowupsError(null);
    setFollowupsBusy(true);

    // optimistic UI
    setFollowupsEnabled(next);
    setLead((prev) =>
      prev ? ({ ...(prev as any), followups_enabled: next } as any) : prev,
    );

    try {
      const patch: Record<string, any> = { followups_enabled: next };

      if (!next) {
        // Fail-closed: stop scheduling immediately
        patch.followup_next_at = null;
        patch.followup_status = "stopped";
        patch.followup_stop_reason = "disabled_by_agent";
        patch.followup_paused_until = null;
        patch.followups_pause_reason = null;
      } else {
        // Re-enable: planner/cron will compute followup_next_at
        patch.followup_stop_reason = null;
        patch.followup_status = "idle";
      }

      const { error } = await (supabase.from("leads") as any)
        .update(patch)
        .eq("id", leadId);

      if (error) throw error;
    } catch (e: any) {
      console.error("Could not toggle lead followups", e);
      const msg = String(
        e?.message || "Konnte Follow-ups nicht aktualisieren.",
      );
      setFollowupsError(msg);

      // rollback
      setFollowupsEnabled(!next);
      setLead((prev) =>
        prev ? ({ ...(prev as any), followups_enabled: !next } as any) : prev,
      );
    } finally {
      setFollowupsBusy(false);
    }
  };

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
        },
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
        "Kein Empfänger gefunden (E-Mail fehlt beim Interessenten).",
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
      agent_id: (lead as any).agent_id ?? currentUserId ?? null,
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
      const provider = String(
        (lead as any).email_provider ||
          ((lead as any).outlook_conversation_id ? "outlook" : "gmail"),
      )
        .toLowerCase()
        .trim();

      const nowIso = new Date().toISOString();

      // 1) Create a message row first (source of truth for the pipeline)
      const { data: inserted, error: insErr } = await (
        supabase.from("messages") as any
      )
        .insert({
          agent_id: (lead as any).agent_id ?? currentUserId ?? null,
          lead_id: leadId,
          sender: "agent",
          text: newMessageText,
          timestamp: nowIso,
          was_followup: false,
          email_provider: provider,
          send_status: "pending",
          approval_required: false,
          // IMPORTANT: pipeline expects ready_to_send
          status: "ready_to_send",
          attachments: pendingAttachments.map(
            ({ bucket, path, name, mime }) => ({
              bucket,
              path,
              name,
              mime,
            }),
          ),
        })
        .select("id")
        .single();

      if (insErr || !inserted?.id) {
        throw new Error(insErr?.message || "Konnte Entwurf nicht anlegen.");
      }

      const messageId = String(inserted.id);

      // 2) Trigger the internal pipeline send (provider selection happens server-side)
      const pipelineRes = await fetch("/api/pipeline/reply-ready/send/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: messageId,
          message_id: messageId,
          lead_id: leadId,
        }),
      });

      const pipelineData = await pipelineRes.json().catch(() => ({}));

      if (!pipelineRes.ok) {
        const errMsg = pipelineData?.error || "Senden fehlgeschlagen.";
        setSendError(errMsg);

        setMessages((prev) =>
          prev.map((m) =>
            m._localId === optimisticId ? { ...m, _localStatus: "failed" } : m,
          ),
        );

        setSending(false);
        return;
      }

      // Update optimistic local message with persisted messageId
      setMessages((prev) =>
        prev.map((m) =>
          m._localId === optimisticId
            ? { ...m, id: messageId, _localStatus: undefined }
            : m,
        ),
      );

      setPendingAttachments([]);
    } catch (err) {
      console.error("Failed to send via pipeline", err);
      setSendError("Senden fehlgeschlagen (Netzwerkfehler).");

      setMessages((prev) =>
        prev.map((m) =>
          m._localId === optimisticId ? { ...m, _localStatus: "failed" } : m,
        ),
      );
    }

    setSending(false);
  };

  const groupedMessages = useMemo(() => {
    const all = [...filteredMessages, ...systemEvents]
      .filter(Boolean)
      .sort((a, b) => {
        const ta = new Date(a.timestamp as any).getTime();
        const tb = new Date(b.timestamp as any).getTime();
        return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
      });

    const grouped: { [date: string]: LocalMessage[] } = {};
    all.forEach((msg) => {
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
  }, [filteredMessages, systemEvents]);

  const hasMessages = filteredMessages.length > 0;

  const copilotRuleSource = useMemo(() => {
    return computeRuleSource(
      lead as any,
      agentFollowupsDefaults,
      propertyFollowupPolicy,
    );
  }, [lead, agentFollowupsDefaults, propertyFollowupPolicy]);

  const copilotEffectiveEnabled = useMemo(() => {
    const leadEnabled =
      typeof (lead as any)?.followups_enabled === "boolean"
        ? !!(lead as any).followups_enabled
        : true;

    const agentDefault = agentFollowupsDefaults?.followups_enabled_default;
    const agentEnabled =
      typeof agentDefault === "boolean" ? !!agentDefault : true;

    const propEnabled = propertyFollowupPolicy?.enabled;
    const propertyEnabled =
      typeof propEnabled === "boolean" ? !!propEnabled : null;

    const propertyGate = propertyEnabled === null ? true : propertyEnabled;

    return agentEnabled && propertyGate && leadEnabled;
  }, [lead, agentFollowupsDefaults, propertyFollowupPolicy]);

  const copilotMaxStage = useMemo(() => {
    const t = String((lead as any)?.type || "").toLowerCase();
    const isRent = t.includes("miet") || t.includes("rent");

    const leadOverride = (lead as any)?.followups_max_stage_override;
    if (typeof leadOverride === "number") return leadOverride;

    const prop = propertyFollowupPolicy || null;
    if (prop) {
      const v = isRent ? prop.max_stage_rent : prop.max_stage_buy;
      if (typeof v === "number") return v;
    }

    const a = agentFollowupsDefaults || null;
    if (a) {
      const v = isRent ? a.followups_max_stage_rent : a.followups_max_stage_buy;
      if (typeof v === "number") return v;
    }

    return 2;
  }, [lead, agentFollowupsDefaults, propertyFollowupPolicy]);

  const copilotDelays = useMemo(() => {
    const prop = propertyFollowupPolicy || null;
    const a = agentFollowupsDefaults || null;

    const d1 =
      (prop &&
        typeof prop.stage1_delay_hours === "number" &&
        prop.stage1_delay_hours) ||
      (a &&
        typeof a.followups_delay_hours_stage1 === "number" &&
        a.followups_delay_hours_stage1) ||
      24;

    const d2 =
      (prop &&
        typeof prop.stage2_delay_hours === "number" &&
        prop.stage2_delay_hours) ||
      (a &&
        typeof a.followups_delay_hours_stage2 === "number" &&
        a.followups_delay_hours_stage2) ||
      72;

    return { d1, d2 };
  }, [agentFollowupsDefaults, propertyFollowupPolicy]);

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

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900"
      data-tour="conversation-panel"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200"
          data-tour="conversation-header"
        >
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
                  Priorität: {(lead as any).priority ?? "-"}
                </span>

                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                  Advaic
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (propertyCardRef.current) {
                      propertyCardRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                  className={`text-xs font-medium px-2 py-1 rounded-full border transition-colors ${
                    activeProperty
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  title={
                    activeProperty
                      ? "Immobilie ist zugeordnet (klicken zum Anzeigen)"
                      : "Noch keine Immobilie zugeordnet (klicken zum Anzeigen)"
                  }
                >
                  {activeProperty
                    ? "Immobilie: Zugeordnet"
                    : "Immobilie: Offen"}
                </button>
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
                data-tour="copy-email"
              >
                E-Mail kopieren
              </button>

              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Profil öffnen"
                data-tour="lead-profile-button"
              >
                Profil
              </button>

              <button
                type="button"
                onClick={() => alert("Export folgt – kommt als nächstes.")}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Verlauf exportieren"
                data-tour="export-button"
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
                data-tour="escalate-button"
              >
                {isEscalated ? "Eskaliert" : "Eskalieren"}
              </button>
            </div>
          </div>
        </div>

        {/* Chat + Composer */}
        <div className="py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
            {/* LEFT: Chat */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              {/* Messages */}
              <div
                className="h-[calc(100vh-260px)] overflow-y-auto px-3 md:px-6 py-4 space-y-6 bg-[#fbfbfc]"
                data-tour="conversation-messages"
              >
                <div className="sr-only" data-tour="email-truth">
                  Alle Nachrichten hier sind echte E-Mails
                  (eingehend/ausgehend).
                </div>
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
                      const isSystem =
                        String(msg.sender ?? "").toLowerCase() === "system" ||
                        !!(msg as any).is_system ||
                        !!(msg as any).was_followup;
                      const isFollowup =
                        !!(msg as any).was_followup ||
                        String(msg.sender ?? "").toLowerCase() === "system";
                      const looksLikeImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(
                        text,
                      );
                      const looksLikePDF = /\.pdf$/i.test(text);
                      const looksLikeUrl = isLikelyUrl(text);

                      // Determine bubble classes and icon for system/followup/copilot
                      let bubbleClasses = "";
                      let prependIcon = null;

                      if (isSystem) {
                        bubbleClasses =
                          "bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl max-w-[72%]";
                        prependIcon = (
                          <span className="mr-2" aria-label="System">
                            {String(msg.sender ?? "").toLowerCase() ===
                              "system" || (msg as any).was_followup
                              ? "⚡"
                              : "🤖"}
                          </span>
                        );
                      } else if (isAgent) {
                        // Agent bubbles should feel premium + readable (not pure black)
                        bubbleClasses =
                          "bg-white border border-slate-200 shadow-sm text-slate-900 rounded-2xl max-w-[72%]";
                      } else {
                        // Incoming (lead) bubbles: clean neutral
                        bubbleClasses =
                          "bg-white border border-gray-200 text-slate-900 rounded-2xl max-w-[72%]";
                      }

                      return (
                        <div
                          key={(msg as any).id}
                          className={`flex ${
                            isSystem
                              ? "justify-center"
                              : isAgent
                                ? "justify-end"
                                : "justify-start"
                          }`}
                        >
                          <div
                            className={`w-fit px-4 py-3 text-sm shadow-sm ${bubbleClasses}`}
                          >
                            <div className="flex items-start">
                              {isSystem && prependIcon}
                              <div className="flex-1 min-w-0">
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
                                        isAgent
                                          ? "text-amber-100"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      📄 PDF öffnen
                                    </div>
                                    <div
                                      className={`text-xs mt-1 break-all ${
                                        isAgent
                                          ? "text-gray-300"
                                          : "text-gray-600"
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
                                        isAgent
                                          ? "text-slate-900"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      🔗 Link öffnen
                                    </div>
                                    <div
                                      className={`text-xs mt-1 break-all ${
                                        isAgent
                                          ? "text-slate-700"
                                          : "text-gray-600"
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
                                          className="prose prose-sm leading-relaxed max-w-none prose-gray"
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
                              </div>
                            </div>

                            {(msg as LocalMessage)._localStatus ===
                              "sending" && (
                              <div
                                className={`text-[10px] mt-2 opacity-80 ${
                                  isAgent
                                    ? "text-amber-200"
                                    : isSystem
                                      ? "text-amber-700"
                                      : "text-gray-500"
                                }`}
                              >
                                Wird gesendet…
                              </div>
                            )}

                            {(msg as LocalMessage)._localStatus ===
                              "failed" && (
                              <div className="text-[10px] mt-2 text-red-300">
                                Senden fehlgeschlagen
                              </div>
                            )}

                            {!isSystem && (
                              <div
                                className={`text-[10px] text-right mt-2 opacity-70 ${
                                  isAgent ? "text-slate-600" : "text-gray-500"
                                }`}
                              >
                                {new Date(msg.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            )}
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
                <div className="px-3 md:px-6 pt-4" data-tour="attachments">
                  <div className="mb-3 flex flex-col gap-2">
                    <div className="text-xs text-gray-600">
                      Anhänge werden als echte E-Mail-Anhänge gesendet (privater
                      Bucket).
                    </div>

                    <div className="text-xs text-gray-600">
                      {(() => {
                        const total = pendingAttachments.reduce(
                          (s, a) => s + (a.size || 0),
                          0,
                        );
                        const pct = total / MAX_TOTAL_ATTACHMENT_BYTES;

                        return (
                          <>
                            Gesamtgröße:{" "}
                            <span className="font-medium">
                              {formatBytes(total)}
                            </span>{" "}
                            / {formatBytes(MAX_TOTAL_ATTACHMENT_BYTES)}
                            {pct >= 0.8 && (
                              <span className="ml-2 text-amber-700">
                                (nah am Limit)
                              </span>
                            )}
                          </>
                        );
                      })()}
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

                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                            {getExt(a.name).toUpperCase() || "FILE"}
                          </span>

                          <span className="text-gray-500">
                            {formatBytes(a.size || 0)}
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
                                prev.filter((x) => x.path !== a.path),
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

              <div
                className="px-3 md:px-6 py-4 border-t border-gray-200 bg-[#fbfbfc]"
                data-tour="composer"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={templateValue}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTemplateValue(v);
                        if (v) {
                          setNewMessage((prev) =>
                            prev?.trim().length ? `${prev}\n\n${v}` : v,
                          );
                        }
                      }}
                      className="text-sm rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-800"
                      data-tour="quick-templates"
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

                    <div
                      className="hidden lg:block text-xs text-gray-600"
                      data-tour="quality-hint"
                    >
                      Hinweis: Alles hier ist echte E-Mail-Kommunikation
                      (eingehend &amp; ausgehend) — keine interne
                      Chat-Simulation.
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2"
                    data-tour="attachments-action"
                  >
                    <button
                      type="button"
                      onClick={handlePickFile}
                      className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                      title="Datei hochladen (privat, als Anhang)"
                      data-tour="attachments-button"
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
                    data-tour="composer-textarea"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-3 rounded-xl text-sm font-medium bg-gray-900 border border-gray-900 text-amber-200 transition-all duration-200 hover:bg-amber-200 hover:border-amber-200 hover:text-gray-900 hover:shadow-[0_10px_30px_rgba(245,158,11,0.18)] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 disabled:hover:border-gray-900 disabled:hover:text-amber-200 disabled:hover:shadow-none"
                    data-tour="send-button"
                  >
                    {sending ? "Sende…" : "Senden"}
                  </button>
                </form>
              </div>
            </div>
            {/* RIGHT: Lead Copilot Card */}
            <div
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden h-fit shadow-sm lg:sticky lg:top-24"
              data-tour="lead-copilot-card"
            >
              <div className="px-4 py-4 border-b border-gray-200 bg-[#fbfbfc]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Copilot</div>
                    <div className="text-sm font-semibold text-gray-900">
                      Lead Status &amp; Regeln
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                      {copilotRuleSource}
                    </span>
                    {/* Follow-ups toggle switch moved here */}
                    <button
                      type="button"
                      onClick={handleToggleFollowups}
                      disabled={followupsBusy}
                      className={`px-3 py-2 text-xs rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                        followupsEnabled
                          ? "bg-gray-900 border-gray-900 text-amber-200 hover:bg-gray-800"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                      title={
                        followupsEnabled
                          ? "Follow-ups sind aktiv für diesen Interessenten"
                          : "Follow-ups sind deaktiviert für diesen Interessenten"
                      }
                      style={{ minWidth: "90px" }}
                    >
                      {followupsBusy
                        ? "…"
                        : followupsEnabled
                          ? "Follow-ups: An"
                          : "Follow-ups: Aus"}
                    </button>
                  </div>
                </div>
                {followupsError && (
                  <div className="mt-2">
                    <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-xs">
                      {followupsError}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-4">
                {debugEnabled && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">Debug</div>
                      <a
                        href={
                          typeof window !== "undefined"
                            ? window.location.pathname
                            : "#"
                        }
                        className="underline underline-offset-2"
                        title="Debug aus (URL ohne ?debug=1)"
                      >
                        ausschalten
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-amber-200 bg-white px-2 py-1">
                        <div className="text-[10px] text-amber-700">leadId</div>
                        <div className="font-mono break-all">
                          {String(leadId)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-white px-2 py-1">
                        <div className="text-[10px] text-amber-700">
                          agent_id (lead)
                        </div>
                        <div className="font-mono break-all">
                          {String((lead as any)?.agent_id || "")}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-white px-2 py-2">
                      <div className="text-[10px] text-amber-700 mb-1">
                        active_property_id (state)
                      </div>
                      <div className="font-mono break-all">
                        {String(propertyState?.active_property_id || "")}
                      </div>
                    </div>

                    <details className="rounded-lg border border-amber-200 bg-white px-2 py-2">
                      <summary className="cursor-pointer text-[11px] text-amber-800">
                        debugInfo (JSON)
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap break-words text-[10px]">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>

                    <div className="text-[10px] text-amber-700">
                      Tipp: Öffne diese Seite mit{" "}
                      <span className="font-mono">?debug=1</span> und schau dir
                      in der Konsole{" "}
                      <span className="font-mono">[LeadChatView:debug]</span>{" "}
                      an.
                    </div>
                  </div>
                )}
                <div
                  ref={propertyCardRef}
                  className="rounded-xl border border-gray-200 bg-white p-3"
                >
                  <div className="text-xs text-gray-500">Property Matching</div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-gray-900">
                      {activeProperty ? "Zugeordnet" : "Keine Immobilie"}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                        {propertyState?.updated_at
                          ? formatDateTimeDE(propertyState.updated_at)
                          : "–"}
                      </span>

                      {activeProperty ? (
                        <>
                          <button
                            type="button"
                            onClick={openAssignModal}
                            className="text-[11px] px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            title="Andere Immobilie auswählen"
                          >
                            Ändern
                          </button>
                          <button
                            type="button"
                            onClick={() => assignProperty(null)}
                            disabled={assignBusy}
                            className="text-[11px] px-2 py-1 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                            title="Zuordnung entfernen"
                          >
                            Entfernen
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={openAssignModal}
                          className="text-[11px] px-2 py-1 rounded-full border border-gray-900 bg-gray-900 text-amber-200 hover:bg-gray-800"
                          title="Immobilie manuell zuordnen"
                        >
                          Zuordnen
                        </button>
                      )}
                    </div>
                  </div>

                  {activeProperty ? (
                    <div className="mt-2 rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {activeProperty.street_address || "Immobilie"}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5 truncate">
                        {(
                          activeProperty.neighborhood ||
                          activeProperty.city ||
                          ""
                        ).toString()}
                        {activeProperty.neighborhood && activeProperty.city
                          ? ", "
                          : ""}
                        {activeProperty.city || ""}
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-700">
                        <div>
                          <span className="text-gray-500">Preis:</span>{" "}
                          {typeof activeProperty.price === "number"
                            ? `${activeProperty.price.toLocaleString("de-DE")} ${
                                activeProperty.price_type || ""
                              }`
                            : "–"}
                        </div>
                        <div>
                          <span className="text-gray-500">Zimmer:</span>{" "}
                          {typeof activeProperty.rooms === "number"
                            ? activeProperty.rooms
                            : "–"}
                        </div>
                        <div>
                          <span className="text-gray-500">Fläche:</span>{" "}
                          {typeof activeProperty.size_sqm === "number"
                            ? `${activeProperty.size_sqm} m²`
                            : "–"}
                        </div>
                        <div>
                          <span className="text-gray-500">ID:</span>{" "}
                          {shortId(activeProperty.id)}
                        </div>
                      </div>

                      {(propertyState?.active_property_reason ||
                        typeof propertyState?.active_property_confidence ===
                          "number") && (
                        <div className="mt-2 text-[11px] text-gray-600">
                          {propertyState?.active_property_reason ? (
                            <span>
                              <span className="text-gray-500">Warum:</span>{" "}
                              {String(propertyState.active_property_reason)}
                            </span>
                          ) : null}
                          {typeof propertyState?.active_property_confidence ===
                          "number" ? (
                            <span className="ml-2">
                              <span className="text-gray-500">Confidence:</span>{" "}
                              {propertyState.active_property_confidence.toFixed(
                                2,
                              )}
                            </span>
                          ) : null}
                        </div>
                      )}

                      <div className="mt-3 flex flex-col gap-2">
                        {activeProperty.url ? (
                          <a
                            href={String(activeProperty.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-sm inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2"
                          >
                            Listing öffnen
                          </a>
                        ) : null}

                        <a
                          href={`/app/immobilien/bearbeiten/${activeProperty.id}`}
                          className="w-full text-sm inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 px-3 py-2"
                          title="Immobilie in Advaic öffnen"
                        >
                          In Advaic öffnen
                        </a>

                        {!activeProperty.url && (
                          <div className="text-[11px] text-gray-500">
                            Kein Listing-Link hinterlegt.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-600">
                      Noch keine Immobilie zugeordnet. Sobald der Matcher eine
                      passende Immobilie findet, erscheint sie hier.
                    </div>
                  )}
                  {assignError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-xs">
                      {assignError}
                    </div>
                  )}
                  {/* Manual Property Assignment Modal */}
                  {assignOpen && (
                    <div className="fixed inset-0 z-50">
                      <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() =>
                          assignBusy ? null : setAssignOpen(false)
                        }
                      />

                      <div className="absolute inset-0 flex items-start justify-center p-4 md:p-8">
                        <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                          <div className="px-4 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs text-gray-500">
                                Property Matching
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                Immobilie manuell zuordnen
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                assignBusy ? null : setAssignOpen(false)
                              }
                              className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                              title="Schließen"
                            >
                              Schließen
                            </button>
                          </div>

                          <div className="p-4 space-y-3">
                            <div className="flex flex-col md:flex-row gap-2">
                              <input
                                value={propertySearch}
                                onChange={(e) =>
                                  setPropertySearch(e.target.value)
                                }
                                placeholder="Suche nach Straße, Stadt, Stadtteil…"
                                className="flex-1 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  runPropertySearch(propertySearch)
                                }
                                disabled={assignBusy}
                                className="px-4 py-2 text-sm rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-60"
                              >
                                Suchen
                              </button>
                            </div>

                            <div className="text-xs text-gray-600">
                              Tipp: Wähle eine Immobilie aus der Liste. Das
                              überschreibt die aktuelle Zuordnung.
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-gray-200">
                              {propertyResults.length === 0 ? (
                                <div className="p-4 text-sm text-gray-600">
                                  Keine Immobilien gefunden.
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-200">
                                  {propertyResults.map((p) => {
                                    const title =
                                      p.street_address || "Immobilie";
                                    const sub = [p.neighborhood, p.city]
                                      .filter(Boolean)
                                      .join(", ");
                                    const price =
                                      typeof p.price === "number"
                                        ? `${p.price.toLocaleString("de-DE")} ${p.price_type || ""}`.trim()
                                        : "–";

                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => assignProperty(p.id)}
                                        disabled={assignBusy}
                                        className="w-full text-left p-4 hover:bg-gray-50 disabled:opacity-60"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate">
                                              {title}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-0.5 truncate">
                                              {sub || "–"}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                              <span className="text-gray-500">
                                                Preis:
                                              </span>{" "}
                                              {price}
                                              <span className="mx-2">·</span>
                                              <span className="text-gray-500">
                                                Zimmer:
                                              </span>{" "}
                                              {typeof p.rooms === "number"
                                                ? p.rooms
                                                : "–"}
                                              <span className="mx-2">·</span>
                                              <span className="text-gray-500">
                                                Fläche:
                                              </span>{" "}
                                              {typeof p.size_sqm === "number"
                                                ? `${p.size_sqm} m²`
                                                : "–"}
                                            </div>
                                          </div>

                                          <div className="shrink-0 flex flex-col items-end gap-2">
                                            <span className="text-[11px] px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                                              {shortId(p.id)}
                                            </span>
                                            {p.url ? (
                                              <span className="text-[11px] px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                                                Listing-Link
                                              </span>
                                            ) : null}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col md:flex-row gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => assignProperty(null)}
                                disabled={assignBusy}
                                className="w-full md:w-auto px-4 py-2 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                              >
                                Zuordnung entfernen
                              </button>
                              <div className="flex-1" />
                              <button
                                type="button"
                                onClick={() => setAssignOpen(false)}
                                disabled={assignBusy}
                                className="w-full md:w-auto px-4 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                              >
                                Abbrechen
                              </button>
                            </div>

                            {assignError && (
                              <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-xs">
                                {assignError}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {recommendedProperties.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[11px] text-gray-500 mb-1">
                        Zuletzt empfohlen
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recommendedProperties.map((p) => (
                          <a
                            key={p.id}
                            href={`/app/immobilien/bearbeiten/${p.id}`}
                            className="text-[11px] px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                            title={p.street_address || p.city || p.id}
                          >
                            {p.street_address
                              ? String(p.street_address).slice(0, 28)
                              : p.city || shortId(p.id)}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {copilotError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-xs">
                    {copilotError}
                  </div>
                )}

                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-xs text-gray-500">Follow-ups</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-gray-900">
                      {copilotEffectiveEnabled ? "Aktiv" : "Deaktiviert"}
                    </div>
                    <span
                      className={`text-[11px] px-2 py-1 rounded-full border ${
                        copilotEffectiveEnabled
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 bg-gray-50 text-gray-700"
                      }`}
                    >
                      {followupStatusLabel((lead as any)?.followup_status)}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <div>
                      <span className="text-gray-500">Stufe:</span>{" "}
                      {Number((lead as any)?.followup_stage ?? 0)} /{" "}
                      {copilotMaxStage}
                    </div>
                    <div>
                      <span className="text-gray-500">Nächster Zeitpunkt:</span>{" "}
                      {formatDateTimeDE((lead as any)?.followup_next_at)}
                    </div>
                    <div>
                      <span className="text-gray-500">Letztes Follow-up:</span>{" "}
                      {formatDateTimeDE((lead as any)?.followup_last_sent_at)}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    {(() => {
                      if (!copilotEffectiveEnabled) {
                        if (
                          typeof (lead as any)?.followups_enabled ===
                            "boolean" &&
                          (lead as any).followups_enabled === false
                        ) {
                          return "Deaktiviert (Lead-Override).";
                        }
                        if (
                          propertyFollowupPolicy &&
                          typeof propertyFollowupPolicy.enabled === "boolean" &&
                          propertyFollowupPolicy.enabled === false
                        ) {
                          return "Deaktiviert (Immobilien-Regel).";
                        }
                        if (
                          typeof agentFollowupsDefaults?.followups_enabled_default ===
                            "boolean" &&
                          agentFollowupsDefaults.followups_enabled_default ===
                            false
                        ) {
                          return "Deaktiviert (Agent-Standard).";
                        }
                        return "Deaktiviert (Regel).";
                      }

                      const status = String(
                        (lead as any)?.followup_status || "",
                      )
                        .toLowerCase()
                        .trim();

                      if (status === "stopped") {
                        const r = (lead as any)?.followup_stop_reason || "";
                        return r ? `Gestoppt: ${String(r)}` : "Gestoppt.";
                      }

                      if ((lead as any)?.followup_paused_until) {
                        return `Pausiert bis ${formatDateTimeDE(
                          (lead as any)?.followup_paused_until,
                        )}.`;
                      }

                      if ((lead as any)?.followup_next_at) {
                        return "Geplant: Wird automatisch vorbereitet und läuft durch QA/Rewrite Pipeline.";
                      }

                      return "Wartet: Nächster Schritt wird vom Planner berechnet.";
                    })()}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="text-xs text-gray-500">Timing (Standard)</div>
                  <div className="mt-1 text-sm text-gray-900 font-medium">
                    Stufe 1: {copilotDelays.d1}h · Stufe 2: {copilotDelays.d2}h
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Diese Werte kommen aus{" "}
                    {copilotRuleSource === "Immobilie"
                      ? "der Immobilienregel"
                      : "den Agent-Standards"}{" "}
                    (sofern gesetzt).
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href="/app/follow-ups"
                    className="w-full text-sm inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2"
                  >
                    Zur Follow-ups Übersicht
                  </a>

                  <a
                    href="/app/follow-ups/settings"
                    className="w-full text-sm inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 px-3 py-2"
                  >
                    Follow-ups Einstellungen
                  </a>

                  <div className="text-[11px] text-gray-500">
                    Tipp: Du kannst Follow-ups auch pro Lead (oben)
                    deaktivieren.
                  </div>

                  {copilotLoading && (
                    <div className="text-[11px] text-gray-500">
                      Lade Copilot-Daten…
                    </div>
                  )}
                </div>
              </div>
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
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white border-l border-gray-200 shadow-2xl"
            data-tour="profile-drawer"
          >
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
                  <span className="text-gray-500">Anfrage:</span>{" "}
                  {(lead as any).type}
                </p>
                <p>
                  <span className="text-gray-500">Priorität:</span>{" "}
                  {(lead as any).priority}
                </p>
                <p>
                  <span className="text-gray-500">Letzte Aktivität:</span>{" "}
                  {new Date((lead as any).updated_at).toLocaleString()}
                </p>
                <p>
                  <span className="text-gray-500">Nachrichten:</span>{" "}
                  {(lead as any).message_count}
                </p>
              </div>

              <div className="mt-6" data-tour="profile-key-info">
                <LeadKeyInfoCard leadId={leadId} />
              </div>

              <div className="mt-6" data-tour="profile-documents">
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
