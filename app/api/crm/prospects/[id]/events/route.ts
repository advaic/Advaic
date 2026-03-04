import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

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

  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase.from("crm_outreach_events") as any)
    .select("id, message_id, event_type, details, event_at, created_at")
    .eq("agent_id", auth.user.id)
    .eq("prospect_id", prospectId)
    .order("event_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_events_fetch_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, events: data || [] });
}
