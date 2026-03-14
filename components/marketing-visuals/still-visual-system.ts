export type StillTone = "brand" | "success" | "warning" | "danger" | "neutral";
export type StillFrame = "desktop" | "mobile";

export type StillPin = {
  id: string;
  tone: StillTone;
  x: number;
  y: number;
  title: string;
  text: string;
};

export type StillVisualDefinition = {
  id: string;
  slug: string;
  kicker: string;
  title: string;
  frame: StillFrame;
  src: string;
  alt: string;
  message: string;
  usage: string[];
  pins: StillPin[];
};

export const stillToneMeta: Record<
  StillTone,
  { label: string; dot: string; chip: string; panel: string }
> = {
  brand: {
    label: "Markenhinweis",
    dot: "bg-[#c9a227] text-[#111827]",
    chip: "border-[#d9bd61] bg-[#fff7d9] text-[#6a4b00]",
    panel: "border-[#ead78e] bg-[#fffbeb]",
  },
  success: {
    label: "Sicher / freigegeben",
    dot: "bg-[#2f855a] text-white",
    chip: "border-[#91d3b2] bg-[#eefbf3] text-[#166534]",
    panel: "border-[#b6e2c8] bg-[#f4fcf7]",
  },
  warning: {
    label: "Prüfen / Freigabe",
    dot: "bg-[#b7791f] text-white",
    chip: "border-[#e8c081] bg-[#fff7eb] text-[#8a5a12]",
    panel: "border-[#f1d3a5] bg-[#fffaf0]",
  },
  danger: {
    label: "Stop / Eskalation",
    dot: "bg-[#c53030] text-white",
    chip: "border-[#f0b6b6] bg-[#fff1f1] text-[#9b1c1c]",
    panel: "border-[#f3c3c3] bg-[#fff6f6]",
  },
  neutral: {
    label: "Kontext",
    dot: "bg-[#475569] text-white",
    chip: "border-[#cbd5e1] bg-[#f8fafc] text-[#334155]",
    panel: "border-[#dbe3ee] bg-[#fbfdff]",
  },
};

export const coreStillVisuals: StillVisualDefinition[] = [
  {
    id: "dashboard-startmodul",
    slug: "dashboard-startmodul",
    kicker: "Dashboard",
    title: "Kontrollierter Start statt Vollautomatik",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/dashboard-startmodul.png",
    alt: "Dashboard-Startmodul mit Schrittlogik für Safe-Start und Freigabe",
    message: "Das Dashboard zeigt den Rollout als geführten Startpfad und nicht als Blackbox-Schalter.",
    usage: ["Homepage", "Produkt", "Video 1"],
    pins: [
      {
        id: "stepper",
        tone: "brand",
        x: 15,
        y: 64,
        title: "Schrittlogik sichtbar",
        text: "Safe-Start, Freigaben und Automatisierung folgen einem klaren Ablauf.",
      },
      {
        id: "status",
        tone: "success",
        x: 78,
        y: 24,
        title: "Status direkt am Einstieg",
        text: "Plan, Guardrails und Sicherheitsfortschritt liegen im selben Modul.",
      },
    ],
  },
  {
    id: "dashboard-systemstatus",
    slug: "dashboard-systemstatus",
    kicker: "Dashboard",
    title: "Betriebszustand statt KPI-Rauschen",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/dashboard-systemstatus.png",
    alt: "Systemstatus-Board für Versand, Deliverability und Lernkurve",
    message: "Versand, Deliverability und Lernkurve werden als ein gemeinsamer Betriebszustand lesbar.",
    usage: ["Homepage", "Sicherheit", "Video 2"],
    pins: [
      {
        id: "state",
        tone: "warning",
        x: 23,
        y: 30,
        title: "Eine Lage, drei Signale",
        text: "Die Oberfläche bündelt Warnungen und stabile Bereiche in einem Systemstatus-Board.",
      },
      {
        id: "signals",
        tone: "neutral",
        x: 76,
        y: 62,
        title: "Jedes Signal bleibt prüfbar",
        text: "Lernkurve, Versand und Deliverability werden separat erläutert, aber nicht isoliert dargestellt.",
      },
    ],
  },
  {
    id: "dashboard-automation",
    slug: "dashboard-automation",
    kicker: "Dashboard",
    title: "Guardrails steuern den Rollout",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/dashboard-automation.png",
    alt: "Automationssteuerung mit Guardrails, Sandbox und ROI-Kontext",
    message: "Automatisierung wird über Guardrails und Sandbox freigeschaltet, nicht über Vertrauen allein.",
    usage: ["Produkt", "Autopilot", "Video 2"],
    pins: [
      {
        id: "guardrails",
        tone: "warning",
        x: 18,
        y: 28,
        title: "Guardrails im Zentrum",
        text: "Die Regeln, die Auto-Versand begrenzen, sind im selben Blickfeld wie die Freigabe.",
      },
      {
        id: "sandbox",
        tone: "brand",
        x: 72,
        y: 70,
        title: "Sandbox vor Produktion",
        text: "Neue Logik kann sichtbar geprüft werden, bevor sie im Live-Betrieb greift.",
      },
    ],
  },
  {
    id: "messages-inbox",
    slug: "messages-inbox",
    kicker: "Nachrichten",
    title: "Arbeitsqueue statt Posteingang",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/messages-inbox.png",
    alt: "Nachrichtenliste mit priorisierten Fällen, Statusspuren und Primäraktionen",
    message: "Die Inbox sortiert nach Arbeitstypen und Entscheidungen, nicht nur nach Eingangszeit.",
    usage: ["Produkt", "So funktioniert's", "Video 1"],
    pins: [
      {
        id: "approval",
        tone: "warning",
        x: 30,
        y: 13,
        title: "Freigaben stehen oben",
        text: "Offene Freigaben werden klar als nächste sichere Aktion markiert.",
      },
      {
        id: "escalation",
        tone: "danger",
        x: 24,
        y: 78,
        title: "Eskalation mit nächstem Schritt",
        text: "Wenn Automatik stoppt, zeigt die Zeile direkt, was jetzt geprüft werden muss.",
      },
    ],
  },
  {
    id: "messages-filters",
    slug: "messages-filters",
    kicker: "Nachrichten",
    title: "Wichtige Filter in einem Klick",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/messages-filters.png",
    alt: "Filterleiste mit Schnellfiltern für Freigabe, Eskalation und Priorität",
    message: "Freigabe, Eskalation und Priorität liegen in der ersten Reihe statt in einem tiefen Filtermenü.",
    usage: ["Produkt", "Follow-up-Logik", "Video 1"],
    pins: [
      {
        id: "chips",
        tone: "brand",
        x: 55,
        y: 36,
        title: "Schnellfilter vorne",
        text: "Die drei wichtigsten Arbeitszustände sind direkt sichtbar und klickbar.",
      },
      {
        id: "meta",
        tone: "neutral",
        x: 28,
        y: 20,
        title: "Meta statt Badge-Wolke",
        text: "Zahlen und Suchlogik bleiben kompakt, damit die Toolbar ruhig lesbar bleibt.",
      },
    ],
  },
  {
    id: "conversation-thread",
    slug: "conversation-thread",
    kicker: "Konversation",
    title: "Ruhige Produktionsfläche für Antworten",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/conversation-thread.png",
    alt: "Konversationsansicht mit Thread, Composer und Aktionsleiste",
    message: "Die eigentliche Antwortarbeit sitzt in einer klaren Produktionsfläche statt in einer überladenen Detailseite.",
    usage: ["Produkt", "Freigabe-Inbox", "Video 1"],
    pins: [
      {
        id: "thread",
        tone: "neutral",
        x: 40,
        y: 34,
        title: "Thread im Zentrum",
        text: "Verlauf und Suche bleiben im Fokus, bevor eine neue Antwort formuliert wird.",
      },
      {
        id: "composer",
        tone: "brand",
        x: 53,
        y: 83,
        title: "Antworten ohne Kontextverlust",
        text: "Composer und Assistenz sitzen direkt unter dem Verlauf, nicht in einem separaten Flow.",
      },
    ],
  },
  {
    id: "conversation-context",
    slug: "conversation-context",
    kicker: "Konversation",
    title: "Kontext bleibt neben der Antwort sichtbar",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/conversation-context.png",
    alt: "Rechte Kontextleiste mit Objektbezug, Entscheidungslogik und Follow-up-Status",
    message: "Objektbezug, Entscheidungslogik und Follow-ups bleiben neben dem Thread sichtbar.",
    usage: ["Produkt", "Qualitätschecks", "Video 2"],
    pins: [
      {
        id: "decision",
        tone: "warning",
        x: 55,
        y: 55,
        title: "Entscheidungslogik offen gelegt",
        text: "Warum etwas stoppt oder läuft, ist direkt im selben Screen nachvollziehbar.",
      },
      {
        id: "property",
        tone: "neutral",
        x: 52,
        y: 25,
        title: "Objektkontext ohne Springen",
        text: "Relevante Objekt- und Lead-Informationen liegen in derselben rechten Arbeitsleiste.",
      },
    ],
  },
  {
    id: "approval-review-flow",
    slug: "approval-review-flow",
    kicker: "Freigabe",
    title: "Jede Freigabe folgt derselben Reihenfolge",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/approval-review-flow.png",
    alt: "Freigabeansicht mit Review-Reihenfolge Original, Vorschlag, Änderungen, Entscheiden",
    message: "Die Oberfläche erzwingt eine feste Prüf-Reihenfolge statt einer freien Interpretation pro Fall.",
    usage: ["Produkt", "Freigabe-Inbox", "Video 3"],
    pins: [
      {
        id: "order",
        tone: "brand",
        x: 48,
        y: 42,
        title: "Prüf-Reihenfolge im Kopf",
        text: "Original, Vorschlag, Änderungen und Entscheidung sind klar voneinander getrennt.",
      },
    ],
  },
  {
    id: "approval-decision",
    slug: "approval-decision",
    kicker: "Freigabe",
    title: "Senden, Bearbeiten oder Ablehnen",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/approval-decision.png",
    alt: "Freigabeansicht mit klarer Entscheidungsfläche für Senden, Bearbeiten und Ablehnen",
    message: "Die finale Entscheidung ist eine eigene, sichtbare Arbeitsstufe und kein versteckter Button am Rand.",
    usage: ["Produkt", "Sicherheit", "Video 3"],
    pins: [
      {
        id: "decision",
        tone: "warning",
        x: 75,
        y: 58,
        title: "Entscheidung separat",
        text: "Freigabeaktionen werden bewusst von Original und Änderungsvorschlag getrennt.",
      },
      {
        id: "reason",
        tone: "neutral",
        x: 42,
        y: 60,
        title: "Diff und Grund sichtbar",
        text: "Vor dem Senden bleibt erkennbar, was sich geändert hat und warum.",
      },
    ],
  },
  {
    id: "tone-style-setup",
    slug: "tone-style-setup",
    kicker: "Ton & Stil",
    title: "Stil wird als Setup gepflegt",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/tone-style-setup.png",
    alt: "Ton-und-Stil-Seite mit Stilreglern, Guardrails und Stilbeispielen",
    message: "Ton und Stil wirken wie ein geführtes Setup und nicht wie ein loses Einstellungsformular.",
    usage: ["Produkt", "Ton & Stil", "Video 3"],
    pins: [
      {
        id: "knobs",
        tone: "brand",
        x: 31,
        y: 24,
        title: "Regler statt Freitext-Chaos",
        text: "Formality, Länge und Sign-off sind strukturierte Stellschrauben.",
      },
      {
        id: "rules",
        tone: "neutral",
        x: 29,
        y: 58,
        title: "Guardrails im selben Setup",
        text: "Stilwünsche und Grenzen werden an derselben Stelle gepflegt.",
      },
    ],
  },
  {
    id: "tone-style-preview",
    slug: "tone-style-preview",
    kicker: "Ton & Stil",
    title: "Änderungen direkt an echter Vorschau sehen",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/tone-style-preview.png",
    alt: "Ton-und-Stil-Vorschaukarte mit Zusammenfassung und Beispielantwort",
    message: "Änderungen an Stil und Regeln werden sofort an einer Vorschau überprüfbar.",
    usage: ["Produkt", "Ton & Stil", "Video 3"],
    pins: [
      {
        id: "preview",
        tone: "success",
        x: 73,
        y: 40,
        title: "Vorschau statt Hoffnung",
        text: "Das Team sieht direkt, wie sich Stilregeln in einer Antwort auswirken.",
      },
    ],
  },
  {
    id: "billing-plan-access",
    slug: "billing-plan-access",
    kicker: "Abo",
    title: "Planstatus klar und ohne Support",
    frame: "desktop",
    src: "/marketing-screenshots/core/raw/billing-plan-access.png",
    alt: "Abo-Seite mit Planstatus, Rechnungen und Zugriffsaktionen",
    message: "Plan, Zugriff und nächste Aktionen bleiben auch im Billing-Bereich klar lesbar.",
    usage: ["Preise", "Abo", "Sales-Kontext"],
    pins: [
      {
        id: "plan",
        tone: "brand",
        x: 24,
        y: 36,
        title: "Planstatus sichtbar",
        text: "Das aktuelle Modell und seine Bedeutung sind im ersten Screen verständlich.",
      },
      {
        id: "actions",
        tone: "neutral",
        x: 77,
        y: 74,
        title: "Nächste Schritte direkt daneben",
        text: "Upgrade, Portal und Rechnungen werden nicht in getrennte Menüs versteckt.",
      },
    ],
  },
];

export const stillVisualPalette = [
  { tone: "brand", title: "Marke", note: "Für Kernmechanik, Rollout und zentrale Hinweise." },
  { tone: "success", title: "Sicher", note: "Für stabile oder freigegebene Zustände." },
  { tone: "warning", title: "Prüfen", note: "Für Freigabe, Guardrails und bewusste Prüfung." },
  { tone: "danger", title: "Stop", note: "Für Eskalation, Risiko und blockierte Zustände." },
  { tone: "neutral", title: "Kontext", note: "Für Hilfstexte und erklärende Struktur." },
] as const;
