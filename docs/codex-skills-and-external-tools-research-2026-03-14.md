# Codex-Skills und externe Tools für Website-, Visual- und Video-Qualität

Stand: `14. März 2026`

## Executive Summary

Wenn das Ziel in den nächsten Tagen ist,

- die öffentliche Website sichtbar hochwertiger zu machen,
- schneller zu besseren visuellen Entscheidungen zu kommen,
- Founder-Videos professionell zu produzieren,
- und vor Reachouts weniger vermeidbare Schwächen zu haben,

dann ist die wichtigste Antwort:

**Ja, ein paar zusätzliche Skills und externe Tools können euch helfen. Aber nicht alle.**

Der größte Hebel liegt **nicht** in „noch einem AI-Agent“, sondern in einer **präzisen Tool-Kombination**:

1. **Polypane** für responsive, visuelle und mobile QA
2. **Screen Studio** für hochwertige Produkt-Loops und Founder-Screen-Captures
3. **Percy** für visuelle Regressionen und Review-Disziplin
4. **Lighthouse CI + PageSpeed Insights / WebPageTest** für Performance- und UX-Stabilität
5. **Descript** für Captions, Transcript, Rohschnitt und saubere Export-Pipeline

Für Codex selbst gilt:

- zusätzliche Skills sind **ein Produktivitätshebel**
- sie sind **kein Ersatz** für gutes Design oder gute Video-Produktion
- aber sie können wiederkehrende Audits, Screenshot-QA, Video-Workflows und Design-Handoff deutlich beschleunigen

## Klare Antwort auf die Frage „Soll ich Skills in Codex hinzufügen?“

### Kurzantwort

**Ja, aber nur selektiv.**

Wenn du einfach wahllos Skills installierst, bringt das fast nichts.  
Wenn du gezielt die richtigen 4 bis 6 Skills installierst, ist der Nutzen real.

### Skills sind nützlich für:

- wiederholbare QA-Workflows
- Figma-/Design-Handoff
- Screenshot- und Video-Arbeit
- Transkript-/Caption-Workflows

### Skills sind nicht nützlich für:

- „die Website plötzlich hochwertig aussehen lassen“
- gute Crops, gute Komposition, gute Markenwirkung automatisch erzeugen
- schwache visuelle Urteile ersetzen

## Was aus dem aktuellen Curated-Skill-Katalog für euch wirklich relevant ist

Ich habe die aktuelle Curated-Liste geprüft. Von dort sind für eure Ziele vor allem diese Skills interessant:

### 1. `screenshot`

Warum sinnvoll:

- hilft bei strukturierten Screenshot-Workflows
- gut für systematische Vorher-/Nachher-Prüfung
- nützlich für Hero-, Proof- und Crop-Reviews

Wann installieren:

- **ja**, wenn wir weiter an Hero/Proof/Produktvisuals arbeiten

### 2. `figma`

Warum sinnvoll:

- nützlich, wenn ihr Layouts oder visuelle Varianten zuerst in Figma prüft
- hilft bei sauberer Handoff-Logik

Wann installieren:

- **ja**, wenn du oder jemand im Team wirklich mit Figma arbeitet
- **nein**, wenn alles direkt im Code entschieden wird

### 3. `figma-implement-design`

Warum sinnvoll:

- gut, wenn ihr Figma-Frames systematisch in Code umsetzt
- kann helfen, visuelle Entscheidungen konsistenter und weniger improvisiert zu machen

Wann installieren:

- **ja**, wenn Figma Teil des Workflows ist
- **nein**, wenn kein echter Design-Handoff existiert

### 4. `transcribe`

Warum sinnvoll:

- nützlich für Founder-Videos
- gut für Transcript-Erstellung, Watch-Seiten, Captions, SEO-Assets

Wann installieren:

- **ja**, sobald ihr die Founder-Videos aufnehmt

### 5. `speech`

Warum sinnvoll:

- kann bei Voice-over-bezogenen Workflows helfen
- nützlich für Skript-, Audio- und Produktionslogik

Wann installieren:

- **optional**, aber sinnvoll vor der Video-Produktion

### 6. `playwright`

Warum sinnvoll:

- `playwright-interactive` ist bei euch bereits installiert
- das reicht schon weit
- der zusätzliche `playwright`-Skill kann helfen, wenn ihr stärker standardisierte UI-/QA-Workflows wollt

Wann installieren:

- **optional**, nicht dringend

## Skills, die ich aktuell nicht priorisieren würde

### `imagegen`

Nicht priorisieren, weil:

- eure Website auf **echten Produktvisuals** gewinnen muss
- generierte Bilder auf dieser Art von SaaS-Seite schnell billig oder fake wirken

### `sora`

Nicht priorisieren, weil:

- synthetische Video-/Motion-Inhalte euch gerade nicht beim wichtigsten Problem helfen
- ihr braucht echte Founder-Videos und echte Produkt-Loops, keine KI-Cinematics

### `slides`

Nur sinnvoll, wenn du jetzt parallel Pitch-, Demo- oder Investor-Material baust.  
Für Website und Reachouts aktuell zweitrangig.

## Die wichtigste Antwort auf „Google CLI oder andere Plattformen?“

Wenn du mit „Google CLI“ **Gemini CLI** meinst:

- **nützlich als zweiter Research-/Ideation-Agent**
- **nicht** der größte Hebel für visuelle Website-Qualität

Wenn du mit „Google-Tools“ eher Performance-/Website-Qualität meinst:

- dann sind **PageSpeed Insights API**, **Lighthouse**, **Lighthouse CI** und **Search Console** sehr viel wichtiger

## Harte Tool-Empfehlung nach Hebel

## Tier A – Sofort höchster Nutzen

### 1. Polypane

Was es konkret bringt:

- mehrere Breakpoints gleichzeitig sehen
- responsive Fehler viel schneller erkennen
- horizontale Overflow-Probleme aufdecken
- Reachability, Accessibility und Meta-/Social-Card-Probleme mitprüfen
- Dark mode, reduced motion, contrast und andere Zustände nebeneinander sehen

Warum das für euch gerade extrem sinnvoll ist:

- ihr habt viele marketing-lastige Seiten mit wiederverwendeten Layout-Blöcken
- eure größten visuellen Schwächen liegen aktuell oft in:
  - Fold-Kompression
  - mobilem Spacing
  - visueller Balance
  - responsiver Priorisierung

Genau dafür ist Polypane stark.

Mein Urteil:

- **einer der stärksten sofortigen Hebel**
- vermutlich der beste externe QA-Tool-Kauf für die nächsten Tage

Quelle:

- [Polypane](https://polypane.app/)
- [Polypane Docs](https://polypane.app/docs/)
- [Polypane Accessibility Overview](https://polypane.app/docs/accessibility-overview/)

### 2. Screen Studio

Was es konkret bringt:

- deutlich hochwertigere Screen-Recordings auf dem Mac
- automatische Zooms, Cursor-Smoothing, Audio-Normalisierung
- Webcam, Mikrofon und Systemaudio in einem Workflow
- gute Export-Presets für Web und Social

Warum das für euch gerade extrem sinnvoll ist:

- ihr braucht kurze Produkt-Loops
- ihr braucht hochwertige Founder-Videos
- normale Loom-/QuickTime-/OBS-Captures sehen oft zu roh aus

Für eure Ziele ist Screen Studio fast ideal, weil es:

- schnell ist
- ohne großes Motion-Team gute Ergebnisse liefert
- besonders gut für saubere Produktdemos und Gründer-Erklärvideos ist

Mein Urteil:

- **der beste Video-/Capture-Hebel für euch in den nächsten Tagen**

Quelle:

- [Screen Studio](https://screen.studio/)

### 3. Percy

Was es konkret bringt:

- visuelle Regressionstests
- Baseline-/Diff-Review pro UI-Änderung
- responsive Snapshot-Prüfung
- besserer Review-Prozess für visuelle Änderungen

Warum das für euch gerade sinnvoll ist:

- ihr macht viele öffentliche UI-Änderungen in Hero, Proof, Pricing, FAQ, Hubs
- dabei passieren leicht:
  - Spacing-Brüche
  - Crop-Probleme
  - ungewollte Layout-Verschiebungen
  - mobile Regressionsfehler

Percy ist nicht für Design-Entscheidungen da.  
Es ist dafür da, dass gute Entscheidungen **nicht wieder kaputt gehen**.

Mein Urteil:

- **sehr hoher Hebel**, sobald die nächste Website-Welle startet
- ideal in Kombination mit euren bestehenden Playwright-Tests

Quelle:

- [Percy Docs](https://www.browserstack.com/docs/percy)
- [Percy Visual Testing](https://www.browserstack.com/percy/visual-testing)

### 4. Lighthouse CI + PageSpeed Insights API + WebPageTest

Was das konkret bringt:

- wiederholbare Performance-Budgets
- regressionssichere Performance-Prüfung
- Core-Web-Vitals-Überwachung
- echte Lab- und Feldperspektive
- schnellere Diagnose, wenn eine schöne Seite am Ende zu langsam ist

Warum das für euch gerade sinnvoll ist:

- teure, ruhige, hochwertige Seiten müssen **nicht nur gut aussehen**, sondern auch schnell und stabil sein
- Performance-Probleme schaden:
  - Premium-Wirkung
  - Mobile-UX
  - Conversion
  - Search-Performance

Mein Urteil:

- **Pflicht-Stack für technische Qualitätskontrolle**
- nicht sexy, aber extrem wichtig

Quellen:

- [Lighthouse](https://github.com/GoogleChrome/lighthouse)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- [PageSpeed API Method](https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed)
- [WebPageTest Docs](https://docs.webpagetest.org/)

## Tier B – Sehr sinnvoll, aber abhängig vom Workflow

### 5. Figma Dev Mode

Was es konkret bringt:

- genaue Design-Inspektion
- Spacing-, Token- und Komponenten-Review
- Versionsvergleich
- „ready for dev“-Struktur

Warum es sinnvoll sein kann:

- wenn ihr vor größeren visuellen Sprüngen Varianten erst in Figma prüft
- wenn du Design und Code stärker trennen willst

Wann es **nicht** der beste nächste Schritt ist:

- wenn du aktuell ohnehin fast alles direkt im Code entscheidest
- wenn kein echter Figma-Workflow existiert

Mein Urteil:

- **sehr sinnvoll**, wenn ihr aktiv mit Figma arbeitet
- **nicht zwingend**, wenn ihr rein code-first bleibt

Quellen:

- [Figma Dev Mode](https://www.figma.com/dev-mode/)
- [Guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode)

### 6. Descript

Was es konkret bringt:

- gute Untertitel- und Transkript-Workflows
- textbasierte Videobearbeitung
- Filler-Word-Entfernung
- Captions und Subtitle-Exports

Warum es sinnvoll ist:

- eure Founder-Videos werden deutlich stärker mit:
  - guten Captions
  - gutem Transcript
  - sauberem Rohschnitt

Mein Urteil:

- **sehr sinnvoll für die Video-Phase**
- weniger wichtig für reines Website-Layout

Quellen:

- [Descript](https://www.descript.com/)
- [Descript Subtitles](https://www.descript.com/tools/subtitles-generator)

### 7. Jitter

Was es konkret bringt:

- schnelle Motion-Designs
- einfache Animationen für Marketing und Produkt-Visuals
- Figma-Import

Warum es sinnvoll sein kann:

- wenn ihr kurze Motion-Sequenzen für Hero, Social oder erklärende Micro-Motion bauen wollt

Warum ich es nicht als Tier A sehe:

- euer Kernproblem ist derzeit nicht „zu wenig Motion“
- es ist eher:
  - zu wenig visuelle Dominanz
  - zu viel Modularität
  - noch nicht genug Premium-Inszenierung

Mein Urteil:

- **nice to have**
- gut für später, wenn ihr kleine hochwertige Motion-Akzente wollt

Quelle:

- [Jitter](https://jitter.video/)

## Tier C – Nur später oder selektiv

### 8. Rive

Was es konkret bringt:

- interaktive, hochwertige, state-machine-basierte Motion-/UI-Elemente
- sehr starke Brand-/Motion-Möglichkeiten

Warum ich es aktuell nicht priorisieren würde:

- hohe Macht, aber auch hoher Ablenkungsfaktor
- für eure nächsten Reachouts ist das overkill
- ihr braucht zuerst Klarheit, Führung, Proof und Videos

Mein Urteil:

- **später interessant**
- **jetzt nicht nötig**

Quelle:

- [Rive](https://rive.app/)

### 9. Gemini CLI

Was es konkret bringt:

- zweiter Agent für Research, Ideation, Konkurrenzanalyse, Copy-Alternativen und experimentelle Aufgaben
- unterstützt laut Google Terminal-Workflows, Websuche und lokale Tools

Warum es nicht Top-Priorität ist:

- es wird eure Website nicht automatisch besser layouten
- es ist eher ein zusätzlicher Denk- und Recherchepartner
- ihr habt mit Codex bereits einen starken Agenten im Workflow

Mein Urteil:

- **nützlich als zweiter Blick**
- **kein primärer Hebel für visuelle Qualität**

Quelle:

- [Gemini CLI](https://developers.google.com/gemini-code-assist/docs/gemini-cli)

## Meine konkrete Empfehlung für Codex-Skills

## Skills, die ich installieren würde

1. `screenshot`
2. `transcribe`
3. `speech`

Zusätzlich nur wenn ihr wirklich mit Figma arbeitet:

4. `figma`
5. `figma-implement-design`

Optional:

6. `playwright`

## Skills, die ich aktuell nicht installieren würde

- `imagegen`
- `sora`
- `slides`

## Meine konkrete Empfehlung für externe Plattformen

## Wenn du nur 2 Tools zusätzlich holen willst

1. **Polypane**
2. **Screen Studio**

Das ist für die nächsten Tage wahrscheinlich die beste Preis-/Nutzen-Kombination.

## Wenn du 4 Tools zusätzlich holen willst

1. **Polypane**
2. **Screen Studio**
3. **Percy**
4. **Descript**

## Wenn du ein komplettes Qualitäts-Setup willst

1. **Polypane**
2. **Screen Studio**
3. **Percy**
4. **Descript**
5. **Lighthouse CI**
6. **PageSpeed Insights API**
7. **WebPageTest**
8. optional **Figma Dev Mode**

## Was euch in den nächsten Tagen am meisten konkret hilft

### Szenario A – Ziel: Website vor Reachouts sichtbar besser machen

Priorität:

1. Polypane
2. Percy
3. Lighthouse CI / PSI / WebPageTest

Warum:

- responsive Schwächen schneller finden
- visuelle Regressionsfehler stoppen
- Lade- und UX-Probleme systematisch verhindern

### Szenario B – Ziel: gute Founder-Videos bauen

Priorität:

1. Screen Studio
2. Descript
3. `transcribe` / `speech`-Skill

Warum:

- bessere Screen-Captures
- bessere Captions
- bessere Watch-Seiten und Video-SEO

### Szenario C – Ziel: visuelles Niveau insgesamt anheben

Priorität:

1. Polypane
2. Screen Studio
3. Figma Dev Mode
4. Percy

Warum:

- bessere Design-Entscheidungen
- bessere Captures
- bessere responsive Qualität
- weniger Rückschritte

## Mein klares Fazit

Wenn du wissen willst, was euch **am meisten konkret** hilft, um die Website vor Outreach auf ein deutlich stärkeres Niveau zu bringen, dann ist meine Reihenfolge:

1. **Polypane**
2. **Screen Studio**
3. **Percy**
4. **Descript**
5. **Lighthouse CI / PSI / WebPageTest**

Und für Codex selbst:

1. `screenshot`
2. `transcribe`
3. `speech`
4. optional `figma`
5. optional `figma-implement-design`

## Wichtigster strategischer Punkt

Die nächsten großen Qualitätsgewinne kommen **nicht** von „mehr AI“, sondern von:

- besserem visuellen Urteil
- stärkerem responsive QA
- besserem Capture-Workflow
- besserer Review-Disziplin
- besser produzierten Founder-Videos

AI kann euch dabei helfen.  
Aber diese fünf Dinge sind der eigentliche Hebel.
