# Strenger Recheck der öffentlichen Website

Stand: `14. März 2026`

## Bewertungsmaßstab

Dieser Recheck bewertet die aktuelle öffentliche Website gegen einen harten, öffentlich sichtbaren Qualitätsmaßstab:

- [Intercom Fin](https://www.intercom.com/fin)
- [Zendesk AI](https://www.zendesk.com/service/ai/)
- [Front AI](https://front.com/ai)
- [Sierra](https://sierra.ai/)

Wichtig:

- Es werden keine behaupteten Conversion-Raten verglichen.
- Der Maßstab sind beobachtbare Qualitätsmerkmale:
  - Kompression
  - Visual Hierarchy
  - Produktbeweis
  - Trust-Architektur
  - Kaufklarheit
  - Mobile-Qualität
  - technische Public-Gesundheit

## Technische Basis dieses Rechecks

- `npm run smoke:public`:
  - grün
- `npm run copy:check`:
  - grün
- `npx tsc --noEmit`:
  - grün
- Produktions-Build:
  - grün
- Browser-Smokes:
  - in dieser Umgebung heute nicht frisch nutzbar
  - Playwright scheitert lokal weiter an Chromium-MachPort-Rechten

Das heißt:

- technische Public-Gesundheit ist belegbar
- Copy-Gesundheit ist belegbar
- der visuelle Teil dieses Audits stützt sich auf den aktuellen Code- und Layoutstand plus die bereits zuvor abgesicherten Umbauten

## Aktuelles Gesamturteil

- **Gesamt:** `7.2/10`
- **Messaging / Klarheit:** `8.0/10`
- **Proof ohne Kundenlogos:** `7.6/10`
- **Conversion-Architektur:** `7.2/10`
- **Trust / Transparenz:** `8.0/10`
- **Visual Hierarchy / Premium-Wirkung:** `6.5/10`
- **Mobile-Fold-Qualität:** `6.6/10`
- **SEO-/Guide-Qualität:** `7.8/10`
- **Technische Public-Gesundheit:** `9.1/10`

## Das harte Ein-Satz-Urteil

Die Website ist heute **substanziell glaubwürdig, technisch stabil und für Reachouts gut genug**, wirkt aber im Vergleich zu den stärksten Benchmarks noch **zu modular, zu erklärend und visuell noch nicht teuer genug**.

## Was heute wirklich stark ist

### 1. Advaic erklärt Kontrolle besser als viele Benchmarks

Im Vergleich zu vielen AI-SaaS-Seiten ist heute klarer:

- wann Auto erlaubt ist
- wann Freigabe greift
- warum Versand nicht blind läuft
- wo Nachweise liegen

### 2. Preis, Trust und Sicherheitslogik sind nicht mehr ausweichend

Das ist ein echter Fortschritt:

- `/preise` zeigt einen realen Preis
- `/trust` ist keine redundante Sicherheitskopie mehr
- `/sicherheit` ist nützlicher als viele typische Security-Landingpages

### 3. Die Public-Basis ist operativ belastbar

Im Gegensatz zu früher gibt es jetzt:

- Route-Smoke
- grünen Typecheck
- grünen Build
- konsistente Metadata-/OG-Basis

Das ist kein glamouröser Vorteil, aber ein realer Qualitätshebel.

## Wo die Website immer noch gegen starke Benchmarks verliert

### 1. Zu viele Bereiche lesen sich noch wie „gute Erklärung“

Die stärksten Seiten der Kategorie schaffen eher:

- ein dominantes Narrativ
- weniger gleich laute Module
- mehr Gefühl von Richtung und Kontrolle

Advaic ist oft korrekt, aber noch nicht immer maximal geführt.

### 2. Die Produktvisuals sind glaubwürdig, aber noch nicht ikonisch

Die größten Benchmarks gewinnen früh über:

- mutigere Crops
- größere Fokusflächen
- weniger sichtbares UI-Rauschen
- stärkeres Zusammenspiel von Text und Visual

Advaic ist hier besser als vorher, aber noch nicht auf Top-Niveau.

### 3. Hubs sind inhaltlich besser getrennt, visuell aber noch etwas verwandt

`/branchen`, `/use-cases`, `/integrationen`, `/faq`, `/sicherheit`, `/trust` sind heute klarer als früher, aber sie tragen immer noch dieselbe System-DNA etwas zu sichtbar vor sich her:

- viele Karten
- ähnliche Section-Lautstärken
- ähnliche Kicker-/Grid-Logik

### 4. Es fehlt noch ein wirklich starker Founder-Trust-Beschleuniger

Ohne Kundenlogos oder belastbare Case Studies bleibt das stärkste nächste Asset:

- gute Founder-Videos
- mit klarer Stimme
- klarer Bewertungslogik
- sauberer Produktführung

## Route-für-Route-Bewertung

### `/`

- **Score:** `7.5/10`
- **Stark:**
  - Hero ist klar
  - Produktbeweis ist früh
  - Preis und Trust sind nicht versteckt
- **Schwach:**
  - unter dem Hero immer noch etwas zu viele Modulgrenzen
  - noch kein Benchmark-starker „eine Sekunde und ich verstehe das System“-Moment

### `/produkt`

- **Score:** `7.0/10`
- **Stark:**
  - echte Produktführung statt Feature-Wand
  - Freigabe- und Qualitätslogik sind sichtbar
- **Schwach:**
  - noch etwas zu viel Gleichgewichtung der Sektionen
  - noch nicht stark genug wie eine große, dominierende Produkttour

### `/preise`

- **Score:** `7.4/10`
- **Stark:**
  - Preis ist öffentlich und klar
  - Einwand- und Fit-Logik ist glaubwürdig
- **Schwach:**
  - wirkt noch etwas vernünftig statt entschlossen
  - könnte noch stärker mit einem Beispiel- oder Week-1/Week-2-Narrativ verkaufen

### `/faq`

- **Score:** `7.4/10`
- **Stark:**
  - answer-first ist richtig
  - die wichtigsten Fragen kommen früh
- **Schwach:**
  - visuell immer noch eher Hub als starke Knowledge-Seite
  - könnte noch brutaler auf Scannability getrimmt werden

### `/integrationen`

- **Score:** `6.8/10`
- **Stark:**
  - endlich echter Vergleich statt Link-Hub
  - sichtbarer Produktbeweis ist da
- **Schwach:**
  - noch zu textnah
  - Gmail/Outlook fühlen sich noch nicht stark genug als operative Entscheidung an

### `/sicherheit`

- **Score:** `7.7/10`
- **Stark:**
  - klarer Prüffokus
  - deutlich nützlicher als typische Security-Marketingseiten
- **Schwach:**
  - visuell noch etwas zu stark Marketing-Layout
  - könnte noch dokumentarischer und weniger card-basiert wirken

### `/trust`

- **Score:** `7.3/10`
- **Stark:**
  - gute Hub-Rolle
  - Trust-Artefakte sind sinnvoll
- **Schwach:**
  - noch kein maximal überzeugender „seriöse Reife“-Moment
  - wirkt nützlich, aber noch nicht außergewöhnlich stark

### `/branchen`

- **Score:** `6.9/10`
- **Stark:**
  - Marktfit ist sauber getrennt
  - hilfreich für qualifizierende Klicks
- **Schwach:**
  - zu grid-lastig
  - noch etwas zu wenig Charakter im Vergleich zu `/use-cases`

### `/use-cases`

- **Score:** `6.9/10`
- **Stark:**
  - operative Perspektive ist klarer
  - Routing-Logik ist sinnvoll
- **Schwach:**
  - noch etwas zu systemisch statt pointiert
  - die Seite könnte mehr „Arbeitsoberfläche“ und weniger „Hub“ ausstrahlen

## Vergleich gegen Benchmarks

### Gegen Intercom Fin

- **Advaic besser:**
  - ehrlichere Guardrail-Logik
  - konkretere Auto-vs.-Freigabe-Erklärung
- **Intercom besser:**
  - härtere Kompression
  - stärkere erste Dominanz
  - weniger modulare Wahrnehmung

### Gegen Front AI

- **Advaic besser:**
  - Prozess- und Prüf-Transparenz
- **Front besser:**
  - Visual-Cropping
  - Spacing
  - Premium-Anmutung

### Gegen Zendesk AI

- **Advaic besser:**
  - operative Nachvollziehbarkeit
  - weniger Buzzword-Sprache
- **Zendesk besser:**
  - Reifegefühl
  - Enterprise-Ruhe
  - große Marken-Sicherheit

### Gegen Sierra

- **Advaic besser:**
  - konkrete Betriebslogik
  - nachvollziehbare Prüfkriterien
- **Sierra besser:**
  - Founder-/Executive-Aura
  - visuelle Entschlossenheit
  - Marken-Selbstverständlichkeit

## Die wichtigsten konkreten Verbesserungen ab jetzt

### `HC-01` Finale Founder-Videos produzieren und danach prominent einbauen

- Priorität: `P0`
- Warum:
  - das ist der stärkste fehlende Trust- und Erklärhebel
- Betroffene Bereiche:
  - `/`
  - `/produkt`
  - Watch-Seiten

### `HC-02` Homepage unter dem Hero noch weiter verdichten

- Priorität: `P1`
- Warum:
  - der erste Proof ist besser als früher, aber noch nicht benchmark-dominant
- Ziel:
  - weniger Modulgrenzen
  - mehr „ein Kaufmoment“

### `HC-03` `/produkt` noch stärker in eine visuelle Tour mit weniger gleich lauten Stops ziehen

- Priorität: `P1`
- Warum:
  - die Seite ist besser, aber noch nicht ikonisch genug
- Ziel:
  - weniger Library-Gefühl
  - mehr Flow und Progression

### `HC-04` `/integrationen` stärker operationalisieren

- Priorität: `P1`
- Warum:
  - der Hub ist sinnvoll, aber noch nicht stark genug visuell
- Ziel:
  - provider-spezifische Betriebsbeweise
  - klarere Entscheidung „Welche Integration passt zu meinem Setup?“

### `HC-05` Premium-Polish-Welle über die Public-Seiten

- Priorität: `P1`
- Warum:
  - das ist jetzt der größte Abstand zu Top-Benchmarks
- Fokus:
  - größere Fokusflächen
  - weniger Rahmen-Ballast
  - stärkere visuelle Dominanz
  - mehr Ruhe zwischen Modulen

### `HC-06` Externe Search-Ops abschließen

- Priorität: `P1`
- Warum:
  - Search Console und Bing sind vorbereitet, aber noch nicht extern fertig

## Harte Schlussbewertung

Die Website ist heute **deutlich besser als eine typische frühe SaaS-Seite** und für echte Outreachs gut genug.  
Sie ist aber noch **nicht auf dem Niveau der stärksten Public-B2B-Benchmarks**, weil Premium-Wirkung, visuelle Dominanz und Founder-Trust noch nicht vollständig da sind.

Wenn das Ziel für die nächsten Tage `reachout-ready` ist, reicht der Stand.  
Wenn das Ziel `9/10 im offenen Benchmark-Vergleich` ist, fehlen vor allem:

- finale Founder-Videos
- ein letzter großer Premium-Polish
- noch mehr visuelle Verdichtung auf den Money-Pages
