"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Ensure a SINGLE browser client instance (prevents multiple GoTrue clients in dev)
function getSupabaseBrowserClient() {
  const g = globalThis as unknown as {
    __advaic_supabase?: ReturnType<typeof createBrowserClient<Database>>;
  };

  if (!g.__advaic_supabase) {
    g.__advaic_supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return g.__advaic_supabase;
}

export default function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
}) {
  const supabaseClient = getSupabaseBrowserClient();

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={initialSession ?? null}
    >
      {children}
    </SessionContextProvider>
  );
}
