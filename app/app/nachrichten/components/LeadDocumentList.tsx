"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

type Document = {
  id: string;
  lead_id: string;
  file_url: string;
  document_type: string;
  gpt_score: "pass" | "warning" | "fail";
  gpt_summary: string | null;
  created_at: string;
};

interface Props {
  leadId: string;
}

export default function LeadDocumentsList({ leadId }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, lead_id, document_type, file_url, gpt_score, gpt_summary, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error);
      } else {
        setDocuments(
  (data || []).map((doc) => ({
    id: doc.id,
    lead_id: doc.lead_id,
    document_type: doc.document_type,
    gpt_score: doc.gpt_score ?? undefined,
    gpt_summary: doc.gpt_summary ?? null,
    file_url: doc.file_url,
    created_at: doc.created_at,
  }))
);
      }
      setLoading(false);
    };

    fetchDocuments();
  }, [leadId]);

  const renderScoreBadge = (gpt_score: string) => {
    const colorMap: Record<string, string> = {
      pass: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      fail: "bg-red-100 text-red-800",
    };

    const labelMap: Record<string, string> = {
      pass: "🟢 Pass",
      warning: "🟡 Warnung",
      fail: "🔴 Fail",
    };

    const color = colorMap[gpt_score] || "bg-gray-100 text-gray-800";
    const label = labelMap[gpt_score] || gpt_score;

    return <Badge className={color}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Lade Dokumente …
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine Dokumente hochgeladen.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {doc.document_type || "Dokument"}
              </div>
              {renderScoreBadge(doc.gpt_score)}
            </div>
            <div className="text-sm text-muted-foreground">
              Hochgeladen am:{" "}
              {format(new Date(doc.created_at), "dd.MM.yyyy HH:mm")}
            </div>
            {doc.gpt_summary && (
              <div className="text-sm text-muted-foreground">
                <strong>Zusammenfassung:</strong> {doc.gpt_summary}
              </div>
            )}
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline text-blue-600 hover:text-blue-800"
            >
              Dokument ansehen
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
