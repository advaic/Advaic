import Image from "next/image";
import { clsx } from "clsx";

import {
  coreStillVisuals,
  stillToneMeta,
  stillVisualPalette,
  type StillFrame,
  type StillVisualDefinition,
} from "./still-visual-system";

type AnnotatedStillVisualProps = {
  visual: StillVisualDefinition;
  compact?: boolean;
};

function FrameChrome({ frame }: { frame: StillFrame }) {
  if (frame === "mobile") {
    return (
      <div className="pointer-events-none absolute inset-x-6 top-4 z-20 h-8 rounded-full bg-[rgba(11,15,23,0.92)] shadow-[0_12px_28px_rgba(11,15,23,0.25)]" />
    );
  }

  return (
    <div className="flex items-center gap-2 border-b border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.96)] px-4 py-3">
      <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
      <div className="ml-auto rounded-full border border-[rgba(148,163,184,0.22)] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Produktansicht
      </div>
    </div>
  );
}

export function AnnotatedStillVisual({
  visual,
  compact = false,
}: AnnotatedStillVisualProps) {
  const frameShell =
    visual.frame === "mobile"
      ? "mx-auto max-w-[420px] rounded-[36px] border border-[rgba(15,23,42,0.12)] bg-white p-3 shadow-[0_32px_90px_rgba(15,23,42,0.18)]"
      : "rounded-[28px] border border-[rgba(15,23,42,0.1)] bg-white shadow-[0_36px_96px_rgba(15,23,42,0.16)]";

  const stageRatio = visual.frame === "mobile" ? "aspect-[9/16]" : "aspect-[16/10]";

  return (
    <article
      className="rounded-[30px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,#ffffff,#fbfbfd)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:p-6"
      data-tour="annotated-still-card"
      data-still-id={visual.id}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[68ch]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {visual.kicker}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            {visual.title}
          </h2>
          <p className="mt-3 max-w-[62ch] text-sm leading-7 text-slate-600">
            {visual.message}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {visual.usage.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[rgba(201,162,39,0.28)] bg-[#fffbeb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a6514]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className={clsx("mt-6 grid gap-5", compact ? "lg:grid-cols-[minmax(0,1fr)_300px]" : "xl:grid-cols-[minmax(0,1fr)_320px]")}>
        <div className={frameShell} data-tour="annotated-still-frame">
          <div className="overflow-hidden rounded-[22px] border border-[rgba(15,23,42,0.08)] bg-[#f8fafc]">
            <FrameChrome frame={visual.frame} />
            <div className={clsx("relative overflow-hidden bg-[#f8fafc]", stageRatio)} data-tour="annotated-still-stage">
              <Image
                src={visual.src}
                alt={visual.alt}
                fill
                sizes="(max-width: 1200px) 100vw, 900px"
                className={clsx(
                  "object-cover object-top",
                  visual.frame === "mobile" ? "rounded-[22px]" : "",
                )}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.02))]" />

              {visual.pins.map((pin, index) => {
                const tone = stillToneMeta[pin.tone];
                return (
                  <div
                    key={pin.id}
                    className="absolute"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -50%)" }}
                    data-tour="annotated-still-pin"
                  >
                    <div className={clsx("relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold shadow-[0_16px_32px_rgba(15,23,42,0.18)] ring-4 ring-white/90", tone.dot)}>
                      {index + 1}
                      <span className={clsx("absolute inset-0 rounded-full opacity-35 blur-[10px]", tone.dot)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3" data-tour="annotated-still-callouts">
          <div className="rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,#0f172a,#111827)] px-4 py-4 text-white shadow-[0_20px_40px_rgba(15,23,42,0.22)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
              Leitbotschaft
            </div>
            <p className="mt-2 text-sm leading-7 text-white/90">{visual.message}</p>
          </div>

          {visual.pins.map((pin, index) => {
            const tone = stillToneMeta[pin.tone];
            return (
              <article
                key={pin.id}
                className={clsx(
                  "rounded-[22px] border px-4 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.05)]",
                  tone.panel,
                )}
                data-tour="annotated-still-callout"
              >
                <div className="flex items-start gap-3">
                  <div className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm", tone.dot)}>
                    {index + 1}
                  </div>
                  <div>
                    <div className={clsx("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]", tone.chip)}>
                      {stillToneMeta[pin.tone].label}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-slate-950">{pin.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{pin.text}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export function StillVisualGuidelines() {
  return (
    <section className="rounded-[30px] border border-[rgba(15,23,42,0.08)] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_340px]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Visual-Regeln
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Ein Screenshot erzählt genau eine Sache
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <li>1. Pro Motiv gibt es genau eine Leitbotschaft und maximal zwei Pins.</li>
            <li>2. Brand steht für Mechanik, Gelb für Freigabe, Grün für sichere Zustände, Rot für Stopps.</li>
            <li>3. Desktop-Screens laufen im Browser-Frame, Mobile-Screens später im Phone-Frame.</li>
            <li>4. Erklärung sitzt außerhalb des Screens, damit das Produktbild ruhig bleibt.</li>
          </ul>
        </div>

        <div className="rounded-[26px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,#f8fafc,#ffffff)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Status-Palette
          </div>
          <div className="mt-4 space-y-3">
            {stillVisualPalette.map((entry) => {
              const tone = stillToneMeta[entry.tone];
              return (
                <div
                  key={entry.tone}
                  className="flex items-start gap-3 rounded-[18px] border border-[rgba(15,23,42,0.08)] bg-white px-3 py-3"
                >
                  <div className={clsx("mt-0.5 h-4 w-4 rounded-full shadow-sm", tone.dot)} />
                  <div>
                    <div className="text-sm font-semibold text-slate-950">{entry.title}</div>
                    <p className="text-sm leading-6 text-slate-600">{entry.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StillVisualGallery({ ids }: { ids?: string[] }) {
  const visuals = ids?.length
    ? coreStillVisuals.filter((item) => ids.includes(item.id))
    : coreStillVisuals;

  return (
    <div className="space-y-6" data-tour="annotated-still-gallery">
      {visuals.map((visual) => (
        <AnnotatedStillVisual key={visual.id} visual={visual} />
      ))}
    </div>
  );
}
