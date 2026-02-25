# Supabase Cron Setup

Dieser Setup ersetzt GitHub-Cron durch Supabase `pg_cron` + `pg_net`.

## 1) Voraussetzungen

- `NEXT_PUBLIC_SITE_URL` muss auf deine Produktions-Domain zeigen, z. B. `https://app.advaic.com`
- `ADVAIC_INTERNAL_PIPELINE_SECRET` muss gesetzt sein und zu deinem API-Server passen
- Die API-Routen müssen aus Supabase erreichbar sein (öffentliche HTTPS-Domain)

## 2) SQL in Supabase ausführen

Den kompletten Block in Supabase SQL Editor ausführen und `base_url` + `internal_secret` anpassen.

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  base_url text := 'https://YOUR_DOMAIN';
  internal_secret text := 'YOUR_INTERNAL_SECRET';
  immoscout_sync_secret text := 'YOUR_IMMOSCOUT_SYNC_SECRET';
begin
  -- Clean old jobs (idempotent)
  perform cron.unschedule(jobid)
  from cron.job
  where jobname in (
    'advaic_outlook_fetch_5m',
    'advaic_outlook_subscriptions_renew_6h',
    'advaic_gmail_watches_renew_6h',
    'advaic_immoscout_sync_5m',
    'advaic_reply_ready_send_1m',
    'advaic_followups_5m',
    'advaic_onboarding_recovery_10m',
    'advaic_ops_alerts_5m'
  );

  -- 1) Outlook fetch/delta every 5 min
  perform cron.schedule(
    'advaic_outlook_fetch_5m',
    '*/5 * * * *',
    format(
      $job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-advaic-internal-secret', %L
        ),
        body := '{}'::jsonb
      );
      $job$,
      base_url || '/api/pipeline/outlook/fetch/run',
      internal_secret
    )
  );

  -- 2) Outlook subscription renew/recreate every 6 hours
  perform cron.schedule(
    'advaic_outlook_subscriptions_renew_6h',
    '0 */6 * * *',
    format(
      $job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-advaic-internal-secret', %L
        ),
        body := '{}'::jsonb
      );
      $job$,
      base_url || '/api/pipeline/outlook/subscriptions/renew',
      internal_secret
    )
  );

  -- 3) Gmail watch renew every 6 hours
  perform cron.schedule(
    'advaic_gmail_watches_renew_6h',
    '0 */6 * * *',
    format(
      $job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-advaic-internal-secret', %L
        ),
        body := '{}'::jsonb
      );
      $job$,
      base_url || '/api/gmail/renew-watches',
      internal_secret
    )
  );

  -- Optional: ImmoScout sync every 5 min (enabled by default here)
  -- Wenn du ImmoScout nicht nutzt, diesen Block entfernen.
  perform cron.schedule(
    'advaic_immoscout_sync_5m',
    '*/5 * * * *',
    format(
      $job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', %L
        ),
        body := '{}'::jsonb
      );
      $job$,
      base_url || '/api/pipeline/immoscout/sync',
      'Bearer ' || immoscout_sync_secret
    )
  );

  -- 5) Reply-ready sender every minute
  perform cron.schedule(
    'advaic_reply_ready_send_1m',
    '* * * * *',
    format(
      $job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-advaic-internal-secret', %L
        ),
        body := '{}'::jsonb
      );
      $job$,
      base_url || '/api/pipeline/reply-ready/send/run',
      internal_secret
    )
  );

  -- 6) Follow-ups every 5 minutes
  perform cron.schedule(
    'advaic_followups_5m',
    '*/5 * * * *',
    format(
      $job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-advaic-internal-secret', %L
        ),
        body := '{}'::jsonb
      );
      $job$,
      base_url || '/api/pipeline/followups/run',
      internal_secret
    )
  );

  -- 7) Onboarding recovery every 10 minutes
  perform cron.schedule(
    'advaic_onboarding_recovery_10m',
    '*/10 * * * *',
    format(
      $job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-advaic-internal-secret', %L
        ),
        body := jsonb_build_object('limit', 80)
      );
      $job$,
      base_url || '/api/pipeline/onboarding-recovery/run',
      internal_secret
    )
  );

  -- 8) Ops alerts every 5 minutes (kann kritische Flows automatisch pausieren)
  perform cron.schedule(
    'advaic_ops_alerts_5m',
    '*/5 * * * *',
    format(
      $job$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-advaic-internal-secret', %L
        ),
        body := jsonb_build_object('auto_pause', true)
      );
      $job$,
      base_url || '/api/pipeline/ops/alerts/run',
      internal_secret
    )
  );
end $$;
```

## 3) Kontrolle

Aktive Jobs prüfen:

```sql
select jobid, jobname, schedule, active
from cron.job
order by jobname;
```

HTTP-Antworten prüfen:

```sql
select id, status_code, content, created
from net._http_response
order by created desc
limit 50;
```

Pipeline-Run-Logs prüfen:

```sql
select created_at, pipeline, status, processed, success, failed, skipped, duration_ms
from public.pipeline_runs
order by created_at desc
limit 100;
```

Offene Ops-Alerts prüfen:

```sql
select alert_key, severity, status, first_opened_at, last_fired_at
from public.ops_alert_events
where status = 'open'
order by last_fired_at desc;
```

## 4) Hinweis zu Gmail Topic

Damit `api/gmail/renew-watches` erfolgreich ist, braucht jede Connection ein Topic:

- `email_connections.watch_topic` gesetzt
- oder `GMAIL_PUBSUB_TOPIC_NAME`
- oder `GCP_PROJECT_ID`/`GCP_PROJECT_NUMBER` + `GMAIL_PUBSUB_TOPIC_ID`

## 5) Notfall-Bedienung

- UI: `/app/admin/ops`
- API:
  - `POST /api/admin/ops/control` (Pause/Fortsetzen)
  - `POST /api/admin/ops/alerts/trigger` (Alert-Regeln manuell prüfen)

Bei kritischen Alerts pausiert das System automatisch `reply_ready_send` und `followups`.
Danach Ursache beheben, in `/app/admin/ops` prüfen und gezielt wieder freigeben.
