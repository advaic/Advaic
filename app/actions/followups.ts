"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { createHmac } from "crypto";

// --- Required env ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const MAKE_SEND_WEBHOOK = process.env.MAKE_SEND_WEBHOOK!;
const MAKE_SUGGEST_WEBHOOK = process.env.MAKE_SUGGEST_WEBHOOK;
const MAKE_WEBHOOK_SECRET = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_SECRET;

// --- Supabase client bound to the current request cookies ---
async function getClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: async () => {}, // nothing to set on the server action
    },
  });
}

// --- HMAC helper for Make verification ---
function signBody(body: string, ts: string, secret: string) {
  return createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
}

/**
 * Vorschlagstext generieren via Make-Szenario.
 */
export async function suggestFollowUpText(leadId: string): Promise<string> {
  const supabase = await getClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Nicht eingeloggt");

  // --- Try Make first if configured ---
  if (MAKE_SUGGEST_WEBHOOK && MAKE_WEBHOOK_SECRET) {
    try {
      const payload = { lead_id: leadId, agent_id: user.id };
      const body = JSON.stringify(payload);
      const ts = Math.floor(Date.now() / 1000).toString();
      const sig = signBody(body, ts, MAKE_WEBHOOK_SECRET);

      const res = await fetch(MAKE_SUGGEST_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Advaic-Timestamp": ts,
          "X-Advaic-Signature": `sha256=${sig}`,
        },
        body,
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("Suggestion webhook failed:", res.status, t);
        throw new Error("Suggestion webhook not OK");
      }

      const json = (await res.json().catch(() => ({}))) as {
        suggestion?: string;
      };

      if (json?.suggestion && typeof json.suggestion === "string") {
        return json.suggestion;
      }

      throw new Error("No suggestion in webhook response");
    } catch (e) {
      console.warn("Falling back to local suggestion:", (e as Error)?.message);
    }
  }

  // --- Local fallback (rule-based) ---
  const [{ data: lead }, { data: lastMsg }] = await Promise.all([
    supabase.from("leads").select("id, name").eq("id", leadId).single(),
    supabase
      .from("messages")
      .select("text, sender")
      .eq("lead_id", leadId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const namePart = lead?.name?.trim() ? `${lead.name.trim()}` : "Hallo";
  const tail =
    lastMsg?.text && lastMsg.text.trim().length > 0
      ? `Bezugnehmend auf Ihre letzte Nachricht: „${lastMsg.text.slice(
          0,
          120
        )}“`
      : "zu unserem letzten Austausch";

  return `${namePart}, nur ein kurzes Follow-up ${tail}. Gibt es hierzu schon ein Update oder offene Fragen? Ich freue mich auf Ihre Rückmeldung.`;
}

/**
 * Follow-up JETZT senden
 */
export async function sendFollowUpNow(
  leadId: string,
  text?: string
): Promise<{ ok: true }> {
  const supabase = await getClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Nicht eingeloggt");

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, name, email")
    .eq("id", leadId)
    .eq("agent_id", user.id)
    .single();
  if (leadErr || !lead)
    throw new Error(leadErr?.message ?? "Lead nicht gefunden");

  const timestamp = new Date().toISOString();
  const messageText =
    (text ?? "").trim() ||
    "nur kurz nachgehakt – gibt es hierzu schon ein Update oder Fragen? Ich freue mich auf Ihre Rückmeldung.";

  // 1) Nachricht in DB anlegen
  const { data: inserted, error: insErr } = await supabase
    .from("messages")
    .insert({
      lead_id: leadId,
      text: messageText,
      sender: "agent",
      timestamp,
      gpt_score: null,
      was_followup: true,
      visible_to_agent: true,
      approval_required: false,
    })
    .select("id")
    .single();
  if (insErr) throw new Error(insErr.message);

  // 2) An Make schicken (Versand)
  const payload = {
    event: "INSERT",
    table: "messages",
    record_text: messageText,
    record_sender: "agent",
    record_lead_id: leadId,
    record_gpt_score: null,
    record_was_followup: true,
    record_visible_to_agent: true,
    record_timestamp: timestamp,
    record_approval_required: false,
    record_id: inserted.id ?? "",
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (MAKE_WEBHOOK_SECRET) {
    headers["x-webhook-secret"] = MAKE_WEBHOOK_SECRET;
  }

  const resp = await fetch(MAKE_SEND_WEBHOOK, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    console.error("Make webhook failed:", resp.status, t);
    throw new Error("Versand an Make fehlgeschlagen");
  }

  // 3) Counter ++ (RPC) und follow_up_due_at +48h
  const { error: rpcErr } = await supabase.rpc("inc_follow_up_count", {
    p_lead_id: leadId,
  });
  if (rpcErr) {
    console.warn("inc_follow_up_count failed:", rpcErr.message);
  }

  const next = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("leads")
    .update({ follow_up_due_at: next })
    .eq("id", leadId)
    .eq("agent_id", user.id);

  return { ok: true };
}

/**
 * Snooze (24h oder N Stunden): setzt follow_up_due_at entsprechend in die Zukunft.
 */
export async function snoozeFollowUp(
  leadId: string,
  hours = 24
): Promise<{ ok: true }> {
  const supabase = await getClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Nicht eingeloggt");

  const next = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("leads")
    .update({ follow_up_due_at: next })
    .eq("id", leadId)
    .eq("agent_id", user.id);

  if (error) throw new Error(error.message);
  return { ok: true };
}
