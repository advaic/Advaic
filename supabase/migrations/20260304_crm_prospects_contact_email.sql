begin;

alter table if exists public.crm_prospects
  add column if not exists contact_email text null;

create index if not exists crm_prospects_agent_contact_email_idx
  on public.crm_prospects (agent_id, lower(contact_email))
  where contact_email is not null;

commit;

