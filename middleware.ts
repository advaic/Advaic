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

  // ✅ Allow Gmail OAuth routes (otherwise Gmail connect breaks)
  if (pathname.startsWith("/api/auth/gmail")) {
    return res;
  }

  // ✅ Allow Gmail push endpoint (Pub/Sub must reach it without a user session)
  if (pathname.startsWith("/api/gmail/push")) {
    return res;
  }

  // (Optional) allow simple health checks if you add them later
  if (pathname.startsWith("/api/health")) {
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

  return res;
}

export const config = {
  // 🔒 Protect everything by default; we allow-list specific public paths above.
  matcher: ["/:path*"],
};
