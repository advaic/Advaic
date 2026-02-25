import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, requireRouteUser } from "@/lib/supabase/routeAuth";

export const runtime = "nodejs";

type TableCheck = {
  exists: boolean;
  error: string | null;
};

function present(name: string) {
  return !!process.env[name]?.trim();
}

async function checkTable(supabase: any, table: string): Promise<TableCheck> {
  const { error } = await (supabase.from(table) as any).select("id").limit(1);
  if (!error) return { exists: true, error: null };
  return { exists: false, error: String(error.message || error) };
}

export async function GET(req: NextRequest) {
  const auth = await requireRouteUser(req);
  if (!auth.ok) return auth.response;

  const env = {
    stripe_secret_key: present("STRIPE_SECRET_KEY"),
    stripe_webhook_secret: present("STRIPE_WEBHOOK_SECRET"),
    stripe_price_starter_monthly: present("STRIPE_PRICE_STARTER_MONTHLY"),
    next_public_site_url: present("NEXT_PUBLIC_SITE_URL"),
  };

  let tables: Record<string, TableCheck> = {
    billing_customers: { exists: false, error: "not_checked" },
    billing_subscriptions: { exists: false, error: "not_checked" },
    billing_invoices: { exists: false, error: "not_checked" },
  };

  try {
    const supabase = createSupabaseAdminClient();
    const [customers, subscriptions, invoices] = await Promise.all([
      checkTable(supabase, "billing_customers"),
      checkTable(supabase, "billing_subscriptions"),
      checkTable(supabase, "billing_invoices"),
    ]);
    tables = {
      billing_customers: customers,
      billing_subscriptions: subscriptions,
      billing_invoices: invoices,
    };
  } catch (e: any) {
    const msg = String(e?.message || e);
    tables = {
      billing_customers: { exists: false, error: msg },
      billing_subscriptions: { exists: false, error: msg },
      billing_invoices: { exists: false, error: msg },
    };
  }

  const requiredEnvReady =
    env.stripe_secret_key &&
    env.stripe_webhook_secret &&
    env.stripe_price_starter_monthly &&
    env.next_public_site_url;
  const tablesReady = Object.values(tables).every((t) => t.exists);
  const ready = requiredEnvReady && tablesReady;

  return NextResponse.json({
    ok: true,
    ready,
    checks: {
      env,
      tables,
    },
    notes: {
      pricing: "Aktuell ist Starter der aktive Checkout-Plan.",
    },
  });
}
