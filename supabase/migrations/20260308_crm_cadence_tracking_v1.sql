begin;

alter table if exists public.crm_prospects
  add column if not exists contact_email text null;

alter table if exists public.crm_outreach_messages
  add column if not exists cadence_key text null,
  add column if not exists cadence_step smallint null
    check (cadence_step is null or (cadence_step >= 1 and cadence_step <= 5)),
  add column if not exists ab_intro_variant text null,
  add column if not exists ab_trigger_variant text null,
  add column if not exists ab_cta_variant text null,
  add column if not exists ab_subject_variant text null,
  add column if not exists trigger_evidence_count integer null
    check (trigger_evidence_count is null or trigger_evidence_count >= 0),
  add column if not exists first_touch_guardrail_pass boolean null;

create index if not exists crm_outreach_messages_agent_cadence_idx
  on public.crm_outreach_messages(agent_id, cadence_key, cadence_step, created_at desc)
  where cadence_key is not null;

create index if not exists crm_outreach_messages_agent_ab_idx
  on public.crm_outreach_messages(
    agent_id,
    ab_intro_variant,
    ab_trigger_variant,
    ab_cta_variant,
    ab_subject_variant,
    created_at desc
  )
  where ab_intro_variant is not null
     or ab_trigger_variant is not null
     or ab_cta_variant is not null
     or ab_subject_variant is not null;

drop view if exists public.crm_followup_due;
drop view if exists public.crm_next_actions;

create view public.crm_next_actions
with (security_invoker = true) as
with sent_counts as (
  select
    m.prospect_id,
    m.agent_id,
    max(m.sent_at) filter (where m.status = 'sent') as last_sent_at,
    count(*) filter (where m.status = 'sent' and m.message_kind = 'first_touch') as first_touch_sent,
    count(*) filter (where m.status = 'sent' and m.message_kind = 'follow_up_1') as follow_up_1_sent,
    count(*) filter (where m.status = 'sent' and m.message_kind = 'follow_up_2') as follow_up_2_sent,
    count(*) filter (where m.status = 'sent' and m.message_kind = 'follow_up_3') as follow_up_3_sent,
    count(*) filter (
      where m.status = 'sent'
        and m.message_kind = 'custom'
        and coalesce(m.metadata ->> 'cadence_step', '') = '5'
    ) as breakup_sent
  from public.crm_outreach_messages m
  group by m.prospect_id, m.agent_id
),
events as (
  select
    e.prospect_id,
    e.agent_id,
    max(e.event_at) filter (where e.event_type = 'reply_received') as last_reply_at,
    max(e.event_at) filter (where e.event_type = 'call_booked') as last_call_booked_at,
    max(e.event_at) filter (
      where e.event_type = 'message_failed'
        and coalesce((e.metadata ->> 'bounce_detected')::boolean, false) = true
    ) as last_bounce_at,
    max(e.event_at) filter (where e.event_type in ('unsubscribed', 'no_interest')) as last_stop_event_at
  from public.crm_outreach_events e
  group by e.prospect_id, e.agent_id
)
select
  p.id as prospect_id,
  p.agent_id,
  p.company_name,
  p.contact_name,
  p.contact_email,
  p.city,
  p.region,
  p.object_focus,
  p.preferred_channel,
  p.priority,
  p.fit_score,
  p.stage,
  p.do_not_contact,
  p.last_contacted_at,
  p.next_action as manual_next_action,
  p.next_action_at as manual_next_action_at,
  p.personalization_hook,
  p.pain_point_hypothesis,
  coalesce(sc.last_sent_at, p.last_contacted_at, p.created_at) as reference_last_touch_at,
  coalesce(sc.first_touch_sent, 0) as first_touch_sent,
  coalesce(sc.follow_up_1_sent, 0) as follow_up_1_sent,
  coalesce(sc.follow_up_2_sent, 0) as follow_up_2_sent,
  coalesce(sc.follow_up_3_sent, 0) as follow_up_3_sent,
  coalesce(sc.breakup_sent, 0) as breakup_sent,
  ev.last_reply_at,
  ev.last_call_booked_at,
  ev.last_bounce_at,
  interval '2 days' as follow_up_1_window,
  interval '5 days' as follow_up_2_window,
  interval '9 days' as follow_up_3_window,
  interval '13 days' as breakup_window,
  case
    when p.do_not_contact then null
    when p.stage in ('won', 'lost', 'pilot_finished') then null
    when ev.last_stop_event_at is not null then null
    when ev.last_bounce_at is not null
      and ev.last_bounce_at > coalesce(sc.last_sent_at, p.created_at) then 'E-Mail-Zustellung fehlgeschlagen: alternativen Kanal nutzen'
    when ev.last_reply_at is not null
      and ev.last_reply_at > coalesce(sc.last_sent_at, p.created_at) then 'Antwort eingegangen: Pilot einladen'
    when coalesce(sc.first_touch_sent, 0) = 0 then 'Erstnachricht senden'
    when coalesce(sc.follow_up_1_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '2 days' then 'Follow-up 1 senden'
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '5 days' then 'Follow-up 2 senden'
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '9 days' then 'Follow-up 3 senden'
    when coalesce(sc.follow_up_3_sent, 0) > 0
      and coalesce(sc.breakup_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '13 days' then 'Abschlussnachricht senden'
    when p.stage in ('replied', 'pilot_invited') then 'Pilot-Call terminieren'
    when p.stage = 'pilot_active' then 'Pilot-Fortschritt dokumentieren'
    else p.next_action
  end as recommended_action,
  case
    when p.do_not_contact then null
    when p.stage in ('won', 'lost', 'pilot_finished') then null
    when ev.last_stop_event_at is not null then null
    when ev.last_bounce_at is not null
      and ev.last_bounce_at > coalesce(sc.last_sent_at, p.created_at)
      then 'Bounce/NDR erkannt. Stoppe E-Mail-Sequenz und wechsle zu Telefon, LinkedIn oder Kontaktformular.'
    when ev.last_reply_at is not null
      and ev.last_reply_at > coalesce(sc.last_sent_at, p.created_at)
      then 'Der Interessent hat geantwortet. Follow-up stoppen und direkt Pilot-Einladung vorbereiten.'
    when coalesce(sc.first_touch_sent, 0) = 0 then 'Es wurde noch keine Erstnachricht gesendet.'
    when coalesce(sc.follow_up_1_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '2 days' then 'Follow-up-1-Fenster ist erreicht.'
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '5 days' then 'Follow-up-2-Fenster ist erreicht.'
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '9 days' then 'Follow-up-3-Fenster ist erreicht.'
    when coalesce(sc.follow_up_3_sent, 0) > 0
      and coalesce(sc.breakup_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '13 days' then 'Breakup-Fenster ist erreicht.'
    when p.stage in ('replied', 'pilot_invited') then 'Nächster Schritt: Termin zur Pilot-Besprechung.'
    when p.stage = 'pilot_active' then 'Pilot läuft bereits, Fortschritt dokumentieren.'
    else coalesce(p.next_action, 'Keine offene Aktion')
  end as recommended_reason,
  case
    when p.do_not_contact then null
    when p.stage in ('won', 'lost', 'pilot_finished') then null
    when ev.last_stop_event_at is not null then null
    when ev.last_bounce_at is not null
      and ev.last_bounce_at > coalesce(sc.last_sent_at, p.created_at) then 'switch_channel_after_bounce'
    when ev.last_reply_at is not null
      and ev.last_reply_at > coalesce(sc.last_sent_at, p.created_at) then 'invite_pilot_after_reply'
    when coalesce(sc.first_touch_sent, 0) = 0 then 'send_first_touch'
    when coalesce(sc.follow_up_1_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '2 days' then 'send_follow_up_1'
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '5 days' then 'send_follow_up_2'
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '9 days' then 'send_follow_up_3'
    when coalesce(sc.follow_up_3_sent, 0) > 0
      and coalesce(sc.breakup_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '13 days' then 'send_breakup_touch'
    when p.stage in ('replied', 'pilot_invited') then 'schedule_pilot_call'
    when p.stage = 'pilot_active' then 'track_pilot_progress'
    when p.next_action is not null then 'manual'
    else null
  end as recommended_code,
  case
    when p.do_not_contact then null
    when p.stage in ('won', 'lost', 'pilot_finished') then null
    when ev.last_stop_event_at is not null then null
    when ev.last_bounce_at is not null
      and ev.last_bounce_at > coalesce(sc.last_sent_at, p.created_at) then 'Kanal wechseln'
    when ev.last_reply_at is not null
      and ev.last_reply_at > coalesce(sc.last_sent_at, p.created_at) then 'Pilot einladen'
    when coalesce(sc.first_touch_sent, 0) = 0 then 'Erstnachricht vorbereiten'
    when coalesce(sc.follow_up_1_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '2 days' then 'Follow-up 1 erzeugen'
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '5 days' then 'Follow-up 2 erzeugen'
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '9 days' then 'Follow-up 3 erzeugen'
    when coalesce(sc.follow_up_3_sent, 0) > 0
      and coalesce(sc.breakup_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '13 days' then 'Breakup erzeugen'
    when p.stage in ('replied', 'pilot_invited') then 'Call terminieren'
    when p.stage = 'pilot_active' then 'Pilot-Fortschritt pflegen'
    else 'Öffnen'
  end as recommended_primary_label,
  case
    when p.do_not_contact then null
    when p.stage in ('won', 'lost', 'pilot_finished') then null
    when ev.last_stop_event_at is not null then null
    when ev.last_bounce_at is not null
      and ev.last_bounce_at > coalesce(sc.last_sent_at, p.created_at) then now()
    when ev.last_reply_at is not null
      and ev.last_reply_at > coalesce(sc.last_sent_at, p.created_at) then now()
    when coalesce(sc.first_touch_sent, 0) = 0 then now()
    when coalesce(sc.follow_up_1_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '2 days' then now()
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '5 days' then now()
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '9 days' then now()
    when coalesce(sc.follow_up_3_sent, 0) > 0
      and coalesce(sc.breakup_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '13 days' then now()
    else p.next_action_at
  end as recommended_at
from public.crm_prospects p
left join sent_counts sc
  on sc.prospect_id = p.id and sc.agent_id = p.agent_id
left join events ev
  on ev.prospect_id = p.id and ev.agent_id = p.agent_id;

create view public.crm_followup_due
with (security_invoker = true) as
select *
from public.crm_next_actions
where recommended_code in ('send_follow_up_1', 'send_follow_up_2', 'send_follow_up_3', 'send_breakup_touch')
  and recommended_at is not null
  and recommended_at <= now()
  and do_not_contact = false;

commit;
