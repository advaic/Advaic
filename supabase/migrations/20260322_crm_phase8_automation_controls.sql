-- Phase 8: persistente CRM-Automation-Steuerung fuer Owner-Ops

alter table if exists public.agent_settings
  add column if not exists crm_sequence_automation_enabled boolean not null default true,
  add column if not exists crm_enrichment_automation_enabled boolean not null default true,
  add column if not exists crm_automation_reason text null,
  add column if not exists crm_automation_updated_at timestamptz null;
