import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, requireRouteUser } from "@/lib/supabase/routeAuth";
import { stripeRequest } from "@/lib/billing/stripe";

export const runtime = "nodejs";

type Body = {
  return_path?: string;
};

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function siteUrl() {
  return mustEnv("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
}

function isSafePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

export async function POST(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (!auth.ok) return auth.response;

  try {
    const agentId = String(auth.user.id);
    const body = (await req.json().catch(() => null)) as Body | null;
    const returnPath = String(body?.return_path || "/app/konto/abo").trim();

    if (!isSafePath(returnPath)) {
      return NextResponse.json({ error: "invalid_return_path" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: customer } = await (supabase.from("billing_customers") as any)
      .select("stripe_customer_id")
      .eq("agent_id", agentId)
      .maybeSingle();

    if (!customer?.stripe_customer_id) {
      return NextResponse.json(
        { error: "no_billing_customer", details: "Bitte zuerst ein Abo abschließen." },
        { status: 400 },
      );
    }

    const portalSession = await stripeRequest<{ id: string; url: string | null }>({
      path: "/billing_portal/sessions",
      method: "POST",
      body: {
        customer: String(customer.stripe_customer_id),
        return_url: `${siteUrl()}${returnPath}`,
      },
    });

    if (!portalSession?.url) {
      return NextResponse.json(
        { error: "billing_portal_missing_url" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      portal_url: String(portalSession.url),
      session_id: String(portalSession.id || ""),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "billing_portal_failed", details: String(e?.message || e) },
      { status: 500 },
    );
  }
}
