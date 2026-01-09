import { supabase } from "./supabaseClient";

export async function fetchLeadsForAgent(agentId: string) {
  if (!agentId) {
    console.error("Kein agentId übergeben.");
    return [];
  }

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("agent_id", agentId)
    .order("last_message", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Leads:", error.message);
    return [];
  }

  return data;
}
