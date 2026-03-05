import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { isOwnerUserId } from "@/lib/auth/ownerAccess";
import { createSupabaseAdminClient } from "@/lib/supabase/routeAuth";
import CrmProspectDetail from "@/components/crm/CrmProspectDetail";

export const dynamic = "force-dynamic";

export default async function CrmProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prospectId = String(id || "").trim();
  if (!prospectId) notFound();

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
    redirect(`/login?next=/app/crm/${encodeURIComponent(prospectId)}`);
  }
  if (!isOwnerUserId(user.id)) {
    notFound();
  }

  const admin = createSupabaseAdminClient();

  const [prospectRes, nextActionRes, notesRes, messagesRes, eventsRes] = await Promise.all([
    (admin.from("crm_prospects") as any)
      .select(
        "id, company_name, contact_name, contact_email, contact_role, city, region, website_url, source_url, source_checked_at, linkedin_url, linkedin_search_url, linkedin_headline, linkedin_relevance_note, object_focus, active_listings_count, new_listings_30d, share_miete_percent, share_kauf_percent, object_types, price_band_main, region_focus_micro, response_promise_public, appointment_flow_public, docs_flow_public, owner_led, years_in_market, trust_signals, brand_tone, primary_objection, primary_pain_hypothesis, secondary_pain_hypothesis, automation_readiness, cta_preference_guess, personalization_evidence, hypothesis_confidence, personalization_hook, pain_point_hypothesis, fit_score, priority, stage, preferred_channel, next_action, next_action_at",
      )
      .eq("agent_id", user.id)
      .eq("id", prospectId)
      .maybeSingle(),
    (admin.from("crm_next_actions") as any)
      .select(
        "prospect_id, company_name, contact_name, contact_email, object_focus, preferred_channel, priority, fit_score, stage, recommended_action, recommended_reason, recommended_code, recommended_primary_label, recommended_at",
      )
      .eq("agent_id", user.id)
      .eq("prospect_id", prospectId)
      .maybeSingle(),
    (admin.from("crm_research_notes") as any)
      .select("id, source_type, source_url, note, confidence, is_key_insight, created_at")
      .eq("agent_id", user.id)
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false })
      .limit(100),
    (admin.from("crm_outreach_messages") as any)
      .select(
        "id, channel, message_kind, subject, body, personalization_score, status, sent_at, metadata, created_at, updated_at",
      )
      .eq("agent_id", user.id)
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false })
      .limit(150),
    (admin.from("crm_outreach_events") as any)
      .select("id, message_id, event_type, details, event_at, created_at")
      .eq("agent_id", user.id)
      .eq("prospect_id", prospectId)
      .order("event_at", { ascending: false })
      .limit(200),
  ]);

  if (prospectRes.error || !prospectRes.data) {
    notFound();
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto max-w-[1360px] px-4 py-6 md:px-6">
        <CrmProspectDetail
          prospectId={prospectId}
          initialProspect={prospectRes.data as any}
          initialNextAction={(nextActionRes.data || null) as any}
          initialNotes={((notesRes.data as any[]) || []) as any}
          initialMessages={((messagesRes.data as any[]) || []) as any}
          initialEvents={((eventsRes.data as any[]) || []) as any}
        />
      </div>
    </div>
  );
}
