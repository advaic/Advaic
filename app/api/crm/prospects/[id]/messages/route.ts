import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

const ALLOWED_CHANNELS = new Set([
  "email",
  "telefon",
  "linkedin",
  "kontaktformular",
  "whatsapp",
  "sonstiges",
]);

const ALLOWED_KINDS = new Set([
  "first_touch",
  "follow_up_1",
  "follow_up_2",
  "follow_up_3",
  "custom",
]);

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
  const { data, error } = await (supabase.from("crm_outreach_messages") as any)
    .select(
      "id, channel, message_kind, subject, body, personalization_score, status, sent_at, external_message_id, metadata, created_at, updated_at",
    )
    .eq("agent_id", auth.user.id)
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_messages_fetch_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, messages: data || [] });
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

  const body = await req.json().catch(() => null);
  const messageBody = String(body?.body || "").trim();
  if (!messageBody) {
    return NextResponse.json({ ok: false, error: "missing_body" }, { status: 400 });
  }

  const channelRaw = String(body?.channel || "email").trim().toLowerCase();
  const kindRaw = String(body?.message_kind || "custom").trim().toLowerCase();
  const statusRaw = String(body?.status || "draft").trim().toLowerCase();
  const safeChannel = ALLOWED_CHANNELS.has(channelRaw) ? channelRaw : "email";
  const safeKind = ALLOWED_KINDS.has(kindRaw) ? kindRaw : "custom";
  const safeStatus = statusRaw === "ready" ? "ready" : "draft";
  const scoreRaw = Number(body?.personalization_score);
  const personalizationScore =
    Number.isFinite(scoreRaw) && scoreRaw >= 0 && scoreRaw <= 100 ? Math.round(scoreRaw) : null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase.from("crm_outreach_messages") as any)
    .insert({
      prospect_id: prospectId,
      agent_id: auth.user.id,
      channel: safeChannel,
      message_kind: safeKind,
      subject: String(body?.subject || "").trim() || null,
      body: messageBody,
      personalization_score: personalizationScore,
      status: safeStatus,
      metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {},
    })
    .select(
      "id, channel, message_kind, subject, body, personalization_score, status, sent_at, metadata, created_at, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_message_create_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, message: data });
}
