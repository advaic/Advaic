import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type StyleRow = {
  agent_id: string;
  length_pref: string | null;
  do_rules: string | null;
  dont_rules: string | null;
};

type StyleExampleRow = {
  id: string;
  text: string;
  kind: string | null;
};

type SuggestionPatch = {
  length_pref?: "kurz" | "mittel" | "detailliert";
  add_do_rules?: string[];
  add_dont_rules?: string[];
  add_examples?: Array<{
    text: string;
    label: string;
    kind: "style_anchor" | "scenario" | "no_go";
    is_pinned?: boolean;
  }>;
};

type Suggestion = {
  id: string;
  title: string;
  reason: string;
  impact: string;
  confidence: number;
  already_applied: boolean;
  source: "heuristic" | "ai";
  patch: SuggestionPatch;
};

type PromptRow = {
  system_prompt: string | null;
  user_prompt: string | null;
  temperature: number | null;
  max_tokens: number | null;
};

type AiSuggestionRaw = {
  id?: unknown;
  title?: unknown;
  reason?: unknown;
  impact?: unknown;
  confidence?: unknown;
  patch?: unknown;
};

type AiSuggestionPatchRaw = {
  length_pref?: unknown;
  add_do_rules?: unknown;
  add_dont_rules?: unknown;
  add_examples?: unknown;
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function jsonError(status: number, error: string, extra?: Record<string, any>) {
  return NextResponse.json({ error, ...(extra || {}) }, { status });
}

function supabaseFromReq(req: NextRequest, res: NextResponse) {
  return createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    },
  );
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function normalize(s: string) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function containsLine(hay: string | null | undefined, line: string) {
  const h = normalize(String(hay || ""));
  const l = normalize(line);
  return !!l && h.includes(l);
}

function appendUniqueLines(base: string | null | undefined, lines: string[]) {
  const original = String(base || "").trim();
  const cleaned = lines.map((x) => String(x || "").trim()).filter(Boolean);
  if (!cleaned.length) return original || null;

  const add = cleaned.filter((line) => !containsLine(original, line));
  if (!add.length) return original || null;

  const section = add.map((line) => `- ${line}`).join("\n");
  if (!original) return section;
  return `${original}\n${section}`;
}

function toNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pct(num: number, den: number) {
  if (!den || den <= 0) return 0;
  return num / den;
}

function normalizeLine(v: unknown, max = 220) {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function extractJsonBlock(raw: string) {
  const s = String(raw || "").trim();
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return s.slice(firstBrace, lastBrace + 1);
  }
  return s;
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function clamp01(n: unknown) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0.5;
  return Math.max(0, Math.min(1, x));
}

function normalizeLengthPref(v: unknown): "kurz" | "mittel" | "detailliert" | undefined {
  const s = normalizeLine(v, 32).toLowerCase();
  if (s === "kurz" || s === "mittel" || s === "detailliert") return s;
  return undefined;
}

function uniqueLines(values: unknown, limit: number) {
  const arr = Array.isArray(values) ? values : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    const line = normalizeLine(item, 240);
    if (!line) continue;
    const key = normalize(line);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= limit) break;
  }
  return out;
}

function normalizeExample(raw: any) {
  const text = normalizeLine(raw?.text, 500);
  if (!text) return null;
  const label = normalizeLine(raw?.label, 80) || "Stilvorschlag";
  const kindRaw = normalizeLine(raw?.kind, 40).toLowerCase();
  const kind: "style_anchor" | "scenario" | "no_go" =
    kindRaw === "scenario" || kindRaw === "no_go" ? kindRaw : "style_anchor";

  return {
    text,
    label,
    kind,
    is_pinned: Boolean(raw?.is_pinned),
  } as const;
}

function isPatchApplied(
  patch: SuggestionPatch,
  style: StyleRow | null,
  exampleTexts: Set<string>,
) {
  const checks: boolean[] = [];
  if (patch.length_pref) {
    checks.push(String(style?.length_pref || "").toLowerCase() === patch.length_pref);
  }
  for (const line of patch.add_do_rules || []) {
    checks.push(containsLine(style?.do_rules || "", line));
  }
  for (const line of patch.add_dont_rules || []) {
    checks.push(containsLine(style?.dont_rules || "", line));
  }
  for (const ex of patch.add_examples || []) {
    checks.push(exampleTexts.has(normalize(ex.text)));
  }
  return checks.length > 0 && checks.every(Boolean);
}

async function maybeLoadActivePrompt(admin: any, key: string) {
  try {
    const { data } = await (admin.from("ai_prompts") as any)
      .select("system_prompt, user_prompt, temperature, max_tokens")
      .eq("key", key)
      .eq("is_active", true)
      .maybeSingle();
    return (data || null) as PromptRow | null;
  } catch {
    return null;
  }
}

async function callAzureStyleRecommend(args: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const endpoint = String(process.env.AZURE_OPENAI_ENDPOINT || "").trim();
  const apiKey = String(process.env.AZURE_OPENAI_API_KEY || "").trim();
  const apiVersion =
    String(process.env.AZURE_OPENAI_API_VERSION || "").trim() ||
    "2024-02-15-preview";
  const deployment =
    String(process.env.AZURE_OPENAI_DEPLOYMENT_STYLE_RECOMMENDATION || "").trim() ||
    String(process.env.AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES || "").trim();

  if (!endpoint || !apiKey || !deployment) {
    return { ok: false as const, error: "style_ai_not_configured" };
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      temperature:
        typeof args.temperature === "number"
          ? Math.max(0, Math.min(1, args.temperature))
          : 0.25,
      max_tokens:
        typeof args.maxTokens === "number"
          ? Math.max(250, Math.min(900, Math.round(args.maxTokens)))
          : 700,
      messages: [
        { role: "system", content: args.systemPrompt },
        { role: "user", content: args.userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false as const,
      error: `style_ai_http_${res.status}:${text.slice(0, 400)}`,
    };
  }

  const json = (await res.json().catch(() => null)) as any;
  const content = String(json?.choices?.[0]?.message?.content || "").trim();
  if (!content) {
    return { ok: false as const, error: "style_ai_empty_content" };
  }

  return { ok: true as const, content };
}

function sanitizeAiSuggestions(args: {
  rawSuggestions: unknown;
  style: StyleRow | null;
  examples: StyleExampleRow[];
}) {
  const arr = Array.isArray(args.rawSuggestions) ? args.rawSuggestions : [];
  const exampleTexts = new Set(args.examples.map((e) => normalize(e.text)));
  const out: Suggestion[] = [];
  const ids = new Set<string>();

  for (const item of arr as AiSuggestionRaw[]) {
    const patchRaw = (item?.patch || {}) as AiSuggestionPatchRaw;
    const patch: SuggestionPatch = {};

    const lengthPref = normalizeLengthPref(patchRaw.length_pref);
    if (lengthPref) patch.length_pref = lengthPref;

    const doLines = uniqueLines(patchRaw.add_do_rules, 4);
    if (doLines.length) patch.add_do_rules = doLines;

    const dontLines = uniqueLines(patchRaw.add_dont_rules, 4);
    if (dontLines.length) patch.add_dont_rules = dontLines;

    const addExamplesRaw = Array.isArray(patchRaw.add_examples)
      ? patchRaw.add_examples
      : [];
    const addExamples = addExamplesRaw
      .map((raw) => normalizeExample(raw))
      .filter(Boolean) as NonNullable<ReturnType<typeof normalizeExample>>[];
    if (addExamples.length) patch.add_examples = addExamples.slice(0, 3);

    if (
      !patch.length_pref &&
      !(patch.add_do_rules || []).length &&
      !(patch.add_dont_rules || []).length &&
      !(patch.add_examples || []).length
    ) {
      continue;
    }

    const rawId = normalizeLine(item?.id, 48).toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    const id = `ai_${rawId || `suggestion_${out.length + 1}`}`;
    if (ids.has(id)) continue;
    ids.add(id);

    out.push({
      id,
      title: normalizeLine(item?.title, 120) || "KI-Stilvorschlag",
      reason:
        normalizeLine(item?.reason, 260) ||
        "Aus Freigabe-Änderungen abgeleiteter Verbesserungsvorschlag.",
      impact:
        normalizeLine(item?.impact, 260) ||
        "Soll Entwürfe näher an deinen gewünschten Stil bringen.",
      confidence: clamp01(item?.confidence),
      already_applied: isPatchApplied(patch, args.style, exampleTexts),
      source: "ai",
      patch,
    });
  }

  return out.slice(0, 3);
}

function buildSuggestions(args: {
  totalReviews: number;
  editedReviews: number;
  shortened: number;
  lengthened: number;
  largeEdits: number;
  avgDiffChars: number;
  style: StyleRow | null;
  examples: StyleExampleRow[];
}) {
  const editedRate = pct(args.editedReviews, args.totalReviews);
  const shortRate = pct(args.shortened, Math.max(1, args.editedReviews));
  const largeEditRate = pct(args.largeEdits, Math.max(1, args.editedReviews));
  const exampleTexts = new Set(args.examples.map((e) => normalize(e.text)));

  const out: Suggestion[] = [];

  const pushSuggestion = (s: Omit<Suggestion, "already_applied">) => {
    out.push({
      ...s,
      already_applied: isPatchApplied(s.patch, args.style, exampleTexts),
    });
  };

  if (
    args.totalReviews >= 4 &&
    (shortRate >= 0.55 ||
      (editedRate >= 0.4 &&
        args.avgDiffChars >= 50 &&
        args.shortened >= args.lengthened))
  ) {
    pushSuggestion({
      id: "short_clear",
      title: "Antworten kürzer und klarer halten",
      reason:
        "Du kürzt viele Entwürfe vor dem Versand. Das spricht für einen prägnanteren Standardstil.",
      impact: "Weniger Nachbearbeitung und schnellere Freigaben bei Standardfällen.",
      confidence: Math.min(0.95, 0.6 + shortRate * 0.35),
      source: "heuristic",
      patch: {
        length_pref: "kurz",
        add_do_rules: [
          "Kurze, klare Sätze mit maximal drei kurzen Absätzen.",
          "Am Ende immer einen konkreten nächsten Schritt nennen.",
        ],
        add_dont_rules: [
          "Keine langen Fließtexte ohne klare Struktur.",
        ],
        add_examples: [
          {
            label: "Kurz & klar",
            kind: "style_anchor",
            text: "Gerne. Die Immobilie ist verfügbar. Ich kann Ihnen Dienstag um 17:00 oder Mittwoch um 18:00 anbieten. Welche Zeit passt besser?",
            is_pinned: true,
          },
        ],
      },
    });
  }

  if (args.totalReviews >= 4 && (largeEditRate >= 0.35 || editedRate >= 0.45)) {
    pushSuggestion({
      id: "structured_next_steps",
      title: "Mehr Struktur und klare nächste Schritte",
      reason:
        "Viele Edits sind größer. Häufig hilft ein klarerer Aufbau mit konkreten Folgeschritten.",
      impact: "Höhere Ersttrefferquote bei Entwürfen und weniger manuelles Umschreiben.",
      confidence: Math.min(0.92, 0.55 + largeEditRate * 0.4),
      source: "heuristic",
      patch: {
        add_do_rules: [
          "Antworten in zwei bis vier klaren Punkten strukturieren.",
          "Konkrete nächste Schritte mit Zeitfenster nennen.",
        ],
        add_dont_rules: [
          "Keine vagen Aussagen wie 'ich melde mich' ohne Zeitangabe.",
        ],
        add_examples: [
          {
            label: "Struktur",
            kind: "scenario",
            text: "Gerne. Für die Besichtigung sind drei Schritte wichtig: 1) Kurz Rückmeldung zur Wunschzeit, 2) zwei verfügbare Termine wählen, 3) benötigte Unterlagen vorab senden.",
          },
        ],
      },
    });
  }

  if (editedRate >= 0.25 || args.totalReviews < 4) {
    pushSuggestion({
      id: "context_guard",
      title: "Kontext-Schutz bei unklaren Fällen schärfen",
      reason:
        args.totalReviews < 4
          ? "Bei wenig Trainingsdaten ist ein konservativer Kontext-Schutz sinnvoll."
          : "Ein Teil der Edits entsteht durch unklaren Kontext. Eine feste Rückfrage-Regel reduziert Risiko.",
      impact: "Weniger unpassende Antworten bei unklarem Objektbezug.",
      confidence: args.totalReviews < 4 ? 0.7 : Math.min(0.9, 0.52 + editedRate * 0.35),
      source: "heuristic",
      patch: {
        add_do_rules: [
          "Wenn der Objektbezug unklar ist, zuerst eine kurze Rückfrage stellen.",
        ],
        add_dont_rules: [
          "Keine Annahmen zu Verfügbarkeit oder Konditionen ohne eindeutigen Objektbezug.",
        ],
        add_examples: [
          {
            label: "Rückfrage bei Unklarheit",
            kind: "scenario",
            text: "Danke für Ihre Nachricht. Damit ich korrekt antworte: Auf welche Immobilie bezieht sich Ihre Anfrage genau?",
          },
        ],
      },
    });
  }

  if (!out.length) {
    pushSuggestion({
      id: "baseline_quality",
      title: "Basisregel für konsistente Antworten",
      reason: "Noch keine klare Tendenz. Eine robuste Basisregel sorgt für stabile Qualität.",
      impact: "Konstantere Antworten bei gleichbleibendem Risiko.",
      confidence: 0.62,
      source: "heuristic",
      patch: {
        add_do_rules: [
          "Kurz antworten und mit einem klaren nächsten Schritt abschließen.",
        ],
      },
    });
  }

  return {
    editedRate,
    shortRate,
    largeEditRate,
    suggestions: out,
  };
}

const DEFAULT_STYLE_RECOMMENDATION_SYSTEM_PROMPT = `
Du bist ein präziser Assistent für Stiloptimierung in der Immobilienkommunikation.
Aufgabe: Erzeuge aus aggregierten Freigabe-Metriken 0 bis 3 konkrete Stilverbesserungen.

WICHTIGE REGELN:
- Nutze nur die gelieferten aggregierten Daten.
- Keine erfundenen Fakten.
- Keine jurischen Zusagen.
- Nur deutsch.
- Output ausschließlich als JSON:
{
  "suggestions": [
    {
      "id": "kurze_id",
      "title": "string",
      "reason": "string",
      "impact": "string",
      "confidence": 0.0,
      "patch": {
        "length_pref": "kurz|mittel|detailliert",
        "add_do_rules": ["..."],
        "add_dont_rules": ["..."],
        "add_examples": [
          {
            "text": "string",
            "label": "string",
            "kind": "style_anchor|scenario|no_go",
            "is_pinned": true
          }
        ]
      }
    }
  ]
}
- Gib nur Patches aus, die wirklich handlungsrelevant sind.
- Kein Patch darf mehr als 4 Regeln je Liste enthalten.
- Beispieltexte kurz und alltagstauglich halten.
`.trim();

const DEFAULT_STYLE_RECOMMENDATION_USER_PROMPT = `
Leite Vorschläge aus den Eingabedaten ab. Priorisiere Vorschläge mit hohem praktischen Nutzen.
Wenn die Datenlage dünn ist, gib maximal 1 konservativen Vorschlag.
`.trim();

async function generateAiSuggestions(args: {
  admin: any;
  style: StyleRow | null;
  examples: StyleExampleRow[];
  metrics: {
    total_reviews: number;
    edited_reviews: number;
    edited_rate: number;
    short_edit_rate: number;
    large_edit_rate: number;
    avg_diff_chars: number;
  };
  heuristicSuggestions: Suggestion[];
}) {
  const promptCfg = await maybeLoadActivePrompt(args.admin, "style_recommendation_v1");
  const systemPrompt =
    normalizeLine(promptCfg?.system_prompt || "", 20000) ||
    DEFAULT_STYLE_RECOMMENDATION_SYSTEM_PROMPT;
  const userPromptBase =
    normalizeLine(promptCfg?.user_prompt || "", 20000) ||
    DEFAULT_STYLE_RECOMMENDATION_USER_PROMPT;

  const inputPayload = {
    metrics: args.metrics,
    style: {
      length_pref: args.style?.length_pref || null,
      do_rules: String(args.style?.do_rules || "").slice(0, 1200),
      dont_rules: String(args.style?.dont_rules || "").slice(0, 1200),
    },
    existing_examples: args.examples.slice(0, 8).map((e) => ({
      kind: e.kind || "style_anchor",
      text: String(e.text || "").slice(0, 180),
    })),
    heuristic_suggestions: args.heuristicSuggestions.slice(0, 3).map((s) => ({
      id: s.id,
      title: s.title,
      reason: s.reason,
      confidence: s.confidence,
    })),
  };

  const userPrompt = `${userPromptBase}\n\nINPUT_JSON:\n${JSON.stringify(inputPayload)}`;

  const aiRes = await callAzureStyleRecommend({
    systemPrompt,
    userPrompt,
    temperature:
      typeof promptCfg?.temperature === "number" ? promptCfg.temperature : 0.25,
    maxTokens:
      typeof promptCfg?.max_tokens === "number" ? promptCfg.max_tokens : 700,
  });

  if (!aiRes.ok) {
    return { ok: false as const, error: aiRes.error };
  }

  const parsed = safeJsonParse<{ suggestions?: unknown }>(
    extractJsonBlock(aiRes.content),
  );
  if (!parsed) {
    return { ok: false as const, error: "style_ai_invalid_json" };
  }

  const suggestions = sanitizeAiSuggestions({
    rawSuggestions: parsed.suggestions,
    style: args.style,
    examples: args.examples,
  });
  return { ok: true as const, suggestions };
}

async function fetchContext(
  agentId: string,
  opts?: { includeAi?: boolean },
) {
  const admin = supabaseAdmin();
  const since45 = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();

  const [reviewsRes, styleRes, examplesRes] = await Promise.all([
    (admin.from("message_qas") as any)
      .select("reason, meta, created_at")
      .eq("agent_id", agentId)
      .eq("prompt_key", "approval_review_v1")
      .gte("created_at", since45)
      .order("created_at", { ascending: false })
      .limit(5000),
    (admin.from("agent_style") as any)
      .select("agent_id, length_pref, do_rules, dont_rules")
      .eq("agent_id", agentId)
      .maybeSingle(),
    (admin.from("agent_style_examples") as any)
      .select("id, text, kind")
      .eq("agent_id", agentId)
      .limit(4000),
  ]);

  if (reviewsRes.error) {
    throw new Error(`review_fetch_failed:${reviewsRes.error.message}`);
  }
  if (styleRes.error) {
    throw new Error(`style_fetch_failed:${styleRes.error.message}`);
  }
  if (examplesRes.error) {
    throw new Error(`examples_fetch_failed:${examplesRes.error.message}`);
  }

  const reviewRows = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
  const totalReviews = reviewRows.length;
  let editedReviews = 0;
  let shortened = 0;
  let lengthened = 0;
  let largeEdits = 0;
  let diffSum = 0;
  let diffCount = 0;

  for (const row of reviewRows) {
    const reason = String(row?.reason || "").toLowerCase();
    const meta = (row?.meta || {}) as any;
    const edited = Boolean(meta?.edited) || reason === "edited_before_send";
    if (!edited) continue;

    editedReviews += 1;

    const originalLength = toNum(meta?.original_length);
    const finalLength = toNum(meta?.final_length);
    const diffChars = toNum(meta?.diff_chars);

    if (originalLength !== null && finalLength !== null) {
      if (finalLength < originalLength) shortened += 1;
      if (finalLength > originalLength) lengthened += 1;
    }
    if (diffChars !== null) {
      diffSum += diffChars;
      diffCount += 1;
      if (diffChars >= 80) largeEdits += 1;
    }
  }

  const avgDiffChars = diffCount > 0 ? diffSum / diffCount : 0;
  const style = (styleRes.data || null) as StyleRow | null;
  const examples = (examplesRes.data || []) as StyleExampleRow[];

  const computed = buildSuggestions({
    totalReviews,
    editedReviews,
    shortened,
    lengthened,
    largeEdits,
    avgDiffChars,
    style,
    examples,
  });

  let aiSuggestions: Suggestion[] = [];
  let aiMeta: { enabled: boolean; used: boolean; error: string | null } = {
    enabled: true,
    used: false,
    error: null,
  };
  if (opts?.includeAi !== false) {
    const ai = await generateAiSuggestions({
      admin,
      style,
      examples,
      metrics: {
        total_reviews: totalReviews,
        edited_reviews: editedReviews,
        edited_rate: computed.editedRate,
        short_edit_rate: computed.shortRate,
        large_edit_rate: computed.largeEditRate,
        avg_diff_chars: Math.round(avgDiffChars * 10) / 10,
      },
      heuristicSuggestions: computed.suggestions,
    });
    if (ai.ok) {
      aiSuggestions = ai.suggestions;
      aiMeta.used = ai.suggestions.length > 0;
    } else {
      if (String(ai.error || "").includes("not_configured")) {
        aiMeta.enabled = false;
      }
      aiMeta.error = ai.error;
    }
  } else {
    aiMeta = { enabled: false, used: false, error: null };
  }

  const mergedSuggestions = [...computed.suggestions];
  const existing = new Set(mergedSuggestions.map((s) => s.id));
  for (const aiS of aiSuggestions) {
    if (existing.has(aiS.id)) continue;
    mergedSuggestions.push(aiS);
    existing.add(aiS.id);
  }

  return {
    window_days: 45,
    total_reviews: totalReviews,
    edited_reviews: editedReviews,
    edited_rate: computed.editedRate,
    short_edit_rate: computed.shortRate,
    large_edit_rate: computed.largeEditRate,
    avg_diff_chars: Math.round(avgDiffChars * 10) / 10,
    suggestions: mergedSuggestions,
    heuristic_suggestions: computed.suggestions,
    ai_suggestions: aiSuggestions,
    ai: aiMeta,
    style,
    examples,
  };
}

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const authClient = supabaseFromReq(req, res);

  const {
    data: { user },
    error: authErr,
  } = await authClient.auth.getUser();
  if (authErr || !user?.id) return jsonError(401, "Unauthorized");

  try {
    const data = await fetchContext(String(user.id), { includeAi: true });
    return NextResponse.json({
      ok: true,
      generated_at: new Date().toISOString(),
      window_days: data.window_days,
      metrics: {
        total_reviews: data.total_reviews,
        edited_reviews: data.edited_reviews,
        edited_rate: data.edited_rate,
        short_edit_rate: data.short_edit_rate,
        large_edit_rate: data.large_edit_rate,
        avg_diff_chars: data.avg_diff_chars,
      },
      ai: data.ai,
      suggestions: data.suggestions,
    });
  } catch (e: any) {
    return jsonError(500, "style_suggestions_fetch_failed", {
      details: String(e?.message || "unknown_error"),
    });
  }
}

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const authClient = supabaseFromReq(req, res);

  const {
    data: { user },
    error: authErr,
  } = await authClient.auth.getUser();
  if (authErr || !user?.id) return jsonError(401, "Unauthorized");

  const body = (await req.json().catch(() => null)) as
    | { suggestion_id?: string }
    | null;
  const suggestionId = String(body?.suggestion_id || "").trim();
  if (!suggestionId) return jsonError(400, "missing_suggestion_id");

  try {
    const agentId = String(user.id);
    const includeAi = suggestionId.startsWith("ai_");
    const current = await fetchContext(agentId, { includeAi });
    const suggestion = current.suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return jsonError(404, "suggestion_not_found");

    if (suggestion.already_applied) {
      return NextResponse.json({
        ok: true,
        applied: false,
        message: "Bereits vorhanden.",
        suggestion,
      });
    }

    const admin = supabaseAdmin();
    const style = current.style;

    const nextDoRules = appendUniqueLines(
      style?.do_rules || "",
      suggestion.patch.add_do_rules || [],
    );
    const nextDontRules = appendUniqueLines(
      style?.dont_rules || "",
      suggestion.patch.add_dont_rules || [],
    );

    const stylePatch: Record<string, any> = {
      agent_id: agentId,
      do_rules: nextDoRules,
      dont_rules: nextDontRules,
    };

    if (suggestion.patch.length_pref) {
      stylePatch.length_pref = suggestion.patch.length_pref;
    }

    const { error: styleUpsertErr } = await (admin.from("agent_style") as any)
      .upsert(stylePatch, { onConflict: "agent_id" });

    if (styleUpsertErr) {
      return jsonError(500, "style_upsert_failed", {
        details: styleUpsertErr.message,
      });
    }

    const existingTexts = new Set(
      current.examples.map((e) => normalize(String(e.text || ""))),
    );
    const rowsToInsert = (suggestion.patch.add_examples || [])
      .filter((ex) => !existingTexts.has(normalize(ex.text)))
      .map((ex) => ({
        agent_id: agentId,
        text: ex.text,
        label: ex.label,
        kind: ex.kind,
        is_pinned: Boolean(ex.is_pinned),
      }));

    if (rowsToInsert.length > 0) {
      const { error: exErr } = await (admin.from("agent_style_examples") as any)
        .insert(rowsToInsert);
      if (exErr) {
        return jsonError(500, "style_examples_insert_failed", {
          details: exErr.message,
        });
      }
    }

    const refreshed = await fetchContext(agentId, { includeAi: true });

    return NextResponse.json({
      ok: true,
      applied: true,
      suggestion_id: suggestion.id,
      ai: refreshed.ai,
      suggestions: refreshed.suggestions,
      metrics: {
        total_reviews: refreshed.total_reviews,
        edited_reviews: refreshed.edited_reviews,
        edited_rate: refreshed.edited_rate,
        short_edit_rate: refreshed.short_edit_rate,
        large_edit_rate: refreshed.large_edit_rate,
        avg_diff_chars: refreshed.avg_diff_chars,
      },
    });
  } catch (e: any) {
    return jsonError(500, "style_suggestion_apply_failed", {
      details: String(e?.message || "unknown_error"),
    });
  }
}
