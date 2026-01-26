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
  if (!Number.isFinite(n)) return null;
  // If someone returns 0..100, normalize softly
  if (n > 1 && n <= 100) return Math.max(0, Math.min(1, n / 100));
  return Math.max(0, Math.min(1, n));
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function formatThreadContext(ctx: any[]) {
  if (!Array.isArray(ctx) || ctx.length === 0) return "";
  // Keep newest-first, but don’t bloat it too much
  return ctx
    .map((m) => {
      const sender = String(m.sender || "");
      const text = String(m.text || "");
      const ts = m.timestamp ? String(m.timestamp) : "";
      return `- [${ts}] ${sender}: ${text}`.trim();
    })
    .join("\n");
}

type QaVerdict = "pass" | "warn" | "fail";

type QaResult = {
  verdict: QaVerdict;
  reason: string; // <= 120 chars
  score?: number | null; // 0..1 optional
};

async function fetchJsonWithTimeout(
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

async function callAzureQa(args: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  timeoutMs?: number;
  retries?: number;
}) {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");

  const deployment =
    process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_QA ||
    process.env.AZURE_OPENAI_DEPLOYMENT_QA ||
    "";

  if (!deployment) {
    return { ok: false as const, raw: "", reason: "qa_not_configured" };
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
    response_format: { type: "json_object" },
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
        if (resp.status === 429 || (resp.status >= 500 && resp.status <= 599))
          continue;
        return { ok: false as const, raw: "", reason: lastErr };
      }

      const data = (await resp.json().catch(() => null)) as any;
      const out = data?.choices?.[0]?.message?.content;
      const raw = typeof out === "string" ? out.trim() : "";
      if (!raw) return { ok: false as const, raw: "", reason: "qa_no_output" };

      return { ok: true as const, raw, reason: "ok" };
    } catch (e: any) {
      lastErr = e?.name === "AbortError" ? "timeout" : "fetch_failed";
      continue;
    }
  }

  return { ok: false as const, raw: "", reason: lastErr };
}

function normalizeVerdict(v: any): QaVerdict {
  const s = String(v || "")
    .toLowerCase()
    .trim();
  if (s === "pass") return "pass";
  if (s === "warn") return "warn";
  return "fail";
}

function normalizeReason(r: any) {
  return String(r || "n/a").slice(0, 120);
}

async function getAutosendEnabled(supabase: any, agentId: string) {
  try {
    const { data } = await (supabase.from("agent_settings") as any)
      .select("autosend_enabled")
      .eq("agent_id", agentId)
      .maybeSingle();
    return !!data?.autosend_enabled;
  } catch {
    return false;
  }
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

/**
 * =========================
 * Handler
 * =========================
 */
export async function POST() {
  const supabase = supabaseAdmin();
  const nowIso = new Date().toISOString();

  // 0) Load active QA prompt from ai_prompts
  const PROMPT_KEY = "qa_reply_v1";

  const { data: promptRow, error: promptErr } = await (
    supabase.from("ai_prompts") as any
  )
    .select(
      "id, key, version, is_active, system_prompt, user_prompt, temperature, max_tokens, response_format"
    )
    .eq("is_active", true)
    .eq("key", PROMPT_KEY)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (promptErr || !promptRow) {
    return NextResponse.json(
      { error: `Active ${PROMPT_KEY} prompt not found in ai_prompts` },
      { status: 500 }
    );
  }

  const systemPrompt = String(promptRow.system_prompt || "").trim();
  const userPromptTemplate = String(promptRow.user_prompt || "").trim();
  let temperature = Number(promptRow.temperature ?? 0);
  let maxTokens = Number(promptRow.max_tokens ?? 220);

  if (!systemPrompt || !userPromptTemplate) {
    return NextResponse.json(
      {
        error: `Active ${PROMPT_KEY} prompt missing system_prompt/user_prompt`,
      },
      { status: 500 }
    );
  }
  if (!Number.isFinite(temperature)) temperature = 0;
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) maxTokens = 220;

  const PROMPT_VERSION = `v${promptRow.version ?? 1}`;

  // 1) Load drafts to QA
  // We QA only drafts created by reply_writer_v1 and that are currently qa_pending.
  const { data: draftLinks, error: draftsErr } = await (
    supabase.from("message_drafts") as any
  )
    .select(
      "id, agent_id, lead_id, inbound_message_id, draft_message_id, prompt_key, prompt_version, created_at"
    )
    .eq("prompt_key", "reply_writer_v1")
    .not("draft_message_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(50);

  if (draftsErr) {
    return NextResponse.json(
      { error: "Failed to load message_drafts", details: draftsErr.message },
      { status: 500 }
    );
  }

  const processed: any[] = [];

  for (const link of draftLinks || []) {
    const agentId = String(link.agent_id);
    const leadId = String(link.lead_id);
    const inboundMessageId = String(link.inbound_message_id);
    const draftMessageId = String(link.draft_message_id);

    // 1.1) Skip if QA already exists for this draft + prompt version
    const { data: existingQa } = await (supabase.from("message_qas") as any)
      .select("id")
      .eq("draft_message_id", draftMessageId)
      .eq("prompt_key", PROMPT_KEY)
      .eq("prompt_version", PROMPT_VERSION)
      .maybeSingle();

    if (existingQa?.id) continue;

    // 2) Load inbound + draft messages
    const { data: inbound } = await (supabase.from("messages") as any)
      .select("id, sender, text, snippet, timestamp, lead_id, agent_id, status")
      .eq("id", inboundMessageId)
      .maybeSingle();

    const { data: draft } = await (supabase.from("messages") as any)
      .select(
        "id, sender, text, timestamp, lead_id, agent_id, approval_required, status, send_status"
      )
      .eq("id", draftMessageId)
      .maybeSingle();

    if (!inbound || !draft) continue;

    // Ownership + integrity checks (fail closed)
    if (String(inbound.lead_id) !== leadId) continue;
    if (String(draft.lead_id) !== leadId) continue;
    if (String(inbound.agent_id) !== agentId) continue;
    if (String(draft.agent_id) !== agentId) continue;

    // Must be correct roles based on your pipeline
    if (String(inbound.sender) !== "user") continue;
    // Your draft runner inserts sender: "agent"
    if (String(draft.sender) !== "agent") continue;

    // Stage-gate: only QA drafts pending QA
    if (String(draft.status || "") !== "qa_pending") continue;

    // 3) Load last 10 thread messages
    const { data: ctx } = await (supabase.from("messages") as any)
      .select("sender, text, timestamp")
      .eq("lead_id", leadId)
      .order("timestamp", { ascending: false })
      .limit(10);

    const threadContext = formatThreadContext(ctx || []);
    const inboundText = String(inbound.text || inbound.snippet || "").slice(
      0,
      2000
    );
    const draftText = String(draft.text || "").slice(0, 2200);

    // 4) Compose QA user prompt (template placeholders)
    const qaUserPrompt = userPromptTemplate
      .replaceAll("{{THREAD_CONTEXT}}", threadContext || "")
      .replaceAll("{{INBOUND_MESSAGE}}", inboundText || "")
      .replaceAll("{{DRAFT_MESSAGE}}", draftText || "");

    // 5) Call QA model (fail-closed => warn)
    let qa: QaResult = { verdict: "warn", reason: "qa_not_run", score: null };

    const resp = await callAzureQa({
      system: systemPrompt,
      user: qaUserPrompt,
      temperature,
      maxTokens,
      timeoutMs: 25_000,
      retries: 2,
    });

    if (!resp.ok) {
      qa = { verdict: "warn", reason: resp.reason, score: null };
    } else {
      const parsed = safeJsonParse<any>(resp.raw);
      if (!parsed) {
        qa = { verdict: "warn", reason: "qa_invalid_json", score: null };
      } else {
        const verdict = normalizeVerdict(parsed.verdict);
        const reason = normalizeReason(parsed.reason);
        const score = parsed.score !== undefined ? clamp01(parsed.score) : null;
        qa = { verdict, reason, score };
      }
    }

    // 6) Persist QA record (best-effort)
    // If you have a UNIQUE constraint (draft_message_id, prompt_key, prompt_version),
    // this will naturally be idempotent enough with the existingQa check above.
    try {
      await (supabase.from("message_qas") as any).insert({
        agent_id: agentId,
        lead_id: leadId,
        inbound_message_id: inboundMessageId,
        draft_message_id: draftMessageId,
        verdict: qa.verdict,
        score: qa.score ?? null,
        reason: qa.reason,
        model: "azure",
        prompt_key: PROMPT_KEY,
        prompt_version: PROMPT_VERSION,
      });
    } catch {
      // swallow
    }

    // 7) Update draft message status based on QA
    // Decision logic:
    // - pass -> needs_approval (default) OR ready_to_send if autosend enabled
    // - warn -> rewrite_pending (rewrite runner will fix, then QA again)
    // - fail -> needs_human
    const autosendEnabled = await getAutosendEnabled(supabase, agentId);

    if (qa.verdict === "pass") {
      await (supabase.from("messages") as any)
        .update({
          status: autosendEnabled ? "ready_to_send" : "needs_approval",
          approval_required: autosendEnabled ? false : true,
          // keep send_status pending so send runner can pick it up later if autosend
          send_status: autosendEnabled
            ? "pending"
            : draft.send_status ?? "pending",
          visible_to_agent: true,
        })
        .eq("id", draftMessageId);

      // Also keep inbound visible + move to "draft_created" (already should be)
      await safeUpdate(
        supabase,
        "messages",
        { status: "draft_created", visible_to_agent: true },
        { id: inboundMessageId }
      );
    } else if (qa.verdict === "warn") {
      await (supabase.from("messages") as any)
        .update({
          status: "rewrite_pending",
          // still visible; typically still needs approval after rewrite+QA
          approval_required: true,
          visible_to_agent: true,
        })
        .eq("id", draftMessageId);
    } else {
      await (supabase.from("messages") as any)
        .update({
          status: "needs_human",
          approval_required: true,
          visible_to_agent: true,
        })
        .eq("id", draftMessageId);

      // make inbound also clearly human-needed
      await safeUpdate(
        supabase,
        "messages",
        { status: "needs_human", visible_to_agent: true },
        { id: inboundMessageId }
      );
    }


    processed.push({
      inboundMessageId,
      draftMessageId,
      verdict: qa.verdict,
      reason: qa.reason,
      score: qa.score ?? null,
      autosendEnabled,
      nextStatus:
        qa.verdict === "pass"
          ? autosendEnabled
            ? "ready_to_send"
            : "needs_approval"
          : qa.verdict === "warn"
          ? "rewrite_pending"
          : "needs_human",
    });
  }

  return NextResponse.json({
    ok: true,
    processed: processed.length,
    results: processed,
  });
}
