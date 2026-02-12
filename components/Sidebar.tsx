"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";

const navSections = [
  {
    title: null,
    items: [{ label: "Startseite", path: "/app/startseite", icon: "🏠" }],
  },
  {
    title: "📨 Kommunikation",
    items: [
      { label: "Nachrichten", path: "/app/nachrichten", icon: "💬" },
      { label: "Eskalationen", path: "/app/eskalationen", icon: "🚨" },
      { label: "Zur Freigabe", path: "/app/zur-freigabe", icon: "🔁" },
      { label: "Follow-ups", path: "/app/follow-ups", icon: "⏳" },
    ],
  },
  {
    title: "📊 Überblick",
    items: [
      { label: "Immobilien", path: "/app/immobilien", icon: "🏡" },
      { label: "Archiv", path: "/app/archiv", icon: "📁" },
    ],
  },
  {
    title: "⚙️ Einstellungen",
    items: [
      { label: "Antwortvorlagen", path: "/app/antwortvorlagen", icon: "✉️" },
      { label: "Ton & Stil", path: "/app/ton-und-stil", icon: "🎙️" },
      {
        label: "Benachrichtigungen",
        path: "/app/benachrichtigungen",
        icon: "🔔",
      },
      { label: "Konto", path: "/app/konto", icon: "👤" },
    ],
  },
];

function tourKeyForPath(path: string) {
  // keep this deterministic + stable for tour targeting
  switch (path) {
    case "/app/startseite":
      return "nav-startseite";
    case "/app/nachrichten":
      return "nav-nachrichten";
    case "/app/eskalationen":
      return "nav-eskalationen";
    case "/app/zur-freigabe":
      return "nav-zur-freigabe";
    case "/app/follow-ups":
      return "nav-follow-ups";
    case "/app/immobilien":
      return "nav-immobilien";
    case "/app/archiv":
      return "nav-archiv";
    case "/app/antwortvorlagen":
      return "nav-antwortvorlagen";
    case "/app/ton-und-stil":
      return "nav-ton-und-stil";
    case "/app/benachrichtigungen":
      return "nav-benachrichtigungen";
    case "/app/konto":
      return "nav-konto";
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside
      className="h-screen w-64 bg-white border-r px-4 py-6 shadow-sm"
      data-tour="sidebar"
    >
      {/* Logo and logout */}
      <div className="mb-8 flex flex-col space-y-2">
        <div className="text-2xl font-bold text-gray-800">Advaic</div>
        <button
          onClick={handleLogout}
          data-tour="logout"
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      <nav className="space-y-6">
        {navSections.map((section, index) => (
          <div key={index}>
            {section.title && (
              <h3 className="text-xs uppercase text-gray-400 font-semibold px-2 mb-2 tracking-wide">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.path);
                const tourKey = tourKeyForPath(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive
                          ? "bg-gray-100 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      data-tour={tourKey ?? undefined}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
