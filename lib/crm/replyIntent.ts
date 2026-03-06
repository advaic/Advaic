export type ReplyIntentLabel =
  | "interesse"
  | "objection"
  | "nicht_jetzt"
  | "opt_out"
  | "falscher_kontakt"
  | "neutral";

export type ReplyIntent = {
  label: ReplyIntentLabel;
  confidence: number;
  reason: string;
  recommendation: string;
  stageSuggestion: "replied" | "pilot_invited" | "nurture" | "lost";
};

function normalizeText(value: unknown, max = 3000) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .toLowerCase();
}

const PATTERNS = {
  opt_out: [
    /bitte.*nicht.*kontakt/i,
    /nicht.*mehr.*anschreiben/i,
    /kein interesse/i,
    /abmelden/i,
    /unsubscribe/i,
  ],
  falscher_kontakt: [
    /falsche.*adresse/i,
    /nicht zuständig/i,
    /falscher ansprechpartner/i,
    /wrong person/i,
  ],
  nicht_jetzt: [
    /später/i,
    /gerade nicht/i,
    /kein timing/i,
    /im moment nicht/i,
    /q[1-4]/i,
    /nächstes quartal/i,
  ],
  interesse: [
    /interess/i,
    /gerne/i,
    /klingt gut/i,
    /lass.*sprechen/i,
    /termin/i,
    /call/i,
    /pilot/i,
  ],
  objection: [
    /dsgvo/i,
    /datenschutz/i,
    /kosten/i,
    /preis/i,
    /aufwand/i,
    /kontrolle/i,
    /risiko/i,
    /qualität/i,
  ],
};

function hasAny(text: string, rules: RegExp[]) {
  return rules.some((rule) => rule.test(text));
}

export function classifyReplyIntent(args: {
  inboundText?: string | null;
  inboundSnippet?: string | null;
}): ReplyIntent {
  const text = normalizeText(`${args.inboundText || ""}\n${args.inboundSnippet || ""}`, 4000);

  if (!text) {
    return {
      label: "neutral",
      confidence: 0.35,
      reason: "Zu wenig Antworttext für klare Einordnung.",
      recommendation: "Antwort manuell prüfen und nächsten Schritt festlegen.",
      stageSuggestion: "replied",
    };
  }

  if (hasAny(text, PATTERNS.opt_out)) {
    return {
      label: "opt_out",
      confidence: 0.94,
      reason: "Opt-out-Signal erkannt.",
      recommendation: "Kontakt sofort stoppen und Prospect als Do-Not-Contact markieren.",
      stageSuggestion: "lost",
    };
  }

  if (hasAny(text, PATTERNS.falscher_kontakt)) {
    return {
      label: "falscher_kontakt",
      confidence: 0.89,
      reason: "Antwort deutet auf falschen Ansprechpartner hin.",
      recommendation: "Neuen Ansprechpartner recherchieren und Kanal sauber aktualisieren.",
      stageSuggestion: "nurture",
    };
  }

  if (hasAny(text, PATTERNS.nicht_jetzt)) {
    return {
      label: "nicht_jetzt",
      confidence: 0.83,
      reason: "Zeitpunkt-Einwand erkannt.",
      recommendation: "Nurture mit klarem Wiedervorlage-Datum statt sofortigem Follow-up.",
      stageSuggestion: "nurture",
    };
  }

  if (hasAny(text, PATTERNS.interesse)) {
    return {
      label: "interesse",
      confidence: 0.82,
      reason: "Positives Interesse/Terminbereitschaft erkannt.",
      recommendation: "Pilot-Einladung oder kurzer Termin als nächsten Schritt setzen.",
      stageSuggestion: "pilot_invited",
    };
  }

  if (hasAny(text, PATTERNS.objection)) {
    return {
      label: "objection",
      confidence: 0.75,
      reason: "Klarer Einwand im Antworttext erkannt.",
      recommendation: "Einwand strukturiert beantworten und dann Micro-CTA setzen.",
      stageSuggestion: "replied",
    };
  }

  return {
    label: "neutral",
    confidence: 0.5,
    reason: "Antwort erkannt, aber ohne eindeutiges Intent-Signal.",
    recommendation: "Kurz manuell klassifizieren und nächste Aktion setzen.",
    stageSuggestion: "replied",
  };
}
