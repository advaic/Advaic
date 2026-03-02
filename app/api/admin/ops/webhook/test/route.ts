import { NextRequest } from "next/server";
import { requireAdmin } from "../../../_guard";
import { getRequestId, jsonWithRequestId } from "@/lib/ops/request-id";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const gate = await requireAdmin(req);
  if (!gate.ok) {
    return jsonWithRequestId(requestId, { error: gate.error }, { status: gate.status });
  }

  const webhookUrl = String(process.env.ADVAIC_OPS_ALERT_WEBHOOK_URL || "").trim();
  if (!webhookUrl) {
    return jsonWithRequestId(
      requestId,
      { error: "ops_webhook_missing", details: "ADVAIC_OPS_ALERT_WEBHOOK_URL ist nicht gesetzt." },
      { status: 400 },
    );
  }

  const nowIso = new Date().toISOString();
  const baseUrl =
    String(process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "") ||
    req.nextUrl.origin.replace(/\/+$/, "");

  const isSlack = /hooks\.slack\.com/i.test(webhookUrl);
  const payload = isSlack
    ? {
        text: `*Advaic Ops Test* · Webhook erreichbar\nZeit: ${nowIso}\nQuelle: ${baseUrl}/app/admin/ops`,
      }
    : {
        source: "advaic_ops_test",
        generated_at: nowIso,
        severity: "warning",
        key: "webhook_test",
        title: "Ops-Webhooks Test",
        message: "Dies ist ein manueller Test aus dem Admin Ops Control Center.",
        deep_link: `${baseUrl}/app/admin/ops`,
      };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await response.text().catch(() => "");
    if (!response.ok) {
      return jsonWithRequestId(
        requestId,
        {
          ok: false,
          error: "ops_webhook_test_failed",
          status: response.status,
          body: text.slice(0, 300),
        },
        { status: 502 },
      );
    }

    return jsonWithRequestId(requestId, {
      ok: true,
      status: response.status,
      response_preview: text.slice(0, 200),
      sent_at: nowIso,
    });
  } catch (e: any) {
    return jsonWithRequestId(
      requestId,
      {
        ok: false,
        error: "ops_webhook_test_exception",
        details: String(e?.message || "unknown_error"),
      },
      { status: 502 },
    );
  }
}

