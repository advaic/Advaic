alter table if exists public.agents
  add column if not exists terms_accepted_at timestamptz null,
  add column if not exists terms_version text null,
  add column if not exists privacy_accepted_at timestamptz null,
  add column if not exists privacy_version text null,
  add column if not exists marketing_email_opt_in boolean not null default false,
  add column if not exists marketing_email_opt_in_at timestamptz null,
  add column if not exists marketing_email_opt_out_at timestamptz null,
  add column if not exists signup_source text null;

create index if not exists agents_marketing_opt_in_true_idx
  on public.agents (id)
  where marketing_email_opt_in = true;

create index if not exists agents_signup_source_idx
  on public.agents (signup_source);

comment on column public.agents.terms_accepted_at is 'Zeitpunkt der Zustimmung zu Nutzungsbedingungen beim Signup.';
comment on column public.agents.terms_version is 'Versionskennung der Nutzungsbedingungen (z. B. 2026-02-26).';
comment on column public.agents.privacy_accepted_at is 'Zeitpunkt der Zustimmung zu Datenschutzhinweisen beim Signup.';
comment on column public.agents.privacy_version is 'Versionskennung der Datenschutzhinweise (z. B. 2026-02-26).';
comment on column public.agents.marketing_email_opt_in is 'Newsletter-/Marketing-E-Mail-Einwilligung.';
comment on column public.agents.marketing_email_opt_in_at is 'Zeitpunkt des Newsletter-Opt-ins.';
comment on column public.agents.marketing_email_opt_out_at is 'Zeitpunkt des Newsletter-Opt-outs.';
comment on column public.agents.signup_source is 'Quelle des Signups (z. B. website:signup, website:produkt).';

update public.agents as a
set
  terms_accepted_at = coalesce(
    a.terms_accepted_at,
    case
      when coalesce(u.raw_user_meta_data ->> 'terms_accepted_at', '') ~ '^\d{4}-\d{2}-\d{2}T'
        then (u.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz
      else null
    end
  ),
  terms_version = coalesce(
    nullif(a.terms_version, ''),
    nullif(u.raw_user_meta_data ->> 'terms_version', '')
  ),
  privacy_accepted_at = coalesce(
    a.privacy_accepted_at,
    case
      when coalesce(u.raw_user_meta_data ->> 'privacy_accepted_at', '') ~ '^\d{4}-\d{2}-\d{2}T'
        then (u.raw_user_meta_data ->> 'privacy_accepted_at')::timestamptz
      else null
    end
  ),
  privacy_version = coalesce(
    nullif(a.privacy_version, ''),
    nullif(u.raw_user_meta_data ->> 'privacy_version', '')
  ),
  marketing_email_opt_in = coalesce(
    a.marketing_email_opt_in,
    case lower(coalesce(u.raw_user_meta_data ->> 'marketing_email_opt_in', ''))
      when 'true' then true
      when 'false' then false
      else null
    end,
    false
  ),
  marketing_email_opt_in_at = coalesce(
    a.marketing_email_opt_in_at,
    case
      when coalesce(u.raw_user_meta_data ->> 'marketing_email_opt_in_at', '') ~ '^\d{4}-\d{2}-\d{2}T'
        then (u.raw_user_meta_data ->> 'marketing_email_opt_in_at')::timestamptz
      else null
    end
  ),
  marketing_email_opt_out_at = coalesce(
    a.marketing_email_opt_out_at,
    case
      when coalesce(u.raw_user_meta_data ->> 'marketing_email_opt_out_at', '') ~ '^\d{4}-\d{2}-\d{2}T'
        then (u.raw_user_meta_data ->> 'marketing_email_opt_out_at')::timestamptz
      else null
    end
  ),
  signup_source = coalesce(
    nullif(a.signup_source, ''),
    nullif(u.raw_user_meta_data ->> 'signup_source', '')
  )
from auth.users as u
where u.id = a.id;
