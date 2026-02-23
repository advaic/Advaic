"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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

  const [autosendEnabled, setAutosendEnabled] = useState<boolean | null>(null);
  const [autosendBusy, setAutosendBusy] = useState(false);

  const autosendLabel = useMemo(() => {
    if (autosendEnabled === null) return "Lade…";
    return autosendEnabled ? "Auto-Senden aktiv" : "Auto-Senden pausiert";
  }, [autosendEnabled]);

  useEffect(() => {
    let cancelled = false;

    async function loadAutosend() {
      try {
        const res = await fetch("/api/agent/settings/autosend", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        const data = await res.json().catch(() => ({} as any));

        if (!res.ok) {
          // If not logged in or any other error, keep conservative default
          console.error("[sidebar] autosend GET failed", data);
          if (!cancelled) setAutosendEnabled(false);
          return;
        }

        const enabled = data?.settings?.autosend_enabled;
        if (!cancelled) setAutosendEnabled(typeof enabled === "boolean" ? enabled : false);
      } catch (e: any) {
        console.error("[sidebar] load autosend error", e);
        if (!cancelled) setAutosendEnabled(false);
      }
    }

    loadAutosend();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleAutosend = async () => {
    if (autosendEnabled === null) return;
    if (autosendBusy) return;

    const prev = autosendEnabled;
    const next = !prev;

    setAutosendBusy(true);
    setAutosendEnabled(next); // optimistic

    try {
      const res = await fetch("/api/agent/settings/autosend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autosend_enabled: next }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        throw new Error(String(data?.error || "Failed to update autosend"));
      }

      const saved = data?.settings?.autosend_enabled;
      setAutosendEnabled(typeof saved === "boolean" ? saved : next);

      toast.success(
        (typeof saved === "boolean" ? saved : next)
          ? "Auto-Senden aktiviert."
          : "Auto-Senden pausiert."
      );
    } catch (e: any) {
      console.error("[sidebar] toggle autosend failed", e);
      setAutosendEnabled(prev); // rollback
      toast.error(e?.message ?? "Konnte Auto-Senden nicht ändern.");
    } finally {
      setAutosendBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST" });
    } catch {}
    router.push("/");
    router.refresh();
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

      {/* Autosend toggle */}
      <div
        className="mb-6 rounded-2xl border border-gray-200 bg-[#fbfbfc] p-3"
        data-tour="sidebar-autosend"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-500">Automatik</div>
            <div className="mt-0.5 text-sm font-medium text-gray-900 truncate">
              {autosendLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={toggleAutosend}
            disabled={autosendEnabled === null || autosendBusy}
            aria-pressed={!!autosendEnabled}
            className={`relative inline-flex h-7 w-12 items-center rounded-full border transition disabled:opacity-60 disabled:cursor-not-allowed ${
              autosendEnabled
                ? "bg-gray-900 border-gray-900"
                : "bg-white border-gray-300"
            }`}
            title={autosendEnabled ? "Auto-Senden pausieren" : "Auto-Senden aktivieren"}
            data-tour="sidebar-autosend-toggle"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full transition ${
                autosendEnabled ? "translate-x-6 bg-amber-200" : "translate-x-1 bg-gray-200"
              }`}
            />
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Stoppt/aktiviert das automatische Versenden. Entwürfe landen bei Bedarf weiterhin in „Zur Freigabe“.
        </div>
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
