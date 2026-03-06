export type ObjectionKey =
  | "dsgvo"
  | "kontrolle"
  | "qualitaet"
  | "aufwand"
  | "kosten"
  | "timing"
  | "kein_bedarf"
  | "unbekannt";

export type ObjectionRule = {
  key: ObjectionKey;
  label: string;
  triggers: string[];
  response_pillar: string;
  short_rebuttal: string;
  recommended_proof: string;
  next_question: string;
};

export const OBJECTION_LIBRARY: ObjectionRule[] = [
  {
    key: "dsgvo",
    label: "DSGVO / Datenschutz",
    triggers: ["dsgvo", "datenschutz", "recht", "compliance", "verarbeitung"],
    response_pillar: "Rechtssicherheit + klare Grenzen",
    short_rebuttal:
      "Advaic arbeitet mit klaren Guardrails und nachvollziehbarer Dokumentation statt Blackbox-Antworten.",
    recommended_proof: "Verarbeitungsübersicht, Zugriffslogik, Exportfähigkeit im Onboarding zeigen.",
    next_question: "Welche Datenschutzanforderung ist bei euch aktuell der kritischste Punkt?",
  },
  {
    key: "kontrolle",
    label: "Kontrollverlust",
    triggers: ["kontrolle", "falsch senden", "freigabe", "automatisch", "risiko"],
    response_pillar: "Fail-safe + Freigabe-First",
    short_rebuttal:
      "Autopilot sendet nur bei klaren Fällen, unklare Fälle landen automatisch in der Freigabe-Inbox.",
    recommended_proof: "Eingang→Entscheidung→Versand-Verlauf mit Zeitstempel zeigen.",
    next_question: "Bei welchen Nachrichtentypen willst du zwingend immer Freigabe behalten?",
  },
  {
    key: "qualitaet",
    label: "Antwortqualität",
    triggers: ["qualität", "ton", "stil", "unpassend", "ki klingt"],
    response_pillar: "Stiltreue + Qualitätschecks",
    short_rebuttal:
      "Vor Versand laufen Relevanz-, Kontext-, Vollständigkeits-, Ton-, Risiko- und Lesbarkeitschecks.",
    recommended_proof: "Vorher/Nachher-Beispiel im eigenen Stil und QA-Ergebnis zeigen.",
    next_question: "Welche Qualitätsabweichung wäre für dich ein klares No-Go?",
  },
  {
    key: "aufwand",
    label: "Einführungsaufwand",
    triggers: ["aufwand", "einrichtung", "zeit", "ressourcen", "implementierung"],
    response_pillar: "Schneller Safe-Start",
    short_rebuttal:
      "Der Einstieg geht in Minuten, und der Start kann konservativ mit mehr Freigaben erfolgen.",
    recommended_proof: "4-Schritte-Setup + Safe-Start-Konfiguration zeigen.",
    next_question: "Wie viel Zeit wäre realistisch für einen kurzen Pilot-Start?",
  },
  {
    key: "kosten",
    label: "Kosten / ROI",
    triggers: ["kosten", "preis", "budget", "lohnen", "roi"],
    response_pillar: "Messbarer ROI statt Feature-Pitch",
    short_rebuttal:
      "Wir messen konkret Antwortzeit, Freigabequote und manuelle Korrekturzeit statt nur Aktivität.",
    recommended_proof: "ROI-Rechner und 14-Tage-Test mit klaren KPI-Zielen.",
    next_question: "Welche Kennzahl müsste sich verbessern, damit es sich für euch klar lohnt?",
  },
  {
    key: "timing",
    label: "Kein Timing",
    triggers: ["später", "gerade nicht", "kein timing", "q4", "nächster monat"],
    response_pillar: "Niedrigschwelliger Nurture",
    short_rebuttal:
      "Kein Problem, wir können ohne Druck einen späteren Checkpoint mit konkretem Nutzen setzen.",
    recommended_proof: "Kurze Zusammenfassung + Reminder mit neuem Datum.",
    next_question: "Wann passt ein kurzer 15-Minuten-Check realistisch besser?",
  },
  {
    key: "kein_bedarf",
    label: "Kein Bedarf",
    triggers: ["kein bedarf", "passt nicht", "nicht relevant", "kein interesse"],
    response_pillar: "Respektvoller Exit mit Erkenntnis",
    short_rebuttal:
      "Verstanden, dann stoppen wir hier sauber und halten nur fest, wann es ggf. später wieder relevant wird.",
    recommended_proof: "Keine weitere Sequenz, nur dokumentierter Stop-Grund.",
    next_question: "Was müsste sich ändern, damit das Thema künftig relevant würde?",
  },
];

export function routeObjection(text: string | null | undefined): ObjectionRule {
  const source = String(text || "").trim().toLowerCase();
  if (!source) {
    return {
      key: "unbekannt",
      label: "Noch nicht klar",
      triggers: [],
      response_pillar: "Diagnose zuerst",
      short_rebuttal: "Erst konkrete Einwandursache klären, dann gezielt antworten.",
      recommended_proof: "Kurze Rückfrage stellen statt mit Standardargumenten zu antworten.",
      next_question: "Was ist für euch aktuell die größte Hürde bei dem Thema?",
    };
  }

  for (const rule of OBJECTION_LIBRARY) {
    if (rule.triggers.some((trigger) => source.includes(trigger))) {
      return rule;
    }
  }

  return {
    key: "unbekannt",
    label: "Noch nicht klar",
    triggers: [],
    response_pillar: "Diagnose zuerst",
    short_rebuttal: "Erst konkrete Einwandursache klären, dann gezielt antworten.",
    recommended_proof: "Kurze Rückfrage stellen statt mit Standardargumenten zu antworten.",
    next_question: "Was ist für euch aktuell die größte Hürde bei dem Thema?",
  };
}

