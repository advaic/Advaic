import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

type SequenceStep = {
  day_offset: number;
  message_kind: "first_touch" | "follow_up_1" | "follow_up_2";
  channel: "email" | "linkedin" | "telefon" | "kontaktformular";
  label: string;
};

const DEFAULT_STEPS: SequenceStep[] = [
  { day_offset: 0, message_kind: "first_touch", channel: "email", label: "Tag 0 · Erstkontakt" },
  { day_offset: 3, message_kind: "follow_up_1", channel: "linkedin", label: "Tag 3 · Follow-up 1" },
  { day_offset: 7, message_kind: "follow_up_2", channel: "telefon", label: "Tag 7 · Follow-up 2" },
];

const STOP_RULES = [
  "stop_on_reply_received",
  "stop_on_bounce_detected",
  "stop_on_opt_out",
  "stop_on_risk_high",
];

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 2000) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function parseDate(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function buildBody(args: {
  step: SequenceStep;
  companyName: string;
  contactName: string | null;
  hook: string | null;
  pain: string | null;
}) {
  const salutation = args.contactName
    ? `Hallo ${args.contactName},`
    : `Hallo Team von ${args.companyName},`;
  const hook =
    args.hook ||
    `kurze Rückmeldung zu eurem Prozess bei ${args.companyName}.`;
  const pain =
    args.pain ||
    "Viele Teams verlieren hier Zeit mit wiederkehrenden Interessenten-Anfragen.";

  if (args.step.message_kind === "first_touch") {
    return `${salutation}

${hook}
${pain}

Wir suchen wenige Makler für einen vorsichtigen Test von Advaic.
Kern: Auto nur bei klaren Fällen, unklar => Freigabe, plus Qualitätschecks vor Versand.

Wenn du magst, schauen wir in 15 Minuten, ob das für euch relevant ist.`;
  }

  if (args.step.message_kind === "follow_up_1") {
    return `${salutation}

ich wollte kurz nachfassen, ob mein letzter Hinweis relevant für euch ist.
Gerade die Guardrails (klar = Auto, unklar = Freigabe) sind oft der wichtigste Punkt.

Wenn hilfreich, schicke ich dir eine konkrete Safe-Start-Einstellung.`;
  }

  return `${salutation}

letztes kurzes Follow-up von mir:
Wenn das Thema aktuell nicht passt, ist das völlig okay.

Falls doch, können wir in 15 Minuten gemeinsam prüfen, wie ihr Routineanfragen ohne Kontrollverlust entlastet.`;
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
  const requestedStart = parseDate(body?.start_at);
  const startAt = requestedStart || new Date();
  const customSteps = Array.isArray(body?.steps) ? (body.steps as any[]) : null;

  let steps: SequenceStep[] = DEFAULT_STEPS;
  if (customSteps && customSteps.length > 0) {
    const parsed = customSteps
      .map((step) => {
        const day = Number(step?.day_offset);
        const kind = normalizeLine(step?.message_kind, 40) as SequenceStep["message_kind"];
        const channel = normalizeLine(step?.channel, 40) as SequenceStep["channel"];
        const label = normalizeLine(step?.label, 80);
        if (!Number.isFinite(day)) return null;
        if (!["first_touch", "follow_up_1", "follow_up_2"].includes(kind)) return null;
        if (!["email", "linkedin", "telefon", "kontaktformular"].includes(channel)) return null;
        return {
          day_offset: Math.max(0, Math.min(21, Math.round(day))),
          message_kind: kind,
          channel,
          label: label || `${kind} @ ${day}`,
        } as SequenceStep;
      })
      .filter(Boolean) as SequenceStep[];
    if (parsed.length > 0) {
      steps = parsed.sort((a, b) => a.day_offset - b.day_offset);
    }
  }

  const supabase = createSupabaseAdminClient();
  const { data: prospect, error: prospectErr } = await (supabase.from("crm_prospects") as any)
    .select(
      "id, company_name, contact_name, stage, next_action, next_action_at, personalization_hook, pain_point_hypothesis",
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

  const sequencePlanId = randomUUID();
  const created: Array<{ id: string; message_kind: string; channel: string; scheduled_for: string }> = [];
  const skipped: Array<{ message_kind: string; reason: string }> = [];

  for (const step of steps) {
    const scheduled = new Date(startAt.getTime() + step.day_offset * 24 * 60 * 60 * 1000);
    const scheduledIso = scheduled.toISOString();

    const existingRes = await (supabase.from("crm_outreach_messages") as any)
      .select("id, status, metadata")
      .eq("agent_id", auth.user.id)
      .eq("prospect_id", prospectId)
      .eq("message_kind", step.message_kind)
      .in("status", ["draft", "ready", "sent"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRes.error) {
      skipped.push({ message_kind: step.message_kind, reason: "lookup_failed" });
      continue;
    }
    if (existingRes.data) {
      skipped.push({ message_kind: step.message_kind, reason: "already_exists" });
      continue;
    }

    const bodyText = buildBody({
      step,
      companyName: normalizeLine(prospect.company_name, 160),
      contactName: normalizeLine(prospect.contact_name, 120) || null,
      hook: normalizeText(prospect.personalization_hook, 260) || null,
      pain: normalizeText(prospect.pain_point_hypothesis, 260) || null,
    });

    const subject =
      step.message_kind === "first_touch"
        ? `Kurzer Austausch zu ${normalizeLine(prospect.company_name, 120)}`
        : step.message_kind === "follow_up_1"
          ? "Kurzes Follow-up"
          : "Letztes Follow-up";

    const insertRes = await (supabase.from("crm_outreach_messages") as any)
      .insert({
        prospect_id: prospectId,
        agent_id: auth.user.id,
        channel: step.channel,
        message_kind: step.message_kind,
        subject: step.channel === "email" ? subject : null,
        body: bodyText,
        personalization_score: 86,
        status: "ready",
        metadata: {
          source: "sequence_planner",
          sequence_plan_id: sequencePlanId,
          step_label: step.label,
          scheduled_for: scheduledIso,
          stop_rules: STOP_RULES,
        },
      })
      .select("id, message_kind, channel, metadata")
      .single();

    if (insertRes.error || !insertRes.data) {
      skipped.push({
        message_kind: step.message_kind,
        reason: `insert_failed:${insertRes.error?.message || "unknown"}`,
      });
      continue;
    }

    created.push({
      id: String(insertRes.data.id),
      message_kind: String(insertRes.data.message_kind),
      channel: String(insertRes.data.channel),
      scheduled_for: scheduledIso,
    });

    await ((supabase as any).rpc("crm_register_outreach_event", {
      p_prospect_id: prospectId,
      p_agent_id: auth.user.id,
      p_event_type: "follow_up_due",
      p_message_id: String(insertRes.data.id),
      p_details: `Sequenz-Schritt geplant: ${step.label}`,
      p_metadata: {
        source: "sequence_planner",
        sequence_plan_id: sequencePlanId,
        stop_rules: STOP_RULES,
      },
    }) as any);
  }

  const nextScheduled = created
    .map((entry) => parseDate(entry.scheduled_for))
    .filter(Boolean)
    .sort((a, b) => (a as Date).getTime() - (b as Date).getTime())[0] as Date | undefined;

  if (nextScheduled) {
    await (supabase.from("crm_prospects") as any)
      .update({
        next_action: "Geplante Sequenz überwachen",
        next_action_at: nextScheduled.toISOString(),
      })
      .eq("id", prospectId)
      .eq("agent_id", auth.user.id);
  }

  return NextResponse.json({
    ok: true,
    sequence_plan_id: sequencePlanId,
    stop_rules: STOP_RULES,
    next_action: nextScheduled ? "Geplante Sequenz überwachen" : null,
    next_action_at: nextScheduled ? nextScheduled.toISOString() : null,
    created,
    skipped,
    created_count: created.length,
    skipped_count: skipped.length,
  });
}
