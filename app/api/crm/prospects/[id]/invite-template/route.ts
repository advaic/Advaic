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
  region: string | null;
  objectFocus: string;
  hook: string | null;
  painPoint: string | null;
  primaryObjection: string | null;
  activeListingsCount: number | null;
  newListings30d: number | null;
  shareMietePercent: number | null;
  shareKaufPercent: number | null;
  targetGroup: string | null;
  processHint: string | null;
  responsePromisePublic: string | null;
  appointmentFlowPublic: string | null;
  docsFlowPublic: string | null;
  trustSignals: string[];
  automationReadiness: string | null;
  brandTone: string | null;
  sourceCheckedAt: string | null;
  linkedinUrl: string | null;
  evidence: string | null;
  researchInsights: string | null;
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
    .replaceAll("{{REGION}}", context.region || "")
    .replaceAll("{{OBJECT_FOCUS}}", context.objectFocus || "gemischt")
    .replaceAll("{{HOOK}}", context.hook || "")
    .replaceAll("{{PAIN_POINT}}", context.painPoint || "")
    .replaceAll("{{PRIMARY_OBJECTION}}", context.primaryObjection || "")
    .replaceAll("{{ACTIVE_LISTINGS_COUNT}}", String(context.activeListingsCount ?? ""))
    .replaceAll("{{NEW_LISTINGS_30D}}", String(context.newListings30d ?? ""))
    .replaceAll("{{SHARE_MIETE_PERCENT}}", String(context.shareMietePercent ?? ""))
    .replaceAll("{{SHARE_KAUF_PERCENT}}", String(context.shareKaufPercent ?? ""))
    .replaceAll("{{TARGET_GROUP}}", context.targetGroup || "")
    .replaceAll("{{PROCESS_HINT}}", context.processHint || "")
    .replaceAll("{{RESPONSE_PROMISE_PUBLIC}}", context.responsePromisePublic || "")
    .replaceAll("{{APPOINTMENT_FLOW_PUBLIC}}", context.appointmentFlowPublic || "")
    .replaceAll("{{DOCS_FLOW_PUBLIC}}", context.docsFlowPublic || "")
    .replaceAll("{{TRUST_SIGNALS}}", context.trustSignals.join("; "))
    .replaceAll("{{AUTOMATION_READINESS}}", context.automationReadiness || "")
    .replaceAll("{{BRAND_TONE}}", context.brandTone || "")
    .replaceAll("{{SOURCE_CHECKED_AT}}", context.sourceCheckedAt || "")
    .replaceAll("{{LINKEDIN_URL}}", context.linkedinUrl || "")
    .replaceAll("{{PERSONALIZATION_EVIDENCE}}", context.evidence || "")
    .replaceAll("{{RESEARCH_INSIGHTS}}", context.researchInsights || "")
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

function joinNonEmpty(parts: Array<string | null | undefined>, separator = " ") {
  return parts
    .map((x) => normalizeMultiline(x, 320))
    .filter(Boolean)
    .join(separator)
    .trim();
}

function compactBody(text: string) {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function deriveHookFromSignals(args: {
  companyName: string;
  city: string | null;
  activeListingsCount: number | null;
  shareMietePercent: number | null;
  shareKaufPercent: number | null;
  targetGroup: string | null;
}) {
  if (typeof args.activeListingsCount === "number") {
    const miete = typeof args.shareMietePercent === "number" ? args.shareMietePercent : "?";
    const kauf = typeof args.shareKaufPercent === "number" ? args.shareKaufPercent : "?";
    return `${args.companyName} hat aktuell ca. ${args.activeListingsCount} aktive Inserate (Miete ${miete}% / Kauf ${kauf}%).`;
  }
  if (args.targetGroup) return `Ihre Positionierung wirkt klar auf ${args.targetGroup} ausgerichtet.`;
  if (args.city) return `Ihre Präsenz in ${args.city} fällt durch einen klaren Fokus auf.`;
  return `Ihre Positionierung bei ${args.companyName} wirkt klar und fokussiert.`;
}

function hasStrongInviteOutput(args: {
  body: string;
  companyName: string;
  city: string | null;
  hook: string | null;
}) {
  const body = args.body.toLowerCase();
  const companyToken = normalizeLine(args.companyName, 80).toLowerCase();
  const cityToken = normalizeLine(args.city, 80).toLowerCase();
  const hookToken = normalizeLine(args.hook, 40).toLowerCase();
  const hasPersonalSignal =
    (companyToken.length > 2 && body.includes(companyToken)) ||
    (cityToken.length > 2 && body.includes(cityToken)) ||
    (hookToken.length > 10 && body.includes(hookToken.slice(0, 18)));
  const hasSafetySignal =
    (body.includes("freigabe") || body.includes("freigeben")) &&
    (body.includes("qualitätscheck") ||
      body.includes("qualitaetscheck") ||
      body.includes("qualitätskontroll") ||
      body.includes("qualitaetskontroll"));
  return hasPersonalSignal && hasSafetySignal;
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
    "Du bist ein Top-Sales-Writer für B2B-Outreach im Immobilienbereich. Schreibe natürlich, glaubwürdig und konkret in professioneller Sie-Ansprache. Gib nur JSON zurück.";
  const fallbackUserPrompt = `Erzeuge eine personalisierte Tester-Einladung.
Kontext:
- Firma: {{COMPANY_NAME}}
- Kontakt: {{CONTACT_NAME}}
- Ort: {{CITY}}
- Region: {{REGION}}
- Fokus: {{OBJECT_FOCUS}}
- Hook: {{HOOK}}
- Pain Point: {{PAIN_POINT}}
- Primäre Objection: {{PRIMARY_OBJECTION}}
- Aktive Inserate: {{ACTIVE_LISTINGS_COUNT}}
- Neue Inserate 30 Tage: {{NEW_LISTINGS_30D}}
- Mix Miete/Kauf: {{SHARE_MIETE_PERCENT}}/{{SHARE_KAUF_PERCENT}}
- Zielgruppe: {{TARGET_GROUP}}
- Prozess-Hinweis: {{PROCESS_HINT}}
- Öffentliches Antwortversprechen: {{RESPONSE_PROMISE_PUBLIC}}
- Öffentlicher Terminablauf: {{APPOINTMENT_FLOW_PUBLIC}}
- Öffentlicher Unterlagenablauf: {{DOCS_FLOW_PUBLIC}}
- Trust-Signale: {{TRUST_SIGNALS}}
- Readiness: {{AUTOMATION_READINESS}}
- Brand-Ton: {{BRAND_TONE}}
- Quelle geprüft am: {{SOURCE_CHECKED_AT}}
- LinkedIn: {{LINKEDIN_URL}}
- Evidenz: {{PERSONALIZATION_EVIDENCE}}
- Research-Insights: {{RESEARCH_INSIGHTS}}
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
- Die Nachricht muss sich wie von einem echten Menschen geschrieben lesen, nicht wie ein Template.
- Verwende mindestens 2 konkrete Kontexthinweise aus den Daten.
- Erkläre die Produktlogik verständlich in 1 Satz:
  "klar = Auto, unklar = Freigabe, vor Versand Qualitätschecks".
- Kein Buzzword-Sprech, keine Floskeln wie "revolutionär", "next level", "ich hoffe, es geht Ihnen gut".
- Keine Aufzählungen und keine Abschnittsüberschriften im E-Mail-Text.
- Maximal 120 Wörter.
- Genau ein druckfreier CTA-Satz am Ende.
- Schreibe ausschließlich in Sie-Ansprache.

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
  const body = compactBody(normalizeMultiline(parsed?.body, 1800));
  if (!body) return null;
  if (
    !hasStrongInviteOutput({
      body,
      companyName: args.context.companyName,
      city: args.context.city,
      hook: args.context.hook,
    })
  ) {
    return null;
  }
  return { subject, body };
}

function buildTesterInvite(args: {
  companyName: string;
  contactName: string | null;
  city: string | null;
  region: string | null;
  objectFocus: string;
  hook: string | null;
  painPoint: string | null;
  primaryObjection: string | null;
  activeListingsCount: number | null;
  newListings30d: number | null;
  shareMietePercent: number | null;
  shareKaufPercent: number | null;
  targetGroup: string | null;
  processHint: string | null;
  responsePromisePublic: string | null;
  appointmentFlowPublic: string | null;
  docsFlowPublic: string | null;
  trustSignals: string[];
  automationReadiness: string | null;
  brandTone: string | null;
  sourceCheckedAt: string | null;
  linkedinUrl: string | null;
  evidence: string | null;
  researchInsights: string | null;
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
  const salutation = args.contactName ? `Hallo ${args.contactName},` : `Hallo ${args.companyName}-Team,`;
  const defaultHook = deriveHookFromSignals({
    companyName: args.companyName,
    city: args.city,
    activeListingsCount: args.activeListingsCount,
    shareMietePercent: args.shareMietePercent,
    shareKaufPercent: args.shareKaufPercent,
    targetGroup: args.targetGroup,
  });
  const hook = normalizeMultiline(args.hook || defaultHook, 280);
  const pain = normalizeMultiline(
    args.painPoint ||
      "im Tagesgeschäft gehen bei vielen wiederkehrenden Interessentenanfragen schnell wertvolle Minuten im Postfach verloren.",
    280,
  );
  const focusLabel =
    args.objectFocus && args.objectFocus !== "gemischt"
      ? args.objectFocus === "miete"
        ? "Vermietungsanfragen"
        : args.objectFocus === "kauf"
          ? "Kaufanfragen"
          : "Interessentenanfragen"
      : "Interessentenanfragen";
  const mixLine =
    typeof args.activeListingsCount === "number"
      ? `Öffentlich sichtbar sind derzeit rund ${args.activeListingsCount} aktive Inserate${
          typeof args.shareMietePercent === "number" || typeof args.shareKaufPercent === "number"
            ? ` (Miete ${args.shareMietePercent ?? "?"}% / Kauf ${args.shareKaufPercent ?? "?"}%).`
            : "."
        }`
      : "";
  const newListingsLine =
    typeof args.newListings30d === "number" ? `${args.newListings30d} neue Inserate in 30 Tagen deuten auf laufenden Anfragefluss hin.` : "";
  const evidenceLine = joinNonEmpty([args.evidence, args.researchInsights], " ");
  const readinessLine = args.automationReadiness
    ? `Für den Start passt meist ${args.automationReadiness}: erst mehr Freigabe, dann schrittweise mehr Auto-Senden.`
    : "Für den Start funktioniert ein Safe-Setup mit hoher Freigabequote besonders gut.";
  const objectionLine = args.primaryObjection
    ? `Falls bei Ihnen der Punkt "${args.primaryObjection}" im Raum steht: ${args.objectionResponse || "diesen Teil steuern Sie über klare Regeln und Freigabe."}`
    : "";
  const sourceLine = args.sourceCheckedAt ? `Stand der öffentlichen Daten: ${args.sourceCheckedAt}.` : "";

  const body = compactBody(`${salutation}

ich melde mich, weil ${hook}
${pain}
${mixLine}
${newListingsLine}
${evidenceLine}

Genau dafür ist Advaic gedacht: klare Fälle können automatisch beantwortet werden, unklare Fälle gehen zur Freigabe, und vor jedem Versand laufen Qualitätschecks.
So gewinnen Sie bei ${focusLabel} Zeit, ohne Kontrolle über Ton und Inhalte abzugeben.
${readinessLine}
${objectionLine}
${sourceLine}

Wenn Sie möchten, zeige ich Ihnen in 15 Minuten unverbindlich, wie ein vorsichtiger Pilot für ${args.companyName} konkret aussehen kann.`);

  const subject =
    args.channel === "email"
      ? `Kurze Idee für ${args.companyName}: weniger Routine im Postfach`
      : `Unverbindlicher Pilot-Check für ${args.companyName}`;

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
      "id, company_name, contact_name, city, region, object_focus, personalization_hook, pain_point_hypothesis, primary_objection, active_listings_count, new_listings_30d, share_miete_percent, share_kauf_percent, target_group, process_hint, response_promise_public, appointment_flow_public, docs_flow_public, trust_signals, automation_readiness, brand_tone, source_checked_at, linkedin_url, personalization_evidence",
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
    .limit(3);

  const keyNotes = (notes || [])
    .map((n: any) => normalizeMultiline(n?.note, 220))
    .filter(Boolean)
    .slice(0, 3);
  const firstKeyNote = keyNotes[0] || "";
  const mergedResearchInsights = keyNotes.join(" ");
  const inviteContext: InviteContext = {
    companyName: String(prospect.company_name || "").trim(),
    contactName: String(prospect.contact_name || "").trim() || null,
    city: String(prospect.city || "").trim() || null,
    region: String(prospect.region || "").trim() || null,
    objectFocus: String(prospect.object_focus || "gemischt").trim(),
    hook:
      firstKeyNote ||
      (String(prospect.personalization_hook || "").trim() || null),
    painPoint: String(prospect.pain_point_hypothesis || "").trim() || null,
    primaryObjection: String(prospect.primary_objection || "").trim() || null,
    activeListingsCount:
      typeof prospect.active_listings_count === "number" ? prospect.active_listings_count : null,
    newListings30d:
      typeof prospect.new_listings_30d === "number" ? prospect.new_listings_30d : null,
    shareMietePercent:
      typeof prospect.share_miete_percent === "number" ? prospect.share_miete_percent : null,
    shareKaufPercent:
      typeof prospect.share_kauf_percent === "number" ? prospect.share_kauf_percent : null,
    targetGroup: String(prospect.target_group || "").trim() || null,
    processHint: String(prospect.process_hint || "").trim() || null,
    responsePromisePublic: String(prospect.response_promise_public || "").trim() || null,
    appointmentFlowPublic: String(prospect.appointment_flow_public || "").trim() || null,
    docsFlowPublic: String(prospect.docs_flow_public || "").trim() || null,
    trustSignals: Array.isArray(prospect.trust_signals)
      ? prospect.trust_signals.map((x: any) => normalizeLine(x, 140)).filter(Boolean)
      : [],
    automationReadiness: String(prospect.automation_readiness || "").trim() || null,
    brandTone: String(prospect.brand_tone || "").trim() || null,
    sourceCheckedAt: String(prospect.source_checked_at || "").trim() || null,
    linkedinUrl: String(prospect.linkedin_url || "").trim() || null,
    evidence: String(prospect.personalization_evidence || "").trim() || null,
    researchInsights: mergedResearchInsights || null,
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

  const personalizationSignalCount = [
    inviteContext.hook,
    inviteContext.evidence,
    inviteContext.researchInsights,
    inviteContext.targetGroup,
    inviteContext.processHint,
    typeof inviteContext.activeListingsCount === "number"
      ? String(inviteContext.activeListingsCount)
      : "",
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean).length;
  if (personalizationSignalCount === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "crm_context_too_thin",
        details:
          "Zu wenig Kontext für eine hochwertige Sales-Nachricht. Bitte zuerst mindestens Hook, Evidenz oder Research-Notiz ergänzen.",
      },
      { status: 422 },
    );
  }

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
