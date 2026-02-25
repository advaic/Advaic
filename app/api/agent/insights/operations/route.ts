import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function jsonError(status: number, error: string, extra?: Record<string, any>) {
  return NextResponse.json({ error, ...(extra || {}) }, { status });
}

function supabaseFromReq(req: NextRequest, res: NextResponse) {
  return createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    },
  );
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function toNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pct(num: number, den: number) {
  if (!den || den <= 0) return 0;
  return num / den;
}

function normalizeErrorKey(v: unknown): string {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return "unbekannt";
  if (s.includes("timeout")) return "timeout";
  if (s.includes("rate") && s.includes("limit")) return "rate_limit";
  if (s.includes("invalid_grant") || s.includes("auth")) return "auth";
  if (s.includes("recipient") || s.includes("address")) return "empfaenger";
  if (s.includes("network")) return "netzwerk";
  if (s.includes("quota")) return "quota";
  return s.slice(0, 60);
}

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const authClient = supabaseFromReq(req, res);

  const {
    data: { user },
    error: authErr,
  } = await authClient.auth.getUser();
  if (authErr || !user?.id) return jsonError(401, "Unauthorized");

  const agentId = String(user.id);
  const admin = supabaseAdmin();

  const nowMs = Date.now();
  const since30 = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7 = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since24 = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();

  const [reviewsRes, msg7Res, queueRes] = await Promise.all([
    (admin.from("message_qas") as any)
      .select("reason, meta, created_at")
      .eq("agent_id", agentId)
      .eq("prompt_key", "approval_review_v1")
      .gte("created_at", since30)
      .order("created_at", { ascending: false })
      .limit(4000),
    (admin.from("messages") as any)
      .select("send_status, send_error, sent_at, timestamp")
      .eq("agent_id", agentId)
      .in("sender", ["assistant", "agent"])
      .gte("timestamp", since7)
      .order("timestamp", { ascending: false })
      .limit(6000),
    (admin.from("messages") as any)
      .select("id, send_status")
      .eq("agent_id", agentId)
      .in("send_status", ["pending", "sending"])
      .limit(4000),
  ]);

  if (reviewsRes.error) {
    return jsonError(500, "approval_insights_fetch_failed", {
      details: reviewsRes.error.message,
    });
  }
  if (msg7Res.error) {
    return jsonError(500, "message_insights_fetch_failed", {
      details: msg7Res.error.message,
    });
  }
  if (queueRes.error) {
    return jsonError(500, "queue_insights_fetch_failed", {
      details: queueRes.error.message,
    });
  }

  const reviewRows = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
  const totalReviews = reviewRows.length;
  let editedReviews = 0;
  let unchangedReviews = 0;
  let shortened = 0;
  let lengthened = 0;
  let largeEdits = 0;
  let diffSum = 0;
  let diffCount = 0;

  for (const row of reviewRows) {
    const reason = String(row?.reason || "").toLowerCase();
    const meta = (row?.meta || {}) as any;
    const metaEdited = Boolean(meta?.edited);
    const edited = metaEdited || reason === "edited_before_send";

    if (edited) editedReviews += 1;
    else unchangedReviews += 1;

    const originalLength = toNum(meta?.original_length);
    const finalLength = toNum(meta?.final_length);
    const diffChars = toNum(meta?.diff_chars);

    if (edited && originalLength !== null && finalLength !== null) {
      if (finalLength < originalLength) shortened += 1;
      if (finalLength > originalLength) lengthened += 1;
    }
    if (edited && diffChars !== null) {
      diffSum += diffChars;
      diffCount += 1;
      if (diffChars >= 80) largeEdits += 1;
    }
  }

  const editedRate = pct(editedReviews, totalReviews);
  const avgDiffChars = diffCount > 0 ? diffSum / diffCount : 0;
  const shortRate = pct(shortened, Math.max(1, editedReviews));
  const longRate = pct(lengthened, Math.max(1, editedReviews));
  const largeEditRate = pct(largeEdits, Math.max(1, editedReviews));

  const styleSignals: string[] = [];
  const recommendedActions: string[] = [];

  if (totalReviews === 0) {
    styleSignals.push("Noch keine Daten aus Freigaben vorhanden.");
    recommendedActions.push("Erst 3 bis 5 klare Fälle freigeben, dann Lernkurve auswerten.");
  } else {
    if (editedRate <= 0.2) {
      styleSignals.push("Viele Entwürfe gehen bereits ohne Änderungen durch.");
    } else if (editedRate >= 0.45) {
      styleSignals.push("Viele Entwürfe werden vor Versand angepasst.");
      recommendedActions.push("Auto-Senden vorerst konservativ halten und erst nach Stabilisierung erhöhen.");
    }

    if (shortRate >= 0.55) {
      styleSignals.push("Sie kürzen Antworten häufig.");
      recommendedActions.push("In Ton & Stil: „kurz und präzise“ stärker als Regel hinterlegen.");
    }
    if (longRate >= 0.55) {
      styleSignals.push("Sie ergänzen häufig zusätzliche Informationen.");
      recommendedActions.push("Objektdaten und Standardabläufe erweitern, damit Entwürfe vollständiger sind.");
    }
    if (largeEditRate >= 0.45) {
      styleSignals.push("Viele Änderungen sind inhaltlich größer.");
      recommendedActions.push("Beispielantworten im Stil-Profil präzisieren (Do/Don't + Beispielantwort).");
    }
  }

  if (styleSignals.length === 0) {
    styleSignals.push("Entwürfe bewegen sich im erwarteten Rahmen.");
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push("Nächster Schritt: Änderungen weiter beobachten und nur bei stabilem Verlauf automatisieren.");
  }

  const msgRows = Array.isArray(msg7Res.data) ? msg7Res.data : [];
  let sent7d = 0;
  let failed7d = 0;
  let failed24h = 0;
  const errorCounts = new Map<string, number>();

  for (const row of msgRows) {
    const sendStatus = String(row?.send_status || "").toLowerCase();
    const ts = new Date(String(row?.timestamp || row?.sent_at || "")).getTime();
    const inLast24h = Number.isFinite(ts) && ts >= new Date(since24).getTime();

    if (sendStatus === "sent") sent7d += 1;
    if (sendStatus === "failed") {
      failed7d += 1;
      if (inLast24h) failed24h += 1;
      const key = normalizeErrorKey(row?.send_error);
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    }
  }

  const queueOpen = Array.isArray(queueRes.data) ? queueRes.data.length : 0;
  const failRate7d = pct(failed7d, sent7d + failed7d);

  const healthLevel: "good" | "watch" | "critical" =
    failed24h >= 3 || failRate7d >= 0.12 || queueOpen >= 15
      ? "critical"
      : failed24h >= 1 || failRate7d >= 0.05 || queueOpen >= 5
        ? "watch"
        : "good";

  const topErrors = Array.from(errorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => ({ key, count }));

  return NextResponse.json({
    ok: true,
    generated_at: new Date().toISOString(),
    approval_learning: {
      window_days: 30,
      total_reviews: totalReviews,
      edited_reviews: editedReviews,
      unchanged_reviews: unchangedReviews,
      edited_rate: editedRate,
      avg_diff_chars: Math.round(avgDiffChars * 10) / 10,
      style_signals: styleSignals,
      recommended_actions: recommendedActions,
    },
    sending_health: {
      window_days: 7,
      sent_7d: sent7d,
      failed_7d: failed7d,
      failed_24h: failed24h,
      fail_rate_7d: failRate7d,
      queue_open: queueOpen,
      level: healthLevel,
      top_errors: topErrors,
    },
  });
}
