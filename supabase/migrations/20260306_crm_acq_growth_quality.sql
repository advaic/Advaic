begin;

alter table if exists public.crm_acq_activity_log
  add column if not exists segment_key text null,
  add column if not exists playbook_key text null,
  add column if not exists quality_objective_score integer null
    check (quality_objective_score is null or (quality_objective_score >= 0 and quality_objective_score <= 100)),
  add column if not exists postmortem_root_cause text null,
  add column if not exists postmortem_fix text null,
  add column if not exists postmortem_prevention text null,
  add column if not exists learning_applied boolean not null default false;

create index if not exists crm_acq_activity_log_agent_segment_idx
  on public.crm_acq_activity_log(agent_id, segment_key, occurred_at desc)
  where segment_key is not null;

create index if not exists crm_acq_activity_log_agent_playbook_idx
  on public.crm_acq_activity_log(agent_id, playbook_key, occurred_at desc)
  where playbook_key is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'crm_acq_negative_requires_postmortem'
      and conrelid = 'public.crm_acq_activity_log'::regclass
  ) then
    alter table public.crm_acq_activity_log
      add constraint crm_acq_negative_requires_postmortem
      check (
        outcome is distinct from 'negative'
        or (
          length(trim(coalesce(failure_reason, ''))) > 0
          and length(trim(coalesce(analysis_note, ''))) > 0
          and length(trim(coalesce(postmortem_root_cause, ''))) > 0
          and length(trim(coalesce(postmortem_fix, ''))) > 0
        )
      ) not valid;
  end if;
end $$;

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
  l.updated_at,
  l.segment_key,
  l.playbook_key,
  l.quality_objective_score,
  l.postmortem_root_cause,
  l.postmortem_fix,
  l.postmortem_prevention,
  l.learning_applied
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

commit;
