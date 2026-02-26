import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function supabaseAuth(req: NextRequest) {
  return createServerClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const auth = supabaseAuth(req);
  const {
    data: { user },
    error: authErr,
  } = await auth.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const agentId = user.id;
  const userMeta =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, any>)
      : {};
  const displayName =
    String(userMeta.full_name || userMeta.name || "").trim() || null;
  const company = String(userMeta.company || "").trim() || null;
  const termsAcceptedAt = String(userMeta.terms_accepted_at || "").trim() || null;
  const termsVersion = String(userMeta.terms_version || "").trim() || null;
  const privacyAcceptedAt = String(userMeta.privacy_accepted_at || "").trim() || null;
  const privacyVersion = String(userMeta.privacy_version || "").trim() || null;
  const marketingOptIn =
    userMeta.marketing_email_opt_in === null ||
    typeof userMeta.marketing_email_opt_in === "undefined"
      ? null
      : userMeta.marketing_email_opt_in === true ||
          String(userMeta.marketing_email_opt_in).toLowerCase() === "true";
  const marketingOptInAt = String(userMeta.marketing_email_opt_in_at || "").trim() || null;
  const marketingOptOutAt = String(userMeta.marketing_email_opt_out_at || "").trim() || null;
  const signupSource = String(userMeta.signup_source || "").trim() || null;

  // Ensure legacy/public.agents row exists before writing onboarding.
  // Some environments rely on this FK relation and may not have DB triggers enabled.
  const enrichedAgentSeed = {
    id: agentId,
    email: user.email || null,
    name: displayName,
    company,
    terms_accepted_at: termsAcceptedAt,
    terms_version: termsVersion,
    privacy_accepted_at: privacyAcceptedAt,
    privacy_version: privacyVersion,
    marketing_email_opt_in: marketingOptIn,
    marketing_email_opt_in_at: marketingOptInAt,
    marketing_email_opt_out_at: marketingOptOutAt,
    signup_source: signupSource,
  };
  const basicAgentSeed = {
    id: agentId,
    email: user.email || null,
    name: displayName,
    company,
  };

  let { error: agentSeedErr } = await (admin.from("agents") as any).upsert(
    enrichedAgentSeed,
    { onConflict: "id" }
  );

  if (agentSeedErr && /column .* does not exist/i.test(String(agentSeedErr.message || ""))) {
    const fallback = await (admin.from("agents") as any).upsert(basicAgentSeed, { onConflict: "id" });
    agentSeedErr = fallback.error ?? null;
  }

  if (agentSeedErr) {
    return NextResponse.json(
      { error: "Failed to seed agent profile", details: agentSeedErr.message },
      { status: 500 }
    );
  }

  // Create row if missing, then return it
  const { data, error } = await (admin.from("agent_onboarding") as any)
    .upsert(
      {
        agent_id: agentId,
        // default state, safe if already exists
        total_steps: 6,
        current_step: 1,
      },
      { onConflict: "agent_id" }
    )
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to bootstrap onboarding", details: error.message },
      { status: 500 }
    );
  }

  const nowIso = new Date().toISOString();
  const due1h = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const due24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: recoveryExisting } = await (admin.from("onboarding_recovery") as any)
    .select("agent_id")
    .eq("agent_id", agentId)
    .maybeSingle();

  if (!recoveryExisting?.agent_id) {
    await (admin.from("onboarding_recovery") as any)
      .insert({
        agent_id: agentId,
        onboarding_started_at: nowIso,
        remind_1h_due_at: due1h,
        remind_24h_due_at: due24h,
        updated_at: nowIso,
      })
      .then(() => null)
      .catch(() => null);
  }

  return NextResponse.json({ ok: true, onboarding: data });
}
