"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPublicEvent } from "@/lib/funnel/public-track";
import { canUseCategory } from "@/lib/marketing/cookie-consent";
import { MARKETING_FLOW_CTA_LABEL, MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

type VariantKey = "tempo" | "sicherheit" | "kontrolle";

const VARIANTS: Record<
  VariantKey,
  {
    label: string;
    title: string;
    subtitle: string;
    bullets: string[];
    primary: string;
    secondary: string;
  }
> = {
  tempo: {
    label: "Fokus: Reaktionszeit",
    title: "Antwortzeiten senken, ohne problematische Nachrichten freizugeben",
    subtitle:
      "Wenn prüfbare Anfragen direkt beantwortet werden, sinkt die Reaktionszeit. Fehlen Angaben oder wird eine Nachricht riskant, greift die Freigabe.",
    bullets: ["Auto bei sauberem Objektbezug", "Freigabe bei fehlenden Angaben", "Qualitätschecks vor jedem Versand"],
    primary: MARKETING_PRIMARY_CTA_LABEL,
    secondary: MARKETING_FLOW_CTA_LABEL,
  },
  sicherheit: {
    label: "Fokus: Versandkontrolle",
    title: "Auto-Versand nur mit nachvollziehbaren Prüfregeln",
    subtitle:
      "Advaic sendet nur, wenn Empfänger, Objektbezug und Inhalt sauber geprüft werden können. Sonst bleibt die Entscheidung bei Ihrem Team.",
    bullets: ["Keine Auto-Antwort bei no-reply ohne Rückkanal", "Freigabe bei Risiko oder Lücken", "Statusverlauf pro Entscheidung"],
    primary: MARKETING_PRIMARY_CTA_LABEL,
    secondary: "Sicherheitsseite lesen",
  },
  kontrolle: {
    label: "Fokus: Steuerbarkeit",
    title: "Ihr Team entscheidet, welche Nachrichten automatisch rausgehen",
    subtitle:
      "Sie bestimmen Regeln, Ton und Freigabegrad. Advaic arbeitet innerhalb Ihrer Leitplanken und nicht darüber hinaus.",
    bullets: ["Regeln und Freigabegrenzen steuerbar", "Autopilot pausierbar", "Follow-ups mit Stop-Regeln"],
    primary: MARKETING_PRIMARY_CTA_LABEL,
    secondary: "Regeln ansehen",
  },
};

function normalizeVariant(value: string | null | undefined): VariantKey | null {
  if (value === "tempo" || value === "sicherheit" || value === "kontrolle") return value;
  return null;
}

function pickRandom(): VariantKey {
  const keys: VariantKey[] = ["tempo", "sicherheit", "kontrolle"];
  const idx = Math.floor(Math.random() * keys.length);
  return keys[Math.max(0, Math.min(keys.length - 1, idx))];
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const needle = `${name}=`;
  const parts = document.cookie.split(";").map((x) => x.trim());
  for (const part of parts) {
    if (part.startsWith(needle)) {
      return decodeURIComponent(part.slice(needle.length));
    }
  }
  return null;
}

function writeCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  if (!canUseCategory("analytics")) return;
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60));
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

type CTAExperimentProps = {
  id?: string;
};

export default function CTAExperiment({ id = "cta-variant" }: CTAExperimentProps) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [variant, setVariant] = useState<VariantKey>("tempo");

  useEffect(() => {
    const canPersistVariant = canUseCategory("analytics");
    const fromQuery = normalizeVariant(search.get("cta"));
    if (fromQuery) {
      setVariant(fromQuery);
      if (canPersistVariant) {
        writeCookie("advaic_cta_variant_v1", fromQuery, 30);
        try {
          localStorage.setItem("advaic_cta_variant_v1", fromQuery);
        } catch {}
      }
      return;
    }

    if (canPersistVariant) {
      const fromCookie = normalizeVariant(readCookie("advaic_cta_variant_v1"));
      if (fromCookie) {
        setVariant(fromCookie);
        try {
          localStorage.setItem("advaic_cta_variant_v1", fromCookie);
        } catch {}
        return;
      }
    }

    if (canPersistVariant) {
      try {
        const stored = normalizeVariant(localStorage.getItem("advaic_cta_variant_v1"));
        if (stored) {
          setVariant(stored);
          writeCookie("advaic_cta_variant_v1", stored, 30);
          return;
        }
      } catch {}
    }

    const fallback = pickRandom();
    setVariant(fallback);
    if (canPersistVariant) {
      writeCookie("advaic_cta_variant_v1", fallback, 30);
      try {
        localStorage.setItem("advaic_cta_variant_v1", fallback);
      } catch {}
    }
  }, [search]);

  useEffect(() => {
    void trackPublicEvent({
      event: "marketing_cta_variant_impression",
      source: "website",
      path: pathname || "/",
      pageGroup: "marketing",
      ctaVariant: variant,
      meta: { component: "CTAExperiment" },
    });
  }, [pathname, variant]);

  const content = useMemo(() => VARIANTS[variant], [variant]);

  const secondaryHref =
    variant === "tempo" ? "/so-funktionierts" : variant === "sicherheit" ? "/sicherheit" : "/autopilot-regeln";

  const handlePrimaryClick = () => {
    void trackPublicEvent({
      event: "marketing_cta_variant_primary_click",
      source: "website",
      path: pathname || "/",
      pageGroup: "marketing",
      ctaVariant: variant,
      meta: { component: "CTAExperiment" },
    });
  };

  const handleSecondaryClick = () => {
    void trackPublicEvent({
      event: "marketing_cta_variant_secondary_click",
      source: "website",
      path: pathname || "/",
      pageGroup: "marketing",
      ctaVariant: variant,
      meta: { component: "CTAExperiment", target: secondaryHref },
    });
  };

  return (
    <section id={id} className="py-14 md:py-20">
      <div className="mx-auto max-w-[1120px] px-6 md:px-8">
        <article className="card-base card-hover p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)] ring-1 ring-[var(--gold-soft)]">
              {content.label}
            </span>
          </div>

          <h3 className="h3 mt-4">{content.title}</h3>
          <p className="body mt-3 text-[var(--muted)]">{content.subtitle}</p>

          <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-3">
            {content.bullets.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary" onClick={handlePrimaryClick}>
              {content.primary}
            </Link>
            <Link href={secondaryHref} className="btn-secondary" onClick={handleSecondaryClick}>
              {content.secondary}
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
