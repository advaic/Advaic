# Strikter Re-Audit der öffentlichen Website

Stand: `13. März 2026`

## Basis dieses Re-Audits

- aktueller Code-Stand der öffentlichen Routen unter `app/*` und `components/marketing/*`
- lokaler HTTP-Check der Kernrouten:
  - `/`
  - `/produkt`
  - `/preise`
  - `/so-funktionierts`
  - `/sicherheit`
  - `/faq`
  - `/branchen`
  - `/use-cases`
- Public-Smokes grün:
  - `tests/playwright/public-home.spec.ts`
  - `tests/playwright/public-product.spec.ts`
  - `tests/playwright/public-pricing.spec.ts`
  - Ergebnis: `11 passed`
- Public-Video-Smokes grün:
  - `tests/playwright/public-videos.spec.ts`
  - Ergebnis: `5 passed`
- Benchmark-Vergleich gegen aktuelle öffentliche Seiten mit ähnlichem Vertriebsziel:
  - [Intercom Fin](https://www.intercom.com/help/en/articles/9515824-what-is-fin)
  - [Zendesk AI](https://www.zendesk.com/service/ai/)
  - [Front](https://front.com/)

Wichtig:

- Diese Bewertung ist bewusst hart.
- Sie bewertet nicht „besser als vorher“, sondern „wie stark wirkt die Website heute gegen wirklich gute B2B-SaaS-Seiten?“
- Sie berücksichtigt ausdrücklich, dass aktuell noch keine finalen Founder-Videos vorliegen.

## Kurzurteil

Die öffentliche Website ist inzwischen fachlich glaubwürdig und deutlich sauberer als viele generische AI-SaaS-Seiten. Sie ist aber noch nicht auf dem Niveau einer wirklich starken High-Intent-SaaS-Seite, die in einem Zug

- schnell verstanden wird,
- visuell teuer wirkt,
- Vertrauen ohne Kundenlogos aufbaut,
- und Besucher sauber in Test oder Produktprüfung führt.

## Harte Bewertung

- Gesamt: `6.9/10`
- Desktop: `7.3/10`
- Mobile: `6.0/10`
- Verständlichkeit: `7.6/10`
- Conversion-Architektur: `6.8/10`
- Trust ohne Referenzen: `7.0/10`
- Visual Hierarchy: `6.2/10`
- Premium-Wirkung: `6.0/10`
- SEO-/Guide-Qualität: `7.7/10`

## Vergleich mit starken Benchmark-Seiten

### Gegen Intercom Fin

Intercom ist aktuell klar besser in:

- Hook-Schärfe
- Kompression im Hero
- stärkerem „Jetzt verstehen“-Rhythmus
- aggressiverer Vertrauensarchitektur

Advaic ist aktuell besser in:

- echter Guardrail-Logik
- konkreter Aussage, wann Auto stoppt
- nachvollziehbarer Freigabe-Mechanik

Urteil:

- Intercom verkauft härter.
- Advaic erklärt ehrlicher.
- Für Kaufstärke fehlt Advaic noch die gleiche Kompression und Selbstverständlichkeit.

### Gegen Zendesk AI

Zendesk ist aktuell klar besser in:

- Enterprise-Vertrauen
- Navigationssicherheit
- modularer Beweisführung
- fertig wirkender Produkt- und Markenpräsenz

Advaic ist aktuell besser in:

- weniger Buzzword-Sprech
- glaubwürdigere Aussagen zu Freigabe und Risikogrenzen

Urteil:

- Zendesk wirkt größer und fertiger.
- Advaic wirkt produktnäher, aber noch nicht stark genug inszeniert.

### Gegen Front

Front ist aktuell klar besser in:

- Screenshot-Inszenierung
- Spacing und Premium-Komposition
- leiser, teurer wirkender Produktdarstellung

Advaic ist aktuell besser in:

- Erklärung der Regel- und Freigabelogik
- ehrlicher Darstellung operativer Grenzen

Urteil:

- Front wirkt visuell reifer.
- Advaic ist argumentativ konkreter.

## Route-für-Route-Bewertung

### `/`

- Score: `7.4/10`
- Stark:
  - Hero ist deutlich klarer als früher
  - Preis wird öffentlich genannt
  - Trust ist glaubwürdiger und nicht mehr defensiv
- Schwach:
  - der Proof-Block unter dem Hero ist noch immer zu text- und kartenlastig
  - visuell noch nicht scharf genug priorisiert
  - der erste Eindruck ist solide, aber noch nicht „wow, fertig, professionell“

### `/produkt`

- Score: `7.0/10`
- Stark:
  - reale Produktlogik
  - echte Freigabe-/Check-Mechanik
  - produktnäher als typische Features-Seiten
- Schwach:
  - noch immer etwas zu lang
  - zu viele Sektionen folgen derselben Kartenlogik
  - Hero und erste Beweiszonen wirken noch nicht hochwertig genug komprimiert

### `/preise`

- Score: `6.9/10`
- Stark:
  - Preis ist jetzt öffentlich und konsistent
  - Kauflogik ist nachvollziehbar
- Schwach:
  - der Fold ist noch nicht hart genug auf Kaufentscheidung gebaut
  - die Seite ist noch halb Preis-Seite, halb Entscheidungs-Guide

### `/so-funktionierts`

- Score: `7.5/10`
- Stark:
  - value-first
  - gute Suchintention
  - fachlich stark
- Schwach:
  - visuell zu viel Kartenstapel
  - der eigentliche Prozess ist nicht als dominantes Diagramm sichtbar

### `/sicherheit`

- Score: `7.6/10`
- Stark:
  - inhaltlich seriös
  - gute operative Fragen
  - wertvoller Trust-Inhalt
- Schwach:
  - noch zu card-lastig
  - könnte stärker wie „Prüfseite“ und weniger wie „Landingpage mit Boxen“ wirken

### `/faq`

- Score: `6.8/10`
- Stark:
  - nützlich als Hub
  - gute Weiterleitungen in Tiefe
- Schwach:
  - zu breit
  - zu viel Link-Hub-Charakter
  - nicht klar genug priorisiert, welche 5 bis 8 Fragen wirklich zuerst zählen

### `/branchen`

- Score: `6.4/10`
- Schwach:
  - zu nah an `/use-cases`
  - wirkt eher wie sauberer SEO-Hub als wie starke Entscheidungsseite

### `/use-cases`

- Score: `6.5/10`
- Schwach:
  - überschneidet sich strukturell und sprachlich mit `/branchen`
  - noch nicht klar genug, warum beide Seiten getrennt existieren müssen

### `/integrationen`

- Score: `5.8/10`
- Schwach:
  - zu dünn für einen eigenen Hub
  - zwei Karten rechtfertigen die Seite aktuell kaum
  - Integrations-Detailseiten verlinken öffentlich teilweise direkt in App-Routen

### `/trust`

- Score: `6.1/10`
- Schwach:
  - dupliziert die Rolle von `/sicherheit` und `/datenschutz`
  - wirkt wie eigener Hub, ohne eine scharfe eigenständige Aufgabe zu haben
  - Metadata ist noch nicht im gleichen Standard wie die Money-Pages

### `/roi-rechner`

- Score: `6.6/10`
- Stark:
  - seriöse Einordnung
  - konservative Methodik
- Schwach:
  - relativ hohe Erklärlast vor echter Interaktion
  - noch kein schneller Beispielpfad für „typisches Maklerteam“

### Watch-/Demo-Seiten

- Score: `6.9/10`
- Stark:
  - technisch sauber
  - Player, Kapitel, Transkript, CTA vorhanden
- Schwach:
  - strategisch noch Nebenpfad
  - ohne finale Founder-Videos noch nicht stark genug als Haupt-Trust-Asset

## Die wichtigsten harten Probleme

### 1. Die Website ist glaubwürdig, aber noch nicht stark genug komprimiert

Ihr habt an vielen Stellen gute inhaltliche Antworten. Was noch fehlt, ist die gleiche Härte in:

- Hierarchie
- Kürze
- visueller Dominanz
- Conversion-Rhythmus

### 2. Zu viele Public-Seiten benutzen dieselbe Informationsarchitektur

Aktuell sehen viele Seiten so aus:

- Intro
- 2 bis 4 Karten
- Listen
- weitere Karten
- CTA

Das ist ordentlich, aber nicht differenziert genug. Besonders betroffen:

- `/so-funktionierts`
- `/sicherheit`
- `/faq`
- `/branchen`
- `/use-cases`
- `/integrationen`

### 3. Einige Public-Routen haben noch klare Logik- und Routing-Schwächen

Am deutlichsten:

- `Gmail` und `Outlook` verlinken öffentlich direkt auf `/app/konto/verknuepfungen`
- `SecurityPrivacy` verlinkt öffentlich auf `/app/konto/loeschen`

Für anonyme Website-Besucher sind das schlechte Public-Pfade.

### 4. Metadata- und Share-Parität ist noch nicht vollständig

Mehrere Public-Routen verwenden noch manuelle Metadata oder OG-/Twitter-Fallbacks mit App-Icon statt route-spezifischer Share-Logik.

Besonders betroffen:

- `/trust`
- `/integrationen`
- `/integrationen/gmail`
- `/integrationen/outlook`
- `/makler-freigabe-workflow`
- `/unterauftragsverarbeiter`
- einzelne Restseiten unter `/einwaende/*` und `/use-cases/*`

### 5. Die Video-Infrastruktur ist fertig, aber noch nicht conversion-relevant

Das ist aktuell kein technischer Defekt, aber strategisch noch unvollständig.

- Watch-Seiten funktionieren
- Produkt und Homepage nutzen sie noch nicht als echten Trust-Pfad
- ohne finale Founder-Videos sollte dieser Block nicht forciert werden

## Nächste konkrete Welle

## P0 – Als Nächstes

### `NW-01` Homepage-Proof radikal komprimieren

- Status: `erledigt`

- Problem:
  - [ProductVisualAuthority.tsx](../components/marketing/ProductVisualAuthority.tsx) ist glaubwürdig, aber noch zu erklärig und zu flach priorisiert.
- Dateien:
  - [ProductVisualAuthority.tsx](../components/marketing/ProductVisualAuthority.tsx)
  - [app/page.tsx](../app/page.tsx)
- Änderung:
  - eine dominante Hauptvisual
  - maximal zwei Nebenbeweise
  - pro Beweis nur eine Aussageebene statt `Mechanik + Beweis + Einordnung` in jeder Karte
- DoD:
  - der Block ist in 10 Sekunden scannbar
  - weniger Text, klarere Dominanz
- Ergebnis:
  - eine dominante Hauptfläche mit sichtbarem Versandpfad statt gestapelter Gleichgewichtung
  - nur noch zwei Nebenbeweise im rechten Rail
  - die doppelte Erklärungsebene `Mechanik + Beweis + Einordnung` pro Karte ist entfernt
  - Homepage-Smoke auf `marketing-proof-step = 2` nachgezogen

### `NW-02` Produktseite weiter entschlacken

- Status: `erledigt`

- Problem:
  - `/produkt` ist besser, aber noch nicht hart genug geführt.
- Dateien:
  - [app/produkt/page.tsx](../app/produkt/page.tsx)
  - [components/marketing/produkt/Hero.tsx](../components/marketing/produkt/Hero.tsx)
  - [components/marketing/produkt/Setup.tsx](../components/marketing/produkt/Setup.tsx)
  - [components/marketing/produkt/TrustFoundations.tsx](../components/marketing/produkt/TrustFoundations.tsx)
- Änderung:
  - Hero weiter kürzen
  - Setup + Trust enger verzahnen
  - spätestens nach `Qualitätschecks` nur noch eine klare Entscheidungssequenz
- DoD:
  - `/produkt` wirkt wie eine geführte Produktprüfung, nicht wie eine tiefe Materialsammlung
- Ergebnis:
  - `SecurityPrivacy` und der separate `TrustFoundations`-Abschluss sind aus `/produkt` entfernt
  - `Setup` bündelt jetzt Go-live, Safe-Start, Preis-Weiterlauf und Trust-Prüfung in einer kompakten Schlusssektion
  - die Regellogik auf `/produkt` nutzt präzisere Sprache statt diffuser Begriffe wie `Standard-Situation` oder `heikle Themen`
  - der Produkttest scrollt den Trust-Block jetzt explizit an, statt auf eine ältere Seitenhöhe zu vertrauen

### `NW-03` Preis-Seite auf echten Kauf-Fold trimmen

- Status: `erledigt`

- Problem:
  - `/preise` zeigt jetzt den Preis, aber der Fold ist noch nicht kaufstark genug.
- Dateien:
  - [app/preise/page.tsx](../app/preise/page.tsx)
  - [components/marketing/Pricing.tsx](../components/marketing/Pricing.tsx)
- Änderung:
  - ein klarer Above-the-fold-Kaufblock:
    - Preis
    - Testphase
    - Kündbarkeit
    - Für wen passt Starter?
  - tiefe ROI-/Entscheidungsinhalte weiter nach unten
- DoD:
  - in 8 Sekunden ist Preis, Einstieg und Fit verständlich
- Ergebnis:
  - `/preise` startet jetzt mit einem klaren Kaufblock für Preis, Testphase, Kündbarkeit und Fit
  - die doppelte Preis-Erklärung durch den zusätzlichen `Pricing`-Block ist von der Preis-Seite entfernt
  - tiefe Bewertungs- und ROI-Inhalte stehen erst unterhalb des Folds

### `NW-04` Öffentliche Integrationspfade korrigieren

- Status: `erledigt`

- Problem:
  - öffentliche Besucher werden auf App-Routen geschickt.
- Dateien:
  - [app/integrationen/gmail/page.tsx](../app/integrationen/gmail/page.tsx)
  - [app/integrationen/outlook/page.tsx](../app/integrationen/outlook/page.tsx)
  - [components/marketing/produkt/SecurityPrivacy.tsx](../components/marketing/produkt/SecurityPrivacy.tsx)
- Änderung:
  - `primaryHref="/app/konto/verknuepfungen"` raus aus Public-Seiten
  - stattdessen:
    - `/signup`
    - `/produkt#setup`
    - oder „nach Anmeldung verbinden“
  - Link auf `/app/konto/loeschen` aus Public-Kontext entfernen oder ersetzen
- DoD:
  - keine Public-Seite führt anonyme Nutzer direkt in gated App-Routen
- Ergebnis:
  - öffentliche Integrationsseiten führen jetzt in `/signup` oder `/produkt#setup`
  - Transparenz-Link im Sicherheitsblock zeigt auf `/datenschutz` statt auf eine gated App-Route
  - abgesichert durch `tests/playwright/public-integrations.spec.ts`

### `NW-05` Metadata- und OG-Parität schließen

- Status: `erledigt`

- Problem:
  - mehrere Public-Seiten laufen noch außerhalb des gemeinsamen Metadata-Standards.
- Dateien:
  - [app/trust/page.tsx](../app/trust/page.tsx)
  - [app/integrationen/page.tsx](../app/integrationen/page.tsx)
  - [app/integrationen/gmail/page.tsx](../app/integrationen/gmail/page.tsx)
  - [app/integrationen/outlook/page.tsx](../app/integrationen/outlook/page.tsx)
  - [app/makler-freigabe-workflow/page.tsx](../app/makler-freigabe-workflow/page.tsx)
  - [app/unterauftragsverarbeiter/page.tsx](../app/unterauftragsverarbeiter/page.tsx)
  - Restseiten mit Icon-Fallback
- Änderung:
  - auf `buildMarketingMetadata` oder gleichwertiges Pattern ziehen
  - route-spezifische OG-/Twitter-Bilder statt Icon-Fallback
- DoD:
  - keine relevante Public-Seite fällt metadata-seitig auf einen alten Standard zurück
- Ergebnis:
  - `trust`, `integrationen`, `gmail`, `outlook`, `makler-freigabe-workflow` und `unterauftragsverarbeiter` nutzen jetzt `buildMarketingMetadata`
  - Integrationsseiten haben ein eigenes OG-Template statt Mischlogik oder Icon-Fallback
  - Canonical, `og:image` und `twitter:image` sind auf den betroffenen Seiten lokal gerendert verifiziert

### `NW-06` `/trust` strategisch neu entscheiden

- Status: `erledigt`

- Problem:
  - `/trust` dupliziert aktuell `/sicherheit` und `/datenschutz`.
- Dateien:
  - [app/trust/page.tsx](../app/trust/page.tsx)
  - [app/sicherheit/page.tsx](../app/sicherheit/page.tsx)
  - [app/datenschutz/page.tsx](../app/datenschutz/page.tsx)
- Änderung:
  - Entscheidung treffen:
    - `/trust` als echtes Trust-Center mit Hub-Funktion
    - oder `/trust` zusammenziehen/umleiten
- DoD:
  - jede der drei Trust-Seiten hat eine eindeutig andere Aufgabe
- Ergebnis:
  - `/trust` ist jetzt ein kompakter Hub für Trust & Transparenz statt eine dritte inhaltlich ähnliche Landingpage
  - Sicherheitslogik bleibt auf `/sicherheit`, Rechts- und Datenschutzdetails bleiben auf `/datenschutz`
  - der Hub führt gezielt zu Sicherheitsseite, Datenschutzhinweisen, Unterauftragsverarbeitern und Freigabe-Workflow
  - sichtbare Labels und Knowledge-Texte wurden auf `Trust & Transparenz` nachgezogen

## P1 – Direkt danach

### `NW-07` `/so-funktionierts` auf visuelles Prozessmodell umbauen

- Status: `erledigt`

- Problem:
  - der Prozess ist gut erklärt, aber noch nicht dominant visualisiert.
- Dateien:
  - [app/so-funktionierts/page.tsx](../app/so-funktionierts/page.tsx)
  - [components/marketing/HowItWorks.tsx](../components/marketing/HowItWorks.tsx)
- Änderung:
  - 4-Stufen-Prozess als echte visuelle Leitgrafik
  - weniger wiederholte Karten
- DoD:
  - die Seite ist im ersten Drittel vor allem Prozessgrafik, nicht Kartenstapel
- Ergebnis:
  - `HowItWorks` ist jetzt eine echte 4-Stufen-Leitgrafik mit sichtbaren Outcomes statt eines einfachen Kartenrasters
  - `/so-funktionierts` zeigt den Ablauf oben als verdichtete Entscheidungskette mit klarer Zeitlinie und vier Prozesskarten
  - der Deep-Dive-Bereich ist auf vier echte Detailpfade reduziert statt als breiter Link-Hub zu wirken
  - die Ablauf-Sprache ist an `Erkennen → Prüfen → Entscheiden → Nachfassen` ausgerichtet und damit konsistenter lesbar

### `NW-08` `/sicherheit` in eine echte Prüfseite verwandeln

- Status: `erledigt`

- Problem:
  - inhaltlich stark, visuell noch zu sehr Landingpage-Box-System.
- Dateien:
  - [app/sicherheit/page.tsx](../app/sicherheit/page.tsx)
  - [components/marketing/TrustByDesign.tsx](../components/marketing/TrustByDesign.tsx)
- Änderung:
  - klarere Prüfreihenfolge
  - weniger Boxen, mehr Checklisten- und Decision-Layout
- DoD:
  - Seite fühlt sich wie eine Due-Diligence-Seite an
- Ergebnis:
  - `/sicherheit` führt jetzt über einen klaren 4-Schritt-Prüfpfad statt über mehrere gleich laute Kartenblöcke
  - die Kriterien `Auto erlaubt`, `Freigabe Pflicht` und `Anbieterprüfung` sind in einer kompakten Decision-Struktur zusammengezogen
  - redundante Marketing-Abschnitte wie `TransparencyBox`, `Security`, `TrustByDesign` und `Guarantee` sind aus der Route entfernt
  - die Seite wirkt dadurch deutlich stärker wie eine operative Prüfseite als wie eine weitere Trust-Landingpage

### `NW-09` FAQ-Hub auf Top-8-Fragen fokussieren

- Status: `erledigt`

- Problem:
  - `/faq` ist zu breit und zu hubig.
- Dateien:
  - [app/faq/page.tsx](../app/faq/page.tsx)
  - [components/marketing/FAQDecisionTree.tsx](../components/marketing/FAQDecisionTree.tsx)
  - [components/marketing/FAQ.tsx](../components/marketing/FAQ.tsx)
- Änderung:
  - oben nur die wichtigsten 8 Fragen
  - Detailseiten tiefer und ruhiger
- DoD:
  - FAQ priorisiert Entscheidung statt Link-Verwaltung
- Ergebnis:
  - `/faq` startet jetzt sichtbar mit den 8 kauf- und prüfrelevanten Kernfragen statt mit mehreren Link-Hubs
  - der Accordion-Block beantwortet genau diese Top-8-Fragen in klarerer Reihenfolge
  - der Entscheidungsbaum ist jetzt explizit als nachgelagerter Vertiefungspfad gerahmt, nicht als Einstieg
  - tiefe Links sind auf vier kuratierte Detailpfade reduziert statt in breite Vergleichs- und Hub-Sammlungen auszuufern

### `NW-10` `/branchen` und `/use-cases` sauber trennen

- Status: `erledigt`

- Problem:
  - beide Hubs überschneiden sich zu stark.
- Dateien:
  - [app/branchen/page.tsx](../app/branchen/page.tsx)
  - [app/use-cases/page.tsx](../app/use-cases/page.tsx)
- Änderung:
  - `/branchen` = Marktumfeld und Teamrealität
  - `/use-cases` = operative Muster und Anfragearten
- DoD:
  - Besucher versteht klar, warum beide Seiten existieren
- Ergebnis:
  - `/branchen` fokussiert jetzt klar Marktumfeld, Teamrealität, Objektsystematik und Startkorridor
  - `/use-cases` fokussiert jetzt konkrete Anfrage- und Arbeitsmuster wie Auto-, Freigabe-, Ignore- und Follow-up-Potenzial
  - die Querverlinkung ist sauber getrennt: Branchen verweist auf operative Muster, Use Cases verweist auf Marktfit
  - die frühere Überschneidung durch `Neubau-Vertrieb` auf der Use-Case-Seite ist entfernt

### `NW-11` `/integrationen` als echte Vergleichsseite bauen

- Status: `erledigt`

- Problem:
  - zwei Karten reichen als Integrations-Hub nicht.
- Dateien:
  - [app/integrationen/page.tsx](../app/integrationen/page.tsx)
  - [app/integrationen/gmail/page.tsx](../app/integrationen/gmail/page.tsx)
  - [app/integrationen/outlook/page.tsx](../app/integrationen/outlook/page.tsx)
- Änderung:
  - Vergleichstabelle:
    - Setup
    - OAuth
    - Versandpfad
    - Statusfluss
    - Go-Live-Checks
- DoD:
  - `/integrationen` ist mehr als ein Link-Hub
- Ergebnis:
  - `/integrationen` vergleicht jetzt Gmail und Outlook direkt über Setup, OAuth, Versandpfad, Statusfluss und Go-Live-Checks
  - der Hub erklärt außerdem, dass sich die Guardrail-Logik nicht zwischen den Integrationen unterscheidet
  - die Seite enthält jetzt echte Fit-Empfehlungen und verweist danach erst auf die beiden Detailseiten
  - der Public-Integrations-Smoke prüft jetzt den Hub statt einer inzwischen entfernten Produkt-Sicherheitssektion

### `NW-12` `/roi-rechner` mit Beispielpfad ergänzen

- Status: `erledigt`

- Problem:
  - zu viel Methodik vor schneller Nutzbarkeit.
- Dateien:
  - [app/roi-rechner/page.tsx](../app/roi-rechner/page.tsx)
  - [components/marketing/ROICalculator.tsx](../components/marketing/ROICalculator.tsx)
- Änderung:
  - Beispiel-Szenario für ein typisches kleines Maklerteam
  - schnellerer Einstieg vor der Methodik
- DoD:
  - Besucher kann den Rechner auch ohne lange Vorlektüre nutzen
- Ergebnis:
  - `/roi-rechner` startet jetzt mit einem konkreten Beispielpfad für ein kleines Maklerteam statt sofort mit der vollen Methodik
  - der Rechner selbst erklärt die drei Schnellstart-Profile verständlicher und macht `Kleines Team` explizit zum besten Einstieg
  - Besucher können dadurch zuerst das Beispiel lesen und erst danach ihre eigenen Zahlen eintragen

### `NW-13` Rechtliche Public-Seiten visuell vereinheitlichen

- Problem:
  - `/datenschutz`, `/unterauftragsverarbeiter`, `/nutzungsbedingungen`, `/cookie-und-storage` liegen visuell noch zu weit auseinander.
- Dateien:
  - [app/datenschutz/page.tsx](../app/datenschutz/page.tsx)
  - [app/unterauftragsverarbeiter/page.tsx](../app/unterauftragsverarbeiter/page.tsx)
  - [app/nutzungsbedingungen/page.tsx](../app/nutzungsbedingungen/page.tsx)
  - [app/cookie-und-storage/page.tsx](../app/cookie-und-storage/page.tsx)
- Änderung:
  - gemeinsames Legal-/Transparency-Layout
  - bessere Sprungnavigation
  - weniger beliebige Card-Wände
- DoD:
  - diese Seiten wirken wie zusammengehörige öffentliche Dokumentation
- Ergebnis:
  - die vier Seiten laufen jetzt über einen gemeinsamen Legal-/Transparency-Rahmen mit Dokumentfamilie, Sprungnavigation und kompaktem Kurzüberblick
  - lange Card-Stapel sind reduziert, Tabellen und Dokumentteile sitzen in derselben ruhigeren Seitenlogik
  - `/nutzungsbedingungen` und `/cookie-und-storage` haben dabei auch gleich ein sauberes Metadata-/OG-Pattern bekommen

## P2 – Danach

### `NW-14` Watch-/Video-Seiten erst nach finalen Founder-Assets prominent integrieren

- Problem:
  - technische Struktur ist da, Assets noch nicht final.
- Dateien:
  - [components/marketing-video/MarketingVideoWatchPage.tsx](../components/marketing-video/MarketingVideoWatchPage.tsx)
  - [app/page.tsx](../app/page.tsx)
  - [app/produkt/page.tsx](../app/produkt/page.tsx)
- Änderung:
  - erst nach finalen Videos große Integration auf Homepage und Produkt
- DoD:
  - keine halbfertigen Videos als Haupt-Trust-Asset

### `NW-15` Public-Testmatrix verbreitern

- Problem:
  - Top-Pages sind gut abgesichert, viele wichtige SEO-/Hub-Seiten noch nicht.
- Dateien:
  - neue Specs für:
    - `/so-funktionierts`
    - `/sicherheit`
    - `/faq`
    - `/branchen`
    - `/use-cases`
    - `/integrationen`
- DoD:
  - Public-Re-Audits hängen nicht mehr fast nur an Homepage und Produkt

### `NW-16` Search-Cluster und interne Linklogik sichtbarer machen

- Problem:
  - viele SEO-Seiten sind sprachlich gut, aber die Clusterführung ist noch nicht stark genug.
- Dateien:
  - Hubs und Footer
  - Vergleichsseiten
  - Use-Case- und Branchen-Hubs
- DoD:
  - Suchintentionen führen klarer in Money-Pages und Prüfseiten

## Empfohlene nächste Reihenfolge

1. `NW-06`
2. `NW-02`
3. `NW-08`
4. `NW-09`
5. `NW-10`
6. `NW-11`

## Harter Schlusssatz

Die öffentliche Website ist nicht mehr „problematisch“, aber sie ist noch nicht stark genug, um ohne Reibung wie ein ausgereiftes Premium-SaaS-Produkt zu wirken. Das Hauptproblem ist heute nicht mehr inhaltliche Schwäche, sondern:

- zu wenig Kompression
- zu viel gleiche Karten-IA
- noch nicht scharf genug priorisierte Public-Pfade
- und zu wenig visuelle Dominanz in den entscheidenden Blöcken

Die gute Nachricht ist:

Das Produktverständnis ist inzwischen stark genug. Die nächste Welle ist deshalb vor allem eine Frage von Priorisierung, Inszenierung und Routing-Disziplin.
