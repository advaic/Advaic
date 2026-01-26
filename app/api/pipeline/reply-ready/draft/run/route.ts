import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

/**
 * =========================
 * Helpers / Infra
 * =========================
 */

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function clamp01(x: any) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function asText(v: any, max = 4000) {
  const s = typeof v === "string" ? v : JSON.stringify(v ?? "");
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function normalizeTemplates(rows: any[]) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  return rows
    .slice(0, 12)
    .map((t) => {
      const title = t.title ? String(t.title) : "Template";
      const content = t.content ? String(t.content) : "";
      return `- ${title}:\n${content}`.trim();
    })
    .join("\n\n");
}

function formatThreadContext(ctx: any[]) {
  if (!Array.isArray(ctx) || ctx.length === 0) return "";
  return ctx
    .map((m) => {
      const sender = String(m.sender || "");
      const text = String(m.text || "");
      const ts = m.timestamp ? String(m.timestamp) : "";
      return `- [${ts}] ${sender}: ${text}`.trim();
    })
    .join("\n");
}

function formatProperty(p: any) {
  if (!p) return "";
  const o: Record<string, any> = {
    id: p.id,
    title: p.title,
    city: p.city,
    neighborhood: p.neighborhood,
    street_address: p.street_address,
    type: p.type,
    price: p.price,
    price_type: p.price_type,
    rooms: p.rooms,
    size_sqm: p.size_sqm,
    floor: p.floor,
    furnished: p.furnished,
    pets_allowed: p.pets_allowed,
    available_from: p.available_from,
    listing_summary: p.listing_summary,
    url: p.url,
    image_urls: p.image_urls, // safe even if undefined
  };
  return JSON.stringify(o, null, 2);
}

function mapRouteToTemplateCategory(route: string) {
  switch (route) {
    case "PROPERTY_SPECIFIC":
      return "property_specific_answer";
    case "PROPERTY_SEARCH":
      return "property_search_suggestions";
    case "QNA":
    case "QNA_GENERAL":
    case "APPLICATION_PROCESS":
    case "VIEWING_REQUEST":
      return "general_qna";
    case "STATUS_FOLLOWUP":
    case "FOLLOWUP_STATUS":
      return "status_followup";
    default:
      return "general_qna";
  }
}

/**
 * Writer Call mit Timeout + Retry
 */
async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...init, signal: ctrl.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}

async function callAzureWriter(args: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  timeoutMs?: number;
  retries?: number;
}) {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER;

  if (!deployment) {
    return { ok: false as const, text: "", reason: "writer_not_configured" };
  }

  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const timeoutMs = Number.isFinite(Number(args.timeoutMs))
    ? Number(args.timeoutMs)
    : 25_000;
  const retries = Number.isFinite(Number(args.retries))
    ? Number(args.retries)
    : 2;

  const body = JSON.stringify({
    temperature: args.temperature,
    max_tokens: args.maxTokens,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
  });

  let lastErr = "unknown";
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetchJsonWithTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": apiKey },
          body,
        },
        timeoutMs
      );

      if (!resp.ok) {
        lastErr = `http_${resp.status}`;
        // Retry on 429 / 5xx
        if (resp.status === 429 || (resp.status >= 500 && resp.status <= 599)) {
          continue;
        }
        return { ok: false as const, text: "", reason: lastErr };
      }

      const data = (await resp.json().catch(() => null)) as any;
      const out = data?.choices?.[0]?.message?.content;
      const text = typeof out === "string" ? out.trim() : "";
      if (!text) return { ok: false as const, text: "", reason: "no_output" };

      return { ok: true as const, text, reason: "ok" };
    } catch (e: any) {
      lastErr = e?.name === "AbortError" ? "timeout" : "fetch_failed";
      continue;
    }
  }

  return { ok: false as const, text: "", reason: lastErr };
}

/**
 * Best-effort Updates, damit wir niemals die ganze Batch killen,
 * nur weil ein optionales Feld nicht existiert.
 */
async function safeUpdate(
  supabase: any,
  table: string,
  values: Record<string, any>,
  match: Record<string, any>
) {
  try {
    let q = supabase.from(table).update(values);
    for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
    await q;
  } catch {
    // swallow
  }
}

/**
 * =========================
 * Handler
 * =========================
 */
export async function POST() {
  const supabase = supabaseAdmin();

  const PROMPT_KEY = "reply_writer_v1";

  /**
   * 0) Load active writer prompt from DB (schema-flexible)
   */
  const { data: promptRow, error: promptErr } = await (
    supabase.from("ai_prompts") as any
  )
    .select("*")
    .eq("is_active", true)
    .or(`name.eq.${PROMPT_KEY},key.eq.${PROMPT_KEY}`)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (promptErr || !promptRow) {
    return NextResponse.json(
      { error: `Active ${PROMPT_KEY} prompt not found in ai_prompts` },
      { status: 500 }
    );
  }

  let systemPromptFromDb =
    typeof promptRow.system_prompt === "string" ? promptRow.system_prompt : "";
  let userPromptTemplateFromDb =
    typeof promptRow.user_prompt === "string" ? promptRow.user_prompt : "";

  let temperature = Number(promptRow.temperature ?? 0.2);
  let maxTokens = Number(promptRow.max_tokens ?? 420);

  if ((!systemPromptFromDb || !userPromptTemplateFromDb) && promptRow.prompt) {
    try {
      const parsed =
        typeof promptRow.prompt === "string"
          ? JSON.parse(promptRow.prompt)
          : promptRow.prompt;

      if (parsed && typeof parsed === "object") {
        if (!systemPromptFromDb && typeof parsed.system_prompt === "string") {
          systemPromptFromDb = parsed.system_prompt;
        }
        if (
          !userPromptTemplateFromDb &&
          typeof parsed.user_prompt === "string"
        ) {
          userPromptTemplateFromDb = parsed.user_prompt;
        }
        if (Number.isFinite(Number(parsed.temperature)))
          temperature = Number(parsed.temperature);
        if (Number.isFinite(Number(parsed.max_tokens)))
          maxTokens = Number(parsed.max_tokens);
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!systemPromptFromDb || !userPromptTemplateFromDb) {
    return NextResponse.json(
      {
        error: `Active ${PROMPT_KEY} prompt is missing system_prompt/user_prompt`,
        hint: "Either add system_prompt + user_prompt columns, or store JSON in ai_prompts.prompt with {system_prompt,user_prompt,temperature,max_tokens}.",
      },
      { status: 500 }
    );
  }

  if (!Number.isFinite(temperature)) temperature = 0.2;
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) maxTokens = 420;

  /**
   * 1) Pull a batch of message_routes (we will stage-gate by loading the inbound message)
   */
  const { data: routes, error: routesErr } = await (
    supabase.from("message_routes") as any
  )
    .select(
      "id, agent_id, lead_id, message_id, route, confidence, reason, payload, prompt_version, created_at"
    )
    .eq("prompt_version", "v1")
    .order("created_at", { ascending: true })
    .limit(25);

  if (routesErr) {
    return NextResponse.json(
      { error: "Failed to load message_routes", details: routesErr.message },
      { status: 500 }
    );
  }

  const processed: any[] = [];
  const nowIso = new Date().toISOString();

  for (const r of routes || []) {
    const routeRowId = String(r.id);
    const agentId = String(r.agent_id);
    const leadId = String(r.lead_id);
    const inboundMessageId = String(r.message_id);
    const route = String(r.route || "OTHER");
    const baseConfidence = clamp01(r.confidence);
    const baseReason = typeof r.reason === "string" ? r.reason : "";

    const routePayload =
      r.payload && typeof r.payload === "object" ? r.payload : {};


    /**
     * 1.0) Quick pre-check: if message_drafts already exists for inbound, skip fast.
     * This prevents loops even if your insert unique isn't perfect.
     */
    const { data: existingDraft } = await (
      supabase.from("message_drafts") as any
    )
      .select("id, inbound_message_id, draft_message_id")
      .eq("inbound_message_id", inboundMessageId)
      .maybeSingle();

    if (existingDraft?.id) {
      processed.push({
        inboundMessageId,
        route,
        draftStatus: "already_locked",
        draftMessageId: existingDraft.draft_message_id ?? null,
      });
      continue;
    }

    /**
     * 1.1) Acquire idempotency lock via message_drafts insert
     */
    const { data: lockRow, error: lockErr } = await (
      supabase.from("message_drafts") as any
    )
      .insert(
        {
          agent_id: agentId,
          lead_id: leadId,
          inbound_message_id: inboundMessageId,
          draft_message_id: null,
          prompt_key: PROMPT_KEY,
          prompt_version: "v1",
        },
        { defaultToNull: true }
      )
      .select("id")
      .maybeSingle();

    if (lockErr) {
      const code = (lockErr as any).code;
      if (String(code) === "23505") {
        processed.push({
          inboundMessageId,
          route,
          draftStatus: "already_locked",
        });
        continue;
      }

      processed.push({
        inboundMessageId,
        route,
        draftStatus: "lock_failed",
        error: lockErr.message,
      });
      continue;
    }

    if (!lockRow?.id) {
      processed.push({
        inboundMessageId,
        route,
        draftStatus: "lock_missing_row",
      });
      continue;
    }

    /**
     * 2) Load inbound message (authoritative)
     */
    const { data: inbound, error: inboundErr } = await (
      supabase.from("messages") as any
    )
      .select("id, agent_id, lead_id, sender, status, text, snippet, timestamp")
      .eq("id", inboundMessageId)
      .maybeSingle();

    if (inboundErr || !inbound) {
      processed.push({
        inboundMessageId,
        route,
        draftStatus: "missing_inbound",
      });
      continue;
    }

    if (
      String(inbound.sender) !== "user" ||
      String(inbound.status || "") !== "route_resolved"
    ) {
      processed.push({
        inboundMessageId,
        route,
        draftStatus: "inbound_not_ready",
      });
      continue;
    }

    /**
     * 3) Load lead (ensure agent ownership)
     */
    const { data: lead } = await (supabase.from("leads") as any)
      .select("id, agent_id, name, email, gmail_thread_id, meta")
      .eq("id", leadId)
      .maybeSingle();

    if (!lead || String(lead.agent_id) !== agentId) {
      // Fail closed: needs human
      await (supabase.from("messages") as any)
        .update({ status: "needs_human", visible_to_agent: true })
        .eq("id", inboundMessageId);

      processed.push({ inboundMessageId, route, draftStatus: "lead_mismatch" });
      continue;
    }

    /**
     * 4) Load context
     */
    const { data: ctx } = await (supabase.from("messages") as any)
      .select("sender, text, timestamp")
      .eq("lead_id", leadId)
      .order("timestamp", { ascending: false })
      .limit(10);

    /**
     * 5) Agent brand + style
     */
    const { data: agent } = await (supabase.from("agents") as any)
      .select("id, name, company, email")
      .eq("id", agentId)
      .maybeSingle();

    const { data: style } = await (supabase.from("agent_style") as any)
      .select(
        "brand_name, language, tone, formality, length_pref, emoji_level, sign_off, do_rules, dont_rules, example_phrases"
      )
      .eq("agent_id", agentId)
      .maybeSingle();

    const brandName =
      (style?.brand_name ? String(style.brand_name) : null) ||
      (agent?.company ? String(agent.company) : null) ||
      (agent?.name ? String(agent.name) : "Agent");

    const agentBrandBlock = `Brand: ${brandName}\nAgentName: ${
      agent?.name ? String(agent.name) : ""
    }\nCompany: ${agent?.company ? String(agent.company) : ""}`.trim();

    const agentStyleBlock = [
      style?.tone ? `Tone: ${style.tone}` : null,
      style?.formality ? `Formality: ${style.formality}` : null,
      style?.length_pref ? `Length: ${style.length_pref}` : null,
      style?.emoji_level ? `Emoji: ${style.emoji_level}` : null,
      style?.do_rules ? `DO:\n${style.do_rules}` : null,
      style?.dont_rules ? `DON'T:\n${style.dont_rules}` : null,
      style?.example_phrases
        ? `Example phrases:\n${style.example_phrases}`
        : null,
      style?.sign_off ? `Sign-off:\n${style.sign_off}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    /**
     * 6) Templates
     */
    const category = mapRouteToTemplateCategory(route);
    const { data: templates } = await (
      supabase.from("response_templates") as any
    )
      .select("id, title, content, category")
      .eq("agent_id", agentId)
      .eq("category", category)
      .order("updated_at", { ascending: false })
      .limit(8);

    const templatesBlock = normalizeTemplates(templates || []);

    /**
     * 7) Lead property state + properties
     */
    const { data: leadPropState } = await (
      supabase.from("lead_property_state") as any
    )
      .select("active_property_id")
      .eq("lead_id", leadId)
      .maybeSingle();

    const activePropertyId = routePayload?.active_property_id
      ? String(routePayload.active_property_id)
      : leadPropState?.active_property_id
      ? String(leadPropState.active_property_id)
      : null;

    const suggestedPropertyIds: string[] = Array.isArray(
      routePayload?.suggested_property_ids
    )
      ? routePayload.suggested_property_ids
          .map((x: any) => String(x))
          .slice(0, 5)
      : [];

    let activePropertyBlock = "";
    if (activePropertyId) {
      const { data: p } = await (supabase.from("properties") as any)
        .select(
          "id, title, city, neighborhood, street_address, type, price, price_type, rooms, size_sqm, floor, furnished, pets_allowed, available_from, listing_summary, url, image_urls"
        )
        .eq("agent_id", agentId)
        .eq("id", activePropertyId)
        .maybeSingle();
      if (p) activePropertyBlock = formatProperty(p);
    }

    let suggestedPropertiesBlock = "";
    if (suggestedPropertyIds.length > 0) {
      const { data: ps } = await (supabase.from("properties") as any)
        .select(
          "id, title, city, neighborhood, street_address, type, price, price_type, rooms, size_sqm, floor, furnished, pets_allowed, available_from, listing_summary, url, image_urls"
        )
        .eq("agent_id", agentId)
        .in("id", suggestedPropertyIds)
        .limit(5);

      if (Array.isArray(ps) && ps.length > 0) {
        suggestedPropertiesBlock = ps.map(formatProperty).join("\n\n---\n\n");
      }
    }

    /**
     * 8) Settings (autosend) – nur als Info in result, behavior bleibt approval_required=true
     */
    const { data: settings } = await (supabase.from("agent_settings") as any)
      .select("agent_id, autosend_enabled")
      .eq("agent_id", agentId)
      .maybeSingle();

    const autosendEnabled = !!settings?.autosend_enabled;

    /**
     * 9) Assemble prompt
     */
    const inboundText = String(inbound.text || inbound.snippet || "").slice(
      0,
      2000
    );
    const threadContext = formatThreadContext(ctx || []);
    const clientName = lead?.name ? String(lead.name) : "";
    const clientEmail = lead?.email ? String(lead.email) : "";
    const languageHint = style?.language ? String(style.language) : "auto";

    const userPrompt = String(userPromptTemplateFromDb)
      .replaceAll("{{ROUTE}}", route)
      .replaceAll("{{AGENT_BRAND}}", agentBrandBlock)
      .replaceAll("{{AGENT_STYLE}}", agentStyleBlock || "")
      .replaceAll("{{RESPONSE_TEMPLATES}}", templatesBlock || "")
      .replaceAll("{{CLIENT_NAME}}", clientName || "")
      .replaceAll("{{CLIENT_EMAIL}}", clientEmail || "")
      .replaceAll("{{INBOUND_MESSAGE}}", inboundText || "")
      .replaceAll("{{THREAD_CONTEXT}}", threadContext || "")
      .replaceAll("{{ACTIVE_PROPERTY}}", activePropertyBlock || "")
      .replaceAll("{{SUGGESTED_PROPERTIES}}", suggestedPropertiesBlock || "")
      .replaceAll(
        "{{FAQ_CONTEXT}}",
        typeof routePayload?.faq_context === "string"
          ? routePayload.faq_context
          : ""
      )
      .replaceAll("{{LANGUAGE_HINT}}", languageHint);

    /**
     * 10) Call writer
     */
    const writer = await callAzureWriter({
      system: String(systemPromptFromDb),
      user: userPrompt,
      temperature,
      maxTokens,
      timeoutMs: 25_000,
      retries: 2,
    });

    const rawDraft = writer.ok ? writer.text.trim() : "{escalate}";
    const cleanedDraft = rawDraft.replace(/^"|"$/g, "").trim();
    const isEscalate = cleanedDraft === "{escalate}";

    /**
     * 11) Persist results
     */
    if (isEscalate) {
      // Mark inbound for manual attention
      await (supabase.from("messages") as any)
        .update({ status: "needs_human", visible_to_agent: true })
        .eq("id", inboundMessageId);

      // Keep lock row and prevent reprocessing
      await (supabase.from("message_drafts") as any)
        .update({ draft_message_id: null })
        .eq("inbound_message_id", inboundMessageId);

      processed.push({
        inboundMessageId,
        route,
        autosendEnabled,
        draftStatus: "escalate",
        writerReason: writer.reason,
      });

      continue;
    }

    // Create outbound draft message
    const { data: outMsg, error: outErr } = await (
      supabase.from("messages") as any
    )
      .insert({
        lead_id: leadId,
        agent_id: agentId,
        sender: "assistant",
        text: cleanedDraft,
        timestamp: nowIso,
        visible_to_agent: true,
        // Always run QA first; approval/auto-send happens after QA passes.
        approval_required: true,
        status: "qa_pending",
        send_status: "pending",
      })
      .select("id")
      .single();

    if (outErr || !outMsg?.id) {
      // Fail-closed
      await (supabase.from("messages") as any)
        .update({ status: "needs_human", visible_to_agent: true })
        .eq("id", inboundMessageId);

      processed.push({
        inboundMessageId,
        route,
        autosendEnabled,
        draftStatus: "failed_insert_outbound",
        error: outErr?.message ?? "no_outbound_id",
      });

      continue;
    }

    const draftMessageId = String(outMsg.id);

    // Link inbound -> draft
    await (supabase.from("message_drafts") as any)
      .update({ draft_message_id: draftMessageId })
      .eq("inbound_message_id", inboundMessageId);

    // Advance inbound message status
    await (supabase.from("messages") as any)
      .update({ status: "draft_created", visible_to_agent: true })
      .eq("id", inboundMessageId);

    // Update lead last_message fields (optional)
    await (supabase.from("leads") as any)
      .update({
        last_message_at: nowIso,
        last_message: cleanedDraft.slice(0, 240),
      })
      .eq("id", leadId);

    processed.push({
      inboundMessageId,
      route,
      autosendEnabled,
      draftMessageId,
      draftStatus: "qa_pending",
      confidence: baseConfidence,
      reason: baseReason,
    });

  }

  return NextResponse.json({
    ok: true,
    processed: processed.length,
    results: processed,
  });
}
