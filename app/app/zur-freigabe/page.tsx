import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import ZurFreigabeUI, { type ApprovalMessage } from "./ZurFreigabeUI";
import Link from "next/link";

export default async function ZurFreigabePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="mb-4 text-lg">Nicht eingeloggt.</p>
        <Link
          href="/login"
          className="px-4 py-2 text-white bg-black rounded hover:bg-gray-800"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  const userId = user.id;

  // Wichtig: agent_id filtern, sonst RLS/Leaking/Fehler
  const { data: rows, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      lead_id,
      agent_id,
      sender,
      text,
      timestamp,
      gpt_score,
      was_followup,
      visible_to_agent,
      approval_required,

      send_status,
      send_locked_at,
      send_error,
      sent_at,

      gmail_message_id,
      gmail_thread_id,
      snippet,
      email_type,
      classification_confidence,
      classification_reason,
      attachments,
      
      leads (
        name
      )
    `
    )
    .eq("agent_id", userId)
    .eq("visible_to_agent", true)
    .eq("approval_required", true)
    .in("sender", ["assistant", "system"])
    .in("send_status", ["pending", "failed"])
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Nachrichten zur Freigabe:", error);
    return (
      <div className="p-6">
        <div className="max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="font-semibold">
            Fehler beim Laden der Nachrichten.
          </div>
          <div className="mt-2 text-sm whitespace-pre-wrap">
            {error.message}
          </div>
        </div>
      </div>
    );
  }

  const messageIds = (rows ?? [])
    .map((x: any) => String(x?.id || ""))
    .filter(Boolean);
  let qaByMessageId = new Map<
    string,
    {
      verdict: string | null;
      reason: string | null;
      reason_long: string | null;
      action: string | null;
      risk_flags: string[] | null;
      score: number | null;
      confidence: number | null;
      meta: Record<string, any> | null;
    }
  >();

  if (messageIds.length > 0) {
    let qaRows: any[] = [];
    const ext = await (supabase.from("message_qas") as any)
      .select(
        "draft_message_id, verdict, score, reason, reason_long, action, risk_flags, meta, created_at",
      )
      .in("draft_message_id", messageIds)
      .order("created_at", { ascending: false })
      .limit(Math.max(1200, messageIds.length * 4));

    if (ext?.error) {
      const minimal = await (supabase.from("message_qas") as any)
        .select("draft_message_id, verdict, reason, created_at")
        .in("draft_message_id", messageIds)
        .order("created_at", { ascending: false })
        .limit(Math.max(1200, messageIds.length * 4));
      qaRows = Array.isArray(minimal?.data) ? minimal.data : [];
    } else {
      qaRows = Array.isArray(ext?.data) ? ext.data : [];
    }

    if (qaRows.length > 0) {
      for (const row of qaRows) {
        const id = String(row?.draft_message_id || "").trim();
        if (!id || qaByMessageId.has(id)) continue;
        const verdict = row?.verdict ? String(row.verdict) : null;
        const reason = row?.reason ? String(row.reason) : null;
        const reasonLong = row?.reason_long ? String(row.reason_long) : null;
        const action = row?.action ? String(row.action) : null;
        const riskFlags = Array.isArray(row?.risk_flags)
          ? row.risk_flags.map((x: any) => String(x))
          : null;
        const confidenceRaw = Number((row?.meta || {})?.confidence);
        const confidence =
          Number.isFinite(confidenceRaw) && confidenceRaw >= 0 && confidenceRaw <= 1
            ? confidenceRaw
            : null;
        const explicitScore =
          typeof row?.score === "number" && Number.isFinite(row.score)
            ? Math.max(0, Math.min(1, Number(row.score)))
            : null;
        const lower = String(verdict || "").toLowerCase();
        const score =
          explicitScore !== null
            ? explicitScore
            : lower === "pass"
              ? 1
              : lower === "warn"
                ? 0.6
                : lower === "fail"
                  ? 0.25
                  : null;
        qaByMessageId.set(id, {
          verdict,
          reason,
          reason_long: reasonLong,
          action,
          risk_flags: riskFlags,
          score,
          confidence,
          meta:
            row?.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
              ? (row.meta as Record<string, any>)
              : null,
        });
      }
    }
  }

  const messages: ApprovalMessage[] = (rows ?? []).map((msg: any) => {
    const qa = qaByMessageId.get(String(msg.id));
    return {
      id: String(msg.id),
      lead_id: String(msg.lead_id),
      agent_id: String(msg.agent_id),

      sender: msg.sender,
      text: msg.text ?? "",
      timestamp: msg.timestamp ?? new Date().toISOString(),

      visible_to_agent: !!msg.visible_to_agent,
      approval_required: !!msg.approval_required,

      send_status: msg.send_status ?? null,
      send_locked_at: msg.send_locked_at ?? null,
      send_error: msg.send_error ?? null,
      sent_at: msg.sent_at ?? null,

      was_followup: msg.was_followup ?? null,
      gpt_score: msg.gpt_score ?? null,

      gmail_message_id: msg.gmail_message_id ?? null,
      gmail_thread_id: msg.gmail_thread_id ?? null,
      snippet: msg.snippet ?? null,
      email_type: msg.email_type ?? null,
      classification_confidence: msg.classification_confidence ?? null,
      classification_reason: msg.classification_reason ?? null,
      classification_reason_long: msg.classification_reason ?? null,
      qa_verdict: qa?.verdict ?? null,
      qa_reason: qa?.reason ?? null,
      qa_reason_long: qa?.reason_long ?? qa?.reason ?? null,
      qa_action: qa?.action ?? null,
      qa_risk_flags: qa?.risk_flags ?? null,
      qa_confidence: qa?.confidence ?? null,
      qa_score: qa?.score ?? null,
      qa_meta: qa?.meta ?? null,

      attachments: msg.attachments ?? null,

      lead_name: (msg.leads as any)?.name ?? "Unbekannter Interessent",
    };
  });

  return <ZurFreigabeUI messages={messages} />;
}
