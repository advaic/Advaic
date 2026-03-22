import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { runContactRepair, type ContactResolutionTrigger } from "@/lib/crm/contactResolutionEngine";

export const runtime = "nodejs";

const ALLOWED_TRIGGER_TYPES = new Set([
  "missing_contact",
  "bounce",
  "wrong_contact",
  "manual",
  "sequence_run",
]);

function clean(value: unknown, max = 120) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const prospectId = clean(id, 120);
  if (!prospectId) {
    return NextResponse.json({ ok: false, error: "missing_prospect_id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({} as any));
  const triggerType = clean(body?.trigger_type, 40).toLowerCase() || "manual";
  if (!ALLOWED_TRIGGER_TYPES.has(triggerType)) {
    return NextResponse.json({ ok: false, error: "invalid_trigger_type" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const result = await runContactRepair(supabase, {
    agentId: String(auth.user.id),
    prospectId,
    triggerType: triggerType as ContactResolutionTrigger,
    messageId: clean(body?.message_id, 120) || null,
    contactCandidateId: clean(body?.contact_candidate_id, 120) || null,
  });

  if (!result.ok) {
    const errorResult = result as Extract<typeof result, { ok: false }>;
    const status =
      errorResult.error === "prospect_not_found"
        ? 404
        : errorResult.error.includes("schema")
          ? 503
          : 500;
    return NextResponse.json(
      { ok: false, error: errorResult.error, details: errorResult.details },
      { status },
    );
  }

  return NextResponse.json(result);
}
