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
    'advaic_immoscout_sync_5m'
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

## 4) Hinweis zu Gmail Topic

Damit `api/gmail/renew-watches` erfolgreich ist, braucht jede Connection ein Topic:

- `email_connections.watch_topic` gesetzt
- oder `GMAIL_PUBSUB_TOPIC_NAME`
- oder `GCP_PROJECT_ID`/`GCP_PROJECT_NUMBER` + `GMAIL_PUBSUB_TOPIC_ID`
