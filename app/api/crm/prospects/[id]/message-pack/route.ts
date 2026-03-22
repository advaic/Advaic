import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { getPlaybookForSegment, inferSegmentFromProspect } from "@/lib/crm/salesIntelResearch";
import { routeObjection } from "@/lib/crm/objectionLibrary";
import { collectTriggerEvidence, evaluateFirstTouchGuardrails } from "@/lib/crm/cadenceRules";
import {
  assessResearchReadiness,
} from "@/lib/crm/outboundQuality";
import { ensureProspectStrategyDecision } from "@/lib/crm/strategyEngine";
import {
  evaluateGroundedOutboundMessageQuality,
  loadGroundedReviewContext,
} from "@/lib/crm/qualityReviewEngine";

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

function compactBody(text: string) {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeOutreachSnippet(value: string | null | undefined, max = 260) {
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
    .map((x) => normalizeLine(x, 170))
    .filter(Boolean);
  const unique: string[] = [];
  for (const c of chunks) {
    if (!unique.includes(c)) unique.push(c);
    if (unique.length >= 2) break;
  }
  const compact = unique.join(". ").trim();
  if (!compact) return "";
  return compact.endsWith(".") ? compact : `${compact}.`;
}

function hasPersonalSignals(text: string, companyName: string, city: string | null, hook: string | null) {
  const lower = text.toLowerCase();
  const companyToken = normalizeLine(companyName, 80).toLowerCase();
  const cityToken = normalizeLine(city, 80).toLowerCase();
  const hookToken = normalizeLine(hook, 36).toLowerCase();
  return (
    (companyToken.length > 2 && lower.includes(companyToken)) ||
    (cityToken.length > 2 && lower.includes(cityToken)) ||
    (hookToken.length > 10 && lower.includes(hookToken.slice(0, 16)))
  );
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
  region: string | null;
  objectFocus: string;
  hook: string | null;
  pain: string | null;
  objection: string | null;
  activeListingsCount: number | null;
  newListings30d: number | null;
  mix: string;
  evidence: string;
  researchInsights: string;
  segmentKey: string;
  playbookTitle: string | null;
  valueNarrative: string;
}) {
  const salutation = args.contactName
    ? `Hallo ${args.contactName},`
    : `Hallo ${args.companyName}-Team,`;
  const hook =
    args.hook ||
    `${args.companyName} fällt mit einer klaren Positionierung im Markt auf.`;
  const pain =
    args.pain ||
    "Viele ähnliche Interessentenanfragen binden im Tagesgeschäft spürbar Zeit und verzögern Rückmeldungen.";
  const objection =
    args.objection ||
    "Wichtig ist, dass die Kommunikation im Alltag verlässlich und persönlich bleibt.";
  const objectionRoute = routeObjection(args.objection);
  const focusLower = String(args.objectFocus || "").toLowerCase();
  const triggerClause =
    focusLower === "miete"
      ? "bei Ihnen durch die vielen Mietobjekte ziemlich viele ähnliche Interessentenanfragen parallel reinkommen dürften"
      : focusLower === "kauf"
        ? "bei Ihnen durch die laufende Kaufvermarktung viele ähnliche Interessentenanfragen parallel reinkommen dürften"
        : "bei Ihnen parallel viele ähnliche Interessentenanfragen reinkommen dürften";
  const listingHint =
    typeof args.activeListingsCount === "number"
      ? "Es wirkt so, als würden bei Ihnen mehrere Objekte parallel betreut."
      : "";
  const growthHint =
    typeof args.newListings30d === "number"
      ? "Der aktuelle Vermarktungsrhythmus deutet auf laufend neue Anfragen hin."
      : "";
  const evidenceHint = [args.evidence, args.researchInsights].filter(Boolean).join(" ");
  const signalLine =
    listingHint || growthHint || evidenceHint || `${args.companyName} wirkt in ${args.city || args.region || "Ihrer Region"} sehr präsent.`;

  const emailBody = compactBody(`${salutation}

ich bin Kilian, Gründer von Advaic.
Ich bin auf ${args.companyName} gestoßen und hatte den Eindruck, dass ${triggerClause}.
Genau in so einem Setup wird es schnell schwierig, überall zügig zu antworten, ohne dass unnötig Zeit in Standardfragen verloren geht oder Anfragen liegen bleiben.
Ist das bei Ihnen aktuell ein Thema oder haben Sie das intern bereits gut im Griff?`);

  const linkedinBody = compactBody(`Hallo ${args.contactName || args.companyName},
ich bin Kilian von Advaic.
Beim Blick auf ${args.companyName} hatte ich den Eindruck, dass ${hook.replace(/[.!?]+$/, "")}.
${pain}
Ist das für Sie gerade ein Thema?`);

  const phoneBody = compactBody(`Telefonleitfaden:
1) Bezug herstellen: "${hook}"
2) Pain spiegeln: "${pain} ${signalLine}"
3) Folgen konkret machen: "Wo verlieren Sie aktuell die meiste Zeit bei Anfragen?"
4) Einwand aufnehmen: "${objection} ${objectionRoute.short_rebuttal}"
5) Abschlussfrage: "Ist das aktuell relevant oder intern bereits gut gelöst?"`);

  return {
    reason:
      "Die Varianten sind natürlich formuliert, nutzen konkrete Kontextsignale und erklären die Guardrails ohne künstliche Floskeln.",
    messages: [
      {
        channel: "email" as const,
        variant: "email_personal_v3",
        subject: "Anfragen",
        body: emailBody,
        why: "Persönlich, konkret, druckfrei und mit klarer Sicherheitslogik.",
      },
      {
        channel: "linkedin" as const,
        variant: "linkedin_compact_v3",
        subject: "",
        body: linkedinBody,
        why: "Sehr kompakt, menschlich und ohne Sales-Druck.",
      },
      {
        channel: "telefon" as const,
        variant: "call_script_v3",
        subject: "",
        body: phoneBody,
        why: "Gesprächsleitfaden mit klarer Struktur und natürlicher Sprache.",
      },
    ],
  };
}

async function maybeGenerateWithAi(args: {
  prompt: PromptRow | null;
  vars: Record<string, string>;
  triggerEvidenceCount: number;
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
    "Du bist ein Top-Sales-Writer für natürliche Touch-1-Outreach-Nachrichten an deutsche Immobilienmakler. Schreibe professionell in Sie-Ansprache. Keine künstlichen Phrasen, kein Kaufdruck. Gib nur JSON zurück.";
  const fallbackUser = `Erzeuge ein Nachrichtenpaket mit 3 Varianten:
- email
- linkedin
- telefon (Call-Script)

Alle Varianten müssen sich natürlich lesen und in der gesamten Nachricht konkret personalisiert sein.
Pflicht in jeder Variante:
- klarer Anlass, warum genau diese Firma
- alltagsnahes Problem
- genau eine kleine Relevanzfrage

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
- Research-Insights: {{RESEARCH_INSIGHTS}}
- Objection-Route: {{OBJECTION_ROUTE}}
- Objection-Pillar: {{OBJECTION_PILLAR}}
- Objection-Antwort: {{OBJECTION_RESPONSE}}
- Objection-Next-Question: {{OBJECTION_NEXT_QUESTION}}
- Segment: {{SEGMENT_KEY}}
- Playbook: {{PLAYBOOK_TITLE}}
- Value-Narrativ: {{VALUE_NARRATIVE}}

Regeln:
- Keine Aufzählungsüberschriften im Fließtext.
- Kein Buzzword-Sprech.
- E-Mail: 60 bis 90 Wörter, maximal 5 Sätze.
- LinkedIn: 35 bis 65 Wörter.
- Telefon-Skript: 5 klare Schritte.
- Kein Demo-/Termin-Ask in E-Mail oder LinkedIn.
- Keine URLs im Fließtext.
- Keine Produktmechanik im Erstkontakt (kein Auto/Freigabe/Qualitätschecks).

Stilvorlage für E-Mail/LinkedIn (nicht wörtlich kopieren, nur Struktur):
1) Mini-Intro (wer schreibt)
2) Konkreter Trigger (warum genau diese Firma)
3) Plausibles Problem im Alltag
4) Kleine Relevanzfrage

Gib nur JSON zurück:
{
  "recommendation_reason": "string",
  "messages": [
    {"channel":"email","variant":"email_personal_v2","subject":"string","body":"string","why":"string"},
    {"channel":"linkedin","variant":"linkedin_compact_v2","subject":"","body":"string","why":"string"},
    {"channel":"telefon","variant":"call_script_v2","subject":"","body":"string","why":"string"}
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
      body: compactBody(normalizeMultiline(msg?.body, 1800)),
      why: normalizeLine(msg?.why, 260),
    }))
    .filter((msg: any) => allowedChannels.has(msg.channel) && msg.body)
    .slice(0, 3) as PackMessage[];

  if (messages.length < 3) return null;
  const email = messages.find((x) => x.channel === "email");
  const linkedin = messages.find((x) => x.channel === "linkedin");
  const telefon = messages.find((x) => x.channel === "telefon");
  if (!email || !linkedin || !telefon) return null;
  if (!hasPersonalSignals(email.body, args.vars.COMPANY_NAME || "", args.vars.CITY || null, args.vars.HOOK || null)) {
    return null;
  }
  const guardrail = evaluateFirstTouchGuardrails({
    body: email.body,
    triggerEvidenceCount: args.triggerEvidenceCount,
  });
  if (!guardrail.pass) return null;
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
      "id, company_name, contact_name, contact_email, city, region, object_focus, personalization_hook, pain_point_hypothesis, primary_objection, active_listings_count, new_listings_30d, share_miete_percent, share_kauf_percent, personalization_evidence, target_group, process_hint, source_checked_at",
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

  const { data: notes } = await (supabase.from("crm_research_notes") as any)
    .select("note")
    .eq("agent_id", auth.user.id)
    .eq("prospect_id", prospectId)
    .eq("is_key_insight", true)
    .order("created_at", { ascending: false })
    .limit(3);
  const researchInsights = (notes || [])
    .map((n: any) => normalizeMultiline(n?.note, 180))
    .filter(Boolean)
    .join(" ");
  const strategyResult = await ensureProspectStrategyDecision(supabase, {
    agentId: String(auth.user.id),
    prospectId,
    prospect,
  });
  const strategy = strategyResult.ok ? strategyResult.strategy : null;

  const mix = `Miete ${typeof prospect.share_miete_percent === "number" ? prospect.share_miete_percent : "?"}% / Kauf ${typeof prospect.share_kauf_percent === "number" ? prospect.share_kauf_percent : "?"}%`;
  const args = {
    companyName: normalizeLine(prospect.company_name, 160),
    contactName: normalizeLine(prospect.contact_name, 120) || null,
    contactEmail:
      normalizeLine((prospect as any).contact_email, 240) ||
      (strategy?.chosen_contact_channel === "email"
        ? normalizeLine(strategy.chosen_contact_value, 240) || null
        : null),
    city: normalizeLine(prospect.city, 120) || null,
    region: normalizeLine(prospect.region, 120) || null,
    objectFocus: normalizeLine(prospect.object_focus, 40) || "gemischt",
    hook:
      sanitizeOutreachSnippet(strategy?.chosen_trigger, 280) ||
      sanitizeOutreachSnippet(prospect.personalization_hook, 280) ||
      null,
    pain:
      sanitizeOutreachSnippet(strategy?.chosen_angle, 280) ||
      sanitizeOutreachSnippet(prospect.pain_point_hypothesis, 280) ||
      null,
    objection: sanitizeOutreachSnippet(prospect.primary_objection, 240) || null,
    activeListingsCount:
      typeof prospect.active_listings_count === "number" ? prospect.active_listings_count : null,
    newListings30d: typeof prospect.new_listings_30d === "number" ? prospect.new_listings_30d : null,
    mix,
    evidence: sanitizeOutreachSnippet(prospect.personalization_evidence, 300) || "",
    researchInsights: sanitizeOutreachSnippet(researchInsights, 320),
  };

  const personalizationSignalCount = [
    args.hook,
    args.pain,
    args.evidence,
    args.researchInsights,
    typeof args.activeListingsCount === "number" ? String(args.activeListingsCount) : "",
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean).length;
  if (personalizationSignalCount === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "crm_context_too_thin",
        details:
          "Zu wenig Kontext für ein hochwertiges Nachrichtenpaket. Bitte zuerst Hook, Evidenz oder Research-Notiz ergänzen.",
      },
      { status: 422 },
    );
  }

  const inferredSegmentKey = inferSegmentFromProspect({
    object_focus: args.objectFocus,
    share_miete_percent: prospect.share_miete_percent,
    share_kauf_percent: prospect.share_kauf_percent,
    active_listings_count: args.activeListingsCount,
    automation_readiness: null,
  });
  const segmentKey = strategy?.segment_key || inferredSegmentKey;
  const playbook = getPlaybookForSegment(segmentKey as any);
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
    RESEARCH_INSIGHTS: args.researchInsights,
    OBJECTION_ROUTE: objectionRouteData.label,
    OBJECTION_PILLAR: objectionRouteData.response_pillar,
    OBJECTION_RESPONSE: objectionRouteData.short_rebuttal,
    OBJECTION_NEXT_QUESTION: objectionRouteData.next_question,
    SEGMENT_KEY: segmentKey,
    PLAYBOOK_TITLE: playbook?.title || "",
    VALUE_NARRATIVE: valueNarrative,
  };
  const triggerEvidenceCount = collectTriggerEvidence({
    companyName: args.companyName,
    city: args.city,
    region: args.region,
    objectFocus: args.objectFocus,
    activeListingsCount: args.activeListingsCount,
    newListings30d: args.newListings30d,
    shareMietePercent:
      typeof prospect.share_miete_percent === "number" ? prospect.share_miete_percent : null,
    shareKaufPercent:
      typeof prospect.share_kauf_percent === "number" ? prospect.share_kauf_percent : null,
    targetGroup: normalizeMultiline(prospect.target_group, 220) || null,
    processHint: normalizeMultiline(prospect.process_hint, 220) || null,
    personalizationHook: args.hook,
    personalizationEvidence: args.evidence || null,
    sourceCheckedAt: normalizeLine(prospect.source_checked_at, 40) || null,
  }).length;
  const research =
    strategyResult.ok && strategyResult.research
      ? strategyResult.research
      : assessResearchReadiness({
          preferredChannel: "email",
          contactEmail: args.contactEmail,
          personalizationHook: args.hook,
          personalizationEvidence: args.evidence || null,
          researchInsights: args.researchInsights || null,
          sourceCheckedAt: normalizeLine(prospect.source_checked_at, 40) || null,
          targetGroup: normalizeMultiline(prospect.target_group, 220) || null,
          processHint: normalizeMultiline(prospect.process_hint, 220) || null,
          activeListingsCount: args.activeListingsCount,
          linkedinSearchUrl: null,
        });
  const groundedContexts = {
    email: await loadGroundedReviewContext(supabase, {
      agentId: String(auth.user.id),
      prospectId,
      channel: "email",
      messageKind: "first_touch",
      segmentKey,
      playbookKey: playbook?.key || strategy?.playbook_key || null,
    }),
    linkedin: await loadGroundedReviewContext(supabase, {
      agentId: String(auth.user.id),
      prospectId,
      channel: "linkedin",
      messageKind: "first_touch",
      segmentKey,
      playbookKey: playbook?.key || strategy?.playbook_key || null,
    }),
    telefon: await loadGroundedReviewContext(supabase, {
      agentId: String(auth.user.id),
      prospectId,
      channel: "telefon",
      messageKind: "custom",
      segmentKey,
      playbookKey: playbook?.key || strategy?.playbook_key || null,
    }),
  } as const;

  const reviewPackMessages = (rows: PackMessage[]) =>
    rows.map((message) => {
      const review = evaluateGroundedOutboundMessageQuality({
        body: message.body,
        subject: message.subject,
        channel: message.channel,
        messageKind: message.channel === "telefon" ? "custom" : "first_touch",
        companyName: args.companyName,
        city: args.city,
        personalizationHook: args.hook,
        triggerEvidenceCount,
        researchReadiness: research,
        prospect: {
          company_name: args.companyName,
          city: args.city,
          preferred_channel: message.channel,
          contact_email: args.contactEmail,
          personalization_hook: args.hook,
          personalization_evidence: args.evidence || null,
          source_checked_at: normalizeLine(prospect.source_checked_at, 40) || null,
          target_group: normalizeMultiline(prospect.target_group, 220) || null,
          process_hint: normalizeMultiline(prospect.process_hint, 220) || null,
          active_listings_count: args.activeListingsCount,
        },
        context: groundedContexts[message.channel],
        supportHints: [
          args.hook,
          args.pain,
          args.evidence,
          args.researchInsights,
        ].filter(Boolean) as string[],
      });
      return {
        ...message,
        review,
      };
    });

  const packSummary = (
    rows: Array<
      PackMessage & {
        review: ReturnType<typeof evaluateGroundedOutboundMessageQuality>;
      }
    >,
  ) => {
    const worst = [...rows].sort((a, b) => a.review.score - b.review.score)[0];
    const status =
      rows.some((row) => row.review.status === "blocked")
        ? "blocked"
        : rows.every((row) => row.review.status === "pass")
          ? "pass"
          : "needs_review";
    const averageScore =
      rows.length > 0
        ? Math.round(rows.reduce((sum, row) => sum + row.review.score, 0) / rows.length)
        : 0;
    return {
      status,
      score: averageScore,
      summary:
        status === "pass"
          ? "Das Paket ist sendbar."
          : status === "blocked"
            ? worst?.review.summary || "Mindestens eine Variante ist noch blockiert."
            : worst?.review.summary || "Mindestens eine Variante sollte noch manuell geschaerft werden.",
    };
  };

  const fallback = fallbackPack({
    ...args,
    segmentKey,
    playbookTitle: playbook?.title || null,
    valueNarrative,
  });
  const reviewedFallback = reviewPackMessages(fallback.messages);
  let reason = fallback.reason;
  let messages = reviewedFallback;
  let generatedWith: "ai" | "fallback" = "fallback";

  try {
    const prompt = await loadPrompt(supabase);
    const aiResult = await maybeGenerateWithAi({ prompt, vars, triggerEvidenceCount });
    if (aiResult?.messages?.length === 3) {
      const reviewedAi = reviewPackMessages(aiResult.messages);
      const aiEmailBlocked = reviewedAi.some(
        (row) => row.channel === "email" && row.review.status === "blocked",
      );
      const aiScore = reviewedAi.reduce((sum, row) => sum + row.review.score, 0);
      const fallbackScore = reviewedFallback.reduce((sum, row) => sum + row.review.score, 0);
      if (!aiEmailBlocked && aiScore >= fallbackScore) {
        reason = aiResult.reason || reason;
        messages = reviewedAi;
        generatedWith = "ai";
      }
    }
  } catch {
    // Fail-open to deterministic fallback.
  }

  const summary = packSummary(messages);
  return NextResponse.json({
    ok: true,
    generated_with: generatedWith,
    recommendation_reason: reason,
    research,
    pack_review: summary,
    strategy: strategy
      ? {
          id: strategy.id,
          version: strategy.version,
          strategy_status: strategy.strategy_status,
          segment_key: strategy.segment_key,
          playbook_key: strategy.playbook_key,
          playbook_title: strategy.playbook_title,
          chosen_channel: strategy.chosen_channel,
          channel_plan: strategy.channel_plan,
          chosen_contact_confidence: strategy.chosen_contact_confidence,
          chosen_contact_candidate_id: strategy.chosen_contact_candidate_id,
          chosen_cta: strategy.chosen_cta,
          chosen_angle: strategy.chosen_angle,
          chosen_trigger: strategy.chosen_trigger,
          trigger_evidence: strategy.trigger_evidence,
          research_status: strategy.research_status,
          research_score: strategy.research_score,
          risk_level: strategy.risk_level,
          strategy_score: strategy.strategy_score,
          rationale: strategy.rationale,
          fallback_plan: strategy.fallback_plan,
          research_gaps: strategy.research_gaps,
          metadata: strategy.metadata || {},
          chosen_contact_channel: strategy.chosen_contact_channel,
          chosen_contact_value: strategy.chosen_contact_value,
        }
      : null,
    messages: messages.map((message) => ({
      channel: message.channel,
      variant: message.variant,
      subject: message.subject,
      body: message.body,
      why: message.why,
      review_status: message.review.status,
      review_score: message.review.score,
      review_summary: message.review.summary,
    })),
  });
}
