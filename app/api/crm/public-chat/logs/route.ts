import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import { requireOwnerApiUser } from "@/lib/auth/ownerRoute";

export const runtime = "nodejs";

function clean(value: unknown, max = 320) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function readMetaText(meta: unknown, key: string, max = 320) {
  if (!meta || typeof meta !== "object") return null;
  return clean((meta as Record<string, any>)[key], max) || null;
}

export async function GET(req: NextRequest) {
  const auth = await requireOwnerApiUser(req);
  if (!auth.ok) return auth.response;

  const params = new URL(req.url).searchParams;
  const limit = Math.max(20, Math.min(400, Number(params.get("limit") || 160)));

  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase.from("marketing_events") as any)
    .select("id, event, path, session_id, visitor_id, meta, created_at")
    .in("event", ["marketing_chat_message_send", "marketing_chat_message_response"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "public_chat_logs_failed", details: error.message },
      { status: 500 },
    );
  }

  const rows = Array.isArray(data) ? (data as any[]) : [];
  const items = rows
    .filter((row) => clean((row?.meta as any)?.section || "", 80) === "public_assistant")
    .map((row) => ({
      id: clean(row?.id, 64),
      created_at: clean(row?.created_at, 64),
      event: clean(row?.event, 80),
      path: clean(row?.path, 160) || null,
      session_id: clean(row?.session_id, 120) || null,
      visitor_id: clean(row?.visitor_id, 120) || null,
      message_preview: readMetaText(row?.meta, "message_preview", 800),
      answer_preview: readMetaText(row?.meta, "answer_preview", 800),
      message_chars: Number.isFinite(Number((row?.meta as any)?.message_chars))
        ? Number((row?.meta as any)?.message_chars)
        : null,
      answer_chars: Number.isFinite(Number((row?.meta as any)?.answer_chars))
        ? Number((row?.meta as any)?.answer_chars)
        : null,
    }));

  return NextResponse.json({
    ok: true,
    total: items.length,
    logs: items,
    note: "Quelle: marketing_events mit section=public_assistant (nur mit Analytics-Einwilligung getrackt).",
  });
}

