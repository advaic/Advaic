"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

type MarketingJumpLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export default function MarketingJumpLink({
  href = "#",
  onClick,
  ...props
}: MarketingJumpLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || !href.startsWith("#")) return;

    const target = document.getElementById(href.slice(1));
    if (!target) return;

    event.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 96;
    window.history.replaceState(null, "", href);
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  }

  return <a href={href} onClick={handleClick} {...props} />;
}
