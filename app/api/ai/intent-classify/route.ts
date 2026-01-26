import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  text: string;
  context?: Array<{ sender: string; text: string }>;
};

type Result = {
  intent:
    | "PROPERTY_SEARCH"
    | "PROPERTY_SPECIFIC"
    | "VIEWING_REQUEST"
    | "APPLICATION_PROCESS"
    | "QNA_GENERAL"
    | "STATUS_FOLLOWUP"
    | "OTHER"
    | "SPAM_OR_IRRELEVANT";
  confidence: number; // 0..1
  entities: Record<string, any>;
  reason: string;
};

function isSpammy(text: string): boolean {
  const t = text.toLowerCase();
  // Very conservative: only obvious bulk/newsletter/system stuff.
  const obvious = [
    // true system / bounce / non-human
    "mailer-daemon",
    "postmaster",
    "delivery status notification",
    "undeliverable",
    "zustellfehler",

    // unsubscribe-only system signals
    "list-unsubscribe",
  ];
  if (obvious.some((k) => t.includes(k))) return true;

  // Portal / system notifications that are NOT lead inquiries
  // IMPORTANT: do NOT catch actual property inquiries here
  const portalSystemOnly = [
    "automatisch generiert",
    "dies ist eine automatisch erstellte",
    "systemnachricht",
    "kontobenachrichtigung",
    "passwort",
    "zugriff",
    "login",
    "sicherheitswarnung",
    "neue funktionen",
    "produktupdate",
    "feature update",
    "release notes",
    "wartung",
    "maintenance",
  ];

  if (portalSystemOnly.some((k) => t.includes(k))) return true;

  // Auto-generated marketing phrases that are extremely likely spam
  const patterns: RegExp[] = [
    /\bgewinnspiel\b/i,
    /\bjetzt\s+anmelden\b/i,
    /\bnewsletter\b/i,
  ];

  // Safety guard: never mark as spam if it clearly looks like a property inquiry
  const propertyLeadSignals = [
    "wohnung",
    "apartment",
    "immobilie",
    "objekt",
    "miete",
    "kaltmiete",
    "warmmiete",
    "zimmer",
    "qm",
    "besichtigung",
    "termin",
    "adresse",
    "verfügbar",
    "available",
  ];

  if (propertyLeadSignals.some((k) => t.includes(k))) return false;

  return patterns.some((re) => re.test(text));
}

function askedForAlternatives(text: string): boolean {
  const t = text.toLowerCase();
  const kws = [
    "andere",
    "alternativ",
    "weitere",
    "noch",
    "zusätzlich",
    "stattdessen",
    "alternative",
    "another",
    "other",
    "more options",
    "mehr angebote",
  ];
  return kws.some((k) => t.includes(k));
}

function refersToPreviousProperty(text: string, ctx: Array<{ sender: string; text: string }>): boolean {
  const t = text.toLowerCase();
  const pronouns = [
    "die wohnung",
    "das objekt",
    "die immobilie",
    "diese immobilie",
    "dieses objekt",
    "dieses angebot",
    "dazu",
    "darüber",
    "this apartment",
    "this property",
    "that one",
    "the listing",
  ];
  if (!pronouns.some((k) => t.includes(k))) return false;
  // Only treat as a strong signal if there IS context at all
  return Array.isArray(ctx) && ctx.length > 0;
}

function hardClassify(text: string, ctx: Array<{ sender: string; text: string }>): Result | null {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return {
      intent: "OTHER",
      confidence: 0,
      entities: {},
      reason: "empty_text",
    };
  }

  if (isSpammy(trimmed)) {
    return {
      intent: "SPAM_OR_IRRELEVANT",
      confidence: 0.995,
      entities: {},
      reason: "obvious_spam_or_system",
    };
  }

  // Deterministic fast-paths for very clear intents (keep conservative)
  const t = trimmed.toLowerCase();

  const viewingRe = /(besichtigung|termin|uhrzeit|verf[üu]gbarkeit|viewing|appointment|besichtigen)/i;
  if (viewingRe.test(trimmed)) {
    return {
      intent: "VIEWING_REQUEST",
      confidence: 0.92,
      entities: {
        wants_alternatives: askedForAlternatives(trimmed),
        refers_to_previous_property: refersToPreviousProperty(trimmed, ctx),
      },
      reason: "viewing_keywords",
    };
  }

  const appRe = /(unterlagen|gehaltsnachweis|schufa|selbstauskunft|bewerb|application|documents|deposit|kaution|vertrag)/i;
  if (appRe.test(trimmed)) {
    return {
      intent: "APPLICATION_PROCESS",
      confidence: 0.9,
      entities: {
        wants_alternatives: askedForAlternatives(trimmed),
        refers_to_previous_property: refersToPreviousProperty(trimmed, ctx),
      },
      reason: "application_keywords",
    };
  }

  const statusRe = /(hast du|haben sie).*?(gesehen|erhalten)|update|status|r[üu]ckmeldung|nochmal|follow\s*up|did you see/i;
  if (statusRe.test(trimmed) && Array.isArray(ctx) && ctx.length > 0) {
    return {
      intent: "STATUS_FOLLOWUP",
      confidence: 0.88,
      entities: {
        wants_alternatives: askedForAlternatives(trimmed),
        refers_to_previous_property: refersToPreviousProperty(trimmed, ctx),
      },
      reason: "status_followup_keywords",
    };
  }

  return null;
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, cleanup: () => clearTimeout(id) };
}

function safeJsonParse(s: string): any | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function clamp01(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.text) return jsonError("Missing text", 400);

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_INTENT_CLASSIFIER;
  const apiVersion =
    process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

  if (!endpoint || !apiKey || !deployment) {
    // fail-closed: never block pipeline, just OTHER
    return NextResponse.json({
      intent: "OTHER",
      confidence: 0,
      entities: {},
      reason: "intent_classifier_not_configured",
    } satisfies Result);
  }

  const text = String(body.text).slice(0, 1200);
  const ctx = Array.isArray(body.context) ? body.context.slice(0, 10) : [];

  const hard = hardClassify(text, ctx);
  if (hard) return NextResponse.json(hard);

  const system = `
You are an intent classifier for a real-estate agent assistant.
Return ONLY valid JSON with keys: intent, confidence, entities, reason.

Intents:
- PROPERTY_SEARCH: searching with requirements (city/budget/rooms/size etc)
- PROPERTY_SPECIFIC: questions about a specific property (address/link/object) OR a follow-up about a property already discussed in the thread (e.g. "die Wohnung", "this apartment", "das Angebot").
- VIEWING_REQUEST: viewing/appointment/schedule availability
- APPLICATION_PROCESS: applying + documents, income proof, contract, deposit
- QNA_GENERAL: general policy/process questions (pets, furnished, duration, fees, requirements, etc)
- STATUS_FOLLOWUP: asking for updates / "did you see my message"
- OTHER: everything else / ambiguous
- SPAM_OR_IRRELEVANT: only if extremely obvious

Rules:
- Use the provided context (most recent first) to resolve references like "die Wohnung", "diese Immobilie", "as discussed".
  If the lead is clearly continuing about the same previously mentioned property and NOT asking for alternatives, prefer PROPERTY_SPECIFIC.
- PROPERTY_SEARCH only when the message asks for options that match requirements OR explicitly asks for other/alternative listings.
- Fail closed: if uncertain => OTHER.
- confidence must be 0..1.
- entities should include extracted signals when present:
  city, neighbourhood, budget_max, budget_min, rooms_min, size_min_sqm,
  move_in_date, pets, furnished, property_url, address,
  plus optional flags: wants_alternatives (boolean), refers_to_previous_property (boolean)
- Keep reason <= 120 chars.
`.trim();

  const user = `
message:
${text}

context (most recent first):
${ctx
  .map((m) => `- ${m.sender}: ${String(m.text || "").slice(0, 220)}`)
  .join("\n")}
`.trim();

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const { controller, cleanup } = withTimeout(12_000);
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: controller.signal,
  }).catch(() => null);
  cleanup();

  if (!resp || !resp.ok) {
    return NextResponse.json({
      intent: "OTHER",
      confidence: 0,
      entities: {},
      reason: "intent_classifier_failed",
    } satisfies Result);
  }

  const data = (await resp.json().catch(() => null)) as any;
  const out = data?.choices?.[0]?.message?.content;
  if (!out || typeof out !== "string") {
    return NextResponse.json({
      intent: "OTHER",
      confidence: 0,
      entities: {},
      reason: "intent_classifier_no_output",
    } satisfies Result);
  }

  const parsed = safeJsonParse(out);

  const allowed = new Set([
    "PROPERTY_SEARCH",
    "PROPERTY_SPECIFIC",
    "VIEWING_REQUEST",
    "APPLICATION_PROCESS",
    "QNA_GENERAL",
    "STATUS_FOLLOWUP",
    "OTHER",
    "SPAM_OR_IRRELEVANT",
  ]);

  const intent = String(parsed?.intent || "OTHER");
  const confidence = clamp01(parsed?.confidence);
  const entities =
    parsed?.entities && typeof parsed.entities === "object"
      ? parsed.entities
      : {};
  let reason = String(parsed?.reason || "n/a").slice(0, 120);

  const safeIntent = allowed.has(intent)
    ? (intent as Result["intent"])
    : "OTHER";

  // fail-closed: only allow SPAM if very confident
  let finalIntent: Result["intent"] =
    safeIntent === "SPAM_OR_IRRELEVANT" && confidence < 0.98
      ? "OTHER"
      : safeIntent;

  // fail-closed low-confidence guard for all non-OTHER intents
  if (finalIntent !== "OTHER" && confidence < 0.6) {
    finalIntent = "OTHER";
    reason = "low_confidence_guard";
  }

  const wantsAlt = askedForAlternatives(text);
  const refersPrev = refersToPreviousProperty(text, ctx);
  (entities as any).wants_alternatives = typeof (entities as any).wants_alternatives === "boolean" ? (entities as any).wants_alternatives : wantsAlt;
  (entities as any).refers_to_previous_property = typeof (entities as any).refers_to_previous_property === "boolean" ? (entities as any).refers_to_previous_property : refersPrev;

  return NextResponse.json({
    intent: finalIntent,
    confidence,
    entities,
    reason,
  } satisfies Result);
}
