import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type InboundMsg = {
  id: string;
  lead_id: string;
  agent_id: string;
  text: string | null;
  snippet?: string | null;
  timestamp: string;
};

export async function POST(req: Request) {
  const supabase = supabaseAdmin();

  // Optional: simple shared-secret so nobody can hit this endpoint publicly
  const secret = req.headers.get("x-advaic-secret");
  if (
    process.env.ADVAIC_PIPELINE_SECRET &&
    secret !== process.env.ADVAIC_PIPELINE_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1) fetch candidates
  const { data: candidates, error: selErr } = await supabase
    .from("messages")
    .select("id, lead_id, agent_id, text, snippet, timestamp")
    .eq("sender", "user")
    .eq("status", "ready")
    .order("timestamp", { ascending: true })
    .limit(10);

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }

  const msgs = (candidates || []) as InboundMsg[];
  if (msgs.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;
  const results: any[] = [];

  for (const m of msgs) {
    // 2) acquire lock by state transition ready -> drafting
    const { data: lockRows, error: lockErr } = await supabase
      .from("messages")
      .update({ status: "drafting" })
      .eq("id", m.id)
      .eq("status", "ready")
      .select("id");

    if (lockErr || !lockRows || lockRows.length === 0) {
      // someone else took it
      continue;
    }

    try {
      const inboundText = (m.text || m.snippet || "").trim();

      // 3) TODO: intent classification (placeholder)
      // later: call your Azure route/module
      const intent = "GENERAL"; // PROPERTY_MATCH | QNA | GENERAL | VIEWING_REQUEST | PRICING | ...
      const intentReason = "placeholder";

      // 4) TODO: retrieval (if PROPERTY_MATCH)
      const context = ""; // e.g. top 3 matching properties summary

      // 5) TODO: compose + QA (+ rewrite)
      const draftText =
        `Danke für deine Nachricht!\n\n` +
        `Ich habe das gesehen und melde mich gleich mit den passenden Infos.\n\n` +
        `Beste Grüße`;

      // 6) insert draft message for approval
      const { error: insErr } = await supabase.from("messages").insert({
        lead_id: m.lead_id,
        agent_id: m.agent_id,
        sender: "assistant",
        text: draftText,
        timestamp: new Date().toISOString(),
        visible_to_agent: true,
        approval_required: true,
        status: "needs_approval",

        // optional meta fields (only if they exist in your schema):
        // intent,
        // intent_reason: intentReason,
      } as any);

      if (insErr) throw new Error(insErr.message);

      // 7) mark inbound as handled (so it won’t loop forever)
      await supabase
        .from("messages")
        .update({ status: "handled" })
        .eq("id", m.id);

      processed++;
      results.push({ id: m.id, ok: true });
    } catch (e: any) {
      // release lock / mark failed
      await supabase
        .from("messages")
        .update({ status: "failed_draft" })
        .eq("id", m.id);

      results.push({ id: m.id, ok: false, error: String(e?.message || e) });
    }
  }

  return NextResponse.json({ ok: true, processed, results });
}
