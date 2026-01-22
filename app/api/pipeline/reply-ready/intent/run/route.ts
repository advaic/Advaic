import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

const NEXT_STATUS_AFTER_INTENT = "intent_done";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(req: Request) {
  const supabase = supabaseAdmin();

  // Pull a small batch of inbound messages that are ready for intent
  // Adjust the status filter to your real inbound status(es).
  const { data: msgs, error } = await (supabase.from("messages") as any)
    .select("id, agent_id, lead_id, text, sender, status, timestamp")
    .eq("sender", "user")
    // Gmail push often sets inbound user emails to `needs_approval` when approval_required is true, so the intent pipeline must include it.
    .in("status", ["needs_approval", "ready", "inbound", "pending"]) // include common inbound states
    .neq("status", NEXT_STATUS_AFTER_INTENT)
    .order("timestamp", { ascending: true })
    .limit(25);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load pending messages" },
      { status: 500 }
    );
  }

  const results: any[] = [];

  for (const m of msgs || []) {
    const messageId = String(m.id);
    try {
      // Skip if already has intent v1
      const { data: existing } = await (supabase.from("message_intents") as any)
        .select("id")
        .eq("message_id", messageId)
        .eq("prompt_version", "v1")
        .maybeSingle();

      if (existing) continue;

      // Context improves intent accuracy (e.g. SPECIFIC vs SEARCH).
      // Pull last 10 messages for the lead (most recent first).
      const { data: ctx } = await (supabase.from("messages") as any)
        .select("sender, text, timestamp")
        .eq("lead_id", m.lead_id)
        .order("timestamp", { ascending: false })
        .limit(10);

      const classifyRes = await fetch(
        new URL(
          "/api/ai/intent-classify",
          mustEnv("NEXT_PUBLIC_SITE_URL")
        ).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: m.text,
            context: (ctx || []).map((x: any) => ({
              sender: x.sender,
              text: x.text,
            })),
          }),
        }
      ).catch(() => null);

      let classified: any = null;
      if (classifyRes && classifyRes.ok) {
        classified = await classifyRes.json().catch(() => null);
      }

      const intent = String(classified?.intent || "OTHER");
      const confidence = Number(classified?.confidence || 0);
      const entities =
        classified?.entities && typeof classified.entities === "object"
          ? classified.entities
          : {};
      const reason = String(classified?.reason || "n/a").slice(0, 120);

      // Write artifact (idempotent)
      const { error: intentWriteErr } = await supabase
        .from("message_intents")
        .upsert(
          {
            agent_id: m.agent_id,
            lead_id: m.lead_id,
            message_id: messageId,
            intent,
            confidence,
            entities,
            reason,
            model: "azure",
            prompt_version: "v1",
          } as any,
          { onConflict: "message_id,prompt_version" }
        );

      if (intentWriteErr) {
        // Keep pipeline fail-open: do not break the whole batch
        results.push({
          messageId,
          intent: "OTHER",
          confidence: 0,
          error: intentWriteErr.message,
        });
        continue;
      }

      // Mark message as intent-complete so this pipeline doesn't keep re-scanning it.
      // Downstream stages should filter on this status (or just read the message_intents artifact).
      await (supabase.from("messages") as any)
        .update({ status: NEXT_STATUS_AFTER_INTENT })
        .eq("id", messageId);

      // Routing happens in the next pipeline stage (route-resolve).
      results.push({ messageId, intent, confidence });
    } catch (e: any) {
      results.push({
        messageId,
        intent: "OTHER",
        confidence: 0,
        error: String(e?.message || e || "intent_run_failed"),
      });
      continue;
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
