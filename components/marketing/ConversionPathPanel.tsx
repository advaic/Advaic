"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Container from "./Container";
import TrackedLink from "./TrackedLink";
import { resolveLandingConversion } from "@/lib/marketing/conversion-map";
import { MARKETING_PRIMARY_CTA_LABEL } from "./cta-copy";

const stageOrder = ["orientierung", "bewertung", "entscheidung"] as const;

const stageCopy: Record<
  (typeof stageOrder)[number],
  { title: string; text: string; actionLabel: string }
> = {
  orientierung: {
    title: "Orientierung",
    text: "Sie verstehen Problem, Mechanik und Sicherheitslogik in klaren Schritten.",
    actionLabel: "Zur Produktseite",
  },
  bewertung: {
    title: "Bewertung",
    text: "Sie prüfen konkret, wann Auto, Freigabe oder Ignorieren in Ihrem Alltag greift.",
    actionLabel: "Mit Guardrails testen",
  },
  entscheidung: {
    title: "Entscheidung",
    text: "Sie starten kontrolliert mit Safe-Start-Konfiguration und messbarer Wirkung.",
    actionLabel: "Jetzt starten",
  },
};

const stageReasonByFamily: Record<string, string> = {
  home: "Sie sind in der Orientierung. Ziel: zuerst Mechanik und Guardrails verstehen, dann kontrolliert testen.",
  produkt:
    "Sie sind in der Bewertung. Ziel: klären, wann Auto sendet, wann Freigabe greift und wie der Alltag sicher bleibt.",
  preise:
    "Sie sind in der Entscheidung. Ziel: Startkriterien prüfen, Testphase nutzen und mit klarer Erfolgsmessung starten.",
  trust:
    "Sie sind in der Vertrauensprüfung. Ziel: Sicherheitslogik und Nachvollziehbarkeit verstehen, bevor Sie live gehen.",
};

type ConversionPathPanelProps = {
  className?: string;
};

export default function ConversionPathPanel({ className = "" }: ConversionPathPanelProps) {
  const pathname = usePathname() || "/";
  const conversion = useMemo(() => resolveLandingConversion(pathname), [pathname]);
  const activeIndex = Math.max(0, stageOrder.indexOf(conversion.stage));
  const progressPct = ((activeIndex + 1) / stageOrder.length) * 100;
  const primaryLabel = conversion.primaryHref.startsWith("/signup")
    ? MARKETING_PRIMARY_CTA_LABEL
    : stageCopy[conversion.stage].actionLabel;
  const stageReason =
    stageReasonByFamily[conversion.family] ||
    "Sie sehen den nächsten sinnvollen Schritt entlang Orientierung, Bewertung und Entscheidung.";

  return (
    <section className={`py-10 md:py-12 ${className}`}>
      <Container>
        <article className="card-base relative overflow-hidden p-5 md:p-6">
          <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(11,15,23,0),rgba(201,162,39,0.55),rgba(11,15,23,0))]" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="label">Nächster sinnvoller Schritt im Entscheidungsprozess</p>
            <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--gold-soft)]">
              Aktuelle Phase: {stageCopy[conversion.stage].title}
            </span>
          </div>
          <div className="mt-4 progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="helper mt-3 max-w-[74ch]">{stageReason}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {stageOrder.map((stage, idx) => {
              const active = idx <= activeIndex;
              return (
                <article
                  key={stage}
                  className={`rounded-xl border p-4 transition ${
                    active
                      ? "border-[var(--gold-soft)] bg-white shadow-[var(--shadow-sm)]"
                      : "border-[var(--border)] bg-[var(--surface-2)]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        active ? "bg-[var(--gold-soft)] text-[var(--text)]" : "bg-white text-[var(--muted)]"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-[var(--text)]">{stageCopy[stage].title}</p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">{stageCopy[stage].text}</p>
                  {active ? (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--text)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--gold)]" />
                      Aktiv
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href={conversion.primaryHref}
              className="btn-primary"
              event="marketing_conversion_path_primary_click"
              source="website"
              pageGroup="marketing"
              section="conversion-path-panel"
              meta={{
                stage: conversion.stage,
                reporting_key: conversion.reportingKey,
                family: conversion.family,
              }}
            >
              {primaryLabel}
            </TrackedLink>
            <TrackedLink
              href={conversion.secondaryHref}
              className="btn-secondary"
              event="marketing_conversion_path_secondary_click"
              source="website"
              pageGroup="marketing"
              section="conversion-path-panel"
              meta={{
                stage: conversion.stage,
                reporting_key: conversion.reportingKey,
                family: conversion.family,
              }}
            >
              Passende Vertiefung öffnen
            </TrackedLink>
          </div>
        </article>
      </Container>
    </section>
  );
}
