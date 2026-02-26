import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import DemoUiStudio from "./DemoUiStudio";

const DEMO_ALLOWED_AGENT_ID = "3582c768-0edd-4536-9501-268b881599df";

export default async function DemoUiPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (String(user.id) !== DEMO_ALLOWED_AGENT_ID) {
    notFound();
  }
  const params = searchParams ? await searchParams : {};
  const cleanMode = String(params.clean || "") === "1";

  return (
    <main className="space-y-4">
      {!cleanMode ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Private Demo UI
              </p>
              <h1 className="mt-1 text-xl font-semibold text-[var(--text)]">
                Marketing-Recording Studio (nur intern)
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Diese Seite ist nur für die Produktion von Website-Screenshots und Video-Loops.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/app/demo-ui?clean=1" className="btn-secondary">
                Clean-Modus
              </Link>
              <Link href="/produkt" className="btn-secondary">
                Zur Produktseite
              </Link>
              <Link href="/app/startseite" className="btn-secondary">
                Zur Startseite
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <DemoUiStudio />
    </main>
  );
}
