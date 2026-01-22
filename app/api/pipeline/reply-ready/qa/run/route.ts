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

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
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

type QaVerdict = "pass" | "warn" | "fail";

type QaResult = {
  verdict: QaVerdict;
  reason: string; // <= 120 chars
  score?: number; // optional if prompt returns it
};

async function callAzureQa(args: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}) {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");

  // Dedicated QA deployment (recommended)
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

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      temperature: args.temperature,
      max_tokens: args.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    }),
  }).catch(() => null);

  if (!resp || !resp.ok) {
    return { ok: false as const, raw: "", reason: "qa_failed" };
  }

  const data = (await resp.json().catch(() => null)) as any;
  const out = data?.choices?.[0]?.message?.content;
  const raw = typeof out === "string" ? out.trim() : "";
  if (!raw) return { ok: false as const, raw: "", reason: "qa_no_output" };

  return { ok: true as const, raw, reason: "ok" };
}

function normalizeVerdict(v: any): QaVerdict {
  const s = String(v || "").toLowerCase();
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

export async function POST() {
  const supabase = supabaseAdmin();

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
  let maxTokens = Number(promptRow.max_tokens ?? 200);

  if (!systemPrompt || !userPromptTemplate) {
    return NextResponse.json(
      {
        error: `Active ${PROMPT_KEY} prompt missing system_prompt/user_prompt`,
      },
      { status: 500 }
    );
  }
  if (!Number.isFinite(temperature)) temperature = 0;
  if (!Number.isFinite(maxTokens) || maxTokens <= 0) maxTokens = 200;

  // 1) Load drafts to QA
  // We assume: message_drafts contains inbound_message_id + draft_message_id + agent_id + lead_id + prompt_version
  // We QA only those where draft exists.
  const { data: draftLinks, error: draftsErr } = await (
    supabase.from("message_drafts") as any
  )
    .select(
      "id, agent_id, lead_id, inbound_message_id, draft_message_id, prompt_key, prompt_version, created_at"
    )
    .not("draft_message_id", "is", null)
    // Only QA drafts generated by the draft step for this pipeline.
    .eq("prompt_key", "reply_writer_v1")
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

    // 1.1) Skip if QA already exists for this draft + version
    // Expectation: message_qas has unique(draft_message_id, prompt_version)
    const { data: existingQa } = await (supabase.from("message_qas") as any)
      .select("id")
      .eq("draft_message_id", draftMessageId)
      .eq("prompt_key", PROMPT_KEY)
      .eq("prompt_version", `v${promptRow.version}`)
      .maybeSingle();

    if (existingQa?.id) continue;

    // 2) Load inbound + draft messages
    const { data: inbound } = await (supabase.from("messages") as any)
      .select("id, sender, text, snippet, timestamp, lead_id, agent_id")
      .eq("id", inboundMessageId)
      .maybeSingle();

    const { data: draft } = await (supabase.from("messages") as any)
      .select(
        "id, sender, text, timestamp, lead_id, agent_id, approval_required, status"
      )
      .eq("id", draftMessageId)
      .maybeSingle();

    if (!inbound || !draft) continue;
    if (String(inbound.lead_id) !== leadId) continue;
    if (String(draft.lead_id) !== leadId) continue;
    if (String(inbound.sender) !== "user") continue;
    if (String(draft.sender) !== "assistant") continue;

    // Stage-gate: only QA drafts that are pending QA
    if (String(draft.status || "") !== "qa_pending") continue;

    // 3) Load last 10 thread messages (most recent first)
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
    const draftText = String(draft.text || "").slice(0, 2000);

    // 4) Compose QA user prompt (template placeholders)
    const qaUserPrompt = userPromptTemplate
      .replaceAll("{{THREAD_CONTEXT}}", threadContext || "")
      .replaceAll("{{INBOUND_MESSAGE}}", inboundText || "")
      .replaceAll("{{DRAFT_MESSAGE}}", draftText || "");

    // 5) Call QA model (fail-closed)
    let qa: QaResult = { verdict: "warn", reason: "qa_not_run" };

    const resp = await callAzureQa({
      system: systemPrompt,
      user: qaUserPrompt,
      temperature,
      maxTokens,
    });

    if (!resp.ok) {
      qa = { verdict: "warn", reason: resp.reason };
    } else {
      const parsed = safeJsonParse<any>(resp.raw);
      if (!parsed) {
        qa = { verdict: "warn", reason: "qa_invalid_json" };
      } else {
        const verdict = normalizeVerdict(parsed.verdict);
        const reason = normalizeReason(parsed.reason);
        const score =
          parsed.score !== undefined ? clamp01(parsed.score) : undefined;

        qa = { verdict, reason, score };
      }
    }

    // 6) Persist QA record
    // message_qas schema assumed:
    // id, agent_id, lead_id, inbound_message_id, draft_message_id,
    // verdict, score, reason, model, prompt_key, prompt_version, created_at
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
        prompt_version: `v${promptRow.version}`,
      });
    } catch {
      // If it fails, continue; we still update statuses fail-closed
    }

    // 7) Update draft message status based on QA
    // Pipeline gating:
    // - pass  -> route to ready_to_send (autosend enabled) OR needs_approval (manual)
    // - warn  -> rewrite_pending (rewrite runner will attempt improvement, then QA-recheck)
    // - fail  -> needs_human (agent must intervene)

    const autosendEnabled = await getAutosendEnabled(supabase, agentId);

    if (qa.verdict === "pass") {
      await (supabase.from("messages") as any)
        .update({
          status: autosendEnabled ? "ready_to_send" : "needs_approval",
          approval_required: autosendEnabled ? false : true,
          // Ensure send pipeline can pick it up when autosend is enabled
          send_status: autosendEnabled ? "pending" : (draft.send_status ?? null),
        })
        .eq("id", draftMessageId);
    } else if (qa.verdict === "warn") {
      await (supabase.from("messages") as any)
        .update({
          status: "rewrite_pending",
          approval_required: false,
        })
        .eq("id", draftMessageId);
    } else {
      await (supabase.from("messages") as any)
        .update({
          status: "needs_human",
          approval_required: true,
        })
        .eq("id", draftMessageId);
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
          ? (autosendEnabled ? "ready_to_send" : "needs_approval")
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
