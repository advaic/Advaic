# Video-Production-Pack

Stand: 12. März 2026

## Ziel

Dieses Paket macht `S4-30` produktionsreif. Es definiert drei Hauptvideos mit klarer Rolle:

1. `Tagesgeschäft`
2. `Auto vs. Freigabe`
3. `Qualitätschecks & Follow-ups`

Jedes Video hat:

- klare Such- und Vertrauensfrage
- Kapitel
- Shot-Liste
- Sprechertext
- CTA
- definierte Quellen aus echten Produktzuständen

## Nicht verhandelbar

1. Keine erfundenen Kundenergebnisse.
2. Keine erfundenen Testimonials oder Referenzen.
3. Keine unhaltbaren Rechts- oder Compliance-Aussagen.
4. Nur echte Produktoberflächen, anonymisierte Zustände und reale Systemlogik.
5. Alle sichtbaren Namen, E-Mail-Adressen und Objektdaten müssen vor Veröffentlichung anonymisiert sein.

## Formatstandard

- Laufzeit: `120–180 Sekunden`
- Master: `1920x1080`, `16:9`
- Sekundärformat für spätere Cutdowns: `1080x1920` aus denselben Szenen ableiten
- Bildstil: ruhige Bewegungen, keine hektischen Zooms, keine „SaaS-Trance“-Animationen
- Sprecherstil: ruhig, konkret, betriebsnah, kein überdrehter Sales-Ton
- Untertitel: immer eingebrannt vorbereiten und zusätzlich als `SRT`/`VTT`
- Musik: optional, sehr leise und nur unterstützend

## Sprachregeln

- Keine Phrasen wie `glasklar`, `nahtlos`, `intelligent`, `Standardfälle`, `unklare Fälle`
- Stattdessen immer konkrete Kriterien:
  - Objektbezug
  - Empfänger
  - vollständige Angaben
  - sensibler Inhalt
  - unsauber prüfbarer Rückkanal
  - Freigabegrund

## Bereits vorhandene Quellen

### Motion-Quellen

- `/demo/inbox?clean=1&autoplay=1&loop=1`
- `/demo/rules?clean=1&autoplay=1&loop=1`
- `/demo/checks?clean=1&autoplay=1&loop=1`
- `/demo/approve?clean=1&autoplay=1&loop=1`
- `/demo/product-hero?clean=1&autoplay=1&loop=1`
- `/demo/tour/1-inbox?clean=1&autoplay=1&loop=1`
- `/demo/tour/2-rules?clean=1&autoplay=1&loop=1`
- `/demo/tour/3-checks?clean=1&autoplay=1&loop=1`
- `/demo/tour/4-log?clean=1&autoplay=1&loop=1`

### Still-Quellen

- [core-screenshot-set.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/core-screenshot-set.md)
- [2026-03-12 Manifest](/Users/kilianziemann/Downloads/advaic-dashboard/docs/marketing-screenshots/2026-03-12/manifest.json)
- [public/marketing-screenshots/core/raw](/Users/kilianziemann/Downloads/advaic-dashboard/public/marketing-screenshots/core/raw)

Wichtigste Still-IDs:

- `messages-inbox`
- `messages-filters`
- `conversation-thread`
- `conversation-context`
- `approval-review-flow`
- `approval-decision`
- `dashboard-startmodul`
- `dashboard-systemstatus`
- `dashboard-automation`
- `tone-style-setup`
- `tone-style-preview`

## Produktions-Commands

```bash
npm run videos:build
npm run videos:record
```

Die generierten Dateien liegen danach in:

- [public/videos](/Users/kilianziemann/Downloads/advaic-dashboard/public/videos)
- [docs/video-renders/2026-03-12](/Users/kilianziemann/Downloads/advaic-dashboard/docs/video-renders/2026-03-12)

## Noch fehlende Capture-Lücken für spätere Feinschnitte

Diese Punkte sind kein Blocker für die vorhandenen Exporte, sollten aber vor einem finalen Polishing noch aufgenommen werden:

- Live-Capture aus `/app/nachrichten/[id]` mit Fokus auf `conversation-followups-card`
- optionaler Live-Capture aus `/app/startseite` für `dashboard-quickstart` im echten Scroll-Kontext
- ein sauberes, anonymisiertes Close-up der rechten Kontextleiste aus `/app/nachrichten/[id]`

## Produktionsreihenfolge

1. Sprechertext final freigeben
2. Shot-Liste pro Video abarbeiten
3. Motion-Szenen aus `/demo/*` aufnehmen
4. fehlende Live-Captures aus der App ergänzen
5. Rohschnitt je Video
6. Untertitel, On-Screen-Texte und Poster
7. Export für Watch-Seiten und Social-Cutdowns

## Briefings

- [01-tagesgeschaeft.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/video-briefs/01-tagesgeschaeft.md)
- [02-auto-vs-freigabe.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/video-briefs/02-auto-vs-freigabe.md)
- [03-qualitaetschecks-followups.md](/Users/kilianziemann/Downloads/advaic-dashboard/docs/video-briefs/03-qualitaetschecks-followups.md)
- [Founder-Video-Playbook](/Users/kilianziemann/Downloads/advaic-dashboard/docs/founder-video-playbook-2026-03-13.md)

## Founder-Einsatz

Die drei Videos sollten nicht nur als reine UI-Motion produziert werden. Für Advaic ist eine founder-geführte Variante sehr wahrscheinlich stärker:

- kurze On-Camera-Hooks
- Voice-over über echte Produktoberflächen
- Abschluss-CTA mit klarer Einordnung statt generischem Werbeton

Die konkrete Aufteilung, Sprechertexte, Kameraeinsätze und Recording-Regeln stehen im Founder-Playbook.

## Stand nach S4-31

Die drei Video-Linien sind jetzt als Produktionssuite und Export-Bundle vorhanden:

- interne Vorschau: `/demo?view=videos`
- pro Video:
  - WebM-Visual
  - Voice-over als `.m4a`
  - Captions als `.vtt`
  - Poster als `.png`

## Stand nach S4-32

Zusätzlich gibt es jetzt drei eigene Watch-Seiten:

- `/demo/tagesgeschaeft`
- `/demo/auto-vs-freigabe`
- `/demo/qualitaetschecks-followups`

Jede Seite enthält:

- eingebetteten Player
- Kapitelübersicht
- Volltranskript
- CTA
- Related Links

Der nächste Schritt im Backlog ist `S4-33`: `VideoObject`-Schema und Video-SEO ergänzen.
