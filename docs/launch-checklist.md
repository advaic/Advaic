# Launch-Checkliste (Go/No-Go)

Diese Checkliste ist für den finalen Launch von Advaic gedacht.  
Ziel: kein „halb fertig“, sondern ein belastbarer Go/No-Go-Entscheid.

Aktueller Bewertungsstand: [launch-readiness-status.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/launch-readiness-status.md)
Env-Check vor Go-Live: [launch-env-checklist.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/launch-env-checklist.md)

Status-Logik:
- `PASS` = erfüllt, belastbar geprüft
- `TEILWEISE` = grundsätzlich vorhanden, aber nicht launch-sicher
- `OFFEN` = fehlt

---

## 0) Release-Rahmen

- [ ] Release-Freeze aktiv (keine unkontrollierten Feature-Merges mehr)
- [ ] Verantwortliche benannt:
  - Produkt-Entscheid
  - Technik/Incident
  - Support/Kommunikation
  - Datenschutz/Konformität
- [ ] Go/No-Go-Termin fixiert (Datum + Uhrzeit)
- [ ] Rollback-Entscheider benannt

Go-Kriterium:
- Alle vier Rollen sind klar besetzt und erreichbar.

---

## 1) Recht, Datenschutz, Pflichtseiten (P0)

Referenz: [go-live-compliance-checklist.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/go-live-compliance-checklist.md)

- [ ] Impressum vollständig und aktuell
- [ ] Datenschutzerklärung vollständig und realitätsnah:
  - reale Anbieter/Subprocessor
  - reale Zwecke
  - reale Speicherfristen
  - reale Drittland-Transfers
- [ ] Auftragsverarbeitung (AVV) bereit (Kundenseite + Dienstleister)
- [ ] TOM-Dokument final
- [ ] VVT-Dokument final
- [ ] DSAR-Prozess definiert (Auskunft, Löschung, Berichtigung, Fristen)
- [ ] Incident-/Breach-Runbook mit 72h-Logik definiert

Go-Kriterium:
- Kein P0-Punkt aus der Compliance-Checkliste steht auf `OFFEN`.

---

## 2) Produkt- und Sicherheitslogik

- [ ] Autopilot-Regeln sind eindeutig dokumentiert (Auto / Freigabe / Ignorieren)
- [ ] Qualitätschecks laufen vor Versand (Relevanz, Kontext, Vollständigkeit, Ton, Risiko, Lesbarkeit)
- [ ] Fail-safe aktiv: bei Unsicherheit immer Freigabe
- [ ] Follow-up-Logik ist nachvollziehbar (Fenster, Pausen, Stop-Gründe)
- [ ] Dashboard zeigt klare Status-Transparenz (inkl. Fehlerfälle)
- [ ] „Zur Freigabe“-Workflow ist vollständig nutzbar

Go-Kriterium:
- Für jeden Versandpfad ist der Sicherheitszustand im UI nachvollziehbar.

---

## 3) Betriebsfähigkeit (Ops)

- [ ] Supabase-Cron produktiv eingerichtet  
  Referenz: [supabase-cron-setup.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/supabase-cron-setup.md)
- [ ] Ops Control Center (`/app/admin/ops`) getestet:
  - Pause All
  - Resume All
  - Pipeline-Teilpause
  - Alert-Trigger
- [ ] `pipeline_runs` werden geschrieben und sind auswertbar
- [ ] `ops_alert_events` werden erzeugt, dedupliziert und aufgelöst
- [ ] Kritische Auto-Pause validiert (bei failed/stuck Sendungen)

Go-Kriterium:
- Mindestens ein kompletter Testlauf je Kernpipeline wurde im Monitoring nachgewiesen.

---

## 4) Auth, Billing, Zugriffsgrenzen

- [ ] Trial-Logik (14 Tage) korrekt (Start, Restzeit, Ablauf)
- [ ] Nach Trial-Ende sind kostenintensive Flows korrekt blockiert
- [ ] Checkout-/Billing-Flow produktiv getestet
- [ ] Webhook-Verarbeitung robust (idempotent + retry-fähig)
- [ ] Entitlement-Gates (wer darf was) sind konsistent

Go-Kriterium:
- Kein Nutzer kann nach Trial-Ende kostenintensive Features ungewollt gratis weiter nutzen.

---

## 5) Datenqualität und Datenmodell

- [ ] Immobilien-Felder decken den realen Versandkontext ab
- [ ] Startklar-/Gate-Logik ist aktiv und getestet
- [ ] Migrationsstand ist einheitlich auf Zielumgebung
- [ ] Keine bekannten Schema-Drifts (z. B. `url` vs `uri`)
- [ ] Kritische Abfragen auf Performance geprüft (Indexe vorhanden)

Go-Kriterium:
- Keine bekannten, reproduzierbaren Datenmodell-Fehler in Kernflows.

---

## 6) QA, Test und Abnahme

- [ ] Typecheck grün (`npx tsc --noEmit`)
- [ ] Kritischer End-to-End-Flow erfolgreich:
  - Eingang
  - Klassifikation
  - Draft/QA
  - Send/Freigabe
  - Verlauf/Status
- [ ] Smoke-Test für Public-Seiten und zentrale APIs
- [ ] Fehlerfälle getestet:
  - fehlende Tokens
  - Provider-Fehler
  - DB-Fehler
  - Pipeline-Pause

Go-Kriterium:
- Kritischer Flow plus Fehlerpfade sind erfolgreich dokumentiert getestet.

---

## 7) Public Website und Conversion

- [ ] Alle öffentlichen Seiten sind sprachlich konsistent (Sie-Ansprache oder klare Leitlinie)
- [ ] Claims sind belegbar oder klar als Annahmen gekennzeichnet
- [ ] CTA-Strecke ohne Brüche (Landing -> Signup -> Onboarding)
- [ ] Mobile UX geprüft (insb. Sticky-Elemente, CTA, Lesbarkeit)
- [ ] Quellen am Seitenende sauber und einheitlich gesetzt

Go-Kriterium:
- Kein irreführender Claim auf Public-Seiten; zentrale Conversion-Route ist fehlerfrei.

---

## 8) Support- und Betriebsprozesse

- [ ] Support-Inbox/Prozess definiert (Prioritäten, Antwortzeiten)
- [ ] Admin kann Nutzerfälle schnell diagnostizieren (Status, Logs, letzte Aktionen)
- [ ] Standardantworten für häufige Supportfälle vorbereitet
- [ ] Eskalationsweg definiert (technisch + rechtlich)

Go-Kriterium:
- Ein realer Test-Supportfall wurde Ende-zu-Ende gelöst.

---

## 9) Launch-Tag Runbook

- [ ] Pre-Launch Snapshot erstellt (DB/Config-Stand)
- [ ] Launch-Fenster mit Monitoring besetzt (mind. 2 Stunden)
- [ ] Live-Metriken beobachtet:
  - Send-Fehlerquote
  - Queue-Rückstau
  - offene Alerts
  - Signup -> First-Value
- [ ] Rollback-Kriterien klar:
  - z. B. kritische Send-Fehlerquote > X% über Y Minuten
  - oder wiederholte Sicherheitsverletzung/Fehlrouting

Go-Kriterium:
- Bei Incident ist innerhalb weniger Minuten ein klarer Eingriff möglich (Pause/Rollback).

---

## 10) Finales Go/No-Go Protokoll

Vor Go müssen alle Punkte erfüllt sein:
- [ ] Alle P0-Punkte `PASS`
- [ ] Keine offenen kritischen Bugs in Kernflows
- [ ] Monitoring + Alerting aktiv
- [ ] Billing-Gates aktiv
- [ ] Verantwortliche live erreichbar

Entscheidung:
- [ ] GO
- [ ] NO-GO

Begründung (pflichtig):
- 

Zeitstempel:
- 

Freigegeben von:
- 

---

Hinweis: Diese Checkliste ist operativ/technisch. Sie ist keine Rechtsberatung.
