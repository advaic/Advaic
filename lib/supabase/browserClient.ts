"use client";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

// IMPORTANT:
// This must NOT create a second GoTrueClient instance.
// We re-use the same global singleton as `app/supabase-provider.tsx`.
function getSupabaseBrowserClient() {
  const g = globalThis as unknown as {
    __advaic_supabase?: ReturnType<typeof createPagesBrowserClient<Database>>;
  };

  if (!g.__advaic_supabase) {
    g.__advaic_supabase = createPagesBrowserClient<Database>();
  }

  return g.__advaic_supabase;
}

export const supabase = getSupabaseBrowserClient();
