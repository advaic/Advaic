"use client";

import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import NavbarLinks from "./NavbarLinks";
import { Menu, X } from "lucide-react";
import { SupabaseContext } from "@/app/ClientRootLayout";
import { useState } from "react";

const Navbar = () => {
  const { supabase } = useContext(SupabaseContext);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogin = async () => {
    const email = prompt("Bitte geben Sie Ihre E-Mail-Adresse ein:");
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert("Login fehlgeschlagen: " + error.message);
    } else {
      alert("Ein Login-Link wurde an Ihre E-Mail gesendet.");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Advaic_Logo_Cropped.webp"
            alt="Advaic Logo"
            width={60}
            height={60}
            className="h-6 w-auto object-contain"
          />
        </Link>

        <div className="hidden lg:flex">
          <NavbarLinks />
        </div>

        <div className="hidden lg:block">
          <Link
            href="/login"
            className="ml-6 rounded-full bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
          >
            Login / Registrieren
          </Link>
        </div>

        <button
          className="lg:hidden text-black"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {menuOpen && (
        <div className="block lg:hidden border-t border-gray-200 bg-white px-6 pb-6 pt-4">
          <NavbarLinks
            direction="vertical"
            onLinkClick={() => setMenuOpen(false)}
          />
          <Link
            href="/login"
            className="mt-6 w-full rounded-full bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 transition text-center block"
          >
            Login / Registrieren
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
