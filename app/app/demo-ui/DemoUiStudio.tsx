"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Home,
  Inbox,
  MessageSquare,
  PauseCircle,
  Play,
  RefreshCcw,
  ShieldCheck,
  ShieldEllipsis,
  Sparkles,
  Timer,
  TriangleAlert,
  UserCircle2,
  XCircle,
} from "lucide-react";

type DemoSceneKey =
  | "hero"
  | "inbox"
  | "rules"
  | "checks"
  | "approve"
  | "product_hero"
  | "tour_inbox"
  | "tour_rules"
  | "tour_checks"
  | "tour_log";

type DecisionKind = "auto" | "approve" | "ignore";
type CheckState = "done" | "active" | "pending";

type DemoScene = {
  key: DemoSceneKey;
  label: string;
  durationMs: number;
  decision: DecisionKind;
  why: string;
  resultBadge: "auto" | "approve";
  activeLeadId: string;
  timeline: Array<{ time: string; event: string; tone?: "neutral" | "warn" | "ok" }>;
  footerLine: string;
  qualityActiveCount: number;
};

type DemoLead = {
  id: string;
  initials: string;
  name: string;
  email: string;
  snippet: string;
  status: "Zur Freigabe" | "Auto gesendet" | "Ignoriert" | "Eskalation" | "Eingang geprüft";
  category: "Mieten" | "Kaufen";
  priority: "Hoch" | "Mittel" | "Niedrig";
  primaryAction: string;
  secondaryAction: string;
};

const BASE_LEADS: DemoLead[] = [
  {
    id: "max",
    initials: "MM",
    name: "Max Mustermann",
    email: "max.mustermann@email.de",
    snippet: "Guten Tag, ist die Wohnung in der Lindenstraße noch verfügbar?",
    status: "Zur Freigabe",
    category: "Mieten",
    priority: "Hoch",
    primaryAction: "Freigeben",
    secondaryAction: "Bearbeiten",
  },
  {
    id: "erika",
    initials: "EB",
    name: "Erika Beispiel",
    email: "erika.beispiel@email.de",
    snippet: "Ich habe eine Beschwerde zum Ablauf der letzten Besichtigung.",
    status: "Eskalation",
    category: "Kaufen",
    priority: "Mittel",
    primaryAction: "Antworten",
    secondaryAction: "Bearbeiten",
  },
  {
    id: "jonas",
    initials: "JB",
    name: "Jonas Beispiel",
    email: "jonas.beispiel@email.de",
    snippet: "Newsletter no-reply: Neue Marktberichte für Q2.",
    status: "Eingang geprüft",
    category: "Mieten",
    priority: "Niedrig",
    primaryAction: "Antworten",
    secondaryAction: "Ablehnen",
  },
];

const QUALITAET_CHECKS = [
  "Relevanz",
  "Kontext",
  "Vollständigkeit",
  "Ton & Stil",
  "Risiko",
  "Lesbarkeit",
];

const SCENES: DemoScene[] = [
  {
    key: "hero",
    label: "hero.webm",
    durationMs: 7500,
    decision: "auto",
    why: "Standardfrage erkannt",
    resultBadge: "auto",
    activeLeadId: "max",
    qualityActiveCount: 6,
    timeline: [
      { time: "09:41", event: "Eingang", tone: "neutral" },
      { time: "09:41", event: "Entscheidung", tone: "neutral" },
      { time: "09:41", event: "Versand", tone: "ok" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
  },
  {
    key: "inbox",
    label: "inbox.webm",
    durationMs: 6000,
    decision: "ignore",
    why: "Newsletter/no-reply erkannt",
    resultBadge: "approve",
    activeLeadId: "jonas",
    qualityActiveCount: 1,
    timeline: [
      { time: "09:41", event: "Eingang", tone: "neutral" },
      { time: "09:41", event: "Entscheidung", tone: "warn" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
  },
  {
    key: "rules",
    label: "rules.webm",
    durationMs: 6500,
    decision: "approve",
    why: "Objekt unklar → Freigabe",
    resultBadge: "approve",
    activeLeadId: "max",
    qualityActiveCount: 3,
    timeline: [
      { time: "09:41", event: "Eingang", tone: "neutral" },
      { time: "09:41", event: "Entscheidung", tone: "warn" },
      { time: "09:41", event: "Zur Freigabe", tone: "warn" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
  },
  {
    key: "checks",
    label: "checks.webm",
    durationMs: 6200,
    decision: "auto",
    why: "Objekt eindeutig",
    resultBadge: "auto",
    activeLeadId: "max",
    qualityActiveCount: 6,
    timeline: [
      { time: "09:41", event: "Eingang", tone: "neutral" },
      { time: "09:41", event: "Entscheidung", tone: "neutral" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
  },
  {
    key: "approve",
    label: "approve.webm",
    durationMs: 6500,
    decision: "approve",
    why: "Objekt unklar → Freigabe",
    resultBadge: "approve",
    activeLeadId: "max",
    qualityActiveCount: 4,
    timeline: [
      { time: "09:41", event: "Eingang", tone: "neutral" },
      { time: "09:41", event: "Zur Freigabe", tone: "warn" },
      { time: "09:41", event: "Versand", tone: "ok" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
  },
  {
    key: "product_hero",
    label: "product-hero.webm",
    durationMs: 7400,
    decision: "auto",
    why: "Standardfrage erkannt",
    resultBadge: "auto",
    activeLeadId: "max",
    qualityActiveCount: 6,
    timeline: [
      { time: "09:41", event: "Eingang", tone: "neutral" },
      { time: "09:41", event: "Entscheidung", tone: "neutral" },
      { time: "09:41", event: "Versand", tone: "ok" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
  },
  {
    key: "tour_inbox",
    label: "tour-inbox.webm",
    durationMs: 6200,
    decision: "ignore",
    why: "Newsletter/no-reply erkannt",
    resultBadge: "approve",
    activeLeadId: "jonas",
    qualityActiveCount: 2,
    timeline: [
      { time: "09:41", event: "Eingang", tone: "neutral" },
      { time: "09:41", event: "Entscheidung", tone: "warn" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
  },
  {
    key: "tour_rules",
    label: "tour-rules.webm",
    durationMs: 6400,
    decision: "approve",
    why: "Objekt unklar → Freigabe",
    resultBadge: "approve",
    activeLeadId: "max",
    qualityActiveCount: 3,
    timeline: [
      { time: "09:41", event: "Eingang", tone: "neutral" },
      { time: "09:41", event: "Entscheidung", tone: "warn" },
      { time: "09:41", event: "Zur Freigabe", tone: "warn" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
  },
  {
    key: "tour_checks",
    label: "tour-checks.webm",
    durationMs: 6400,
    decision: "auto",
    why: "Objekt eindeutig",
    resultBadge: "auto",
    activeLeadId: "max",
    qualityActiveCount: 6,
    timeline: [
      { time: "09:41", event: "Eingang", tone: "neutral" },
      { time: "09:41", event: "Entscheidung", tone: "neutral" },
      { time: "09:41", event: "Versand", tone: "ok" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
  },
  {
    key: "tour_log",
    label: "tour-log.webm",
    durationMs: 6300,
    decision: "auto",
    why: "Objekt eindeutig",
    resultBadge: "auto",
    activeLeadId: "max",
    qualityActiveCount: 6,
    timeline: [
      { time: "09:41", event: "Eingang", tone: "neutral" },
      { time: "09:41", event: "Entscheidung", tone: "neutral" },
      { time: "09:41", event: "Versand", tone: "ok" },
      { time: "09:41", event: "Status gespeichert", tone: "ok" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
  },
];

function sceneByKey(key: DemoSceneKey) {
  return SCENES.find((scene) => scene.key === key) ?? SCENES[0];
}

function badgeClass(status: DemoLead["status"]) {
  if (status === "Zur Freigabe") return "bg-amber-50 text-amber-800 ring-amber-200";
  if (status === "Auto gesendet") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "Ignoriert") return "bg-slate-100 text-slate-700 ring-slate-200";
  if (status === "Eskalation") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-blue-50 text-blue-700 ring-blue-200";
}

function priorityClass(priority: DemoLead["priority"]) {
  if (priority === "Hoch") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (priority === "Mittel") return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function timelineIcon(tone?: "neutral" | "warn" | "ok") {
  if (tone === "ok") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (tone === "warn") return <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />;
  return <Timer className="h-3.5 w-3.5 text-slate-600" />;
}

export default function DemoUiStudio() {
  const searchParams = useSearchParams();
  const cleanMode = searchParams.get("clean") === "1";

  const [sceneKey, setSceneKey] = useState<DemoSceneKey>("hero");
  const [autoplay, setAutoplay] = useState(true);
  const [tick, setTick] = useState(0);

  const scene = useMemo(() => sceneByKey(sceneKey), [sceneKey]);

  useEffect(() => {
    setTick(0);
  }, [sceneKey]);

  useEffect(() => {
    if (!autoplay) return;

    const stepMs = 200;
    const id = window.setInterval(() => {
      setTick((current) => {
        const nextTick = current + stepMs;
        if (nextTick < scene.durationMs) return nextTick;
        const idx = SCENES.findIndex((item) => item.key === scene.key);
        const nextScene = SCENES[(idx + 1) % SCENES.length];
        setSceneKey(nextScene.key);
        return 0;
      });
    }, stepMs);

    return () => window.clearInterval(id);
  }, [autoplay, scene]);

  const progressPct = Math.max(0, Math.min(100, (tick / scene.durationMs) * 100));
  const checksAnimated = Math.max(
    0,
    Math.min(
      scene.qualityActiveCount,
      Math.floor((tick / Math.max(scene.durationMs, 1)) * (scene.qualityActiveCount + 1)),
    ),
  );

  const leads = useMemo(() => {
    const mapped = BASE_LEADS.map((lead) => ({ ...lead }));
    if (scene.key === "hero" || scene.key === "product_hero" || scene.key === "tour_log") {
      const max = mapped.find((lead) => lead.id === "max");
      if (max) max.status = "Auto gesendet";
    }
    if (scene.key === "inbox" || scene.key === "tour_inbox") {
      const j = mapped.find((lead) => lead.id === "jonas");
      if (j) j.status = "Ignoriert";
      const m = mapped.find((lead) => lead.id === "max");
      if (m) m.status = "Eingang geprüft";
    }
    if (scene.key === "approve" || scene.key === "tour_rules") {
      const m = mapped.find((lead) => lead.id === "max");
      if (m) m.status = "Zur Freigabe";
    }
    if (scene.key === "rules") {
      const m = mapped.find((lead) => lead.id === "max");
      if (m) m.status = "Zur Freigabe";
      const e = mapped.find((lead) => lead.id === "erika");
      if (e) e.status = "Auto gesendet";
    }
    return mapped;
  }, [scene]);

  const activeLead = leads.find((lead) => lead.id === scene.activeLeadId) ?? leads[0];

  return (
    <div className="space-y-4">
      {!cleanMode ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">Szenensteuerung</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Für Screenshot-Export: Szene wählen und bei Bedarf `?clean=1` an die URL hängen.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoplay((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--text)] hover:ring-1 hover:ring-[var(--gold-soft)]"
              >
                {autoplay ? <PauseCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {autoplay ? "Autoplay pausieren" : "Autoplay starten"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTick(0);
                  setSceneKey(scene.key);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--text)] hover:ring-1 hover:ring-[var(--gold-soft)]"
              >
                <RefreshCcw className="h-4 w-4" />
                Szene reset
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SCENES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSceneKey(item.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  scene.key === item.key
                    ? "border-[var(--gold)] bg-[var(--gold-soft)] text-[var(--text)]"
                    : "border-[var(--border)] bg-white text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section
        className={`relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(145deg,#f8fafc,#f5f7fb_45%,#f8f7f2)] shadow-[var(--shadow-md)] ${
          cleanMode ? "p-3" : "p-6"
        }`}
      >
        <div className="mx-auto w-full max-w-[1920px]">
          <div
            className={`mx-auto rounded-[22px] border border-[rgba(11,15,23,0.14)] bg-white shadow-[0_24px_60px_rgba(11,15,23,0.16)] ${
              cleanMode ? "h-[940px] w-full max-w-[1680px]" : "h-[940px] w-full max-w-[1680px]"
            }`}
          >
            <div className="flex h-full flex-col overflow-hidden rounded-[22px]">
              <div className="flex items-center justify-between border-b border-[var(--border)] bg-[#f8f9fb] px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
                  <span className="ml-2 text-xs font-medium text-[var(--muted)]">Advaic Demo Studio</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Autopilot: Aktiv
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Guardrails: Aktiv
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    <BellRing className="h-3.5 w-3.5" />
                    Postfach verbunden
                  </span>
                </div>
              </div>

              <div className="flex min-h-0 flex-1">
                <aside className="w-[122px] border-r border-[var(--border)] bg-[#fbfcfe] px-3 py-4">
                  <div className="mb-5 rounded-xl bg-white p-2 text-center text-sm font-bold text-[var(--text)] ring-1 ring-[var(--border)]">
                    Adv<span className="text-[var(--gold)]">aic</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl border border-[var(--gold-soft)] bg-[var(--gold-soft)]/45 px-2 py-2 text-xs font-semibold text-[var(--text)]">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Inbox className="h-3.5 w-3.5" />
                        Nachrichten
                      </div>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-white px-2 py-2 text-xs font-medium text-[var(--muted)]">
                      <div className="mb-1 flex items-center gap-1.5">
                        <ShieldEllipsis className="h-3.5 w-3.5" />
                        Zur Freigabe
                      </div>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-white px-2 py-2 text-xs font-medium text-[var(--muted)]">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5" />
                        Follow-ups
                      </div>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-white px-2 py-2 text-xs font-medium text-[var(--muted)]">
                      <div className="mb-1 flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5" />
                        Übersicht
                      </div>
                    </div>
                  </div>
                </aside>

                <div className="grid min-h-0 flex-1 grid-cols-20">
                  <section className="col-span-8 min-h-0 border-r border-[var(--border)] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[var(--text)]">Inbox</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                        <Sparkles className="h-3 w-3" />
                        3 Demo-Leads
                      </span>
                    </div>

                    <div className="space-y-3">
                      {leads.map((lead) => {
                        const isActive = lead.id === activeLead.id;
                        return (
                          <article
                            key={lead.id}
                            className={`rounded-2xl border bg-white p-3 shadow-[var(--shadow-sm)] transition ${
                              isActive
                                ? "border-[var(--gold)] shadow-[0_14px_26px_rgba(201,162,39,0.2)]"
                                : "border-[var(--border)]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0f3f8] text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--border)]">
                                {lead.initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <p className="text-sm font-semibold text-[var(--text)]">{lead.name}</p>
                                  <span className="text-xs text-[var(--muted)]">{lead.email}</span>
                                </div>
                                <p className="mt-1 truncate text-sm text-[var(--muted)]">{lead.snippet}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${badgeClass(lead.status)}`}
                                  >
                                    {lead.status}
                                  </span>
                                  <span className="rounded-full bg-[#edf2ff] px-2 py-0.5 text-[11px] font-medium text-[#3550a1] ring-1 ring-[#d9e3ff]">
                                    {lead.category}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${priorityClass(lead.priority)}`}
                                  >
                                    {lead.priority}
                                  </span>
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-col gap-1.5">
                                <button
                                  type="button"
                                  className="rounded-lg bg-[var(--black)] px-2.5 py-1.5 text-[11px] font-semibold text-white"
                                >
                                  {lead.primaryAction}
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[var(--text)]"
                                >
                                  {lead.secondaryAction}
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <section className="col-span-7 min-h-0 border-r border-[var(--border)] bg-[#fcfdff] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[var(--text)]">Konversation & Entwurf</h3>
                      <span className="text-xs font-medium text-[var(--muted)]">Betreff: Anfrage: Besichtigung möglich?</span>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)]">
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          <UserCircle2 className="h-3.5 w-3.5" />
                          Interessent
                        </div>
                        <p className="text-sm leading-6 text-[var(--text)]">
                          Guten Tag, ist die Immobilie noch verfügbar? Ich hätte Interesse an einer Besichtigung in
                          den nächsten Tagen.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[var(--gold-soft)] bg-[rgba(201,162,39,0.08)] p-3 shadow-[var(--shadow-sm)]">
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Advaic Entwurf
                        </div>
                        <p className="text-sm leading-6 text-[var(--text)]">
                          Guten Tag, vielen Dank für Ihre Anfrage. Die Immobilie ist aktuell verfügbar.
                          Gern schlage ich Ihnen zwei Besichtigungstermine vor: Dienstag um 17:30 Uhr oder Donnerstag
                          um 18:00 Uhr. Welche Uhrzeit passt Ihnen besser?
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-medium text-[var(--muted)]">{scene.footerLine}</p>
                  </section>

                  <section className="col-span-5 min-h-0 bg-white p-4">
                    <div className="space-y-3">
                      <article className="rounded-2xl border border-[var(--border)] bg-[#fcfdff] p-3 shadow-[var(--shadow-sm)]">
                        <h4 className="text-sm font-semibold text-[var(--text)]">Entscheidung</h4>
                        <div className="mt-2 space-y-2">
                          <div
                            className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs ${
                              scene.decision === "auto"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : "border-[var(--border)] bg-white text-[var(--muted)]"
                            }`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Auto senden
                            </span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </div>
                          <div
                            className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs ${
                              scene.decision === "approve"
                                ? "border-amber-300 bg-amber-50 text-amber-800"
                                : "border-[var(--border)] bg-white text-[var(--muted)]"
                            }`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <TriangleAlert className="h-3.5 w-3.5" />
                              Zur Freigabe
                            </span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </div>
                          <div
                            className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs ${
                              scene.decision === "ignore"
                                ? "border-slate-300 bg-slate-100 text-slate-700"
                                : "border-[var(--border)] bg-white text-[var(--muted)]"
                            }`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <XCircle className="h-3.5 w-3.5" />
                              Ignorieren
                            </span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          <span className="font-semibold text-[var(--text)]">Warum?</span> {scene.why}
                        </p>
                      </article>

                      <article className="rounded-2xl border border-[var(--border)] bg-[#fcfdff] p-3 shadow-[var(--shadow-sm)]">
                        <h4 className="text-sm font-semibold text-[var(--text)]">Qualitätschecks</h4>
                        <div className="mt-2 space-y-1.5">
                          {QUALITAET_CHECKS.map((item, index) => {
                            let state: CheckState = "pending";
                            if (index < checksAnimated) state = "done";
                            if (index === checksAnimated && checksAnimated < scene.qualityActiveCount) {
                              state = "active";
                            }
                            if (index >= scene.qualityActiveCount) state = "pending";

                            return (
                              <div
                                key={item}
                                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                                  state === "done"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : state === "active"
                                      ? "bg-amber-50 text-amber-800"
                                      : "bg-white text-[var(--muted)]"
                                }`}
                              >
                                <span>{item}</span>
                                {state === "done" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : state === "active" ? (
                                  <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <span className="h-3 w-3 rounded-full bg-[var(--border)]" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div
                          className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                            scene.resultBadge === "auto"
                              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                              : "bg-amber-50 text-amber-800 ring-amber-200"
                          }`}
                        >
                          {scene.resultBadge === "auto" ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Auto-Versand erlaubt
                            </>
                          ) : (
                            <>
                              <TriangleAlert className="h-3.5 w-3.5" />
                              Zur Freigabe
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-[var(--muted)]">Im Zweifel zur Freigabe</p>
                      </article>

                      <article className="rounded-2xl border border-[var(--border)] bg-[#fcfdff] p-3 shadow-[var(--shadow-sm)]">
                        <h4 className="text-sm font-semibold text-[var(--text)]">Verlauf</h4>
                        <div className="mt-2 space-y-1.5">
                          {scene.timeline.map((item) => (
                            <div
                              key={`${item.time}_${item.event}`}
                              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs text-[var(--text)] ring-1 ring-[var(--border)]"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                {timelineIcon(item.tone)}
                                {item.event}
                              </span>
                              <span className="font-mono text-[11px] text-[var(--muted)]">{item.time}</span>
                            </div>
                          ))}
                        </div>
                      </article>
                    </div>
                  </section>
                </div>
              </div>

              {!cleanMode ? (
                <div className="border-t border-[var(--border)] bg-[#fafbfd] px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-[var(--muted)]">
                      Aktive Szene: <span className="font-semibold text-[var(--text)]">{scene.label}</span>
                    </div>
                    <div className="flex min-w-[240px] items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e9edf3]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,var(--gold),var(--gold-2))] transition-[width] duration-200"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="w-[62px] text-right text-[11px] font-medium text-[var(--muted)]">
                        {Math.round(progressPct)}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

