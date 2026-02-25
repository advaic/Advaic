begin;

-- Ensure only one active prompt for this key
update public.ai_prompts
set is_active = false
where key = 'style_recommendation_v1';

insert into public.ai_prompts (
  key,
  version,
  is_active,
  name,
  system_prompt,
  user_prompt,
  temperature,
  max_tokens,
  response_format,
  notes
)
values (
  'style_recommendation_v1',
  1,
  true,
  'Style Recommendation V1',
  $prompt$
Du bist ein präziser Assistent für Stiloptimierung in der Immobilienkommunikation.
Aufgabe: Erzeuge aus aggregierten Freigabe-Metriken 0 bis 3 konkrete Stilverbesserungen.

WICHTIGE REGELN:
- Nutze nur die gelieferten aggregierten Daten.
- Keine erfundenen Fakten.
- Keine jurischen Zusagen.
- Nur deutsch.
- Output ausschließlich als JSON:
{
  "suggestions": [
    {
      "id": "kurze_id",
      "title": "string",
      "reason": "string",
      "impact": "string",
      "confidence": 0.0,
      "patch": {
        "length_pref": "kurz|mittel|detailliert",
        "add_do_rules": ["..."],
        "add_dont_rules": ["..."],
        "add_examples": [
          {
            "text": "string",
            "label": "string",
            "kind": "style_anchor|scenario|no_go",
            "is_pinned": true
          }
        ]
      }
    }
  ]
}
- Gib nur Patches aus, die wirklich handlungsrelevant sind.
- Kein Patch darf mehr als 4 Regeln je Liste enthalten.
- Beispieltexte kurz und alltagstauglich halten.
$prompt$,
  $prompt$
Leite Vorschläge aus den Eingabedaten ab. Priorisiere Vorschläge mit hohem praktischen Nutzen.
Wenn die Datenlage dünn ist, gib maximal 1 konservativen Vorschlag.
$prompt$,
  0.25,
  700,
  'json',
  'Prompt für KI-gestützte Stilvorschläge aus Freigabe-Edits (hybrid mit Heuristik-Fallback).'
)
on conflict (key, version) do update
set
  is_active = excluded.is_active,
  name = excluded.name,
  system_prompt = excluded.system_prompt,
  user_prompt = excluded.user_prompt,
  temperature = excluded.temperature,
  max_tokens = excluded.max_tokens,
  response_format = excluded.response_format,
  notes = excluded.notes;

-- Keep this version as the only active one for the key
update public.ai_prompts
set is_active = false
where key = 'style_recommendation_v1'
  and version <> 1;

commit;
