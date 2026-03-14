# UI Journeys

Datum: `2026-03-10`

Ziel: Die 4 Kern-Journeys des Redesigns verbindlich definieren und jede auditierte Kernroute genau einer primaeren Journey zuordnen.

## Regeln

- Jede auditierte Kernroute hat genau `1` primaere Journey.
- Billing- oder Gate-States aendern die Journey nicht, sondern unterbrechen sie nur.
- `T00A` erweitert spaeter die Evidenz fuer gated Arbeitsflaechen, aendert aber nicht die Journey-Zuordnung.
- Redesign-Entscheidungen werden kuenftig zuerst gegen die betroffene Journey und erst danach gegen Einzelscreens geprueft.

## J1: Erstbesucher versteht Produkt

Nutzerfrage: `Was macht Advaic konkret, fuer wen und warum sollte ich das ausprobieren?`

Primaeres Ziel:

- Das Produktversprechen in wenigen Sekunden verstaendlich machen.
- Die Kernmechanik sichtbar machen, nicht nur behaupten.
- Den naechsten Schritt auf einen klaren CTA reduzieren.

Primaere Routen:

- `/`
- `/produkt`

Erfolg bedeutet:

- Nutzer versteht den Kernnutzen ohne Scroll-Zwang.
- Nutzer sieht frueh einen Proof fuer Guardrails, Automatisierung und Output-Qualitaet.
- Nutzer erkennt genau eine Hauptaktion.

Fehlsignale:

- Hero ist copy-lastig, aber mechanisch unklar.
- Navigation treibt in Browse-Modus statt in Conversion.
- Mehrere CTAs oder Floating-Elemente konkurrieren mit der Hauptaktion.

Redesign-Folgen:

- Marketing-Hero, Proof-Block, CTA-Hierarchie und mobile Navigation werden gegen diese Journey priorisiert.

## J2: Makler startet sicher

Nutzerfrage: `Kann ich die Automatisierung kontrolliert nutzen, ohne falsche Nachrichten freizugeben oder die Uebersicht zu verlieren?`

Primaeres Ziel:

- Sicherheit, Kontrollierbarkeit und Freigabe-Reihenfolge klar machen.
- Produkt soll wie ein sicherer Co-Pilot wirken, nicht wie ein Black Box Versandknopf.
- Blocker oder Gates muessen erklaeren, welche Arbeit gerade aufgehalten wird.

Primaere Routen:

- `/app/zur-freigabe`
- spaeter auch relevante Settings-/Konto-Flaechen mit Aktivierungs- oder Guardrail-Bezug

Erfolg bedeutet:

- Der Nutzer erkennt sofort, was reviewt werden muss.
- Freigaben folgen einer klaren Reihenfolge: Original, Vorschlag, Aenderungen, Entscheidung.
- Billing- oder Trial-Gates erhalten den taskbezogenen Kontext.

Fehlsignale:

- Gate-Screens verlieren Freigabe-Kontext und Dringlichkeit.
- Review-Entscheidungen sind ueber mehrere Module verteilt.
- Trial-, Upgrade- und Sicherheitskommunikation wiederholt sich ohne neue Information.

Redesign-Folgen:

- Freigabe-UX, Billing-Unterbrechungen, Aktivierungszustand und Guardrail-Kommunikation werden gegen diese Journey optimiert.

## J3: Makler bearbeitet Nachrichten in 2 Klicks

Nutzerfrage: `Wie komme ich schnell zur richtigen Nachricht und fuehre die naechste Aktion ohne Reibung aus?`

Primaeres Ziel:

- Inbox-Triage, Filter und Antwortfluss maximal kurz machen.
- Status und Prioritaet schnell scanbar machen.
- Detailansicht soll Antworten, Freigabe oder Eskalation ohne Kontextspruenge ermoeglichen.

Primaere Routen:

- `/app/nachrichten`
- `/app/nachrichten/[id]`

Erfolg bedeutet:

- Hauefige Filter liegen direkt im sichtbaren Bereich.
- Liste ist dichter, ruhiger und klarer priorisiert.
- Konversationsdetail zeigt Lead-Kontext, Thread und naechste Aktion gleichzeitig.

Fehlsignale:

- Toolbars sind ueberfrachtet.
- Karten konkurrieren mit zu vielen Statussignalen und CTA-Arten.
- Gate-Screens verlieren Inbox- oder Lead-Kontext.

Redesign-Folgen:

- Nachrichtenliste, Master-Detail, Item-Hierarchie, Composer und Eskalationslogik werden gegen diese Journey gebaut.

## J4: Makler erkennt Systemstatus in 5 Sekunden

Nutzerfrage: `Ist mein System gesund, was braucht jetzt Aufmerksamkeit und was ist die naechste wichtigste Aktion?`

Primaeres Ziel:

- Dashboard Above-the-Fold auf wenige entscheidungsrelevante Signale reduzieren.
- Status, Prioritaet und naechste Aktion klar trennen.
- Erklaertexte duerfen operative Arbeit nicht nach unten druecken.

Primaere Routen:

- `/app/startseite`

Erfolg bedeutet:

- Oben im Screen gibt es eine klare `Heute wichtig`-Ebene.
- Systemgesundheit ist zusammenhaengend statt ueber mehrere Cards verteilt.
- Freigaben und High-Priority-Themen sind dominanter als Erklaerboxen und Nebenmodule.

Fehlsignale:

- Mehrere Module beantworten gleichzeitig dieselbe "Was jetzt?"-Frage.
- Trial, Quickstart, Status und Toggles konkurrieren Above-the-Fold.
- KPI- und Statuskarten haben kein klares Handlungssignal.

Redesign-Folgen:

- Dashboard-Zonen, Quickstart-Stepper, KPI-Priorisierung und Systemstatus-Board werden gegen diese Journey optimiert.

## Route-Zuordnung

| Route | Primaere Journey | Begruendung | Aktueller Audit-Stand |
| --- | --- | --- | --- |
| `/` | `J1 Erstbesucher versteht Produkt` | Einstieg in Produktverstaendnis, Proof und CTA | Working-State auditiert |
| `/produkt` | `J1 Erstbesucher versteht Produkt` | tiefere Produktmechanik und Vertrauen | Working-State auditiert |
| `/app/startseite` | `J4 Makler erkennt Systemstatus in 5 Sekunden` | Status, Priorisierung und naechste Aktion | Working-State auditiert |
| `/app/nachrichten` | `J3 Makler bearbeitet Nachrichten in 2 Klicks` | Inbox-Triage und Filtergeschwindigkeit | Gate-State auditiert, Working-State in `T00A` offen |
| `/app/nachrichten/[id]` | `J3 Makler bearbeitet Nachrichten in 2 Klicks` | Detailbearbeitung im Lead- und Thread-Kontext | Gate-State auditiert, Working-State in `T00A` offen |
| `/app/zur-freigabe` | `J2 Makler startet sicher` | kontrollierte Review- und Freigabearbeit | Gate-State auditiert, Working-State in `T00A` offen |

## Sonderfall Billing Gate

| Route | Regel |
| --- | --- |
| `/app/konto/abo` bei direktem Aufruf | gehoert nicht zu den 4 Kernjourneys des Redesigns |
| `/app/konto/abo` nach Redirect von `/app/nachrichten` | behaelt `J3` als unterbrochene Journey |
| `/app/konto/abo` nach Redirect von `/app/nachrichten/[id]` | behaelt `J3` als unterbrochene Journey |
| `/app/konto/abo` nach Redirect von `/app/zur-freigabe` | behaelt `J2` als unterbrochene Journey |

Konsequenz:

- Billing-Gates werden nicht als reine Konto-Seite designt.
- Sie muessen die blockierte Aufgabe, den Ursprungspfad und den erwarteten Ruecksprung sichtbar halten.

## Wave-Zuordnung

| Wave | Hauptbeitrag zu Journeys |
| --- | --- |
| `Wave 0` Audit, Journeys, Metriken, Content | schafft gemeinsame Entscheidungsgrundlage fuer `J1-J4` |
| `Wave 1` Design-System und Primitives | schafft visuelle und strukturelle Basis fuer `J1-J4` |
| `Wave 2` App-Chrome und Sidebar | staerkt `J2`, `J3`, `J4` und die Produktkonsistenz insgesamt |
| `Wave 3` Startseite | zahlt primaer auf `J4` ein |
| `Wave 4` Nachrichtenliste | zahlt primaer auf `J3` ein |
| `Wave 5` Konversation, Freigabe, Settings | zahlt primaer auf `J2` und `J3` ein |
| `Wave 6` Marketing-Hero und Homepage | zahlt primaer auf `J1` ein |
| `Wave 7` Mobile, A11y, Motion, Instrumentierung | haertet `J1-J4` auf allen Endgeraeten |

## Entscheidungsregel fuer Folge-Tasks

Wenn eine spaetere Aufgabe keine der 4 Kernjourneys sichtbar verbessert, wird sie nicht vorgezogen.
