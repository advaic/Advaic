import { NextRequest } from "next/server";
import { requireAdmin } from "../../../_guard";
import { getRequestId, jsonWithRequestId } from "@/lib/ops/request-id";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function siteUrl(req: NextRequest) {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return req.nextUrl.origin.replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const gate = await requireAdmin(req);
  if (!gate.ok) return jsonWithRequestId(requestId, { error: gate.error }, { status: gate.status });

  const body = (await req.json().catch(() => null)) as { auto_pause?: boolean } | null;
  const base = siteUrl(req);

  const response = await fetch(`${base}/api/pipeline/ops/alerts/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-advaic-internal-secret": mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET"),
    },
    body: JSON.stringify({
      auto_pause: body?.auto_pause !== false,
    }),
  }).catch(() => null);

  if (!response) {
    return jsonWithRequestId(requestId, { error: "ops_alert_trigger_network_failed" }, { status: 502 });
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    return jsonWithRequestId(
      requestId,
      { error: "ops_alert_trigger_failed", details: json || null },
      { status: response.status || 500 },
    );
  }

  return jsonWithRequestId(requestId, {
    ok: true,
    ...(json || {}),
  });
}
