"use client";

import Link from "next/link";
import { useState, useEffect, createContext } from "react";
import { usePathname } from "next/navigation";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "@/types/supabase";
import { Menu, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { TourProvider } from "@/components/tour/Tour-Provider";
import TourOverlay from "@/components/tour/Tour-Overlay";
import { TourLauncherIcon } from "@/components/tour/TourLauncherIcon";
import CookieConsentBanner from "@/components/marketing/CookieConsentBanner";
import BrandLogo from "@/components/brand/BrandLogo";

export const SupabaseContext = createContext<{
  supabase: SupabaseClient<Database>;
  session: Session | null;
}>({
  supabase: {} as SupabaseClient<Database>,
  session: null,
});

export default function ClientRootLayout({
  children,
  session: serverSession,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const supabase = useSupabaseClient<Database>();
  const pathname = usePathname();

  const [session, setSession] = useState<Session | null>(serverSession);

  // Always fetch the current session on mount and subscribe to changes
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("[ClientRootLayout] getSession error:", error);
      if (isMounted) setSession(data.session ?? null);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) setSession(newSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const [hydrated, setHydrated] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileViewport) return;
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileViewport, mobileSidebarOpen]);

  if (!hydrated) return null;
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
  const isDemoUiRoute = pathname === "/app/demo-ui" || pathname.startsWith("/app/demo-ui/");
  const showAppSidebar = isAppRoute && !isDemoUiRoute;
  const showAppTourChrome = isAppRoute && !isDemoUiRoute;
  const showMobileAppChrome = showAppSidebar && isMobileViewport;
  const showSkipLink = !isAppRoute;

  return (
    <TourProvider>
      <SupabaseContext.Provider value={{ supabase, session }}>
        {showSkipLink ? (
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1100] focus:rounded-md focus:bg-black focus:px-4 focus:py-2 focus:text-white"
          >
            Zum Inhalt springen
          </a>
        ) : null}
        <div className={isAppRoute ? "min-h-screen md:flex md:h-screen" : "min-h-screen"}>
          {showAppSidebar && !isMobileViewport ? <Sidebar variant="desktop" /> : null}
          {showMobileAppChrome ? (
            <header className="fixed inset-x-0 top-0 z-[1050] border-b border-gray-200 bg-white/95 backdrop-blur md:hidden">
              <div className="flex h-16 items-center justify-between px-3">
                <Link href="/app/startseite" className="text-gray-800">
                  <BrandLogo size="sm" withIcon={false} />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen((prev) => !prev)}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-800"
                  aria-label={mobileSidebarOpen ? "Navigation schließen" : "Navigation öffnen"}
                  aria-expanded={mobileSidebarOpen}
                >
                  {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </header>
          ) : null}

          {showMobileAppChrome && mobileSidebarOpen ? (
            <div className="fixed inset-0 z-[1100] md:hidden" aria-modal="true" role="dialog">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute inset-0 bg-black/35"
                aria-label="Navigation schließen"
              />
              <div className="absolute inset-y-0 left-0 w-[88vw] max-w-[340px] bg-white shadow-[0_20px_60px_rgba(11,15,23,.28)]">
                <Sidebar variant="mobile" onNavigate={() => setMobileSidebarOpen(false)} />
              </div>
            </div>
          ) : null}
          <div
            id="main-content"
            className={
              isAppRoute
                ? `relative flex-1 overflow-y-auto ${
                    isDemoUiRoute ? "p-3 md:p-4" : showMobileAppChrome ? "px-3 pb-6 pt-20" : "p-6"
                  }`
                : "relative flex-1"
            }
          >
            {showAppTourChrome ? (
              <>
                {/* Tour overlay (app only, multi-page) */}
                <TourOverlay />

                {/* Global Tour launcher (app only) */}
                <div className="fixed bottom-6 right-6 z-[1000]" data-tour="tour-launcher">
                  <TourLauncherIcon />
                </div>
              </>
            ) : null}

            {children}
            {!isAppRoute ? <CookieConsentBanner /> : null}
          </div>
        </div>
      </SupabaseContext.Provider>
    </TourProvider>
  );
}
