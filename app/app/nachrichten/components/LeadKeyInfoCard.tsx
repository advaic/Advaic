"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
  if (raw.includes("pass") || raw.includes("ok") || raw.includes("approved")) return "pass";
  if (raw.includes("warn") || raw.includes("warning") || raw.includes("review")) return "warn";
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
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${map[kind].cls}`}>
      <span className="h-2.5 w-2.5 rounded-full bg-current opacity-60" />
      {map[kind].label}
    </span>
  );
}

export default function LeadKeyInfoCard({ leadId }: Props) {
  const supabase = useSupabaseClient<Database>();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leadId) return;

    const fetchDocs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents" as any)
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

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

  const countLabel = useMemo(() => {
    const n = docs.length;
    return n === 1 ? "1 Dokument" : `${n} Dokumente`;
  }, [docs.length]);

  if (loading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Unterlagen</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!docs?.length) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Unterlagen</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Noch keine Unterlagen hochgeladen.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Unterlagen</CardTitle>
          <span className="text-xs text-muted-foreground">{countLabel}</span>
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
                  rel="noreferrer"
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
  );
}
