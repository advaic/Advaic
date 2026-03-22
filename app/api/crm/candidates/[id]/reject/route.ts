import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { recordOperatorFeedback } from "@/lib/crm/operatorFeedback";

export const runtime = "nodejs";

function clean(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function isSchemaMismatch(error: { message?: string; details?: string; hint?: string; code?: string } | null | undefined) {
  const text = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  return (
    code === "42703" ||
    code === "42p01" ||
    text.includes("does not exist") ||
    text.includes("schema cache") ||
    text.includes("could not find the") ||
    text.includes("relation")
  );
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const candidateId = clean(id, 120);
  if (!candidateId) {
    return NextResponse.json({ ok: false, error: "missing_candidate_id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({} as any));
  const reason = clean(body?.reason, 240) || "Nicht passend für die Akquise.";

  const supabase = createSupabaseAdminClient();
  const { data: candidate, error: candidateError } = await (supabase.from("crm_prospect_candidates") as any)
    .select("id, review_status, promoted_prospect_id")
    .eq("id", candidateId)
    .eq("agent_id", auth.user.id)
    .maybeSingle();

  if (candidateError) {
    if (isSchemaMismatch(candidateError as any)) {
      return NextResponse.json(
        {
          ok: false,
          error: "crm_discovery_schema_missing",
          details:
            "CRM-Discovery-Schema fehlt. Bitte zuerst die Migration 20260322_crm_phase1_precision_queue.sql ausführen.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "candidate_load_failed", details: candidateError.message },
      { status: 500 },
    );
  }

  if (!candidate) {
    return NextResponse.json({ ok: false, error: "candidate_not_found" }, { status: 404 });
  }

  if (candidate.review_status === "rejected") {
    return NextResponse.json({
      ok: true,
      status: "rejected",
      already_processed: true,
      candidate_id: candidateId,
    });
  }

  if (candidate.review_status !== "new") {
    return NextResponse.json(
      {
        ok: false,
        error: "candidate_already_reviewed",
        details: "Dieser Kandidat wurde bereits bewertet.",
      },
      { status: 409 },
    );
  }

  const { error: updateError } = await (supabase.from("crm_prospect_candidates") as any)
    .update({
      review_status: "rejected",
      review_reason: reason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", candidateId)
    .eq("agent_id", auth.user.id);

  if (updateError) {
    return NextResponse.json(
      {
        ok: false,
        error: "candidate_reject_failed",
        details: updateError.message,
      },
      { status: 500 },
    );
  }

  try {
    await recordOperatorFeedback(supabase, {
      agentId: String(auth.user.id),
      subjectType: "candidate",
      subjectId: candidateId,
      feedbackValue: "reject",
      candidateId,
      notes: reason,
      metadata: {
        outcome: "rejected",
      },
    });
  } catch {
    // Fail-open: candidate rejection should not depend on feedback logging.
  }

  return NextResponse.json({
    ok: true,
    status: "rejected",
    candidate_id: candidateId,
    reason,
  });
}
