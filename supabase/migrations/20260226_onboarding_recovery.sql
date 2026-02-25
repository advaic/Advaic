create table if not exists public.onboarding_recovery (
  agent_id uuid primary key references public.agents (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  onboarding_started_at timestamptz null,
  first_value_at timestamptz null,
  completed_at timestamptz null,
  remind_1h_due_at timestamptz null,
  remind_1h_sent_at timestamptz null,
  remind_24h_due_at timestamptz null,
  remind_24h_sent_at timestamptz null,
  last_payload jsonb not null default '{}'::jsonb
);

create index if not exists onboarding_recovery_due_1h_idx
  on public.onboarding_recovery (remind_1h_due_at)
  where remind_1h_sent_at is null and completed_at is null and first_value_at is null;

create index if not exists onboarding_recovery_due_24h_idx
  on public.onboarding_recovery (remind_24h_due_at)
  where remind_24h_sent_at is null and completed_at is null and first_value_at is null;

create index if not exists onboarding_recovery_started_idx
  on public.onboarding_recovery (onboarding_started_at desc);

alter table public.onboarding_recovery enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'onboarding_recovery'
      and policyname = 'onboarding_recovery_service_role_all'
  ) then
    create policy onboarding_recovery_service_role_all
      on public.onboarding_recovery
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;

