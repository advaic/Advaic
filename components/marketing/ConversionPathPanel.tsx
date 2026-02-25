"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Container from "./Container";
import TrackedLink from "./TrackedLink";
import { resolveLandingConversion } from "@/lib/marketing/conversion-map";

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

type ConversionPathPanelProps = {
  className?: string;
};

export default function ConversionPathPanel({ className = "" }: ConversionPathPanelProps) {
  const pathname = usePathname() || "/";
  const conversion = useMemo(() => resolveLandingConversion(pathname), [pathname]);
  const activeIndex = Math.max(0, stageOrder.indexOf(conversion.stage));

  return (
    <section className={`py-10 md:py-12 ${className}`}>
      <Container>
        <article className="card-base p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="label">Nächster sinnvoller Schritt</p>
            <span className="inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--gold-soft)]">
              Funnel-Stufe: {conversion.stage}
            </span>
          </div>

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
              {stageCopy[conversion.stage].actionLabel}
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
