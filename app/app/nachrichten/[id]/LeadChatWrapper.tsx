"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import LeadChatView from "../components/LeadChatView";

export default function LeadChatWrapper() {
  const { id: leadId } = useParams<{ id: string }>();
  const supabase = useSupabaseClient<Database>();
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (!leadId) return;

    const fetchDocs = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("lead_id", leadId);

      if (error) console.error("Error loading documents:", error);
      else setDocuments(data ?? []);
    };

    fetchDocs();
  }, [leadId, supabase]);

  return <LeadChatView leadId={leadId} documents={documents} />;
}
