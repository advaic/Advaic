import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { getTopDiscoveryCities, runProspectDiscovery } from "@/lib/crm/prospectDiscovery";

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

function normalizeCities(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, 10);
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({} as any));
  const preset = String(body?.preset || "").trim().toLowerCase();
  const cities = preset === "top_cities" ? getTopDiscoveryCities() : normalizeCities(body?.cities);
  if (cities.length === 0) {
    return NextResponse.json({ ok: false, error: "missing_cities" }, { status: 400 });
  }

  const perCityLimit = Math.max(1, Math.min(5, Number(body?.per_city_limit || 3)));
  const supabase = createSupabaseAdminClient();
  const triggerType = preset === "top_cities" ? "preset" : "manual";
  const queryPack = cities.map((city) => ({
    city,
    queries: [`immobilienmakler ${city}`, `makler ${city} immobilien`],
  }));
  const { data: runRow, error: runInsertError } = await (supabase.from("crm_discovery_runs") as any)
    .insert({
      agent_id: auth.user.id,
      trigger_type: triggerType,
      query_pack: queryPack,
      cities,
      per_city_limit: perCityLimit,
      metadata: {
        preset: preset || null,
      },
    })
    .select("id")
    .single();

  if (runInsertError || !runRow?.id) {
    if (isSchemaMismatch(runInsertError as any)) {
      return NextResponse.json(
        {
          ok: false,
          error: "crm_discovery_schema_missing",
          details:
            "CRM-Discovery-Schema fehlt. Bitte zuerst die Migration 20260322_crm_phase1_precision_queue.sql ausführen.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "crm_discovery_run_create_failed",
        details: runInsertError?.message || "Discovery-Run konnte nicht initialisiert werden.",
      },
      { status: 500 },
    );
  }

  try {
    const result = await runProspectDiscovery({
      supabase,
      agentId: String(auth.user.id),
      discoveryRunId: String(runRow.id),
      cities,
      perCityLimit,
    });

    await (supabase.from("crm_discovery_runs") as any)
      .update({
        selected_count: Number(result.selected || 0),
        created_count: Number(result.created || 0),
        skipped_existing_count: Number(result.skipped_existing || 0),
        skipped_irrelevant_count: Number(result.skipped_irrelevant || 0),
        failed_count: Number(result.failed || 0),
        finished_at: new Date().toISOString(),
        metadata: {
          preset: preset || null,
          by_city: result.by_city,
        },
      })
      .eq("id", runRow.id)
      .eq("agent_id", auth.user.id);

    return NextResponse.json({
      ok: true,
      run_id: String(runRow.id),
      ...result,
    });
  } catch (error: any) {
    await (supabase.from("crm_discovery_runs") as any)
      .update({
        finished_at: new Date().toISOString(),
        failed_count: 0,
        metadata: {
          preset: preset || null,
          runtime_error: String(error?.message || "Prospect-Discovery fehlgeschlagen."),
        },
      })
      .eq("id", runRow.id)
      .eq("agent_id", auth.user.id);

    return NextResponse.json(
      {
        ok: false,
        error: "crm_discovery_run_failed",
        details: String(error?.message || "Prospect-Discovery fehlgeschlagen."),
      },
      { status: 500 },
    );
  }
}
