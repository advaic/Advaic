import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

const BASE = getSiteUrl();

const paths = [
  "/",
  "/produkt",
  "/produkt/capabilities",
  "/preise",
  "/ki-fuer-immobilienmakler",
  "/immobilienanfragen-automatisieren",
  "/integrationen",
  "/integrationen/gmail",
  "/integrationen/outlook",
  "/so-funktionierts",
  "/autopilot",
  "/autopilot-regeln",
  "/qualitaetschecks",
  "/freigabe-inbox",
  "/follow-up-logik",
  "/sicherheit",
  "/trust",
  "/faq",
  "/manuell-vs-advaic",
  "/advaic-vs-crm-tools",
  "/best-ai-tools-immobilienmakler",
  "/best-software-immobilienanfragen",
  "/roi-rechner",
  "/einwaende",
  "/einwaende/dsgvo",
  "/einwaende/kontrolle",
  "/einwaende/qualitaet",
  "/einwaende/aufwand",
  "/einwaende/kosten",
  "/email-automatisierung-immobilienmakler",
  "/makler-freigabe-workflow",
  "/dsgvo-email-autopilot",
  "/use-cases",
  "/use-cases/vermietung",
  "/use-cases/kleines-team",
  "/use-cases/mittelpreisige-objekte",
  "/branchen",
  "/branchen/vermietung-ballungsraum",
  "/branchen/kleine-maklerbueros",
  "/branchen/neubau-vertrieb",
  "/impressum",
  "/datenschutz",
  "/nutzungsbedingungen",
  "/cookie-und-storage",
  "/unterauftragsverarbeiter",
  "/llms.txt",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return paths.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency:
      path === "/" ||
      path === "/produkt" ||
      path === "/best-ai-tools-immobilienmakler" ||
      path === "/ki-fuer-immobilienmakler" ||
      path === "/immobilienanfragen-automatisieren"
        ? "weekly"
        : "monthly",
    priority:
      path === "/"
        ? 1
        : path === "/produkt"
        ? 0.9
        : path === "/best-ai-tools-immobilienmakler" ||
          path === "/best-software-immobilienanfragen" ||
          path === "/ki-fuer-immobilienmakler" ||
          path === "/immobilienanfragen-automatisieren"
        ? 0.85
        : path === "/llms.txt"
        ? 0.5
        : 0.7,
  }));
}
