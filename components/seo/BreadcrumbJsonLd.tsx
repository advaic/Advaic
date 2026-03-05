import { getSiteUrl } from "@/lib/seo/site-url";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type BreadcrumbJsonLdProps = {
  items: BreadcrumbItem[];
};

function toAbsoluteUrl(siteUrl: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path === "/") return siteUrl;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const siteUrl = getSiteUrl();
  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: toAbsoluteUrl(siteUrl, item.path),
  }));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
