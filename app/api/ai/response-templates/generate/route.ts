import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type Body = {
  prompt?: string;
};

type AgentStyleRow = {
  agent_id: string;
  brand_name: string | null;
  language: string | null;
  tone: string | null;
  formality: string | null;
  length_pref: string | null;
  emoji_level: string | null;
  sign_off: string | null;
  do_rules: string | null;
  dont_rules: string | null;
  example_phrases: string | null;
};

async function callAzureChat(args: { system: string; user: string }) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
  const apiKey = process.env.AZURE_OPENAI_API_KEY!;
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES!;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      temperature: 0.4,
      max_tokens: 450,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Azure error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Azure returned empty content");
  return String(content);
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const prompt = String(body?.prompt ?? "").trim();
  if (!prompt) return jsonError("Missing prompt", 400);

  // Supabase auth via cookies
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

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return jsonError("Unauthorized", 401);

  const agentId = auth.user.id;

  // Load agent_style (optional)
  const { data: styleData } = await supabase
    .from("agent_style")
    .select(
      "agent_id, brand_name, language, tone, formality, length_pref, emoji_level, sign_off, do_rules, dont_rules, example_phrases"
    )
    .eq("agent_id", agentId)
    .maybeSingle();

  const style = (styleData as any as AgentStyleRow | null) ?? null;

  // Optional: load prompt from ai_prompts (fallback to hardcoded)
  // NOTE: If you keep ai_prompts readable only to service role, move this fetch to a service client.
  let baseSystemPrompt = `
Du bist ein Assistent für Immobilienmakler und erstellst "Antwortvorlagen".
Output IMMER als reines JSON mit exakt diesen Keys:
{ "title": string, "category": string, "content": string }

Regeln:
- Deutsch, klar, professionell.
- Keine Halluzinationen. Keine Fakten erfinden.
- "content" darf Platzhalter enthalten wie {{NAME}} oder {{TERMIN}}.
- Kurze, umsetzbare Vorlage (nicht Roman).
- Kein Markdown, nur JSON.
`.trim();

  // If you want to load from ai_prompts by key (optional)
  // const { data: p } = await supabase.from("ai_prompts").select("content").eq("key","chat_templates_generate").maybeSingle();
  // if (p?.content) baseSystemPrompt = p.content;

  const styleBlock = `
Agent Style (falls vorhanden):
- brand_name: ${style?.brand_name ?? "Advaic"}
- language: ${style?.language ?? "de"}
- tone: ${style?.tone ?? "professionell, freundlich"}
- formality: ${style?.formality ?? "Sie-Form"}
- length_pref: ${style?.length_pref ?? "kurz"}
- emoji_level: ${style?.emoji_level ?? "keine"}
- sign_off: ${style?.sign_off ?? "Viele Grüße"}
- do_rules: ${style?.do_rules ?? ""}
- dont_rules: ${style?.dont_rules ?? ""}
- example_phrases: ${style?.example_phrases ?? ""}
`.trim();

  const system = `${baseSystemPrompt}\n\n${styleBlock}`;

  const user = `
Erstelle eine neue Antwortvorlage basierend auf dieser Beschreibung:

"${prompt}"

Achte darauf, dass title + category sinnvoll sind.
`.trim();

  try {
    const raw = await callAzureChat({ system, user });

    // The model might wrap JSON with text -> try to extract
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    const jsonStr =
      firstBrace >= 0 && lastBrace > firstBrace
        ? raw.slice(firstBrace, lastBrace + 1)
        : raw;

    const parsed = safeJsonParse<{
      title?: string;
      category?: string;
      content?: string;
    }>(jsonStr);

    const title = String(parsed?.title ?? "").trim();
    const category = String(parsed?.category ?? "").trim();
    const content = String(parsed?.content ?? "").trim();

    if (!title || !content) {
      return jsonError("AI output invalid (missing title/content)", 502);
    }

    return NextResponse.json({ title, category, content });
  } catch (e: any) {
    console.error("AI generate error:", e);
    return jsonError("AI generation failed", 500);
  }
}
