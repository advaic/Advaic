# Playwright Auth Runbook

Ziel: echte App-Playwright-Specs mit einem realen Supabase-User laufen lassen.

## 1) Storage state erzeugen

Erforderlich:

- `PLAYWRIGHT_TEST_EMAIL`
- `PLAYWRIGHT_TEST_PASSWORD`

Einmal ausfuehren:

```bash
PLAYWRIGHT_TEST_EMAIL="dein-user@example.com" \
PLAYWRIGHT_TEST_PASSWORD="dein-passwort" \
npm run playwright:auth
```

Ergebnis:

- Storage-State wird standardmaessig nach `.auth/app-user.json` geschrieben.
- Die App-Specs erkennen diese Datei automatisch.

Optional:

- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4010`
- `PLAYWRIGHT_HEADLESS=0` fuer sichtbaren Browser
- `PLAYWRIGHT_AUTH_STORAGE_STATE=.auth/anderer-user.json` fuer einen anderen Dateipfad

## 2) Eine valide Lead-ID finden

Schnellster Weg:

```bash
PLAYWRIGHT_TEST_EMAIL="dein-user@example.com" \
npm run playwright:lead
```

Der Helper:

- loest zuerst den Supabase-User fuer `PLAYWRIGHT_TEST_EMAIL` auf
- faellt sonst auf `PLAYWRIGHT_AGENT_ID`, `E2E_AGENT_ID`, `ADVAIC_OWNER_USER_ID`, `ADMIN_DASHBOARD_USER_ID`, `ADVAIC_ADMIN_USER_ID` zurueck
- gibt eine brauchbare `PLAYWRIGHT_LEAD_ID` fuer `/app/nachrichten/[id]` aus

Manueller Fallback:

- In der App eine existierende Konversation oeffnen
- die UUID aus `/app/nachrichten/<lead-id>` kopieren

## 3) App-Specs laufen lassen

Wenn `playwright:lead` z. B. `PLAYWRIGHT_LEAD_ID=abc-123` ausgibt:

```bash
PLAYWRIGHT_LEAD_ID="abc-123" \
npm run playwright:ui
```

Bequemer One-Command-Run:

```bash
npm run playwright:ui:auth
```

Der Wrapper:

- prueft `.auth/app-user.json`
- ermittelt `PLAYWRIGHT_LEAD_ID` automatisch, falls sie nicht gesetzt ist
- startet danach die komplette Playwright-Suite

Du kannst Targets oder Flags einfach durchreichen:

```bash
npm run playwright:ui:auth -- tests/playwright/app-*.spec.ts
npm run playwright:ui:auth -- --headed
```

Oder nur die App-Specs:

```bash
PLAYWRIGHT_LEAD_ID="abc-123" \
npx playwright test tests/playwright/app-*.spec.ts
```

## 4) Was ohne Lead-ID trotzdem schon laeuft

Auch ohne `PLAYWRIGHT_LEAD_ID` laufen bereits:

- Dashboard
- Nachrichtenliste
- Freigabe-Inbox

Nur die Konversationsdetail-Specs werden dann weiterhin sauber geskippt.

## 5) Typische Fehler

- `Nicht eingeloggt` in der App:
  Storage-State fehlt, ist abgelaufen oder gehoert zu einem anderen Projekt.
- `.auth/app-user.json` ist fast leer:
  Das ist kein gueltiger Login-State. `npm run playwright:auth` erneut ausfuehren; der Helper bricht jetzt ab, wenn keine echte Session gespeichert wurde.
- `Keine Leads gefunden`:
  Der User hat keine Testdaten oder du nutzt die falsche `agent_id`.
- Tests skippen weiter:
  Pruefe, ob `.auth/app-user.json` wirklich existiert und `PLAYWRIGHT_LEAD_ID` gesetzt ist.
