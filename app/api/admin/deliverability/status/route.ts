import { NextRequest } from "next/server";
import { resolveTxt } from "node:dns/promises";
import { requireAdmin, supabaseAdmin } from "../../_guard";
import { getRequestId, jsonWithRequestId } from "@/lib/ops/request-id";

export const runtime = "nodejs";

type DnsCheck = {
  host: string;
  ok: boolean;
  details: string;
  error: string | null;
};

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
    return { ok: false, records: [] as string[], error: String(e?.code || e?.message || "dns_error") };
  }
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);
  const gate = await requireAdmin(req);
  if (!gate.ok) return jsonWithRequestId(requestId, { error: gate.error }, { status: gate.status });

  const senderFrom =
    String(process.env.ADVAIC_EMAIL_FROM || "").trim() ||
    String(process.env.RESEND_FROM || "").trim() ||
    String(process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL || "").trim();

  const senderDomain = parseDomainFromEmail(senderFrom);
  if (!senderDomain) {
    return jsonWithRequestId(
      requestId,
      {
        ok: true,
        level: "critical",
        sender_from: senderFrom || null,
        sender_domain: null,
        checks: [],
        summary: {
          failed_sends_24h: 0,
          deliverability_like_failures_24h: 0,
          failed_samples: [],
        },
        recommendations: [
          "Setze ADVAIC_EMAIL_FROM auf eine gültige Absenderadresse (z. B. hello@deinedomain.de).",
          "Prüfe SPF, DKIM und DMARC erst nach gesetztem Absenderdomain.",
        ],
      },
      { status: 200 },
    );
  }

  const selectorsRaw = String(process.env.ADVAIC_DKIM_SELECTORS || "").trim();
  const selectors = (
    selectorsRaw
      ? selectorsRaw.split(",")
      : ["resend", "s1", "s2"]
  )
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

  const baseRoot = rootDomainFallback(senderDomain);
  const dmarcRootHost = `_dmarc.${baseRoot}`;
  const dmarcSubHost = `_dmarc.${senderDomain}`;

  const [rootTxt, sendSubTxt, dmarcSubTxt, dmarcRootTxt, ...dkimTxtRows] = await Promise.all([
    txtCheck(senderDomain),
    txtCheck(`send.${senderDomain}`),
    txtCheck(dmarcSubHost),
    senderDomain === baseRoot ? Promise.resolve({ ok: false, records: [], error: null as string | null }) : txtCheck(dmarcRootHost),
    ...selectors.map((selector) => txtCheck(`${selector}._domainkey.${senderDomain}`)),
  ]);

  const rootRecords = rootTxt.records.map((r) => r.toLowerCase());
  const sendSubRecords = sendSubTxt.records.map((r) => r.toLowerCase());
  const dmarcSubRecords = dmarcSubTxt.records.map((r) => r.toLowerCase());
  const dmarcRootRecords = dmarcRootTxt.records.map((r) => r.toLowerCase());

  const spfRecordRoot = rootRecords.find((r) => r.includes("v=spf1")) || "";
  const spfRecordSendSub = sendSubRecords.find((r) => r.includes("v=spf1")) || "";
  const spfRecord = spfRecordRoot || spfRecordSendSub;
  const dmarcRecordSub = dmarcSubRecords.find((r) => r.includes("v=dmarc1")) || "";
  const dmarcRecordRoot = dmarcRootRecords.find((r) => r.includes("v=dmarc1")) || "";
  const dmarcRecord = dmarcRecordSub || dmarcRecordRoot;
  const dmarcHostResolved = dmarcRecordSub ? dmarcSubHost : dmarcRecordRoot ? dmarcRootHost : dmarcSubHost;
  const dmarcPolicyMatch = dmarcRecord.match(/\bp=([a-z]+)/i);
  const dmarcPolicy = dmarcPolicyMatch ? String(dmarcPolicyMatch[1] || "").toLowerCase() : "";

  const dkimResolved = dkimTxtRows.map((row, idx) => {
    const host = `${selectors[idx]}._domainkey.${senderDomain}`;
    const record = row.records.find((r) => r.toLowerCase().includes("v=dkim1")) || "";
    return {
      host,
      ok: !!record,
      details: record || "Kein DKIM TXT-Eintrag gefunden",
      error: row.error,
    } satisfies DnsCheck;
  });

  const checks: DnsCheck[] = [
    {
      host: senderDomain,
      ok: !!spfRecordRoot,
      details: spfRecordRoot || "Kein SPF-Eintrag direkt auf der Absenderdomain gefunden",
      error: rootTxt.error,
    },
    {
      host: `send.${senderDomain}`,
      ok: !!spfRecordSendSub,
      details: spfRecordSendSub || "Kein SPF-Eintrag auf send.<domain> gefunden",
      error: sendSubTxt.error,
    },
    {
      host: dmarcHostResolved,
      ok: !!dmarcRecord,
      details: dmarcRecord || "Kein DMARC-Eintrag (v=DMARC1) gefunden",
      error: dmarcRecordSub ? dmarcSubTxt.error : dmarcRootTxt.error,
    },
    ...dkimResolved,
  ];

  const supa = supabaseAdmin();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [failedCountRes, failedRowsRes] = await Promise.all([
    (supa.from("messages") as any)
      .select("id", { count: "exact", head: true })
      .eq("send_status", "failed")
      .gte("updated_at", since24h),
    (supa.from("messages") as any)
      .select("id, send_error, updated_at")
      .eq("send_status", "failed")
      .gte("updated_at", since24h)
      .order("updated_at", { ascending: false })
      .limit(80),
  ]);

  const failedRows = Array.isArray(failedRowsRes?.data) ? failedRowsRes.data : [];
  const deliverabilityRegex =
    /(spam|blocked|blacklist|550|554|mailbox unavailable|recipient rejected|policy|dmarc|spf|dkim|bounce)/i;
  const deliverabilityLike = failedRows.filter((row: any) =>
    deliverabilityRegex.test(String(row?.send_error || "")),
  );

  let level: "ok" | "warning" | "critical" = "ok";
  if (!spfRecord || !dmarcRecord) level = "critical";
  else if (!dkimResolved.some((r) => r.ok) || dmarcPolicy === "none") level = "warning";
  if (deliverabilityLike.length >= 10) level = "critical";
  else if (level === "ok" && deliverabilityLike.length >= 3) level = "warning";

  const recommendations: string[] = [];
  if (!spfRecord) recommendations.push("SPF setzen: füge einen gültigen v=spf1 TXT-Record für die Absenderdomain hinzu.");
  if (!dmarcRecord) recommendations.push("DMARC setzen: _dmarc.<domain> mit v=DMARC1 und klarer Policy (mindestens p=quarantine).");
  if (dmarcRecord && dmarcPolicy === "none")
    recommendations.push("DMARC Policy verschärfen: p=none ist nur Monitoring; für produktiven Versand p=quarantine oder p=reject nutzen.");
  if (!dkimResolved.some((r) => r.ok))
    recommendations.push("DKIM aktivieren: mindestens ein gültiger DKIM-Selector muss veröffentlich sein.");
  if (deliverabilityLike.length > 0)
    recommendations.push("Fehlersamples prüfen: Bounce-/Block-Fehler im Outbox-Log analysieren und Provider-Richtlinien abgleichen.");
  if (recommendations.length === 0)
    recommendations.push("Deliverability sieht stabil aus. Weiter monatlich SPF/DKIM/DMARC und Bounce-Rate überwachen.");

  return jsonWithRequestId(requestId, {
    ok: true,
    level,
    sender_from: senderFrom,
    sender_domain: senderDomain,
    dmarc_policy: dmarcPolicy || null,
    checks,
    summary: {
      failed_sends_24h: Number(failedCountRes?.count || 0),
      deliverability_like_failures_24h: deliverabilityLike.length,
      failed_samples: deliverabilityLike.slice(0, 8).map((row: any) => ({
        updated_at: row?.updated_at || null,
        send_error: String(row?.send_error || "").slice(0, 280),
      })),
    },
    recommendations,
  });
}
