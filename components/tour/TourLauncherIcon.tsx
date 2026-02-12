"use client";

import { useState } from "react";
import { useTour } from "./Tour-Provider";
import { HelpCircle, RotateCcw, ChevronUp } from "lucide-react";

export function TourLauncherIcon() {
  const { startTourForCurrentPage, resetTour } = useTour();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* MAIN ACTION: Resume tour */}
      <button
        type="button"
        onClick={() => {
          // Default behaviour: resume tour at current page / last step
          startTourForCurrentPage({ forceFullTour: false });
        }}
        onContextMenu={(e) => {
          // Right-click opens advanced menu
          e.preventDefault();
          setOpen(true);
        }}
        className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-black/10 bg-white hover:bg-black/[0.04] shadow-sm"
        aria-label="Tour fortsetzen"
        title="Tour fortsetzen"
      >
        <HelpCircle className="h-5 w-5 text-black/80" />
      </button>

      {/* OPTIONAL: Advanced actions */}
      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-64 rounded-xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden z-50">
          <div className="px-4 py-2 text-xs font-medium text-black/50 flex items-center gap-2">
            <ChevronUp className="h-3 w-3" />
            Tour Optionen
          </div>

          <button
            className="w-full text-left px-4 py-3 text-sm hover:bg-black/[0.03]"
            onClick={() => {
              setOpen(false);
              startTourForCurrentPage({ forceFullTour: false });
            }}
          >
            Tour fortsetzen (diese Seite)
          </button>

          <button
            className="w-full text-left px-4 py-3 text-sm hover:bg-black/[0.03]"
            onClick={() => {
              setOpen(false);
              startTourForCurrentPage({ forceFullTour: true });
            }}
          >
            Gesamte Tour neu starten
          </button>

          <div className="h-px bg-black/5" />

          <button
            className="w-full text-left px-4 py-3 text-sm hover:bg-black/[0.03] inline-flex items-center gap-2 text-black/70"
            onClick={() => {
              setOpen(false);
              resetTour("dashboard");
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Tour zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
}
