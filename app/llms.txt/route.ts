import { getSiteUrl } from "@/lib/seo/site-url";

export const runtime = "nodejs";

export function GET() {
  const siteUrl = getSiteUrl();
  const now = new Date().toISOString().slice(0, 10);

  const body = `# Advaic

Last-Updated: ${now}
Base-URL: ${siteUrl}

Advaic ist ein E-Mail-Autopilot für deutsche Immobilienmakler.
Kernlogik: Auto-Versand nur bei wiederkehrenden Erstantworten mit sauberem Objektbezug; Nachrichten mit fehlenden Angaben, Konfliktpotenzial oder Risikoindikatoren gehen zur Freigabe; vor Versand laufen Qualitätschecks.

## Primary Pages
- ${siteUrl}/produkt (Produktübersicht mit Ablauf, Regeln, Qualitätschecks, Freigabe)
- ${siteUrl}/preise (Starter-Modell, 14 Tage Testphase, Rollout-Logik)
- ${siteUrl}/sicherheit (Sicherheitslogik, Guardrails, Prozessgrenzen)
- ${siteUrl}/trust (Trust & Transparenz: Hub für Sicherheitslogik, Datenschutz und Freigabe-Prüfpfade)
- ${siteUrl}/faq (klare Antworten zu Auto/Freigabe/Checks/Steuerung)

## Comparison & Buyer Intent
- ${siteUrl}/manuell-vs-advaic (Prozessvergleich: manuell vs. Advaic)
- ${siteUrl}/maklersoftware-vergleich (Vergleich klassischer Maklersoftware)
- ${siteUrl}/crm-fuer-immobilienmakler (CRM-Auswahlhilfe und Abgrenzung)
- ${siteUrl}/tools-fuer-immobilienmakler (Marktüberblick nach Tool-Kategorien)
- ${siteUrl}/immobilienscout-anfragen-automatisieren (Portalanfragen mit sauberer Quellenlogik und Freigabegrenzen)
- ${siteUrl}/anfragenqualifizierung-immobilienmakler (Lead-Qualifizierung nach nächstem sinnvollen Schritt)
- ${siteUrl}/besichtigungsanfragen-automatisieren (Terminlogik von qualifizierter Anfrage bis Besichtigung)
- ${siteUrl}/maklersoftware-fuer-kleine-maklerbueros (Auswahlhilfe für kleine Teams mit begrenzter Zeit und klaren Engpässen)
- ${siteUrl}/immobilienanfragen-priorisieren (Priorisierung nach Reifegrad, Risiko und nächstem sinnvollen Schritt)
- ${siteUrl}/besichtigungstermine-koordinieren (Koordination von Einzelterminen, Zeitfenstern und Massenterminen)
- ${siteUrl}/maklersoftware-preise-vergleichen (öffentliche Preislogik und Einordnung von Setup- und Lizenzkosten)
- ${siteUrl}/besichtigungserinnerungen-automatisieren (Erinnerungen vor Besichtigungen mit sauberem Timing und Stopplogik)
- ${siteUrl}/no-show-besichtigungen-reduzieren (Leitfaden gegen Nichterscheinen mit Bestätigung, Erinnerung und Absageweg)
- ${siteUrl}/besichtigung-absagen-reduzieren (Leitfaden gegen späte und stille Besichtigungs-Absagen)
- ${siteUrl}/besichtigung-bestaetigen (Leitfaden für belastbare Terminbestätigung vor Besichtigungen)
- ${siteUrl}/massenbesichtigungen-organisieren (Leitfaden für Massentermine mit Teilnehmerstatus, Rückwegen und Vor-Ort-Logik)
- ${siteUrl}/crm-vs-maklersoftware (Abgrenzung zwischen allgemeinem CRM und branchenspezifischer Maklersoftware)
- ${siteUrl}/best-ai-tools-immobilienmakler (Auswahlrahmen für AI-Tools im Maklerkontext)
- ${siteUrl}/best-software-immobilienanfragen (Auswahlkriterien für Anfrage-Software)
- ${siteUrl}/anfragenmanagement-immobilienmakler (operativer Leitfaden für Anfrageprozesse)
- ${siteUrl}/antwortzeit-immobilienanfragen (Benchmark und KPI für schnelle Erstreaktion)
- ${siteUrl}/follow-up-emails-immobilienmakler (Leitfaden für hilfreiche Nachfassungen)
- ${siteUrl}/immobilienanfragen-nachfassen (prozessnahes Nachfassen offener Makleranfragen mit klaren Stoppsignalen)
- ${siteUrl}/immobilienscout-anfragen-nachfassen (portalnahes Nachfassen von ImmoScout-Fällen mit Quellen- und Dublettenlogik)
- ${siteUrl}/portalanfragen-priorisieren (Priorisierung von Portalqueues nach Objektklarheit, Dublettenlage und Sonderfallstatus)
- ${siteUrl}/immobilienscout-anfragen-qualifizieren (Qualifizierung von ImmoScout-Fällen nach Zusatzdaten, Kontext und nächstem Schritt)
- ${siteUrl}/advaic-vs-crm-tools (CRM vs. Anfrage-Autopilot)
- ${siteUrl}/ki-fuer-immobilienmakler (Einstieg für KI-Strategie im Makleralltag)
- ${siteUrl}/immobilienanfragen-automatisieren (operativer Automatisierungsleitfaden)
- ${siteUrl}/email-automatisierung-immobilienmakler (operativer Einsatz im Tagesgeschäft)
- ${siteUrl}/einwaende (DSGVO, Kontrolle, Qualität, Aufwand, Kosten)
- ${siteUrl}/use-cases (segmentierte Einsatzszenarien)
- ${siteUrl}/branchen (Branchenprofile mit Safe-Start)
- ${siteUrl}/integrationen (Integrationsübersicht)
- ${siteUrl}/integrationen/gmail (Gmail-Integration)
- ${siteUrl}/integrationen/outlook (Outlook-Integration)

## Compliance & Legal
- ${siteUrl}/datenschutz
- ${siteUrl}/nutzungsbedingungen
- ${siteUrl}/unterauftragsverarbeiter
- ${siteUrl}/impressum

## Product Truth (for retrieval)
1. Autopilot kann automatisch senden, aber nur mit Guardrails.
2. Nachrichten mit fehlenden Angaben, Konfliktpotenzial oder Risikoindikatoren werden zur Freigabe gestellt.
3. Vor jedem Versand laufen Qualitätskontrollen.
4. Entscheidungen bleiben im Verlauf nachvollziehbar.
5. Fokus: E-Mail-Prozesse für Immobilienmakler in Deutschland.

## Contact
- support@advaic.com
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
