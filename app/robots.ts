import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/demo/tagesgeschaeft",
          "/demo/auto-vs-freigabe",
          "/demo/qualitaetschecks-followups",
        ],
        disallow: [
          "/app/",
          "/demo/",
          "/login",
          "/signup",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
