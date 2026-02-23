import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

type Channel = "email" | "slack" | "dashboard";

type EnqueueBody = {
  agent_id: string;
  type: string; // e.g. "approval_required_created" | "lead_escalated"
  entity_type?: string | null; // e.g. "message"
  entity_id?: string | null; // uuid
  payload?: Record<string, any>;
  dispatch_now?: boolean; // default true
  channels?: Channel[]; // optional override
};

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

function siteUrl() {
  const a = process.env.NEXT_PUBLIC_SITE_URL;
  if (a) return a.replace(/\/$/, "");
  const b = process.env.SITE_URL;
  if (b) return b.replace(/\/$/, "");
  const c = process.env.VERCEL_URL;
  if (c) return `https://${c}`.replace(/\/$/, "");
  return "http://localhost:3000";
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

async function dispatchBestEffort(eventId?: string) {
  try {
    await fetch(`${siteUrl()}/api/notifications/dispatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-advaic-internal-secret": mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET"),
      },
      body: JSON.stringify(eventId ? { event_id: eventId } : {}),
    });
  } catch {
    // swallow
  }
}

async function resolveChannelsFromSettings(args: {
  supabase: any;
  agentId: string;
}): Promise<Channel[]> {
  const { supabase, agentId } = args;

  const { data: s } = await (
    supabase.from("agent_notification_settings") as any
  )
    .select("delivery, contact_email, slack_connected")
    .eq("agent_id", agentId)
    .maybeSingle();

  const delivery =
    s?.delivery && typeof s.delivery === "object" ? s.delivery : {};

  // Dashboard default true unless explicitly false
  const dashEnabled = delivery.dashboard === false ? false : true;

  const emailEnabled =
    !!delivery.email && !!String(s?.contact_email || "").trim();
  const slackEnabled = !!delivery.slack && !!s?.slack_connected;

  const channels: Channel[] = [];
  if (dashEnabled) channels.push("dashboard");
  if (emailEnabled) channels.push("email");
  if (slackEnabled) channels.push("slack");

  return channels;
}

/**
 * One event per (agent_id, type, entity_type, entity_id)
 * If entity_id missing, we allow a “singleton” style by using nulls (but then idempotency is weaker).
 */
async function getOrCreateEvent(args: {
  supabase: any;
  agentId: string;
  type: string;
  entityType: string | null;
  entityId: string | null;
  payload: Record<string, any>;
}) {
  const { supabase, agentId, type, entityType, entityId, payload } = args;

  // Find existing
  const q = (supabase.from("notification_events") as any)
    .select("id, payload")
    .eq("agent_id", agentId)
    .eq("type", type);

  if (entityType) q.eq("entity_type", entityType);
  else q.is("entity_type", null);

  if (entityId) q.eq("entity_id", entityId);
  else q.is("entity_id", null);

  const { data: existing } = await q.limit(1).maybeSingle();

  if (existing?.id) {
    // merge payload best-effort
    try {
      const prev =
        existing.payload && typeof existing.payload === "object"
          ? existing.payload
          : {};
      const next = { ...prev, ...payload };
      await (supabase.from("notification_events") as any)
        .update({ payload: next })
        .eq("id", existing.id);
    } catch {
      // swallow
    }
    return { id: String(existing.id), created: false };
  }

  const { data: created, error } = await (
    supabase.from("notification_events") as any
  )
    .insert({
      agent_id: agentId,
      type,
      entity_type: entityType,
      entity_id: entityId,
      payload,
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    return {
      id: null as any,
      created: false,
      error: error?.message ?? "insert_failed",
    };
  }

  return { id: String(created.id), created: true };
}

/**
 * One delivery per (event_id, channel)
 */
async function ensureDeliveries(args: {
  supabase: any;
  eventId: string;
  channels: Channel[];
}) {
  const { supabase, eventId, channels } = args;

  const { data: existing } = await (
    supabase.from("notification_deliveries") as any
  )
    .select("id, channel")
    .eq("event_id", eventId);

  const existingChannels = new Set(
    Array.isArray(existing) ? existing.map((x: any) => String(x.channel)) : [],
  );

  const toCreate = channels.filter((c) => !existingChannels.has(c));
  if (toCreate.length === 0) return { created: 0 };

  const rows = toCreate.map((c) => ({
    event_id: eventId,
    channel: c,
    status: "pending",
    attempts: 0,
  }));

  const { error } = await (
    supabase.from("notification_deliveries") as any
  ).insert(rows);
  if (error) return { created: 0, error: error.message };

  return { created: rows.length };
}

export async function POST(req: Request) {
  // internal secret gate
  const headerSecret = req.headers.get("x-advaic-internal-secret") || "";
  if (headerSecret !== process.env.ADVAIC_INTERNAL_PIPELINE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  let body: EnqueueBody | null = null;
  try {
    body = (await req.json()) as EnqueueBody;
  } catch {
    body = null;
  }

  if (!body?.agent_id || !body?.type) {
    return NextResponse.json(
      { error: "missing_required_fields", required: ["agent_id", "type"] },
      { status: 400 },
    );
  }

  const agentId = String(body.agent_id).trim();
  const type = String(body.type).trim();
  const entityType = body.entity_type ? String(body.entity_type) : null;
  const entityId = body.entity_id ? String(body.entity_id) : null;

  if (!isUuid(agentId)) {
    return NextResponse.json(
      { error: "invalid_agent_id", details: "agent_id must be a UUID" },
      { status: 400 },
    );
  }

  if (entityId && !isUuid(entityId)) {
    return NextResponse.json(
      { error: "invalid_entity_id", details: "entity_id must be a UUID" },
      { status: 400 },
    );
  }

  const payload =
    body.payload && typeof body.payload === "object" ? body.payload : {};
  const dispatchNow = body.dispatch_now !== false;

  // channels: override OR resolve from settings
  let channels: Channel[] = [];
  if (Array.isArray(body.channels) && body.channels.length > 0) {
    channels = body.channels.filter(
      (c): c is Channel => c === "email" || c === "slack" || c === "dashboard",
    );
  } else {
    channels = await resolveChannelsFromSettings({ supabase, agentId });
  }

  channels = uniq(channels);
  if (channels.length === 0) channels = ["dashboard"];

  // 1) event idempotent
  const ev = await getOrCreateEvent({
    supabase,
    agentId,
    type,
    entityType,
    entityId,
    payload,
  });

  if (!ev.id) {
    return NextResponse.json(
      {
        ok: false,
        error: "event_create_failed",
        details: (ev as any).error ?? "unknown",
      },
      { status: 500 },
    );
  }

  // 2) deliveries idempotent
  const del = await ensureDeliveries({
    supabase,
    eventId: ev.id,
    channels,
  });

  // 3) trigger dispatch best-effort (with event_id)
  if (dispatchNow) {
    await dispatchBestEffort(ev.id);
  }

  return NextResponse.json({
    ok: true,
    event_id: ev.id,
    event_created: ev.created,
    channels,
    deliveries_created: (del as any).created ?? 0,
    deliveries_error: (del as any).error ?? null,
    dispatch_triggered: dispatchNow,
  });
}
