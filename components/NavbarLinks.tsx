"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdvaicLogo from "../public/Advaic_Logo.webp";

type NavbarLinksProps = {
  direction?: "horizontal" | "vertical"; // optional prop with default
  onLinkClick?: () => void; // optional function prop for mobile menu close
};

const NavbarLinks = ({
  direction = "horizontal",
  onLinkClick,
}: NavbarLinksProps) => {
  const [activeSection, setActiveSection] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["produkt", "preise", "faq", "kontakt"];
      for (let id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= 100 && top >= -200) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { name: "Produkt", href: "produkt", id: "produkt" },
    { name: "Preise", href: "preise", id: "preise" },
    { name: "FAQ", href: "faq", id: "faq" },
    { name: "Kontakt", href: "#kontakt", id: "kontakt" },
  ];

  const linkClasses = `
    relative transition-colors duration-200 hover:text-black
    before:content-[''] before:absolute before:-bottom-1 before:left-0 
    before:h-[1.5px] before:bg-black before:transition-all before:duration-300
    before:w-0 hover:before:w-full
  `;

  return (
    <div className="flex items-center gap-12">
      {/* Navigation links */}
      <nav
        className={`flex ${
          direction === "vertical"
            ? "flex-col gap-6 items-start"
            : "flex-row gap-20 justify-center"
        } text-[17px] font-medium text-neutral-800`}
      >
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            onClick={onLinkClick}
            className={`${linkClasses} ${
              activeSection === link.id ? "before:w-full text-black" : ""
            }`}
          >
            {link.name}
          </a>
        ))}
      </nav>
    </div>
  );
};

export default NavbarLinks;
