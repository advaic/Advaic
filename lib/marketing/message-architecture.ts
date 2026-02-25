export type MessageArchitectureItem = {
  id: string;
  title: string;
  text: string;
};

export const MESSAGE_ARCHITECTURE: MessageArchitectureItem[] = [
  {
    id: "problem",
    title: "Was heute schiefläuft",
    text: "Makler verlieren Zeit im Postfach, weil viele Anfragen gleichzeitig kommen und trotzdem einzeln geprüft werden müssen.",
  },
  {
    id: "mechanik",
    title: "Wie Advaic entscheidet",
    text: "Advaic arbeitet mechanistisch: Erkennen, Schreiben, Senden. Unklare oder riskante Fälle gehen nie blind in den Autopilot.",
  },
  {
    id: "sicherheit",
    title: "Warum das sicher bleibt",
    text: "Vor dem Versand greifen Qualitätschecks. Bei Unsicherheit wird gestoppt und zur Freigabe übergeben.",
  },
  {
    id: "ergebnis",
    title: "Was Sie davon haben",
    text: "Weniger Routine im Postfach, schnellere Reaktionszeiten und durchgehend nachvollziehbare Entscheidungen im Verlauf.",
  },
];

export const POSITIONING_ONE_LINER =
  "Advaic ist kein Chatbot, sondern ein kontrollierter E-Mail-Arbeitsablauf für Makler mit Guardrails, Freigaben und nachvollziehbaren Versandentscheidungen.";
