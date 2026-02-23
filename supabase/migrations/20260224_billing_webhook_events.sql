-- Billing webhook resilience + event logging

create extension if not exists pgcrypto;

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  status text not null default 'processing',
  attempt_count integer not null default 1,
  received_at timestamptz not null default now(),
  last_attempt_at timestamptz not null default now(),
  processed_at timestamptz null,
  error text null,
  payload jsonb null,
  result jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_webhook_events_status_last_attempt
  on public.billing_webhook_events(status, last_attempt_at desc);

create index if not exists idx_billing_webhook_events_received_at
  on public.billing_webhook_events(received_at desc);

-- This table is internal-only. Keep client roles from direct access.
revoke all on table public.billing_webhook_events from anon, authenticated;

