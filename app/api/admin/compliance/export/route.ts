import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../../_guard";

export const runtime = "nodejs";

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toIso(v: unknown) {
  if (!v) return "";
  const d = new Date(String(v));
  if (!Number.isFinite(d.getTime())) return "";
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supa = supabaseAdmin();
  const url = new URL(req.url);
  const kind = String(url.searchParams.get("kind") || "tickets").toLowerCase();

  if (kind === "audit") {
    const [{ data: qaRows }, { data: sendRows }] = await Promise.all([
      (supa.from("message_qas") as any)
        .select("created_at, agent_id, lead_id, draft_message_id, prompt_key, verdict, reason")
        .order("created_at", { ascending: false })
        .limit(4000),
      (supa.from("messages") as any)
        .select("timestamp, id, agent_id, lead_id, send_status, status, approval_required, send_error")
        .in("send_status", ["sent", "failed", "sending", "pending"])
        .order("timestamp", { ascending: false })
        .limit(4000),
    ]);

    const lines = [
      "ts,category,agent_id,lead_id,message_id,summary,details",
      ...(qaRows || []).map((r: any) =>
        [
          csvEscape(toIso(r?.created_at)),
          "qa_review",
          csvEscape(r?.agent_id),
          csvEscape(r?.lead_id),
          csvEscape(r?.draft_message_id),
          csvEscape(`${r?.prompt_key || "qa"} verdict=${r?.verdict || "unknown"}`),
          csvEscape(r?.reason),
        ].join(","),
      ),
      ...(sendRows || []).map((r: any) =>
        [
          csvEscape(toIso(r?.timestamp)),
          "send_pipeline",
          csvEscape(r?.agent_id),
          csvEscape(r?.lead_id),
          csvEscape(r?.id),
          csvEscape(`send=${r?.send_status || "unknown"} status=${r?.status || "unknown"} approval=${Boolean(r?.approval_required)}`),
          csvEscape(r?.send_error),
        ].join(","),
      ),
    ];

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="advaic-compliance-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const { data: ticketRows } = await (supa.from("notification_events") as any)
    .select("entity_id, payload, created_at")
    .eq("entity_type", "support_ticket")
    .eq("type", "support_ticket_state")
    .order("created_at", { ascending: false })
    .limit(6000);

  const newest = new Map<string, any>();
  for (const row of ticketRows || []) {
    const id = String(row?.entity_id || "").trim();
    if (!id || newest.has(id)) continue;
    newest.set(id, row);
  }

  const lines = [
    "ticket_id,status,owner_email,updated_at,agent_id,lead_id,message_id,latest_note,send_status,send_error",
    ...Array.from(newest.entries()).map(([ticketId, row]) => {
      const p = (row?.payload || {}) as any;
      return [
        csvEscape(ticketId),
        csvEscape(p?.ticket_status || "open"),
        csvEscape(p?.ticket_owner_admin_email || ""),
        csvEscape(toIso(p?.ticket_updated_at || row?.created_at)),
        csvEscape(p?.source_agent_id || ""),
        csvEscape(p?.source_lead_id || ""),
        csvEscape(p?.source_message_id || ""),
        csvEscape(p?.ticket_latest_note || ""),
        csvEscape(p?.source_send_status || ""),
        csvEscape(p?.source_send_error || ""),
      ].join(",");
    }),
  ];

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="advaic-support-tickets-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
