// components/tour/tour-steps.ts
export type TourKey = "dashboard";

// Chapters map to pages/sections so we can run the full tour or only a page tour.
export type TourChapter =
  | "home"
  | "messages"
  | "conversation"
  | "escalations"
  | "approval"
  | "followups"
  | "properties"
  | "archive"
  | "templates"
  | "tone_style"
  | "notifications"
  | "account";

export type TourMode = "core" | "deep";

export type TourStep = {
  id: string;
  /** chapter groups steps so we can run the full tour or only a page tour */
  chapter: TourChapter;
  /** core = short essential explanation, deep = optional extra details for this page */
  mode: TourMode;

  title: string;
  body: string;

  /** optional: path prefix the user must be on (supports nested routes via startsWith) */
  requiresPath?: string;

  /** optional: user must click an element to continue */
  requireClickSelector?: string;
  requireClickText?: string;

  /** optional: where to send them for this step (if not on requiresPath) */
  goTo?: string;

  /** optional: anchor selector for spotlight later */
  anchorSelector?: string;
};

export const TOUR_STEPS: Record<TourKey, TourStep[]> = {
  dashboard: [
    // =========================
    // START / HOME (/app/startseite)
    // =========================
    {
      id: "home_intro",
      chapter: "home",
      mode: "core",
      title: "Willkommen bei Advaic",
      body: "In knapp zwei Minuten kennst du die Kernbereiche. Wir gehen geordnet durch Nachrichten, Eskalationen, Freigaben, Follow-ups, Immobilien und Konto-Einstellungen.",
      requiresPath: "/app/startseite",
      goTo: "/app/startseite",
      anchorSelector: '[data-tour="home-hero"]',
    },
    {
      id: "home_nav_primary",
      chapter: "home",
      mode: "core",
      title: "Hauptnavigation",
      body: "Links findest du alle Hauptbereiche. Du kannst jederzeit springen; die Tour gibt dir nur die empfohlene Reihenfolge für den Einstieg.",
      requiresPath: "/app/startseite",
      anchorSelector: '[data-tour="sidebar"]',
    },
    {
      id: "home_stats",
      chapter: "home",
      mode: "core",
      title: "Überblick auf einen Blick",
      body: "Diese Kacheln zeigen dir sofort Prioritäten: neue Gespräche, offene Freigaben, Eskalationen und Follow-ups.",
      requiresPath: "/app/startseite",
      anchorSelector: '[data-tour="home-stats"]',
    },
    {
      id: "home_shortcuts",
      chapter: "home",
      mode: "deep",
      title: "Schnellaktionen",
      body: "Hier startest du Standardaktionen ohne Umwege, z. B. direkt in die Inbox oder zur Immobilienanlage.",
      requiresPath: "/app/startseite",
      anchorSelector: '[data-tour="home-shortcuts"]',
    },
    {
      id: "home_tour_reopen",
      chapter: "home",
      mode: "core",
      title: "Tour jederzeit öffnen",
      body: "Unten rechts öffnest du die Tour wieder. Du kannst sie fortsetzen, komplett neu starten oder zurücksetzen.",
      requiresPath: "/app/startseite",
      anchorSelector: '[data-tour="tour-launcher"]',
    },

    // =========================
    // NACHRICHTEN LISTE (/app/nachrichten)
    // =========================
    {
      id: "messages_go",
      chapter: "messages",
      mode: "core",
      title: "Nachrichten",
      body: "Hier laufen alle Interessenten-Gespräche zusammen. Eine Karte steht jeweils für eine Konversation.",
      requiresPath: "/app/nachrichten",
      goTo: "/app/nachrichten",
    },
    {
      id: "messages_header",
      chapter: "messages",
      mode: "core",
      title: "Status & Zähler",
      body: "Oben siehst du die wichtigsten Kennzahlen (angezeigt, gesamt, eskaliert). So erkennst du sofort die aktuelle Last.",
      requiresPath: "/app/nachrichten",
      anchorSelector: '[data-tour="messages-header"]',
    },
    {
      id: "messages_filters",
      chapter: "messages",
      mode: "core",
      title: "Suchen und filtern",
      body: "Mit Suche, Kategorie, Priorität und Eskalationsfilter findest du in Sekunden die wichtigsten Fälle.",
      requiresPath: "/app/nachrichten",
      anchorSelector: '[data-tour="messages-filters"]',
    },
    {
      id: "messages_list_overview",
      chapter: "messages",
      mode: "core",
      title: "Konversationsliste",
      body: "Hier siehst du alle Konversationen. Öffne eine Karte für Verlauf, Antwort und Statusdetails.",
      requiresPath: "/app/nachrichten",
      anchorSelector: '[data-tour="messages-list"]',
    },
    {
      id: "messages_card_explained",
      chapter: "messages",
      mode: "deep",
      title: "Was zeigt eine Karte?",
      body: "Eine Karte zeigt Kontakt, letzte Nachricht, Kategorie, Priorität und Eskalationsstatus. Damit priorisierst du ohne Öffnen jedes Details.",
      requiresPath: "/app/nachrichten",
      anchorSelector: '[data-tour="conversation-card"]',
    },
    {
      id: "messages_open_required",
      chapter: "messages",
      mode: "core",
      title: "Konversation öffnen",
      body: "Öffne jetzt eine Konversation. Danach gehen wir den Detailbereich und den Versand durch.",
      requiresPath: "/app/nachrichten",
      requireClickSelector: '[data-tour="conversation-card"]',
      requireClickText: "Klicke eine Konversations-Karte an, um fortzufahren.",
    },

    // =========================
    // KONVERSATION (DETAIL) (/app/nachrichten/[id])
    // NOTE: requiresPath has trailing slash so it does NOT match "/app/nachrichten".
    // =========================
    {
      id: "conversation_header",
      chapter: "conversation",
      mode: "core",
      title: "Konversation: Kopfzeile",
      body: "Oben siehst du Kontakt, Kategorie und Priorität. Von hier steuerst du den Fall.",
      requiresPath: "/app/nachrichten/",
      anchorSelector: '[data-tour="conversation-header"]',
    },
    {
      id: "conversation_history",
      chapter: "conversation",
      mode: "core",
      title: "E-Mail-Verlauf",
      body: "Hier siehst du den echten E-Mail-Verlauf: eingehende Nachrichten und gesendete Antworten. Das ist kein interner Chat, sondern dein reales Postfachgeschehen.",
      requiresPath: "/app/nachrichten/",
      anchorSelector: '[data-tour="conversation-messages"]',
    },
    {
      id: "conversation_rule_send_real",
      chapter: "conversation",
      mode: "core",
      title: "Senden = echte E-Mail",
      body: "Wenn du auf „Senden“ klickst, wird eine echte E-Mail über dein verbundenes Postfach verschickt. Advaic unterstützt den Entwurf, die Freigabe liegt bei dir.",
      requiresPath: "/app/nachrichten/",
      anchorSelector: '[data-tour="composer"]',
    },
    {
      id: "conversation_attachments",
      chapter: "conversation",
      mode: "deep",
      title: "Anhänge",
      body: "Anhänge werden direkt mit der E-Mail verschickt, z. B. Exposé, Grundriss oder Unterlagenliste.",
      requiresPath: "/app/nachrichten/",
      anchorSelector: '[data-tour="attachments"]',
    },
    {
      id: "conversation_profile",
      chapter: "conversation",
      mode: "deep",
      title: "Profil und Dokumente",
      body: "Über „Profil“ siehst du Zusatzinfos und vorhandene Dokumente zum Interessenten. Das hilft bei schnellen, passenden Antworten.",
      requiresPath: "/app/nachrichten/",
      anchorSelector: '[data-tour="lead-profile-button"]',
    },

    // =========================
    // ESKALATIONEN (/app/eskalationen)
    // =========================
    {
      id: "escalations_go",
      chapter: "escalations",
      mode: "core",
      title: "Eskalationen",
      body: "Eskalationen sind Fälle, bei denen bewusst menschliche Entscheidung nötig ist, z. B. bei Sonderfällen oder Risiken.",
      requiresPath: "/app/eskalationen",
      goTo: "/app/eskalationen",
    },
    {
      id: "escalations_list",
      chapter: "escalations",
      mode: "core",
      title: "Eskalationsliste",
      body: "Hier landen nur Fälle, die Advaic nicht automatisch abschließt. Du übernimmst die Entscheidung für den nächsten Schritt.",
      requiresPath: "/app/eskalationen",
      anchorSelector: '[data-tour="escalations-list"]',
    },
    {
      id: "escalations_actions",
      chapter: "escalations",
      mode: "deep",
      title: "Typische Aktionen",
      body: "Typische Aktionen sind: Antwort verfassen, Rückfrage stellen oder Fall schließen. So bleiben Sonderfälle kontrolliert.",
      requiresPath: "/app/eskalationen",
      anchorSelector: '[data-tour="escalation-actions"]',
    },

    // =========================
    // ZUR FREIGABE (/app/zur-freigabe)
    // =========================
    {
      id: "approval_go",
      chapter: "approval",
      mode: "core",
      title: "Zur Freigabe",
      body: "Hier landen Entwürfe, die vor Versand geprüft werden müssen. So bleibt jeder kritische Fall unter deiner Kontrolle.",
      requiresPath: "/app/zur-freigabe",
      goTo: "/app/zur-freigabe",
    },
    {
      id: "approval_list",
      chapter: "approval",
      mode: "core",
      title: "Freigabeliste",
      body: "Jeder Eintrag ist eine geplante E-Mail mit Kontext. Du kannst freigeben oder ablehnen.",
      requiresPath: "/app/zur-freigabe",
      anchorSelector: '[data-tour="approval-list"]',
    },
    {
      id: "approval_preview",
      chapter: "approval",
      mode: "deep",
      title: "Vorschau",
      body: "Vor dem Versand siehst du den kompletten Entwurf inklusive Anhängen.",
      requiresPath: "/app/zur-freigabe",
      anchorSelector: '[data-tour="approval-editor"]',
    },
    {
      id: "approval_send_locking",
      chapter: "approval",
      mode: "deep",
      title: "Sicheres Senden",
      body: "Beim Freigeben prüft Advaic Versandstatus und Sperrlogik, damit Entwürfe nicht versehentlich mehrfach ausgelöst werden.",
      requiresPath: "/app/zur-freigabe",
      anchorSelector: '[data-tour="approval-send"]',
    },
    {
      id: "approval_reject",
      chapter: "approval",
      mode: "deep",
      title: "Ablehnen",
      body: "Wenn du ablehnst, wird nichts versendet. Der Fall bleibt als nicht gesendet dokumentiert.",
      requiresPath: "/app/zur-freigabe",
      anchorSelector: '[data-tour="approval-reject"]',
    },

    // =========================
    // FOLLOW-UPS (/app/follow-ups)
    // =========================
    {
      id: "followups_go",
      chapter: "followups",
      mode: "core",
      title: "Follow-ups",
      body: "Follow-ups holen Antworten zurück, die sonst ausbleiben. Sie laufen regelbasiert und nicht wahllos.",
      requiresPath: "/app/follow-ups",
      goTo: "/app/follow-ups",
    },
    {
      id: "followups_timing",
      chapter: "followups",
      mode: "core",
      title: "Timing",
      body: "Im Standardprofil folgt der erste Reminder nach 24 Stunden, der zweite nach 72 Stunden, nur bei offenen Gesprächen.",
      requiresPath: "/app/follow-ups",
      anchorSelector: '[data-tour="followups-timing"]',
    },
    {
      id: "followups_quality",
      chapter: "followups",
      mode: "core",
      title: "Immer personalisiert",
      body: "Follow-ups beziehen Verlauf, Immobilie und Interessenten-Kontext ein. Dadurch bleiben sie konkret statt generisch.",
      requiresPath: "/app/follow-ups",
      anchorSelector: '[data-tour="followups-quality"]',
    },
    {
      id: "followups_archive",
      chapter: "followups",
      mode: "deep",
      title: "Saubere Inbox",
      body: "Wenn nach den konfigurierten Follow-ups keine Antwort kommt, wird der Fall je nach Einstellung archiviert oder inaktiv markiert.",
      requiresPath: "/app/follow-ups",
      anchorSelector: '[data-tour="followups-archive"]',
    },

    // =========================
    // IMMOBILIEN (/app/immobilien) + HINZUFÜGEN
    // =========================
    {
      id: "properties_go",
      chapter: "properties",
      mode: "core",
      title: "Immobilien",
      body: "Immobilien sind die Datenbasis für Antworten und Follow-ups. Je vollständiger die Objektdaten, desto präziser die Kommunikation.",
      requiresPath: "/app/immobilien",
      goTo: "/app/immobilien",
    },
    {
      id: "properties_list",
      chapter: "properties",
      mode: "core",
      title: "Objektübersicht",
      body: "Hier findest du alle Objekte mit aktuellem Status. Advaic nutzt diese Daten für Matching und Rückfragen.",
      requiresPath: "/app/immobilien",
      anchorSelector: '[data-tour="properties-grid"]',
    },
    {
      id: "properties_add_flow",
      chapter: "properties",
      mode: "core",
      title: "Immobilie anlegen",
      body: "Über „Immobilie hinzufügen“ legst du neue Objekte an. Danach kann Advaic diese im operativen Ablauf nutzen.",
      requiresPath: "/app/immobilien",
      anchorSelector: '[data-tour="properties-add"]',
    },
    {
      id: "properties_add_open",
      chapter: "properties",
      mode: "core",
      title: "Immobilie hinzufügen öffnen",
      body: "Klicke jetzt auf „Immobilie hinzufügen“. Danach gehen wir die Eingabeseite Schritt für Schritt durch.",
      requiresPath: "/app/immobilien",
      requireClickSelector: '[data-tour="properties-add"]',
      requireClickText: "Klicke auf ‚Immobilie hinzufügen‘, um fortzufahren.",
    },
    {
      id: "properties_addpage_intro",
      chapter: "properties",
      mode: "core",
      title: "Anlegen-Seite: Entwurf",
      body: "Hier startest du als Entwurf. Eingaben werden laufend gesichert, damit du ohne Risiko unterbrechen kannst.",
      requiresPath: "/app/immobilien/hinzufuegen",
      goTo: "/app/immobilien/hinzufuegen",
      anchorSelector: '[data-tour="property-add-header"]',
    },
    {
      id: "properties_addpage_marketing",
      chapter: "properties",
      mode: "core",
      title: "Vermietung oder Verkauf",
      body: "Wähle „Vermietung“ oder „Verkauf“. Diese Auswahl steuert die passende Anforderungen- und Unterlagenlogik.",
      requiresPath: "/app/immobilien/hinzufuegen",
      anchorSelector: '[data-tour="property-add-vermarktung"]',
      requireClickSelector: '[data-tour="property-add-vermarktung"]',
      requireClickText:
        "Wähle hier Vermietung oder Verkauf aus, um fortzufahren.",
    },
    {
      id: "properties_addpage_checklist",
      chapter: "properties",
      mode: "core",
      title: "Checkliste für Anfragen",
      body: "Hier definierst du, welche Angaben und Unterlagen pro Objekt abgefragt werden. So erhältst du schneller vollständige Leads.",
      requiresPath: "/app/immobilien/hinzufuegen",
      anchorSelector: '[data-tour="property-add-checklist"]',
    },
    {
      id: "properties_addpage_images",
      chapter: "properties",
      mode: "deep",
      title: "Bilder",
      body: "Bilder kannst du hochladen, sortieren und entfernen. Gute visuelle Daten reduzieren Rückfragen im Erstkontakt.",
      requiresPath: "/app/immobilien/hinzufuegen",
      anchorSelector: '[data-tour="property-add-images"]',
    },
    {
      id: "properties_addpage_publish",
      chapter: "properties",
      mode: "deep",
      title: "Speichern und Veröffentlichen",
      body: "Speichern hält den Entwurf fest. Veröffentlichen setzt das Objekt aktiv, damit es im operativen Ablauf genutzt wird.",
      requiresPath: "/app/immobilien/hinzufuegen",
      anchorSelector: '[data-tour="property-add-save"]',
    },
    {
      id: "properties_back_to_list",
      chapter: "properties",
      mode: "core",
      title: "Zurück zur Übersicht",
      body: "Als Nächstes öffnen wir eine Detailansicht. Dafür gehen wir zurück zur Objektübersicht.",
      requiresPath: "/app/immobilien/hinzufuegen",
      goTo: "/app/immobilien",
    },
    {
      id: "properties_open_detail_required",
      chapter: "properties",
      mode: "core",
      title: "Objekt öffnen",
      body: "Öffne jetzt ein Objekt. Danach schauen wir die Details an, die Advaic für korrekte Antworten nutzt.",
      requiresPath: "/app/immobilien",
      anchorSelector: '[data-tour="property-card"]',
      requireClickSelector: '[data-tour="property-card"]',
      requireClickText:
        "Klicke eine Immobilie an, um die Detailansicht zu öffnen.",
    },
    {
      id: "property_detail_intro",
      chapter: "properties",
      mode: "core",
      title: "Detailansicht: Immobilie",
      body: "Hier siehst du alle Objektinformationen gebündelt. Diese Datenbasis steuert Antwortqualität und Follow-up-Kontext.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-header"]',
    },
    {
      id: "property_detail_images",
      chapter: "properties",
      mode: "core",
      title: "Bilder",
      body: "Hier liegen die Objektbilder. Gute Bildqualität reduziert typische Rückfragen im Erstkontakt.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-images"]',
    },
    {
      id: "property_detail_title_location",
      chapter: "properties",
      mode: "core",
      title: "Titel & Standort",
      body: "Titel und Standort sorgen für eindeutige Zuordnung im Gespräch und verhindern Verwechslungen.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-title"]',
    },
    {
      id: "property_detail_price",
      chapter: "properties",
      mode: "core",
      title: "Preis & Vermarktung",
      body: "Preis und Vermarktungsart sind zentrale Entscheidungsdaten. Sie beeinflussen auch die Abfrage benötigter Unterlagen.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-price"]',
    },
    {
      id: "property_detail_quickfacts",
      chapter: "properties",
      mode: "core",
      title: "Schnelle Fakten",
      body: "Zimmer, Fläche, Etage, Baujahr und Energieklasse sind typische Rückfragepunkte. Vollständige Daten erhöhen Antworttreffer.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-quickfacts"]',
    },
    {
      id: "property_detail_description",
      chapter: "properties",
      mode: "deep",
      title: "Beschreibung",
      body: "Die Beschreibung liefert den Kontext für individuelle Antworten, damit Formulierungen konkret statt generisch bleiben.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-description"]',
    },
    {
      id: "property_detail_details",
      chapter: "properties",
      mode: "core",
      title: "Objektdetails",
      body: "In den Details stehen Eckdaten wie Heizung, Haustiere, Parken und verfügbar ab. Diese Felder stabilisieren die Antwortlogik.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-details"]',
    },
    {
      id: "property_detail_expose",
      chapter: "properties",
      mode: "deep",
      title: "Exposé-Link",
      body: "Wenn ein Exposé-Link hinterlegt ist, kannst du hier direkt prüfen oder weitergeben.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-expose-link"]',
    },
    {
      id: "property_detail_requirements",
      chapter: "properties",
      mode: "core",
      title: "Voraussetzungen",
      body: "Hinterlegte Voraussetzungen steuern die passenden Rückfragen. So werden Unterlagen pro Objekt strukturiert eingesammelt.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-requirements"]',
    },
    {
      id: "property_detail_internal_notes",
      chapter: "properties",
      mode: "deep",
      title: "Interne Notizen",
      body: "Interne Notizen sind nur intern sichtbar. Nutze sie für operative Hinweise wie Zeitfenster oder Sonderabsprachen.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-internal-notes"]',
    },
    {
      id: "property_detail_last_updated",
      chapter: "properties",
      mode: "deep",
      title: "Aktualität",
      body: "Hier siehst du den letzten Aktualisierungsstand. Aktuelle Daten verbessern Matching und Antwortqualität.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-last-updated"]',
    },
    {
      id: "property_detail_back_to_list",
      chapter: "properties",
      mode: "core",
      title: "Zurück zu Immobilien",
      body: "Als Nächstes wechseln wir in den nächsten Systembereich. Wir springen jetzt zurück zur Immobilienübersicht.",
      requiresPath: "/app/immobilien/",
      goTo: "/app/immobilien",
    },
    {
      id: "properties_sync",
      chapter: "properties",
      mode: "deep",
      title: "ImmoScout-Sync",
      body: "Optional kannst du ImmoScout anbinden, damit Objektdaten automatisch synchronisiert und aktuell gehalten werden.",
      requiresPath: "/app/immobilien",
      anchorSelector: '[data-tour="properties-refresh"]',
    },

    // =========================
    // ARCHIV (/app/archiv)
    // =========================
    {
      id: "archive_go",
      chapter: "archive",
      mode: "core",
      title: "Archiv",
      body: "Im Archiv liegen abgeschlossene oder inaktive Gespräche. So bleibt die aktive Inbox übersichtlich.",
      requiresPath: "/app/archiv",
      goTo: "/app/archiv",
    },
    {
      id: "archive_list",
      chapter: "archive",
      mode: "core",
      title: "Archiv-Übersicht",
      body: "Hier findest du abgeschlossene Konversationen mit Statushistorie. Bei Bedarf kannst du jeden Fall wieder aufrufen.",
      requiresPath: "/app/archiv",
      anchorSelector: '[data-tour="archive-list"]',
    },

    // =========================
    // ANTWORTVORLAGEN (/app/antwortvorlagen)
    // =========================
    {
      id: "templates_go",
      chapter: "templates",
      mode: "core",
      title: "Antwortvorlagen",
      body: "Hier pflegst du Textbausteine für wiederkehrende Situationen. Advaic nutzt sie als Grundlage im jeweiligen Kontext.",
      requiresPath: "/app/antwortvorlagen",
      goTo: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-header"]',
    },
    {
      id: "templates_intro_trust",
      chapter: "templates",
      mode: "core",
      title: "Wichtig: Vorlagen werden nicht starr gesendet",
      body: "Vorlagen werden nicht blind 1:1 versendet. Advaic kombiniert Baustein, Gesprächsverlauf und Ton & Stil.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-intro"]',
    },
    {
      id: "templates_layout_overview",
      chapter: "templates",
      mode: "core",
      title: "So ist die Seite aufgebaut",
      body: "Links erstellst und bearbeitest du Vorlagen. Rechts verwaltest du gespeicherte Vorlagen und optional KI-Vorschläge.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-layout"]',
    },

    // ---- FORM (Create/Edit)
    {
      id: "templates_form_card",
      chapter: "templates",
      mode: "core",
      title: "Vorlage erstellen oder bearbeiten",
      body: "Hier erstellst oder bearbeitest du Vorlagen. Halte sie klar und modular, damit sie in mehreren Fällen funktionieren.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-form-card"]',
    },
    {
      id: "templates_form_fields",
      chapter: "templates",
      mode: "deep",
      title: "Titel, Kategorie, Antworttext",
      body: "Titel hilft beim Finden, Kategorie bei Ordnung und Antworttext bildet den Kern. Bevorzuge klare, kurze Bausteine.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-form"]',
    },
    {
      id: "templates_tip",
      chapter: "templates",
      mode: "deep",
      title: "Tipp für perfekte Vorlagen",
      body: "Schreibe Vorlagen allgemein genug für mehrere Fälle, z. B. „Unterlagen anfragen“. Die Personalisierung passiert pro Konversation.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-tip"]',
    },
    {
      id: "templates_save_action",
      chapter: "templates",
      mode: "core",
      title: "Speichern",
      body: "Nach dem Speichern ist die Vorlage sofort im System verfügbar.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-actions"]',
    },

    // ---- AI Generator (optional)
    {
      id: "templates_ai_intro",
      chapter: "templates",
      mode: "deep",
      title: "Optional: KI-Vorlage erstellen",
      body: "Optional kannst du einen ersten Entwurf per KI erstellen. Danach prüfst und überarbeitest du ihn vor dem Speichern.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-ai-card"]',
    },
    {
      id: "templates_ai_prompt",
      chapter: "templates",
      mode: "deep",
      title: "Prompt: Was soll die Vorlage sagen?",
      body: "Je klarer du Ziel und Situation beschreibst, desto besser passt der Entwurf.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-ai-prompt"]',
    },
    {
      id: "templates_ai_generate_button",
      chapter: "templates",
      mode: "deep",
      title: "Generieren",
      body: "Nach dem Generieren landet der Entwurf im Formular, damit du ihn vor dem Speichern prüfen kannst.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-ai-generate"]',
    },

    // ---- List / Edit / Delete
    {
      id: "templates_list_overview",
      chapter: "templates",
      mode: "core",
      title: "Deine gespeicherten Vorlagen",
      body: "Hier findest du alle gespeicherten Vorlagen mit Titel, Kategorie und Inhalt. Du kannst sie jederzeit bearbeiten oder löschen.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-list"]',
    },
    {
      id: "templates_single_card_explain",
      chapter: "templates",
      mode: "deep",
      title: "Was zeigt eine Vorlage?",
      body: "Du siehst den exakt gespeicherten Wortlaut. Im Einsatz ergänzt Advaic den Kontext aus dem jeweiligen Fall.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="template-card"]',
    },
    {
      id: "templates_edit_required",
      chapter: "templates",
      mode: "core",
      title: "Bearbeiten testen",
      body: "Klicke jetzt auf „Bearbeiten“. Die Vorlage wird in das Formular geladen und kann direkt angepasst werden.",
      requiresPath: "/app/antwortvorlagen",
      requireClickSelector: '[data-tour="template-actions"] button',
      requireClickText: "Klicke auf „Bearbeiten“, um fortzufahren.",
      anchorSelector: '[data-tour="template-actions"]',
    },
    {
      id: "templates_edit_flow_explain",
      chapter: "templates",
      mode: "core",
      title: "Edit-Modus",
      body: "Im Edit-Modus passt du Text oder Kategorie an und speicherst die neue Version.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-form-header"]',
    },
    {
      id: "templates_delete_modal_explain",
      chapter: "templates",
      mode: "deep",
      title: "Löschen (mit Schutz)",
      body: "Beim Löschen erscheint eine Sicherheitsabfrage, damit Vorlagen nicht versehentlich entfernt werden.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-delete-modal-card"]',
    },
    {
      id: "templates_suggestions_optional",
      chapter: "templates",
      mode: "deep",
      title: "KI-Vorschläge",
      body: "Vorschläge kannst du mit einem Klick übernehmen und anschließend wie eigene Vorlagen weiterbearbeiten.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-suggestions-card"]',
    },

    // =========================
    // TON & STIL (/app/Ton-und-stil) – 4 STEPS ONLY
    // =========================
    {
      id: "tone_style_intro",
      chapter: "tone_style",
      mode: "core",
      title: "Dein persönlicher Schreibstil",
      body: "Hier legst du fest, wie Advaic in deinem Namen formuliert. Diese Einstellungen gelten systemweit.",
      requiresPath: "/app/ton-und-stil",
      goTo: "/app/ton-und-stil",
      anchorSelector: '[data-tour="tone-style-header"]',
    },
    {
      id: "tone_style_controls",
      chapter: "tone_style",
      mode: "core",
      title: "Stil & Regeln festlegen",
      body: "Definiere Ton, Anrede, Antwortlänge sowie Do’s und Don’ts. So bleiben Antworten konsistent.",
      requiresPath: "/app/ton-und-stil",
      anchorSelector: '[data-tour="tone-style-card"]',
    },
    {
      id: "tone_style_examples",
      chapter: "tone_style",
      mode: "core",
      title: "Mit echten Beispielen trainieren",
      body: "Du kannst eigene Formulierungen oder Beispiele hinterlegen. Das verbessert die Stiltreue in neuen Entwürfen.",
      requiresPath: "/app/ton-und-stil",
      anchorSelector: '[data-tour="tone-style-formulations-input"]',
    },
    {
      id: "tone_style_save",
      chapter: "tone_style",
      mode: "core",
      title: "Einmal speichern – überall aktiv",
      body: "Nach dem Speichern nutzt Advaic diesen Stil automatisch. Änderungen sind jederzeit möglich.",
      requiresPath: "/app/ton-und-stil",
      anchorSelector: '[data-tour="tone-style-save"]',
    },

    // =========================
    // BENACHRICHTIGUNGEN (/app/benachrichtigungen)
    // =========================
    {
      id: "notifications_go",
      chapter: "notifications",
      mode: "core",
      title: "Benachrichtigungen",
      body: "Hier steuerst du, wann und wozu du Alerts erhältst, z. B. bei neuen Nachrichten, Eskalationen oder Freigaben.",
      requiresPath: "/app/benachrichtigungen",
      goTo: "/app/benachrichtigungen",
    },
    {
      id: "notifications_settings",
      chapter: "notifications",
      mode: "core",
      title: "Alert-Regeln",
      body: "Lege fest, ob Hinweise sofort oder gebündelt eingehen. So verpasst du nichts und vermeidest unnötige Unterbrechungen.",
      requiresPath: "/app/benachrichtigungen",
      anchorSelector: '[data-tour="notifications-container"]',
    },

    // =========================
    // KONTO (/app/konto)
    // =========================
    {
      id: "settings_go",
      chapter: "account",
      mode: "core",
      title: "Konto und Einstellungen",
      body: "Hier steuerst du Verknüpfungen, Sicherheit, Stil und Abrechnung. Alle administrativen Einstellungen liegen zentral an einem Ort.",
      requiresPath: "/app/konto",
      goTo: "/app/konto",
      anchorSelector: '[data-tour="account-page"]',
    },
    {
      id: "account_overview",
      chapter: "account",
      mode: "core",
      title: "Konto-Übersicht",
      body: "Hier siehst du die wichtigsten Basisdaten und den aktuellen Plan auf einen Blick.",
      requiresPath: "/app/konto",
      anchorSelector: '[data-tour="account-overview-cards"]',
    },
    {
      id: "account_sidebar",
      chapter: "account",
      mode: "core",
      title: "Navigation im Konto",
      body: "Über diese Navigation erreichst du alle Kontobereiche, von Verknüpfungen bis Sicherheit.",
      requiresPath: "/app/konto",
      anchorSelector: '[data-tour="account-sidebar"]',
    },

    // =========================
    // VERKNÜPFUNGEN
    // =========================
    {
      id: "account_integrations",
      chapter: "account",
      mode: "core",
      title: "Verknüpfte Dienste",
      body: "Verbinde die benötigten Dienste, damit Advaic operativ arbeiten kann und Versand über dein eigenes Postfach läuft.",
      requiresPath: "/app/konto/verknuepfungen",
      goTo: "/app/konto/verknuepfungen",
      anchorSelector: '[data-tour="links-page"]',
    },
    {
      id: "account_email_integration",
      chapter: "account",
      mode: "core",
      title: "E-Mail-Verbindung",
      body: "Verbinde Gmail oder Microsoft 365. Relevante Anfragen werden verarbeitet und Antworten über dieses Postfach versendet.",
      requiresPath: "/app/konto/verknuepfungen",
      anchorSelector: '[data-tour="link-card-gmail"]',
    },
    {
      id: "account_email_choice_note",
      chapter: "account",
      mode: "core",
      title: "Ein Postfach reicht aus",
      body: "Für den Start genügt ein verbundenes E-Mail-Postfach.",
      requiresPath: "/app/konto/verknuepfungen",
      anchorSelector: '[data-tour="link-card-outlook"]',
    },
    {
      id: "account_immoscout_integration",
      chapter: "account",
      mode: "deep",
      title: "ImmoScout24",
      body: "Optional: Mit ImmoScout24 bleibt der Objektbestand synchron und aktuelle Daten stehen im Ablauf bereit.",
      requiresPath: "/app/konto/verknuepfungen",
      anchorSelector: '[data-tour="link-card-immoscout"]',
    },

    // =========================
    // SICHERHEIT & ABO
    // =========================
    {
      id: "account_security",
      chapter: "account",
      mode: "deep",
      title: "Sicherheit",
      body: "Hier verwaltest du Zugangsschutz und sicherheitsrelevante Einstellungen.",
      requiresPath: "/app/konto/sicherheit",
      goTo: "/app/konto/sicherheit",
      anchorSelector: '[data-tour="account-link-passwortsicherheit"]',
    },
    {
      id: "account_subscription",
      chapter: "account",
      mode: "deep",
      title: "Abo und Zahlungen",
      body: "Hier verwaltest du Tarif, Abrechnung und Zahlungsdaten.",
      requiresPath: "/app/konto/abo",
      goTo: "/app/konto/abo",
      anchorSelector: '[data-tour="account-link-abozahlungen"]',
    },
    {
      id: "account_cancellation",
      chapter: "account",
      mode: "deep",
      title: "Kündigung",
      body: "Hier findest du die Optionen zur Kündigung und den aktuellen Vertragsstatus.",
      requiresPath: "/app/konto/abo",
      anchorSelector: '[data-tour="account-link-kontoloschen"]',
    },

    // =========================
    // DONE
    // =========================
    {
      id: "done",
      chapter: "home",
      mode: "core",
      title: "Tour abgeschlossen",
      body: "Du kannst die Tour jederzeit erneut öffnen und einzelne Bereiche gezielt wiederholen.",
      requiresPath: "/app/startseite",
      goTo: "/app/startseite",
    },
  ],
};
