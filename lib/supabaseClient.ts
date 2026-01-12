"use client";

// lib/supabaseClient.ts
// Singleton Supabase client for Client Components.
// NOTE: In most components you should prefer `useSupabaseClient<Database>()`
// from `@supabase/auth-helpers-react` (provided by your SupabaseProvider).
// This file exists for legacy/utility usage (e.g. ZurFreigabe UI).

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

function getSupabaseBrowserClient() {
  const g = globalThis as unknown as {
    __advaic_supabase?: ReturnType<typeof createClientComponentClient<Database>>;
  };

  if (!g.__advaic_supabase) {
    g.__advaic_supabase = createClientComponentClient<Database>();
  }

  return g.__advaic_supabase;
}

export const supabase = getSupabaseBrowserClient();
