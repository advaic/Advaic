import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export function getRequestId(req: NextRequest) {
  const inbound = String(req.headers.get("x-request-id") || "")
    .trim()
    .slice(0, 120);
  return inbound || randomUUID();
}

export function jsonWithRequestId(
  requestId: string,
  body: Record<string, unknown>,
  init?: { status?: number },
) {
  const res = NextResponse.json(
    {
      request_id: requestId,
      ...body,
    },
    init,
  );
  res.headers.set("x-request-id", requestId);
  return res;
}

export function logInfo(requestId: string, message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.info(`[rid:${requestId}] ${message}`, meta);
    return;
  }
  console.info(`[rid:${requestId}] ${message}`);
}

export function logError(requestId: string, message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.error(`[rid:${requestId}] ${message}`, meta);
    return;
  }
  console.error(`[rid:${requestId}] ${message}`);
}

