"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { trackPublicEvent } from "@/lib/funnel/public-track";
import BrandLogo from "@/components/brand/BrandLogo";
import { MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

const primaryNavLinks = [
  { label: "Produkt", href: "/produkt" },
  { label: "Branchen", href: "/branchen" },
  { label: "So funktioniert's", href: "/so-funktionierts" },
  { label: "Sicherheit", href: "/sicherheit" },
  { label: "Preise", href: "/preise" },
];

const secondaryNavLinks = [
  { label: "Einwände", href: "/einwaende" },
  { label: "Trust-Hub", href: "/trust" },
  { label: "FAQ", href: "/faq" },
];

export default function MarketingNavbar() {
  const [open, setOpen] = useState(false);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
    setSecondaryOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const secondaryActive = useMemo(
    () =>
      secondaryNavLinks.some(
        (link) => pathname === link.href || pathname?.startsWith(`${link.href}/`),
      ),
    [pathname],
  );

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
    <header
      className="sticky top-0 z-50 h-[72px] border-b border-[var(--border)] bg-white/70 backdrop-blur-md"
      data-tour="marketing-navbar"
    >
      <Container className="flex h-full items-center justify-between">
        <Link href="/" className="focus-ring">
          <BrandLogo size="md" withIcon={false} />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {primaryNavLinks.map((link) => {
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

          <div className="relative" data-tour="marketing-nav-secondary">
            <button
              type="button"
              onClick={() => setSecondaryOpen((prev) => !prev)}
              className={`focus-ring relative text-sm font-medium transition-colors ${
                secondaryActive
                  ? "text-[var(--text)]"
                  : "text-[var(--text)]/85 hover:text-[var(--text)]"
              }`}
              aria-expanded={secondaryOpen}
              aria-haspopup="menu"
              data-tour="marketing-nav-secondary-toggle"
            >
              Mehr
              <span
                className={`absolute -bottom-2 left-0 h-[2px] rounded-full bg-[var(--gold)] transition-all ${
                  secondaryActive ? "w-full opacity-100" : "w-0 opacity-0"
                }`}
              />
            </button>

            {secondaryOpen ? (
              <div
                className="absolute right-0 top-full mt-4 w-56 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
                data-tour="marketing-nav-secondary-panel"
              >
                <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Vertiefung
                </div>
                <div className="space-y-1">
                  {secondaryNavLinks.map((link) => {
                    const isActive =
                      pathname === link.href || pathname?.startsWith(`${link.href}/`);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                          trackNav("marketing_nav_click", link.href, "desktop");
                          setSecondaryOpen(false);
                        }}
                        className={`focus-ring block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
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
                </div>
              </div>
            ) : null}
          </div>
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
            {MARKETING_PRIMARY_CTA_LABEL}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text)] lg:hidden"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          data-tour="marketing-nav-toggle"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {open ? (
        <div
          className="fixed inset-x-0 bottom-0 top-[72px] z-40 bg-[rgba(15,23,42,0.16)] lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="motion-enter-drawer-down h-full overflow-y-auto border-t border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,248,240,0.96))]"
            data-tour="marketing-nav-mobile-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <Container className="flex min-h-full flex-col py-5">
              <article className="card-base p-5">
                <p className="label">Mobiler Einstieg</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--text)]">
                  Erst verstehen, dann kontrolliert testen
                </h2>
                <p className="helper mt-2">
                  Starten Sie mit Produktverständnis und Guardrails oder gehen Sie direkt in die 14-tägige Testphase.
                </p>
                <div className="mt-4 grid gap-3">
                  <Link
                    href="/signup"
                    onClick={() => {
                      trackNav("marketing_nav_signup_click", "/signup", "mobile");
                      setOpen(false);
                    }}
                    className="btn-primary w-full"
                  >
                    {MARKETING_PRIMARY_CTA_LABEL}
                  </Link>
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
                </div>
              </article>

              <nav className="mt-4 grid gap-3 sm:grid-cols-2" data-tour="marketing-nav-mobile-primary">
                {primaryNavLinks.map((link, index) => {
                  const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => {
                        trackNav("marketing_nav_click", link.href, "mobile");
                        setOpen(false);
                      }}
                      className={`focus-ring rounded-2xl border px-4 py-4 text-left transition-colors ${
                        isActive
                          ? "border-[var(--gold-soft)] bg-white text-[var(--text)] shadow-[var(--shadow-sm)]"
                          : "border-[var(--border)] bg-white/80 text-[var(--text)] hover:bg-white"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                        0{index + 1}
                      </span>
                      <span className="mt-2 block text-sm font-semibold">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div
                className="mt-4 rounded-2xl border border-[var(--border)] bg-white/85 p-4"
                data-tour="marketing-nav-mobile-secondary"
              >
                <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Vertiefung
                </div>
                <nav className="mt-3 flex flex-col gap-2">
                  {secondaryNavLinks.map((link) => {
                    const isActive =
                      pathname === link.href || pathname?.startsWith(`${link.href}/`);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                          trackNav("marketing_nav_click", link.href, "mobile");
                          setOpen(false);
                        }}
                        className={`focus-ring rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
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
              </div>
            </Container>
          </div>
        </div>
      ) : null}
    </header>
  );
}
