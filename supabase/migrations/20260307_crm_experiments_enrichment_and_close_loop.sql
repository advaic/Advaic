begin;

create table if not exists public.crm_sequence_rollouts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  message_kind text not null
    check (message_kind in ('first_touch', 'follow_up_1', 'follow_up_2', 'follow_up_3')),
  winner_variant text not null,
  confidence numeric(4,3) not null default 0.5
    check (confidence >= 0 and confidence <= 1),
  sample_size integer not null default 0
    check (sample_size >= 0),
  stats jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_sequence_rollouts_agent_kind_unique unique (agent_id, message_kind)
);

create index if not exists crm_sequence_rollouts_agent_active_idx
  on public.crm_sequence_rollouts(agent_id, is_active, updated_at desc);

create table if not exists public.crm_enrichment_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  trigger_type text not null default 'manual'
    check (trigger_type in ('manual', 'pipeline', 'scheduled')),
  scanned_count integer not null default 0 check (scanned_count >= 0),
  selected_count integer not null default 0 check (selected_count >= 0),
  enriched_count integer not null default 0 check (enriched_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  stale_days integer not null default 21 check (stale_days >= 1 and stale_days <= 365),
  force_mode boolean not null default false,
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_enrichment_runs_agent_started_idx
  on public.crm_enrichment_runs(agent_id, started_at desc);

create index if not exists crm_outreach_messages_agent_template_variant_idx
  on public.crm_outreach_messages(agent_id, (metadata ->> 'template_variant'), created_at desc)
  where (metadata ? 'template_variant');

alter table if exists public.crm_sequence_rollouts enable row level security;
alter table if exists public.crm_enrichment_runs enable row level security;

drop policy if exists crm_sequence_rollouts_select_owner on public.crm_sequence_rollouts;
create policy crm_sequence_rollouts_select_owner
  on public.crm_sequence_rollouts
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_sequence_rollouts_insert_owner on public.crm_sequence_rollouts;
create policy crm_sequence_rollouts_insert_owner
  on public.crm_sequence_rollouts
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_sequence_rollouts_update_owner on public.crm_sequence_rollouts;
create policy crm_sequence_rollouts_update_owner
  on public.crm_sequence_rollouts
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_sequence_rollouts_delete_owner on public.crm_sequence_rollouts;
create policy crm_sequence_rollouts_delete_owner
  on public.crm_sequence_rollouts
  for delete
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_enrichment_runs_select_owner on public.crm_enrichment_runs;
create policy crm_enrichment_runs_select_owner
  on public.crm_enrichment_runs
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_enrichment_runs_insert_owner on public.crm_enrichment_runs;
create policy crm_enrichment_runs_insert_owner
  on public.crm_enrichment_runs
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_enrichment_runs_update_owner on public.crm_enrichment_runs;
create policy crm_enrichment_runs_update_owner
  on public.crm_enrichment_runs
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_enrichment_runs_delete_owner on public.crm_enrichment_runs;
create policy crm_enrichment_runs_delete_owner
  on public.crm_enrichment_runs
  for delete
  using (public.crm_owner_can_access(agent_id));

drop trigger if exists trg_crm_sequence_rollouts_updated_at on public.crm_sequence_rollouts;
create trigger trg_crm_sequence_rollouts_updated_at
before update on public.crm_sequence_rollouts
for each row execute function public.set_updated_at();

drop trigger if exists trg_crm_enrichment_runs_updated_at on public.crm_enrichment_runs;
create trigger trg_crm_enrichment_runs_updated_at
before update on public.crm_enrichment_runs
for each row execute function public.set_updated_at();

commit;
