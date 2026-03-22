begin;

create table if not exists public.crm_contact_resolution_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  prospect_id uuid not null references public.crm_prospects(id) on delete cascade,
  trigger_type text not null
    check (trigger_type in ('missing_contact', 'bounce', 'wrong_contact', 'manual', 'sequence_run')),
  status text not null
    check (status in ('resolved', 'manual_review', 'no_candidate', 'skipped')),
  strategy_decision_id uuid null references public.crm_strategy_decisions(id) on delete set null,
  failed_message_id uuid null references public.crm_outreach_messages(id) on delete set null,
  invalidated_contact_candidate_id uuid null references public.crm_contact_candidates(id) on delete set null,
  selected_contact_candidate_id uuid null references public.crm_contact_candidates(id) on delete set null,
  selected_channel text null
    check (selected_channel is null or selected_channel in ('email', 'telefon', 'linkedin', 'kontaktformular', 'whatsapp', 'website', 'sonstiges')),
  selected_contact_value text null,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_contact_resolution_runs_agent_prospect_idx
  on public.crm_contact_resolution_runs(agent_id, prospect_id, created_at desc);

create index if not exists crm_contact_resolution_runs_agent_status_idx
  on public.crm_contact_resolution_runs(agent_id, status, created_at desc);

alter table if exists public.crm_contact_resolution_runs enable row level security;

drop policy if exists crm_contact_resolution_runs_select_owner on public.crm_contact_resolution_runs;
create policy crm_contact_resolution_runs_select_owner
  on public.crm_contact_resolution_runs
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_contact_resolution_runs_insert_owner on public.crm_contact_resolution_runs;
create policy crm_contact_resolution_runs_insert_owner
  on public.crm_contact_resolution_runs
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_contact_resolution_runs_update_owner on public.crm_contact_resolution_runs;
create policy crm_contact_resolution_runs_update_owner
  on public.crm_contact_resolution_runs
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_contact_resolution_runs_delete_owner on public.crm_contact_resolution_runs;
create policy crm_contact_resolution_runs_delete_owner
  on public.crm_contact_resolution_runs
  for delete
  using (public.crm_owner_can_access(agent_id));

drop trigger if exists trg_crm_contact_resolution_runs_updated_at on public.crm_contact_resolution_runs;
create trigger trg_crm_contact_resolution_runs_updated_at
before update on public.crm_contact_resolution_runs
for each row execute function public.crm_set_updated_at();

commit;
