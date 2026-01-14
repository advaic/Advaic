import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = { prompt?: string };

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}

function coerceTemplateJson(raw: string) {
  const trimmed = raw.trim();

  // direct JSON
  try {
    return JSON.parse(trimmed);
  } catch {}

  // extract first {...}
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    return JSON.parse(slice);
  }

  throw new Error("Model did not return valid JSON");
}

function renderTemplate(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    // replace {{key}} with value
    out = out.replaceAll(`{{${k}}}`, v ?? "");
  }
  return out;
}

async function getSupabaseAndUser(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  return { supabase, user: authErr ? null : user };
}

async function loadAgentStyle(
  supabase: ReturnType<typeof createServerClient<Database>>,
  agentId: string
) {
  const { data } = await supabase
    .from("agent_tone_style")
    .select("style_instructions")
    .eq("agent_id", agentId)
    .maybeSingle();

  return safeTrim((data as any)?.style_instructions);
}

async function loadPrompt(
  supabase: ReturnType<typeof createServerClient<Database>>,
  key: string
) {
  const { data, error } = await supabase
    .from("ai_prompts")
    .select(
      "key, name, description, system_prompt, user_prompt, response_format, temperature, max_tokens, is_active"
    )
    .eq("key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Prompt not found/active: ${key}`);

  return data as any;
}

async function callAzureChat({
  system,
  user,
  temperature,
  max_tokens,
}: {
  system: string;
  user: string;
  temperature: number;
  max_tokens: number;
}) {
  const endpoint = safeTrim(process.env.AZURE_OPENAI_ENDPOINT);
  const apiKey = safeTrim(process.env.AZURE_OPENAI_API_KEY);
  const deployment = safeTrim(
    process.env.AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES
  );
  const apiVersion =
    safeTrim(process.env.AZURE_OPENAI_API_VERSION) || "2024-02-15-preview";

  if (!endpoint || !apiKey || !deployment) {
    throw new Error(
      "Azure env missing. Need AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES."
    );
  }

  const base = endpoint.replace(/\/+$/, "");
  const url = `${base}/openai/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(
    apiVersion
  )}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
      max_tokens,
      // If your deployment supports JSON mode, you can try:
      // response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Azure error (${resp.status}): ${text || resp.statusText}`);
  }

  const json = await resp.json();
  const content =
    json?.choices?.[0]?.message?.content?.toString?.() ??
    json?.choices?.[0]?.message?.content ??
    "";

  return String(content ?? "");
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const prompt = safeTrim(body?.prompt);
  if (!prompt) return jsonError("Missing prompt", 400);

  // Auth
  const { supabase, user } = await getSupabaseAndUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  // Load agent style
  const style =
    (await loadAgentStyle(supabase, user.id)) ||
    "No custom tone & style provided. Default: neutral-professional, polite, clear.";

  // Load prompt definition from registry
  let promptRow: any;
  try {
    promptRow = await loadPrompt(supabase, "chat_templates.generate");
  } catch (e: any) {
    return jsonError(e?.message ?? "Could not load prompt", 500);
  }

  // Render templates with variables
  const system = renderTemplate(safeTrim(promptRow.system_prompt), { style });
  const userMsg = renderTemplate(safeTrim(promptRow.user_prompt), { prompt });

  const temperature = Number.isFinite(Number(promptRow.temperature))
    ? Number(promptRow.temperature)
    : 0.4;

  const max_tokens = Number.isFinite(Number(promptRow.max_tokens))
    ? Number(promptRow.max_tokens)
    : 400;

  try {
    const raw = await callAzureChat({
      system,
      user: userMsg,
      temperature,
      max_tokens,
    });

    const obj = coerceTemplateJson(raw);

    const title = safeTrim(obj?.title);
    const content = safeTrim(obj?.content);
    const category = safeTrim(obj?.category) || "Allgemein";

    if (!title || !content) return jsonError("AI output incomplete", 502);

    return NextResponse.json({ title, content, category });
  } catch (e: any) {
    console.error("AI route error:", e);
    return jsonError(e?.message ?? "AI generation failed", 500);
  }
}
