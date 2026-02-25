-- 20260226_followups_windows_feedback.sql
-- Adds follow-up send-window settings + a message feedback loop table.

alter table if exists public.agent_settings
  add column if not exists followups_send_start_hour integer default 8,
  add column if not exists followups_send_end_hour integer default 20,
  add column if not exists followups_send_on_weekends boolean default false,
  add column if not exists followups_timezone text default 'Europe/Berlin';

alter table if exists public.agent_settings
  drop constraint if exists agent_settings_followups_send_start_hour_check;
alter table if exists public.agent_settings
  drop constraint if exists agent_settings_followups_send_end_hour_check;

alter table if exists public.agent_settings
  add constraint agent_settings_followups_send_start_hour_check
  check (followups_send_start_hour between 0 and 23);

alter table if exists public.agent_settings
  add constraint agent_settings_followups_send_end_hour_check
  check (followups_send_end_hour between 0 and 23);

create table if not exists public.message_feedback (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  rating text not null check (rating in ('helpful', 'not_helpful')),
  reason text null,
  note text null,
  source text not null default 'lead_chat',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists message_feedback_agent_message_uniq
  on public.message_feedback (agent_id, message_id);

create index if not exists message_feedback_agent_created_idx
  on public.message_feedback (agent_id, created_at desc);

create index if not exists message_feedback_lead_created_idx
  on public.message_feedback (lead_id, created_at desc);

create or replace function public.set_message_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_message_feedback_updated_at on public.message_feedback;
create trigger trg_message_feedback_updated_at
before update on public.message_feedback
for each row
execute function public.set_message_feedback_updated_at();

alter table public.message_feedback enable row level security;

drop policy if exists message_feedback_select_own on public.message_feedback;
create policy message_feedback_select_own
on public.message_feedback
for select
to authenticated
using (auth.uid() = agent_id);

drop policy if exists message_feedback_insert_own on public.message_feedback;
create policy message_feedback_insert_own
on public.message_feedback
for insert
to authenticated
with check (auth.uid() = agent_id);

drop policy if exists message_feedback_update_own on public.message_feedback;
create policy message_feedback_update_own
on public.message_feedback
for update
to authenticated
using (auth.uid() = agent_id)
with check (auth.uid() = agent_id);

