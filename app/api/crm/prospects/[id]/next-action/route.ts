import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { computeNextActions } from "@/lib/crm/nextActionEngine";

export const runtime = "nodejs";

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
  const [prospectRes, eventsRes, messagesRes] = await Promise.all([
    (supabase.from("crm_prospects") as any)
      .select(
        "id, company_name, contact_name, contact_email, object_focus, preferred_channel, priority, fit_score, stage, next_action_at, updated_at, source_checked_at, personalization_hook",
      )
      .eq("agent_id", auth.user.id)
      .eq("id", prospectId)
      .maybeSingle(),
    (supabase.from("crm_outreach_events") as any)
      .select("prospect_id, event_type, event_at, metadata")
      .eq("agent_id", auth.user.id)
      .eq("prospect_id", prospectId)
      .in("event_type", [
        "message_sent",
        "message_failed",
        "reply_received",
        "call_booked",
        "pilot_invited",
        "pilot_started",
        "pilot_completed",
        "deal_won",
        "deal_lost",
        "unsubscribed",
        "no_interest",
      ])
      .order("event_at", { ascending: false })
      .limit(800),
    (supabase.from("crm_outreach_messages") as any)
      .select("prospect_id, status, message_kind, sent_at, created_at")
      .eq("agent_id", auth.user.id)
      .eq("prospect_id", prospectId)
      .in("status", ["draft", "ready", "sent"])
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const firstErr = prospectRes.error || eventsRes.error || messagesRes.error;
  if (firstErr) {
    if (isSchemaMismatch(firstErr as any)) {
      return NextResponse.json(
        {
          ok: false,
          error: "crm_schema_missing",
          details:
            "CRM-Schema ist veraltet. Bitte nacheinander ausführen: 20260304_crm_prospects_contact_email.sql und 20260304_crm_next_actions_sequence_logic.sql.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "crm_next_action_failed", details: firstErr.message },
      { status: 500 },
    );
  }

  if (!prospectRes.data) {
    return NextResponse.json({ ok: false, error: "prospect_not_found" }, { status: 404 });
  }

  const ranked = computeNextActions({
    prospects: [prospectRes.data as any],
    events: (eventsRes.data || []) as any[],
    messages: (messagesRes.data || []) as any[],
  });

  return NextResponse.json({ ok: true, next_action: ranked[0] || null });
}

