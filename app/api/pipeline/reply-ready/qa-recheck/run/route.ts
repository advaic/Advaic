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
    { auth: { persistSession: false, autoRefreshToken: false } },
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
  timeoutMs: number,
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
      raw: "",
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
        timeoutMs,
      );

      if (!resp.ok) {
        lastErr = `http_${resp.status}`;
        if (resp.status === 429 || (resp.status >= 500 && resp.status <= 599)) {
          continue;
        }
        return {
          ok: false as const,
          label: "fail" as const,
          reason: lastErr,
          raw: "",
        };
      }

      const data = await resp.json().catch(() => null);
      const out = data?.choices?.[0]?.message?.content;
      const raw = typeof out === "string" ? out.trim() : "";

      const label = extractLabel(raw);
      return { ok: true as const, label, reason: "ok", raw };
    } catch (e: any) {
      lastErr = e?.name === "AbortError" ? "timeout" : "fetch_failed";
      continue;
    }
  }

  return { ok: false as const, label: "fail" as const, reason: lastErr, raw: "" };
}

function safeJsonParse<T = any>(raw: string): { ok: true; value: T } | { ok: false; error: string } {
  const s = String(raw || "").trim();
  if (!s) return { ok: false, error: "empty" };

  // Strip code fences if present
  const unfenced = s
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return { ok: true, value: JSON.parse(unfenced) };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}

async function callAzureQaReasonJson(args: {
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
    process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_QA_RECHECK_REASON ||
    process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_QA_RECHECK ||
    process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_QA ||
    process.env.AZURE_OPENAI_DEPLOYMENT_QA ||
    "";

  if (!deployment) {
    return {
      ok: false as const,
      error: "qa_recheck_reason_not_configured",
      raw: "",
      parsed: null as any,
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
        timeoutMs,
      );

      if (!resp.ok) {
        lastErr = `http_${resp.status}`;
        if (resp.status === 429 || (resp.status >= 500 && resp.status <= 599)) {
          continue;
        }
        return {
          ok: false as const,
          error: lastErr,
          raw: "",
          parsed: null as any,
        };
      }

      const data = await resp.json().catch(() => null);
      const out = data?.choices?.[0]?.message?.content;
      const raw = typeof out === "string" ? out.trim() : "";

      const parsed = safeJsonParse(raw);
      if (!parsed.ok) {
        return {
          ok: false as const,
          error: !parsed.ok ? (parsed as { error: string }).error : "unknown",
          raw,
          parsed: null as any,
        };
      }

      return { ok: true as const, error: null, raw, parsed: parsed.value };
    } catch (e: any) {
      lastErr = e?.name === "AbortError" ? "timeout" : "fetch_failed";
      continue;
    }
  }

  return { ok: false as const, error: lastErr, raw: "", parsed: null as any };
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

  const PROMPT_KEY_REPLY = "qa_recheck_v1";
  const PROMPT_KEY_FOLLOWUP = "followup_qa_v2";
  const PROMPT_KEY_REPLY_REASON = "qa_recheck_reason_v1";
  const PROMPT_KEY_FOLLOWUP_REASON = "followup_qa_recheck_reason_v1";

  async function loadActivePrompt(key: string) {
    const { data, error } = await (supabase.from("ai_prompts") as any)
      .select(
        "key, version, is_active, system_prompt, user_prompt, temperature, max_tokens",
      )
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

    let temperature = Number((data as any).temperature ?? 0);
    let maxTokens = Number((data as any).max_tokens ?? 8);
    const version = Number((data as any).version ?? 1);

    if (!system || !user) {
      return {
        ok: false as const,
        key,
        error: "missing_system_or_user_prompt",
      };
    }

    if (!Number.isFinite(temperature)) temperature = 0;
    if (!Number.isFinite(maxTokens) || maxTokens <= 0) maxTokens = 8;

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

  function normalizeStringArray(v: any): string[] {
    if (Array.isArray(v)) return v.map((x) => String(x)).filter((s) => !!s);
    return [];
  }

  function clampScore(v: any): number {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  // 1) Load active prompts (reply + followup) + optional reason prompts
  const replyPrompt = await loadActivePrompt(PROMPT_KEY_REPLY);
  const followupPrompt = await loadActivePrompt(PROMPT_KEY_FOLLOWUP);

  const replyReasonPrompt = await loadActivePrompt(PROMPT_KEY_REPLY_REASON);
  const followupReasonPrompt = await loadActivePrompt(PROMPT_KEY_FOLLOWUP_REASON);

  // Reply prompt is mandatory for the pipeline to function.
  if (!replyPrompt.ok) {
    return NextResponse.json(
      {
        error: "Active qa_recheck prompt not found or incomplete",
        details: replyPrompt.error,
        key: PROMPT_KEY_REPLY,
      },
      { status: 500 },
    );
  }

  // 2) Find drafts that are waiting for QA recheck
  // Our pipeline uses sender="assistant". Allow legacy sender="agent" to avoid stranding older rows.
  const { data: drafts, error: draftsErr } = await (
    supabase.from("messages") as any
  )
    .select(
      "id, agent_id, lead_id, text, status, sender, timestamp, was_followup",
    )
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
      { status: 500 },
    );
  }

  const processed: any[] = [];

  for (const d of drafts || []) {
    const draftId = String(d.id);
    const agentId = String(d.agent_id);
    const leadId = String(d.lead_id);

    const isFollowup = !!(d as any).was_followup;

    const activePrompt = isFollowup ? followupPrompt : replyPrompt;

    if (!activePrompt.ok) {
      // fail-closed: if the dedicated follow-up QA recheck prompt is missing, force human
      await (supabase.from("messages") as any)
        .update({
          status: "needs_human",
          approval_required: true,
          visible_to_agent: true,
        })
        .eq("id", draftId);

      processed.push({
        draftId,
        verdict: "fail",
        reason: isFollowup
          ? "missing_followup_qa_recheck_prompt"
          : "missing_reply_qa_recheck_prompt",
      });
      continue;
    }

    const PROMPT_KEY = activePrompt.key;
    const promptVersion = activePrompt.promptVersion;
    const temperature = Number(activePrompt.temperature);
    const maxTokens = Number(activePrompt.maxTokens);

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

      processed.push({
        draftId,
        verdict: "fail",
        reason: "empty_rewritten_reply",
      });
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

      processed.push({
        draftId,
        verdict: "fail",
        reason: "missing_inbound_link",
      });
      continue;
    }

    const { data: inbound } = await (supabase.from("messages") as any)
      .select("id, text, snippet")
      .eq("id", inboundMessageId)
      .maybeSingle();

    const inboundText = String(inbound?.text || inbound?.snippet || "").slice(
      0,
      2000,
    );

    // 4) Load last 10 context messages
    const { data: ctx } = await (supabase.from("messages") as any)
      .select("sender, text, timestamp")
      .eq("lead_id", leadId)
      .order("timestamp", { ascending: false })
      .limit(10);

    const threadContext = formatThreadContext(ctx || []);

    // 5) Build prompt
    const userPrompt = String(activePrompt.user)
      .replaceAll("{{INBOUND_MESSAGE}}", inboundText)
      .replaceAll("{{REWRITTEN_REPLY}}", rewrittenReply.slice(0, 2400))
      .replaceAll("{{THREAD_CONTEXT}}", threadContext);

    // 6) Call QA model (fail-closed)
    const qa = await callAzureQaLabel({
      system: String(activePrompt.system),
      user: userPrompt,
      temperature,
      maxTokens,
      timeoutMs: 20_000,
      retries: 2,
    });

    const finalVerdict = qa.label; // pass|warn|fail (already fail-closed)

    // Optional: structured reasoning (only when it matters)
    const reasonPrompt = isFollowup ? followupReasonPrompt : replyReasonPrompt;

    let qaScore = 0;
    let qaReasonShort: string | null = null;
    let qaReasonLong: string | null = null;
    let qaAction: string | null = null;
    let qaRiskFlags: string[] | null = null;
    let qaFlags: any = {};
    let qaSuggestions: any = {};
    let qaMeta: any = {
      stage: "qa_recheck",
      label_call: { ok: qa.ok, reason: qa.reason },
      is_followup: isFollowup,
      prompt_key_label: PROMPT_KEY,
      prompt_version_label: promptVersion,
    };

    if (finalVerdict !== "pass" && reasonPrompt.ok) {
      // Build reason prompt. It can reference the same placeholders plus VERDICT.
      const reasonUserPrompt = String(reasonPrompt.user)
        .replaceAll("{{INBOUND_MESSAGE}}", inboundText)
        .replaceAll("{{REWRITTEN_REPLY}}", rewrittenReply.slice(0, 2400))
        .replaceAll("{{THREAD_CONTEXT}}", threadContext)
        .replaceAll("{{VERDICT}}", finalVerdict);

      const r = await callAzureQaReasonJson({
        system: String(reasonPrompt.system),
        user: reasonUserPrompt,
        temperature: Number(reasonPrompt.temperature ?? 0),
        maxTokens: Number(reasonPrompt.maxTokens ?? 350),
        timeoutMs: 20_000,
        retries: 1,
      });

      qaMeta = {
        ...qaMeta,
        reason_call: { ok: r.ok, error: r.error },
        prompt_key_reason: reasonPrompt.key,
        prompt_version_reason: reasonPrompt.promptVersion,
      };

      if (r.ok && r.parsed) {
        const obj: any = r.parsed;
        qaScore = clampScore(obj.score);
        qaReasonShort = obj.reason_short ? String(obj.reason_short).slice(0, 500) : null;
        qaReasonLong = obj.reason_long ? String(obj.reason_long).slice(0, 8000) : null;
        qaAction = obj.action ? String(obj.action).slice(0, 120) : null;
        qaRiskFlags = normalizeStringArray(obj.risk_flags);
        qaFlags = obj.flags && typeof obj.flags === "object" ? obj.flags : {};
        qaSuggestions = obj.suggestions && typeof obj.suggestions === "object" ? obj.suggestions : {};
      } else {
        // Fail-closed: still store something helpful for debugging
        qaReasonShort = `reason_unavailable:${String(r.error || "unknown")}`;
      }
    }

    // 7) Persist QA artifact (best-effort)
    try {
      await (supabase.from("message_qas") as any).insert({
        agent_id: agentId,
        lead_id: leadId,
        inbound_message_id: inboundMessageId,
        draft_message_id: draftId,
        verdict: finalVerdict,
        score: qaScore,
        reason: qaReasonShort,
        reason_long: qaReasonLong,
        action: qaAction,
        risk_flags: qaRiskFlags,
        flags: qaFlags,
        suggestions: qaSuggestions,
        meta: qaMeta,
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
