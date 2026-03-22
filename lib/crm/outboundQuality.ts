export type ResearchStatus =
  | "ready"
  | "refresh_research"
  | "needs_research"
  | "missing_contact";

export type OutboundQualityStatus = "pass" | "needs_review" | "blocked";

export type ResearchSignal = {
  label: string;
  impact: number;
  detail: string;
};

export type ResearchReadiness = {
  status: ResearchStatus;
  score: number;
  summary: string;
  blockers: string[];
  warnings: string[];
  strengths: string[];
  signals: ResearchSignal[];
  source_age_days: number | null;
  personalization_signal_count: number;
};

export type OutboundQualityReview = {
  status: OutboundQualityStatus;
  score: number;
  summary: string;
  blockers: string[];
  warnings: string[];
  strengths: string[];
  metrics: {
    word_count: number;
    sentence_count: number;
    question_count: number;
    has_company_reference: boolean;
    has_personal_signal: boolean;
    has_small_question: boolean;
    has_raw_url: boolean;
    has_pitch_language: boolean;
    trigger_evidence_count: number;
    research_status: ResearchStatus | null;
  };
};

function clean(value: unknown, max = 260) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeBody(value: unknown, max = 5000) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function uniq(items: Array<string | null | undefined>) {
  return [...new Set(items.map((item) => clean(item, 240)).filter(Boolean))];
}

function toTs(value: unknown) {
  const raw = clean(value, 64);
  if (!raw) return null;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function daysSince(value: unknown) {
  const ts = toTs(value);
  if (!ts) return null;
  return Math.max(0, Math.round((Date.now() - ts) / (24 * 60 * 60 * 1000)));
}

function sentenceCount(text: string) {
  return text
    .split(/[.!?]+/)
    .map((chunk) => clean(chunk, 220))
    .filter(Boolean).length;
}

function wordCount(text: string) {
  return text.split(/\s+/).map((part) => clean(part, 40)).filter(Boolean).length;
}

function hasHookSnippet(text: string, hook: string) {
  const hookText = clean(hook, 70).toLowerCase();
  if (!hookText || hookText.length < 12) return false;
  return text.toLowerCase().includes(hookText.slice(0, 18));
}

export function researchStatusLabel(status: ResearchStatus) {
  if (status === "ready") return "Sendbar";
  if (status === "refresh_research") return "Research auffrischen";
  if (status === "missing_contact") return "Kontakt ergänzen";
  return "Research fehlt";
}

export function outboundQualityStatusLabel(status: OutboundQualityStatus) {
  if (status === "pass") return "Sendbar";
  if (status === "needs_review") return "Manuell prüfen";
  return "Blockiert";
}

export function assessResearchReadiness(input: {
  preferredChannel?: string | null;
  contactEmail?: string | null;
  personalizationHook?: string | null;
  personalizationEvidence?: string | null;
  researchInsights?: string | null;
  sourceCheckedAt?: string | null;
  targetGroup?: string | null;
  processHint?: string | null;
  responsePromisePublic?: string | null;
  appointmentFlowPublic?: string | null;
  docsFlowPublic?: string | null;
  activeListingsCount?: number | null;
  automationReadiness?: string | null;
  linkedinUrl?: string | null;
  linkedinSearchUrl?: string | null;
}) {
  let score = 28;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];
  const signals: ResearchSignal[] = [];
  const addSignal = (label: string, impact: number, detail: string) => {
    if (!impact) return;
    signals.push({ label, impact, detail: clean(detail, 180) });
    score += impact;
  };

  const preferredChannel = clean(input.preferredChannel, 30).toLowerCase();
  const contactEmail = clean(input.contactEmail, 320).toLowerCase();
  const personalizationHook = clean(input.personalizationHook, 320);
  const personalizationEvidence = clean(input.personalizationEvidence, 320);
  const researchInsights = clean(input.researchInsights, 320);
  const targetGroup = clean(input.targetGroup, 200);
  const processHint = clean(input.processHint, 220);
  const responsePromisePublic = clean(input.responsePromisePublic, 200);
  const appointmentFlowPublic = clean(input.appointmentFlowPublic, 200);
  const docsFlowPublic = clean(input.docsFlowPublic, 200);
  const sourceAgeDays = daysSince(input.sourceCheckedAt);
  const activeListingsKnown = Number.isFinite(Number(input.activeListingsCount));
  const automationReadiness = clean(input.automationReadiness, 40).toLowerCase();
  const hasLinkedIn = Boolean(clean(input.linkedinUrl, 320) || clean(input.linkedinSearchUrl, 320));

  if (preferredChannel === "email") {
    if (contactEmail) {
      strengths.push("E-Mail-Kontakt vorhanden");
      addSignal("Kontakt", 10, "Direkter E-Mail-Kontakt ist gepflegt");
    } else {
      blockers.push("E-Mail ist bevorzugt, aber es fehlt eine belastbare Kontakt-E-Mail.");
      addSignal("Kontakt", -26, "Kein sendbarer E-Mail-Kontakt vorhanden");
    }
  }

  if (personalizationHook) {
    strengths.push("Personalisierungs-Hook vorhanden");
    addSignal("Hook", 18, "Konkreter Hook fuer den Einstieg vorhanden");
  } else {
    warnings.push("Kein sauberer Personalisierungs-Hook gepflegt.");
  }

  if (personalizationEvidence) {
    strengths.push("Belastbare Evidenz hinterlegt");
    addSignal("Evidenz", 14, "Oeffentlich sichtbare Evidenz ist dokumentiert");
  }

  if (researchInsights) {
    strengths.push("Key Insights aus der Recherche vorhanden");
    addSignal("Insights", 10, "Research-Notizen liefern zusaetzlichen Kontext");
  }

  if (processHint) {
    strengths.push("Prozesshinweis dokumentiert");
    addSignal("Prozess", 8, "Ein operativer Ablauf-Hinweis ist dokumentiert");
  }

  if (targetGroup) {
    strengths.push("Zielgruppe dokumentiert");
    addSignal("Zielgruppe", 6, "Positionierung/Zielgruppe ist erkennbar");
  }

  if (responsePromisePublic) {
    strengths.push("Antwortversprechen erkannt");
    addSignal("Antwortsignal", 6, "Reaktionsversprechen wurde gefunden");
  }

  if (appointmentFlowPublic) {
    strengths.push("Terminprozess erkannt");
    addSignal("Terminprozess", 6, "Besichtigungs-/Terminablauf wurde gefunden");
  }

  if (docsFlowPublic) {
    strengths.push("Unterlagenprozess erkannt");
    addSignal("Unterlagen", 4, "Unterlagen-/Expose-Prozess wurde gefunden");
  }

  if (activeListingsKnown) {
    strengths.push("Volumensignal vorhanden");
    addSignal("Volumen", 5, "Aktive Inserate sind bekannt");
  }

  if (automationReadiness === "hoch") {
    addSignal("Readiness", 5, "Hohe Automationsreife erkannt");
  } else if (automationReadiness === "mittel") {
    addSignal("Readiness", 3, "Mittlere Automationsreife erkannt");
  } else if (automationReadiness === "niedrig") {
    addSignal("Readiness", 1, "Niedrige Automationsreife erkannt");
  }

  if (hasLinkedIn) {
    addSignal("LinkedIn", 3, "Ein LinkedIn-Pfad ist vorhanden");
  }

  if (sourceAgeDays === null) {
    warnings.push("Quellseite wurde noch nicht frisch geprueft.");
    addSignal("Freshness", -6, "Keine aktuelle Quellenpruefung vorhanden");
  } else if (sourceAgeDays <= 21) {
    strengths.push("Quellseite frisch geprueft");
    addSignal("Freshness", 12, `Quelle vor ${sourceAgeDays} Tagen geprueft`);
  } else if (sourceAgeDays <= 45) {
    addSignal("Freshness", 6, `Quelle vor ${sourceAgeDays} Tagen geprueft`);
  } else if (sourceAgeDays <= 90) {
    warnings.push("Quellseite ist nicht mehr ganz frisch.");
    addSignal("Freshness", -4, `Quelle vor ${sourceAgeDays} Tagen geprueft`);
  } else {
    warnings.push("Quellseite ist deutlich veraltet und sollte vor neuem Outreach geprueft werden.");
    addSignal("Freshness", -12, `Quelle vor ${sourceAgeDays} Tagen geprueft`);
  }

  const personalizationSignalCount = [
    personalizationHook,
    personalizationEvidence,
    researchInsights,
    processHint,
    targetGroup,
    responsePromisePublic,
    appointmentFlowPublic,
    docsFlowPublic,
  ]
    .filter(Boolean).length;

  if (personalizationSignalCount === 0) {
    blockers.push("Es fehlen belastbare Research-Signale fuer hochwertigen Outreach.");
    addSignal("Research", -20, "Noch keine persoenlichen Signale dokumentiert");
  } else if (personalizationSignalCount < 3) {
    warnings.push("Die Research-Lage ist noch duenn und sollte vor Automatisierung dichter werden.");
    addSignal("Research", -7, `${personalizationSignalCount} belastbare Signale vorhanden`);
  } else {
    addSignal("Research", 8, `${personalizationSignalCount} belastbare Signale vorhanden`);
  }

  let status: ResearchStatus = "ready";
  if (preferredChannel === "email" && !contactEmail) {
    status = "missing_contact";
  } else if (personalizationSignalCount === 0 || score < 45) {
    status = "needs_research";
  } else if ((sourceAgeDays !== null && sourceAgeDays > 45) || personalizationSignalCount < 3 || score < 68) {
    status = "refresh_research";
  }

  const summary =
    status === "ready"
      ? "Research ist dicht genug fuer hochwertigen Outreach."
      : status === "refresh_research"
        ? "Research ist brauchbar, sollte aber vor neuem Outreach aufgefrischt werden."
        : status === "missing_contact"
          ? "Es fehlt erst ein sendbarer Kontaktkanal."
          : "Research reicht noch nicht fuer hochwertigen Outreach.";

  return {
    status,
    score: clamp(score),
    summary,
    blockers: uniq(blockers),
    warnings: uniq(warnings),
    strengths: uniq(strengths),
    signals: [...signals].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
    source_age_days: sourceAgeDays,
    personalization_signal_count: personalizationSignalCount,
  } satisfies ResearchReadiness;
}

export function evaluateOutboundMessageQuality(input: {
  body: string;
  subject?: string | null;
  channel?: string | null;
  messageKind?: string | null;
  companyName?: string | null;
  city?: string | null;
  personalizationHook?: string | null;
  triggerEvidenceCount?: number | null;
  researchReadiness?: ResearchReadiness | null;
}) {
  const body = normalizeBody(input.body, 6000);
  const bodyLower = body.toLowerCase();
  const companyName = clean(input.companyName, 120);
  const city = clean(input.city, 120);
  const hook = clean(input.personalizationHook, 220);
  const subject = clean(input.subject, 180);
  const messageKind = clean(input.messageKind, 40).toLowerCase();
  const isFirstTouch = messageKind === "first_touch";
  const triggerEvidenceCount = Math.max(0, Math.round(Number(input.triggerEvidenceCount || 0)));
  const blockers: string[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];
  let score = isFirstTouch ? 74 : 70;

  const word_count = wordCount(body);
  const sentence_count = sentenceCount(body);
  const question_count = (body.match(/\?/g) || []).length;
  const has_company_reference =
    Boolean(companyName) && bodyLower.includes(companyName.toLowerCase());
  const has_city_reference = Boolean(city) && bodyLower.includes(city.toLowerCase());
  const has_personal_signal =
    has_company_reference || has_city_reference || hasHookSnippet(body, hook);
  const has_small_question = /\?[\s]*$/.test(body) || question_count === 1;
  const has_raw_url = /https?:\/\/\S+/i.test(body);
  const has_raw_numbers = /\b\d{2,}\b|%/.test(body);
  const has_pitch_language =
    /\bdemo\b|\btermin\b|\bkalender\b|\b15\s*min\b|\bcase\s*study\b|\broi\b|\bworkflow\b|\bpipeline\b|\bautomatisier/i.test(
      body,
    );
  const has_product_mechanics =
    /\bfreigabe\b|\bqualit(?:aets|äts)check\b|\bauto(?:matisch|pilot)?\b|\bautopilot\b/i.test(body);

  if (!body) {
    blockers.push("Nachrichtentext ist leer.");
  }

  if (has_company_reference) {
    strengths.push("Firma wird konkret referenziert");
    score += 10;
  }
  if (has_city_reference) {
    strengths.push("Ort wird konkret referenziert");
    score += 4;
  }
  if (has_personal_signal) {
    strengths.push("Nachricht enthaelt ein echtes Personalisierungssignal");
    score += 8;
  } else {
    score -= 14;
    if (isFirstTouch) {
      blockers.push("Erstkontakt ist nicht konkret genug personalisiert.");
    } else {
      warnings.push("Nachricht koennte persoenlicher werden.");
    }
  }

  if (triggerEvidenceCount >= 2) {
    score += 6;
  } else if (isFirstTouch) {
    warnings.push("Die Trigger-Evidenz ist noch duenn.");
    score -= 4;
  }

  if (question_count >= 1) {
    strengths.push("Nachricht endet mit einer echten Frage");
    score += 8;
  } else if (isFirstTouch) {
    blockers.push("Erstkontakt endet nicht mit einer kleinen Relevanzfrage.");
  } else {
    warnings.push("Call-to-action ist unklar.");
  }

  if (!has_small_question && question_count > 0) {
    warnings.push("Die Rueckfrage koennte noch reibungsarmer formuliert werden.");
    score -= 3;
  }

  if (has_raw_url) {
    blockers.push("Nachricht enthaelt rohe URLs.");
    score -= 24;
  }

  if (has_raw_numbers && isFirstTouch) {
    blockers.push("Erstkontakt enthaelt Rohdaten oder Prozent-/Zahlen-Sprache.");
    score -= 16;
  } else if (has_raw_numbers) {
    warnings.push("Nachricht enthaelt viele Rohzahlen.");
    score -= 6;
  }

  if (has_pitch_language && isFirstTouch) {
    blockers.push("Erstkontakt wirkt zu sehr wie ein Pitch oder Termin-Ask.");
    score -= 18;
  } else if (has_pitch_language) {
    warnings.push("Nachricht ist stellenweise salesy.");
    score -= 8;
  }

  if (has_product_mechanics && isFirstTouch) {
    blockers.push("Erstkontakt erklaert schon Produktmechanik statt Relevanz.");
    score -= 18;
  }

  if (isFirstTouch) {
    if (word_count >= 45 && word_count <= 90) {
      strengths.push("Laenge passt fuer Touch 1");
      score += 10;
    } else if (word_count > 105) {
      blockers.push("Erstkontakt ist zu lang.");
      score -= 18;
    } else if (word_count < 28) {
      warnings.push("Erstkontakt ist sehr kurz und wirkt eventuell zu duenn.");
      score -= 6;
    }

    if (sentence_count >= 3 && sentence_count <= 5) {
      strengths.push("Touch-1-Struktur ist kompakt");
      score += 8;
    } else if (sentence_count > 6 || sentence_count < 2) {
      blockers.push("Erstkontakt hat keine klare 3-5-Satz-Struktur.");
      score -= 14;
    } else {
      warnings.push("Touch-1-Struktur koennte noch klarer sein.");
      score -= 4;
    }
  } else {
    if (word_count > 190) {
      warnings.push("Nachricht ist recht lang fuer einen Outreach-Follow-up.");
      score -= 10;
    }
    if (question_count > 2) {
      warnings.push("Zu viele Fragen auf einmal.");
      score -= 6;
    }
  }

  if (subject && subject.length > 70) {
    warnings.push("Betreff ist relativ lang.");
    score -= 4;
  }

  if (input.researchReadiness) {
    if (input.researchReadiness.status === "needs_research") {
      blockers.push("Research ist noch nicht dicht genug fuer hochwertigen Outreach.");
      score -= 18;
    } else if (input.researchReadiness.status === "missing_contact") {
      blockers.push("Kontaktkanal ist noch nicht belastbar gepflegt.");
      score -= 18;
    } else if (input.researchReadiness.status === "refresh_research") {
      warnings.push("Research sollte vor dem Versand aktualisiert werden.");
      score -= 8;
    } else {
      score += 4;
    }
  }

  const status: OutboundQualityStatus =
    blockers.length > 0 ? "blocked" : score >= 82 && warnings.length <= 2 ? "pass" : "needs_review";

  const summary =
    status === "pass"
      ? "Nachricht ist sauber genug fuer den Versand."
      : status === "needs_review"
        ? "Nachricht ist brauchbar, sollte aber noch kurz manuell geschaerft werden."
        : "Nachricht sollte vor dem Versand ueberarbeitet werden.";

  return {
    status,
    score: clamp(score),
    summary,
    blockers: uniq(blockers),
    warnings: uniq(warnings),
    strengths: uniq(strengths),
    metrics: {
      word_count,
      sentence_count,
      question_count,
      has_company_reference,
      has_personal_signal,
      has_small_question,
      has_raw_url,
      has_pitch_language,
      trigger_evidence_count: triggerEvidenceCount,
      research_status: input.researchReadiness?.status || null,
    },
  } satisfies OutboundQualityReview;
}
