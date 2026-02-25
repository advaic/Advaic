-- Zusätzliche Immobilien-Felder für bessere Angebotsqualität und präzise Antworten.
-- Enthält:
-- - Miet-/Kaufdetail-Felder
-- - Mindestkriterien
-- - Besichtigungsregeln

alter table public.properties
  add column if not exists kaltmiete numeric null,
  add column if not exists nebenkosten numeric null,
  add column if not exists warmmiete numeric null,
  add column if not exists kaution numeric null,
  add column if not exists provision text null,
  add column if not exists mindesteinkommen numeric null,
  add column if not exists besichtigung_regeln text null;

comment on column public.properties.kaltmiete is
  'Optionale Kaltmiete (EUR/Monat) für Vermietung.';
comment on column public.properties.nebenkosten is
  'Optionale Nebenkosten (EUR/Monat) für Vermietung.';
comment on column public.properties.warmmiete is
  'Optionale Warmmiete (EUR/Monat) für Vermietung.';
comment on column public.properties.kaution is
  'Optionale Kaution (EUR) für Vermietung.';
comment on column public.properties.provision is
  'Optionale Provisionsangabe (z. B. 3,57 % inkl. MwSt.) für Verkauf.';
comment on column public.properties.mindesteinkommen is
  'Optionales Mindesteinkommen (EUR netto/Monat).';
comment on column public.properties.besichtigung_regeln is
  'Optionale Regeln für Besichtigungen und Terminvergabe.';
