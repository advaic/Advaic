# Still-Visual-System

Stand: 12. März 2026

## Ziel

Aus den Rohscreens aus dem Kern-Screenshot-Set werden einheitliche Produktvisuals, die auf Website, Watch-Seiten, Sales-Material und Video-Thumbnails gleich aussehen.

## Systemregeln

1. Ein Visual trägt genau eine Leitbotschaft.
2. Auf dem Produktbild liegen maximal zwei Pins.
3. Die eigentliche Erklärung sitzt außerhalb des Screens.
4. Desktop läuft im Browser-Frame, Mobile im Phone-Frame.
5. Farben codieren Zustände statt Dekoration:
   - `Brand`: Kernmechanik, Rollout, Systemlogik
   - `Success`: stabil, sicher, freigegeben
   - `Warning`: prüfen, Freigabe, Guardrails
   - `Danger`: stoppen, eskalieren, blockiert
   - `Neutral`: Kontext, Einordnung, Struktur

## Komponenten

- [AnnotatedStillVisual.tsx](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing-visuals/AnnotatedStillVisual.tsx)
- [still-visual-system.ts](/Users/kilianziemann/Downloads/advaic-dashboard/components/marketing-visuals/still-visual-system.ts)
- interne Vorschau unter `/demo?view=stills`

## Bildquellen

Die Rohscreens liegen an zwei Stellen:

- dokumentiert unter [docs/marketing-screenshots/2026-03-12](/Users/kilianziemann/Downloads/advaic-dashboard/docs/marketing-screenshots/2026-03-12)
- komponententauglich unter [public/marketing-screenshots/core/raw](/Users/kilianziemann/Downloads/advaic-dashboard/public/marketing-screenshots/core/raw)

Der Export wird erzeugt über:

```bash
npm run playwright:screenshots:capture
```

## Preview-Modi

- Galerie: `/demo?view=stills`
- Einzelmotiv: `/demo?view=stills&id=messages-inbox`
- Capture-freundlich: `/demo?view=stills&id=messages-inbox&clean=1`

## Nächster Schritt

Nach dem Hero-Umbau folgt `S3-23`: Die Produktseite bekommt pro Kernsektion dieselbe kuratierte Still- oder Motion-Logik statt additiver Wiederholungen.
