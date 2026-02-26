export type DashboardCapability = {
  id: string;
  title: string;
  dashboardPath: string;
  publicHref: string;
  tags: string[];
  whatItDoes: string;
  boundaries: string;
};

export const DASHBOARD_CAPABILITIES: DashboardCapability[] = [
  {
    id: "autosend_toggle",
    title: "Auto-Senden global steuern",
    dashboardPath: "/app (Sidebar Toggle)",
    publicHref: "/autopilot#autopilot-details",
    tags: ["autosend", "autopilot", "toggle", "pausieren", "sidebar"],
    whatItDoes:
      "Im Dashboard kann Auto-Senden global aktiviert oder pausiert werden. Das ist eine operative Sicherheitsbremse für den Live-Betrieb.",
    boundaries:
      "Auch bei aktiviertem Auto-Senden gehen unklare oder riskante Fälle weiterhin in die Freigabe.",
  },
  {
    id: "inbox_and_conversations",
    title: "Nachrichten und Konversationsansicht",
    dashboardPath: "/app/nachrichten",
    publicHref: "/produkt#ablauf",
    tags: ["nachrichten", "inbox", "konversation", "filter", "suche"],
    whatItDoes:
      "Die Nachrichtenansicht bündelt alle Gespräche mit Filtern für Kategorie, Priorität und Eskalationsstatus. Konversationen können direkt geöffnet und bearbeitet werden.",
    boundaries:
      "Der Bereich ist für operative Bearbeitung ausgelegt, ersetzt aber keine individuellen Fachentscheidungen in Sonderfällen.",
  },
  {
    id: "escalations",
    title: "Eskalationen für Sonderfälle",
    dashboardPath: "/app/eskalationen",
    publicHref: "/sicherheit#sicherheit-details",
    tags: ["eskalation", "sonderfall", "konflikt", "manuell"],
    whatItDoes:
      "Eskalationen sammeln Fälle, die bewusst manuelle Entscheidung brauchen, z. B. Konfliktthemen oder unklare Kontexte.",
    boundaries:
      "Eskalationen reduzieren nicht die Verantwortung für finale Kommunikation; sie strukturieren nur die Bearbeitung.",
  },
  {
    id: "approval_inbox",
    title: "Freigabe-Inbox vor Versand",
    dashboardPath: "/app/zur-freigabe",
    publicHref: "/freigabe-inbox",
    tags: ["freigabe", "review", "entwurf", "versand", "ablehnen"],
    whatItDoes:
      "Entwürfe, die nicht automatisch versendet werden, landen in der Freigabe-Inbox. Dort können sie geprüft, freigegeben, bearbeitet oder abgelehnt werden.",
    boundaries:
      "Nur freigegebene Entwürfe werden versendet. Abgelehnte Entwürfe bleiben ohne Versand.",
  },
  {
    id: "followups_runtime",
    title: "Follow-ups operativ steuern",
    dashboardPath: "/app/follow-ups + /app/follow-ups/settings",
    publicHref: "/follow-up-logik",
    tags: ["followups", "nachfassen", "timing", "stufen", "stop-kriterien"],
    whatItDoes:
      "Follow-ups können im Dashboard überwacht und über Settings in Stufen, Abständen und Zeitfenstern gesteuert werden.",
    boundaries:
      "Follow-ups laufen nicht unbegrenzt; sie stoppen bei Antwort oder wenn definierte Regeln greifen.",
  },
  {
    id: "properties_management",
    title: "Immobilien als Datenbasis verwalten",
    dashboardPath: "/app/immobilien",
    publicHref: "/produkt#was",
    tags: ["immobilien", "objekte", "datenbasis", "startklar", "status"],
    whatItDoes:
      "Objekte können angelegt, bearbeitet und veröffentlicht werden. Die Objektqualität beeinflusst Antwortqualität, Matching und Follow-up-Kontext.",
    boundaries:
      "Unvollständige oder inkonsistente Objektdaten verschlechtern operative Ergebnisse und erhöhen Freigabequoten.",
  },
  {
    id: "property_specific_followups",
    title: "Objektbezogene Follow-up-Policy",
    dashboardPath: "/app/immobilien/hinzufuegen und /app/immobilien/[id]/bearbeiten",
    publicHref: "/follow-up-logik",
    tags: ["property", "followup policy", "objektregeln", "pro immobilie"],
    whatItDoes:
      "Für einzelne Immobilien können abweichende Follow-up-Regeln gepflegt werden, z. B. aktiv/deaktiviert oder stufenbezogene Grenzen.",
    boundaries:
      "Objektregeln sollten mit globalen Follow-up-Settings konsistent gehalten werden.",
  },
  {
    id: "archive_restore",
    title: "Archiv mit Wiederherstellung",
    dashboardPath: "/app/archiv",
    publicHref: "/produkt#dashboard",
    tags: ["archiv", "inaktiv", "wiederherstellen", "historie"],
    whatItDoes:
      "Abgeschlossene oder inaktive Konversationen werden im Archiv gehalten und können bei Bedarf wiederhergestellt werden.",
    boundaries:
      "Archivierung ist kein Löschen; für rechtliche Löschprozesse gelten separate Datenschutzprozesse.",
  },
  {
    id: "response_templates",
    title: "Antwortvorlagen und KI-Entwurf",
    dashboardPath: "/app/antwortvorlagen",
    publicHref: "/produkt#stil",
    tags: ["vorlagen", "textbausteine", "ki generator", "antwortstil"],
    whatItDoes:
      "Vorlagen können erstellt, bearbeitet, gelöscht und optional per KI vorinitialisiert werden. Sie dienen als Grundlage für konsistente Kommunikation.",
    boundaries:
      "Vorlagen werden nicht blind 1:1 versendet, sondern mit Kontext und Regeln kombiniert.",
  },
  {
    id: "tone_and_style",
    title: "Ton & Stil systemweit definieren",
    dashboardPath: "/app/ton-und-stil",
    publicHref: "/produkt#stil",
    tags: ["ton", "stil", "anrede", "regeln", "beispiele"],
    whatItDoes:
      "Ton, Anrede, Formulierungsregeln und Beispieltexte können zentral gepflegt werden. Diese Einstellungen wirken auf Entwürfe und Follow-ups.",
    boundaries:
      "Tonkonfiguration verbessert Konsistenz, ersetzt aber keine inhaltliche Prüfung bei sensiblen Fällen.",
  },
  {
    id: "notifications",
    title: "Benachrichtigungen und Zeitfenster",
    dashboardPath: "/app/benachrichtigungen",
    publicHref: "/produkt#setup",
    tags: ["benachrichtigungen", "alerts", "zeitfenster", "eskalation"],
    whatItDoes:
      "Benachrichtigungen lassen sich nach Ereignisart und Zeitfenster steuern, damit operative Hinweise im richtigen Kanal und zur richtigen Zeit ankommen.",
    boundaries:
      "Benachrichtigungen unterstützen die Reaktion, treffen aber keine inhaltlichen Entscheidungen.",
  },
  {
    id: "account_integrations",
    title: "Konto, Sicherheit und Integrationen",
    dashboardPath: "/app/konto + /app/konto/verknuepfungen",
    publicHref: "/sicherheit",
    tags: ["konto", "gmail", "outlook", "immoscout", "sicherheit", "abo"],
    whatItDoes:
      "Im Konto-Bereich werden Integrationen (Gmail, Microsoft 365, optional ImmoScout), Sicherheitsoptionen und Abo-relevante Einstellungen verwaltet.",
    boundaries:
      "Integrationen müssen aktiv verbunden sein; ohne Verbindung kann kein produktiver E-Mail-Ablauf stattfinden.",
  },
];

export function getDashboardCapabilityKnowledgeDocs() {
  return DASHBOARD_CAPABILITIES.map((capability) => ({
    id: `dashboard_${capability.id}`,
    kind: "dashboard_capability" as const,
    title: `Dashboard-Funktion: ${capability.title}`,
    href: capability.publicHref,
    dashboardPath: capability.dashboardPath,
    tags: [...capability.tags, "dashboard", "app", "funktion", "feature"],
    content: `Bereich: ${capability.dashboardPath}. Funktion: ${capability.whatItDoes} Grenze: ${capability.boundaries}`,
  }));
}

