begin;

create table if not exists public.crm_message_goldset (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  message_id uuid not null references public.crm_outreach_messages(id) on delete cascade,
  prospect_id uuid null references public.crm_prospects(id) on delete cascade,
  strategy_decision_id uuid null references public.crm_strategy_decisions(id) on delete set null,
  example_type text not null check (example_type in ('approved', 'rejected')),
  channel text null
    check (channel is null or channel in ('email', 'telefon', 'linkedin', 'kontaktformular', 'whatsapp', 'sonstiges')),
  message_kind text null,
  segment_key text null,
  playbook_key text null,
  subject text null,
  body text not null,
  notes text null,
  reason_tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists crm_message_goldset_agent_message_unique
  on public.crm_message_goldset(agent_id, message_id);

create index if not exists crm_message_goldset_agent_type_idx
  on public.crm_message_goldset(agent_id, example_type, created_at desc);

create index if not exists crm_message_goldset_agent_segment_idx
  on public.crm_message_goldset(agent_id, segment_key, channel, message_kind, created_at desc);

alter table if exists public.crm_message_goldset enable row level security;

drop policy if exists crm_message_goldset_select_owner on public.crm_message_goldset;
create policy crm_message_goldset_select_owner
  on public.crm_message_goldset
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_message_goldset_insert_owner on public.crm_message_goldset;
create policy crm_message_goldset_insert_owner
  on public.crm_message_goldset
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_message_goldset_update_owner on public.crm_message_goldset;
create policy crm_message_goldset_update_owner
  on public.crm_message_goldset
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_message_goldset_delete_owner on public.crm_message_goldset;
create policy crm_message_goldset_delete_owner
  on public.crm_message_goldset
  for delete
  using (public.crm_owner_can_access(agent_id));

drop trigger if exists trg_crm_message_goldset_updated_at on public.crm_message_goldset;
create trigger trg_crm_message_goldset_updated_at
before update on public.crm_message_goldset
for each row execute function public.crm_set_updated_at();

commit;
