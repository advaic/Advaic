import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

const CODE_TO_KIND: Record<string, "first_touch" | "follow_up_1" | "follow_up_2" | "follow_up_3"> = {
  send_first_touch: "first_touch",
  send_follow_up_1: "follow_up_1",
  send_follow_up_2: "follow_up_2",
  send_follow_up_3: "follow_up_3",
};

const ALLOWED_CODES = new Set(Object.keys(CODE_TO_KIND));

function normalizeLine(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown, max = 2000) {
  return String(value ?? "").replace(/\r/g, "").trim().slice(0, max);
}

function buildSequenceDraft(args: {
  code: string;
  companyName: string;
  contactName: string | null;
  objectFocus: string;
  hook: string | null;
  painPoint: string | null;
}) {
  const salutation = args.contactName
    ? `Hallo ${args.contactName},`
    : `Hallo Team von ${args.companyName},`;

  const focusLabel =
    args.objectFocus === "miete"
      ? "Vermietung"
      : args.objectFocus === "kauf"
        ? "Verkauf"
        : args.objectFocus === "neubau"
          ? "Neubau"
          : "Immobilienanfragen";

  const hookLine = args.hook
    ? `Mir ist bei euch besonders aufgefallen: ${args.hook}.`
    : `Ich melde mich noch einmal kurz zu eurem ${focusLabel}-Prozess.`;

  const painLine = args.painPoint
    ? `Meine Vermutung bleibt: ${args.painPoint}.`
    : "Oft entsteht in dieser Phase unnötiger Aufwand durch wiederkehrende Rückfragen.";

  if (args.code === "send_first_touch") {
    return {
      subject: `Kurzer Austausch zu ${args.companyName}`,
      body: `${salutation}

${hookLine}
${painLine}

Wir laden gerade wenige Makler als Tester ein, um Antwortgeschwindigkeit und Postfachaufwand messbar zu verbessern.

Wichtig: Autopilot sendet nur bei klaren Fällen. Unklare Fälle gehen zur Freigabe. Vor jedem Versand laufen Qualitätschecks.

Wenn es passt, können wir 15 Minuten unverbindlich sprechen.`,
    };
  }

  if (args.code === "send_follow_up_1") {
    return {
      subject: `Kurze Rückfrage zu ${args.companyName}`,
      body: `${salutation}

ich wollte kurz nachfassen, ob mein letzter Hinweis für euch grundsätzlich relevant ist.

${hookLine}

Wenn ihr möchtet, zeige ich euch in 15 Minuten, wie ihr Routineanfragen mit klaren Guardrails automatisiert, ohne Kontrollverlust.`,
    };
  }

  if (args.code === "send_follow_up_2") {
    return {
      subject: `Soll ich das kurz einordnen?`,
      body: `${salutation}

kurzes Follow-up von mir: Viele Teams testen Advaic zunächst sehr vorsichtig mit mehr Freigaben und weniger Autopilot.

Damit bleibt die Kontrolle in Sonderfällen erhalten, während Standardanfragen sauber abgefangen werden.

Wenn du möchtest, schicke ich dir zwei konkrete Startkonfigurationen für ${focusLabel}.`,
    };
  }

  return {
    subject: `Letztes kurzes Follow-up`,
    body: `${salutation}

ich melde mich ein letztes Mal zu dem Thema.

Wenn es aktuell nicht passt, ist das völlig in Ordnung. Falls doch: Ich kann dir eine kurze, unverbindliche Pilotstruktur zeigen, die in 15 Minuten klar ist.

${painLine}`,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({} as any));
  const onlyProspectId = normalizeLine(body?.only_prospect_id || "", 80);
  const dryRun = Boolean(body?.dry_run);
  const limit = Math.max(1, Math.min(100, Number(body?.limit || 40)));

  const supabase = createSupabaseAdminClient();
  let query = (supabase.from("crm_next_actions") as any)
    .select(
      "prospect_id, company_name, contact_name, contact_email, object_focus, preferred_channel, personalization_hook, pain_point_hypothesis, recommended_code, recommended_action, recommended_reason, recommended_at, priority, fit_score",
    )
    .eq("agent_id", auth.user.id)
    .in("recommended_code", [...ALLOWED_CODES])
    .not("recommended_at", "is", null)
    .lte("recommended_at", new Date().toISOString())
    .order("priority", { ascending: true })
    .order("fit_score", { ascending: false })
    .order("recommended_at", { ascending: true })
    .limit(limit);

  if (onlyProspectId) {
    query = query.eq("prospect_id", onlyProspectId);
  }

  const { data: dueActions, error: dueErr } = await query;
  if (dueErr) {
    return NextResponse.json(
      { ok: false, error: "crm_sequence_due_fetch_failed", details: dueErr.message },
      { status: 500 },
    );
  }

  const rows = Array.isArray(dueActions) ? (dueActions as any[]) : [];
  if (rows.length === 0) {
    return NextResponse.json({
      ok: true,
      dry_run: dryRun,
      scanned: 0,
      created: 0,
      skipped_existing: 0,
      skipped_invalid: 0,
      actions: [],
    });
  }

  let created = 0;
  let skippedExisting = 0;
  let skippedInvalid = 0;
  const actions: any[] = [];

  for (const row of rows) {
    const recommendedCode = normalizeLine(row?.recommended_code || "", 60);
    const messageKind = CODE_TO_KIND[recommendedCode];
    if (!messageKind) {
      skippedInvalid += 1;
      continue;
    }

    const channelRaw = normalizeLine(row?.preferred_channel || "email", 40).toLowerCase();
    const channel =
      channelRaw === "email" ||
      channelRaw === "telefon" ||
      channelRaw === "linkedin" ||
      channelRaw === "kontaktformular" ||
      channelRaw === "whatsapp"
        ? channelRaw
        : "email";

    const existingDraftRes = await (supabase.from("crm_outreach_messages") as any)
      .select("id, status")
      .eq("agent_id", auth.user.id)
      .eq("prospect_id", String(row.prospect_id))
      .eq("message_kind", messageKind)
      .in("status", ["draft", "ready"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDraftRes.error) {
      skippedInvalid += 1;
      continue;
    }
    if (existingDraftRes.data) {
      skippedExisting += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "already_has_draft",
        draft_id: existingDraftRes.data.id,
      });
      continue;
    }

    const draft = buildSequenceDraft({
      code: recommendedCode,
      companyName: normalizeLine(row.company_name || "", 160),
      contactName: normalizeLine(row.contact_name || "", 120) || null,
      objectFocus: normalizeLine(row.object_focus || "gemischt", 40),
      hook: normalizeText(row.personalization_hook || "", 320) || null,
      painPoint: normalizeText(row.pain_point_hypothesis || "", 320) || null,
    });

    const toEmail = normalizeLine(row.contact_email || "", 240).toLowerCase();
    if (channel === "email" && !toEmail) {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "missing_contact_email",
      });
      continue;
    }

    if (dryRun) {
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        message_kind: messageKind,
        result: "would_create_draft",
        channel,
      });
      continue;
    }

    const insertPayload = {
      prospect_id: String(row.prospect_id),
      agent_id: auth.user.id,
      channel,
      message_kind: messageKind,
      subject: draft.subject,
      body: draft.body,
      personalization_score: 82,
      status: "ready",
      metadata: {
        source: "sequence_run",
        recommended_code: recommendedCode,
        recommended_action: normalizeText(row.recommended_action || "", 280) || null,
        recommended_reason: normalizeText(row.recommended_reason || "", 360) || null,
        generated_at: new Date().toISOString(),
      },
    };

    const { data: createdDraft, error: insertErr } = await (supabase.from(
      "crm_outreach_messages",
    ) as any)
      .insert(insertPayload)
      .select("id, status, message_kind, channel")
      .single();

    if (insertErr || !createdDraft) {
      skippedInvalid += 1;
      actions.push({
        prospect_id: row.prospect_id,
        company_name: row.company_name,
        recommended_code: recommendedCode,
        result: "insert_failed",
        error: insertErr?.message || "unknown",
      });
      continue;
    }

    await ((supabase as any).rpc("crm_register_outreach_event", {
      p_prospect_id: String(row.prospect_id),
      p_agent_id: auth.user.id,
      p_event_type: "follow_up_due",
      p_message_id: String(createdDraft.id),
      p_details: `${messageKind} als Draft vorbereitet`,
      p_metadata: {
        source: "sequence_run",
        recommended_code: recommendedCode,
      },
    }) as any);

    created += 1;
    actions.push({
      prospect_id: row.prospect_id,
      company_name: row.company_name,
      recommended_code: recommendedCode,
      message_kind: messageKind,
      channel,
      draft_id: createdDraft.id,
      result: "draft_created",
    });
  }

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    scanned: rows.length,
    created,
    skipped_existing: skippedExisting,
    skipped_invalid: skippedInvalid,
    actions,
  });
}

