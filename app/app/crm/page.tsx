import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import CrmControlCenter from "@/components/crm/CrmControlCenter";
import { isOwnerUserId } from "@/lib/auth/ownerAccess";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";

export const dynamic = "force-dynamic";

type OverviewResponse = {
  ok: boolean;
  summary: {
    prospects_total: number;
    contacted_total: number;
    replied_total: number;
    pilot_invited_total: number;
    pilot_active_total: number;
    won_total: number;
    lost_total: number;
  };
  followup_due: any[];
  prospects: any[];
  open_feedback: {
    total: number;
    by_severity: { critical: number; high: number; medium: number; low: number };
  };
  error?: string;
  details?: string;
};

const emptyOverview: OverviewResponse = {
  ok: true,
  summary: {
    prospects_total: 0,
    contacted_total: 0,
    replied_total: 0,
    pilot_invited_total: 0,
    pilot_active_total: 0,
    won_total: 0,
    lost_total: 0,
  },
  followup_due: [],
  prospects: [],
  open_feedback: {
    total: 0,
    by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
  },
};

export default async function CrmPage() {
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
    redirect("/login?next=/app/crm");
  }

  if (!isOwnerUserId(user.id)) {
    notFound();
  }

  let initialData: OverviewResponse = emptyOverview;
  try {
    const admin = createSupabaseAdminClient();
    const [funnelRes, dueResRaw, prospectsRes, feedbackRes] = await Promise.all([
      (admin.from("crm_conversion_funnel") as any)
        .select("*")
        .eq("agent_id", user.id)
        .maybeSingle(),
      (admin.from("crm_followup_due") as any)
        .select(
          "prospect_id, company_name, contact_name, contact_email, priority, fit_score, recommended_action, recommended_reason, recommended_code, recommended_primary_label, recommended_at",
        )
        .eq("agent_id", user.id)
        .order("recommended_at", { ascending: true })
        .limit(15),
      (admin.from("crm_prospects") as any)
        .select(
          "id, company_name, contact_name, contact_email, city, object_focus, priority, fit_score, stage, preferred_channel, last_contacted_at, next_action, next_action_at, personalization_hook, source_url, source_checked_at, linkedin_url, linkedin_search_url, linkedin_relevance_note, active_listings_count, share_miete_percent, share_kauf_percent, brand_tone, primary_objection, automation_readiness, cta_preference_guess, updated_at",
        )
        .eq("agent_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50),
      (admin.from("crm_pilot_feedback") as any)
        .select("id, severity, is_resolved", { count: "exact", head: false })
        .eq("agent_id", user.id)
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    let dueRes: { data: any[] | null; error: any } = dueResRaw as any;
    if (dueRes.error && String((dueRes.error as any)?.code || "") === "42703") {
      const fallback = await (admin.from("crm_followup_due") as any)
        .select(
          "prospect_id, company_name, contact_name, priority, fit_score, recommended_action, recommended_reason, recommended_code, recommended_primary_label, recommended_at",
        )
        .eq("agent_id", user.id)
        .order("recommended_at", { ascending: true })
        .limit(15);
      dueRes = {
        data: ((fallback.data || []) as any[]).map((row) => ({
          ...row,
          contact_email: null,
        })),
        error: fallback.error,
      };
    }

    const firstErr =
      funnelRes.error || dueRes.error || prospectsRes.error || feedbackRes.error;
    if (firstErr) {
      initialData = {
        ...emptyOverview,
        ok: false,
        error: "crm_overview_failed",
        details: firstErr.message,
      };
    } else {
      const openFeedbackBySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
      for (const row of (feedbackRes.data || []) as any[]) {
        const sev = String(row?.severity || "medium").toLowerCase();
        if (sev in openFeedbackBySeverity) {
          (openFeedbackBySeverity as any)[sev] += 1;
        }
      }
      initialData = {
        ok: true,
        summary: (funnelRes.data as any) || emptyOverview.summary,
        followup_due: (dueRes.data as any[]) || [],
        prospects: (prospectsRes.data as any[]) || [],
        open_feedback: {
          total: Number(feedbackRes.count || 0),
          by_severity: openFeedbackBySeverity,
        },
      };
    }
  } catch {
    initialData = {
      ...emptyOverview,
      ok: false,
      error: "overview_fetch_failed",
      details: "CRM-Übersicht konnte nicht geladen werden.",
    };
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6">
        <CrmControlCenter initialData={initialData} />
      </div>
    </div>
  );
}
