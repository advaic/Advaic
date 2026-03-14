# Strikter Re-Audit

Stand: `2026-03-12`  
Basis: frischer Playwright-Capture auf `http://127.0.0.1:4010` sowie erneute Sichtprüfung der Kernrouten.

## Methode

- Playwright-Capture über:
  - `/`
  - `/produkt`
  - `/app/startseite`
  - `/app/nachrichten`
  - `/app/nachrichten/[id]`
  - `/app/zur-freigabe`
- Desktop- und Mobile-Screens aus [docs/ui-audit/2026-03-10](./ui-audit/2026-03-10)
- Public-Smokes für Homepage und Produktseite erneut grün gezogen
- Route-Checks für `/`, `/produkt`, `/preise`, `/faq` erneut geprüft

## Kurzurteil

Das System ist klar besser als vor dem Redesign, aber noch nicht auf dem Niveau einer wirklich sauberen High-Conversion-Website plus effizienten Arbeits-App.

### Scorecard

| Fläche | Desktop | Mobile | Urteil |
| --- | --- | --- | --- |
| `/` | `7/10` | `4.5/10` | Desktop inzwischen brauchbar, mobil weiter klar zu schwach |
| `/produkt` | `7/10` | `4.5/10` | Produktseite wirkt ernster, verliert mobil aber zu viel Raum an Text und Overlays |
| `/app/startseite` | `6/10` | `4/10` | Above-the-fold immer noch zu dicht und zu hoch |
| `/app/nachrichten` | `7/10` | `5/10` | Desktop solide, mobil zu viel Steuerung vor der ersten Nachricht |
| `/app/nachrichten/[id]` | `5.5/10` | `4/10` | Zu viel Kontext und zu viele Aktionen vor der eigentlichen Arbeit |
| `/app/zur-freigabe` | `5/10` | `3.5/10` | Strukturell verbessert, aber weiterhin zu viel Verwaltungs-Chrome vor dem ersten Fall |

## Harte Befunde

### P0

- `P0-01` Manifest war kaputt und ist jetzt auf den korrekten Next-Special-File umgestellt.
  - Fix: [app/manifest.ts](../app/manifest.ts) plus [app/layout.tsx](../app/layout.tsx)
  - Wirkung: PWA-/Install-Metadata und Browser-Asset-Kette sind aktuell fehlerhaft

- `P0-02` Die Wortmarke hat ein fehlendes Asset referenziert und ist jetzt auf eine reine Text-/Icon-Wordmark umgestellt.
  - Fix: [components/brand/BrandLogo.tsx](../components/brand/BrandLogo.tsx)
  - Wirkung: unnötige `404`-Requests und inkonsistente Marken-Darstellung

- `P0-03` Mobile Marketing-Flächen werden durch Overlays beschädigt.
  - Betroffen:
    - Cookie-Leiste
    - Cookie-Einstellungen-Button
    - `Frage an Advaic`
  - Wirkung: CTA-Block und Sekundäraktion werden auf `/` und `/produkt` sichtbar überlagert

- `P0-04` Mobile App-Flächen verlieren Above-the-fold zu viel Platz an Steuerungs-Chrome.
  - Betroffen:
    - `/app/startseite`
    - `/app/nachrichten`
    - `/app/nachrichten/[id]`
    - `/app/zur-freigabe`
  - Wirkung: erste eigentliche Arbeitsinformation startet zu spät

## Neue Pflichtliste

### Welle A – Sofort fixen

- `R0-01` `[done]` Manifest richtig anbinden
  - Fläche: Website-Infrastruktur
  - Problem: Manifest war falsch angebunden
  - Dateien:
    - [app/manifest.ts](../app/manifest.ts)
    - [app/layout.tsx](../app/layout.tsx)
  - Änderung:
    - auf echten Next-Special-File umstellen
    - Manifest-Route final prüfen
  - DoD:
    - `GET /manifest.webmanifest` liefert `200`
    - Manifest referenziert nur existierende Icons

- `R0-02` `[done]` Wortmarke reparieren
  - Fläche: Branding / Navigation
  - Problem: fehlende Wordmark-Datei
  - Dateien:
    - [components/brand/BrandLogo.tsx](../components/brand/BrandLogo.tsx)
    - [public/brand](../public/brand)
  - Änderung:
    - entweder echtes Asset ergänzen
    - oder die Bildreferenz komplett entfernen und konsequent auf Text-/Icon-Fallback gehen
  - DoD:
    - keine Referenz auf `/brand/advaic-wordmark.png` mehr

- `R0-03` `[done]` Marketing-Overlays mobil entkoppeln
  - Fläche: `/`, `/produkt`
  - Problem: Assistant, Cookie-Leiste und Utility-Buttons beschädigen CTA und Sekundäraktion
  - Dateien:
    - [components/marketing/PublicClientWidgets.tsx](../components/marketing/PublicClientWidgets.tsx)
    - [components/marketing/PublicAssistantWidget.tsx](../components/marketing/PublicAssistantWidget.tsx)
    - [components/marketing/CookieConsentBanner.tsx](../components/marketing/CookieConsentBanner.tsx)
  - Änderung:
    - mobil nur ein aktives Overlay zur selben Zeit
    - `Frage an Advaic` im Hero-Bereich mobil ausblenden oder später einblenden
    - Cookie-Einstellungen nicht als dauerhaftes zweites Floating-Element im Fold
  - DoD:
    - auf `390px` und `430px` überlappt kein Overlay mehr Hero-CTA oder Sekundär-CTA

- `R0-04` `[done]` Homepage mobile Hero neu auf Fold bauen
  - Fläche: `/`
  - Problem: auf Mobile ist Above-the-fold fast nur Text; das Video startet erst zu spät
  - Dateien:
    - [components/marketing/Hero.tsx](../components/marketing/Hero.tsx)
    - [components/marketing/HeroStillVisual.tsx](../components/marketing/HeroStillVisual.tsx)
  - Änderung:
    - H1 kürzer
    - Video oder Poster-Frame sichtbar im ersten Viewport
    - CTA-Block auf maximal 2 Ebenen
  - DoD:
    - auf `390px` ist Produktbeweis sichtbar, bevor man scrollt

- `R0-05` `[done]` Produktseite mobile Hero neu balancieren
  - Fläche: `/produkt`
  - Problem: mobiler Fold wird von Headline, Beschreibung, Bullet-Liste und Overlays aufgefressen
  - Dateien:
    - [components/marketing/produkt/Hero.tsx](../components/marketing/produkt/Hero.tsx)
    - [components/marketing/produkt/HeroStillVisual.tsx](../components/marketing/produkt/HeroStillVisual.tsx)
  - Änderung:
    - Bullet-Liste kürzen
    - Video-Frame deutlich höher im Layout platzieren
    - untere CTA-Zone aufräumen
  - DoD:
    - auf `390px` ist das Produktvideo im ersten oder spätestens zweiten Scroll-Segment sichtbar

- `R0-06` `[done]` Dashboard-Mobile-Fold halbieren
  - Fläche: `/app/startseite`
  - Problem: Titel, Status-Chips, Primär-CTA, Intro, Schnellstart und Floating-Buttons nehmen zu viel vertikalen Raum
  - Dateien:
    - [app/app/startseite/StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx)
    - [app/ClientRootLayout.tsx](../app/ClientRootLayout.tsx)
  - Änderung:
    - Page-Intro kompakter
    - Status-Chips in eine schlankere Zeile
    - `Heute wichtig` oben deutlich kürzer
  - DoD:
    - auf `390px` ist der erste echte Entscheidungsblock deutlich früher sichtbar

- `R0-07` `[done]` Freigabe-Mobile-Fold radikal entlasten
  - Fläche: `/app/zur-freigabe`
  - Problem: Sortierung, Suche, Auswahlleiste, Bulk-Aktionen und KPI-Karten verdrängen den ersten Review-Fall
  - Dateien:
    - [app/app/zur-freigabe/ZurFreigabeUI.tsx](../app/app/zur-freigabe/ZurFreigabeUI.tsx)
    - [tests/playwright/app-approvals.spec.ts](../tests/playwright/app-approvals.spec.ts)
  - Änderung:
    - mobil nur noch kurze Arbeitsleiste mit Auswahl- und Priorisierungs-Toggle
    - Sortierung auf Mobile in die aufklappbaren Werkzeuge verschieben
    - volle Bulk-Aktionen und volle Triage-Stats nur noch bei Bedarf zeigen
    - „Prüfbarkeit & Verlauf“ auf Mobile unter die Liste verlagern
  - DoD:
    - auf `390px` beginnt die erste Freigabe-Karte im ersten Viewport

- `R0-08` `[done]` Konversation-Mobile-Fold auf echte Arbeit trimmen
  - Fläche: `/app/nachrichten/[id]`
  - Problem: Lead-Kontext, Statuskarten und Aktionsstapel verdrängen den Thread
  - Dateien:
    - [app/app/nachrichten/components/LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx)
    - [tests/playwright/app-conversation.spec.ts](../tests/playwright/app-conversation.spec.ts)
  - Änderung:
    - mobile Konversation bekommt nur noch einen kompakten Fallkopf mit Toggle-Leiste
    - Kontext-Zusammenfassung und Aktionsleiste sind mobil standardmäßig eingeklappt
    - Thread-Header ist auf Mobile kürzer, damit der Verlauf früher startet
  - DoD:
    - die erste echte Nachricht ist mobil früh sichtbar

### Welle B – Als Nächstes

- `R1-10` Homepage-Hero desktop weiter schärfen
  - Problem: H1 ist besser, aber noch immer zu lang und zu allgemein
  - Dateien:
    - [components/marketing/Hero.tsx](../components/marketing/Hero.tsx)
  - Änderung:
    - H1 auf eine klarere, kaufnähere Aussage
    - Subhead stärker auf `wann Auto, wann Freigabe`

- `R1-11` Homepage-Proofblock kürzen
  - Problem: [components/marketing/ProductVisualAuthority.tsx](../components/marketing/ProductVisualAuthority.tsx) ist jetzt okay, aber noch immer zu textlastig
  - Änderung:
    - weniger Erklärung pro Karte
    - schnellerer Scan statt ausführlicher Nachweis-Texte

- `R1-12` Produkt-Hero copyseitig entschlacken
  - Problem: `/produkt` startet weiter mit zu viel Erklärung vor dem Scroll
  - Dateien:
    - [components/marketing/produkt/Hero.tsx](../components/marketing/produkt/Hero.tsx)
  - Änderung:
    - weniger Bullet-Liste
    - mehr Beweis, weniger Einleitung

- `R1-13` Produktseite inhaltlich entschlacken
  - Problem: zu viele Sektionen konkurrieren um dieselbe Entscheidung
  - Dateien:
    - [app/produkt/page.tsx](../app/produkt/page.tsx)
  - Änderung:
    - doppelte Trust-/Proof-/Explain-Schichten reduzieren
    - klarere Reihenfolge: Hero → Ablauf → Regeln → Freigabe → Checks → Setup → FAQ

- `R1-14` Messages-Mobile-Fold entschlacken
  - Fläche: `/app/nachrichten`
  - Problem: Suche, Mehr, Filterchips, Tipp-Box und Auswahlmodus verbrauchen vor der ersten Zeile zu viel Platz
  - Dateien:
    - [app/app/nachrichten/NachrichtenPageClient.tsx](../app/app/nachrichten/NachrichtenPageClient.tsx)
    - [app/app/nachrichten/components/InboxView.tsx](../app/app/nachrichten/components/InboxView.tsx)
  - Änderung:
    - Tipp-Box kleiner oder dismissible
    - Auswahlleiste im Idle-Zustand minimieren
    - Filter-Chips kompakter

- `R1-15` Messages-Desktop-Bulk-Leiste entdramatisieren
  - Fläche: `/app/nachrichten`
  - Problem: der stabile Auswahlmodus ist funktional, wirkt aber im Leerlauf zu präsent
  - Dateien:
    - [app/app/nachrichten/components/InboxView.tsx](../app/app/nachrichten/components/InboxView.tsx)
  - Änderung:
    - Idle-State deutlich ruhiger
    - erst bei Auswahl volle Aktionsleiste

- `R1-16` Konversation-Desktop-Aktionsleiste zusammenziehen
  - Fläche: `/app/nachrichten/[id]`
  - Problem: `Öffnen`, `E-Mail kopieren`, `Profil`, `Export`, `Eskalieren` sind zu gleich laut
  - Dateien:
    - [app/app/nachrichten/components/LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx)
  - Änderung:
    - nur 1 Primäraktion sichtbar
    - Rest ins Overflow

- `R1-17` Konversation-Rechtes Rail priorisieren
  - Fläche: `/app/nachrichten/[id]`
  - Problem: Kontextspalte ist zu hoch und noch nicht streng genug priorisiert
  - Dateien:
    - [app/app/nachrichten/components/LeadChatView.tsx](../app/app/nachrichten/components/LeadChatView.tsx)
  - Änderung:
    - nur Objekt, Eskalationsgrund, Follow-up-Status und Regelhinweis oben
    - sekundäre Details tiefer oder einklappbar

- `R1-18` Freigabe-Desktop-Toolbar zusammenstauchen
  - Fläche: `/app/zur-freigabe`
  - Problem: Vor dem ersten Fall stehen zu viele Steuerungselemente
  - Dateien:
    - [app/app/zur-freigabe/ZurFreigabeUI.tsx](../app/app/zur-freigabe/ZurFreigabeUI.tsx)
  - Änderung:
    - Bulk-Aktionen kompakter gruppieren
    - KPI-Karten und Hilfeboxen nach unten

- `R1-19` Dashboard-Schnellstart kürzen
  - Fläche: `/app/startseite`
  - Problem: das Stepper-Modul ist weiter zu hoch und dominiert den Fold
  - Dateien:
    - [app/app/startseite/StartseiteUI.tsx](../app/app/startseite/StartseiteUI.tsx)
  - Änderung:
    - Stepper als verdichtete 3-Zeilen-Ansicht
    - Details erst per Expand

- `R1-20` Sidebar-Höhe reduzieren
  - Fläche: App global
  - Problem: `Automationsstatus` belegt weiter viel Raum, bevor die eigentliche Navigation beginnt
  - Dateien:
    - [components/Sidebar.tsx](../components/Sidebar.tsx)
  - Änderung:
    - kompakteres Statusmodul
    - weniger vertikale Unterbrechung

### Welle C – Danach

- `R2-30` Floating-Widgets systemweit neu regeln
  - Flächen:
    - Marketing
    - App
  - Problem: Help-/Assistant-/Cookie-Utilities wirken auf kleinen Viewports weiter wie Fremdkörper
  - Dateien:
    - [components/marketing/PublicClientWidgets.tsx](../components/marketing/PublicClientWidgets.tsx)
    - [components/marketing/PublicAssistantWidget.tsx](../components/marketing/PublicAssistantWidget.tsx)
    - App-Floating-Utilities in Kernflächen

- `R2-31` Dev-Stabilität dokumentieren
  - Problem: der `/produkt`-`404` war kein Routing-Löschfehler, sondern ein instabiler lokaler Dev-Prozess
  - Änderung:
    - klare Dev-Start-/Cleanup-Doku
    - keine direkte Abhängigkeit von kaputten `.next/dev`-Artefakten

## Empfohlene Reihenfolge

1. `R0-03`
2. `R0-04`
3. `R0-05`
4. `R0-06`
5. `R0-07`
6. `R0-08`
9. `R1-14`
10. `R1-16`
11. `R1-18`
12. `R1-19`

## Wichtigster Richtungsentscheid

Nicht einfach den alten Sprint-Plan linear fortsetzen.

Der richtige Schritt ist jetzt:

- alten Fortschritt behalten
- aber die Priorisierung auf die neuen P0-/Mobile-/Arbeitsfluss-Probleme umstellen
- Website und App wieder von realer Nutzung aus priorisieren, nicht von bereits erledigten Task-Phasen
