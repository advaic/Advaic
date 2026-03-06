import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { getPlaybookForSegment, inferSegmentFromProspect } from "@/lib/crm/salesIntelResearch";
import { routeObjection } from "@/lib/crm/objectionLibrary";

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
  segmentKey: string;
  playbookTitle: string | null;
  valueNarrative: string;
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
    "Viele ähnliche Interessenten-Anfragen kosten täglich Zeit und führen oft zu späteren Antworten.";
  const objection =
    args.objection ||
    "Entscheidend ist, dass jederzeit klar ist, wann automatisch gesendet wird und wann Freigabe greift.";
  const objectionRoute = routeObjection(args.objection);
  const listingHint =
    typeof args.activeListingsCount === "number"
      ? `Mit aktuell ca. ${args.activeListingsCount} aktiven Inseraten dürfte das spürbar sein.`
      : "";

  const emailBody = `${salutation}

${hook}
${pain}
${listingHint}

Für euch konkret relevant: ${args.valueNarrative}.
Die Mechanik ist klar: Eingang prüfen, entscheiden (Auto/Freigabe/Ignorieren), dann Versand mit Qualitätschecks.
${objection}
Einwand-Route: ${objectionRoute.label} (${objectionRoute.response_pillar}).
Kurze Antwort: ${objectionRoute.short_rebuttal}
Rückfrage: ${objectionRoute.next_question}

Wenn du magst, prüfen wir in 15 Minuten unverbindlich, ob ein vorsichtiger Start für euren ${focus}-Prozess passt.`;

  const linkedinBody = `Hallo ${args.contactName || args.companyName}, kurze Beobachtung zu ${args.companyName}: ${hook}
Spannend wäre ein kurzer Test für ${args.segmentKey}: ${args.valueNarrative}.
Wichtig: Auto nur bei klaren Fällen, unklar => Freigabe, vor Versand Qualitätschecks.
Einwand-Route: ${objectionRoute.label} (${objectionRoute.response_pillar}).
Wäre ein unverbindlicher 15-Minuten-Austausch sinnvoll?`;

  const phoneBody = `Telefonleitfaden:
1) Bezug herstellen: "${hook}"
2) Pain spiegeln: "${pain}"
3) Mechanik: "Erkennen -> Entscheidung -> Versand mit Guardrails."
4) Risk-Reversal: "Safe-Start mit mehr Freigaben, volle Kontrolle."
5) Abschlussfrage: "Sollen wir 15 Minuten unverbindlich prüfen, ob ein vorsichtiger Pilot passt?"`;

  return {
    reason:
      "Diese Varianten folgen derselben Struktur: personalisierter Hook, klarer Pain, nachvollziehbare Mechanik, Risk-Reversal und ein druckfreier Micro-CTA.",
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
Struktur pro Nachricht:
1) Hook
2) Pain
3) Mechanik
4) Risk-Reversal
5) Micro-CTA (genau ein nächster Schritt)

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
- Objection-Route: {{OBJECTION_ROUTE}}
- Objection-Pillar: {{OBJECTION_PILLAR}}
- Objection-Antwort: {{OBJECTION_RESPONSE}}
- Objection-Next-Question: {{OBJECTION_NEXT_QUESTION}}

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

  const segmentKey = inferSegmentFromProspect({
    object_focus: args.objectFocus,
    share_miete_percent: prospect.share_miete_percent,
    share_kauf_percent: prospect.share_kauf_percent,
    active_listings_count: args.activeListingsCount,
    automation_readiness: null,
  });
  const playbook = getPlaybookForSegment(segmentKey);
  const valueNarrative =
    segmentKey === "solo_miete_volumen"
      ? "weniger Zeitverlust bei Standardanfragen und schnellere Reaktionszeiten"
      : segmentKey === "solo_kauf_beratung"
        ? "mehr Fokus auf Beratung, weniger Routine-Kommunikation"
        : segmentKey === "kleines_team_gemischt"
          ? "kontrollierte Entlastung mit Safe-Start statt Risiko-Automation"
          : segmentKey === "neubau_vertrieb"
            ? "klare Governance im Anfrageprozess bei mehreren Beteiligten"
            : segmentKey === "vorsichtig_starter"
              ? "kontrollierter Einstieg mit Freigabe-First und klaren Stop-Regeln"
              : "weniger Routineaufwand bei gleicher Kontrolle";
  const objectionRouteData = routeObjection(args.objection);

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
    OBJECTION_ROUTE: objectionRouteData.label,
    OBJECTION_PILLAR: objectionRouteData.response_pillar,
    OBJECTION_RESPONSE: objectionRouteData.short_rebuttal,
    OBJECTION_NEXT_QUESTION: objectionRouteData.next_question,
    SEGMENT_KEY: segmentKey,
    PLAYBOOK_TITLE: playbook?.title || "",
    VALUE_NARRATIVE: valueNarrative,
  };

  const fallback = fallbackPack({
    ...args,
    segmentKey,
    playbookTitle: playbook?.title || null,
    valueNarrative,
  });
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
