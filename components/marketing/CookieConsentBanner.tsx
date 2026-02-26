"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { readCookieConsent, writeCookieConsent } from "@/lib/marketing/cookie-consent";

const HIDE_PREFIXES = ["/app"];

export default function CookieConsentBanner() {
  const pathname = usePathname();
  const isHiddenRoute = useMemo(
    () => HIDE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
    [pathname],
  );

  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSavedConsent, setHasSavedConsent] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const existing = readCookieConsent();
    if (!existing) {
      setIsOpen(true);
      return;
    }
    setAnalytics(existing.analytics);
    setMarketing(existing.marketing);
    setHasSavedConsent(true);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const onConsentChanged = () => {
      const next = readCookieConsent();
      if (!next) return;
      setAnalytics(!!next.analytics);
      setMarketing(!!next.marketing);
      setHasSavedConsent(true);
    };
    window.addEventListener("advaic:cookie-consent-changed", onConsentChanged as EventListener);
    return () => window.removeEventListener("advaic:cookie-consent-changed", onConsentChanged as EventListener);
  }, []);

  if (!hydrated || isHiddenRoute) return null;

  const save = (nextAnalytics: boolean, nextMarketing: boolean) => {
    writeCookieConsent({ analytics: nextAnalytics, marketing: nextMarketing });
    setAnalytics(nextAnalytics);
    setMarketing(nextMarketing);
    setHasSavedConsent(true);
    setIsOpen(false);
    setShowDetails(false);
  };

  return (
    <>
      {hasSavedConsent ? (
        <button
          type="button"
          onClick={() => {
            setShowDetails(true);
            setIsOpen(true);
          }}
          className="focus-ring fixed bottom-5 left-5 z-[90] rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-medium text-[var(--muted)] shadow-[var(--shadow-sm)] transition hover:border-[rgba(11,15,23,.18)] hover:text-[var(--text)]"
        >
          Cookie-Einstellungen
        </button>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--border)] bg-white/98 px-5 pb-5 pt-4 shadow-[0_-14px_32px_rgba(11,15,23,.12)] backdrop-blur">
          <div className="mx-auto w-full max-w-[1120px]">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-[70ch]">
                <h3 className="text-base font-semibold text-[var(--text)]">Cookie-Auswahl</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Wir verwenden notwendige Cookies für Login und Sicherheit. Optionale Cookies für Analyse und
                  Marketing nutzen wir nur mit deiner Einwilligung.
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Details findest du in{" "}
                  <Link className="underline underline-offset-4 hover:text-[var(--text)]" href="/cookie-und-storage">
                    Cookie & Storage
                  </Link>{" "}
                  und{" "}
                  <Link className="underline underline-offset-4 hover:text-[var(--text)]" href="/datenschutz">
                    Datenschutz
                  </Link>
                  .
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => save(false, false)} className="btn-secondary">
                  Nur notwendige
                </button>
                <button type="button" onClick={() => save(true, true)} className="btn-primary">
                  Alle akzeptieren
                </button>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="focus-ring text-sm font-medium text-[var(--text)] underline underline-offset-4"
                onClick={() => setShowDetails((prev) => !prev)}
              >
                {showDetails ? "Einstellungen ausblenden" : "Einstellungen anpassen"}
              </button>
            </div>

            {showDetails ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <article className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text)]">Notwendig (immer aktiv)</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    Für Authentifizierung, Sicherheit und technisch notwendige Funktionen.
                  </p>
                </article>
                <label className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">Analyse</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        Hilft uns zu verstehen, welche Seiten und Inhalte genutzt werden.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[var(--black)]"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                    />
                  </div>
                </label>
                <label className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">Marketing</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        Erlaubt kontextbezogene CTA-Varianten und Marketing-Auswertungen.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[var(--black)]"
                      checked={marketing}
                      onChange={(e) => setMarketing(e.target.checked)}
                    />
                  </div>
                </label>
              </div>
            ) : null}

            {showDetails ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => save(analytics, marketing)} className="btn-primary">
                  Auswahl speichern
                </button>
                <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">
                  Schließen
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
