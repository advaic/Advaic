import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Body = {
  prompt?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}

function getAzureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  // Use task-scoped deployment name for this route
  const deployment =
    process.env.AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES ||
    process.env.AZURE_OPENAI_DEPLOYMENT; // fallback for older setups

  // Keep one shared API version across the project
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

  if (!endpoint || !apiKey || !deployment) {
    throw new Error(
      "Missing Azure env vars. Need AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES (or AZURE_OPENAI_DEPLOYMENT)."
    );
  }

  const base = endpoint.replace(/\/+$/, "");

  return { base, apiKey, deployment, apiVersion };
}

async function getUserAndToneStyle(req: NextRequest) {
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

  if (authErr || !user) return { user: null as any, style: "" };

  const { data: toneRow } = await supabase
    .from("agent_tone_style")
    .select("style_instructions")
    .eq("agent_id", user.id)
    .maybeSingle();

  const style = safeTrim((toneRow as any)?.style_instructions);
  return { user, style };
}

function coerceTemplateJson(raw: string) {
  const trimmed = raw.trim();

  // direct JSON first
  try {
    return JSON.parse(trimmed);
  } catch {}

  // then extract the first JSON object
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const maybe = trimmed.slice(firstBrace, lastBrace + 1);
    return JSON.parse(maybe);
  }

  throw new Error("Model did not return valid JSON");
}

async function callAzureChatCompletion(args: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const { base, apiKey, deployment, apiVersion } = getAzureConfig();

  // Azure OpenAI Chat Completions endpoint
  const url = `${base}/openai/deployments/${encodeURIComponent(
    deployment
  )}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
      temperature: args.temperature ?? 0.4,
      max_tokens: args.maxTokens ?? 400,
      // If your deployment supports it you can uncomment later:
      // response_format: { type: "json_object" },
    }),
  });

  // Azure returns JSON error bodies; include them for debugging
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Azure OpenAI error (${resp.status}): ${text || resp.statusText}`
    );
  }

  const data = (await resp.json()) as any;
  const content =
    data?.choices?.[0]?.message?.content?.toString?.() ??
    data?.choices?.[0]?.message?.content ??
    "";

  return String(content || "");
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const prompt = safeTrim(body?.prompt);

  if (!prompt) return jsonError("Missing prompt", 400);

  // Auth + style
  const { user, style } = await getUserAndToneStyle(req);
  if (!user) return jsonError("Unauthorized", 401);

  const system = `
You are Advaic, an assistant that writes short response templates for real estate agents in German.

OUTPUT RULES:
- Return ONLY valid JSON.
- JSON schema:
  {
    "title": string,        // short and clear
    "content": string,      // template text (no placeholders like {name} unless requested)
    "category": string      // optional category label (e.g., "Besichtigung", "Nachfrage", "Absage", "Allgemein")
  }
- The content must be professional, clear, and ready to send.
- Keep it concise: typically 2–6 sentences.
- If the user prompt is vague, still produce a sensible "Allgemein" template without asking questions.

TONE & STYLE INSTRUCTIONS (agent-specific):
${
  style
    ? style
    : "No custom tone & style provided. Default: neutral-professional, polite, clear."
}
`.trim();

  const userMsg = `
Create one response template based on this description:
"${prompt}"
`.trim();

  try {
    const text = await callAzureChatCompletion({
      system,
      user: userMsg,
      temperature: 0.4,
      maxTokens: 400,
    });

    const obj = coerceTemplateJson(text);

    const title = safeTrim(obj?.title);
    const content = safeTrim(obj?.content);
    const category = safeTrim(obj?.category);

    if (!title || !content) {
      return jsonError("AI output incomplete", 502);
    }

    return NextResponse.json({
      title,
      content,
      category: category || "Allgemein",
    });
  } catch (e: any) {
    console.error("AI route error:", e);
    return jsonError(e?.message ?? "AI generation failed", 500);
  }
}
