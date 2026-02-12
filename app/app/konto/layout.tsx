// app/konto/layout.tsx
"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const kontoLinks = [
  { href: "/app/konto", label: "Übersicht" },
  { href: "/app/konto/persoenliche-daten", label: "Persönliche Daten" },
  { href: "/app/konto/sicherheit", label: "Passwort & Sicherheit" },
  { href: "/app/konto/verknuepfungen", label: "Verknüpfte Dienste" },
  { href: "/app/konto/abo", label: "Abo & Zahlungen" },
  { href: "/app/konto/darstellung", label: "Sprache & Darstellung" },
  { href: "/app/konto/loeschen", label: "Konto löschen" },
];

export default function KontoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div data-tour="account-layout" className="flex flex-col md:flex-row gap-6 p-6">
      <aside data-tour="account-sidebar" className="w-full md:w-60 border rounded-lg p-4 bg-muted">
        <h2 data-tour="account-sidebar-title" className="text-sm font-semibold mb-4 text-muted-foreground">
          Konto
        </h2>
        <nav data-tour="account-sidebar-nav" className="space-y-1">
          {kontoLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              data-tour={`account-link-${label.toLowerCase().replace(/[^a-z]/g, "")}`}
              className={cn(
                "block text-sm rounded px-3 py-2 hover:bg-accent hover:text-accent-foreground transition",
                pathname === href
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="flex-1 w-full">{children}</section>
    </div>
  );
}
