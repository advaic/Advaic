# Website-, SEO-, AI-Search- und Produkt-Audit

Stand: 11. März 2026

## Kurzfazit

Die Basis ist deutlich stärker als bei den meisten frühen SaaS-Seiten:

- Es gibt bereits viele indexierbare Marketing-Seiten.
- `robots`, `sitemap`, `llms.txt`, strukturierte Daten und Canonicals sind grundsätzlich vorhanden.
- Die Positionierung ist klar: Guardrails, Freigabe, Qualitätschecks, Nachvollziehbarkeit.
- Das Produkt selbst wirkt nach dem Redesign wesentlich kohärenter.

Trotzdem gibt es noch vier große Baustellen:

1. Die Website hat noch zu wenig harte Beweise.
2. Die Visuals sind zu nah an stillen Produkt-Loops und zu weit weg von echter Erklärung.
3. Die Sucharchitektur ist breit, aber noch nicht stark genug verdichtet und priorisiert.
4. Es gibt ein paar echte Logik- und Vertrauensprobleme, die vor Wachstum bereinigt werden sollten.

## Die wichtigsten offenen Probleme

### P0-Funde, die definitiv behoben werden sollten

1. Marketing-Videos referenzieren Poster-Dateien, die aktuell nicht im Repo liegen.
   Dateien: `components/marketing/Hero.tsx`, `components/marketing/ProductVisualAuthority.tsx`, `components/marketing/produkt/Hero.tsx`, `components/marketing/StickyTour.tsx`, `components/marketing/produkt/StickyTour.tsx`
   Problem: Es wird auf `/loops/*.jpg` verwiesen, in `public/loops` liegen aber aktuell nur `mp4` und `webm`.
   Risiko: Schwächere Ladezustände, kaputte Poster, weniger starke Social- und Visual-Wahrnehmung.

2. Fast alle OG- und Twitter-Bilder sind nur das App-Icon.
   Dateien: praktisch alle Marketing-Seiten unter `app/**/*.tsx`, Root-Metadata in `app/layout.tsx`
   Problem: Für Shares, Slack, WhatsApp, LinkedIn und Suchvorschauen wirkt die Seite wie ein unfertiges Produkt.
   Risiko: Schlechtere Klickrate, weniger Vertrauen, keine visuelle Differenzierung pro Landingpage.

3. Die Sitemap setzt für fast alle URLs jedes Mal `lastModified = now`.
   Datei: `app/sitemap.ts`
   Problem: Das ist künstliche Frische, nicht echte Frische.
   Risiko: Schwächeres technisches Vertrauen, ungenaue Crawling-Signale.

4. Der Owner-Override ist produktiv hart im Code verankert.
   Dateien: `lib/auth/ownerAccess.ts`, `lib/billing/commercial-access.ts`
   Problem: Es gibt einen Fallback-Owner mit fester User-ID und einen dauerhaften Premium-Override.
   Risiko: Betriebs- und Sicherheitsrisiko, schwerer nachvollziehbar, schlechter für saubere Rollenlogik.

5. Auf mehreren starken Marketing-Seiten fehlt die volle Metadata-Parität.
   Beispiele: `app/manuell-vs-advaic/page.tsx`, `app/autopilot/page.tsx`, `app/produkt/capabilities/page.tsx`
   Problem: Titel/Description sind da, aber Canonical, OG und Twitter nicht durchgehend gleich stark.
   Risiko: inkonsistente Darstellung in Such- und Share-Kontexten.

6. Die Preislogik ist kommunikativ nicht scharf genug.
   Dateien: `components/marketing/Pricing.tsx`, `app/preise/page.tsx`, `components/seo/GlobalStructuredData.tsx`
   Problem: “Starter monatlich” ist klar benannt, aber es fehlt eine harte öffentliche Preiszahl oder eine bewusst saubere Alternative wie “Preis auf Demo/Vertrieb”.
   Risiko: unnötige Reibung in der Entscheidungsphase, schwächeres Vertrauenssignal.

### Strategische Hauptprobleme

1. Ihr verkauft heute noch stark über “Mechanik”, aber noch nicht stark genug über “Beweis”.
2. Eure Vergleichs- und Suchseiten sind zahlreich, aber noch nicht überall glaubwürdig genug für Top-Rankings.
3. Für AI-Suche gibt es schon gute Grundlagen, aber noch keine starke Retrieval-Schicht mit klaren Fact Pages, Transkripten, Zitierblöcken und Videoobjekten.
4. Auf der Website fehlen öffentliche Kundenevidenz, echte anonymisierte Vorher/Nachher-Fälle oder belastbare Beispiel-Dokumentationen.

## Dinge, die ich an der Website grundsätzlich ändern würde

### Änderung 1: Weg von “Loop-Videos als Hauptbeweis”, hin zu einem echten Visual-System

Aktuell dominieren stumme UI-Loops. Das ist besser als gar nichts, aber noch nicht stark genug.

Neu sollte gelten:

- Hero: 1 starkes Kurzvideo oder 1 starke annotierte Still-Komposition
- darunter: 3 präzise Produkt-Screenshots mit klaren Annotationen
- eigene Watch-/Demo-Seite mit 2–3-Minuten-Erklärvideo
- jede Kernseite bekommt 1 stilles Hero-Visual plus 1 erklärendes Video oder 1 interaktives Modul

### Änderung 2: Weniger “Keyword-Fläche”, mehr “Evidence-Layer”

Ein Teil der Discovery-Seiten ist inhaltlich sinnvoll. Aber einige Seiten wirken noch zu sehr nach Suchintention und zu wenig nach eigener Erfahrung oder originärer Autorität.

Neu sollte gelten:

- Jede wichtige Suchseite braucht:
  - klare These
  - eigene Bewertungsmethodik
  - sichtbare Quellen
  - eine originale Tabelle oder Matrix
  - eine echte Produktabbildung
  - einen klaren “Warum wir das glaubwürdig sagen dürfen”-Block

### Änderung 3: Preis- und Proof-Kommunikation radikal klarziehen

Wenn Starter das Produkt ist, dann sollte man das auf der Website sehr schnell verstehen:

- für wen es ist
- was es kostet oder warum der Preis nicht öffentlich genannt wird
- wie der Test konkret abläuft
- welche KPI nach 14 Tagen über Go/No-Go entscheiden

## Detaillierter Task-Backlog

## Block A – Sofortige technische und Vertrauens-Fixes

### A01 – Fehlende Video-Poster-Dateien beheben

- Priorität: `P0`
- Ziel: Alle referenzierten Poster-Dateien müssen real existieren oder sauber entfernt werden.
- To-do:
  - alle Referenzen auf `/loops/*.jpg` inventarisieren
  - fehlende Poster erzeugen
  - konsistente Dateinamen einführen
  - Fallback-Strategie definieren, falls Poster fehlen
- DoD:
  - keine ungültigen Poster-Referenzen mehr
  - Hero, Proof-Block und Sticky-Tours haben sichtbare, hochwertige Poster

### A02 – OG-/Twitter-Preview-System aufbauen

- Priorität: `P0`
- Ziel: Nicht mehr das App-Icon als universelles Share-Bild verwenden.
- To-do:
  - pro Seitentyp ein OG-Template definieren:
    - Homepage
    - Produkt
    - Preis
    - Sicherheit
    - Vergleich
    - Branchen/Use Cases
  - route-spezifische OG-Bilder rendern oder exportieren
  - Twitter-/OpenGraph-Metadata überall angleichen
- DoD:
  - keine wichtige Marketing-Seite nutzt nur noch `/brand/advaic-icon.png`
  - jede Hauptseite hat eine eigene visuelle Vorschau mit klarer Aussage

### A03 – Sitemap auf echte Inhaltsfrische umstellen

- Priorität: `P0`
- Ziel: `lastModified` soll inhaltlich stimmen.
- To-do:
  - für statische Seiten manuell gepflegte Aktualisierungsdaten definieren
  - für dynamische Inhalte echte Änderungsdaten verwenden
  - `priority` und `changeFrequency` nur behalten, wenn bewusst gepflegt
- DoD:
  - Sitemap signalisiert reale Aktualität statt künstlicher Frische

### A04 – Owner-Override produktionssicher machen

- Priorität: `P0`
- Ziel: Kein harter Fallback-Owner mehr im Runtime-Code.
- To-do:
  - Fallback-User-ID aus `lib/auth/ownerAccess.ts` entfernen
  - Owner-/Staff-Entitlements nur über Env oder Tabelle steuern
  - dokumentieren, wie interne Accounts freigeschaltet werden
- DoD:
  - keine feste produktive Owner-ID mehr im Code
  - interner Zugang ist nachvollziehbar und auditierbar

### A05 – Metadata-Lücken schließen

- Priorität: `P0`
- Ziel: Alle wichtigen Seiten haben vollständige SEO-Metadata.
- To-do:
  - Audit aller `export const metadata`
  - fehlende `alternates.canonical`, `openGraph`, `twitter` ergänzen
  - Titel-/Description-Längen normalisieren
- Kandidaten mit Lücke:
  - `app/manuell-vs-advaic/page.tsx`
  - `app/autopilot/page.tsx`
  - `app/produkt/capabilities/page.tsx`
- DoD:
  - alle money pages und comparison pages sind metadata-seitig vollständig

## Block B – Conversion und Messaging

### B10 – Preislogik radikal schärfen

- Priorität: `P0`
- Ziel: Preisseite darf keine halbe Entscheidung sein.
- To-do:
  - entscheiden: öffentlicher Preis ja oder nein
  - wenn ja:
    - echte Preiszahl zeigen
    - Schema sauber ergänzen
  - wenn nein:
    - offen sagen, warum
    - stattdessen klare Kaufstruktur zeigen:
      - Testphase
      - Setup
      - Pilot-KPI
      - Go/No-Go
- DoD:
  - Preis- oder Kauflogik ist in 15 Sekunden verständlich

### B11 – Beweis-Architektur auf der Homepage stärken

- Priorität: `P1`
- Ziel: Nach Hero und Proof-Block muss echter Beleg folgen.
- To-do:
  - Beweis-Zone definieren:
    - 1 anonymisierte echte Inbox-Situation
    - 1 echte Freigabe-Ansicht
    - 1 echte Check-/Trust-Ansicht
  - mit Annotationen und “Was Sie hier sehen” ausstatten
- DoD:
  - Besucher sieht nicht nur Mechanik, sondern echte Systemwahrheit

### B12 – Öffentliche Evidenz ersetzen oder aufwerten

- Priorität: `P1`
- Problem:
  - `PublicEvidenceGap` ist ehrlich, aber auch ein öffentliches Eingeständnis fehlender Referenzen
- To-do:
  - 2–3 anonymisierte Pilot-Fälle aufbauen
  - oder eine “Evidence Library” mit:
    - Vorher/Nachher-Screens
    - KPI-Fortschritt
    - Guardrail-Entscheidungen
    - typische Fehlerfälle
- DoD:
  - die Website braucht keinen defensiven Ersatzbeweis mehr

### B13 – Footer-Link-Sprawl reduzieren

- Priorität: `P1`
- Ziel: Footer soll helfen, nicht alles gleichzeitig schreien.
- To-do:
  - Footer in klare Gruppen teilen:
    - Produkt
    - Vertrauen
    - Vergleiche
    - Rechtliches
  - schwächere SEO-Links nicht alle global gleich laut zeigen
- DoD:
  - Footer wirkt wie Navigationssystem, nicht wie Link-Liste

## Block C – Google-Search-Optimierung

### C20 – Content-Cluster priorisieren und ausdünnen

- Priorität: `P0`
- Ziel: Nicht alle Suchseiten gleich wichtig behandeln.
- Empfohlene Primär-Cluster:
  - `/produkt`
  - `/preise`
  - `/sicherheit`
  - `/faq`
  - `/ki-fuer-immobilienmakler`
  - `/immobilienanfragen-automatisieren`
  - `/best-ai-tools-immobilienmakler`
  - `/best-software-immobilienanfragen`
  - `/advaic-vs-crm-tools`
- To-do:
  - Primär-Cluster definieren
  - Sekundärseiten nur als unterstützende Cluster behandeln
  - interne Link-Hierarchie entsprechend umbauen
- DoD:
  - Google erkennt ein klares Pillar-Cluster statt breiter Seitenmasse

### C21 – Vergleichsseiten mit echter Methodik aufwerten

- Priorität: `P0`
- Ziel: Vergleichsseiten müssen wie echte Bewertungsseiten wirken.
- To-do:
  - jede Vergleichsseite bekommt:
    - Bewertungsmethodik
    - Entscheidungsraster
    - Kriteriengewichtung
    - Grenzen der eigenen Perspektive
    - “Für wen nicht geeignet”
  - Bias offen benennen
- DoD:
  - Vergleichsseiten wirken glaubwürdig statt nur vendor-driven

### C22 – Autor-, Reviewer- und Aktualitätslayer einführen

- Priorität: `P0`
- Ziel: People-first und trust-basierte Inhalte besser zeigen.
- To-do:
  - Autor-Block für Suchseiten
  - “Zuletzt fachlich geprüft am”
  - Reviewer-Rolle für rechtliche/sicherheitsrelevante Seiten
  - optional Team-/Über-uns-Seite
- DoD:
  - wichtige Seiten haben sichtbare Verantwortlichkeit

### C23 – Suchseiten auf Quellenkohärenz prüfen

- Priorität: `P1`
- Problem:
  - einige Seiten haben thematisch nicht ganz passende Quellen
  - Beispiel: technische Quellen wie Apps SDK oder MCP auf Käuferseiten
- To-do:
  - Quellen pro Seite nur dann einsetzen, wenn sie dem Suchintent direkt helfen
  - auf Buyer-Seiten nur buyer-relevante Quellen
  - technische Quellen in Entwickler-/Integrationskontext verschieben
- DoD:
  - Quellen erhöhen Relevanz statt Verwirrung

### C24 – Article-/WebPage-Schema für Search-Intent-Seiten ergänzen

- Priorität: `P1`
- Ziel: Seiten maschinenlesbar sauber unterscheiden.
- To-do:
  - für Cluster-Seiten entscheiden:
    - `Article`
    - `WebPage`
    - `FAQPage`
    - `SoftwareApplication`
  - sichtbare Inhalte und Schema angleichen
- DoD:
  - Schema ist passend und nicht nur “irgendein JSON-LD”

### C25 – Search Console und Bing Webmaster operationalisieren

- Priorität: `P0`
- Ziel: Rankings nicht blind verbessern wollen.
- To-do:
  - Google Search Console sauber anbinden
  - Bing Webmaster anbinden
  - Sitemap einreichen
  - wichtigste Queries, CTR und Seiten überwachen
  - Top-20-Seiten als Dashboard definieren
- DoD:
  - es gibt ein echtes SEO-Steuerungsboard

### C26 – IndexNow für Bing einführen

- Priorität: `P1`
- Ziel: Aktualisierte Seiten schneller an Bing/Copilot ausspielen.
- To-do:
  - IndexNow-Key einrichten
  - neue/aktualisierte Marketing-Seiten pingen
  - Deployment-Hook oder Build-Hook definieren
- DoD:
  - wichtige Marketing-Updates können aktiv an Bing gemeldet werden

## Block D – AI-Search-Optimierung

### D30 – `llms.txt` von “gut” auf “wirklich nützlich” ausbauen

- Priorität: `P1`
- Aktueller Stand:
  - `llms.txt` ist vorhanden und besser als nichts
- To-do:
  - ergänzen:
    - Kern-Claims
    - Preislogik
    - Integrationen
    - Grenzen / “wann nicht geeignet”
    - Video-/Transkript-Seiten
    - Case-Library
    - Changelog
  - Facts kompakter und zitierbarer machen
- DoD:
  - `llms.txt` ist eine echte Retrieval-Hilfe, nicht nur eine Linkliste

### D31 – Fact Pages für AI-Antworten aufbauen

- Priorität: `P0`
- Ziel: AI-Systeme brauchen leicht extrahierbare Wahrheitsseiten.
- Empfohlene neue Seiten:
  - `/produkt/fakten`
  - `/sicherheit/fakten`
  - `/preise/fakten`
  - `/integrationen/fakten`
  - `/freigabe/fakten`
- Inhalt:
  - kurze Antworten
  - klare Definitionen
  - harte Grenzen
  - maschinenlesbare Tabellen
- DoD:
  - Antworten über Advaic sind in AI-Suchen präziser und konsistenter

### D32 – Öffentliche Transkripte für Produktvideos veröffentlichen

- Priorität: `P0`
- Ziel: AI-Suche kann Video-Inhalte nur dann gut verarbeiten, wenn die Information auch als Text vorliegt.
- To-do:
  - pro Hauptvideo:
    - Transkript
    - Kapitel
    - Kernaussagen
    - CTA
  - eigene URL pro Video
- DoD:
  - Videos sind auch textlich zitier- und crawlbar

### D33 – AI-zitierfähige Vergleichstabellen bauen

- Priorität: `P1`
- Ziel: Vergleichsinformationen in Tabellen- und Faktenform bereitstellen.
- To-do:
  - auf Vergleichsseiten echte Tabellen einbauen:
    - Fokus
    - Guardrails
    - Freigabe
    - Verlauf
    - Follow-ups
    - CRM-Ersatz ja/nein
- DoD:
  - AI-Systeme und Nutzer können Unterschiede schneller extrahieren

### D34 – Eigene Primärdaten aufbauen

- Priorität: `P1`
- Ziel: Weg von fast nur externen Quellen.
- To-do:
  - anonymisierte Kennzahlen aus echten Reviews/Freigaben nutzen
  - öffentliche Methodik erklären
  - z. B. quartalsweise:
    - häufigste Freigabegründe
    - typische Stop-Gründe
    - häufigste Qualitätskorrekturen
- DoD:
  - Advaic wird selbst zur zitierbaren Quelle

## Block E – Video-, Screenshot- und Visual-System

### E40 – Neues Visual-System definieren

- Priorität: `P0`
- Ziel: Weg von generischen Loops, hin zu einem echten Produktbeweis-System.
- To-do:
  - 8–12 Kern-Screenshots exportieren
  - einheitliche Annotationen definieren
  - dunkle Produktfläche + helle Erklärung oder umgekehrt
  - Bildstil für:
    - Hero
    - Produkt
    - Sicherheit
    - Freigabe
    - Pricing
    - Vergleich
- DoD:
  - jede Kernseite hat ein stilles, starkes Visual mit Nutzenbezug

### E41 – Drei hochwertige 2–3-Minuten-Videos produzieren

- Priorität: `P0`
- Ziel: Besucher sollen in wenigen Minuten wirklich verstehen, wie Advaic arbeitet.
- Empfohlene Videos:
  - Video 1: `Wie Advaic im Tagesgeschäft arbeitet`
  - Video 2: `Wann automatisch gesendet wird und wann nicht`
  - Video 3: `Freigabe, Qualitätschecks und Follow-up im Live-Betrieb`
- Format:
  - 120–180 Sekunden
  - klare Sprecherstimme
  - ruhiger Schnitt
  - Kapitel
  - On-Screen-Annotations
  - keine hektischen Zooms
- DoD:
  - die drei wichtigsten Kauf- und Vertrauensfragen sind per Video beantwortet

### E42 – Video-SEO komplett machen

- Priorität: `P0`
- To-do:
  - Watch-/Demo-Seiten anlegen
  - `VideoObject` strukturierte Daten ergänzen
  - Poster, Titel, Beschreibung, Dauer, Upload-Datum pflegen
  - Video-Sitemap oder saubere Video-Einbindung ergänzen
  - Transkripte veröffentlichen
- DoD:
  - Videos sind indexierbar, zitierbar und sharebar

### E43 – Kurze Cutdowns und Ads/Share-Assets ableiten

- Priorität: `P1`
- Ziel: Aus den langen Erklärvideos mehrere kleine Assets gewinnen.
- To-do:
  - 15–30s Hero-Cutdown
  - 30–45s Social-Cutdown
  - 1 stilles Thumbnail pro Video
  - 1 OG-Variante pro Video
- DoD:
  - ein Produktionsdurchlauf erzeugt mehrere Verwendungsarten

### E44 – Screenshots wirklich “erzählen” lassen

- Priorität: `P1`
- To-do:
  - pro Screenshot nur 1 Kernbotschaft
  - Annotationen nicht überall gleichzeitig
  - rote, gelbe, grüne Zustände bewusst einsetzen
  - Maklerkontext sichtbar machen: Objekt, Lead, Freigabe, Qualität
- DoD:
  - ein Screenshot ist in 3 Sekunden verständlich

## Block F – Content-System und Informationsarchitektur

### F50 – Suchseiten in ein klares Pillar-Modell umorganisieren

- Priorität: `P1`
- Ziel: weniger diffuse Sucharchitektur.
- Neue Struktur:
  - Pillar 1: Produkt & Ablauf
  - Pillar 2: Sicherheit & Trust
  - Pillar 3: Vergleiche & Kaufentscheidung
  - Pillar 4: Branchen & Use Cases
  - Pillar 5: Integrationen
- DoD:
  - jede Seite zahlt auf einen klaren Cluster ein

### F51 – Über-uns-/Team-/Verantwortlichkeitsseite aufbauen

- Priorität: `P1`
- Ziel: mehr E-E-A-T und mehr Vertrauen bei sensibler Automatisierung.
- To-do:
  - Team/Gründer
  - warum dieses Produkt
  - Produktphilosophie
  - Grenzen und Haltung zu Auto-Versand
- DoD:
  - Besucher versteht, wer hinter Advaic steht

### F52 – Öffentliche Dokumentationsbibliothek aufbauen

- Priorität: `P1`
- Ziel: Vertrauen nicht nur über Marketingtexte.
- Mögliche Seiten:
  - `/docs/guardrails`
  - `/docs/qualitaetschecks`
  - `/docs/freigabe-logik`
  - `/docs/integrationen`
  - `/docs/change-log`
- DoD:
  - zentrale Produktwahrheiten sind dokumentiert und direkt verlinkbar

### F53 – Changelog oder Release Notes veröffentlichen

- Priorität: `P1`
- Ziel: Frische, Produktdynamik und Retrieval verbessern.
- DoD:
  - es gibt eine öffentliche Änderungsseite mit Datum und Einordnung

## Block G – Produkt- und Systemlogik prüfen

### G60 – Billing-/Entitlement-Logik härten

- Priorität: `P0`
- Fokus:
  - Owner-/Staff-Entitlements
  - Middleware-Gates
  - Summary-Route
  - Abo-UI
- DoD:
  - keine Sonderfälle mehr, die nur implizit im Code bekannt sind

### G61 – Marketing- und Produkt-Wahrheit angleichen

- Priorität: `P0`
- Problem:
  - Die Website behauptet kontrollierte, nachvollziehbare Automatisierung
  - das Produkt ist inzwischen nah dran, aber die öffentliche Beweisführung hinkt hinterher
- To-do:
  - jede öffentliche Produkt-Behauptung auf echten Screen oder echte Doku mappen
- DoD:
  - keine Claim-Zone ohne Beleg-Zone

### G62 – Such- und Buyer-Seiten auf Quellenlogik prüfen

- Priorität: `P1`
- Problem:
  - manche Seiten mischen Buyer-Intent mit technisch irrelevanten Quellen
- DoD:
  - jede Quelle dient exakt dem Seitenziel

### G63 – Trust- und Legal-Kommunikation auf Konsistenz prüfen

- Priorität: `P1`
- Fokus:
  - Datenschutz
  - Trust Center
  - Sicherheit
  - Pricing
  - FAQ
- DoD:
  - keine widersprüchliche Tonalität zwischen “sicher”, “kontrolliert”, “trial”, “Starter”, “Dokumentation”

## Block H – Messung und Experimente

### H70 – Search- und AI-Dashboard definieren

- Priorität: `P0`
- Ziel: Fortschritt messbar machen.
- Metriken:
  - Google Impressions
  - Google CTR
  - Ranking Top-Seiten
  - Bing Klicks
  - IndexNow-Pings
  - AI-Referral-Traffic
  - Demo-/Signup-CTR pro Seite
- DoD:
  - wöchentliches Steuerungsdashboard vorhanden

### H71 – Conversion-Experimente auf Money Pages

- Priorität: `P1`
- Startseiten für Tests:
  - `/`
  - `/produkt`
  - `/preise`
  - `/best-ai-tools-immobilienmakler`
  - `/best-software-immobilienanfragen`
- Testideen:
  - Video vs. Screenshot im Hero
  - Preislogik klar vs. weich
  - Trust-Block früh vs. spät
  - Case-Library vs. Public Benchmarks
- DoD:
  - keine großen Designentscheidungen mehr ohne Conversion-Lernen

## Empfohlene Reihenfolge

1. `A01` bis `A05`
2. `B10` und `B11`
3. `E40`, `E41`, `E42`
4. `C20`, `C21`, `C22`, `C25`, `C26`
5. `D30`, `D31`, `D32`, `D33`
6. `F50`, `F51`, `F52`, `F53`
7. `G60` bis `G63`
8. `H70` und `H71`

## Was ich zuerst tun würde, wenn wir nur 10 Dinge machen dürften

1. Fehlende Video-Poster fixen
2. Route-spezifische OG-Bilder einführen
3. Preislogik klarziehen
4. Drei echte 2–3-Minuten-Erklärvideos produzieren
5. Watch-/Transkript-Seiten mit VideoObject bauen
6. Vergleichsseiten mit harter Methodik und eigener Evidenz aufwerten
7. `llms.txt` und Fact Pages für AI-Suche ausbauen
8. Sitemap-Frische korrigieren
9. Owner-Override produktionssicher machen
10. Search Console, Bing Webmaster und IndexNow sauber operationalisieren

## Offizielle Quellen für die Empfehlungen

Die folgenden Quellen sind für den Plan direkt relevant:

- Google Search Central: Helpful, reliable, people-first content
  - https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Search Central: AI features and your website
  - https://developers.google.com/search/docs/appearance/ai-features
- Google Search Central: Video best practices
  - https://developers.google.com/search/docs/appearance/video
- Google Search Central: Video structured data
  - https://developers.google.com/search/docs/appearance/structured-data/video
- Bing Webmaster / IndexNow
  - https://www.bing.com/webmasters/indexnow

Hinweis:

- Die Empfehlung rund um `llms.txt`, Fact Pages und AI-zitierfähige Vergleichstabellen ist teilweise eine fundierte Ableitung aus Suchmaschinen- und Retrieval-Verhalten, nicht ein einzelnes offizielles Google-Ranking-Signal.
- `llms.txt` allein wird Google-Rankings nicht heben. Der größere Hebel bleibt crawlbarer HTML-Content mit klaren Fakten, guter interner Verlinkung, Videos mit Transkripten und echter Evidenz.
