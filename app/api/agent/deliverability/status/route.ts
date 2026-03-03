import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { resolveTxt } from "node:dns/promises";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
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

function parseDomainFromEmail(raw: string) {
  const email = String(raw || "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  return email.slice(at + 1).replace(/[^a-z0-9.-]/g, "");
}

function rootDomainFallback(domain: string) {
  const d = String(domain || "").trim().toLowerCase();
  const parts = d.split(".").filter(Boolean);
  if (parts.length < 2) return d;
  return parts.slice(-2).join(".");
}

function parseTxtRows(rows: string[][]) {
  return rows.map((parts) => parts.join("")).filter(Boolean);
}

async function txtCheck(host: string) {
  try {
    const rows = await resolveTxt(host);
    const records = parseTxtRows(rows);
    return { ok: true, records, error: null as string | null };
  } catch (e: any) {
    return {
      ok: false,
      records: [] as string[],
      error: String(e?.code || e?.message || "dns_error"),
    };
  }
}

function hasRecordWithPattern(records: string[], regex: RegExp) {
  return records.some((row) => regex.test(String(row || "").toLowerCase()));
}

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const authClient = supabaseFromReq(req, res);
  const {
    data: { user },
    error: authErr,
  } = await authClient.auth.getUser();
  if (authErr || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agentId = String(user.id);
  const senderFrom =
    String(process.env.ADVAIC_EMAIL_FROM || "").trim() ||
    String(process.env.RESEND_FROM || "").trim() ||
    String(process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL || "").trim();
  const senderDomain = parseDomainFromEmail(senderFrom);

  const admin = supabaseAdmin();
  const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [failed24Res, failed7Res, sent7Res] = await Promise.all([
    (admin.from("messages") as any)
      .select("id, send_error, updated_at")
      .eq("agent_id", agentId)
      .eq("send_status", "failed")
      .gte("updated_at", since24)
      .order("updated_at", { ascending: false })
      .limit(120),
    (admin.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("send_status", "failed")
      .gte("updated_at", since7d),
    (admin.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("send_status", "sent")
      .gte("updated_at", since7d),
  ]);

  if (failed24Res.error || failed7Res.error || sent7Res.error) {
    return NextResponse.json(
      {
        error: "deliverability_query_failed",
        details:
          failed24Res.error?.message ||
          failed7Res.error?.message ||
          sent7Res.error?.message ||
          "unknown",
      },
      { status: 500 },
    );
  }

  const failed24Rows = Array.isArray(failed24Res.data) ? failed24Res.data : [];
  const deliverabilityRegex =
    /(spam|blocked|blacklist|550|554|mailbox unavailable|recipient rejected|policy|dmarc|spf|dkim|bounce)/i;
  const deliverabilityLikeFailures = failed24Rows.filter((row: any) =>
    deliverabilityRegex.test(String(row?.send_error || "")),
  );

  let spfOk = false;
  let dmarcOk = false;
  let dkimOk = false;
  let dmarcPolicy: string | null = null;
  const dnsChecks: Array<{
    key: string;
    label: string;
    ok: boolean;
    details: string;
  }> = [];

  if (senderDomain) {
    const selectorsRaw = String(process.env.ADVAIC_DKIM_SELECTORS || "").trim();
    const selectors = (selectorsRaw ? selectorsRaw.split(",") : ["resend", "s1", "s2"])
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8);

    const rootDomain = rootDomainFallback(senderDomain);
    const [rootTxt, sendTxt, dmarcSubTxt, dmarcRootTxt, ...dkimRows] = await Promise.all([
      txtCheck(senderDomain),
      txtCheck(`send.${senderDomain}`),
      txtCheck(`_dmarc.${senderDomain}`),
      senderDomain === rootDomain
        ? Promise.resolve({ ok: false, records: [] as string[], error: null as string | null })
        : txtCheck(`_dmarc.${rootDomain}`),
      ...selectors.map((selector) => txtCheck(`${selector}._domainkey.${senderDomain}`)),
    ]);

    const rootRecords = rootTxt.records.map((r) => r.toLowerCase());
    const sendRecords = sendTxt.records.map((r) => r.toLowerCase());
    const dmarcSubRecords = dmarcSubTxt.records.map((r) => r.toLowerCase());
    const dmarcRootRecords = dmarcRootTxt.records.map((r) => r.toLowerCase());

    spfOk =
      hasRecordWithPattern(rootRecords, /\bv=spf1\b/) ||
      hasRecordWithPattern(sendRecords, /\bv=spf1\b/);

    const dmarcRecord =
      dmarcSubRecords.find((r) => r.includes("v=dmarc1")) ||
      dmarcRootRecords.find((r) => r.includes("v=dmarc1")) ||
      "";
    dmarcOk = !!dmarcRecord;
    if (dmarcRecord) {
      const m = dmarcRecord.match(/\bp=([a-z]+)/i);
      dmarcPolicy = m ? String(m[1] || "").toLowerCase() : null;
    }

    dkimOk = dkimRows.some((row) =>
      row.records.some((value) => {
        const lower = String(value || "").toLowerCase();
        return lower.includes("v=dkim1") || /(^|[;\s])p=([a-z0-9+/=]{20,})/i.test(lower);
      }),
    );

    dnsChecks.push(
      {
        key: "spf",
        label: "SPF",
        ok: spfOk,
        details: spfOk
          ? "SPF-Eintrag gefunden"
          : "Kein SPF-Eintrag für Absenderdomain oder send-Subdomain gefunden",
      },
      {
        key: "dmarc",
        label: "DMARC",
        ok: dmarcOk,
        details: dmarcOk
          ? `Policy: ${dmarcPolicy || "gesetzt"}`
          : "Kein DMARC-Eintrag gefunden",
      },
      {
        key: "dkim",
        label: "DKIM",
        ok: dkimOk,
        details: dkimOk
          ? "Mindestens ein DKIM-Selector ist aktiv"
          : "Kein gültiger DKIM-Selector gefunden",
      },
    );
  }

  let level: "ok" | "warning" | "critical" = "ok";
  if (!senderDomain || !spfOk || !dmarcOk) level = "critical";
  else if (!dkimOk || dmarcPolicy === "none") level = "warning";
  if (deliverabilityLikeFailures.length >= 3) level = "critical";
  else if (level === "ok" && deliverabilityLikeFailures.length >= 1) level = "warning";

  const sent7 = Number(sent7Res.count || 0);
  const failed7 = Number(failed7Res.count || 0);
  const failRate7d = sent7 + failed7 > 0 ? failed7 / (sent7 + failed7) : 0;

  const recommendations: string[] = [];
  if (!spfOk) recommendations.push("SPF setzen oder prüfen, damit Empfänger-Server die Domain korrekt validieren können.");
  if (!dmarcOk) recommendations.push("DMARC hinzufügen (mindestens p=quarantine), damit Missbrauch und Zustellprobleme sinken.");
  if (dmarcPolicy === "none")
    recommendations.push("DMARC-Policy verschärfen: p=none ist nur Monitoring, produktiv besser p=quarantine oder p=reject.");
  if (!dkimOk) recommendations.push("DKIM-Selector prüfen und aktivieren, damit Signaturen zuverlässig validiert werden.");
  if (deliverabilityLikeFailures.length > 0)
    recommendations.push("Fehlgeschlagene Sends prüfen und wiederholte Bounce-/Block-Fehler im Support-Workflow priorisieren.");
  if (recommendations.length === 0)
    recommendations.push("Deliverability ist stabil. SPF/DKIM/DMARC und Bounce-Rate monatlich weiter überwachen.");

  return NextResponse.json({
    ok: true,
    generated_at: new Date().toISOString(),
    sender_from: senderFrom || null,
    sender_domain: senderDomain || null,
    level,
    dmarc_policy: dmarcPolicy,
    checks: dnsChecks,
    summary: {
      failed_sends_24h: failed24Rows.length,
      deliverability_like_failures_24h: deliverabilityLikeFailures.length,
      failed_sends_7d: failed7,
      sent_7d: sent7,
      fail_rate_7d: failRate7d,
    },
    failed_samples: deliverabilityLikeFailures.slice(0, 5).map((row: any) => ({
      updated_at: row?.updated_at || null,
      send_error: String(row?.send_error || "").slice(0, 280),
    })),
    recommendations,
  });
}
