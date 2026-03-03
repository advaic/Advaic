-- Sprint 6: Feedback-Loop -> automatische Stiloptimierung
-- Ergänzt Steuerfelder in agent_settings und einen Index für Feedback-Gründe.

alter table if exists public.agent_settings
  add column if not exists style_feedback_autotune_enabled boolean not null default true,
  add column if not exists style_feedback_last_run_at timestamptz null,
  add column if not exists style_feedback_last_summary jsonb not null default '{}'::jsonb;

create index if not exists message_feedback_agent_reason_updated_idx
  on public.message_feedback (agent_id, reason, updated_at desc);

