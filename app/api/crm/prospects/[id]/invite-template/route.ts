import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { getPlaybookForSegment, inferSegmentFromProspect } from "@/lib/crm/salesIntelResearch";
import { routeObjection } from "@/lib/crm/objectionLibrary";
import { collectTriggerEvidence, evaluateFirstTouchGuardrails } from "@/lib/crm/cadenceRules";
import {
  assessResearchReadiness,
  evaluateOutboundMessageQuality,
} from "@/lib/crm/outboundQuality";

export const runtime = "nodejs";

type InviteContext = {
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
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
    .replaceAll("{{CONTACT_EMAIL}}", context.contactEmail || "")
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

function sanitizeOutreachSnippet(value: string | null | undefined, max = 240) {
  let text = normalizeMultiline(value, max);
  text = text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bkontaktquelle\b\s*:?/gi, "")
    .replace(/\bquelle\b\s*:?/gi, "")
    .replace(/\bimpressum\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!text) return "";

  const chunks = text
    .split(/[.!?]/)
    .map((x) => normalizeLine(x, 180))
    .filter(Boolean);
  const unique: string[] = [];
  for (const c of chunks) {
    if (!unique.includes(c)) unique.push(c);
    if (unique.length >= 2) break;
  }
  const compact = unique.join(". ").trim();
  if (!compact) return "";

  const digits = (compact.match(/\d/g) || []).length;
  const digitRatio = compact.length > 0 ? digits / compact.length : 0;
  if (digitRatio > 0.14) return "";

  return compact.endsWith(".") ? compact : `${compact}.`;
}

function deriveHookFromSignals(args: {
  companyName: string;
  city: string | null;
  activeListingsCount: number | null;
  shareMietePercent: number | null;
  shareKaufPercent: number | null;
  targetGroup: string | null;
}) {
  if (
    typeof args.activeListingsCount === "number" &&
    typeof args.shareMietePercent === "number" &&
    args.activeListingsCount >= 20 &&
    args.shareMietePercent >= 65
  ) {
    return "bei Ihnen viele Mietobjekte parallel vermarktet werden.";
  }
  if (
    typeof args.activeListingsCount === "number" &&
    typeof args.shareKaufPercent === "number" &&
    args.activeListingsCount >= 20 &&
    args.shareKaufPercent >= 65
  ) {
    return "bei Ihnen mehrere Kaufobjekte parallel in der Vermarktung sind.";
  }
  if (typeof args.activeListingsCount === "number" && args.activeListingsCount >= 15) {
    return "Sie mehrere Objekte parallel vermarkten und dabei viel Kommunikation gleichzeitig läuft.";
  }
  if (args.targetGroup) return `Ihr Auftritt klar auf ${args.targetGroup} ausgerichtet ist.`;
  if (args.city) return `Sie in ${args.city} sichtbar viele Anfragen parallel betreuen.`;
  return `${args.companyName} auf persönliche Betreuung setzt und parallel viele Anfragen steuern muss.`;
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
  const hasQuestion = body.includes("?");
  const hasRawNoise = /https?:\/\/\S+|\bkontaktquelle\b|\bimpressum\b/i.test(args.body);
  return hasPersonalSignal && hasQuestion && !hasRawNoise;
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
  triggerEvidenceCount: number;
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
    "Du optimierst Touch-1-Cold-Outreach für Advaic. Schreibe wie ein echter Gründer an einen Makler: ruhig, klar, natürlich, kurz, nicht salesy. Gib nur JSON zurück.";
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
- Die Nachricht muss sich wie ein echter, kurzer Founder-Text lesen.
- Touch 1 soll nur leisten:
  1) wer schreibt,
  2) warum genau diese Firma,
  3) welches plausible Alltagsproblem,
  4) eine kleine, leicht beantwortbare Frage.
- Keine Produktdetails in Touch 1 (kein Auto/Freigabe/Qualitätschecks).
- Keine Rohdaten, keine URLs, keine Report-Sprache.
- Maximal 90 Wörter, 3 bis 5 kurze Sätze.
- Kein Demo- oder Termin-Ask im Erstkontakt.
- Keine Buzzwords oder Marketingfloskeln.
- Schreibe ausschließlich in Sie-Ansprache.

Nutze als Stilvorlage diese Struktur:
"Hallo [Name],
ich bin Kilian, Gründer von Advaic.
Ich bin auf [Firma] gestoßen und hatte den Eindruck, dass bei Ihnen durch die vielen [Objekte] ziemlich viele ähnliche Interessentenanfragen parallel reinkommen dürften.
Genau in so einem Setup wird es schnell schwierig, überall zügig zu antworten, ohne dass unnötig Zeit in Standardfragen verloren geht oder Anfragen liegen bleiben.
Ist das bei Ihnen gerade ein relevantes Thema?"

Wichtig:
- Schreibe diese Vorlage nicht wörtlich ab.
- Übertrage nur Struktur, Natürlichkeit und Ton auf die konkreten Prospect-Daten.
- Keine URLs oder Rohdaten-Blöcke im Fließtext.

Ausgabe als JSON:
{
  "subject": "string (max 120)",
  "body": "string (max 1800)"
}`;

  const systemPrompt = normalizeMultiline(args.prompt?.system_prompt || fallbackSystemPrompt, 5000);
  const baseUserPrompt = applyVars(args.prompt?.user_prompt || fallbackUserPrompt, args.context);
  const hardTouch1Rules = `

HARTE TOUCH-1-REGELN (verbindlich, ohne Ausnahme):
- Der erste Satz muss natürlich sein: "ich bin Kilian, Gründer von Advaic." und darf NICHT mit "weil" verkettet werden.
- Keine Rohdaten, keine Prozente, keine URL, keine Kontaktquelle- oder Impressum-Referenz.
- Trigger immer in menschliche Sprache übersetzen.
- Keine Produktmechanik im Erstkontakt (kein automatisch/Freigabe/Qualitätschecks).
- Genau 3 bis 5 kurze Sätze, maximal 90 Wörter.
- Abschluss mit einer kleinen, reibungsarmen Frage.
- Ton: ruhig, klar, intelligent, menschlich, direkt, nicht salesy.
`;
  const userPrompt = normalizeMultiline(`${baseUserPrompt}${hardTouch1Rules}`, 8000);

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
  if (args.context.channel === "email") {
    const guardrail = evaluateFirstTouchGuardrails({
      body,
      triggerEvidenceCount: args.triggerEvidenceCount,
    });
    if (!guardrail.pass) return null;
  }
  return { subject, body };
}

function buildTesterInvite(args: {
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
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
  triggerEvidenceCount: number;
}) {
  const researchReadiness = assessResearchReadiness({
    preferredChannel: args.channel,
    contactEmail: args.contactEmail,
    personalizationHook: args.hook,
    personalizationEvidence: args.evidence,
    researchInsights: args.researchInsights,
    sourceCheckedAt: args.sourceCheckedAt,
    targetGroup: args.targetGroup,
    processHint: args.processHint,
    responsePromisePublic: args.responsePromisePublic,
    appointmentFlowPublic: args.appointmentFlowPublic,
    docsFlowPublic: args.docsFlowPublic,
    activeListingsCount: args.activeListingsCount,
    automationReadiness: args.automationReadiness,
    linkedinUrl: args.linkedinUrl,
  });
  const salutation = args.contactName ? `Hallo ${args.contactName},` : `Hallo ${args.companyName}-Team,`;
  const intro = "ich bin Kilian, Gründer von Advaic.";
  const defaultTrigger = deriveHookFromSignals({
    companyName: args.companyName,
    city: args.city,
    activeListingsCount: args.activeListingsCount,
    shareMietePercent: args.shareMietePercent,
    shareKaufPercent: args.shareKaufPercent,
    targetGroup: args.targetGroup,
  });
  const triggerCore =
    sanitizeOutreachSnippet(args.hook, 220) ||
    sanitizeOutreachSnippet(defaultTrigger, 220) ||
    `${args.companyName} mehrere Objekte parallel vermarktet und gleichzeitig auf persönliche Betreuung setzt.`;
  const triggerNatural = triggerCore
    .replace(/^(sie|ihr|ihre)\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();

  const triggerClause = (() => {
    const focus = String(args.objectFocus || "").toLowerCase();
    const mieteHeavy = typeof args.shareMietePercent === "number" && args.shareMietePercent >= 60;
    const kaufHeavy = typeof args.shareKaufPercent === "number" && args.shareKaufPercent >= 60;
    if (focus === "miete" || mieteHeavy) {
      return "bei Ihnen durch die vielen Mietobjekte ziemlich viele ähnliche Interessentenanfragen parallel reinkommen dürften";
    }
    if (focus === "kauf" || kaufHeavy) {
      return "bei Ihnen durch die laufende Kaufvermarktung viele ähnliche Interessentenanfragen parallel reinkommen dürften";
    }
    return triggerNatural || "bei Ihnen parallel viele ähnliche Interessentenanfragen reinkommen dürften";
  })();

  const painCore =
    sanitizeOutreachSnippet(args.painPoint, 220) ||
    "in so einem Setup wird es schnell schwierig, eingehende Anfragen überall zügig zu beantworten, ohne dass etwas liegen bleibt.";

  const mk = (sentence2: string, sentence3: string, sentence4: string) =>
    compactBody(`${salutation}

${intro}

${sentence2}

${sentence3}

${sentence4}`);

  const variants = [
    {
      key: "A",
      label: "am natürlichsten",
      subject: args.channel === "email" ? "Anfragen" : "",
      body: mk(
        `Ich bin auf ${args.companyName} gestoßen und hatte den Eindruck, dass ${triggerClause}.`,
        "Genau in so einem Setup wird es schnell schwierig, überall zügig zu antworten, ohne dass unnötig Zeit in Standardfragen verloren geht oder Anfragen liegen bleiben.",
        "Ist das bei Ihnen gerade ein relevantes Thema?",
      ),
    },
    {
      key: "B",
      label: "etwas direkter",
      subject: args.channel === "email" ? "Reaktionszeit" : "",
      body: mk(
        `Beim Blick auf ${args.companyName} hatte ich den Eindruck, dass ${triggerNatural}.`,
        "Dann wird es im Alltag oft eng, schnell genug zu antworten und trotzdem persönlich zu bleiben.",
        "Ist das bei Ihnen aktuell ein Thema oder haben Sie das bereits gut im Griff?",
      ),
    },
    {
      key: "C",
      label: "etwas schärfer",
      subject: args.channel === "email" ? "Betreuung" : "",
      body: mk(
        `Bei ${args.companyName} wirkt es so, dass ${triggerNatural}.`,
        "Operativ führt das häufig zu Verzögerungen bei Standardanfragen, obwohl eigentlich alles sauber laufen soll.",
        "Ist das bei Ihnen im Tagesgeschäft eher ein Engpass oder gerade kein Thema?",
      ),
    },
  ] as const;

  const scored = variants.map((variant) => {
    const guard = evaluateFirstTouchGuardrails({
      body: variant.body,
      triggerEvidenceCount: args.triggerEvidenceCount,
    });
    const review = evaluateOutboundMessageQuality({
      body: variant.body,
      subject: variant.subject,
      channel: args.channel,
      messageKind: "first_touch",
      companyName: args.companyName,
      city: args.city,
      personalizationHook: args.hook,
      triggerEvidenceCount: args.triggerEvidenceCount,
      researchReadiness,
    });
    return {
      ...variant,
      score: review.score,
      guard_reasons: guard.reasons,
      review,
    };
  });

  const qualityRank = (status: string) =>
    status === "pass" ? 2 : status === "needs_review" ? 1 : 0;
  const final = [...scored].sort((a, b) => {
    return qualityRank(b.review.status) - qualityRank(a.review.status) || b.score - a.score;
  })[0];
  return { final, variants: scored, research: researchReadiness };
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
      "id, company_name, contact_name, contact_email, city, region, object_focus, personalization_hook, pain_point_hypothesis, primary_objection, active_listings_count, new_listings_30d, share_miete_percent, share_kauf_percent, target_group, process_hint, response_promise_public, appointment_flow_public, docs_flow_public, trust_signals, automation_readiness, brand_tone, source_checked_at, linkedin_url, personalization_evidence",
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
    contactEmail: String((prospect as any).contact_email || "").trim() || null,
    city: String(prospect.city || "").trim() || null,
    region: String(prospect.region || "").trim() || null,
    objectFocus: String(prospect.object_focus || "gemischt").trim(),
    hook:
      sanitizeOutreachSnippet(firstKeyNote, 220) ||
      sanitizeOutreachSnippet(String(prospect.personalization_hook || "").trim(), 220) ||
      null,
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
    evidence: sanitizeOutreachSnippet(String(prospect.personalization_evidence || "").trim(), 260) || null,
    researchInsights: sanitizeOutreachSnippet(mergedResearchInsights, 320) || null,
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
  const triggerEvidenceCount = collectTriggerEvidence({
    companyName: inviteContext.companyName,
    city: inviteContext.city,
    region: inviteContext.region,
    objectFocus: inviteContext.objectFocus,
    activeListingsCount: inviteContext.activeListingsCount,
    newListings30d: inviteContext.newListings30d,
    shareMietePercent: inviteContext.shareMietePercent,
    shareKaufPercent: inviteContext.shareKaufPercent,
    targetGroup: inviteContext.targetGroup,
    processHint: inviteContext.processHint,
    personalizationHook: inviteContext.hook,
    personalizationEvidence: inviteContext.evidence,
    sourceCheckedAt: inviteContext.sourceCheckedAt,
  }).length;

  const invitePack = buildTesterInvite({
    ...inviteContext,
    triggerEvidenceCount,
  });
  let tpl: { subject: string; body: string } = {
    subject: invitePack.final.subject || "Anfragen",
    body: invitePack.final.body,
  };
  let templateReview = invitePack.final.review;
  let generatedWith: "ai" | "fallback" = "fallback";
  let aiCandidate: { subject: string; body: string } | null = null;
  let aiCandidateReview: ReturnType<typeof evaluateOutboundMessageQuality> | null = null;

  try {
    const activePrompt = await maybeLoadPrompt(supabase);
    const aiTemplate = await maybeGenerateInviteWithAi({
      prompt: activePrompt,
      context: inviteContext,
      triggerEvidenceCount,
    });
    if (aiTemplate?.body) {
      aiCandidate = {
        subject: aiTemplate.subject || "Anfragen",
        body: aiTemplate.body,
      };
      aiCandidateReview = evaluateOutboundMessageQuality({
        body: aiTemplate.body,
        subject: aiTemplate.subject || "Anfragen",
        channel,
        messageKind: "first_touch",
        companyName: inviteContext.companyName,
        city: inviteContext.city,
        personalizationHook: inviteContext.hook,
        triggerEvidenceCount,
        researchReadiness: invitePack.research,
      });
      const candidateRank = aiCandidateReview.status === "pass" ? 2 : aiCandidateReview.status === "needs_review" ? 1 : 0;
      const currentRank = templateReview.status === "pass" ? 2 : templateReview.status === "needs_review" ? 1 : 0;
      if (
        candidateRank > currentRank ||
        (candidateRank === currentRank && aiCandidateReview.score > templateReview.score)
      ) {
        tpl = aiCandidate;
        templateReview = aiCandidateReview;
        generatedWith = "ai";
      }
    }
  } catch {
    // deterministic fallback above stays active
  }

  return NextResponse.json({
    ok: true,
    generated_with: generatedWith,
    template: tpl,
    template_review: templateReview,
    research: invitePack.research,
    final_variant: invitePack.final.key,
    variants: invitePack.variants.map((variant) => ({
      key: variant.key,
      label: variant.label,
      subject: variant.subject || "",
      body: variant.body,
      score: variant.score,
      guard_reasons: variant.guard_reasons,
      review_status: variant.review.status,
      review_summary: variant.review.summary,
    })),
    ai_candidate: aiCandidate,
    ai_candidate_review: aiCandidateReview,
  });
}
