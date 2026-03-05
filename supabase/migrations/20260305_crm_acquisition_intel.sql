begin;

create table if not exists public.crm_acq_activity_log (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  prospect_id uuid null references public.crm_prospects(id) on delete set null,
  occurred_at timestamptz not null default now(),
  channel text not null
    check (channel in ('email', 'linkedin', 'telefon', 'kontaktformular', 'meeting', 'whatsapp', 'sonstiges')),
  action_type text not null
    check (
      action_type in (
        'outbound_sent',
        'outbound_manual',
        'reply_received',
        'no_reply',
        'followup_planned',
        'followup_sent',
        'call_booked',
        'call_completed',
        'objection_logged',
        'pilot_invited',
        'pilot_started',
        'pilot_won',
        'pilot_lost',
        'opt_out',
        'bounce'
      )
    ),
  stage_before text null,
  stage_after text null,
  template_variant text null,
  cta_type text null
    check (
      cta_type is null or
      cta_type in (
        'kurze_mail_antwort',
        '15_min_call',
        'video_link',
        'formular_antwort',
        'linkedin_reply',
        'telefon_termin',
        'other'
      )
    ),
  outcome text null
    check (outcome is null or outcome in ('positive', 'neutral', 'negative', 'pending')),
  response_time_hours numeric(8,2) null,
  personalization_depth integer null
    check (personalization_depth is null or (personalization_depth between 0 and 100)),
  quality_self_score integer null
    check (quality_self_score is null or (quality_self_score between 0 and 100)),
  failure_reason text null,
  winning_signal text null,
  hypothesis text null,
  analysis_note text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_acq_activity_log_agent_time_idx
  on public.crm_acq_activity_log(agent_id, occurred_at desc);

create index if not exists crm_acq_activity_log_agent_channel_idx
  on public.crm_acq_activity_log(agent_id, channel, occurred_at desc);

create index if not exists crm_acq_activity_log_agent_template_idx
  on public.crm_acq_activity_log(agent_id, template_variant, occurred_at desc)
  where template_variant is not null;

create index if not exists crm_acq_activity_log_agent_prospect_idx
  on public.crm_acq_activity_log(agent_id, prospect_id, occurred_at desc)
  where prospect_id is not null;

create or replace view public.crm_acq_activity_log_enriched as
select
  l.id,
  l.agent_id,
  l.prospect_id,
  p.company_name,
  p.contact_name,
  p.priority,
  p.fit_score,
  p.object_focus,
  l.occurred_at,
  l.channel,
  l.action_type,
  l.stage_before,
  l.stage_after,
  l.template_variant,
  l.cta_type,
  l.outcome,
  l.response_time_hours,
  l.personalization_depth,
  l.quality_self_score,
  l.failure_reason,
  l.winning_signal,
  l.hypothesis,
  l.analysis_note,
  l.metadata,
  l.created_at,
  l.updated_at
from public.crm_acq_activity_log l
left join public.crm_prospects p
  on p.id = l.prospect_id
 and p.agent_id = l.agent_id;

alter table if exists public.crm_acq_activity_log enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_acq_activity_log'
      and policyname = 'crm_acq_activity_log_select_owner'
  ) then
    create policy crm_acq_activity_log_select_owner
      on public.crm_acq_activity_log
      for select
      using (public.crm_owner_can_access(agent_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_acq_activity_log'
      and policyname = 'crm_acq_activity_log_insert_owner'
  ) then
    create policy crm_acq_activity_log_insert_owner
      on public.crm_acq_activity_log
      for insert
      with check (public.crm_owner_can_access(agent_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_acq_activity_log'
      and policyname = 'crm_acq_activity_log_update_owner'
  ) then
    create policy crm_acq_activity_log_update_owner
      on public.crm_acq_activity_log
      for update
      using (public.crm_owner_can_access(agent_id))
      with check (public.crm_owner_can_access(agent_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_acq_activity_log'
      and policyname = 'crm_acq_activity_log_delete_owner'
  ) then
    create policy crm_acq_activity_log_delete_owner
      on public.crm_acq_activity_log
      for delete
      using (public.crm_owner_can_access(agent_id));
  end if;
end $$;

drop trigger if exists trg_crm_acq_activity_log_updated_at on public.crm_acq_activity_log;
create trigger trg_crm_acq_activity_log_updated_at
before update on public.crm_acq_activity_log
for each row execute function public.set_updated_at();

commit;

