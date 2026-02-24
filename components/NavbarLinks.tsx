"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavbarLinksProps = {
  direction?: "horizontal" | "vertical";
  onLinkClick?: () => void;
};

const NavbarLinks = ({
  direction = "horizontal",
  onLinkClick,
}: NavbarLinksProps) => {
  const pathname = usePathname();

  const links = [
    { name: "Produkt", href: "/produkt", id: "produkt" },
    { name: "Preise", href: "/preise", id: "preise" },
    { name: "FAQ", href: "/faq", id: "faq" },
    { name: "Kontakt", href: "/#kontakt", id: "kontakt" },
  ];

  function isActive(link: (typeof links)[number]) {
    if (link.id === "kontakt") return pathname === "/";
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  }

  const linkClasses = `
    relative transition-colors duration-200 hover:text-black
    before:content-[''] before:absolute before:-bottom-1 before:left-0 
    before:h-[2px] before:bg-[var(--gold)] before:transition-all before:duration-300
    before:w-0 hover:before:w-full
  `;

  return (
    <div className="flex items-center">
      <nav
        className={`flex ${
          direction === "vertical"
            ? "flex-col items-start gap-6"
            : "flex-row justify-center gap-12"
        } text-[16px] font-medium text-slate-800`}
      >
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            onClick={onLinkClick}
            aria-current={isActive(link) ? "page" : undefined}
            className={`rounded-md px-0.5 py-0.5 ${linkClasses} ${
              isActive(link) ? "before:w-full text-black" : ""
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default NavbarLinks;
