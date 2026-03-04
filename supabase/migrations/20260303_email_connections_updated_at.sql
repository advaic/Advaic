-- Ensure email_connections has updated_at so generic set_updated_at() triggers do not fail.
alter table if exists public.email_connections
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'set_updated_at'
  ) then
    if not exists (
      select 1
      from pg_trigger
      where tgname = 'trg_email_connections_updated_at'
        and tgrelid = 'public.email_connections'::regclass
    ) then
      create trigger trg_email_connections_updated_at
      before update on public.email_connections
      for each row
      execute function public.set_updated_at();
    end if;
  end if;
end
$$;
