# UI Content-Inventar

Datum: `2026-03-10`

Ziel: Alle sichtbaren Überschriften, Badges, Hilfetexte und CTA-Texte aus `Startseite` und `Nachrichten` bündeln, damit das Redesign nicht nur Layout, sondern auch Text-Hierarchie sauber neu ordnet.

## Scope

- Startseite: [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx)
- Nachrichten-Inbox: [NachrichtenPageClient.tsx](../app/app/nachrichten/NachrichtenPageClient.tsx), [InboxView.tsx](../app/app/nachrichten/components/InboxView.tsx), [InboxItem.tsx](../app/app/nachrichten/components/InboxItem.tsx)
- Nachrichten-Detail: [LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx)

## Regeln für dieses Inventar

- Erfasst werden sichtbare Texte in der produktiven UI.
- Erfasst werden Überschriften, Badges, Hilfetexte, Leerstates, Tipp-Texte und CTA-Texte.
- Dynamische Datenwerte wie Namen, Zählerstände oder Timestamps werden als Muster beschrieben.
- Reine Toasts, API-Fehler und Debug-Inhalte außerhalb des normalen Flows sind nicht der Hauptfokus, werden aber erwähnt, wenn sie die Textlandschaft sichtbar erweitern.

## Startseite

### 1. Sticky-Header

Überschriften:

- ``${Begrüßung}, ${Name}!`` bzw. ``${Begrüßung}!``

Badges und Status:

- `Advaic`
- `Follow-ups: AN`
- `Follow-ups: AUS`
- `Auto-Senden: AN`
- `Auto-Senden: AUS`

Hilfetexte:

- `Hier siehst du deine wichtigsten Kennzahlen und die wichtigsten Konversationen.`
- Tooltip Follow-ups:
  `Testphase beendet: bitte Starter aktivieren`
  `Follow-ups sind aktiv (klicken zum Pausieren)`
  `Follow-ups sind pausiert (klicken zum Aktivieren)`
- Tooltip Auto-Senden:
  `Testphase beendet: bitte Starter aktivieren`
  `Auto-Senden ist aktiv (klicken zum Pausieren)`
  `Auto-Senden ist pausiert (klicken zum Aktivieren)`

CTAs:

- `Aktualisieren`

### 2. Trial-Karte

Überschriften:

- `Testphase beendet`
- `Testphase aktiv`

Hilfetexte:

- `Auto-Senden und Follow-ups sind pausiert, bis Starter aktiv ist.`
- `Tag {x} von {y}. Noch {z} Tage.`

CTAs:

- `Starter aktivieren`

### 3. Schnellstart-Modul

Überschriften:

- `Schnellstart: Erste 3 sichere Antworten`
- `Nächster bester Schritt`

Badges und Status:

- `{progress}/{target} freigegeben`
- `1) Safe-Start aktiv: Ja`
- `1) Safe-Start aktiv: Noch nicht`
- `2) Offene Freigaben: {x}`
- `3) Manuell versendet: {x}/{y}`
- `4) First Value: Erreicht`
- `4) First Value: Offen`
- `5) Follow-ups sicher: Ja`
- `5) Follow-ups sicher: Auto-basiert`

Hilfetexte:

- `Ziel: in kurzer Zeit echten Nutzen sehen, ohne Risiko. Du startest konservativ und gibst die ersten Antworten manuell frei.`
- Quickstart-Next-Action Hinweise:
  `Die Testphase ist beendet. Aktiviere Starter, damit Safe-Start und Versand wieder freigeschaltet sind.`
  `Setze zuerst Freigabe als Standard für Antworten und Follow-ups.`
  `Dort liegen die nächsten klaren Entwürfe. Drei sichere Freigaben reichen für den First Value.`
  `Öffne neue Konversationen, damit weitere Fälle in die Freigabe laufen.`
  `Mit vollständigen Objektdaten steigen Präzision und Automatisierungsgrad.`
- Abschluss-Hinweise:
  `Sehr gut: Die ersten 3 sicheren Antworten sind durch. Jetzt kannst du den Automatisierungsgrad kontrolliert erhöhen.`
  `Empfehlung: Erst 3 klare Standardfälle freigeben, dann erst über mehr Auto-Senden entscheiden.`

CTAs:

- `Starter aktivieren`
- `Safe-Start anwenden`
- `Offene Freigaben bearbeiten`
- `Nachrichten prüfen`
- `Objekte ergänzen`
- `Zur Freigabe öffnen`
- `Nachrichten öffnen`
- `Starter jetzt aktivieren`
- `Setzt Safe-Start…`

### 4. Lernkurve aus Freigaben

Überschriften:

- `Lernkurve aus Freigaben`
- `Erkanntes Muster`

Badges und Status:

- `Letzte {x} Tage`

Hilfetexte:

- `Diese Werte zeigen, wie stark Entwürfe vor dem Versand angepasst werden.`
- Metrik-Labels:
  `Geprüft`
  `Mit Änderung`
  `Änderungsquote`
  `Ø Diff-Zeichen`
- Leerfall:
  `Noch keine Daten vorhanden.`

CTAs:

- `Ton & Stil öffnen`
- `Freigabe-Inbox öffnen`

### 5. Versandgesundheit

Überschriften:

- `Versandgesundheit`
- `Häufigste Fehler`

Badges und Status:

- `Kritisch`
- `Auffällig`
- `Stabil`

Hilfetexte:

- `Damit du Fehler und Queue-Stau früh siehst, bevor Antworten liegenbleiben.`
- Metrik-Labels:
  `Gesendet (7 Tage)`
  `Fehlgeschlagen (7 Tage)`
  `Fehlerquote`
  `Offene Queue`
- Empfehlungen:
  `Empfehlung: zuerst fehlgeschlagene Sendungen prüfen und danach Queue abbauen.`
  `Empfehlung: Queue und Fehlermuster täglich kurz prüfen.`
  `Der Versand läuft aktuell stabil.`

### 6. Deliverability-Monitoring

Überschriften:

- `Deliverability-Monitoring`

Badges und Status:

- `Kritisch`
- `Auffällig`
- `Stabil`
- Check-Zustände:
  `OK`
  `Fehlt`

Hilfetexte:

- `Sichtbarkeit für SPF, DKIM, DMARC und zustellbarkeitsnahe Fehler.`
- Metrik-Labels:
  `Deliverability-Fehler (24h)`
  `Gesamtfehler (24h)`
  `Fehlerquote (7 Tage)`
  `Absenderdomain`
- Leerfall:
  `Keine Empfehlung verfügbar. Bitte später erneut prüfen.`

### 7. KPI-Reihe

Überschriften:

- `Neue Interessenten`
- `Auto-Antworten`
- `Hohe Priorität`
- `Zeit gespart`

Hilfetexte:

- `Letzte 48 Stunden`
- `Letzte 30 Tage (ohne Freigabe)`
- `Priorität: Hoch / ≥ 2`
- `Letzte 30 Tage (konservativ)`

### 8. Autopilot-Steuerzentrale

Überschriften:

- `Autopilot-Steuerzentrale`
- `Noch gesperrt, weil:`

Badges und Status:

- `Auto-Senden freigegeben`
- `Auto-Senden mit Guardrails`

Hilfetexte:

- `Du siehst hier transparent, ob Auto-Senden freigegeben ist, welche Guardrails gelten und wie ein Fall entschieden wird.`
- Fallback:
  `Gate-Informationen werden geladen oder sind aktuell nicht verfügbar.`

### 9. First-Value-Sandbox

Überschriften:

- `First-Value-Sandbox`

Badges und Status:

- `Sandbox abgeschlossen`
- `Sandbox läuft`
- `Sandbox nicht gestartet`
- `Entscheidung: Auto senden`
- `Entscheidung: Zur Freigabe`
- `Entscheidung: Ignorieren`
- Kernfall-Checkboxen:
  `✓ {Fall}`
  `○ {Fall}`

Hilfetexte:

- Progress:
  `{visited}/{total} Kernfälle geprüft`
- Simulationsfälle:
  `Klare Standardanfrage mit Objektbezug`
  `Anfrage ohne klaren Objektbezug`
  `Beschwerde oder Konfliktmail`
  `Newsletter / no-reply / Systemmail`
- Entscheidungsgründe:
  `Die Nachricht ist klar als Interessenten-Anfrage erkennbar.`
  `Der Fall ist eine Standardsituation mit klaren nächsten Schritten.`
  `Es fehlen keine kritischen Informationen.`
  `Die Immobilie oder der konkrete Bezug ist nicht eindeutig.`
  `Ohne Kontext steigt das Risiko einer unpassenden Antwort.`
  `Advaic stoppt und legt den Fall in die Freigabe-Inbox.`
  `Beschwerden und Konflikte sind heikle Sonderfälle.`
  `Für solche Fälle ist menschliche Prüfung verpflichtend.`
  `Autopilot antwortet hier bewusst nicht automatisch.`
  `Nicht-relevante Mails wie Newsletter und no-reply werden gefiltert.`
  `Kein Lead-Signal, daher kein Versand.`
  `So bleibt Ihr Team auf echte Interessenten fokussiert.`

### 10. ROI-Fortschritt

Überschriften:

- `ROI-Fortschritt`

Hilfetexte:

- `Konservativ gerechnet mit 4 Minuten Zeitersparnis pro sicher automatisch versendeter Antwort.`
- `Automatisiert gelöst`
- `Freigaben offen`
- `Zeit gespart`
- `Realisiert: {x} von {y} Minuten Potenzial im aktuellen Mix ({z}%).`

### 11. Listenblöcke

Überschriften:

- `Freigaben ausstehend`
- `High Priority`
- `Letzte Konversationen`

Hilfetexte:

- `Antworten, die noch bestätigt werden müssen.`
- `Diese Interessenten solltest du zuerst bearbeiten.`
- `Deine zuletzt aktiven Gespräche.`

Leerstates:

- `Keine Freigaben`
- `Aktuell ist nichts zur Freigabe offen.`
- `Keine High Priority`
- `Aktuell keine Interessenten mit hoher Priorität.`
- `Keine Konversationen`
- `Aktuell gibt es keine offenen Konversationen.`

### 12. Erklär- und Vertrauensblöcke

Überschriften:

- `Was bedeuten die Status im Alltag?`
- `Sicherheit & DSGVO im Betrieb`

Hilfetexte:

- `Auto gesendet: klare Standardanfrage, Sicherheitschecks bestanden, direkt versendet.`
- `Zur Freigabe: unklarer oder riskanter Fall, bevor eine Antwort rausgeht.`
- `Ignoriert: Newsletter, Systemmail oder no-reply ohne Interessentenbezug.`
- `Fehlgeschlagen: Versand technisch nicht durchgelaufen, manuell prüfbar und erneut sendbar.`
- `Advaic ist auf DSGVO-konforme Prozesse ausgelegt: klare Zweckbindung, nachvollziehbare Status-Historie und manuelle Kontrolle bei unklaren Fällen.`
- `Im Zweifel Freigabe: Kein blindes Auto-Senden bei Risiko.`
- `Nachvollziehbarkeit: Verlauf mit Status und Zeitstempeln.`
- `Betroffenenrechte: Datenexport und Löschpfad sind vorhanden.`

CTAs:

- `Datenschutz`
- `Cookie & Storage`

## Nachrichten

### 1. Inbox-Header

Überschriften:

- `Nachrichten`

Badges und Status:

- `Advaic`
- `Angezeigt: {x}`
- `Gesamt: {x}`
- `Eskaliert: {x}`

Hilfetexte:

- `Hier siehst du alle Nachrichten deiner Interessenten – filtere nach Kategorie, Priorität oder Eskalation.`

### 2. Inbox-Filterleiste

Hilfetexte und Felder:

- `Suche… (Name, E-Mail, Nachricht)`
- `Alle Kategorien`
- `Kaufen`
- `Mieten`
- `FAQ`
- `Alle Prioritäten`
- `Hoch`
- `Mittel`
- `Niedrig`
- `Neueste zuerst`
- `Älteste zuerst`
- `Name A–Z`
- `Priorität: Hoch → Niedrig`
- `Priorität: Niedrig → Hoch`

CTAs:

- `Nur eskalierte`
- `E-Mails`
- `Zurücksetzen`

Tooltip-Texte:

- `Suche löschen`
- `Kategorie`
- `Priorität`
- `Nur eskalierte Interessenten`
- `E-Mails der angezeigten Interessenten kopieren`
- `Filter zurücksetzen`
- `Sortierung`
- `Eskalationen öffnen`

### 3. Inbox-Inhaltskopf und Leerzustände

Hilfetexte:

- `Tipp: Öffne eine Konversation und antworte direkt.`
- `Enter/Shift+Enter Steuerung findest du im Chat.`

Leerstates:

- `Keine passenden Nachrichten`
- `Keine Treffer für deine Suche.`
- `Keine Treffer mit diesen Filtern. Tipp: Filter zurücksetzen.`
- `Aktuell gibt es keine Nachrichten in dieser Ansicht.`

### 4. Bulk-Toolbar

Badges und Status:

- `{x} ausgewählt`

CTAs:

- `Auswahl löschen`
- `Alle wählen`
- `Erledigt`
- `Archivieren`

Tooltip-Texte:

- `Auswahl löschen`
- `Als erledigt markieren`
- `Archivieren`

### 5. Inbox-Item

Überschriften:

- `{Lead-Name}`

Badges und Status:

- `Zur Freigabe`
- `Erledigt`
- `Archiv`
- `Eskalation`
- `Kategorie`
- `{Typ-Label}`
- `Priorität`
- `{Prioritäts-Label}`
- `Nachrichten`
- `Nachrichten: {x}`

Hilfetexte:

- `E-Mail: {lead.email}`
- `Letzte Aktivität: {Zeit}`
- `Enter öffnet Chat`
- Tooltip Freigabe:
  `{x} Nachricht(en) warten auf Freigabe`
  `Mindestens eine Nachricht wartet auf Freigabe`
- Tooltip Eskalation:
  `Eskalation aktiv – automatische Antworten pausiert`
- Tooltip Status:
  `Als erledigt markiert`
  `Archiviert`

CTAs:

- `Antworten`
- `Zur Freigabe`
- `Deeskalieren`
- `Eskalieren`
- `Auswählen`
- `Auswahl entfernen`

### 6. Konversations-Header

Überschriften:

- `{Lead-Name}`

Badges und Status:

- `{lead.type || "Anfrage"}`
- `Priorität: {x}`
- `Advaic`
- `Immobilie: Zugeordnet`
- `Immobilie: Offen`
- `Erledigt`
- `Offen`

Hilfetexte:

- `{lead.email}`
- Copy-Status:
  `Kopiert`
  `Nicht möglich`
- Tooltips:
  `Immobilie ist zugeordnet (klicken zum Anzeigen)`
  `Noch keine Immobilie zugeordnet (klicken zum Anzeigen)`
  `Als erledigt markieren`
  `E-Mail kopieren`
  `Profil öffnen`
  `Verlauf exportieren`
  `Eskalieren`

CTAs:

- `E-Mail kopieren`
- `Profil`
- `Export`
- `Eskalieren`

### 7. Chat-Leerzustand und Nachrichten-Bubbles

Leerstates:

- `Noch keine Nachrichten.`
- `Schreibe deine erste Antwort – Enter sendet, Shift+Enter macht eine neue Zeile.`

Badges und Status in Bubbles:

- `⏳ Zur Freigabe`
- `Qualitäts-Score {x}/100`
- `Qualitäts-Score offen`
- `Follow-up`
- `Senden fehlgeschlagen`

Hilfetexte:

- `Warum Freigabe?`
- `Empfehlung: {Text}`
- `Alle Nachrichten hier sind echte E-Mails (eingehend/ausgehend).`
- Dateihinweise:
  `📄 PDF öffnen`
  `🔗 Link öffnen`
  `📄 PDF in neuem Tab öffnen`
  `Datei öffnen`

CTAs:

- `Akzeptieren`
- `Bearbeiten`
- `Löschen`

Tooltip-Texte:

- `Freigeben & sofort senden`
- `Entwurf bearbeiten`
- `Entwurf ignorieren`

### 8. Composer

Hilfetexte:

- `Enter = senden · Shift+Enter = neue Zeile`
- `Hinweis: Alles hier ist echte E-Mail-Kommunikation (eingehend & ausgehend) — keine interne Chat-Simulation.`
- Mobil:
  `Shift+Enter: neue Zeile`
- Platzhalter:
  `Antwort schreiben…`
  `Entwurf bearbeiten… (wird NICHT automatisch gesendet)`

Dropdown- und Button-Texte:

- `Vorlage wählen…`
- `Kurze Rückfrage`
- `Besichtigung vorschlagen`
- `Unterlagen anfragen`
- `Stil`
- `Ton: {tone}`
- `No-Go aktiv`
- `Anhang`

CTAs:

- `Abbrechen`
- `Änderungen speichern`
- `Senden`

Zustände:

- `Speichert…`
- `Sendet…`

### 9. Stil-Panel im Composer

Überschriften:

- `Stil & Beispiele`
- `Anrede`
- `Abschluss`
- `Zusatzwunsch (optional)`
- `No-Go Regeln`

Hilfetexte:

- `Nutze Anrede/Abschluss mit 1 Klick. Optional: Zusatzwunsch an Copilot.`
- `Standard: {Anrede}`
- `Standard: {Abschluss}`
- `Keine Anreden gespeichert.`
- `Keine Abschlüsse gespeichert.`
- Platzhalter:
  `z.B. "kürzer", "mehr Druck", "konkreter nächster Schritt"`
- `Wird bei Copilot-Vorschlägen als zusätzliche Anweisung genutzt.`

CTAs:

- `Schließen`
- einzelne Anrede- und Abschluss-Chips `{label}`

### 10. Rechte Kontextspalte: Copilot

Überschriften:

- `Copilot`
- `Lead Status & Regeln`

Badges und Status:

- `{copilotRuleSource}`
- `Lead Follow-ups: An`
- `Lead Follow-ups: Aus`
- `Effektiv: Aktiv`
- `Effektiv: Deaktiviert`
- `(Standard: An/Aus, Immobilie: An/Aus)`

Hilfetexte:

- `Hinweise anzeigen`
- `Hinweise ausblenden`
- `Regelquelle: zeigt, ob Lead-, Immobilien- oder Standardregeln greifen.`
- `Effektiv: ist das tatsächliche Ergebnis nach allen Guardrails.`
- `Trust-Log: dokumentiert Eingang, Freigabe-Entscheidung und Versand.`
- `Lade Copilot-Daten…`

### 11. Property Matching

Überschriften:

- `Property Matching`
- `Zugeordnet`
- `Keine Immobilie`
- `Immobilie manuell zuordnen`

Badges und Status:

- `{updated_at}`
- `Listing-Link`
- `Zuletzt empfohlen`

Hilfetexte:

- `Preis:`
- `Zimmer:`
- `Fläche:`
- `ID:`
- `Warum:`
- `Confidence:`
- `Kein Listing-Link hinterlegt.`
- `Noch keine Immobilie zugeordnet. Sobald der Matcher eine passende Immobilie findet, erscheint sie hier.`

CTAs:

- `Ändern`
- `Entfernen`
- `Zuordnen`
- `Listing öffnen`
- `In Advaic öffnen`

Modal-Texte:

- `Property Matching`
- `Immobilie manuell zuordnen`
- `Schließen`
- `Suche nach Straße, Stadt, Stadtteil…`
- `Suchen`
- `Tipp: Wähle eine Immobilie aus der Liste. Das überschreibt die aktuelle Zuordnung.`
- `Keine Immobilien gefunden.`
- `Zuordnung entfernen`
- `Abbrechen`

### 12. Trust-Log

Überschriften:

- `Trust-Log`

Badges und Status:

- `{x} Einträge`
- `Eingang: {x}`
- `Freigabe: {x}`
- `Versand: {x}`
- `Fehler: {x}`
- Event-Qualität:
  `Qualitäts-Score {x}/100`
- QA-Chips:
  `{verdict}`
  `Risiken: {flags}`

Hilfetexte:

- `Noch keine nachvollziehbaren Statusereignisse vorhanden.`
- `Nachweis: {evidence}`

### 13. Entscheidungslogik

Überschriften:

- `Entscheidungslogik`

Hilfetexte:

- `Noch keine QA-Details vorhanden.`
- `Grund`
- `Details`
- `Empfohlene Aktion`
- `Confidence: {x}`
- `Qualitäts-Score {x}/100`

### 14. Qualitäts-Feedback

Überschriften:

- `Qualitäts-Feedback`
- `Letzte gesendete Antwort`

Hilfetexte:

- `Gib Feedback, sobald eine Antwort gesendet wurde.`
- `{timestamp}`
- `Letztes Feedback: {label} ({zeit})`

CTAs:

- `Hilfreich`
- `Zu lang`
- `Falscher Fokus`
- `Fehlende Infos`

### 15. Follow-ups

Überschriften:

- `Follow-ups`
- `Timing (Standard)`

Badges und Status:

- `Aktiv`
- `Deaktiviert`
- `{followupStatusLabel}`

Hilfetexte:

- `Stufe: {x} / {max}`
- `Nächster Zeitpunkt: {time}`
- `Letztes Follow-up: {time}`
- mögliche Zustands-Texte:
  `Deaktiviert (Lead-Override).`
  `Deaktiviert (Immobilien-Regel).`
  `Deaktiviert (Agent-Standard).`
  `Deaktiviert (Regel).`
  `Gestoppt: {reason}`
  `Gestoppt.`
  `Pausiert bis {time}.`
  `Geplant: Wird automatisch vorbereitet und läuft durch QA/Rewrite Pipeline.`
  `Wartet: Nächster Schritt wird vom Planner berechnet.`
- Timing-Hinweis:
  `Stufe 1: {d1}h · Stufe 2: {d2}h`
  `Diese Werte kommen aus der Immobilienregel.`
  `Diese Werte kommen aus den Agent-Standards.`
- Abschluss-Hinweis:
  `Tipp: Du kannst Follow-ups auch pro Lead (oben) deaktivieren.`

CTAs:

- `Zur Follow-ups Übersicht`
- `Follow-ups Einstellungen`

### 16. Profil-Drawer

Überschriften:

- `Interessenten-Profil`
- `{Lead-Name}`

Hilfetexte:

- `Name:`
- `E-Mail:`
- `Anfrage:`
- `Priorität:`
- `Letzte Aktivität:`
- `Nachrichten:`

CTAs:

- `Schließen`
- `Verlauf exportieren`
- `Eskalieren`
- `Eskalation aktiviert`

## Dubletten, Konkurrenzsignale und Textprobleme

### 1. Startseite beantwortet „Was soll ich jetzt tun?“ zu oft

Gleichzeitig aktiv:

- Trial-Karte mit `Starter aktivieren`
- Schnellstart mit `Nächster bester Schritt`
- Header-Toggles für `Follow-ups` und `Auto-Senden`
- Listenblöcke `Freigaben ausstehend` und `High Priority`
- Autopilot-Steuerzentrale mit eigener Regel- und Freigabelogik

Folge:

- Der Nutzer bekommt mehrere gleichstarke Arbeitsanweisungen statt einer klar priorisierten nächsten Aktion.

### 2. `Starter aktivieren` ist textlich überrepräsentiert

Vorkommen:

- Trial-Karte
- Schnellstart-Next-Action
- Schnellstart-Done-CTA
- diverse Gate-Tooltip-Texte im Header

Folge:

- Billing-Prompting verdrängt die eigentliche operative Aufgabe.

### 3. `Freigabe` ist in Startseite und Nachrichten semantisch überladen

Vorkommen:

- `Zur Freigabe öffnen`
- `Offene Freigaben bearbeiten`
- `Freigaben ausstehend`
- `Lernkurve aus Freigaben`
- `Zur Freigabe` Badge im Inbox-Item
- `Zur Freigabe` Bubble im Chat
- `Warum Freigabe?`
- `Freigabe-Inbox öffnen`
- `Freigabe` im Trust-Log

Folge:

- Ein einziger Begriff trägt Status, Queue, Lernsignal, CTA und Begründung gleichzeitig.

### 4. `Auto-Senden` und `Follow-ups` werden zu oft parallel erklärt

Vorkommen:

- Header-Toggles
- Trial-Karte
- Schnellstart-Hinweise
- Autopilot-Steuerzentrale
- Copilot-Follow-ups-Karte
- Timing- und Regel-Hinweise rechts in der Konversation

Folge:

- Das System erklärt denselben Mechanismus an mehreren Stellen mit leicht anderer Sprache.

### 5. Die Startseite hat zu viele gleichgewichtete Modulüberschriften

Betroffene Titel:

- `Schnellstart: Erste 3 sichere Antworten`
- `Lernkurve aus Freigaben`
- `Versandgesundheit`
- `Deliverability-Monitoring`
- `Autopilot-Steuerzentrale`
- `First-Value-Sandbox`
- `ROI-Fortschritt`
- `Freigaben ausstehend`
- `High Priority`
- `Letzte Konversationen`
- `Was bedeuten die Status im Alltag?`
- `Sicherheit & DSGVO im Betrieb`

Folge:

- Alles wirkt wichtig, nichts wirkt primär.

### 6. Die Inbox-Toolbar mischt Orientierung, Filterung und Utility

Gleichzeitig sichtbar:

- Seitentitel
- Zähler-Badges
- Erklärtext
- Suche
- Kategorie
- Priorität
- Eskalationsfilter
- `E-Mails`
- `Zurücksetzen`
- Sortierung

Folge:

- Die Oberfläche erklärt und steuert gleichzeitig, statt zuerst zur Arbeit zu führen.

### 7. Das Inbox-Item hat zu viele konkurrierende Statussignale

Gleichzeitig möglich:

- `Zur Freigabe`
- `Erledigt`
- `Archiv`
- `Eskalation`
- Kategorie-Badge
- Prioritäts-Badge
- Nachrichten-Zähler
- `Antworten`
- `Zur Freigabe`
- `Eskalieren` oder `Deeskalieren`

Folge:

- Der Blick muss erst sortieren, bevor er handeln kann.

### 8. Die Konversationsansicht erklärt sich an vier Stellen gleichzeitig

Textebenen:

- Header-Badges und Header-Aktionen
- Bubble-Erklärung `Warum Freigabe?`
- Composer-Hinweise
- rechte Kontextspalte mit `Trust-Log`, `Entscheidungslogik`, `Qualitäts-Feedback`, `Follow-ups`

Folge:

- Die Arbeitsfläche wird durch parallel laufende Erklärungssysteme textlich schwer.

### 9. `Hinweis`- und `Tipp`-Texte sind fragmentiert

Beispiele:

- Inbox-Tipp über der Liste
- `Enter/Shift+Enter` im Inbox-Kopf
- `Enter = senden` im Composer
- `Hinweis: Alles hier ist echte E-Mail-Kommunikation`
- `Hinweise anzeigen` im Copilot
- Property-Matching-Tipp im Modal
- Follow-up-Tipp am Kartenende

Folge:

- Guidance ist nicht zentralisiert, sondern über viele kleine Textinseln verteilt.

### 10. Der `Advaic`-Badge ist häufig sichtbar, aber informationsarm

Vorkommen:

- Startseite
- Inbox
- Konversations-Header

Folge:

- Ein visuell dominanter Badge verbraucht Aufmerksamkeit, ohne Entscheidung oder Status zu verbessern.

## Konsequenz für die nächsten Redesign-Tasks

- `T10-T15`: Tokens, Typografie und Spacing müssen die Text-Hierarchie deutlich härten.
- `T40-T49`: Die Startseite braucht weniger gleichgewichtete Überschriften und genau eine klare „Heute wichtig“-Ebene.
- `T50-T61`: Die Nachrichten-Inbox braucht eine härtere Trennung zwischen Kern-Triage, Utility und sekundären Filtern.
- `T70-T75`: Die Konversationsansicht braucht eine klare Hauptspur für Antwortarbeit und eine sekundäre Spur für Kontext und Erklärungen.
