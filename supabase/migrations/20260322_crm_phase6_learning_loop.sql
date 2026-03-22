begin;

create table if not exists public.crm_learning_snapshots (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  is_current boolean not null default true,
  lookback_days integer not null default 120 check (lookback_days >= 14 and lookback_days <= 365),
  summary jsonb not null default '{}'::jsonb,
  insights jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_learning_snapshots_agent_computed_idx
  on public.crm_learning_snapshots(agent_id, computed_at desc);

create unique index if not exists crm_learning_snapshots_current_unique
  on public.crm_learning_snapshots(agent_id)
  where is_current = true;

alter table if exists public.crm_learning_snapshots enable row level security;

drop policy if exists crm_learning_snapshots_select_owner on public.crm_learning_snapshots;
create policy crm_learning_snapshots_select_owner
  on public.crm_learning_snapshots
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_learning_snapshots_insert_owner on public.crm_learning_snapshots;
create policy crm_learning_snapshots_insert_owner
  on public.crm_learning_snapshots
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_learning_snapshots_update_owner on public.crm_learning_snapshots;
create policy crm_learning_snapshots_update_owner
  on public.crm_learning_snapshots
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_learning_snapshots_delete_owner on public.crm_learning_snapshots;
create policy crm_learning_snapshots_delete_owner
  on public.crm_learning_snapshots
  for delete
  using (public.crm_owner_can_access(agent_id));

drop trigger if exists trg_crm_learning_snapshots_updated_at on public.crm_learning_snapshots;
create trigger trg_crm_learning_snapshots_updated_at
before update on public.crm_learning_snapshots
for each row execute function public.crm_set_updated_at();

commit;
