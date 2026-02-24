# Go-Live Compliance Checkliste (DE)

Stand: 24.02.2026  
Scope: aktueller Code- und Content-Stand im Repository `advaic-dashboard`.

Hinweis: Diese Checkliste ist eine technische/compliance-orientierte Arbeitsgrundlage und keine Rechtsberatung.

## Status-Legende
- `PASS`: im Code/Inhalt erkennbar umgesetzt
- `TEILWEISE`: vorhanden, aber nicht vollstaendig oder mit Rest-Risiko
- `OFFEN`: im Repo nicht nachweisbar umgesetzt

## P0 (vor produktivem Launch)
| ID | Pflicht | Rechtsbasis | Status | Nachweis im Repo | Was fehlt konkret |
|---|---|---|---|---|---|
| P0-01 | Impressum mit vollstaendigen Pflichtangaben | DDG §5 | TEILWEISE | `app/impressum/page.tsx` | Pflichtfelder fallen auf `Nicht angegeben` zurueck, solange `NEXT_PUBLIC_LEGAL_*` nicht gesetzt sind. |
| P0-02 | Datenschutzinfos nach Art. 13/14 DSGVO | DSGVO Art. 13/14 | TEILWEISE | `app/datenschutz/page.tsx` | Konkrete Empfaenger-/Subprocessor-Liste, Drittlandtransfer-Details, konkrete Speicherfristen je Datenkategorie fehlen. |
| P0-03 | AVV fuer Kunden und Dienstleister | DSGVO Art. 28 | OFFEN | nur Hinweistext in Marketing (`app/sicherheit/page.tsx`) | Finales AVV-Dokument und Prozess zur Unterzeichnung/Versionierung fehlen im Repo. |
| P0-04 | Verzeichnis von Verarbeitungstaetigkeiten (VVT) | DSGVO Art. 30 | OFFEN | kein VVT-Dokument gefunden | VVT mit Zweck, Kategorien, Empfaengern, Loeschfristen und TOM-Referenz erstellen. |
| P0-05 | Technisch-organisatorische Massnahmen (TOM) dokumentieren | DSGVO Art. 32 | OFFEN | keine TOM-Doku gefunden | Schriftliche TOM-Uebersicht inkl. Zugriffskontrolle, Logging, Backup/Restore, Incident-Handling erstellen. |
| P0-06 | Geheimnisse/Tokens verschluesselt speichern | DSGVO Art. 32 | PASS | `lib/security/secrets.ts` + OAuth/API-Routen | In Produktion muss `ADVAIC_SECRET_ENCRYPTION_KEY` gesetzt sein, sonst Runtime-Fehler beim Speichern. |
| P0-07 | Loeschprozess fuer Kontodaten | DSGVO Art. 17 | TEILWEISE | `app/api/account/delete/route.ts` | DB-Cleanup vorhanden, aber kein expliziter Bucket/Object-Delete nach `agent_id` im Account-Delete-Flow. |
| P0-08 | Drittlandtransfer und Rechtsgrundlagen dokumentieren | DSGVO Art. 44 ff. | OFFEN | keine Transfer-Doku gefunden | Liste aller Anbieter (z. B. OpenAI, Google, Microsoft, Slack, Stripe), Transferbasis (SCC/DPF) und TOM-Schutzmassnahmen fehlt. |
| P0-09 | Endgeraetezugriffe (Cookies/Storage) rechtlich einordnen | TDDDG §25 | TEILWEISE | `components/ChatWidget.tsx`, `components/tour/Tour-Provider.tsx` | CMP nur noetig bei nicht notwendigen Zugriffe. Es fehlt eine dokumentierte Cookie/Storage-Matrix mit Rechtsgrundlage pro Eintrag. |
| P0-10 | DSB-Pflicht pruefen und dokumentieren | BDSG §38 | OFFEN | keine DSB-Entscheidungsdoku gefunden | Schwellenwert-/Risikopruefung (20 Personen oder Art.35-Pflichtverarbeitung etc.) schriftlich festhalten. |
| P0-11 | DSAR-Prozess (Auskunft/Berichtigung/Loeschung) mit SLA | DSGVO Art. 12-23 | TEILWEISE | Kontaktkanal vorhanden (`app/datenschutz/page.tsx`), Delete-Endpoint vorhanden | Kein zentraler DSAR-Prozessdokument, keine Fristen-/Workflow-Doku, kein strukturierter Voll-Exportprozess nachweisbar. |
| P0-12 | Incident/Breach-Prozess inkl. 72h-Meldung | DSGVO Art. 33/34 | OFFEN | keine Runbook-Doku gefunden | Meldewege, Klassifizierung, Fristen, Verantwortliche und Behoerdenkontakt als Runbook definieren. |

## P1 (kurz nach Launch, vor Skalierung)
| ID | Pflicht | Rechtsbasis | Status | Nachweis im Repo | Was fehlt konkret |
|---|---|---|---|---|---|
| P1-01 | Datenminimierte Logs und PII-Reduktion | DSGVO Art. 5(1)(c), Art. 32 | TEILWEISE | `app/api/gmail/push/route.ts`, `app/api/gmail/renew-watches/route.ts` | Bereits verbessert; Rest-Audit aller API-Logs auf PII/Tokens vornehmen. |
| P1-02 | Rollen- und Zugriffskonzept dokumentieren | DSGVO Art. 32 | OFFEN | technische Admin-Guards vorhanden (`app/api/admin/_guard.ts`) | Formales Berechtigungskonzept (wer darf was, Rezertifizierung, Offboarding) fehlt. |
| P1-03 | Aufbewahrungs-/Loeschkonzept je Tabelle/Bucket | DSGVO Art. 5(1)(e), Art. 25 | OFFEN | keine zentrale Loeschmatrix gefunden | Konkrete Fristen und Job-Mechanik pro Datenklasse definieren (DB + Storage + Logs + Backups). |
| P1-04 | Subprocessor-Verzeichnis oeffentlich verfuegbar | DSGVO Art. 13/14, Art. 28 | OFFEN | nicht gefunden | Seite/Anhang mit Anbietern, Zweck, Standort/Transferbasis und Update-Prozess veroeffentlichen. |

## Konkrete Reihenfolge (empfohlen)
1. `NEXT_PUBLIC_LEGAL_*` in Prod vollstaendig setzen und Impressum live pruefen.
2. Datenschutzseite um Empfaenger, Drittlandtransfers und konkrete Speicherfristen erweitern.
3. AVV, TOM, VVT und Incident-Runbook als verbindliche Dokumente finalisieren.
4. Cookie/Storage-Matrix erstellen und entscheiden: kein CMP (nur notwendig) oder CMP einbauen.
5. Account-Delete um Storage-Purge (Bucket-Pfade pro `agent_id`) erweitern.
6. DSAR-Prozess mit Ticketing, Fristen und Exportpfad schriftlich fixieren.

## Gesetzeslinks (primaere Quellen)
- DSGVO (EU 2016/679): https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
- DDG §5 (Impressum): https://www.gesetze-im-internet.de/ddg/__5.html
- TDDDG §25 (Endgeraetezugriffe/Cookies): https://www.gesetze-im-internet.de/ttdsg/__25.html
- BDSG §38 (Datenschutzbeauftragte): https://www.gesetze-im-internet.de/bdsg_2018/__38.html
