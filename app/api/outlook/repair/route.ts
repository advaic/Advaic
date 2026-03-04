import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function createAuthClient(req: NextRequest) {
  return createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );
}

function safeErrorMessage(value: unknown, max = 400) {
  return String(value || "unknown_error").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  const supabase = createAuthClient(req);
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const internalSecret = String(process.env.ADVAIC_INTERNAL_PIPELINE_SECRET || "").trim();
  if (!internalSecret) {
    return NextResponse.json(
      { error: "repair_not_configured", details: "missing_pipeline_secret" },
      { status: 500 },
    );
  }

  const baseUrl = mustEnv("NEXT_PUBLIC_SITE_URL");
  const subscribeUrl = new URL("/api/outlook/subscribe", baseUrl).toString();

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 15000);

  try {
    const upstream = await fetch(subscribeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-advaic-internal-secret": internalSecret,
      },
      body: JSON.stringify({ agentId: user.id }),
      signal: ctrl.signal,
      cache: "no-store",
    });

    const payload = (await upstream.json().catch(() => null)) as any;

    if (!upstream.ok || payload?.ok === false) {
      return NextResponse.json(
        {
          error: "outlook_repair_failed",
          details: safeErrorMessage(payload?.details || payload?.error || `http_${upstream.status}`),
        },
        { status: upstream.status || 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      action: String(payload?.action || "renewed"),
      outlook_subscription_id:
        payload?.outlook_subscription_id ? String(payload.outlook_subscription_id) : null,
      outlook_subscription_expiration:
        payload?.outlook_subscription_expiration
          ? String(payload.outlook_subscription_expiration)
          : null,
    });
  } catch (e: any) {
    const msg = safeErrorMessage(
      e?.name === "AbortError" ? "outlook_repair_timeout" : e?.message || "outlook_repair_failed",
    );
    return NextResponse.json({ error: "outlook_repair_failed", details: msg }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
