# UI Metrics

Datum: `2026-03-10`

Ziel: Fuer jede Kernroute genau eine primaere UI-Erfolgsmetrik verbindlich definieren, inklusive Messlogik, Interpretationsregel und empfohlenem Tracking-Punkt.

## Messprinzipien

- Jede Kernroute hat genau `1` primaere Metrik.
- Die Metrik misst Nutzerfortschritt, nicht reine Interaktionsmenge.
- `time-to-first-action` zaehlt nur sinnvolle Aktionen, keine reinen Layout- oder Hilfsinteraktionen.
- Billing-Gates behalten die Metrik der unterbrochenen Journey, bekommen aber eigene Gate-Kontext-Ereignisse.
- Marketing kann ueber [trackPublicEvent](../lib/funnel/public-track.ts) gemessen werden, App-Flaechen ueber [trackFunnelEvent](../lib/funnel/track.ts).

## Metrikdefinitionen

### `cta-click-through`

Zweck:

- Misst, ob eine Marketing-Flaeche ihre Hauptaktion klar genug macht.

Formel:

- `unique sessions with primary cta click / unique sessions with route view`

Was zaehlt als Erfolg:

- Klick auf die definierte Hauptaktion der Route.

Was zaehlt nicht:

- Sekundaer-CTA
- Klick auf Floating-Assistant
- Navigation zu anderen Marketing-Unterseiten

Interpretation:

- Hoeher ist besser, solange Hero und Proof konsistent bleiben.
- Wenn der Wert sinkt, ist meist die CTA-Hierarchie, Proof-Sichtbarkeit oder Header-Dichte das Problem.

### `time-to-first-action`

Zweck:

- Misst, wie schnell eine operative Flaeche zur ersten sinnvollen Handlung fuehrt.

Formel:

- `median(seconds between route ready and first meaningful action)`

Route ready bedeutet:

- Route ist sichtbar und interaktiv.
- Fuer spaetere Instrumentierung reicht ein Event direkt nach Hydration plus kleinem UI-Settling.

Was zaehlt als sinnvolle erste Aktion:

- Dashboard: Oeffnen einer priorisierten Aufgabe, eines Approval-Blocks oder einer High-Priority-Konversation
- Konversation: Antwort beginnen, Freigabe oeffnen, Eskalation ausloesen, relevante Kontextflaeche oeffnen

Was zaehlt nicht:

- Scrollen
- Refresh
- Help/Floating-Widget
- rein dekorative Toggle-Interaktionen ohne Folgen

Interpretation:

- Niedriger ist besser.
- Steigende Werte deuten fast immer auf schlechte Priorisierung, zu viele konkurrierende Module oder zu dichte Toolbars hin.

### `filter-use-rate`

Zweck:

- Misst, ob die Inbox ihre haeufigsten Triage-Werkzeuge schnell und sichtbar anbietet.

Formel:

- `sessions with primary filter or search usage before first message open / sessions with inbox route view`

Primaere Filter fuer diese Metrik:

- Suche
- `Freigabe`
- `Eskalation`
- `Hoch`

Was zaehlt nicht:

- tiefe Sortier- oder Kategorieoptionen im Sekundaermenue
- Bulk-Auswahl ohne Triage-Filter

Interpretation:

- Mittlere bis steigende Nutzung ist gut, wenn gleichzeitig die erste relevante Nachricht schneller geoeffnet wird.
- Ein sehr niedriger Wert spricht fuer versteckte oder zu komplexe Filter.
- Ein sehr hoher Wert ohne schnellere Oeffnung kann bedeuten, dass die Liste selbst nicht klar genug priorisiert ist.

### `approval-open-rate`

Zweck:

- Misst, ob Nutzer wartende Freigaben schnell erkennen und in die Bearbeitung wechseln.

Formel:

- `sessions with approval detail open / sessions with approvals route view and pending approvals > 0`

Was zaehlt als Erfolg:

- Oeffnen einer konkreten Freigabe oder Eintritt in den Review-Editor.

Was zaehlt nicht:

- reines Ansehen des Gate-Screens
- Scrollen durch Billing- oder Hinweisboxen

Interpretation:

- Hoeher ist besser.
- Sinkt der Wert, fehlt meist Prioritaet, Kontext oder eine klare Review-Reihenfolge.

### `settings-toggle-success`

Zweck:

- Misst, ob Einstellungs- und Aktivierungsflaechen nicht nur benutzt, sondern erfolgreich abgeschlossen werden.

Formel:

- `successful persisted toggle changes / toggle attempts`

Was zaehlt als Erfolg:

- Server-seitig bestaetigte Aenderung eines Schalters oder Guardrail-Settings.

Was zaehlt nicht:

- rein lokales Umlegen ohne Persistenz
- gescheiterte Requests
- automatische Ruecksetzung auf alten Wert

Interpretation:

- Hoeher ist besser.
- Sinkt der Wert, liegt das Problem eher bei Unklarheit, Angst vor Nebenwirkungen oder schlechter Rueckmeldung nach dem Toggle.

## Route-Mapping

| Route | Primaere Journey | Primaere Metrik | Erfolgsausloeser | Guardrail |
| --- | --- | --- | --- | --- |
| `/` | `J1 Erstbesucher versteht Produkt` | `cta-click-through` | Klick auf Hero- oder primaeren Seiten-CTA | Proof-Block darf nicht nach unten wegrutschen |
| `/produkt` | `J1 Erstbesucher versteht Produkt` | `cta-click-through` | Klick auf primaeren Produkt-CTA | Produktmechanik muss oberhalb der Vergleichs- und Trust-Tiefe sichtbar bleiben |
| `/app/startseite` | `J4 Makler erkennt Systemstatus in 5 Sekunden` | `time-to-first-action` | Oeffnen der naechsten priorisierten Aufgabe | Schnellere Aktion darf nicht durch CTA-Laerm erkauft werden |
| `/app/nachrichten` | `J3 Makler bearbeitet Nachrichten in 2 Klicks` | `filter-use-rate` | Nutzung von Suche oder Kernfilter vor dem ersten Message-Open | immer zusammen mit Zeit bis erste relevante Oeffnung lesen |
| `/app/nachrichten/[id]` | `J3 Makler bearbeitet Nachrichten in 2 Klicks` | `time-to-first-action` | Antwort, Freigabe, Eskalation oder Kontextaktion | keine Hilfs- oder Scroll-Ereignisse zaehlen |
| `/app/zur-freigabe` | `J2 Makler startet sicher` | `approval-open-rate` | Oeffnen einer wartenden Freigabe | nur messen, wenn `pending approvals > 0` |
| Settings-/Konto-Flaechen | `J2 Makler startet sicher` | `settings-toggle-success` | erfolgreich persistierte Konfigurationsaenderung | Billing-Gates getrennt betrachten |

## Empfohlene Instrumentierungspunkte

### Marketing

Bestehender Kanal:

- [trackPublicEvent](../lib/funnel/public-track.ts)

Empfohlene Events:

- `marketing_route_view`
- `marketing_primary_cta_click`
- `marketing_proof_block_view`
- `marketing_gate_context_view` falls Billing-/Trial-Kontext spaeter auch oeffentlich relevant wird

### App

Bestehender Kanal:

- [trackFunnelEvent](../lib/funnel/track.ts)

Empfohlene Events:

- `app_route_view`
- `dashboard_primary_task_open`
- `inbox_primary_filter_used`
- `inbox_message_open`
- `conversation_primary_action`
- `approval_item_open`
- `settings_toggle_attempt`
- `settings_toggle_success`
- `billing_gate_view`
- `billing_gate_upgrade_click`

## Gate-State-Regel

Wenn eine Journey durch Billing blockiert wird, gelten zwei Messschichten:

1. Die Journey-Metrik bleibt fachlich dieselbe.
2. Zusaetzlich wird der Blocker gemessen.

Beispiel:

- Redirect von `/app/nachrichten` nach `/app/konto/abo`
- Primaere Journey bleibt `J3`
- Primaere Outcome-Metrik bleibt `filter-use-rate`
- Zusaetzlich werden `billing_gate_view` und `billing_gate_upgrade_click` als Diagnose-Ereignisse erfasst

## Entscheidungsregel fuer spaetere Implementierung

Eine Tracking-Aenderung ist nur dann sinnvoll, wenn sie direkt auf eine der hier definierten primaeren Metriken oder ihre Guardrails einzahlt.
