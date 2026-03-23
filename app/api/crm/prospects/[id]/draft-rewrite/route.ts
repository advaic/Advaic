import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { collectTriggerEvidence, evaluateFirstTouchGuardrails } from "@/lib/crm/cadenceRules";
import {
  assessResearchReadiness,
  outboundQualityStatusLabel,
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

type ProspectContext = {
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  city: string | null;
  region: string | null;
  objectFocus: string;
  personalizationHook: string | null;
  targetGroup: string | null;
  processHint: string | null;
  responsePromisePublic: string | null;
  appointmentFlowPublic: string | null;
  docsFlowPublic: string | null;
  activeListingsCount: number | null;
  newListings30d: number | null;
  shareMietePercent: number | null;
  shareKaufPercent: number | null;
  automationReadiness: string | null;
  linkedinUrl: string | null;
  evidence: string | null;
  researchInsights: string | null;
  chosenTrigger: string | null;
  chosenAngle: string | null;
  chosenCta: string | null;
};

type EvidenceRow = {
  field_name: string | null;
  field_value: string | null;
  source_type: string | null;
  source_url: string | null;
  confidence: number | null;
};

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeMultiline(value: unknown, max = 4000) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, max);
}

function compactBody(text: string) {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeForMatch(value: unknown) {
  return normalizeLine(value, 500)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string) {
  return normalizeForMatch(value).split(" ").filter(Boolean);
}

function matchScore(a: string, b: string) {
  const left = normalizeForMatch(a);
  const right = normalizeForMatch(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.94;
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;
  const overlap = leftTokens.filter((token) => rightTokens.includes(token)).length;
  return overlap / Math.max(1, Math.min(leftTokens.length, rightTokens.length));
}

function splitSentences(body: string) {
  return body
    .replace(/\r/g, "")
    .split(/\n+/)
    .flatMap((line) =>
      line
        .split(/(?<=[.!?])\s+/)
        .map((part) => normalizeLine(part, 520))
        .filter(Boolean),
    )
    .filter(Boolean);
}

function replaceSegmentInBody(body: string, segment: string, replacement: string) {
  const index = body.indexOf(segment);
  if (index < 0) return body;
  const before = body.slice(0, index);
  const after = body.slice(index + segment.length);
  const spacerBefore = before && !before.endsWith("\n") && replacement ? " " : "";
  const spacerAfter = after && !replacement.endsWith("\n") && replacement ? " " : "";
  return compactBody(`${before}${spacerBefore}${replacement}${spacerAfter}${after}`);
}

function inferTopic(segment: string) {
  const text = normalizeForMatch(segment);
  if (/miet|vermiet/.test(text)) return "miete";
  if (/verkauf|kauf|eigentum/.test(text)) return "kauf";
  if (/besichtigung|termin/.test(text)) return "termin";
  if (/unterlag|dokument|expose/.test(text)) return "unterlagen";
  if (/antwort|reaktion|anfrage|interessent/.test(text)) return "antworten";
  return "general";
}

function focusSnippet(context: ProspectContext) {
  const hook = normalizeLine(context.personalizationHook, 140);
  if (hook) return hook.replace(/[.!?]+$/, "");
  const processHint = normalizeLine(context.processHint, 140);
  if (processHint) return processHint.replace(/[.!?]+$/, "");
  const targetGroup = normalizeLine(context.targetGroup, 100);
  if (targetGroup) return targetGroup;
  const city = normalizeLine(context.city, 80);
  const objectFocus = normalizeLine(context.objectFocus, 40).toLowerCase();
  if (objectFocus === "miete") return city ? `Vermietung in ${city}` : "Vermietung";
  if (objectFocus === "kauf") return city ? `Verkauf in ${city}` : "Verkauf";
  if (objectFocus === "neubau") return city ? `Neubau in ${city}` : "Neubau";
  if (city) return `Immobiliengeschaeft in ${city}`;
  return "Ihr operatives Tagesgeschaeft";
}

function bestEvidenceSnippet(segment: string, evidenceRows: EvidenceRow[], context: ProspectContext) {
  const candidates = evidenceRows
    .filter((row) => Number(row.confidence || 0) >= 0.45)
    .map((row) => ({
      text: normalizeLine(row.field_value, 160),
      score: matchScore(segment, normalizeLine(row.field_value, 220)) + Number(row.confidence || 0) * 0.2,
    }))
    .filter((row) => row.text);
  candidates.sort((a, b) => b.score - a.score || a.text.localeCompare(b.text, "de"));
  if (candidates[0]?.score >= 0.5) return candidates[0].text.replace(/[.!?]+$/, "");
  return focusSnippet(context);
}

function buildEvidenceRewrite(segment: string, context: ProspectContext, evidenceRows: EvidenceRow[]) {
  const topic = inferTopic(segment);
  const snippet = bestEvidenceSnippet(segment, evidenceRows, context);
  if (!snippet) return null;
  if (topic === "miete") {
    return `Auf Ihrer Website wirkt ${snippet} wie ein klarer Schwerpunkt. Wie organisieren Sie heute schnelle, persoenliche Antworten auf Mietanfragen?`;
  }
  if (topic === "kauf") {
    return `Auf Ihrer Website wirkt ${snippet} wie ein klarer Schwerpunkt. Wie organisieren Sie heute schnelle, persoenliche Antworten auf Verkaufsanfragen?`;
  }
  if (topic === "termin") {
    return `Auf Ihrer Website wirkt ${snippet} wie ein relevanter Teil Ihres Prozesses. Wie organisieren Sie heute schnelle Rueckmeldungen rund um Besichtigungen?`;
  }
  if (topic === "unterlagen") {
    return `Auf Ihrer Website wirkt ${snippet} wie ein relevanter Prozessschritt. Wie halten Sie Rueckfragen dabei schnell und persoenlich?`;
  }
  return `Auf Ihrer Website wirkt ${snippet} wie ein klarer Schwerpunkt. Wie gehen Sie heute operativ damit um, ohne dass Antworten standardisiert wirken?`;
}

function buildQuestionRewrite(segment: string, context: ProspectContext) {
  const topic = inferTopic(segment);
  const city = normalizeLine(context.city, 80);
  if (topic === "miete") {
    return `Wie stellen Sie heute sicher, dass Mietanfragen${city ? ` in ${city}` : ""} schnell beantwortet werden, ohne unpersoenlich zu wirken?`;
  }
  if (topic === "kauf") {
    return `Wie stellen Sie heute sicher, dass Verkaufsanfragen${city ? ` in ${city}` : ""} schnell beantwortet werden, ohne unpersoenlich zu wirken?`;
  }
  if (topic === "termin") {
    return "Wie organisieren Sie heute schnelle, persoenliche Rueckmeldungen rund um Besichtigungstermine?";
  }
  if (topic === "unterlagen") {
    return "Wie organisieren Sie heute Rueckfragen zu Unterlagen oder Exposes, ohne dass Antworten standardisiert wirken?";
  }
  return "Wie stellen Sie heute schnelle, persoenliche Erstreaktionen sicher, ohne dass Antworten standardisiert wirken?";
}

function buildSoftRewrite(context: ProspectContext) {
  const snippet = focusSnippet(context);
  return `Bei ${snippet} entstehen haeufig wiederkehrende Rueckfragen. Wie gehen Sie heute damit um, ohne dass Antworten standardisiert wirken?`;
}

function deterministicRewrite(args: {
  body: string;
  review: ReturnType<typeof evaluateGroundedOutboundMessageQuality>;
  context: ProspectContext;
  evidenceRows: EvidenceRow[];
}) {
  const alignment = args.review.evidence_alignment;
  if (!alignment) return null;
  const segments = splitSentences(args.body);
  if (segments.length === 0) return null;
  let nextBody = args.body;
  let applied = 0;

  for (const segment of segments) {
    const unsupported = (alignment.unsupported_claims || []).find((claim) => matchScore(segment, claim) >= 0.58);
    const weak = !unsupported
      ? (alignment.weak_claims || []).find((claim) => matchScore(segment, claim) >= 0.58)
      : null;
    if (!unsupported && !weak) continue;

    const replacement =
      buildEvidenceRewrite(segment, args.context, args.evidenceRows) ||
      buildQuestionRewrite(segment, args.context) ||
      buildSoftRewrite(args.context);
    if (!replacement) continue;
    const updated = replaceSegmentInBody(nextBody, segment, replacement);
    if (updated !== nextBody) {
      nextBody = updated;
      applied += 1;
    }
    if (applied >= 2) break;
  }

  if (!applied) return null;
  return {
    subject: null,
    body: compactBody(nextBody),
    change_summary: `${applied} schwache Aussagen wurden vorsichtiger und evidenznaeher formuliert.`,
  };
}

function applyVars(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

function parseJsonObject(raw: string) {
  const text = normalizeMultiline(raw, 12000);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function loadPrompt(supabase: any) {
  const { data } = await (supabase.from("ai_prompts") as any)
    .select("system_prompt, user_prompt, temperature, max_tokens")
    .eq("key", "crm_draft_rewrite_v1")
    .eq("is_active", true)
    .maybeSingle();
  return (data || null) as PromptRow | null;
}

async function maybeRewriteWithAi(args: {
  prompt: PromptRow | null;
  vars: Record<string, string>;
}) {
  const endpoint = normalizeLine(process.env.AZURE_OPENAI_ENDPOINT, 400);
  const apiKey = normalizeLine(process.env.AZURE_OPENAI_API_KEY, 400);
  const deployment =
    normalizeLine(process.env.AZURE_OPENAI_DEPLOYMENT_COPILOT, 200) ||
    normalizeLine(process.env.AZURE_OPENAI_DEPLOYMENT_CHAT_TEMPLATES, 200) ||
    normalizeLine(process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_WRITER, 200) ||
    normalizeLine(process.env.AZURE_OPENAI_DEPLOYMENT_REPLY_REWRITE, 200);
  const apiVersion = normalizeLine(process.env.AZURE_OPENAI_API_VERSION, 100) || "2024-02-15-preview";
  if (!endpoint || !apiKey || !deployment) return null;

  const fallbackSystemPrompt =
    "Du ueberarbeitest deutsche CRM-Outreach-Drafts fuer Advaic. Aufgabe: schwache oder ungestuetzte Aussagen so umschreiben, dass sie natuerlich, konkret, vorsichtig und evidenznah werden. Sie-Ansprache, kein Hype, kein Sales-Druck. Gib nur JSON zurueck.";
  const fallbackUserPrompt = `Ueberarbeite den bestehenden Draft so, dass er klar besser wird.

Kontext:
- Firma: {{COMPANY_NAME}}
- Kontakt: {{CONTACT_NAME}}
- Stadt: {{CITY}}
- Region: {{REGION}}
- Fokus: {{OBJECT_FOCUS}}
- Hook: {{HOOK}}
- Zielgruppe: {{TARGET_GROUP}}
- Prozess-Hinweis: {{PROCESS_HINT}}
- Antwortversprechen: {{RESPONSE_PROMISE_PUBLIC}}
- Terminablauf: {{APPOINTMENT_FLOW_PUBLIC}}
- Unterlagenablauf: {{DOCS_FLOW_PUBLIC}}
- Aktive Inserate: {{ACTIVE_LISTINGS}}
- Mix Miete/Kauf: {{MIX}}
- Research-Evidenz: {{EVIDENCE}}
- Research-Insights: {{RESEARCH_INSIGHTS}}
- Strategie-Trigger: {{STRATEGY_TRIGGER}}
- Strategie-Angle: {{STRATEGY_ANGLE}}
- Strategie-CTA: {{STRATEGY_CTA}}

Aktueller Draft:
- Kanal: {{CHANNEL}}
- Nachrichtentyp: {{MESSAGE_KIND}}
- Betreff: {{SUBJECT}}
- Body:
{{BODY}}

Aktuelle Review:
- Status: {{REVIEW_STATUS}}
- Score: {{REVIEW_SCORE}}
- Summary: {{REVIEW_SUMMARY}}
- Blocker: {{BLOCKERS}}
- Warnings: {{WARNINGS}}
- Schwache Claims: {{WEAK_CLAIMS}}
- Ungestuetzte Claims: {{UNSUPPORTED_CLAIMS}}
- Direkt belegte Claims: {{SUPPORTED_CLAIMS}}

Pflicht:
- Behalte die Grundidee des Drafts, aber behebe schwache/ungestuetzte Stellen aktiv.
- Wenn eine Aussage nicht sauber belegbar ist, formuliere sie vorsichtiger oder als kleine Frage.
- Nutze nur die gegebenen Research-Signale. Keine neuen Fakten erfinden.
- Schreibe natuerlich, gruendernah, ruhig, klar.
- Fuer E-Mail Erstkontakt: kurz, 3 bis 5 Saetze, kleine reibungsarme Frage am Ende.
- Keine URLs, keine Rohdatenbloecke, keine Floskeln, kein harter CTA.

Gib nur JSON zurueck:
{
  "subject": "string",
  "body": "string",
  "change_summary": "string"
}`;

  const systemPrompt = normalizeMultiline(args.prompt?.system_prompt || fallbackSystemPrompt, 5000);
  const userPrompt = normalizeMultiline(
    applyVars(args.prompt?.user_prompt || fallbackUserPrompt, args.vars),
    9000,
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
          ? Math.max(0, Math.min(0.6, args.prompt.temperature))
          : 0.25,
      max_tokens:
        typeof args.prompt?.max_tokens === "number"
          ? Math.max(350, Math.min(1500, Math.round(args.prompt.max_tokens)))
          : 850,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  }).catch(() => null);

  if (!res || !res.ok) return null;
  const json = (await res.json().catch(() => null)) as any;
  const parsed = parseJsonObject(String(json?.choices?.[0]?.message?.content || ""));
  const subject = normalizeLine(parsed?.subject, 160);
  const body = compactBody(normalizeMultiline(parsed?.body, 2200));
  const changeSummary = normalizeLine(parsed?.change_summary, 260);
  if (!body) return null;
  return {
    subject,
    body,
    change_summary: changeSummary || "KI-Rewrite auf Basis der Review-Signale erstellt.",
  };
}

function reviewRank(status: string) {
  if (status === "pass") return 2;
  if (status === "needs_review") return 1;
  return 0;
}

function looksBetter(args: {
  previous: ReturnType<typeof evaluateGroundedOutboundMessageQuality>;
  next: ReturnType<typeof evaluateGroundedOutboundMessageQuality>;
}) {
  const prevRank = reviewRank(args.previous.status);
  const nextRank = reviewRank(args.next.status);
  if (nextRank > prevRank) return true;
  if (nextRank < prevRank) return false;
  if (args.next.score > args.previous.score + 2) return true;
  const prevUnsupported = Number(args.previous.evidence_alignment?.unsupported_claim_count || 0);
  const nextUnsupported = Number(args.next.evidence_alignment?.unsupported_claim_count || 0);
  if (nextUnsupported < prevUnsupported) return true;
  const prevWeak = Number(args.previous.evidence_alignment?.weak_claim_count || 0);
  const nextWeak = Number(args.next.evidence_alignment?.weak_claim_count || 0);
  return nextWeak < prevWeak;
}

export async function POST(
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

  const body = await req.json().catch(() => ({} as any));
  const channel = normalizeLine(body?.channel || "email", 40).toLowerCase();
  const messageKind = normalizeLine(body?.message_kind || "first_touch", 40).toLowerCase();
  const subject = normalizeLine(body?.subject, 160);
  const currentBody = compactBody(normalizeMultiline(body?.body, 2200));
  if (!currentBody) {
    return NextResponse.json({ ok: false, error: "missing_body" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const [prospectRes, notesRes, evidenceRes] = await Promise.all([
    (supabase.from("crm_prospects") as any)
      .select(
        "id, company_name, contact_name, contact_email, city, region, object_focus, personalization_hook, primary_objection, active_listings_count, new_listings_30d, share_miete_percent, share_kauf_percent, target_group, process_hint, response_promise_public, appointment_flow_public, docs_flow_public, automation_readiness, source_checked_at, linkedin_url, personalization_evidence",
      )
      .eq("id", prospectId)
      .eq("agent_id", auth.user.id)
      .maybeSingle(),
    (supabase.from("crm_research_notes") as any)
      .select("note")
      .eq("agent_id", auth.user.id)
      .eq("prospect_id", prospectId)
      .eq("is_key_insight", true)
      .order("created_at", { ascending: false })
      .limit(4),
    (supabase.from("crm_research_evidence") as any)
      .select("field_name, field_value, source_type, source_url, confidence")
      .eq("agent_id", auth.user.id)
      .eq("prospect_id", prospectId)
      .order("confidence", { ascending: false })
      .order("captured_at", { ascending: false })
      .limit(24),
  ]);

  if (prospectRes.error) {
    return NextResponse.json(
      { ok: false, error: "crm_prospect_lookup_failed", details: prospectRes.error.message },
      { status: 500 },
    );
  }
  const prospect = prospectRes.data;
  if (!prospect) {
    return NextResponse.json({ ok: false, error: "prospect_not_found" }, { status: 404 });
  }

  const strategyResult = await ensureProspectStrategyDecision(supabase, {
    agentId: String(auth.user.id),
    prospectId,
    prospect,
  });
  const strategy = strategyResult.ok ? strategyResult.strategy : null;

  const notes = (notesRes.data || []) as Array<{ note?: string | null }>;
  const researchInsights = notes
    .map((row) => normalizeMultiline(row?.note, 220))
    .filter(Boolean)
    .join(" ");
  const evidenceRows = ((evidenceRes.data || []) as EvidenceRow[]) || [];

  const context: ProspectContext = {
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
    personalizationHook:
      normalizeLine(strategy?.chosen_trigger, 240) ||
      normalizeLine(prospect.personalization_hook, 240) ||
      null,
    targetGroup: normalizeLine(prospect.target_group, 180) || null,
    processHint: normalizeLine(prospect.process_hint, 220) || null,
    responsePromisePublic: normalizeLine(prospect.response_promise_public, 180) || null,
    appointmentFlowPublic: normalizeLine(prospect.appointment_flow_public, 180) || null,
    docsFlowPublic: normalizeLine(prospect.docs_flow_public, 180) || null,
    activeListingsCount:
      typeof prospect.active_listings_count === "number" ? prospect.active_listings_count : null,
    newListings30d:
      typeof prospect.new_listings_30d === "number" ? prospect.new_listings_30d : null,
    shareMietePercent:
      typeof prospect.share_miete_percent === "number" ? prospect.share_miete_percent : null,
    shareKaufPercent:
      typeof prospect.share_kauf_percent === "number" ? prospect.share_kauf_percent : null,
    automationReadiness: normalizeLine(prospect.automation_readiness, 40) || null,
    linkedinUrl: normalizeLine(prospect.linkedin_url, 280) || null,
    evidence: normalizeMultiline(prospect.personalization_evidence, 320) || null,
    researchInsights: normalizeMultiline(researchInsights, 320) || null,
    chosenTrigger: normalizeLine(strategy?.chosen_trigger, 240) || null,
    chosenAngle: normalizeLine(strategy?.chosen_angle, 240) || null,
    chosenCta: normalizeLine(strategy?.chosen_cta, 180) || null,
  };

  const researchReadiness =
    strategyResult.ok && strategyResult.research
      ? strategyResult.research
      : assessResearchReadiness({
          preferredChannel: channel,
          contactEmail: context.contactEmail,
          personalizationHook: context.personalizationHook,
          personalizationEvidence: context.evidence,
          researchInsights: context.researchInsights,
          sourceCheckedAt: normalizeLine(prospect.source_checked_at, 40) || null,
          targetGroup: context.targetGroup,
          processHint: context.processHint,
          responsePromisePublic: context.responsePromisePublic,
          appointmentFlowPublic: context.appointmentFlowPublic,
          docsFlowPublic: context.docsFlowPublic,
          activeListingsCount: context.activeListingsCount,
          automationReadiness: context.automationReadiness,
          linkedinUrl: context.linkedinUrl,
        });

  const triggerEvidenceCount = collectTriggerEvidence({
    companyName: context.companyName,
    city: context.city,
    region: context.region,
    objectFocus: context.objectFocus,
    activeListingsCount: context.activeListingsCount,
    newListings30d: context.newListings30d,
    shareMietePercent: context.shareMietePercent,
    shareKaufPercent: context.shareKaufPercent,
    targetGroup: context.targetGroup,
    processHint: context.processHint,
    personalizationHook: context.personalizationHook,
    personalizationEvidence: context.evidence,
    sourceCheckedAt: normalizeLine(prospect.source_checked_at, 40) || null,
  }).length || Number(strategy?.trigger_evidence?.length || 0);

  const groundedContext = await loadGroundedReviewContext(supabase, {
    agentId: String(auth.user.id),
    prospectId,
    channel,
    messageKind,
    segmentKey: strategy?.segment_key || null,
    playbookKey: strategy?.playbook_key || null,
  });

  const reviewArgs = {
    channel,
    messageKind,
    companyName: context.companyName,
    city: context.city,
    personalizationHook: context.personalizationHook,
    triggerEvidenceCount,
    researchReadiness,
    prospect: {
      company_name: context.companyName,
      city: context.city,
      preferred_channel: channel,
      contact_email: context.contactEmail,
      personalization_hook: context.personalizationHook,
      personalization_evidence: context.evidence,
      source_checked_at: normalizeLine(prospect.source_checked_at, 40) || null,
      target_group: context.targetGroup,
      process_hint: context.processHint,
      response_promise_public: context.responsePromisePublic,
      appointment_flow_public: context.appointmentFlowPublic,
      docs_flow_public: context.docsFlowPublic,
      active_listings_count: context.activeListingsCount,
      automation_readiness: context.automationReadiness,
      linkedin_url: context.linkedinUrl,
    },
    context: groundedContext,
    supportHints: [
      context.personalizationHook,
      context.evidence,
      context.researchInsights,
      context.processHint,
      context.chosenAngle,
      context.chosenTrigger,
    ].filter(Boolean) as string[],
  } as const;

  const currentReview = evaluateGroundedOutboundMessageQuality({
    body: currentBody,
    subject,
    ...reviewArgs,
  });

  const vars = {
    COMPANY_NAME: context.companyName,
    CONTACT_NAME: context.contactName || "",
    CITY: context.city || "",
    REGION: context.region || "",
    OBJECT_FOCUS: context.objectFocus,
    HOOK: context.personalizationHook || "",
    TARGET_GROUP: context.targetGroup || "",
    PROCESS_HINT: context.processHint || "",
    RESPONSE_PROMISE_PUBLIC: context.responsePromisePublic || "",
    APPOINTMENT_FLOW_PUBLIC: context.appointmentFlowPublic || "",
    DOCS_FLOW_PUBLIC: context.docsFlowPublic || "",
    ACTIVE_LISTINGS: String(context.activeListingsCount ?? ""),
    MIX: `Miete ${context.shareMietePercent ?? "?"}% / Kauf ${context.shareKaufPercent ?? "?"}%`,
    EVIDENCE: context.evidence || "",
    RESEARCH_INSIGHTS: context.researchInsights || "",
    STRATEGY_TRIGGER: context.chosenTrigger || "",
    STRATEGY_ANGLE: context.chosenAngle || "",
    STRATEGY_CTA: context.chosenCta || "",
    CHANNEL: channel,
    MESSAGE_KIND: messageKind,
    SUBJECT: subject || "",
    BODY: currentBody,
    REVIEW_STATUS: currentReview.status,
    REVIEW_SCORE: String(currentReview.score),
    REVIEW_SUMMARY: currentReview.summary,
    BLOCKERS: (currentReview.blockers || []).join(" | "),
    WARNINGS: (currentReview.warnings || []).join(" | "),
    WEAK_CLAIMS: (currentReview.evidence_alignment?.weak_claims || []).join(" | "),
    UNSUPPORTED_CLAIMS: (currentReview.evidence_alignment?.unsupported_claims || []).join(" | "),
    SUPPORTED_CLAIMS: (currentReview.evidence_alignment?.cited_claims || [])
      .map((item) => `${item.claim} => ${item.evidence}`)
      .join(" | "),
  };

  const candidates: Array<{
    source: "ai" | "fallback";
    subject: string;
    body: string;
    change_summary: string;
    review: ReturnType<typeof evaluateGroundedOutboundMessageQuality>;
  }> = [];

  try {
    const prompt = await loadPrompt(supabase);
    const aiResult = await maybeRewriteWithAi({ prompt, vars });
    if (aiResult?.body && aiResult.body !== currentBody) {
      if (!(channel === "email" && messageKind === "first_touch") || evaluateFirstTouchGuardrails({
        body: aiResult.body,
        triggerEvidenceCount,
      }).pass) {
        const aiReview = evaluateGroundedOutboundMessageQuality({
          body: aiResult.body,
          subject: aiResult.subject || subject,
          ...reviewArgs,
        });
        candidates.push({
          source: "ai",
          subject: aiResult.subject || subject,
          body: aiResult.body,
          change_summary: aiResult.change_summary,
          review: aiReview,
        });
      }
    }
  } catch {
    // fall through to deterministic fallback
  }

  const fallbackResult = deterministicRewrite({
    body: currentBody,
    review: currentReview,
    context,
    evidenceRows,
  });
  if (fallbackResult?.body && fallbackResult.body !== currentBody) {
    const fallbackReview = evaluateGroundedOutboundMessageQuality({
      body: fallbackResult.body,
      subject,
      ...reviewArgs,
    });
    candidates.push({
      source: "fallback",
      subject,
      body: fallbackResult.body,
      change_summary: fallbackResult.change_summary,
      review: fallbackReview,
    });
  }

  const improvedCandidates = candidates.filter((candidate) =>
    looksBetter({ previous: currentReview, next: candidate.review }),
  );
  const bestCandidate = [...improvedCandidates].sort((a, b) => {
    return reviewRank(b.review.status) - reviewRank(a.review.status) || b.review.score - a.review.score;
  })[0];

  if (!bestCandidate) {
    return NextResponse.json(
      {
        ok: false,
        error: "no_better_rewrite_found",
        details:
          currentReview.status === "pass"
            ? "Der Draft ist bereits sendbar. Aktuell wurde kein klar besseres Rewrite erzeugt."
            : "Es konnte kein Rewrite erzeugt werden, das die Review wirklich verbessert.",
        current_review: currentReview,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    generated_with: bestCandidate.source,
    rewritten_draft: {
      subject: bestCandidate.subject,
      body: bestCandidate.body,
    },
    current_review: currentReview,
    rewrite_review: bestCandidate.review,
    improvement_summary:
      `${bestCandidate.source === "ai" ? "KI-Rewrite" : "Sicherer Rewrite"} geladen. ` +
      `${outboundQualityStatusLabel(bestCandidate.review.status)} · ${bestCandidate.review.score}/100.`,
    change_summary: bestCandidate.change_summary,
  });
}
