import Link from "next/link";
import { type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  points: string[];
};

export default function AuthShell({ title, subtitle, children, points }: AuthShellProps) {
  return (
    <main className="marketing-page-bg min-h-screen bg-[var(--bg)] px-6 py-10 md:px-8 md:py-14">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between">
        <Link href="/" className="focus-ring text-3xl font-bold leading-none tracking-[-0.03em]">
          Adv<span className="text-[var(--gold)]">aic</span>
        </Link>
        <div className="text-sm text-[var(--muted)]">
          <Link href="/produkt" className="focus-ring link-subtle">
            Produkt
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-[1120px] grid-cols-12 gap-8 md:gap-12 lg:mt-12">
        <section className="col-span-12 rounded-[var(--radius)] bg-white p-7 ring-1 ring-[var(--border)] shadow-[var(--shadow-sm)] lg:col-span-5 md:p-8">
          <p className="label">Sicherer Zugang</p>
          <h1 className="h2 mt-3">{title}</h1>
          <p className="body mt-4 text-[var(--muted)]">{subtitle}</p>

          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="col-span-12 rounded-[var(--radius)] bg-white p-7 ring-1 ring-[var(--border)] shadow-[var(--shadow-md)] lg:col-span-7 md:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
