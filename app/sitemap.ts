import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

const BASE = getSiteUrl();
const DEFAULT_LAST_MODIFIED = new Date("2026-03-01T00:00:00.000Z");

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

type RouteConfig = {
  path: string;
  sourceFiles: string[];
  changeFrequency?: ChangeFrequency;
  priority?: number;
};

const routes: RouteConfig[] = [
  {
    path: "/",
    sourceFiles: [
      "app/page.tsx",
      "components/marketing/Hero.tsx",
      "components/marketing/ProductVisualAuthority.tsx",
      "components/marketing/Pricing.tsx",
    ],
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/produkt",
    sourceFiles: [
      "app/produkt/page.tsx",
      "components/marketing/produkt/Hero.tsx",
      "components/marketing/produkt/WhatItDoes.tsx",
      "components/marketing/produkt/PolicyRules.tsx",
      "components/marketing/produkt/SecurityPrivacy.tsx",
    ],
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/preise",
    sourceFiles: ["app/preise/page.tsx", "components/marketing/Pricing.tsx"],
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    path: "/so-funktionierts",
    sourceFiles: ["app/so-funktionierts/page.tsx", "components/marketing/StickyTour.tsx"],
    changeFrequency: "monthly",
    priority: 0.82,
  },
  {
    path: "/demo/tagesgeschaeft",
    sourceFiles: [
      "app/(marketing-demo)/demo/tagesgeschaeft/page.tsx",
      "components/marketing-video/MarketingVideoWatchPage.tsx",
      "components/marketing-video/ProductionVideoPlayer.tsx",
      "lib/video/production-videos.ts",
      "lib/video/watch-pages.ts",
      "lib/video/watch-page-server.ts",
    ],
    changeFrequency: "monthly",
    priority: 0.74,
  },
  {
    path: "/demo/auto-vs-freigabe",
    sourceFiles: [
      "app/(marketing-demo)/demo/auto-vs-freigabe/page.tsx",
      "components/marketing-video/MarketingVideoWatchPage.tsx",
      "components/marketing-video/ProductionVideoPlayer.tsx",
      "lib/video/production-videos.ts",
      "lib/video/watch-pages.ts",
      "lib/video/watch-page-server.ts",
    ],
    changeFrequency: "monthly",
    priority: 0.74,
  },
  {
    path: "/demo/qualitaetschecks-followups",
    sourceFiles: [
      "app/(marketing-demo)/demo/qualitaetschecks-followups/page.tsx",
      "components/marketing-video/MarketingVideoWatchPage.tsx",
      "components/marketing-video/ProductionVideoPlayer.tsx",
      "lib/video/production-videos.ts",
      "lib/video/watch-pages.ts",
      "lib/video/watch-page-server.ts",
    ],
    changeFrequency: "monthly",
    priority: 0.74,
  },
  {
    path: "/sicherheit",
    sourceFiles: ["app/sicherheit/page.tsx", "components/marketing/TrustByDesign.tsx"],
    changeFrequency: "monthly",
    priority: 0.82,
  },
  {
    path: "/faq",
    sourceFiles: ["app/faq/page.tsx", "components/marketing/FAQDecisionTree.tsx"],
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/manuell-vs-advaic",
    sourceFiles: ["app/manuell-vs-advaic/page.tsx", "components/marketing/ManualVsAdvaicComparison.tsx"],
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/best-ai-tools-immobilienmakler",
    sourceFiles: ["app/best-ai-tools-immobilienmakler/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/maklersoftware-vergleich",
    sourceFiles: ["app/maklersoftware-vergleich/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/crm-fuer-immobilienmakler",
    sourceFiles: ["app/crm-fuer-immobilienmakler/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/tools-fuer-immobilienmakler",
    sourceFiles: ["app/tools-fuer-immobilienmakler/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/immobilienscout-anfragen-automatisieren",
    sourceFiles: ["app/immobilienscout-anfragen-automatisieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/anfragenqualifizierung-immobilienmakler",
    sourceFiles: ["app/anfragenqualifizierung-immobilienmakler/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/besichtigungsanfragen-automatisieren",
    sourceFiles: ["app/besichtigungsanfragen-automatisieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/maklersoftware-fuer-kleine-maklerbueros",
    sourceFiles: ["app/maklersoftware-fuer-kleine-maklerbueros/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/immobilienanfragen-priorisieren",
    sourceFiles: ["app/immobilienanfragen-priorisieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/besichtigungstermine-koordinieren",
    sourceFiles: ["app/besichtigungstermine-koordinieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/maklersoftware-preise-vergleichen",
    sourceFiles: ["app/maklersoftware-preise-vergleichen/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/besichtigungserinnerungen-automatisieren",
    sourceFiles: ["app/besichtigungserinnerungen-automatisieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/crm-vs-maklersoftware",
    sourceFiles: ["app/crm-vs-maklersoftware/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/no-show-besichtigungen-reduzieren",
    sourceFiles: ["app/no-show-besichtigungen-reduzieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/immobilienanfragen-nachfassen",
    sourceFiles: ["app/immobilienanfragen-nachfassen/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/besichtigung-absagen-reduzieren",
    sourceFiles: ["app/besichtigung-absagen-reduzieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/immobilienscout-anfragen-nachfassen",
    sourceFiles: ["app/immobilienscout-anfragen-nachfassen/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/besichtigung-bestaetigen",
    sourceFiles: ["app/besichtigung-bestaetigen/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/massenbesichtigungen-organisieren",
    sourceFiles: ["app/massenbesichtigungen-organisieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/portalanfragen-priorisieren",
    sourceFiles: ["app/portalanfragen-priorisieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/immobilienscout-anfragen-qualifizieren",
    sourceFiles: ["app/immobilienscout-anfragen-qualifizieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.79,
  },
  {
    path: "/best-software-immobilienanfragen",
    sourceFiles: ["app/best-software-immobilienanfragen/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/anfragenmanagement-immobilienmakler",
    sourceFiles: ["app/anfragenmanagement-immobilienmakler/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/ki-fuer-immobilienmakler",
    sourceFiles: ["app/ki-fuer-immobilienmakler/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.78,
  },
  {
    path: "/immobilienanfragen-automatisieren",
    sourceFiles: ["app/immobilienanfragen-automatisieren/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.78,
  },
  {
    path: "/antwortzeit-immobilienanfragen",
    sourceFiles: ["app/antwortzeit-immobilienanfragen/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.76,
  },
  {
    path: "/email-automatisierung-immobilienmakler",
    sourceFiles: ["app/email-automatisierung-immobilienmakler/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.76,
  },
  {
    path: "/autopilot",
    sourceFiles: ["app/autopilot/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.76,
  },
  {
    path: "/autopilot-regeln",
    sourceFiles: ["app/autopilot-regeln/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.76,
  },
  {
    path: "/qualitaetschecks",
    sourceFiles: ["app/qualitaetschecks/page.tsx", "components/marketing/QualityChecks.tsx"],
    changeFrequency: "monthly",
    priority: 0.76,
  },
  {
    path: "/freigabe-inbox",
    sourceFiles: ["app/freigabe-inbox/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.76,
  },
  {
    path: "/follow-up-logik",
    sourceFiles: ["app/follow-up-logik/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.74,
  },
  {
    path: "/follow-up-emails-immobilienmakler",
    sourceFiles: ["app/follow-up-emails-immobilienmakler/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.74,
  },
  {
    path: "/trust",
    sourceFiles: ["app/trust/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.72,
  },
  {
    path: "/roi-rechner",
    sourceFiles: ["app/roi-rechner/page.tsx", "components/marketing/ROICalculator.tsx"],
    changeFrequency: "monthly",
    priority: 0.72,
  },
  {
    path: "/produkt/capabilities",
    sourceFiles: ["app/produkt/capabilities/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.72,
  },
  {
    path: "/advaic-vs-crm-tools",
    sourceFiles: ["app/advaic-vs-crm-tools/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.72,
  },
  {
    path: "/makler-freigabe-workflow",
    sourceFiles: ["app/makler-freigabe-workflow/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.72,
  },
  {
    path: "/dsgvo-email-autopilot",
    sourceFiles: ["app/dsgvo-email-autopilot/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/use-cases",
    sourceFiles: ["app/use-cases/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/use-cases/vermietung",
    sourceFiles: ["app/use-cases/vermietung/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.68,
  },
  {
    path: "/use-cases/kleines-team",
    sourceFiles: ["app/use-cases/kleines-team/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.68,
  },
  {
    path: "/use-cases/mittelpreisige-objekte",
    sourceFiles: ["app/use-cases/mittelpreisige-objekte/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.68,
  },
  {
    path: "/branchen",
    sourceFiles: ["app/branchen/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.68,
  },
  {
    path: "/branchen/vermietung-ballungsraum",
    sourceFiles: ["app/branchen/vermietung-ballungsraum/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.66,
  },
  {
    path: "/branchen/kleine-maklerbueros",
    sourceFiles: ["app/branchen/kleine-maklerbueros/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.66,
  },
  {
    path: "/branchen/neubau-vertrieb",
    sourceFiles: ["app/branchen/neubau-vertrieb/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.66,
  },
  {
    path: "/einwaende",
    sourceFiles: ["app/einwaende/page.tsx", "components/marketing/ObjectionHandling.tsx"],
    changeFrequency: "monthly",
    priority: 0.66,
  },
  {
    path: "/einwaende/dsgvo",
    sourceFiles: ["app/einwaende/dsgvo/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.64,
  },
  {
    path: "/einwaende/kontrolle",
    sourceFiles: ["app/einwaende/kontrolle/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.64,
  },
  {
    path: "/einwaende/qualitaet",
    sourceFiles: ["app/einwaende/qualitaet/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.64,
  },
  {
    path: "/einwaende/aufwand",
    sourceFiles: ["app/einwaende/aufwand/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.64,
  },
  {
    path: "/einwaende/kosten",
    sourceFiles: ["app/einwaende/kosten/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.64,
  },
  {
    path: "/integrationen",
    sourceFiles: ["app/integrationen/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.62,
  },
  {
    path: "/integrationen/gmail",
    sourceFiles: ["app/integrationen/gmail/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.62,
  },
  {
    path: "/integrationen/outlook",
    sourceFiles: ["app/integrationen/outlook/page.tsx"],
    changeFrequency: "monthly",
    priority: 0.62,
  },
  {
    path: "/impressum",
    sourceFiles: ["app/impressum/page.tsx"],
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    path: "/datenschutz",
    sourceFiles: ["app/datenschutz/page.tsx"],
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    path: "/nutzungsbedingungen",
    sourceFiles: ["app/nutzungsbedingungen/page.tsx"],
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    path: "/cookie-und-storage",
    sourceFiles: ["app/cookie-und-storage/page.tsx"],
    changeFrequency: "yearly",
    priority: 0.15,
  },
  {
    path: "/unterauftragsverarbeiter",
    sourceFiles: ["app/unterauftragsverarbeiter/page.tsx"],
    changeFrequency: "yearly",
    priority: 0.15,
  },
  {
    path: "/llms.txt",
    sourceFiles: ["app/llms.txt/route.ts"],
    changeFrequency: "monthly",
    priority: 0.1,
  },
];

function resolveLastModified(sourceFiles: string[]) {
  let latestTimestamp = DEFAULT_LAST_MODIFIED.getTime();

  for (const sourceFile of sourceFiles) {
    const absolutePath = path.join(process.cwd(), sourceFile);
    if (!existsSync(absolutePath)) continue;

    const fileTimestamp = statSync(absolutePath).mtime.getTime();
    if (fileTimestamp > latestTimestamp) {
      latestTimestamp = fileTimestamp;
    }
  }

  return new Date(latestTimestamp);
}

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path: routePath, sourceFiles, changeFrequency, priority }) => ({
    url: `${BASE}${routePath}`,
    lastModified: resolveLastModified(sourceFiles),
    ...(changeFrequency ? { changeFrequency } : {}),
    ...(typeof priority === "number" ? { priority } : {}),
  }));
}
