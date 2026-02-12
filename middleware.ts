import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

function isPublicAsset(pathname: string) {
  // Next internals
  if (pathname.startsWith("/_next")) return true;

  // Common public files
  if (
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/site.webmanifest"
  ) {
    return true;
  }

  // Any file with an extension (images, fonts, css, js, etc.)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname, search } = req.nextUrl;

  // ✅ Always allow static assets and Next internals
  if (isPublicAsset(pathname)) {
    return res;
  }

  // ✅ Always allow the login page
  if (pathname === "/login") {
    return res;
  }

  // ✅ Allow onboarding routes (must be reachable after login redirects)
  if (pathname === "/app/onboarding" || pathname.startsWith("/app/onboarding/")) {
    return res;
  }

  // ✅ Allow Gmail OAuth routes (otherwise Gmail connect breaks)
  if (pathname.startsWith("/api/auth/gmail")) {
    return res;
  }

  // ✅ Allow Outlook OAuth routes (otherwise Outlook connect breaks)
  if (pathname.startsWith("/api/auth/outlook")) {
    return res;
  }

  // ✅ Allow Gmail push endpoint (Pub/Sub must reach it without a user session)
  if (pathname.startsWith("/api/gmail/push")) {
    return res;
  }

  // ✅ Allow Outlook webhook endpoint (Microsoft Graph must reach it without a user session)
  if (pathname.startsWith("/api/outlook/webhook")) {
    return res;
  }

  // (Optional) allow simple health checks if you add them later
  if (pathname.startsWith("/api/health")) {
    return res;
  }

  // ✅ Allow onboarding APIs
  if (pathname.startsWith("/api/onboarding")) {
    return res;
  }

  // ✅ Allow pipeline APIs (internal secret protects these)
  if (pathname.startsWith("/api/pipeline")) {
    return res;
  }

  // ---- Auth check ----
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  // Use getUser() (server-verified) instead of getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";

    const nextPath = pathname + (search || "");
    redirectUrl.searchParams.set("next", nextPath);

    return NextResponse.redirect(redirectUrl);
  }

  // ---- Admin gate ----
  // Admin UI lives under /app/admin.
  // V1: Allow ONLY a single explicit user id (the founder) to access admin.
  // Configure via env var: ADVAIC_ADMIN_USER_ID=<auth.users.id>
  const isAdminPath = pathname === "/app/admin" || pathname.startsWith("/app/admin/");
  const isAdminApiPath = pathname.startsWith("/api/admin");

  if (isAdminPath || isAdminApiPath) {
    const allowedAdminId = String(process.env.ADVAIC_ADMIN_USER_ID || "").trim();

    // Fail-closed for admin area if not configured.
    if (!allowedAdminId) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/app";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    // Only the configured user id is allowed.
    if (String(user.id) !== allowedAdminId) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/app";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ---- Onboarding gate ----
  // Only run for authenticated users.
  // Fail-open: if the onboarding table isn't deployed yet, don't block users.
  try {
    // If onboarding is already completed, don't let the user stay on /onboarding.
    const isOnboardingPath =
      pathname === "/app/onboarding" || pathname.startsWith("/app/onboarding/");

    // NOTE: We treat onboarding as completed if EITHER:
    // - agent_onboarding.completed_at is set (new flow)
    // - agent_settings.onboarding_completed is true (legacy / settings-based flow)
    // This prevents getting bounced back to step 1 on Step 6 “Onboarding beenden”.

    const onboardingRes = await (supabase.from("agent_onboarding") as any)
      .select("completed_at, current_step")
      .eq("agent_id", user.id)
      .maybeSingle();

    const settingsRes = await (supabase.from("agent_settings") as any)
      .select("onboarding_completed")
      .eq("agent_id", user.id)
      .maybeSingle();

    const step = Number((onboardingRes as any)?.data?.current_step ?? 1);

    // ✅ Allow certain app routes during onboarding.
    // IMPORTANT: We currently allow all Immobilien routes during onboarding so the user can add properties in Step 5.
    // (If you want to tighten this later, gate it by step again once current_step is reliably updated.)
    const isImmoPath =
      pathname === "/app/immobilien" || pathname.startsWith("/app/immobilien/");

    const allowDuringOnboarding = isImmoPath;

    const completed =
      !!(onboardingRes as any)?.data?.completed_at ||
      !!(settingsRes as any)?.data?.onboarding_completed;

    if (!completed && !isOnboardingPath && !allowDuringOnboarding) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/app/onboarding";

      const nextPath = pathname + (search || "");
      redirectUrl.searchParams.set("next", nextPath);

      return NextResponse.redirect(redirectUrl);
    }

    if (completed && isOnboardingPath) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/app";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  } catch {
    // ignore (fail-open)
  }

  return res;
}

export const config = {
  // 🔒 Protect only the app + onboarding areas. Marketing pages remain public.
  matcher: [
    "/app",
    "/app/:path*",
    "/app/onboarding",
    "/app/onboarding/:path*",
    "/app/admin",
    "/app/admin/:path*",
    "/api/admin/:path*",
  ],
};
