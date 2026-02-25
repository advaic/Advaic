# Incident- und Breach-Runbook

Stand: 25.02.2026  
Hinweis: Operatives Runbook, keine Rechtsberatung.

## Ziel
Sicherheits- oder Datenschutzvorfälle schnell erkennen, begrenzen, bewerten und dokumentieren.

## Schweregrade
- `SEV-1`: Kritischer Vorfall mit potenziell hohem Risiko für Betroffene.
- `SEV-2`: Relevanter Vorfall mit begrenztem Risiko.
- `SEV-3`: Technischer Vorfall ohne erkennbares Personenrisiko.

## Sofortmaßnahmen
1. Vorfall klassifizieren (`SEV-1/2/3`).
2. Betroffene Flows pausieren:
- `/app/admin/ops` -> `Alles pausieren` oder gezielte Pipeline-Pause.
3. Evidenz sichern:
- betroffene IDs, Zeitfenster, Logs, Statusverläufe.

## 72h-Bewertung (Art. 33 DSGVO)
- Prüfen, ob ein meldepflichtiger Datenschutzverstoß vorliegt.
- Bei Meldepflicht:
  - zuständige Aufsichtsbehörde informieren,
  - Zeitstempel und Begründung dokumentieren.
- Bei hohem Risiko für Betroffene:
  - Information der Betroffenen vorbereiten (Art. 34 DSGVO).

## Kommunikationsablauf
1. Interne Incident-Bridge starten.
2. Status-Update-Takt festlegen (z. B. alle 30 Minuten bei SEV-1).
3. Abschlussbericht mit Ursache, Wirkung, Maßnahmen.

## Technische Checkliste
- Pipeline-Zustand prüfen (`pipeline_runs`, `ops_alert_events`).
- Send-Fehler, stuck Sending, Queue-Rückstau bewerten.
- Korrekturmaßnahme einspielen.
- Kontrollierter Wiederanlauf mit Monitoring.

## Post-Mortem
- Root Cause Analysis.
- Dauerhafte Gegenmaßnahmen.
- Anpassung von Regeln, Tests, Runbooks.
