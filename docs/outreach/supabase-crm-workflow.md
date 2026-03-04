# Supabase CRM Workflow für Makler-Akquise (Tester-First)

## Zielbild
Du arbeitest mit einem leichten CRM direkt in Supabase, um Makler persönlich als Tester anzusprechen, sauber nachzuverfolgen und später in zahlende Kunden zu konvertieren.

## Enthaltenes Datenmodell
Die Migration erstellt:

1. `crm_prospects`: Zielmakler mit Fit-Score, Priorität, Stage, Hook
2. `crm_research_notes`: Recherche-Notizen und Quellen pro Makler
3. `crm_outreach_messages`: personalisierte Erstnachrichten und Follow-ups
4. `crm_outreach_events`: Events wie `message_sent`, `reply_received`, `pilot_started`
5. `crm_pilot_applications`: Pilotstatus und Zieldefinition
6. `crm_pilot_feedback`: strukturiertes Pilot-Feedback
7. `crm_next_actions` (View): empfohlene nächste Aktion pro Makler
8. `crm_followup_due` (View): fällige Follow-ups
9. `crm_conversion_funnel` (View): Conversion-Übersicht pro Agent
10. `crm_register_outreach_event(...)` (Function): Event loggen + Stage aktualisieren

## Deployment
SQL ausführen:

`supabase/migrations/20260304_crm_outreach_pilot_suite.sql`

Wenn du Supabase Studio nutzt: SQL Editor öffnen und die Datei ausführen.

## Zugriffsschutz (nur du)
Der CRM-Bereich ist doppelt geschützt:

1. App/API-Guard prüft auf Owner-User-ID.
2. RLS in den CRM-Tabellen erlaubt Zugriff nur für die Owner-User-ID.

Konfigurierbar über Env:

- `ADVAIC_OWNER_USER_ID` (empfohlen)
- Fallback: `ADMIN_DASHBOARD_USER_ID`

Wenn nichts gesetzt ist, greift der hinterlegte Owner-Fallback auf deine User-ID.

## Tester-First Prozess (ohne Kaufdruck)
1. Zielmakler als `crm_prospects` anlegen.
2. 2 bis 3 konkrete Beobachtungen als `crm_research_notes` hinterlegen.
3. Personalisierte Nachricht als `crm_outreach_messages` mit `status='ready'` speichern.
4. Beim Versand `crm_register_outreach_event(..., 'message_sent', ...)` aufrufen.
5. Bei Antwort `crm_register_outreach_event(..., 'reply_received', ...)` aufrufen.
6. Bei Pilotstart `crm_register_outreach_event(..., 'pilot_started', ...)` aufrufen.
7. Feedback in `crm_pilot_feedback` erfassen.

## Beispiel-SQL

### 1) Prospect anlegen
```sql
insert into public.crm_prospects (
  agent_id,
  company_name,
  contact_name,
  city,
  region,
  object_focus,
  fit_score,
  priority,
  personalization_hook,
  pain_point_hypothesis
) values (
  auth.uid(),
  'Muster Immobilien GmbH',
  'Lena Mustermann',
  'Berlin',
  'Berlin',
  'miete',
  84,
  'A',
  'Hoher Portal-Eingang mit vielen Besichtigungsanfragen',
  'Routineanfragen blockieren schnelle Erstreaktionen'
);
```

### 2) Personalisierte Erstnachricht speichern
```sql
insert into public.crm_outreach_messages (
  prospect_id,
  agent_id,
  channel,
  message_kind,
  subject,
  body,
  personalization_score,
  status
)
select
  p.id,
  p.agent_id,
  'email',
  'first_touch',
  'Kurzer Austausch zu Ihrem Vermietungsprozess',
  '...hier dein personalisierter Nachrichtentext...',
  90,
  'ready'
from public.crm_prospects p
where p.agent_id = auth.uid()
  and p.company_name = 'Muster Immobilien GmbH';
```

### 3) Versand-Event loggen und Stage aktualisieren
```sql
select public.crm_register_outreach_event(
  p_prospect_id := '<prospect_uuid>',
  p_agent_id := auth.uid(),
  p_event_type := 'message_sent',
  p_message_id := '<message_uuid>',
  p_details := 'Erstkontakt persönlich und ohne Kaufdruck versendet'
);
```

### 4) Antwort loggen
```sql
select public.crm_register_outreach_event(
  p_prospect_id := '<prospect_uuid>',
  p_agent_id := auth.uid(),
  p_event_type := 'reply_received',
  p_details := 'Interesse an Pilot mit vorsichtigem Start'
);
```

### 5) Nächste Aktionen ziehen
```sql
select
  prospect_id,
  company_name,
  contact_name,
  priority,
  fit_score,
  recommended_action,
  recommended_at
from public.crm_next_actions
where agent_id = auth.uid()
  and recommended_action is not null
order by priority asc, fit_score desc, recommended_at asc nulls last;
```

### 6) Fällige Follow-ups ziehen
```sql
select
  prospect_id,
  company_name,
  contact_name,
  recommended_action,
  recommended_at
from public.crm_followup_due
where agent_id = auth.uid()
order by recommended_at asc;
```

## Empfehlung für Ansprache
Für frühen Markteintritt besser:

1. Einladung als Tester statt Hard-Sell
2. Persönlicher Ton, klare Relevanz, keine Druck-CTA
3. Fokus auf gemeinsames Lernen und Pilot-Feedback
4. Erst nach Pilot einen kommerziellen Schritt anbieten

Das passt gut zu deinem aktuellen Produktstadium und erhöht Antwortquote und Vertrauen.
