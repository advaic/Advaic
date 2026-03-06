-- Seed: gezielte Makler-Prospects (Region Hamburg + Umland)
-- Datum: 2026-03-06
-- Scope: nur fuer Agent-ID 3582c768-0edd-4536-9501-268b881599df
-- Quellen: oeffentlich sichtbare Profil- und Impressums-/Kontaktdaten

begin;

with cfg as (
  select '3582c768-0edd-4536-9501-268b881599df'::uuid as agent_id
),
seed as (
  select *
  from (
    values
      (
        'Hamburgs Immobilienmakler',
        'Kim Niklas Pommerenck',
        'kontakt@hamburgs-immobilienmakler.de',
        'Inhaber',
        'Hamburg',
        'Hamburg',
        'https://hamburgs-immobilienmakler.de',
        'https://www.immobilienscout24.de/anbieter/profil/hamburgs-immobilienmakler',
        'https://hamburgs-immobilienmakler.de/kontakt/',
        1,
        100,
        0,
        'kauf',
        'Kleines Inhaberbuero mit lokalem Hamburg-Fokus',
        'Klarer Einzelkontakt, schnelle Reaktion und konsistenter Ton sind entscheidend',
        'Scout zeigt aktuell 1 Inserat mit 100 Prozent Kauf. Ideal fuer vorsichtigen Autopilot bei Standardanfragen.',
        89,
        'A',
        'email',
        'https://de.linkedin.com/company/hamburgs-immobilienmakler',
        'Aktive Website plus LinkedIn-Firmenseite sichtbar.',
        'Kontrollverlust bei automatischen Antworten'
      ),
      (
        'HAMBURG IMMOBILIEN Dirk Bluhm',
        'Dirk Bluhm',
        'info@hamburgimmobilien-bluhm.de',
        'Inhaber',
        'Hamburg',
        'Hamburg',
        'https://hamburgimmobilien-bluhm.de',
        'https://www.immobilienscout24.de/anbieter/profil/hamburg-immobilien-dirk-bluhm',
        'https://hamburgimmobilien-bluhm.de/kontakt/',
        1,
        100,
        0,
        'kauf',
        'Kleiner Makler mit Fokus auf Wertermittlung und Verkauf',
        'Bei Einzelstrukturen bremst jede manuelle Inbox-Sortierung den Vertrieb',
        'Aktuell 1 Inserat, 100 Prozent Kauf. Guardrails + Freigabe-Logik passen stark.',
        87,
        'A',
        'email',
        null,
        'Website und Kontaktseite mit direkter E-Mail vorhanden.',
        'Sorge vor unpassenden Antworten bei Sonderfaellen'
      ),
      (
        'RENK Immobilien',
        'Marcel Renk',
        'info@renkimmobilien.de',
        'Inhaber',
        'Hamburg',
        'Hamburg',
        'https://www.renkimmobilien.de',
        'https://www.immobilienscout24.de/anbieter/profil/renk-immobilien-20535-hamburg/marcel-renk',
        'https://www.renkimmobilien.de/impressum',
        6,
        100,
        0,
        'kauf',
        'Inhabergefuehrte Einheit mit klarer Kauf-Pipeline',
        'Mehrere gleichartige Kaufanfragen sind ideal fuer standardisierte Erstreaktionen',
        'Scout zeigt 6 Inserate mit 100 Prozent Kauf. Sehr guter Fit fuer Auto/Freigabe-Split.',
        91,
        'A',
        'email',
        null,
        'Impressum mit direkter Kontakt-E-Mail und Telefonnummer.',
        'Befuerchtung, dass Automatisierung zu unpersoenlich wirkt'
      ),
      (
        'Egge Immobilien GmbH',
        'Maurice Egge',
        'info@egge-gmbh.de',
        'Geschaeftsfuehrer',
        'Hamburg',
        'Hamburg',
        'https://egge-gmbh.de',
        'https://www.immobilienscout24.de/anbieter/profil/egge-immobilien-gmbh-22085-hamburg',
        'https://egge-gmbh.de/impressum/',
        5,
        100,
        0,
        'kauf',
        'Etabliertes Team in Hamburg mit klarer Wohnfokus-Vermarktung',
        'Mehr Team bedeutet oft verstreute Kommunikationsverantwortung im Postfach',
        'Scout zeigt 5 Inserate und 100 Prozent Kauf. Klarer Kandidat fuer sichere Standards.',
        85,
        'A',
        'email',
        null,
        'Website, Impressum und mehrere Standortsignale vorhanden.',
        'Bedenken wegen Markenstimme bei KI-Entwuerfen'
      ),
      (
        'FineEstates',
        'Lukas Tumpak',
        'kontakt@fineestates.de',
        'Geschaeftsfuehrer',
        'Hamburg',
        'Hamburg',
        'https://www.fineestates.de',
        'https://www.immobilienscout24.de/anbieter/profil/fineestates/lukas-tumpak',
        'https://www.fineestates.de/impressum',
        7,
        100,
        0,
        'kauf',
        'Kleines Premium-Team mit hoher Serviceerwartung',
        'Premium-Tonalitaet muss trotz Geschwindigkeit jederzeit sauber bleiben',
        'Scout zeigt 7 Inserate, 100 Prozent Kauf. Starker Fit fuer Stilkontrolle + QA.',
        88,
        'A',
        'email',
        null,
        'Klare Teamdarstellung auf Website plus ImmoScout-Profil.',
        'Sorge, dass KI den hochwertigen Ton nicht haelt'
      ),
      (
        'stadtteilMakler Eimsbuettel',
        'Team Eimsbuettel',
        'eimsbuettel@stadtteil-makler.de',
        'Standortteam',
        'Hamburg',
        'Hamburg',
        'https://www.stadtteil-makler.de',
        'https://www.immobilienscout24.de/anbieter/profil/stadtteilmakler-eimsbuettel',
        'https://www.immobilienscout24.de/anbieter/profil/stadtteilmakler-eimsbuettel',
        3,
        100,
        0,
        'kauf',
        'Lokal positioniertes Stadtteil-Team mit klarer Nische',
        'Lokale Teams muessen schnell reagieren, aber trotzdem persoenlich bleiben',
        'Scout zeigt 3 Inserate mit 100 Prozent Kauf. Gute Passung fuer klare Regelpfade.',
        84,
        'B',
        'email',
        null,
        'Regionale Spezialisierung und Kontakt-E-Mail oeffentlich sichtbar.',
        'Risiko, dass Automatik lokale Nuancen nicht trifft'
      ),
      (
        'SASS Immobilien',
        'Ronald Sass',
        'kontakt@sass-immo.de',
        'Inhaber',
        'Hamburg',
        'Hamburg',
        'https://www.sass-immo.de',
        'https://www.immobilienscout24.de/anbieter/profil/sass-immobilien-20354-hamburg',
        'https://www.sass-immo.de/Kontakt.htm',
        17,
        94,
        6,
        'kauf',
        'Inhaberstruktur mit merklicher Aktivitaet in Kaufobjekten',
        'Hoeheres Anfrageaufkommen erhoeht Druck auf Reaktionszeit und Konsistenz',
        'Scout zeigt 17 Inserate, 94 Prozent Kauf. Hoher ROI fuer strukturierte Erstantworten.',
        90,
        'A',
        'email',
        null,
        'Website mit direktem Kontaktkanal und regionalem Fokus.',
        'Bedenken bei Risiko-Themen und Beschwerden'
      ),
      (
        'Brandt Immobilien',
        'Martina Brandt',
        'info@brandtimmobilien.de',
        'Inhaberin',
        'Hamburg',
        'Hamburg',
        'https://www.brandtimmobilien.de',
        'https://www.immobilienscout24.de/anbieter/profil/brandt-immobilien',
        'https://www.brandtimmobilien.de/impressum.xhtml',
        45,
        7,
        93,
        'miete',
        'Etabliertes Hamburger Vermietungsprofil mit hoher Aktivitaet',
        'Bei starkem Mietanteil sind repetitive Erstfragen ein zentraler Zeitfresser',
        'Scout zeigt 45 Inserate, 93 Prozent Miete. Sehr hoher Entlastungshebel fuer Anfragen.',
        93,
        'A',
        'email',
        null,
        'Website + Impressum + klare Spezialisierung auf Vermietung sichtbar.',
        'Sorge vor zu standardisierten Antworten bei anspruchsvollen Mietern'
      ),
      (
        'valyours Hamburg GmbH',
        'Lasse Berg',
        'hamburg@valyours.de',
        'Geschaeftsfuehrer',
        'Hamburg',
        'Hamburg',
        'https://www.valyours.de',
        'https://www.immobilienscout24.de/anbieter/profil/valyours-hamburg-gmbh',
        'https://www.valyours.de/standort/hamburg/',
        9,
        78,
        22,
        'kauf',
        'Digital orientierte Struktur mit sichtbarer Expansionsdynamik',
        'Wachstumsphasen brauchen reproduzierbare Antwortqualitaet ueber mehrere Kanaele',
        'Scout zeigt 9 Inserate, 78 Prozent Kauf. Technologienahe Positionierung passt gut zu Advaic.',
        86,
        'A',
        'email',
        'https://de.linkedin.com/company/valyours',
        'LinkedIn-Unternehmensseite aktiv, digitale Positionierung klar sichtbar.',
        'Frage nach klarer Nachvollziehbarkeit jeder Automatik-Entscheidung'
      ),
      (
        'Kriech Immobilien Ahrensburg',
        'Timo Kriech',
        'info@kriechimmobilien.de',
        'Inhaber',
        'Ahrensburg',
        'Schleswig-Holstein',
        'https://www.kriechimmobilien.de',
        'https://www.immobilienscout24.de/anbieter/profil/kriech-immobilien-ahrensburg',
        'https://www.kriechimmobilien.de/kontakt/impressum/',
        22,
        95,
        5,
        'kauf',
        'Regional starkes Inhaberbuero im Hamburger Umland',
        'Bei 22 aktiven Inseraten steigen Rueckfragen und Nachfassaufwand deutlich',
        'Scout zeigt 22 Inserate mit 95 Prozent Kauf. Sehr guter Fit fuer kontrollierte Automatisierung.',
        92,
        'A',
        'email',
        null,
        'Impressum und Kontaktkanal mit direkter E-Mail verifiziert.',
        'Sorge, dass Sonderfaelle ohne Kontext falsch behandelt werden'
      ),
      (
        'Tim Friedrichsen Immobilien e.K.',
        'Tim Friedrichsen',
        'mail@fi.immo',
        'Inhaber',
        'Hamburg',
        'Hamburg',
        'https://www.friedrichsen-immobilien.de',
        'https://www.immobilienscout24.de/anbieter/profil/tim-friedrichsen-immobilien-e-k/tim-friedrichsen',
        'https://www.friedrichsen-immobilien.de/impressum/',
        4,
        25,
        75,
        'miete',
        'Persoenlich gefuehrte Maklerstruktur mit Schwerpunkt Vermietung',
        'Hohe Mietquote erzeugt viele wiederkehrende Standardfragen',
        'Scout zeigt 4 Inserate, 75 Prozent Miete. Guter Pilotkandidat fuer schnelle Erstreaktion.',
        88,
        'A',
        'email',
        null,
        'Website und Impressum mit klaren Kontaktdaten vorhanden.',
        'Angst vor zu aggressiver Follow-up-Automatik'
      ),
      (
        'MAKRO IMMOBILIEN Pinneberg',
        'Sven P. Stein',
        'pinneberg@makro-immobilien.de',
        'Geschaeftsleitung',
        'Pinneberg',
        'Schleswig-Holstein',
        'https://www.makro-immobilien.de',
        'https://www.immobilienscout24.de/anbieter/profil/makro-immobilien-pinneberg-inh-sven-p-stein',
        'https://www.makro-immobilien.de/kontakt/buero-pinneberg/',
        10,
        70,
        30,
        'kauf',
        'Umland-Team mit gemischter Pipeline und klaren Ansprechpartnern',
        'Mehrere Berater brauchen einheitliche Antwortqualitaet trotz Lastspitzen',
        'Scout zeigt 10 Inserate (70 Prozent Kauf / 30 Prozent Miete). Routing-Logik ist zentral.',
        85,
        'A',
        'email',
        null,
        'Lokales Buero mit direkter Team- und Kontakttransparenz.',
        'Bedenken, dass KI interne Teamprozesse nicht beachtet'
      ),
      (
        'Elmshorner Immobilienkontor Joerg Saul e.K.',
        'Joerg Saul',
        'saul@eik-immobilien.de',
        'Inhaber',
        'Elmshorn',
        'Schleswig-Holstein',
        'https://eik-immobilien.de',
        'https://www.immobilienscout24.de/anbieter/profil/elmshorner-immobilienkontor-joerg-saul-e-k',
        'https://eik-immobilien.de/impressum/',
        6,
        33,
        67,
        'miete',
        'Regional etabliertes Inhaberbuero mit deutlichem Mietanteil',
        'Mietlastige Kommunikation bringt oft hohe Frequenz und Wiederholfragen',
        'Scout zeigt 6 Inserate und 67 Prozent Miete. Gute Passung fuer Standardantworten plus Guardrails.',
        89,
        'A',
        'email',
        null,
        'Langjaehrige Marktposition und klare Kontaktstrecke sichtbar.',
        'Sorge vor Verlust der persoenlichen Handschrift'
      ),
      (
        'AlsterLand Immobilien GmbH',
        'Rando Ehm',
        'info@alsterland-immobilien.de',
        'Geschaeftsfuehrer',
        'Hamburg',
        'Hamburg',
        'https://www.alsterland-immobilien.de',
        'https://www.immobilienscout24.de/anbieter/profil/alsterland-immobilien-gmbh',
        'https://www.alsterland-immobilien.de/impressum',
        10,
        90,
        10,
        'kauf',
        'Wachstumsorientierte Maklerstruktur mit kaufzentrierter Vermarktung',
        'Wachstumsdruck erhoeht Bedarf an nachvollziehbarer, schneller Erstkommunikation',
        'Scout zeigt 10 Inserate mit 90 Prozent Kauf. Sinnvoll fuer kontrollierten Pilotbetrieb.',
        84,
        'B',
        'email',
        null,
        'Website mit Teamdarstellung und direkter Management-Kontaktadresse.',
        'Bedenken, dass KI bei komplexen Faellen zu frueh sendet'
      )
  ) as t(
    company_name,
    contact_name,
    contact_email,
    contact_role,
    city,
    region,
    website_url,
    source_url,
    contact_source_url,
    active_listings_count,
    share_kauf_percent,
    share_miete_percent,
    object_focus,
    target_group,
    pain_point_hypothesis,
    personalization_hook,
    fit_score,
    priority,
    preferred_channel,
    linkedin_url,
    online_presence_note,
    primary_objection
  )
),
upserted as (
  insert into public.crm_prospects (
    agent_id,
    company_name,
    contact_name,
    contact_email,
    contact_role,
    city,
    region,
    website_url,
    source_url,
    source_checked_at,
    linkedin_url,
    linkedin_search_url,
    linkedin_relevance_note,
    object_focus,
    active_listings_count,
    share_miete_percent,
    share_kauf_percent,
    object_types,
    target_group,
    process_hint,
    primary_objection,
    primary_pain_hypothesis,
    secondary_pain_hypothesis,
    automation_readiness,
    cta_preference_guess,
    personalization_evidence,
    hypothesis_confidence,
    owner_led,
    brand_tone,
    trust_signals,
    pain_point_hypothesis,
    personalization_hook,
    fit_score,
    priority,
    preferred_channel,
    next_action,
    next_action_at,
    tags,
    metadata
  )
  select
    cfg.agent_id,
    s.company_name,
    s.contact_name,
    lower(s.contact_email),
    s.contact_role,
    s.city,
    s.region,
    s.website_url,
    s.source_url,
    '2026-03-06'::date,
    s.linkedin_url,
    format(
      'https://www.linkedin.com/search/results/all/?keywords=%s',
      replace(concat_ws(' ', s.contact_name, s.company_name, s.city, 'Immobilienmakler'), ' ', '%20')
    ),
    case
      when s.linkedin_url is not null then 'LinkedIn-Unternehmenssignal vorhanden.'
      else 'Kein direkter LinkedIn-Link verifiziert, Suchlink gesetzt.'
    end,
    s.object_focus,
    s.active_listings_count,
    s.share_miete_percent,
    s.share_kauf_percent,
    case
      when s.object_focus = 'miete' then array['Wohnung', 'Miete']::text[]
      when s.object_focus = 'kauf' then array['Wohnung', 'Haus', 'Kauf']::text[]
      else array['Wohnung', 'Haus', 'Gemischt']::text[]
    end,
    s.target_group,
    format(
      'Scout-Profil aktiv: %s Inserate (%s%% Kauf / %s%% Miete). Quelle: %s',
      s.active_listings_count,
      s.share_kauf_percent,
      s.share_miete_percent,
      s.source_url
    ),
    s.primary_objection,
    s.pain_point_hypothesis,
    'Unklare Faelle immer in die Freigabe legen, nicht automatisch senden.',
    case
      when s.fit_score >= 90 then 'hoch'
      when s.fit_score >= 84 then 'mittel'
      else 'niedrig'
    end,
    case
      when s.preferred_channel = 'email' then 'kurze_mail_antwort'
      when s.preferred_channel = 'kontaktformular' then 'formular_antwort'
      else '15_min_call'
    end,
    format(
      'Beleg: %s Inserate (%s%% Kauf / %s%% Miete). Kontaktquelle: %s',
      s.active_listings_count,
      s.share_kauf_percent,
      s.share_miete_percent,
      s.contact_source_url
    ),
    case
      when s.fit_score >= 90 then 0.90
      when s.fit_score >= 86 then 0.86
      when s.fit_score >= 82 then 0.82
      else 0.78
    end,
    (s.contact_role in ('Inhaber', 'Inhaberin', 'Geschaeftsfuehrer')),
    'professionell',
    case
      when s.linkedin_url is not null then array[s.online_presence_note, 'LinkedIn-Signal vorhanden']::text[]
      else array[s.online_presence_note]::text[]
    end,
    s.pain_point_hypothesis,
    s.personalization_hook,
    s.fit_score,
    s.priority,
    s.preferred_channel,
    'Personalisierte Tester-Einladung ohne Kaufdruck senden',
    now() + interval '1 day',
    array['pilot_target', 'hamburg_region', '2026_q1']::text[],
    jsonb_build_object(
      'research_date', '2026-03-06',
      'geo_cluster', 'hamburg_region',
      'source_portal', 'immobilienscout24',
      'source_url', s.source_url,
      'contact_source_url', s.contact_source_url,
      'active_listings_count', s.active_listings_count,
      'share_kauf_percent', s.share_kauf_percent,
      'share_miete_percent', s.share_miete_percent,
      'online_presence_note', s.online_presence_note,
      'advaic_relevance', case
        when s.fit_score >= 90 then 'hoch'
        when s.fit_score >= 84 then 'mittel_hoch'
        else 'mittel'
      end
    )
  from seed s
  cross join cfg
  on conflict (agent_id, lower(company_name), coalesce(lower(city), ''))
  do update set
    contact_name = excluded.contact_name,
    contact_email = excluded.contact_email,
    contact_role = excluded.contact_role,
    region = excluded.region,
    website_url = excluded.website_url,
    source_url = excluded.source_url,
    source_checked_at = excluded.source_checked_at,
    linkedin_url = excluded.linkedin_url,
    linkedin_search_url = excluded.linkedin_search_url,
    linkedin_relevance_note = excluded.linkedin_relevance_note,
    object_focus = excluded.object_focus,
    active_listings_count = excluded.active_listings_count,
    share_miete_percent = excluded.share_miete_percent,
    share_kauf_percent = excluded.share_kauf_percent,
    object_types = excluded.object_types,
    target_group = excluded.target_group,
    process_hint = excluded.process_hint,
    primary_objection = excluded.primary_objection,
    primary_pain_hypothesis = excluded.primary_pain_hypothesis,
    secondary_pain_hypothesis = excluded.secondary_pain_hypothesis,
    automation_readiness = excluded.automation_readiness,
    cta_preference_guess = excluded.cta_preference_guess,
    personalization_evidence = excluded.personalization_evidence,
    hypothesis_confidence = excluded.hypothesis_confidence,
    owner_led = excluded.owner_led,
    brand_tone = excluded.brand_tone,
    trust_signals = excluded.trust_signals,
    pain_point_hypothesis = excluded.pain_point_hypothesis,
    personalization_hook = excluded.personalization_hook,
    fit_score = excluded.fit_score,
    priority = excluded.priority,
    preferred_channel = excluded.preferred_channel,
    next_action = excluded.next_action,
    next_action_at = excluded.next_action_at,
    tags = excluded.tags,
    metadata = excluded.metadata,
    updated_at = now()
  returning id, agent_id, company_name, city
)
insert into public.crm_research_notes (
  prospect_id,
  agent_id,
  source_type,
  source_url,
  note,
  confidence,
  is_key_insight,
  metadata
)
select
  u.id,
  u.agent_id,
  'portal',
  s.source_url,
  format(
    'Region Hamburg: %s aktive Inserate, %s%% Kauf / %s%% Miete. Kontaktquelle: %s.',
    s.active_listings_count,
    s.share_kauf_percent,
    s.share_miete_percent,
    s.contact_source_url
  ),
  case
    when s.fit_score >= 90 then 0.90
    when s.fit_score >= 86 then 0.86
    else 0.82
  end,
  true,
  jsonb_build_object(
    'seed_batch', 'crm_targeted_hamburg_region_2026-03-06',
    'contact_source_url', s.contact_source_url,
    'online_presence_note', s.online_presence_note
  )
from upserted u
join seed s
  on s.company_name = u.company_name
 and s.city = u.city
where not exists (
  select 1
  from public.crm_research_notes n
  where n.prospect_id = u.id
    and n.agent_id = u.agent_id
    and coalesce(n.source_url, '') = coalesce(s.source_url, '')
);

commit;
