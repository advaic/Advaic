"use client";

import { useState, useEffect, createContext } from "react";
import { usePathname } from "next/navigation";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "@/types/supabase";
import Sidebar from "@/components/Sidebar";
import { TourProvider } from "@/components/tour/Tour-Provider";
import TourOverlay from "@/components/tour/Tour-Overlay";
import { TourLauncherIcon } from "@/components/tour/TourLauncherIcon";

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
  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
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
        <div className={isAppRoute ? "flex h-screen" : "min-h-screen"}>
          {isAppRoute ? <Sidebar /> : null}
          <div
            id="main-content"
            className={isAppRoute ? "flex-1 p-6 overflow-y-auto relative" : "relative flex-1"}
          >
            {/* Tour overlay (global, multi-page) */}
            <TourOverlay />

            {children}

            {/* Global Tour launcher (always available) */}
            <div className="fixed bottom-6 right-6 z-[1000]">
              <TourLauncherIcon />
            </div>
          </div>
        </div>
      </SupabaseContext.Provider>
    </TourProvider>
  );
}
