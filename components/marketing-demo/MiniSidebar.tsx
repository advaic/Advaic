import { BellRing, Inbox, ShieldCheck } from "lucide-react";

type MiniSidebarProps = {
  active?: "Nachrichten" | "Zur Freigabe" | "Follow-ups";
};

const NAV = [
  { key: "Nachrichten", icon: Inbox },
  { key: "Zur Freigabe", icon: ShieldCheck },
  { key: "Follow-ups", icon: BellRing },
] as const;

export default function MiniSidebar({ active = "Nachrichten" }: MiniSidebarProps) {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-2)] px-4 py-5">
      <div className="mb-5 rounded-xl border border-[var(--border)] bg-white px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Advaic</p>
        <p className="mt-1 text-sm font-semibold text-[var(--text)]">Demo-Ansicht</p>
      </div>

      <nav className="space-y-2">
        {NAV.map(({ key, icon: Icon }) => {
          const isActive = key === active;
          return (
            <div
              key={key}
              className={[
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm",
                isActive
                  ? "border-[rgba(201,162,39,0.5)] bg-[rgba(201,162,39,0.1)] text-[var(--text)]"
                  : "border-transparent text-[var(--muted)]",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium">{key}</span>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-[var(--border)] bg-white p-3 text-xs text-[var(--muted)]">
        Guardrails aktiv
      </div>
    </aside>
  );
}
