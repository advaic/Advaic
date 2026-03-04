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
  const { data, error } = await (supabase.from("crm_research_notes") as any)
    .select("id, source_type, source_url, note, confidence, is_key_insight, created_at")
    .eq("agent_id", auth.user.id)
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_notes_fetch_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, notes: data || [] });
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
  const note = String(body?.note || "").trim();
  if (!note) {
    return NextResponse.json({ ok: false, error: "missing_note" }, { status: 400 });
  }

  const sourceType = String(body?.source_type || "manual").trim().toLowerCase();
  const allowedSourceTypes = new Set([
    "website",
    "linkedin",
    "telefon",
    "portal",
    "manual",
    "sonstiges",
  ]);
  const safeSourceType = allowedSourceTypes.has(sourceType) ? sourceType : "manual";
  const confidenceRaw = Number(body?.confidence);
  const confidence =
    Number.isFinite(confidenceRaw) && confidenceRaw >= 0 && confidenceRaw <= 1
      ? confidenceRaw
      : null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase.from("crm_research_notes") as any)
    .insert({
      prospect_id: prospectId,
      agent_id: auth.user.id,
      source_type: safeSourceType,
      source_url: String(body?.source_url || "").trim() || null,
      note,
      confidence,
      is_key_insight: !!body?.is_key_insight,
      metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {},
    })
    .select("id, source_type, source_url, note, confidence, is_key_insight, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_note_create_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, note: data });
}
