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

function formatThreadContext(ctx: any[]) {
  if (!Array.isArray(ctx) || ctx.length === 0) return "";
  return ctx.map((m) => `- ${m.sender}: ${m.text}`).join("\n");
}

async function callAzureQaLabel(args: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}) {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");

  // Optional: eigenes Deployment. Fallback auf allgemeines QA Deployment.
  const deployment =
    process.env.AZURE_OPENAI_DEPLOYMENT_QA_RECHECK ||
    process.env.AZURE_OPENAI_DEPLOYMENT_QA;

  if (!deployment) return null;

  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      temperature: args.temperature,
      max_tokens: args.maxTokens,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    }),
  }).catch(() => null);

  if (!resp || !resp.ok) return null;

  const data = await resp.json().catch(() => null);
  const out = data?.choices?.[0]?.message?.content;
  const label = typeof out === "string" ? out.trim().toLowerCase() : "";
  if (!["pass", "warn", "fail"].includes(label)) return "fail"; // fail-closed
  return label as "pass" | "warn" | "fail";
}

export async function POST() {
  const supabase = supabaseAdmin();

  const PROMPT_KEY = "qa_recheck_v1";

  // 1) Load active prompt
  const { data: prompt } = await (supabase.from("ai_prompts") as any)
    .select(
      "key, version, is_active, system_prompt, user_prompt, temperature, max_tokens"
    )
    .eq("key", PROMPT_KEY)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prompt?.system_prompt || !prompt?.user_prompt) {
    return NextResponse.json(
      { error: "Active qa_recheck_v1 prompt not found or incomplete" },
      { status: 500 }
    );
  }

  const temperature = Number(prompt.temperature ?? 0);
  const maxTokens = Number(prompt.max_tokens ?? 5);

  // 2) Find rewritten drafts
  // IMPORTANT: nur "assistant" drafts prüfen
  const { data: drafts, error: draftsErr } = await (
    supabase.from("messages") as any
  )
    .select("id, agent_id, lead_id, text, status, sender, timestamp")
    .eq("sender", "assistant")
    .eq("status", "rewritten")
    .order("timestamp", { ascending: true })
    .limit(25);

  if (draftsErr) {
    return NextResponse.json(
      { error: "Failed to load rewritten drafts", details: draftsErr.message },
      { status: 500 }
    );
  }

  const processed: any[] = [];

  for (const d of drafts || []) {
    const draftId = String(d.id);
    const agentId = String(d.agent_id);
    const leadId = String(d.lead_id);

    // 2.1) Idempotency: skip if already rechecked
    const { data: existing } = await (supabase.from("message_qas") as any)
      .select("id")
      .eq("draft_message_id", draftId)
      .eq("prompt_key", PROMPT_KEY)
      .maybeSingle();

    if (existing) continue;

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
        .update({ status: "needs_human", approval_required: true })
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
      2000
    );
    const rewrittenReply = String(d.text || "").slice(0, 2400);

    // 4) Load last 10 context messages
    const { data: ctx } = await (supabase.from("messages") as any)
      .select("sender, text")
      .eq("lead_id", leadId)
      .order("timestamp", { ascending: false })
      .limit(10);

    const threadContext = formatThreadContext(ctx || []);

    // 5) Build prompt
    const userPrompt = String(prompt.user_prompt)
      .replaceAll("{{INBOUND_MESSAGE}}", inboundText)
      .replaceAll("{{REWRITTEN_REPLY}}", rewrittenReply)
      .replaceAll("{{THREAD_CONTEXT}}", threadContext);

    // 6) Call QA model
    const verdict = await callAzureQaLabel({
      system: String(prompt.system_prompt),
      user: userPrompt,
      temperature,
      maxTokens,
    });

    const finalVerdict = verdict ?? "fail";

    // 7) Persist QA artifact
    await (supabase.from("message_qas") as any).insert({
      agent_id: agentId,
      lead_id: leadId,
      inbound_message_id: inboundMessageId,
      draft_message_id: draftId,
      verdict: finalVerdict,
      reason: "qa_recheck",
      prompt_key: PROMPT_KEY,
      prompt_version: `v${prompt.version ?? 1}`,
      model: "azure",
    });

    // 8) Autosend gate
    const { data: settings } = await (supabase.from("agent_settings") as any)
      .select("autosend_enabled")
      .eq("agent_id", agentId)
      .maybeSingle();

    const autosendEnabled = !!settings?.autosend_enabled;

    // 9) Update draft status + approval
    if (finalVerdict === "pass") {
      await (supabase.from("messages") as any)
        .update({
          approval_required: autosendEnabled ? false : true,
          status: autosendEnabled ? "ready_to_send" : "needs_approval",
          visible_to_agent: true,
        })
        .eq("id", draftId);
    } else if (finalVerdict === "warn") {
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
