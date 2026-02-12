// app/api/pipeline/followups/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function isInternal(req: NextRequest) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-advaic-internal-secret");
  return !!got && got === secret;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function nowIso() {
  return new Date().toISOString();
}

function safeString(x: unknown, max = 5000) {
  return String(x ?? "").slice(0, max);
}

function normalizeProvider(x: unknown): "gmail" | "outlook" {
  const s = String(x ?? "gmail").toLowerCase();
  return s === "outlook" ? "outlook" : "gmail";
}

function isFutureIso(v: string | null) {
  if (!v) return false;
  const t = Date.parse(v);
  return Number.isFinite(t) && t > Date.now();
}

function addMinutesIso(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function addHoursIso(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function baseUrlFromReq(req: NextRequest) {
  // Prefer explicit site URL, then Vercel, then the request origin.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");

  return req.nextUrl.origin.replace(/\/+$/, "");
}

type LeadRow = {
  id: string;
  agent_id: string;

  email: string | null;
  name: string | null;
  type: string | null;

  // Optional: some schemas link leads to a property
  property_id?: string | null;

  email_provider: string | null;
  gmail_thread_id: string | null;
  outlook_conversation_id: string | null;

  // Follow-up state (lead-level)
  followups_enabled: boolean | null;
  followups_max_stage_override?: number | null;
  followups_pause_reason?: string | null;

  followup_paused_until: string | null;
  followup_stage: number | null;
  followup_next_at: string | null;
  followup_status: string | null;
  followup_stop_reason: string | null;
  followup_last_sent_at: string | null;

  last_user_message_at: string | null;
  last_agent_message_at: string | null;
};

type MessageCtx = {
  id: string;
  sender: string | null; // "user" | "agent"
  text: string | null;
  snippet: string | null;
  subject: string | null;
  timestamp: string;
};

type AzureFollowupResult = {
  ok: boolean;
  should_send: boolean;
  confidence: number;
  text: string;
  reason?: string;
  hard_stop_reason?: string | null;
};

type AiPromptRow = {
  id: string;
  key: string;
  version: number;
  is_active: boolean;
  name: string | null;
  system_prompt: string;
  user_prompt: string;
  temperature: number;
  max_tokens: number;
  response_format: string;
};

type AgentFollowupDefaults = {
  followups_enabled_default: boolean;
  followups_max_stage_rent: number;
  followups_max_stage_buy: number;
  followups_delay_hours_stage1: number;
  followups_delay_hours_stage2: number;
};

type PropertyFollowupPolicy = {
  enabled: boolean | null;
  max_stage_rent: number | null;
  max_stage_buy: number | null;
  stage1_delay_hours: number | null;
  stage2_delay_hours: number | null;
};

type EffectiveFollowupPolicy = {
  enabled: boolean;
  maxStage: number; // 0..2
  delayHoursStage1: number;
  delayHoursStage2: number;
  intent: "rent" | "buy";
};

function clampInt(n: any, min: number, max: number, fallback: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, Math.round(x)));
}

function inferIntent(leadType: unknown): "rent" | "buy" {
  const s = String(leadType ?? "").toLowerCase();
  // common German + English signals
  if (s.includes("miet") || s.includes("rent") || s.includes("rental")) return "rent";
  if (s.includes("kauf") || s.includes("buy") || s.includes("sale") || s.includes("verkauf")) return "buy";
  // Default to rent in V1 (safer / more common)
  return "rent";
}

function computeEffectivePolicy(args: {
  lead: LeadRow;
  agent: AgentFollowupDefaults;
  property?: PropertyFollowupPolicy | null;
}): EffectiveFollowupPolicy {
  const intent = inferIntent(args.lead.type);

  // Enabled precedence: property (if set) -> lead (if set) -> agent default
  const propEnabled = args.property?.enabled;
  const leadEnabled =
    typeof args.lead.followups_enabled === "boolean" ? args.lead.followups_enabled : null;

  const enabled =
    typeof propEnabled === "boolean"
      ? propEnabled
      : typeof leadEnabled === "boolean"
        ? leadEnabled
        : !!args.agent.followups_enabled_default;

  // Max stage precedence: lead override -> property override -> agent default
  const leadOverride =
    args.lead.followups_max_stage_override === null ||
    typeof args.lead.followups_max_stage_override === "undefined"
      ? null
      : Number(args.lead.followups_max_stage_override);

  const propMax =
    intent === "rent" ? args.property?.max_stage_rent : args.property?.max_stage_buy;

  const agentMax =
    intent === "rent" ? args.agent.followups_max_stage_rent : args.agent.followups_max_stage_buy;

  const maxStage = clampInt(
    leadOverride ?? (typeof propMax === "number" ? propMax : null) ?? agentMax,
    0,
    2,
    2,
  );

  // Delay precedence: property override -> agent default
  const d1 = clampInt(
    typeof args.property?.stage1_delay_hours === "number"
      ? args.property.stage1_delay_hours
      : args.agent.followups_delay_hours_stage1,
    1,
    336,
    24,
  );

  const d2 = clampInt(
    typeof args.property?.stage2_delay_hours === "number"
      ? args.property.stage2_delay_hours
      : args.agent.followups_delay_hours_stage2,
    1,
    336,
    72,
  );

  return { enabled, maxStage, delayHoursStage1: d1, delayHoursStage2: d2, intent };
}

function computeNextAtForStage(policy: EffectiveFollowupPolicy, nextStage: number) {
  // nextStage: 1 -> stage1 delay; 2 -> stage2 delay
  if (nextStage <= 1) return addHoursIso(policy.delayHoursStage1);
  return addHoursIso(policy.delayHoursStage2);
}

async function loadActivePrompt(
  supabase: any,
  key: string,
): Promise<AiPromptRow | null> {
  const { data, error } = await (supabase.from("ai_prompts") as any)
    .select(
      "id,key,version,is_active,name,system_prompt,user_prompt,temperature,max_tokens,response_format",
    )
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[followups/run] prompt load failed:", error.message);
    return null;
  }

  if (!data) return null;

  return {
    id: String(data.id),
    key: String(data.key),
    version: Number(data.version ?? 1),
    is_active: Boolean(data.is_active),
    name: data.name ? String(data.name) : null,
    system_prompt: String(data.system_prompt || ""),
    user_prompt: String(data.user_prompt || ""),
    temperature: Number(data.temperature ?? 0.4),
    max_tokens: Number(data.max_tokens ?? 220),
    response_format: String(data.response_format ?? "json"),
  };
}

function pickFollowupPromptKey(stage: number) {
  // stage 0 = first follow-up, stage 1 = second follow-up
  if (stage <= 0) return "followup_stage_1";
  return "followup_stage_2";
}

async function azureGenerateFollowup(args: {
  lead: LeadRow;
  stage: number;
  messages: MessageCtx[];
  prompt: AiPromptRow;
}): Promise<AzureFollowupResult> {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");
  // Follow-ups use the same writer deployment as normal replies (prompt differs by key).
  // Keep a backwards-compatible fallback if an older env var is still set.
  const deployment =
    process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER ||
    process.env.AZURE_OPENAI_DEPLOYMENT_FOLLOWUPS ||
    process.env.AZURE_OPENAI_DEPLOYMENT_EMAIL_CLASSIFIER; // last-resort fallback

  if (!deployment) {
    return {
      ok: false,
      should_send: false,
      confidence: 0,
      text: "",
      hard_stop_reason: "missing_azure_deployment",
    };
  }

  const stageLabel =
    args.stage === 0
      ? "sanfter_reminder"
      : args.stage === 1
        ? "reaktivierung"
        : "abschluss_nudge";

  const history = args.messages.map((m) => ({
    role: m.sender === "agent" ? "assistant" : "user",
    content:
      safeString(m.text || m.snippet || m.subject || "", 1200) || "(leer)",
    timestamp: m.timestamp,
  }));

  const userCtx = {
    stage: args.stage,
    stage_label: stageLabel,
    lead: {
      id: args.lead.id,
      name: args.lead.name,
      email: args.lead.email,
      type: args.lead.type,
    },
    last_user_message_at: args.lead.last_user_message_at,
    last_agent_message_at: args.lead.last_agent_message_at,
    history,
  };

  const system = String(args.prompt.system_prompt || "").trim();
  const userPrompt = String(args.prompt.user_prompt || "").trim();

  if (!system || !userPrompt) {
    return {
      ok: false,
      should_send: false,
      confidence: 0,
      text: "",
      hard_stop_reason: "missing_prompt_content",
      reason: "Prompt row is missing system_prompt or user_prompt",
    };
  }

  const url = `${endpoint.replace(/\/+$/, "")}/openai/deployments/${encodeURIComponent(
    deployment,
  )}/chat/completions?api-version=2024-02-15-preview`;

  const wantJson =
    String(args.prompt.response_format || "json").toLowerCase() === "json";

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      temperature: Number.isFinite(args.prompt.temperature)
        ? Math.max(0, Math.min(2, Number(args.prompt.temperature)))
        : 0.4,
      max_tokens: Number.isFinite(args.prompt.max_tokens)
        ? Math.max(64, Math.min(800, Number(args.prompt.max_tokens)))
        : 220,
      ...(wantJson ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            `${userPrompt}\n\nCONTEXT_JSON:\n` + JSON.stringify(userCtx),
        },
      ],
    }),
  }).catch(() => null);

  if (!resp || !resp.ok) {
    const txt = await resp?.text().catch(() => "");
    return {
      ok: false,
      should_send: false,
      confidence: 0,
      text: "",
      reason: `azure_failed_${resp?.status ?? "network"}`,
      hard_stop_reason: safeString(txt, 300),
    };
  }

  const data = (await resp.json().catch(() => null)) as any;
  const content = data?.choices?.[0]?.message?.content;

  let parsed: any = null;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : null;
  } catch {
    parsed = null;
  }

  const shouldSend = Boolean(parsed?.should_send);
  const conf = Number(parsed?.confidence ?? 0);
  const text = safeString(parsed?.text ?? "", 2000).trim();

  return {
    ok: true,
    should_send: shouldSend,
    confidence: Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : 0,
    text: shouldSend ? text : "",
    reason: safeString(parsed?.reason ?? "", 600),
    hard_stop_reason: parsed?.hard_stop_reason
      ? safeString(parsed.hard_stop_reason, 200)
      : null,
  };
}

function hardStopReason(lead: LeadRow, policy?: EffectiveFollowupPolicy): string | null {
  // Enabled gate
  if (policy && !policy.enabled) return "disabled_by_policy";

  // No email -> cannot send
  if (!lead.email) return "missing_lead_email";

  // Paused into the future
  if (isFutureIso(lead.followup_paused_until)) return "paused";

  const stage = Math.max(0, Number(lead.followup_stage ?? 0));
  const maxStage = policy ? Math.max(0, policy.maxStage) : 2;
  if (stage >= maxStage) return "max_stage_reached";

  // If user messaged after agent last messaged -> do NOT follow up
  // (We only follow up when it's "agent waiting for user")
  const u = lead.last_user_message_at ? Date.parse(lead.last_user_message_at) : NaN;
  const a = lead.last_agent_message_at ? Date.parse(lead.last_agent_message_at) : NaN;

  if (Number.isFinite(u) && Number.isFinite(a) && u > a) {
    return "user_replied_last";
  }

  return null;
}

async function lockLeadForSending(
  supabase: any,
  leadId: string,
  agentId: string,
) {
  const lockIso = nowIso();

  // Acquire lock by switching followup_status -> "sending"
  // Only if it is currently planned/due/failed and next_at is due.
  const { data, error } = await (supabase.from("leads") as any)
    .update({
      followup_status: "sending",
      followup_stop_reason: null,
    })
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .in("followup_status", ["planned", "due", "failed"])
    .lte("followup_next_at", lockIso)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message };
  if (!data?.id) return { ok: false as const, error: "not_lockable" };

  return { ok: true as const, lockIso };
}

export async function POST(req: NextRequest) {
  if (!isInternal(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const body = (await req.json().catch(() => null)) as any;
  const limit = Math.max(1, Math.min(50, Number(body?.limit ?? 20)));
  const baseUrl = baseUrlFromReq(req);

  // 1) Load candidate leads that are due
  const { data: leads, error: leadsErr } = await (supabase.from("leads") as any)
    .select(
      [
        "id",
        "agent_id",
        "email",
        "name",
        "type",
        "property_id",
        "email_provider",
        "gmail_thread_id",
        "outlook_conversation_id",
        "followups_enabled",
        "followups_max_stage_override",
        "followup_paused_until",
        "followup_stage",
        "followup_next_at",
        "followup_status",
        "followup_stop_reason",
        "followup_last_sent_at",
        "last_user_message_at",
        "last_agent_message_at",
      ].join(","),
    )
    .or("followups_enabled.is.null,followups_enabled.eq.true")
    .in("followup_status", ["planned", "due", "failed"])
    .not("followup_next_at", "is", null)
    .lte("followup_next_at", nowIso())
    .order("followup_next_at", { ascending: true })
    .limit(limit);

  if (leadsErr) {
    return NextResponse.json(
      { error: "Failed to load due leads", details: leadsErr.message },
      { status: 500 },
    );
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, results: [] });
  }

  const results: any[] = [];

  // Preload agent follow-up defaults (one query for all agents in this batch)
  const agentIds: string[] = Array.from(
    new Set((leads as any[]).map((l) => String(l.agent_id)).filter(Boolean)),
  );

  const agentDefaultsMap = new Map<string, AgentFollowupDefaults>();

  if (agentIds.length > 0) {
    const { data: agentSettingsRows, error: asErr } = await (
      supabase.from("agent_settings") as any
    )
      .select(
        "agent_id, followups_enabled_default, followups_max_stage_rent, followups_max_stage_buy, followups_delay_hours_stage1, followups_delay_hours_stage2",
      )
      .in("agent_id", agentIds);

    if (asErr) {
      console.error("[followups/run] agent_settings load failed:", asErr.message);
    }

    for (const r of agentSettingsRows || []) {
      const id = String(r.agent_id);
      agentDefaultsMap.set(id, {
        followups_enabled_default: !!r.followups_enabled_default,
        followups_max_stage_rent: clampInt(r.followups_max_stage_rent, 0, 2, 2),
        followups_max_stage_buy: clampInt(r.followups_max_stage_buy, 0, 2, 2),
        followups_delay_hours_stage1: clampInt(r.followups_delay_hours_stage1, 1, 336, 24),
        followups_delay_hours_stage2: clampInt(r.followups_delay_hours_stage2, 1, 336, 72),
      });
    }
  }

  for (const raw of leads as LeadRow[]) {
    const leadId = String(raw.id);
    const agentId = String(raw.agent_id);

    try {
      // Resolve agent defaults (fail-open to safe defaults)
      const agentDefaults: AgentFollowupDefaults =
        agentDefaultsMap.get(agentId) ||
        ({
          followups_enabled_default: true,
          followups_max_stage_rent: 2,
          followups_max_stage_buy: 2,
          followups_delay_hours_stage1: 24,
          followups_delay_hours_stage2: 72,
        } as AgentFollowupDefaults);

      // Optional property overrides (only if lead.property_id is present)
      let propertyPolicy: PropertyFollowupPolicy | null = null;
      const propertyId = (raw as any)?.property_id ? String((raw as any).property_id) : null;

      if (propertyId) {
        const { data: pol, error: polErr } = await (
          supabase.from("property_followup_policies") as any
        )
          .select(
            "enabled, max_stage_rent, max_stage_buy, stage1_delay_hours, stage2_delay_hours",
          )
          .eq("agent_id", agentId)
          .eq("property_id", propertyId)
          .maybeSingle();

        if (polErr) {
          // Do not fail the run because of policy lookup; just ignore overrides.
          console.error(
            "[followups/run] property policy load failed:",
            polErr.message,
          );
        } else if (pol) {
          propertyPolicy = {
            enabled:
              typeof pol.enabled === "boolean" ? (pol.enabled as boolean) : null,
            max_stage_rent:
              typeof pol.max_stage_rent === "number" ? pol.max_stage_rent : null,
            max_stage_buy:
              typeof pol.max_stage_buy === "number" ? pol.max_stage_buy : null,
            stage1_delay_hours:
              typeof pol.stage1_delay_hours === "number" ? pol.stage1_delay_hours : null,
            stage2_delay_hours:
              typeof pol.stage2_delay_hours === "number" ? pol.stage2_delay_hours : null,
          };
        }
      }

      const policy = computeEffectivePolicy({
        lead: raw,
        agent: agentDefaults,
        property: propertyPolicy,
      });

      // 2) Hard deterministic stops (cheap + safe)
      const stop = hardStopReason(raw, policy);
      if (stop) {
        await (supabase.from("leads") as any)
          .update({
            followup_status: "idle",
            followup_stop_reason: stop,
            followup_next_at: null,
          })
          .eq("id", leadId)
          .eq("agent_id", agentId);

        results.push({ leadId, ok: true, skipped: true, reason: stop });
        continue;
      }

      // 3) Try lock (prevents double send by parallel runs)
      const lock = await lockLeadForSending(supabase, leadId, agentId);
      if (!lock.ok) {
        results.push({ leadId, ok: true, skipped: true, reason: lock.error });
        continue;
      }

      // 4) Load last messages for context
      const { data: msgs, error: msgsErr } = await (
        supabase.from("messages") as any
      )
        .select("id, sender, text, snippet, subject, timestamp")
        .eq("lead_id", leadId)
        .order("timestamp", { ascending: false })
        .limit(10);

      if (msgsErr)
        throw new Error(`Failed to load messages context: ${msgsErr.message}`);

      const messages = (msgs ?? []) as MessageCtx[];

      const stage = Math.max(0, Number(raw.followup_stage ?? 0));
      // If policy max stage is 0, never send.
      if (policy.maxStage <= 0) {
        await (supabase.from("leads") as any)
          .update({
            followup_status: "idle",
            followup_stop_reason: "max_stage_0",
            followup_next_at: null,
          })
          .eq("id", leadId)
          .eq("agent_id", agentId);

        results.push({ leadId, ok: true, skipped: true, reason: "max_stage_0" });
        continue;
      }
      const provider = normalizeProvider(raw.email_provider);

      // 5) Load active prompt for this stage + Azure followup generation
      const promptKey = pickFollowupPromptKey(stage);
      const prompt = await loadActivePrompt(supabase, promptKey);

      if (!prompt) {
        await (supabase.from("leads") as any)
          .update({
            followup_status: "failed",
            followup_stop_reason: `missing_active_prompt:${promptKey}`,
            followup_next_at: addMinutesIso(60),
          })
          .eq("id", leadId)
          .eq("agent_id", agentId);

        results.push({
          leadId,
          ok: false,
          step: "prompt",
          error: `missing_active_prompt:${promptKey}`,
        });
        continue;
      }

      const ai = await azureGenerateFollowup({
        lead: raw,
        stage,
        messages,
        prompt,
      });

      if (!ai.ok) {
        // backoff retry
        await (supabase.from("leads") as any)
          .update({
            followup_status: "failed",
            followup_stop_reason:
              ai.hard_stop_reason || ai.reason || "ai_failed",
            followup_next_at: addMinutesIso(30),
          })
          .eq("id", leadId)
          .eq("agent_id", agentId);

        results.push({ leadId, ok: false, step: "ai", error: ai.reason });
        continue;
      }

      if (!ai.should_send || ai.confidence < 0.7 || !ai.text.trim()) {
        await (supabase.from("leads") as any)
          .update({
            followup_status: "idle",
            followup_stop_reason: ai.hard_stop_reason || "ai_says_no",
            followup_next_at: null,
          })
          .eq("id", leadId)
          .eq("agent_id", agentId);

        results.push({
          leadId,
          ok: true,
          skipped: true,
          reason: ai.hard_stop_reason || "ai_says_no",
          confidence: ai.confidence,
        });
        continue;
      }

      const subject = `Re: ${safeString(raw.type ?? "Anfrage", 120)}`;
      const text = ai.text.trim();

      // 6) Enqueue draft for unified sender pipeline.
      // We create a draft message row (required for Outlook; also keeps audit trail consistent)
      // and mark it `ready_to_send` so `/api/pipeline/reply-ready/send/run` can pick it up.
      const now = nowIso();

      const { data: inserted, error: insErr } = await (
        supabase.from("messages") as any
      )
        .insert({
          agent_id: agentId,
          lead_id: leadId,
          sender: "agent",
          text,
          timestamp: now,
          was_followup: true,
          email_provider: provider,
          send_status: "pending",
          approval_required: false,
          status: "ready_to_qa",
          // best-effort threading hints (safe for providers that ignore)
          gmail_thread_id: raw.gmail_thread_id ?? null,
          outlook_conversation_id: raw.outlook_conversation_id ?? null,
        })
        .select("id")
        .single();

      if (insErr || !inserted?.id) {
        throw new Error(
          insErr?.message || "Failed to create follow-up draft message row",
        );
      }

      // 7) Run QA pipeline first (follow-ups should also pass QC/rewrite gates)
      const internalSecret = mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET");

      const qaRes = await fetch(`${baseUrl}/api/pipeline/reply-ready/qa/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-advaic-internal-secret": internalSecret,
        },
        // This route currently pulls from DB; body is optional.
        body: JSON.stringify({}),
      }).catch(() => null);

      if (!qaRes || !qaRes.ok) {
        const txt = await qaRes?.text().catch(() => "");

        // Fail-closed: move to human approval and retry lead later.
        await (supabase.from("messages") as any)
          .update({
            status: "needs_human",
            approval_required: true,
            send_status: "failed",
            send_error: safeString(
              txt || `qa_runner_failed_${qaRes?.status ?? "network"}`,
              2000,
            ),
          })
          .eq("id", String(inserted.id));

        await (supabase.from("leads") as any)
          .update({
            followup_status: "failed",
            followup_stop_reason: safeString(
              txt || `qa_runner_failed_${qaRes?.status ?? "network"}`,
              2000,
            ),
            followup_next_at: addMinutesIso(30),
          })
          .eq("id", leadId)
          .eq("agent_id", agentId);

        results.push({
          leadId,
          ok: false,
          step: "qa_runner",
          error: safeString(txt || "qa_runner_failed", 500),
        });

        continue;
      }

      // After QA runner, re-check the drafted message status. If QA requires approval/human,
      // we should stop the follow-up loop for this lead (so it doesn't keep retrying).
      const { data: msgAfterQa, error: msgAfterQaErr } = await (
        supabase.from("messages") as any
      )
        .select("id,status,approval_required,send_status")
        .eq("id", String(inserted.id))
        .maybeSingle();

      if (msgAfterQaErr) {
        console.error(
          "[followups/run] Failed to read message after QA:",
          msgAfterQaErr.message,
        );
      }

      const qaStatus = String((msgAfterQa as any)?.status || "").toLowerCase();
      const qaNeedsApproval = Boolean((msgAfterQa as any)?.approval_required);

      if (qaNeedsApproval || qaStatus.startsWith("needs_")) {
        await (supabase.from("leads") as any)
          .update({
            followup_status: "idle",
            followup_stop_reason: "needs_approval",
            followup_next_at: null,
          })
          .eq("id", leadId)
          .eq("agent_id", agentId);

        results.push({
          leadId,
          ok: true,
          skipped: true,
          reason: "needs_approval",
          message_id: String(inserted.id),
        });

        continue;
      }

      // 8) Trigger unified sender runner (it will route to Gmail/Outlook and handle idempotency/locks)
      const runnerRes = await fetch(
        `${baseUrl}/api/pipeline/reply-ready/send/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-advaic-internal-secret": internalSecret,
          },
          // This route currently pulls from DB; body is optional.
          body: JSON.stringify({}),
        },
      ).catch(() => null);

      if (!runnerRes || !runnerRes.ok) {
        const txt = await runnerRes?.text().catch(() => "");

        // Backoff retry if sender runner failed.
        await (supabase.from("leads") as any)
          .update({
            followup_status: "failed",
            followup_stop_reason: safeString(
              txt || `sender_runner_failed_${runnerRes?.status ?? "network"}`,
              2000,
            ),
            followup_next_at: addMinutesIso(30),
          })
          .eq("id", leadId)
          .eq("agent_id", agentId);

        results.push({
          leadId,
          ok: false,
          step: "send_runner",
          error: safeString(txt || "sender_runner_failed", 500),
        });

        continue;
      }

      // Mark as planned/sending until provider send routes advance stage.
      // If the sender runner is asynchronous, this prevents repeated locks within the same window.
      await (supabase.from("leads") as any)
        .update({
          followup_status: "planned",
          followup_stop_reason: null,
          // Keep next_at null here; provider send routes will set the next stage schedule.
          followup_next_at: null,
        })
        .eq("id", leadId)
        .eq("agent_id", agentId);

      // IMPORTANT: We do NOT advance follow-up stage here.
      // Provider send routes (Gmail/Outlook) advance follow-up fields when `was_followup=true`.
      results.push({
        leadId,
        ok: true,
        enqueued: true,
        provider,
        message_id: String(inserted.id),
      });
    } catch (e: any) {
      const errMsg = safeString(e?.message || e, 2000);

      // Backoff retry
      await (supabase.from("leads") as any)
        .update({
          followup_status: "failed",
          followup_stop_reason: errMsg,
          followup_next_at: addMinutesIso(30),
        })
        .eq("id", leadId)
        .eq("agent_id", agentId);

      results.push({ leadId, ok: false, error: errMsg });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}
