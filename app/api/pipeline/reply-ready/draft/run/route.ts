import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

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
  // Keep it compact: title + content
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
      return `- ${sender}: ${text}`.trim();
    })
    .join("\n");
}

function formatProperty(p: any) {
  if (!p) return "";
  // Use only safe columns you have in types: keep it generic.
  const o: Record<string, any> = {
    id: p.id,
    city: p.city,
    neighbourhood: p.neighbourhood,
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
    uri: p.uri,
  };
  return JSON.stringify(o, null, 2);
}

async function callAzureWriter(args: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}) {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");

  // Writer deployment (separate from classifier deployments)
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER;
  if (!deployment) {
    return { ok: false as const, text: "", reason: "writer_not_configured" };
  }

  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      temperature: args.temperature,
      max_tokens: args.maxTokens,
      // Keep as plain text (your ai_prompts has response_format="text")
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    }),
  }).catch(() => null);

  if (!resp || !resp.ok) {
    return { ok: false as const, text: "", reason: "writer_failed" };
  }

  const data = (await resp.json().catch(() => null)) as any;
  const out = data?.choices?.[0]?.message?.content;
  const text = typeof out === "string" ? out.trim() : "";
  if (!text) return { ok: false as const, text: "", reason: "no_output" };

  return { ok: true as const, text, reason: "ok" };
}

function mapRouteToTemplateCategory(route: string) {
  // keep it simple for now; you can rename categories later
  switch (route) {
    case "PROPERTY_SPECIFIC":
      return "property_specific_answer";
    case "PROPERTY_SEARCH":
      return "property_search_suggestions";
    case "QNA":
      return "general_qna";
    case "FOLLOWUP_STATUS":
      return "status_followup";
    default:
      return "general_qna";
  }
}

export async function POST() {
  const supabase = supabaseAdmin();

  // 0) Load active writer prompt from DB (schema-flexible)
  // Supported schemas:
  // A) ai_prompts has columns: name, prompt (JSON string)
  // B) ai_prompts has columns: key, system_prompt, user_prompt, temperature, max_tokens
  const PROMPT_KEY = "reply_writer_v1";

  const { data: promptRow, error: promptErr } = await (supabase
    .from("ai_prompts") as any)
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

  // Extract system/user prompt + settings.
  // Prefer explicit columns, fallback to JSON in `prompt`.
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
        if (!userPromptTemplateFromDb && typeof parsed.user_prompt === "string") {
          userPromptTemplateFromDb = parsed.user_prompt;
        }
        if (Number.isFinite(Number(parsed.temperature))) {
          temperature = Number(parsed.temperature);
        }
        if (Number.isFinite(Number(parsed.max_tokens))) {
          maxTokens = Number(parsed.max_tokens);
        }
      }
    } catch {
      // ignore parse errors; we'll fail below
    }
  }

  if (!systemPromptFromDb || !userPromptTemplateFromDb) {
    return NextResponse.json(
      {
        error: `Active ${PROMPT_KEY} prompt is missing system_prompt/user_prompt`,
        hint:
          "Either add system_prompt + user_prompt columns, or store JSON in ai_prompts.prompt with {system_prompt,user_prompt,temperature,max_tokens}.",
      },
      { status: 500 }
    );
  }

  // sanity clamp
  if (!Number.isFinite(temperature)) temperature = 0.2;
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) maxTokens = 420;

  // 1) Pull a batch of message_routes where the inbound message is ready to be drafted.
  // We join `messages` to enforce: sender=user AND status=route_resolved.
  // (If the join/filter fails due to missing FK, we still guard later when loading the inbound message.)
  const { data: routes, error: routesErr } = await (supabase
    .from("message_routes") as any)
    .select(
      "id, agent_id, lead_id, message_id, route, confidence, reason, payload, prompt_version, created_at, messages!inner(status, sender)"
    )
    .eq("prompt_version", "v1")
    .eq("messages.sender", "user")
    .eq("messages.status", "route_resolved")
    .order("created_at", { ascending: true })
    .limit(25);

  if (routesErr) {
    return NextResponse.json(
      { error: "Failed to load message_routes", details: routesErr.message },
      { status: 500 }
    );
  }

  const processed: any[] = [];

  for (const r of routes || []) {
    const agentId = String(r.agent_id);
    const leadId = String(r.lead_id);
    const inboundMessageId = String(r.message_id);
    const route = String(r.route || "OTHER");
    const routePayload =
      r.payload && typeof r.payload === "object" ? r.payload : {};

    // 1.1) Acquire idempotency lock via message_drafts row.
    // This prevents two workers from drafting the same inbound message concurrently.
    const { data: lockRow, error: lockErr } = await (supabase
      .from("message_drafts") as any)
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
      // If unique constraint hit, another worker already created a lock/draft.
      // Supabase often returns 23505 for unique violations.
      const code = (lockErr as any).code;
      if (String(code) === "23505") continue;
      // Any other error: skip this item but continue batch.
      processed.push({ inboundMessageId, route, draftStatus: "lock_failed", error: lockErr.message });
      continue;
    }

    // If insert returned no row, be safe and skip.
    if (!lockRow?.id) continue;

    // 2) Load inbound message (authoritative)
    const { data: inbound, error: inboundErr } = await (
      supabase.from("messages") as any
    )
      .select("id, agent_id, lead_id, sender, status, text, snippet, timestamp")
      .eq("id", inboundMessageId)
      .maybeSingle();

    if (inboundErr || !inbound) continue;

    // Only draft replies for inbound user messages that reached route_resolved.
    // This prevents drafting on messages that are still in earlier pipeline stages.
    if (String(inbound.sender) !== "user") continue;
    if (String(inbound.status || "") !== "route_resolved") continue;

    // 3) Load lead
    const { data: lead } = await (supabase.from("leads") as any)
      .select("id, agent_id, name, email, gmail_thread_id, meta")
      .eq("id", leadId)
      .maybeSingle();

    if (!lead || String(lead.agent_id) !== agentId) continue;

    // 4) Load last 10 thread messages (most recent first)
    const { data: ctx } = await (supabase.from("messages") as any)
      .select("sender, text, timestamp")
      .eq("lead_id", leadId)
      .order("timestamp", { ascending: false })
      .limit(10);

    // 5) Load agent brand + style
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

    // 6) Load templates for this route category
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

    // 7) Load properties if referenced in payload
    const activePropertyId = routePayload?.active_property_id
      ? String(routePayload.active_property_id)
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
          "id, city, neighbourhood, street_address, type, price, price_type, rooms, size_sqm, floor, furnished, pets_allowed, available_from, listing_summary, uri"
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
          "id, city, neighbourhood, street_address, type, price, price_type, rooms, size_sqm, floor, furnished, pets_allowed, available_from, listing_summary, uri"
        )
        .eq("agent_id", agentId)
        .in("id", suggestedPropertyIds)
        .limit(5);

      if (Array.isArray(ps) && ps.length > 0) {
        suggestedPropertiesBlock = ps.map(formatProperty).join("\n\n---\n\n");
      }
    }

    // 8) Optional: load autosend setting (if you have it)
    // If autosend is enabled, we generate an outbound message with approval_required=false
    // and mark it ready for send in a later pipeline step.
    const { data: settings } = await (supabase.from("agent_settings") as any)
      .select("agent_id, autosend_enabled")
      .eq("agent_id", agentId)
      .maybeSingle();

    const autosendEnabled = !!settings?.autosend_enabled;

    // 9) Assemble user prompt with placeholders
    const inboundText = String(inbound.text || inbound.snippet || "").slice(
      0,
      2000
    );
    const threadContext = formatThreadContext(ctx || []);
    const clientName = lead?.name ? String(lead.name) : "";
    const clientEmail = lead?.email ? String(lead.email) : "";

    const systemPrompt = String(systemPromptFromDb);
    const userPromptTemplate = String(userPromptTemplateFromDb);

    const userPrompt = userPromptTemplate
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
      .replaceAll("{{FAQ_CONTEXT}}", ""); // later

    // 10) Call writer
    const writer = await callAzureWriter({
      system: systemPrompt,
      user: userPrompt,
      temperature,
      maxTokens,
    });

    const rawDraft = writer.ok ? writer.text.trim() : "{escalate}";

    const isEscalate = rawDraft === "{escalate}";

    // 11) Persist draft linkage + create outbound draft message
    const now = new Date().toISOString();

    if (isEscalate) {
      // Mark inbound for manual attention
      await (supabase.from("messages") as any)
        .update({ status: "needs_human", visible_to_agent: true })
        .eq("id", inboundMessageId);

      // Lock row already exists; keep draft_message_id null to prevent re-processing.
      // (No-op update to ensure row is present)
      await (supabase.from("message_drafts") as any)
        .update({ draft_message_id: null })
        .eq("inbound_message_id", inboundMessageId);

      processed.push({
        inboundMessageId,
        route,
        autosendEnabled,
        draftStatus: "escalate",
      });

      continue;
    }

    // Insert outbound assistant draft message and capture its id
    const { data: outMsg, error: outErr } = await (supabase.from("messages") as any)
      .insert({
        lead_id: leadId,
        agent_id: agentId,
        sender: "assistant",
        text: rawDraft,
        timestamp: now,
        visible_to_agent: true,
        // Always run QA first; approval/auto-send happens after QA passes.
        approval_required: false,
        status: "qa_pending",
        send_status: "pending",
      })
      .select("id")
      .single();

    if (outErr || !outMsg?.id) {
      // Fail-closed: require manual handling
      await (supabase.from("messages") as any)
        .update({ status: "needs_human" })
        .eq("id", inboundMessageId);

      processed.push({
        inboundMessageId,
        route,
        autosendEnabled,
        draftStatus: "failed_insert_outbound",
      });

      continue;
    }

    const draftMessageId = String(outMsg.id);

    // Link inbound -> draft (update existing lock row)
    await (supabase.from("message_drafts") as any)
      .update({ draft_message_id: draftMessageId })
      .eq("inbound_message_id", inboundMessageId);

    await (supabase.from("messages") as any)
      .update({ status: "drafted", visible_to_agent: true })
      .eq("id", inboundMessageId);

    // Update lead last_message fields (optional)
    await (supabase.from("leads") as any)
      .update({
        last_message_at: now,
        last_message: rawDraft.slice(0, 240),
      })
      .eq("id", leadId);

    processed.push({
      inboundMessageId,
      route,
      autosendEnabled,
      draftMessageId,
      draftStatus: "qa_pending",
    });
  }

  return NextResponse.json({
    ok: true,
    processed: processed.length,
    results: processed,
  });
}
