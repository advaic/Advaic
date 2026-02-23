# Billing Setup (Stripe + Supabase)

## 1) Stripe Konto anlegen

1. Erstelle ein Stripe-Konto und aktiviere zuerst **Test Mode**.
2. Erstelle mindestens ein Produkt mit monatlichem Preis (z. B. "Pro").
3. Notiere dir die `price_...` IDs aus Stripe.

## 2) Env-Variablen setzen

In `.env.local` brauchst du mindestens:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...          # optional
STRIPE_PRICE_STARTER_MONTHLY=price_...       # optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # lokal
```

Hinweis: Für Produktion `sk_live_...` + echte Domain setzen.

## 3) SQL-Migration ausführen (Supabase)

Datei:

```text
supabase/migrations/20260223_billing_foundation.sql
supabase/migrations/20260224_billing_webhook_events.sql
```

Ausführen in Supabase:

1. Supabase Dashboard -> SQL Editor
2. Inhalt der Datei einfügen
3. `Run` klicken

Tabellen danach:

- `billing_customers`
- `billing_subscriptions`
- `billing_invoices`
- `billing_webhook_events`

## 4) Webhook in Stripe konfigurieren

Endpoint lokal:

```text
http://localhost:3000/api/billing/webhook
```

Endpoint Produktion:

```text
https://deine-domain.tld/api/billing/webhook
```

Events abonnieren:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.finalized`
- `invoice.paid`
- `invoice.payment_failed`

Den Signing Secret als `STRIPE_WEBHOOK_SECRET` eintragen.

## 5) Schnelltest

1. Registrieren: `/signup`
2. Login und `app/konto/abo` öffnen
3. `Abo starten` klicken
4. Stripe Checkout abschließen (Testkarte)
5. Zurück in App und Status prüfen
6. Readiness prüfen: `GET /api/billing/readiness` (eingeloggt)

## 6) Relevante Endpoints

- `GET /api/billing/summary` (auth required)
- `GET /api/billing/readiness` (auth required)
- `POST /api/billing/checkout` (auth required)
- `POST /api/billing/portal` (auth required)
- `POST /api/billing/webhook` (Stripe signature required)
- `GET /api/admin/billing/webhook-events` (admin only)

## 7) Webhook-Resilienz

- Events werden in `billing_webhook_events` geloggt.
- Idempotenz: Bereits `processed` Events werden nicht erneut verarbeitet.
- Status-Lebenszyklus: `processing` -> `processed` oder `failed`.
- Wenn die Logging-Tabelle noch nicht deployed ist, bleibt die Verarbeitung fail-open aktiv.

## 8) Relevante UI Seiten

- `/signup` Konto erstellen
- `/app/konto` Konto-Overview
- `/app/konto/abo` Abo, Rechnungen, Kundenportal
