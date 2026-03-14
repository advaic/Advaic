import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";

import { buildMarketingMetadata } from "@/lib/seo/marketing-metadata";
import { getVideoWatchPayload } from "@/lib/video/watch-pages";

export function readVideoTranscript(slug: string) {
  const filePath = path.join(process.cwd(), "public", "videos", "transcripts", `${slug}.txt`);
  if (!fs.existsSync(filePath)) return [];

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\n{2,}/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

export function buildVideoWatchMetadata(slug: string): Metadata {
  const page = getVideoWatchPayload(slug);
  if (!page) return {};

  return {
    ...buildMarketingMetadata({
      title: `${page.title} | Advaic`,
      ogTitle: page.title,
      description: page.description,
      path: `/demo/${page.slug}`,
      template: "guide",
      eyebrow: "Video-Demo",
      proof: page.description,
      image: `/videos/posters/${page.slug}.png`,
      imageAlt: page.title,
    }),
    robots: {
      index: true,
      follow: true,
    },
  };
}
