import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../_guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1) Emails ingested last 24h (best-effort: count inbound user messages)
  const { count: inbound24h } = await (supa.from("messages") as any)
    .select("id", { count: "exact", head: true })
    .eq("sender", "user")
    .gte("timestamp", sinceIso);

  // 2) Messages processed last 24h (drafts created)
  const { count: drafts24h } = await (supa.from("messages") as any)
    .select("id", { count: "exact", head: true })
    .in("sender", ["agent", "assistant"])
    .gte("timestamp", sinceIso);

  // 3) Send status counts (global)
  const { data: sendRows } = await (supa.from("messages") as any)
    .select("send_status")
    .in("send_status", ["pending", "sending", "sent", "failed"]);

  const sendCounts = { pending: 0, sending: 0, sent: 0, failed: 0 } as Record<
    string,
    number
  >;
  for (const r of sendRows || []) {
    const k = String(r.send_status || "").toLowerCase();
    if (sendCounts[k] !== undefined) sendCounts[k] += 1;
  }

  // 4) Recent errors (failed sends + classifier/qa failures are usually in send_error / meta tables)
  const { data: lastFailed } = await (supa.from("messages") as any)
    .select(
      "id, agent_id, lead_id, send_error, updated_at, timestamp, email_provider",
    )
    .eq("send_status", "failed")
    .order("updated_at", { ascending: false })
    .limit(20);

  // 5) Queue depth (ready_to_send / needs_approval / needs_human)
  const { count: readyToSend } = await (supa.from("messages") as any)
    .select("id", { count: "exact", head: true })
    .eq("status", "ready_to_send")
    .eq("approval_required", false)
    .in("send_status", ["pending", "failed"]);

  const { count: needsApproval } = await (supa.from("messages") as any)
    .select("id", { count: "exact", head: true })
    .eq("approval_required", true)
    .eq("status", "needs_approval");

  const { count: needsHuman } = await (supa.from("messages") as any)
    .select("id", { count: "exact", head: true })
    .eq("status", "needs_human");

  return NextResponse.json({
    ok: true,
    since: sinceIso,
    inbound_24h: inbound24h ?? 0,
    drafts_24h: drafts24h ?? 0,
    queue: {
      ready_to_send: readyToSend ?? 0,
      needs_approval: needsApproval ?? 0,
      needs_human: needsHuman ?? 0,
    },
    send_status: sendCounts,
    last_failed: lastFailed || [],
  });
}
