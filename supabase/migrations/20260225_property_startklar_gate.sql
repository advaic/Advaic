-- Property readiness hardening for autosend + publishing.
-- Goal:
-- 1) Consistent "url" column usage (not "uri")
-- 2) Reusable SQL readiness evaluation
-- 3) Optional DB guardrail for published properties
-- 4) Fast joins for lead -> active_property_id checks

-- 0) Normalize legacy schema: if only `uri` exists, rename to `url`.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'properties'
      and column_name = 'uri'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'properties'
      and column_name = 'url'
  ) then
    execute 'alter table public.properties rename column uri to url';
  end if;
end $$;

-- 1) Evaluate missing startklar fields.
create or replace function public.property_missing_startklar_fields(
  p_title text,
  p_street_address text,
  p_city text,
  p_type text,
  p_price_type text,
  p_price_text text,
  p_rooms_text text,
  p_size_sqm_text text,
  p_listing_summary text,
  p_url text
)
returns text[]
language sql
immutable
as $$
  select array_remove(
    array[
      case when btrim(coalesce(p_title, '')) = '' then 'title' end,
      case when btrim(coalesce(p_street_address, '')) = '' then 'street_address' end,
      case when btrim(coalesce(p_city, '')) = '' then 'city' end,
      case when btrim(coalesce(p_type, '')) = '' then 'type' end,
      case
        when btrim(coalesce(p_price_type, '')) = ''
          or lower(btrim(p_price_type)) not in ('vermietung', 'verkauf', 'rent', 'sale')
        then 'price_type'
      end,
      case
        when case
          when btrim(coalesce(p_price_text, '')) ~ '^[0-9]+([.,][0-9]+)?$'
          then replace(btrim(coalesce(p_price_text, '')), ',', '.')::numeric > 0
          else false
        end
        then null
        else 'price'
      end,
      case
        when case
          when btrim(coalesce(p_rooms_text, '')) ~ '^[0-9]+([.,][0-9]+)?$'
          then replace(btrim(coalesce(p_rooms_text, '')), ',', '.')::numeric > 0
          else false
        end
        then null
        else 'rooms'
      end,
      case
        when case
          when btrim(coalesce(p_size_sqm_text, '')) ~ '^[0-9]+([.,][0-9]+)?$'
          then replace(btrim(coalesce(p_size_sqm_text, '')), ',', '.')::numeric > 0
          else false
        end
        then null
        else 'size_sqm'
      end,
      case when btrim(coalesce(p_listing_summary, '')) = '' then 'listing_summary' end,
      case
        when btrim(coalesce(p_url, '')) = ''
          or p_url !~* '^https?://'
        then 'url'
      end
    ],
    null
  )::text[];
$$;

-- 2) Readiness view for dashboards/admin checks.
create or replace view public.properties_startklar_v1 as
select
  p.id as property_id,
  p.agent_id,
  p.status,
  public.property_missing_startklar_fields(
    p.title,
    p.street_address,
    p.city,
    p.type,
    p.price_type,
    p.price::text,
    p.rooms::text,
    p.size_sqm::text,
    p.listing_summary,
    p.url
  ) as missing_fields,
  cardinality(
    public.property_missing_startklar_fields(
      p.title,
      p.street_address,
      p.city,
      p.type,
      p.price_type,
      p.price::text,
      p.rooms::text,
      p.size_sqm::text,
      p.listing_summary,
      p.url
    )
  ) = 0 as is_startklar
from public.properties p;

-- 3) Optional hard DB guardrail:
-- New "published" rows must be startklar (existing rows stay untouched via NOT VALID).
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conname = 'properties_published_requires_startklar_v1'
      and c.conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_published_requires_startklar_v1
      check (
        status is distinct from 'published'
        or cardinality(
          public.property_missing_startklar_fields(
            title,
            street_address,
            city,
            type,
            price_type,
            price::text,
            rooms::text,
            size_sqm::text,
            listing_summary,
            url
          )
        ) = 0
      ) not valid;
  end if;
end $$;

-- 4) Active-property checks need fast lookup in pipeline.
do $$
begin
  if to_regclass('public.lead_property_state') is not null then
    execute 'create index if not exists idx_lead_property_state_agent_lead on public.lead_property_state(agent_id, lead_id)';
    execute 'create index if not exists idx_lead_property_state_active_property on public.lead_property_state(active_property_id)';
  end if;
end $$;
