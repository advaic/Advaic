"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { trackPublicEvent } from "@/lib/funnel/public-track";
import BrandLogo from "@/components/brand/BrandLogo";

const navLinks = [
  { label: "Produkt", href: "/produkt" },
  { label: "Branchen", href: "/branchen" },
  { label: "So funktioniert's", href: "/so-funktionierts" },
  { label: "Sicherheit", href: "/sicherheit" },
  { label: "Trust", href: "/trust" },
  { label: "Preise", href: "/preise" },
  { label: "FAQ", href: "/faq" },
];

export default function MarketingNavbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const trackNav = (event: string, destination: string, area: "desktop" | "mobile") => {
    void trackPublicEvent({
      event,
      source: "website",
      pageGroup: "marketing",
      meta: {
        section: "navbar",
        area,
        current_path: pathname || "/",
        destination,
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 h-[72px] border-b border-[var(--border)] bg-white/70 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between">
        <Link href="/" className="focus-ring">
          <BrandLogo size="md" withIcon={false} />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => trackNav("marketing_nav_click", link.href, "desktop")}
                className={`focus-ring relative text-sm font-medium transition-colors ${
                  isActive ? "text-[var(--text)]" : "text-[var(--text)]/85 hover:text-[var(--text)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
                <span
                  className={`absolute -bottom-2 left-0 h-[2px] rounded-full bg-[var(--gold)] transition-all ${
                    isActive ? "w-full opacity-100" : "w-0 opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="btn-secondary"
            onClick={() => trackNav("marketing_nav_login_click", "/login", "desktop")}
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="btn-primary"
            onClick={() => trackNav("marketing_nav_signup_click", "/signup", "desktop")}
          >
            14 Tage testen
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="focus-ring rounded-lg border border-[var(--border)] p-2 text-[var(--text)] lg:hidden"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {open ? (
        <div className="border-t border-[var(--border)] bg-white/95 lg:hidden">
          <Container className="py-4">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      trackNav("marketing_nav_click", link.href, "mobile");
                      setOpen(false);
                    }}
                    className={`focus-ring rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--surface)] text-[var(--text)] ring-1 ring-[var(--gold-soft)]"
                        : "text-[var(--text)]/85 hover:bg-[var(--surface)] hover:text-[var(--text)]"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 grid gap-3">
              <Link
                href="/login"
                onClick={() => {
                  trackNav("marketing_nav_login_click", "/login", "mobile");
                  setOpen(false);
                }}
                className="btn-secondary w-full"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => {
                  trackNav("marketing_nav_signup_click", "/signup", "mobile");
                  setOpen(false);
                }}
                className="btn-primary w-full"
              >
                14 Tage testen
              </Link>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
