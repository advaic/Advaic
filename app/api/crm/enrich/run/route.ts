import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
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
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({} as any));
  const force = Boolean(body?.force);
  const limit = Math.max(1, Math.min(200, Number(body?.limit || 30)));
  const staleDays = Math.max(3, Math.min(90, Number(body?.stale_days || 21)));

  const supabase = createSupabaseAdminClient();
  const agentId = String(auth.user.id);

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
  const selected = force ? rows.slice(0, limit) : rows.filter((p) => needsEnrichment(p, staleDays)).slice(0, limit);

  const runSummary = {
    scanned: rows.length,
    selected: selected.length,
    enriched: 0,
    failed: 0,
    skipped: 0,
  };

  const details: Array<{
    prospect_id: string;
    company_name: string | null;
    status: "enriched" | "failed" | "skipped";
    error?: string;
    updates?: string[];
    changes?: string[];
  }> = [];

  for (const prospect of selected) {
    const loaded = await loadProspectForEnrichment(supabase, {
      prospectId: String(prospect.id),
      agentId,
    });
    if (!loaded.ok) {
      runSummary.failed += 1;
      details.push({
        prospect_id: String(prospect.id),
        company_name: prospect.company_name,
        status: "failed",
        error: loaded.details || loaded.error,
      });
      continue;
    }

    const enriched = await enrichProspectSignals(supabase, {
      prospectId: String(prospect.id),
      agentId,
      prospect: loaded.prospect,
      force,
    });

    if (!enriched.ok) {
      const errDetails = "details" in enriched ? enriched.details : undefined;
      const errCode = "error" in enriched ? enriched.error : "crm_enrich_failed";
      runSummary.failed += 1;
      details.push({
        prospect_id: String(prospect.id),
        company_name: prospect.company_name,
        status: "failed",
        error: errDetails || errCode,
      });
      continue;
    }

    const updateKeys = Object.keys(enriched.result.applied_updates || {});
    if (updateKeys.length === 0) {
      runSummary.skipped += 1;
      details.push({
        prospect_id: String(prospect.id),
        company_name: prospect.company_name,
        status: "skipped",
      });
      continue;
    }

    runSummary.enriched += 1;
      details.push({
        prospect_id: String(prospect.id),
        company_name: prospect.company_name,
        status: "enriched",
        updates: updateKeys,
        changes:
          enriched.result.change_summary?.detected
            ? enriched.result.change_summary.items.map((item) => item.label)
            : [],
      });
  }

  const finishedAt = new Date().toISOString();
  await (supabase.from("crm_enrichment_runs") as any).insert({
    agent_id: agentId,
    trigger_type: "manual",
    scanned_count: runSummary.scanned,
    selected_count: runSummary.selected,
    enriched_count: runSummary.enriched,
    failed_count: runSummary.failed,
    skipped_count: runSummary.skipped,
    stale_days: staleDays,
    force_mode: force,
    started_at: startedAt,
    finished_at: finishedAt,
    metadata: { details },
  });

  return NextResponse.json({
    ok: true,
    ...runSummary,
    stale_days: staleDays,
    force,
    run_started_at: startedAt,
    run_finished_at: finishedAt,
    details,
  });
}
