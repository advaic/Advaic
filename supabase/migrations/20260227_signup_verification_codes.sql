create table if not exists public.signup_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  max_attempts integer not null default 6,
  used_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists signup_verifications_email_idx on public.signup_verifications (email);
create index if not exists signup_verifications_phone_idx on public.signup_verifications (phone);
create index if not exists signup_verifications_expires_idx on public.signup_verifications (expires_at);
create index if not exists signup_verifications_created_idx on public.signup_verifications (created_at desc);

alter table public.signup_verifications enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'signup_verifications'
      and policyname = 'signup_verifications_service_role_all'
  ) then
    create policy signup_verifications_service_role_all
      on public.signup_verifications
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;

alter table if exists public.agents
  add column if not exists phone text null;

comment on column public.agents.phone is 'Pflichtfeld aus Signup (Telefon/Handynummer des Kontoinhabers).';
