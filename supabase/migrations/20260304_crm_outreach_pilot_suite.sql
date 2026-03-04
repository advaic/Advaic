create extension if not exists pgcrypto;

create table if not exists public.crm_prospects (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  company_name text not null,
  contact_name text null,
  contact_role text null,
  city text null,
  region text null,
  website_url text null,
  object_focus text not null default 'gemischt'
    check (object_focus in ('miete', 'kauf', 'neubau', 'gemischt')),
  target_group text null,
  process_hint text null,
  pain_point_hypothesis text null,
  personalization_hook text null,
  fit_score integer not null default 0 check (fit_score between 0 and 100),
  priority text not null default 'B' check (priority in ('A', 'B', 'C')),
  stage text not null default 'new'
    check (
      stage in (
        'new',
        'researching',
        'contacted',
        'replied',
        'pilot_invited',
        'pilot_active',
        'pilot_finished',
        'won',
        'lost',
        'nurture'
      )
    ),
  preferred_channel text not null default 'email'
    check (preferred_channel in ('email', 'telefon', 'linkedin', 'kontaktformular', 'whatsapp', 'sonstiges')),
  do_not_contact boolean not null default false,
  tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  last_contacted_at timestamptz null,
  next_action_at timestamptz null,
  next_action text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists crm_prospects_id_agent_unique
  on public.crm_prospects(id, agent_id);

create unique index if not exists crm_prospects_agent_company_city_unique
  on public.crm_prospects(agent_id, lower(company_name), coalesce(lower(city), ''));

create index if not exists crm_prospects_agent_stage_idx
  on public.crm_prospects(agent_id, stage, priority, fit_score desc);

create index if not exists crm_prospects_agent_next_action_idx
  on public.crm_prospects(agent_id, next_action_at asc nulls last);

create table if not exists public.crm_research_notes (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  agent_id uuid not null,
  source_type text not null default 'manual'
    check (source_type in ('website', 'linkedin', 'telefon', 'portal', 'manual', 'sonstiges')),
  source_url text null,
  note text not null,
  confidence numeric(4,3) null check (confidence is null or (confidence >= 0 and confidence <= 1)),
  is_key_insight boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_research_notes_prospect_agent_fk
    foreign key (prospect_id, agent_id)
    references public.crm_prospects(id, agent_id)
    on delete cascade
);

create index if not exists crm_research_notes_agent_prospect_idx
  on public.crm_research_notes(agent_id, prospect_id, created_at desc);

create table if not exists public.crm_outreach_messages (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  agent_id uuid not null,
  channel text not null
    check (channel in ('email', 'telefon', 'linkedin', 'kontaktformular', 'whatsapp', 'sonstiges')),
  message_kind text not null default 'custom'
    check (message_kind in ('first_touch', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'custom')),
  subject text null,
  body text not null,
  personalization_score integer null
    check (personalization_score is null or (personalization_score between 0 and 100)),
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'sent', 'failed', 'archived')),
  sent_at timestamptz null,
  external_message_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_outreach_messages_prospect_agent_fk
    foreign key (prospect_id, agent_id)
    references public.crm_prospects(id, agent_id)
    on delete cascade
);

create index if not exists crm_outreach_messages_agent_status_idx
  on public.crm_outreach_messages(agent_id, status, created_at desc);

create index if not exists crm_outreach_messages_agent_kind_idx
  on public.crm_outreach_messages(agent_id, message_kind, sent_at desc);

create table if not exists public.crm_outreach_events (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  agent_id uuid not null,
  message_id uuid null references public.crm_outreach_messages(id) on delete set null,
  event_type text not null
    check (
      event_type in (
        'message_sent',
        'message_failed',
        'reply_received',
        'call_booked',
        'pilot_invited',
        'pilot_accepted',
        'pilot_started',
        'pilot_completed',
        'deal_won',
        'deal_lost',
        'unsubscribed',
        'no_interest',
        'follow_up_due'
      )
    ),
  details text null,
  metadata jsonb not null default '{}'::jsonb,
  event_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_outreach_events_prospect_agent_fk
    foreign key (prospect_id, agent_id)
    references public.crm_prospects(id, agent_id)
    on delete cascade
);

create index if not exists crm_outreach_events_agent_event_idx
  on public.crm_outreach_events(agent_id, event_type, event_at desc);

create index if not exists crm_outreach_events_agent_prospect_idx
  on public.crm_outreach_events(agent_id, prospect_id, event_at desc);

create table if not exists public.crm_pilot_applications (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  agent_id uuid not null,
  status text not null default 'invited'
    check (status in ('invited', 'accepted', 'active', 'completed', 'declined', 'paused')),
  invited_at timestamptz null,
  accepted_at timestamptz null,
  started_at timestamptz null,
  completed_at timestamptz null,
  trial_goal text null,
  success_criteria text null,
  notes text null,
  feedback_summary text null,
  purchase_intent text not null default 'unknown'
    check (purchase_intent in ('unknown', 'low', 'medium', 'high')),
  recommended_plan text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_pilot_applications_prospect_agent_fk
    foreign key (prospect_id, agent_id)
    references public.crm_prospects(id, agent_id)
    on delete cascade
);

create unique index if not exists crm_pilot_applications_agent_prospect_unique
  on public.crm_pilot_applications(agent_id, prospect_id);

create index if not exists crm_pilot_applications_agent_status_idx
  on public.crm_pilot_applications(agent_id, status, updated_at desc);

create table if not exists public.crm_pilot_feedback (
  id uuid primary key default gen_random_uuid(),
  pilot_application_id uuid not null references public.crm_pilot_applications(id) on delete cascade,
  prospect_id uuid not null,
  agent_id uuid not null,
  feedback_type text not null
    check (feedback_type in ('positive', 'issue', 'feature_request', 'churn_risk', 'buy_signal')),
  rating integer null check (rating is null or (rating between 1 and 5)),
  title text null,
  description text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  action_recommendation text null,
  is_resolved boolean not null default false,
  resolved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_pilot_feedback_prospect_agent_fk
    foreign key (prospect_id, agent_id)
    references public.crm_prospects(id, agent_id)
    on delete cascade
);

create index if not exists crm_pilot_feedback_agent_open_idx
  on public.crm_pilot_feedback(agent_id, is_resolved, severity, created_at desc);

create or replace function public.crm_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_crm_prospects_updated_at on public.crm_prospects;
create trigger trg_crm_prospects_updated_at
before update on public.crm_prospects
for each row
execute function public.crm_set_updated_at();

drop trigger if exists trg_crm_research_notes_updated_at on public.crm_research_notes;
create trigger trg_crm_research_notes_updated_at
before update on public.crm_research_notes
for each row
execute function public.crm_set_updated_at();

drop trigger if exists trg_crm_outreach_messages_updated_at on public.crm_outreach_messages;
create trigger trg_crm_outreach_messages_updated_at
before update on public.crm_outreach_messages
for each row
execute function public.crm_set_updated_at();

drop trigger if exists trg_crm_outreach_events_updated_at on public.crm_outreach_events;
create trigger trg_crm_outreach_events_updated_at
before update on public.crm_outreach_events
for each row
execute function public.crm_set_updated_at();

drop trigger if exists trg_crm_pilot_applications_updated_at on public.crm_pilot_applications;
create trigger trg_crm_pilot_applications_updated_at
before update on public.crm_pilot_applications
for each row
execute function public.crm_set_updated_at();

drop trigger if exists trg_crm_pilot_feedback_updated_at on public.crm_pilot_feedback;
create trigger trg_crm_pilot_feedback_updated_at
before update on public.crm_pilot_feedback
for each row
execute function public.crm_set_updated_at();

create or replace function public.crm_register_outreach_event(
  p_prospect_id uuid,
  p_agent_id uuid,
  p_event_type text,
  p_message_id uuid default null,
  p_details text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_event_id uuid;
begin
  insert into public.crm_outreach_events (
    prospect_id,
    agent_id,
    message_id,
    event_type,
    details,
    metadata
  ) values (
    p_prospect_id,
    p_agent_id,
    p_message_id,
    p_event_type,
    p_details,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_event_id;

  update public.crm_prospects
  set
    stage = case
      when p_event_type = 'message_sent' and stage = 'new' then 'contacted'
      when p_event_type = 'reply_received' then 'replied'
      when p_event_type = 'pilot_invited' then 'pilot_invited'
      when p_event_type in ('pilot_accepted', 'pilot_started') then 'pilot_active'
      when p_event_type = 'pilot_completed' then 'pilot_finished'
      when p_event_type = 'deal_won' then 'won'
      when p_event_type in ('deal_lost', 'no_interest') then 'lost'
      else stage
    end,
    do_not_contact = case
      when p_event_type = 'unsubscribed' then true
      else do_not_contact
    end,
    last_contacted_at = case
      when p_event_type = 'message_sent' then now()
      else last_contacted_at
    end,
    next_action = case
      when p_event_type = 'reply_received' then 'Antwort auswerten und Pilot einladen'
      when p_event_type = 'call_booked' then 'Pilot-Call vorbereiten'
      when p_event_type = 'pilot_started' then 'Pilot aktiv begleiten'
      when p_event_type = 'pilot_completed' then 'Pilot auswerten und Abschlussgespräch führen'
      when p_event_type in ('deal_won', 'deal_lost', 'unsubscribed', 'no_interest') then null
      else next_action
    end,
    next_action_at = case
      when p_event_type in ('deal_won', 'deal_lost', 'unsubscribed', 'no_interest') then null
      when p_event_type = 'reply_received' then now()
      else next_action_at
    end
  where id = p_prospect_id and agent_id = p_agent_id;

  return v_event_id;
end;
$$;

create or replace view public.crm_next_actions
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
    max(e.event_at) filter (where e.event_type = 'call_booked') as last_call_booked_at
  from public.crm_outreach_events e
  group by e.prospect_id, e.agent_id
)
select
  p.id as prospect_id,
  p.agent_id,
  p.company_name,
  p.contact_name,
  p.city,
  p.region,
  p.object_focus,
  p.priority,
  p.fit_score,
  p.stage,
  p.do_not_contact,
  p.last_contacted_at,
  p.next_action as manual_next_action,
  p.next_action_at as manual_next_action_at,
  coalesce(sc.last_sent_at, p.last_contacted_at, p.created_at) as reference_last_touch_at,
  coalesce(sc.first_touch_sent, 0) as first_touch_sent,
  coalesce(sc.follow_up_1_sent, 0) as follow_up_1_sent,
  coalesce(sc.follow_up_2_sent, 0) as follow_up_2_sent,
  coalesce(sc.follow_up_3_sent, 0) as follow_up_3_sent,
  ev.last_reply_at,
  case
    when p.do_not_contact then null
    when p.stage in ('won', 'lost', 'pilot_finished') then null
    when coalesce(sc.first_touch_sent, 0) = 0 then 'Erstnachricht senden'
    when ev.last_reply_at is not null
      and ev.last_reply_at > coalesce(sc.last_sent_at, p.created_at) then 'Antwort eingegangen: Pilot einladen'
    when coalesce(sc.follow_up_1_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '3 days' then 'Follow-up 1 senden'
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '7 days' then 'Follow-up 2 senden'
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '14 days' then 'Follow-up 3 senden'
    when p.stage in ('replied', 'pilot_invited') then 'Pilot-Call terminieren'
    when p.stage = 'pilot_active' then 'Pilot-Fortschritt dokumentieren'
    else p.next_action
  end as recommended_action,
  case
    when p.do_not_contact then null
    when p.stage in ('won', 'lost', 'pilot_finished') then null
    when coalesce(sc.first_touch_sent, 0) = 0 then now()
    when ev.last_reply_at is not null
      and ev.last_reply_at > coalesce(sc.last_sent_at, p.created_at) then now()
    when coalesce(sc.follow_up_1_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '3 days' then now()
    when coalesce(sc.follow_up_1_sent, 0) > 0
      and coalesce(sc.follow_up_2_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '7 days' then now()
    when coalesce(sc.follow_up_2_sent, 0) > 0
      and coalesce(sc.follow_up_3_sent, 0) = 0
      and coalesce(sc.last_sent_at, p.created_at) <= now() - interval '14 days' then now()
    else p.next_action_at
  end as recommended_at
from public.crm_prospects p
left join sent_counts sc
  on sc.prospect_id = p.id and sc.agent_id = p.agent_id
left join events ev
  on ev.prospect_id = p.id and ev.agent_id = p.agent_id;

create or replace view public.crm_followup_due
with (security_invoker = true) as
select *
from public.crm_next_actions
where recommended_action like 'Follow-up %'
  and recommended_at is not null
  and recommended_at <= now()
  and do_not_contact = false;

create or replace view public.crm_conversion_funnel
with (security_invoker = true) as
select
  agent_id,
  count(*) as prospects_total,
  count(*) filter (where stage in ('contacted', 'replied', 'pilot_invited', 'pilot_active', 'pilot_finished', 'won')) as contacted_total,
  count(*) filter (where stage in ('replied', 'pilot_invited', 'pilot_active', 'pilot_finished', 'won')) as replied_total,
  count(*) filter (where stage in ('pilot_invited', 'pilot_active', 'pilot_finished', 'won')) as pilot_invited_total,
  count(*) filter (where stage in ('pilot_active', 'pilot_finished', 'won')) as pilot_active_total,
  count(*) filter (where stage = 'won') as won_total,
  count(*) filter (where stage = 'lost') as lost_total
from public.crm_prospects
group by agent_id;

create or replace function public.crm_owner_user_id()
returns uuid
language sql
stable
as $$
  select '3582c768-0edd-4536-9501-268b881599df'::uuid;
$$;

create or replace function public.crm_owner_can_access(p_agent_id uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
    and auth.uid() = p_agent_id
    and auth.uid() = public.crm_owner_user_id();
$$;

alter table public.crm_prospects enable row level security;
alter table public.crm_research_notes enable row level security;
alter table public.crm_outreach_messages enable row level security;
alter table public.crm_outreach_events enable row level security;
alter table public.crm_pilot_applications enable row level security;
alter table public.crm_pilot_feedback enable row level security;

drop policy if exists crm_prospects_select_own on public.crm_prospects;
create policy crm_prospects_select_own
  on public.crm_prospects
  for select
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_prospects_insert_own on public.crm_prospects;
create policy crm_prospects_insert_own
  on public.crm_prospects
  for insert
  to authenticated
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_prospects_update_own on public.crm_prospects;
create policy crm_prospects_update_own
  on public.crm_prospects
  for update
  to authenticated
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_prospects_delete_own on public.crm_prospects;
create policy crm_prospects_delete_own
  on public.crm_prospects
  for delete
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_research_notes_select_own on public.crm_research_notes;
create policy crm_research_notes_select_own
  on public.crm_research_notes
  for select
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_research_notes_insert_own on public.crm_research_notes;
create policy crm_research_notes_insert_own
  on public.crm_research_notes
  for insert
  to authenticated
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_research_notes_update_own on public.crm_research_notes;
create policy crm_research_notes_update_own
  on public.crm_research_notes
  for update
  to authenticated
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_research_notes_delete_own on public.crm_research_notes;
create policy crm_research_notes_delete_own
  on public.crm_research_notes
  for delete
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_outreach_messages_select_own on public.crm_outreach_messages;
create policy crm_outreach_messages_select_own
  on public.crm_outreach_messages
  for select
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_outreach_messages_insert_own on public.crm_outreach_messages;
create policy crm_outreach_messages_insert_own
  on public.crm_outreach_messages
  for insert
  to authenticated
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_outreach_messages_update_own on public.crm_outreach_messages;
create policy crm_outreach_messages_update_own
  on public.crm_outreach_messages
  for update
  to authenticated
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_outreach_messages_delete_own on public.crm_outreach_messages;
create policy crm_outreach_messages_delete_own
  on public.crm_outreach_messages
  for delete
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_outreach_events_select_own on public.crm_outreach_events;
create policy crm_outreach_events_select_own
  on public.crm_outreach_events
  for select
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_outreach_events_insert_own on public.crm_outreach_events;
create policy crm_outreach_events_insert_own
  on public.crm_outreach_events
  for insert
  to authenticated
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_outreach_events_update_own on public.crm_outreach_events;
create policy crm_outreach_events_update_own
  on public.crm_outreach_events
  for update
  to authenticated
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_outreach_events_delete_own on public.crm_outreach_events;
create policy crm_outreach_events_delete_own
  on public.crm_outreach_events
  for delete
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_pilot_applications_select_own on public.crm_pilot_applications;
create policy crm_pilot_applications_select_own
  on public.crm_pilot_applications
  for select
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_pilot_applications_insert_own on public.crm_pilot_applications;
create policy crm_pilot_applications_insert_own
  on public.crm_pilot_applications
  for insert
  to authenticated
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_pilot_applications_update_own on public.crm_pilot_applications;
create policy crm_pilot_applications_update_own
  on public.crm_pilot_applications
  for update
  to authenticated
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_pilot_applications_delete_own on public.crm_pilot_applications;
create policy crm_pilot_applications_delete_own
  on public.crm_pilot_applications
  for delete
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_pilot_feedback_select_own on public.crm_pilot_feedback;
create policy crm_pilot_feedback_select_own
  on public.crm_pilot_feedback
  for select
  to authenticated
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_pilot_feedback_insert_own on public.crm_pilot_feedback;
create policy crm_pilot_feedback_insert_own
  on public.crm_pilot_feedback
  for insert
  to authenticated
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_pilot_feedback_update_own on public.crm_pilot_feedback;
create policy crm_pilot_feedback_update_own
  on public.crm_pilot_feedback
  for update
  to authenticated
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_pilot_feedback_delete_own on public.crm_pilot_feedback;
create policy crm_pilot_feedback_delete_own
  on public.crm_pilot_feedback
  for delete
  to authenticated
  using (public.crm_owner_can_access(agent_id));

revoke all on function public.crm_register_outreach_event(uuid, uuid, text, uuid, text, jsonb) from public;
grant execute on function public.crm_register_outreach_event(uuid, uuid, text, uuid, text, jsonb) to authenticated;
grant execute on function public.crm_register_outreach_event(uuid, uuid, text, uuid, text, jsonb) to service_role;
