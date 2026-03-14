# Search Console & Bing Ops Runbook

Stand: 11. März 2026

## Ziel

Die Website soll suchseitig nicht mehr blind sein. Dieses Runbook deckt die technische Vorbereitung im Repo und die externen Schritte in Google Search Console und Bing Webmaster Tools ab.

## Offizielle Referenzen

- Google Search Console Einführung:
  - [Google Search Console: Getting started](https://support.google.com/webmasters/answer/9128668?hl=en)
- Google-Verifizierung:
  - [Verify your site ownership in Search Console](https://support.google.com/webmasters/answer/9008080?hl=en)
- Google Search Essentials:
  - [Search Essentials](https://developers.google.com/search/docs/essentials)
- Bing-Verifizierung:
  - [Verify site ownership in Bing Webmaster Tools](https://learn.microsoft.com/en-us/power-pages/configure/add-site-to-webmaster-tools)
- Bing IndexNow:
  - [IndexNow protocol and setup](https://www.bing.com/indexnow)

## Was im Repo jetzt vorbereitet ist

- [robots.ts](/Users/kilianziemann/Downloads/advaic-dashboard/app/robots.ts) verweist auf die produktive Sitemap.
- [sitemap.ts](/Users/kilianziemann/Downloads/advaic-dashboard/app/sitemap.ts) liefert reale `lastmod`-Werte statt global `now`.
- [layout.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/layout.tsx) unterstützt Verifizierungs-Meta-Tags für Google und Bing.
- [route.ts](/Users/kilianziemann/Downloads/advaic-dashboard/app/BingSiteAuth.xml/route.ts) kann optional eine echte `BingSiteAuth.xml` aus Env ausliefern.
- [llms.txt/route.ts](/Users/kilianziemann/Downloads/advaic-dashboard/app/llms.txt/route.ts) beschreibt die wichtigsten Retrieval- und Produktseiten für AI-Crawler.
- Das Fokus-Set für die ersten Property-Auswertungen liegt in [search-focus-set-2026-03-11.csv](/Users/kilianziemann/Downloads/advaic-dashboard/docs/search-focus-set-2026-03-11.csv).
- Das Baseline-Template liegt in [search-baseline-template-2026-03-11.csv](/Users/kilianziemann/Downloads/advaic-dashboard/docs/search-baseline-template-2026-03-11.csv).

## Relevante Env-Variablen

- `NEXT_PUBLIC_SITE_URL`
  - soll produktiv auf `https://www.advaic.com` stehen
- `GOOGLE_SITE_VERIFICATION`
  - optional für URL-Prefix-Property per HTML-Meta-Tag
- `BING_SITE_VERIFICATION`
  - optional für Bing-Meta-Tag `msvalidate.01`
- `BING_SITE_AUTH_XML`
  - optionaler kompletter XML-Inhalt für `https://www.advaic.com/BingSiteAuth.xml`

## Google Search Console

Empfehlung:

1. `Domain property` für `advaic.com` anlegen
2. zusätzlich `URL-prefix property` für `https://www.advaic.com/` anlegen

Warum beide?

- Die Domain-Property aggregiert Subdomains und Protokolle sauber.
- Die URL-Prefix-Property ist für operative Checks auf der Live-URL oft bequemer.

### Externe Schritte

1. In Search Console `Property hinzufügen` öffnen.
2. `Domain` wählen und `advaic.com` eintragen.
3. Den bereitgestellten DNS-Record bei eurem DNS-Provider eintragen.
4. Record bestehen lassen, nicht nach erfolgreicher Prüfung löschen.
5. Danach zusätzlich `https://www.advaic.com/` als URL-Prefix-Property anlegen.
6. Für die URL-Prefix-Property entweder:
   - denselben bereits wirksamen DNS-Weg nutzen
   - oder `GOOGLE_SITE_VERIFICATION` setzen und per HTML-Meta-Tag verifizieren
7. In beiden Properties die Sitemap `https://www.advaic.com/sitemap.xml` einreichen.

### Direkt nach der Verifizierung

1. Die Fokus-URLs aus [search-focus-set-2026-03-11.csv](/Users/kilianziemann/Downloads/advaic-dashboard/docs/search-focus-set-2026-03-11.csv) mit URL-Inspektion anstoßen.
2. Prüfen, ob `Coverage`/`Indexing` keine offensichtlichen Blocker zeigt.
3. Nach 7 Tagen die erste Baseline in [search-baseline-template-2026-03-11.csv](/Users/kilianziemann/Downloads/advaic-dashboard/docs/search-baseline-template-2026-03-11.csv) eintragen.
4. Nach 28 Tagen dieselbe Baseline erneut exportieren.

## Bing Webmaster Tools

Empfehlung:

1. Site `https://www.advaic.com/` anlegen
2. wenn möglich denselben verifizierten Eigentümer wie in Google nutzen
3. danach Sitemap einreichen
4. optional API-Key erzeugen
5. optional IndexNow aktivieren

### Externe Schritte

1. In Bing Webmaster Tools `Add a site` öffnen.
2. `https://www.advaic.com/` eintragen.
3. Eine Verifizierungsmethode wählen:
   - `HTML Meta Tag`
     - `BING_SITE_VERIFICATION` setzen
   - `XML File`
     - den vollständigen XML-Inhalt in `BING_SITE_AUTH_XML` setzen
     - danach prüfen, dass `https://www.advaic.com/BingSiteAuth.xml` `200` liefert
   - `DNS`
     - Record im DNS-Provider eintragen
4. Nach erfolgreicher Verifizierung die Sitemap `https://www.advaic.com/sitemap.xml` einreichen.
5. Optional unter API Access einen Bing Webmaster API Key erzeugen.
6. Optional IndexNow aktivieren, sobald die Property verifiziert ist.

## Fokus-Set für erste Search-Auswertung

Die ersten Auswertungen sollen sich nicht auf alle Seiten verteilen, sondern auf die kaufnahen und suchstarken Einstiegsseiten.

Primäres Fokus-Set:

- `/`
- `/produkt`
- `/preise`
- `/so-funktionierts`
- `/sicherheit`
- `/faq`
- `/manuell-vs-advaic`
- `/best-software-immobilienanfragen`
- `/best-ai-tools-immobilienmakler`
- `/ki-fuer-immobilienmakler`
- `/immobilienanfragen-automatisieren`
- `/email-automatisierung-immobilienmakler`
- `/autopilot`
- `/qualitaetschecks`
- `/freigabe-inbox`

## Baseline, die ihr exportieren solltet

Mindestens für 7 und 28 Tage:

- Klicks
- Impressionen
- CTR
- durchschnittliche Position
- Top-Queries pro Fokus-URL
- Top-Länder
- Top-Geräte

Zusätzlich sinnvoll:

- welche URLs gar keine Impressionen bekommen
- welche URLs Impressionen, aber schlechte CTR haben
- welche URLs Klicks, aber schwache Position halten

## Troubleshooting

### Google

- DNS-Verifikation kann laut Google 1 bis 3 Tage brauchen.
- Meta-Tag-Verifikation funktioniert nur auf der öffentlichen Homepage im `<head>`.
- Die Sitemap ist nur ein Signal, keine Index-Garantie.

### Bing

- Meta-Tag muss in der Roh-HTML im `<head>` sichtbar sein.
- `BingSiteAuth.xml` muss direkt unter der Root-URL ohne Redirect erreichbar sein.
- Bei CDN- oder Cache-Layern immer erst die Live-Ausgabe prüfen.

## Offene externe Schritte

Diese Schritte kann ich lokal nicht selbst abschließen, weil dafür Zugriff auf eure Google- und Microsoft-Accounts nötig ist:

- Property in Search Console anlegen
- Property in Bing Webmaster Tools anlegen
- DNS-Einträge bei eurem DNS-Provider setzen
- Sitemap in den Portalen einreichen
- Baseline aus den Portalen exportieren
