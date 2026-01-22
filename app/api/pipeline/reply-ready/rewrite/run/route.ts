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
  // We often fetch newest-first; rewrite prompts work better oldest->newest.
  const ordered = [...ctx].reverse();
  return ordered.map((m) => `- ${m.sender}: ${m.text}`).join("\n");
}

async function callAzureRewrite(args: {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}) {
  const endpoint = mustEnv("AZURE_OPENAI_ENDPOINT");
  const apiKey = mustEnv("AZURE_OPENAI_API_KEY");
  const deployment = mustEnv("AZURE_OPENAI_DEPLOYMENT_REPLY_REWRITE");

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
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

export async function POST() {
  const supabase = supabaseAdmin();

  const PROMPT_KEY = "rewrite_reply_v1";

  // 1) Load active rewrite prompt
  const { data: prompt } = await (supabase.from("ai_prompts") as any)
    .select("system_prompt, user_prompt, temperature, max_tokens, version")
    .eq("key", PROMPT_KEY)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prompt) {
    return NextResponse.json(
      { error: "Active rewrite prompt not found" },
      { status: 500 }
    );
  }

  // 2) Load drafts that are waiting for rewrite (set by QA runner on warn)
  const { data: drafts } = await (supabase.from("messages") as any)
    .select("id, lead_id, agent_id, text")
    .eq("sender", "assistant")
    .eq("status", "rewrite_pending")
    .order("timestamp", { ascending: true })
    .limit(25);

  const processed: any[] = [];

  for (const draft of drafts || []) {
    const draftId = String(draft.id);
    const leadId = String(draft.lead_id);
    const agentId = String(draft.agent_id);

    // Load the latest inbound user message for this lead (anchor for rewrite)
    const { data: inboundMsg } = await (supabase.from("messages") as any)
      .select("id, text")
      .eq("lead_id", leadId)
      .eq("sender", "user")
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!inboundMsg) {
      // If we can't find an inbound anchor, fail-closed: keep it for human.
      await (supabase.from("messages") as any)
        .update({ status: "needs_human", approval_required: true })
        .eq("id", draftId);
      processed.push({ draftId, nextStatus: "needs_human", reason: "no_inbound_anchor" });
      continue;
    }

    // Skip if already rewritten with this active prompt version
    const { data: already } = await (supabase.from("message_qas") as any)
      .select("id")
      .eq("draft_message_id", draftId)
      .eq("prompt_key", PROMPT_KEY)
      .eq("prompt_version", `v${prompt.version}`)
      .maybeSingle();

    if (already) continue;

    const { data: ctx } = await (supabase.from("messages") as any)
      .select("sender, text")
      .eq("lead_id", leadId)
      .order("timestamp", { ascending: false })
      .limit(10);

    const { data: lead } = await (supabase.from("leads") as any)
      .select("priority")
      .eq("id", leadId)
      .maybeSingle();

    const userPrompt = String(prompt.user_prompt || "")
      .replaceAll("{{INBOUND_MESSAGE}}", String(inboundMsg?.text || ""))
      .replaceAll("{{ORIGINAL_DRAFT}}", String(draft.text || ""))
      .replaceAll("{{THREAD_CONTEXT}}", formatThreadContext(ctx || []))
      .replaceAll("{{LEAD_PRIORITY}}", String(lead?.priority ?? 2));

    const rewritten = await callAzureRewrite({
      system: prompt.system_prompt,
      user: userPrompt,
      temperature: Number(prompt.temperature ?? 0.2),
      maxTokens: Number(prompt.max_tokens ?? 420),
    });

    if (!rewritten) continue;

    // Replace draft text and move to QA recheck stage
    await (supabase.from("messages") as any)
      .update({
        text: rewritten,
        status: "qa_recheck_pending",
        approval_required: false,
      })
      .eq("id", draftId);

    // Log rewrite artifact (audit)
    await (supabase.from("message_qas") as any).insert({
      agent_id: agentId,
      lead_id: leadId,
      inbound_message_id: inboundMsg.id,
      draft_message_id: draftId,
      verdict: "rewritten",
      reason: "rewrite_applied",
      prompt_key: PROMPT_KEY,
      prompt_version: `v${prompt.version}`,
      model: "azure",
    });

    processed.push({ draftId, nextStatus: "qa_recheck_pending" });
  }

  return NextResponse.json({ ok: true, processed });
}
