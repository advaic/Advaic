"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Archive, Search, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabaseClient";

type ArchivedLead = {
  id: string;
  name: string | null;
  email: string | null;
  last_message: string | null;
  last_message_at: string | null;
  archived_at: string | null;
  status: string | null;
};

function safeStr(v: unknown) {
  return String(v ?? "").trim();
}

function formatDateTimeDE(iso: string) {
  try {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ArchivPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ArchivedLead[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          toast.error("Nicht eingeloggt. Bitte neu einloggen.");
          if (!cancelled) setRows([]);
          return;
        }

        // Preferred: archived items via status = 'archived'
        const baseSelect =
          "id,name,email,last_message,last_message_at,archived_at,status";

        let res = await supabase
          .from("leads")
          .select(baseSelect)
          .eq("agent_id", user.id)
          .eq("status", "archived")
          .order("archived_at", { ascending: false, nullsFirst: false })
          .order("last_message_at", { ascending: false, nullsFirst: false });

        // Fallback: some schemas archive via archived_at != null
        if (res.error) {
          console.warn("Archive query (status) failed, trying archived_at…", res.error);
          res = await supabase
            .from("leads")
            .select(baseSelect)
            .eq("agent_id", user.id)
            .not("archived_at", "is", null)
            .order("archived_at", { ascending: false, nullsFirst: false })
            .order("last_message_at", { ascending: false, nullsFirst: false });
        }

        if (res.error) {
          console.error("❌ Failed loading archive:", res.error);
          toast.error("Archiv konnte nicht geladen werden.");
          if (!cancelled) setRows([]);
          return;
        }

        if (!cancelled) {
          setRows((res.data as any) ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = safeStr(query).toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay =
        `${safeStr(r.name)} ${safeStr(r.email)} ${safeStr(r.last_message)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const countLabel = useMemo(() => {
    if (loading) return "Lade…";
    return `${filtered.length} Eintrag${filtered.length === 1 ? "" : "e"}`;
  }, [filtered.length, loading]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-semibold">Archiv</h1>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                Advaic
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full border bg-white border-gray-200 text-gray-700">
                {countLabel}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              Hier findest du abgeschlossene Konversationen. Du kannst sie weiterhin öffnen,
              aber sie zählen nicht mehr als aktive Interessenten.
            </div>
          </div>

          <div className="w-full sm:w-[340px]">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suchen (Name, E-Mail, Nachricht)…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              />
            </div>
          </div>
        </div>

        <div className="h-5" />

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lade Archiv…
            </div>
            <div className="p-4 md:p-6">
              <div className="grid gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[86px] rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="flex items-center gap-3 text-gray-900">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Archive className="h-5 w-5 text-amber-900" />
              </div>
              <div>
                <div className="text-lg font-semibold">Noch nichts im Archiv</div>
                <div className="text-sm text-gray-600 mt-1">
                  Sobald du einen Interessenten abschließt/archivierst, erscheint er hier.
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push("/app/nachrichten")}
                className="px-3 py-2 text-sm rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800"
              >
                Zur Übersicht
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between">
              <div className="text-sm text-gray-700 font-medium">Archivierte Interessenten</div>
              <div className="text-xs text-gray-500">
                Tipp: Klicke auf einen Eintrag, um die Unterhaltung zu öffnen.
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div className="grid gap-3">
                {filtered.map((lead) => {
                  const title = safeStr(lead.name) || safeStr(lead.email) || "Unbekannt";
                  const subtitle = safeStr(lead.email);
                  const snippet = safeStr(lead.last_message);
                  const date =
                    lead.archived_at || lead.last_message_at || null;

                  return (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => router.push(`/app/nachrichten/${lead.id}`)}
                      className="text-left rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold text-gray-900 truncate">{title}</div>
                            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700">
                              Archiv
                            </span>
                          </div>
                          {subtitle ? (
                            <div className="text-sm text-gray-600 truncate">{subtitle}</div>
                          ) : null}
                          {snippet ? (
                            <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                              „{snippet}“
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 mt-2">
                              Keine letzte Nachricht gespeichert.
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {date ? (
                            <div className="text-xs text-gray-500">{formatDateTimeDE(date)}</div>
                          ) : (
                            <div className="text-xs text-gray-400">—</div>
                          )}
                          <div className="text-xs text-gray-500 inline-flex items-center gap-1">
                            Öffnen <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
