"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useGmailConnection(agentId?: string) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("email_connections")
        .select("email_address,status")
        .eq("agent_id", agentId)
        .eq("provider", "gmail")
        .maybeSingle();

      const ok = data?.status === "connected";
      setConnected(!!ok);
      setEmail(data?.email_address ?? null);
      setLoading(false);
    })();
  }, [agentId]);

  return { loading, connected, email };
}
