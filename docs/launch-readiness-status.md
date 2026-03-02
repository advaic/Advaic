# Launch-Readiness Status (Go/No-Go)

Stand: 02.03.2026  
Scope: aktueller Stand im Repository `advaic-dashboard`.

Legende:
- `PASS` = für Launch belastbar
- `TEILWEISE` = grundsätzlich vorhanden, aber mit Restrisiko
- `OFFEN` = fehlt für sauberen Launch

Automatischer Check:
- Ergebnis `launch:check`: erweitert um technische Launch-Gates (robots/sitemap/noindex, Cookie-Banner-Mount, Ops-Webhook-Support).
- Offene Pflichtpunkte bleiben in der Regel weiterhin env-/organisationsgetrieben (`NEXT_PUBLIC_LEGAL_*`, juristische Finalprüfung, produktionsnahe Abnahme).
- Env-Audit: `npm run launch:env` (sichere Ausgabe ohne Secret-Leak).

## 0) Release-Rahmen
- Status: `TEILWEISE`
- Bewertung:
  - Technischer Rahmen ist vorhanden.
  - Formale Freigabe-Rollen und finales Go/No-Go-Protokoll müssen vor Launch aktiv gepflegt werden.
- Nächster Schritt:
  - Rollen, Termin, Rollback-Entscheider in [launch-checklist.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/launch-checklist.md) verbindlich ausfüllen.

## 1) Recht, Datenschutz, Pflichtseiten (P0)
- Status: `TEILWEISE`
- Nachweis:
  - Impressum: [app/impressum/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/impressum/page.tsx)
  - Datenschutz: [app/datenschutz/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/datenschutz/page.tsx)
  - Cookie & Storage: [app/cookie-und-storage/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/cookie-und-storage/page.tsx)
- Neu ergänzt:
  - AVV-Prozess: [avv-prozess.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/avv-prozess.md)
  - VVT: [vvt.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/vvt.md)
  - TOM: [tom.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/tom.md)
  - DSAR-Runbook: [dsar-runbook.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/dsar-runbook.md)
  - Incident/Breach-Runbook: [incident-breach-runbook.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/incident-breach-runbook.md)
  - DSB-Prüfung: [dsb-pruefung.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/dsb-pruefung.md)
  - Subprocessor-Register (intern): [subprocessor-register.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/subprocessor-register.md)
- Rest-Risiko:
  - Juristische Finalprüfung der Texte durch Rechtsberatung bleibt erforderlich.

## 2) Produkt- und Sicherheitslogik
- Status: `PASS`
- Nachweis:
  - Produktseite + Regeln + Qualitätschecks + Freigabe-Logik vorhanden.
  - Pipelines arbeiten fail-safe und mit Freigabe bei Unsicherheit.

## 3) Betriebsfähigkeit (Ops)
- Status: `PASS`
- Nachweis:
  - Ops-Control-Center: [app/app/admin/ops/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/app/admin/ops/page.tsx)
  - Ops-Status API: [app/api/admin/ops/status/route.ts](/Users/kilianziemann/Downloads/advaic-dashboard/app/api/admin/ops/status/route.ts)
  - Alert-Runner: [app/api/pipeline/ops/alerts/run/route.ts](/Users/kilianziemann/Downloads/advaic-dashboard/app/api/pipeline/ops/alerts/run/route.ts)
  - Neu: Alerting enthält zusätzliche Billing-/Signup-/API-Probe-Signale plus optionale externe Webhook-Zustellung (`ADVAIC_OPS_ALERT_WEBHOOK_URL`).
  - Pipeline-Run-Logging in Kernpipelines (reply/followups/onboarding/outlook fetch).
  - Cron-Setup-Doku: [supabase-cron-setup.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/supabase-cron-setup.md)

## 4) Auth, Billing, Zugriffsgrenzen
- Status: `PASS`
- Nachweis:
  - Trial-/Commercial-Gates: [lib/billing/commercial-access.ts](/Users/kilianziemann/Downloads/advaic-dashboard/lib/billing/commercial-access.ts)
  - Checkout/Webhook/Portal vorhanden und integriert.
  - Upgrade-Pflicht wird in send/followup/settings-Routen berücksichtigt.

## 5) Datenqualität und Datenmodell
- Status: `TEILWEISE`
- Nachweis:
  - Immobilienmodell erweitert, Startklar-/Gate-Logik vorhanden.
  - Frühere `uri`/`url`-Inkonsistenz wurde behoben.
- Rest-Risiko:
  - Produktive Datenqualität hängt von konsequenter Feldpflege im Betrieb ab.

## 6) QA, Test und Abnahme
- Status: `TEILWEISE`
- Nachweis:
  - Typecheck ist grün (`npx tsc --noEmit`).
  - Critical E2E lokal erfolgreich ausführbar, inkl. Vertragschecks für Signup-/Billing-Gates und Public-SEO-Endpunkte (`/robots.txt`, `/sitemap.xml`).
- Nächster Schritt:
  - Finalen E2E-Lauf in produktionsnaher Umgebung (Staging/Preview mit stabiler Erreichbarkeit) durchführen und dokumentieren.

## 7) Public Website und Conversion
- Status: `TEILWEISE`
- Nachweis:
  - Inhaltlich stark ausgebaut, mehrere Funnel-/Erklärseiten vorhanden.
  - Neu ergänzt: öffentliche Subprocessor-Seite.
- Rest-Risiko:
  - Finale mediale Assets (Videos/Visuals) und letzte Copy-Freigabe müssen vor Launch abgeschlossen werden.

## 8) Support- und Betriebsprozesse
- Status: `TEILWEISE`
- Nachweis:
  - Admin-/Support-Flows vorhanden.
  - Runbooks neu ergänzt.
- Rest-Risiko:
  - Operative SLA-Ziele und Verantwortliche müssen organisatorisch final gesetzt werden.

## 9) Launch-Tag Runbook
- Status: `PASS`
- Nachweis:
  - Checkliste + konkrete Ops-Metriken + Rollback-Kriterien in [launch-checklist.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/launch-checklist.md) enthalten.

## 10) Gesamturteil
- Aktueller Status: `TEILWEISE GO`
- Interpretation:
  - Technisch ist das Produkt nah an launchfähig.
  - Für ein sauberes Risiko-Profil fehlen vor allem:
    - vollständige rechtliche Umgebungswerte (`NEXT_PUBLIC_LEGAL_*`) in Produktion,
    - juristische Finalprüfung der neuen Compliance-Dokumente,
    - produktionsnaher dokumentierter E2E-Abnahmelauf,
    - finale Content-/Asset-Freigabe auf allen öffentlichen Seiten.
