begin;

create table if not exists public.crm_quality_reviews (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  prospect_id uuid not null references public.crm_prospects(id) on delete cascade,
  message_id uuid null references public.crm_outreach_messages(id) on delete cascade,
  review_scope text not null
    check (review_scope in ('draft_save', 'send_gate', 'sequence_draft', 'manual_recheck')),
  channel text null
    check (channel is null or channel in ('email', 'telefon', 'linkedin', 'kontaktformular', 'whatsapp', 'sonstiges')),
  message_kind text null,
  status text not null check (status in ('pass', 'needs_review', 'blocked')),
  score integer not null check (score >= 0 and score <= 100),
  grounding_score integer null check (grounding_score is null or (grounding_score >= 0 and grounding_score <= 100)),
  novelty_score integer null check (novelty_score is null or (novelty_score >= 0 and novelty_score <= 100)),
  supported_claims jsonb not null default '[]'::jsonb,
  unsupported_claims jsonb not null default '[]'::jsonb,
  review_summary text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_quality_reviews_agent_prospect_idx
  on public.crm_quality_reviews(agent_id, prospect_id, created_at desc);

create index if not exists crm_quality_reviews_agent_message_idx
  on public.crm_quality_reviews(agent_id, message_id, created_at desc);

alter table if exists public.crm_quality_reviews enable row level security;

drop policy if exists crm_quality_reviews_select_owner on public.crm_quality_reviews;
create policy crm_quality_reviews_select_owner
  on public.crm_quality_reviews
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_quality_reviews_insert_owner on public.crm_quality_reviews;
create policy crm_quality_reviews_insert_owner
  on public.crm_quality_reviews
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_quality_reviews_update_owner on public.crm_quality_reviews;
create policy crm_quality_reviews_update_owner
  on public.crm_quality_reviews
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_quality_reviews_delete_owner on public.crm_quality_reviews;
create policy crm_quality_reviews_delete_owner
  on public.crm_quality_reviews
  for delete
  using (public.crm_owner_can_access(agent_id));

drop trigger if exists trg_crm_quality_reviews_updated_at on public.crm_quality_reviews;
create trigger trg_crm_quality_reviews_updated_at
before update on public.crm_quality_reviews
for each row execute function public.crm_set_updated_at();

commit;
