import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

const ALLOWED_STAGES = new Set([
  "new",
  "researching",
  "contacted",
  "replied",
  "pilot_invited",
  "pilot_active",
  "pilot_finished",
  "won",
  "lost",
  "nurture",
]);

export async function PATCH(
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

  const body = await req.json().catch(() => null);
  const stage = String(body?.stage || "").trim().toLowerCase();
  if (!ALLOWED_STAGES.has(stage)) {
    return NextResponse.json({ ok: false, error: "invalid_stage" }, { status: 400 });
  }

  const updates: Record<string, any> = { stage };
  if (typeof body?.next_action === "string") {
    updates.next_action = body.next_action.trim() || null;
  }
  if (typeof body?.next_action_at === "string") {
    updates.next_action_at = body.next_action_at.trim() || null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase.from("crm_prospects") as any)
    .update(updates)
    .eq("id", prospectId)
    .eq("agent_id", auth.user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_prospect_stage_update_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, prospect: data });
}
