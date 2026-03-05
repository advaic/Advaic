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

function normalizeOptionalUrl(value: unknown, max = 400): string | null {
  const v = String(value || "").trim().slice(0, max);
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) return null;
  return v;
}

function normalizePercent(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeNonNegativeInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round(n));
}

function normalizeText(value: unknown, max = 400): string | null {
  const v = String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  return v || null;
}

function normalizeTone(value: unknown): "kurz_direkt" | "freundlich" | "professionell" | "gemischt" | null {
  const v = String(value || "").trim().toLowerCase();
  if (v === "kurz_direkt" || v === "freundlich" || v === "professionell" || v === "gemischt") return v;
  return null;
}

function normalizeReadiness(value: unknown): "niedrig" | "mittel" | "hoch" | null {
  const v = String(value || "").trim().toLowerCase();
  if (v === "niedrig" || v === "mittel" || v === "hoch") return v;
  return null;
}

function normalizeCtaGuess(value: unknown): "kurze_mail_antwort" | "15_min_call" | "video_link" | "formular_antwort" | null {
  const v = String(value || "").trim().toLowerCase();
  if (v === "kurze_mail_antwort" || v === "15_min_call" || v === "video_link" || v === "formular_antwort") {
    return v;
  }
  return null;
}

function normalizeTextArray(value: unknown, maxItems = 8, maxItemLen = 80): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").replace(/\s+/g, " ").trim().slice(0, maxItemLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeSourceCheckedAt(value: unknown): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeConfidence(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, Math.round(n * 1000) / 1000));
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
      "id, company_name, contact_name, contact_email, contact_role, city, region, website_url, source_url, source_checked_at, linkedin_url, linkedin_search_url, linkedin_headline, linkedin_relevance_note, object_focus, active_listings_count, new_listings_30d, share_miete_percent, share_kauf_percent, object_types, price_band_main, region_focus_micro, response_promise_public, appointment_flow_public, docs_flow_public, owner_led, years_in_market, trust_signals, brand_tone, cta_preference_guess, primary_objection, primary_pain_hypothesis, secondary_pain_hypothesis, automation_readiness, personalization_evidence, hypothesis_confidence, preferred_channel, priority, fit_score, stage, last_contacted_at, next_action, next_action_at, personalization_hook, pain_point_hypothesis, created_at, updated_at",
    )
    .eq("agent_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (stage) query = query.eq("stage", stage);
  if (q) {
    query = query.or(
      `company_name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%,city.ilike.%${q}%,linkedin_url.ilike.%${q}%,primary_objection.ilike.%${q}%`,
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
    contact_name: normalizeText(body?.contact_name, 160),
    contact_email: normalizeText(body?.contact_email, 320)?.toLowerCase() || null,
    contact_role: normalizeText(body?.contact_role, 120),
    city: normalizeText(body?.city, 120),
    region: normalizeText(body?.region, 120),
    website_url: normalizeOptionalUrl(body?.website_url, 400),
    source_url: normalizeOptionalUrl(body?.source_url, 400),
    source_checked_at: normalizeSourceCheckedAt(body?.source_checked_at),
    linkedin_url: normalizeOptionalUrl(body?.linkedin_url, 400),
    linkedin_search_url: normalizeOptionalUrl(body?.linkedin_search_url, 500),
    linkedin_headline: normalizeText(body?.linkedin_headline, 220),
    linkedin_relevance_note: normalizeText(body?.linkedin_relevance_note, 400),
    object_focus: normalizeObjectFocus(body?.object_focus),
    active_listings_count: normalizeNonNegativeInt(body?.active_listings_count),
    new_listings_30d: normalizeNonNegativeInt(body?.new_listings_30d),
    share_miete_percent: normalizePercent(body?.share_miete_percent),
    share_kauf_percent: normalizePercent(body?.share_kauf_percent),
    object_types: normalizeTextArray(body?.object_types, 8, 80),
    price_band_main: normalizeText(body?.price_band_main, 140),
    region_focus_micro: normalizeText(body?.region_focus_micro, 180),
    response_promise_public: normalizeText(body?.response_promise_public, 180),
    appointment_flow_public: normalizeText(body?.appointment_flow_public, 180),
    docs_flow_public: normalizeText(body?.docs_flow_public, 180),
    owner_led: body?.owner_led === null || body?.owner_led === undefined ? null : Boolean(body?.owner_led),
    years_in_market: normalizeNonNegativeInt(body?.years_in_market),
    trust_signals: normalizeTextArray(body?.trust_signals, 12, 120),
    brand_tone: normalizeTone(body?.brand_tone),
    cta_preference_guess: normalizeCtaGuess(body?.cta_preference_guess),
    primary_objection: normalizeText(body?.primary_objection, 200),
    primary_pain_hypothesis: normalizeText(body?.primary_pain_hypothesis, 300),
    secondary_pain_hypothesis: normalizeText(body?.secondary_pain_hypothesis, 300),
    automation_readiness: normalizeReadiness(body?.automation_readiness),
    personalization_evidence: normalizeText(body?.personalization_evidence, 500),
    hypothesis_confidence: normalizeConfidence(body?.hypothesis_confidence),
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
