import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, supabaseAdmin } from "../../_guard";

export const runtime = "nodejs";

function num(raw: string | null | undefined, fallback: number) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function bool(raw: string | null | undefined, fallback = false) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return fallback;
  return ["1", "true", "yes", "on"].includes(s);
}

function norm(text: unknown) {
  return String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((x) => x.trim())
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function sentLike(msg: any) {
  const sendStatus = String(msg?.send_status || "").toLowerCase().trim();
  const status = String(msg?.status || "").toLowerCase().trim();
  return (
    sendStatus === "sent" ||
    ["sent", "approved", "auto_sent", "freigegeben_gesendet"].includes(status)
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type QaRow = {
  id: string;
  prompt_key: string | null;
  verdict: string | null;
  draft_message_id: string | null;
  inbound_message_id: string | null;
  created_at: string | null;
};

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const url = new URL(req.url);
  const promptKeys = (
    url.searchParams.get("prompt_keys") ||
    process.env.FT_DATA_PROMPT_KEYS ||
    "qa_reply_v1,qa_recheck_v1,followup_qa_v1,followup_qa_v2"
  )
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const lookbackDays = clamp(
    Math.floor(
      num(url.searchParams.get("days"), num(process.env.FT_DATA_LOOKBACK_DAYS, 180)),
    ),
    7,
    365,
  );
  const minExamples = clamp(
    Math.floor(
      num(
        url.searchParams.get("min_examples"),
        num(process.env.FT_READINESS_MIN_EXAMPLES, 120),
      ),
    ),
    10,
    5000,
  );
  const minPassRate = clamp(
    num(url.searchParams.get("min_pass_rate"), num(process.env.FT_READINESS_MIN_PASS_RATE, 0.55)),
    0.3,
    0.95,
  );
  const minRecentPass = clamp(
    Math.floor(
      num(
        url.searchParams.get("min_recent_pass"),
        num(process.env.FT_READINESS_MIN_RECENT_PASS, 25),
      ),
    ),
    0,
    1000,
  );
  const requireSent = bool(
    url.searchParams.get("require_sent"),
    bool(process.env.FT_DATA_REQUIRE_SENT, false),
  );
  const minInboundChars = clamp(
    Math.floor(num(url.searchParams.get("min_inbound_chars"), 20)),
    5,
    600,
  );
  const minDraftChars = clamp(
    Math.floor(num(url.searchParams.get("min_draft_chars"), 40)),
    10,
    2000,
  );

  const supa = supabaseAdmin();
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();
  const recentIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let qaQuery = (supa.from("message_qas") as any)
    .select("id, prompt_key, verdict, draft_message_id, inbound_message_id, created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(20000);

  if (promptKeys.length > 0) {
    qaQuery = qaQuery.in("prompt_key", promptKeys);
  }

  let { data: qaRowsData, error: qaErr } = await qaQuery;
  if (qaErr) {
    return NextResponse.json({ error: qaErr.message }, { status: 500 });
  }

  let usedFallbackAllPrompts = false;
  let qaRows = (Array.isArray(qaRowsData) ? qaRowsData : []) as QaRow[];
  if (qaRows.length === 0 && promptKeys.length > 0) {
    usedFallbackAllPrompts = true;
    const res = await (supa.from("message_qas") as any)
      .select("id, prompt_key, verdict, draft_message_id, inbound_message_id, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(20000);
    if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }
    qaRows = (Array.isArray(res.data) ? res.data : []) as QaRow[];
  }

  const totalQa = qaRows.length;
  const verdictCounts = { pass: 0, warn: 0, fail: 0, other: 0 };
  const promptBreakdown = new Map<string, { total: number; pass: number; warn: number; fail: number }>();
  const passRows: QaRow[] = [];
  let recentPassTotal = 0;

  for (const row of qaRows) {
    const promptKey = String(row?.prompt_key || "unknown");
    if (!promptBreakdown.has(promptKey)) {
      promptBreakdown.set(promptKey, { total: 0, pass: 0, warn: 0, fail: 0 });
    }
    const bucket = promptBreakdown.get(promptKey)!;
    bucket.total += 1;

    const verdict = String(row?.verdict || "").toLowerCase().trim();
    if (verdict === "pass") {
      verdictCounts.pass += 1;
      bucket.pass += 1;
      passRows.push(row);
      const createdMs = new Date(String(row?.created_at || "")).getTime();
      if (Number.isFinite(createdMs) && createdMs >= new Date(recentIso).getTime()) {
        recentPassTotal += 1;
      }
    } else if (verdict === "warn") {
      verdictCounts.warn += 1;
      bucket.warn += 1;
    } else if (verdict === "fail") {
      verdictCounts.fail += 1;
      bucket.fail += 1;
    } else {
      verdictCounts.other += 1;
    }
  }

  const messageIds = Array.from(
    new Set(
      passRows
        .flatMap((r) => [r?.inbound_message_id, r?.draft_message_id])
        .filter((x) => typeof x === "string" && x.length > 0),
    ),
  );

  const messageById = new Map<string, any>();
  for (const ids of chunk(messageIds, 400)) {
    const { data, error } = await (supa.from("messages") as any)
      .select("id, sender, text, send_status, status")
      .in("id", ids);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    for (const row of data || []) {
      const id = String(row?.id || "").trim();
      if (!id) continue;
      messageById.set(id, row);
    }
  }

  let missingPairs = 0;
  let rejectedPairs = 0;
  let qualifiedExamples = 0;

  for (const row of passRows) {
    const inbound = messageById.get(String(row?.inbound_message_id || ""));
    const draft = messageById.get(String(row?.draft_message_id || ""));
    if (!inbound || !draft) {
      missingPairs += 1;
      continue;
    }

    const inboundText = norm(inbound?.text);
    const draftText = norm(draft?.text);
    if (
      String(inbound?.sender || "").toLowerCase() !== "user" ||
      !["assistant", "agent"].includes(String(draft?.sender || "").toLowerCase()) ||
      inboundText.length < minInboundChars ||
      draftText.length < minDraftChars ||
      (requireSent && !sentLike(draft))
    ) {
      rejectedPairs += 1;
      continue;
    }

    qualifiedExamples += 1;
  }

  const passRate = totalQa > 0 ? verdictCounts.pass / totalQa : 0;
  const ready =
    qualifiedExamples >= minExamples &&
    passRate >= minPassRate &&
    recentPassTotal >= minRecentPass;

  const blockers: string[] = [];
  if (qualifiedExamples < minExamples) {
    blockers.push(
      `Zu wenig qualifizierte Beispiele (${qualifiedExamples}/${minExamples}).`,
    );
  }
  if (passRate < minPassRate) {
    blockers.push(
      `QA-Pass-Rate zu niedrig (${(passRate * 100).toFixed(1)}% < ${(minPassRate * 100).toFixed(1)}%).`,
    );
  }
  if (recentPassTotal < minRecentPass) {
    blockers.push(
      `Zu wenig aktuelle Pass-Fälle in 30 Tagen (${recentPassTotal}/${minRecentPass}).`,
    );
  }
  if (totalQa === 0) {
    blockers.push("Keine QA-Daten im gewählten Lookback-Zeitraum.");
  }

  const status: "ready" | "warming_up" | "not_ready" = ready
    ? "ready"
    : qualifiedExamples >= Math.max(10, Math.floor(minExamples * 0.5))
      ? "warming_up"
      : "not_ready";

  return NextResponse.json({
    ok: true,
    status,
    ready,
    since: sinceIso,
    recent_since: recentIso,
    prompt_keys_requested: promptKeys,
    prompt_filter_fallback_all_prompts: usedFallbackAllPrompts,
    thresholds: {
      min_examples: minExamples,
      min_pass_rate: minPassRate,
      min_recent_pass_30d: minRecentPass,
      require_sent: requireSent,
      min_inbound_chars: minInboundChars,
      min_draft_chars: minDraftChars,
      lookback_days: lookbackDays,
    },
    qa: {
      total: totalQa,
      pass: verdictCounts.pass,
      warn: verdictCounts.warn,
      fail: verdictCounts.fail,
      other: verdictCounts.other,
      pass_rate: passRate,
    },
    dataset: {
      pass_rows: passRows.length,
      qualified_examples: qualifiedExamples,
      missing_pairs: missingPairs,
      rejected_pairs: rejectedPairs,
      recent_pass_30d: recentPassTotal,
    },
    blockers,
    recommendation: ready
      ? "Ready: Fine-Tune-Workflow kann gestartet werden."
      : "Noch nicht ready: weiter Daten sammeln und QA-Qualität stabilisieren.",
    prompt_breakdown: Array.from(promptBreakdown.entries())
      .map(([prompt_key, x]) => ({ prompt_key, ...x }))
      .sort((a, b) => b.pass - a.pass)
      .slice(0, 20),
  });
}
