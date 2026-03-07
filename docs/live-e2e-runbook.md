# Live E2E Runbook (Launch-Abnahme)

Ziel: Ein kompletter, realer End-to-End-Test mit echten Verbindungen, damit du vor Launch einen klaren Go/No-Go-Status hast.

Hinweis: Dieses Runbook ergänzt die technische Checkliste, ersetzt aber keine Rechtsberatung.

## 1) Voraussetzungen

- Umgebung: `staging` oder `production-like` mit finalen Env-Variablen.
- Rollen:
  - 1x Owner-Account (du)
  - 1x Test-Maklerkonto
  - 1x Test-Interessenten-Postfach (separat)
- Verbindungen:
  - Gmail oder Outlook im Maklerkonto verbunden
  - Resend/Deliverability-DNS aktiv
- Pflichtseiten live:
  - Impressum
  - Datenschutz
  - Cookie-Banner

## 2) Testumfang

Pfad A (Public): Website -> Signup -> Verifikation -> Onboarding  
Pfad B (Produkt): Eingang -> Entscheidung -> Qualitätschecks -> Auto/Freigabe -> Versand  
Pfad C (CRM): Prospect -> Nachricht -> Reply-Tracking -> Next Best Action  
Pfad D (Ops): Alerts, Deliverability, Pause/Resume

## 3) Testprotokoll (zum Ausfüllen)

- Datum/Uhrzeit:
- Umgebung:
- Tester:
- Ergebnis pro Schritt (`PASS`/`FAIL`):
- Screenshots/Links:
- Offene Bugs:

## 4) Schritt-für-Schritt

### Schritt 1: Public Einstieg + Cookie + Chatbot

Aktion:
- `/` aufrufen
- Cookie-Banner prüfen (ablehnen/akzeptieren testen)
- Public-Chatbot öffnen und 2 Fragen stellen

Soll:
- Banner erscheint korrekt
- Website bleibt voll nutzbar
- Chatbot antwortet stabil
- In `/app/crm` erscheint später im Abschnitt „Öffentlicher Chatbot-Verlauf“ ein Log-Eintrag (bei Analytics-Einwilligung)

Bei FAIL prüfen:
- `/api/public/assistant`
- `/api/funnel/public-event`
- Consent-State im Browser

### Schritt 2: Signup + Verifizierung + Pflicht-Checkboxen

Aktion:
- `/signup` durchlaufen
- E-Mail/Telefon-Code eingeben
- Nutzungsbedingungen + Datenschutz akzeptieren

Soll:
- Ohne Zustimmung kein Abschluss
- Mit gültigen Codes erfolgreicher Account-Start

Bei FAIL prüfen:
- `/api/auth/signup/request-code`
- `/api/auth/signup/verify`
- Twilio/Email-Provider Logs

### Schritt 3: Onboarding bis „startklar“

Aktion:
- Postfach verbinden
- Ton/Stil und Regeln setzen
- konservativer Start (mehr Freigabe, weniger Auto)

Soll:
- Kein Blocker
- Einstellungen werden gespeichert
- Dashboard zeigt Startstatus korrekt

Bei FAIL prüfen:
- `/api/onboarding/*`
- DB-Einträge `agent_settings`, Profil-/Policy-Felder

### Schritt 4: Eingangsklassifikation mit echten Mails

Aktion:
- Vom Test-Interessenten senden:
  - echte Anfrage (klar)
  - unklare Anfrage
  - Newsletter/no-reply/Systemmail

Soll:
- klare Anfrage: erkannt
- unklare Anfrage: Freigabe
- Systemmail: ignoriert

Bei FAIL prüfen:
- `/api/ai/email-classify`
- Nachrichtenstatus in DB

### Schritt 5: Auto-Senden + Guardrails

Aktion:
- Autopilot aktivieren
- klare Standardanfrage senden

Soll:
- Versand nur bei sauberem Guardrail-Status
- Verlauf zeigt Eingang -> Entscheidung -> Versand
- „Gesendet über Ihr Postfach“ sichtbar

Bei FAIL prüfen:
- `/api/pipeline/reply-ready/*`
- Guardrail-Metadaten in Message/QA

### Schritt 6: Freigabe-Flow

Aktion:
- unklare/heikle Nachricht erzeugen
- in „Zur Freigabe“ bearbeiten und senden

Soll:
- klarer Grund „Warum Freigabe“
- nach Freigabe Status sauber auf „gesendet“
- Verlauf vollständig

Bei FAIL prüfen:
- `/api/messages/approve`
- `message_qas`, `messages`, `pipeline_runs`

### Schritt 7: Follow-up-Logik + Stop-Regeln

Aktion:
- Follow-up-fälligen Lead erzeugen
- Reply simulieren
- Bounce simulieren

Soll:
- Follow-up stoppt bei Reply
- Kanalwechsel/Stop bei Bounce
- keine weiteren Touches bei `unsubscribed`/`no_interest`

Bei FAIL prüfen:
- `/api/pipeline/followups/run`
- `followup_stop_reason`, `followup_status`

### Schritt 8: CRM-Flow + Next Best Action

Aktion:
- `/app/crm` öffnen
- Prospect anlegen/bearbeiten
- Sequenz ausführen
- Reply-Inbox und Next Action prüfen

Soll:
- Next Action zeigt Score + Begründung + Guardrail-Hinweise
- Reply-Inbox hat Intent und umsetzbare Empfehlung
- Pipeline sortierbar nach Readiness

Bei FAIL prüfen:
- `/api/crm/next-action`
- `/api/crm/replies/inbox`
- `/api/crm/sequences/run`

### Schritt 9: Ops + Deliverability

Aktion:
- `/app/admin/ops`
- `/app/admin/deliverability`
- Alert-Test auslösen

Soll:
- Ops-Status lädt ohne Fehler
- Deliverability zeigt SPF/DKIM/DMARC plausibel
- Alert kommt im Zielkanal an (z. B. Slack)

Bei FAIL prüfen:
- `/api/admin/ops/status`
- `/api/admin/deliverability/status`
- `/api/pipeline/ops/alerts/run`

## 5) Harte Go/No-Go Kriterien

GO nur wenn alle Punkte erfüllt sind:

- Kritische Pfade (Signup, Eingang, Freigabe, Versand, Follow-up) sind `PASS`.
- Keine wiederholbaren 500er in Kern-APIs.
- Keine falschen Auto-Sendings bei unklaren Fällen.
- Deliverability-Basis ist stabil (mind. SPF, DKIM, DMARC vorhanden).
- Public- und CRM-Tracking funktionieren wie erwartet.

NO-GO wenn einer davon zutrifft:

- Guardrails umgehen sich reproduzierbar.
- Freigabe- oder Versandstatus inkonsistent.
- Webhook-/Pipeline-Ausfälle ohne Alert.
- Rechtliche Pflichtwerte (`NEXT_PUBLIC_LEGAL_*`) fehlen.

## 6) Nach dem Lauf

- Ergebnis in `docs/launch-readiness-status.md` übernehmen.
- Alle FAILs mit Ticket + Verantwortlichem + ETA erfassen.
- Zweiten Verifikationslauf nach Fixes durchführen.

