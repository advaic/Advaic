import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { getPlaybookForSegment, inferSegmentFromProspect } from "@/lib/crm/salesIntelResearch";
import { routeObjection } from "@/lib/crm/objectionLibrary";

export const runtime = "nodejs";

type InviteContext = {
  companyName: string;
  contactName: string | null;
  city: string | null;
  objectFocus: string;
  hook: string | null;
  painPoint: string | null;
  primaryObjection: string | null;
  activeListingsCount: number | null;
  shareMietePercent: number | null;
  shareKaufPercent: number | null;
  automationReadiness: string | null;
  brandTone: string | null;
  sourceCheckedAt: string | null;
  linkedinUrl: string | null;
  evidence: string | null;
  channel: string;
  segmentKey: string;
  playbookTitle: string | null;
  valueNarrative: string;
  objectionRouteKey: string;
  objectionRouteLabel: string;
  objectionPillar: string;
  objectionResponse: string;
  objectionProof: string;
  objectionNextQuestion: string;
};

type PromptRow = {
  system_prompt: string;
  user_prompt: string;
  temperature: number | null;
  max_tokens: number | null;
};

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, max);
}

function normalizeMultiline(value: unknown, max = 3500) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, max);
}

function applyVars(template: string, context: InviteContext) {
  return template
    .replaceAll("{{COMPANY_NAME}}", context.companyName)
    .replaceAll("{{CONTACT_NAME}}", context.contactName || "")
    .replaceAll("{{CITY}}", context.city || "")
    .replaceAll("{{OBJECT_FOCUS}}", context.objectFocus || "gemischt")
    .replaceAll("{{HOOK}}", context.hook || "")
    .replaceAll("{{PAIN_POINT}}", context.painPoint || "")
    .replaceAll("{{PRIMARY_OBJECTION}}", context.primaryObjection || "")
    .replaceAll("{{ACTIVE_LISTINGS_COUNT}}", String(context.activeListingsCount ?? ""))
    .replaceAll("{{SHARE_MIETE_PERCENT}}", String(context.shareMietePercent ?? ""))
    .replaceAll("{{SHARE_KAUF_PERCENT}}", String(context.shareKaufPercent ?? ""))
    .replaceAll("{{AUTOMATION_READINESS}}", context.automationReadiness || "")
    .replaceAll("{{BRAND_TONE}}", context.brandTone || "")
    .replaceAll("{{SOURCE_CHECKED_AT}}", context.sourceCheckedAt || "")
    .replaceAll("{{LINKEDIN_URL}}", context.linkedinUrl || "")
    .replaceAll("{{PERSONALIZATION_EVIDENCE}}", context.evidence || "")
    .replaceAll("{{CHANNEL}}", context.channel || "email")
    .replaceAll("{{SEGMENT_KEY}}", context.segmentKey)
    .replaceAll("{{PLAYBOOK_TITLE}}", context.playbookTitle || "")
    .replaceAll("{{VALUE_NARRATIVE}}", context.valueNarrative)
    .replaceAll("{{OBJECTION_ROUTE}}", context.objectionRouteKey)
    .replaceAll("{{OBJECTION_LABEL}}", context.objectionRouteLabel)
    .replaceAll("{{OBJECTION_PILLAR}}", context.objectionPillar)
    .replaceAll("{{OBJECTION_RESPONSE}}", context.objectionResponse)
    .replaceAll("{{OBJECTION_PROOF}}", context.objectionProof)
    .replaceAll("{{OBJECTION_NEXT_QUESTION}}", context.objectionNextQuestion);
}

function valueNarrativeForSegment(segmentKey: string, objectFocus: string) {
  if (segmentKey === "solo_miete_volumen") {
    return "weniger Zeitverlust bei Standardanfragen und schnellere Rückmeldungen für Interessenten";
  }
  if (segmentKey === "solo_kauf_beratung") {
    return "Standardfälle schneller beantworten, ohne die Beratungsqualität bei komplexen Fällen zu verlieren";
  }
  if (segmentKey === "kleines_team_gemischt") {
    return "mit Safe-Start kontrolliert automatisieren und das Team spürbar entlasten";
  }
  if (segmentKey === "neubau_vertrieb") {
    return "Anfragen mit klaren Regeln prozesssicher steuern und intern sauber dokumentieren";
  }
  if (segmentKey === "vorsichtig_starter") {
    return "ohne Risiko starten: zuerst mehr Freigabe, dann schrittweise Autopilot aktivieren";
  }
  if (objectFocus === "miete") {
    return "Anfragen schneller beantworten und Termine strukturierter vergeben";
  }
  if (objectFocus === "kauf") {
    return "Rückfragen effizient klären und Beratungszeit auf relevante Fälle konzentrieren";
  }
  return "Routine-Kommunikation entlasten und trotzdem die volle Kontrolle behalten";
}

async function maybeLoadPrompt(supabase: any) {
  const { data } = await (supabase.from("ai_prompts") as any)
    .select("system_prompt, user_prompt, temperature, max_tokens")
    .eq("key", "crm_tester_invite_v1")
    .eq("is_active", true)
    .maybeSingle();
  return (data || null) as PromptRow | null;
}

async function maybeGenerateInviteWithAi(args: {
  prompt: PromptRow | null;
  context: InviteContext;
}) {
  const endpoint = normalizeLine(process.env.AZURE_OPENAI_ENDPOINT, 400);
  const apiKey = normalizeLine(process.env.AZURE_OPENAI_API_KEY, 400);
  const deployment =
    normalizeLine(process.env.AZURE_OPENAI_DEPLOYMENT_COPILOT, 200) ||
    normalizeLine(process.env.AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES, 200) ||
    normalizeLine(process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER, 200);
  const apiVersion =
    normalizeLine(process.env.AZURE_OPENAI_API_VERSION, 100) ||
    "2024-02-15-preview";

  if (!endpoint || !apiKey || !deployment) return null;

  const fallbackSystemPrompt =
    "Du schreibst kurze, persönliche Akquise-Nachrichten für deutsche Immobilienmakler. Kein Kaufdruck. Klare, respektvolle Sprache. Gib nur JSON zurück.";
const fallbackUserPrompt = `Erzeuge eine personalisierte Tester-Einladung.
Kontext:
- Firma: {{COMPANY_NAME}}
- Kontakt: {{CONTACT_NAME}}
- Ort: {{CITY}}
- Fokus: {{OBJECT_FOCUS}}
- Hook: {{HOOK}}
- Pain Point: {{PAIN_POINT}}
- Primäre Objection: {{PRIMARY_OBJECTION}}
- Aktive Inserate: {{ACTIVE_LISTINGS_COUNT}}
- Mix Miete/Kauf: {{SHARE_MIETE_PERCENT}}/{{SHARE_KAUF_PERCENT}}
- Readiness: {{AUTOMATION_READINESS}}
- Brand-Ton: {{BRAND_TONE}}
- Quelle geprüft am: {{SOURCE_CHECKED_AT}}
- LinkedIn: {{LINKEDIN_URL}}
- Evidenz: {{PERSONALIZATION_EVIDENCE}}
- Kanal: {{CHANNEL}}
- Segment: {{SEGMENT_KEY}}
- Playbook: {{PLAYBOOK_TITLE}}
- Value-Narrativ: {{VALUE_NARRATIVE}}
- Objection-Route: {{OBJECTION_ROUTE}} ({{OBJECTION_LABEL}})
- Objection-Pillar: {{OBJECTION_PILLAR}}
- Objection-Antwort: {{OBJECTION_RESPONSE}}
- Objection-Proof: {{OBJECTION_PROOF}}
- Objection-Rückfrage: {{OBJECTION_NEXT_QUESTION}}

Ziel:
- Struktur strikt einhalten:
  1) Hook mit konkreter Beobachtung
  2) Pain mit messbarer Folge
  3) Mechanik (Erkennen -> Entscheidung -> Versand)
  4) Risk-Reversal (Safe-Start, volle Kontrolle)
  5) Micro-CTA (nur ein klarer nächster Schritt)
- Persönlich in der gesamten Nachricht
- ohne Druck
- maximal ~140 Wörter

Ausgabe als JSON:
{
  "subject": "string (max 120)",
  "body": "string (max 1800)"
}`;

  const systemPrompt = normalizeMultiline(
    args.prompt?.system_prompt || fallbackSystemPrompt,
    5000,
  );
  const userPrompt = normalizeMultiline(
    applyVars(args.prompt?.user_prompt || fallbackUserPrompt, args.context),
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
          : 0.3,
      max_tokens:
        typeof args.prompt?.max_tokens === "number"
          ? Math.max(250, Math.min(1200, Math.round(args.prompt.max_tokens)))
          : 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as any;
  const raw = normalizeMultiline(json?.choices?.[0]?.message?.content || "", 4500);
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  const subject = normalizeLine(parsed?.subject, 120);
  const body = normalizeMultiline(parsed?.body, 1800);
  if (!body) return null;
  return { subject, body };
}

function buildTesterInvite(args: {
  companyName: string;
  contactName: string | null;
  city: string | null;
  objectFocus: string;
  hook: string | null;
  painPoint: string | null;
  primaryObjection: string | null;
  activeListingsCount: number | null;
  shareMietePercent: number | null;
  shareKaufPercent: number | null;
  automationReadiness: string | null;
  brandTone: string | null;
  sourceCheckedAt: string | null;
  linkedinUrl: string | null;
  evidence: string | null;
  channel: string;
  segmentKey: string;
  playbookTitle: string | null;
  valueNarrative: string;
  objectionRouteKey: string;
  objectionRouteLabel: string;
  objectionPillar: string;
  objectionResponse: string;
  objectionProof: string;
  objectionNextQuestion: string;
}) {
  const salutation = args.contactName
    ? `Hallo ${args.contactName},`
    : `Hallo Team von ${args.companyName},`;
  const cityLine = args.city ? ` in ${args.city}` : "";
  const focusLine =
    args.objectFocus && args.objectFocus !== "gemischt"
      ? ` mit Fokus auf ${args.objectFocus}`
      : "";
  const hook = args.hook
    ? `Mir ist bei ${args.companyName} besonders aufgefallen: ${args.hook}.`
    : `Ich habe mir ${args.companyName}${cityLine} angesehen und finde eure Positionierung sehr klar.`;
  const pain = args.painPoint
    ? `Meine Hypothese: ${args.painPoint}.`
    : `Wiederkehrende Interessentenanfragen erzeugen schnell manuellen Aufwand und verzögerte Rückmeldungen.`;
  const mixLine =
    typeof args.activeListingsCount === "number" &&
    (typeof args.shareMietePercent === "number" || typeof args.shareKaufPercent === "number")
      ? `Öffentlich sichtbar sind aktuell etwa ${args.activeListingsCount} aktive Inserate (Miete ${args.shareMietePercent ?? "?"}% / Kauf ${args.shareKaufPercent ?? "?"}%).`
      : "";
  const objectionLine = args.primaryObjection
    ? `Genau bei "${args.primaryObjection}" setzt der Safe-Start an: Kontrolle bleibt bei euch.`
    : "";
  const objectionRouteLine = args.objectionPillar
    ? `Einwand-Route: ${args.objectionRouteLabel} (${args.objectionPillar}).`
    : "";
  const objectionResponseLine = args.objectionResponse
    ? `Kurze Antwort darauf: ${args.objectionResponse}`
    : "";
  const objectionQuestionLine = args.objectionNextQuestion
    ? `Sinnvolle Rückfrage: ${args.objectionNextQuestion}`
    : "";
  const readinessLine = args.automationReadiness
    ? `Für euch passt wahrscheinlich ein ${args.automationReadiness}er Start: zuerst mehr Freigabe, dann schrittweise Automation.`
    : "";
  const evidenceLine = args.evidence ? `Konkreter Hinweis: ${args.evidence}` : "";
  const sourceLine = args.sourceCheckedAt ? `(Quelle geprüft am ${args.sourceCheckedAt})` : "";

  const body = `${salutation}

${hook}
${pain}
${mixLine}
${evidenceLine} ${sourceLine}

Konkret für euch relevant: ${args.valueNarrative}.
Wichtig dabei: Autopilot sendet nur bei klaren Fällen, unklare Fälle gehen zur Freigabe, und vor jedem Versand laufen Qualitätschecks.
${objectionLine}
${objectionRouteLine}
${objectionResponseLine}
${objectionQuestionLine}
${readinessLine}

Wenn das für ${args.companyName}${focusLine} passt, können wir in 15 Minuten unverbindlich prüfen, ob ein vorsichtiger Pilot sinnvoll ist.`;

  const subject =
    args.channel === "email"
      ? `Kurzer Pilot-Check für ${args.companyName}`
      : `Unverbindlicher Pilot-Check für Advaic`;

  return { subject, body };
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

  const channel = String(new URL(req.url).searchParams.get("channel") || "email")
    .trim()
    .toLowerCase();

  const supabase = createSupabaseAdminClient();
  const { data: prospect, error: prospectErr } = await (supabase.from("crm_prospects") as any)
    .select(
      "id, company_name, contact_name, city, object_focus, personalization_hook, pain_point_hypothesis, primary_objection, active_listings_count, share_miete_percent, share_kauf_percent, automation_readiness, brand_tone, source_checked_at, linkedin_url, personalization_evidence",
    )
    .eq("id", prospectId)
    .eq("agent_id", auth.user.id)
    .maybeSingle();

  if (prospectErr) {
    return NextResponse.json(
      { ok: false, error: "crm_prospect_lookup_failed", details: prospectErr.message },
      { status: 500 },
    );
  }
  if (!prospect) {
    return NextResponse.json({ ok: false, error: "prospect_not_found" }, { status: 404 });
  }

  const { data: notes } = await (supabase.from("crm_research_notes") as any)
    .select("note")
    .eq("agent_id", auth.user.id)
    .eq("prospect_id", prospectId)
    .eq("is_key_insight", true)
    .order("created_at", { ascending: false })
    .limit(1);

  const firstKeyNote = String(notes?.[0]?.note || "").trim();
  const inviteContext: InviteContext = {
    companyName: String(prospect.company_name || "").trim(),
    contactName: String(prospect.contact_name || "").trim() || null,
    city: String(prospect.city || "").trim() || null,
    objectFocus: String(prospect.object_focus || "gemischt").trim(),
    hook:
      firstKeyNote ||
      (String(prospect.personalization_hook || "").trim() || null),
    painPoint: String(prospect.pain_point_hypothesis || "").trim() || null,
    primaryObjection: String(prospect.primary_objection || "").trim() || null,
    activeListingsCount:
      typeof prospect.active_listings_count === "number" ? prospect.active_listings_count : null,
    shareMietePercent:
      typeof prospect.share_miete_percent === "number" ? prospect.share_miete_percent : null,
    shareKaufPercent:
      typeof prospect.share_kauf_percent === "number" ? prospect.share_kauf_percent : null,
    automationReadiness: String(prospect.automation_readiness || "").trim() || null,
    brandTone: String(prospect.brand_tone || "").trim() || null,
    sourceCheckedAt: String(prospect.source_checked_at || "").trim() || null,
    linkedinUrl: String(prospect.linkedin_url || "").trim() || null,
    evidence: String(prospect.personalization_evidence || "").trim() || null,
    channel,
    segmentKey: "unspezifisch",
    playbookTitle: null,
    valueNarrative: "",
    objectionRouteKey: "unbekannt",
    objectionRouteLabel: "Noch nicht klar",
    objectionPillar: "Diagnose zuerst",
    objectionResponse: "",
    objectionProof: "",
    objectionNextQuestion: "",
  };

  const segmentKey = inferSegmentFromProspect({
    object_focus: inviteContext.objectFocus,
    share_miete_percent: inviteContext.shareMietePercent,
    share_kauf_percent: inviteContext.shareKaufPercent,
    active_listings_count: inviteContext.activeListingsCount,
    automation_readiness: inviteContext.automationReadiness,
  });
  const playbook = getPlaybookForSegment(segmentKey);
  const objection = routeObjection(inviteContext.primaryObjection);
  inviteContext.segmentKey = segmentKey;
  inviteContext.playbookTitle = playbook?.title || null;
  inviteContext.valueNarrative = valueNarrativeForSegment(segmentKey, inviteContext.objectFocus);
  inviteContext.objectionRouteKey = objection.key;
  inviteContext.objectionRouteLabel = objection.label;
  inviteContext.objectionPillar = objection.response_pillar;
  inviteContext.objectionResponse = objection.short_rebuttal;
  inviteContext.objectionProof = objection.recommended_proof;
  inviteContext.objectionNextQuestion = objection.next_question;

  let tpl = buildTesterInvite(inviteContext);

  try {
    const activePrompt = await maybeLoadPrompt(supabase);
    const aiTemplate = await maybeGenerateInviteWithAi({
      prompt: activePrompt,
      context: inviteContext,
    });
    if (aiTemplate?.body) {
      tpl = {
        subject: aiTemplate.subject || tpl.subject,
        body: aiTemplate.body,
      };
    }
  } catch {
    // deterministic fallback above stays active
  }

  return NextResponse.json({ ok: true, template: tpl });
}
