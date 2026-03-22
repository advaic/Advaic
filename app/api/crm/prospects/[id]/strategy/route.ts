import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  ensureProspectStrategyDecision,
  type EnsureProspectStrategyDecisionResult,
} from "@/lib/crm/strategyEngine";

export const runtime = "nodejs";

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

  const force = new URL(req.url).searchParams.get("force") === "1";
  const supabase = createSupabaseAdminClient();
  const result = await ensureProspectStrategyDecision(supabase, {
    agentId: String(auth.user.id),
    prospectId,
    force,
  });

  if (!result.ok) {
    const errorResult = result as Extract<EnsureProspectStrategyDecisionResult, { ok: false }>;
    const status =
      errorResult.error === "prospect_not_found"
        ? 404
        : errorResult.error === "crm_strategy_schema_missing"
          ? 503
          : 500;
    return NextResponse.json(
      { ok: false, error: errorResult.error, details: errorResult.details },
      { status },
    );
  }

  const successResult = result as Extract<EnsureProspectStrategyDecisionResult, { ok: true }>;
  return NextResponse.json({
    ok: true,
    generated: successResult.generated,
    strategy: successResult.strategy,
    ranked_contacts: successResult.rankedContacts,
    research: successResult.research,
  });
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

  const supabase = createSupabaseAdminClient();
  const result = await ensureProspectStrategyDecision(supabase, {
    agentId: String(auth.user.id),
    prospectId,
    force: true,
  });

  if (!result.ok) {
    const errorResult = result as Extract<EnsureProspectStrategyDecisionResult, { ok: false }>;
    const status =
      errorResult.error === "prospect_not_found"
        ? 404
        : errorResult.error === "crm_strategy_schema_missing"
          ? 503
          : 500;
    return NextResponse.json(
      { ok: false, error: errorResult.error, details: errorResult.details },
      { status },
    );
  }

  const successResult = result as Extract<EnsureProspectStrategyDecisionResult, { ok: true }>;
  return NextResponse.json({
    ok: true,
    generated: successResult.generated,
    strategy: successResult.strategy,
    ranked_contacts: successResult.rankedContacts,
    research: successResult.research,
  });
}
