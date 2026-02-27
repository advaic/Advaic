export type DemoStatus =
  | "Eingang geprüft"
  | "Auto gesendet"
  | "Zur Freigabe"
  | "Ignoriert"
  | "Freigegeben & gesendet"
  | "Eskalation";

export type DemoCategory = "Mieten" | "Kaufen";
export type DemoPriority = "Hoch" | "Mittel" | "Niedrig";

export type DemoInboxItem = {
  id: string;
  refId: string;
  initials: string;
  name: string;
  email: string;
  snippet: string;
  category?: DemoCategory;
  priority: DemoPriority;
  status: DemoStatus;
  primaryAction?: string;
  secondaryAction?: string;
};

export type DecisionState = "auto" | "approve" | "ignore";

export type TimelineEventTone = "neutral" | "ok" | "warn";

export type TimelineEvent = {
  time: string;
  label: string;
  tone?: TimelineEventTone;
};

export type StoryArrow = {
  fromRef: string;
  toRef: string;
  color?: "muted" | "gold";
  fromAnchor?: "auto" | "left" | "right" | "top" | "bottom" | "center";
  toAnchor?: "auto" | "left" | "right" | "top" | "bottom" | "center";
};

export type StoryBeat = {
  startMs: number;
  endMs: number;
  stepLabel?: string;
  dim?: boolean;
  highlights?: string[];
  arrows?: StoryArrow[];
};

export type SceneKey =
  | "hero"
  | "inbox"
  | "rules"
  | "checks"
  | "approve"
  | "product-hero"
  | "tour-1-inbox"
  | "tour-2-rules"
  | "tour-3-checks"
  | "tour-4-log";
