import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getAutosendBaseline, getLeadPropertyGate } from "@/lib/security/autosend-gate";

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

type QaReasonEngine = {
  reason_short_de: string; // <= 120
  reason_long_de?: string | null; // longer explanation for UI
  action_de?: string | null; // what agent should do
  risk_flags?: string[] | null; // machine-readable flags
  confidence?: number | null; // 0..1 optional
};

type QaResult = {
  verdict: QaVerdict;
  reason: string; // legacy short reason <= 120
  score?: number | null; // 0..1 optional
  engine?: QaReasonEngine | null;
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

function normalizeReasonLong(r: any) {
  const s = String(r || "").trim();
  return s ? s.slice(0, 2000) : null;
}

function normalizeAction(a: any) {
  const s = String(a || "").trim();
  return s ? s.slice(0, 800) : null;
}

function normalizeRiskFlags(v: any): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = v
    .map((x) => String(x || "").toLowerCase().trim())
    .filter((x) => x.length > 0)
    .slice(0, 20);
  return out.length ? out : null;
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


async function enqueueNotificationBestEffort(args: {
  agentId: string;
  type: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, any>;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET || "";

  // If not configured (e.g. local env), silently skip.
  if (!siteUrl || !secret) return { ok: false as const, skipped: true as const };

  try {
    const res = await fetch(`${siteUrl}/api/notifications/enqueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-advaic-internal-secret": secret,
      },
      body: JSON.stringify({
        agent_id: args.agentId,
        type: args.type,
        entity_type: args.entityType,
        entity_id: args.entityId,
        payload: { ...(args.payload ?? {}), source: "qa_run" },
      }),
    });

    // Best-effort: don’t throw on non-2xx.
    if (!res.ok) return { ok: false as const, skipped: false as const };
    return { ok: true as const, skipped: false as const };
  } catch {
    return { ok: false as const, skipped: false as const };
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

  const supabase = supabaseAdmin();
  const nowIso = new Date().toISOString();

  // 0) Load active QA prompts from ai_prompts (normal + followup)
  const NORMAL_QA_KEY = "qa_reply_v1";
  const FOLLOWUP_QA_KEY = "followup_qa_v1";

  type LoadedPrompt = {
    key: string;
    version: number;
    system: string;
    userTemplate: string;
    temperature: number;
    maxTokens: number;
    versionTag: string; // e.g. v1
  };

  async function loadActivePrompt(key: string): Promise<LoadedPrompt> {
    const { data: row, error } = await (supabase.from("ai_prompts") as any)
      .select(
        "id, key, version, is_active, system_prompt, user_prompt, temperature, max_tokens, response_format"
      )
      .eq("is_active", true)
      .eq("key", key)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !row) {
      throw new Error(`Active ${key} prompt not found in ai_prompts`);
    }

    const system = String(row.system_prompt || "").trim();
    const userTemplate = String(row.user_prompt || "").trim();
    let temperature = Number(row.temperature ?? 0);
    let maxTokens = Number(row.max_tokens ?? 220);
    if (!Number.isFinite(temperature)) temperature = 0;
    if (!Number.isFinite(maxTokens) || maxTokens <= 0) maxTokens = 220;

    if (!system || !userTemplate) {
      throw new Error(`Active ${key} prompt missing system_prompt/user_prompt`);
    }

    const version = Number(row.version ?? 1);
    return {
      key,
      version,
      system,
      userTemplate,
      temperature,
      maxTokens,
      versionTag: `v${version}`,
    };
  }

  let normalPrompt: LoadedPrompt;
  let followupPrompt: LoadedPrompt;
  try {
    normalPrompt = await loadActivePrompt(NORMAL_QA_KEY);
    followupPrompt = await loadActivePrompt(FOLLOWUP_QA_KEY);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load QA prompts" },
      { status: 500 }
    );
  }

  // 1) Load drafts to QA
  // A) Normal replies via message_drafts
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

  // B) Follow-up drafts directly from messages (no message_drafts link)
  // We QA only follow-up drafts that are qa_pending.
  const { data: followupDrafts, error: followupErr } = await (
    supabase.from("messages") as any
  )
    .select(
      "id, agent_id, lead_id, text, timestamp, sender, status, send_status, approval_required, was_followup"
    )
    .eq("was_followup", true)
    .in("sender", ["agent", "assistant"])
    .eq("status", "qa_pending")
    .order("timestamp", { ascending: true })
    .limit(50);

  if (followupErr) {
    return NextResponse.json(
      { error: "Failed to load follow-up drafts", details: followupErr.message },
      { status: 500 }
    );
  }

  type QaWorkItem =
    | {
        kind: "normal";
        agentId: string;
        leadId: string;
        inboundMessageId: string;
        draftMessageId: string;
      }
    | {
        kind: "followup";
        agentId: string;
        leadId: string;
        inboundMessageId: string; // we resolve to latest user message id
        draftMessageId: string;
      };

  const work: QaWorkItem[] = [];

  for (const link of draftLinks || []) {
    if (!link?.draft_message_id || !link?.inbound_message_id) continue;
    work.push({
      kind: "normal",
      agentId: String(link.agent_id),
      leadId: String(link.lead_id),
      inboundMessageId: String(link.inbound_message_id),
      draftMessageId: String(link.draft_message_id),
    });
  }

  for (const d of followupDrafts || []) {
    // Resolve inbound anchor as latest user message for the same lead
    const agentId = String(d.agent_id);
    const leadId = String(d.lead_id);
    const draftMessageId = String(d.id);

    const { data: inboundAnchor } = await (supabase.from("messages") as any)
      .select("id")
      .eq("lead_id", leadId)
      .eq("sender", "user")
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    const inboundMessageId = inboundAnchor?.id ? String(inboundAnchor.id) : "";
    if (!inboundMessageId) continue;

    work.push({
      kind: "followup",
      agentId,
      leadId,
      inboundMessageId,
      draftMessageId,
    });
  }

  const processed: any[] = [];

  async function insertQaRow(supabase: any, row: Record<string, any>) {
    // Try extended payload first (if columns exist), then fall back to the minimal payload.
    const minimal = {
      agent_id: row.agent_id,
      lead_id: row.lead_id,
      inbound_message_id: row.inbound_message_id,
      draft_message_id: row.draft_message_id,
      verdict: row.verdict,
      score: row.score ?? null,
      reason: row.reason,
      model: row.model,
      prompt_key: row.prompt_key,
      prompt_version: row.prompt_version,
    };

    const extended = {
      ...minimal,
      // These are optional columns in some schemas; safe to attempt.
      reason_long: row.reason_long ?? null,
      action: row.action ?? null,
      risk_flags: row.risk_flags ?? null,
      meta: row.meta ?? null,
    };

    // Attempt extended insert
    try {
      await (supabase.from("message_qas") as any).insert(extended);
      return;
    } catch {
      // ignore
    }

    // Fallback minimal insert
    try {
      await (supabase.from("message_qas") as any).insert(minimal);
    } catch {
      // swallow
    }
  }

  const autosendSettingCache = new Map<string, boolean>();
  const autosendBaselineCache = new Map<string, Awaited<ReturnType<typeof getAutosendBaseline>>>();
  const leadPropertyGateCache = new Map<string, Awaited<ReturnType<typeof getLeadPropertyGate>>>();

  async function resolveAutosendForDraft(agentId: string, leadId: string) {
    if (!autosendSettingCache.has(agentId)) {
      try {
        const { data } = await (supabase.from("agent_settings") as any)
          .select("autosend_enabled")
          .eq("agent_id", agentId)
          .maybeSingle();
        autosendSettingCache.set(agentId, Boolean(data?.autosend_enabled));
      } catch {
        autosendSettingCache.set(agentId, false);
      }
    }

    if (!autosendBaselineCache.has(agentId)) {
      autosendBaselineCache.set(agentId, await getAutosendBaseline(supabase, agentId));
    }

    const leadKey = `${agentId}:${leadId}`;
    if (!leadPropertyGateCache.has(leadKey)) {
      leadPropertyGateCache.set(leadKey, await getLeadPropertyGate(supabase, agentId, leadId));
    }

    const settingEnabled = Boolean(autosendSettingCache.get(agentId));
    const baseline = autosendBaselineCache.get(agentId)!;
    const leadProperty = leadPropertyGateCache.get(leadKey)!;
    const effectiveEnabled = settingEnabled && baseline.eligible && leadProperty.ready;

    const reasons: string[] = [];
    if (settingEnabled && !baseline.eligible) {
      reasons.push(...baseline.reasons);
    }
    if (settingEnabled && !leadProperty.ready && leadProperty.reason) {
      reasons.push(leadProperty.reason);
    }

    return {
      settingEnabled,
      effectiveEnabled,
      baseline,
      leadProperty,
      reasons,
    };
  }

  for (const item of work) {
    const agentId = item.agentId;
    const leadId = item.leadId;
    const inboundMessageId = item.inboundMessageId;
    const draftMessageId = item.draftMessageId;

    // Choose prompt based on kind
    const prompt = item.kind === "followup" ? followupPrompt : normalPrompt;

    // 1.1) Skip if QA already exists for this draft + prompt version
    const { data: existingQa } = await (supabase.from("message_qas") as any)
      .select("id")
      .eq("draft_message_id", draftMessageId)
      .eq("prompt_key", prompt.key)
      .eq("prompt_version", prompt.versionTag)
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
    // Draft rows may be either "agent" or "assistant" depending on runner version.
    if (!["agent", "assistant"].includes(String(draft.sender))) continue;

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
    const qaUserPrompt = prompt.userTemplate
      .replaceAll("{{THREAD_CONTEXT}}", threadContext || "")
      .replaceAll("{{INBOUND_MESSAGE}}", inboundText || "")
      .replaceAll("{{DRAFT_MESSAGE}}", draftText || "");

    // 5) Call QA model (fail-closed => warn)
    let qa: QaResult = { verdict: "warn", reason: "qa_not_run", score: null };

    const resp = await callAzureQa({
      system: prompt.system,
      user: qaUserPrompt,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
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
        const legacyReason = parsed.reason;
        const shortReason = normalizeReason(
          legacyReason ?? parsed.reason_short_de ?? parsed.reason_short ?? parsed.short_reason
        );
        const score = parsed.score !== undefined ? clamp01(parsed.score) : null;

        const engine: QaReasonEngine = {
          reason_short_de: shortReason,
          reason_long_de: normalizeReasonLong(
            parsed.reason_long_de ?? parsed.reason_long ?? parsed.long_reason
          ),
          action_de: normalizeAction(parsed.action_de ?? parsed.action ?? parsed.next_action),
          risk_flags: normalizeRiskFlags(
            parsed.risk_flags ?? parsed.flags ?? parsed.risks ?? parsed.riskFlags
          ),
          confidence: parsed.confidence !== undefined ? clamp01(parsed.confidence) : null,
        };

        qa = {
          verdict,
          reason: shortReason,
          score,
          engine,
        };
      }
    }

    // 6) Persist QA record (best-effort)
    // If you have a UNIQUE constraint (draft_message_id, prompt_key, prompt_version),
    // this will naturally be idempotent enough with the existingQa check above.
    await insertQaRow(supabase, {
      agent_id: agentId,
      lead_id: leadId,
      inbound_message_id: inboundMessageId,
      draft_message_id: draftMessageId,
      verdict: qa.verdict,
      score: qa.score ?? null,
      reason: qa.reason,
      reason_long: qa.engine?.reason_long_de ?? null,
      action: qa.engine?.action_de ?? null,
      risk_flags: qa.engine?.risk_flags ?? null,
      meta: qa.engine
        ? {
            confidence: qa.engine.confidence ?? null,
            kind: item.kind,
          }
        : { kind: item.kind },
      model: "azure",
      prompt_key: prompt.key,
      prompt_version: prompt.versionTag,
    });

    // 7) Update draft message status based on QA
    // Decision logic:
    // - pass -> needs_approval (default) OR ready_to_send if autosend enabled
    // - warn -> rewrite_pending (rewrite runner will fix, then QA again)
    // - fail -> needs_human
    const autosend = await resolveAutosendForDraft(agentId, leadId);
    const autosendEnabled = autosend.effectiveEnabled;

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

      // Notify only when it actually lands in Zur Freigabe
      if (!autosendEnabled) {
        await enqueueNotificationBestEffort({
          agentId,
          type: "approval_required_created",
          entityType: "message",
          entityId: draftMessageId,
          payload: {
            deep_link: "/app/zur-freigabe",
            lead_id: leadId,
            inbound_message_id: inboundMessageId,
            draft_message_id: draftMessageId,
            qa_verdict: qa.verdict,
            qa_reason: qa.reason,
            qa_score: qa.score ?? null,
            qa_prompt_key: prompt.key,
            qa_prompt_version: prompt.versionTag,
            kind: item.kind,
          },
        });
      }
      else {
        await enqueueNotificationBestEffort({
          agentId,
          type: "autosend_ready",
          entityType: "message",
          entityId: draftMessageId,
          payload: {
            deep_link: "/app",
            lead_id: leadId,
            inbound_message_id: inboundMessageId,
            draft_message_id: draftMessageId,
            qa_verdict: qa.verdict,
            qa_reason: qa.reason,
            qa_score: qa.score ?? null,
            qa_prompt_key: prompt.key,
            qa_prompt_version: prompt.versionTag,
            kind: item.kind,
          },
        });
      }
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

      await enqueueNotificationBestEffort({
        agentId,
        type: "escalation_created",
        entityType: "lead",
        entityId: leadId,
        payload: {
          deep_link: "/app/eskalationen",
          lead_id: leadId,
          inbound_message_id: inboundMessageId,
          draft_message_id: draftMessageId,
          qa_verdict: qa.verdict,
          qa_reason: qa.reason,
          qa_score: qa.score ?? null,
          qa_prompt_key: prompt.key,
          qa_prompt_version: prompt.versionTag,
          kind: item.kind,
        },
      });
    }

    processed.push({
      inboundMessageId,
      draftMessageId,
      verdict: qa.verdict,
      reason: qa.reason,
      score: qa.score ?? null,
      reason_long: qa.engine?.reason_long_de ?? null,
      action: qa.engine?.action_de ?? null,
      risk_flags: qa.engine?.risk_flags ?? null,
      qa_confidence: qa.engine?.confidence ?? null,
      qa_prompt_key: prompt.key,
      qa_prompt_version: prompt.versionTag,
      autosendConfigured: autosend.settingEnabled,
      autosendEnabled,
      autosendBlockReasons: autosend.reasons,
      notification_event_type:
        qa.verdict === "pass"
          ? (autosendEnabled ? "autosend_ready" : "approval_required_created")
          : qa.verdict === "fail"
          ? "escalation_created"
          : null,
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
