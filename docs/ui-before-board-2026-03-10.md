# UI Before Board

Datum: `2026-03-10`  
Umgebung: `http://127.0.0.1:4010`  
Auth-State fuer App-Audit: echter eingeloggter User mit `trial_expired`  
Manifest: [ui-audit/2026-03-10/manifest.json](./ui-audit/2026-03-10/manifest.json)

## Audit-Status

- Marketing-Routen wurden im echten `Working-State` erfasst.
- `/app/startseite` wurde im echten `Working-State` des aktuellen Users erfasst.
- `/app/nachrichten`, `/app/nachrichten/[id]` und `/app/zur-freigabe` wurden im echten `Gate-State` erfasst, weil [proxy.ts](../proxy.ts) diese Routen fuer den aktuellen User korrekt nach Billing umleitet.
- Ein zusaetzlicher `paid_active` oder `trial_active` Test-User ist noetig, um die eigentlichen Nachrichten-/Konversations-/Freigabe-Arbeitsflaechen im `Working-State` zu auditieren.

## Prioritaetsboard

### Top S1

1. `S1` Marketing-Hero zeigt die Produktmechanik nicht schnell genug, besonders mobil.
2. `S1` Dashboard Above-the-Fold beantwortet die Frage "Was soll ich jetzt tun?" mehrfach und konkurrierend.
3. `S1` Billing-Gates fuer Nachrichten, Konversation und Freigabe verlieren den eigentlichen Arbeitskontext.
4. `S1` Mobile Billing-Gates wirken sofort defekt, weil die Account-Tabs sichtbar abgeschnitten sind.

### Top S2

1. `S2` Marketing-Header ist zu voll und schiebt Nutzer in Browse- statt Conversion-Modus.
2. `S2` App-Chrome und Marketing sprechen noch nicht dieselbe visuelle Sprache.
3. `S2` Trial-/Upgrade-Messaging ist in App und Billing mehrfach redundant und visuell zu laut.
4. `S2` Auf mobilen Kernscreens konkurrieren Floating-Widgets mit den Primaeraktionen.

### Top S3

1. `S3` CTA-Stile sind uneinheitlich zwischen Marketing, App, Sidebar und Billing.
2. `S3` Kleine Meta-Texte und Status-Chips erzeugen visuelles Rauschen.
3. `S3` Floating Utility-/Help-Buttons wirken auf schmalen Viewports wie zufaellige Overlays.

## Route Board

### `/`

Screens:

- Desktop Fold: [home-desktop-fold.png](./ui-audit/2026-03-10/home-desktop-fold.png)
- Desktop Full: [home-desktop.png](./ui-audit/2026-03-10/home-desktop.png)
- Mobile Fold: [home-mobile-fold.png](./ui-audit/2026-03-10/home-mobile-fold.png)
- Mobile Full: [home-mobile.png](./ui-audit/2026-03-10/home-mobile.png)

#### Desktop

- `S1` Das Hero lebt fast vollstaendig von Copy; die Produktmechanik im rechten Visual ist auf den ersten Blick nicht lesbar genug.
- `S2` Der Header ist mit 8 Navigationspunkten plus `Login` und `14 Tage testen` zu voll und verwischt die Conversion-Hierarchie.
- `S3` Der Floating-Button `Frage an Advaic` fuegt im Hero eine weitere konkurrierende Aktion hinzu, ohne den Primaer-CTA zu staerken.

#### Mobile

- `S1` Ueber dem Fold ist keine echte Produktmechanik sichtbar; der Screen besteht fast nur aus Copy und CTA-Stack.
- `S1` Primaer-CTA, Floating-Assistant und Cookie-Widget konkurrieren im gleichen unteren Bereich und schwaechen die Hauptaktion.
- `S2` Die CTA-Zone wirkt gequetscht; die Sekundaeraktion sitzt nur noch halb sichtbar unter dem Primaer-CTA.

### `/produkt`

Screens:

- Desktop Fold: [produkt-desktop-fold.png](./ui-audit/2026-03-10/produkt-desktop-fold.png)
- Desktop Full: [produkt-desktop.png](./ui-audit/2026-03-10/produkt-desktop.png)
- Mobile Fold: [produkt-mobile-fold.png](./ui-audit/2026-03-10/produkt-mobile-fold.png)
- Mobile Full: [produkt-mobile.png](./ui-audit/2026-03-10/produkt-mobile.png)

#### Desktop

- `S1` Die Produktseite startet mit fast derselben Dramaturgie wie die Homepage und liefert trotzdem noch keinen schnellen, konkreten Mechanik-Beweis.
- `S2` Die volle Marketing-Navigation konkurriert auch hier mit der eigentlichen Produktstory und laedt eher zum Herumspringen als zum Verstehen ein.
- `S3` Der Floating-Assistant erzeugt erneut einen dritten CTA-Punkt im sichtbaren Bereich, ohne den Lesefluss zu verbessern.

#### Mobile

- `S1` Auch hier fehlt Above-the-Fold ein klarer Produktbeweis; es bleibt bei Claim und Fliesstext.
- `S2` Floating-Assistant und CTA-Karte pressen die Hero-Aktionen in einen sehr engen unteren Bereich.
- `S2` Die Sekundaeraktion rutscht unter den Fold und verliert dadurch ihre Rolle als bewusste zweite Option.

### `/app/startseite`

Screens:

- Desktop Fold: [dashboard-desktop-fold.png](./ui-audit/2026-03-10/dashboard-desktop-fold.png)
- Desktop Full: [dashboard-desktop.png](./ui-audit/2026-03-10/dashboard-desktop.png)
- Mobile Fold: [dashboard-mobile-fold.png](./ui-audit/2026-03-10/dashboard-mobile-fold.png)
- Mobile Full: [dashboard-mobile.png](./ui-audit/2026-03-10/dashboard-mobile.png)

#### Desktop

- `S1` Above-the-Fold existieren gleichzeitig Sidebar-Trial-Box, Trial-Banner und Quickstart-CTA; die Frage "Was ist jetzt die naechste wichtigste Aktion?" wird mehrfach und konkurrierend beantwortet.
- `S2` Die App-Chrome ist visuell nicht auf Marketing-Niveau: Emoji-Navigation, graue Shell und roter Logout wirken wie ein anderes Produkt.
- `S2` Der Sticky-Header mischt Intro, Status-Toggles und Refresh zu dicht; Systemstatus und Hauptaktion sind nicht klar getrennt.

#### Mobile

- `S1` Die versprochene 5-Sekunden-Systemuebersicht scheitert am Stack aus Titel, Badge, Toggles, Trial-Hinweis und Quickstart.
- `S2` Titel und Controls wirken gequetscht; besonders der abgeschnittene Name und die gestapelten Systemchips reduzieren die Scanbarkeit.
- `S3` Der Floating-Help-Button sitzt direkt ueber dem Content und fuehlt sich auf dem kleinen Viewport wie ein stoerender Overlay-Rest an.

### `/app/nachrichten`

State: `Gate-State`  
Final URL: `/app/konto/abo?upgrade_required=1&source=middleware_billing_guard&next=%2Fapp%2Fnachrichten`

Screens:

- Desktop Fold: [messages-desktop-fold.png](./ui-audit/2026-03-10/messages-desktop-fold.png)
- Desktop Full: [messages-desktop.png](./ui-audit/2026-03-10/messages-desktop.png)
- Mobile Fold: [messages-mobile-fold.png](./ui-audit/2026-03-10/messages-mobile-fold.png)
- Mobile Full: [messages-mobile.png](./ui-audit/2026-03-10/messages-mobile.png)

#### Desktop

- `S1` Der Redirect verliert den Arbeitskontext komplett; nirgendwo steht, dass der Nutzer eigentlich `Nachrichten` oeffnen wollte.
- `S2` Globale App-Sidebar und Konto-Subnavigation stehen gleichzeitig im Screen und erzeugen unnötige IA-Reibung.
- `S2` Die Seite wiederholt Upgrade-Kommunikation in Sidebar, Alert und Plan-Karte; dazu kommen uneinheitliche CTA-Stile zwischen dunklem und blauem Button.

#### Mobile

- `S1` Die horizontale Konto-Navigation ist sichtbar abgeschnitten (`Passwc...`) und wirkt sofort kaputt.
- `S1` Auch mobil fehlt jeder Hinweis, dass der Nutzer aus der Nachrichten-Inbox hierher umgeleitet wurde.
- `S2` Die Billing-Seite stapelt Alerts und CTA-Module, bevor sie den Nutzer in seinen eigentlichen Task zurueckfuehrt.

### `/app/nachrichten/[id]`

State: `Gate-State`  
Final URL: `/app/konto/abo?upgrade_required=1&source=middleware_billing_guard&next=%2Fapp%2Fnachrichten%2Ff867b1cc-6afd-4be3-a5a3-1f59bc319162`

Screens:

- Desktop Fold: [conversation-desktop-fold.png](./ui-audit/2026-03-10/conversation-desktop-fold.png)
- Desktop Full: [conversation-desktop.png](./ui-audit/2026-03-10/conversation-desktop.png)
- Mobile Fold: [conversation-mobile-fold.png](./ui-audit/2026-03-10/conversation-mobile-fold.png)
- Mobile Full: [conversation-mobile.png](./ui-audit/2026-03-10/conversation-mobile.png)

#### Desktop

- `S1` Beim Konversations-Gate geht sogar der Lead-Kontext verloren; der Nutzer sieht nicht, welche Nachricht oder welcher Lead gerade blockiert ist.
- `S2` Die Billing-Copy ist zu generisch fuer eine unterbrochene Arbeitsflaeche und erklaert nicht, welche Funktion oder welcher Verlauf nach dem Upgrade wieder verfuegbar ist.
- `S2` Visuell entstehen erneut doppelte Navigations- und Upgrade-Zonen, statt die Unterbrechung klar und ruhig zu erklaeren.

#### Mobile

- `S1` Die Unterbrechung fuehlt sich willkuerlich an, weil weder Lead- noch Konversationskontext auf dem Gate erhalten bleibt.
- `S1` Die abgeschnittenen Konto-Tabs lassen das Gate auf dem ersten Blick wie einen Layoutfehler wirken.
- `S2` CTA-Hierarchie und Alert-Wiederholung sind auch mobil zu laut fuer einen ohnehin frustrierenden Blocker-Moment.

### `/app/zur-freigabe`

State: `Gate-State`  
Final URL: `/app/konto/abo?upgrade_required=1&source=middleware_billing_guard&next=%2Fapp%2Fzur-freigabe`

Screens:

- Desktop Fold: [approvals-desktop-fold.png](./ui-audit/2026-03-10/approvals-desktop-fold.png)
- Desktop Full: [approvals-desktop.png](./ui-audit/2026-03-10/approvals-desktop.png)
- Mobile Fold: [approvals-mobile-fold.png](./ui-audit/2026-03-10/approvals-mobile-fold.png)
- Mobile Full: [approvals-mobile.png](./ui-audit/2026-03-10/approvals-mobile.png)

#### Desktop

- `S1` Der Gate-State verschluckt die wichtigste Information fuer diese Route: ob und wie viele Freigaben gerade auf den Nutzer warten.
- `S2` Der Screen ist komplett konto-zentriert und nicht task-zentriert; dadurch geht die operative Dringlichkeit verloren.
- `S2` Trial-Hinweise und Upgrade-Aufforderungen wiederholen sich mehrfach, ohne neue Information zu liefern.

#### Mobile

- `S1` Die Freigabe-Dringlichkeit ist komplett verschwunden; der Screen vermittelt nur noch Billing, nicht mehr blockierte Arbeit.
- `S1` Auch hier ist die mobile Konto-Navigation sichtbar abgeschnitten und wirkt unpoliert.
- `S2` Der eigentliche Nutzen von `Starter aktivieren` bleibt zu abstrakt, weil der Screen keinen Bezug auf wartende Freigaben oder Review-Aufwand herstellt.

## Audit-Gaps

- `blocked` Working-State-Screens fuer `/app/nachrichten`, `/app/nachrichten/[id]`, `/app/zur-freigabe`
  - Benoetigt: `paid_active` oder `trial_active` Test-User
  - Grund: aktueller User wird produktkorrekt durch Middleware in Billing umgeleitet
  - Folge: Listen-, Konversations- und Freigabe-Working-State muessen separat nacherfasst werden

## Konsequenz fuer die Redesign-Reihenfolge

1. Design-System und App-Chrome zuerst, weil die groessten Inkonsistenzen global sind.
2. Startseite danach, weil dort die Above-the-Fold-Priorisierung aktuell am staerksten leidet.
3. Danach Nachrichtenliste, Konversation und Freigabe im `Working-State`, sobald ein aktiver Test-User verfuegbar ist.
4. Marketing-Hero und Homepage-Kuerzung koennen parallel danach auf derselben Auditbasis erfolgen.
