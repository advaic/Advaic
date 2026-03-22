import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import CrmControlCenter from "@/components/crm/CrmControlCenter";
import { isOwnerUserId } from "@/lib/auth/ownerAccess";
import { DEFAULT_CRM_AUTOMATION_SETTINGS, loadCrmAutomationSettings } from "@/lib/crm/automationSettings";
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
  candidate_queue: any[];
  account_change_queue: any[];
  blocked_draft_queue: any[];
  open_feedback: {
    total: number;
    by_severity: { critical: number; high: number; medium: number; low: number };
  };
  automation: {
    sequence_automation_enabled: boolean;
    enrichment_automation_enabled: boolean;
    reason: string | null;
    updated_at: string | null;
    source: "table" | "default";
    schema_missing?: boolean;
  };
  error?: string;
  details?: string;
};

function isSchemaMismatch(error: { message?: string; details?: string; hint?: string; code?: string } | null | undefined) {
  const text = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  return (
    code === "42703" ||
    code === "42p01" ||
    text.includes("does not exist") ||
    text.includes("schema cache") ||
    text.includes("could not find the") ||
    text.includes("relation")
  );
}

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
  candidate_queue: [],
  account_change_queue: [],
  blocked_draft_queue: [],
  open_feedback: {
    total: 0,
    by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
  },
  automation: DEFAULT_CRM_AUTOMATION_SETTINGS,
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
    const [funnelRes, dueResRaw, prospectsRes, feedbackRes, candidateQueueResRaw, accountChangeRes, blockedDraftRes, automation] = await Promise.all([
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
      (admin.from("crm_prospect_candidates") as any)
        .select(
          "id, company_name, contact_email, contact_role, city, website_url, source_url, linkedin_url, linkedin_search_url, object_focus, preferred_channel, priority, fit_score, automation_readiness, active_listings_count, personalization_hook, target_group, process_hint, source_checked_at, metadata, created_at, review_status",
        )
        .eq("agent_id", user.id)
        .eq("review_status", "new")
        .order("fit_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(24),
      (admin.from("crm_prospects") as any)
        .select(
          "id, company_name, contact_name, contact_email, city, priority, fit_score, stage, next_action, next_action_at, personalization_hook, source_checked_at, updated_at",
        )
        .eq("agent_id", user.id)
        .ilike("next_action", "Account-Aenderung pruefen%")
        .order("next_action_at", { ascending: true })
        .limit(24),
      (admin.from("crm_outreach_messages") as any)
        .select("id, prospect_id, channel, message_kind, subject, body, status, metadata, created_at, updated_at")
        .eq("agent_id", user.id)
        .in("status", ["draft", "ready"])
        .order("updated_at", { ascending: false })
        .limit(120),
      loadCrmAutomationSettings(admin, String(user.id)),
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

    let candidateQueueRes: { data: any[] | null; error: any } = candidateQueueResRaw as any;
    if (candidateQueueRes.error && isSchemaMismatch(candidateQueueRes.error as any)) {
      candidateQueueRes = { data: [], error: null };
    }

    const firstErr =
      funnelRes.error ||
      dueRes.error ||
      prospectsRes.error ||
      feedbackRes.error ||
      candidateQueueRes.error ||
      accountChangeRes.error ||
      blockedDraftRes.error;
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
      const accountChangeRows = ((accountChangeRes.data || []) as any[]).slice(0, 18);
      const accountChangeIds = accountChangeRows.map((row) => String(row?.id || "").trim()).filter(Boolean);
      let accountChangeById = new Map<string, any>();
      if (accountChangeIds.length > 0) {
        const notesRes = await (admin.from("crm_research_notes") as any)
          .select("prospect_id, note, created_at, metadata")
          .eq("agent_id", user.id)
          .in("prospect_id", accountChangeIds)
          .eq("is_key_insight", true)
          .order("created_at", { ascending: false })
          .limit(Math.max(60, accountChangeIds.length * 4));
        if (!notesRes.error) {
          for (const row of (notesRes.data || []) as any[]) {
            const prospectId = String(row?.prospect_id || "").trim();
            if (!prospectId || accountChangeById.has(prospectId)) continue;
            const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
            const changeSummary =
              metadata?.change_summary && typeof metadata.change_summary === "object"
                ? metadata.change_summary
                : null;
            if (changeSummary?.detected || Number(changeSummary?.count || 0) > 0) {
              accountChangeById.set(prospectId, {
                note: String(row?.note || "").trim() || null,
                created_at: row?.created_at || null,
                change_summary: changeSummary,
              });
            }
          }
        }
      }
      const accountChangeQueue = accountChangeRows.map((row) => {
        const note = accountChangeById.get(String(row?.id || "").trim()) || null;
        const changeSummary = note?.change_summary && typeof note.change_summary === "object" ? note.change_summary : null;
        return {
          ...row,
          change_summary: typeof changeSummary?.summary === "string" ? changeSummary.summary : null,
          change_count: Number.isFinite(Number(changeSummary?.count)) ? Number(changeSummary.count) : null,
          change_detected_at: note?.created_at || row?.next_action_at || null,
          latest_change_note: note?.note || null,
          change_items: Array.isArray(changeSummary?.items) ? changeSummary.items.slice(0, 6) : [],
        };
      });

      const blockedDraftRows = ((blockedDraftRes.data || []) as any[]).filter((row) => {
        const review =
          row?.metadata?.outbound_review && typeof row.metadata.outbound_review === "object"
            ? row.metadata.outbound_review
            : null;
        return review && String(review.status || "").toLowerCase() !== "pass";
      });
      const blockedDraftProspectIds = [...new Set(
        blockedDraftRows.map((row) => String(row?.prospect_id || "").trim()).filter(Boolean),
      )];
      let blockedDraftProspectMap = new Map<string, any>();
      if (blockedDraftProspectIds.length > 0) {
        const blockedProspectsRes = await (admin.from("crm_prospects") as any)
          .select("id, company_name, city, stage, priority, fit_score")
          .eq("agent_id", user.id)
          .in("id", blockedDraftProspectIds);
        if (!blockedProspectsRes.error) {
          blockedDraftProspectMap = new Map(
            ((blockedProspectsRes.data || []) as any[]).map((row) => [String(row?.id || ""), row]),
          );
        }
      }
      const blockedDraftQueue = blockedDraftRows
        .map((row) => {
          const review =
            row?.metadata?.outbound_review && typeof row.metadata.outbound_review === "object"
              ? row.metadata.outbound_review
              : null;
          const prospect = blockedDraftProspectMap.get(String(row?.prospect_id || "")) || null;
          return {
            id: row.id,
            prospect_id: row.prospect_id,
            company_name: prospect?.company_name || "Unbekannter Prospect",
            city: prospect?.city || null,
            stage: prospect?.stage || null,
            priority: prospect?.priority || null,
            fit_score: Number(prospect?.fit_score || 0) || null,
            channel: row.channel,
            message_kind: row.message_kind,
            subject: row.subject || null,
            body: String(row.body || "").trim(),
            body_preview: String(row.body || "").trim().slice(0, 220),
            status: row.status,
            review,
            created_at: row.created_at || null,
            updated_at: row.updated_at || null,
          };
        })
        .sort((a, b) => {
          const severityRank = (input: any) =>
            String(input?.review?.status || "").toLowerCase() === "blocked" ? 0 : 1;
          const severityDiff = severityRank(a) - severityRank(b);
          if (severityDiff !== 0) return severityDiff;
          const unsupportedDiff =
            Number(b.review?.evidence_alignment?.unsupported_claim_count || 0) -
            Number(a.review?.evidence_alignment?.unsupported_claim_count || 0);
          if (unsupportedDiff !== 0) return unsupportedDiff;
          return Number(a.review?.score || 0) - Number(b.review?.score || 0);
        })
        .slice(0, 18);

      initialData = {
        ok: true,
        summary: (funnelRes.data as any) || emptyOverview.summary,
        followup_due: (dueRes.data as any[]) || [],
        prospects: (prospectsRes.data as any[]) || [],
        candidate_queue: (candidateQueueRes.data as any[]) || [],
        account_change_queue: accountChangeQueue,
        blocked_draft_queue: blockedDraftQueue,
        open_feedback: {
          total: Number(feedbackRes.count || 0),
          by_severity: openFeedbackBySeverity,
        },
        automation,
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
