begin;

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
    count(*) filter (where m.status = 'sent' and m.message_kind = 'follow_up_3') as follow_up_3_sent
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
  ev.last_reply_at,
  ev.last_call_booked_at,
  ev.last_bounce_at,
  case
    when p.object_focus = 'miete' then interval '3 days'
    when p.object_focus = 'kauf' then interval '4 days'
    when p.object_focus = 'neubau' then interval '5 days'
    else interval '4 days'
  end as follow_up_1_window,
  case
    when p.object_focus = 'miete' then interval '7 days'
    when p.object_focus = 'kauf' then interval '9 days'
    when p.object_focus = 'neubau' then interval '10 days'
    else interval '8 days'
  end as follow_up_2_window,
  case
    when p.object_focus = 'miete' then interval '12 days'
    when p.object_focus = 'kauf' then interval '16 days'
    when p.object_focus = 'neubau' then interval '18 days'
    else interval '14 days'
  end as follow_up_3_window,
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
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '3 days'
          when p.object_focus = 'kauf' then interval '4 days'
          when p.object_focus = 'neubau' then interval '5 days'
          else interval '4 days'
        end
      ) then 'Follow-up 1 senden'
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '7 days'
          when p.object_focus = 'kauf' then interval '9 days'
          when p.object_focus = 'neubau' then interval '10 days'
          else interval '8 days'
        end
      ) then 'Follow-up 2 senden'
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '12 days'
          when p.object_focus = 'kauf' then interval '16 days'
          when p.object_focus = 'neubau' then interval '18 days'
          else interval '14 days'
        end
      ) then 'Follow-up 3 senden'
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
    when coalesce(sc.first_touch_sent, 0) = 0
      then 'Es wurde noch keine Erstnachricht gesendet.'
    when coalesce(sc.follow_up_1_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '3 days'
          when p.object_focus = 'kauf' then interval '4 days'
          when p.object_focus = 'neubau' then interval '5 days'
          else interval '4 days'
        end
      ) then 'Follow-up-1-Fenster ist erreicht.'
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '7 days'
          when p.object_focus = 'kauf' then interval '9 days'
          when p.object_focus = 'neubau' then interval '10 days'
          else interval '8 days'
        end
      ) then 'Follow-up-2-Fenster ist erreicht.'
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '12 days'
          when p.object_focus = 'kauf' then interval '16 days'
          when p.object_focus = 'neubau' then interval '18 days'
          else interval '14 days'
        end
      ) then 'Follow-up-3-Fenster ist erreicht.'
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
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '3 days'
          when p.object_focus = 'kauf' then interval '4 days'
          when p.object_focus = 'neubau' then interval '5 days'
          else interval '4 days'
        end
      ) then 'send_follow_up_1'
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '7 days'
          when p.object_focus = 'kauf' then interval '9 days'
          when p.object_focus = 'neubau' then interval '10 days'
          else interval '8 days'
        end
      ) then 'send_follow_up_2'
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '12 days'
          when p.object_focus = 'kauf' then interval '16 days'
          when p.object_focus = 'neubau' then interval '18 days'
          else interval '14 days'
        end
      ) then 'send_follow_up_3'
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
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '3 days'
          when p.object_focus = 'kauf' then interval '4 days'
          when p.object_focus = 'neubau' then interval '5 days'
          else interval '4 days'
        end
      ) then 'Follow-up 1 erzeugen'
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '7 days'
          when p.object_focus = 'kauf' then interval '9 days'
          when p.object_focus = 'neubau' then interval '10 days'
          else interval '8 days'
        end
      ) then 'Follow-up 2 erzeugen'
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '12 days'
          when p.object_focus = 'kauf' then interval '16 days'
          when p.object_focus = 'neubau' then interval '18 days'
          else interval '14 days'
        end
      ) then 'Follow-up 3 erzeugen'
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
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '3 days'
          when p.object_focus = 'kauf' then interval '4 days'
          when p.object_focus = 'neubau' then interval '5 days'
          else interval '4 days'
        end
      ) then now()
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '7 days'
          when p.object_focus = 'kauf' then interval '9 days'
          when p.object_focus = 'neubau' then interval '10 days'
          else interval '8 days'
        end
      ) then now()
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - (
        case
          when p.object_focus = 'miete' then interval '12 days'
          when p.object_focus = 'kauf' then interval '16 days'
          when p.object_focus = 'neubau' then interval '18 days'
          else interval '14 days'
        end
      ) then now()
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
where recommended_code in ('send_follow_up_1', 'send_follow_up_2', 'send_follow_up_3')
  and recommended_at is not null
  and recommended_at <= now()
  and do_not_contact = false;

commit;
