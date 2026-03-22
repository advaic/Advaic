export type ChangeComparableProspect = {
  contact_name?: string | null;
  contact_email?: string | null;
  contact_role?: string | null;
  linkedin_url?: string | null;
  active_listings_count?: number | null;
  object_types?: string[] | null;
  region_focus_micro?: string | null;
  trust_signals?: string[] | null;
  target_group?: string | null;
  process_hint?: string | null;
  response_promise_public?: string | null;
  appointment_flow_public?: string | null;
  docs_flow_public?: string | null;
  personalization_hook?: string | null;
  owner_led?: boolean | null;
  years_in_market?: number | null;
  stage?: string | null;
  next_action?: string | null;
  next_action_at?: string | null;
};

export type ResearchChangeItem = {
  field: string;
  label: string;
  severity: "high" | "medium";
  previous: string | null;
  current: string | null;
  summary: string;
};

export type ResearchChangeSummary = {
  detected: boolean;
  severity: "none" | "medium" | "high";
  count: number;
  summary: string;
  items: ResearchChangeItem[];
  operator_action_required: boolean;
};

function clean(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeKey(value: unknown, max = 240) {
  return clean(value, max)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function summarizeList(value: string[] | null | undefined, max = 5) {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value
    .map((item) => clean(item, 80))
    .filter(Boolean)
    .slice(0, max)
    .join(", ");
}

function normalizeList(value: string[] | null | undefined) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => normalizeKey(item, 120)).filter(Boolean))];
}

function listChanged(previous: string[] | null | undefined, current: string[] | null | undefined) {
  const prev = normalizeList(previous);
  const next = normalizeList(current);
  if (prev.length === 0 || next.length === 0) return false;
  if (prev.length !== next.length) return true;
  return prev.some((item) => !next.includes(item));
}

function scalarChanged(previous: unknown, current: unknown) {
  const prev = normalizeKey(previous);
  const next = normalizeKey(current);
  if (!prev || !next) return false;
  return prev !== next;
}

function boolSummary(value: boolean | null | undefined) {
  if (value === true) return "Ja";
  if (value === false) return "Nein";
  return null;
}

function numericSummary(value: number | null | undefined) {
  return Number.isFinite(Number(value)) ? String(Math.round(Number(value))) : null;
}

function significantNumberChange(previous: number | null | undefined, current: number | null | undefined) {
  if (!Number.isFinite(Number(previous)) || !Number.isFinite(Number(current))) return false;
  const prev = Number(previous);
  const next = Number(current);
  if (prev <= 0 || next <= 0) return Math.abs(prev - next) >= 5;
  const absoluteDelta = Math.abs(next - prev);
  const relativeDelta = absoluteDelta / Math.max(prev, 1);
  return absoluteDelta >= 5 && relativeDelta >= 0.2;
}

function addChange(
  items: ResearchChangeItem[],
  item: Omit<ResearchChangeItem, "summary">,
) {
  items.push({
    ...item,
    summary: `${item.label}: ${item.previous || "unbekannt"} -> ${item.current || "unbekannt"}`,
  });
}

export function detectResearchChanges(args: {
  before: ChangeComparableProspect;
  after: ChangeComparableProspect;
}): ResearchChangeSummary {
  const { before, after } = args;
  const items: ResearchChangeItem[] = [];

  if (scalarChanged(before.contact_email, after.contact_email)) {
    addChange(items, {
      field: "contact_email",
      label: "Kontakt-Mail geändert",
      severity: "high",
      previous: clean(before.contact_email, 160) || null,
      current: clean(after.contact_email, 160) || null,
    });
  }
  if (scalarChanged(before.contact_name, after.contact_name)) {
    addChange(items, {
      field: "contact_name",
      label: "Ansprechpartner geändert",
      severity: "high",
      previous: clean(before.contact_name, 160) || null,
      current: clean(after.contact_name, 160) || null,
    });
  }
  if (scalarChanged(before.contact_role, after.contact_role)) {
    addChange(items, {
      field: "contact_role",
      label: "Kontaktrolle geändert",
      severity: "medium",
      previous: clean(before.contact_role, 120) || null,
      current: clean(after.contact_role, 120) || null,
    });
  }
  if (scalarChanged(before.linkedin_url, after.linkedin_url)) {
    addChange(items, {
      field: "linkedin_url",
      label: "LinkedIn-Pfad geändert",
      severity: "medium",
      previous: clean(before.linkedin_url, 180) || null,
      current: clean(after.linkedin_url, 180) || null,
    });
  }
  if (significantNumberChange(before.active_listings_count, after.active_listings_count)) {
    addChange(items, {
      field: "active_listings_count",
      label: "Listing-Volumen geändert",
      severity: "high",
      previous: numericSummary(before.active_listings_count),
      current: numericSummary(after.active_listings_count),
    });
  }
  if (listChanged(before.object_types, after.object_types)) {
    addChange(items, {
      field: "object_types",
      label: "Objektmix geändert",
      severity: "high",
      previous: summarizeList(before.object_types),
      current: summarizeList(after.object_types),
    });
  }
  if (scalarChanged(before.region_focus_micro, after.region_focus_micro)) {
    addChange(items, {
      field: "region_focus_micro",
      label: "Mikro-Region geändert",
      severity: "medium",
      previous: clean(before.region_focus_micro, 160) || null,
      current: clean(after.region_focus_micro, 160) || null,
    });
  }
  if (listChanged(before.trust_signals, after.trust_signals)) {
    addChange(items, {
      field: "trust_signals",
      label: "Trust-Signale geändert",
      severity: "medium",
      previous: summarizeList(before.trust_signals),
      current: summarizeList(after.trust_signals),
    });
  }
  if (scalarChanged(before.target_group, after.target_group)) {
    addChange(items, {
      field: "target_group",
      label: "Zielgruppe geändert",
      severity: "medium",
      previous: clean(before.target_group, 160) || null,
      current: clean(after.target_group, 160) || null,
    });
  }
  if (scalarChanged(before.process_hint, after.process_hint)) {
    addChange(items, {
      field: "process_hint",
      label: "Prozesssignal geändert",
      severity: "high",
      previous: clean(before.process_hint, 180) || null,
      current: clean(after.process_hint, 180) || null,
    });
  }
  if (scalarChanged(before.response_promise_public, after.response_promise_public)) {
    addChange(items, {
      field: "response_promise_public",
      label: "Antwortversprechen geändert",
      severity: "medium",
      previous: clean(before.response_promise_public, 160) || null,
      current: clean(after.response_promise_public, 160) || null,
    });
  }
  if (scalarChanged(before.appointment_flow_public, after.appointment_flow_public)) {
    addChange(items, {
      field: "appointment_flow_public",
      label: "Terminablauf geändert",
      severity: "medium",
      previous: clean(before.appointment_flow_public, 160) || null,
      current: clean(after.appointment_flow_public, 160) || null,
    });
  }
  if (scalarChanged(before.docs_flow_public, after.docs_flow_public)) {
    addChange(items, {
      field: "docs_flow_public",
      label: "Unterlagenprozess geändert",
      severity: "medium",
      previous: clean(before.docs_flow_public, 160) || null,
      current: clean(after.docs_flow_public, 160) || null,
    });
  }
  if (scalarChanged(before.personalization_hook, after.personalization_hook)) {
    addChange(items, {
      field: "personalization_hook",
      label: "Outreach-Hook geändert",
      severity: "high",
      previous: clean(before.personalization_hook, 180) || null,
      current: clean(after.personalization_hook, 180) || null,
    });
  }
  if (
    before.owner_led !== null &&
    before.owner_led !== undefined &&
    after.owner_led !== null &&
    after.owner_led !== undefined &&
    before.owner_led !== after.owner_led
  ) {
    addChange(items, {
      field: "owner_led",
      label: "Owner-Setup geändert",
      severity: "high",
      previous: boolSummary(before.owner_led),
      current: boolSummary(after.owner_led),
    });
  }
  if (significantNumberChange(before.years_in_market, after.years_in_market)) {
    addChange(items, {
      field: "years_in_market",
      label: "Markterfahrung neu bewertet",
      severity: "medium",
      previous: numericSummary(before.years_in_market),
      current: numericSummary(after.years_in_market),
    });
  }

  const severity =
    items.some((item) => item.severity === "high") ? "high" : items.length > 0 ? "medium" : "none";
  const operatorActionRequired =
    items.some((item) => item.severity === "high") || items.length >= 3;
  const summary =
    items.length === 0
      ? "Keine belastbaren Account-Aenderungen erkannt."
      : `${items.length} Account-Aenderung${items.length === 1 ? "" : "en"} erkannt: ${items
          .slice(0, 3)
          .map((item) => item.label)
          .join(" · ")}.`;

  return {
    detected: items.length > 0,
    severity,
    count: items.length,
    summary,
    items,
    operator_action_required: operatorActionRequired,
  };
}

export function shouldOpenChangeReviewTask(args: {
  prospect: ChangeComparableProspect;
  summary: ResearchChangeSummary;
}) {
  if (!args.summary.operator_action_required) return false;
  const stage = clean(args.prospect.stage, 40).toLowerCase();
  if (!["new", "researching", "contacted", "nurture"].includes(stage)) return false;

  const nextAction = clean(args.prospect.next_action, 180).toLowerCase();
  const nextActionTs = args.prospect.next_action_at ? new Date(args.prospect.next_action_at).getTime() : null;
  const hasNearTermTask = Number.isFinite(nextActionTs) && Number(nextActionTs) <= Date.now() + 24 * 60 * 60 * 1000;
  if (!nextAction) return true;
  if (!hasNearTermTask) return true;
  return (
    nextAction.includes("research") ||
    nextAction.includes("zeitfenster") ||
    nextAction.includes("kontakt") ||
    nextAction.includes("pruefen") ||
    nextAction.includes("prüfen")
  );
}
