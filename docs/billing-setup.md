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
STRIPE_TRIAL_DAYS=14                         # optional, default = 14
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # lokal
```

Hinweis: Für Produktion `sk_live_...` + echte Domain setzen.

Für Dunning-E-Mails (bei `invoice.payment_failed`) zusätzlich:

```bash
RESEND_API_KEY=re_...
ADVAIC_EMAIL_FROM="Advaic <billing@deine-domain.tld>"
```

## 3) SQL-Migration ausführen (Supabase)

Datei:

```text
supabase/migrations/20260223_billing_foundation.sql
supabase/migrations/20260224_billing_webhook_events.sql
supabase/migrations/20260225_billing_dunning.sql
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
- `billing_dunning_cases`

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

Hinweis Trial:
- Checkout vergibt den Trial nur für den ersten Subscription-Checkout pro Account (keine unbegrenzten Re-Trials).
- Dauer über `STRIPE_TRIAL_DAYS` steuerbar (`0` deaktiviert Trial komplett).

## 7) Webhook-Resilienz

- Events werden in `billing_webhook_events` geloggt.
- Idempotenz: Bereits `processed` Events werden nicht erneut verarbeitet.
- Status-Lebenszyklus: `processing` -> `processed` oder `failed`.
- Wenn die Logging-Tabelle noch nicht deployed ist, bleibt die Verarbeitung fail-open aktiv.

## 8) Dunning-Flow (Payment Failed)

- `invoice.payment_failed` schreibt/aktualisiert `billing_dunning_cases`.
- Bei aktivem Dunning wird im Konto-Bereich (`/app/konto/abo`) ein klarer Hinweis angezeigt.
- Zusätzlich wird (max. alle 24h oder bei neuer fehlgeschlagener Rechnung) eine E-Mail mit CTA zur Zahlungsaktualisierung gesendet.
- `invoice.paid` oder `customer.subscription.updated` mit `active/trialing` setzt Dunning wieder auf gelöst.

## 9) Relevante UI Seiten

- `/signup` Konto erstellen
- `/app/konto` Konto-Overview
- `/app/konto/abo` Abo, Rechnungen, Kundenportal

## 10) E-Mail Ingestion Keepalive (Gmail/Outlook)

Damit eingehende E-Mails dauerhaft reinkommen, müssen Watch-/Webhook-Subscriptions automatisch erneuert werden:

- Outlook Delta-Fetch: `POST /api/pipeline/outlook/fetch/run` (alle 5 Minuten)
- Outlook Subscriptions Renew/Recreate: `POST /api/pipeline/outlook/subscriptions/renew` (alle 6 Stunden)
- Gmail Watches Renew: `POST /api/gmail/renew-watches` (alle 6 Stunden)

Empfohlen: Supabase Cron Setup in `docs/supabase-cron-setup.md`.
GitHub-Schedule ist im Repo deaktiviert (Workflows nur noch manuell via `workflow_dispatch`).

Wichtig:
- Beide Renew-Routen akzeptieren `x-advaic-internal-secret` oder `Authorization: Bearer <CRON_SECRET>`.
- Wenn eine Subscription fehlt/abgelaufen ist, wird sie automatisch neu erstellt (Outlook) bzw. erneuert (Gmail).
- Für Gmail-Renew muss ein Topic verfügbar sein:
  `email_connections.watch_topic` oder `GMAIL_PUBSUB_TOPIC_NAME` oder `GCP_PROJECT_NUMBER/GCP_PROJECT_ID + GMAIL_PUBSUB_TOPIC_ID`.
