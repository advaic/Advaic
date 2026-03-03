import type { MetadataRoute } from "next";

const BASE = "https://advaic.com";

const paths = [
  "/",
  "/produkt",
  "/produkt/capabilities",
  "/preise",
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
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return paths.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/produkt" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/produkt" ? 0.9 : 0.7,
  }));
}
