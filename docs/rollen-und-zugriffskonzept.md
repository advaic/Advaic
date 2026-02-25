# Rollen- und Zugriffskonzept

Stand: 25.02.2026

## Rollen
- `Nutzer (Makler/Team)`: Zugriff auf eigene Daten und Einstellungen.
- `Admin`: Betriebs- und Supportzugriffe mit erhöhter Verantwortung.
- `System intern`: interne Pipelines/Jobs mit Service-Role-Kontext.

## Grundprinzipien
- Least-Privilege: nur notwendige Rechte.
- Trennung zwischen Normalbetrieb und Admin-Intervention.
- Nachvollziehbarkeit durch Status- und Ereignisprotokolle.

## Technische Umsetzung (aktueller Stand)
- Admin-Gates über serverseitige Guards (`app/api/admin/_guard.ts`).
- Interne API-Routen durch internes Secret abgesichert.
- Agentenbezogene Datenzugriffe primär über `agent_id`-Scope.

## Operative Regeln
- Admin-Zugriffe nur für benannte Personen.
- Keine Nutzung produktiver Admin-Rechte für Entwicklungstests.
- Offboarding: Admin-Rechte unmittelbar entziehen.

## Review
- Quartalsweiser Rechte-Review.
- Sofortreview bei Teamwechsel oder Incident.
