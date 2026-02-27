"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import Link from "next/link";
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import DemoFrame from "@/components/marketing-demo/DemoFrame";
import MiniSidebar from "@/components/marketing-demo/MiniSidebar";
import InboxList from "@/components/marketing-demo/InboxList";
import DraftPanel from "@/components/marketing-demo/DraftPanel";
import DecisionPanel from "@/components/marketing-demo/DecisionPanel";
import ChecksPanel from "@/components/marketing-demo/ChecksPanel";
import TimelinePanel from "@/components/marketing-demo/TimelinePanel";
import ApprovalPanel from "@/components/marketing-demo/ApprovalPanel";
import StoryOverlay from "@/components/marketing-demo/StoryOverlay";
import { makeItem } from "@/components/marketing-demo/demo-data";
import type { DemoInboxItem, SceneKey, StoryBeat, TimelineEvent } from "@/components/marketing-demo/types";

const DEFAULT_DURATION: Record<SceneKey, number> = {
  hero: 7500,
  inbox: 6000,
  rules: 6500,
  checks: 6200,
  approve: 6500,
  "product-hero": 7500,
  "tour-1-inbox": 6300,
  "tour-2-rules": 6400,
  "tour-3-checks": 6400,
  "tour-4-log": 6300,
};

const SCENE_LABELS: Record<SceneKey, string> = {
  hero: "hero.webm",
  inbox: "inbox.webm",
  rules: "rules.webm",
  checks: "checks.webm",
  approve: "approve.webm",
  "product-hero": "product-hero.webm",
  "tour-1-inbox": "tour-inbox.webm",
  "tour-2-rules": "tour-rules.webm",
  "tour-3-checks": "tour-checks.webm",
  "tour-4-log": "tour-log.webm",
};

const SCENE_PATHS: Record<SceneKey, string> = {
  hero: "/demo/hero",
  inbox: "/demo/inbox",
  rules: "/demo/rules",
  checks: "/demo/checks",
  approve: "/demo/approve",
  "product-hero": "/demo/product-hero",
  "tour-1-inbox": "/demo/tour/1-inbox",
  "tour-2-rules": "/demo/tour/2-rules",
  "tour-3-checks": "/demo/tour/3-checks",
  "tour-4-log": "/demo/tour/4-log",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseBool(value: string | null) {
  return value === "1";
}

function parseDuration(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 2500 || parsed > 20000) return fallback;
  return Math.round(parsed);
}

function parseScale(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return clamp(parsed, 0.8, 1.2);
}

function statusBoardClass(active: boolean) {
  return active
    ? "border-[rgba(201,162,39,0.5)] bg-[rgba(201,162,39,0.12)] text-[var(--text)]"
    : "border-[var(--border)] bg-white text-[var(--muted)]";
}

function EntryCheckPanel({
  recognizedActive,
  ignoredActive,
  why,
}: {
  recognizedActive: boolean;
  ignoredActive: boolean;
  why: string;
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <h3 className="text-[20px] font-semibold text-[var(--text)]">Eingang-Check</h3>
      <div className="mt-4 space-y-2.5">
        <div
          data-ref="entry-recognized"
          className={[
            "rounded-xl border px-3 py-2.5 text-[14px] font-medium",
            statusBoardClass(recognizedActive),
          ].join(" ")}
        >
          Anfrage erkannt
        </div>
        <div
          data-ref="entry-ignored"
          className={[
            "rounded-xl border px-3 py-2.5 text-[14px] font-medium",
            statusBoardClass(ignoredActive),
          ].join(" ")}
        >
          Ignoriert
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[14px] font-medium text-[var(--muted)]">
          Zur Freigabe
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-[rgba(201,162,39,0.4)] bg-[rgba(201,162,39,0.1)] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Warum?</p>
        <p className="mt-1 text-[14px] text-[var(--text)]">{why}</p>
      </div>
    </section>
  );
}

function SceneContent({
  scene,
  tick,
  duration,
  stageRef,
}: {
  scene: SceneKey;
  tick: number;
  duration: number;
  stageRef: RefObject<HTMLDivElement | null>;
}) {
  const progress = duration > 0 ? tick / duration : 1;

  if (scene === "hero") {
    const checksProgress = tick < 2400 ? 0 : clamp(Math.floor((tick - 2400) / 400) + 1, 0, 6);
    const timelineCount = tick < 6300 ? 1 : clamp(Math.floor((tick - 6300) / 300) + 1, 1, 4);
    const juliaStatus = tick >= 4800 ? "Auto gesendet" : "Eingang geprüft";
    const items: DemoInboxItem[] = [
      makeItem("julia", juliaStatus),
      makeItem("tim", "Eingang geprüft"),
      makeItem("system", "Ignoriert"),
    ];

    const beats: StoryBeat[] = [
      {
        startMs: 0,
        endMs: 1200,
        highlights: ["inbox-julia"],
        arrows: [{ fromRef: "inbox-julia", toRef: "decision-auto", fromAnchor: "right", toAnchor: "left" }],
      },
      {
        startMs: 1200,
        endMs: 2400,
        highlights: ["decision-auto"],
        arrows: [{ fromRef: "decision-auto", toRef: "checks-panel", fromAnchor: "bottom", toAnchor: "top" }],
      },
      {
        startMs: 2400,
        endMs: 4800,
        highlights: ["checks-panel"],
      },
      {
        startMs: 4800,
        endMs: 6300,
        highlights: ["checks-panel", "inbox-julia"],
        arrows: [{ fromRef: "checks-panel", toRef: "timeline-panel", color: "gold", fromAnchor: "bottom", toAnchor: "top" }],
      },
      {
        startMs: 6300,
        endMs: duration,
        highlights: ["timeline-panel"],
      },
    ];

    const heroTimeline: TimelineEvent[] = [
      { time: "09:41:02", label: "Eingang", tone: "neutral" },
      { time: "09:41:03", label: "Entscheidung", tone: "ok" },
      { time: "09:41:05", label: "Qualitätschecks", tone: "ok" },
      { time: "09:41:06", label: "Versand", tone: "ok" },
    ];

    return (
      <div className="relative h-full">
        <div className="grid h-full grid-cols-12 gap-5">
          <div className="col-span-4">
            <InboxList title="Nachrichten" subtitle="Interessenten und Systemmails" items={items} activeId="julia" />
          </div>
          <div className="col-span-4">
            <DraftPanel
              subject="Anfrage: Besichtigung möglich?"
              inbound="Hallo, ist die Wohnung in der Lindenstraße noch frei? Besichtigung möglich?"
              draft={
                "Guten Tag, die Wohnung ist verfügbar. Besichtigung: Di 17:30 oder Do 18:00. Welche Zeit passt Ihnen?"
              }
            />
          </div>
          <div className="col-span-4 space-y-4">
            <DecisionPanel selected="auto" why="Standardfrage erkannt" secondaryWhy="Objekt eindeutig" />
            <ChecksPanel progress={checksProgress} result={tick >= 4800 ? "auto" : undefined} resultLabel="Auto-Versand erlaubt" />
            <TimelinePanel events={heroTimeline.slice(0, timelineCount)} footer="Gesendet über Ihr Postfach" />
          </div>
        </div>

        <StoryOverlay stageRef={stageRef} tickMs={tick} beats={beats} />
      </div>
    );
  }

  if (scene === "inbox") {
    const systemIgnored = tick >= 2200;
    const items: DemoInboxItem[] = [
      makeItem("julia", "Eingang geprüft"),
      makeItem("tim", "Eingang geprüft"),
      makeItem("system", systemIgnored ? "Ignoriert" : "Eingang geprüft"),
      makeItem("daemon", systemIgnored ? "Ignoriert" : "Eingang geprüft"),
    ];

    const why = tick < 2200 ? "Standardanfrage erkannt" : "no-reply/Systemmail erkannt";
    const beats: StoryBeat[] = [
      {
        startMs: 0,
        endMs: 2200,
        dim: true,
        highlights: ["inbox-julia", "entry-recognized"],
        arrows: [{ fromRef: "inbox-julia", toRef: "entry-recognized", fromAnchor: "right", toAnchor: "left" }],
      },
      {
        startMs: 2200,
        endMs: 3800,
        dim: true,
        highlights: ["inbox-system", "entry-ignored"],
        arrows: [{ fromRef: "inbox-system", toRef: "entry-ignored", fromAnchor: "right", toAnchor: "left" }],
      },
      {
        startMs: 3800,
        endMs: duration,
        highlights: ["inbox-julia", "inbox-system"],
      },
    ];

    return (
      <div className="relative h-full">
        <div className="grid h-full grid-cols-12 gap-5">
          <div className="col-span-8">
            <InboxList
              title="Postfachprüfung"
              subtitle="Echte Interessenten-Anfragen werden getrennt von irrelevanten Systemmails"
              items={items}
              activeId={tick < 2200 ? "julia" : "system"}
              showActions={false}
            />
          </div>
          <div className="col-span-4">
            <EntryCheckPanel recognizedActive={tick < 2200 || tick >= 3800} ignoredActive={tick >= 2200} why={why} />
          </div>
        </div>

        <StoryOverlay stageRef={stageRef} tickMs={tick} beats={beats} />
      </div>
    );
  }

  if (scene === "rules" || scene === "tour-2-rules") {
    const selection = tick < 1300 ? "auto" : tick < 3200 ? "auto" : tick < 4700 ? "approve" : "ignore";
    const why = selection === "auto" ? "Objekt eindeutig" : selection === "approve" ? "Objekt unklar → Freigabe" : "no-reply/Systemmail erkannt";

    const items: DemoInboxItem[] = [
      makeItem("tim", tick >= 3200 ? "Auto gesendet" : "Eingang geprüft"),
      makeItem("anna", tick >= 4700 ? "Zur Freigabe" : "Eingang geprüft"),
      makeItem("system", tick >= 4700 ? "Ignoriert" : "Eingang geprüft"),
    ];

    const stepLabel = scene === "tour-2-rules" ? "Schritt 2/4: Entscheidung" : "Regeln: Auto / Freigabe / Ignorieren";
    const beats: StoryBeat[] = [
      {
        startMs: 0,
        endMs: 1300,
        stepLabel,
        highlights: ["decision-auto", "decision-approve", "decision-ignore"],
      },
      {
        startMs: 1300,
        endMs: 3200,
        stepLabel,
        highlights: ["inbox-tim", "decision-auto"],
        arrows: [{ fromRef: "inbox-tim", toRef: "decision-auto", fromAnchor: "right", toAnchor: "left" }],
      },
      {
        startMs: 3200,
        endMs: 4700,
        stepLabel,
        highlights: ["inbox-anna", "decision-approve"],
        arrows: [{ fromRef: "inbox-anna", toRef: "decision-approve", color: "gold", fromAnchor: "right", toAnchor: "left" }],
      },
      {
        startMs: 4700,
        endMs: duration,
        stepLabel,
        highlights: ["inbox-system", "decision-ignore"],
        arrows: [{ fromRef: "inbox-system", toRef: "decision-ignore", fromAnchor: "right", toAnchor: "left" }],
      },
    ];

    return (
      <div className="relative h-full">
        <div className="grid h-full grid-cols-12 gap-5">
          <div className="col-span-5">
            <InboxList
              title="Anfragen im Vergleich"
              subtitle="Klarer Fall, unklarer Fall, Systemmail"
              items={items}
              activeId={selection === "auto" ? "tim" : selection === "approve" ? "anna" : "system"}
              compact
              showActions={false}
            />
          </div>
          <div className="col-span-7 space-y-4">
            <DecisionPanel selected={selection} why={why} large title="Entscheidungsregeln" />
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Zusammenfassung</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-emerald-700">Auto senden</span>
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-amber-700">Zur Freigabe</span>
                <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-2 text-slate-700">Ignorieren</span>
              </div>
            </div>
          </div>
        </div>

        <StoryOverlay stageRef={stageRef} tickMs={tick} beats={beats} />
      </div>
    );
  }

  if (scene === "checks") {
    const checksProgress = tick < 1200 ? 0 : clamp(Math.floor((tick - 1200) / 520) + 1, 0, 6);
    const resultVisible = tick >= 4400;

    const beats: StoryBeat[] = [
      {
        startMs: 0,
        endMs: 1200,
        highlights: ["draft-panel"],
        arrows: [{ fromRef: "draft-panel", toRef: "checks-panel", fromAnchor: "right", toAnchor: "left" }],
      },
      {
        startMs: 1200,
        endMs: 4400,
        highlights: ["checks-panel"],
      },
      {
        startMs: 4400,
        endMs: duration,
        highlights: ["checks-panel"],
      },
    ];

    return (
      <div className="relative h-full">
        <div className="grid h-full grid-cols-12 gap-5">
          <div className="col-span-7">
            <DraftPanel
              subject="Anfrage: Exposé möglich?"
              inbound="Guten Tag, ich interessiere mich für das Objekt Parkallee. Exposé möglich?"
              draft={
                "Guten Tag, das Objekt ist verfügbar. Ich sende Ihnen das Exposé direkt im Anschluss. Besichtigung: Mi 16:30 oder Fr 11:00 – was passt Ihnen?"
              }
            />
          </div>
          <div className="col-span-5">
            <ChecksPanel
              progress={checksProgress}
              contextHint={tick >= 2300 && tick <= 3000 ? "Objektbezug vorhanden?" : undefined}
              result={resultVisible ? "auto" : undefined}
              resultLabel="Auto-Versand erlaubt"
              whyLabel={resultVisible ? "Im Zweifel zur Freigabe" : undefined}
            />
          </div>
        </div>

        <StoryOverlay stageRef={stageRef} tickMs={tick} beats={beats} />
      </div>
    );
  }

  if (scene === "tour-3-checks") {
    const checksProgress = tick < 1300 ? 0 : clamp(Math.floor((tick - 1300) / 520) + 1, 0, 6);
    const riskUnsafe = tick >= 4000;

    const beats: StoryBeat[] = [
      {
        startMs: 0,
        endMs: 1300,
        stepLabel: "Schritt 3/4: Qualitätschecks",
        highlights: ["draft-panel"],
        arrows: [{ fromRef: "draft-panel", toRef: "checks-panel", fromAnchor: "right", toAnchor: "left" }],
      },
      {
        startMs: 1300,
        endMs: 4000,
        stepLabel: "Schritt 3/4: Qualitätschecks",
        highlights: ["checks-panel"],
      },
      {
        startMs: 4000,
        endMs: duration,
        stepLabel: "Schritt 3/4: Qualitätschecks",
        highlights: ["decision-approve", "checks-panel"],
      },
    ];

    return (
      <div className="relative h-full">
        <div className="grid h-full grid-cols-12 gap-5">
          <div className="col-span-7">
            <DraftPanel
              subject="Anfrage: Rückmeldung zur Besichtigung"
              inbound="Hallo, ich habe eine Beschwerde zum letzten Termin und hätte gern sofort eine Klärung."
              draft={
                "Vielen Dank für Ihre Nachricht. Ich nehme Ihr Anliegen ernst und möchte den Vorgang korrekt prüfen. Ich melde mich zeitnah mit einer konkreten Lösung."
              }
            />
          </div>
          <div className="col-span-5 space-y-4">
            <DecisionPanel selected="approve" why="Risiko unsicher → Freigabe" title="Fail-Safe" />
            <ChecksPanel
              progress={checksProgress}
              riskUnsafe={riskUnsafe}
              result={riskUnsafe ? "approve" : undefined}
              resultLabel="Zur Freigabe"
              whyLabel={riskUnsafe ? "Risiko unsicher → Freigabe" : undefined}
            />
          </div>
        </div>

        <StoryOverlay stageRef={stageRef} tickMs={tick} beats={beats} />
      </div>
    );
  }

  if (scene === "approve") {
    const editing = tick >= 1200 && tick < 4600;
    const sent = tick >= 3600;
    const timelineCount = tick < 4600 ? 1 : clamp(Math.floor((tick - 4600) / 450) + 1, 1, 4);

    const beats: StoryBeat[] = [
      {
        startMs: 0,
        endMs: 1200,
        highlights: ["approve-why"],
        arrows: [{ fromRef: "approve-why", toRef: "approve-edit", color: "gold", fromAnchor: "bottom", toAnchor: "top" }],
      },
      {
        startMs: 1200,
        endMs: 3600,
        highlights: ["approve-edit", "draft-panel"],
        arrows: [{ fromRef: "approve-edit", toRef: "approve-send", fromAnchor: "right", toAnchor: "left" }],
      },
      {
        startMs: 3600,
        endMs: 4600,
        highlights: ["approve-send"],
      },
      {
        startMs: 4600,
        endMs: duration,
        highlights: ["timeline-panel"],
      },
    ];

    const approveTimeline: TimelineEvent[] = [
      { time: "09:41:02", label: "Eingang", tone: "neutral" },
      { time: "09:41:03", label: "Zur Freigabe", tone: "warn" },
      { time: "09:41:04", label: "Bearbeitet", tone: "neutral" },
      { time: "09:41:06", label: "Versand", tone: "ok" },
    ];

    return (
      <div className="relative h-full">
        <div className="grid h-full grid-cols-12 gap-5">
          <div className="col-span-7 space-y-4">
            <ApprovalPanel sent={sent} editing={editing} why="Objekt unklar → Freigabe" />
            <TimelinePanel events={approveTimeline.slice(0, timelineCount)} footer="Gesendet über Ihr Postfach" />
          </div>
          <div className="col-span-5">
            <DraftPanel
              subject="Anfrage: Objekt unklar"
              inbound="Hallo, ist sie noch frei? Ich finde den Link gerade nicht."
              draft={
                "Vielen Dank für Ihre Nachricht. Können Sie mir bitte kurz den Link oder die Adresse senden? Dann gebe ich Ihnen direkt die nächsten Schritte."
              }
              editedSuffix="Wenn Sie möchten, kann ich Ihnen auch direkt zwei Terminvorschläge senden."
              showEditedSuffix={editing || sent}
            />
          </div>
        </div>

        <StoryOverlay stageRef={stageRef} tickMs={tick} beats={beats} />
      </div>
    );
  }

  if (scene === "product-hero") {
    const checksProgress = tick < 2400 ? 0 : clamp(Math.floor((tick - 2400) / 420) + 1, 0, 6);
    const timelineCount = tick < 6000 ? 2 : clamp(Math.floor((tick - 6000) / 300) + 2, 2, 4);
    const timStatus = tick >= 5000 ? "Auto gesendet" : "Eingang geprüft";

    const items: DemoInboxItem[] = [
      makeItem("tim", timStatus),
      makeItem("julia", "Eingang geprüft"),
      makeItem("system", "Ignoriert"),
    ];

    const beats: StoryBeat[] = [
      {
        startMs: 0,
        endMs: 2200,
        stepLabel: "Eingang → Entscheidung → Versand",
        highlights: ["inbox-tim", "decision-auto"],
        arrows: [{ fromRef: "inbox-tim", toRef: "decision-auto", fromAnchor: "right", toAnchor: "left" }],
      },
      {
        startMs: 2200,
        endMs: 5000,
        stepLabel: "Eingang → Entscheidung → Versand",
        highlights: ["checks-panel"],
        arrows: [{ fromRef: "decision-auto", toRef: "checks-panel", fromAnchor: "bottom", toAnchor: "top" }],
      },
      {
        startMs: 5000,
        endMs: duration,
        stepLabel: "Eingang → Entscheidung → Versand",
        highlights: ["timeline-panel"],
        arrows: [{ fromRef: "checks-panel", toRef: "timeline-panel", color: "gold", fromAnchor: "bottom", toAnchor: "top" }],
      },
    ];

    const productHeroTimeline: TimelineEvent[] = [
      { time: "09:41:02", label: "Eingang", tone: "neutral" },
      { time: "09:41:03", label: "Entscheidung", tone: "ok" },
      { time: "09:41:05", label: "Qualitätschecks", tone: "ok" },
      { time: "09:41:06", label: "Versand", tone: "ok" },
    ];

    return (
      <div className="relative h-full">
        <div className="grid h-full grid-cols-12 gap-5">
          <div className="col-span-3">
            <InboxList title="Eingang" items={items} activeId="tim" compact showActions={false} />
          </div>
          <div className="col-span-4">
            <DraftPanel
              subject="Anfrage: Exposé und Besichtigung"
              inbound="Guten Tag, ich interessiere mich für das Objekt Parkallee. Exposé möglich?"
              draft={
                "Vielen Dank für Ihre Anfrage. Das Objekt ist verfügbar. Exposé sende ich direkt im Anschluss. Besichtigung: Mi 16:30 oder Fr 11:00."
              }
            />
          </div>
          <div className="col-span-5 space-y-4">
            <DecisionPanel selected="auto" why="Standardfrage erkannt" secondaryWhy="Objekt eindeutig" />
            <ChecksPanel progress={checksProgress} result={tick >= 5000 ? "auto" : undefined} resultLabel="Auto-Versand erlaubt" />
            <TimelinePanel large events={productHeroTimeline.slice(0, timelineCount)} footer="Gesendet über Ihr Postfach" />
          </div>
        </div>

        <StoryOverlay stageRef={stageRef} tickMs={tick} beats={beats} />
      </div>
    );
  }

  if (scene === "tour-1-inbox") {
    const ignoreActive = tick >= 2200;
    const items: DemoInboxItem[] = [
      makeItem("julia", "Eingang geprüft"),
      makeItem("tim", "Eingang geprüft"),
      makeItem("system", ignoreActive ? "Ignoriert" : "Eingang geprüft"),
    ];

    const beats: StoryBeat[] = [
      {
        startMs: 0,
        endMs: 2200,
        stepLabel: "Schritt 1/4: Eingang",
        dim: true,
        highlights: ["inbox-julia", "entry-recognized"],
        arrows: [{ fromRef: "inbox-julia", toRef: "entry-recognized", fromAnchor: "right", toAnchor: "left" }],
      },
      {
        startMs: 2200,
        endMs: duration,
        stepLabel: "Schritt 1/4: Eingang",
        dim: true,
        highlights: ["inbox-system", "entry-ignored"],
        arrows: [{ fromRef: "inbox-system", toRef: "entry-ignored", color: "gold", fromAnchor: "right", toAnchor: "left" }],
      },
    ];

    return (
      <div className="relative h-full">
        <div className="grid h-full grid-cols-12 gap-5">
          <div className="col-span-8">
            <InboxList
              title="Eingang"
              subtitle="Interessent erkannt vs. Systemmail ignoriert"
              items={items}
              activeId={ignoreActive ? "system" : "julia"}
              showActions={false}
            />
          </div>
          <div className="col-span-4">
            <EntryCheckPanel
              recognizedActive={!ignoreActive}
              ignoredActive={ignoreActive}
              why={ignoreActive ? "no-reply/Systemmail erkannt" : "Standardfrage erkannt"}
            />
          </div>
        </div>

        <StoryOverlay stageRef={stageRef} tickMs={tick} beats={beats} />
      </div>
    );
  }

  if (scene === "tour-4-log") {
    const visibleCount = clamp(Math.floor(progress * 4), 1, 4);
    const beats: StoryBeat[] = [
      {
        startMs: 0,
        endMs: duration,
        stepLabel: "Schritt 4/4: Versand & Verlauf",
        highlights: ["timeline-panel"],
      },
    ];

    const timelineEvents: TimelineEvent[] = [
      { time: "09:41:02", label: "Eingang", tone: "neutral" },
      { time: "09:41:03", label: "Entscheidung", tone: "ok" },
      { time: "09:41:05", label: "Qualitätschecks", tone: "ok" },
      { time: "09:41:06", label: "Versand", tone: "ok" },
    ];

    return (
      <div className="relative h-full">
        <div className="grid h-full grid-cols-12 gap-5">
          <div className="col-span-8">
            <TimelinePanel large title="Verlauf" events={timelineEvents.slice(0, visibleCount)} footer="Gesendet über Ihr Postfach" />
          </div>
          <div className="col-span-4 space-y-4">
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Status</p>
              <p className="mt-2 text-[18px] font-semibold text-[var(--text)]">Auto gesendet</p>
              <p className="mt-2 text-[13px] text-[var(--muted)]">Alle Schritte wurden gespeichert und sind jederzeit nachvollziehbar.</p>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
              <p className="text-[12px] text-[var(--muted)]">Gesendet über Ihr Postfach</p>
            </div>
          </div>
        </div>

        <StoryOverlay stageRef={stageRef} tickMs={tick} beats={beats} />
      </div>
    );
  }

  return null;
}

export default function DemoScenePage({ scene }: { scene: SceneKey }) {
  const searchParams = useSearchParams();
  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef(0);

  const clean = parseBool(searchParams.get("clean"));
  const autoplay = parseBool(searchParams.get("autoplay"));
  const loop = parseBool(searchParams.get("loop"));
  const duration = parseDuration(searchParams.get("duration"), DEFAULT_DURATION[scene]);
  const scale = parseScale(searchParams.get("scale"));

  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [tick, setTick] = useState(autoplay ? 0 : duration);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    setIsPlaying(autoplay);
    setTick(autoplay ? 0 : duration);
    tickRef.current = autoplay ? 0 : duration;
    setRunKey((curr) => curr + 1);
  }, [autoplay, duration]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    if (!isPlaying) return;

    let rafId = 0;
    const startAt = performance.now() - tickRef.current;

    const step = (now: number) => {
      const elapsed = now - startAt;
      if (loop) {
        setTick(elapsed % duration);
        rafId = window.requestAnimationFrame(step);
        return;
      }

      const nextTick = Math.min(elapsed, duration);
      setTick(nextTick);
      if (nextTick < duration) {
        rafId = window.requestAnimationFrame(step);
      } else {
        setIsPlaying(false);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlaying, duration, loop, runKey]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const activeSidebar = useMemo(() => {
    if (scene === "approve") return "Zur Freigabe" as const;
    if (scene === "hero" || scene === "inbox" || scene === "rules" || scene === "tour-1-inbox" || scene === "tour-2-rules") {
      return "Nachrichten" as const;
    }
    return "Follow-ups" as const;
  }, [scene]);

  const openCleanUrl = `${SCENE_PATHS[scene]}?clean=1`;

  const handleToggleFullscreen = async () => {
    if (!fullscreenRef.current) return;

    if (!document.fullscreenElement) {
      await fullscreenRef.current.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fafbfd_46%,#f7f8fa_100%)] px-6 py-8">
      {!clean ? (
        <div className="mx-auto mb-4 flex w-full max-w-[1680px] items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 shadow-[var(--shadow-sm)]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Marketing Demo Suite</p>
            <p className="mt-1 text-[15px] font-semibold text-[var(--text)]">{SCENE_LABELS[scene]}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((curr) => !curr)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--text)]"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTick(0);
                tickRef.current = 0;
                setIsPlaying(true);
                setRunKey((curr) => curr + 1);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--text)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--text)]"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              Vollbild
            </button>
            <Link href={openCleanUrl} className="btn-secondary !px-3 !py-2 !text-[12px]">
              Clean öffnen
            </Link>
          </div>
        </div>
      ) : null}

      <div ref={fullscreenRef}>
        <DemoFrame stageRef={stageRef} clean={clean} scale={scale} sidebar={<MiniSidebar active={activeSidebar} />}>
          <SceneContent scene={scene} tick={tick} duration={duration} stageRef={stageRef} />
        </DemoFrame>
      </div>
    </main>
  );
}
