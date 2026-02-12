import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// IMPORTANT: adjust path if your _guard location differs
import { requireAdmin } from "../../_guard";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Admin gate (cookie-based auth)
  const guard = await requireAdmin(_req);
  if (!guard.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = String(params?.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const supabase = supabaseAdmin();

  // 1) Load QA row
  const { data: qa, error: qaErr } = await (supabase.from("message_qas") as any)
    .select(
      [
        "id",
        "created_at",
        "agent_id",
        "lead_id",
        "inbound_message_id",
        "draft_message_id",
        "prompt_key",
        "prompt_version",
        "model",
        "verdict",
        "score",
        "reason",
        "reason_long",
        "action",
        "risk_flags",
        "flags",
        "suggestions",
        "meta",
      ].join(","),
    )
    .eq("id", id)
    .maybeSingle();

  if (qaErr) {
    return NextResponse.json(
      { error: "qa_load_failed", details: qaErr.message },
      { status: 500 },
    );
  }
  if (!qa) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // 2) Load agent + lead
  const [{ data: agent }, { data: lead }] = await Promise.all([
    (supabase.from("agents") as any)
      .select("id,email,name,company,created_at")
      .eq("id", qa.agent_id)
      .maybeSingle(),
    (supabase.from("leads") as any)
      .select(
        "id,agent_id,email,name,subject,type,email_provider,gmail_thread_id,outlook_conversation_id,followups_enabled,followup_stage,followup_status,followup_next_at,followup_last_sent_at",
      )
      .eq("id", qa.lead_id)
      .maybeSingle(),
  ]);

  // 3) Load inbound + draft messages
  const [{ data: inbound }, { data: draft }] = await Promise.all([
    (supabase.from("messages") as any)
      .select(
        [
          "id",
          "lead_id",
          "agent_id",
          "sender",
          "text",
          "timestamp",
          "status",
          "approval_required",
          "send_status",
          "send_error",
          "sent_at",
          "email_provider",
          "was_followup",
          "classification_reason",
          "classification_confidence",
          "email_type",
          "gpt_score",
        ].join(","),
      )
      .eq("id", qa.inbound_message_id)
      .maybeSingle(),
    (supabase.from("messages") as any)
      .select(
        [
          "id",
          "lead_id",
          "agent_id",
          "sender",
          "text",
          "timestamp",
          "status",
          "approval_required",
          "send_status",
          "send_error",
          "sent_at",
          "email_provider",
          "was_followup",
          "gpt_score",
        ].join(","),
      )
      .eq("id", qa.draft_message_id)
      .maybeSingle(),
  ]);

  // 4) Optional: property context via lead_property_state -> properties
  // (fail-safe if tables/columns differ)
  let property: any = null;
  try {
    const { data: lps } = await (supabase.from("lead_property_state") as any)
      .select("lead_id,agent_id,active_property_id,updated_at")
      .eq("lead_id", qa.lead_id)
      .maybeSingle();

    const activeId = lps?.active_property_id
      ? String(lps.active_property_id)
      : "";
    if (activeId) {
      // NOTE: your schema uses "neighborhood" + "url" (not neighbourhood/uri)
      const { data: prop } = await (supabase.from("properties") as any)
        .select(
          "id,city,neighborhood,street_address,type,price,price_type,rooms,size_sqm,floor,year_built,furnished,pets_allowed,heating,energy_label,available_from,elevator,parking,listing_summary,description,url,image_urls,created_at,updated_at",
        )
        .eq("id", activeId)
        .maybeSingle();
      property = prop ?? null;
    }
  } catch {
    // ignore safely
  }

  return NextResponse.json({
    ok: true,
    item: {
      qa,
      agent: agent ?? null,
      lead: lead ?? null,
      inbound: inbound ?? null,
      draft: draft ?? null,
      property,
    },
  });
}
