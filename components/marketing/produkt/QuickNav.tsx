import Container from "@/components/marketing/Container";

const links = [
  { href: "#ablauf", label: "Ablauf" },
  { href: "#regeln", label: "Regeln" },
  { href: "#qualitaet", label: "Qualität" },
  { href: "#freigabe", label: "Freigabe" },
  { href: "#followups", label: "Follow-ups" },
  { href: "#sicherheit", label: "Sicherheit" },
  { href: "#faq", label: "FAQ" },
];

export default function QuickNav() {
  return (
    <section aria-label="Schnellnavigation" className="py-6 md:py-8">
      <Container>
        <div className="rounded-[var(--radius)] bg-white/95 p-3 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] backdrop-blur">
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="focus-ring rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--border)] transition hover:-translate-y-[1px] hover:ring-[rgba(11,15,23,.18)]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
