import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Auth: allow ONLY one user id (you).
 * Uses Supabase auth cookies (server-verified user).
 */
async function requireAdminUserId() {
  const adminId = mustEnv("ADMIN_DASHBOARD_USER_ID");

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    return { ok: false as const, error: "unauthorized" };
  }
  if (user.id !== adminId) {
    return { ok: false as const, error: "forbidden" };
  }

  return { ok: true as const, userId: user.id };
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function asProvider(row: any): "gmail" | "outlook" | "unknown" {
  const p = String(row?.email_provider || "").toLowerCase();
  if (p === "gmail" || p === "outlook") return p;
  // fallback heuristics
  if (row?.outlook_conversation_id) return "outlook";
  if (row?.gmail_thread_id) return "gmail";
  return "unknown";
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdminUserId();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const url = new URL(req.url);
    const tab = String(url.searchParams.get("tab") || "failed").toLowerCase();

    const supabase = supabaseAdmin();

    // Load potentially problematic outbox entries.
    // We include:
    // - send_status in (pending, sending, failed)
    // - AND drafts that are ready_to_send (extra safety)
    const { data: msgs, error: msgErr } = await (
      supabase.from("messages") as any
    )
      .select(
        "id, agent_id, lead_id, text, timestamp, status, approval_required, send_status, send_locked_at, send_error, sent_at",
      )
      .in("send_status", ["pending", "sending", "failed"])
      .order("timestamp", { ascending: false })
      .limit(250);

    if (msgErr) {
      return NextResponse.json(
        { error: "messages_query_failed", details: msgErr.message },
        { status: 500 },
      );
    }

    const messages = (msgs || []) as any[];

    // preload leads + agents
    const leadIds = Array.from(
      new Set(messages.map((m) => String(m.lead_id)).filter(Boolean)),
    );
    const agentIds = Array.from(
      new Set(messages.map((m) => String(m.agent_id)).filter(Boolean)),
    );

    let leadsMap = new Map<string, any>();
    if (leadIds.length > 0) {
      const { data: leads } = await (supabase.from("leads") as any)
        .select(
          "id, name, email, email_provider, gmail_thread_id, outlook_conversation_id",
        )
        .in("id", leadIds);
      for (const l of leads || []) leadsMap.set(String(l.id), l);
    }

    let agentsMap = new Map<string, any>();
    if (agentIds.length > 0) {
      // If your agent table is called `agents` (you have it), we read there.
      // If you also have profiles/users, you can extend later.
      const { data: agents } = await (supabase.from("agents") as any)
        .select("id, email, name")
        .in("id", agentIds);
      for (const a of agents || []) agentsMap.set(String(a.id), a);
    }

    const now = Date.now();
    const rows = messages.map((m) => {
      const lead = leadsMap.get(String(m.lead_id));
      const agent = agentsMap.get(String(m.agent_id));

      const provider = asProvider(lead);

      const preview =
        String(m.text || "")
          .trim()
          .slice(0, 180) || null;

      return {
        message_id: String(m.id),
        agent_id: String(m.agent_id),
        lead_id: String(m.lead_id),

        agent_email: agent?.email ?? null,
        agent_name: agent?.name ?? null,

        lead_name: lead?.name ?? null,
        lead_email: lead?.email ?? null,

        provider,
        status: m.status ?? null,
        approval_required: m.approval_required ?? null,

        send_status: m.send_status ?? null,
        send_locked_at: m.send_locked_at ?? null,
        send_error: m.send_error ?? null,
        sent_at: m.sent_at ?? null,

        timestamp: m.timestamp ?? null,
        text_preview: preview,
      };
    });

    // Tab filters
    const filtered = rows.filter((r) => {
      const sendStatus = String(r.send_status || "").toLowerCase();

      if (tab === "all") return true;

      if (tab === "failed") return sendStatus === "failed";

      if (tab === "pending") return sendStatus === "pending";

      if (tab === "stuck") {
        if (sendStatus !== "sending") return false;
        if (!r.send_locked_at) return true;
        const lockedAt = new Date(r.send_locked_at).getTime();
        if (Number.isNaN(lockedAt)) return true;
        const mins = Math.floor((now - lockedAt) / 60000);
        return mins >= 10;
      }

      return sendStatus === "failed";
    });

    return NextResponse.json({ ok: true, rows: filtered });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "unknown_error" },
      { status: 500 },
    );
  }
}
