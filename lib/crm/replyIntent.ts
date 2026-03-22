export type ReplyIntentLabel =
  | "interesse"
  | "objection"
  | "nicht_jetzt"
  | "opt_out"
  | "falscher_kontakt"
  | "neutral";

export type ReplySignalKey =
  | "meeting_ready"
  | "pilot_interest"
  | "info_request"
  | "timing_deferral"
  | "pricing_objection"
  | "compliance_objection"
  | "control_objection"
  | "quality_objection"
  | "capacity_objection"
  | "wrong_contact_referral"
  | "wrong_contact_dead_end"
  | "hard_opt_out"
  | "soft_rejection"
  | "neutral";

export type ReplyStrength = "light" | "medium" | "strong";
export type ReplyOutcome = "positive" | "neutral" | "negative";

export type ReplyIntent = {
  label: ReplyIntentLabel;
  signal: ReplySignalKey;
  outcome: ReplyOutcome;
  strength: ReplyStrength;
  confidence: number;
  reason: string;
  recommendation: string;
  stageSuggestion: "replied" | "pilot_invited" | "nurture" | "lost";
  objectionTopics: string[];
  timelineHintDays: number | null;
  contactResolutionNeeded: boolean;
  contactHint: string | null;
  stopAutomation: boolean;
};

function normalizeText(value: unknown, max = 3000) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .toLowerCase();
}

function cleanLine(value: unknown, max = 220) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

const HARD_OPT_OUT_PATTERNS = [
  /bitte.*nicht.*kontakt/i,
  /nicht.*mehr.*anschreiben/i,
  /abmelden/i,
  /unsubscribe/i,
  /do not contact/i,
  /loeschen sie meine daten/i,
  /löschen sie meine daten/i,
];

const SOFT_REJECTION_PATTERNS = [
  /kein bedarf/i,
  /passt fuer uns nicht/i,
  /passt für uns nicht/i,
  /nicht relevant/i,
  /kein thema fuer uns/i,
  /kein thema für uns/i,
  /bleiben bei unserem aktuellen prozess/i,
  /wir sind bereits versorgt/i,
];

const WRONG_CONTACT_PATTERNS = [
  /falsche.*adresse/i,
  /nicht zustaendig/i,
  /nicht zuständig/i,
  /falscher ansprechpartner/i,
  /wrong person/i,
  /dafuer ist .* zustaendig/i,
  /dafür ist .* zuständig/i,
];

const REFERRAL_HINT_PATTERNS = [
  /bitte an /i,
  /melden sie sich bei /i,
  /zustaendig ist /i,
  /zuständig ist /i,
  /ansprechpartner ist /i,
  /sprechpartner ist /i,
];

const TIMING_PATTERNS = [
  /spaeter/i,
  /später/i,
  /gerade nicht/i,
  /im moment nicht/i,
  /kein timing/i,
  /naechste woche/i,
  /nächste woche/i,
  /naechsten monat/i,
  /nächsten monat/i,
  /naechstes quartal/i,
  /nächstes quartal/i,
  /\bq[1-4]\b/i,
  /wiedervorlage/i,
];

const MEETING_PATTERNS = [
  /lass.*sprechen/i,
  /lass.*telefonieren/i,
  /termin/i,
  /call/i,
  /austausch/i,
  /kurz sprechen/i,
  /pilot/i,
  /demo/i,
];

const INFO_REQUEST_PATTERNS = [
  /mehr infos/i,
  /mehr information/i,
  /unterlagen/i,
  /beispiel/i,
  /weitere details/i,
  /wie funktioniert/i,
  /info schicken/i,
  /kurze erklaerung/i,
  /kurze erklärung/i,
];

const POSITIVE_PATTERNS = [
  /interess/i,
  /gerne/i,
  /spannend/i,
  /klingt gut/i,
  /koennen wir/i,
  /können wir/i,
];

const OBJECTION_PATTERNS: Record<
  "pricing" | "compliance" | "control" | "quality" | "capacity",
  RegExp[]
> = {
  pricing: [/kosten/i, /preis/i, /budget/i, /teuer/i],
  compliance: [/dsgvo/i, /datenschutz/i, /compliance/i, /rechtlich/i],
  control: [/kontrolle/i, /hoheit/i, /transparen/i, /selbst machen/i],
  quality: [/qualitaet/i, /qualität/i, /fehler/i, /schlechte erfahrung/i],
  capacity: [/aufwand/i, /zeit/i, /ressourcen/i, /team ist voll/i],
};

const MONTH_HINTS: Record<string, number> = {
  januar: 1,
  january: 1,
  februar: 2,
  february: 2,
  maerz: 3,
  märz: 3,
  march: 3,
  april: 4,
  mai: 5,
  may: 5,
  juni: 6,
  june: 6,
  juli: 7,
  july: 7,
  august: 8,
  september: 9,
  oktober: 10,
  october: 10,
  november: 11,
  dezember: 12,
  december: 12,
};

function hasAny(text: string, rules: RegExp[]) {
  return rules.some((rule) => rule.test(text));
}

function countMatches(text: string, rules: RegExp[]) {
  return rules.reduce((sum, rule) => sum + (rule.test(text) ? 1 : 0), 0);
}

function extractObjectionTopics(text: string) {
  const topics: string[] = [];
  for (const [key, rules] of Object.entries(OBJECTION_PATTERNS)) {
    if (hasAny(text, rules)) topics.push(key);
  }
  return topics;
}

function extractTimelineHintDays(text: string) {
  const explicitDays = text.match(/\b(?:in|nach)\s+(\d{1,2})\s+tagen?\b/i);
  if (explicitDays) return Math.max(1, Math.min(120, Number(explicitDays[1]) || 0));

  const explicitWeeks = text.match(/\b(?:in|nach)\s+(\d{1,2})\s+wochen?\b/i);
  if (explicitWeeks) return Math.max(7, Math.min(180, (Number(explicitWeeks[1]) || 0) * 7));

  const explicitMonths = text.match(/\b(?:in|nach)\s+(\d{1,2})\s+monaten?\b/i);
  if (explicitMonths) return Math.max(14, Math.min(365, (Number(explicitMonths[1]) || 0) * 30));

  if (/\bnaechste woche\b|\bnächste woche\b/i.test(text)) return 7;
  if (/\bnaechsten monat\b|\bnächsten monat\b/i.test(text)) return 30;
  if (/\bnaechstes quartal\b|\bnächstes quartal\b/i.test(text)) return 90;

  const quarterMatch = text.match(/\bq([1-4])\b/i);
  if (quarterMatch) {
    const quarter = Number(quarterMatch[1]);
    if (quarter >= 1 && quarter <= 4) {
      const now = new Date();
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
      let quarterDelta = quarter - currentQuarter;
      if (quarterDelta < 0) quarterDelta += 4;
      return Math.max(14, quarterDelta * 90 || 90);
    }
  }

  for (const [label, monthNumber] of Object.entries(MONTH_HINTS)) {
    if (!new RegExp(`\\bab\\s+${label}\\b`, "i").test(text)) continue;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    let delta = monthNumber - currentMonth;
    if (delta < 0) delta += 12;
    return Math.max(7, delta * 30 || 30);
  }

  return null;
}

function extractContactHint(text: string) {
  const emailMatch = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  if (emailMatch?.[0]) return cleanLine(emailMatch[0], 160);

  const phraseMatch = text.match(
    /(?:bitte an|melden sie sich bei|zustaendig ist|zuständig ist|ansprechpartner ist|sprechpartner ist)\s+([^.,;:]+)/i,
  );
  if (phraseMatch?.[1]) return cleanLine(phraseMatch[1], 160);
  return null;
}

function confidenceForScore(score: number) {
  const normalized = Math.max(0.45, Math.min(0.97, 0.45 + score * 0.11));
  return Math.round(normalized * 100) / 100;
}

function objectionSignalForTopic(topic: string): ReplySignalKey {
  if (topic === "pricing") return "pricing_objection";
  if (topic === "compliance") return "compliance_objection";
  if (topic === "control") return "control_objection";
  if (topic === "quality") return "quality_objection";
  return "capacity_objection";
}

function objectionRecommendation(topics: string[]) {
  if (topics.includes("pricing")) {
    return "ROI und operativen Hebel knapp belegen, dann mit kleinem naechsten Schritt weitermachen.";
  }
  if (topics.includes("compliance")) {
    return "Datenschutz und Kontrollgrenzen klar beantworten, dann nur einen kleinen Folge-Schritt anbieten.";
  }
  if (topics.includes("control")) {
    return "Mensch-in-der-Schleife und Freigaben betonen, dann mit einem risikoarmen Test weitergehen.";
  }
  if (topics.includes("quality")) {
    return "Qualitaetssicherung und Review-Logik konkret zeigen, dann einen kleinen Beweis schicken.";
  }
  return "Aufwand klein rechnen, klaren Startpunkt nennen und mit Micro-CTA antworten.";
}

export function classifyReplyIntent(args: {
  inboundText?: string | null;
  inboundSnippet?: string | null;
}): ReplyIntent {
  const text = normalizeText(`${args.inboundText || ""}\n${args.inboundSnippet || ""}`, 4000);

  if (!text) {
    return {
      label: "neutral",
      signal: "neutral",
      outcome: "neutral",
      strength: "light",
      confidence: 0.35,
      reason: "Zu wenig Antworttext fuer klare Einordnung.",
      recommendation: "Antwort manuell pruefen und den naechsten Schritt festlegen.",
      stageSuggestion: "replied",
      objectionTopics: [],
      timelineHintDays: null,
      contactResolutionNeeded: false,
      contactHint: null,
      stopAutomation: false,
    };
  }

  const objectionTopics = extractObjectionTopics(text);
  const timelineHintDays = extractTimelineHintDays(text);
  const contactHint = extractContactHint(text);
  const hardOptOut = hasAny(text, HARD_OPT_OUT_PATTERNS);
  const softRejection = hasAny(text, SOFT_REJECTION_PATTERNS);
  const wrongContact = hasAny(text, WRONG_CONTACT_PATTERNS);
  const hasReferralHint = wrongContact && (Boolean(contactHint) || hasAny(text, REFERRAL_HINT_PATTERNS));
  const timingScore = countMatches(text, TIMING_PATTERNS) + (timelineHintDays ? 1 : 0);
  const meetingScore = countMatches(text, MEETING_PATTERNS);
  const infoRequestScore = countMatches(text, INFO_REQUEST_PATTERNS);
  const positiveScore = countMatches(text, POSITIVE_PATTERNS);

  if (hardOptOut) {
    return {
      label: "opt_out",
      signal: "hard_opt_out",
      outcome: "negative",
      strength: "strong",
      confidence: 0.96,
      reason: "Klare Stop-/Opt-out-Formulierung erkannt.",
      recommendation: "Kontakt sofort stoppen, Prospect auf Do-Not-Contact setzen und keinen Follow-up mehr ausloesen.",
      stageSuggestion: "lost",
      objectionTopics,
      timelineHintDays: null,
      contactResolutionNeeded: false,
      contactHint: null,
      stopAutomation: true,
    };
  }

  if (wrongContact) {
    const signal = hasReferralHint ? "wrong_contact_referral" : "wrong_contact_dead_end";
    return {
      label: "falscher_kontakt",
      signal,
      outcome: hasReferralHint ? "neutral" : "negative",
      strength: hasReferralHint ? "medium" : "strong",
      confidence: hasReferralHint ? 0.88 : 0.91,
      reason: hasReferralHint
        ? "Falscher Ansprechpartner erkannt, aber mit Hinweis auf eine bessere Kontaktperson."
        : "Falscher Ansprechpartner ohne belastbaren Verweis erkannt.",
      recommendation: hasReferralHint
        ? `Kontakt-Reparatur ausfuehren und ${contactHint ? `bei ${contactHint} weitermachen` : "den genannten Ansprechpartner uebernehmen"}.`
        : "Kontaktpfad neu recherchieren und erst dann wieder in Outreach gehen.",
      stageSuggestion: hasReferralHint ? "replied" : "nurture",
      objectionTopics,
      timelineHintDays: null,
      contactResolutionNeeded: true,
      contactHint,
      stopAutomation: true,
    };
  }

  if (timingScore >= 2 && meetingScore === 0 && infoRequestScore === 0) {
    return {
      label: "nicht_jetzt",
      signal: "timing_deferral",
      outcome: "neutral",
      strength: timelineHintDays && timelineHintDays >= 21 ? "medium" : "light",
      confidence: confidenceForScore(timingScore),
      reason: timelineHintDays
        ? `Timing-Einwand mit Wiedervorlage in etwa ${timelineHintDays} Tagen erkannt.`
        : "Timing-Einwand erkannt.",
      recommendation: timelineHintDays
        ? `Nicht sofort nachfassen, sondern Wiedervorlage fuer etwa ${timelineHintDays} Tage setzen.`
        : "Nicht sofort nachfassen, sondern mit klarer Wiedervorlage weiterarbeiten.",
      stageSuggestion: "nurture",
      objectionTopics,
      timelineHintDays,
      contactResolutionNeeded: false,
      contactHint: null,
      stopAutomation: true,
    };
  }

  if (meetingScore >= 1 && meetingScore + positiveScore >= 2) {
    return {
      label: "interesse",
      signal: "meeting_ready",
      outcome: "positive",
      strength: "strong",
      confidence: confidenceForScore(meetingScore + positiveScore),
      reason: "Antwort signalisiert konkreten Gespraechs- oder Terminwillen.",
      recommendation: "Sofort einen kurzen Termin oder einen kleinen Pilot-Vorschlag anbieten.",
      stageSuggestion: "pilot_invited",
      objectionTopics,
      timelineHintDays: null,
      contactResolutionNeeded: false,
      contactHint: null,
      stopAutomation: true,
    };
  }

  if (infoRequestScore >= 1) {
    return {
      label: "interesse",
      signal: "info_request",
      outcome: "positive",
      strength: "medium",
      confidence: confidenceForScore(infoRequestScore + positiveScore),
      reason: "Antwort fordert mehr Informationen, Unterlagen oder ein Beispiel an.",
      recommendation: "Kurz und konkret mit Beispiel, Proof oder knappen Unterlagen antworten.",
      stageSuggestion: "replied",
      objectionTopics,
      timelineHintDays: null,
      contactResolutionNeeded: false,
      contactHint: null,
      stopAutomation: true,
    };
  }

  if (positiveScore >= 1) {
    return {
      label: "interesse",
      signal: "pilot_interest",
      outcome: "positive",
      strength: positiveScore >= 2 ? "strong" : "medium",
      confidence: confidenceForScore(positiveScore),
      reason: "Positives Interesse ohne explizite Terminbuchung erkannt.",
      recommendation: "Mit einem kleinen naechsten Schritt antworten: kurzer Termin, Pilot oder knappe Rueckfrage.",
      stageSuggestion: "replied",
      objectionTopics,
      timelineHintDays: null,
      contactResolutionNeeded: false,
      contactHint: null,
      stopAutomation: true,
    };
  }

  if (softRejection) {
    return {
      label: "objection",
      signal: "soft_rejection",
      outcome: "negative",
      strength: "medium",
      confidence: 0.82,
      reason: "Klare Absage oder niedrige Relevanz ohne explizites Opt-out erkannt.",
      recommendation: "Nicht druecken. Falls ueberhaupt, spaeter mit anderer Relevanz erneut pruefen.",
      stageSuggestion: "lost",
      objectionTopics,
      timelineHintDays,
      contactResolutionNeeded: false,
      contactHint: null,
      stopAutomation: true,
    };
  }

  if (objectionTopics.length > 0) {
    const signal = objectionSignalForTopic(objectionTopics[0]);
    return {
      label: "objection",
      signal,
      outcome: "neutral",
      strength: objectionTopics.length >= 2 ? "strong" : "medium",
      confidence: confidenceForScore(objectionTopics.length + (positiveScore > 0 ? 1 : 0)),
      reason: `Einwand erkannt: ${objectionTopics.join(", ")}.`,
      recommendation: objectionRecommendation(objectionTopics),
      stageSuggestion: "replied",
      objectionTopics,
      timelineHintDays,
      contactResolutionNeeded: false,
      contactHint: null,
      stopAutomation: true,
    };
  }

  return {
    label: "neutral",
    signal: "neutral",
    outcome: "neutral",
    strength: "light",
    confidence: 0.5,
    reason: "Antwort erkannt, aber ohne eindeutiges Intent-Signal.",
    recommendation: "Kurz manuell klassifizieren und den naechsten Schritt festlegen.",
    stageSuggestion: "replied",
    objectionTopics: [],
    timelineHintDays,
    contactResolutionNeeded: false,
    contactHint: null,
    stopAutomation: false,
  };
}

function normalizeSignal(value: unknown): ReplySignalKey {
  const signal = cleanLine(value, 60).toLowerCase() as ReplySignalKey;
  const allowed: ReplySignalKey[] = [
    "meeting_ready",
    "pilot_interest",
    "info_request",
    "timing_deferral",
    "pricing_objection",
    "compliance_objection",
    "control_objection",
    "quality_objection",
    "capacity_objection",
    "wrong_contact_referral",
    "wrong_contact_dead_end",
    "hard_opt_out",
    "soft_rejection",
    "neutral",
  ];
  return allowed.includes(signal) ? signal : "neutral";
}

function normalizeLabel(value: unknown): ReplyIntentLabel {
  const label = cleanLine(value, 40).toLowerCase() as ReplyIntentLabel;
  const allowed: ReplyIntentLabel[] = [
    "interesse",
    "objection",
    "nicht_jetzt",
    "opt_out",
    "falscher_kontakt",
    "neutral",
  ];
  return allowed.includes(label) ? label : "neutral";
}

export function getReplyLearningWeights(args: {
  replySignal?: unknown;
  replyIntent?: unknown;
  outcome?: unknown;
}) {
  const signal = normalizeSignal(args.replySignal);
  const label = normalizeLabel(args.replyIntent);
  const outcome = cleanLine(args.outcome, 24).toLowerCase();

  if (signal === "meeting_ready") return { positive: 1, negative: 0 };
  if (signal === "pilot_interest") return { positive: 0.85, negative: 0 };
  if (signal === "info_request") return { positive: 0.75, negative: 0 };
  if (signal === "timing_deferral") return { positive: 0.35, negative: 0.05 };
  if (
    [
      "pricing_objection",
      "compliance_objection",
      "control_objection",
      "quality_objection",
      "capacity_objection",
    ].includes(signal)
  ) {
    return { positive: 0.2, negative: 0.25 };
  }
  if (signal === "wrong_contact_referral") return { positive: 0.1, negative: 0.55 };
  if (signal === "wrong_contact_dead_end") return { positive: 0.05, negative: 0.85 };
  if (signal === "hard_opt_out") return { positive: 0, negative: 1 };
  if (signal === "soft_rejection") return { positive: 0, negative: 0.75 };

  if (label === "interesse" || outcome === "positive") return { positive: 0.6, negative: 0 };
  if (label === "falscher_kontakt") return { positive: 0.05, negative: 0.7 };
  if (label === "opt_out" || outcome === "negative") return { positive: 0, negative: 0.85 };
  if (label === "nicht_jetzt") return { positive: 0.25, negative: 0.05 };
  if (label === "objection") return { positive: 0.15, negative: 0.2 };
  return { positive: 0, negative: 0 };
}
