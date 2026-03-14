import type { Metadata } from "next";

export type MarketingOgTemplate =
  | "brand"
  | "home"
  | "integration"
  | "product"
  | "pricing"
  | "trust"
  | "compare"
  | "guide"
  | "usecase";

export const DEFAULT_MARKETING_SHARE_IMAGE_ALT = "Advaic Vorschaubild";

type BuildOgImageUrlOptions = {
  title: string;
  template?: MarketingOgTemplate;
  eyebrow?: string;
  proof?: string;
};

type BuildMarketingMetadataOptions = {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  template?: MarketingOgTemplate;
  eyebrow?: string;
  proof?: string;
  image?: string;
  imageAlt?: string;
};

export function buildOgImageUrl({
  title,
  template = "brand",
  eyebrow = "Advaic",
  proof = "Guardrails, Freigabe und Qualitätschecks vor dem Versand.",
}: BuildOgImageUrlOptions): string {
  const params = new URLSearchParams({
    template,
    eyebrow,
    title,
    proof,
  });

  return `/api/og?${params.toString()}`;
}

export function buildMarketingMetadata({
  title,
  description,
  path,
  ogTitle,
  template = "brand",
  eyebrow = "Advaic",
  proof,
  image,
  imageAlt = DEFAULT_MARKETING_SHARE_IMAGE_ALT,
}: BuildMarketingMetadataOptions): Metadata {
  const socialTitle = ogTitle || title;
  const socialImage =
    image ||
    buildOgImageUrl({
      title: socialTitle,
      template,
      eyebrow,
      proof,
    });

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "de_DE",
      title: socialTitle,
      description,
      url: path,
      siteName: "Advaic",
      images: [
        {
          url: socialImage,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage],
    },
  };
}
