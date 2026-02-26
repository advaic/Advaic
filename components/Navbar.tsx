"use client";

import Link from "next/link";
import NavbarLinks from "./NavbarLinks";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 shadow-[0_10px_36px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 focus-visible:rounded-md">
          <BrandLogo size="lg" withIcon />
        </Link>

        <div className="hidden lg:flex">
          <NavbarLinks />
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/login"
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-700 transition duration-200 hover:bg-white hover:text-slate-950"
          >
            Einloggen
          </Link>
          <Link
            href="/signup"
            className="btn-primary rounded-full px-6 py-2 text-sm font-semibold"
          >
            Kostenlos testen
          </Link>
        </div>

        <button
          className="rounded-lg p-1 text-slate-900 lg:hidden"
          type="button"
          aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {menuOpen && (
        <div className="block border-t border-slate-200/90 bg-white/95 px-6 pb-6 pt-4 shadow-[0_12px_32px_rgba(15,23,42,0.1)] lg:hidden">
          <NavbarLinks
            direction="vertical"
            onLinkClick={() => setMenuOpen(false)}
          />
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-6 block w-full rounded-full border border-slate-300 bg-white px-6 py-3 text-center font-medium text-slate-700 transition duration-200 hover:bg-slate-50 hover:text-slate-950"
          >
            Einloggen
          </Link>
          <Link
            href="/signup"
            onClick={() => setMenuOpen(false)}
            className="btn-primary mt-3 block w-full rounded-full px-6 py-3 text-center font-semibold"
          >
            Kostenlos testen
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
