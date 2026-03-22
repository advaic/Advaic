type HourBucket =
  | "early_morning"
  | "morning"
  | "midday"
  | "afternoon"
  | "late_afternoon"
  | "evening"
  | "off_hours";

type TimingBiasLike = {
  channel?: string | null;
  weekday?: string | null;
  hour_bucket?: string | null;
  score_adjustment?: number | null;
  sample_size?: number | null;
  positive_rate?: number | null;
  negative_rate?: number | null;
  reason?: string | null;
};

type LearningSnapshotLike = {
  insights?: {
    timing_biases?: TimingBiasLike[] | null;
  } | null;
} | null;

type TimingSlot = {
  weekday: number;
  hour_bucket: HourBucket;
  start_hour: number;
  end_hour: number;
  source: "heuristic" | "learning";
  reason: string;
  score_adjustment: number;
};

export type TimingDecision = {
  timezone: string;
  channel: string;
  office_profile: string;
  weekday: string;
  weekday_index: number;
  local_hour: number;
  local_label: string;
  hour_bucket: HourBucket;
  allow_now: boolean;
  timing_override: boolean;
  timing_score: number;
  suggested_send_at: string;
  recommended_window_label: string;
  reason: string;
  matched_slot_source: "heuristic" | "learning" | "none";
};

function clean(value: unknown, max = 220) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeChannel(value: unknown) {
  const channel = clean(value, 24).toLowerCase();
  if (["email", "linkedin", "telefon", "kontaktformular", "whatsapp"].includes(channel)) {
    return channel;
  }
  return "email";
}

function weekdayName(index: number) {
  return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][index] || "Mo";
}

function weekdayIndexFromLabel(value: unknown) {
  const safe = clean(value, 24).toLowerCase();
  if (safe.startsWith("mo")) return 1;
  if (safe.startsWith("di")) return 2;
  if (safe.startsWith("mi")) return 3;
  if (safe.startsWith("do")) return 4;
  if (safe.startsWith("fr")) return 5;
  if (safe.startsWith("sa")) return 6;
  return 0;
}

function bucketForHour(hour: number): HourBucket {
  if (hour >= 7 && hour < 9) return "early_morning";
  if (hour >= 9 && hour < 11) return "morning";
  if (hour >= 11 && hour < 13) return "midday";
  if (hour >= 13 && hour < 15) return "afternoon";
  if (hour >= 15 && hour < 17) return "late_afternoon";
  if (hour >= 17 && hour < 19) return "evening";
  return "off_hours";
}

function rangeForBucket(bucket: HourBucket) {
  if (bucket === "early_morning") return { start_hour: 7, end_hour: 9, label: "07:00-09:00" };
  if (bucket === "morning") return { start_hour: 9, end_hour: 11, label: "09:00-11:00" };
  if (bucket === "midday") return { start_hour: 11, end_hour: 13, label: "11:00-13:00" };
  if (bucket === "afternoon") return { start_hour: 13, end_hour: 15, label: "13:00-15:00" };
  if (bucket === "late_afternoon") return { start_hour: 15, end_hour: 17, label: "15:00-17:00" };
  if (bucket === "evening") return { start_hour: 17, end_hour: 19, label: "17:00-19:00" };
  return { start_hour: 9, end_hour: 11, label: "09:00-11:00" };
}

export function getLocalTimingContext(date: Date, timezone = "Europe/Berlin") {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const lookup = new Map(parts.map((part) => [part.type, part.value]));
  const weekdayIndex = weekdayIndexFromLabel(lookup.get("weekday"));
  const hour = Number(lookup.get("hour") || 0);
  const minute = Number(lookup.get("minute") || 0);
  const year = Number(lookup.get("year") || 0);
  const month = Number(lookup.get("month") || 1);
  const day = Number(lookup.get("day") || 1);
  const hourBucket = bucketForHour(hour);
  return {
    timezone,
    year,
    month,
    day,
    weekday_index: weekdayIndex,
    weekday: weekdayName(weekdayIndex),
    hour,
    minute,
    hour_bucket: hourBucket,
    local_label: `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

function officeProfile(prospect: Record<string, any> | null | undefined) {
  const ownerLed = prospect?.owner_led === true;
  const objectFocus = clean(prospect?.object_focus, 24).toLowerCase();
  const automationReadiness = clean(prospect?.automation_readiness, 24).toLowerCase();
  const activeListings = Number.isFinite(Number(prospect?.active_listings_count))
    ? Number(prospect?.active_listings_count)
    : 0;
  const shareMiete = Number.isFinite(Number(prospect?.share_miete_percent))
    ? Number(prospect?.share_miete_percent)
    : 0;
  const shareKauf = Number.isFinite(Number(prospect?.share_kauf_percent))
    ? Number(prospect?.share_kauf_percent)
    : 0;

  if (objectFocus === "neubau" || (shareKauf >= 70 && activeListings >= 18)) return "vertriebsstark";
  if (ownerLed || (automationReadiness === "niedrig" && activeListings <= 12)) return "owner_led";
  if (objectFocus === "miete" || shareMiete >= 60) return activeListings >= 18 ? "miete_volumen" : "miete_kompakt";
  if (activeListings >= 30) return "high_volume_team";
  return "standard_team";
}

function heuristicSlots(channel: string, profile: string): TimingSlot[] {
  const days = [1, 2, 3, 4];
  const fridayDays = [2, 3, 4, 5];
  const makeSlots = (
    weekdays: number[],
    buckets: HourBucket[],
    reason: string,
    adjustment = 0,
  ) =>
    weekdays.flatMap((weekday) =>
      buckets.map((bucket) => {
        const range = rangeForBucket(bucket);
        return {
          weekday,
          hour_bucket: bucket,
          start_hour: range.start_hour,
          end_hour: range.end_hour,
          source: "heuristic" as const,
          reason,
          score_adjustment: adjustment,
        };
      }),
    );

  if (channel === "telefon") {
    return makeSlots(days, ["morning", "late_afternoon"], "Telefon am besten nicht in Randzeiten starten.", 4);
  }
  if (channel === "linkedin") {
    return makeSlots(fridayDays, ["morning", "late_afternoon"], "LinkedIn funktioniert meist besser in aktiven Arbeitsfenstern.", 3);
  }
  if (channel === "kontaktformular") {
    return makeSlots(days, ["morning", "afternoon"], "Kontaktformulare lohnen sich in normalen Buerozeiten.", 2);
  }
  if (channel === "whatsapp") {
    return makeSlots(days, ["midday", "late_afternoon"], "WhatsApp nur in klaren Tagesfenstern einsetzen.", 1);
  }

  if (profile === "owner_led") {
    return makeSlots(days, ["early_morning", "afternoon"], "Inhabergefuehrte Bueros reagieren oft frueh oder nach Terminen.", 5);
  }
  if (profile === "miete_volumen" || profile === "high_volume_team") {
    return makeSlots(days, ["morning", "late_afternoon"], "Volumenstarke Teams sind in klaren Bloecken am besten erreichbar.", 4);
  }
  if (profile === "vertriebsstark") {
    return makeSlots(fridayDays, ["morning", "midday"], "Vertriebsstarke Teams reagieren oft in aktiven Vertriebsfenstern.", 4);
  }
  return makeSlots(days, ["morning", "afternoon"], "Normale Buerozeiten sind fuer den Erstkontakt am sichersten.", 3);
}

function learningSlots(snapshot: LearningSnapshotLike, channel: string, polarity: "positive" | "negative") {
  const rows = Array.isArray(snapshot?.insights?.timing_biases) ? snapshot?.insights?.timing_biases || [] : [];
  return rows
    .filter((row) => normalizeChannel(row.channel) === channel)
    .filter((row) =>
      polarity === "positive"
        ? Number(row.score_adjustment || 0) >= 2 && Number(row.sample_size || 0) >= 2
        : Number(row.score_adjustment || 0) <= -4 && Number(row.sample_size || 0) >= 2,
    )
    .sort((a, b) => Number(b.score_adjustment || 0) - Number(a.score_adjustment || 0))
    .slice(0, polarity === "positive" ? 4 : 3)
    .map((row) => {
      const weekday = weekdayIndexFromLabel(row.weekday);
      const bucket = clean(row.hour_bucket, 40) as HourBucket;
      const range = rangeForBucket(bucket || "morning");
      return {
        weekday,
        hour_bucket: bucket || "morning",
        start_hour: range.start_hour,
        end_hour: range.end_hour,
        source: "learning" as const,
        reason: clean(row.reason, 220) || "Learning bevorzugt dieses Zeitfenster.",
        score_adjustment: Number(row.score_adjustment || 0),
      };
    });
}

function dedupeSlots(slots: TimingSlot[]) {
  const map = new Map<string, TimingSlot>();
  for (const slot of slots) {
    const key = `${slot.weekday}:${slot.hour_bucket}`;
    const existing = map.get(key);
    if (!existing || slot.score_adjustment > existing.score_adjustment) {
      map.set(key, slot);
    }
  }
  return [...map.values()];
}

function roundUpQuarterHour(date: Date) {
  const rounded = new Date(date.getTime());
  const mins = rounded.getUTCMinutes();
  const delta = (15 - (mins % 15 || 15)) % 15;
  if (delta > 0) rounded.setUTCMinutes(mins + delta, 0, 0);
  else rounded.setUTCSeconds(0, 0);
  return rounded;
}

function slotMatchesContext(slot: TimingSlot, context: ReturnType<typeof getLocalTimingContext>) {
  return (
    slot.weekday === context.weekday_index &&
    context.hour >= slot.start_hour &&
    context.hour < slot.end_hour
  );
}

function findNextSlotTime(args: {
  startAt: Date;
  timezone: string;
  preferredSlots: TimingSlot[];
  blockedSlots: TimingSlot[];
}) {
  const probe = roundUpQuarterHour(new Date(args.startAt.getTime() + 15 * 60 * 1000));
  for (let step = 0; step < 14 * 24 * 4; step += 1) {
    const candidate = new Date(probe.getTime() + step * 15 * 60 * 1000);
    const context = getLocalTimingContext(candidate, args.timezone);
    const blocked = args.blockedSlots.some((slot) => slotMatchesContext(slot, context));
    if (blocked) continue;
    const matched = args.preferredSlots.find((slot) => slotMatchesContext(slot, context));
    if (matched) {
      return { candidate, matched };
    }
  }
  return {
    candidate: new Date(args.startAt.getTime() + 24 * 60 * 60 * 1000),
    matched: null as TimingSlot | null,
  };
}

export function evaluateSendTiming(args: {
  channel?: string | null;
  prospect?: Record<string, any> | null;
  learningSnapshot?: LearningSnapshotLike;
  startAt?: Date | string | null;
  timezone?: string;
}) {
  const timezone = clean(args.timezone, 64) || "Europe/Berlin";
  const channel = normalizeChannel(args.channel);
  const startAt =
    args.startAt instanceof Date
      ? args.startAt
      : args.startAt
        ? new Date(String(args.startAt))
        : new Date();
  const baseDate = Number.isFinite(startAt.getTime()) ? startAt : new Date();
  const profile = officeProfile(args.prospect);
  const preferredSlots = dedupeSlots([
    ...learningSlots(args.learningSnapshot || null, channel, "positive"),
    ...heuristicSlots(channel, profile),
  ]);
  const blockedSlots = dedupeSlots(learningSlots(args.learningSnapshot || null, channel, "negative"));
  const currentContext = getLocalTimingContext(baseDate, timezone);
  const matchedSlot = preferredSlots.find((slot) => slotMatchesContext(slot, currentContext)) || null;
  const blockedSlot = blockedSlots.find((slot) => slotMatchesContext(slot, currentContext)) || null;
  const allowNow = Boolean(matchedSlot) && !blockedSlot && currentContext.weekday_index >= 1 && currentContext.weekday_index <= 5;
  const nextSlot = findNextSlotTime({
    startAt: baseDate,
    timezone,
    preferredSlots,
    blockedSlots,
  });
  const recommendedWindowLabel = nextSlot.matched
    ? `${weekdayName(nextSlot.matched.weekday)} ${rangeForBucket(nextSlot.matched.hour_bucket).label}`
    : "naechster Werktag";
  const rawScore =
    62 +
    (matchedSlot ? matchedSlot.score_adjustment : 0) -
    (blockedSlot ? Math.abs(blockedSlot.score_adjustment) : 0) +
    (allowNow ? 10 : -4);
  const reason = blockedSlot
    ? `Aktueller Slot wirkt laut Learning schwach: ${blockedSlot.reason}`
    : matchedSlot
      ? matchedSlot.reason
      : `Naechster bessere ${channel}-Slot: ${recommendedWindowLabel}.`;

  return {
    timezone,
    channel,
    office_profile: profile,
    weekday: currentContext.weekday,
    weekday_index: currentContext.weekday_index,
    local_hour: currentContext.hour,
    local_label: currentContext.local_label,
    hour_bucket: currentContext.hour_bucket,
    allow_now: allowNow,
    timing_override: !allowNow,
    timing_score: clamp(rawScore),
    suggested_send_at: (allowNow ? roundUpQuarterHour(baseDate) : nextSlot.candidate).toISOString(),
    recommended_window_label: recommendedWindowLabel,
    reason,
    matched_slot_source: matchedSlot?.source || "none",
  } satisfies TimingDecision;
}
