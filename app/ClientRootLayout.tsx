"use client";

import Link from "next/link";
import { useState, useEffect, createContext } from "react";
import { usePathname } from "next/navigation";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "@/types/supabase";
import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  Archive,
  Bell,
  Building2,
  CircleUserRound,
  CreditCard,
  FileText,
  House,
  Menu,
  MessageSquareMore,
  Mic2,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
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

type AppChromeMeta = {
  section: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const APP_CHROME_ROUTES: Array<{
  matches: (pathname: string) => boolean;
  meta: AppChromeMeta;
}> = [
  {
    matches: (pathname) => pathname === "/app" || pathname === "/app/startseite",
    meta: {
      section: "Heute",
      title: "Startseite",
      description: "Systemstatus, Prioritäten und nächste Schritte auf einen Blick.",
      icon: House,
    },
  },
  {
    matches: (pathname) => pathname === "/app/nachrichten",
    meta: {
      section: "Kommunikation",
      title: "Nachrichten",
      description: "Filtere, priorisiere und bearbeite Gespräche ohne Layout-Brüche.",
      icon: MessageSquareMore,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/nachrichten/"),
    meta: {
      section: "Kommunikation",
      title: "Konversation",
      description: "Thread, Kontext und Antwortfläche bleiben in einem stabilen Arbeitsrahmen.",
      icon: MessageSquareMore,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/eskalationen"),
    meta: {
      section: "Kommunikation",
      title: "Eskalationen",
      description: "Kritische Fälle mit klarer Priorität und nachvollziehbarem Kontext bearbeiten.",
      icon: ShieldAlert,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/zur-freigabe"),
    meta: {
      section: "Kommunikation",
      title: "Zur Freigabe",
      description: "Entwürfe sicher prüfen, anpassen und mit minimaler Reibung freigeben.",
      icon: ShieldCheck,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/follow-ups"),
    meta: {
      section: "Kommunikation",
      title: "Follow-ups",
      description: "Geplante Nachfasslogik und Versandzustände in einem eigenen Arbeitsbereich.",
      icon: AlarmClock,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/immobilien"),
    meta: {
      section: "System",
      title: "Immobilien",
      description: "Bestände, Objektkontext und Zuordnungen in einem konsistenten Rahmen pflegen.",
      icon: Building2,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/archiv"),
    meta: {
      section: "System",
      title: "Archiv",
      description: "Abgeschlossene Kommunikation bleibt zugänglich, ohne die aktive Arbeit zu stören.",
      icon: Archive,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/antwortvorlagen"),
    meta: {
      section: "Einstellungen",
      title: "Antwortvorlagen",
      description: "Wiederverwendbare Antworten zentral pflegen und konsistent ausspielen.",
      icon: FileText,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/ton-und-stil"),
    meta: {
      section: "Einstellungen",
      title: "Ton & Stil",
      description: "Tonlage, Sprachmuster und Guardrails an einem Ort abstimmen.",
      icon: Mic2,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/benachrichtigungen"),
    meta: {
      section: "Einstellungen",
      title: "Benachrichtigungen",
      description: "Kanäle, Warnungen und Arbeitsunterbrechungen bewusst steuern.",
      icon: Bell,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/konto/abo"),
    meta: {
      section: "Einstellungen",
      title: "Abo & Zahlungen",
      description: "Planstatus, Trial-Gates und Freischaltungen transparent im Blick behalten.",
      icon: CreditCard,
    },
  },
  {
    matches: (pathname) => pathname.startsWith("/app/konto"),
    meta: {
      section: "Einstellungen",
      title: "Konto",
      description: "Zugang, Abo und persönliche Einstellungen in einem klaren Rahmen verwalten.",
      icon: CircleUserRound,
    },
  },
];

function getAppChromeMeta(pathname: string): AppChromeMeta {
  const matched = APP_CHROME_ROUTES.find((route) => route.matches(pathname));
  if (matched) return matched.meta;

  return {
    section: "Advaic App",
    title: "Arbeitsfläche",
    description: "Jede Kernfunktion liegt in einem stabilen App-Rahmen mit klarer Orientierung.",
    icon: Settings2,
  };
}

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
  const showDesktopAppChrome = showAppSidebar && !isMobileViewport;
  const showSkipLink = !isAppRoute;
  const appChromeMeta = isAppRoute ? getAppChromeMeta(pathname) : null;
  const AppChromeIcon = appChromeMeta?.icon ?? Settings2;

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
            <header
              className="fixed inset-x-0 top-0 z-[1050] border-b app-shell-header motion-enter-drawer-down backdrop-blur md:hidden"
              data-tour="app-mobile-header"
            >
              <div className="flex min-h-[72px] items-center gap-3 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen((prev) => !prev)}
                  className="app-focusable inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-800 focus-visible:outline-none"
                  aria-label={mobileSidebarOpen ? "Navigation schließen" : "Navigation öffnen"}
                  aria-expanded={mobileSidebarOpen}
                  data-tour="app-mobile-nav-toggle"
                >
                  {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div className="min-w-0 flex-1" data-tour="app-mobile-header-context">
                  <div
                    className="app-text-meta-label truncate uppercase tracking-[0.08em] text-gray-500"
                    data-tour="app-mobile-header-section"
                  >
                    {appChromeMeta?.section}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <AppChromeIcon className="h-4 w-4 shrink-0 text-gray-700" strokeWidth={1.9} />
                    <div
                      className="truncate text-sm font-semibold text-gray-900"
                      data-tour="app-mobile-header-title"
                    >
                      {appChromeMeta?.title}
                    </div>
                  </div>
                </div>
                <Link href="/app/startseite" className="app-focusable rounded-lg text-gray-800">
                  <BrandLogo size="sm" withIcon={false} />
                </Link>
              </div>
            </header>
          ) : null}

          {showMobileAppChrome && mobileSidebarOpen ? (
            <div className="fixed inset-0 z-[1100] md:hidden" aria-modal="true" role="dialog">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="app-focusable absolute inset-0 bg-black/35 focus-visible:outline-none"
                aria-label="Navigation schließen"
              />
              <div className="motion-enter-drawer-right absolute inset-y-0 left-0 w-[88vw] max-w-[340px] bg-white shadow-[0_20px_60px_rgba(11,15,23,.28)]">
                <Sidebar variant="mobile" onNavigate={() => setMobileSidebarOpen(false)} />
              </div>
            </div>
          ) : null}
          <div
            id="main-content"
            className={
              isAppRoute
                ? `relative flex-1 overflow-y-auto app-shell ${
                    isDemoUiRoute ? "p-3 md:p-4" : showMobileAppChrome ? "px-3 pb-6 pt-20" : "pb-6"
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

            {showDesktopAppChrome && appChromeMeta ? (
              <div className="motion-enter border-b app-shell-header" data-tour="app-chrome-bar">
                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0 flex items-start gap-4">
                    <div className="mt-0.5 hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border app-surface-panel text-gray-900 md:flex">
                      <AppChromeIcon className="h-5 w-5" strokeWidth={1.9} />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="app-text-meta-label uppercase tracking-[0.08em] text-gray-500"
                        data-tour="app-chrome-section"
                      >
                        {appChromeMeta.section}
                      </div>
                      <div
                        className="app-text-section-title mt-0.5 text-gray-900"
                        data-tour="app-chrome-title"
                      >
                        {appChromeMeta.title}
                      </div>
                      <div
                        className="app-text-helper mt-1 max-w-3xl"
                        data-tour="app-chrome-description"
                      >
                        {appChromeMeta.description}
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/app/startseite"
                    className="app-focusable hidden rounded-xl border app-surface-panel px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 lg:inline-flex"
                  >
                    <BrandLogo size="sm" withIcon={false} />
                  </Link>
                </div>
              </div>
            ) : null}

            <div className={showDesktopAppChrome ? "px-6 pt-4" : ""}>
              {children}
            </div>
            {!isAppRoute ? <CookieConsentBanner /> : null}
          </div>
        </div>
      </SupabaseContext.Provider>
    </TourProvider>
  );
}
