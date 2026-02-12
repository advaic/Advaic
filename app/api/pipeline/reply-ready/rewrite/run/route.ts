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

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

async function callAzureRewrite(args: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  timeoutMs?: number;
  retries?: number;
}) {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");

  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_REWRITE;
  if (!deployment)
    return { ok: false as const, text: "", reason: "rewrite_not_configured" };

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
      const resp = await fetchWithTimeout(
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
        if (resp.status === 429 || (resp.status >= 500 && resp.status <= 599))
          continue;
        return { ok: false as const, text: "", reason: lastErr };
      }

      const data = (await resp.json().catch(() => null)) as any;
      const out = data?.choices?.[0]?.message?.content;
      const text = typeof out === "string" ? out.trim() : "";
      if (!text)
        return { ok: false as const, text: "", reason: "rewrite_no_output" };
      return { ok: true as const, text, reason: "ok" };
    } catch (e: any) {
      lastErr = e?.name === "AbortError" ? "timeout" : "fetch_failed";
      continue;
    }
  }

  return { ok: false as const, text: "", reason: lastErr };
}

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

type RewriteLogRow = {
  // minimal
  agent_id: string;
  lead_id: string;
  inbound_message_id: string;
  draft_message_id: string;
  prompt_key: string;
  prompt_version: string;
  verdict?: string;
  reason?: string;
  score?: number | null;
  model?: string;
};

/**
 * =========================
 * Handler
 * =========================
 */
export async function POST() {
  const supabase = supabaseAdmin();
  const nowIso = new Date().toISOString();

  const PROMPT_KEY_REPLY = "rewrite_reply_v1";
  const PROMPT_KEY_FOLLOWUP = "followup_rewrite_v1";

  type PromptRow = {
    system_prompt: string;
    user_prompt: string;
    temperature: number;
    max_tokens: number;
    version: number;
  };

  async function loadActivePrompt(key: string) {
    const { data, error } = await (supabase.from("ai_prompts") as any)
      .select("system_prompt, user_prompt, temperature, max_tokens, version")
      .eq("key", key)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { ok: false as const, key, error: error?.message || "not_found" };
    }

    const system = String((data as any).system_prompt || "").trim();
    const user = String((data as any).user_prompt || "").trim();

    let temperature = Number((data as any).temperature ?? 0.2);
    let maxTokens = Number((data as any).max_tokens ?? 420);
    const version = Number((data as any).version ?? 1);

    if (!system || !user) {
      return {
        ok: false as const,
        key,
        error: "missing_system_or_user_prompt",
      };
    }

    if (!Number.isFinite(temperature)) temperature = 0.2;
    if (!Number.isFinite(maxTokens) || maxTokens <= 0) maxTokens = 420;

    return {
      ok: true as const,
      key,
      system,
      user,
      temperature,
      maxTokens,
      version,
      promptVersion: `v${version}`,
    };
  }

  // 1) Load active prompts (reply + followup)
  const replyPrompt = await loadActivePrompt(PROMPT_KEY_REPLY);
  const followupPrompt = await loadActivePrompt(PROMPT_KEY_FOLLOWUP);

  // We must have at least the reply prompt; followup prompt is required only when a followup draft appears.
  if (!replyPrompt.ok) {
    return NextResponse.json(
      {
        error: "Active rewrite prompt not found",
        details: replyPrompt.error,
        key: PROMPT_KEY_REPLY,
      },
      { status: 500 }
    );
  }

  // 2) Load drafts that are waiting for rewrite
  // IMPORTANT: your system uses sender="agent" (not "assistant") for drafts.
  const { data: drafts, error: draftsErr } = await (
    supabase.from("messages") as any
  )
    .select("id, lead_id, agent_id, text, status, sender, timestamp, was_followup")
    .eq("sender", "agent")
    .eq("status", "rewrite_pending")
    .order("timestamp", { ascending: true })
    .limit(25);

  if (draftsErr) {
    return NextResponse.json(
      {
        error: "Failed to load rewrite_pending drafts",
        details: draftsErr.message,
      },
      { status: 500 }
    );
  }

  const processed: any[] = [];

  for (const draft of drafts || []) {
    const draftId = String(draft.id);
    const leadId = String(draft.lead_id);
    const agentId = String(draft.agent_id);

    const isFollowup = !!(draft as any).was_followup;

    const activePrompt = isFollowup ? followupPrompt : replyPrompt;

    if (!activePrompt.ok) {
      // fail-closed for followups if the dedicated prompt is missing
      await safeUpdate(
        supabase,
        "messages",
        {
          status: "needs_human",
          approval_required: true,
          visible_to_agent: true,
        },
        { id: draftId }
      );

      processed.push({
        draftId,
        nextStatus: "needs_human",
        reason: isFollowup
          ? "missing_followup_rewrite_prompt"
          : "missing_reply_rewrite_prompt",
      });
      continue;
    }

    const PROMPT_KEY = activePrompt.key;
    const PROMPT_VERSION = activePrompt.promptVersion;

    // 2.1) Find the inbound user message that this draft belongs to
    // Preferred: message_drafts linkage table.
    const { data: link } = await (supabase.from("message_drafts") as any)
      .select("inbound_message_id")
      .eq("draft_message_id", draftId)
      .maybeSingle();

    // Fallback: latest inbound user message in thread (best-effort)
    const inboundMessageIdFromLink = link?.inbound_message_id
      ? String(link.inbound_message_id)
      : null;

    const { data: inboundMsg } = inboundMessageIdFromLink
      ? await (supabase.from("messages") as any)
          .select("id, text, snippet, sender, lead_id, agent_id, timestamp")
          .eq("id", inboundMessageIdFromLink)
          .maybeSingle()
      : await (supabase.from("messages") as any)
          .select("id, text, snippet, sender, lead_id, agent_id, timestamp")
          .eq("lead_id", leadId)
          .eq("sender", "user")
          .order("timestamp", { ascending: false })
          .limit(1)
          .maybeSingle();

    if (
      !inboundMsg ||
      String(inboundMsg.sender) !== "user" ||
      String(inboundMsg.lead_id) !== leadId ||
      String(inboundMsg.agent_id) !== agentId
    ) {
      // fail-closed
      await safeUpdate(
        supabase,
        "messages",
        {
          status: "needs_human",
          approval_required: true,
          visible_to_agent: true,
        },
        { id: draftId }
      );
      processed.push({
        draftId,
        nextStatus: "needs_human",
        reason: "no_inbound_anchor",
      });
      continue;
    }

    // 2.2) Idempotency: skip if we already logged a rewrite for this draft + prompt version
    // You were logging rewrites into message_qas; we keep that approach.
    const { data: already } = await (supabase.from("message_qas") as any)
      .select("id")
      .eq("draft_message_id", draftId)
      .eq("prompt_key", PROMPT_KEY)
      .eq("prompt_version", PROMPT_VERSION)
      .maybeSingle();

    if (already?.id) continue;

    // 2.3) Load context (last 10) + property context
    const { data: ctx } = await (supabase.from("messages") as any)
      .select("sender, text, timestamp")
      .eq("lead_id", leadId)
      .order("timestamp", { ascending: false })
      .limit(10);

    // Optional lead info
    const { data: lead } = await (supabase.from("leads") as any)
      .select("priority")
      .eq("id", leadId)
      .maybeSingle();

    const propertyCtx = await loadPropertyContext(supabase, leadId, agentId);
    const propertySummary = String(propertyCtx?.summary || "").slice(0, 2500);
    const activePropertyJson = propertyCtx?.active
      ? JSON.stringify(propertyCtx.active).slice(0, 4000)
      : "";

    const inboundText = String(
      inboundMsg.text || inboundMsg.snippet || ""
    ).slice(0, 2000);
    const originalDraft = String(draft.text || "").slice(0, 2200);

    const userPrompt = String(activePrompt.user)
      .replaceAll("{{INBOUND_MESSAGE}}", inboundText)
      .replaceAll("{{ORIGINAL_DRAFT}}", originalDraft)
      .replaceAll(
        "{{THREAD_CONTEXT}}",
        formatThreadContextNewestFirst(ctx || [])
      )
      .replaceAll("{{LEAD_PRIORITY}}", String(lead?.priority ?? 2))
      .replaceAll("{{PROPERTY_CONTEXT}}", propertySummary)
      .replaceAll("{{ACTIVE_PROPERTY_JSON}}", activePropertyJson);

    // 3) Call rewrite model
    const rewrittenResp = await callAzureRewrite({
      system: String(activePrompt.system),
      user: userPrompt,
      temperature: Number(activePrompt.temperature),
      maxTokens: Number(activePrompt.maxTokens),
      timeoutMs: 25_000,
      retries: 2,
    });

    if (!rewrittenResp.ok) {
      // fail-closed: keep it for agent
      await safeUpdate(
        supabase,
        "messages",
        {
          status: "needs_human",
          approval_required: true,
          visible_to_agent: true,
        },
        { id: draftId }
      );

      processed.push({
        draftId,
        nextStatus: "needs_human",
        reason: rewrittenResp.reason,
      });

      // best-effort log
      try {
        const row: RewriteLogRow = {
          agent_id: agentId,
          lead_id: leadId,
          inbound_message_id: String(inboundMsg.id),
          draft_message_id: draftId,
          prompt_key: PROMPT_KEY,
          prompt_version: PROMPT_VERSION,
          verdict: "rewrite_failed",
          reason: rewrittenResp.reason,
          model: "azure",
        };
        await (supabase.from("message_qas") as any).insert(row);
      } catch {
        // swallow
      }

      continue;
    }

    const rewritten = rewrittenResp.text.replace(/^"|"$/g, "").trim();

    if (!rewritten) {
      await safeUpdate(
        supabase,
        "messages",
        {
          status: "needs_human",
          approval_required: true,
          visible_to_agent: true,
        },
        { id: draftId }
      );
      processed.push({
        draftId,
        nextStatus: "needs_human",
        reason: "empty_rewrite",
      });
      continue;
    }

    // 4) Replace draft text and move to QA *recheck* stage.
    // This keeps the pipeline deterministic:
    //   QA(warn) -> rewrite_pending -> rewrite -> qa_recheck_pending -> qa_recheck_runner
    await (supabase.from("messages") as any)
      .update({
        text: rewritten,
        status: "qa_recheck_pending",
        approval_required: false,
        visible_to_agent: true,
      })
      .eq("id", draftId);

    // 5) Log rewrite artifact (audit)
    try {
      await (supabase.from("message_qas") as any).insert({
        agent_id: agentId,
        lead_id: leadId,
        inbound_message_id: String(inboundMsg.id),
        draft_message_id: draftId,
        verdict: "rewritten",
        score: null,
        reason: "rewrite_applied",
        prompt_key: PROMPT_KEY,
        prompt_version: PROMPT_VERSION,
        model: "azure",
      });
    } catch {
      // swallow
    }


    processed.push({
      draftId,
      inboundMessageId: String(inboundMsg.id),
      nextStatus: "qa_recheck_pending",
    });
  }

  return NextResponse.json({
    ok: true,
    processed: processed.length,
    results: processed,
  });
}


async function loadPropertyContext(supabase: any, leadId: string, agentId: string) {
  // Uses lead_property_state (lead_id PK) -> active_property_id + last_recommended_property_ids
  // Then loads property rows from `properties`.
  try {
    const { data: state, error: stErr } = await (supabase
      .from("lead_property_state") as any)
      .select("active_property_id, last_recommended_property_ids")
      .eq("lead_id", leadId)
      .eq("agent_id", agentId)
      .maybeSingle();

    if (stErr || !state) {
      return {
        ok: true as const,
        active: null as any,
        recommended: [] as any[],
        summary: "",
      };
    }

    const activeId = state?.active_property_id
      ? String(state.active_property_id)
      : null;

    const recIdsRaw = Array.isArray(state?.last_recommended_property_ids)
      ? state.last_recommended_property_ids
      : [];

    const recIds = recIdsRaw
      .map((x: any) => (x ? String(x) : ""))
      .filter((x: string) => x.length > 0)
      .slice(0, 6);

    const idsToLoad = Array.from(new Set([...(activeId ? [activeId] : []), ...recIds])).slice(
      0,
      8
    );

    if (idsToLoad.length === 0) {
      return {
        ok: true as const,
        active: null as any,
        recommended: [] as any[],
        summary: "",
      };
    }

    // IMPORTANT: schema uses `neighborhood` (US spelling) and `url` (not uri).
    const { data: props, error: pErr } = await (supabase
      .from("properties") as any)
      .select(
        "id, listing_summary, city, neighborhood, street_address, type, price, price_type, rooms, size_sqm, floor, year_built, furnished, pets_allowed, heating, energy_label, available_from, elevator, parking, description, url"
      )
      .in("id", idsToLoad)
      .eq("agent_id", agentId);

    if (pErr || !Array.isArray(props)) {
      return {
        ok: true as const,
        active: null as any,
        recommended: [] as any[],
        summary: "",
      };
    }

    const byId = new Map<string, any>();
    for (const p of props) byId.set(String(p.id), p);

    const active = activeId ? byId.get(activeId) ?? null : null;
    const recommended = recIds.map((id: string) => byId.get(id)).filter(Boolean);

    const compact = (p: any) => {
      if (!p) return "";
      const t = String(p.listing_summary || "").trim();
      const city = String(p.city || "").trim();
      const hood = String(p.neighborhood || "").trim();
      const price = p.price != null ? String(p.price) : "";
      const pt = String(p.price_type || "").trim();
      const rooms = p.rooms != null ? String(p.rooms) : "";
      const size = p.size_sqm != null ? String(p.size_sqm) : "";
      const url = String(p.url || "").trim();

      const bits = [
        t ? `Titel: ${t}` : "",
        city ? `Stadt: ${city}` : "",
        hood ? `Stadtteil: ${hood}` : "",
        price ? `Preis: ${price}${pt ? ` (${pt})` : ""}` : "",
        rooms ? `Zimmer: ${rooms}` : "",
        size ? `Fläche: ${size} m²` : "",
        url ? `Link: ${url}` : "",
      ].filter(Boolean);

      return bits.join(" | ");
    };

    const summaryParts: string[] = [];
    if (active) summaryParts.push(`AKTIVE IMMOBILIE: ${compact(active)}`);
    if (recommended.length > 0) {
      summaryParts.push(
        `LETZTE EMPFEHLUNGEN: ${recommended
          .slice(0, 3)
          .map((p: any) => compact(p))
          .filter(Boolean)
          .join(" || ")}`
      );
    }

    return {
      ok: true as const,
      active,
      recommended,
      summary: summaryParts.join("\n"),
    };
  } catch {
    return {
      ok: true as const,
      active: null as any,
      recommended: [] as any[],
      summary: "",
    };
  }
}

function formatThreadContextNewestFirst(ctx: any[]) {
  if (!Array.isArray(ctx) || ctx.length === 0) return "";
  // We usually fetch newest-first; rewrite works better oldest->newest.
  const ordered = [...ctx].reverse();
  return ordered
    .map((m) => {
      const sender = String(m.sender || "");
      const text = String(m.text || "");
      const ts = m.timestamp ? String(m.timestamp) : "";
      return `- [${ts}] ${sender}: ${text}`.trim();
    })
    .join("\n");
}
