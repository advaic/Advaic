"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Wand2, AlertTriangle } from "lucide-react";

type Props = {
  leadId: string;
};

type DocRow = {
  id: string;
  lead_id: string;
  name?: string | null;
  title?: string | null;
  type?: string | null;
  status?: string | null;
  qa_status?: string | null;
  uploaded_at?: string | null;
  created_at?: string | null;
  url?: string | null;
  file_url?: string | null;
};

type CopilotStateRow = {
  id?: string;
  agent_id?: string;
  lead_id: string;
  headline?: string | null;
  summary?: string | null;
  next_steps?: any; // jsonb
  risks?: any; // jsonb
  property_context?: any; // jsonb
  followup_context?: any; // jsonb
  why_needs_approval_hint?: string | null;
  prompt_key?: string | null;
  prompt_version?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type CopilotStep = { title: string; detail: string };
type CopilotRisk = {
  level: "low" | "medium" | "high";
  title: string;
  detail: string;
};

function asArray<T>(v: any): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as T[];
  // Supabase can sometimes return json as string depending on clients
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function riskBadge(level: "low" | "medium" | "high") {
  if (level === "high") return "bg-red-100 text-red-800";
  if (level === "medium") return "bg-yellow-100 text-yellow-900";
  return "bg-green-100 text-green-800";
}

function formatDateTime(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function normalizeStatus(doc: DocRow) {
  const raw = (doc.status || doc.qa_status || "").toLowerCase();
  if (raw.includes("pass") || raw.includes("ok") || raw.includes("approved"))
    return "pass";
  if (raw.includes("warn") || raw.includes("warning") || raw.includes("review"))
    return "warn";
  if (raw.includes("fail") || raw.includes("rejected")) return "warn";
  return "open";
}

function StatusPill({ kind }: { kind: "pass" | "warn" | "open" }) {
  const map = {
    pass: { label: "Pass", cls: "bg-green-100 text-green-800" },
    warn: { label: "Warnung", cls: "bg-yellow-100 text-yellow-900" },
    open: { label: "Offen", cls: "bg-gray-100 text-gray-700" },
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${map[kind].cls}`}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-current opacity-60" />
      {map[kind].label}
    </span>
  );
}

export default function LeadKeyInfoCard({ leadId }: Props) {
  const supabase = useSupabaseClient<Database>();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [copilot, setCopilot] = useState<CopilotStateRow | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(true);
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) return;

    const fetchDocs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents" as any)
        .select(
          "id, lead_id, name, title, type, status, qa_status, uploaded_at, created_at, url, file_url",
        )
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error loading documents:", error);
        setDocs([]);
      } else {
        setDocs((data as DocRow[]) ?? []);
      }

      setLoading(false);
    };

    fetchDocs();
  }, [leadId, supabase]);

  useEffect(() => {
    if (!leadId) return;

    const fetchCopilot = async () => {
      setCopilotLoading(true);
      setCopilotError(null);

      const { data, error } = await supabase
        .from("lead_copilot_state" as any)
        .select(
          "lead_id, headline, summary, next_steps, risks, property_context, followup_context, why_needs_approval_hint, prompt_key, prompt_version, updated_at",
        )
        .eq("lead_id", leadId)
        .maybeSingle();

      if (error) {
        // fail-open: don't crash the chat page if copilot table isn't ready
        console.error("Error loading lead_copilot_state:", error);
        setCopilot(null);
      } else {
        setCopilot((data as CopilotStateRow) ?? null);
      }

      setCopilotLoading(false);
    };

    fetchCopilot();
  }, [leadId, supabase]);

  const regenerateCopilot = async () => {
    if (!leadId) return;
    setCopilotBusy(true);
    setCopilotError(null);

    try {
      const res = await fetch("/api/copilot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      });

      const data = await res.json().catch(() => ({}) as any);

      if (!res.ok) {
        const code = String(data?.error || "copilot_generate_failed");

        if (res.status === 401) {
          throw new Error(
            "Nicht eingeloggt. Bitte neu anmelden und erneut versuchen.",
          );
        }
        if (res.status === 403) {
          throw new Error("Keine Berechtigung für diesen Interessenten.");
        }
        if (res.status === 402) {
          throw new Error(
            "Dieses Feature ist in deinem aktuellen Plan nicht enthalten. Öffne Konto > Abo, um deinen Plan zu ändern.",
          );
        }
        if (res.status === 429) {
          throw new Error(
            "Zu viele Anfragen. Bitte in 30 Sekunden erneut versuchen.",
          );
        }
        if (res.status >= 500) {
          throw new Error(
            "Serverfehler beim Copilot. Bitte später erneut versuchen.",
          );
        }

        throw new Error(code);
      }

      // The route should persist into lead_copilot_state; we refresh from DB to be source of truth.
      const { data: fresh, error: freshErr } = await supabase
        .from("lead_copilot_state" as any)
        .select(
          "lead_id, headline, summary, next_steps, risks, property_context, followup_context, why_needs_approval_hint, prompt_key, prompt_version, updated_at",
        )
        .eq("lead_id", leadId)
        .maybeSingle();

      if (freshErr) {
        console.error("Error refreshing lead_copilot_state:", freshErr);
      }

      setCopilot(
        (fresh as CopilotStateRow) ?? (data?.state as CopilotStateRow) ?? null,
      );
    } catch (e: any) {
      console.error(e);
      const msg = String(e?.message || "").trim();
      setCopilotError(msg || "Copilot konnte nicht aktualisiert werden.");
    } finally {
      setCopilotBusy(false);
    }
  };

  const countLabel = useMemo(() => {
    const n = docs.length;
    return n === 1 ? "1 Dokument" : `${n} Dokumente`;
  }, [docs.length]);

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>Copilot</CardTitle>
              <div className="mt-1 text-xs text-muted-foreground">
                Gespeicherter Snapshot (wird nicht automatisch aktualisiert).
                Aktualisiere nach neuen Nachrichten.
              </div>
            </div>

            {/* Nur anzeigen, wenn bereits ein Snapshot existiert */}
            {copilot ? (
              <button
                type="button"
                onClick={regenerateCopilot}
                disabled={copilotBusy}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-60"
                title="Copilot aktualisieren"
              >
                {copilotBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Aktualisieren
              </button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          {copilotLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !copilot ? (
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Wand2 className="h-4 w-4" />
                Noch kein Copilot-Snapshot
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Klicke auf „Zusammenfassung anfragen“, um eine Zusammenfassung
                zu generieren.
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={regenerateCopilot}
                  disabled={copilotBusy}
                  title="Copilot-Zusammenfassung anfragen"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-gray-800 disabled:opacity-60"
                >
                  {copilotBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Zusammenfassung anfragen
                </button>
                <span className="text-xs text-muted-foreground">
                  Wird gespeichert und nur bei Bedarf aktualisiert.
                </span>
              </div>
              {copilotError ? (
                <div className="mt-3 text-xs text-red-600">{copilotError}</div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {copilot.headline || "Snapshot"}
                    </div>
                    {copilot.updated_at ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Stand: {formatDateTime(copilot.updated_at)}
                        <span className="ml-2">• Quelle: Copilot-Snapshot</span>
                        {copilot.prompt_key ? (
                          <span className="ml-2">
                            • {copilot.prompt_key}
                            {copilot.prompt_version
                              ? `/${copilot.prompt_version}`
                              : ""}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {copilot.why_needs_approval_hint ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 text-yellow-900 px-3 py-1 text-xs font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Hinweis
                    </span>
                  ) : null}
                </div>

                {copilot.summary ? (
                  <div className="mt-3 text-sm text-foreground whitespace-pre-line">
                    {copilot.summary}
                  </div>
                ) : null}

                {copilot.why_needs_approval_hint ? (
                  <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900">
                    <div className="font-semibold">
                      Warum evtl. „Zur Freigabe“:
                    </div>
                    <div className="mt-1">
                      {copilot.why_needs_approval_hint}
                    </div>
                  </div>
                ) : null}
              </div>

              {(() => {
                const steps = asArray<CopilotStep>(copilot.next_steps);
                if (!steps.length) return null;
                return (
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold">
                      Nächste Schritte
                    </div>
                    <div className="mt-3 space-y-2">
                      {steps.slice(0, 6).map((s, idx) => (
                        <div
                          key={`${idx}-${s.title}`}
                          className="rounded-xl border border-border bg-muted/20 p-3"
                        >
                          <div className="text-sm font-semibold">{s.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                            {s.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const risks = asArray<CopilotRisk>(copilot.risks);
                if (!risks.length) return null;
                return (
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="text-sm font-semibold">Risiken</div>
                    <div className="mt-3 space-y-2">
                      {risks.slice(0, 6).map((r, idx) => (
                        <div
                          key={`${idx}-${r.title}`}
                          className="rounded-xl border border-border bg-muted/20 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">
                              {r.title}
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${riskBadge(r.level)}`}
                            >
                              {r.level.toUpperCase()}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                            {r.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {copilotError ? (
                <div className="text-xs text-red-600">{copilotError}</div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- Unterlagen (existing) ---------------- */}
      {loading ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Unterlagen</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !docs?.length ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Unterlagen</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Noch keine Unterlagen hochgeladen.
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Unterlagen</CardTitle>
              <span className="text-xs text-muted-foreground">
                {countLabel}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {docs.map((doc) => {
              const title = doc.title || doc.name || doc.type || "Dokument";
              const when = formatDateTime(doc.uploaded_at || doc.created_at);
              const kind = normalizeStatus(doc);
              const href = doc.url || doc.file_url || "";

              return (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-sm">{title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Hochgeladen am: {when}
                      </div>
                    </div>
                    <StatusPill kind={kind} />
                  </div>

                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm text-blue-600 hover:underline"
                    >
                      Dokument ansehen
                    </a>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </>
  );
}
