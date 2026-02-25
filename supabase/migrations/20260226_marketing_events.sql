create table if not exists public.marketing_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event text not null,
  source text not null default 'marketing',
  path text null,
  page_group text null,
  cta_variant text null,
  visitor_id text null,
  session_id text null,
  referrer text null,
  user_agent text null,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists marketing_events_created_at_idx on public.marketing_events (created_at desc);
create index if not exists marketing_events_event_idx on public.marketing_events (event);
create index if not exists marketing_events_source_idx on public.marketing_events (source);
create index if not exists marketing_events_path_idx on public.marketing_events (path);
create index if not exists marketing_events_cta_variant_idx on public.marketing_events (cta_variant);
create index if not exists marketing_events_visitor_idx on public.marketing_events (visitor_id);

alter table public.marketing_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'marketing_events'
      and policyname = 'marketing_events_service_role_all'
  ) then
    create policy marketing_events_service_role_all
      on public.marketing_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;

