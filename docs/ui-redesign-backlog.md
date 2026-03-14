# UI Redesign Backlog

Ziel: Das komplette UI-Redesign in kleine, sequenziell abarbeitbare Tasks zerlegen, ohne Kontextverlust und ohne zu viele parallele Baustellen.

## Re-Audit 2026-03-12

Der alte Phasenplan bleibt als Historie wertvoll, ist aber nicht mehr die richtige Priorisierung fuer die naechsten Schritte.

Die aktuelle, strengere Neubewertung liegt in [strict-reaudit-2026-03-12.md](./strict-reaudit-2026-03-12.md).

### Neue Prioritaet

1. User-facing Defekte und Asset-/Manifest-Fehler beseitigen
2. Mobile Website-Folds fuer `/` und `/produkt` neu bauen
3. Mobile App-Folds fuer Dashboard, Nachrichten, Konversation und Freigabe entlasten
4. Erst danach weitere inhaltliche oder Growth-orientierte Ausbauten

### Naechste empfohlene Tasks

- `R0-01` `[done]` Manifest richtig anbinden
- `R0-02` `[done]` Wortmarke reparieren
- `R0-03` `[done]` Marketing-Overlays mobil entkoppeln
- `R0-04` `[done]` Homepage mobile Hero neu auf Fold bauen
- `R0-05` `[done]` Produktseite mobile Hero neu balancieren
- `R0-06` `[done]` Dashboard-Mobile-Fold halbieren
- `R0-07` `[done]` Freigabe-Mobile-Fold radikal entlasten
- `R0-08` `[done]` Konversation-Mobile-Fold auf echte Arbeit trimmen

## Arbeitsmodus

- Dieses Dokument ist die `single source of truth` fuer den Redesign-Fortschritt.
- Es gibt immer nur `1 Task` mit Status `doing`.
- Ein Task darf nur `1 Surface` oder `1 wiederverwendbares UI-System` veraendern.
- Der naechste Task startet erst, wenn der vorherige Task sein `DoD` erreicht hat.
- Nach jedem Task werden Code, Screenshots und relevante Playwright-Runs validiert.

## Status

- `todo`: noch nicht gestartet
- `doing`: aktuell aktiv
- `blocked`: abhaengig von Daten, User-Zugang oder Produktentscheidung
- `done`: umgesetzt und verifiziert

## Wichtige Vorbedingung

Fuer `/app/nachrichten`, `/app/nachrichten/[id]` und `/app/zur-freigabe` brauchen wir fuer den echten Redesign-Audit idealerweise einen `paid_active` oder `trial_active` Test-User. Mit dem aktuell verifizierten User sehen wir auf diesen Routen realistisch den `Billing Gate`-State aus [proxy.ts](../proxy.ts). Dieser Gate-State ist produktkorrekt und muss ebenfalls getestet werden, ersetzt aber keinen Voll-Audit der eigentlichen Arbeitsflaechen.

## Standard-Verifikation

- Marketing/App-Regressionslauf: `npm run playwright:ui:auth`
- Nur App-Specs: `npm run playwright:ui:auth -- tests/playwright/app-*.spec.ts`
- Auth-Storage erneuern: `npm run playwright:auth`
- Lead neu aufloesen: `npm run playwright:lead`

## Route-, Journey- und Metrik-Matrix

Journey-Definitionen und Wave-Zuordnung stehen in [ui-journeys.md](./ui-journeys.md).
Metrikdefinitionen und Messregeln stehen in [ui-metrics.md](./ui-metrics.md).

| Route | Primaere Journey | Primaere Metrik | Bemerkung |
| --- | --- | --- | --- |
| `/` | Erstbesucher versteht Produkt | `cta-click-through` | Fokus auf Hero, Proof, CTA-Hierarchie |
| `/produkt` | Erstbesucher versteht Produkt | `cta-click-through` | Fokus auf Produktverstaendnis und Vertrauen |
| `/app/startseite` | Makler erkennt Systemstatus in 5 Sekunden | `time-to-first-action` | Above-the-fold und Priorisierung |
| `/app/nachrichten` | Makler bearbeitet Nachrichten in 2 Klicks | `filter-use-rate` | Suche, Filter, Listendichte |
| `/app/nachrichten/[id]` | Makler bearbeitet Nachrichten in 2 Klicks | `time-to-first-action` | Thread, Kontext, Antwortaktion |
| `/app/zur-freigabe` | Makler startet sicher | `approval-open-rate` | Priorisierung, Review-Reihenfolge |
| Settings-/Konto-Flaechen | Makler startet sicher | `settings-toggle-success` | Wird in Phase 6/7 standardisiert |

## Sequenz

1. Phase 0: Audit, Journeys, Metriken, Content-Inventar
2. Phase 1: Design-System und UI-Primitives
3. Phase 3: App-Chrome und Sidebar
4. Phase 4: Startseite
5. Phase 5: Nachrichtenliste
6. Phase 6: Konversationsdetail und Freigabe
7. Phase 2: Marketing-Hero und Homepage-Kuerzung
8. Phase 6: Settings/Konto vereinheitlichen
9. Phase 7: Mobile, A11y, Motion, Skeletons, Instrumentierung

## Before Board (Phase 0 Zielbild)

Fuer jede Route werden `Desktop` und `Mobile` Screenshots gespeichert und jeweils `3 Probleme` markiert:

- `S1`: blockiert Verstaendnis, Nutzung oder Conversion
- `S2`: stoert Scanbarkeit, Geschwindigkeit oder Konsistenz
- `S3`: sichtbarer Qualitaets- oder Polishing-Mangel

### Audit-Screens

- `/` -> Desktop + Mobile
- `/produkt` -> Desktop + Mobile
- `/app/startseite` -> Desktop + Mobile
- `/app/nachrichten` -> Desktop + Mobile
- `/app/nachrichten/[id]` -> Desktop + Mobile
- `/app/zur-freigabe` -> Desktop + Mobile

### Audit-Hinweis

- Fuer die drei gated App-Routen wird der Audit in `2 Varianten` gefuehrt:
  - `Gate-State` mit aktuellem expired-trial User
  - `Working-State` mit paid/trial-active User, sobald verfuegbar

## Backlog

### Phase 0

- `T00` `[done]` UI-Audit formalisieren
  - Ziel: Before-Board fuer `/`, `/produkt`, `/app/startseite`, `/app/nachrichten`, `/app/nachrichten/[id]`, `/app/zur-freigabe` erstellen.
  - Scope: Desktop- und Mobile-Screenshots, je Screen 3 Probleme mit `S1/S2/S3`, klare Priorisierung.
  - Nicht im Scope: visuelle Aenderungen am Produkt.
  - Dateien: `docs/ui-redesign-backlog.md`, `docs/playwright-mcp-ui-matrix.md`, [ui-before-board-2026-03-10.md](./ui-before-board-2026-03-10.md), `docs/ui-audit/2026-03-10/*`.
  - DoD: ein vollstaendiges Before-Board mit Priorisierung und Gate-/Working-State-Unterscheidung.
  - Verifikation: Screenshots vorhanden, Problemfelder pro Route dokumentiert.

- `T00A` `[blocked]` Working-State-Audit fuer gated Kernrouten nachziehen
  - Ziel: `/app/nachrichten`, `/app/nachrichten/[id]` und `/app/zur-freigabe` mit `paid_active` oder `trial_active` User als echte Arbeitsflaechen auditieren.
  - Scope: zusaetzliche Desktop-/Mobile-Screens fuer die 3 Routen im `Working-State`.
  - Dateien: [ui-before-board-2026-03-10.md](./ui-before-board-2026-03-10.md) plus neue Audit-Screens.
  - Blocker: aktuell kein geeigneter aktiver Test-User im Audit-Workflow.
  - DoD: Working-State und Gate-State fuer alle drei Routen gegenuebergestellt.
  - Verifikation: Screenshots und Findings fuer beide States vorhanden.

- `T01` `[done]` Kern-Journeys definieren
  - Ziel: die 4 Kern-Journeys verbindlich an die Kernrouten koppeln.
  - Scope: “Erstbesucher versteht Produkt”, “Makler startet sicher”, “Makler bearbeitet Nachrichten in 2 Klicks”, “Makler erkennt Systemstatus in 5 Sekunden”.
  - Dateien: `docs/ui-redesign-backlog.md`, [ui-journeys.md](./ui-journeys.md).
  - DoD: jede Kernroute ist genau einer Journey zugeordnet.
  - Verifikation: Route-/Journey-Matrix final, Billing-Gate-Vererbung dokumentiert, Wave-Zuordnung je Journey festgehalten.

- `T02` `[done]` UI-Metriken festlegen
  - Ziel: pro Hauptflaeche eine primaere Erfolgsmetrik festlegen.
  - Scope: `time-to-first-action`, `filter-use-rate`, `approval-open-rate`, `settings-toggle-success`, `cta-click-through`.
  - Dateien: `docs/ui-redesign-backlog.md`, [ui-metrics.md](./ui-metrics.md).
  - DoD: jede Kernroute hat genau eine primaere UI-Metrik.
  - Verifikation: Metrik-Matrix final, Messformeln und Gate-State-Regeln dokumentiert.

- `T03` `[done]` Content-Hierarchie inventarisieren
  - Ziel: alle Headlines, Badges, Hilfetexte und CTA-Texte aus Startseite und Nachrichten exportieren.
  - Scope: nur Content-Bestand, noch kein Rewrite.
  - Dateien: [ui-content-inventory-2026-03-10.md](./ui-content-inventory-2026-03-10.md).
  - DoD: Dubletten, konkurrierende Botschaften und zu viele gleichgewichtete Claims sind markiert.
  - Verifikation: Inventar für Startseite, Inbox und Konversationsansicht vollständig, Problemfelder markiert.

### Phase 1

- `T10` `[done]` Design-Tokens in echtes App-System ueberfuehren
  - Ziel: `color`, `surface`, `border`, `radius`, `shadow`, `focus`, `status` aus [styles/globals.css](../styles/globals.css) systematisieren.
  - Scope: Token-Layer, keine grossen Surface-Redesigns.
  - Dateien: `styles/globals.css`, evtl. neue Token-Helfer.
  - DoD: keine ad-hoc-Farben wie `bg-[#f7f7f8]` in Kernflaechen mehr als neue Defaults.
  - Verifikation: App-Tokenklassen in `globals.css` eingefuehrt, Kernflaechen auf Shell-/Surface-/Field-Tokens umgestellt, `7/7` relevante Playwright-App-Specs gruen.

- `T11` `[done]` UI-Primitive-Layer definieren
  - Ziel: `PageHeader`, `SectionCard`, `StatCard`, `StatusBadge`, `EmptyState`, `PrimaryActionBar`, `FilterBar`, `ListRow` anlegen.
  - Scope: wiederverwendbare Basis-Komponenten.
  - Dateien: neuer [components/app-ui](../components/app-ui) Layer plus Umstellungen in Startseite und Nachrichten.
  - DoD: Startseite und Nachrichten koennen auf denselben Primitives aufbauen.
  - Verifikation: Primitive-Layer angelegt, in Dashboard und Nachrichten genutzt, `4/4` relevante Playwright-Specs gruen.

- `T12` `[done]` Statusfarben vereinheitlichen
  - Ziel: `success`, `warning`, `danger`, `neutral`, `brand` konsistent machen.
  - Scope: Trial, Freigabe, Eskalation, Done, Archiv, Health-Status.
  - Dateien: Token-Layer, Badges, Alerts, relevante Kernflaechen.
  - DoD: identische Border-/BG-/Text-Paare je Statusfamilie.
  - Verifikation: Statusdarstellungen in Startseite, Nachrichten, Sidebar und Konversation auf gemeinsame Ton-Helfer umgestellt, `7/7` relevante App-Specs gruen.

- `T13` `[done]` Button-System konsolidieren
  - Ziel: Primaer, Sekundaer, Tertiaer, Utility, Destructive vereinheitlichen.
  - Scope: Hoehe, Radius, Fokus, Disabled, Hover.
  - Dateien: `components/ui/button*`, direkte Button-Nutzung in Kernscreens.
  - DoD: kein roter Logout-Button mehr als Fremdkoerper.
  - Verifikation: gemeinsamer Button-Layer in `components/app-ui`, `components/ui/button.tsx` daran angekoppelt, Kernbuttons in Sidebar, Startseite, Nachrichten, Inbox und Konversation umgestellt, `10/10` relevante App-Specs gruen.

- `T14` `[done]` Typografie-Hierarchie schaerfen
  - Ziel: Rollen fuer `display`, `page title`, `section title`, `meta label`, `helper`, `badge text`.
  - Scope: Textstufen und Lesefluss.
  - Dateien: globale Styles, Kernscreens.
  - DoD: kleine Infotexte wirken nicht mehr wie Rauschen.
  - Verifikation: globale Typorollen in `globals.css`, Primitive-Layer daran angebunden, Kernrollen in Sidebar, Startseite, Nachrichten und Konversation umgestellt, `7/7` relevante App-Specs gruen.

- `T15` `[done]` Spacing-System festziehen
  - Ziel: Raster `4/8/12/16/24/32` verbindlich machen.
  - Scope: Card-Inset, Header-Abstand, Filter-Bar, Modulabstaende.
  - Dateien: globale Styles, Kernscreens.
  - DoD: Screens wirken ruhiger und absichtlich.
  - Verifikation: gemeinsame Spacing-Rollen fuer Page-Sections und Panel-Insets in `globals.css`, Primitive-Layer und Kernflaechen auf `app-panel-padding` / `app-panel-padding-compact` / `app-page-section` umgestellt, `10/10` relevante App-Specs gruen.

- `T16` `[done]` Icon-Sprache vereinheitlichen
  - Ziel: Emoji-Navigation in [Sidebar.tsx](../components/Sidebar.tsx) auf Lucide umstellen.
  - Scope: Navigation und wichtige Utility-Aktionen.
  - DoD: keine gemischte Emoji-/Icon-Sprache mehr.
  - Verifikation: Sidebar-Navigation auf Lucide-Icons umgestellt, keine Emoji-Reste mehr in Sidebar oder mobilem App-Chrome, `10/10` relevante App-Specs grün.

- `T17` `[done]` Focus- und Keyboard-States sichtbar machen
  - Ziel: klare Tastatur-Nutzbarkeit fuer alle interaktiven Elemente.
  - Scope: Links, Buttons, Inputs, Drawer, Filter, Nav.
  - Dateien: globale Fokus-Styles plus problematische Einzelkomponenten.
  - DoD: jede wichtige Interaktion ist per Keyboard sichtbar und steuerbar.
  - Verifikation: gemeinsamer Fokus-Layer in `globals.css`, App-Buttons sowie `input` / `select` / `textarea` / `switch` daran angebunden, Sidebar und mobiles App-Chrome auf explizite Fokuszustände umgestellt, zusätzliche Keyboard-Smokes in Playwright ergänzt, `12/12` relevante App-Specs grün.

### Phase 2

- `T20` `[done]` Marketing-Navigation entschlacken
  - Ziel: 8 Nav-Punkte auf 5-6 reduzieren, Trust/Einwaende/FAQ sekundar gruppieren.
  - Dateien: [Navbar.tsx](../components/marketing/Navbar.tsx), [public-home.spec.ts](../tests/playwright/public-home.spec.ts).
  - DoD: Header priorisiert Conversion statt Vollstaendigkeit.
  - Verifikation: In [Navbar.tsx](../components/marketing/Navbar.tsx) die Primärnavigation auf `Produkt`, `Branchen`, `So funktioniert's`, `Sicherheit`, `Preise` reduziert und `Einwände`, `Trust`, `FAQ` in einen sekundären `Mehr`-Bereich verschoben; mobilen Drawer entsprechend in Primär-/Sekundärlinks gegliedert; Public-Smokes in [public-home.spec.ts](../tests/playwright/public-home.spec.ts) auf Desktop-Secondary-Menü und Mobile-Secondary-Bereich erweitert; `npx tsc --noEmit` sowie `2/2` Public-Home-Specs grün.

- `T21` `[done]` Hero fokussieren
  - Ziel: eine Hauptaussage, ein primaerer CTA, ein sekundaerer Proof-CTA, max. 3 Trust-Punkte.
  - Dateien: [Hero.tsx](../components/marketing/Hero.tsx), [TrackedLink.tsx](../components/marketing/TrackedLink.tsx), [public-home.spec.ts](../tests/playwright/public-home.spec.ts).
  - DoD: Hero ist in 5 Sekunden erfassbar.
  - Verifikation: In [Hero.tsx](../components/marketing/Hero.tsx) die Hero-Botschaft auf eine klarere Hauptzeile verdichtet, die alte Link- und Checklist-Überladung entfernt, einen expliziten Proof-CTA auf den Produkt-Ablauf eingeführt und die Trust-Signale auf drei klare Punkte begrenzt; die Produktvorschau auf der rechten Seite zusätzlich mit einem sichtbaren `Eingang → Entscheidung → Versand`-Proof-Rahmen versehen; [TrackedLink.tsx](../components/marketing/TrackedLink.tsx) reicht dafür nun auch `data-tour`-Attribute durch; `npx tsc --noEmit` sowie `2/2` Public-Home-Specs grün.

- `T22` `[done]` Homepage-Laenge reduzieren
  - Ziel: Startseite auf `Hero -> Proof -> Ablauf -> Guardrails -> ROI -> Pricing -> FAQ` verdichten.
  - Dateien: [app/page.tsx](../app/page.tsx).
  - DoD: SEO-/Vergleichscontent wandert auf tiefere Seiten.
  - Verifikation: In [app/page.tsx](../app/page.tsx) die Homepage von einer langen Blocksammlung auf die Kernreihenfolge `Hero -> Proof -> Ablauf -> Guardrails -> ROI -> Pricing -> FAQ -> Final CTA` reduziert; Nebenpfade wie Vergleichs-, Einwand-, Zusatz-Trust- und Discovery-Blöcke bewusst von `/` entfernt, damit die Landingpage klarer konvertiert; `npx tsc --noEmit` sowie `2/2` Public-Home-Specs grün.

- `T23` `[done]` Proof Block direkt nach dem Hero bauen
  - Ziel: Screenshot oder Motion mit 3 annotierten Mechaniken.
  - Dateien: [ProductVisualAuthority.tsx](../components/marketing/ProductVisualAuthority.tsx), [public-home.spec.ts](../tests/playwright/public-home.spec.ts).
  - DoD: Mechanik sichtbar, nicht nur Claim.
  - Verifikation: In [ProductVisualAuthority.tsx](../components/marketing/ProductVisualAuthority.tsx) den bisherigen Dreikarten-Block in einen stärkeren Proof-Bereich mit Leitvisual, drei annotierten Mechaniken und separater `Was das beweist`-Spalte umgebaut; Public-Smokes in [public-home.spec.ts](../tests/playwright/public-home.spec.ts) prüfen jetzt den Proof-Block explizit auf Sichtbarkeit und `3` Mechanik-Karten; `npx tsc --noEmit` sowie `2/2` Public-Home-Specs grün.

- `T24` `[done]` CTA-Hierarchie vereinheitlichen
  - Ziel: gleicher primaerer CTA-Text ueber alle Marketing-Sektionen.
  - DoD: gleiche semantische Hauptaktion, keine unnötigen CTA-Varianten.
  - Verifikation: gemeinsame Primär-CTA-Copy in [cta-copy.ts](../components/marketing/cta-copy.ts) zentralisiert und auf Navbar, Hero, Pricing, Final CTA, ROI-Rechner, Mobile Conversion Bar, Produkt-Hero sowie weitere Marketing-Signup-Flächen wie CTA-Experiment, Stage-CTA, Vergleich, Simulator, Safe-Start-Konfigurator, Einwand-Artikel und Follow-up-Seite ausgerollt; [public-home.spec.ts](../tests/playwright/public-home.spec.ts) prüft die vereinheitlichte CTA-Copy in Navbar, Hero und Mobile-Drawer explizit; `npx tsc --noEmit` sowie `2/2` Public-Home-Specs grün.

- `T25` `[done]` Section-Differenzierung erhoehen
  - Ziel: klare Bloecke, wechselnde Hintergruende, weniger Karten-Gleichfoermigkeit.
  - DoD: Seite fuehlt sich gefuehrt statt endlos an.
  - Verifikation: [HowItWorks.tsx](../components/marketing/HowItWorks.tsx) als eigenständiger kühler Ablaufblock mit Startprinzip-Karte und stärker differenzierten Schrittkarten umgebaut; [Pricing.tsx](../components/marketing/Pricing.tsx) auf warmen Entscheidungsblock mit separater Entscheidungshilfe gezogen; [FAQ.tsx](../components/marketing/FAQ.tsx) von einer flachen Accordion-Liste zu einer zweispaltigen Frage-und-Klärung-Sektion mit eigenem Intro verdichtet; `npx tsc --noEmit` sowie `2/2` Public-Home-Specs grün.

- `T26` `[done]` Mobile-Marketing-Menue verbessern
  - Ziel: Full-width Drawer mit klarer CTA-Folge statt einfachem Drop-down.
  - Dateien: [Navbar.tsx](../components/marketing/Navbar.tsx).
  - DoD: mobile Conversion leidet nicht unter dem Menue.
  - Verifikation: in [Navbar.tsx](../components/marketing/Navbar.tsx) den mobilen Header von einem einfachen Aufklappblock auf einen echten Full-Height-Drawer mit Einstiegskarte, Primärnavigation, Vertiefungsbereich und klarer CTA-Sequenz umgestellt; Scroll-Lock im offenen Zustand ergänzt; [public-home.spec.ts](../tests/playwright/public-home.spec.ts) auf `marketing-nav-mobile-drawer` und `marketing-nav-mobile-primary` erweitert; `npx tsc --noEmit` sowie `2/2` Public-Home-Specs grün.

- `T27` `[done]` Trust- und Sicherheitsbloecke kuerzen
  - Ziel: mehr Scanbarkeit, weniger Fliesstext.
  - DoD: Trust ist konkret und nicht defensiv.
  - Verifikation: [TrustByDesign.tsx](../components/marketing/TrustByDesign.tsx) auf schnelle Signale, knappe Sicherheitsprinzipien, klare Auto-Stopp-Grenzen und kompaktere Doku-Zugänge verdichtet; stabile Hooks `marketing-trust-block` und `marketing-trust-limit` ergänzt und in [public-home.spec.ts](../tests/playwright/public-home.spec.ts) abgesichert; `npx tsc --noEmit` sowie `2/2` Public-Home-Specs grün.

### Phase 3

- `T30` `[done]` App-Chrome neu definieren
  - Ziel: Desktop mit stabiler Sidebar + Top-Kontextzeile, Mobile mit Screen-spezifischem Header.
  - Dateien: [ClientRootLayout.tsx](../app/ClientRootLayout.tsx), App-Layouts.
  - DoD: jede App-Seite hat einen erkennbaren Rahmen.
  - Verifikation: Route-Metadaten für Kernflächen im App-Chrome ergänzt, Desktop-Kontextzeile und mobiler Screen-Header in `ClientRootLayout.tsx` eingeführt, Playwright-Assertions für Startseite und Nachrichten erweitert, `12/12` relevante App-Specs grün.

- `T31` `[done]` Sidebar visuell an Marketing angleichen
  - Ziel: Brand-Farben, Radius, Shadow, aktive States vereinheitlichen.
  - Dateien: [Sidebar.tsx](../components/Sidebar.tsx).
  - DoD: Marketing und App wirken wie ein Produkt.
  - Verifikation: Sidebar-Hintergrund, Logo-Block, Statuskarten und aktive Link-States auf Marketing-Sprache mit Gold-Akzenten, weißem Card-Look und konsistenten Shadows umgestellt, `12/12` relevante App-Specs grün.

- `T32` `[done]` Sidebar-Informationsarchitektur umbauen
  - Ziel: `Heute`, `Kommunikation`, `System`, `Einstellungen` statt Emoji-Kontext und “Ueberblick”.
  - Dateien: [Sidebar.tsx](../components/Sidebar.tsx).
  - DoD: Navigation ist ohne Einarbeitung verstaendlich.
  - Verifikation: Sidebar-Section-Logik auf `Heute`, `Kommunikation`, `System`, `Einstellungen` umgestellt, stabile `data-tour`-Marker für die Bereiche ergänzt und in den Dashboard-Specs abgesichert, `12/12` relevante App-Specs grün.

- `T33` `[done]` Autosend-/Trial-Module zusammenfuehren
  - Ziel: kompaktes Automationsstatus-Modul statt getrennter Trial-/Toggle-Flaechen.
  - Dateien: [Sidebar.tsx](../components/Sidebar.tsx).
  - DoD: weniger visuelle Unterbrechung oben.
  - Verifikation: Toggle- und Trial-Status in ein gemeinsames `Automationsstatus`-Panel mit Versand-, Follow-up- und Planstatus zusammengeführt, Dashboard-Spec auf das neue Panel erweitert, `12/12` relevante App-Specs grün.

- `T34` `[done]` Logout in Footer-Utility verschieben
  - Ziel: destruktive Aktion aus der Primaernavigation entfernen.
  - Dateien: [Sidebar.tsx](../components/Sidebar.tsx).
  - DoD: Primärnavigation und Utility sind klar getrennt.
  - Verifikation: Sidebar auf flexbasierten Footer-Utility-Bereich umgestellt, `Logout` aus dem Kopf entfernt und im mobilen Keyboard-Smoke bis in den Footer abgesichert, `12/12` relevante App-Specs grün.

- `T35` `[done]` App-weite `PageHeader` Komponente einfuehren
  - Ziel: Titel, Untertitel, KPI/Status, 1-2 Aktionen standardisieren.
  - Dateien: UI-Primitive-Layer plus Kernscreens.
  - DoD: Startseite, Nachrichten, Freigabe und Konto fuehlen sich konsistent an.
  - Verifikation: `PageHeader` auf Freigabe, Konto-Übersicht und Abo & Zahlungen ausgerollt, Startseite/Nachrichten daran angeschlossen belassen, neuer Playwright-Smoke für Konto ergänzt, `14/14` relevante App-Specs grün.

### Phase 4

- `T40` `[done]` Startseite auf drei Zonen reduzieren
  - Ziel: `Heute wichtig`, `Systemstatus`, `Zu bearbeiten`.
  - Dateien: [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx).
  - DoD: Above-the-fold in 5 Sekunden lesbar.
  - Verifikation: Startseite in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) zu den drei Zonen `Heute wichtig`, `Systemstatus` und `Zu bearbeiten` verdichtet, Trial/KPIs/Quickstart in eine obere Entscheidungsfläche gezogen, Arbeitslisten als kompakte Queue-Karten umgesetzt, `14/14` relevante App-Specs grün.

- `T41` `[done]` Sticky-Header entschlacken
  - Ziel: nur Titel, Systemstatus und eine Primaeraktion.
  - Dateien: [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx).
  - DoD: Header bleibt nuetzlich statt dicht.
  - Verifikation: Header auf Startseite in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) auf Titel, Versand-/Deliverability-Status und eine kontextuelle Primaeraktion reduziert, operative Toggles in die Autopilot-Steuerzentrale verschoben, `14/14` relevante App-Specs grün.

- `T42` `[done]` Trial-Karte, Quickstart und Autopilot-Steuerzentrale zusammenfuehren
  - Ziel: “Was soll ich jetzt tun?” aus einem Modul beantworten.
  - DoD: kein Wettbewerb zwischen drei Onboarding-/Statusboxen.
  - Verifikation: Trial-/Planstatus, Schnellstart und Live-Steuerung in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) in den oberen Schnellstart-Block integriert, unterer Automationsbereich auf Detailrolle reduziert, `14/14` relevante App-Specs grün.

- `T43` `[done]` Quickstart-Block als Stepper bauen
  - Ziel: `Schritt`, `Status`, `Naechste Aktion`, `Erwartetes Ergebnis`.
  - DoD: Safe-Start ist ein klarer Flow.
  - Verifikation: Schnellstart in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) als 3-Schritt-Stepper mit klaren Status- und Aktionsspalten umgesetzt, Auto-Senden in Schritt 3 verankert, `14/14` relevante App-Specs grün.

- `T44` `[done]` KPI-Karten neu priorisieren
  - Ziel: maximal 4 Top-KPIs mit Trend oder Handlungskontext.
  - DoD: jede KPI beantwortet eine Management-Frage.
  - Verifikation: KPI-Zeile in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) auf vier Führungsfragen umgestellt, manuelle Aufmerksamkeit als eigene Hilfsmetrik ergänzt, alle KPI-Hinweise mit Handlungs- oder ROI-Kontext versehen, `14/14` relevante App-Specs grün.

- `T45` `[done]` Lernkurve, Versandgesundheit und Deliverability zusammenfassen
  - Ziel: ein gemeinsames `Systemstatus`-Board.
  - DoD: eine Statuszone statt drei gleichgewichteter Cards.
  - Verifikation: Systemstatus in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) auf gemeinsames Board mit Gesamtlage links und drei kompakten Signalzeilen rechts umgebaut, einzelne Statuskarten aufgelöst, `14/14` relevante App-Specs grün.

- `T46` `[done]` Autopilot-Steuerzentrale und First-Value-Sandbox vereinfachen
  - Ziel: Outcome zuerst, Details sekundar per Expand/Drawer.
  - DoD: weniger technische Ueberfrachtung.
  - Verifikation: Automationsbereich in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) auf Outcome-Karte plus aufklappbare Guardrail- und Sandbox-Details umgebaut, technische Details standardmäßig reduziert, `14/14` relevante App-Specs grün.

- `T47` `[done]` Listenbloecke differenzieren
  - Ziel: `Freigaben`, `High Priority`, `Letzte Konversationen` klar gewichten.
  - DoD: Freigaben sind dominant, Verlauf ist sekundar.
  - Verifikation: Queue-Zone in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) als Zweiteiler umgebaut, `Freigaben` als dominante Primaerkarte, `Hohe Prioritaet` als Sekundaerkarte und `Letzte Konversationen` als kompakter Verlaufsblock umgesetzt, `14/14` relevante App-Specs grün.

- `T48` `[done]` Erklaerboxen aus dem operativen Bereich verschieben
  - Ziel: “Was bedeuten die Status?” und “Sicherheit & DSGVO” nach unten oder in Hilfe-Drawer.
  - DoD: Erklaertext verdraengt operative Arbeit nicht mehr.
  - Verifikation: Die beiden Erklaerboxen in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) in einen eingeklappten Hilfe-Bereich am Seitenende ueberfuehrt, operative Kernflaechen oben entlastet, `14/14` relevante App-Specs grün.

- `T49` `[done]` Dashboard-Empty-States hochwertig machen
  - Ziel: Kontext + empfohlene Aktion + optional Lernlink.
  - DoD: leere Flaechen wirken fuehrend, nicht kaputt.
  - Verifikation: Queue-Empty-States in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) mit situativem Kontext, empfohlener Aktion und optionalem Lernlink auf `Hilfe & Regeln` erweitert, `14/14` relevante App-Specs grün.

### Phase 5

- `T50` `[done]` Nachrichten-Header auf Kernsteuerung reduzieren
  - Ziel: Suche, ein Statusfilter, ein Prioritaetsfilter, Overflow-Menue.
  - Dateien: [NachrichtenPageClient.tsx](../app/app/nachrichten/NachrichtenPageClient.tsx).
  - DoD: Toolbar passt sauber auf Desktop und Mobile.
  - Verifikation: Header in [NachrichtenPageClient.tsx](../app/app/nachrichten/NachrichtenPageClient.tsx) auf Suche, Status, Prioritaet und `Mehr` reduziert; Kategorie, Sortierung, `E-Mails` und `Zuruecksetzen` in aufklappbaren Utility-Bereich verschoben; relevante `data-tour`-Hooks und Specs in [app-messages.spec.ts](../tests/playwright/app-messages.spec.ts) angepasst; `14/14` relevante App-Specs grün.

- `T51` `[done]` Filtermodell neu designen
  - Ziel: primaere Chips fuer `Freigabe`, `Eskalation`, `Hoch`, sekundaerer Drawer fuer Kategorie/Sortierung.
  - DoD: haeufige Filter sind 1 Klick entfernt.
  - Verifikation: In [NachrichtenPageClient.tsx](../app/app/nachrichten/NachrichtenPageClient.tsx) sichtbare Quick-Filter-Chips fuer `Freigabe`, `Eskalation` und `Hoch` eingefuehrt, offene Freigaben ueber echte Approval-Lead-IDs geladen und Kategorie/Prioritaet/Sortierung in den `Mehr`-Bereich gebuendelt; Specs in [app-messages.spec.ts](../tests/playwright/app-messages.spec.ts) angepasst; `14/14` relevante App-Specs grün.

- `T52` `[done]` “E-Mails kopieren” und “Zuruecksetzen” in Utility/Overflow verschieben
  - DoD: Top-Bar fokussiert auf Navigation und Selektion.
  - Verifikation: Bereits mit `T50` in [NachrichtenPageClient.tsx](../app/app/nachrichten/NachrichtenPageClient.tsx) umgesetzt; beide Aktionen liegen im aufklappbaren Utility-Bereich statt in der primaeren Toolbar.

- `T53` `[done]` Count-Badges in kompakte Meta-Zeile umbauen
  - Ziel: `Angezeigt`, `Gesamt`, `Eskaliert` mit weniger visueller Lautstaerke.
  - DoD: gleiche Information, weniger Badge-Laerm.
  - Verifikation: In [NachrichtenPageClient.tsx](../app/app/nachrichten/NachrichtenPageClient.tsx) die Badge-Wolke auf eine ruhige Meta-Zeile unter der Header-Beschreibung reduziert, Eskalationen weiterhin direkt verlinkbar gehalten; `14/14` relevante App-Specs grün.

- `T54` `[done]` Inbox von Kartenstapel zu Listenoptik entwickeln
  - Ziel: mindestens auf Desktop deutlich hoehere Dichte und bessere Ruhe.
  - Dateien: [InboxView.tsx](../app/app/nachrichten/components/InboxView.tsx), [InboxItem.tsx](../app/app/nachrichten/components/InboxItem.tsx).
  - DoD: Informationen sind schneller scanbar.
  - Verifikation: Die Inbox auf Desktop in eine gemeinsame Listen-Surface mit ruhigen Trennern ueberfuehrt und die Einzel-Items visuell von schwebenden Karten auf flachere Zeilen reduziert; `14/14` relevante App-Specs grün.

- `T55` `[done]` `InboxItem` entflechten
  - Ziel: linker Statusindikator, Mitte Inhalt, rechts 1 Primäraktion + Overflow.
  - Dateien: [InboxItem.tsx](../app/app/nachrichten/components/InboxItem.tsx).
  - DoD: Aktion und Lesbarkeit konkurrieren nicht.
  - Verifikation: `InboxItem` auf Statusspur links, verdichteten Mittelteil und genau eine Primäraktion plus `Mehr`-Menü rechts umgebaut; Overflow-Pattern in der Nachrichten-Spec abgesichert; `14/14` relevante App-Specs grün.

- `T56` `[done]` Statusprioritaet pro Item definieren
  - Ziel: `Freigabe > Eskalation > Erledigt > Archiv`.
  - DoD: pro Zeile genau ein dominanter Status.
  - Verifikation: Dominanten Zeilenstatus in [InboxItem.tsx](../app/app/nachrichten/components/InboxItem.tsx) zentralisiert und die Priorität `Freigabe > Eskalation > Erledigt > Archiv > Aktiv` verbindlich gemacht; damit werden `done`-Fälle mit `archived_at` nicht mehr fälschlich als Archiv dargestellt; `14/14` relevante App-Specs grün.

- `T57` `[done]` Avatar/Initialen verkleinern und funktionaler machen
  - DoD: Name, letzte Nachricht, Zeit und Status tragen die Zeile.
  - Verifikation: Avatar-/Initialenfläche in [InboxItem.tsx](../app/app/nachrichten/components/InboxItem.tsx) auf Desktop und Mobile sichtbar zurückgenommen und als sekundäre Orientierung gestaltet; Name, Nachricht, Zeit und dominanter Status führen die Zeile; `14/14` relevante App-Specs grün.

- `T58` `[done]` Action-System fuer Antworten/Freigabe/Eskalation bauen
  - Ziel: Primaerbutton + Sekundaermenue.
  - DoD: Items schreien nicht mehr mit mehreren gleichstarken CTAs.
  - Verifikation: Die Primäraktion in [InboxItem.tsx](../app/app/nachrichten/components/InboxItem.tsx) kontextabhängig gemacht, sodass Freigabe-Fälle direkt mit `Zur Freigabe`, aktive Fälle mit `Antworten` und erledigte/archivierte Fälle mit `Öffnen` geführt werden; sekundäre Aktionen bleiben im `Mehr`-Menü; `14/14` relevante App-Specs grün.

- `T59` `[deferred]` Desktop-Master-Detail-Layout planen und bauen
  - Ziel: links Liste, rechts Konversation.
  - DoD: weniger Routing-Reibung, schnelleres Abarbeiten.
  - Verifikation: bewusst zurückgestellt, weil die aktuelle Einzelansicht für euren Arbeitsmodus sinnvoller wirkt und `LeadChatView` als Split-Pane aktuell zu komplex wäre.

- `T60` `[done]` Bulk-Toolbar visuell stabilisieren
  - Dateien: [InboxView.tsx](../app/app/nachrichten/components/InboxView.tsx).
  - DoD: Auswahlmodus hat klaren, nicht springenden State.
  - Verifikation: Bulk-Toolbar in [InboxView.tsx](../app/app/nachrichten/components/InboxView.tsx) als immer sichtbaren Auswahlbereich stabilisiert, inklusive ruhigem Idle-State, `Alle wählen`, klarer Zählung und `Auswahl löschen`; zusätzliche Playwright-Prüfung für Leerlauf → Auswahl → Reset ergänzt; `14/14` relevante App-Specs grün.

- `T61` `[done]` Scrollbereiche entschaerfen
  - Ziel: keine doppelten Sticky-/Scroll-Kontexte in Nachrichten.
  - DoD: Scroll-Verhalten ist eindeutig auf Desktop und Mobile.
  - Verifikation: innere Desktop-Scrollbox in [NachrichtenPageClient.tsx](../app/app/nachrichten/NachrichtenPageClient.tsx) entfernt, Bulk-Bar in [InboxView.tsx](../app/app/nachrichten/components/InboxView.tsx) aus der zweiten Sticky-Ebene genommen und die Playwright-Spec auf `kein innerer Scroll-Owner + keine sticky Bulk-Bar` erweitert; `14/14` relevante App-Specs grün.

### Phase 6

- `T70` `[done]` Konversationsdetail als Produktionsflaeche redesignen
  - Ziel: Header mit Lead-Kontext, Hauptthread, rechte Kontextspalte fuer Status/Entscheidung/Objekt.
  - Dateien: [LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx).
  - DoD: Nutzer springt nicht mehr zwischen Kontext und Antwort.
  - Verifikation: In [LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx) klare Arbeitszonen eingeführt: Lead-Kontext im Sticky-Header, eigener Thread-Kopf über der E-Mail-Fläche und verdichtete Kontext-Zusammenfassung in der rechten Spalte; Property-Modal zugleich so repositioniert, dass der Close-Button nicht mehr unter dem Sticky-Header kollidiert; `14/14` relevante App-Specs grün.

- `T71` `[done]` Freigabe-UX vereinfachen
  - Ziel: `Original`, `Vorschlag`, `Aenderungen`, `Senden/Freigeben` in klarer Reihenfolge.
  - Dateien: [ZurFreigabeUI.tsx](../app/app/zur-freigabe/ZurFreigabeUI.tsx).
  - DoD: Review dauert spuerbar kuerzer.
  - Verifikation: In [ZurFreigabeUI.tsx](../app/app/zur-freigabe/ZurFreigabeUI.tsx) jede Freigabe-Karte auf eine explizite 4-Schritt-Reihenfolge mit `Original`, `Vorschlag`, `Aenderungen` und `Freigeben` umgebaut; Editor sprachlich auf `Vorschlag` gezogen, Diff und Entscheidungsgrund in den Aenderungsblock verlagert und die finale Freigabe in eine eigene Entscheidungsleiste verschoben; Approval-Spec auf die neuen Review-Flaechen erweitert; relevante App-Specs gruen.

- `T72` `[done]` Eskalationsfaelle klarer markieren
  - Ziel: warum eskaliert, was blockiert Auto-Senden, was ist der naechste sichere Schritt.
  - DoD: Eskalation ist erklaert, nicht nur etikettiert.
  - Dateien: [LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx), [InboxItem.tsx](../app/app/nachrichten/components/InboxItem.tsx), [app-conversation.spec.ts](../tests/playwright/app-conversation.spec.ts).
  - Verifikation: In [LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx) eine sichtbare Eskalations-Zusammenfassung im Header und eine eigene Eskalationskarte mit Ursache, Blocker und naechstem sicheren Schritt ergänzt; in [InboxItem.tsx](../app/app/nachrichten/components/InboxItem.tsx) eskalierte Zeilen um eine kompakte Blocker-/Naechster-Schritt-Erklaerung erweitert; Property-Modal zusätzlich per `Escape` schliessbar gemacht und die Conversation-Spec darauf gehaertet; `14/14` relevante App-Specs gruen.

- `T73` `[done]` Ton-&-Stil als Setup-Erlebnis gestalten
  - Ziel: Beispiele, Preview, Guardrails, Aenderungssicherheit.
  - Dateien: [page.tsx](../app/app/ton-und-stil/page.tsx), [ToneStyleSelector.tsx](../components/settings/ToneStyleSelector.tsx), [TonePreviewSummary.tsx](../components/settings/TonePreviewSummary.tsx), [app-tone-style.spec.ts](../tests/playwright/app-tone-style.spec.ts).
  - DoD: Settings fuehlen sich wie Produktfunktion an, nicht wie Formular.
  - Verifikation: Ton-&-Stil-Seite in [page.tsx](../app/app/ton-und-stil/page.tsx) auf `PageHeader`, Setup-Stats, klaren Guardrail-/Beispiel-Flow und eine echte Vorschau-/Sicherheits-Spalte umgebaut; Stilvorlagen und Preview in [ToneStyleSelector.tsx](../components/settings/ToneStyleSelector.tsx) und [TonePreviewSummary.tsx](../components/settings/TonePreviewSummary.tsx) an das neue App-System gezogen; eigene Playwright-Spec für Desktop und Mobile ergänzt; relevante App-Specs gruen.

- `T74` `[done]` Konto-/Abo-/Benachrichtigungsseiten standardisieren
  - Ziel: `PageHeader + SettingsSection + SavePattern`.
  - Dateien: [page.tsx](../app/app/konto/page.tsx), [page.tsx](../app/app/konto/abo/page.tsx), [page.tsx](../app/app/benachrichtigungen/page.tsx), [SectionCard.tsx](../components/app-ui/SectionCard.tsx), [PrimaryActionBar.tsx](../components/app-ui/PrimaryActionBar.tsx), [app-account.spec.ts](../tests/playwright/app-account.spec.ts).
  - DoD: keine Nebenschauplatz-UI mehr.
  - Verifikation: Konto-Übersicht um direkten Einstieg zu Benachrichtigungen erweitert, [page.tsx](../app/app/konto/abo/page.tsx) auf Stats, ruhige Billing-Sektionen und klare Aktionsleiste umgestellt, [page.tsx](../app/app/benachrichtigungen/page.tsx) auf denselben Header-/Section-/Save-Standard mit echter Dirty-Erkennung gezogen; `SectionCard` und `PrimaryActionBar` reichen jetzt auch `data-tour`-Hooks sauber durch; neue Desktop-/Mobile-Smokes für Billing und Benachrichtigungen ergänzt; `npx tsc --noEmit` sowie `19/19` relevante App-Specs gruen.

- `T75` `[todo]` Admin- und CRM-Flaechen spaeter harmonisieren
  - Ziel: bewusst nach Kernflaechen einplanen, nicht parallel.
  - DoD: kein Parallel-Redesign vor Abschluss der Kernjourneys.

### Phase 7

- `T80` `[done]` Mobile-first Review fuer alle Kernrouten
  - Ziel: `390px`, `430px`, `768px`.
  - DoD: keine Overflow-, Badge- oder Fold-Probleme.
  - Verifikation: Viewport-Matrix in [support/ui.ts](../tests/playwright/support/ui.ts) zentralisiert und die Kernrouten `/`, `/produkt`, `/app/startseite`, `/app/nachrichten`, `/app/nachrichten/[id]` und `/app/zur-freigabe` in [public-home.spec.ts](../tests/playwright/public-home.spec.ts), [public-product.spec.ts](../tests/playwright/public-product.spec.ts), [app-dashboard.spec.ts](../tests/playwright/app-dashboard.spec.ts), [app-messages.spec.ts](../tests/playwright/app-messages.spec.ts), [app-conversation.spec.ts](../tests/playwright/app-conversation.spec.ts) und [app-approvals.spec.ts](../tests/playwright/app-approvals.spec.ts) auf `390`, `430` und `768` abgesichert; zusätzliche Produkt-Hero-Hooks in [Hero.tsx](../components/marketing/produkt/Hero.tsx) ergänzt; `npx tsc --noEmit` sowie `27/27` Kern-Specs grün.

- `T81` `[done]` Touch-Ziele vereinheitlichen
  - Ziel: mindestens `44px` fuer primaere Interaktionen.
  - DoD: alle Hauptaktionen sauber tappable.
  - Verifikation: in [AppButton.tsx](../components/app-ui/AppButton.tsx) die Größen `chip`, `sm`, `md` und `lg` auf `min-h`-basierte Touch-Ziele angehoben; mobile Haupttoggles in [ClientRootLayout.tsx](../app/ClientRootLayout.tsx) und [Navbar.tsx](../components/marketing/Navbar.tsx) auf `44px` vereinheitlicht; kleine Produkt-Hero-Anker in [Hero.tsx](../components/marketing/produkt/Hero.tsx) auf volle Touch-Höhe gezogen; mit `expectTouchTarget` in [ui.ts](../tests/playwright/support/ui.ts) echte Mindestgrößen in Marketing-, Dashboard-, Nachrichten-, Konversations-, Freigabe- und Ton-&-Stil-Specs abgesichert; `npx tsc --noEmit` sowie `29/29` relevante Specs grün.

- `T82` `[done]` Kontrast- und Status-A11y pruefen
  - Ziel: Gold auf Weiss, graue Meta-Texte, kleine Chips, Status-Farben.
  - DoD: WCAG-konforme Lesbarkeit in Kernflows.
  - Verifikation: in [styles/globals.css](../styles/globals.css) `--muted`, `--muted-strong`, neutrale Statusfarben und Brand-Badge-Töne kontraststärker gesetzt; Kleintext-Rollen wie `app-text-meta-label`, `label` und `section-kicker` sowie Badge-Padding in [StatusBadge.tsx](../components/app-ui/StatusBadge.tsx) nachgeschärft; Status-Icons in [StatCard.tsx](../components/app-ui/StatCard.tsx) dunkler gezogen; mit `expectTextContrast` in [ui.ts](../tests/playwright/support/ui.ts) echte Kontrastprüfungen über Marketing-, Dashboard-, Nachrichten-, Konversations-, Freigabe- und Ton-&-Stil-Specs ergänzt; `npx tsc --noEmit` sowie `29/29` relevante Specs grün.

- `T83` `[done]` Motion-System sparsam einfuehren
  - Ziel: Page-Load, Card-Reveal, Status-Change, Drawer-Transitions.
  - DoD: UI wirkt lebendig, nicht verspielt.
  - Verifikation: in [styles/globals.css](../styles/globals.css) ein reduziertes Motion-System mit `motion-enter`, `motion-enter-soft`, `motion-enter-drawer-right`, `motion-enter-drawer-down`, gestaffelten Delays und `prefers-reduced-motion`-Fallbacks ergänzt; in [PageHeader.tsx](../components/app-ui/PageHeader.tsx), [SectionCard.tsx](../components/app-ui/SectionCard.tsx), [StatusBadge.tsx](../components/app-ui/StatusBadge.tsx), [ClientRootLayout.tsx](../app/ClientRootLayout.tsx), [Hero.tsx](../components/marketing/Hero.tsx) und [Navbar.tsx](../components/marketing/Navbar.tsx) sparsam angebunden; `npx tsc --noEmit` sowie `npm run playwright:ui:auth -- tests/playwright/public-home.spec.ts tests/playwright/public-product.spec.ts tests/playwright/app-dashboard.spec.ts tests/playwright/app-messages.spec.ts tests/playwright/app-conversation.spec.ts tests/playwright/app-approvals.spec.ts tests/playwright/app-tone-style.spec.ts` grün (`29 passed`).

- `T84` `[done]` Skeleton- und Loading-States designen
  - Ziel: Sidebar, Startseite-KPIs, Nachrichtenliste, Detailansicht.
  - DoD: Laden wirkt geplant, nicht kaputt.
  - Verifikation: in [Skeleton.tsx](../components/app-ui/Skeleton.tsx) und [LoadingShells.tsx](../components/app-ui/LoadingShells.tsx) einen gemeinsamen Skeleton-Layer sowie Loading-Shells für Dashboard, Nachrichten, Konversation, Freigabe und Sidebar eingeführt; in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx), [Sidebar.tsx](../components/Sidebar.tsx), [LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx), [LeadKeyInfoCard.tsx](../app/app/nachrichten/components/LeadKeyInfoCard.tsx) und den neuen Route-Fallbacks [startseite/loading.tsx](../app/app/startseite/loading.tsx), [nachrichten/loading.tsx](../app/app/nachrichten/loading.tsx), [[id]/loading.tsx](../app/app/nachrichten/[id]/loading.tsx) und [zur-freigabe/loading.tsx](../app/app/zur-freigabe/loading.tsx) verdrahtet; `npx tsc --noEmit` sowie `npm run playwright:ui:auth -- tests/playwright/app-*.spec.ts` grün (`27 passed`).

- `T85` `[done]` Copy-Microinteractions ueberarbeiten
  - Ziel: Buttons wie “Starter aktivieren”, “Safe-Start anwenden”, “Zur Freigabe” konsistent und kontextsensitiv.
  - DoD: Actions sind eindeutig.
  - Verifikation: in [action-copy.ts](../lib/ui/action-copy.ts) ein zentrales Action-Copy-Set für Kern-CTAs eingeführt und in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx), [InboxItem.tsx](../app/app/nachrichten/components/InboxItem.tsx), [LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx), [ZurFreigabeUI.tsx](../app/app/zur-freigabe/ZurFreigabeUI.tsx) und [Sidebar.tsx](../components/Sidebar.tsx) verdrahtet; Safe-Start-, Auto-Senden-, Freigabe-, Konversations- und Änderungs-Aktionen tragen jetzt denselben Wortlaut für dieselbe Folge; `npx tsc --noEmit` sowie `npm run playwright:ui:auth -- tests/playwright/app-*.spec.ts` grün (`27 passed`).

- `T86` `[done]` Instrumentierung nachschaerfen
  - Ziel: vor/nach Redesign messbar machen, ob Nutzer schneller zu Freigaben, Nachrichten und Toggles kommen.
  - DoD: Verbesserung ist messbar und nicht nur gefuehlt.
  - Verifikation: in [ui-metrics.ts](../lib/funnel/ui-metrics.ts) gemeinsame UI-Metriken fuer `app_route_view`, `ui_first_action` und `settings_toggle_*` eingefuehrt; in [NachrichtenPageClient.tsx](../app/app/nachrichten/NachrichtenPageClient.tsx), [InboxView.tsx](../app/app/nachrichten/components/InboxView.tsx) und [InboxItem.tsx](../app/app/nachrichten/components/InboxItem.tsx) die Inbox auf `inbox_primary_filter_used` und `inbox_message_opened` verdrahtet; in [LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx) `conversation_primary_action` fuer Senden, Entwurf bearbeiten und Freigeben ergänzt; in [ZurFreigabeUI.tsx](../app/app/zur-freigabe/ZurFreigabeUI.tsx) `approval_item_opened` ergänzt; in [Sidebar.tsx](../components/Sidebar.tsx) und [page.tsx](../app/app/benachrichtigungen/page.tsx) echte `settings_toggle_attempt`-/`settings_toggle_success`-Metriken hinterlegt; in [StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx) Header-, Queue- und Systemstatus-Öffnungen an die Dashboard-Metrik gehängt; `npx tsc --noEmit` sowie `npm run playwright:ui:auth -- tests/playwright/app-*.spec.ts` grün (`27 passed`).

## Aktive Reihenfolge

- `Wave 0`: `T00 -> T01 -> T02 -> T03`
- `Wave 1`: `T10 -> T11 -> T12 -> T13 -> T14 -> T15 -> T16 -> T17`
- `Wave 2`: `T30 -> T31 -> T32 -> T33 -> T34 -> T35`
- `Wave 3`: `T40 -> T41 -> T42 -> T43 -> T44 -> T45 -> T46 -> T47 -> T48 -> T49`
- `Wave 4`: `T50 -> T51 -> T52 -> T53 -> T54 -> T55 -> T56 -> T57 -> T58 -> T59(deferred) -> T60 -> T61`
- `Wave 5`: `T70 -> T71 -> T72 -> T73 -> T74 -> T75`
- `Wave 6`: `T20 -> T21 -> T22 -> T23 -> T24 -> T25 -> T26 -> T27`
- `Wave 7`: `T80 -> T81 -> T82 -> T83 -> T84 -> T85 -> T86`

## Naechster konkreter Schritt

Aktiver Task ist `T24`.

Ziel des naechsten Arbeitsschritts:

1. Den primaeren Marketing-CTA ueber Hero, Pricing und CTA-Bloecke sprachlich vereinheitlichen
2. Proof-, Detail- und Login-Aktionen klar von der Hauptkonversion abgrenzen
3. Die Hauptaktion fuer Erstbesucher ueber die gesamte Landingpage sofort lernbar machen
