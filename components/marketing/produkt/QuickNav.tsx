import Container from "@/components/marketing/Container";

const links = [
  { href: "#ablauf", label: "Ablauf" },
  { href: "#regeln", label: "Regeln" },
  { href: "#simulator", label: "Simulator" },
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            Direkt zu den wichtigsten Abschnitten
          </p>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex min-w-max gap-2 md:min-w-0 md:flex-wrap">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="focus-ring shrink-0 whitespace-nowrap rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] ring-1 ring-[var(--border)] transition hover:-translate-y-[1px] hover:ring-[rgba(11,15,23,.18)]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
