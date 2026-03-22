begin;

create table if not exists public.crm_strategy_decisions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  prospect_id uuid not null references public.crm_prospects(id) on delete cascade,
  version integer not null default 1 check (version >= 1),
  is_current boolean not null default true,
  strategy_status text not null default 'active'
    check (strategy_status in ('active', 'superseded', 'rejected')),
  segment_key text not null,
  playbook_key text null,
  playbook_title text null,
  chosen_channel text null
    check (chosen_channel is null or chosen_channel in ('email', 'telefon', 'linkedin', 'kontaktformular', 'whatsapp', 'sonstiges')),
  channel_plan jsonb not null default '[]'::jsonb,
  chosen_contact_channel text null
    check (chosen_contact_channel is null or chosen_contact_channel in ('email', 'telefon', 'linkedin', 'kontaktformular', 'whatsapp', 'website', 'sonstiges')),
  chosen_contact_value text null,
  chosen_contact_confidence numeric(4,3) null check (chosen_contact_confidence is null or (chosen_contact_confidence >= 0 and chosen_contact_confidence <= 1)),
  chosen_contact_candidate_id uuid null references public.crm_contact_candidates(id) on delete set null,
  chosen_cta text null,
  chosen_angle text null,
  chosen_trigger text null,
  trigger_evidence jsonb not null default '[]'::jsonb,
  research_status text null,
  research_score integer null check (research_score is null or (research_score >= 0 and research_score <= 100)),
  risk_level text null check (risk_level is null or risk_level in ('niedrig', 'mittel', 'hoch')),
  strategy_score integer null check (strategy_score is null or (strategy_score >= 0 and strategy_score <= 100)),
  rationale text null,
  fallback_plan text null,
  research_gaps jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_strategy_decisions_agent_prospect_idx
  on public.crm_strategy_decisions(agent_id, prospect_id, created_at desc);

create unique index if not exists crm_strategy_decisions_current_unique
  on public.crm_strategy_decisions(agent_id, prospect_id)
  where is_current = true;

create table if not exists public.crm_operator_feedback (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  subject_type text not null check (subject_type in ('candidate', 'strategy', 'draft', 'contact')),
  subject_id uuid not null,
  prospect_id uuid null references public.crm_prospects(id) on delete cascade,
  candidate_id uuid null references public.crm_prospect_candidates(id) on delete cascade,
  strategy_decision_id uuid null references public.crm_strategy_decisions(id) on delete cascade,
  message_id uuid null references public.crm_outreach_messages(id) on delete cascade,
  feedback_value text not null check (feedback_value in ('accept', 'reject', 'approve', 'needs_work', 'wrong_contact', 'preferred')),
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_operator_feedback_agent_subject_idx
  on public.crm_operator_feedback(agent_id, subject_type, subject_id, created_at desc);

create index if not exists crm_operator_feedback_agent_prospect_idx
  on public.crm_operator_feedback(agent_id, prospect_id, created_at desc);

alter table if exists public.crm_strategy_decisions enable row level security;
alter table if exists public.crm_operator_feedback enable row level security;

drop policy if exists crm_strategy_decisions_select_owner on public.crm_strategy_decisions;
create policy crm_strategy_decisions_select_owner
  on public.crm_strategy_decisions
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_strategy_decisions_insert_owner on public.crm_strategy_decisions;
create policy crm_strategy_decisions_insert_owner
  on public.crm_strategy_decisions
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_strategy_decisions_update_owner on public.crm_strategy_decisions;
create policy crm_strategy_decisions_update_owner
  on public.crm_strategy_decisions
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_strategy_decisions_delete_owner on public.crm_strategy_decisions;
create policy crm_strategy_decisions_delete_owner
  on public.crm_strategy_decisions
  for delete
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_operator_feedback_select_owner on public.crm_operator_feedback;
create policy crm_operator_feedback_select_owner
  on public.crm_operator_feedback
  for select
  using (public.crm_owner_can_access(agent_id));

drop policy if exists crm_operator_feedback_insert_owner on public.crm_operator_feedback;
create policy crm_operator_feedback_insert_owner
  on public.crm_operator_feedback
  for insert
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_operator_feedback_update_owner on public.crm_operator_feedback;
create policy crm_operator_feedback_update_owner
  on public.crm_operator_feedback
  for update
  using (public.crm_owner_can_access(agent_id))
  with check (public.crm_owner_can_access(agent_id));

drop policy if exists crm_operator_feedback_delete_owner on public.crm_operator_feedback;
create policy crm_operator_feedback_delete_owner
  on public.crm_operator_feedback
  for delete
  using (public.crm_owner_can_access(agent_id));

drop trigger if exists trg_crm_strategy_decisions_updated_at on public.crm_strategy_decisions;
create trigger trg_crm_strategy_decisions_updated_at
before update on public.crm_strategy_decisions
for each row execute function public.crm_set_updated_at();

drop trigger if exists trg_crm_operator_feedback_updated_at on public.crm_operator_feedback;
create trigger trg_crm_operator_feedback_updated_at
before update on public.crm_operator_feedback
for each row execute function public.crm_set_updated_at();

commit;
