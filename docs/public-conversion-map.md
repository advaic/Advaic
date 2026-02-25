# Public Conversion Map (v1)

Stand: 25. Februar 2026

## URL-Familien und Zielpfade

| Familie | URL-Muster | Funnel-Stufe | Primary-Ziel | Secondary-Ziel | Reporting-Key |
|---|---|---|---|---|---|
| `home` | `/` | `orientierung` | `/signup` | `/produkt` | `lp_home_v1` |
| `produkt` | `/produkt*` | `bewertung` | `/signup` | `/produkt#simulator` | `lp_produkt_v1` |
| `prozess` | `/so-funktionierts*` | `orientierung` | `/signup` | `/autopilot-regeln` | `lp_prozess_v1` |
| `regeln` | `/autopilot*`, `/autopilot-regeln*` | `bewertung` | `/signup` | `/qualitaetschecks` | `lp_regeln_v1` |
| `qualitaet` | `/qualitaetschecks*` | `bewertung` | `/signup` | `/freigabe-inbox` | `lp_qualitaet_v1` |
| `freigabe` | `/freigabe-inbox*`, `/makler-freigabe-workflow*` | `bewertung` | `/signup` | `/produkt#freigabe` | `lp_freigabe_v1` |
| `followups` | `/follow-up-logik*` | `bewertung` | `/signup` | `/produkt#followups` | `lp_followups_v1` |
| `vergleich` | `/manuell-vs-advaic*` | `entscheidung` | `/signup` | `/produkt#safe-start-konfiguration` | `lp_vergleich_v1` |
| `fit` | `/use-cases*`, `/branchen*`, `/email-automatisierung-immobilienmakler*` | `bewertung` | `/signup` | `/produkt#safe-start-konfiguration` | `lp_fit_v1` |
| `preise` | `/preise*` | `entscheidung` | `/signup` | `/faq` | `lp_preise_v1` |
| `faq` | `/faq*` | `entscheidung` | `/signup` | `/trust` | `lp_faq_v1` |
| `trust` | `/sicherheit*`, `/dsgvo-email-autopilot*`, `/trust*` | `bewertung` | `/signup` | `/dsgvo-email-autopilot` | `lp_trust_v1` |
| `legal` | `/impressum*`, `/datenschutz*`, `/cookie-und-storage*` | `orientierung` | `/produkt` | `/trust` | `lp_legal_v1` |
| `other` | Rest | `orientierung` | `/signup` | `/produkt` | `lp_other_v1` |

## Event-Schema (Public Tracking)

Alle Public-Events enthalten automatisch:

- `landing_family`
- `landing_reporting_key`
- `landing_stage`
- `landing_primary_href`
- `landing_secondary_href`
- `entry_path`
- `entry_query`
- `entry_referrer`
- `entry_at`
- `section`

Technische Quelle:

- `lib/marketing/conversion-map.ts`
- `lib/funnel/public-track.ts`

