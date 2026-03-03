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

type TriggerBody = {
  dry_run?: boolean;
  send_limit?: number;
  scan_limit?: number;
};

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const gate = await requireAdmin(req);
  if (!gate.ok) {
    return jsonWithRequestId(requestId, { error: gate.error }, { status: gate.status });
  }

  const body = (await req.json().catch(() => null)) as TriggerBody | null;
  const base = siteUrl(req);

  const response = await fetch(`${base}/api/pipeline/billing-trial-reminders/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-advaic-internal-secret": mustEnv("ADVAIC_INTERNAL_PIPELINE_SECRET"),
    },
    body: JSON.stringify({
      dry_run: body?.dry_run === true,
      send_limit:
        Number.isFinite(Number(body?.send_limit)) && Number(body?.send_limit) > 0
          ? Number(body?.send_limit)
          : undefined,
      scan_limit:
        Number.isFinite(Number(body?.scan_limit)) && Number(body?.scan_limit) > 0
          ? Number(body?.scan_limit)
          : undefined,
    }),
  }).catch(() => null);

  if (!response) {
    return jsonWithRequestId(
      requestId,
      { error: "trial_reminder_trigger_network_failed" },
      { status: 502 },
    );
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    return jsonWithRequestId(
      requestId,
      { error: "trial_reminder_trigger_failed", details: json || null },
      { status: response.status || 500 },
    );
  }

  return jsonWithRequestId(requestId, {
    ok: true,
    ...(json || {}),
  });
}
