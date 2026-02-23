import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

type Body = {
  lead_id?: string;
  force?: boolean; // optional: force refresh even if exists
};

type CopilotSnapshot = {
  headline: string; // 1-liner status
  summary: string; // what happened
  next_steps: Array<{ title: string; detail: string }>;
  risks: Array<{
    level: "low" | "medium" | "high";
    title: string;
    detail: string;
  }>;
  property_context: {
    active_property_id: string | null;
    active_property_summary: string | null;
    recommended_property_ids: string[];
  };
  followup_context: {
    enabled: boolean;
    status: string | null;
    stage: number | null;
    next_at: string | null;
  };
  why_needs_approval_hint: string | null; // short explanation when something goes to approval
};

type AiPromptRow = {
  key: string;
  version: number;
  is_active: boolean;
  system_prompt: string;
  user_prompt: string;
  temperature: number | null;
  max_tokens: number | null;
  response_format: string | null;
};

async function loadActivePrompt(supabase: any, key: string) {
  const { data, error } = await supabase
    .from("ai_prompts")
    .select("key, version, is_active, system_prompt, user_prompt, temperature, max_tokens, response_format")
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    // Fail-open: we will fall back to the hardcoded prompt below
    return { ok: false as const, error, data: null as any };
  }

  if (!data) return { ok: true as const, data: null as AiPromptRow | null };
  return { ok: true as const, data: data as AiPromptRow };
}

function applyPromptTemplate(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

async function azureChatJSON(args: {
  deployment: string;
  system: string;
  user: string;
  temperature?: number;
  max_tokens?: number;
}) {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT").replace(/\/$/, "");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

  const url = `${endpoint}/openai/deployments/${encodeURIComponent(
    args.deployment,
  )}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      temperature: args.temperature ?? 0.2,
      max_tokens: args.max_tokens ?? 650,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    }),
  });

  const json = await res.json().catch(() => ({}) as any);
  if (!res.ok) {
    return {
      ok: false as const,
      error: json?.error?.message || "azure_error",
      raw: json,
    };
  }

  const content = json?.choices?.[0]?.message?.content;
  if (!content)
    return { ok: false as const, error: "empty_model_output", raw: json };

  try {
    const parsed = JSON.parse(content);
    return { ok: true as const, data: parsed, raw: json };
  } catch {
    return {
      ok: false as const,
      error: "invalid_json_output",
      raw: { content, json },
    };
  }
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });

  // 1) Auth
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) Body
  const body = (await req.json().catch(() => ({}))) as Body;
  const leadId = String(body.lead_id || "").trim();
  const force = !!body.force;

  if (!leadId) {
    return NextResponse.json({ error: "missing_lead_id" }, { status: 400 });
  }

  // 3) Load lead (must belong to user via RLS)
  const { data: lead, error: leadErr } = await (supabase.from("leads") as any)
    .select(
      "id, agent_id, email, name, type, status, priority, followups_enabled, followup_status, followup_stage, followup_next_at",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (leadErr) {
    return NextResponse.json(
      { error: "lead_load_failed", details: leadErr.message },
      { status: 500 },
    );
  }
  if (!lead)
    return NextResponse.json({ error: "lead_not_found" }, { status: 404 });

  // hard guard
  if (String(lead.agent_id) !== String(user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 4) If not forced and snapshot exists -> return it (cheap)
  if (!force) {
    const { data: existing } = await (
      supabase.from("lead_copilot_state") as any
    )
      .select(
        "lead_id, agent_id, snapshot, updated_at, model, prompt_key, prompt_version",
      )
      .eq("lead_id", leadId)
      .maybeSingle();

    if (existing?.snapshot && Object.keys(existing.snapshot || {}).length > 0) {
      return NextResponse.json({ ok: true, cached: true, row: existing });
    }
  }

  // 5) Load recent messages (last 30, newest last)
  const { data: msgs, error: msgErr } = await (supabase.from("messages") as any)
    .select(
      "id, sender, text, timestamp, approval_required, status, was_followup, send_status",
    )
    .eq("lead_id", leadId)
    .order("timestamp", { ascending: true })
    .limit(30);

  if (msgErr) {
    return NextResponse.json(
      { error: "messages_load_failed", details: msgErr.message },
      { status: 500 },
    );
  }

  // 6) Load property state (best-effort)
  const { data: ps } = await (supabase.from("lead_property_state") as any)
    .select("active_property_id, last_recommended_property_ids")
    .eq("lead_id", leadId)
    .maybeSingle();

  const activePropertyId = ps?.active_property_id
    ? String(ps.active_property_id)
    : null;
  const recIds: string[] = Array.isArray(ps?.last_recommended_property_ids)
    ? ps.last_recommended_property_ids
        .map((x: any) => String(x))
        .filter(Boolean)
    : [];

  let activePropertySummary: string | null = null;
  if (activePropertyId) {
    const { data: p } = await (supabase.from("properties") as any)
      .select(
        "id, city, neighborhood, street_address, type, price, price_type, rooms, size_sqm, url",
      )
      .eq("id", activePropertyId)
      .maybeSingle();

    if (p) {
      const parts = [
        p.type,
        p.street_address,
        p.neighborhood,
        p.city,
        p.price ? `${p.price}€` : null,
        p.price_type ? `(${p.price_type})` : null,
        p.rooms ? `${p.rooms} Zi.` : null,
        p.size_sqm ? `${p.size_sqm} m²` : null,
      ].filter(Boolean);
      activePropertySummary = parts.join(" · ");
    }
  }

  // 7) Build context once (we inject it into the ai_prompts template)
  const contextBlock = `
Lead:
- lead_id: ${leadId}
- name: ${String(lead.name || "")}
- email: ${String(lead.email || "")}
- type: ${String(lead.type || "")}
- status: ${String(lead.status || "")}
- priority: ${String(lead.priority ?? "")}

Follow-ups:
- enabled: ${typeof lead.followups_enabled === "boolean" ? String(lead.followups_enabled) : "unknown"}
- followup_status: ${String(lead.followup_status || "")}
- followup_stage: ${String(lead.followup_stage ?? "")}
- followup_next_at: ${String(lead.followup_next_at || "")}

Property matching:
- active_property_id: ${activePropertyId || "null"}
- active_property_summary: ${activePropertySummary || "null"}
- last_recommended_property_ids: ${JSON.stringify(recIds.slice(0, 10))}

Letzte Nachrichten (chronologisch, älteste -> neueste):
${(msgs || [])
  .map((m: any) => {
    const sender = String(m.sender || "");
    const ts = String(m.timestamp || "");
    const flags = [
      m.approval_required ? "approval_required" : null,
      m.was_followup ? "was_followup" : null,
      m.status ? `status=${m.status}` : null,
      m.send_status ? `send_status=${m.send_status}` : null,
    ].filter(Boolean);
    return `- [${ts}] sender=${sender}${flags.length ? " (" + flags.join(", ") + ")" : ""}: ${String(
      m.text || "",
    ).slice(0, 1200)}`;
  })
  .join("\n")}
  `.trim();

  // 7b) Prefer ai_prompts (key=lead_copilot_v1). Fail-open to hardcoded.
  const promptKey = "lead_copilot_v1";
  const loaded = await loadActivePrompt(supabase as any, promptKey);

  const hardcodedSystem = `
Du bist der interne "Lead Copilot" für Immobilienmakler in Deutschland.
Du erzeugst eine präzise, hilfreiche Zusammenfassung und klare nächste Schritte.
WICHTIG:
- Antworte IMMER als reines JSON (kein Markdown, kein Text außenrum).
- Erfinde nichts. Wenn etwas unklar ist, sag es klar als Risiko/Unklarheit.
- Fokus: Was ist passiert? Was ist der beste nächste Schritt? Gibt es Risiken?
- Berücksichtige: Follow-ups, Zuordnung einer Immobilie, Freigabe-Queue (needs_approval).
- Schreibe kurz, aber extrem nützlich. Kein Marketing.
JSON Schema:
{
  "headline": string,
  "summary": string,
  "next_steps": [{"title": string, "detail": string}],
  "risks": [{"level": "low"|"medium"|"high", "title": string, "detail": string}],
  "property_context": {
    "active_property_id": string|null,
    "active_property_summary": string|null,
    "recommended_property_ids": string[]
  },
  "followup_context": {"enabled": boolean, "status": string|null, "stage": number|null, "next_at": string|null},
  "why_needs_approval_hint": string|null
}
  `.trim();

  const hardcodedUser = `
${contextBlock}

Aufgabe:
- Erstelle die Copilot Snapshot JSON Antwort gemäß Schema.
- Nächste Schritte müssen konkret sein (z.B. "Unterlagen anfordern", "Besichtigung vorschlagen", "Rückfrage stellen").
- Risiken: z.B. fehlende Infos, widersprüchliche Angaben, falsche Immobilie, eskalationswürdig, rechtliche/DSGVO Hinweise.
- "why_needs_approval_hint": falls es Anzeichen gibt, dass etwas in Zur Freigabe landet (z.B. niedrige Confidence, Billing, no-reply, unsicherer Intent, Policy-Trigger).
  `.trim();

  const system = loaded.ok && loaded.data?.system_prompt
    ? applyPromptTemplate(String(loaded.data.system_prompt), {
        CONTEXT: contextBlock,
        LEAD_ID: leadId,
      })
    : hardcodedSystem;

  const userPrompt = loaded.ok && loaded.data?.user_prompt
    ? (() => {
        const t = String(loaded.data.user_prompt);
        // Preferred: template contains {{CONTEXT}}. If not, we append context to keep prompts backward compatible.
        const injected = t.includes("{{CONTEXT}}") ? applyPromptTemplate(t, { CONTEXT: contextBlock, LEAD_ID: leadId }) : `${t}\n\n${contextBlock}`;
        return injected;
      })()
    : hardcodedUser;

  const temperature = loaded.ok && loaded.data?.temperature != null ? Number(loaded.data.temperature) : 0.2;
  const maxTokens = loaded.ok && loaded.data?.max_tokens != null ? Number(loaded.data.max_tokens) : 650;

  const deployment = mustEnv("AZURE_OPENAI_DEPLOYMENT_COPILOT");

  const ai = await azureChatJSON({
    deployment,
    system,
    user: userPrompt,
    temperature,
    max_tokens: maxTokens,
  });

  if (!ai.ok) {
    return NextResponse.json(
      { error: "copilot_generation_failed", details: ai.error },
      { status: 500 },
    );
  }

  const snapshot = ai.data as CopilotSnapshot;

  // 8) Upsert into lead_copilot_state
  const row = {
    lead_id: leadId,
    agent_id: user.id,
    snapshot,
    model: "gpt-4.1-mini",
    prompt_key: loaded.ok && loaded.data?.key ? String(loaded.data.key) : "lead_copilot_v1",
    prompt_version: loaded.ok && loaded.data?.version != null ? `v${String(loaded.data.version)}` : "v1",
    last_trigger: force ? "manual_refresh" : "manual_create",
    last_updated_at: new Date().toISOString(),
    // optional meta fields for later dashboards:
    risk_level: snapshot?.risks?.some((r) => r.level === "high")
      ? "high"
      : snapshot?.risks?.some((r) => r.level === "medium")
        ? "medium"
        : "low",
  };

  const { data: saved, error: upErr } = await (
    supabase.from("lead_copilot_state") as any
  )
    .upsert(row, { onConflict: "lead_id" })
    .select(
      "lead_id, agent_id, snapshot, updated_at, model, prompt_key, prompt_version, last_updated_at, risk_level",
    )
    .maybeSingle();

  if (upErr) {
    return NextResponse.json(
      { error: "copilot_upsert_failed", details: upErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, cached: false, row: saved });
}
