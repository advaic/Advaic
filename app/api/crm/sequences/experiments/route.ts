import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  loadActiveRolloutWinners,
  recomputeSequenceRolloutWinners,
} from "@/lib/crm/sequenceExperiments";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const url = new URL(req.url);
  const recompute = url.searchParams.get("recompute") === "1";

  if (recompute) {
    const minSamples = Math.max(4, Math.min(80, Number(url.searchParams.get("min_samples") || 10)));
    const lookbackDays = Math.max(14, Math.min(365, Number(url.searchParams.get("lookback_days") || 120)));
    const calc = await recomputeSequenceRolloutWinners({
      supabase,
      agentId: String(auth.user.id),
      minSamples,
      lookbackDays,
    });
    if (!calc.ok) {
      return NextResponse.json(
        { ok: false, error: calc.error, details: calc.details },
        { status: 500 },
      );
    }
  }

  const winners = await loadActiveRolloutWinners(supabase, String(auth.user.id));
  const winnerRows = [...winners.entries()].map(([message_kind, row]) => ({
    message_kind,
    winner_variant: row.variant,
    confidence: row.confidence,
    sample_size: row.sample_size,
  }));

  const { data: rawRows, error } = await (supabase.from("crm_sequence_rollouts") as any)
    .select("message_kind, winner_variant, confidence, sample_size, is_active, stats, updated_at")
    .eq("agent_id", String(auth.user.id))
    .order("message_kind", { ascending: true });

  if (error) {
    return NextResponse.json(
      {
        ok: true,
        winners: winnerRows,
        rollouts: [],
        warning: "crm_sequence_rollouts table fehlt oder ist nicht verfügbar.",
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    winners: winnerRows,
    rollouts: rawRows || [],
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({} as any));
  const minSamples = Math.max(4, Math.min(80, Number(body?.min_samples || 10)));
  const lookbackDays = Math.max(14, Math.min(365, Number(body?.lookback_days || 120)));

  const supabase = createSupabaseAdminClient();
  const calc = await recomputeSequenceRolloutWinners({
    supabase,
    agentId: String(auth.user.id),
    minSamples,
    lookbackDays,
  });

  if (!calc.ok) {
    return NextResponse.json(
      { ok: false, error: calc.error, details: calc.details },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    min_samples: calc.min_samples,
    lookback_days: calc.lookback_days,
    winners: calc.winners,
  });
}
