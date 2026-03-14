# Kern-Screenshot-Set

Stand: 12. März 2026

## Ziel

Dieses Set definiert die 12 Produkt-Screens, die wir für Website, Watch-Seiten, Sales-Material und Video-Storyboards immer wieder verwenden.

Arbeitsregeln:

- pro Screenshot genau eine Kernbotschaft
- Desktop-first als saubere Rohfassung
- keine erfundenen Erfolgsmetriken oder Kundenreferenzen
- vor öffentlicher Nutzung jeden Screen auf Namen, E-Mail-Inhalte und andere personenbezogene Daten prüfen

Aktueller Export:

- [docs/marketing-screenshots/2026-03-12](/Users/kilianziemann/Downloads/advaic-dashboard/docs/marketing-screenshots/2026-03-12)

## Kuratiertes Set

| ID | Route | Ziel-Selektor | Kernbotschaft | Verwendung |
| --- | --- | --- | --- | --- |
| `dashboard-startmodul` | `/app/startseite` | `dashboard-quickstart` | Der Einstieg in die Automatisierung bleibt kontrolliert und schrittweise. | Homepage, Produkt, Video 1 |
| `dashboard-systemstatus` | `/app/startseite` | `dashboard-system-health` | Versand, Deliverability und Lernkurve werden als Betriebszustand sichtbar. | Homepage, Sicherheit, Video 2 |
| `dashboard-automation` | `/app/startseite` | `dashboard-automation-control` | Guardrails und Sandbox steuern den Rollout, nicht ein Blackbox-Schalter. | Produkt, Autopilot, Video 2 |
| `messages-inbox` | `/app/nachrichten` | `messages-list` | Die Inbox priorisiert offene Arbeit statt nur neue E-Mails aufzulisten. | Produkt, So funktioniert's, Video 1 |
| `messages-filters` | `/app/nachrichten` | `messages-quickfilters` | Freigabe, Eskalation und Priorität sind mit einem Klick erreichbar. | Produkt, Follow-up-Logik, Video 1 |
| `conversation-thread` | `/app/nachrichten/[id]` | `conversation-thread-card` | Die eigentliche Antwortarbeit läuft in einer ruhigen Produktionsfläche. | Produkt, Freigabe-Inbox, Video 1 |
| `conversation-context` | `/app/nachrichten/[id]` | `conversation-context-rail` | Objektbezug, Regeln und Follow-ups bleiben neben der E-Mail sichtbar. | Produkt, Qualitätschecks, Video 2 |
| `approval-review-flow` | `/app/zur-freigabe` | `approval-review-order` | Freigaben folgen einer festen Reihenfolge statt Bauchgefühl. | Produkt, Freigabe-Inbox, Video 3 |
| `approval-decision` | `/app/zur-freigabe` | `approval-decision` | Senden, Bearbeiten und Ablehnen sind klar getrennte Entscheidungen. | Produkt, Sicherheit, Video 3 |
| `tone-style-setup` | `/app/ton-und-stil` | `tone-style-card` | Antwortstil wird wie ein Setup gepflegt, nicht wie ein loses Formular. | Produkt, Ton & Stil, Video 3 |
| `tone-style-preview` | `/app/ton-und-stil` | `tone-style-preview-card` | Änderungen werden direkt an einer realen Antwortvorschau sichtbar. | Produkt, Ton & Stil, Video 3 |
| `billing-plan-access` | `/app/konto/abo` | `account-billing-plan-card` | Planstatus und Zugriffsmodell sind ohne Support-Rückfrage verständlich. | Preise, Abo, interner Sales-Kontext |

## Nicht Teil dieses Sets

- ein echter Upgrade-Gate-Screenshot  
  Grund: Der aktuelle interne Premium-Account rendert bewusst keinen Upgrade-Gate. Dafür brauchen wir später einen separaten eingeschränkten Test-Account.
- unbearbeitete Full-Page-Screens  
  Grund: Für Marketing und Watch-Seiten wollen wir präzise Motive statt lange Gesamtseiten.

## Capture-Workflow

1. Lokalen Dev-Server starten.
2. Auth-State sicherstellen mit `npm run playwright:auth`.
3. Bei Bedarf eine konkrete Lead-ID erzeugen mit `npm run playwright:lead`.
4. Das Set exportieren mit:

```bash
npm run playwright:screenshots:capture
```

Der Runner erzeugt:

- Rohbilder unter [docs/marketing-screenshots](/Users/kilianziemann/Downloads/advaic-dashboard/docs/marketing-screenshots)
- ein `manifest.json` mit Route, Datei, Botschaft und Verwendungszweck

## Nächster Schritt

Nach `S3-20` folgt `S3-21`: Annotation-Stil, Rahmung und Still-Visual-System auf genau diesem Set aufbauen.
