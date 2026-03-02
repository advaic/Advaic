import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/app/",
          "/demo/",
          "/login",
          "/signup",
          "/api/",
        ],
      },
    ],
    sitemap: "https://advaic.com/sitemap.xml",
    host: "https://advaic.com",
  };
}
