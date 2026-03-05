begin;

alter table if exists public.crm_prospects
  add column if not exists source_url text null,
  add column if not exists source_checked_at date null,
  add column if not exists linkedin_url text null,
  add column if not exists linkedin_search_url text null,
  add column if not exists linkedin_headline text null,
  add column if not exists linkedin_relevance_note text null,
  add column if not exists active_listings_count integer null check (active_listings_count is null or active_listings_count >= 0),
  add column if not exists new_listings_30d integer null check (new_listings_30d is null or new_listings_30d >= 0),
  add column if not exists share_miete_percent integer null check (share_miete_percent is null or (share_miete_percent >= 0 and share_miete_percent <= 100)),
  add column if not exists share_kauf_percent integer null check (share_kauf_percent is null or (share_kauf_percent >= 0 and share_kauf_percent <= 100)),
  add column if not exists object_types text[] not null default '{}'::text[],
  add column if not exists price_band_main text null,
  add column if not exists region_focus_micro text null,
  add column if not exists response_promise_public text null,
  add column if not exists appointment_flow_public text null,
  add column if not exists docs_flow_public text null,
  add column if not exists owner_led boolean null,
  add column if not exists years_in_market integer null check (years_in_market is null or years_in_market >= 0),
  add column if not exists trust_signals text[] not null default '{}'::text[],
  add column if not exists brand_tone text null check (brand_tone is null or brand_tone in ('kurz_direkt', 'freundlich', 'professionell', 'gemischt')),
  add column if not exists cta_preference_guess text null check (cta_preference_guess is null or cta_preference_guess in ('kurze_mail_antwort', '15_min_call', 'video_link', 'formular_antwort')),
  add column if not exists primary_objection text null,
  add column if not exists primary_pain_hypothesis text null,
  add column if not exists secondary_pain_hypothesis text null,
  add column if not exists automation_readiness text null check (automation_readiness is null or automation_readiness in ('niedrig', 'mittel', 'hoch')),
  add column if not exists personalization_evidence text null,
  add column if not exists hypothesis_confidence numeric(4,3) null check (hypothesis_confidence is null or (hypothesis_confidence >= 0 and hypothesis_confidence <= 1));

create index if not exists crm_prospects_agent_linkedin_idx
  on public.crm_prospects (agent_id, linkedin_url)
  where linkedin_url is not null;

create index if not exists crm_prospects_agent_source_checked_idx
  on public.crm_prospects (agent_id, source_checked_at desc nulls last);

create index if not exists crm_prospects_agent_focus_mix_idx
  on public.crm_prospects (agent_id, object_focus, share_miete_percent, share_kauf_percent);

commit;
