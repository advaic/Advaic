# PlaywrightMCP UI Matrix

## Ziel

Dieses Dokument definiert die konkrete PlaywrightMCP-Testmatrix fuer die wichtigsten UI-Flaechen von Advaic. Der Fokus liegt nicht auf API- oder Route-Smoketests, sondern auf:

- visueller Stabilitaet
- responsivem Verhalten
- Interaktionssicherheit
- Informationshierarchie
- Regressionsschutz waehrend des Redesigns

Die Matrix ist bewusst auf die bereits vorhandenen `data-tour`-Hooks aufgebaut, damit Tests stabiler sind als textbasierte Selektoren.

## Einsatzprinzip

PlaywrightMCP soll hier in drei Modi verwendet werden:

- `Audit-Modus`: Screenshots, Overflow-Checks, Sticky-Header-Pruefung, Scanbarkeit.
- `Flow-Modus`: echte Nutzerablaufe wie Filtern, Freigeben, Bearbeiten, Senden, Drawer oeffnen.
- `Regression-Modus`: dieselben Viewports und Screenshots vor und nach UI-Aenderungen.

PlaywrightMCP ist hier die `UI-Truth-Layer`, nicht die Planungs- oder Architektur-Layer.

## Prioritaet

- `P0`: Muss vor jedem groesseren UI-Refactor stabil laufen.
- `P1`: Muss nach Redesign der Kernflaechen laufen.
- `P2`: Nice-to-have, aber relevant fuer Polishing und mobile Robustheit.

## Viewports

Diese Viewports reichen fuer den aktuellen Code aus und decken eure Breakpoints realistisch ab:

- `mobile-xs`: `375x812`
- `mobile`: `390x844`
- `tablet`: `768x1024`
- `laptop`: `1280x800`
- `desktop`: `1440x900`

Begruendung:

- In der Konversationsansicht gibt es Sonderlogik fuer sehr kleine Breiten.
- Mobile Header und Sidebar verhalten sich anders als Desktop.
- Sticky-Header und Zwei-Spalten-Layouts muessen auf `768`, `1280` und `1440` getrennt validiert werden.

## Datensatz-Anforderungen

Ohne bewusst vorbereitete Testdaten wird PlaywrightMCP hier nur begrenzt wertvoll sein. Es braucht mindestens diese 8 sauberen Szenarien:

- `user_empty`: eingeloggt, aber keine Leads, keine Freigaben.
- `user_default`: eingeloggt mit mindestens 12 Leads.
- `lead_open_standard`: offener Lead mit normalem Verlauf.
- `lead_high_priority`: hoher Prioritaetsfall.
- `lead_escalated`: eskalierter Fall.
- `lead_pending_approval`: mindestens ein Entwurf mit `approval_required=true`.
- `lead_failed_send`: Verlauf mit fehlgeschlagenem Versand.
- `lead_property_assigned`: Lead mit zugeordneter Immobilie.
- `lead_property_unassigned`: Lead ohne Immobilienzuordnung.
- `lead_with_attachments`: Lead oder Freigabe-Nachricht mit Anhaengen.
- `lead_followups_enabled`: aktiver Follow-up-Fall.
- `lead_followups_disabled`: per Lead oder Regel deaktiviert.

## Test-Standards

- Nutze bevorzugt `data-tour`-Selektoren.
- Nutze `getByRole` nur dort, wo die semantische Aktion wichtig ist.
- Verifiziere nicht nur Sichtbarkeit, sondern auch `Interaktionsfolgen`.
- Bei jedem Kernscreen mindestens einen `full-page screenshot` und einen `critical region screenshot` erstellen.
- Bei jedem mobilen Test pruefen:
  - kein horizontaler Scroll
  - keine abgeschnittenen CTA-Labels
  - keine ueberlappenden Sticky-Elemente
- Bei jeder Liste pruefen:
  - erster Eintrag sichtbar
  - letzter sichtbarer CTA klickbar
  - kein verdeckter Content unter Sticky-Header

## Globale Querschnittstests

### `P0-G01` App-Chrome Desktop

- Route: `/app/startseite`, `/app/nachrichten`, `/app/zur-freigabe`
- Viewports: `1280x800`, `1440x900`
- Ziel: Sidebar, Main-Scroll, Sticky-Header und Floating-Tour stoeren sich nicht.
- Assertions:
  - Sidebar sichtbar.
  - Main-Content scrollbar, Sidebar bleibt stabil.
  - Kein horizontaler Scroll im Body.
  - Sticky-Header ueberlappt den ersten Content-Block nicht.

### `P0-G02` App-Chrome Mobile

- Route: `/app/startseite`, `/app/nachrichten`, `/app/zur-freigabe`
- Viewports: `375x812`, `390x844`
- Ziel: Mobile Header und Drawer-Navigation funktionieren sauber.
- Assertions:
  - Mobile Header sichtbar.
  - Burger oeffnet Drawer.
  - Drawer laesst sich per Backdrop schliessen.
  - Bei offenem Drawer scrollt der Body nicht.
  - Nach Navigation schliesst der Drawer automatisch.

### `P0-G03` No Overflow

- Route: alle Kernrouten
- Viewports: alle
- Ziel: keine Layout-Schaeden durch zu lange Labels, Badges, Buttons oder Tabellen.
- Assertions:
  - `document.body.scrollWidth <= window.innerWidth`
  - keine abgeschnittenen Primarbuttons
  - keine Filterleisten, die aus dem Container ragen

## Route `/`

Codebasis:

- [app/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/page.tsx)
- [components/marketing/Navbar.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/Navbar.tsx)
- [components/marketing/Hero.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/Hero.tsx)

### `P0-M01` Hero Hierarchy Desktop

- Viewport: `1440x900`
- Ziel: Hero ist sofort erfassbar.
- Assertions:
  - Marketing-Navbar sichtbar.
  - Hero-H1 sichtbar.
  - Es gibt genau einen klar dominanten Primaer-CTA oberhalb des Folds.
  - Hero-Video/Produktvisual sichtbar ohne Scroll.
  - Keine CTA-Kollision zwischen Navbar und Hero.
- Screenshots:
  - `home-desktop-full`
  - `home-desktop-hero`

### `P1-M02` Hero Hierarchy Mobile

- Viewport: `390x844`
- Ziel: Mobile Hero bleibt fokussiert.
- Assertions:
  - Mobile-Menuebutton sichtbar.
  - Hero-H1 nicht abgeschnitten.
  - Primaer-CTA voll sichtbar.
  - Produktvisual oder Proof-Element erscheint spaetestens nach kleinem Scroll.
  - Keine 3-zeiligen Buttons im Hero.

### `P1-M03` Navbar Mobile Drawer

- Viewport: `390x844`
- Ziel: Mobile Navigation bleibt nutzbar.
- Assertions:
  - Menue oeffnet.
  - Links sind anklickbar.
  - Login- und Signup-CTA sichtbar.
  - Drawer schliesst nach Klick auf einen Link.

## Route `/app/startseite`

Codebasis:

- [app/app/startseite/StartseiteUI.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/startseite/StartseiteUI.tsx)

Wichtige Selektoren:

- `home-hero`
- `home-stats`
- `home-shortcuts`
- `home-tip`

### `P0-D01` Dashboard Above-the-Fold Desktop

- Viewport: `1440x900`
- Ziel: oberer Bereich bleibt scanbar.
- Assertions:
  - `home-hero` sichtbar.
  - Header-Aktionen fuer Follow-ups, Auto-Senden, Aktualisieren sichtbar.
  - Kein CTA-Wrapping in unlesbare Zeilen.
  - Quickstart-Block beginnt ohne visuellen Bruch direkt unter dem Header.
  - KPI-Zone `home-stats` erscheint ohne uebermaessigen Scroll.
- Screenshots:
  - `dashboard-desktop-top`
  - `dashboard-desktop-top-with-stats`

### `P0-D02` Dashboard Above-the-Fold Mobile

- Viewport: `390x844`
- Ziel: Mobile Startseite bleibt priorisiert.
- Assertions:
  - `home-hero` sichtbar.
  - Header-Aktionen umbrechen sauber.
  - Trial-/Quickstart-Content schiebt den Hauptnutzen nicht sofort zu weit nach unten.
  - Kein horizontaler Scroll durch Action-Buttons oder KPI-Cards.

### `P1-D03` Dashboard Systemstatus Blocks

- Viewport: `1280x800`
- Ziel: Lernkurve, Versandgesundheit und Deliverability sind visuell stabil.
- Assertions:
  - Alle drei Statuskarten sichtbar.
  - Kartenhoehen sind nicht chaotisch unterschiedlich.
  - Lange Texte brechen sauber um.
  - Badges fuer Status bleiben lesbar.

### `P1-D04` Dashboard CTA Sanity

- Viewport: `1280x800`
- Ziel: primäre naechste Aktion ist klar.
- Assertions:
  - Im Quickstart-Block existiert genau eine dominante Primäraktion.
  - Sekundaere Aktionen wie `Zur Freigabe oeffnen` und `Nachrichten oeffnen` sind sichtbar, aber visuell klar zweitrangig.
  - Keine konkurrierenden dunklen Primaerbuttons im gleichen Modul ohne Rangordnung.

### `P2-D05` Empty State Dashboard

- Setup: `user_empty`
- Viewports: `390x844`, `1280x800`
- Ziel: leere Accounts wirken nicht kaputt.
- Assertions:
  - Keine kaputten KPI-Werte.
  - Leere Bereiche bleiben lesbar.
  - Mindestens eine sinnvolle naechste Aktion sichtbar.

## Route `/app/nachrichten`

Codebasis:

- [app/app/nachrichten/NachrichtenPageClient.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/nachrichten/NachrichtenPageClient.tsx)
- [app/app/nachrichten/components/InboxView.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/nachrichten/components/InboxView.tsx)
- [app/app/nachrichten/components/InboxItem.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/nachrichten/components/InboxItem.tsx)

Wichtige Selektoren:

- `messages-page`
- `messages-header`
- `messages-filters`
- `messages-search-input`
- `messages-filter-category`
- `messages-filter-priority`
- `messages-filter-escalated`
- `messages-sort`
- `messages-inbox`
- `messages-list`
- `messages-empty`
- `messages-scroll`
- `conversation-card`
- `conversation-open`
- `conversation-escalate`
- `conversation-deescalate`

### `P0-N01` Messages Header Desktop

- Viewport: `1440x900`
- Ziel: Toolbar bleibt bedienbar und nicht ueberladen.
- Assertions:
  - `messages-header` sichtbar.
  - Suche, Kategorie, Prioritaet, Eskalationsfilter sichtbar.
  - `E-Mails` und `Zuruecksetzen` nicht abgeschnitten.
  - Sortierung sichtbar.
  - Header bleibt beim Scrollen sticky.
- Screenshots:
  - `messages-desktop-header`

### `P0-N02` Messages Header Mobile

- Viewport: `390x844`
- Ziel: Mobile Filter bleiben tappable.
- Assertions:
  - Mobile-Suche sichtbar.
  - Eskalationsfilter und Reset in voller Breite sichtbar.
  - Keine ueberlappende Toolbar mit dem globalen Mobile-Header.

### `P0-N03` Search and Filter Flow

- Viewports: `390x844`, `1280x800`
- Ziel: Kernfilter funktionieren visuell und logisch.
- Schritte:
  - Suche nach einem bekannten Lead-Namen.
  - Pruefe, dass Ergebnisliste schrumpft.
  - Setze Prioritaet auf `Hoch`.
  - Aktiviere `Nur eskalierte`.
  - Reset ausfuehren.
- Assertions:
  - Result-Count aendert sich plausibel.
  - Reset setzt alle Filter zurueck.
  - Empty State erscheint nur dann, wenn wirklich keine Treffer da sind.

### `P0-N04` List Item Scanability

- Viewport: `1280x800`
- Ziel: eine Kartenzeile bleibt schnell lesbar.
- Assertions:
  - `conversation-card` sichtbar.
  - Name, letzte Nachricht, Kategorie, Prioritaet und Nachrichtenzahl sichtbar.
  - CTA `Antworten` sichtbar.
  - Bei eskalierten Eintraegen erscheint `conversation-escalated-badge`.
  - Badge-Wolken brechen nicht unkontrolliert um.

### `P1-N05` Selection Toolbar

- Viewport: `1280x800`
- Ziel: Multi-Select verursacht keinen UI-Bruch.
- Schritte:
  - Zwei Leads auswaehlen.
  - Bulk-Toolbar beobachten.
  - Auswahl loeschen.
- Assertions:
  - Toolbar erscheint oberhalb der Liste.
  - Buttons bleiben klickbar.
  - Toolbar ueberlappt erste Karte nicht.
  - Nach `Auswahl loeschen` verschwindet Toolbar sauber.

### `P1-N06` Empty State

- Setup: Filterkombination ohne Treffer
- Viewports: `390x844`, `1280x800`
- Ziel: leerer Zustand wirkt geplant.
- Assertions:
  - `messages-empty` sichtbar.
  - Nutzer bekommt klaren Grund fuer den leeren Zustand.
  - Kein defekter Scrollcontainer.

## Route `/app/nachrichten/[id]`

Codebasis:

- [app/app/nachrichten/[id]/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/nachrichten/[id]/page.tsx)
- [app/app/nachrichten/[id]/LeadChatWrapper.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/nachrichten/[id]/LeadChatWrapper.tsx)
- [app/app/nachrichten/components/LeadChatView.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/nachrichten/components/LeadChatView.tsx)

Wichtige Selektoren:

- `conversation-panel`
- `conversation-header`
- `copy-email`
- `lead-profile-button`
- `export-button`
- `escalate-button`
- `conversation-messages`
- `attachments`
- `composer`
- `quick-templates`
- `quality-hint`
- `attachments-action`
- `attachments-button`
- `composer-textarea`
- `send-button`
- `lead-copilot-card`
- `profile-drawer`
- `profile-key-info`
- `profile-documents`

### `P0-C01` Conversation Header Desktop

- Viewport: `1440x900`
- Ziel: Lead-Kontext und Hauptaktionen sind sofort verfuegbar.
- Assertions:
  - `conversation-header` sichtbar.
  - Name, Anfrage-Typ, Prioritaet, Brand-Badge sichtbar.
  - `E-Mail kopieren`, `Profil`, `Export`, `Eskalieren` sichtbar.
  - Kein CTA-Wrapping in unkontrollierte Doppelzeilen.
- Screenshots:
  - `conversation-desktop-header`

### `P0-C02` Conversation Header Mobile

- Viewport: `375x812`
- Ziel: Header bleibt auf sehr kleiner Breite nutzbar.
- Assertions:
  - Lead-Name nicht vollstaendig abgeschnitten.
  - Buttons umbrechen sauber.
  - Prioritaets- und Typ-Badges zerstoeren den Header nicht.

### `P0-C03` Message Thread Integrity

- Viewports: `390x844`, `1280x800`
- Ziel: Thread liest sich eindeutig.
- Assertions:
  - `conversation-messages` sichtbar.
  - Eingehende, ausgehende und System-Nachrichten sind visuell unterscheidbar.
  - Datumstrenner sichtbar.
  - Pending-Approval-Drafts zeigen `Zur Freigabe` und `Warum Freigabe?`.
  - Kein Bubble-Overflow bei langen Nachrichten, URLs oder PDFs.

### `P0-C04` Composer Baseline

- Viewports: `390x844`, `1280x800`
- Ziel: Antworten schreiben bleibt robust.
- Schritte:
  - Text in `composer-textarea` eingeben.
  - `Shift+Enter` simulieren.
  - `Enter` simulieren nur in bewusstem Test-Setup.
  - Quick Template auswaehlen.
- Assertions:
  - Composer bleibt sichtbar.
  - Textarea vergroessert sich nicht kaputt.
  - Send-Button wird bei leerem Input disabled angezeigt.
  - Quick Template fuegt Text ein.

### `P1-C05` Profile Drawer

- Viewport: `1280x800`
- Ziel: Kontextdrawer funktioniert als Sekundaerflaeche.
- Schritte:
  - Auf `lead-profile-button` klicken.
  - Drawer schliessen.
- Assertions:
  - `profile-drawer` sichtbar.
  - `profile-key-info` sichtbar.
  - `profile-documents` sichtbar.
  - Backdrop oder Schliessen-Button schliesst den Drawer sauber.

### `P1-C06` Lead Copilot Card

- Viewport: `1440x900`
- Ziel: rechte Spalte bleibt lesbar und sticky.
- Assertions:
  - `lead-copilot-card` sichtbar.
  - Scrollt der Thread, bleibt die Karte auf Desktop sticky.
  - Follow-up-Status sichtbar.
  - Property-Matching-Modul sichtbar.
  - Keine abgeschnittenen Buttons wie `Zuordnen`, `Aendern`, `Entfernen`.

### `P1-C07` Property Assignment Modal

- Setup: `lead_property_unassigned`
- Viewport: `1280x800`
- Ziel: Immobilienzuordnung ist bedienbar.
- Schritte:
  - Button `Zuordnen` klicken.
  - Sucheingabe befuellen.
  - Suchergebnisliste pruefen.
  - Modal schliessen.
- Assertions:
  - Modal oeffnet.
  - Suchfeld sichtbar.
  - Ergebnisliste scrollbar.
  - Kein Layout-Bruch im Modal.

### `P1-C08` Attachment Flow

- Setup: `lead_with_attachments`
- Viewports: `390x844`, `1280x800`
- Ziel: Attachment-UI bleibt stabil.
- Schritte:
  - Datei ueber `attachments-button` waehlen.
  - Vorschau pruefen.
  - Datei entfernen.
- Assertions:
  - Attachment-Chip erscheint.
  - Vorschau oeffnet.
  - Entfernen funktioniert ohne visuelle Artefakte.

### `P2-C09` Feedback Block

- Setup: Lead mit mindestens einer gesendeten Nachricht
- Viewport: `1280x800`
- Ziel: Qualitätsfeedback ist klickbar und stabil.
- Assertions:
  - Buttons `Hilfreich`, `Zu lang`, `Falscher Fokus`, `Fehlende Infos` sichtbar.
  - Selektierter Zustand ist visuell eindeutig.
  - Fehlermeldungen brechen das Layout nicht.

## Route `/app/zur-freigabe`

Codebasis:

- [app/app/zur-freigabe/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/zur-freigabe/page.tsx)
- [app/app/zur-freigabe/ZurFreigabeUI.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/zur-freigabe/ZurFreigabeUI.tsx)

Wichtige Selektoren:

- `approval-page`
- `approval-header`
- `approval-search`
- `approval-bulk-actions`
- `approval-list`
- `approval-card`
- `approval-attachments`
- `approval-editor`
- `approval-editor-send`
- `approval-editor-cancel`
- `approval-card-actions`
- `approval-send`
- `approval-edit`
- `approval-reject`
- `approval-empty`

### `P0-A01` Approval Inbox Desktop

- Viewport: `1440x900`
- Ziel: Freigabe-Inbox ist triage-faehig.
- Assertions:
  - `approval-header` sichtbar.
  - Offen-Count sichtbar.
  - Sortierung und Suche sichtbar.
  - Bulk-Bar sichtbar.
  - `approval-list` mit mindestens einer `approval-card`.
- Screenshots:
  - `approval-desktop-top`
  - `approval-desktop-list`

### `P0-A02` Approval Inbox Mobile

- Viewport: `390x844`
- Ziel: Mobile Freigaben sind noch bedienbar.
- Assertions:
  - Header sichtbar.
  - Suche und Sortierung stapeln sauber.
  - Bulk-Aktionen laufen nicht aus dem Screen.
  - Kartenaktionen bleiben tappable.

### `P0-A03` Approval Card Baseline

- Viewport: `1280x800`
- Ziel: einzelne Freigabekarte ist klar strukturiert.
- Assertions:
  - Absender, Lead-Name, Zeit, Status, Qualitaets-Score sichtbar.
  - Block `Warum Freigabe?` sichtbar.
  - Empfehlung sichtbar.
  - `Freigeben`, `Bearbeiten`, `Ablehnen` sichtbar.

### `P0-A04` Approval Edit Flow

- Setup: `lead_pending_approval`
- Viewport: `1280x800`
- Schritte:
  - `approval-edit` klicken.
  - `approval-editor` erscheint.
  - Text aendern.
  - `approval-editor-cancel` klicken.
  - Editor erneut oeffnen.
- Assertions:
  - Original- und Bearbeitet-Spalte sichtbar.
  - Diff sichtbar.
  - Bei fehlendem Entscheidungsgrund wird der Hinweis angezeigt.
  - Cancel schliesst den Editor sauber.

### `P0-A05` Approval Decision Validation

- Setup: `lead_pending_approval`
- Viewport: `1280x800`
- Ziel: Pflichtfelder und Validierung greifen.
- Schritte:
  - Versuche `Speichern & Freigeben` ohne Grund.
  - Versuche `Ablehnen` ohne Grund.
- Assertions:
  - Validierungsfehler sichtbar.
  - Keine stillen Fehlversuche.
  - Karte bleibt im kontrollierten Zustand.

### `P1-A06` Attachment Preview

- Setup: Freigabe mit Attachments
- Viewport: `1280x800`
- Schritte:
  - `approval-attachments` klicken.
- Assertions:
  - Attachment-Liste oeffnet.
  - `Vorschau` Link sichtbar oder sauberer Fallbacktext.
  - Kein Karten-Overflow.

### `P1-A07` Bulk Selection Flow

- Setup: mindestens 3 freigabefaehige Nachrichten
- Viewports: `390x844`, `1280x800`
- Schritte:
  - `Alle auswaehlen`
  - `Auswahl loeschen`
  - `Sichere Faelle markieren`
- Assertions:
  - Selected Count aktualisiert sich.
  - Bulk-Buttons aktivieren/deaktivieren korrekt.
  - Keine Action wird versehentlich ohne Selektionszustand enabled.

### `P1-A08` Bulk Reject Validation

- Setup: mindestens 2 Nachrichten selektiert
- Viewport: `1280x800`
- Ziel: Pflichtgrund im Bulk-Fall wird hart validiert.
- Schritte:
  - Ohne `Bulk-Grund` auf `Bulk: Ablehnen`.
  - Danach mit Grund erneut.
- Assertions:
  - Ohne Grund kein destructive submit.
  - Mit Grund startet der Bulk-Fall korrekt.

### `P2-A09` Approval Empty State

- Setup: `user_empty`
- Viewports: `390x844`, `1280x800`
- Ziel: leere Freigabe-Inbox fuehlt sich gesund an.
- Assertions:
  - `approval-empty` sichtbar.
  - Copy ist klar.
  - Kein kaputter Bulk-Bar-State.

## Visuelle Regressions-Screenshots

Diese Screenshots sollten pro Run gespeichert werden:

- `home-desktop-hero`
- `home-mobile-hero`
- `dashboard-desktop-top`
- `dashboard-mobile-top`
- `messages-desktop-header`
- `messages-desktop-list`
- `messages-mobile-header`
- `conversation-desktop-header`
- `conversation-desktop-thread`
- `conversation-mobile-thread`
- `approval-desktop-top`
- `approval-desktop-card`
- `approval-mobile-list`

## Empfohlene Reihenfolge fuer die Implementierung

1. `P0-G01` bis `P0-G03`
2. `P0-D01` bis `P0-D02`
3. `P0-N01` bis `P0-N04`
4. `P0-C01` bis `P0-C04`
5. `P0-A01` bis `P0-A05`
6. Danach alle `P1`
7. `P2` erst nach dem UI-Refactor

## Wichtige Luecken vor dem Start

- Fuer die Startseite fehlen feinere `data-tour`-Hooks innerhalb einzelner Karten.
- Fuer den Property-Assignment-Modal im Lead-Detail gibt es noch keine dedizierten Test-IDs.
- Fuer einige Header-Aktionen werden aktuell eher Texte als stabile semantische Selektoren gebraucht.

## Sofort empfohlene Zusatz-Selectors

Diese Hooks wuerden die Tests deutlich stabiler machen:

- `dashboard-quickstart`
- `dashboard-system-health`
- `dashboard-automation-control`
- `messages-counts`
- `conversation-property-card`
- `conversation-property-modal`
- `conversation-followups-card`
- `approval-triage-stats`
- `approval-reason-block`

## Empfehlung

Wenn ihr nur die erste Welle bauen wollt, reicht dieses `erste MVP-Bundle`:

- globale App-Chrome Tests
- Dashboard top area
- Messages header + list
- Conversation header + composer
- Approval inbox + edit flow

Das ist klein genug fuer schnellen Nutzen und gross genug, um das Redesign sauber abzusichern.
