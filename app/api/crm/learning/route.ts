import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import {
  loadCurrentLearningSnapshot,
  recomputeLearningSnapshot,
} from "@/lib/crm/learningLoop";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  try {
    const snapshot = await loadCurrentLearningSnapshot(supabase, String(auth.user.id));
    return NextResponse.json({
      ok: true,
      snapshot,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "crm_learning_load_failed",
        details: String(error?.message || "Learning-Snapshot konnte nicht geladen werden."),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({} as any));
  const lookbackDays = Math.max(30, Math.min(365, Number(body?.lookback_days || 120)));
  const supabase = createSupabaseAdminClient();
  const result = await recomputeLearningSnapshot({
    supabase,
    agentId: String(auth.user.id),
    lookbackDays,
  });

  if (!result.ok) {
    const status = result.error === "crm_learning_schema_missing" ? 503 : 500;
    return NextResponse.json(
      { ok: false, error: result.error, details: result.details },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    snapshot: result.snapshot,
  });
}
