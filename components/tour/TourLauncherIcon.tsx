"use client";

import { useEffect, useRef, useState } from "react";
import { useTour } from "./Tour-Provider";
import { HelpCircle, RotateCcw } from "lucide-react";

export function TourLauncherIcon() {
  const { startTourForCurrentPage, resumeTourForCurrentPage, resetTour } = useTour();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-black/10 bg-white hover:bg-black/[0.04] shadow-sm"
        aria-label="Produkt-Tour öffnen"
        title="Produkt-Tour öffnen"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <HelpCircle className="h-5 w-5 text-black/80" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-50 mb-2 w-72 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
        >
          <div className="border-b border-black/5 px-4 py-3">
            <p className="text-sm font-semibold text-black">Produkt-Tour</p>
            <p className="mt-1 text-xs text-black/60">
              Wähle zwischen einer kurzen Kompakt-Tour und der vollständigen Tour.
            </p>
          </div>

          <div className="border-b border-black/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-black/45">
            Kompakt (45-60 Sek.)
          </div>

          <button
            role="menuitem"
            className="w-full px-4 py-3 text-left text-sm hover:bg-black/[0.03]"
            onClick={() => {
              setOpen(false);
              resumeTourForCurrentPage({ forceFullTour: false, variant: "compact" });
            }}
          >
            Kompakt-Tour fortsetzen
          </button>

          <button
            role="menuitem"
            className="w-full px-4 py-3 text-left text-sm hover:bg-black/[0.03]"
            onClick={() => {
              setOpen(false);
              startTourForCurrentPage({ forceFullTour: true, variant: "compact" });
            }}
          >
            Kompakt-Tour neu starten
          </button>

          <div className="border-b border-black/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-black/45">
            Vollständig
          </div>

          <button
            role="menuitem"
            className="w-full px-4 py-3 text-left text-sm hover:bg-black/[0.03]"
            onClick={() => {
              setOpen(false);
              resumeTourForCurrentPage({ forceFullTour: false, variant: "full" });
            }}
          >
            Tour fortsetzen
          </button>

          <button
            role="menuitem"
            className="w-full px-4 py-3 text-left text-sm hover:bg-black/[0.03]"
            onClick={() => {
              setOpen(false);
              startTourForCurrentPage({ forceFullTour: true, variant: "full" });
            }}
          >
            Gesamte Tour neu starten
          </button>

          <div className="h-px bg-black/5" />

          <button
            role="menuitem"
            className="inline-flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-black/70 hover:bg-black/[0.03]"
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
