export type ContactSafetyLevel = "safe" | "unknown" | "risky";

export type ContactSafetyCandidate = {
  channel_type?: string | null;
  channel_value?: string | null;
  contact_name?: string | null;
  contact_role?: string | null;
  source_type?: string | null;
  confidence?: number | null;
  validation_status?: string | null;
  is_primary?: boolean | null;
};

export type ContactSafetyAssessment = {
  level: ContactSafetyLevel;
  score: number;
  summary: string;
  reasons: string[];
};

function clean(value: unknown, max = 240) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeEmail(value: unknown) {
  return clean(value, 200).toLowerCase();
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function isGenericMailbox(email: string) {
  return /^(info|kontakt|hello|hi|office|team|mail|service|support|admin|sales)@/i.test(email);
}

function isPersonSource(sourceType: string) {
  return /(linkedin-profil|linkedin_profile|named_person|person|team|about)/i.test(sourceType);
}

function isVerifiedStatus(status: string) {
  return ["valid", "verified", "used"].includes(status);
}

export function contactSafetyBadgeClass(level: ContactSafetyLevel) {
  if (level === "safe") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (level === "risky") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function contactSafetyLabel(level: ContactSafetyLevel) {
  if (level === "safe") return "Sicher";
  if (level === "risky") return "Riskant";
  return "Unklar";
}

export function assessContactSafety(args: {
  preferredChannel?: string | null;
  contact: ContactSafetyCandidate | null | undefined;
}) {
  const preferredChannel = clean(args.preferredChannel, 24).toLowerCase();
  const contact = args.contact || null;
  const reasons: string[] = [];

  if (!contact) {
    return {
      level: "risky" as const,
      score: 12,
      summary: "Kein belastbarer Kontaktpfad vorhanden.",
      reasons: ["Kontaktpfad fehlt"],
    };
  }

  let score = 58;
  const channelType = clean(contact.channel_type, 24).toLowerCase();
  const channelValue = clean(contact.channel_value, 240);
  const sourceType = clean(contact.source_type, 80);
  const validationStatus = clean(contact.validation_status, 24).toLowerCase();
  const confidence =
    typeof contact.confidence === "number" && Number.isFinite(contact.confidence)
      ? Number(contact.confidence)
      : null;

  if (preferredChannel && channelType && preferredChannel !== channelType) {
    score -= 10;
    reasons.push(`Bevorzugter Kanal ist ${preferredChannel}, aktueller Pfad ist ${channelType}`);
  }

  if (validationStatus === "invalid") {
    score -= 36;
    reasons.push("Kontakt wurde bereits als invalid markiert");
  } else if (isVerifiedStatus(validationStatus)) {
    score += 16;
    reasons.push("Kontaktpfad wurde bereits erfolgreich oder validiert genutzt");
  } else if (!validationStatus || validationStatus === "new") {
    reasons.push("Kontaktpfad ist noch nicht validiert");
  }

  if (confidence !== null) {
    if (confidence >= 0.82) score += 16;
    else if (confidence >= 0.68) score += 8;
    else if (confidence < 0.45) {
      score -= 14;
      reasons.push("Kontaktkonfidenz ist niedrig");
    } else {
      reasons.push("Kontaktkonfidenz ist nur mittel");
    }
  } else {
    reasons.push("Keine Kontaktkonfidenz gespeichert");
  }

  if (contact.contact_name) {
    score += 6;
  } else {
    reasons.push("Kein namentlicher Ansprechpartner am Pfad");
  }

  if (sourceType) {
    if (isPersonSource(sourceType)) score += 7;
    else reasons.push(`Quelle ist eher allgemein (${sourceType})`);
  }

  if (channelType === "email") {
    const email = normalizeEmail(channelValue);
    if (!email || !email.includes("@")) {
      score -= 28;
      reasons.push("E-Mail-Adresse wirkt unvollständig");
    } else if (isGenericMailbox(email)) {
      score -= 10;
      reasons.push("Nur generische Funktions-Mail vorhanden");
    }
  }

  if (contact.is_primary) score += 3;

  const finalScore = clamp(score);
  const level: ContactSafetyLevel =
    finalScore >= 74 ? "safe" : finalScore <= 43 ? "risky" : "unknown";

  return {
    level,
    score: finalScore,
    summary:
      level === "safe"
        ? "Kontaktpfad ist gut belegt und relativ send-sicher."
        : level === "risky"
          ? "Kontaktpfad ist vor Versand riskant und sollte geprueft werden."
          : "Kontaktpfad ist brauchbar, aber noch nicht voll belastbar.",
    reasons: [...new Set(reasons)].slice(0, 4),
  } satisfies ContactSafetyAssessment;
}
