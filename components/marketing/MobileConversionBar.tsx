"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { trackPublicEvent } from "@/lib/funnel/public-track";

type MobileBarConfig = {
  context: string;
  pageType: string;
  section: string | null;
  title: string;
  subtitle: string;
  note?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

const HIDE_PREFIXES = [
  "/app",
  "/login",
  "/signup",
  "/impressum",
  "/datenschutz",
  "/cookie-und-storage",
  "/nutzungsbedingungen",
];

function shouldHide(pathname: string) {
  return HIDE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function classifyPageType(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/produkt")) return "produkt";
  if (pathname.startsWith("/so-funktionierts")) return "prozess";
  if (pathname.startsWith("/autopilot") || pathname.startsWith("/autopilot-regeln")) return "regeln";
  if (pathname.startsWith("/preise")) return "preise";
  if (pathname.startsWith("/faq")) return "faq";
  if (pathname.startsWith("/sicherheit") || pathname.startsWith("/dsgvo-email-autopilot")) return "sicherheit";
  if (pathname.startsWith("/manuell-vs-advaic")) return "vergleich";
  if (pathname.startsWith("/use-cases") || pathname.startsWith("/branchen")) return "use-cases";
  if (pathname.startsWith("/trust")) return "trust";
  return "default";
}

function sectionsForPath(pathname: string): string[] {
  if (pathname === "/") {
    return ["problem", "how", "rules", "quality", "pricing", "cta"];
  }
  if (pathname.startsWith("/produkt")) {
    return ["was", "ablauf", "regeln", "qualitaet", "freigabe", "sicherheit", "setup", "followups", "faq", "cta"];
  }
  if (pathname.startsWith("/so-funktionierts")) {
    return ["prozess-details", "prozess-quellen", "cta"];
  }
  return [];
}

const SECTION_LABELS: Record<string, string> = {
  problem: "Problem",
  how: "Ablauf",
  rules: "Regeln",
  quality: "Checks",
  pricing: "Preise",
  cta: "Abschluss",
  was: "Leistung",
  ablauf: "Tour",
  regeln: "Regeln",
  qualitaet: "Qualität",
  freigabe: "Freigabe",
  sicherheit: "Sicherheit",
  setup: "Setup",
  followups: "Follow-ups",
  faq: "FAQ",
};

function getSectionLabel(section: string | null): string | null {
  if (!section) return null;
  return SECTION_LABELS[section] || null;
}

function getConfig(pathname: string, activeSection: string | null): MobileBarConfig {
  const pageType = classifyPageType(pathname);

  if (pageType === "preise") {
    return {
      context: "preise",
      pageType,
      section: activeSection,
      title: "Starter in 14 Tagen testen",
      subtitle: "Ohne Risiko starten, dann monatlich weiter.",
      note: "Kündbar · pausierbar · klare Freigabelogik",
      primaryLabel: "Jetzt testen",
      primaryHref: "/signup?entry=mobile-preise",
      secondaryLabel: "Preisdetails",
      secondaryHref: "/preise",
    };
  }

  if (pageType === "sicherheit") {
    return {
      context: "sicherheit",
      pageType,
      section: activeSection,
      title: "Sicher starten mit Guardrails",
      subtitle: "Unklare Fälle bleiben in Ihrer Freigabe.",
      note: "Fail-Safe aktiv: im Zweifel kein Auto-Versand",
      primaryLabel: "Sicher testen",
      primaryHref: "/signup?entry=mobile-sicherheit",
      secondaryLabel: "Regeln ansehen",
      secondaryHref: "/autopilot-regeln",
    };
  }

  if (pageType === "vergleich") {
    return {
      context: "vergleich",
      pageType,
      section: activeSection,
      title: "Direkt mit Safe-Start testen",
      subtitle: "Konservativ beginnen und kontrolliert ausbauen.",
      note: "Erst Freigabe stabilisieren, dann Automatisierungsgrad erhöhen",
      primaryLabel: "Test starten",
      primaryHref: "/signup?entry=mobile-vergleich",
      secondaryLabel: "Konfiguration",
      secondaryHref: "/produkt#safe-start-konfiguration",
    };
  }

  if (pageType === "faq") {
    return {
      context: "faq",
      pageType,
      section: activeSection,
      title: "Fragen geklärt? Dann live testen",
      subtitle: "14 Tage Testphase mit klarer Freigabelogik.",
      note: "Sie behalten die finale Entscheidung in heiklen Fällen",
      primaryLabel: "14 Tage testen",
      primaryHref: "/signup?entry=mobile-faq",
      secondaryLabel: "Trust Center",
      secondaryHref: "/trust",
    };
  }

  if (pageType === "prozess") {
    if (activeSection === "prozess-details") {
      return {
        context: "prozess-details",
        pageType,
        section: activeSection,
        title: "Ablauf passt zu Ihrem Alltag?",
        subtitle: "Dann starten Sie mit konservativer Auto/Freigabe-Logik.",
        note: "Standardfälle automatisch, Unklares kontrolliert per Freigabe",
        primaryLabel: "Mit Prozess testen",
        primaryHref: "/signup?entry=mobile-prozess-details",
        secondaryLabel: "Safe-Start",
        secondaryHref: "/produkt#safe-start-konfiguration",
      };
    }

    return {
      context: "prozess-default",
      pageType,
      section: activeSection,
      title: "Mechanik verstanden? Jetzt live testen",
      subtitle: "Erkennen, Schreiben, Senden mit klaren Guardrails.",
      note: "Vor Auto-Versand laufen Qualitätschecks und Risikoprüfungen",
      primaryLabel: "14 Tage testen",
      primaryHref: "/signup?entry=mobile-prozess-default",
      secondaryLabel: "Regeln im Detail",
      secondaryHref: "/autopilot-regeln",
    };
  }

  if (pageType === "regeln") {
    return {
      context: "regeln",
      pageType,
      section: activeSection,
      title: "Regellogik überzeugt?",
      subtitle: "Dann starten Sie kontrolliert mit hoher Freigabequote.",
      note: "Im Zweifel stoppt das System und legt zur Freigabe vor",
      primaryLabel: "Regelbasiert testen",
      primaryHref: "/signup?entry=mobile-regeln",
      secondaryLabel: "Qualitätschecks",
      secondaryHref: "/qualitaetschecks",
    };
  }

  if (pageType === "produkt") {
    if (activeSection === "was" || activeSection === "ablauf") {
      return {
        context: "produkt-mechanik",
        pageType,
        section: activeSection,
        title: "Mechanik klar? Nächster Schritt",
        subtitle: "Teste die Entscheidungslinie im Praxis-Simulator.",
        note: "Sie sehen live, wann Auto, Freigabe oder Ignorieren greift",
        primaryLabel: "Jetzt testen",
        primaryHref: "/signup?entry=mobile-produkt-mechanik",
        secondaryLabel: "Simulator öffnen",
        secondaryHref: "/produkt#simulator",
      };
    }

    if (activeSection === "regeln" || activeSection === "qualitaet" || activeSection === "freigabe") {
      return {
        context: "produkt-sicherheit",
        pageType,
        section: activeSection,
        title: "Regeln und Checks passen?",
        subtitle: "Dann starten Sie kontrolliert mit Freigabe-Guardrails.",
        note: "Kritische Fälle bleiben bei Ihnen, nicht beim Autopilot",
        primaryLabel: "Sicher starten",
        primaryHref: "/signup?entry=mobile-produkt-sicherheit",
        secondaryLabel: "Trust Center",
        secondaryHref: "/trust",
      };
    }

    if (activeSection === "setup" || activeSection === "followups") {
      return {
        context: "produkt-setup",
        pageType,
        section: activeSection,
        title: "Ready für den Safe-Start?",
        subtitle: "Lassen Sie Auto/Freigabe/Follow-ups passend vorkonfigurieren.",
        note: "Schrittweise aktivieren statt sofort vollautomatisch starten",
        primaryLabel: "Konfiguration testen",
        primaryHref: "/signup?entry=mobile-produkt-setup",
        secondaryLabel: "Safe-Start öffnen",
        secondaryHref: "/produkt#safe-start-konfiguration",
      };
    }

    return {
      context: "produkt-default",
      pageType,
      section: activeSection,
      title: "Produkt verstanden? Jetzt live testen",
      subtitle: "14 Tage Testphase mit vollständigem Sicherheitsnetz.",
      note: "Auto-Versand nur bei klaren Standardfällen",
      primaryLabel: "Jetzt testen",
      primaryHref: "/signup?entry=mobile-produkt-default",
      secondaryLabel: "Prozess ansehen",
      secondaryHref: "/produkt#ablauf",
    };
  }

  if (pageType === "home") {
    if (activeSection === "problem" || activeSection === "how") {
      return {
        context: "home-fit",
        pageType,
        section: activeSection,
        title: "Ist das Ihr Hauptproblem?",
        subtitle: "Dann prüfen Sie den Praxisvergleich und starten konservativ.",
        note: "Mehr Antwortgeschwindigkeit ohne Kontrollverlust",
        primaryLabel: "14 Tage testen",
        primaryHref: "/signup?entry=mobile-home-fit",
        secondaryLabel: "Manuell vs. Advaic",
        secondaryHref: "/manuell-vs-advaic#vergleich",
      };
    }

    if (activeSection === "rules" || activeSection === "quality") {
      return {
        context: "home-sicherheit",
        pageType,
        section: activeSection,
        title: "Guardrails überzeugen?",
        subtitle: "Dann starten Sie mit konservativem Autopilot-Profil.",
        note: "Im Zweifel immer Freigabe statt riskanter Auto-Antwort",
        primaryLabel: "Sicher testen",
        primaryHref: "/signup?entry=mobile-home-sicherheit",
        secondaryLabel: "Regeln prüfen",
        secondaryHref: "/autopilot-regeln",
      };
    }

    if (activeSection === "pricing" || activeSection === "cta") {
      return {
        context: "home-entscheidung",
        pageType,
        section: activeSection,
        title: "Bereit für den Live-Test?",
        subtitle: "14 Tage testen, jederzeit pausierbar und kündbar.",
        note: "Starter bleibt steuerbar, auch bei höherem Anfragevolumen",
        primaryLabel: "14 Tage testen",
        primaryHref: "/signup?entry=mobile-home-entscheidung",
        secondaryLabel: "Preise ansehen",
        secondaryHref: "/preise",
      };
    }

    return {
      context: "home-default",
      pageType,
      section: activeSection,
      title: "Weniger Postfach, mehr Fokus",
      subtitle: "Advaic startet konservativ und bleibt kontrollierbar.",
      note: "Klare Guardrails für Auto, Freigabe und Ignorieren",
      primaryLabel: "14 Tage testen",
      primaryHref: "/signup?entry=mobile-home-default",
      secondaryLabel: "So funktioniert's",
      secondaryHref: "/so-funktionierts",
    };
  }

  if (pageType === "use-cases") {
    return {
      context: "use-cases",
      pageType,
      section: activeSection,
      title: "Passt Ihr Anwendungsfall?",
      subtitle: "Wählen Sie Safe-Start je nach Volumen und Risiko.",
      note: "Setup wird auf Miet-/Kauf-Fokus und Teamgröße abgestimmt",
      primaryLabel: "Use Case testen",
      primaryHref: "/signup?entry=mobile-use-cases",
      secondaryLabel: "Safe-Start",
      secondaryHref: "/produkt#safe-start-konfiguration",
    };
  }

  if (pageType === "trust") {
    return {
      context: "trust",
      pageType,
      section: activeSection,
      title: "Trust Center geprüft?",
      subtitle: "Dann testen Sie das Setup im eigenen Ablauf.",
      note: "Nachvollziehbarer Verlauf für jede Entscheidung",
      primaryLabel: "Mit Trust testen",
      primaryHref: "/signup?entry=mobile-trust",
      secondaryLabel: "Produkt ansehen",
      secondaryHref: "/produkt",
    };
  }

  return {
    context: "default",
    pageType,
    section: activeSection,
    title: "Weniger Postfach, mehr Fokus",
    subtitle: "Advaic startet konservativ und bleibt kontrollierbar.",
    note: "14 Tage Testphase · danach Starter · jederzeit kündbar",
    primaryLabel: "14 Tage testen",
    primaryHref: "/signup?entry=mobile-default",
    secondaryLabel: "So funktioniert's",
    secondaryHref: "/so-funktionierts",
  };
}

export default function MobileConversionBar() {
  const pathname = usePathname() || "/";
  const hidden = shouldHide(pathname);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const config = useMemo(() => getConfig(pathname, activeSection), [activeSection, pathname]);

  useEffect(() => {
    if (hidden) return;
    const sections = sectionsForPath(pathname);
    if (!sections.length) {
      setActiveSection(null);
      return;
    }

    const elements = sections
      .map((id) => ({ id, el: document.getElementById(id) }))
      .filter((item): item is { id: string; el: HTMLElement } => Boolean(item.el));

    if (!elements.length) {
      setActiveSection(null);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;

        const nextId = (visible[0].target as HTMLElement).id;
        setActiveSection((prev) => (prev === nextId ? prev : nextId));
      },
      {
        root: null,
        threshold: [0.3, 0.5, 0.7],
        rootMargin: "-20% 0px -40% 0px",
      },
    );

    elements.forEach((item) => observer.observe(item.el));
    return () => observer.disconnect();
  }, [hidden, pathname]);

  useEffect(() => {
    if (hidden) return;
    void trackPublicEvent({
      event: "marketing_mobile_bar_context_changed",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: {
        section: "mobile-conversion-bar",
        context: config.context,
        page_type: config.pageType,
        active_section: config.section,
      },
    });
  }, [config.context, config.pageType, config.section, hidden, pathname]);

  useEffect(() => {
    if (hidden) return;
    const key = `advaic_mobile_bar_seen:${pathname}:${config.context}`;
    try {
      const seen = window.sessionStorage.getItem(key);
      if (seen === "1") return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // no-op
    }

    void trackPublicEvent({
      event: "marketing_mobile_bar_impression",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: {
        section: "mobile-conversion-bar",
        context: config.context,
        page_type: config.pageType,
        active_section: config.section,
      },
    });
  }, [config.context, config.pageType, config.section, hidden, pathname]);

  if (hidden) return null;
  const activeSectionLabel = getSectionLabel(config.section);
  const note = config.note || "14 Tage Testphase · danach Starter · jederzeit kündbar";

  const onPrimaryClick = () =>
    trackPublicEvent({
      event: "marketing_mobile_bar_primary_click",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: {
        section: "mobile-conversion-bar",
        context: config.context,
        page_type: config.pageType,
        active_section: config.section,
        destination: config.primaryHref,
      },
    });

  const onSecondaryClick = () =>
    trackPublicEvent({
      event: "marketing_mobile_bar_secondary_click",
      source: "website",
      path: pathname,
      pageGroup: "marketing",
      meta: {
        section: "mobile-conversion-bar",
        context: config.context,
        page_type: config.pageType,
        active_section: config.section,
        destination: config.secondaryHref,
      },
    });

  return (
    <>
      <div className="h-40 sm:h-32 md:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-2xl border-t border-[var(--border)] bg-white/96 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.8rem)] shadow-[0_-14px_34px_rgba(11,15,23,0.12)] backdrop-blur-md md:hidden">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold leading-5 text-[var(--text)]">{config.title}</p>
            {activeSectionLabel ? (
              <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] ring-1 ring-[var(--gold-soft)]">
                {activeSectionLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{config.subtitle}</p>
          <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">{note}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href={config.primaryHref}
              className="btn-primary !h-11 !px-3 !text-sm"
              onClick={() => void onPrimaryClick()}
            >
              {config.primaryLabel}
            </Link>
            <Link
              href={config.secondaryHref}
              className="btn-secondary !h-11 !px-3 !text-sm"
              onClick={() => void onSecondaryClick()}
            >
              {config.secondaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
