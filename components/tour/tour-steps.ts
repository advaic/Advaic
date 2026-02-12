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
      body: "In etwa 2 Minuten weißt du, wo alles ist. Wir gehen einmal gemeinsam durch: Nachrichten, Eskalationen, Freigaben, Follow-ups, Immobilien und Konto-Einstellungen.",
      requiresPath: "/app/startseite",
      goTo: "/app/startseite",
      anchorSelector: '[data-tour="home-hero"]',
    },
    {
      id: "home_nav_primary",
      chapter: "home",
      mode: "core",
      title: "Hauptnavigation",
      body: "Links findest du die wichtigsten Bereiche. Du kannst jederzeit springen – die Tour führt dich nur einmal geordnet durch die Kernfunktionen.",
      requiresPath: "/app/startseite",
      anchorSelector: '[data-tour="sidebar"]',
    },
    {
      id: "home_stats",
      chapter: "home",
      mode: "core",
      title: "Überblick auf einen Blick",
      body: "Diese Kacheln zeigen dir sofort, was gerade Priorität hat: neue Gespräche, offene Freigaben, Eskalationen und Follow-ups.",
      requiresPath: "/app/startseite",
      anchorSelector: '[data-tour="home-stats"]',
    },
    {
      id: "home_shortcuts",
      chapter: "home",
      mode: "deep",
      title: "Schnellaktionen",
      body: "Hier startest du typische Aktionen, zum Beispiel direkt in die Inbox springen oder eine Immobilie ergänzen.",
      requiresPath: "/app/startseite",
      anchorSelector: '[data-tour="home-shortcuts"]',
    },
    {
      id: "home_tour_reopen",
      chapter: "home",
      mode: "core",
      title: "Tour jederzeit öffnen",
      body: "Unten rechts findest du das Tour-Icon. Du kannst die Tour jederzeit schließen, später fortsetzen oder dir nur die aktuelle Seite erklären lassen.",
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
      body: "Hier laufen alle Gespräche mit Interessenten zusammen. Jede Karte steht für eine Konversation.",
      requiresPath: "/app/nachrichten",
      goTo: "/app/nachrichten",
    },
    {
      id: "messages_header",
      chapter: "messages",
      mode: "core",
      title: "Status & Zähler",
      body: "Oben siehst du die wichtigsten Zahlen (angezeigt, gesamt, eskaliert). So erkennst du sofort, wie viel gerade offen ist.",
      requiresPath: "/app/nachrichten",
      anchorSelector: '[data-tour="messages-header"]',
    },
    {
      id: "messages_filters",
      chapter: "messages",
      mode: "core",
      title: "Suchen und filtern",
      body: "Nutze Suche, Kategorie, Priorität und den Eskalations-Filter. So findest du in Sekunden die wichtigsten Konversationen.",
      requiresPath: "/app/nachrichten",
      anchorSelector: '[data-tour="messages-filters"]',
    },
    {
      id: "messages_list_overview",
      chapter: "messages",
      mode: "core",
      title: "Konversationsliste",
      body: "Hier siehst du alle Konversationen. Öffne eine Karte, um den vollständigen Verlauf zu sehen und zu antworten.",
      requiresPath: "/app/nachrichten",
      anchorSelector: '[data-tour="messages-list"]',
    },
    {
      id: "messages_card_explained",
      chapter: "messages",
      mode: "deep",
      title: "Was zeigt eine Karte?",
      body: "Eine Karte zeigt dir Kontakt, letzte Nachricht, Kategorie, Priorität und ob eskaliert ist. So kannst du schnell entscheiden, was als Nächstes dran ist.",
      requiresPath: "/app/nachrichten",
      anchorSelector: '[data-tour="messages-card"]',
    },
    {
      id: "messages_open_required",
      chapter: "messages",
      mode: "core",
      title: "Konversation öffnen",
      body: "Öffne jetzt bitte eine Konversation. Danach erkläre ich dir den Chatbereich und das Senden von E-Mails.",
      requiresPath: "/app/nachrichten",
      requireClickSelector: '[data-tour="messages-card"]',
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
      body: "Oben siehst du Kontakt, Kategorie und Priorität. Von hier aus steuerst du den gesamten Vorgang.",
      requiresPath: "/app/nachrichten/",
      anchorSelector: '[data-tour="conversation-header"]',
    },
    {
      id: "conversation_history",
      chapter: "conversation",
      mode: "core",
      title: "E-Mail-Verlauf",
      body: "Hier siehst du echte E-Mails: alles, was vom Interessenten ankommt, und alles, was von dir rausgeht. Das ist kein internes Chat-System, sondern dein realer E-Mail-Verlauf.",
      requiresPath: "/app/nachrichten/",
      anchorSelector: '[data-tour="conversation-history"]',
    },
    {
      id: "conversation_rule_send_real",
      chapter: "conversation",
      mode: "core",
      title: "Senden = echte E-Mail",
      body: "Wenn du auf „Senden“ klickst, geht eine echte E-Mail von deiner eigenen E-Mail-Adresse an den Interessenten raus. Advaic unterstützt dich beim Text, aber du behältst die Kontrolle.",
      requiresPath: "/app/nachrichten/",
      anchorSelector: '[data-tour="conversation-composer"]',
    },
    {
      id: "conversation_attachments",
      chapter: "conversation",
      mode: "deep",
      title: "Anhänge",
      body: "Anhänge werden genau so mit der E-Mail verschickt – ideal für Exposés, Grundrisse oder Unterlagen.",
      requiresPath: "/app/nachrichten/",
      anchorSelector: '[data-tour="conversation-attachments"]',
    },
    {
      id: "conversation_profile",
      chapter: "conversation",
      mode: "deep",
      title: "Profil und Dokumente",
      body: "Über „Profil“ kannst du Zusatzinfos einsehen und – falls vorhanden – Dokumente zum Interessenten öffnen (zum Beispiel Unterlagen oder Notizen).",
      requiresPath: "/app/nachrichten/",
      anchorSelector: '[data-tour="conversation-profile-button"]',
    },

    // =========================
    // ESKALATIONEN (/app/eskalationen)
    // =========================
    {
      id: "escalations_go",
      chapter: "escalations",
      mode: "core",
      title: "Eskalationen",
      body: "Eskalationen sind Fälle, bei denen du bewusst die Kontrolle übernimmst, zum Beispiel bei Sonderfällen oder wenn etwas unklar ist.",
      requiresPath: "/app/eskalationen",
      goTo: "/app/eskalationen",
    },
    {
      id: "escalations_list",
      chapter: "escalations",
      mode: "core",
      title: "Eskalationsliste",
      body: "Hier landen nur Fälle, die Advaic nicht automatisch abschließt. Du entscheidest, was als Nächstes passiert.",
      requiresPath: "/app/eskalationen",
      anchorSelector: '[data-tour="escalations-list"]',
    },
    {
      id: "escalations_actions",
      chapter: "escalations",
      mode: "deep",
      title: "Typische Aktionen",
      body: "Typisch sind: Antwort schreiben, Rückfrage stellen oder den Fall schließen. Eskalationen sind selten – aber wichtig.",
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
      body: "Hier landen Entwürfe, die du vor dem Versand prüfst. So geht jede E-Mail sauber und kontrolliert raus.",
      requiresPath: "/app/zur-freigabe",
      goTo: "/app/zur-freigabe",
    },
    {
      id: "approval_list",
      chapter: "approval",
      mode: "core",
      title: "Freigabeliste",
      body: "Jeder Eintrag ist eine geplante E-Mail. Du kannst senden oder ablehnen.",
      requiresPath: "/app/zur-freigabe",
      anchorSelector: '[data-tour="approval-list"]',
    },
    {
      id: "approval_preview",
      chapter: "approval",
      mode: "deep",
      title: "Vorschau",
      body: "Du siehst die komplette E-Mail vor dem Versand, inklusive Anhängen.",
      requiresPath: "/app/zur-freigabe",
      anchorSelector: '[data-tour="approval-preview"]',
    },
    {
      id: "approval_send_locking",
      chapter: "approval",
      mode: "deep",
      title: "Sicheres Senden",
      body: "Beim Senden nutzt Advaic einen sicheren Ablauf mit Schutz vor Doppelversand. Dadurch werden keine E-Mails doppelt verschickt – auch nicht bei Reload oder Mehrfachklicks.",
      requiresPath: "/app/zur-freigabe",
      anchorSelector: '[data-tour="approval-send"]',
    },
    {
      id: "approval_reject",
      chapter: "approval",
      mode: "deep",
      title: "Ablehnen",
      body: "Wenn du ablehnst, wird nichts verschickt. Der Entwurf verschwindet aus der Liste.",
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
      body: "Follow-ups holen oft die Antworten zurück, die sonst verloren gehen. Advaic bleibt dran, ohne aufdringlich zu wirken.",
      requiresPath: "/app/follow-ups",
      goTo: "/app/follow-ups",
    },
    {
      id: "followups_timing",
      chapter: "followups",
      mode: "core",
      title: "Timing",
      body: "Standard: erstes Follow-up nach 24 Stunden, zweites nach 72 Stunden – nur wenn das Gespräch nicht eindeutig abgeschlossen ist.",
      requiresPath: "/app/follow-ups",
      anchorSelector: '[data-tour="followups-timing"]',
    },
    {
      id: "followups_quality",
      chapter: "followups",
      mode: "core",
      title: "Immer personalisiert",
      body: "Follow-ups sind personalisiert: Sie beziehen sich auf den bisherigen Nachrichtenverlauf, die konkrete Immobilie und den jeweiligen Interessenten. Dadurch wirkt nichts generisch.",
      requiresPath: "/app/follow-ups",
      anchorSelector: '[data-tour="followups-quality"]',
    },
    {
      id: "followups_archive",
      chapter: "followups",
      mode: "deep",
      title: "Saubere Inbox",
      body: "Wenn nach zwei Follow-ups keine Antwort kommt, wird das Gespräch archiviert oder als inaktiv markiert. So bleibt deine Inbox fokussiert.",
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
      body: "Immobilien sind die Datenbasis. Je besser die Objektinfos, desto präziser sind Antworten, Matching und Follow-ups.",
      requiresPath: "/app/immobilien",
      goTo: "/app/immobilien",
    },
    {
      id: "properties_list",
      chapter: "properties",
      mode: "core",
      title: "Objektübersicht",
      body: "Hier findest du alle Objekte. Advaic nutzt diese Daten für Matching und für präzise Antworten auf Rückfragen.",
      requiresPath: "/app/immobilien",
      anchorSelector: '[data-tour="properties-list"]',
    },
    {
      id: "properties_add_flow",
      chapter: "properties",
      mode: "core",
      title: "Immobilie anlegen",
      body: "Über „Immobilie hinzufügen“ legst du neue Objekte an. Diese Objekte nutzt Advaic sofort für Antworten, Matching und Follow-ups.",
      requiresPath: "/app/immobilien",
      anchorSelector: '[data-tour="properties-add"]',
    },
    {
      id: "properties_add_open",
      chapter: "properties",
      mode: "core",
      title: "Immobilie hinzufügen öffnen",
      body: "Klicke jetzt auf „Immobilie hinzufügen“. Danach schauen wir uns die Anlegen-Seite gemeinsam an.",
      requiresPath: "/app/immobilien",
      requireClickSelector: '[data-tour="properties-add"]',
      requireClickText: "Klicke auf ‚Immobilie hinzufügen‘, um fortzufahren.",
    },
    {
      id: "properties_addpage_intro",
      chapter: "properties",
      mode: "core",
      title: "Anlegen-Seite: Entwurf",
      body: "Hier erstellst du zunächst einen Entwurf. Sobald du etwas eingibst, wird automatisch gespeichert – du kannst jederzeit zurückspringen, ohne etwas zu verlieren.",
      requiresPath: "/app/immobilien/hinzufuegen",
      goTo: "/app/immobilien/hinzufuegen",
      anchorSelector: '[data-tour="property-add-header"]',
    },
    {
      id: "properties_addpage_marketing",
      chapter: "properties",
      mode: "core",
      title: "Vermietung oder Verkauf",
      body: "Wähle „Vermietung“ oder „Verkauf“. Diese Auswahl steuert, welche Informationen und Unterlagen Advaic später beim Interessenten aktiv anfragt.",
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
      body: "Das ist die Checkliste pro Immobilie: Du legst fest, welche Informationen Advaic bei Anfragen automatisch abfragt. So bekommst du schneller vollständige Unterlagen – passend zur Vermarktung.",
      requiresPath: "/app/immobilien/hinzufuegen",
      anchorSelector: '[data-tour="property-add-checklist"]',
    },
    {
      id: "properties_addpage_images",
      chapter: "properties",
      mode: "deep",
      title: "Bilder",
      body: "Bilder werden privat gespeichert und können per Drag & Drop sortiert oder gelöscht werden. Gute Bilder reduzieren Rückfragen und erhöhen die Abschlussrate.",
      requiresPath: "/app/immobilien/hinzufuegen",
      anchorSelector: '[data-tour="property-add-images"]',
    },
    {
      id: "properties_addpage_publish",
      chapter: "properties",
      mode: "deep",
      title: "Speichern und Veröffentlichen",
      body: "Speichern hält den Entwurf fest. Veröffentlichen macht das Objekt aktiv, damit Advaic es zuverlässig für Matching und Antworten nutzen kann.",
      requiresPath: "/app/immobilien/hinzufuegen",
      anchorSelector: '[data-tour="property-add-actions"]',
    },
    {
      id: "properties_back_to_list",
      chapter: "properties",
      mode: "core",
      title: "Zurück zur Übersicht",
      body: "Als Nächstes schauen wir uns die Detailansicht einer Immobilie an. Wir gehen dafür zurück zur Objektübersicht.",
      requiresPath: "/app/immobilien/hinzufuegen",
      goTo: "/app/immobilien",
    },
    {
      id: "properties_open_detail_required",
      chapter: "properties",
      mode: "core",
      title: "Objekt öffnen",
      body: "Öffne jetzt bitte eine Immobilie. Danach zeige ich dir die Detailansicht (Bilder, Fakten, Beschreibung und Voraussetzungen).",
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
      body: "Hier siehst du alle Informationen zu einer Immobilie an einem Ort. Genau diese Daten nutzt Advaic später für präzise Antworten und Follow-ups.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-header"]',
    },
    {
      id: "property_detail_images",
      chapter: "properties",
      mode: "core",
      title: "Bilder",
      body: "Hier findest du die Bilder der Immobilie. Du kannst sie anklicken, um sie groß zu sehen. Gute Bilder reduzieren Rückfragen und erhöhen die Abschlussrate.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-images"]',
    },
    {
      id: "property_detail_title_location",
      chapter: "properties",
      mode: "core",
      title: "Titel & Standort",
      body: "Hier siehst du den Objekttitel und die Adresse. Das hilft, Antworten eindeutig auf die richtige Immobilie zu beziehen.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-title"]',
    },
    {
      id: "property_detail_price",
      chapter: "properties",
      mode: "core",
      title: "Preis & Vermarktung",
      body: "Hier siehst du den Preis und ob es sich um Vermietung oder Verkauf handelt. Diese Info beeinflusst auch, welche Unterlagen Advaic später anfragt.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-price"]',
    },
    {
      id: "property_detail_quickfacts",
      chapter: "properties",
      mode: "core",
      title: "Schnelle Fakten",
      body: "Zimmer, Fläche, Etage, Baujahr und Energieklasse – diese Fakten tauchen in vielen Rückfragen auf. Advaic nutzt sie, um schnell und korrekt zu antworten.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-quickfacts"]',
    },
    {
      id: "property_detail_description",
      chapter: "properties",
      mode: "deep",
      title: "Beschreibung",
      body: "Hier steht die Beschreibung des Objekts. Advaic kann daraus wichtige Details für Rückfragen oder Follow-ups übernehmen – ohne generisch zu klingen.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-description"]',
    },
    {
      id: "property_detail_details",
      chapter: "properties",
      mode: "core",
      title: "Objektdetails",
      body: "In den Details findest du alle Eckdaten (z.B. Heizung, Haustiere, Parken, Verfügbar ab). Diese Daten sorgen für konsistente und präzise Antworten.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-details"]',
    },
    {
      id: "property_detail_expose",
      chapter: "properties",
      mode: "deep",
      title: "Exposé-Link",
      body: "Wenn ein Exposé-Link hinterlegt ist, kannst du ihn hier öffnen. Das ist praktisch, um schnell Details nachzuschauen oder Unterlagen weiterzugeben.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-expose-link"]',
    },
    {
      id: "property_detail_requirements",
      chapter: "properties",
      mode: "core",
      title: "Voraussetzungen",
      body: "Falls Voraussetzungen hinterlegt sind, sieht der Interessent später genau dazu passende Fragen. So sammelt Advaic automatisch die richtigen Unterlagen – passend zur Immobilie.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-requirements"]',
    },
    {
      id: "property_detail_internal_notes",
      chapter: "properties",
      mode: "deep",
      title: "Interne Notizen",
      body: "Interne Notizen sind nur für dich. Sie helfen, besondere Punkte im Kopf zu behalten (z.B. flexible Besichtigungszeiten oder Hinweise zum Ablauf).",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-internal-notes"]',
    },
    {
      id: "property_detail_last_updated",
      chapter: "properties",
      mode: "deep",
      title: "Aktualität",
      body: "Hier siehst du, wann die Immobilie zuletzt aktualisiert wurde. Aktuelle Daten verbessern Matching, Antworten und Follow-ups.",
      requiresPath: "/app/immobilien/",
      anchorSelector: '[data-tour="property-detail-last-updated"]',
    },
    {
      id: "property_detail_back_to_list",
      chapter: "properties",
      mode: "core",
      title: "Zurück zu Immobilien",
      body: "Super. Als Nächstes gehen wir weiter im System. Wir springen jetzt zurück zur Immobilienübersicht.",
      requiresPath: "/app/immobilien/",
      goTo: "/app/immobilien",
    },
    {
      id: "properties_sync",
      chapter: "properties",
      mode: "deep",
      title: "ImmoScout-Sync",
      body: "Optional: Verbinde ImmoScout. Dann werden Objekte automatisch synchronisiert und bleiben aktuell, ohne doppelte Pflege.",
      requiresPath: "/app/immobilien",
      anchorSelector: '[data-tour="properties-sync"]',
    },

    // =========================
    // ARCHIV (/app/archiv)
    // =========================
    {
      id: "archive_go",
      chapter: "archive",
      mode: "core",
      title: "Archiv",
      body: "Im Archiv landen abgeschlossene oder inaktive Gespräche. So bleibt deine Inbox schlank und fokussiert.",
      requiresPath: "/app/archiv",
      goTo: "/app/archiv",
    },
    {
      id: "archive_list",
      chapter: "archive",
      mode: "core",
      title: "Archiv-Übersicht",
      body: "Hier findest du alle abgeschlossenen Konversationen inklusive Status. Du kannst jederzeit wieder hineinsehen.",
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
      body: "Hier baust du dir deine besten Textbausteine. Advaic nutzt sie als Grundlage – und passt sie immer an Kontext, Immobilie und deinen Ton an.",
      requiresPath: "/app/antwortvorlagen",
      goTo: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-header"]',
    },
    {
      id: "templates_intro_trust",
      chapter: "templates",
      mode: "core",
      title: "Wichtig: Vorlagen werden nicht starr gesendet",
      body: "Vorlagen sind nie ein 1:1 Copy-Paste. Advaic kombiniert deine Vorlage mit dem konkreten Verlauf und deinem Ton & Stil – damit es natürlich und passend wirkt.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-intro"]',
    },
    {
      id: "templates_layout_overview",
      chapter: "templates",
      mode: "core",
      title: "So ist die Seite aufgebaut",
      body: "Links erstellst oder bearbeitest du Vorlagen. Rechts siehst du deine gespeicherten Vorlagen und kannst optional KI-Vorlagen erstellen.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-layout"]',
    },

    // ---- FORM (Create/Edit)
    {
      id: "templates_form_card",
      chapter: "templates",
      mode: "core",
      title: "Vorlage erstellen oder bearbeiten",
      body: "Hier baust du deine Vorlage. Halte sie kurz und eindeutig – Advaic ergänzt später Details aus dem Kontext (Immobilie, Rückfragen, Unterlagen).",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-form-card"]',
    },
    {
      id: "templates_form_fields",
      chapter: "templates",
      mode: "deep",
      title: "Titel, Kategorie, Antworttext",
      body: "Titel: nur für dich, damit du sie schnell findest. Kategorie: optional für Ordnung. Antworttext: der Kern – lieber klar und modular statt super lang.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-form"]',
    },
    {
      id: "templates_tip",
      chapter: "templates",
      mode: "deep",
      title: "Tipp für perfekte Vorlagen",
      body: "Schreibe Vorlagen so, dass sie in vielen Situationen funktionieren (z.B. 'Unterlagen anfragen' statt ultra spezifisch). Advaic macht sie im Chat dann individuell.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-tip"]',
    },
    {
      id: "templates_save_action",
      chapter: "templates",
      mode: "core",
      title: "Speichern",
      body: "Wenn du speicherst, ist die Vorlage sofort verfügbar – z.B. als Grundlage für Antworten in Konversationen.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-actions"]',
    },

    // ---- AI Generator (optional)
    {
      id: "templates_ai_intro",
      chapter: "templates",
      mode: "deep",
      title: "Optional: KI-Vorlage erstellen",
      body: "Wenn du schnell starten willst: beschreibe kurz die Situation. Die KI erstellt eine erste Version – du prüfst sie und speicherst sie dann als deine Vorlage.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-ai-card"]',
    },
    {
      id: "templates_ai_prompt",
      chapter: "templates",
      mode: "deep",
      title: "Prompt: Was soll die Vorlage sagen?",
      body: "Je klarer du die Situation beschreibst (z.B. Haustiere, Besichtigung, Unterlagen), desto besser wird die Vorlage.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-ai-prompt"]',
    },
    {
      id: "templates_ai_generate_button",
      chapter: "templates",
      mode: "deep",
      title: "Generieren",
      body: "Klicke hier, um eine Vorlage zu generieren. Danach landet sie links im Formular, damit du sie vor dem Speichern kurz prüfen kannst.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-ai-generate"]',
    },

    // ---- List / Edit / Delete
    {
      id: "templates_list_overview",
      chapter: "templates",
      mode: "core",
      title: "Deine gespeicherten Vorlagen",
      body: "Hier findest du alle Vorlagen. Jede Karte zeigt Titel, Kategorie und den Text. Du kannst jederzeit bearbeiten oder löschen.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-list"]',
    },
    {
      id: "templates_single_card_explain",
      chapter: "templates",
      mode: "deep",
      title: "Was zeigt eine Vorlage?",
      body: "Du siehst den Text genau so, wie du ihn gespeichert hast. Advaic nutzt ihn später als Ausgangspunkt und ergänzt Kontext – damit es menschlich bleibt.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="template-card"]',
    },
    {
      id: "templates_edit_required",
      chapter: "templates",
      mode: "core",
      title: "Bearbeiten testen",
      body: "Klicke jetzt bitte auf „Bearbeiten“. Dann siehst du, wie eine Vorlage oben geladen wird und du sie anpassen kannst.",
      requiresPath: "/app/antwortvorlagen",
      // Empfehlung: sobald du den Button taggst:
      // requireClickSelector: '[data-tour="template-edit"]',
      // Falls du NICHT taggst, geht auch:
      requireClickSelector: '[data-tour="template-actions"] button',
      requireClickText: "Klicke auf „Bearbeiten“, um fortzufahren.",
      anchorSelector: '[data-tour="template-actions"]',
    },
    {
      id: "templates_edit_flow_explain",
      chapter: "templates",
      mode: "core",
      title: "Edit-Modus",
      body: "Oben siehst du jetzt den Edit-Modus. Passe Text oder Kategorie an und speichere – die aktualisierte Vorlage springt automatisch nach oben.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-form-header"]',
    },
    {
      id: "templates_delete_modal_explain",
      chapter: "templates",
      mode: "deep",
      title: "Löschen (mit Schutz)",
      body: "Beim Löschen kommt immer eine Sicherheitsabfrage. So entfernst du Vorlagen nicht aus Versehen.",
      requiresPath: "/app/antwortvorlagen",
      anchorSelector: '[data-tour="templates-delete-modal-card"]',
    },
    {
      id: "templates_suggestions_optional",
      chapter: "templates",
      mode: "deep",
      title: "KI-Vorschläge",
      body: "Wenn hier Vorschläge stehen, kannst du sie mit einem Klick übernehmen. Danach sind sie Teil deiner eigenen Vorlagenbibliothek.",
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
      body: "Hier legst du fest, wie Advaic in deinem Namen schreibt. Diese Einstellungen gelten für alle KI-Antworten, Follow-ups und Vorschläge.",
      requiresPath: "/app/Ton-und-stil",
      goTo: "/app/Ton-und-stil",
      anchorSelector: '[data-tour="tone-style-header"]',
    },
    {
      id: "tone_style_controls",
      chapter: "tone_style",
      mode: "core",
      title: "Stil & Regeln festlegen",
      body: "Wähle Ton, Anrede, Antwortlänge und klare Regeln (Do’s & Don’ts). So bleiben alle Antworten konsistent und fühlen sich wirklich nach dir an.",
      requiresPath: "/app/Ton-und-stil",
      anchorSelector: '[data-tour="tone-style-card"]',
    },
    {
      id: "tone_style_examples",
      chapter: "tone_style",
      mode: "core",
      title: "Mit echten Beispielen trainieren",
      body: "Du kannst eigene Formulierungen oder Gesprächsbeispiele (z.B. Screenshots früherer Antworten) hinterlegen. Advaic nutzt diese, um deinen Stil möglichst exakt zu übernehmen.",
      requiresPath: "/app/Ton-und-stil",
      anchorSelector: '[data-tour="tone-style-upload-input"]',
    },
    {
      id: "tone_style_save",
      chapter: "tone_style",
      mode: "core",
      title: "Einmal speichern – überall aktiv",
      body: "Sobald du speicherst, nutzt Advaic diesen Stil automatisch in allen Antworten. Du kannst ihn jederzeit anpassen.",
      requiresPath: "/app/Ton-und-stil",
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
      body: "Hier steuerst du, wann du Alerts bekommst, zum Beispiel bei neuen Nachrichten, Eskalationen oder Freigaben.",
      requiresPath: "/app/benachrichtigungen",
      goTo: "/app/benachrichtigungen",
    },
    {
      id: "notifications_settings",
      chapter: "notifications",
      mode: "core",
      title: "Alert-Regeln",
      body: "Stelle ein, ob du sofort informiert wirst oder gesammelt. So bleibt es ruhig, aber du verpasst nichts Wichtiges.",
      requiresPath: "/app/benachrichtigungen",
      anchorSelector: '[data-tour="notifications-form"]',
    },

   // =========================
// KONTO (/app/konto)
// =========================

{
  id: "settings_go",
  chapter: "account",
  mode: "core",
  title: "Konto und Einstellungen",
  body: "Hier stellst du ein, wie Advaic für dich arbeitet: Verknüpfungen, Sicherheit, Tonalität und Abrechnung. Alles transparent und jederzeit anpassbar.",
  requiresPath: "/app/konto",
  goTo: "/app/konto",
  anchorSelector: '[data-tour="account-page"]',
},

{
  id: "account_overview",
  chapter: "account",
  mode: "core",
  title: "Konto-Übersicht",
  body: "Hier findest du die wichtigsten Infos zu deinem Account, zum Beispiel Plan und Basisdaten. Alles Relevante ist bewusst an einem Ort gebündelt.",
  requiresPath: "/app/konto",
  anchorSelector: '[data-tour="account-overview-cards"]',
},

{
  id: "account_sidebar",
  chapter: "account",
  mode: "core",
  title: "Navigation im Konto",
  body: "Über diese Navigation erreichst du alle Kontobereiche – von Sicherheit über Verknüpfungen bis zum Abo.",
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
  body: "Verbinde externe Dienste, damit Advaic automatisiert für dich arbeiten kann. Du behältst jederzeit volle Kontrolle.",
  requiresPath: "/app/konto/verknuepfungen",
  goTo: "/app/konto/verknuepfungen",
  anchorSelector: '[data-tour="links-page"]',
},

{
  id: "account_email_integration",
  chapter: "account",
  mode: "core",
  title: "E-Mail-Verbindung",
  body: "Du verbindest entweder Gmail oder Microsoft 365. Advaic liest relevante Anfragen und antwortet direkt über dein eigenes Postfach.",
  requiresPath: "/app/konto/verknuepfungen",
  anchorSelector: '[data-tour="link-card-gmail"]',
},

{
  id: "account_email_choice_note",
  chapter: "account",
  mode: "core",
  title: "Ein Postfach reicht aus",
  body: "Du musst nur EIN E-Mail-Postfach verbinden. Advaic nutzt dieses für alle automatisierten Antworten.",
  requiresPath: "/app/konto/verknuepfungen",
  anchorSelector: '[data-tour="link-card-outlook"]',
},

{
  id: "account_immoscout_integration",
  chapter: "account",
  mode: "deep",
  title: "ImmoScout24",
  body: "Wenn verbunden, synchronisiert Advaic deine Immobilien automatisch. Antworten bleiben dadurch immer aktuell.",
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
  body: "Hier schützt du deinen Zugang, z. B. durch Passwortänderung. Besonders wichtig, da Advaic mit deinem Postfach arbeitet.",
  requiresPath: "/app/konto/sicherheit",
  goTo: "/app/konto/sicherheit",
  anchorSelector: '[data-tour="account-link-passwortsicherheit"]',
},

{
  id: "account_subscription",
  chapter: "account",
  mode: "deep",
  title: "Abo und Zahlungen",
  body: "Hier verwaltest du Tarif, Abrechnung und Zahlungsdaten. Änderungen greifen zum nächsten Zeitraum.",
  requiresPath: "/app/konto/abo",
  goTo: "/app/konto/abo",
  anchorSelector: '[data-tour="account-link-abozahlungen"]',
},

{
  id: "account_cancellation",
  chapter: "account",
  mode: "deep",
  title: "Kündigung",
  body: "Du kannst jederzeit kündigen. Dein Zugang bleibt bis zum Ende des Abrechnungszeitraums aktiv – ohne Hürden.",
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
  body: "Das war die Tour. Du kannst sie jederzeit erneut starten oder einzelne Bereiche erneut erklären lassen.",
  requiresPath: "/app/startseite",
  goTo: "/app/startseite",
},
  ],
};