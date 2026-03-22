import { NextRequest, NextResponse } from "next/server";
import { loadCrmAutomationSettings } from "@/lib/crm/automationSettings";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import {
  enrichProspectSignals,
  loadProspectForEnrichment,
  type ProspectRow,
} from "@/lib/crm/prospectEnrichment";

export const runtime = "nodejs";

function parseIso(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function isStale(prospect: ProspectRow, staleDays: number) {
  const checkedTs = parseIso(prospect.source_checked_at);
  if (!checkedTs) return true;
  const diffMs = Date.now() - checkedTs;
  return diffMs > staleDays * 24 * 60 * 60 * 1000;
}

function needsChangeWatch(prospect: ProspectRow, changeWatchDays: number) {
  const stage = String((prospect as any).stage || "").trim().toLowerCase();
  const trackedStage = ["new", "researching", "contacted", "nurture"].includes(stage);
  const nextActionTs = parseIso((prospect as any).next_action_at);
  const hasUpcomingAction = nextActionTs !== null && nextActionTs <= Date.now() + 7 * 24 * 60 * 60 * 1000;
  if (!trackedStage && !hasUpcomingAction) return false;
  return isStale(prospect, changeWatchDays);
}

function needsEnrichment(prospect: ProspectRow, staleDays: number) {
  return (
    isStale(prospect, staleDays) ||
    needsChangeWatch(prospect, Math.min(staleDays, 10)) ||
    !String(prospect.contact_email || "").trim() ||
    !String(prospect.linkedin_url || "").trim() ||
    !String(prospect.linkedin_search_url || "").trim() ||
    !String(prospect.personalization_hook || "").trim() ||
    !String(prospect.personalization_evidence || "").trim() ||
    !String(prospect.target_group || "").trim() ||
    !String(prospect.process_hint || "").trim() ||
    !Array.isArray(prospect.object_types) ||
    prospect.object_types.length === 0 ||
    !Array.isArray(prospect.trust_signals) ||
    prospect.trust_signals.length === 0 ||
    !String(prospect.primary_pain_hypothesis || prospect.pain_point_hypothesis || "").trim() ||
    !String(prospect.automation_readiness || "").trim() ||
    !String(prospect.brand_tone || "").trim()
  );
}

export async function POST(req: NextRequest) {
  const secret = process.env.ADVAIC_INTERNAL_PIPELINE_SECRET || "";
  const headerSecret = req.headers.get("x-advaic-internal-secret") || "";
  if (!secret || headerSecret !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const agentId = String(body?.agent_id || process.env.CRM_OWNER_AGENT_ID || "").trim();
  if (!agentId) {
    return NextResponse.json(
      { ok: false, error: "missing_agent_id", details: "agent_id fehlt im Body oder CRM_OWNER_AGENT_ID ist nicht gesetzt." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const automation = await loadCrmAutomationSettings(supabase, agentId);
  if (!automation.enrichment_automation_enabled) {
    const nowIso = new Date().toISOString();
    await (supabase.from("crm_enrichment_runs") as any).insert({
      agent_id: agentId,
      trigger_type: "pipeline",
      scanned_count: 0,
      selected_count: 0,
      enriched_count: 0,
      failed_count: 0,
      skipped_count: 0,
      stale_days: Math.max(3, Math.min(90, Number(body?.stale_days || 21))),
      force_mode: false,
      started_at: nowIso,
      finished_at: nowIso,
      metadata: {
        source: "crm_enrich_nightly",
        skipped_reason: "crm_enrichment_automation_paused",
        crm_automation_reason: automation.reason,
      },
    });
    return NextResponse.json({
      ok: true,
      skipped: "crm_enrichment_automation_paused",
      reason:
        automation.reason ||
        "CRM-Nightly-Enrichment ist pausiert und wurde deshalb nicht ausgefuehrt.",
      settings: automation,
    });
  }

  const limit = Math.max(1, Math.min(250, Number(body?.limit || 80)));
  const staleDays = Math.max(3, Math.min(90, Number(body?.stale_days || 21)));
  const startedAt = new Date().toISOString();

  const { data: prospects, error } = await (supabase.from("crm_prospects") as any)
    .select(
      "id, company_name, contact_name, contact_email, city, website_url, source_url, source_checked_at, object_focus, active_listings_count, object_types, trust_signals, brand_tone, automation_readiness, response_promise_public, appointment_flow_public, docs_flow_public, linkedin_url, linkedin_search_url, personalization_hook, personalization_evidence, target_group, process_hint, primary_pain_hypothesis, pain_point_hypothesis, stage, next_action_at",
    )
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false })
    .limit(limit * 3);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "crm_enrich_candidates_fetch_failed", details: error.message },
      { status: 500 },
    );
  }

  const rows = (Array.isArray(prospects) ? prospects : []) as ProspectRow[];
  const selected = rows.filter((p) => needsEnrichment(p, staleDays)).slice(0, limit);

  let enrichedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const prospect of selected) {
    const loaded = await loadProspectForEnrichment(supabase, {
      prospectId: String(prospect.id),
      agentId,
    });
    if (!loaded.ok) {
      failedCount += 1;
      continue;
    }

    const enriched = await enrichProspectSignals(supabase, {
      prospectId: String(prospect.id),
      agentId,
      prospect: loaded.prospect,
      force: false,
    });
    if (!enriched.ok) {
      failedCount += 1;
      continue;
    }

    if (Object.keys(enriched.result.applied_updates || {}).length === 0) {
      skippedCount += 1;
    } else {
      enrichedCount += 1;
    }
  }

  const finishedAt = new Date().toISOString();
  await (supabase.from("crm_enrichment_runs") as any).insert({
    agent_id: agentId,
    trigger_type: "pipeline",
    scanned_count: rows.length,
    selected_count: selected.length,
    enriched_count: enrichedCount,
    failed_count: failedCount,
    skipped_count: skippedCount,
    stale_days: staleDays,
    force_mode: false,
    started_at: startedAt,
    finished_at: finishedAt,
    metadata: {
      source: "crm_enrich_nightly",
    },
  });

  return NextResponse.json({
    ok: true,
    scanned: rows.length,
    selected: selected.length,
    enriched: enrichedCount,
    failed: failedCount,
    skipped: skippedCount,
    stale_days: staleDays,
    run_started_at: startedAt,
    run_finished_at: finishedAt,
  });
}
