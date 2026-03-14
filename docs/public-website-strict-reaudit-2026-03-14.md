# Strikter Re-Audit der öffentlichen Website

Stand: `14. März 2026`

## Basis dieses Re-Audits

- frischer lokaler Next-Server auf `http://127.0.0.1:4111`
- harter HTTP-Check der wichtigsten Public-Routen via `curl`
- Code-Review der kritischen Public-Seiten und der gemeinsamen Public-Templates
- `npm run copy:check`:
  - grün
- `npx tsc --noEmit`:
  - rot
  - aktueller Fehler: kaputte `.next/dev/types/routes.d.ts`
- `npx next build`:
  - kompiliert zunächst erfolgreich
  - bricht danach im TypeScript-/Build-Worker mit OOM ab
- Playwright-Browser-Smokes:
  - in dieser Umgebung nicht als Qualitätsbeweis nutzbar
  - Chromium bricht weiter an `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)` ab

## Wichtigster Unterschied zum Audit vom 13. März

Das letzte Audit war vor allem eine Qualitäts- und Kompressionsbewertung.

Das neue Audit ist deutlich härter, weil es auf einem frischen Render-Stand einen echten Public-P0 zeigt:

- mehrere zentrale öffentliche Seiten sind aktuell faktisch nicht verfügbar

Damit verschiebt sich die Priorität vollständig:

- zuerst Route- und Build-Gesundheit
- erst danach wieder Conversion-, Layout- und Video-Feinschliff

## Benchmark-Rahmen

Verglichen wurde weiter gegen aktuelle öffentliche Seiten mit ähnlichem Ziel:

- [Intercom Fin](https://www.intercom.com/fin)
- [Zendesk AI](https://www.zendesk.com/service/ai/)
- [Front AI](https://front.com/ai)

Wichtiger Kontext:

- in Guardrails, Freigabe und ehrlicher Prozesslogik ist Advaic oft konkreter als diese Seiten
- in operativer Stabilität, Premium-Wirkung und „fertig wirkender“ Vertriebspräsenz ist Advaic aktuell klar darunter

## Harte Gesamtbewertung

- Gesamt: `4.8/10`
- Content-/Argumentationsqualität: `7.2/10`
- Trust ohne Kundenlogos: `7.3/10`
- Visual Hierarchy: `6.4/10`
- Premium-Wirkung: `6.1/10`
- Mobile-Kompression: `6.0/10`
- Technische Public-Route-Gesundheit: `2.5/10`
- Search-/Indexierbarkeit im aktuellen Zustand: `4.6/10`

## P0-Befunde

### `RA-14-01` Kritische Public-Routen fielen wegen kaputter Dev-Artefakte auf `404`

Status:

- behoben am `2026-03-14`
- Ursache war kein fehlender Route-Code, sondern ein inkonsistenter Dev-Stand aus:
  - kaputten `.next/dev/types`
  - inkonsistentem laufenden `next dev`-Prozess

Fix:

- `.next/dev/types` und `.next/dev/lock` bereinigt
- `next dev` frisch auf `4010` gestartet
- `.next/dev/types/routes.d.ts` generiert jetzt wieder vollständig
- `npx tsc --noEmit` läuft wieder grün

Bewertung:

- Der ursprüngliche Befund war korrekt und kritisch.
- Er war aber an einen kaputten lokalen Dev-Zustand gebunden, nicht an fehlende Routen im Produktcode.
- Der akute `404`-Blocker ist damit aufgehoben.

Wichtige technische Beobachtung:

- die betroffenen Seiten waren schon im Next-Manifest vorhanden, zum Beispiel:
  - `.next/server/app/produkt/page/app-paths-manifest.json`
  - `.next/server/app/preise/page/app-paths-manifest.json`
  - `.next/server/app/faq/page/app-paths-manifest.json`
  - `.next/server/app/trust/page/app-paths-manifest.json`
- die Routen waren also nicht „nicht vorhanden“, sondern registriert und kippten erst im kaputten Dev-Zustand in `404`

Inference:

- die Ursache lag zentral in der Dev-Route-/Typgenerierung
- route-spezifische Public-Page-Probleme waren hier nicht der Auslöser

### `RA-14-02` Serverseitiger Public-Route-Smoke fehlt nicht mehr

Befund:

- `npx tsc --noEmit` war rot
- die direkte Ursache lag in:
  - [.next/dev/types/routes.d.ts](/Users/kilianziemann/Downloads/advaic-dashboard/.next/dev/types/routes.d.ts#L86)

Die Datei war syntaktisch beschädigt. Die relevante Zeile begann mit:

- `-funktionierts" | "/trust" | ...`

Aktueller Stand:

- `.next/dev/types/routes.d.ts` generiert wieder vollständig
- `npx tsc --noEmit` ist grün
- serverseitiger Smoke existiert jetzt in:
  - [scripts/smoke-public-routes.mjs](/Users/kilianziemann/Downloads/advaic-dashboard/scripts/smoke-public-routes.mjs)
- npm-Shortcut:
  - `npm run smoke:public`

Bewertung:

- der Befund war echt und hing direkt mit den Laufzeit-`404`s zusammen
- der neue Smoke prüft jetzt die kritischen Public-Routen ohne Browser auf:
  - `200`
  - route-spezifische Marker
  - Ausschluss generischer `404`-Marker

### `RA-14-03` Produktions-Build ist nicht grün

Befund:

- ursprünglicher Stand:
  - `npx next build` kompiliert zuerst erfolgreich
  - bricht danach aber im TypeScript-/Build-Worker mit OOM ab
- nach dem Fix:
  - lokale/offline-sichere Fonts statt `next/font/google`
  - `app/api/og/route.tsx` ohne ungültige Route-Exports
  - betroffene Admin-Seiten auf Next-16-`params`/`searchParams`-Promises umgestellt
  - stabiler Produktionspfad jetzt über Webpack mit erhöhtem Heap

Bewertung:

- der frühere Release-Blocker ist aufgehoben
- der stabile Standard ist jetzt:
  - `npm run build`
  - intern: `node --max-old-space-size=6144 ./node_modules/next/dist/bin/next build --webpack`

## P1-Befunde

### Homepage `/`

- Score: `7.1/10`
- Stark:
  - Hero ist deutlich klarer als noch vor einigen Tagen
  - Preis ist öffentlich
  - Trust wirkt weniger defensiv
- Schwach:
  - der Proof-Bereich ist immer noch etwas zu karten- und erklärlastig
  - das erste „Wow, das ist fertig“ fehlt weiterhin

### Branchen-Hub `/branchen`

- Score: `6.9/10`
- Stark:
  - aktuell die stabilste der Discovery-/SEO-Hub-Seiten
  - saubere Trennung zwischen Marktfit und operativen Mustern
- Schwach:
  - visuell noch zu card-basiert
  - wirkt eher kompetent als wirklich stark geführt

### Datenschutz `/datenschutz`

- Score: `7.4/10`
- Stark:
  - neuer gemeinsamer Dokumentrahmen ist sichtbar besser
  - gute Transparenz- und Navigationslogik
- Schwach:
  - weiter dokumentationsstark, aber nicht besonders elegant
  - typografisch noch eher „ruhig korrekt“ als „hochwertig“

### Cookie & Storage `/cookie-und-storage`

- Score: `7.2/10`
- Stark:
  - deutlich besser lesbar als vorher
  - gute Dokumentfamilien-Logik
- Schwach:
  - Tabelle bleibt visuell schwer
  - könnte auf Mobile noch verdichteter werden

## Was gegen Benchmarks aktuell am meisten fehlt

### Gegen Intercom Fin

- Advaic ist ehrlicher und oft konkreter in Guardrail-Logik
- Intercom ist klar besser in:
  - Kompression
  - visueller Dominanz
  - Selbstverständlichkeit im Kaufpfad

### Gegen Zendesk AI

- Advaic ist konkreter in Freigabe- und Risikoerklärung
- Zendesk ist klar besser in:
  - operativer Reife
  - Navigationssicherheit
  - Enterprise-Anmutung

### Gegen Front AI

- Advaic ist präziser in Prozessbeschreibung
- Front ist klar besser in:
  - Visual-Cropping
  - Spacing
  - Produktinszenierung

## Neue harte Prioritätenliste

### `RA-14-01` Public-Route-Gesundheit komplett reparieren

- Priorität: `P0`
- Ziel:
  - alle kritischen Public-Routen müssen auf frischem Server `200` liefern
- zuerst prüfen:
  - gemeinsame Template-/Routing-Schicht
  - Route-Typgenerierung
  - gemeinsame Imports der betroffenen Public-Seiten
- DoD:
  - `/produkt`
  - `/preise`
  - `/so-funktionierts`
  - `/sicherheit`
  - `/faq`
  - `/use-cases`
  - `/integrationen`
  - `/trust`
  - `/unterauftragsverarbeiter`
  - `/nutzungsbedingungen`
  - `/roi-rechner`
  - liefern auf frischem Next-Server `200`

### `RA-14-02` Route-Health-Smoke ohne Browser einführen

- Priorität: `P0`
- Ziel:
  - eine öffentliche Route darf nicht erst per manueller Sichtprüfung als kaputt auffallen
- Umsetzung:
  - serverseitiger `curl`-/`fetch`-Smoke für alle Money-, Hub- und Legal-Seiten
  - eigener npm-Command
- DoD:
  - Route-Health ist in unter 10 Sekunden lokal und in CI prüfbar

### `RA-14-03` `next build` stabil grün bekommen

- Priorität: `P0`
- Ziel:
  - Produktions-Build darf nicht im TypeScript-/Worker-Schritt mit OOM enden
- DoD:
  - `npx next build` läuft lokal oder in CI vollständig durch

### `RA-14-04` Homepage-Proof erst nach Route-Fix weiter komprimieren

- Priorität: `P1`
- Ziel:
  - weniger Text
  - klarerer Hauptbeweis
  - teurer wirkende Hero-/Proof-Inszenierung

### `RA-14-05` Branchen-/Use-Case-Hubs visuell premiumisieren

- Priorität: `P1`
- Ziel:
  - weniger Card-Wand
  - stärker geführter Lesefluss
  - klarere Dominanz der wichtigsten Entscheidung

### `RA-14-06` Founder-Videos erst nach finalen Assets prominent integrieren

- Priorität: `P1`
- Status:
  - inhaltlich vorbereitet
  - öffentlich prominent erst sinnvoll, wenn echte finale Videos vorliegen

## Mein hartes Urteil

Inhaltlich ist die Website heute deutlich besser als vor wenigen Tagen.

Technisch ist sie im aktuellen Stand aber nicht release-sicher genug, um die Seite als „stark“ zu bewerten, weil zu viele zentrale Public-Routen auf einem frischen Render-Stand wegbrechen.

Deshalb ist die richtige Reihenfolge jetzt nicht:

- noch mehr Copy
- noch mehr Visual-Polish
- noch mehr Video-Integration

Sondern zuerst:

1. Route-Gesundheit
2. Build-Gesundheit
3. Route-Smokes
4. erst danach wieder Conversion- und Layout-Polish
