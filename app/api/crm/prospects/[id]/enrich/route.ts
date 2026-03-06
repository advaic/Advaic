import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  enrichProspectSignals,
  loadProspectForEnrichment,
} from "@/lib/crm/prospectEnrichment";

export const runtime = "nodejs";

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
  const force = Boolean(body?.force);

  const supabase = createSupabaseAdminClient();
  const loaded = await loadProspectForEnrichment(supabase, {
    prospectId,
    agentId: String(auth.user.id),
  });
  if (!loaded.ok) {
    return NextResponse.json(
      { ok: false, error: loaded.error, details: loaded.details },
      { status: loaded.error === "prospect_not_found" ? 404 : 500 },
    );
  }

  const enriched = await enrichProspectSignals(supabase, {
    prospectId,
    agentId: String(auth.user.id),
    prospect: loaded.prospect,
    force,
  });

  if (!enriched.ok) {
    const errCode = "error" in enriched ? enriched.error : "crm_enrich_failed";
    const errDetails = "details" in enriched ? enriched.details : undefined;
    return NextResponse.json(
      { ok: false, error: errCode, details: errDetails },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, ...enriched.result });
}
