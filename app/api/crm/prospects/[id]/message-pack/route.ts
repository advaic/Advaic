import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

type PromptRow = {
  system_prompt: string;
  user_prompt: string;
  temperature: number | null;
  max_tokens: number | null;
};

type PackMessage = {
  channel: "email" | "linkedin" | "telefon";
  variant: string;
  subject: string;
  body: string;
  why: string;
};

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeMultiline(value: unknown, max = 2500) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function applyVars(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

async function loadPrompt(supabase: any) {
  const { data } = await (supabase.from("ai_prompts") as any)
    .select("system_prompt, user_prompt, temperature, max_tokens")
    .eq("key", "crm_message_pack_v1")
    .eq("is_active", true)
    .maybeSingle();
  return (data || null) as PromptRow | null;
}

function fallbackPack(args: {
  companyName: string;
  contactName: string | null;
  city: string | null;
  objectFocus: string;
  hook: string | null;
  pain: string | null;
  objection: string | null;
  activeListingsCount: number | null;
  mix: string;
}) {
  const salutation = args.contactName
    ? `Hallo ${args.contactName},`
    : `Hallo Team von ${args.companyName},`;
  const focus = args.objectFocus && args.objectFocus !== "gemischt" ? args.objectFocus : "Anfragen";
  const hook =
    args.hook ||
    `mir ist bei ${args.companyName} positiv aufgefallen, wie klar ihr euren Auftritt gestaltet.`;
  const pain =
    args.pain ||
    "Wahrscheinlich kostet euch gerade die Menge ähnlicher Interessenten-Anfragen unnötig Zeit im Postfach.";
  const objection =
    args.objection ||
    "Die wichtigste Frage ist meist die Kontrolle: wann automatisch gesendet wird und wann Freigabe greift.";
  const listingHint =
    typeof args.activeListingsCount === "number"
      ? `Mit aktuell ca. ${args.activeListingsCount} aktiven Inseraten dürfte das spürbar sein.`
      : "";

  const emailBody = `${salutation}

${hook}
${pain}
${listingHint}

Wir suchen aktuell wenige Makler als Tester, um genau diesen Schritt sauber zu entlasten.

Wichtig: Autopilot sendet nur bei klaren Fällen, unklare Fälle gehen zur Freigabe, vor jedem Versand laufen Qualitätschecks.
${objection}

Wenn du magst, können wir in 15 Minuten prüfen, ob ein vorsichtiger Start für euren ${focus}-Prozess passt.`;

  const linkedinBody = `Hallo ${args.contactName || args.companyName}, danke für den Einblick in euren Auftritt.
Ich suche gerade 3-5 Makler für einen frühen Test: weniger Routine im Postfach, klare Guardrails (unklar => Freigabe, Checks vor Versand), kein Kaufdruck.
Wäre ein kurzer 15-Minuten-Austausch interessant?`;

  const phoneBody = `Telefonleitfaden:
1) Bezug herstellen: "${hook}"
2) Problem spiegeln: "${pain}"
3) Sicherheitskern: "Auto nur bei klaren Fällen, sonst Freigabe, plus Qualitätschecks."
4) Abschlussfrage: "Sollen wir 15 Minuten unverbindlich prüfen, ob ein vorsichtiger Pilot passt?"`;

  return {
    reason:
      "Diese Varianten nutzen konkrete Prospect-Signale (Hook, Pain, Angebotsmix) und halten den Einstieg druckfrei mit klarem Guardrail-Fokus.",
    messages: [
      {
        channel: "email" as const,
        variant: "email_personal_v1",
        subject: `Kurzer Austausch zu ${args.companyName}`,
        body: emailBody,
        why: "Längere Struktur mit persönlichem Bezug, Sicherheitslogik und klarem 15-Minuten-CTA.",
      },
      {
        channel: "linkedin" as const,
        variant: "linkedin_compact_v1",
        subject: "",
        body: linkedinBody,
        why: "Kompakt für LinkedIn, schnell lesbar, ohne Kaufdruck.",
      },
      {
        channel: "telefon" as const,
        variant: "call_script_v1",
        subject: "",
        body: phoneBody,
        why: "Leitfaden für strukturierte, persönliche Gespräche in 4 Schritten.",
      },
    ],
  };
}

async function maybeGenerateWithAi(args: {
  prompt: PromptRow | null;
  vars: Record<string, string>;
}) {
  const endpoint = normalizeLine(process.env.AZURE_OPENAI_ENDPOINT, 400);
  const apiKey = normalizeLine(process.env.AZURE_OPENAI_API_KEY, 400);
  const deployment =
    normalizeLine(process.env.AZURE_OPENAI_DEPLOYMENT_COPILOT, 200) ||
    normalizeLine(process.env.AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES, 200) ||
    normalizeLine(process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER, 200);
  const apiVersion = normalizeLine(process.env.AZURE_OPENAI_API_VERSION, 80) || "2024-02-15-preview";
  if (!endpoint || !apiKey || !deployment) return null;

  const fallbackSystem =
    "Du schreibst hochpersonalisierte Outreach-Nachrichten für deutsche Immobilienmakler. Druckfrei, klar, präzise. Gib nur JSON zurück.";
  const fallbackUser = `Erzeuge ein Nachrichtenpaket mit 3 Varianten:
- email
- linkedin
- telefon (Call-Script)

Alle müssen den Prospect-Bezug in der gesamten Nachricht tragen.
Pflicht: erwähne Guardrails (klar=auto, unklar=Freigabe, Checks vor Versand).

Kontext:
- Firma: {{COMPANY_NAME}}
- Kontakt: {{CONTACT_NAME}}
- Stadt: {{CITY}}
- Fokus: {{OBJECT_FOCUS}}
- Hook: {{HOOK}}
- Pain: {{PAIN}}
- Objection: {{OBJECTION}}
- Aktive Inserate: {{ACTIVE_LISTINGS}}
- Mix: {{MIX}}
- Evidenz: {{EVIDENCE}}

Gib JSON zurück:
{
  "recommendation_reason": "string",
  "messages": [
    {"channel":"email","variant":"email_personal_v1","subject":"string","body":"string","why":"string"},
    {"channel":"linkedin","variant":"linkedin_compact_v1","subject":"","body":"string","why":"string"},
    {"channel":"telefon","variant":"call_script_v1","subject":"","body":"string","why":"string"}
  ]
}`;

  const systemPrompt = normalizeMultiline(args.prompt?.system_prompt || fallbackSystem, 5000);
  const userPrompt = normalizeMultiline(
    applyVars(args.prompt?.user_prompt || fallbackUser, args.vars),
    8000,
  );

  const url = `${endpoint.replace(/\/+$/, "")}/openai/deployments/${encodeURIComponent(
    deployment,
  )}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      temperature:
        typeof args.prompt?.temperature === "number"
          ? Math.max(0, Math.min(0.7, args.prompt.temperature))
          : 0.25,
      max_tokens:
        typeof args.prompt?.max_tokens === "number"
          ? Math.max(500, Math.min(1800, Math.round(args.prompt.max_tokens)))
          : 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  }).catch(() => null);
  if (!res || !res.ok) return null;

  const json = (await res.json().catch(() => null)) as any;
  const content = normalizeMultiline(json?.choices?.[0]?.message?.content || "", 5000);
  if (!content) return null;

  const parsed = JSON.parse(content) as any;
  const reason = normalizeLine(parsed?.recommendation_reason, 300);
  const messagesRaw = Array.isArray(parsed?.messages) ? parsed.messages : [];
  const allowedChannels = new Set(["email", "linkedin", "telefon"]);

  const messages: PackMessage[] = messagesRaw
    .map((msg: any) => ({
      channel: normalizeLine(msg?.channel, 40).toLowerCase(),
      variant: normalizeLine(msg?.variant, 80),
      subject: normalizeLine(msg?.subject, 140),
      body: normalizeMultiline(msg?.body, 1800),
      why: normalizeLine(msg?.why, 260),
    }))
    .filter((msg: any) => allowedChannels.has(msg.channel) && msg.body)
    .slice(0, 3) as PackMessage[];

  if (messages.length < 3) return null;
  return { reason, messages };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const prospectId = String(id || "").trim();
  if (!prospectId) {
    return NextResponse.json({ ok: false, error: "missing_prospect_id" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: prospect, error } = await (supabase.from("crm_prospects") as any)
    .select(
      "id, company_name, contact_name, city, object_focus, personalization_hook, pain_point_hypothesis, primary_objection, active_listings_count, share_miete_percent, share_kauf_percent, personalization_evidence",
    )
    .eq("id", prospectId)
    .eq("agent_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_prospect_lookup_failed", details: error.message },
      { status: 500 },
    );
  }
  if (!prospect) {
    return NextResponse.json({ ok: false, error: "prospect_not_found" }, { status: 404 });
  }

  const mix = `Miete ${typeof prospect.share_miete_percent === "number" ? prospect.share_miete_percent : "?"}% / Kauf ${typeof prospect.share_kauf_percent === "number" ? prospect.share_kauf_percent : "?"}%`;
  const args = {
    companyName: normalizeLine(prospect.company_name, 160),
    contactName: normalizeLine(prospect.contact_name, 120) || null,
    city: normalizeLine(prospect.city, 120) || null,
    objectFocus: normalizeLine(prospect.object_focus, 40) || "gemischt",
    hook: normalizeMultiline(prospect.personalization_hook, 280) || null,
    pain: normalizeMultiline(prospect.pain_point_hypothesis, 280) || null,
    objection: normalizeMultiline(prospect.primary_objection, 240) || null,
    activeListingsCount:
      typeof prospect.active_listings_count === "number" ? prospect.active_listings_count : null,
    mix,
    evidence: normalizeMultiline(prospect.personalization_evidence, 300) || "",
  };

  const vars = {
    COMPANY_NAME: args.companyName,
    CONTACT_NAME: args.contactName || "",
    CITY: args.city || "",
    OBJECT_FOCUS: args.objectFocus,
    HOOK: args.hook || "",
    PAIN: args.pain || "",
    OBJECTION: args.objection || "",
    ACTIVE_LISTINGS: String(args.activeListingsCount ?? ""),
    MIX: args.mix,
    EVIDENCE: args.evidence,
  };

  const fallback = fallbackPack(args);
  let reason = fallback.reason;
  let messages = fallback.messages;
  let generatedWith: "ai" | "fallback" = "fallback";

  try {
    const prompt = await loadPrompt(supabase);
    const aiResult = await maybeGenerateWithAi({ prompt, vars });
    if (aiResult?.messages?.length === 3) {
      reason = aiResult.reason || reason;
      messages = aiResult.messages;
      generatedWith = "ai";
    }
  } catch {
    // Fail-open to deterministic fallback.
  }

  return NextResponse.json({
    ok: true,
    generated_with: generatedWith,
    recommendation_reason: reason,
    messages,
  });
}

