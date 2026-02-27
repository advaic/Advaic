import Link from "next/link";

const PAGES = [
  { href: "/demo/hero", label: "Hero (7.5s)", note: "Workflow komplett: Eingang bis Versand" },
  { href: "/demo/inbox", label: "Inbox (6.0s)", note: "Interessent vs. Systemmail" },
  { href: "/demo/rules", label: "Rules (6.5s)", note: "Auto / Freigabe / Ignorieren" },
  { href: "/demo/checks", label: "Checks (6.2s)", note: "Qualitätschecks vor Versand" },
  { href: "/demo/approve", label: "Approve (6.5s)", note: "Freigabe als Sicherheitsnetz" },
  { href: "/demo/product-hero", label: "Product Hero (7.5s)", note: "Hero-Loop für Produktseite" },
  { href: "/demo/tour/1-inbox", label: "Tour 1: Inbox", note: "Schritt 1/4 Eingang" },
  { href: "/demo/tour/2-rules", label: "Tour 2: Rules", note: "Schritt 2/4 Entscheidung" },
  { href: "/demo/tour/3-checks", label: "Tour 3: Checks", note: "Schritt 3/4 Fail-Safe" },
  { href: "/demo/tour/4-log", label: "Tour 4: Log", note: "Schritt 4/4 Verlauf" },
];

export default function DemoHubPage() {
  return (
    <main className="mx-auto max-w-[1120px] space-y-8 px-6 py-14 md:px-8">
      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Marketing Demo Suite</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--text)]">Demo Hub</h1>
        <p className="mt-3 max-w-[72ch] text-sm text-[var(--muted)]">
          Alle Szenen sind record-ready. Für saubere Export-Loops nutze die Clean-Variante mit Autoplay und Loop.
        </p>
      </section>

      <section className="grid gap-4">
        {PAGES.map((page) => (
          <article
            key={page.href}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text)]">{page.label}</h2>
                <p className="text-sm text-[var(--muted)]">{page.note}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`${page.href}?clean=1`} className="btn-secondary">
                  Open (clean)
                </Link>
                <Link href={`${page.href}?clean=1&autoplay=1&loop=1`} className="btn-primary">
                  Open (autoplay+loop)
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text)]">Record Tips</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[var(--text)]">
          <li>macOS: `Shift + Cmd + 5` und „Record Selected Portion“ wählen.</li>
          <li>Format 16:9 aufnehmen, empfohlen: 1920×1080 oder 1280×720.</li>
          <li>URL mit `?clean=1&autoplay=1&loop=1` verwenden.</li>
          <li>Optional `&duration=6500` oder `&scale=0.95` für Feintuning nutzen.</li>
        </ol>
      </section>
    </main>
  );
}
