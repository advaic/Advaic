# TOM-Übersicht (Technische und organisatorische Maßnahmen)

Stand: 25.02.2026  
Hinweis: Arbeitsdokument, keine Rechtsberatung.

## 1) Zugriffskontrolle
- Authentifizierung über Supabase Auth.
- Rollen- und Admin-Zugriffe serverseitig abgesichert (`requireAdmin`-Guards).
- Interne Pipeline-Routen über `x-advaic-internal-secret` geschützt.

## 2) Weitergabe- und Transportkontrolle
- TLS/HTTPS für externe Kommunikation.
- OAuth für E-Mail-Provider-Anbindung (keine Passwortspeicherung im Klartext).

## 3) Speicher- und Geheimnisschutz
- Sensible Tokens werden verschlüsselt gespeichert (`lib/security/secrets.ts`).
- Produktionsbetrieb setzt `ADVAIC_SECRET_ENCRYPTION_KEY` voraus.

## 4) Integritäts- und Verfügbarkeitskontrolle
- Pipeline-Logging über `pipeline_runs`.
- Alerting und Notfall-Pause über `ops_alert_events` und `ops_runtime_controls`.
- Kernpipelines sind pausierbar und fail-safe ausgelegt.

## 5) Trennungs- und Berechtigungskonzept
- Agentenbezogene Daten über `agent_id` getrennt.
- Admin-Funktionen nur für berechtigte Nutzergruppen.

## 6) Löschung und Datenminimierung
- Kontolöschung mit Datenbereinigung und Storage-Purge (`app/api/account/delete/route.ts`).
- Nicht relevante Nachrichten werden gefiltert statt beantwortet.

## 7) Incident- und Wiederherstellungsprozess
- Incident-Meldeprozess siehe [incident-breach-runbook.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/incident-breach-runbook.md).
- Operative Eingriffe über Ops-Control-Center.

## 8) Review-Frequenz
- Quartalsweise TOM-Review.
- Sofortreview bei Architektur- oder Provider-Änderungen.
