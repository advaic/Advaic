"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { createHmac } from "crypto";

// --- Required env ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Optional but recommended: allows server actions to read `ai_prompts` even if RLS blocks anon/auth selects.
// Never expose this to the client.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

// --- Admin client (service role) for reading shared config tables like `ai_prompts` ---
function getAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) return null;
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      // No auth context needed; this is for server-side config reads only.
      getAll: () => [],
      setAll: async () => {},
    },
  });
}

// --- HMAC helper for Make verification ---
function signBody(body: string, ts: string, secret: string) {
  return createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
}

/**
 * Vorschlagstext generieren.
 * Reihenfolge:
 * 1) Azure Copilot + ai_prompts (wenn konfiguriert)
 * 2) Make (optional, wenn konfiguriert)
 * 3) Rule-based Fallback
 */
export async function suggestFollowUpText(
  leadId: string,
  opts?: {
    // UI: Freundlich | Neutral | Klar
    // Intern: friendly | neutral | firm  ("Klar" maps to "firm" = klar/kurz/sachlich)
    tone?: "friendly" | "neutral" | "firm" | "clear";
    instruction?: string;
    regenerate?: boolean;
  }
): Promise<string> {
  const supabase = await getClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Nicht eingeloggt");

  const toneRaw = (opts?.tone ?? "friendly") as any;
  const tone: "friendly" | "neutral" | "firm" =
    toneRaw === "clear" ? "firm" : (toneRaw === "friendly" || toneRaw === "neutral" || toneRaw === "firm" ? toneRaw : "friendly");
  const instruction = (opts?.instruction ?? "").trim();

  // --- 1) Azure Copilot via ai_prompts (preferred) ---
  try {
    const promptKey = "followup_suggest_v1";
    const prompt = await getActivePrompt(supabase, promptKey);
    if (!prompt) {
      console.info("[followups] No active ai_prompt for key followup_suggest_v1 -> skipping Copilot");
    } else {
      const leadContext = await buildLeadContext(supabase, leadId, user.id);

      // Replace placeholders inside user prompt
      const userPrompt = prompt.user_prompt
        .replaceAll("{{lead_context}}", leadContext)
        .replaceAll("{{tone}}", tone)
        .replaceAll("{{instruction}}", instruction || "(none)");

      const completion = await azureCopilotChatCompletion({
        system: prompt.system_prompt,
        user: userPrompt,
        temperature: Number(prompt.temperature ?? 0.4),
        maxTokens: Number(prompt.max_tokens ?? 400),
        responseFormat: String(prompt.response_format ?? "json"),
      });

      const parsed = extractTextFromModelOutput(completion);
      if (parsed) {
        console.info("[followups] Copilot suggestion OK", {
          engine: "copilot",
          key: prompt.key,
          version: prompt.version,
          tone,
          hasInstruction: Boolean(instruction),
          chars: parsed.length,
        });
        return parsed;
      }

      throw new Error("Copilot: empty model output");
    }
  } catch (e) {
    console.warn(
      "Copilot suggestion failed, falling back:",
      (e as Error)?.message
    );
  }

  // --- 2) Try Make (optional) ---
  if (MAKE_SUGGEST_WEBHOOK && MAKE_WEBHOOK_SECRET) {
    try {
      const payload = {
        lead_id: leadId,
        agent_id: user.id,
        tone,
        instruction: instruction || null,
        regenerate: Boolean(opts?.regenerate),
      };
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
        text?: string;
      };

      const s = (json?.suggestion ?? json?.text ?? "").trim();
      if (s) {
        console.info("[followups] Make suggestion OK", {
          engine: "make",
          tone,
          hasInstruction: Boolean(instruction),
          chars: s.length,
        });
        return s;
      }

      throw new Error("No suggestion in webhook response");
    } catch (e) {
      console.warn("Falling back to local suggestion:", (e as Error)?.message);
    }
  }

  // --- 3) Local fallback (rule-based) ---
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
      ? `Bezugnehmend auf Ihre letzte Nachricht: „${lastMsg.text.slice(0, 120)}“`
      : "zu unserem letzten Austausch";

  const tonePrefix =
    tone === "firm"
      ? "nur kurz als Erinnerung"
      : tone === "neutral"
        ? "nur ein kurzes Follow-up"
        : "nur kurz nachgehakt";

  const extra = instruction ? ` (${instruction})` : "";

  const fallback = `${namePart}, ${tonePrefix} ${tail}${extra}. Gibt es hierzu schon ein Update oder offene Fragen? Ich freue mich auf Ihre Rückmeldung.`;
  console.info("[followups] Local fallback suggestion used", {
    engine: "fallback",
    tone,
    hasInstruction: Boolean(instruction),
    chars: fallback.length,
  });
  return fallback;
}

type ActivePrompt = {
  key: string;
  version: number;
  system_prompt: string;
  user_prompt: string;
  temperature: number;
  max_tokens: number;
  response_format: string;
};

async function getActivePrompt(
  supabase: ReturnType<typeof createServerClient<Database>>,
  key: string
): Promise<ActivePrompt | null> {
  const keyNorm = String(key ?? "").trim();

  // Prefer service-role for config reads to avoid RLS returning empty rows.
  const admin = getAdminClient();
  const sb: any = admin ?? (supabase as any);
  if (!admin) {
    console.info("[followups] getActivePrompt: no SUPABASE_SERVICE_ROLE_KEY set; using auth/anon client (RLS may hide rows)");
  }

  // Helpful debug: show which Supabase project/env we're talking to
  try {
    const host = (() => {
      try {
        return new URL(SUPABASE_URL).host;
      } catch {
        return SUPABASE_URL;
      }
    })();
    console.info("[followups] getActivePrompt", { key: keyNorm, supabaseHost: host });
  } catch {
    // ignore
  }

  const { data, error } = await (sb.from("ai_prompts") as any)
    .select(
      "key, version, is_active, system_prompt, user_prompt, temperature, max_tokens, response_format"
    )
    .eq("key", keyNorm)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.warn("[followups] Failed to load ai_prompts (active):", {
      message: error.message,
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
    });
    return null;
  }

  if (!data) {
    // Deep debug: see what the DB returns for this key (active and inactive)
    try {
      const { data: anyRows, error: anyErr } = await (sb.from("ai_prompts") as any)
        .select("id, key, version, is_active, updated_at")
        .eq("key", keyNorm)
        .order("version", { ascending: false })
        .limit(10);

      if (anyErr) {
        console.warn("[followups] Debug query for ai_prompts failed:", {
          message: anyErr.message,
          code: (anyErr as any)?.code,
        });
      } else {
        console.warn("[followups] No active ai_prompt found for key", {
          key: keyNorm,
          foundRows: (anyRows || []).map((r: any) => ({
            id: r.id,
            key: r.key,
            version: r.version,
            is_active: r.is_active,
            updated_at: r.updated_at,
          })),
        });
      }

      // Also list similar keys in case of mismatch/typo
      const { data: likeRows } = await (sb.from("ai_prompts") as any)
        .select("key, version, is_active")
        .ilike("key", "%followup%")
        .order("key", { ascending: true })
        .limit(50);

      console.warn("[followups] Similar keys (ilike %followup%)", {
        sample: (likeRows || []).slice(0, 25),
        count: (likeRows || []).length,
      });
    } catch (e: any) {
      console.warn("[followups] Debug block crashed:", e?.message ?? String(e));
    }

    return null;
  }

  return {
    key: String(data.key),
    version: Number(data.version ?? 1),
    system_prompt: String(data.system_prompt ?? ""),
    user_prompt: String(data.user_prompt ?? ""),
    temperature: Number(data.temperature ?? 0.4),
    max_tokens: Number(data.max_tokens ?? 400),
    response_format: String(data.response_format ?? "json"),
  };
}

async function buildLeadContext(
  supabase: ReturnType<typeof createServerClient<Database>>,
  leadId: string,
  agentId: string
): Promise<string> {
  // Lead meta
  const { data: lead, error: leadErr } = await (supabase.from("leads") as any)
    .select(
      "id, name, email, subject, type, priority, sentiment, last_message, updated_at, key_info"
    )
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .maybeSingle();

  if (leadErr) {
    console.warn("Failed to load lead for context:", leadErr.message);
  }

  // Recent messages (last 12)
  const { data: msgs, error: msgErr } = await (supabase.from("messages") as any)
    .select("sender, text, timestamp")
    .eq("lead_id", leadId)
    .order("timestamp", { ascending: false })
    .limit(12);

  if (msgErr) {
    console.warn("Failed to load messages for context:", msgErr.message);
  }

  const meta = {
    lead_id: leadId,
    name: (lead?.name ?? "").trim() || null,
    email: (lead?.email ?? "").trim() || null,
    subject: (lead?.subject ?? "").trim() || null,
    type: (lead?.type ?? "").trim() || null,
    priority: lead?.priority ?? null,
    sentiment: (lead?.sentiment ?? "").trim() || null,
    last_message: (lead?.last_message ?? "").trim() || null,
    updated_at: lead?.updated_at ?? null,
    key_info: lead?.key_info ?? null,
  };

  const ordered = Array.isArray(msgs) ? [...msgs].reverse() : [];
  const transcript = ordered
    .map((m: any) => {
      const sender = String(m?.sender ?? "").toLowerCase();
      const role = sender === "agent" ? "AGENT" : sender === "lead" ? "LEAD" : sender.toUpperCase() || "MSG";
      const text = String(m?.text ?? "").replace(/\s+/g, " ").trim();
      const ts = m?.timestamp ? String(m.timestamp) : "";
      return `${role}${ts ? ` (${ts})` : ""}: ${text}`;
    })
    .join("\n");

  return `LEAD_META:\n${JSON.stringify(meta, null, 2)}\n\nRECENT_MESSAGES:\n${transcript || "(no messages)"}`;
}

function extractTextFromModelOutput(raw: string): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  // Prefer JSON {"text": "..."}
  try {
    const j = JSON.parse(s);
    const t = String((j as any)?.text ?? "").trim();
    if (t) return t;
  } catch {
    // ignore
  }

  // If model returned plain text
  return s;
}

async function azureCopilotChatCompletion(args: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  responseFormat: string;
}): Promise<string> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_COPILOT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-06-01";

  if (!endpoint || !apiKey || !deployment) {
    throw new Error("Azure OpenAI not configured (missing endpoint/apiKey/deployment)");
  }

  const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(
    apiVersion
  )}`;

  // We keep response_format flexible. If table says "json", we ask model to output JSON.
  const wantsJson = String(args.responseFormat || "json").toLowerCase() === "json";

  const system = wantsJson
    ? `${args.system}\n\nWICHTIG: Gib ausschließlich gültiges JSON zurück: {"text": "..."}. Keine weiteren Keys. Kein Markdown. Keine Erklärungen.`
    : args.system;

  const body = {
    messages: [
      { role: "system", content: system },
      { role: "user", content: args.user },
    ],
    temperature: args.temperature,
    max_tokens: args.maxTokens,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("Azure OpenAI error:", res.status, t);
    throw new Error("Azure OpenAI request failed");
  }

  const json = (await res.json().catch(() => null)) as any;
  const content = String(json?.choices?.[0]?.message?.content ?? "").trim();
  return content;
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

  // 3) Lead-Follow-up-Status aktualisieren (neues Datenmodell)
  //    - last_agent_message_at: für Due-Berechnung
  //    - followup_last_sent_at: Historie
  //    - followup_stage: 0->1->2 (max 2)
  //    - followup_status: 'sent'
  //    - followup_next_at: wenn Auto an und noch eine Stage offen ist

  const { data: leadState, error: stateErr } = await supabase
    .from("leads")
    .select("followup_stage, followups_enabled")
    .eq("id", leadId)
    .eq("agent_id", user.id)
    .single();

  if (stateErr) {
    console.warn("Could not read lead followup state:", stateErr.message);
  }

  const currentStage = Math.max(0, Number((leadState as any)?.followup_stage ?? 0));
  const nextStage = Math.min(currentStage + 1, 2);
  const autoEnabled = Boolean((leadState as any)?.followups_enabled ?? true);

  // If stage 1 just sent and auto is enabled, plan stage 2 for +72h; otherwise clear.
  const nextAt = autoEnabled && nextStage === 1
    ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
    : null;

  const { error: updErr } = await supabase
    .from("leads")
    .update({
      last_agent_message_at: timestamp,
      followup_last_sent_at: timestamp,
      followup_stage: nextStage,
      followup_status: "sent",
      followup_stop_reason: null,
      followup_next_at: nextAt,
    })
    .eq("id", leadId)
    .eq("agent_id", user.id);

  if (updErr) {
    console.warn("Could not update lead followup fields:", updErr.message);
  }

  return { ok: true };
}

/**
 * Snooze (24h oder N Stunden): pausiert Follow-ups bis zu einem Zeitpunkt in der Zukunft (followup_paused_until).
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

  // Keep planned time visible in the UI when auto-followups are enabled.
  const { data: leadState, error: stateErr } = await supabase
    .from("leads")
    .select("followups_enabled")
    .eq("id", leadId)
    .eq("agent_id", user.id)
    .single();

  if (stateErr) {
    console.warn("Could not read lead followups_enabled:", stateErr.message);
  }

  const autoEnabled = Boolean((leadState as any)?.followups_enabled ?? true);

  const { error } = await supabase
    .from("leads")
    .update({
      followup_paused_until: next,
      followup_status: "paused",
      followup_next_at: autoEnabled ? next : null,
    })
    .eq("id", leadId)
    .eq("agent_id", user.id);

  if (error) throw new Error(error.message);
  return { ok: true };
}
