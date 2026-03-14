"use client";

import { type ReactNode, useCallback } from "react";
import Link from "next/link";
import { trackPublicEvent } from "@/lib/funnel/public-track";

type TrackedLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  event: string;
  source?: string;
  pageGroup?: string;
  ctaVariant?: string;
  section?: string;
  meta?: Record<string, unknown>;
  "data-tour"?: string;
};

export default function TrackedLink({
  href,
  className,
  children,
  event,
  source = "marketing",
  pageGroup,
  ctaVariant,
  section,
  meta,
  "data-tour": dataTour,
}: TrackedLinkProps) {
  const onClick = useCallback(() => {
    void trackPublicEvent({
      event,
      source,
      pageGroup,
      ctaVariant,
      meta: {
        destination: href,
        ...(section ? { section } : {}),
        ...(meta || {}),
      },
    });
  }, [ctaVariant, event, href, meta, pageGroup, section, source]);

  return (
    <Link href={href} className={className} onClick={onClick} data-tour={dataTour}>
      {children}
    </Link>
  );
}
