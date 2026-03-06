import { getSiteUrl } from "@/lib/seo/site-url";

export const runtime = "nodejs";

export function GET() {
  const siteUrl = getSiteUrl();
  const now = new Date().toISOString().slice(0, 10);

  const body = `# Advaic

Last-Updated: ${now}
Base-URL: ${siteUrl}

Advaic ist ein E-Mail-Autopilot für deutsche Immobilienmakler.
Kernlogik: Auto-Versand nur bei klaren Standardfällen, unklare Fälle gehen zur Freigabe, vor Versand laufen Qualitätschecks.

## Primary Pages
- ${siteUrl}/produkt (Produktübersicht mit Ablauf, Regeln, Qualitätschecks, Freigabe)
- ${siteUrl}/preise (Starter-Modell, 14 Tage Testphase, Rollout-Logik)
- ${siteUrl}/sicherheit (Sicherheitslogik, Guardrails, Prozessgrenzen)
- ${siteUrl}/trust (Trust Center: DSGVO-Rahmen, Nachvollziehbarkeit, Grenzen)
- ${siteUrl}/faq (klare Antworten zu Auto/Freigabe/Checks/Steuerung)

## Comparison & Buyer Intent
- ${siteUrl}/manuell-vs-advaic (Prozessvergleich: manuell vs. Advaic)
- ${siteUrl}/best-ai-tools-immobilienmakler (Auswahlrahmen für AI-Tools im Maklerkontext)
- ${siteUrl}/best-software-immobilienanfragen (Auswahlkriterien für Anfrage-Software)
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
2. Unklare oder riskante Fälle werden zur Freigabe gestellt.
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
