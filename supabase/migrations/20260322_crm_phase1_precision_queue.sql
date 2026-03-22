begin;

create table if not exists public.crm_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  trigger_type text not null default 'manual'
    check (trigger_type in ('manual', 'preset', 'scheduled')),
  query_pack jsonb not null default '[]'::jsonb,
  cities text[] not null default '{}'::text[],
  per_city_limit integer not null default 3 check (per_city_limit >= 1 and per_city_limit <= 10),
  selected_count integer not null default 0 check (selected_count >= 0),
  created_count integer not null default 0 check (created_count >= 0),
  skipped_existing_count integer not null default 0 check (skipped_existing_count >= 0),
  skipped_irrelevant_count integer not null default 0 check (skipped_irrelevant_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_discovery_runs_agent_started_idx
  on public.crm_discovery_runs(agent_id, started_at desc);

create table if not exists public.crm_prospect_candidates (
  id uuid primary key default gen_random_uuid(),
  discovery_run_id uuid null references public.crm_discovery_runs(id) on delete set null,
  agent_id uuid not null references public.agents(id) on delete cascade,
  company_name text not null,
  contact_name text null,
  contact_email text null,
  contact_role text null,
  city text null,
  region text null,
  website_url text null,
  source_url text null,
  source_checked_at date null,
  linkedin_url text null,
  linkedin_search_url text null,
  linkedin_headline text null,
  object_focus text not null default 'gemischt'
    check (object_focus in ('miete', 'kauf', 'neubau', 'gemischt')),
  target_group text null,
  process_hint text null,
  personalization_hook text null,
  pain_point_hypothesis text null,
  primary_pain_hypothesis text null,
  secondary_pain_hypothesis text null,
  fit_score integer not null default 0 check (fit_score between 0 and 100),
  priority text not null default 'B' check (priority in ('A', 'B', 'C')),
  preferred_channel text not null default 'email'
    check (preferred_channel in ('email', 'telefon', 'linkedin', 'kontaktformular', 'whatsapp', 'sonstiges')),
  active_listings_count integer null check (active_listings_count is null or active_listings_count >= 0),
  object_types text[] not null default '{}'::text[],
  price_band_main text null,
  region_focus_micro text null,
  response_promise_public text null,
  appointment_flow_public text null,
  docs_flow_public text null,
  owner_led boolean null,
  years_in_market integer null check (years_in_market is null or years_in_market >= 0),
  trust_signals text[] not null default '{}'::text[],
  automation_readiness text null check (automation_readiness is null or automation_readiness in ('niedrig', 'mittel', 'hoch')),
  personalization_evidence text null,
  hypothesis_confidence numeric(4,3) null check (hypothesis_confidence is null or (hypothesis_confidence >= 0 and hypothesis_confidence <= 1)),
  review_status text not null default 'new'
    check (review_status in ('new', 'promoted', 'rejected', 'duplicate')),
  review_reason text null,
  reviewed_at timestamptz null,
  promoted_prospect_id uuid null references public.crm_prospects(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_prospect_candidates_agent_status_idx
  on public.crm_prospect_candidates(agent_id, review_status, fit_score desc, created_at desc);

create index if not exists crm_prospect_candidates_agent_domain_idx
  on public.crm_prospect_candidates(agent_id, lower(coalesce(website_url, source_url, '')));

create table if not exists public.crm_research_evidence (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  prospect_id uuid null references public.crm_prospects(id) on delete cascade,
  candidate_id uuid null references public.crm_prospect_candidates(id) on delete cascade,
  field_name text not null,
  field_value text not null,
  source_type text not null default 'website'
    check (source_type in ('website', 'linkedin', 'portal', 'manual', 'sonstiges')),
  source_url text null,
  confidence numeric(4,3) null check (confidence is null or (confidence >= 0 and confidence <= 1)),
  metadata jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_research_evidence_subject_check
    check (
      (prospect_id is not null and candidate_id is null) or
      (prospect_id is null and candidate_id is not null)
    )
);

create index if not exists crm_research_evidence_agent_prospect_idx
  on public.crm_research_evidence(agent_id, prospect_id, field_name, captured_at desc);

create index if not exists crm_research_evidence_agent_candidate_idx
  on public.crm_research_evidence(agent_id, candidate_id, field_name, captured_at desc);

create table if not exists public.crm_contact_candidates (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  prospect_id uuid null references public.crm_prospects(id) on delete cascade,
  candidate_id uuid null references public.crm_prospect_candidates(id) on delete cascade,
  contact_name text null,
  contact_role text null,
  channel_type text not null
    check (channel_type in ('email', 'telefon', 'linkedin', 'kontaktformular', 'whatsapp', 'website', 'sonstiges')),
  channel_value text not null,
  confidence numeric(4,3) null check (confidence is null or (confidence >= 0 and confidence <= 1)),
  validation_status text not null default 'new'
    check (validation_status in ('new', 'verified', 'invalid', 'used')),
  is_primary boolean not null default false,
  source_type text not null default 'website'
    check (source_type in ('website', 'linkedin', 'portal', 'manual', 'sonstiges')),
  source_url text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_contact_candidates_subject_check
    check (
      (prospect_id is not null and candidate_id is null) or
      (prospect_id is null and candidate_id is not null)
    )
);

create index if not exists crm_contact_candidates_agent_prospect_idx
  on public.crm_contact_candidates(agent_id, prospect_id, channel_type, confidence desc nulls last);

create index if not exists crm_contact_candidates_agent_candidate_idx
  on public.crm_contact_candidates(agent_id, candidate_id, channel_type, confidence desc nulls last);

alter table if exists public.crm_discovery_runs enable row level security;
alter table if exists public.crm_prospect_candidates enable row level security;
alter table if exists public.crm_research_evidence enable row level security;
alter table if exists public.crm_contact_candidates enable row level security;

drop policy if exists crm_discovery_runs_select_owner on public.crm_discovery_runs;
create policy crm_discovery_runs_select_owner
  on public.crm_discovery_runs
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_discovery_runs_insert_owner on public.crm_discovery_runs;
create policy crm_discovery_runs_insert_owner
  on public.crm_discovery_runs
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_discovery_runs_update_owner on public.crm_discovery_runs;
create policy crm_discovery_runs_update_owner
  on public.crm_discovery_runs
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_discovery_runs_delete_owner on public.crm_discovery_runs;
create policy crm_discovery_runs_delete_owner
  on public.crm_discovery_runs
  for delete
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_prospect_candidates_select_owner on public.crm_prospect_candidates;
create policy crm_prospect_candidates_select_owner
  on public.crm_prospect_candidates
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_prospect_candidates_insert_owner on public.crm_prospect_candidates;
create policy crm_prospect_candidates_insert_owner
  on public.crm_prospect_candidates
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_prospect_candidates_update_owner on public.crm_prospect_candidates;
create policy crm_prospect_candidates_update_owner
  on public.crm_prospect_candidates
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_prospect_candidates_delete_owner on public.crm_prospect_candidates;
create policy crm_prospect_candidates_delete_owner
  on public.crm_prospect_candidates
  for delete
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_research_evidence_select_owner on public.crm_research_evidence;
create policy crm_research_evidence_select_owner
  on public.crm_research_evidence
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_research_evidence_insert_owner on public.crm_research_evidence;
create policy crm_research_evidence_insert_owner
  on public.crm_research_evidence
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_research_evidence_update_owner on public.crm_research_evidence;
create policy crm_research_evidence_update_owner
  on public.crm_research_evidence
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_research_evidence_delete_owner on public.crm_research_evidence;
create policy crm_research_evidence_delete_owner
  on public.crm_research_evidence
  for delete
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_contact_candidates_select_owner on public.crm_contact_candidates;
create policy crm_contact_candidates_select_owner
  on public.crm_contact_candidates
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_contact_candidates_insert_owner on public.crm_contact_candidates;
create policy crm_contact_candidates_insert_owner
  on public.crm_contact_candidates
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_contact_candidates_update_owner on public.crm_contact_candidates;
create policy crm_contact_candidates_update_owner
  on public.crm_contact_candidates
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_contact_candidates_delete_owner on public.crm_contact_candidates;
create policy crm_contact_candidates_delete_owner
  on public.crm_contact_candidates
  for delete
  using (public.crm_owner_can_access(agent_id));

drop trigger if exists trg_crm_discovery_runs_updated_at on public.crm_discovery_runs;
create trigger trg_crm_discovery_runs_updated_at
before update on public.crm_discovery_runs
for each row execute function public.crm_set_updated_at();

drop trigger if exists trg_crm_prospect_candidates_updated_at on public.crm_prospect_candidates;
create trigger trg_crm_prospect_candidates_updated_at
before update on public.crm_prospect_candidates
for each row execute function public.crm_set_updated_at();

drop trigger if exists trg_crm_research_evidence_updated_at on public.crm_research_evidence;
create trigger trg_crm_research_evidence_updated_at
before update on public.crm_research_evidence
for each row execute function public.crm_set_updated_at();

drop trigger if exists trg_crm_contact_candidates_updated_at on public.crm_contact_candidates;
create trigger trg_crm_contact_candidates_updated_at
before update on public.crm_contact_candidates
for each row execute function public.crm_set_updated_at();

commit;
