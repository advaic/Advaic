import { NextRequest, NextResponse } from "next/server";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";
import { loadCrmAutomationSettings, saveCrmAutomationSettings } from "@/lib/crm/automationSettings";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";

export const runtime = "nodejs";

type Body = {
  sequence_automation_enabled?: boolean;
  enrichment_automation_enabled?: boolean;
  reason?: string | null;
};

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const settings = await loadCrmAutomationSettings(supabase, String(auth.user.id));

  return NextResponse.json({
    ok: true,
    settings,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "missing_body" }, { status: 400 });
  }

  const hasSequence = typeof body.sequence_automation_enabled === "boolean";
  const hasEnrichment = typeof body.enrichment_automation_enabled === "boolean";
  const hasReason = body.reason !== undefined;
  if (!hasSequence && !hasEnrichment && !hasReason) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_fields",
        details: "Mindestens ein CRM-Automation-Feld muss gesetzt werden.",
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const saved = await saveCrmAutomationSettings(supabase, {
    agentId: String(auth.user.id),
    sequenceAutomationEnabled: hasSequence ? body.sequence_automation_enabled : undefined,
    enrichmentAutomationEnabled: hasEnrichment ? body.enrichment_automation_enabled : undefined,
    reason: hasReason ? body.reason ?? null : undefined,
  });

  if (saved.ok === false) {
    const status = saved.error === "crm_automation_schema_missing" ? 503 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: saved.error,
        details: saved.details,
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    settings: saved.settings,
  });
}
