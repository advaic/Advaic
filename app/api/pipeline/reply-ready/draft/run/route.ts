import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { pickCanaryDeployment } from "@/lib/ai/canary-deployment";

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

function isInternal(req: Request) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-advaic-internal-secret");
  return !!got && got === secret;
}

function clamp01(x: any) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeStr(v: any) {
  return typeof v === "string" && v.trim() ? v.trim() : "";
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

function formatStyleExamples(rows: any[]) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  return rows
    .slice(0, 10)
    .map((r) => {
      const label = r?.label ? String(r.label).trim() : "";
      const text = r?.text ? String(r.text).trim() : "";
      const head = label ? `[${label}]` : "[Example]";
      return `${head} ${text}`.trim();
    })
    .filter(Boolean)
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

function buildDeterministicFallbackDraft(args: {
  route: string;
  leadName: string;
  activeProperty: any | null;
  suggestedProperties: any[];
}) {
  const salutationName = args.leadName ? ` ${args.leadName}` : "";
  const activeTitle = args.activeProperty?.title
    ? String(args.activeProperty.title)
    : null;
  const activeStreet = args.activeProperty?.street_address
    ? String(args.activeProperty.street_address)
    : null;
  const activeCity = args.activeProperty?.city
    ? String(args.activeProperty.city)
    : null;

  if (args.route === "PROPERTY_SPECIFIC" || args.route === "VIEWING_REQUEST") {
    const objectRef = [activeTitle, activeStreet, activeCity]
      .filter(Boolean)
      .join(", ");
    return [
      `Guten Tag${salutationName},`,
      "",
      objectRef
        ? `vielen Dank für Ihre Nachricht zur Immobilie (${objectRef}).`
        : "vielen Dank für Ihre Nachricht zur Immobilie.",
      "Die Wohnung ist aktuell in Prüfung. Ich bestätige Ihnen Verfügbarkeit, passende Besichtigungstermine und die benötigten Unterlagen.",
      "Wenn Sie möchten, sende ich Ihnen direkt zwei konkrete Terminvorschläge.",
      "",
      "Freundliche Grüße",
    ].join("\n");
  }

  if (args.route === "PROPERTY_SEARCH" && Array.isArray(args.suggestedProperties) && args.suggestedProperties.length > 0) {
    const top = args.suggestedProperties[0];
    const topRef = [top?.title, top?.street_address, top?.city]
      .filter(Boolean)
      .join(", ");
    return [
      `Guten Tag${salutationName},`,
      "",
      "vielen Dank für Ihre Anfrage.",
      topRef
        ? `Ich habe eine passende Option für Sie vorbereitet: ${topRef}.`
        : "Ich habe passende Optionen für Sie vorbereitet.",
      "Wenn Sie möchten, sende ich Ihnen direkt die wichtigsten Eckdaten und mögliche Besichtigungstermine.",
      "",
      "Freundliche Grüße",
    ].join("\n");
  }

  return [
    `Guten Tag${salutationName},`,
    "",
    "vielen Dank für Ihre Nachricht.",
    "Ich habe Ihr Anliegen erhalten und prüfe die passenden nächsten Schritte für Sie.",
    "Sie erhalten im nächsten Schritt eine konkrete Rückmeldung mit den relevanten Informationen.",
    "",
    "Freundliche Grüße",
  ].join("\n");
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
  rolloutKey: string;
  temperature: number;
  maxTokens: number;
  timeoutMs?: number;
  retries?: number;
}) {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");
  const stableDeployment = String(
    process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER || ""
  ).trim();

  if (!stableDeployment) {
    return {
      ok: false as const,
      text: "",
      reason: "writer_not_configured",
      deployment: "",
      variant: "stable" as const,
    };
  }

  const selected = pickCanaryDeployment({
    stableDeployment,
    candidateDeployment: process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER_CANDIDATE,
    canaryPercent: process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER_CANARY_PERCENT,
    unitKey: args.rolloutKey,
  });

  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";
  const url = `${endpoint}/openai/deployments/${selected.deployment}/chat/completions?api-version=${apiVersion}`;

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
        return {
          ok: false as const,
          text: "",
          reason: lastErr,
          deployment: selected.deployment,
          variant: selected.variant,
        };
      }

      const data = (await resp.json().catch(() => null)) as any;
      const out = data?.choices?.[0]?.message?.content;
      const text = typeof out === "string" ? out.trim() : "";
      if (!text) {
        return {
          ok: false as const,
          text: "",
          reason: "no_output",
          deployment: selected.deployment,
          variant: selected.variant,
        };
      }

      return {
        ok: true as const,
        text,
        reason: "ok",
        deployment: selected.deployment,
        variant: selected.variant,
      };
    } catch (e: any) {
      lastErr = e?.name === "AbortError" ? "timeout" : "fetch_failed";
      continue;
    }
  }

  return {
    ok: false as const,
    text: "",
    reason: lastErr,
    deployment: selected.deployment,
    variant: selected.variant,
  };
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
export async function POST(req: Request) {
  if (!isInternal(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { id?: string; message_id?: string }
    | null;
  const onlyMessageId = String(body?.message_id || body?.id || "").trim();

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

  const promptFallback = !!promptErr || !promptRow;

  let systemPromptFromDb =
    typeof promptRow?.system_prompt === "string" ? promptRow.system_prompt : "";
  let userPromptTemplateFromDb =
    typeof promptRow?.user_prompt === "string" ? promptRow.user_prompt : "";

  let temperature = Number(promptRow?.temperature ?? 0.2);
  let maxTokens = Number(promptRow?.max_tokens ?? 420);

  if ((!systemPromptFromDb || !userPromptTemplateFromDb) && promptRow?.prompt) {
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

  if (promptFallback || !systemPromptFromDb || !userPromptTemplateFromDb) {
    // Fail-open for draft creation: keep pipeline alive and generate a manual-review draft even
    // when ai_prompts is temporarily missing/misconfigured.
    systemPromptFromDb =
      "Sie schreiben kurze, klare Antworten für deutsche Immobilienanfragen. Keine Halluzinationen, keine Rechtsberatung.";
    userPromptTemplateFromDb = [
      "ROUTE: {{ROUTE}}",
      "INBOUND_MESSAGE:",
      "{{INBOUND_MESSAGE}}",
      "ACTIVE_PROPERTY:",
      "{{ACTIVE_PROPERTY}}",
      "SUGGESTED_PROPERTIES:",
      "{{SUGGESTED_PROPERTIES}}",
      "Schreibe eine höfliche, sichere Antwort in Sie-Ansprache. Wenn etwas unklar ist, bitte um kurze Präzisierung.",
    ].join("\n\n");
    temperature = 0.1;
    maxTokens = 280;
  }

  if (!Number.isFinite(temperature)) temperature = 0.2;
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) maxTokens = 420;

  /**
   * 1) Pull a batch of message_routes (we will stage-gate by loading the inbound message)
   */
  let routesQuery = (supabase.from("message_routes") as any)
    .select(
      "id, agent_id, lead_id, message_id, route, confidence, reason, payload, prompt_version, created_at"
    )
    .eq("prompt_version", "v1");

  if (onlyMessageId) {
    routesQuery = routesQuery.eq("message_id", onlyMessageId);
  }

  const { data: routes, error: routesErr } = await routesQuery
    // Process newest first so fresh route artifacts are drafted immediately.
    .order("created_at", { ascending: false })
    .limit(onlyMessageId ? 5 : 25);

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
    const routeAgentId = String(r.agent_id || "");
    const routeLeadId = String(r.lead_id || "");
    let agentId = routeAgentId;
    let leadId = routeLeadId;
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
    const { data: existingDraft, error: existingDraftErr } = await (
      supabase.from("message_drafts") as any
    )
      .select("id, inbound_message_id, draft_message_id, created_at")
      .eq("inbound_message_id", inboundMessageId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDraftErr) {
      processed.push({
        inboundMessageId,
        route,
        draftStatus: "existing_draft_lookup_failed",
        error: existingDraftErr.message,
      });
      continue;
    }

    if (existingDraft?.id && existingDraft.draft_message_id) {
      processed.push({
        inboundMessageId,
        route,
        draftStatus: "already_locked",
        draftMessageId: existingDraft.draft_message_id ?? null,
      });
      continue;
    }

    /**
     * 2) Load inbound message (authoritative)
     */
    const { data: inbound, error: inboundErr } = await (
      supabase.from("messages") as any
    )
      .select(
        "id, agent_id, lead_id, sender, status, text, snippet, timestamp, email_address"
      )
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

    const inboundStatus = String(inbound.status || "");
    const inboundReady =
      inboundStatus === "route_resolved" ||
      // Targeted rerun recovery: previously failed rows may be parked in needs_human.
      (Boolean(onlyMessageId) && inboundStatus === "needs_human");

    if (String(inbound.sender) !== "user" || !inboundReady) {
      processed.push({
        inboundMessageId,
        route,
        draftStatus: "inbound_not_ready",
        status: inboundStatus,
      });
      continue;
    }

    // Source of truth: message row. Route artifacts can be stale after lead merges/relinks.
    agentId = String(inbound.agent_id || routeAgentId || "");
    leadId = String(inbound.lead_id || routeLeadId || "");
    if (!agentId || !leadId) {
      await (supabase.from("messages") as any)
        .update({ status: "needs_human", visible_to_agent: true })
        .eq("id", inboundMessageId);

      processed.push({
        inboundMessageId,
        route,
        draftStatus: "missing_agent_or_lead",
      });
      continue;
    }

    // Keep route artifact consistent with canonical message ownership.
    if (routeAgentId !== agentId || routeLeadId !== leadId) {
      await safeUpdate(
        supabase,
        "message_routes",
        { agent_id: agentId, lead_id: leadId },
        { id: routeRowId },
      );
    }

    /**
     * 3) Load lead (ensure agent ownership)
     */
    let { data: lead } = await (supabase.from("leads") as any)
      .select("id, agent_id, name, email, gmail_thread_id, meta")
      .eq("id", leadId)
      .maybeSingle();

    // Self-heal legacy data drift: recreate missing lead row from inbound message context.
    if (!lead) {
      const fallbackEmail = safeStr((inbound as any)?.email_address);
      const fallbackName = fallbackEmail
        ? fallbackEmail
            .split("@")[0]
            .replace(/[._-]+/g, " ")
            .trim()
        : null;

      const { error: healInsertErr } = await (supabase.from("leads") as any).upsert(
        {
          id: leadId,
          agent_id: agentId,
          name: fallbackName || null,
          email: fallbackEmail || null,
          status: "open",
          escalated: false,
          message_count: 1,
          last_message_at: String((inbound as any)?.timestamp || nowIso),
          last_message: String((inbound as any)?.text || (inbound as any)?.snippet || "").slice(
            0,
            240
          ),
        },
        { onConflict: "id" }
      );

      if (!healInsertErr) {
        const reread = await (supabase.from("leads") as any)
          .select("id, agent_id, name, email, gmail_thread_id, meta")
          .eq("id", leadId)
          .maybeSingle();
        lead = reread?.data || null;
      }
    }

    const leadAgentId = String(lead?.agent_id || "").trim();

    // Self-heal legacy/partial leads where agent_id was not persisted.
    if (lead?.id && !leadAgentId) {
      await safeUpdate(
        supabase,
        "leads",
        { agent_id: agentId },
        { id: leadId },
      );
    }

    // Hard block only on true cross-agent conflicts.
    // Missing/partially broken lead rows should not prevent draft creation.
    if (lead && leadAgentId && leadAgentId !== agentId) {
      // Fail closed: needs human
      await (supabase.from("messages") as any)
        .update({ status: "needs_human", visible_to_agent: true })
        .eq("id", inboundMessageId);

      processed.push({
        inboundMessageId,
        route,
        draftStatus: "lead_mismatch",
        details: {
          routeAgentId,
          routeLeadId,
          messageAgentId: String(inbound.agent_id || ""),
          messageLeadId: String(inbound.lead_id || ""),
          leadAgentId,
        },
      });
      continue;
    }

    if (!lead) {
      lead = {
        id: leadId,
        agent_id: agentId,
        name: null,
        email: safeStr((inbound as any)?.email_address) || null,
        gmail_thread_id: null,
        meta: null,
      } as any;
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

    const { data: styleExamples } = await (supabase.from("agent_style_examples") as any)
      .select("label, text, created_at")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(8);

    const styleExamplesBlock = formatStyleExamples(styleExamples || []);

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
      styleExamplesBlock ? `Style examples (verbatim, copy tone & wording patterns):\n${styleExamplesBlock}` : null,
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
    let activePropertyData: any | null = null;
    if (activePropertyId) {
      const { data: p } = await (supabase.from("properties") as any)
        .select(
          "id, title, city, neighborhood, street_address, type, price, price_type, rooms, size_sqm, floor, furnished, pets_allowed, available_from, listing_summary, url, image_urls"
        )
        .eq("agent_id", agentId)
        .eq("id", activePropertyId)
        .maybeSingle();
      if (p) {
        activePropertyData = p;
        activePropertyBlock = formatProperty(p);
      }
    }

    let suggestedPropertiesBlock = "";
    let suggestedPropertiesData: any[] = [];
    if (suggestedPropertyIds.length > 0) {
      const { data: ps } = await (supabase.from("properties") as any)
        .select(
          "id, title, city, neighborhood, street_address, type, price, price_type, rooms, size_sqm, floor, furnished, pets_allowed, available_from, listing_summary, url, image_urls"
        )
        .eq("agent_id", agentId)
        .in("id", suggestedPropertyIds)
        .limit(5);

      if (Array.isArray(ps) && ps.length > 0) {
        suggestedPropertiesData = ps;
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
    const languageHint = safeStr(style?.language) || "auto";

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
      rolloutKey: `${agentId}:${leadId}:${inboundMessageId}`,
      temperature,
      maxTokens,
      timeoutMs: 25_000,
      retries: 2,
    });

    const rawDraft = writer.ok ? writer.text.trim() : "";
    let cleanedDraft = rawDraft.replace(/^"|"$/g, "").trim();
    let usedFallbackDraft = false;
    const writerFailed = !writer.ok;
    const isEscalate = cleanedDraft === "{escalate}";

    if (!cleanedDraft || isEscalate || writerFailed) {
      cleanedDraft = buildDeterministicFallbackDraft({
        route,
        leadName: clientName,
        activeProperty: activePropertyData,
        suggestedProperties: suggestedPropertiesData,
      });
      usedFallbackDraft = true;
    }

    /**
     * 11) Persist results
     */
    if (!cleanedDraft) {
      await (supabase.from("messages") as any)
        .update({ status: "needs_human", visible_to_agent: true })
        .eq("id", inboundMessageId);
      processed.push({
        inboundMessageId,
        route,
        autosendEnabled,
        draftStatus: "empty_draft_after_fallback",
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
        // Fallback drafts go straight to approval so agents always see a draft
        // even if writer/QA infra is temporarily unavailable.
        approval_required: true,
        status: usedFallbackDraft ? "needs_approval" : "qa_pending",
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

    // Link inbound -> draft (schema-compatible: some DBs use integer prompt_version, and
    // some enforce NOT NULL on draft_message_id so null-locks are impossible).
    const insertDraftLink = async (promptVersion: any) =>
      await (supabase.from("message_drafts") as any)
        .insert(
          {
            agent_id: agentId,
            lead_id: leadId,
            inbound_message_id: inboundMessageId,
            draft_message_id: draftMessageId,
            prompt_key: PROMPT_KEY,
            prompt_version: promptVersion,
          },
          { defaultToNull: true }
        )
        .select("id, draft_message_id")
        .maybeSingle();

    let { data: linkRow, error: linkErr } = await insertDraftLink("v1");
    if (
      linkErr &&
      /invalid input syntax for type integer/i.test(String(linkErr.message || ""))
    ) {
      ({ data: linkRow, error: linkErr } = await insertDraftLink(1));
    }

    if (linkErr) {
      // Race-safe fallback: if another runner already linked this inbound, keep canonical draft and drop duplicate.
      if (String((linkErr as any)?.code || "") === "23505") {
        const { data: racedLink } = await (supabase.from("message_drafts") as any)
          .select("id, draft_message_id")
          .eq("inbound_message_id", inboundMessageId)
          .maybeSingle();

        if (racedLink?.draft_message_id) {
          await (supabase.from("messages") as any).delete().eq("id", draftMessageId);
          processed.push({
            inboundMessageId,
            route,
            autosendEnabled,
            draftStatus: "already_locked",
            draftMessageId: String(racedLink.draft_message_id),
          });
          continue;
        }
      }

      // Last fallback: update existing row if present (legacy/manual data drift).
      const { data: existingLink } = await (supabase.from("message_drafts") as any)
        .select("id, draft_message_id")
        .eq("inbound_message_id", inboundMessageId)
        .maybeSingle();

      if (existingLink?.id) {
        const { error: updErr } = await (supabase.from("message_drafts") as any)
          .update({
            draft_message_id: draftMessageId,
            prompt_key: PROMPT_KEY,
          })
          .eq("id", existingLink.id);

        if (updErr) {
          await (supabase.from("messages") as any).delete().eq("id", draftMessageId);
          processed.push({
            inboundMessageId,
            route,
            autosendEnabled,
            draftStatus: "link_failed",
            error: updErr.message,
          });
          continue;
        }
      } else {
        await (supabase.from("messages") as any).delete().eq("id", draftMessageId);
        processed.push({
          inboundMessageId,
          route,
          autosendEnabled,
          draftStatus: "link_failed",
          error: linkErr.message,
        });
        continue;
      }
    }

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
      draftStatus: usedFallbackDraft ? "needs_approval_fallback" : "qa_pending",
      confidence: baseConfidence,
      reason: baseReason,
      writerDeployment: writer.deployment || null,
      writerVariant: writer.variant,
      writerReason: writer.reason,
    });

  }

  return NextResponse.json({
    ok: true,
    processed: processed.length,
    results: processed,
  });
}
