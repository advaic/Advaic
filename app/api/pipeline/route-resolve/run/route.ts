import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";
// NOTE: This route should live in a .ts file (not .tsx). If this file is currently named .tsx, rename it to route.ts.

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

type IntentArtifact = {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
};

function isNonEmptyString(x: any): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function toNum(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function normalizeBool(x: any): boolean | null {
  if (x === true || x === false) return x;
  if (typeof x === "string") {
    const s = x.toLowerCase().trim();
    if (["true", "yes", "ja", "1"].includes(s)) return true;
    if (["false", "no", "nein", "0"].includes(s)) return false;
  }
  return null;
}

function normalizeIntent(raw: string) {
  const x = String(raw || "OTHER").toUpperCase().trim();

  // Canonical intents used by this runner
  // PROPERTY_SEARCH | PROPERTY_SPECIFIC | VIEWING_REQUEST | APPLICATION_PROCESS | QNA_GENERAL | STATUS_FOLLOWUP | SPAM_OR_IRRELEVANT | OTHER

  // Newer/alternate enum aliases (from earlier classifier versions)
  if (x === "PROPERTY_MATCH") return "PROPERTY_SEARCH";
  if (x === "FAQ") return "QNA_GENERAL";
  if (x === "VIEWING_SCHEDULING") return "VIEWING_REQUEST";
  if (x === "AVAILABILITY") return "PROPERTY_SPECIFIC";
  if (x === "DOCUMENTS") return "APPLICATION_PROCESS";
  if (x === "GENERAL_QUESTION") return "OTHER";
  if (x === "PRICE_NEGOTIATION") return "QNA_GENERAL";

  // Already-canonical values
  const allowed = new Set([
    "PROPERTY_SEARCH",
    "PROPERTY_SPECIFIC",
    "VIEWING_REQUEST",
    "APPLICATION_PROCESS",
    "QNA_GENERAL",
    "STATUS_FOLLOWUP",
    "SPAM_OR_IRRELEVANT",
    "OTHER",
  ]);

  return allowed.has(x) ? x : "OTHER";
}

async function resolvePropertyByUriOrAddress(
  supabase: any,
  agentId: string,
  entities: any
) {
  const uri = isNonEmptyString(entities?.property_url)
    ? entities.property_url.trim()
    : null;
  const address = isNonEmptyString(entities?.address)
    ? entities.address.trim()
    : null;

  // 1) URI match (best)
  if (uri) {
    const { data } = await (supabase.from("properties") as any)
      .select("id, uri")
      .eq("agent_id", agentId)
      .eq("uri", uri)
      .maybeSingle();
    if (data?.id) return String(data.id);
  }

  // 2) Address heuristic (if you store street_address/city)
  if (address) {
    // super basic: try contains on street_address
    const { data } = await (supabase.from("properties") as any)
      .select("id, street_address, city")
      .eq("agent_id", agentId)
      .ilike("street_address", `%${address}%`)
      .limit(1);
    if (Array.isArray(data) && data[0]?.id) return String(data[0].id);
  }

  return null;
}

async function getLeadPropertyState(supabase: any, leadId: string) {
  const { data } = await (supabase.from("lead_property_state") as any)
    .select(
      "lead_id, agent_id, active_property_id, last_recommended_property_ids"
    )
    .eq("lead_id", leadId)
    .maybeSingle();
  return data || null;
}

async function upsertLeadPropertyState(supabase: any, row: any) {
  await (supabase.from("lead_property_state") as any).upsert(row, {
    onConflict: "lead_id",
  });
}

async function hasRouteArtifact(supabase: any, messageId: string) {
  const { data } = await (supabase.from("message_routes") as any)
    .select("id")
    .eq("message_id", messageId)
    .eq("prompt_version", "v1")
    .maybeSingle();
  return !!data?.id;
}

async function insertRouteArtifact(supabase: any, row: any) {
  await (supabase.from("message_routes") as any).insert(row);
}

export async function POST() {
  const supabase = supabaseAdmin();

  // 1) Pull inbound user messages that need routing.
  const { data: msgs, error } = await (supabase.from("messages") as any)
    .select("id, agent_id, lead_id, text, sender, status, timestamp")
    .eq("sender", "user")
    // Stage-gated: route-resolve runs after intent is written.
    .in("status", ["intent_done"])
    .order("timestamp", { ascending: true })
    .limit(25);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load pending messages", details: error.message },
      { status: 500 }
    );
  }

  const results: any[] = [];

  for (const m of msgs || []) {
    const messageId = String(m.id);
    const agentId = String(m.agent_id);
    const leadId = String(m.lead_id);

    // Skip if already routed (v1)
    if (await hasRouteArtifact(supabase, messageId)) {
      continue;
    }

    // 2) Load intent artifact (v1)
    const { data: intentRow } = await (supabase.from("message_intents") as any)
      .select("intent, confidence, entities")
      .eq("message_id", messageId)
      .eq("prompt_version", "v1")
      .maybeSingle();

    if (!intentRow) continue;

    const intent: IntentArtifact = {
      intent: normalizeIntent(String(intentRow.intent || "OTHER")),
      confidence: Number(intentRow.confidence || 0),
      entities:
        intentRow.entities && typeof intentRow.entities === "object"
          ? intentRow.entities
          : {},
    };

    // 3) Load last 10 messages as context (thread-aware decisions)
    const { data: ctx } = await (supabase.from("messages") as any)
      .select("sender, text, timestamp")
      .eq("lead_id", leadId)
      .order("timestamp", { ascending: false })
      .limit(10);

    // 4) Load lead property state
    const stateRow = await getLeadPropertyState(supabase, leadId);

    // Fail-closed ignore
    if (intent.intent === "SPAM_OR_IRRELEVANT") {
      await (supabase.from("messages") as any)
        .update({ status: "ignored" })
        .eq("id", messageId);

      results.push({ messageId, route: "ignored", reason: "spam" });
      continue;
    }

    // ---- ROUTING LOGIC ----
    let route = "OTHER";
    let activePropertyId: string | null = null;
    let suggestedPropertyIds: string[] = [];
    let reason = "default";
    let confidence = intent.confidence || 0;

    // PROPERTY_SPECIFIC: prefer explicit anchor (uri/address), else continue active_property_id
    if (intent.intent === "PROPERTY_SPECIFIC") {
      route = "PROPERTY_SPECIFIC";

      activePropertyId =
        (await resolvePropertyByUriOrAddress(
          supabase,
          agentId,
          intent.entities
        )) ||
        (stateRow?.active_property_id
          ? String(stateRow.active_property_id)
          : null);

      if (activePropertyId) {
        reason = "resolved_specific";
      } else {
        // If we have no anchor, degrade to search (fail-closed)
        route = "PROPERTY_SEARCH";
        reason = "no_anchor_degrade_to_search";
      }
    }

    // PROPERTY_SEARCH: fetch multiple matches
    if (intent.intent === "PROPERTY_SEARCH" || route === "PROPERTY_SEARCH") {
      route = "PROPERTY_SEARCH";

      const city = isNonEmptyString(intent.entities?.city)
        ? intent.entities.city
        : null;
      const neighbourhood = isNonEmptyString(intent.entities?.neighbourhood)
        ? intent.entities.neighbourhood
        : null;

      const maxPrice = toNum(
        intent.entities?.budget_max ?? intent.entities?.max_price
      );
      const minRooms = toNum(
        intent.entities?.rooms_min ?? intent.entities?.min_rooms
      );
      const minSize = toNum(
        intent.entities?.size_min_sqm ?? intent.entities?.min_size_sqm
      );

      const furnished = normalizeBool(intent.entities?.furnished);
      const pets = normalizeBool(intent.entities?.pets);

      // Build query dynamically (assumes typical columns; adjust to your real schema)
      let q = (supabase.from("properties") as any)
        .select(
          "id, city, neighbourhood, price, rooms, size_sqm, available_from, furnished, pets_allowed, uri"
        )
        .eq("agent_id", agentId);

      if (city) q = q.ilike("city", `%${city}%`);
      if (neighbourhood) q = q.ilike("neighbourhood", `%${neighbourhood}%`);
      if (maxPrice !== null) q = q.lte("price", maxPrice);
      if (minRooms !== null) q = q.gte("rooms", minRooms);
      if (minSize !== null) q = q.gte("size_sqm", minSize);
      if (furnished !== null) q = q.eq("furnished", furnished);
      if (pets !== null) q = q.eq("pets_allowed", pets);

      // order heuristic: cheapest first (or newest)
      q = q.order("price", { ascending: true }).limit(5);

      const { data: props } = await q;

      suggestedPropertyIds = Array.isArray(props)
        ? props.map((p: any) => String(p.id)).filter(Boolean)
        : [];

      // Persist context
      if (suggestedPropertyIds.length > 0) {
        // If exactly one match, you MAY set it active (optional)
        const newActive =
          suggestedPropertyIds.length === 1 ? suggestedPropertyIds[0] : null;

        await upsertLeadPropertyState(supabase, {
          lead_id: leadId,
          agent_id: agentId,
          active_property_id: newActive ?? stateRow?.active_property_id ?? null,
          last_recommended_property_ids: suggestedPropertyIds,
          updated_at: new Date().toISOString(),
        });

        activePropertyId = newActive ?? stateRow?.active_property_id ?? null;
        reason = "matched_properties";
      } else {
        reason = "no_property_match";
      }
    }

    // QNA / process etc.
    if (
      [
        "QNA_GENERAL",
        "APPLICATION_PROCESS",
        "VIEWING_REQUEST",
        "STATUS_FOLLOWUP",
      ].includes(intent.intent)
    ) {
      // Keep these as distinct routes so downstream can choose the best draft prompt.
      if (intent.intent === "VIEWING_REQUEST") route = "VIEWING_REQUEST";
      else if (intent.intent === "STATUS_FOLLOWUP") route = "FOLLOWUP_STATUS";
      else route = "QNA";

      // Do not overwrite active property context here (keep it)
      activePropertyId = stateRow?.active_property_id
        ? String(stateRow.active_property_id)
        : null;
      reason = "non_property_flow";
    }

    // 5) Persist routing artifact (audit-first). Do NOT overload messages.status.
    await insertRouteArtifact(supabase, {
      agent_id: agentId,
      lead_id: leadId,
      message_id: messageId,
      route,
      confidence,
      reason,
      payload: {
        intent: String(intentRow.intent || "OTHER"),
        intent_normalized: intent.intent,
        intent_confidence: intent.confidence,
        entities: intent.entities,
        active_property_id: activePropertyId,
        suggested_property_ids: suggestedPropertyIds,
        context_count: Array.isArray(ctx) ? ctx.length : 0,
      },
      model: "deterministic+intent_v1",
      prompt_version: "v1",
    });

    // Advance pipeline stage so downstream draft step can pick it up.
    await (supabase.from("messages") as any)
      .update({ status: "route_resolved" })
      .eq("id", messageId);

    results.push({
      messageId,
      route,
      confidence,
      reason,
      activePropertyId,
      suggestedPropertyIds,
    });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
