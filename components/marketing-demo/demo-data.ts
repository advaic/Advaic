import type { DemoInboxItem, DemoStatus, TimelineEvent } from "@/components/marketing-demo/types";

export const DEMO_BASE_ITEMS: Record<string, Omit<DemoInboxItem, "status">> = {
  julia: {
    id: "julia",
    refId: "inbox-julia",
    initials: "JB",
    name: "Julia Berger",
    email: "julia.berger@email.de",
    snippet: "Hallo, ist die Wohnung in der Lindenstraße noch frei? Besichtigung möglich?",
    category: "Mieten",
    priority: "Hoch",
    primaryAction: "Antworten",
    secondaryAction: "Bearbeiten",
  },
  tim: {
    id: "tim",
    refId: "inbox-tim",
    initials: "TS",
    name: "Tim Schneider",
    email: "tim.schneider@email.de",
    snippet: "Guten Tag, ich interessiere mich für das Objekt Parkallee. Exposé möglich?",
    category: "Kaufen",
    priority: "Mittel",
    primaryAction: "Antworten",
    secondaryAction: "Bearbeiten",
  },
  system: {
    id: "system",
    refId: "inbox-system",
    initials: "IS",
    name: "ImmoScout24 System",
    email: "noreply@immobilienscout24.de",
    snippet: "Hinweis: Ihre Anzeige läuft bald ab. Jetzt verlängern.",
    priority: "Niedrig",
    primaryAction: "Prüfen",
    secondaryAction: "Öffnen",
  },
  daemon: {
    id: "daemon",
    refId: "inbox-daemon",
    initials: "MD",
    name: "Mailer-Daemon",
    email: "mailer-daemon@googlemail.com",
    snippet: "Delivery Status Notification (Failure)",
    priority: "Niedrig",
    primaryAction: "Prüfen",
    secondaryAction: "Öffnen",
  },
  anna: {
    id: "anna",
    refId: "inbox-anna",
    initials: "AK",
    name: "Anna K.",
    email: "anna.k@email.de",
    snippet: "Ist sie noch frei? Ich finde den Link gerade nicht.",
    category: "Mieten",
    priority: "Mittel",
    primaryAction: "Freigeben",
    secondaryAction: "Bearbeiten",
  },
};

export function makeItem(id: keyof typeof DEMO_BASE_ITEMS, status: DemoStatus): DemoInboxItem {
  return { ...DEMO_BASE_ITEMS[id], status };
}

export function heroTimeline(visibleCount: number): TimelineEvent[] {
  const all: TimelineEvent[] = [
    { time: "09:41:02", label: "Eingang", tone: "neutral" },
    { time: "09:41:03", label: "Entscheidung", tone: "ok" },
    { time: "09:41:05", label: "Qualitätschecks", tone: "ok" },
    { time: "09:41:06", label: "Versand", tone: "ok" },
  ];
  return all.slice(0, Math.max(1, Math.min(visibleCount, all.length)));
}
