# Ops Webhook + Daily Eval Setup

Diese Schritte bringen dir sofort mehr Betriebssicherheit ohne Legal-Änderungen.

## 1) Ops-Webhook aktivieren
1. In Slack einen Incoming Webhook erstellen.
2. In deiner Runtime-Umgebung setzen:
   - `ADVAIC_OPS_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...`
3. In Advaic öffnen:
   - `/app/admin/ops`
4. Button klicken:
   - `Webhook-Test senden`
5. Erwartung:
   - Slack erhält eine Testnachricht.
   - Im UI erscheint „Webhook-Test erfolgreich“.

## 2) Daily AI-Eval per GitHub Actions
Workflow:
- [ai-eval-email-classify.yml](/Users/kilianziemann/Downloads/advaic-dashboard/.github/workflows/ai-eval-email-classify.yml)

GitHub Secrets setzen:
- `ADVAIC_EVAL_BASE_URL`  
  Beispiel: `https://deine-domain.de`
- `ADVAIC_INTERNAL_PIPELINE_SECRET`  
  derselbe Wert wie im Server-Env.

Danach:
1. GitHub → Actions → `AI Eval Email Classifier`
2. Einmal `Run workflow` manuell starten.
3. Danach läuft der Eval täglich um `04:15 UTC`.

## 3) Deliverability regelmäßig prüfen
Seite:
- `/app/admin/deliverability`

Empfohlene ENV-Werte:
- `ADVAIC_EMAIL_FROM` (z. B. `hello@deinedomain.de`)
- optional `ADVAIC_DKIM_SELECTORS` (z. B. `resend,s1,s2`)

Check-Ziel:
- SPF vorhanden
- DMARC vorhanden (nicht nur `p=none`)
- mindestens ein DKIM-Selector vorhanden
- keine erhöhte deliverability-nahe Fehlerquote

## 4) Lokaler Verifikations-Run
```bash
npx tsc --noEmit
npm run launch:check
BASE_URL=http://127.0.0.1:4010 INTERNAL_SECRET="$ADVAIC_INTERNAL_PIPELINE_SECRET" npm run critical:e2e
```

