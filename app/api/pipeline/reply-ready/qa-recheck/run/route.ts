import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

/**
 * =========================
 * Helpers
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

function formatThreadContext(ctx: any[]) {
  if (!Array.isArray(ctx) || ctx.length === 0) return "";
  // newest-first query -> reverse to oldest-first for better evaluation coherence
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

function extractLabel(raw: string): "pass" | "warn" | "fail" {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return "fail";

  // If model responded with JSON accidentally, try to read common keys
  if (s.startsWith("{") && s.endsWith("}")) {
    try {
      const obj = JSON.parse(s);
      const v = String(obj?.verdict || obj?.label || obj?.result || "")
        .trim()
        .toLowerCase();
      if (v === "pass" || v === "warn" || v === "fail") return v;
    } catch {
      // ignore
    }
  }

  // Otherwise: pick first occurrence of pass|warn|fail (fail-closed)
  const m = s.match(/\b(pass|warn|fail)\b/);
  if (!m) return "fail";
  const v = m[1];
  return v === "pass" ? "pass" : v === "warn" ? "warn" : "fail";
}

async function callAzureQaLabel(args: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  timeoutMs?: number;
  retries?: number;
}) {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");

  // Prefer a dedicated deployment; fallback to general QA deployment
  const deployment =
    process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_QA_RECHECK ||
    process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_QA ||
    process.env.AZURE_OPENAI_DEPLOYMENT_QA ||
    "";

  if (!deployment) {
    return {
      ok: false as const,
      label: "fail" as const,
      reason: "qa_recheck_not_configured",
    };
  }

  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const timeoutMs = Number.isFinite(Number(args.timeoutMs))
    ? Number(args.timeoutMs)
    : 20_000;
  const retries = Number.isFinite(Number(args.retries)) ? Number(args.retries) : 2;

  const body = JSON.stringify({
    temperature: args.temperature,
    max_tokens: args.maxTokens,
    top_p: 1,
    // Reduce chance of extra words
    stop: ["\n"],
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
        if (resp.status === 429 || (resp.status >= 500 && resp.status <= 599)) {
          continue;
        }
        return { ok: false as const, label: "fail" as const, reason: lastErr };
      }

      const data = await resp.json().catch(() => null);
      const out = data?.choices?.[0]?.message?.content;
      const raw = typeof out === "string" ? out.trim() : "";

      const label = extractLabel(raw);
      return { ok: true as const, label, reason: "ok" };
    } catch (e: any) {
      lastErr = e?.name === "AbortError" ? "timeout" : "fetch_failed";
      continue;
    }
  }

  return { ok: false as const, label: "fail" as const, reason: lastErr };
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

/**
 * =========================
 * Handler
 * =========================
 */
export async function POST() {
  const supabase = supabaseAdmin();

  const PROMPT_KEY = "qa_recheck_v1";

  // 1) Load active prompt
  const { data: prompt, error: promptErr } = await (
    supabase.from("ai_prompts") as any
  )
    .select(
      "key, version, is_active, system_prompt, user_prompt, temperature, max_tokens"
    )
    .eq("key", PROMPT_KEY)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (promptErr || !prompt?.system_prompt || !prompt?.user_prompt) {
    return NextResponse.json(
      {
        error: "Active qa_recheck_v1 prompt not found or incomplete",
        details: promptErr?.message,
      },
      { status: 500 }
    );
  }

  const temperature = Number(prompt.temperature ?? 0);
  const maxTokens = Number(prompt.max_tokens ?? 8);
  const promptVersion = `v${prompt.version ?? 1}`;

  // 2) Find drafts that are waiting for QA recheck
  // Our pipeline uses sender="assistant". Allow legacy sender="agent" to avoid stranding older rows.
  const { data: drafts, error: draftsErr } = await (
    supabase.from("messages") as any
  )
    .select("id, agent_id, lead_id, text, status, sender, timestamp")
    .in("sender", ["assistant", "agent"])
    .eq("status", "qa_recheck_pending")
    .order("timestamp", { ascending: true })
    .limit(25);

  if (draftsErr) {
    return NextResponse.json(
      {
        error: "Failed to load qa_recheck_pending drafts",
        details: draftsErr.message,
      },
      { status: 500 }
    );
  }

  const processed: any[] = [];

  for (const d of drafts || []) {
    const draftId = String(d.id);
    const agentId = String(d.agent_id);
    const leadId = String(d.lead_id);

    // Fail-closed on empty rewritten reply
    const rewrittenReply = String(d.text || "").trim();
    if (!rewrittenReply) {
      await (supabase.from("messages") as any)
        .update({
          approval_required: true,
          status: "needs_human",
          visible_to_agent: true,
        })
        .eq("id", draftId);

      processed.push({ draftId, verdict: "fail", reason: "empty_rewritten_reply" });
      continue;
    }

    // 2.1) Idempotency: skip if already rechecked with this prompt version
    const { data: existing } = await (supabase.from("message_qas") as any)
      .select("id")
      .eq("draft_message_id", draftId)
      .eq("prompt_key", PROMPT_KEY)
      .eq("prompt_version", promptVersion)
      .maybeSingle();

    if (existing?.id) continue;

    // 3) Load inbound message (via message_drafts mapping)
    const { data: draftLink } = await (supabase.from("message_drafts") as any)
      .select("inbound_message_id")
      .eq("draft_message_id", draftId)
      .maybeSingle();

    const inboundMessageId = draftLink?.inbound_message_id
      ? String(draftLink.inbound_message_id)
      : null;

    if (!inboundMessageId) {
      // fail-closed: if linkage missing, require human
      await (supabase.from("messages") as any)
        .update({
          status: "needs_human",
          approval_required: true,
          visible_to_agent: true,
        })
        .eq("id", draftId);

      processed.push({ draftId, verdict: "fail", reason: "missing_inbound_link" });
      continue;
    }

    const { data: inbound } = await (supabase.from("messages") as any)
      .select("id, text, snippet")
      .eq("id", inboundMessageId)
      .maybeSingle();

    const inboundText = String(inbound?.text || inbound?.snippet || "").slice(
      0,
      2000
    );

    // 4) Load last 10 context messages
    const { data: ctx } = await (supabase.from("messages") as any)
      .select("sender, text, timestamp")
      .eq("lead_id", leadId)
      .order("timestamp", { ascending: false })
      .limit(10);

    const threadContext = formatThreadContext(ctx || []);

    // 5) Build prompt
    const userPrompt = String(prompt.user_prompt)
      .replaceAll("{{INBOUND_MESSAGE}}", inboundText)
      .replaceAll("{{REWRITTEN_REPLY}}", rewrittenReply.slice(0, 2400))
      .replaceAll("{{THREAD_CONTEXT}}", threadContext);

    // 6) Call QA model (fail-closed)
    const qa = await callAzureQaLabel({
      system: String(prompt.system_prompt),
      user: userPrompt,
      temperature,
      maxTokens,
      timeoutMs: 20_000,
      retries: 2,
    });

    const finalVerdict = qa.label; // pass|warn|fail (already fail-closed)

    // 7) Persist QA artifact (best-effort)
    try {
      await (supabase.from("message_qas") as any).insert({
        agent_id: agentId,
        lead_id: leadId,
        inbound_message_id: inboundMessageId,
        draft_message_id: draftId,
        verdict: finalVerdict,
        reason: `qa_recheck:${qa.reason}`,
        prompt_key: PROMPT_KEY,
        prompt_version: promptVersion,
        model: "azure",
      });
    } catch {
      // swallow
    }

    // 8) Autosend gate
    const autosendEnabled = await getAutosendEnabled(supabase, agentId);

    // 9) Update draft status + approval + send_status (when autosend)
    if (finalVerdict === "pass") {
      const update: any = {
        approval_required: autosendEnabled ? false : true,
        status: autosendEnabled ? "ready_to_send" : "needs_approval",
        visible_to_agent: true,
      };

      // Only (re-)arm send_status when autosend is enabled. Do not override if it was already sent/sending.
      if (autosendEnabled) {
        update.send_status = "pending";
      }

      await (supabase.from("messages") as any)
        .update(update)
        .eq("id", draftId)
        .not("send_status", "in", "(sent,sending)");
    } else if (finalVerdict === "warn") {
      // warn after rewrite: be conservative -> needs approval (no rewrite loops)
      await (supabase.from("messages") as any)
        .update({
          approval_required: true,
          status: "needs_approval",
          visible_to_agent: true,
        })
        .eq("id", draftId);
    } else {
      // fail
      await (supabase.from("messages") as any)
        .update({
          approval_required: true,
          status: "needs_human",
          visible_to_agent: true,
        })
        .eq("id", draftId);
    }

    processed.push({ draftId, verdict: finalVerdict, autosendEnabled });
  }

  return NextResponse.json({
    ok: true,
    processed: processed.length,
    results: processed,
  });
}
