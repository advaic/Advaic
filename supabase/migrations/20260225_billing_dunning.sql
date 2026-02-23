-- Billing dunning state (payment_failed handling)

create table if not exists public.billing_dunning_cases (
  agent_id uuid primary key references public.agents(id) on delete cascade,
  is_active boolean not null default false,
  status text not null default 'ok',
  last_failed_invoice_id text null,
  last_failed_at timestamptz null,
  last_payment_attempt_at timestamptz null,
  next_payment_attempt_at timestamptz null,
  attempt_count integer not null default 0,
  amount_due integer null,
  currency text null,
  hosted_invoice_url text null,
  invoice_pdf text null,
  failure_code text null,
  failure_message text null,
  last_email_sent_at timestamptz null,
  email_send_count integer not null default 0,
  last_email_error text null,
  resolved_at timestamptz null,
  raw jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_dunning_cases_active
  on public.billing_dunning_cases(is_active, updated_at desc);

alter table public.billing_dunning_cases enable row level security;

drop policy if exists "billing_dunning_cases_select_own" on public.billing_dunning_cases;
create policy "billing_dunning_cases_select_own"
  on public.billing_dunning_cases
  for select
  using (agent_id = auth.uid());
