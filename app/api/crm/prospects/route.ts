import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

function normalizePriority(value: unknown): "A" | "B" | "C" {
  const v = String(value || "B").trim().toUpperCase();
  if (v === "A" || v === "C") return v;
  return "B";
}

function normalizeObjectFocus(value: unknown): "miete" | "kauf" | "neubau" | "gemischt" {
  const v = String(value || "gemischt").trim().toLowerCase();
  if (v === "miete" || v === "kauf" || v === "neubau") return v;
  return "gemischt";
}

function normalizeChannel(
  value: unknown,
): "email" | "telefon" | "linkedin" | "kontaktformular" | "whatsapp" | "sonstiges" {
  const v = String(value || "email").trim().toLowerCase();
  if (
    v === "email" ||
    v === "telefon" ||
    v === "linkedin" ||
    v === "kontaktformular" ||
    v === "whatsapp"
  ) {
    return v;
  }
  return "sonstiges";
}

function normalizeFitScore(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim();
  const stage = String(url.searchParams.get("stage") || "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 50)));

  const supabase = createSupabaseAdminClient();
  let query = (supabase.from("crm_prospects") as any)
    .select(
      "id, company_name, contact_name, contact_email, contact_role, city, region, object_focus, preferred_channel, priority, fit_score, stage, last_contacted_at, next_action, next_action_at, personalization_hook, pain_point_hypothesis, created_at, updated_at",
    )
    .eq("agent_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (stage) query = query.eq("stage", stage);
  if (q) {
    query = query.or(
      `company_name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%,city.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_prospects_fetch_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, prospects: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const companyName = String(body?.company_name || "").trim();
  if (!companyName) {
    return NextResponse.json(
      { ok: false, error: "missing_company_name" },
      { status: 400 },
    );
  }

  const payload = {
    agent_id: auth.user.id,
    company_name: companyName,
    contact_name: String(body?.contact_name || "").trim() || null,
    contact_email: String(body?.contact_email || "").trim().toLowerCase() || null,
    contact_role: String(body?.contact_role || "").trim() || null,
    city: String(body?.city || "").trim() || null,
    region: String(body?.region || "").trim() || null,
    website_url: String(body?.website_url || "").trim() || null,
    object_focus: normalizeObjectFocus(body?.object_focus),
    target_group: String(body?.target_group || "").trim() || null,
    process_hint: String(body?.process_hint || "").trim() || null,
    pain_point_hypothesis: String(body?.pain_point_hypothesis || "").trim() || null,
    personalization_hook: String(body?.personalization_hook || "").trim() || null,
    fit_score: normalizeFitScore(body?.fit_score),
    priority: normalizePriority(body?.priority),
    preferred_channel: normalizeChannel(body?.preferred_channel),
    next_action: String(body?.next_action || "").trim() || "Tester-Einladung personalisieren",
    next_action_at: body?.next_action_at ? String(body.next_action_at) : null,
    metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {},
  };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase.from("crm_prospects") as any)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_prospect_create_failed", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, prospect: data });
}
