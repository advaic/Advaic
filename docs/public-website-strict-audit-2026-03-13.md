# Strikter Public-Website-Audit

Stand: `2026-03-13`

Basis:
- aktueller Code-Stand der öffentlichen Routen in `app/*` und `components/marketing/*`
- frische Local-Review der Kernflächen `/`, `/produkt`, `/preise`, `/so-funktionierts`, `/sicherheit`, `/faq`
- bestehende Public-Smokes in `tests/playwright/public-home.spec.ts`, `tests/playwright/public-product.spec.ts`, `tests/playwright/public-videos.spec.ts`
- Benchmark-Vergleich gegen aktuelle öffentliche SaaS-/AI-Seiten mit ähnlichem Vertriebsziel:
  - [Intercom Fin](https://www.intercom.com/fin)
  - [Zendesk AI](https://www.zendesk.com/service/ai/)
  - [Front AI](https://front.com/ai)
  - ergänzend für Content-Qualität: [Google Helpful Content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

Wichtig:
- Diese Bewertung ist bewusst hart.
- Sie bewertet nicht nur „sieht besser aus als vorher?“, sondern „würde ich diese Website als starker, glaubwürdiger SaaS-Entscheider ernst nehmen?“

## Kurzurteil

Die öffentliche Website ist heute **klar besser als am Anfang**, aber sie ist noch **nicht auf dem Niveau einer wirklich starken B2B-SaaS-Seite**, die gleichzeitig

- schnell verstanden wird,
- professionell wirkt,
- Vertrauen erzeugt,
- Produktwahrheit zeigt,
- und sauber in die Testphase konvertiert.

### Harte Gesamtbewertung

- **Gesamt:** `6.4/10`
- **Desktop:** `6.9/10`
- **Mobile:** `5.6/10`
- **Clarity / Verständlichkeit:** `7.2/10`
- **Visual Hierarchy / Layout:** `6.0/10`
- **Proof / Glaubwürdigkeit:** `6.6/10`
- **Conversion Architecture:** `6.1/10`
- **SEO-/Guide-Qualität:** `7.4/10`
- **Premium-/Markenwirkung:** `5.8/10`

### Was bereits stark ist

- Ihr erklärt Guardrails, Freigabe und Qualitätschecks deutlich besser als viele AI-Seiten.
- Die Produktlogik ist glaubwürdiger als generische „AI beantwortet alles“-Claims.
- Die SEO-Seiten sind inhaltlich inzwischen deutlich wertvoller und weniger nach SEO-Füllmaterial.
- Die Website wirkt fachlich ernster als viele KI-Landingpages, die nur große Versprechen stapeln.

### Was euch noch klar runterzieht

- Zu viele Bereiche fühlen sich noch wie **sauberer interner Produktbeweis** an, aber nicht wie **fertig inszenierte öffentliche Verkaufsoberfläche**.
- Mehrere Seiten sind **zu textlastig, zu kartenlastig und zu gleichförmig**.
- Die visuelle Hierarchie ist besser, aber noch nicht scharf genug. Zu oft konkurrieren H1, Visual, Proof-Karten, CTA und Erklärtext gleichzeitig.
- Es fehlt noch ein richtig starker öffentlicher **Trust-Ersatz**, da ihr keine echten Kundenlogos/Referenzen habt.
- Die Videos existieren inzwischen, sind aber **noch nicht zentral in die Conversion-Logik eingebaut**.

## Vergleich mit starken Benchmark-Seiten

### Gegen Intercom Fin

Was Intercom besser macht:
- kürzere und härtere Hero-Kommunikation
- schnellere Hierarchie: Problem -> Produkt -> Beweis -> CTA
- deutlich weniger Text vor dem ersten „Aha“

Was Advaic besser macht:
- konkretere Erklärung, **wann** Auto läuft und **wann nicht**
- mehr operative Wahrheit

Schluss:
- Ihr seid fachlich oft präziser.
- Intercom ist aber klar besser in **Kompression, Rhythmus und Selbstverständlichkeit**.

### Gegen Zendesk AI

Was Zendesk besser macht:
- Trust-Architektur
- klarere Enterprise-Signale
- bessere globale Navigationssicherheit
- stärkerer Eindruck von „großes, fertiges Produkt“

Was Advaic besser macht:
- weniger Buzzword-Sprech
- mehr konkrete Guardrail-Logik

Schluss:
- Ihr seid operativ glaubwürdiger.
- Zendesk wirkt trotzdem deutlich professioneller, weil deren Seite weniger erklären muss und stärker „fertig“ aussieht.

### Gegen Front AI

Was Front besser macht:
- bessere Screenshot-Präsentation
- hochwertigeres Spacing
- ruhigere Komposition
- weniger textlicher Ballast direkt an Produktvisuals

Was Advaic besser macht:
- klarere Freigabe-/Qualitätslogik

Schluss:
- Eure Produktwahrheit ist stark.
- Front inszeniert ihre Screens aber deutlich eleganter und teurer.

## Route-für-Route-Bewertung

### `/`

- **Score:** `6.8/10`
- **Stark:**
  - Hero ist klarer als früher
  - Produktbeweis ist sichtbar
  - CTA-System ist konsistenter
- **Schwach:**
  - Hero wirkt noch nicht „sauber fertig“, sondern eher wie guter Zwischenstand
  - Proof-Sektion darunter ist immer noch zu erklärig
  - Es gibt weiterhin zu viele kartenartige UI-Module mit ähnlichem Gewicht

### `/produkt`

- **Score:** `6.6/10`
- **Stark:**
  - ernsthafte Produktseite
  - viele echte Mechaniken sichtbar
  - keine generische „Features“-Seite
- **Schwach:**
  - zu lang
  - zu viele Sektionen
  - zu viele ähnliche Proof-/Trust-/Explain-Blöcke
  - sie will gleichzeitig Produktseite, Guide, Proof-Library und Sales-Page sein

### `/preise`

- **Score:** `6.3/10`
- **Stark:**
  - Kauflogik wird gut erklärt
  - guter Fokus auf Testphase und Fit
- **Schwach:**
  - **größter strategischer Fehler:** Auf einer Seite `Preise` zu nennen, ohne im sichtbaren Kern klar und früh einen echten Preis zu zeigen, schwächt Vertrauen massiv
  - aktuell ist das eher eine „Preislogik“- als eine „Preis“-Seite

### `/so-funktionierts`

- **Score:** `7.2/10`
- **Stark:**
  - fachlich sauber
  - value-first
  - guter Guide-Charakter
- **Schwach:**
  - visuell noch zu nah an den anderen Guide-Seiten
  - nicht genug diagrammatische Verdichtung

### `/sicherheit`

- **Score:** `7.4/10`
- **Stark:**
  - klare Fragen
  - gute Trust-/Governance-Logik
  - wertvoller Inhalt
- **Schwach:**
  - Design noch zu card-lastig
  - könnte weniger nach „Landingpage mit Informationsblöcken“ und mehr nach „echtem Sicherheitsleitfaden“ aussehen

### `/faq`

- **Score:** `6.7/10`
- **Stark:**
  - hilfreiche Routing-Funktion
  - gute Verlinkung in Tiefe
- **Schwach:**
  - zu viel Hub-Verhalten
  - nicht prägnant genug priorisiert
  - mehr Listen- und Entscheidungslogik, weniger „weitere Detailseiten“

## Die wichtigsten strukturellen Probleme

### 1. Die Website ist zu oft „richtig“, aber nicht stark genug inszeniert

Das ist aktuell euer Kernproblem.

Ihr habt an vielen Stellen inhaltlich gute Aussagen und echte Produktwahrheit. Aber die Website übersetzt das noch nicht immer in eine starke öffentliche Form.

Typische Symptome:
- zu viele Karten
- zu viele ähnliche Abstände
- zu viele gleich laute Sektionen
- zu viele erläuternde Zwischenblöcke
- zu wenig harte visuelle Priorisierung

### 2. Die Produktwahrheit ist da, aber der öffentliche Produktbeweis ist noch nicht scharf genug

Die Screenshots und Videos zeigen echte Mechanik. Das ist gut.

Aber aktuell sind sie oft so eingebettet:
- zu viel Rahmen
- zu viel erklärender Text
- zu wenig mutige Crop-/Zoom-Entscheidung
- zu wenig „ich sehe auf einen Blick, was hier relevant ist“

Das Ergebnis:
- glaubwürdig, aber nicht stark
- korrekt, aber noch nicht sexy

### 3. Die Produktseite ist zu breit geworden

`/produkt` hat zu viele Rollen gleichzeitig:
- Hero-Landingpage
- Feature-Überblick
- Prozess-Erklärung
- Proof-Library
- Vergleichs- und Intent-Hub
- Trust-/Security-Brücke

Das muss härter priorisiert werden.

### 4. Eure Trust-Architektur ist noch nicht gut genug für eine Seite ohne Kundenlogos

Da ihr keine echten veröffentlichten Kundenreferenzen nutzen könnt, müsst ihr Trust anders aufbauen:

- Produktbeweis
- nachvollziehbare Screens
- klare Verantwortungslogik
- Gründer-/Betriebs-Credibility
- saubere Sicherheits- und Nachweisstruktur
- Integrationen und Betriebsrealität

Aktuell macht ihr davon einiges, aber noch nicht als geschlossene Trust-Architektur.

### 5. Videos sind gebaut, aber noch nicht conversion-relevant eingebunden

Das ist aktuell verschenkt.

Wenn Videos existieren, müssen sie nicht nur auf Watch-Seiten liegen, sondern:
- auf Homepage und Produktseite aktiv verwendet werden
- klar benannt werden
- Kapitel und Nutzen haben
- als „Jetzt ansehen“-Pfad sichtbar sein

## Was definitiv verbessert werden muss

## P0 – Muss als Nächstes passieren

- `W0-01` Homepage-Proofblock radikal vereinfachen
  - Problem: Der Bereich unter dem Hero erklärt zu viel und zeigt zu wenig harte Priorität.
  - Änderung:
    - weniger Text pro Karte
    - eine Hauptvisual, maximal 2 Nebenbeweise
    - jede Beweiskarte nur `Mechanik`, `Warum wichtig`, nicht beides mehrfach
  - Betroffene Dateien:
    - [ProductVisualAuthority.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/ProductVisualAuthority.tsx)
    - [app/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/page.tsx)

- `W0-02` Produktseite von „zu viel“ auf „klar geführt“ reduzieren
  - Problem: `/produkt` ist überstrukturiert.
  - Änderung:
    - 20–30% der Sektionen entfernen oder zusammenführen
    - eine harte Hauptreihenfolge definieren:
      - Hero
      - Ablauf
      - Freigabe
      - Qualitätschecks
      - Setup
      - Sicherheit
      - FAQ
  - Betroffene Dateien:
    - [app/produkt/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/produkt/page.tsx)

- `W0-03` Preisdarstellung entscheiden
  - Problem: `Preise` ohne klaren Preis ist aktuell ein Vertrauensproblem.
  - Entscheidung:
    - entweder echten Preis sichtbar nennen
    - oder Seite umbenennen / anders positionieren
  - Betroffene Dateien:
    - [app/preise/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/preise/page.tsx)
    - [Pricing.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/Pricing.tsx)

- `W0-04` Screenshot- und Video-System stärker croppen
  - Problem: Zu viele Visuals zeigen zu viel Oberfläche und zu wenig Relevanz.
  - Änderung:
    - engere Crops
    - größere Hauptsignale
    - weniger Container-Rahmen
  - Betroffene Dateien:
    - [HeroStillVisual.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/HeroStillVisual.tsx)
    - [HeroStillVisual.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/produkt/HeroStillVisual.tsx)
    - [ProductVisualAuthority.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/ProductVisualAuthority.tsx)
    - [ProductStillFrame.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/produkt/ProductStillFrame.tsx)

- `W0-05` Trust-Architektur ohne Kundenlogos neu bauen
  - Problem: Es fehlt ein starker Ersatz für klassische Referenzen.
  - Änderung:
    - „Warum man dem Produkt trauen kann“ explizit bauen aus:
      - Produktbeweis
      - Regel-Logik
      - Qualitätschecks
      - Verlauf / Nachweisbarkeit
      - Integrationen
      - Verantwortungsgrenzen
  - Betroffene Dateien:
    - [TrustByDesign.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/TrustByDesign.tsx)
    - [SecurityPrivacy.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/produkt/SecurityPrivacy.tsx)
    - [TrustFoundations.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/produkt/TrustFoundations.tsx)
  - Status:
    - erledigt am 13. März 2026
    - Homepage-Trust jetzt als Prüfstruktur mit Voraussetzungen, Stop-Grenzen, Verlauf und Prüfpfaden
    - Produktseite ergänzt um eigenen Trust-Layer statt defensiver Referenzsprache
    - Public-Copy-Check grün
    - Public-Smokes für `/`, `/produkt` und `/preise` grün

- `W0-06` Videos als echte Conversion-Assets einbauen
  - Problem: Watch-Seiten existieren, aber sie tragen noch nicht sichtbar die Hauptseiten.
  - Änderung:
    - Homepage: 1 klarer Video-CTA
    - Produkt: 2–3 Stellen mit direktem Watch-Einstieg
    - Demo-Hub im Header/Funnel sichtbarer machen
  - Betroffene Dateien:
    - [Hero.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing/Hero.tsx)
    - [app/produkt/page.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/app/produkt/page.tsx)
    - [video-briefs](/Users/kilianziemann/Downloads/advaic-dashboard/docs/video-briefs)
    - [app/(marketing-demo)/demo](/Users/kilianziemann/Downloads/advaic-dashboard/app/(marketing-demo)/demo)

## P1 – Sehr sinnvoll direkt danach

- `W1-07` Hero auf `/` und `/produkt` noch premiumer inszenieren
  - größere Ruhe
  - mehr Weißraum
  - weniger sekundäre Mikroelemente direkt im ersten Blick

- `W1-08` Alle Guide-Seiten visuell stärker differenzieren
  - Problem: Viele SEO-/Guide-Seiten benutzen ähnliche Template-Muster und fühlen sich dadurch zu ähnlich an.
  - Änderung:
    - manche Seiten stärker editorial
    - manche stärker checklist-/table-driven
    - manche stärker diagrammatisch

- `W1-09` Mehr echte Vergleichstabellen bauen
  - Problem: Text allein reicht auf Vergleichsseiten nicht.
  - Betroffene Seiten:
    - `/manuell-vs-advaic`
    - `/advaic-vs-crm-tools`
    - `/best-software-immobilienanfragen`

- `W1-10` CTA-System stärker nach Seitentyp unterscheiden
  - Homepage: primär Test
  - Produkt: primär Produkt sehen / Demo sehen
  - Preise: primär Test starten
  - Guides: primär nächste relevante Tiefenseite oder Produktdemo

- `W1-11` FAQ und Hubs entschlacken
  - Problem: zu viele Hub-Elemente und Detail-Linkwände
  - Ziel: mehr Entscheidung, weniger Sammlung

- `W1-12` Footer weiter verschlanken
  - Der Footer ist besser als früher, aber noch nicht ganz auf dem Niveau „kuratiert und souverän“.

## P2 – Danach

- `W2-13` Ein separates „Warum wir das gebaut haben“-Format bauen
  - Nicht als Gründer-Pathos, sondern als Betriebs-Credibility

- `W2-14` Integrationsseiten hochwertiger machen
  - Gmail/Outlook sollten wie echte Vertrauens- und Betriebsseiten wirken, nicht wie Nebenpfade

- `W2-15` Öffentliche Demo-Routen stärker in Conversion integrieren
  - aktuell noch zu versteckt

- `W2-16` Noch mehr visuelle Asymmetrie auf der Website einführen
  - weniger gleichförmige Card-Grids
  - mehr bewusst gestaltete Hero-/Proof-Kompositionen

## Die wichtigsten konkreten Layout-Regeln für die nächste Runde

- Weniger Karten, mehr Hierarchie.
- Weniger Text direkt an Screens.
- Screenshots enger croppen.
- Maximal ein Hauptzweck pro Sektion.
- Keine „Detailseiten“-Linkwände, wenn die Seite die Frage selbst beantworten sollte.
- Pricing entweder konkret oder bewusst nicht als Pricing labeln.
- Videos direkt in den Entscheidungsfluss bringen, nicht nur als Zusatzmaterial.
- Trust nicht über Behauptung, sondern über sichtbare Produktlogik aufbauen.

## Endurteil

Wenn ich die Seite heute sehr streng gegen starke B2B-SaaS-/AI-Seiten halte:

- **inhaltlich** seid ihr besser als viele generische AI-Landingpages
- **visuell und conversion-strategisch** seid ihr noch klar darunter

Das ist eine gute Nachricht, weil euer Hauptproblem nicht „falsches Produktverständnis“ ist, sondern **Inszenierung, Priorisierung und Trust-Architektur**.

Anders gesagt:

Ihr habt inzwischen genug Substanz für eine starke Website.  
Die öffentliche Form ist nur noch nicht konsequent genug auf diesem Niveau.
