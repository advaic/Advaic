import { NextRequest, NextResponse } from "next/server";
import {
  buildPublicKnowledgePromptContext,
  retrievePublicKnowledge,
  type PublicKnowledgeSource,
} from "@/lib/marketing/public-assistant-knowledge";

export const runtime = "nodejs";

type Role = "user" | "assistant";

type ChatMessage = {
  role: Role;
  content: string;
};

type RequestBody = {
  messages?: ChatMessage[];
  path?: string | null;
};

type AssistantResponse = {
  answer: string;
  cta_label?: string;
  cta_href?: string;
  follow_up_question?: string;
  follow_up_suggestions?: string[];
  suggested_questions?: string[];
};

type AssistantApiSuccess = {
  answer: string;
  cta_label?: string;
  cta_href?: string;
  follow_up_question?: string;
  follow_up_suggestions?: string[];
  sources?: Array<{ title: string; href: string }>;
};

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 25;
const MAX_INPUT_CHARS = 1200;
const MAX_HISTORY = 10;
const MAX_OUTPUT_TOKENS = 520;

const ALLOWED_CTA_HREFS = new Set<string>([
  "/signup",
  "/produkt",
  "/so-funktionierts",
  "/preise",
  "/sicherheit",
  "/autopilot-regeln",
  "/follow-up-logik",
  "/freigabe-inbox",
  "/produkt/capabilities",
  "/faq",
  "/trust",
  "/nutzungsbedingungen",
]);

const DEFAULT_SYSTEM_PROMPT = `
Du bist der öffentliche Assistent von Advaic für Immobilienmakler in Deutschland.

Dein Ziel:
1) Fragen zum Produkt klar und präzise beantworten.
2) Fragen zum Makleralltag praxisnah beantworten.
3) In einem sinnvollen Maß sales-orientiert helfen, ohne zu drängen.

Produktfakten:
- Advaic beantwortet Interessenten-Anfragen per E-Mail.
- Bei klaren Standardfällen kann automatisch geantwortet werden.
- Unklare oder riskante Fälle gehen zur Freigabe.
- Vor dem Versand laufen Qualitätschecks (u. a. Relevanz, Kontext, Vollständigkeit, Ton und Risiko).
- Follow-ups laufen regelbasiert und stoppen bei Antwort oder Stop-Kriterium.
- Alles ist im Verlauf nachvollziehbar (Eingang → Entscheidung → Versand).

Wichtige Regeln:
- Sprache: Deutsch, Du-Ansprache, klar und konkret.
- Keine Buzzwords, keine Übertreibung, keine erfundenen Zahlen, keine erfundenen Referenzen.
- Wenn dir Fakten fehlen, sag das offen und gib eine sichere nächste Aktion.
- Keine Rechts-, Steuer- oder Finanzberatung. Weisen auf fachliche Beratung hin, falls nötig.
- Wenn passend, schlage genau eine nächste Aktion vor (z. B. /signup oder /produkt).

Antwortformat:
Gib AUSSCHLIESSLICH valides JSON zurück:
{
  "answer": "string",
  "cta_label": "string optional",
  "cta_href": "string optional",
  "follow_up_question": "string optional",
  "follow_up_suggestions": ["string", "string"]
}
`.trim();

const DEFAULT_USER_PROMPT_TEMPLATE = `
Kontextseite: {{PATH}}
Letzte Frage des Nutzers: {{LATEST_QUESTION}}
Relevante interne Quellen:
{{KNOWLEDGE_CONTEXT}}

Antworte hilfreich und konkret.
Nutze bevorzugt die internen Quellen oben.
Wenn die Antwort nicht sicher aus den Quellen ableitbar ist, sage das offen und bleibe vorsichtig.
Wenn die Frage Dashboard-Funktionen betrifft, erkläre den Capability-Umfang der App-Bereiche präzise.
Behaupte niemals Live-Kontostände, individuelle Nutzerdaten oder Echtzeitwerte aus dem Dashboard.
Wenn sinnvoll, gib genau eine CTA mit cta_label + cta_href aus.
Wenn keine CTA sinnvoll ist, lasse beide Felder weg.
Gib immer 1-2 kurze follow_up_suggestions zurück, die direkt zur letzten Nutzerfrage passen.
`.trim();

declare global {
  // eslint-disable-next-line no-var
  var __advaic_public_chat_rl_v1:
    | Map<string, { count: number; resetAt: number }>
    | undefined;
}

function jsonError(status: number, error: string, details?: string) {
  return NextResponse.json(
    { error, ...(details ? { details } : {}) },
    { status },
  );
}

function getRateMap() {
  if (!globalThis.__advaic_public_chat_rl_v1) {
    globalThis.__advaic_public_chat_rl_v1 = new Map();
  }
  return globalThis.__advaic_public_chat_rl_v1;
}

function getClientIp(req: NextRequest) {
  const forwarded = String(req.headers.get("x-forwarded-for") || "").trim();
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = String(req.headers.get("x-real-ip") || "").trim();
  if (realIp) return realIp;
  return "unknown";
}

function enforceRateLimit(ip: string) {
  const now = Date.now();
  const map = getRateMap();
  const key = ip || "unknown";
  const existing = map.get(key);

  if (!existing || existing.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );
    return { allowed: false, retryAfterSec };
  }

  existing.count += 1;
  map.set(key, existing);
  return { allowed: true, retryAfterSec: 0 };
}

function safeText(input: unknown, maxChars: number) {
  return String(input || "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

function sanitizeMessages(raw: unknown): ChatMessage[] {
  const arr = Array.isArray(raw) ? raw : [];
  const cleaned: ChatMessage[] = [];

  for (const item of arr) {
    const role = (item as any)?.role === "assistant" ? "assistant" : "user";
    const content = safeText((item as any)?.content, MAX_INPUT_CHARS);
    if (!content) continue;
    cleaned.push({ role, content });
  }

  const last = cleaned.slice(-MAX_HISTORY);
  return last;
}

function tryExtractJson(raw: string): AssistantResponse | null {
  const text = String(raw || "").trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  const candidate =
    first >= 0 && last > first ? text.slice(first, last + 1) : text;

  try {
    const parsed = JSON.parse(candidate) as AssistantResponse;
    if (!parsed || typeof parsed !== "object") return null;
    if (!String(parsed.answer || "").trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeCta(
  label: unknown,
  href: unknown,
): { cta_label?: string; cta_href?: string } {
  const ctaLabel = safeText(label, 80);
  const ctaHref = safeText(href, 120);
  if (!ctaLabel || !ctaHref) return {};
  if (!ALLOWED_CTA_HREFS.has(ctaHref)) return {};
  return { cta_label: ctaLabel, cta_href: ctaHref };
}

function normalizeSourcesForResponse(sources: PublicKnowledgeSource[]) {
  return sources.slice(0, 3).map((source) => ({
    title: source.title,
    href: source.href,
  }));
}

function normalizeForMatch(input: string) {
  return String(input || "")
    .toLowerCase()
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/[ß]/g, "ss");
}

function uniqueTrimmed(values: unknown[]) {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of values) {
    const value = safeText(raw, 140);
    if (!value) continue;
    const key = normalizeForMatch(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }

  return out;
}

function fallbackFollowupSuggestions(args: {
  question: string;
  answer: string;
  path: string;
  sources: PublicKnowledgeSource[];
}) {
  const text = normalizeForMatch(
    [args.question, args.answer, args.path, ...args.sources.map((s) => `${s.title} ${s.href}`)].join(" "),
  );

  if (
    text.includes("dsgvo") ||
    text.includes("datenschutz") ||
    text.includes("sicherheit") ||
    text.includes("risiko") ||
    text.includes("freigabe")
  ) {
    return [
      "Wann geht eine Nachricht automatisch zur Freigabe?",
      "Welche Qualitätschecks greifen vor jedem Versand?",
    ];
  }

  if (
    text.includes("autopilot") ||
    text.includes("automatisch") ||
    text.includes("auto senden") ||
    text.includes("autosend")
  ) {
    return [
      "Wie starte ich Autopilot konservativ mit wenig Risiko?",
      "Welche Fälle werden ignoriert statt beantwortet?",
    ];
  }

  if (
    text.includes("follow-up") ||
    text.includes("followup") ||
    text.includes("nachfassen")
  ) {
    return [
      "Nach welchen Regeln stoppen Follow-ups automatisch?",
      "Wie stelle ich Follow-ups pro Immobilie ein?",
    ];
  }

  if (
    text.includes("dashboard") ||
    text.includes("/app") ||
    text.includes("wo finde") ||
    text.includes("funktion")
  ) {
    return [
      "Wo finde ich diese Funktion im Dashboard genau?",
      "Welche Guardrails gelten in diesem Bereich?",
    ];
  }

  if (
    text.includes("preis") ||
    text.includes("kosten") ||
    text.includes("trial") ||
    text.includes("starter")
  ) {
    return [
      "Was passiert nach den 14 Tagen Testphase?",
      "Kann ich Autopilot jederzeit pausieren?",
    ];
  }

  return [
    "Willst du wissen, wann Advaic automatisch sendet?",
    "Soll ich dir den sicheren Start in 3 Schritten zeigen?",
  ];
}

function normalizeFollowupSuggestions(args: {
  parsed: AssistantResponse;
  question: string;
  answer: string;
  path: string;
  sources: PublicKnowledgeSource[];
}) {
  const modelValues = [
    ...((Array.isArray(args.parsed.follow_up_suggestions)
      ? args.parsed.follow_up_suggestions
      : []) as unknown[]),
    ...((Array.isArray(args.parsed.suggested_questions)
      ? args.parsed.suggested_questions
      : []) as unknown[]),
    args.parsed.follow_up_question,
  ];

  const merged = uniqueTrimmed([
    ...modelValues,
    ...fallbackFollowupSuggestions({
      question: args.question,
      answer: args.answer,
      path: args.path,
      sources: args.sources,
    }),
  ])
    .filter((item) => item.length >= 12)
    .slice(0, 2);

  return merged;
}

async function callAzureChat(args: {
  systemPrompt: string;
  userPrompt: string;
  history: ChatMessage[];
}) {
  const endpoint = String(process.env.AZURE_OPENAI_ENDPOINT || "").trim();
  const apiKey = String(process.env.AZURE_OPENAI_API_KEY || "").trim();
  const apiVersion =
    String(process.env.AZURE_OPENAI_API_VERSION || "").trim() ||
    "2024-02-15-preview";
  const deployment =
    String(
      process.env.AZURE_OPENAI_DEPLOYMENT_PUBLIC_WEBSITE_ASSISTANT ||
        process.env.AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES ||
        "",
    ).trim();

  if (!endpoint || !apiKey || !deployment) {
    throw new Error("public_assistant_not_configured");
  }

  const url = `${endpoint.replace(/\/+$/, "")}/openai/deployments/${encodeURIComponent(
    deployment,
  )}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

  const messages = [
    { role: "system", content: args.systemPrompt },
    ...args.history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: args.userPrompt },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        temperature: 0.35,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`azure_error_${res.status}:${t.slice(0, 500)}`);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty_assistant_output");
    return String(content);
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = enforceRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retry_after_seconds: rl.retryAfterSec },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  const body = (await req.json().catch(() => null)) as RequestBody | null;
  if (!body) return jsonError(400, "invalid_body");

  const path = safeText(body.path || "/", 140) || "/";
  const history = sanitizeMessages(body.messages);
  const latestUserQuestion = [...history]
    .reverse()
    .find((m) => m.role === "user")?.content;

  if (!latestUserQuestion) {
    return jsonError(400, "missing_user_message");
  }

  const knowledgeSources = retrievePublicKnowledge({
    question: latestUserQuestion,
    path,
    limit: 4,
  });
  const knowledgeContext = buildPublicKnowledgePromptContext(knowledgeSources);

  const userPrompt = DEFAULT_USER_PROMPT_TEMPLATE
    .replaceAll("{{PATH}}", path)
    .replaceAll("{{LATEST_QUESTION}}", latestUserQuestion)
    .replaceAll("{{KNOWLEDGE_CONTEXT}}", knowledgeContext);

  try {
    const raw = await callAzureChat({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      userPrompt,
      history,
    });

    const parsed = tryExtractJson(raw);
    if (!parsed) {
      return NextResponse.json({
        answer:
          "Ich helfe dir gern. Kannst du deine Frage bitte noch einmal konkret formulieren, zum Beispiel zu Autopilot, Freigabe, Follow-ups oder Setup?",
        follow_up_suggestions: [
          "Wann sendet Advaic automatisch und wann nicht?",
          "Wie starte ich mit möglichst wenig Risiko?",
        ],
      });
    }

    const answer = safeText(parsed.answer, 2400);
    const followUp = safeText(parsed.follow_up_question, 180);
    const followUpSuggestions = normalizeFollowupSuggestions({
      parsed,
      question: latestUserQuestion,
      answer,
      path,
      sources: knowledgeSources,
    });
    const cta = normalizeCta(parsed.cta_label, parsed.cta_href);

    const payload: AssistantApiSuccess = {
      answer,
      ...(followUp ? { follow_up_question: followUp } : {}),
      ...(followUpSuggestions.length
        ? { follow_up_suggestions: followUpSuggestions }
        : {}),
      ...cta,
      sources: normalizeSourcesForResponse(knowledgeSources),
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    const message = String(err?.message || "assistant_failed");
    if (message === "public_assistant_not_configured") {
      return jsonError(
        503,
        "assistant_unavailable",
        "Public assistant is not configured",
      );
    }
    console.error("[public-assistant] failed:", message);
    return jsonError(500, "assistant_failed");
  }
}
