# Rollout Runbook: Follow-up Fenster + Feedback-Loop

Dieses Runbook deckt den produktiven Rollout der Migration `20260226_followups_windows_feedback.sql` ab und enthält die Abnahme für den kritischen Flow.

Hinweis: Technische Betriebsanleitung, keine Rechtsberatung.

## 1) Ziel des Rollouts

1. Neue Follow-up-Fenster-Regeln aktivieren (`Uhrzeit`, `Wochenende`, `Zeitzone`).
2. Qualitäts-Feedback je Antwort speichern (`helpful` / `not_helpful`).
3. Sicherstellen, dass kritische Pipeline-Pfade nach dem Rollout stabil laufen.

## 2) Vorbedingungen

1. Backup/Snapshot der Datenbank erstellt.
2. Service-Rolle und internes Pipeline-Secret vorhanden.
3. Staging oder Testprojekt einmalig erfolgreich durchlaufen.
4. App ist mit neuer Code-Version deployt.

## 3) Migration ausführen (Supabase SQL Editor)

Datei:
`supabase/migrations/20260226_followups_windows_feedback.sql`

Ausführen im produktiven Projekt und Erfolg prüfen.

## 4) Schema-Verifikation (SQL direkt danach)

```sql
-- A) Neue Spalten in agent_settings vorhanden
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'agent_settings'
  and column_name in (
    'followups_send_start_hour',
    'followups_send_end_hour',
    'followups_send_on_weekends',
    'followups_timezone'
  )
order by column_name;

-- B) Feedback-Tabelle + Indexe vorhanden
select tablename
from pg_tables
where schemaname = 'public'
  and tablename = 'message_feedback';

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'message_feedback'
order by indexname;

-- C) RLS aktiv?
select relname, relrowsecurity
from pg_class
where relname = 'message_feedback';
```

## 5) Funktions-Verifikation (manuell in der App)

1. `/app/follow-ups/settings` öffnen.
2. Versandfenster ändern (`08:00-20:00`, Wochenende aus, `Europe/Berlin`) und speichern.
3. `/app/nachrichten/[leadId]` öffnen:
   - Trust-Log zeigt QA/Grund konsistent.
   - Bereich "Entscheidungslogik" zeigt QA-Details.
   - Bereich "Qualitäts-Feedback" erlaubt `Hilfreich` / `Unpassend`.
4. `/app/admin/quality` öffnen:
   - Spalte `Negatives Feedback` sichtbar und plausibel.

## 6) Automatisierte Checks

### 6.1 Basis-Smoke

```bash
npm run smoke:e2e
```

### 6.2 Critical-Flow-Checks

```bash
# nur Route-/Contract-Checks
npm run critical:e2e
```

### 6.3 Critical-Flow mit Test-Session (empfohlen)

```bash
BASE_URL=http://127.0.0.1:4010 \
INTERNAL_SECRET=<ADVAIC_INTERNAL_PIPELINE_SECRET> \
NEXT_PUBLIC_SUPABASE_URL=<supabase_url> \
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
E2E_AGENT_ID=<bestehende_agent_uuid> \
npm run critical:e2e
```

Erwartung:
1. Contract-Checks grün.
2. Synthetische Session grün.
3. Ausgabe endet mit `Critical flow checks passed.`

## 7) Abnahme-Checklist

1. Migration erfolgreich ohne Fehler.
2. Neue Felder in `agent_settings` sichtbar.
3. `message_feedback` mit RLS + Indexen aktiv.
4. Follow-up Einstellungen speicherbar und wieder lesbar.
5. Feedback pro gesendeter Antwort speicherbar.
6. Admin Quality zeigt Feedback-Metrik.
7. `npm run smoke:e2e` erfolgreich.
8. `npm run critical:e2e` erfolgreich.

## 8) Rollback (falls notwendig)

Nur wenn unbedingt nötig und außerhalb Spitzenlast:

```sql
drop table if exists public.message_feedback cascade;

alter table if exists public.agent_settings
  drop column if exists followups_send_start_hour,
  drop column if exists followups_send_end_hour,
  drop column if exists followups_send_on_weekends,
  drop column if exists followups_timezone;
```

Danach App auf vorherige Version zurückrollen und Smoke erneut laufen lassen.

