"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Home,
  Inbox,
  Maximize2,
  MessageSquare,
  Minimize2,
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
type ResultKind = "auto" | "approve" | "ignore";
type CheckState = "done" | "active" | "pending";

type TimelineItem = { time: string; event: string; tone?: "neutral" | "warn" | "ok" };

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

type DemoScene = {
  key: DemoSceneKey;
  label: string;
  durationMs: number;
  decision: DecisionKind;
  why: string;
  resultBadge: ResultKind;
  activeLeadId: string;
  qualityActiveCount: number;
  timeline: TimelineItem[];
  footerLine: string;
  subject: string;
  inboundText: string;
  draftText: string;
  focusLine: string;
  leadOverrides?: Partial<Record<DemoLead["id"], Partial<DemoLead>>>;
  editFromPct?: number;
  sendFromPct?: number;
  draftEditedSuffix?: string;
};

const BASE_LEADS: DemoLead[] = [
  {
    id: "max",
    initials: "MM",
    name: "Max Mustermann",
    email: "max.mustermann@email.de",
    snippet: "Ist die Wohnung in der Lindenstraße noch verfügbar?",
    status: "Eingang geprüft",
    category: "Mieten",
    priority: "Hoch",
    primaryAction: "Antworten",
    secondaryAction: "Bearbeiten",
  },
  {
    id: "erika",
    initials: "EB",
    name: "Erika Beispiel",
    email: "erika.beispiel@email.de",
    snippet: "Ich interessiere mich für das Kaufobjekt in der Parkallee.",
    status: "Eingang geprüft",
    category: "Kaufen",
    priority: "Mittel",
    primaryAction: "Antworten",
    secondaryAction: "Bearbeiten",
  },
  {
    id: "jonas",
    initials: "JB",
    name: "Jonas Beispiel",
    email: "newsletter@reports.de",
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
      { time: "09:41:02", event: "Eingang", tone: "neutral" },
      { time: "09:41:03", event: "Entscheidung: Auto senden", tone: "ok" },
      { time: "09:41:05", event: "Qualitätschecks abgeschlossen", tone: "ok" },
      { time: "09:41:06", event: "Versand", tone: "ok" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
    subject: "Anfrage: Besichtigung in der Lindenstraße",
    inboundText:
      "Guten Tag, ist die Wohnung noch verfügbar? Ich könnte Dienstag oder Donnerstag für eine Besichtigung.",
    draftText:
      "Guten Tag, vielen Dank für Ihre Anfrage. Die Wohnung ist aktuell verfügbar. Ich kann Ihnen Dienstag um 17:30 Uhr oder Donnerstag um 18:00 Uhr anbieten. Welche Uhrzeit passt Ihnen besser?",
    focusLine: "Kompletter Workflow in einem Durchlauf: Eingang → Entscheidung → Qualitätschecks → Versand.",
    leadOverrides: {
      max: { status: "Eingang geprüft", primaryAction: "Antworten", secondaryAction: "Bearbeiten" },
      erika: { status: "Eingang geprüft" },
      jonas: { status: "Eingang geprüft" },
    },
    sendFromPct: 70,
  },
  {
    key: "inbox",
    label: "inbox.webm",
    durationMs: 6000,
    decision: "ignore",
    why: "Newsletter/no-reply erkannt",
    resultBadge: "ignore",
    activeLeadId: "jonas",
    qualityActiveCount: 1,
    timeline: [
      { time: "09:44:11", event: "Eingang", tone: "neutral" },
      { time: "09:44:12", event: "Interessent erkannt (Max)", tone: "ok" },
      { time: "09:44:13", event: "Newsletter erkannt", tone: "warn" },
      { time: "09:44:13", event: "Ignoriert", tone: "warn" },
    ],
    footerLine: "Kein Versand für ignorierte E-Mails",
    subject: "Systemhinweis: Newsletter-Verteiler",
    inboundText: "Automatische Rundmail (no-reply): Marktreport Q2. Diese Nachricht ist nicht antwortfähig.",
    draftText:
      "Kein Entwurf erstellt. Diese Nachricht wurde als Newsletter/no-reply eingestuft und daher ignoriert.",
    focusLine: "Der Unterschied zwischen echter Interessenten-Anfrage und irrelevanten E-Mails wird sichtbar.",
    leadOverrides: {
      max: { status: "Eingang geprüft", snippet: "Ist die Wohnung in der Lindenstraße noch verfügbar?" },
      erika: { status: "Eingang geprüft" },
      jonas: { status: "Ignoriert", primaryAction: "Prüfen", secondaryAction: "Öffnen" },
    },
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
      { time: "09:47:08", event: "Eingang", tone: "neutral" },
      { time: "09:47:09", event: "Auto-Pfad (Erika) bestätigt", tone: "ok" },
      { time: "09:47:10", event: "Max: Objektbezug unklar", tone: "warn" },
      { time: "09:47:10", event: "Zur Freigabe", tone: "warn" },
    ],
    footerLine: "Im Zweifel geht der Fall zur Freigabe",
    subject: "Anfrage: Welche Wohnung meinen Sie?",
    inboundText:
      "Hallo, ich habe Interesse an Ihrer Anzeige. Ist sie noch frei? Ich habe die Adresse leider nicht notiert.",
    draftText:
      "Vielen Dank für Ihre Nachricht. Damit ich Ihnen korrekt antworten kann, nennen Sie mir bitte kurz das Objekt oder die Adresse. Danach sende ich Ihnen direkt die nächsten Schritte.",
    focusLine: "Ein Loop zeigt beide Regelpfade: klarer Fall = Auto, unklarer Fall = Freigabe.",
    leadOverrides: {
      max: { status: "Zur Freigabe", primaryAction: "Freigeben", secondaryAction: "Bearbeiten" },
      erika: { status: "Auto gesendet", snippet: "Vielen Dank, Exposé und Termine wurden gesendet." },
    },
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
      { time: "09:49:21", event: "Eingang", tone: "neutral" },
      { time: "09:49:22", event: "Entwurf erzeugt", tone: "neutral" },
      { time: "09:49:24", event: "Qualitätschecks abgeschlossen", tone: "ok" },
      { time: "09:49:25", event: "Auto-Versand freigegeben", tone: "ok" },
    ],
    footerLine: "Qualität vor Geschwindigkeit",
    subject: "Anfrage: Unterlagenliste und Termin",
    inboundText:
      "Können Sie mir vor der Besichtigung sagen, welche Unterlagen Sie benötigen? Dann bereite ich alles vor.",
    draftText:
      "Sehr gern. Für die Besichtigung benötige ich vorab eine kurze Selbstauskunft, Einkommensnachweise und eine SCHUFA-Auskunft. Sobald die Unterlagen vorliegen, sende ich Ihnen direkt zwei Terminoptionen.",
    focusLine: "Die Qualitätsprüfungen laufen sichtbar nacheinander durch.",
    leadOverrides: {
      max: { status: "Eingang geprüft" },
      erika: { status: "Eingang geprüft" },
      jonas: { status: "Ignoriert" },
    },
    sendFromPct: 78,
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
      { time: "09:52:01", event: "Eingang", tone: "neutral" },
      { time: "09:52:02", event: "Zur Freigabe", tone: "warn" },
      { time: "09:52:04", event: "Bearbeitet", tone: "neutral" },
      { time: "09:52:05", event: "Freigegeben & Versand", tone: "ok" },
    ],
    footerLine: "Freigabe schützt bei unklaren Fällen",
    subject: "Anfrage: Bitte um Rückruf zum Objekt",
    inboundText:
      "Guten Tag, ich hätte Interesse am Objekt, bin mir aber unsicher, welche Wohnung genau gemeint ist.",
    draftText:
      "Vielen Dank für Ihre Nachricht. Gern unterstütze ich Sie direkt. Bitte nennen Sie mir kurz die Adresse oder den Link zur Anzeige, damit ich Ihnen die richtigen Informationen sende.",
    draftEditedSuffix:
      "Zusatz nach Bearbeitung: Ich habe Ihnen parallel zwei Zeitfenster für einen kurzen Rückruf reserviert.",
    focusLine: "Der Bearbeitungsschritt vor „Freigeben & senden“ ist klar sichtbar.",
    leadOverrides: {
      max: { status: "Zur Freigabe", primaryAction: "Bearbeiten", secondaryAction: "Ablehnen" },
      erika: { status: "Eskalation", snippet: "Konfliktfall mit Sonderwunsch, manuelle Prüfung nötig." },
      jonas: { status: "Ignoriert" },
    },
    editFromPct: 40,
    sendFromPct: 72,
  },
  {
    key: "product_hero",
    label: "product-hero.webm",
    durationMs: 7400,
    decision: "auto",
    why: "Objekt eindeutig",
    resultBadge: "auto",
    activeLeadId: "erika",
    qualityActiveCount: 6,
    timeline: [
      { time: "10:01:10", event: "Eingang", tone: "neutral" },
      { time: "10:01:11", event: "Entscheidung: Auto senden", tone: "ok" },
      { time: "10:01:13", event: "Qualitätschecks", tone: "ok" },
      { time: "10:01:14", event: "Versand", tone: "ok" },
      { time: "10:01:14", event: "Status gespeichert", tone: "ok" },
    ],
    footerLine: "Eingang → Entscheidung → Versand",
    subject: "Anfrage: Exposé und Besichtigung (Kaufobjekt)",
    inboundText:
      "Guten Tag, ich interessiere mich für das Objekt in der Parkallee. Ist es noch verfügbar? Ich hätte gern ein Exposé.",
    draftText:
      "Vielen Dank für Ihre Anfrage. Das Objekt ist aktuell verfügbar. Ich sende Ihnen das Exposé direkt im Anschluss und biete Ihnen Mittwoch um 16:30 Uhr oder Freitag um 11:00 Uhr für eine Besichtigung an.",
    focusLine: "Hero-Version für Produktseite mit kompletter Timeline.",
    leadOverrides: {
      erika: { status: "Eingang geprüft", primaryAction: "Antworten", secondaryAction: "Bearbeiten" },
      max: { status: "Eingang geprüft" },
      jonas: { status: "Ignoriert" },
    },
    sendFromPct: 68,
  },
  {
    key: "tour_inbox",
    label: "tour-inbox.webm",
    durationMs: 6200,
    decision: "ignore",
    why: "Newsletter/no-reply erkannt",
    resultBadge: "ignore",
    activeLeadId: "jonas",
    qualityActiveCount: 2,
    timeline: [
      { time: "10:05:31", event: "Eingang", tone: "neutral" },
      { time: "10:05:32", event: "Max: Eingang geprüft", tone: "ok" },
      { time: "10:05:33", event: "Jonas: Ignoriert", tone: "warn" },
    ],
    footerLine: "Eingang geprüft und Ignoriert getrennt dargestellt",
    subject: "Tour Schritt 1: Eingang",
    inboundText:
      "Neue E-Mails wurden geprüft. Eine echte Anfrage bleibt im Prozess, ein Newsletter wird automatisch ignoriert.",
    draftText:
      "Kein Versand bei Newsletter/no-reply. Die echte Anfrage bleibt zur weiteren Entscheidung im Posteingang.",
    focusLine: "Sticky-Tour Step 1 mit klarer Trennung zwischen Anfrage und Newsletter.",
    leadOverrides: {
      max: { status: "Eingang geprüft" },
      erika: { status: "Eingang geprüft" },
      jonas: { status: "Ignoriert" },
    },
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
      { time: "10:08:12", event: "Eingang", tone: "neutral" },
      { time: "10:08:13", event: "Erika: Auto senden", tone: "ok" },
      { time: "10:08:14", event: "Max: Zur Freigabe", tone: "warn" },
    ],
    footerLine: "Regelpfade sind transparent",
    subject: "Tour Schritt 2: Entscheidung",
    inboundText:
      "Anfrage ohne eindeutigen Objektbezug: „Ist sie noch verfügbar?“ — ohne Adresse oder Link.",
    draftText:
      "Entwurf vorbereitet, aber vor Versand gestoppt. Der Fall geht zur Freigabe, bis der Objektbezug geklärt ist.",
    focusLine: "Sticky-Tour Step 2 mit sichtbarer Begründung für Freigabe.",
    leadOverrides: {
      max: { status: "Zur Freigabe", primaryAction: "Freigeben", secondaryAction: "Bearbeiten" },
      erika: { status: "Auto gesendet", snippet: "Objekt eindeutig, Antwort automatisch versendet." },
      jonas: { status: "Ignoriert" },
    },
  },
  {
    key: "tour_checks",
    label: "tour-checks.webm",
    durationMs: 6400,
    decision: "approve",
    why: "Risiko unsicher → Zur Freigabe",
    resultBadge: "approve",
    activeLeadId: "erika",
    qualityActiveCount: 6,
    timeline: [
      { time: "10:11:40", event: "Eingang", tone: "neutral" },
      { time: "10:11:41", event: "Entwurf erzeugt", tone: "neutral" },
      { time: "10:11:43", event: "Risiko-Check: unsicher", tone: "warn" },
      { time: "10:11:44", event: "Zur Freigabe", tone: "warn" },
    ],
    footerLine: "Qualitätschecks stoppen im Zweifel automatisch",
    subject: "Tour Schritt 3: Qualitätskontrollen",
    inboundText:
      "Beschwerde mit heiklem Tonfall: „Ich bin unzufrieden mit Ihrem Ablauf und erwarte sofortige Klärung.“",
    draftText:
      "Entwurf wurde erstellt, aber nicht versendet. Aufgrund erhöhter Risikobewertung ist eine menschliche Freigabe erforderlich.",
    focusLine: "Sticky-Tour Step 3: Qualitätscheck mit Fail-Safe statt blindem Versand.",
    leadOverrides: {
      erika: { status: "Zur Freigabe", primaryAction: "Freigeben", secondaryAction: "Bearbeiten", priority: "Hoch" },
      max: { status: "Eingang geprüft" },
      jonas: { status: "Ignoriert" },
    },
  },
  {
    key: "tour_log",
    label: "tour-log.webm",
    durationMs: 6300,
    decision: "auto",
    why: "Standardfrage erkannt",
    resultBadge: "auto",
    activeLeadId: "max",
    qualityActiveCount: 6,
    timeline: [
      { time: "10:14:02", event: "Eingang", tone: "neutral" },
      { time: "10:14:03", event: "Entscheidung", tone: "neutral" },
      { time: "10:14:04", event: "Qualitätschecks", tone: "ok" },
      { time: "10:14:05", event: "Versand", tone: "ok" },
      { time: "10:14:05", event: "Status gespeichert", tone: "ok" },
    ],
    footerLine: "Gesendet über Ihr Postfach",
    subject: "Tour Schritt 4: Versand & Verlauf",
    inboundText: "Standardanfrage zu Verfügbarkeit und Besichtigungstermin.",
    draftText:
      "Vielen Dank für Ihre Anfrage. Die Immobilie ist verfügbar. Ich sende Ihnen direkt zwei Besichtigungstermine sowie die nächsten Schritte.",
    focusLine: "Sticky-Tour Step 4: Verlauf mit Zeitstempel und Status.",
    leadOverrides: {
      max: { status: "Auto gesendet", primaryAction: "Antworten", secondaryAction: "Bearbeiten" },
      erika: { status: "Zur Freigabe" },
      jonas: { status: "Ignoriert" },
    },
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

function mergeLead(base: DemoLead, override?: Partial<DemoLead>): DemoLead {
  if (!override) return base;
  return { ...base, ...override };
}

function resultBadgeNode(result: ResultKind) {
  if (result === "auto") {
    return {
      className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "Auto-Versand erlaubt",
    };
  }
  if (result === "ignore") {
    return {
      className: "bg-slate-100 text-slate-700 ring-slate-200",
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: "Ignorieren (kein Versand)",
    };
  }
  return {
    className: "bg-amber-50 text-amber-800 ring-amber-200",
    icon: <TriangleAlert className="h-3.5 w-3.5" />,
    label: "Zur Freigabe",
  };
}

export default function DemoUiStudio() {
  const searchParams = useSearchParams();
  const cleanMode = searchParams.get("clean") === "1";

  const [sceneKey, setSceneKey] = useState<DemoSceneKey>("hero");
  const [autoplay, setAutoplay] = useState(true);
  const [tick, setTick] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const stage = stageRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void }) | null;
    if (!stage) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
      return;
    }

    if (stage.requestFullscreen) {
      await stage.requestFullscreen().catch(() => undefined);
      return;
    }

    if (stage.webkitRequestFullscreen) {
      stage.webkitRequestFullscreen();
    }
  };

  const progressPct = Math.max(0, Math.min(100, (tick / scene.durationMs) * 100));
  const checksAnimated = Math.max(
    0,
    Math.min(
      scene.qualityActiveCount,
      Math.floor((tick / Math.max(scene.durationMs, 1)) * (scene.qualityActiveCount + 1)),
    ),
  );

  const timelineVisibleCount = Math.max(
    1,
    Math.min(scene.timeline.length, Math.floor((tick / Math.max(scene.durationMs, 1)) * (scene.timeline.length + 0.9))),
  );
  const visibleTimeline = scene.timeline.slice(0, timelineVisibleCount);

  const leads = useMemo(() => {
    const mapped = BASE_LEADS.map((lead) => mergeLead(lead, scene.leadOverrides?.[lead.id]));
    const sendReached = scene.sendFromPct ? progressPct >= scene.sendFromPct : false;

    if (sendReached && scene.resultBadge === "auto") {
      const lead = mapped.find((item) => item.id === scene.activeLeadId);
      if (lead) lead.status = "Auto gesendet";
    }

    if (scene.key === "approve") {
      const lead = mapped.find((item) => item.id === "max");
      if (lead) {
        if (progressPct >= 56 && progressPct < 72) lead.primaryAction = "Freigeben & senden";
        if (progressPct >= 72) {
          lead.status = "Auto gesendet";
          lead.primaryAction = "Antworten";
          lead.secondaryAction = "Verlauf";
        }
      }
    }

    return mapped;
  }, [progressPct, scene]);

  const activeLead = leads.find((lead) => lead.id === scene.activeLeadId) ?? leads[0];
  const badge = resultBadgeNode(scene.resultBadge);
  const showEditedDraft = typeof scene.editFromPct === "number" ? progressPct >= scene.editFromPct : false;
  const draftBody =
    showEditedDraft && scene.draftEditedSuffix
      ? `${scene.draftText}\n\n${scene.draftEditedSuffix}`
      : scene.draftText;

  return (
    <div className="space-y-4">
      {!cleanMode ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">Szenensteuerung</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Jede Szene bildet einen anderen Loop ab. Für Export: Szene wählen, `?clean=1` nutzen und optional
                Vollbild aktivieren.
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
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--text)] hover:ring-1 hover:ring-[var(--gold-soft)]"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {isFullscreen ? "Vollbild beenden" : "Vollbild"}
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
        ref={stageRef}
        className={`relative overflow-hidden border border-[var(--border)] bg-[linear-gradient(145deg,#f8fafc,#f5f7fb_45%,#f8f7f2)] shadow-[var(--shadow-md)] ${
          isFullscreen ? "h-[100dvh] rounded-none p-2 md:p-3" : "rounded-3xl p-4 md:p-6"
        }`}
      >
        {cleanMode ? (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] shadow-[var(--shadow-sm)] backdrop-blur"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {isFullscreen ? "Beenden" : "Vollbild"}
          </button>
        ) : null}

        <div className="mx-auto w-full max-w-[1920px]">
          <div
            className={`mx-auto w-full rounded-[22px] border border-[rgba(11,15,23,0.14)] bg-white shadow-[0_24px_60px_rgba(11,15,23,0.16)] ${
              isFullscreen ? "h-[calc(100dvh-18px)] max-w-none" : "h-[940px] max-w-[1680px]"
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
                        {scene.label}
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
                      <span className="text-xs font-medium text-[var(--muted)]">Betreff: {scene.subject}</span>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)]">
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          <UserCircle2 className="h-3.5 w-3.5" />
                          Interessent/System
                        </div>
                        <p className="text-sm leading-6 text-[var(--text)]">{scene.inboundText}</p>
                      </div>

                      <div className="rounded-2xl border border-[var(--gold-soft)] bg-[rgba(201,162,39,0.08)] p-3 shadow-[var(--shadow-sm)]">
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Advaic Entwurf
                        </div>
                        <p className="whitespace-pre-line text-sm leading-6 text-[var(--text)]">{draftBody}</p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-medium text-[var(--muted)]">{scene.footerLine}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{scene.focusLine}</p>
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
                            if (index === checksAnimated && checksAnimated < scene.qualityActiveCount) state = "active";
                            if (index >= scene.qualityActiveCount) state = "pending";

                            const riskFail = item === "Risiko" && scene.resultBadge === "approve" && state === "done";
                            const stateClass =
                              state === "done"
                                ? riskFail
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-emerald-50 text-emerald-800"
                                : state === "active"
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-white text-[var(--muted)]";

                            return (
                              <div key={item} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${stateClass}`}>
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

                        <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badge.className}`}>
                          {badge.icon}
                          {badge.label}
                        </div>
                        <p className="mt-1 text-[11px] text-[var(--muted)]">Im Zweifel zur Freigabe</p>
                      </article>

                      <article className="rounded-2xl border border-[var(--border)] bg-[#fcfdff] p-3 shadow-[var(--shadow-sm)]">
                        <h4 className="text-sm font-semibold text-[var(--text)]">Verlauf</h4>
                        <div className="mt-2 space-y-1.5">
                          {visibleTimeline.map((item) => (
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
