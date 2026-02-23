-- Billing foundation (Stripe)
-- Apply in Supabase SQL editor or via Supabase migrations tooling.

create extension if not exists pgcrypto;

create table if not exists public.billing_customers (
  agent_id uuid primary key references public.agents(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text null,
  name text null,
  raw jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text null,
  status text not null default 'unknown',
  plan_key text null,
  price_id text null,
  currency text null,
  amount_cents integer null,
  interval text null,
  current_period_start timestamptz null,
  current_period_end timestamptz null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz null,
  trial_end timestamptz null,
  raw jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_subscriptions_agent
  on public.billing_subscriptions(agent_id, updated_at desc);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_subscription_id text null,
  stripe_customer_id text null,
  status text null,
  currency text null,
  amount_due integer null,
  amount_paid integer null,
  hosted_invoice_url text null,
  invoice_pdf text null,
  period_start timestamptz null,
  period_end timestamptz null,
  paid_at timestamptz null,
  raw jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_invoices_agent
  on public.billing_invoices(agent_id, created_at desc);

alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_invoices enable row level security;

drop policy if exists "billing_customers_select_own" on public.billing_customers;
create policy "billing_customers_select_own"
  on public.billing_customers
  for select
  using (agent_id = auth.uid());

drop policy if exists "billing_subscriptions_select_own" on public.billing_subscriptions;
create policy "billing_subscriptions_select_own"
  on public.billing_subscriptions
  for select
  using (agent_id = auth.uid());

drop policy if exists "billing_invoices_select_own" on public.billing_invoices;
create policy "billing_invoices_select_own"
  on public.billing_invoices
  for select
  using (agent_id = auth.uid());
