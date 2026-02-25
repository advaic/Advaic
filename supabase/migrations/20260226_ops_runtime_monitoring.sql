create table if not exists public.ops_runtime_controls (
  id boolean primary key default true check (id = true),
  pause_all boolean not null default false,
  pause_reply_ready_send boolean not null default false,
  pause_followups boolean not null default false,
  pause_onboarding_recovery boolean not null default false,
  pause_outlook_fetch boolean not null default false,
  reason text null,
  updated_at timestamptz not null default now(),
  updated_by uuid null references public.agents (id) on delete set null
);

insert into public.ops_runtime_controls (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pipeline text not null,
  status text not null check (status in ('ok', 'warning', 'error', 'paused')),
  duration_ms integer not null default 0,
  processed integer not null default 0,
  success integer not null default 0,
  failed integer not null default 0,
  skipped integer not null default 0,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists pipeline_runs_pipeline_created_idx
  on public.pipeline_runs (pipeline, created_at desc);

create index if not exists pipeline_runs_created_idx
  on public.pipeline_runs (created_at desc);

create table if not exists public.ops_alert_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  alert_key text not null unique,
  severity text not null check (severity in ('warning', 'critical')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  first_opened_at timestamptz not null default now(),
  last_fired_at timestamptz not null default now(),
  resolved_at timestamptz null,
  last_payload jsonb not null default '{}'::jsonb
);

create index if not exists ops_alert_events_status_updated_idx
  on public.ops_alert_events (status, updated_at desc);

alter table public.ops_runtime_controls enable row level security;
alter table public.pipeline_runs enable row level security;
alter table public.ops_alert_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ops_runtime_controls'
      and policyname = 'ops_runtime_controls_service_role_all'
  ) then
    create policy ops_runtime_controls_service_role_all
      on public.ops_runtime_controls
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pipeline_runs'
      and policyname = 'pipeline_runs_service_role_all'
  ) then
    create policy pipeline_runs_service_role_all
      on public.pipeline_runs
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ops_alert_events'
      and policyname = 'ops_alert_events_service_role_all'
  ) then
    create policy ops_alert_events_service_role_all
      on public.ops_alert_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;

