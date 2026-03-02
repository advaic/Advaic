# Deliverability Ops

Ziel: Zustellprobleme früh erkennen und systematisch beheben.

## Admin-Ansicht
- UI: `/app/admin/deliverability`
- API: `/api/admin/deliverability/status`

Geprüft wird:
- SPF (`v=spf1`) auf Absenderdomain
- DMARC (`v=DMARC1`) auf `_dmarc.<domain>`
- DKIM über Selector-Liste (`ADVAIC_DKIM_SELECTORS`, default: `resend,s1,s2`)
- Fehlersignale aus `messages.send_error` der letzten 24h

## Relevante ENV-Werte
- `ADVAIC_EMAIL_FROM` (oder `RESEND_FROM`)
- `ADVAIC_DKIM_SELECTORS` (optional, kommagetrennt)
- `ADVAIC_OPS_ALERT_WEBHOOK_URL` (optional, externe Alert-Zustellung)

## Minimaler Zielzustand
- SPF vorhanden
- DMARC vorhanden, nicht nur `p=none`
- Mindestens ein gültiger DKIM-Selector
- Keine erhöhte Rate an deliverability-nahen Fehlermeldungen

