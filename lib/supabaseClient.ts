"use client";

// lib/supabaseClient.ts
// IMPORTANT: Do not create a second Supabase/GoTrue client here.
// Re-use the same global singleton client used by `app/supabase-provider.tsx`.

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

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
