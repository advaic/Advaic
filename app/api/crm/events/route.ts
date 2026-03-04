import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

const ALLOWED_EVENT_TYPES = new Set([
  "message_sent",
  "message_failed",
  "reply_received",
  "call_booked",
  "pilot_invited",
  "pilot_accepted",
  "pilot_started",
  "pilot_completed",
  "deal_won",
  "deal_lost",
  "unsubscribed",
  "no_interest",
  "follow_up_due",
]);

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const prospectId = String(body?.prospect_id || "").trim();
  const eventType = String(body?.event_type || "").trim();
  const messageIdRaw = String(body?.message_id || "").trim();
  const details = String(body?.details || "").trim() || null;
  const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {};

  if (!prospectId) {
    return NextResponse.json({ ok: false, error: "missing_prospect_id" }, { status: 400 });
  }
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ ok: false, error: "invalid_event_type" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await ((supabase as any).rpc("crm_register_outreach_event", {
    p_prospect_id: prospectId,
    p_agent_id: auth.user.id,
    p_event_type: eventType,
    p_message_id: messageIdRaw || null,
    p_details: details,
    p_metadata: metadata,
  }) as any);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_event_create_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, event_id: data || null });
}
