import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { isOwnerUserId } from "@/lib/auth/ownerAccess";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import SalesIntelCenter from "@/components/crm/SalesIntelCenter";

export const dynamic = "force-dynamic";

export default async function CrmSalesIntelPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: async () => {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login?next=/app/crm/sales-intel");
  }
  if (!isOwnerUserId(user.id)) {
    notFound();
  }

  const admin = createSupabaseAdminClient();
  const [prospectsRes, logsRes] = await Promise.all([
    (admin.from("crm_prospects") as any)
      .select(
        "id, company_name, contact_name, city, object_focus, share_miete_percent, share_kauf_percent, active_listings_count, automation_readiness, fit_score, priority, stage",
      )
      .eq("agent_id", user.id)
      .order("fit_score", { ascending: false })
      .limit(200),
    (admin.from("crm_acq_activity_log_enriched") as any)
      .select("*")
      .eq("agent_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto max-w-[1360px] px-4 py-6 md:px-6">
        <SalesIntelCenter
          initialProspects={((prospectsRes.data as any[]) || []) as any}
          initialLogs={((logsRes.data as any[]) || []) as any}
          initialAnalysis={null}
        />
      </div>
    </div>
  );
}
